import fs from "node:fs";
import path from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { checkGate, parsePause, readFeatureDir } from "./gates.ts";
import {
	answerBlob,
	answerPause,
	cancelRun,
	completeRun,
	completeStep,
	createRun,
	currentRunning,
	failRun,
	isActive,
	nextPending,
	pauseRun,
	progressSnapshot,
	startStep,
	type PipelineRun,
	type StepName,
} from "./run.ts";
import { spawnWorker } from "./spawn.ts";

const SKILL: Record<StepName, string> = {
	specify: "speckit-specify",
	clarify: "speckit-clarify",
	plan: "speckit-plan",
	tasks: "speckit-tasks",
	implement: "speckit-implement",
};

const RIDER = `You are a worker. Do not wait for a human unless the pause protocol applies.
Do not start sibling Spec Kit steps.
Success = this skill's artifacts on disk, not a claim in chat.

If this skill would present questions and wait, emit ALL of them (max 5) in ONE pause block as your last assistant text, then stop. Do not ask one-at-a-time. Do not call tools after it. Exit 0.
Each question string MUST be the complete question exactly as the skill specifies it, with the JSON escape \\n for line breaks: the interrogative, the "Why it matters" sentence, the Recommended option and reasoning, and the option table or short-answer line. Do not flatten options inline.

---speckit-pause---
{"questions":["question 1","question 2"]}
---end-speckit-pause---

If nothing to ask, finish the skill as usual (no pause block).`;

const RESUME =
	"You are a worker. Apply the operator answers below to the active feature spec from .specify/feature.json.\n" +
	"Write the updated spec.md (and checklist markers if that file exists). Do not re-scan for new questions. Do not emit a pause block. Do not start sibling Spec Kit steps. Then stop.";

function skillPath(cwd: string, step: StepName): string {
	return path.join(cwd, ".agents", "skills", SKILL[step], "SKILL.md");
}

export function buildPrompt(cwd: string, step: StepName, description: string, answers?: string): string {
	if (answers) return `${RESUME}\n\nOperator answers:\n${answers}`;
	const args =
		step === "specify" ? description : "Continue the active feature from `.specify/feature.json`";
	const p = skillPath(cwd, step);
	if (!fs.existsSync(p)) throw new Error(`missing skill ${p}`);
	return `${fs.readFileSync(p, "utf8").replaceAll("$ARGUMENTS", args)}\n\n${RIDER}`;
}

function say(pi: ExtensionAPI, content: string) {
	pi.sendMessage({ customType: "speckit", content, display: true });
}

/** Show only the current pause question (the worker emitted the whole queue at once). */
function ask(pi: ExtensionAPI, ctx: ExtensionContext, active: PipelineRun) {
	const p = active.pause;
	if (!p) return;
	const head = `speckit: paused (${p.step}) — question ${p.index + 1}/${p.questions.length}`;
	say(pi, `${head}\n\n${p.questions[p.index]}\n\nReply: /speckit-answer <your answer>`);
	ctx.ui.notify(head, "info");
}

