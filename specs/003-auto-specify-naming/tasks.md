---

description: "Task list for Auto-Specify Naming Alignment"
---

# Tasks: Auto-Specify Naming Alignment

**Feature Branch**: `003-auto-specify-naming`
**Input**: Design documents from `/specs/003-auto-specify-naming/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/rename-map.md, contracts/verification.md, quickstart.md

**Tests**: No new tests are written. The spec requests no TDD, and research D6 explicitly rejects adding tests for a pure rename. Instead, the existing 12-check suite is run from the renamed location as the pinned behavioral proof (SC-003), and SC-001/SC-005 evidence is recorded in `specs/003-auto-specify-naming/contracts/verification.md`.

**Organization**: Tasks are grouped by user story. This is a one-directory rename plus four README lines; the directory move is the single blocking prerequisite (Phase 2), after which US1 and US2 are independently verifiable, and US3's sweep depends on US1's README edits for its pass condition.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: pi extension package at repository root (`extensions/`, `README.md`, `specs/`). No `src/`, no separate test tree, and no manifest is introduced (FR-009).
- All paths below are repository-relative to `E:/w/auto-specify/`.

---

## Phase 1: Setup (Baseline and Environment)

**Purpose**: Establish the pre-change baseline so every later failure is attributable to the rename, and record the environment the evidence tables require.

- [X] T001 Confirm prerequisites from `specs/003-auto-specify-naming/quickstart.md` and record them for the evidence tables: run `node --version` (must be ≥ 22.6; type stripping — verified on v24.15.0), `git --version`, `git branch --show-current`, and `git status --porcelain` from the repository root `E:/w/auto-specify/`. Note the branch actually checked out (`main` at tasks time — if it is not `003-auto-specify-naming`, record that as an environment discrepancy in the evidence, do not create or switch branches), and confirm `extensions/speckit-orchestrator/` is unmodified.
- [X] T002 Capture the pre-change naming baseline in the `specs/003-auto-specify-naming/contracts/verification.md` V-1 evidence table context: run `node --test extensions/speckit-orchestrator/run.test.js` (expect `tests 12 / pass 12 / fail 0`) and `grep -n "speckit-orchestrator" README.md` (expect exactly 4 hits, on lines 8, 16, 20, 94). Do not pin a repository-wide total: this change record's own exempt count grows as it is written (research D3, D4).

**Checkpoint**: Baseline green at the old path and the environment is recorded.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The directory move itself. Every user story needs the renamed location to exist, so this phase blocks all of them.

**⚠️ CRITICAL**: No user story verification can begin until this phase is complete.

- [X] T003 Perform the single directory move from the repository root: `git mv extensions/speckit-orchestrator extensions/auto-specify` (rename-map.md R-1, M-1). Move the directory as a unit so all five files travel together — `index.ts`, `run.ts`, `gates.ts`, `spawn.ts`, `run.test.js` (M-2…M-6). Do NOT edit any file content inside the folder, do NOT rewrite the relative imports (`./run.ts`, `./gates.ts`, `./spawn.ts`), and do NOT leave an alias, symlink, or copy at `extensions/speckit-orchestrator` (INV-4, INV-5).
- [X] T004 Verify the move is path-only before proceeding: from `E:/w/auto-specify/`, `git status` / `git diff --stat` must show the five files as renames (R) with no content modification, `test -f extensions/auto-specify/index.ts` must succeed, and `test ! -e extensions/speckit-orchestrator` must succeed (rename-map.md C6; INV-4, INV-6). A content diff inside the moved set means the move was done wrong — redo it rather than patching contents.

**Checkpoint**: `extensions/auto-specify/` exists with byte-identical files, the old path is gone — all user stories can now proceed.

---

## Phase 3: User Story 1 - One recognizable product name across the home (Priority: P1) 🎯 MVP

**Goal**: The README and the installable extension folder both read `auto-specify`, matching the GitHub project name, with every documented repository-relative path copy-paste correct.

**Independent Test**: Open the repository as a newcomer: read `README.md` and list the directory contents. Both the README's extension name/path and the folder name read `auto-specify`; no second name for the same product appears.

### Implementation for User Story 1

- [X] T005 [US1] In `E:/w/auto-specify/README.md`, replace the substring `extensions/speckit-orchestrator` with `extensions/auto-specify` on exactly these four path lines and nothing else: line 8 (D-1, the blockquote callout "install the … folder from GitHub"), line 16 (D-2, the first line of the "What gets installed" code fence), line 20 (D-3, the entry-point bullet naming `index.ts`), and line 94 (D-4, the Tests command `node --test extensions/…/run.test.js`). This is a strict path substitution: no rewording, no restructuring, no added or removed lines (rename-map.md C2, R-2). Do NOT touch: the `# auto-specify` title, the `pi install git:github.com/omid3098/auto-specify` line (N-1), the `pi update --extensions` / `pi list` lines and their order (N-2), the `LICENSE` line (N-6), or any use of "orchestrator" as a role description in prose (N-7, FR-002).
- [X] T006 [US1] Verify in `E:/w/auto-specify/README.md` that the operator commands are byte-identical and the diff is confined: run `git diff -- README.md` and confirm it touches only the four path lines from T005 — the install, update, and list lines show zero changes (rename-map.md N-1, N-2; INV-2, INV-8; FR-003, FR-008).
- [X] T007 [US1] Verify the naming outcome in `E:/w/auto-specify/`: `grep -n "speckit-orchestrator" README.md` returns no output, `grep -c "extensions/auto-specify" README.md` prints at least `4`, `test -f extensions/auto-specify/index.ts` succeeds, and `test ! -e extensions/speckit-orchestrator` succeeds (rename-map.md C6; INV-1, INV-7, INV-9). If any of these fail, fix the rename or the README lines — never weaken the check.

