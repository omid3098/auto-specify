import fs from "node:fs";
import path from "node:path";
import type { StepName } from "./run.ts";

export const PAUSE_START = "---speckit-pause---";
export const PAUSE_END = "---end-speckit-pause---";

export type PauseParse =
	| { ok: true; questions: string[] }
	| { ok: false; error: string };

/** Last pause fence in text, or null if none. Invalid JSON → ok: false. */
export function parsePause(text: string): PauseParse | null {
	const start = text.lastIndexOf(PAUSE_START);
	if (start < 0) return null;
	const end = text.indexOf(PAUSE_END, start + PAUSE_START.length);
	if (end < 0) return { ok: false, error: "missing end fence" };
	const raw = text.slice(start + PAUSE_START.length, end).trim();
	try {
		const parsed = JSON.parse(raw) as { questions?: unknown };
		if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
			return { ok: false, error: "questions must be a non-empty array" };
		}
		if (!parsed.questions.every((q) => typeof q === "string")) {
			return { ok: false, error: "questions must be strings" };
		}
		return { ok: true, questions: parsed.questions };
	} catch {
		return { ok: false, error: "invalid JSON" };
	}
}

export function readFeatureDir(cwd: string): string | null {
	const p = path.join(cwd, ".specify", "feature.json");
	try {
		const j = JSON.parse(fs.readFileSync(p, "utf8")) as { feature_directory?: unknown };
		if (typeof j.feature_directory !== "string" || !j.feature_directory) return null;
		return path.isAbsolute(j.feature_directory) ? j.feature_directory : path.join(cwd, j.feature_directory);
	} catch {
		return null;
	}
}

export function checkGate(
	step: StepName,
	cwd: string,
	featureDir: string | null,
): { ok: true; featureDir?: string } | { ok: false; error: string } {
	if (step === "implement") return { ok: true };

	if (step === "specify") {
		const fd = readFeatureDir(cwd);
		if (!fd) return { ok: false, error: "missing .specify/feature.json" };
		if (!fs.existsSync(path.join(fd, "spec.md"))) return { ok: false, error: "missing spec.md" };
		return { ok: true, featureDir: fd };
	}

	if (!featureDir) return { ok: false, error: "no feature dir" };
	const file = step === "plan" ? "plan.md" : step === "tasks" ? "tasks.md" : "spec.md";
	if (!fs.existsSync(path.join(featureDir, file))) return { ok: false, error: `missing ${file}` };
	return { ok: true };
}
