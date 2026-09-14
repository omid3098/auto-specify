# Implementation Plan: Spec Kit Pipeline Orchestrator

**Branch**: `001-speckit-orchestrator` | **Date**: 2026-09-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-speckit-orchestrator/spec.md`

## Summary

A project-local pi extension that runs Specify → Clarify (pause only if questions) → Plan → Tasks → Implement as sequential isolated `pi --mode json -p --no-session --no-extensions` children. The main session stays the orchestrator: `/speckit-run`, `/speckit-answer`, `/speckit-cancel`, always-on `setStatus` progress, in-memory run (dies with the session). Existing Spec Kit skills are the step contracts; this extension only dispatches, gates on artifacts, and handles the pause fence.

## Technical Context

**Language/Version**: TypeScript (jiti, no compile step), Node.js as used by pi

**Primary Dependencies**: `@earendil-works/pi-coding-agent` types (already installed with pi); Node `child_process` / `fs` / `path`. No new npm packages.

**Storage**: In-memory `PipelineRun` only. Spec Kit artifacts on disk are produced by skills.

**Testing**: `node --test` + `node:assert` on the state machine and pause/gate helpers. No live model spawn.

**Target Platform**: pi interactive TUI (Windows-first; spawn `shell: false`)

**Project Type**: pi extension (single directory under `.pi/extensions/`)

**Performance Goals**: Main TUI remains responsive while a worker runs; status updates when a step starts/ends. No throughput target.

**Constraints**: One active run per session; no persist across restart; `--no-extensions` on children; pause only via `/speckit-answer`; fail/cancel are terminal.

**Scale/Scope**: Five steps, three commands, one status key, ~few hundred lines plus one test file.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Plan |
|-----------|------|
| I. Spec-First Pipeline | Workers run existing skills in order; no homegrown specify/plan/tasks/implement. |
| II. Pause Only for Human Input | Auto-advance; pause fence + `/speckit-answer` only. |
| III. Isolated Subagent Execution | Child `pi --no-session --no-extensions`; prompt is skill + rider, not parent transcript. |
| IV. Orchestrator Observability | `setStatus`; failures named; main session not blocked by a tool call. |
| V. Simplicity | No subagent-example copy, no workflow engine, no npm deps, no persist. |

Post-design: still pass. Complexity Tracking empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-speckit-orchestrator/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── commands.md
│   └── worker.md
└── tasks.md              # /speckit.tasks — not this command
```

### Source Code (repository root)

```text
.pi/extensions/speckit-orchestrator/
├── index.ts              # register commands, status, drive the machine
├── run.ts                # PipelineRun + transitions
├── spawn.ts              # child pi JSONL
├── gates.ts              # artifact checks + pause parse
└── run.test.js           # node --test (pure functions)
```

Keep files boring; merge if a file would be a 20-line re-export.

**Structure Decision**: Project-local pi extension only. No `src/` app tree. Tests live next to the extension so they do not invent a test package.

## Complexity Tracking

> None. Constitution Check has no violations.
