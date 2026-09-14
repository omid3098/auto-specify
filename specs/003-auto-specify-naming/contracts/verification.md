# Contract: Verification Evidence

**Feature**: `003-auto-specify-naming` | **Date**: 2026-09-15
**Owner artifact**: this feature's change record (exempt from the old-name rule)
**Companion**: [rename-map.md](./rename-map.md) defines what changes; this file defines how it is proved.

Two independent checks must pass. Together they are the acceptance gate for SC-001, SC-003, and
SC-005; the runnable form of both lives in [quickstart.md](../quickstart.md).

---

## Run conditions (recorded 2026-09-15)

| Item | Observed |
|------|----------|
| Host / shell | Windows development host, POSIX-capable shell, from repository root `E:/w/auto-specify/` |
| Node version | `v24.15.0` (≥ 22.6 required for type stripping) |
| git version | `2.52.0.windows.1` |
| Branch checked out | `main` — **environment discrepancy**: the quickstart expects `003-auto-specify-naming`. The rename was executed on `main` as instructed (no branch was created or switched); the change is uncommitted in the working tree and is fully captured by `git status`/`git diff`. |
| Working tree before the change | only `specs/003-auto-specify-naming/` untracked; `extensions/speckit-orchestrator/` unmodified |
| Pre-change baseline | `node --test extensions/speckit-orchestrator/run.test.js` → `tests 12 / pass 12 / fail 0`; `grep -n "speckit-orchestrator" README.md` → exactly 4 hits on lines 8, 16, 20, 94 |

---

## V-1. Recorded repository-wide search (SC-001, SC-005)

**Command (run from the repository root, after the rename and README edits):**

```bash
grep -rn "speckit-orchestrator" . --exclude-dir=.git -i
```

**Search scope**: the entire working tree (`-i` = case-insensitive), excluding `.git`. This is the
same command used at plan time, so the before/after comparison is apples-to-apples.

**Pass condition**: every surviving matching line is attributable to exactly one exempt location:

| Exempt location | Basis |
|-----------------|-------|
| `specs/001-speckit-orchestrator/**` | historical record of earlier work (FR-007) |
| `specs/002-extension-github-home/**` | historical record of earlier work (FR-007) |
| `specs/003-auto-specify-naming/**` | this feature's own change record (FR-007; Clarifications 2026-09-15) |

**Fail condition**: any matching line anywhere else — in particular any line in `README.md`, in
`extensions/**`, or in any file outside `specs/001-*/`, `specs/002-*/`, `specs/003-*/` — is an
unattributed hit and a defect. A half-renamed repository is not an accepted outcome.

**Focused companion check (must be empty):**

```bash
grep -rn "speckit-orchestrator" README.md extensions/ LICENSE 2>/dev/null
```

**Expected**: no output. This is the operator-facing subset of V-1 and is the check a reviewer runs
first, because `README.md` is the only current surface that names the extension (FR-007, SC-002).

**Evidence record (fill in at verification time):**

| Field | Value |
|-------|-------|
| Date run | `2026-09-15` |
| Command | `grep -rn "speckit-orchestrator" . --exclude-dir=.git -i` |
| Total matching lines | `150` (in 22 files) |
| Lines in `README.md` | `0` (required — was 4 at plan time, now zero) |
| Lines in `specs/001-*/` | `33` across 5 files (all historical, expected — unchanged from plan-time baseline) |
| Lines in `specs/002-*/` | `61` across 9 files (all historical, expected — unchanged from plan-time baseline) |
| Lines in `specs/003-*/` | `56` across 8 files (this change record, exempt; not pinned — this count grows as the record is written) |
| Unattributed hits | `0` (required) |
| Result | `PASS` |

**Classification of every surviving line (T013)**: each of the 150 matching lines falls inside
exactly one exempt location, so no hit is unattributed.

| Exempt location | Lines | Files | Basis |
|-----------------|-------|-------|-------|
| `specs/001-speckit-orchestrator/**` | 33 | 5 (`plan.md`, `quickstart.md`, `research.md`, `spec.md`, `tasks.md`) | E-1, historical record (FR-007) |
| `specs/002-extension-github-home/**` | 61 | 9 (`checklists/requirements.md`, `contracts/operator-commands.md`, `contracts/package-layout.md`, `data-model.md`, `plan.md`, `quickstart.md`, `research.md`, `spec.md`, `tasks.md`) | E-2, historical record (FR-007) |
| `specs/003-auto-specify-naming/**` | 56 | 8 (`contracts/rename-map.md`, `contracts/verification.md`, `data-model.md`, `plan.md`, `quickstart.md`, `research.md`, `spec.md`, `tasks.md`) | E-3, this change record (FR-007) |

