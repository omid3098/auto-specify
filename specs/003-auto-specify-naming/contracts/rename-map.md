# Contract: Rename Map and Reference Rules

**Feature**: `003-auto-specify-naming` | **Date**: 2026-09-15
**Owner artifact**: this feature's change record (exempt from the old-name rule)

This contract defines exactly what changes, what must not change, and which old-name occurrences are
legal. It is the normative reference for the implementation and the review.

---

## C1. Path mapping (the only rename)

| # | From | To | Kind | Requirement |
|---|------|----|------|-------------|
| M-1 | `extensions/speckit-orchestrator/` (directory) | `extensions/auto-specify/` | directory move | FR-001, FR-006 |
| M-2 | `extensions/speckit-orchestrator/index.ts` | `extensions/auto-specify/index.ts` | moved file, bytes unchanged | FR-004, FR-006 |
| M-3 | `extensions/speckit-orchestrator/run.ts` | `extensions/auto-specify/run.ts` | moved file, bytes unchanged | FR-004 |
| M-4 | `extensions/speckit-orchestrator/gates.ts` | `extensions/auto-specify/gates.ts` | moved file, bytes unchanged | FR-004 |
| M-5 | `extensions/speckit-orchestrator/spawn.ts` | `extensions/auto-specify/spawn.ts` | moved file, bytes unchanged | FR-004 |
| M-6 | `extensions/speckit-orchestrator/run.test.js` | `extensions/auto-specify/run.test.js` | moved file, bytes unchanged | FR-004, SC-003 |

**Rule R-1**: The move is one `git mv` of the directory. No file is added, removed, or edited within
the moved set; no alias, symlink, or copy is left behind (FR-007, FR-009).

## C2. Documentation mapping (the only content edits)

Exactly four lines in `README.md` change. In each, the substring
`extensions/speckit-orchestrator` becomes `extensions/auto-specify`; nothing else on the line changes.

| # | README location | Role |
|---|-----------------|------|
| D-1 | blockquote callout ("install the `extensions/…` folder from GitHub") | path reference |
| D-2 | "What gets installed" code fence first line | path reference |
| D-3 | entry-point bullet ("loads `extensions/…/index.ts`") | path reference |
| D-4 | Tests section command ("`node --test extensions/…/run.test.js`") | path reference, pinned by SC-003 |

**Rule R-2**: The change is strictly a path substitution on these four lines — no rewording, no
restructuring, no added or removed lines (FR-002, FR-003).

## C3. MUST-NOT-CHANGE set (byte-identical after the change)

| # | Surface | Why |
|---|---------|-----|
| N-1 | README `pi install git:github.com/omid3098/auto-specify` line | FR-003, FR-008 — install source and wording |
| N-2 | README `pi update --extensions` and `pi list` lines, and their order | FR-003, FR-008 — update command and sequence |
| N-3 | Every file under `specs/001-speckit-orchestrator/` | FR-007 — historical record |
| N-4 | Every file under `specs/002-extension-github-home/` | FR-007 — historical record |
| N-5 | All five extension source files' contents | Assumptions — pure naming change |
| N-6 | `LICENSE` | out of scope |
| N-7 | Any use of "orchestrator" as a role description in README prose | FR-002, FR-007 — not the extension name |

**Rule R-3**: No new file, `package.json`, manifest, dependency, or build step is added anywhere
(FR-009). In particular the renamed folder still has no manifest.

## C4. Legal old-name occurrences (exemption by location)

| # | Location | Legal? | Basis |
|---|----------|--------|-------|
| E-1 | `specs/001-speckit-orchestrator/**` | Yes | historical record (FR-007, US3 AS2) |
| E-2 | `specs/002-extension-github-home/**` | Yes | historical record (FR-007, US3 AS2) |
| E-3 | `specs/003-auto-specify-naming/plan.md`, `tasks.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/**`, `spec.md`, `checklists/**` | Yes | this feature's own change record (FR-007; Clarifications 2026-09-15) |
| E-4 | Any other path in the repository | **No** | defect: a current operator-facing reference survived (FR-007, SC-001) |

**Rule R-4**: Exemption is decided by file location under E-1/E-2/E-3 only. Content-based excuses
("it is only in a code comment", "it is only an example") are not valid.

## C5. Behavioral invariance (contract with the operator)

The rename MUST NOT alter any of the following (FR-005). Each is already covered by a check in
`run.test.js`; the pinned command is in [verification.md](./verification.md).

| # | Behavior | Contract |
|---|----------|----------|
| B-1 | Start one run with `/speckit-run <description>` | accepted, drives specify → clarify → plan → tasks → implement |
| B-2 | At most one active run per session | second start refused with `A speckit run is already active` |
| B-3 | Pause only for named questions | `speckit: paused (<step>) — question i/n` plus the answer hint |
| B-4 | Resume only via `/speckit-answer <answer>` | unrelated chat text does not resume |
| B-5 | Cancel via `/speckit-cancel` | terminal `cancelled`; `Nothing to cancel` when idle |
| B-6 | Always-on progress | status line reports step/progress without being asked |
| B-7 | Isolated workers | each step spawns its own process with `--mode json -p --no-session --no-extensions` |
| B-8 | Artifact gates | missing artifact fails the run at that step (`missing plan.md` etc.) |
| B-9 | Session-only state | runs do not survive a session restart |

**Rule R-5**: Any diff that changes a command name, a status string, a gate, a spawn flag, or a
pause/resume rule violates this contract and blocks the change.

## C6. Acceptance checks for this contract

| Check | Command | Pass condition |
|-------|---------|----------------|
| Rename applied | `test -f extensions/auto-specify/index.ts` | file exists |
| Old path gone | `test ! -e extensions/speckit-orchestrator` | path absent |
| README updated | `grep -c "extensions/auto-specify" README.md` | ≥ 4 |
| README clean | `grep -rn "speckit-orchestrator" README.md` | no output |
| No manifest added | `test ! -e extensions/auto-specify/package.json` | absent |
| Behaviors intact | [verification.md](./verification.md) V-2 | pass 12 / fail 0 |
