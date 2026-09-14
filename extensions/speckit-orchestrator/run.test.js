const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
	STEPS,
	answerBlob,
	answerPause,
	cancelRun,
	completeRun,
	completeStep,
	createRun,
	failRun,
	isActive,
	nextPending,
	pauseRun,
	progressSnapshot,
	startStep,
	tryStart,
} = require("./run.ts");
const { checkGate, parsePause, readFeatureDir } = require("./gates.ts");
const { WORKER_FLAGS } = require("./spawn.ts");
const { buildPrompt } = require("./index.ts");

describe("run machine", () => {
	it("start → complete happy path", () => {
		const r = createRun("feat");
		assert.equal(r.state, "running");
		assert.equal(isActive(r), true);
		for (const name of STEPS) {
			assert.equal(nextPending(r), name);
			startStep(r, name);
			completeStep(r, name, Date.now(), name === "clarify");
		}
		assert.equal(nextPending(r), null);
		completeRun(r);
		assert.equal(r.state, "complete");
		assert.equal(isActive(r), false);
		assert.equal(progressSnapshot(r), "speckit: complete");
		assert.equal(r.steps.find((s) => s.name === "clarify").status, "skipped");
	});

	it("refuses a second concurrent run", () => {
		const a = createRun("a");
		startStep(a, "specify");
		assert.equal(tryStart(a, "b").ok, false);
		failRun(a, "boom");
		const next = tryStart(a, "b");
		assert.equal(next.ok, true);
		assert.notEqual(next.run.id, a.id);
	});

	it("fail is terminal", () => {
		const r = createRun("a");
		startStep(r, "plan");
		failRun(r, "missing plan.md");
		assert.equal(r.state, "failed");
		assert.equal(isActive(r), false);
		assert.match(progressSnapshot(r), /failed at plan/);
		assert.equal(r.steps.find((s) => s.name === "plan").status, "failed");
		assert.equal(r.steps.find((s) => s.name === "tasks").status, "pending");
	});

	it("cancel from running and blocked-on-user", () => {
		const a = createRun("a");
		startStep(a, "specify");
		cancelRun(a);
		assert.equal(a.state, "cancelled");
		assert.equal(isActive(a), false);
		assert.equal(progressSnapshot(a), "speckit: cancelled");

		const b = createRun("b");
		startStep(b, "clarify");
		pauseRun(b, ["Q?"]);
		assert.equal(b.state, "blocked-on-user");
		assert.equal(progressSnapshot(b), "speckit: paused (clarify) — /speckit-answer");
		cancelRun(b);
		assert.equal(b.state, "cancelled");
		assert.equal(isActive(b), false);
	});

	it("pause answers are collected one question at a time", () => {
		const r = createRun("x");
		startStep(r, "clarify");
		pauseRun(r, ["Q1?", "Q2?"]);
		assert.equal(answerPause(r, "a1").done, false);
		assert.equal(r.pause.index, 1);
		assert.equal(answerPause(r, "a2").done, true);
		assert.equal(answerBlob(r.pause), "Q: Q1?\nA: a1\n\nQ: Q2?\nA: a2");

		const one = createRun("y");
		startStep(one, "clarify");
		pauseRun(one, ["only?"]);
		assert.equal(answerPause(one, "yes").done, true);
	});
});

describe("pause parse", () => {
	it("ok", () => {
		const t = `hello\n---speckit-pause---\n{"questions":["A?","B?"]}\n---end-speckit-pause---\n`;
		const p = parsePause(t);
		assert.equal(p.ok, true);
		assert.deepEqual(p.questions, ["A?", "B?"]);
	});

	it("invalid JSON is failure, not a pause", () => {
		const p = parsePause(`---speckit-pause---\n{nope}\n---end-speckit-pause---`);
		assert.equal(p.ok, false);
	});

	it("empty questions is failure", () => {
		const p = parsePause(`---speckit-pause---\n{"questions":[]}\n---end-speckit-pause---`);
		assert.equal(p.ok, false);
	});

	it("no fence is null", () => {
		assert.equal(parsePause("done"), null);
	});
});

describe("artifact gates", () => {
	it("specify / plan / tasks", () => {
		const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "speckit-gate-"));
		assert.equal(checkGate("specify", cwd, null).ok, false);
		assert.equal(readFeatureDir(cwd), null);

		const feat = path.join(cwd, "specs", "001-x");
		fs.mkdirSync(feat, { recursive: true });
		fs.mkdirSync(path.join(cwd, ".specify"));
		fs.writeFileSync(
			path.join(cwd, ".specify", "feature.json"),
			JSON.stringify({ feature_directory: "specs/001-x" }),
		);
		assert.equal(checkGate("specify", cwd, null).ok, false);

		fs.writeFileSync(path.join(feat, "spec.md"), "# spec");
		const spec = checkGate("specify", cwd, null);
		assert.equal(spec.ok, true);
		assert.equal(spec.featureDir, feat);

		assert.equal(checkGate("plan", cwd, feat).ok, false);
		fs.writeFileSync(path.join(feat, "plan.md"), "# plan");
		assert.equal(checkGate("plan", cwd, feat).ok, true);

		assert.equal(checkGate("tasks", cwd, feat).ok, false);
		fs.writeFileSync(path.join(feat, "tasks.md"), "# tasks");
		assert.equal(checkGate("tasks", cwd, feat).ok, true);

		assert.equal(checkGate("implement", cwd, feat).ok, true);
		assert.equal(checkGate("clarify", cwd, feat).ok, true);
	});
});

describe("spawn flags", () => {
	it("isolates the child", () => {
		assert.deepEqual([...WORKER_FLAGS], ["--mode", "json", "-p", "--no-session", "--no-extensions"]);
	});
});

describe("resume prompt", () => {
	it("does not re-send the skill", () => {
		const p = buildPrompt(".", "clarify", "feat", "B");
		assert.match(p, /Operator answers/);
		assert.doesNotMatch(p, /SKILL\.md|speckit-clarify|---speckit-pause---/);
		assert.ok(p.length < 800);
	});
});