**Checkpoint**: A newcomer can state the extension's name and location from the README alone, and the folder name matches (SC-002, FR-001, FR-003).

---

## Phase 4: User Story 2 - Installed extension keeps working after the rename (Priority: P1)

**Goal**: The renamed extension loads and behaves exactly as before: the pinned check passes from the new path, no manifest or alias was introduced, and the operator-visible pipeline is unchanged.

**Independent Test**: Run the pinned check from the new path and (if `pi` is available) one smoke run. The check reports pass 12 / fail 0 and the run's commands, progress, pause/answer, and one-run-per-session rules behave as before the rename.

### Implementation for User Story 2

- [X] T008 [US2] Run the pinned behavioral check from the repository root `E:/w/auto-specify/`: `node --test extensions/auto-specify/run.test.js`. Required outcome is exactly `tests 12 / pass 12 / fail 0` (SC-003, FR-004). The suite requires `./run.ts`, `./gates.ts`, `./spawn.ts`, and `./index.ts` relatively, so a green run proves the renamed location's entry point and modules resolve (INV-6). Any `fail > 0`, suite-load error, or missing-file error means the move is incomplete: fix the move, do not modify or weaken the test (verification.md V-2).
- [X] T009 [US2] Confirm the renamed location is manifest-free and file-complete in `E:/w/auto-specify/extensions/auto-specify/`: `test ! -e extensions/auto-specify/package.json` succeeds (FR-009, R-3) and the directory contains exactly the five moved files `index.ts`, `run.ts`, `gates.ts`, `spawn.ts`, `run.test.js` — no added file, no alias, and pi's conventional root-`extensions/` scan still resolves `index.ts` without a manifest (FR-006, research D2).
- [X] T010 [US2] Record the V-2 evidence in `specs/003-auto-specify-naming/contracts/verification.md`: fill the `Date run`, `Node version`, `Tests / pass / fail` (must be `12 / 12 / 0`), and `Result` (`PASS`/`FAIL`) fields, and note the mapping from the suite's 12 checks to the C5 behaviors B-1…B-9 (run state machine, pause parsing, artifact gates, `--mode json -p --no-session --no-extensions` worker flags, resume prompt) — FR-005 requires these to be unchanged.
- [X] T011 [US2] If `pi` is available, run the `specs/003-auto-specify-naming/quickstart.md` step 7 smoke script against the renamed extension: install/update exactly as the README documents without editing those commands, then start one run with `/speckit-run <description>`, confirm the `speckit: <done>/5 <current>` progress line, let it reach a pause and resume only with `/speckit-answer <answer>`, confirm a second concurrent run is refused with `A speckit run is already active`, and optionally `/speckit-cancel` (terminal `cancelled`; `Nothing to cancel` when idle). Record the result in the V-4 table of `specs/003-auto-specify-naming/contracts/verification.md` with the observed status line quoted. If `pi` is unavailable, record this step as **not run** — never as passed (verification.md V-4). — **Recorded as NOT RUN** on 2026-09-15: `origin/main` still carries the pre-rename tree and an interactive pi TUI session cannot be driven here; see verification.md V-4 for the full reason. The task itself (recording the V-4 outcome, including an explicit not-run) is complete.