**Focused companion check**: `grep -rn "speckit-orchestrator" README.md extensions/ LICENSE 2>/dev/null`
produced **no output** (exit status 1) — zero operator-facing old-name references remain (INV-7, N-6).

**Before/after comparison**: total 124 → 150 because this change record grew; `README.md` 4 → 0;
`specs/001-*/` 33 → 33 and `specs/002-*/` 61 → 61 (history untouched).

**Moving-number note**: `150` / `56` are the values observed when the sweep was run (T012).
Recording this evidence adds exempt hits inside `specs/003-*/`, so a re-run of the same command while
reviewing this file reports `158`. Only four fields are stable and normative: `README.md` = `0`,
`specs/001-*/` = `33`, `specs/002-*/` = `61`, and unattributed = `0`. This is exactly why the
feature-003 count is exempt rather than pinned.

**Baseline for comparison (captured at plan time, 2026-09-15):** 124 matching lines in 15 files —
4 in `README.md`, 33 across 5 files in `specs/001-speckit-orchestrator/`, 61 across 9 files in
`specs/002-extension-github-home/`, remainder in this feature's artifacts. The `README.md` count must
go from 4 to 0; the two historical counts must be unchanged; this feature's count is not pinned.

---

## V-2. Pinned extension check (SC-003, FR-004)

**Command (pinned by SC-003 and the Clarifications session; must not be substituted):**

```bash
node --test extensions/auto-specify/run.test.js
```

**Pass condition**: the reporter prints exactly

```text
ℹ tests 12
ℹ pass 12
ℹ fail 0
```

**Failure handling**: any `fail > 0`, any suite-loading error, or a missing-file error means the
renamed location does not load correctly (INV-6) and the change is incomplete — for example if a
relative import or the entry-point path did not survive the move. Do not weaken the check to make it
pass; fix the move instead.

**Why this command proves the rename worked**: the test file requires its siblings relatively
(`./run.ts`, `./gates.ts`, `./spawn.ts`, `./index.ts`) and imports `buildPrompt` from the extension
entry point. Running it from the new path therefore exercises the renamed folder's real entry point
and all moved modules, not just a copy. It also re-proves the B-1…B-9 behaviors in
[rename-map.md](./rename-map.md) C5, which FR-005 requires to be unchanged.

**Baseline**: the same command at the old path (`extensions/speckit-orchestrator/run.test.js`)
reported `tests 12 / pass 12 / fail 0` on Node v24.15.0 at plan time. The count must be identical.

| Field | Value |
|-------|-------|
| Date run | `2026-09-15` |
| Node version | `v24.15.0` |
| Tests / pass / fail | `12` / `12` / `0` — required `12 / 12 / 0` |
| Result | `PASS` |

**Check-to-behavior mapping (FR-005)**: the 12 checks in the suite map to the C5 contract behaviors as
follows — run state machine (B-1 start, B-9 session-only state), pause parsing (B-3 named questions,
B-4 answer-only resume, B-5 empty-question failure), artifact gates (B-8 `missing plan.md`-style
failures), spawn flags (B-7 `--mode json -p --no-session --no-extensions`), resume prompt (B-4 does not
re-send the skill). The count and the pass/fail outcome are identical to the pre-rename baseline at
the old path (`extensions/speckit-orchestrator/run.test.js` → 12/12/0), so B-1…B-9 are unchanged.

---

## V-3. Supporting structural checks

Cheap structural confirmations, run alongside V-1/V-2. Full command list is in
[rename-map.md](./rename-map.md) C6.

| # | Check | Expected |
|---|-------|----------|
| V-3.1 | `test -f extensions/auto-specify/index.ts` | exit 0 |
| V-3.2 | `test ! -e extensions/speckit-orchestrator` | exit 0 (old path fully gone) |
| V-3.3 | `test ! -e extensions/auto-specify/package.json` | exit 0 (no manifest added, FR-009) |
| V-3.4 | `git diff --stat` on the moved files | shows rename-only, no content diff in `extensions/**` |
| V-3.5 | `git diff --stat -- specs/001-speckit-orchestrator specs/002-extension-github-home` | empty (history untouched) |
| V-3.6 | README install/update lines unchanged | `git diff -- README.md` touches only the 4 path lines (D-1…D-4) |

**Observed (2026-09-15)**:

