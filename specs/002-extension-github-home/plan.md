# Implementation Plan: Extension GitHub Home

**Branch**: `002-extension-github-home` | **Date**: 2026-09-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-extension-github-home/spec.md`

## Summary

Make this repository the canonical public home of the Spec Kit pipeline orchestrator. The
existing pi extension moves out of the project-local overlay `.pi/extensions/speckit-orchestrator/`
into the repo-root conventional pi package directory `extensions/speckit-orchestrator/`, and the
overlay is deleted so exactly one copy can ever load. The home gains the public-facing surface a
GitHub visitor needs (`README.md`, `LICENSE`, repository description), so the extension can be
installed into pi from an unpinned GitHub source (`git:github.com/<owner>/<repo>`) that resolves to
the default branch, i.e. "latest". Pipeline order, artifact gates, the pause protocol, worker
isolation flags, and progress reporting are unchanged: this feature rehomes and publishes, it does
not redesign.

## Technical Context

**Language/Version**: TypeScript, loaded directly by pi's extension loader (Node 24.15 / Bun 1.4 both support the syntax used); no compile step

**Primary Dependencies**: pi extension API types (`@earendil-works/pi-coding-agent`, type-only peer import, erased at load) and Node built-ins (`node:fs`, `node:path`, `node:child_process`, `node:os`, `node:crypto`). No runtime npm dependency. Spec Kit step skills under `.agents/skills/` are read from the target project at run time and are not bundled.

**Storage**: Filesystem only. Extension files live in `extensions/speckit-orchestrator/`; publication files are root `README.md` and `LICENSE`. Run state stays in memory per session (unchanged); no new persistence.

**Testing**: `node --test extensions/speckit-orchestrator/run.test.js` — the existing 12 checks (run state machine, pause parsing, artifact gates, worker flags, resume prompt). Verified passing on Node 24.15.0.

**Target Platform**: pi coding agent on Windows/macOS/Linux. Distribution target is pi's git package mechanism; the GitHub repository is the source of truth.

**Project Type**: Single pi package (one extension) hosted by a GitHub repository that is also this Spec Kit project home.

**Performance Goals**: N/A — unchanged. The existing 1 s status repaint and per-step worker spawn are retained as-is.

**Constraints**:
- Install MUST use the unpinned GitHub source only (`git:github.com/<owner>/<repo>`); a local checkout or local path MUST NOT be the install source (FR-004, FR-014).
- Exactly one loaded copy: no duplicate command registration, no duplicate status lines (FR-008).
- Package payload is limited to the extension folder plus `README` and `LICENSE`; Spec Kit skills and this repository's `.pi/prompts/*.md` MUST NOT be bundled (FR-015).
- No npm publish, no package registry, no new config surface (spec Assumptions, constitution V).

**Scale/Scope**: One extension folder (`index.ts`, `run.ts`, `gates.ts`, `spawn.ts`, `run.test.js`), two new root publication files, one removed project-local overlay, 3 operator commands unchanged.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Spec-First Pipeline** — PASS. The rehome is driven by `spec.md` (15 FRs, 6 SCs) and this plan. No Spec Kit step contract is reimplemented; the extension keeps invoking `.agents/skills/speckit-*/SKILL.md` and gating on their artifacts.
- **II. Pause Only for Human Input** — PASS. No new pause point is introduced. Specify → Clarify (conditional) → Plan → Tasks → Implement still runs unattended and stops only for worker-emitted questions.
- **III. Isolated Subagent Execution** — PASS. `WORKER_FLAGS` (`--mode json -p --no-session --no-extensions`) and per-step prompt building are unchanged; the main session stays the orchestrator.
- **IV. Orchestrator Observability** — PASS. `ctx.ui.setStatus("speckit", …)` progress, the worker pid/prompt-size line, and failure surfacing to the orchestrator are unchanged.
- **V. Simplicity** — PASS. The move is a directory move plus two documents. No build step, no `package.json`, no packaging tool, no new dependency, no abstraction. The one deliberately rejected addition (a root `package.json` `pi` manifest) is recorded in [research.md](./research.md#d1-payload-location-and-entry-point); pi's conventional `extensions/` discovery already loads the folder.

No violations → Complexity Tracking stays empty.

## Project Structure

### Documentation (this feature)

```text
specs/002-extension-github-home/
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── package-layout.md
│   ├── operator-commands.md
│   └── pause-protocol.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
extensions/
└── speckit-orchestrator/        # the one dedicated first-class pi package folder (FR-013)
    ├── index.ts                 # entry point: registers /speckit-run, /speckit-cancel, /speckit-answer; drives the pipeline
    ├── run.ts                   # pipeline run state machine (in-memory)
    ├── gates.ts                 # artifact gates + pause fence parser
    ├── spawn.ts                 # isolated worker spawn
    └── run.test.js              # existing automated checks (node --test)