**Checkpoint**: The renamed extension loads, its checks pass 12/12, and operator-visible behavior is unchanged (SC-003, SC-004, FR-005, FR-006).

---

## Phase 5: User Story 3 - No stale old-name references remain (Priority: P2)

**Goal**: A recorded repository-wide search proves that every surviving old-name occurrence is confined to an exempt location, so no half-renamed operator-facing surface exists.

**Independent Test**: Search the operator-facing documentation and paths for the previous name. Confirm every current reference uses the new name and that all remaining hits are attributed to a historical record or to this feature's own change artifacts.

**Dependency note**: This story's pass condition requires T005 (the README path edits) to be complete; it does not depend on US2.

### Implementation for User Story 3

- [X] T012 [US3] Run both sweep commands from the repository root `E:/w/auto-specify/`: the repository-wide search `grep -rn "speckit-orchestrator" . --exclude-dir=.git -i`, and the focused operator-facing check `grep -rn "speckit-orchestrator" README.md extensions/ LICENSE 2>/dev/null`. The focused check must produce no output (verification.md V-1; INV-7, N-6).
- [X] T013 [US3] Classify every surviving line from the T012 repository-wide search against the exempt locations in `specs/003-auto-specify-naming/contracts/verification.md` V-1: `specs/001-speckit-orchestrator/**` (E-1, historical), `specs/002-extension-github-home/**` (E-2, historical), and `specs/003-auto-specify-naming/**` (E-3, this change record). Any hit in `README.md`, `extensions/**`, or any other path is an unattributed defect — fix that reference and re-run T012 until zero unattributed hits remain (rename-map.md R-4; INV-11; SC-001).
- [X] T014 [US3] Fill the V-1 evidence table in `specs/003-auto-specify-naming/contracts/verification.md`: `Date run`, the exact `grep` command, total matching lines, lines in `README.md` (required `0`), lines in `specs/001-*/`, lines in `specs/002-*/`, lines in `specs/003-*/`, unattributed hits (required `0`), and `Result` (`PASS`/`FAIL`). The historical counts must match the plan-time baseline (33 lines across 5 files in 001, 61 lines across 9 files in 002) and the README count must have gone from 4 to 0 (SC-001, SC-005).

**Checkpoint**: Every remaining old-name hit is individually attributed to an exempt location; zero operator-facing references remain (SC-001, FR-007).

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Confirm the change introduced nothing outside its declared scope.

- [X] T015 [P] Confirm the historical records are byte-identical in `E:/w/auto-specify/`: `git diff --stat -- specs/001-speckit-orchestrator specs/002-extension-github-home` must be empty (rename-map.md N-3, N-4; INV-10; FR-007). If it is not empty, revert those edits — history is immutable.
- [X] T016 [P] Confirm no new dependency, manifest, or build step was introduced anywhere in `E:/w/auto-specify/`: `git status --porcelain` must show only the rename of `extensions/speckit-orchestrator/` → `extensions/auto-specify/`, the four-line `README.md` change, and this feature's artifacts under `specs/003-auto-specify-naming/` — no `package.json`, lockfile, config, or build file added (FR-009; rename-map.md R-3; constitution V).
- [X] T017 Run the final review against the `specs/003-auto-specify-naming/quickstart.md` Done-criteria table and confirm all six criteria are checked: (1) new entry point exists and old path is absent, (2) README has zero old-name hits with install/update commands byte-identical, (3) pinned check reports 12/12/0, (4) every sweep hit is attributed, (5) no new dependency/manifest/build step, (6) operator-visible behavior verified or explicitly reported as not run. Report any failed criterion as a defect in `specs/003-auto-specify-naming/contracts/verification.md` — a half-renamed state is never a pass (data-model.md terminal states; SC-005).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup (T001/T002 baseline) — **BLOCKS all user stories**.
- **User Story 1 (Phase 3)**: Depends on Phase 2 (needs `extensions/auto-specify/` to exist).
- **User Story 2 (Phase 4)**: Depends on Phase 2 only — independently testable without the README edits, because the documented install command already names `auto-specify` and must stay byte-identical (N-1).
- **User Story 3 (Phase 5)**: Depends on Phase 2 and on T005 (README edits) for its pass condition.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Requires Phase 2. No dependency on US2 or US3.
- **US2 (P1)**: Requires Phase 2. No dependency on US1 or US3 (its checks run against the moved folder, and `run.test.js` does not read the README).
- **US3 (P2)**: Requires Phase 2 and US1's T005. The sweep is the completeness gate over US1's work.
- **Note**: US1 and US2 are both P1, and a rename that breaks the extension is not shippable — they are normally delivered in the same increment even though each is independently verifiable.