| # | Command run | Observed | Result |
|---|-------------|----------|--------|
| V-3.1 | `test -f extensions/auto-specify/index.ts` | exit 0 (`entry point OK`) | PASS |
| V-3.2 | `test ! -e extensions/speckit-orchestrator` | exit 0 (`old path gone`) | PASS |
| V-3.3 | `test ! -e extensions/auto-specify/package.json` | exit 0 (`no manifest OK`) | PASS |
| V-3.4 | `git diff --cached -M --stat -- extensions/` | rename-only: 5 renames, 100% similarity, `0` insertions / `0` deletions; the renamed folder contains exactly the 5 moved files and no other | PASS |
| V-3.5 | `git diff --stat -- specs/001-speckit-orchestrator specs/002-extension-github-home` | empty | PASS |
| V-3.6 | `git diff -- README.md` | exactly 4 changed lines (8, 16, 20, 94); the `pi install`, `pi update --extensions`, and `pi list` lines are untouched and byte-identical (N-1, N-2) | PASS |

**Note on V-3.4**: the move was staged by `git mv`, so the rename pair is visible under
`git diff --cached`; `git status --porcelain` reports the five files as `R` (rename) entries.

---

## V-4. Operator-visible behavior (SC-004, FR-005)

Behavior cannot be fully proved by the unit checks alone, so the verification includes one manual
smoke run. This is a run guide, not a new test suite; the detailed script is in
[quickstart.md](../quickstart.md) step 5.

| Field | Value |
|-------|-------|
| Prerequisite | pi CLI available (`pi --version`), install/update run exactly as README documents |
| Action | start one run with `/speckit-run <description>`, let it reach a pause, answer with `/speckit-answer`, or cancel with `/speckit-cancel` |
| Pass condition | same commands, same progress strings, same pause/answer/cancel behavior, same one-run-per-session rule as before the rename — zero new manual fix-ups (SC-005) |
| Result | **NOT RUN** — see the reason below; not reported as passed |

**Reason (recorded 2026-09-15)**: the `pi` CLI is present (`pi --version` → `0.85.1`), but the smoke
script could not be executed as specified against this change, so per the note below it is reported as
not run rather than as passed:

1. The script's install command is pinned byte-identical to the README
   (`pi install git:github.com/omid3098/auto-specify`). That command resolves the **remote default
   branch**, and `git ls-tree -d --name-only origin/main:extensions` still reports
   `speckit-orchestrator` — the remote does not contain this rename, which is uncommitted and
   unpushed. Installing it would exercise the pre-rename tree and prove nothing about the local
   change.
2. The script requires an interactive pi TUI session (`/speckit-run`, waiting for a pause, then
   `/speckit-answer`), which cannot be driven from this non-interactive verification run.
3. Substituting `pi install ./local/path` would deviate from the documented command and would add a
   third-party extension to the operator's global pi settings, a side effect unrelated to proving the
   rename.

Nothing in V-4 was relaxed: the operator-visible surface is left to re-verification after the rename
is committed and pushed. V-1, V-2, and V-3 together are the recorded evidence for this change.

**Note**: if a full smoke run is impractical in the verification environment, V-2 plus V-1 is the
minimum recorded evidence; the smoke run must then be reported as not run rather than as passed.

---

## Final review against quickstart Done criteria (T017)

Reviewed 2026-09-15 against the six criteria in [quickstart.md](../quickstart.md).

| # | Criterion | Evidence | Status |
|---|-----------|----------|--------|
| 1 | `extensions/auto-specify/index.ts` exists; old path absent | V-3.1, V-3.2 | ✅ checked |
| 2 | README has zero old-name hits; install/update commands byte-identical | V-1 focused check; V-3.6 (`pi install`, `pi update --extensions`, `pi list` identical in `HEAD` and working tree) | ✅ checked |
| 3 | `node --test extensions/auto-specify/run.test.js` → pass 12 / fail 0 | V-2 (`12 / 12 / 0`) | ✅ checked |
| 4 | Repository-wide search leaves only exempt hits, each attributed | V-1 classification table (0 unattributed) | ✅ checked |
| 5 | No new dependency, manifest, or build step | V-3.3; `git status --porcelain` shows only the 5 renames, the `README.md` edit, and this feature's artifacts; no `package.json` exists anywhere in the repository | ✅ checked |
| 6 | Operator-visible behavior unchanged | V-2 (12/12/0, B-1…B-9 mapping); V-4 explicitly reported **not run**, per the criterion's own allowance | ✅ checked (V-4 not run) |

**No failed criterion, so no defect is recorded.** The one open item is deliberate and allowed by
criterion 6: the V-4 smoke run is not run against the pre-rename remote and must be re-run after this
rename is committed and pushed. V-1 and V-2 both PASS and every V-3 row is checked, so the change
state is `renamed-and-verified` in the local working tree, never `incomplete`.

---

## Reporting rule

The change is complete only when V-1 and V-2 both PASS and every V-3 row is checked. Any FAIL is
reported as a defect; no check may be waived, skipped, or reworded to obtain a pass (SC-001, SC-005).
