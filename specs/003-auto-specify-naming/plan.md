# Implementation Plan: Auto-Specify Naming Alignment

**Branch**: `003-auto-specify-naming` | **Date**: 2026-09-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-auto-specify-naming/spec.md`

## Summary

Align the one product name across the repository: rename the installable extension directory
`extensions/speckit-orchestrator/` to `extensions/auto-specify/` and update the four README
references that point at that folder. The extension is discovered by pi's conventional repo-root
`extensions/` scan, so the rename is a path change with no code change: relative imports
(`./run.ts`, `./gates.ts`, `./spawn.ts`) and the test entry point move with the folder, and the
documented install/update commands already read `auto-specify` and stay byte-identical.

Two things stay untouched by design: the historical feature records under
`specs/001-speckit-orchestrator/` and `specs/002-extension-github-home/`, and descriptive prose using
"orchestrator" as a role word rather than as the extension name. This feature's own artifacts are
likewise exempt from the zero-old-name rule, because they must be able to name the folder being
renamed and must record the evidence search (SC-001).

## Technical Context

**Language/Version**: TypeScript, executed via Node type stripping. Requires Node ≥ 22.6; verified on Node v24.15.0. No compile step.

**Primary Dependencies**: `@earendil-works/pi-coding-agent` (type-only import of `ExtensionAPI` / `ExtensionContext`) and Node built-ins (`node:fs`, `node:path`, `node:child_process`, `node:os`). No new dependency is added (FR-009).

**Storage**: Filesystem only. Extension sources at `extensions/auto-specify/`; run state remains in-memory per session (unchanged by this feature).

**Testing**: `node --test extensions/auto-specify/run.test.js` — the existing 12 checks (run state machine, pause parsing, artifact gates, worker flags, resume prompt). Must report pass 12 / fail 0 per SC-003.

**Target Platform**: pi CLI extension loaded from the repository's conventional root `extensions/` directory; development host is Windows with a POSIX-capable shell.

**Project Type**: Single project — a pi extension package at the repository root.

**Performance Goals**: No change. The rename alters no runtime path, spawn flag, prompt, or gate; only the directory name and four README lines change.

**Constraints**: Pure naming/path change. NO new dependency, manifest, or build step (FR-009). The documented install and update commands — source, branch, wording, sequence — MUST stay byte-identical (FR-003, FR-008). Only the literal extension name/path is renamed; the role word "orchestrator" in descriptive prose stays (FR-002, FR-007).

**Scale/Scope**: One directory rename (5 files, 805 lines of TS/JS) plus 4 README lines; a repository-wide old-name search must classify every hit (124 lines at plan time: 4 in `README.md` to fix, 33 lines across 5 files in `specs/001-…`, 61 lines across 9 files in `specs/002-…`, and the remainder in this feature's own exempt artifacts, whose count grows as this record is written).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Spec-First Pipeline | Spec exists (`spec.md`, clarified) and this plan precedes any code change; the rename is executed by tasks, not from chat. Spec Kit skills/templates remain the contract source; no contract is reimplemented. | PASS |
| II. Pause Only for Human Input | The feature is deterministic (rename + docs + verification). Planning raises no open question requiring a human answer; no pause is requested. | PASS |
| III. Isolated Subagent Execution | Behavior unchanged. The extension still spawns each pipeline step in its own process with `--mode json -p --no-session --no-extensions`; the rename does not touch `spawn.ts`. | PASS |
| IV. Orchestrator Observability | Behavior unchanged. Status-line snapshots, pause reporting, and failure surfacing are unchanged; the rename introduces no new failure surface. | PASS |
| V. Simplicity | Smallest design that satisfies I–IV: a directory move plus four documentation lines. No new file, manifest, dependency, build step, or config surface is introduced. The only added artifact content is verification evidence, which SC-001 explicitly requires. | PASS |

**Post-Phase-1 re-check**: PASS — design artifacts below add no runtime abstraction, no dependency, and no new repository surface. See Complexity Tracking (empty).

## Project Structure

### Documentation (this feature)

```text
specs/003-auto-specify-naming/
├── plan.md              # This file (/speckit-plan output)
├── research.md          # Phase 0 output (rename mechanics, discovery, evidence recording)
├── data-model.md        # Phase 1 output (name/location entities and before→after transitions)
├── quickstart.md        # Phase 1 output (runnable rename + verification guide)
├── contracts/           # Phase 1 output
│   ├── rename-map.md    # Exact old→new mapping and exempt-reference rules
│   └── verification.md  # Recorded-search and pinned-test evidence contract
└── checklists/          # existing requirements checklist (from /speckit-specify)
```

### Source Code (repository root)

```text
extensions/
└── auto-specify/            # renamed from extensions/speckit-orchestrator/ (FR-001, FR-006)
    ├── index.ts             # pi entry point; registers /speckit-run, /speckit-cancel, /speckit-answer
    ├── run.ts               # in-memory run state machine (unchanged)
    ├── gates.ts             # pause-fence parse + artifact gates (unchanged)
    ├── spawn.ts             # isolated worker spawn, WORKER_FLAGS (unchanged)
    └── run.test.js          # 12 node:test checks, relative requires (unchanged)

README.md                    # 4 path references updated to extensions/auto-specify/ (FR-002, FR-003)
LICENSE                      # unchanged
specs/001-speckit-orchestrator/   # historical record — NOT renamed (FR-007)
specs/002-extension-github-home/  # historical record — NOT renamed (FR-007)
specs/003-auto-specify-naming/    # this feature's artifacts — exempt (FR-007)
```

**Structure Decision**: Single project. The extension is one first-class pi package folder directly
under the repo-root conventional `extensions/` directory; its sibling modules and its test file move
with it as a unit because all imports are relative (`./run.ts`, `./gates.ts`, `./spawn.ts`). No
`src/`, no separate test tree, no manifest is introduced: pi discovers per-subdirectory `index.ts`
without one, and adding a manifest would contradict FR-009 and constitution V.

## Complexity Tracking

> No Constitution Check violations. Table intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