### Within Each User Story

- The move (T003) precedes all verification; T004 gates the move before any story work starts.
- US1: path edits (T005) → diff confinement (T006) → naming outcome (T007).
- US2: pinned check (T008) → manifest/completeness check (T009) → evidence (T010) → smoke run (T011).
- US3: sweep (T012) → classification (T013) → evidence (T014).
- Fix the move, never the check, whenever a verification fails.

### Parallel Opportunities

- Genuinely parallel in this feature: **T015 and T016** — two independent, read-only `git` checks in Phase 6.
- **Not parallel despite looking so**: T005's four README line edits all live in `README.md`, so they are one atomic substitution task, not four `[P]` tasks; T010, T011, and T014 all write into the single file `specs/003-auto-specify-naming/contracts/verification.md`, so they must be done in order.
- Once Phase 2 completes, US1 and US2 verification can be performed by two people at once (different surfaces: `README.md` vs `extensions/auto-specify/`).

---

## Parallel Example: Phase 6 Polish

```bash
# Launch both read-only scope checks together:
Task: "Confirm historical records are byte-identical: git diff --stat -- specs/001-speckit-orchestrator specs/002-extension-github-home"
Task: "Confirm no new dependency, manifest, or build step: git status --porcelain shows only the rename, the 4 README lines, and this feature's artifacts"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1: Setup — baseline green at the old path.
2. Complete Phase 2: Foundational — the single `git mv` (CRITICAL, blocks everything).
3. Complete Phase 3: User Story 1 — the four README path lines.
4. **STOP and VALIDATE**: as a newcomer, read `README.md` and list `extensions/` — both must read `auto-specify`.
5. Because both P1 stories ship together in practice, run Phase 4 immediately after: the rename is only shippable once `node --test extensions/auto-specify/run.test.js` reports 12/12/0.

### Incremental Delivery

1. Setup + Foundational → `extensions/auto-specify/` exists, byte-identical, old path gone.
2. US1 → README paths updated → newcomer-facing naming is consistent (SC-002).
3. US2 → pinned check 12/12/0 and unchanged behavior → the rename is safe to ship (SC-003, SC-004).
4. US3 → recorded sweep with zero unattributed hits → the rename is provably complete (SC-001, SC-005).
5. Polish → scope confined: history untouched, no new artifact or dependency.

### Parallel Team Strategy

This feature is too small to split productively (one directory move, one file's four lines, one evidence file). If staffed, split only the final checks: T015 and T016 in parallel. The expected total effort is minutes, not days — the value here is the audit trail, not parallelism.

---

## Notes

- `[P]` tasks = different files, no dependencies. Only T015/T016 qualify.
- `[Story]` labels map each task to a user story for traceability; Setup, Foundational, and Polish tasks carry no label.
- Exemption is by **location** only (E-1…E-3). "It is only a code comment" or "it is only an example" is never a valid excuse (rename-map.md R-4).
- No new tests are authored: the 12-check suite is reused from the renamed path, and the old-name sweep is the path-correctness evidence (research D6).
- Commit after each phase; the rename commit should be reviewable as `git mv` plus exactly four README lines.
- Never weaken a check to obtain a pass — fix the move. A half-renamed repository is not an accepted outcome.
