import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const WORKER_FLAGS = ["--mode", "json", "-p", "--no-session", "--no-extensions"] as const;

export type WorkerResult = {
	exitCode: number;
	lastAssistantText: string;
	stopReason?: string;
	errorMessage?: string;
	stderr: string;
};

export function piInvocation(args: string[]): { command: string; args: string[] } {
	const currentScript = process.argv[1];
	const isBunVirtual = currentScript?.startsWith("/$bunfs/root/");
	if (currentScript && !isBunVirtual && fs.existsSync(currentScript)) {
		return { command: process.execPath, args: [currentScript, ...args] };
	}
	const execName = path.basename(process.execPath).toLowerCase();
	if (!/^(node|bun)(\.exe)?$/.test(execName)) {
		return { command: process.execPath, args };
	}
	return { command: "pi", args };
}

function assistantText(msg: { role?: string; content?: { type?: string; text?: string }[] }): string {
	if (msg?.role !== "assistant" || !Array.isArray(msg.content)) return "";
	return msg.content
		.filter((p) => p?.type === "text" && p.text)
		.map((p) => p.text as string)
		.join("");
}

export async function spawnWorker(opts: {
	cwd: string;
	prompt: string;
	model?: string;
	signal: AbortSignal;
	onStart?: (info: { pid: number | undefined; promptBytes: number }) => void;
}): Promise<WorkerResult> {
	// ponytail: prompt via --append-system-prompt; Windows CreateProcess argv cap
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "speckit-worker-"));
	const file = path.join(dir, "prompt.md");
	fs.writeFileSync(file, opts.prompt);
	const args: string[] = [...WORKER_FLAGS];
	if (opts.model) args.push("--model", opts.model);
	args.push("--append-system-prompt", file, "Follow the worker instructions. Produce the skill artifacts.");

	const result: WorkerResult = { exitCode: 0, lastAssistantText: "", stderr: "" };

	try {
		await new Promise<void>((resolve) => {
			const inv = piInvocation(args);
			const proc = spawn(inv.command, inv.args, {
				cwd: opts.cwd,
				shell: false,
				stdio: ["ignore", "pipe", "pipe"],
			});
			opts.onStart?.({ pid: proc.pid, promptBytes: Buffer.byteLength(opts.prompt) });

			let buffer = "";
			let done = false;

			const onAbort = () => {
				try {
					proc.kill("SIGTERM");
				} catch {
					/* ignore */
				}
				const t = setTimeout(() => {
					try {
						proc.kill("SIGKILL");
					} catch {
						/* ignore */
					}
				}, 5000);
				t.unref?.();
			};

			const finish = (code: number) => {
				if (done) return;
				done = true;
				opts.signal.removeEventListener("abort", onAbort);
				result.exitCode = code;
				resolve();
			};

			const processLine = (line: string) => {
				if (!line.trim()) return;
				let event: {
					type?: string;
					message?: {
						role?: string;
						stopReason?: string;
						errorMessage?: string;
						content?: { type?: string; text?: string }[];
					};
				};
				try {
					event = JSON.parse(line);
				} catch {
					return;
				}
				if (event.type !== "message_end" || !event.message) return;
				const msg = event.message;
				if (msg.role !== "assistant") return;
				result.lastAssistantText = assistantText(msg);
				if (msg.stopReason) result.stopReason = msg.stopReason;
				if (msg.errorMessage) result.errorMessage = msg.errorMessage;
			};

			proc.stdout?.on("data", (data: Buffer | string) => {
				buffer += data.toString();
				const lines = buffer.split("\n");
				buffer = lines.pop() || "";
				for (const line of lines) processLine(line);
			});
			proc.stderr?.on("data", (data: Buffer | string) => {
				result.stderr += data.toString();
			});
			proc.on("close", (code) => finish(code ?? 0));
			proc.on("error", (err) => {
				result.stderr += err.message;
				finish(1);
			});

			if (opts.signal.aborted) onAbort();
			else opts.signal.addEventListener("abort", onAbort, { once: true });
		});
		return result;
	} finally {
		fs.rmSync(dir, { recursive: true, force: true });
	}
}
