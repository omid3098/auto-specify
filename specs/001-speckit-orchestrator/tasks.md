---
description: "Task list for Spec Kit Pipeline Orchestrator"
---

# Tasks: Spec Kit Pipeline Orchestrator

**Input**: Design documents from `/specs/001-speckit-orchestrator/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Plan requires `node --test` on the state machine in `.pi/extensions/speckit-orchestrator/run.test.js`. No extra suites.

**Organization**: Tasks are grouped by user story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3
- Include exact file paths in descriptions

## Path Conventions

```text
.pi/extensions/speckit-orchestrator/
├── index.ts
├── run.ts
├── spawn.ts
├── gates.ts
└── run.test.js
```

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Extension directory pi will auto-load

- [X] T001 Create `.pi/extensions/speckit-orchestrator/index.ts` exporting `default function (pi: ExtensionAPI)` that registers nothing yet (empty factory so `/reload` loads the module)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Pure run machine, gates, and spawn helper. No commands yet.

**⚠️ CRITICAL**: No user story work until this phase is complete

- [X] T002 Implement `PipelineRun` / `StepRecord` / `PausePayload` and transitions in `.pi/extensions/speckit-orchestrator/run.ts` per `specs/001-speckit-orchestrator/data-model.md` (states `running` | `blocked-on-user` | `failed` | `cancelled` | `complete`; failed/cancelled terminal; at most one active run; `id` generated at start and not persisted)
- [X] T003 [P] Implement pause-fence parse and artifact gates in `.pi/extensions/speckit-orchestrator/gates.ts` per `specs/001-speckit-orchestrator/contracts/worker.md` (specify → `.specify/feature.json` + `spec.md`; plan → `plan.md`; tasks → `tasks.md`; implement → exit 0 only; invalid pause JSON = failure)
- [X] T004 [P] Implement child spawn in `.pi/extensions/speckit-orchestrator/spawn.ts`: `pi --mode json -p --no-session --no-extensions`, cwd parent, stdin ignore, JSONL stdout, stderr capture, AbortSignal SIGTERM then SIGKILL after 5s
- [X] T005 Add `node --test` coverage in `.pi/extensions/speckit-orchestrator/run.test.js` for: start→complete happy path, refuse second concurrent run, fail is terminal, cancel from running and blocked-on-user, pause parse ok/invalid, specify/plan/tasks gates

**Checkpoint**: `node --test .pi/extensions/speckit-orchestrator/run.test.js` passes without spawning pi

---

## Phase 3: User Story 1 - Unattended spec-to-implementation run (Priority: P1) 🎯 MVP

**Goal**: `/speckit-run <description>` drives Specify → (skip Clarify if no pause) → Plan → Tasks → Implement without extra operator starts; main session stays usable; one run per session; cancel works.

**Independent Test**: `/speckit-run` with a complete description; later steps start without `/speckit-plan` etc.; chat still works; second `/speckit-run` while active is refused.

### Implementation for User Story 1

- [X] T006 [US1] Register `/speckit-run` in `.pi/extensions/speckit-orchestrator/index.ts` per `specs/001-speckit-orchestrator/contracts/commands.md` (empty args no-op; refuse if run is `running` or `blocked-on-user`; start does not `waitForIdle` the whole pipeline)
- [X] T007 [US1] Drive sequential workers from `.pi/extensions/speckit-orchestrator/index.ts` using `.pi/extensions/speckit-orchestrator/spawn.ts`: prompt = Spec Kit `SKILL.md` + worker rider + step args; order specify → clarify → plan → tasks → implement; do not reimplement skill contracts
- [X] T008 [US1] After each worker, apply gates from `.pi/extensions/speckit-orchestrator/gates.ts` in `.pi/extensions/speckit-orchestrator/index.ts`; missing artifact or nonzero exit → `failed` (no in-place retry); success → next step; all done → `complete`
- [X] T009 [US1] Register `/speckit-cancel` in `.pi/extensions/speckit-orchestrator/index.ts`: abort child, mark `cancelled`, idle notify nothing to cancel
- [X] T010 [US1] On `session_shutdown` in `.pi/extensions/speckit-orchestrator/index.ts`, abort child and drop the in-memory run (FR-017: session-only)

**Checkpoint**: Happy-path run can finish unattended (Clarify skip = no pause block). Chat not blocked by a long tool call.

---

## Phase 4: User Story 2 - Stop only when input is required (Priority: P1)

**Goal**: Pause on `---speckit-pause---` with named questions; only `/speckit-answer` resumes; other messages stay chat.

**Independent Test**: Vague `/speckit-run` pauses before Plan; unrelated chat does not resume; `/speckit-answer` continues Plan → Tasks → Implement.

### Implementation for User Story 2

- [X] T011 [US2] Add Clarify rider to the worker prompt in `.pi/extensions/speckit-orchestrator/index.ts` per `specs/001-speckit-orchestrator/contracts/worker.md` (emit pause fence and stop if the skill would wait; no fence if nothing to ask)
- [X] T012 [US2] On pause block, set `blocked-on-user` and `PausePayload` (`step`, non-empty `questions`, hint `/speckit-answer`) in `.pi/extensions/speckit-orchestrator/run.ts` / `.pi/extensions/speckit-orchestrator/index.ts`; do not start Plan
- [X] T013 [US2] Register `/speckit-answer` in `.pi/extensions/speckit-orchestrator/index.ts` per commands contract (only when `blocked-on-user`; empty args stay paused; resume with answers in the worker prompt; wrong state notify and do not start a run)
- [X] T014 [US2] Do not treat normal `input` as answers in `.pi/extensions/speckit-orchestrator/index.ts` (no `handled`/`transform` on free text while paused)

**Checkpoint**: Pause + explicit answer path works; Clarify skip from US1 still works.

---

## Phase 5: User Story 3 - Isolated workers and visible progress (Priority: P2)

**Goal**: Workers never get the parent session; footer always shows current/completed/blocked/failed/cancelled; failures name the step.

**Independent Test**: Look at the session without asking — status already shows the step; `ps`/logs show child `pi --no-session --no-extensions`; kill a worker → footer names the failed step.

### Implementation for User Story 3

- [X] T015 [US3] Confirm spawn args in `.pi/extensions/speckit-orchestrator/spawn.ts` always include `--mode json -p --no-session --no-extensions` and never pass the parent session file; prompt is the only injected parent context
- [X] T016 [US3] Keep always-on progress via `ctx.ui.setStatus("speckit", snapshot)` from `.pi/extensions/speckit-orchestrator/index.ts` using `ProgressSnapshot` rules in `specs/001-speckit-orchestrator/data-model.md`; update on every step/state change; operator need not ask
- [X] T017 [US3] On worker failure in `.pi/extensions/speckit-orchestrator/index.ts`, surface the failed step name in the main session (`notify` + status `speckit: failed at <step>`) and do not start later steps

**Checkpoint**: Isolation + live status + named failures.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Wire check + leftover merge

- [X] T018 Run `node --test .pi/extensions/speckit-orchestrator/run.test.js` and walk `specs/001-speckit-orchestrator/quickstart.md` (load `/speckit-run`, refuse concurrent, cancel)
- [X] T019 If `run.ts` / `gates.ts` / `spawn.ts` stay tiny, merge into `.pi/extensions/speckit-orchestrator/index.ts` and keep tests importing the same pure functions — do not add files for later

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Start immediately
- **Foundational (Phase 2)**: Depends on T001 — BLOCKS all stories
- **US1 (Phase 3)**: Depends on Phase 2 — MVP
- **US2 (Phase 4)**: Depends on US1 worker loop (needs a run that can pause)
- **US3 (Phase 5)**: Depends on Phase 2 spawn; status hooks into US1/US2 state changes (do T016/T017 after T008/T012)
- **Polish**: After desired stories

### User Story Dependencies

- **US1 (P1)**: After Phase 2
- **US2 (P1)**: After US1 sequential driver (T007–T008)
- **US3 (P2)**: Spawn isolation can start after T004; live status after US1 state exists

### Parallel Opportunities

- T003 and T004 after T002 types exist (gates/spawn do not import each other)
- T015 is a check on T004 — skip extra work if T004 already matches the contract

---

## Parallel Example: Foundational

```bash
Task: "Implement pause-fence parse and artifact gates in .pi/extensions/speckit-orchestrator/gates.ts"
Task: "Implement child spawn in .pi/extensions/speckit-orchestrator/spawn.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 + 2
2. Phase 3 US1
3. **STOP**: `/speckit-run` on a fully specified feature with no clarify pause
4. Then US2 (pause) and US3 (status polish if not already in T016)

### Incremental Delivery

1. Setup + foundation → tests green
2. US1 → unattended happy path (MVP)
3. US2 → pause/answer
4. US3 → isolation/status if anything remains
5. T018 quickstart

---

## Notes

- Do not copy `examples/extensions/subagent` wholesale
- Do not add npm dependencies or a compile step
- Do not persist runs (`appendEntry` out of scope)
- Analyze / checklist / converge / taskstoissues stay off the default path
