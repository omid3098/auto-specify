import { randomUUID } from "node:crypto";

export type RunState = "running" | "blocked-on-user" | "failed" | "cancelled" | "complete";
export type StepName = "specify" | "clarify" | "plan" | "tasks" | "implement";
export type StepStatus = "pending" | "running" | "complete" | "skipped" | "failed" | "cancelled";

export const STEPS: StepName[] = ["specify", "clarify", "plan", "tasks", "implement"];

export type PausePayload = {
	step: StepName;
	questions: string[];
	answers: string[];
	index: number;
	hint: string;
};

export type StepRecord = {
	name: StepName;
	status: StepStatus;
	startedAt: number | null;
	endedAt: number | null;
};

export type PipelineRun = {
	id: string;
	featureDescription: string;
	featureDir: string | null;
	state: RunState;
	steps: StepRecord[];
	currentStep: StepName | null;
	pause: PausePayload | null;
	error: string | null;
	child: AbortController | null;
};

export function isActive(run: PipelineRun | null | undefined): boolean {
	return run?.state === "running" || run?.state === "blocked-on-user";
}

export function tryStart(
	current: PipelineRun | null | undefined,
	description: string,
): { ok: true; run: PipelineRun } | { ok: false; reason: string } {
	if (isActive(current)) return { ok: false, reason: "already active" };
	return { ok: true, run: createRun(description) };
}

export function createRun(description: string): PipelineRun {
	return {
		id: randomUUID(),
		featureDescription: description,
		featureDir: null,
		state: "running",
		steps: STEPS.map((name) => ({ name, status: "pending", startedAt: null, endedAt: null })),
		currentStep: null,
		pause: null,
		error: null,
		child: null,
	};
}

function rec(run: PipelineRun, name: StepName): StepRecord {
	return run.steps.find((s) => s.name === name)!;
}

export function startStep(run: PipelineRun, name: StepName, now = Date.now()): void {
	const s = rec(run, name);
	s.status = "running";
	s.startedAt = now;
	s.endedAt = null;
	run.currentStep = name;
	run.state = "running";
	run.pause = null;
	run.error = null;
}

export function completeStep(run: PipelineRun, name: StepName, now = Date.now(), skipped = false): void {
	const s = rec(run, name);
	s.status = skipped ? "skipped" : "complete";
	s.endedAt = now;
}

export function failRun(run: PipelineRun, error: string, now = Date.now()): void {
	run.child?.abort();
	run.child = null;
	run.state = "failed";
	run.error = error;
	run.pause = null;
	if (run.currentStep) {
		const s = rec(run, run.currentStep);
		if (s.status === "running") {
			s.status = "failed";
			s.endedAt = now;
		}
	}
}

export function cancelRun(run: PipelineRun, now = Date.now()): void {
	run.child?.abort();
	run.child = null;
	run.state = "cancelled";
	run.pause = null;
	if (run.currentStep) {
		const s = rec(run, run.currentStep);
		if (s.status === "running" || s.status === "pending") {
			s.status = "cancelled";
			s.endedAt = s.endedAt ?? now;
		}
	}
}

export function pauseRun(run: PipelineRun, questions: string[]): void {
	run.child?.abort();
	run.child = null;
	run.state = "blocked-on-user";
	run.pause = {
		step: run.currentStep!,
		questions,
		answers: [],
		index: 0,
		hint: "/speckit-answer",
	};
}

/** Record one answer for the current question. done=true once every question is answered. */
export function answerPause(run: PipelineRun, text: string): { done: boolean } {
	const p = run.pause;
	if (!p || p.index >= p.questions.length) return { done: true };
	p.answers.push(text.trim());
	p.index += 1;
	return { done: p.index >= p.questions.length };
}

/** Q/A blob handed to the resume worker once all questions are answered. */
export function answerBlob(p: PausePayload): string {
	return p.questions.map((q, i) => `Q: ${q}\nA: ${p.answers[i] ?? ""}`).join("\n\n");
}

export function completeRun(run: PipelineRun): void {
	run.child = null;
	run.state = "complete";
	run.currentStep = null;
	run.pause = null;
	run.error = null;
}

export function nextPending(run: PipelineRun): StepName | null {
	return run.steps.find((s) => s.status === "pending")?.name ?? null;
}

export function currentRunning(run: PipelineRun): StepName | null {
	if (!run.currentStep) return null;
	return rec(run, run.currentStep).status === "running" ? run.currentStep : null;
}

function short(s: string | null): string {
	const t = (s || "").replace(/\s+/g, " ").trim();
	return t.length > 60 ? `${t.slice(0, 57)}...` : t;
}

export function progressSnapshot(run: PipelineRun): string {
	if (run.state === "blocked-on-user") {
		return `speckit: paused (${run.pause?.step ?? run.currentStep}) — /speckit-answer`;
	}
	if (run.state === "failed") {
		return `speckit: failed at ${run.currentStep ?? "?"} — ${short(run.error)}`;
	}
	if (run.state === "cancelled") return "speckit: cancelled";
	if (run.state === "complete") return "speckit: complete";
	return `speckit: ${run.steps
		.map((s) => {
			if (s.status === "complete" || s.status === "skipped") return `${s.name} ✓`;
			if (s.status === "running") return `${s.name} …`;
			if (s.status === "failed") return `${s.name} ✗`;
			return s.name;
		})
		.join(" · ")}`;
}
