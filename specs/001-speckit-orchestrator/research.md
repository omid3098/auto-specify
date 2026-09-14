# Research: Spec Kit Pipeline Orchestrator

## 1. Host: pi extension, not a second harness

**Decision**: Ship as a project-local pi extension under `.pi/extensions/speckit-orchestrator/` (TypeScript, jiti, no build). Register `/speckit-run`, `/speckit-cancel`, `/speckit-answer`.

**Rationale**: Constitution requires a pi extension. Pi auto-discovers `.pi/extensions/*/index.ts` after project trust. Commands bypass the agent, so the pipeline is not an LLM tool call that locks the main turn.

**Alternatives considered**:
- Global `~/.pi/agent/extensions`: worse for this repo; the feature is project Spec Kit automation.
- LLM tool `run_pipeline`: blocks the main agent until the tool returns; violates FR-011.
- Separate daemon/CLI: second product; rejected by constitution V.

## 2. Isolated workers: spawn `pi`, do not vendor the subagent example

**Decision**: Each Specify / Clarify / Plan / Tasks / Implement step is a child `pi --mode json -p --no-session --no-extensions` with a prompt that is the Spec Kit skill text plus that step's arguments and artifact paths. Parse JSONL `message_end` / exit code. Kill on cancel via AbortSignal.

**Rationale**: Pi core has no subagents. The official `examples/extensions/subagent` is a 1k-line tool (TUI render, agent markdown, parallel/chain). We only need sequential isolated runs. `--no-session` = empty transcript. `--no-extensions` prevents this orchestrator from loading inside the child (recursion). Skills still load from `.agents/skills`, so workers can follow Spec Kit contracts. `--mode json -p` is the documented integration mode.

**Alternatives considered**:
- Copy/install the subagent example and chain agents: extra UI, agent markdown files, and a generic tool the main LLM would have to call. Too much.
- In-process AgentSession SDK: shares process and is easy to leak parent context; spawn is the isolation the spec asks for.
- Ask the main LLM to `/skill:speckit-*` in order: not isolated, burns the parent transcript, blocks chat.

## 3. Orchestrator is extension code (state machine), not a chatty main agent

**Decision**: `/speckit-run <description>` starts an in-memory run and drives steps in the extension (async, not `waitForIdle` for the whole pipeline). The main TUI stays free. Progress via `ctx.ui.setStatus("speckit", ...)`.

**Rationale**: Always-on compact progress (clarification A) maps to `setStatus` (footer). `setWidget` is optional later. In-memory state matches FR-017 (session-only). `session_shutdown` aborts any child and drops the run.

**Alternatives considered**:
- `setWidget` progress bar: more TUI code; status line meets SC-003.
- Persist run via `pi.appendEntry`: would survive `/reload` and contradict “restart means the run is gone” unless we still discarded it; skip persistence entirely.

## 4. Pause / explicit answer = `/speckit-answer`

**Decision**: When Clarify (or any step) needs a human, the worker exits successfully with a `---speckit-pause---` JSON block in its last assistant text. Orchestrator sets state `blocked-on-user`, shows the questions in the transcript (`notify` + status), and waits. Only `/speckit-answer ...` resumes. Other input is unchanged (`input` handler returns `continue`).

**Rationale**: Extension commands run before the `input` event, so `/speckit-answer` is unambiguous (clarification: explicit answer only). No hijacking of normal chat.

**Alternatives considered**:
- Treat every paused message as an answer: rejected in clarify.
- `answer:` prefix in free text: easy to mistype; a command is the native pi pattern.
- Interactive `ctx.ui.custom()` questionnaire: blocks TUI focus; spec wants the main session still usable for other talk while paused.

## 5. Clarify in print mode

**Decision**: Clarify worker prompt adds a non-interactive rider: if the skill would ask the user, emit the pause block and stop without waiting; if no critical ambiguities, finish the skill as usual. Orchestrator does not reimplement clarify scoring.

**Rationale**: FR-004 forbids a homegrown clarify. Print mode cannot ask sequentially. The rider is a delivery adapter, not a new contract. Skip the pause when the worker completes with no pause block (FR-002 “Clarify only if human input is required”).

**Alternatives considered**:
- Skip clarify whenever spec.md has no `[NEEDS CLARIFICATION]`: cheaper but reimplements the skill’s taxonomy scan.
- Run full interactive clarify in the main session: blocks and dumps the skill into the parent transcript.

## 6. Completion gates

**Decision**: A step succeeds only if (a) child exit code 0, (b) stopReason is not error/aborted, (c) no pause block (except clarify, which may pause), (d) required artifacts exist:

| Step | Artifact gate |
|------|----------------|
| Specify | `.specify/feature.json` and `spec.md` at that feature dir |
| Clarify | `spec.md` still present; if paused, questions payload valid |
| Plan | `plan.md` in the feature dir |
| Tasks | `tasks.md` in the feature dir |
| Implement | worker success (tasks.md already exists); do not invent a second checklist |

**Rationale**: Constitution quality gate is artifact existence, not a worker’s “done” prose. Implement’s contract is executing `tasks.md`; extra file gates would be speculative.

## 7. Testing

**Decision**: `node --test` + `node:assert` on the state machine (transitions, pause parse, artifact-gate helpers, concurrent-run refuse). No spawn of real `pi` in unit tests. No extra test framework.

**Rationale**: Ponytail / constitution V. One file of tests. Spawning models is not a unit test.

## 8. Dependencies and platform

**Decision**: TypeScript, Node built-ins (`node:child_process`, `node:fs`, `node:path`). No new npm package. Spawn via the same “current binary or `pi` on PATH” trick as the subagent example (tiny helper, not the example file). Windows-first (this repo); `shell: false`.

**Alternatives considered**: Add a package.json + compile step: needless for jiti extensions.