export default function (pi: ExtensionAPI) {
	let run: PipelineRun | null = null;
	let tick: ReturnType<typeof setInterval> | null = null;

	const stopTick = () => {
		if (tick) clearInterval(tick);
		tick = null;
	};

	const paint = (ctx: ExtensionContext) => {
		if (!run) {
			stopTick();
			ctx.ui.setStatus("speckit", undefined);
			return;
		}
		let snap = progressSnapshot(run);
		const running = run.steps.find((s) => s.status === "running");
		if (running?.startedAt) snap += ` ${Math.floor((Date.now() - running.startedAt) / 1000)}s`;
		ctx.ui.setStatus("speckit", snap);
		if (run.state === "running" && !tick) tick = setInterval(() => paint(ctx), 1000);
		if (run.state !== "running") stopTick();
	};

	const fail = (ctx: ExtensionContext, active: PipelineRun, err: string) => {
		const step = active.currentStep ?? "?";
		failRun(active, err);
		paint(ctx);
		const msg = `speckit: failed at ${step} — ${err}`;
		say(pi, msg);
		ctx.ui.notify(msg, "error");
	};

	async function drive(ctx: ExtensionContext, answers?: string) {
		const active = run;
		if (!active) return;
		let resumeAnswers = answers;
		while (run === active && active.state === "running") {
			const step = currentRunning(active) ?? nextPending(active);
			if (!step) {
				completeRun(active);
				paint(ctx);
				say(pi, "speckit: complete");
				ctx.ui.notify("speckit: complete", "info");
				return;
			}
			if (!currentRunning(active)) startStep(active, step);
			paint(ctx);

			const ac = new AbortController();
			active.child = ac;
			const model = ctx.model ? `${ctx.model.provider}/${ctx.model.id}` : undefined;
			const usedAnswers = resumeAnswers;
			let prompt: string;
			try {
				prompt = buildPrompt(ctx.cwd, step, active.featureDescription, resumeAnswers);
			} catch (e) {
				fail(ctx, active, String(e));
				return;
			}
			let result;
			try {
				result = await spawnWorker({
					cwd: ctx.cwd,
					prompt,
					model,
					signal: ac.signal,
					onStart: ({ pid, promptBytes }) => {
						say(
							pi,
							`speckit: ${step} worker pid ${pid ?? "?"} · ${promptBytes} byte prompt · ${model ?? "default model"}`,
						);
					},
				});
			} catch (e) {
				if (run !== active || active.state === "cancelled") return;
				fail(ctx, active, String(e));
				return;
			}
			resumeAnswers = undefined;
			if (run !== active || active.state === "cancelled") return;
			active.child = null;

			if (result.exitCode !== 0 || result.stopReason === "error" || result.stopReason === "aborted") {
				fail(
					ctx,
					active,
					result.errorMessage || result.stderr.trim() || `exit ${result.exitCode}`,
				);
				return;
			}

			const pause = parsePause(result.lastAssistantText);
			if (pause && pause.ok === false) {
				fail(ctx, active, `invalid pause JSON: ${pause.error}`);
				return;
			}
			if (pause && pause.ok) {
				pauseRun(active, pause.questions);
				paint(ctx);
				ask(pi, ctx, active);
				return;
			}

			if (step === "specify") active.featureDir = readFeatureDir(ctx.cwd);
			const gate = checkGate(step, ctx.cwd, active.featureDir);
			if (!gate.ok) {
				fail(ctx, active, gate.error);
				return;
			}
			if (gate.featureDir) active.featureDir = gate.featureDir;
			completeStep(active, step, Date.now(), step === "clarify" && !usedAnswers);
			say(pi, `speckit: ${step} ${step === "clarify" && !usedAnswers ? "skipped" : "✓"}`);
			paint(ctx);
		}
	}

	pi.registerCommand("speckit-run", {
		description: "Run Specify → Clarify → Plan → Tasks → Implement",
		handler: async (args, ctx) => {
			const desc = args.trim();
			if (!desc) {
				ctx.ui.notify("Usage: /speckit-run <feature description>", "warning");
				return;
			}
			if (isActive(run)) {
				ctx.ui.notify("A speckit run is already active", "warning");
				return;
			}
			run = createRun(desc);
			paint(ctx);
			say(pi, `On it — handing off to Spec Kit: ${desc.slice(0, 120)}`);
			void drive(ctx).catch((e) => {
				if (run && run.state === "running") fail(ctx, run, String(e));
			});
		},
	});

	pi.registerCommand("speckit-cancel", {
		description: "Cancel the active speckit run",
		handler: async (_args, ctx) => {
			if (!isActive(run)) {
				ctx.ui.notify("Nothing to cancel", "info");
				return;
			}
			cancelRun(run);
			paint(ctx);
			say(pi, "speckit: cancelled");
			ctx.ui.notify("speckit: cancelled", "info");
		},
	});

	pi.registerCommand("speckit-answer", {
		description: "Answer paused speckit questions",
		handler: async (args, ctx) => {
			if (!run || run.state !== "blocked-on-user") {
				ctx.ui.notify("No paused speckit run", "warning");
				return;
			}
			const text = args.trim();
			if (!text) {
				ctx.ui.notify("Usage: /speckit-answer <answer> — still paused", "warning");
				return;
			}
			if (!answerPause(run, text).done) {
				paint(ctx);
				ask(pi, ctx, run);
				return;
			}
			const blob = answerBlob(run.pause!);
			run.pause = null;
			run.state = "running";
			paint(ctx);
			say(pi, "On it — resuming Spec Kit with your answers");
			void drive(ctx, blob).catch((e) => {
				if (run && run.state === "running") fail(ctx, run, String(e));
			});
		},
	});

	pi.on("session_shutdown", async (_event, ctx) => {
		stopTick();
		run?.child?.abort();
		run = null;
		ctx.ui.setStatus("speckit", undefined);
	});
}
