---
description: "Task list for Extension GitHub Home"
---

# Tasks: Extension GitHub Home

**Input**: Design documents from `/specs/002-extension-github-home/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts), [quickstart.md](./quickstart.md)

**Tests**: No new test suite is authored. The orchestrator already ships `run.test.js` (12 checks); FR-011 only requires those existing checks to remain runnable from this home, so the test work below is *move + run + verify from the new path*, not test authoring.

**Organization**: Tasks are grouped by user story. US1 and US2 are both P1; US2 additionally depends on US1's publish step because "install the latest from GitHub" cannot happen before the folder is pushed.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

**Before this feature** (the state being changed):

```text
.pi/extensions/speckit-orchestrator/{index.ts,run.ts,gates.ts,spawn.ts,run.test.js}
```

**After this feature** (the contracted end state, per `contracts/package-layout.md` §1):

```text
extensions/speckit-orchestrator/{index.ts,run.ts,gates.ts,spawn.ts,run.test.js}
README.md
LICENSE
```

The published pi package payload is `extensions/speckit-orchestrator/**` + `README.md` + `LICENSE` only. `.agents/`, `.pi/prompts/`, `.specify/`, and `specs/` are home content, never payload.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Make the home a publishable git working tree and confirm the local toolchain

- [ ] T001 Initialize the repository as a git working tree on the default branch `main` in `E:\w\auto-specify` (`git init -b main`) so the home can be committed and pushed to GitHub; add **no** `.gitignore`, `.gitattributes`, or other new root file (research D7, constitution V)
- [ ] T002 Verify the local prerequisites in [quickstart.md](./quickstart.md#prerequisites): `pi --version` resolves the pi CLI, `node --version` is ≥ 22.6 (built-in type stripping for the existing checks), and no pipeline run is active in the session that performs the move (spec Assumption: install happens when no run is in progress)

**Checkpoint**: A git working tree on `main` with `pi` and `node` available and no active run

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Freeze the behavior baseline and fix the publication facts every later task consumes

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Freeze the pre-move behavior baseline: run `node --test .pi/extensions/speckit-orchestrator/run.test.js` from the home root and confirm `pass 12` / `fail 0`; record the SHA-256 of `.pi/extensions/speckit-orchestrator/index.ts`, `.pi/extensions/speckit-orchestrator/run.ts`, `.pi/extensions/speckit-orchestrator/gates.ts`, `.pi/extensions/speckit-orchestrator/spawn.ts`, and `.pi/extensions/speckit-orchestrator/run.test.js` so the rehome can later be proven byte-identical (FR-003, FR-011)
- [ ] T004 Fix the two publication facts every later task depends on: the concrete GitHub slug `<owner>/<repo>` that replaces the `<owner>/<repo>` placeholder left open in [research.md](./research.md#d9-ownerrepository-slug), and the MIT copyright holder name ([research.md](./research.md#d5-license)). Every occurrence — `README.md`, the GitHub repository description field, and the install/update commands — MUST use this same slug (FR-007, FR-014, SC-005)

**Checkpoint**: Baseline checks are green, file hashes are recorded, and the real slug + copyright holder are fixed

---

## Phase 3: User Story 1 - This repository is the public home (Priority: P1) 🎯 MVP

**Goal**: The complete orchestrator lives in one first-class folder `extensions/speckit-orchestrator/`, the project-local overlay is gone, and the home is published on GitHub with the public description a newcomer needs.

**Independent Test**: From the home root, `ls README.md LICENSE extensions/speckit-orchestrator/index.ts` succeeds and `test ! -e .pi/extensions/speckit-orchestrator` prints that the overlay is gone; reading only the README's first screen plus the GitHub description tells you this repository is the home and how to install, in under 5 minutes (quickstart V1).

### Implementation for User Story 1

- [ ] T005 [US1] Create repo-root `extensions/speckit-orchestrator/` and move `index.ts`, `run.ts`, `gates.ts`, `spawn.ts`, and `run.test.js` into it from `.pi/extensions/speckit-orchestrator/` with **no content edits**; the relative imports (`./gates.ts`, `./run.ts`, `./spawn.ts` in `extensions/speckit-orchestrator/index.ts` and the `require("./run.ts")` / `require("./gates.ts")` / `require("./spawn.ts")` calls in `extensions/speckit-orchestrator/run.test.js`) keep resolving because the files move together (FR-002, FR-013, package-layout P-2)
- [ ] T006 [P] [US1] Author root `README.md` with the six content blocks in the exact order fixed by [contracts/package-layout.md](./contracts/package-layout.md#4-public-description) §4: (1) what the extension is and that **this repository is its home**; (2) the installable piece is the dedicated first-class folder `extensions/speckit-orchestrator/` — not the repository root, not a hidden overlay; (3) install `pi install git:github.com/<owner>/<repo>` and update `pi update --extensions` with the real slug from T004; (4) the prerequisite that `speckit-specify`, `speckit-clarify`, `speckit-plan`, `speckit-tasks`, `speckit-implement` must exist in the **target project** under `.agents/skills/` and are not bundled; (5) the operator command reference (see [contracts/operator-commands.md](./contracts/operator-commands.md)); (6) the behavior summary — unattended pipeline, pause only for named questions, one run per session, runs do not survive session restart (FR-007, FR-010, FR-015, SC-001)
- [ ] T007 [P] [US1] Add root `LICENSE` containing the full MIT license text with the copyright holder fixed in T004 (FR-015, research D5)
- [ ] T008 [P] [US1] Delete `.pi/extensions/speckit-orchestrator/` from the home so exactly one loadable copy exists, and confirm the path is absent (`test ! -e .pi/extensions/speckit-orchestrator`); add **no** `pi config` / settings disable entry (FR-008, package-layout P-7, research D3)
- [ ] T009 [US1] Verify the moved payload: every file under `extensions/speckit-orchestrator/` matches the SHA-256 baseline recorded in T003, `find extensions -name '*.md'` returns nothing and `find extensions -name 'SKILL.md'` returns nothing (no bundled skill or prompt), while `.pi/prompts/*.md` still exists outside the payload folder and `run.test.js` is present but is not an extension entry point (FR-002, FR-010, FR-015, package-layout P-3…P-6)
- [ ] T010 [US1] Run the existing checks from the new path: `node --test extensions/speckit-orchestrator/run.test.js` → `pass 12` / `fail 0` (run state machine, pause parse, artifact gates, worker flags, resume prompt) (FR-011)
- [ ] T011 [US1] Publish the home once T008–T010 pass: commit the working tree, create the GitHub repository `<owner>/<repo>`, set its description field to the exact string in [contracts/package-layout.md](./contracts/package-layout.md#4-public-description) §4 (with the real slug), and push the default branch `main` (FR-001, FR-007, SC-001)
- [ ] T012 [US1] Publish-clean check on the pushed content: confirm no absolute machine paths, credentials, or local install pointers are present (`.specify/feature.json` and `.specify/integration.json` hold project-relative values only), no `.pi/settings.json` install binding is committed, and `.pi/extensions/` does not exist in the home (FR-009)

**Checkpoint**: User Story 1 is complete — the repository is the identifiable, publishable home of the orchestrator, with the overlay deleted and no duplicate copy present.

---

## Phase 4: User Story 2 - Install into pi without changing behavior (Priority: P1)

**Goal**: Installing the dedicated folder from the latest GitHub source loads the same orchestrator with identical commands, progress, pause rules, and terminal states.

**Independent Test**: Install from GitHub (latest) into pi, start a fresh session, and complete both a no-clarification run and a pause-and-answer run; confirm commands, progress lines, and run rules match the pre-move orchestrator (quickstart V4, V6, V7, V8).

**Dependency**: Requires US1 to be published (T011) — "get the latest from GitHub" is impossible before the folder is pushed and the slug is real.

### Implementation for User Story 2

- [ ] T013 [US2] Install from the published home using the unpinned source only: run `pi install git:github.com/<owner>/<repo>` and confirm `pi list` shows the repository exactly once as a git source with **no** `@ref` suffix; no local path, no repository-root install, no hand-copied overlay (FR-004, FR-014, SC-005)
- [ ] T014 [US2] Restart pi and confirm the extension is loaded from the installed GitHub clone rather than this checkout: `/speckit-run`, `/speckit-cancel`, and `/speckit-answer` are available in the new session and no `.pi/extensions/speckit-orchestrator/` exists in the target project (FR-005, FR-006)
- [ ] T015 [US2] Prove "latest" means the default branch: push a harmless commit to `main` of `<owner>/<repo>`, run `pi update --extensions`, start a new pi session, and confirm the session reflects the new commit without re-pinning a tag or commit (FR-014)
- [ ] T016 [US2] Validate the no-clarification run (quickstart V6) in a target project that has Spec Kit skills: `/speckit-run <complete feature description>` advances `specify` → `clarify` (`skipped` when nothing to ask) → `plan` → `tasks` → `implement` with no extra start action, one `speckit: <step> worker pid <pid> · <n> byte prompt · <provider>/<model>` line per step, `speckit: <step> ✓`/`skipped` results, `specs/<feature>/spec.md`, `plan.md`, `tasks.md` written into the target project, and `speckit: complete` at the end while the main session stays usable (FR-003, FR-006, SC-002)
- [ ] T017 [US2] Validate the pause-and-answer run (quickstart V7): an underspecified `/speckit-run` stops at `speckit: paused (clarify) — question 1/n` with `Reply: /speckit-answer <your answer>`, unrelated chat text does **not** resume it, each `/speckit-answer` records one answer and shows the next question, and the last answer resumes `plan → tasks → implement` to `complete` without re-running earlier steps (FR-003, SC-003, US2 AS3)
- [ ] T018 [US2] Validate cancel and failure stay terminal (quickstart V8): `/speckit-cancel` during `running` and again during `blocked-on-user` each yield `speckit: cancelled` while starting no later step and then allowing a new `/speckit-run`; a worker error or an unsatisfied artifact gate fails at the named step with the gate/worker message (`missing plan.md`, worker stderr, or exit code) (FR-003, SC-006)

**Checkpoint**: User Stories 1 and 2 work together — the installed GitHub copy runs the pipeline with unchanged behavior.

---

## Phase 5: User Story 3 - Safe to publish and reuse (Priority: P2)

**Goal**: A visitor installs the same thing the maintainer runs, commands never register twice, and a consumer without Spec Kit skills fails exactly as before.

**Independent Test**: With the home published on GitHub, the install guidance in the description/README gets the latest from GitHub (not a local checkout), each command appears once, and a project without Spec Kit skills fails with `missing skill <path>` rather than a confusing broken-home error (quickstart V3, V5, V8 failure path).

**Dependency**: Requires US2's install (T013) to be in place for the exactly-once and parity checks.

### Implementation for User Story 3

- [ ] T019 [P] [US3] Verify exactly-once registration after install **and** after `pi update --extensions`: in a fresh session `/speckit-run`, `/speckit-cancel`, and `/speckit-answer` each appear exactly once, only one `speckit` status line renders while a run is active, `pi list` shows the repository once, and `.pi/extensions/speckit-orchestrator/` exists neither in the home nor in the target project (FR-008, SC-004)
- [ ] T020 [P] [US3] Verify the public guidance a first-time visitor reads (GitHub description field + first screen of `README.md`) states the home, names the `extensions/speckit-orchestrator/` folder, and gives install-by-latest-from-GitHub; confirm the real slug appears everywhere and that **no** `<owner>/<repo>` placeholder, local path, repository-root install, or overlay instruction remains (FR-007, FR-013, FR-014, US3 AS2, SC-001)
- [ ] T021 [P] [US3] Validate consumer parity for a project **without** Spec Kit skills: `/speckit-run` in a project lacking `.agents/skills/speckit-*/SKILL.md` fails at the first step with `missing skill <path>` naming that step and starts no later step — the failure is about missing step skills, not a broken or partial extension home (FR-010, US3 AS3)
- [ ] T022 [P] [US3] Clone the published `<owner>/<repo>` into a temporary directory and run `node --test extensions/speckit-orchestrator/run.test.js` there to prove the checks ship with the home and pass without this working copy's local state (FR-011, quickstart V3)

**Checkpoint**: All three user stories are independently functional and the published home is safe to reuse.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Publish-cleanliness and simplicity checks that span all stories

- [ ] T023 [P] Sweep the home for references that describe the extension's current location as `.pi/extensions/speckit-orchestrator/` and update the current-guidance ones (`README.md`, `.pi/prompts/*.md`) to `extensions/speckit-orchestrator/`; leave the historical feature artifacts under `specs/001-speckit-orchestrator/` unchanged as a record of the previous layout (FR-001, FR-013)
- [ ] T024 [P] Remove the scratch `Sync Impact Report (scratch; remove before commit)` block at the top of `.specify/memory/constitution.md` so the published home carries no pre-commit scratch text (FR-009, constitution Governance)
- [ ] T025 Simplicity guard (constitution V, research D1/D5/D8): confirm the rehome introduced no root `package.json`, no `pi` manifest, no version file, no npm publish configuration, no `.gitignore`, and no new settings or disable surface; if any appeared, remove it rather than documenting it
- [ ] T026 Run the full quickstart V1–V9 against the published home and record the outcome per scenario — V1 home identifiable, V2 payload contains only the extension folder, V3 checks green, V4 install from GitHub (unpinned/latest), V5 exactly-once commands, V6 no-clarification run, V7 pause/answer run, V8 cancel/failure terminal, V9 publish-clean — mapping any anomaly back to its FR/SC (SC-001…SC-006)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories (the baseline hashes and the real slug are consumed everywhere downstream)
- **User Story 1 (Phase 3)**: Depends on Foundational
- **User Story 2 (Phase 4)**: Depends on Foundational **and** on US1's publish step T011 — install deliberately targets the latest GitHub copy, which cannot exist until the folder is pushed
- **User Story 3 (Phase 5)**: Depends on US2's install (T013); the exactly-once and no-skills-parity checks require a loaded installed copy
- **Polish (Phase 6)**: Depends on all desired stories being complete; T026 is the final gate

### User Story Dependencies

- **US1 (P1)**: Independent of US2/US3 — delivers the publishable home
- **US2 (P1)**: Blocked by US1 (T011) — this dependency is intrinsic to the feature's "latest from GitHub only" rule, not an integration detail
- **US3 (P2)**: Blocked by US2 (T013) — duplicate/parity checks are meaningless before an install exists

### Within Each User Story

- US1: T005 (move) before T008 (delete overlay), T009 (payload verify), and T010 (checks from new path); T011 publishes only after T008–T010 pass
- US2: T013 (install) before T014–T018; verification scenarios T016–T018 run in a fresh session
- US3: T019–T022 all verify the installed state and are mutually independent
- No step may alter orchestrator behavior: any change to `index.ts`, `run.ts`, `gates.ts`, or `spawn.ts` beyond the path move is out of scope (FR-003, FR-012, [contracts/pause-protocol.md](./contracts/pause-protocol.md#6-change-control))

### Parallel Opportunities

- Foundational: T003 and T004 touch different concerns (file hashes vs. publication facts) and can run in parallel
- US1: T006 (`README.md`), T007 (`LICENSE`), and T008 (delete `.pi/extensions/`) are three distinct paths and can run in parallel right after T005
- US3: T019, T020, T021, and T022 are four independent verifications and can run in parallel once T013 is done
- Polish: T023 and T024 touch different files and can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch the three post-move tasks together (distinct paths, no mutual dependency):
Task: "Author root README.md per contracts/package-layout.md §4"
Task: "Add root LICENSE with full MIT text"
Task: "Delete .pi/extensions/speckit-orchestrator/ and confirm the path is absent"
```

## Parallel Example: User Story 3

```bash
# Launch all four post-install verifications together:
Task: "Verify exactly-once command registration and single status line"
Task: "Verify README + GitHub description guidance (real slug, no placeholder)"
Task: "Validate missing-Spec-Kit-skills failure parity"
Task: "Clone published repo to temp dir and run node --test there"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (git init, toolchain check)
2. Complete Phase 2: Foundational (baseline hashes, real slug + license holder) — CRITICAL, blocks everything
3. Complete Phase 3: User Story 1 (move, README, LICENSE, delete overlay, verify, publish)
4. **STOP and VALIDATE**: run quickstart V1, V2, V3, V9 against the home
5. The MVP outcome is the maintainer's stated ask: this repository is the public home, publishable on GitHub

### Incremental Delivery

1. Setup + Foundational → baseline frozen and publication facts fixed
2. US1 → the home exists, is publishable, and carries no overlay (MVP)
3. US2 → install from GitHub latest and prove the pipeline behavior is unchanged
4. US3 → prove no duplicate registration and consumer parity
5. Polish → publish-clean sweep, simplicity guard, full V1–V9 record

### Parallel Team Strategy

With two contributors:

1. Both complete Setup + Foundational together
2. After T005: one takes T006/T007 (public docs) while the other takes T008/T009/T010 (overlay deletion + payload/checks verification), then T011 publishes
3. US2 install/verification is inherently sequential for the maintainer (one pi environment), so US3's four verifications should be handed to a second contributor afterwards

---

## Notes

- [P] tasks = different files or independent verifications, no dependency on incomplete tasks
- [Story] label maps each task to US1/US2/US3 for traceability; Setup, Foundational, and Polish carry no story label
- The only test command in this feature is `node --test extensions/speckit-orchestrator/run.test.js` (expected `pass 12` / `fail 0`); no manifest, test script, or config is added (research D6, constitution V)
- `run.test.js` moves with the modules because it loads them by relative `require("./run.ts")` — never split those moves
- Behavior is frozen: paths inside the home change, the fence tokens, rider text, isolation flags, and resume prompt shape do not (FR-003, FR-012)
- Nothing outside the payload is packaged: `.agents/skills/speckit-*`, `.pi/prompts/*.md`, `.specify/**`, `specs/**` stay home content (FR-015)
- Commit after each logical group; keep T005 (pure move) separate from T006/T007 (new files) so the byte-identical move stays reviewable
- Open maintainer confirmations resolved by T004: MIT license text (D5) and the concrete `<owner>/<repo>` slug (D9)
