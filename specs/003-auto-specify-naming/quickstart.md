# Quickstart: Auto-Specify Naming Alignment

**Feature**: `003-auto-specify-naming` | **Date**: 2026-09-15
**Contracts**: [rename-map.md](./contracts/rename-map.md) · [verification.md](./contracts/verification.md)
**Model**: [data-model.md](./data-model.md)

Runnable guide to apply the rename and prove it stuck. Run every command from the repository root.
This is a validation/run guide only — the normative rules live in the contracts above.

---

## Prerequisites

| Requirement | Check | Expected |
|-------------|-------|----------|
| Repository checkout on this feature's branch | `git branch --show-current` | `003-auto-specify-naming` |
| Node ≥ 22.6 (type stripping) | `node --version` | e.g. `v24.15.0`; must be ≥ 22.6 |
| `git` available (rename with history) | `git --version` | any recent version |
| `pi` CLI only for the optional smoke run | `pi --version` | present, or skip step 7 |

---

## Step 1 — Baseline (optional but recommended)

Confirm the checks pass before the move, so any later failure is attributable to the rename.

```bash
node --test extensions/speckit-orchestrator/run.test.js
```

**Expected**: `tests 12 / pass 12 / fail 0`.

Optionally capture the old-name baseline for later comparison (the numbers to expect are recorded in
[verification.md](./contracts/verification.md) V-1):

```bash
grep -rn "speckit-orchestrator" . --exclude-dir=.git -i | wc -l
```

**Expected at plan time**: `124` matching lines, 4 of them in `README.md`.

---

## Step 2 — Rename the extension directory

One directory move, no content edits inside it (rename-map.md R-1):

```bash
git mv extensions/speckit-orchestrator extensions/auto-specify
```

**Expected**: `git status` shows the five files as renames (`index.ts`, `run.ts`, `gates.ts`,
`spawn.ts`, `run.test.js`), and `git diff --stat` reports no content change inside the folder.

---

## Step 3 — Update the four README path references

Edit only these four lines in `README.md`, replacing `extensions/speckit-orchestrator` with
`extensions/auto-specify` and changing nothing else (rename-map.md C2, R-2):

1. the blockquote callout near the top (D-1);
2. the code fence under "What gets installed" (D-2);
3. the entry-point bullet that names `index.ts` (D-3);
4. the test command in the Tests section (D-4).

Do **not** touch the install/update lines (`pi install …`, `pi update --extensions`, `pi list`), the
historical feature records, or the word "orchestrator" where it describes a role (rename-map.md C3,
N-1…N-7).

**Expected after the edits**: `grep -c "extensions/auto-specify" README.md` prints at least `4`, and
`grep -n "speckit-orchestrator" README.md` prints nothing.

---

## Step 4 — Structural checks

```bash
test -f extensions/auto-specify/index.ts && echo "entry point OK"
test ! -e extensions/speckit-orchestrator && echo "old path gone"
test ! -e extensions/auto-specify/package.json && echo "no manifest added"
```

**Expected**: all three messages print. Any missing message means the move is incomplete or a
manifest crept in (rename-map.md R-1, R-3; FR-009).

Confirm history was not rewritten and the docs diff is confined:

```bash
git diff --stat -- specs/001-speckit-orchestrator specs/002-extension-github-home   # expect: empty
git diff -- README.md                                                               # expect: only the 4 path lines
```

---

## Step 5 — Pinned extension check

This is the behavior proof for the renamed location (verification.md V-2; SC-003):

```bash
node --test extensions/auto-specify/run.test.js
```

**Expected**:

```text
ℹ tests 12
ℹ pass 12
ℹ fail 0
```

The suite loads `./run.ts`, `./gates.ts`, `./spawn.ts`, and `./index.ts` relatively, so a green run
here proves the renamed folder's entry point and modules resolve. Any `fail` or a load error means the
move broke an import — fix the move, do not weaken the check (FR-004, FR-005).

---

## Step 6 — Recorded old-name sweep

Run the repository-wide search and classify every remaining hit (verification.md V-1; SC-001, SC-005):

```bash
grep -rn "speckit-orchestrator" . --exclude-dir=.git -i
```

**Expected**: every printed line is inside one of the three exempt locations —
`specs/001-speckit-orchestrator/`, `specs/002-extension-github-home/`, or
`specs/003-auto-specify-naming/` (this change record). Zero lines in `README.md`, `extensions/`, or
anywhere else.

Focused operator-facing check (must produce no output):

```bash
grep -rn "speckit-orchestrator" README.md extensions/ LICENSE 2>/dev/null
```

Record the result in the evidence table in [verification.md](./contracts/verification.md) V-1: the
total line count, the count per exempt location, zero unattributed hits, and `PASS`/`FAIL`.

---

## Step 7 — Optional smoke run (operator-visible behavior)

Only if `pi` is available. This confirms SC-004/FR-005 beyond the unit checks.

1. Install/update exactly as the README documents (no edits to those commands):
   `pi install git:github.com/omid3098/auto-specify`, then `pi update --extensions`, then `pi list`.
   **Expected**: exactly one entry, under the new name.
2. Restart pi so the extension loads, then start one run: `/speckit-run <a short feature description>`.
   **Expected**: the pipeline advances and the status line reports progress
   (`speckit: <done>/5 <current>`), with no error about a missing extension.
3. Let it reach a pause, then reply only with `/speckit-answer <answer>`.
   **Expected**: `speckit: paused (<step>) — question i/n` is shown, and only the answer command
   resumes the run.
4. Start a second run while the first is active.
   **Expected**: refused with `A speckit run is already active`.
5. Optionally `/speckit-cancel`.
   **Expected**: terminal `speckit: cancelled`, and `Nothing to cancel` when no run is active.

**Expected overall**: every command name, progress string, pause/answer rule, and the
one-run-per-session rule behave exactly as before the rename, with zero manual fix-ups beyond the
documented steps (SC-004, SC-005). If `pi` is unavailable, report this step as *not run*, not as
passed.

---

## Done criteria

| # | Criterion | Where proved |
|---|-----------|--------------|
| 1 | `extensions/auto-specify/index.ts` exists; old path absent | Step 4 |
| 2 | README has zero old-name hits; install/update commands byte-identical | Steps 3, 4 |
| 3 | `node --test extensions/auto-specify/run.test.js` → pass 12 / fail 0 | Step 5 |
| 4 | Repository-wide search leaves only exempt hits, each attributed | Step 6 |
| 5 | No new dependency, manifest, or build step | Step 4 |
| 6 | Operator-visible behavior unchanged | Step 7 (or explicitly reported as not run) |

A half-renamed state is never a pass: if any criterion fails, the change is `incomplete`
(data-model.md state transition rules).