README.md                        # public home description + install guidance (FR-007, FR-015)
LICENSE                          # package license (FR-015)

.agents/skills/speckit-*/        # Spec Kit step skills — a target-project requirement, NOT packaged (FR-010)
.pi/prompts/*.md                 # this project's prompts — NOT packaged (FR-015)
.specify/                        # Spec Kit project state (scripts, templates, memory, feature pointer)
specs/                           # feature specs/plans/tasks — not packaged
```

**Removed by this feature**: `.pi/extensions/speckit-orchestrator/` — the project-local overlay copy,
deleted rather than disabled (FR-008).

**Structure Decision**: One pi package whose resource root is the repository root. pi's conventional
package discovery walks `<root>/extensions/`, and for each subdirectory resolves `index.ts` as the
entry point, so `extensions/speckit-orchestrator/index.ts` loads with no `package.json` and no `pi`
manifest. `run.test.js` lives in the same folder but is not loaded, because only `index.ts` is treated
as an extension entry point. `README.md` and `LICENSE` sit at the repository root where GitHub and
package consumers expect them; pi does not load them as resources. Everything else in the repository
(`.specify/`, `.agents/`, `specs/`, `.pi/prompts/`) is home/project content and is not part of the
package payload.

## Complexity Tracking

> No Constitution Check violations. Section intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| _(none)_ | | |

## Phase 0: Research

Output: [research.md](./research.md). All unknowns from Technical Context are resolved there as
Decision / Rationale / Alternatives (D1–D10). No `NEEDS CLARIFICATION` markers remain.

Key resolutions:

- **Payload location and entry point** — `extensions/speckit-orchestrator/index.ts`, no root `package.json` (verified against pi's resource loader: conventional `extensions/` discovery resolves subdirectory `index.ts`).
- **Install source** — unpinned `git:github.com/<owner>/<repo>`; `pi update --extensions` advances to the newest default-branch commit (FR-014).
- **Duplicate prevention** — delete the project-local overlay; pi dedupes git packages by repository URL, not by path, so a no-disable-setting approach is the only safe one (FR-008).
- **Public surface** — exact README/repository-description text captured in [contracts/package-layout.md](./contracts/package-layout.md) so a newcomer can identify the home and install in under 5 minutes (SC-001).
- **License** — MIT (recommended for pi packages); alternatives recorded for maintainer confirmation.
- **Test command** — `node --test extensions/speckit-orchestrator/run.test.js` (green before and after the move; no manifest needed).

## Phase 1: Design & Contracts

Outputs:

- [data-model.md](./data-model.md) — Extension home, Extension folder, Published payload, Installation binding, Operator command, Public description, and the unchanged pipeline run state machine.
- [contracts/package-layout.md](./contracts/package-layout.md) — what the repository must and must not contain, install/update commands, and the required README/description content.
- [contracts/operator-commands.md](./contracts/operator-commands.md) — the three operator commands, their inputs, allowed states, effects, and the exactly-once rule.
- [contracts/pause-protocol.md](./contracts/pause-protocol.md) — the worker rider and pause fence format that must survive the move byte-for-byte.
- [quickstart.md](./quickstart.md) — end-to-end validation scenarios (publish, install from GitHub, no-clarification run, pause-and-answer run, cancel, duplicate check, missing-skill failure).

## Post-Design Constitution Re-check

Re-evaluated after Phase 1 with the full design in view:

- **I. Spec-First** — PASS. Implementation is fully covered by FR-001…FR-015 and the contracts above; no step contract is duplicated.
- **II. Pause Only for Human Input** — PASS. The pause protocol contract is preserved verbatim; no new interruption.
- **III. Isolated Subagent Execution** — PASS. Isolation flags and prompt construction are unchanged by the move (paths inside the prompt still resolve from the target project's `cwd`).
- **IV. Orchestrator Observability** — PASS. Progress/status contract unchanged; failure still surfaces at the named step.
- **V. Simplicity** — PASS. Design adds no dependency, manifest, build, or config. Rejected alternatives are recorded rather than implemented.

No new violations, no unresolved clarifications → ready for `/speckit.tasks`.
