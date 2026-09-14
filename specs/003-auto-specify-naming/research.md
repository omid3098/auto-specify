# Phase 0 Research: Auto-Specify Naming Alignment

**Feature**: `003-auto-specify-naming` | **Date**: 2026-09-15
**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

All Technical Context unknowns are resolved below. No `NEEDS CLARIFICATION` markers remain: the five
open questions were answered in the spec's Clarifications session on 2026-09-15.

---

## D1. Rename mechanism and history preservation

**Decision**: Move the directory with `git mv extensions/speckit-orchestrator extensions/auto-specify`,
keeping all five files (`index.ts`, `run.ts`, `gates.ts`, `spawn.ts`, `run.test.js`) in place
relative to each other. No file content inside the folder changes.

**Rationale**: Every import in the folder is relative (`./run.ts`, `./gates.ts`, `./spawn.ts`) and
the test file requires its siblings relatively (`./run.ts`, `./gates.ts`, `./spawn.ts`, `./index.ts`),
so a directory-level move is sufficient and touches zero lines of code. `git mv` records the rename
so `git log --follow` still works, which matters for a pure naming change reviewers must be able to
verify as content-neutral. On the Windows development host, `git mv` (rather than `mv`) also avoids
case/casing edge cases in the index.

**Alternatives considered**:
- *Copy to the new path and delete the old* — works but breaks history continuity and doubles the diff
  for no benefit; rejected.
- *Rename and rewrite imports to `extensions/auto-specify/...` absolute paths* — unnecessary, since all
  imports are relative; would add churn and a new coupling to the folder name; rejected.
- *Keep both folders (old as alias/redirect)* — creates exactly the two-names-for-one-product state the
  feature exists to remove; rejected by FR-007 and constitution V.

**Verified**: `grep -rn` over the extension folder shows no self-referential path strings — only
relative module specifiers and one `ponytail:` comment. Nothing to edit inside the moved files.

---

## D2. Extension discovery survives the rename

**Decision**: Rely on pi's conventional repo-root `extensions/` discovery; the renamed folder keeps
`index.ts` as its entry point and needs no manifest.

**Rationale**: pi's loader resolves a directory under the conventional `extensions/` root by checking
for a `package.json` `pi.extensions` manifest first, then falling back to `index.ts`, then `index.js`
(`resolveExtensionEntries` in the installed pi distribution,
`dist/core/extensions/loader.js`). The renamed folder has no `package.json`, so `extensions/auto-specify/index.ts`
is still resolved and loaded. `run.test.js` sits beside it and is still not collected, because only the
resolved entry point is registered. This satisfies FR-006 with zero added files.

**Alternatives considered**:
- *Add a `package.json` with `pi.extensions` to pin the payload* — would add a new manifest, which
  FR-009 explicitly forbids and constitution V discourages; rejected.
- *Flatten the extension to a single root file* — a larger refactor than a rename and would change the
  shipped layout; rejected.

**Verified against**: pi distribution `dist/core/extensions/loader.js` (`resolveExtensionEntries`),
plus the same finding recorded in `specs/002-extension-github-home/research.md` D1.

---

## D3. Scope of the old-name sweep: what is operator-facing vs. exempt

**Decision**: Update only `README.md` (4 hits). Treat `specs/001-speckit-orchestrator/**` and
`specs/002-extension-github-home/**` as immutable historical records, and treat this feature's own
artifacts (`plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/**`, `tasks.md`) as
exempt by definition, since they must be able to name the folder being renamed.

**Rationale**: At plan time a repository-wide case-insensitive search for `speckit-orchestrator`
returns 124 matching lines in 15 files: 4 lines in `README.md`, 33 lines across the 5 files of
`specs/001-speckit-orchestrator/`, 61 lines across the 9 files of
`specs/002-extension-github-home/`, and the rest in this feature's own artifacts (a count that keeps
rising as this change record is written, which is why it is exempt rather than pinned). FR-007 and
the spec's Assumptions make the historical records out of scope, and
the Clarifications session explicitly exempted this feature's own artifacts. The README is the only
current, operator-facing surface that names the folder.

**Alternatives considered**:
- *Rewrite the historical specs too* — would falsify the record of what was built and shipped under
  the old name (for example `specs/002-extension-github-home/contracts/package-layout.md` asserts the
  old path as a guarantee); rejected.
- *Exempt the README's install-command line as well* — the install command
  (`pi install git:github.com/omid3098/auto-specify`) already contains no old name and must stay
  byte-identical per FR-003/FR-008; only the four repo-relative path lines change.
- *Add a redirect or alias doc* — a half-renamed surface; rejected under FR-007.

---

## D4. Evidence recording for SC-001 / SC-005

**Decision**: Record the verification as two reproducible commands in [quickstart.md](./quickstart.md):
(1) the repository-wide old-name search and its hit classification, and (2) the pinned extension check
`node --test extensions/auto-specify/run.test.js`. The search classifies each remaining hit by exempt
location (historical record vs. this feature's artifacts) so the "100% of operator-facing references"
claim is auditable.

**Rationale**: SC-001 requires "a recorded repository-wide search ... in which every remaining hit is
individually listed and attributed", and SC-005 requires "the same recorded-search evidence". Because
this feature's artifacts are themselves exempt, the recorded evidence necessarily lives inside an
exempt artifact — `quickstart.md` is the natural place, and it doubles as the run guide. No separate
evidence file is created (constitution V), and no per-line evidence dump is committed: the search
command plus the classified file list is sufficient to re-derive the result at review time.

**Alternatives considered**:
- *Commit a generated evidence file (e.g. `old-name-hits.txt`)* — a new, non-Spec-Kit artifact that
  goes stale the moment anything else in the repo changes; rejected as speculative.
- *Leave `spec.md` as the only record of the count* — the spec was written before the change and
  cannot attest to the post-change state; rejected.

**Verified**: the search command and the historical/README counts are exactly reproducible at plan
time (`grep -rn "speckit-orchestrator" . --exclude-dir=.git -i` → 124 matching lines, 15 files;
README alone → 4 lines), which is what makes the post-change comparison meaningful. The
feature-003 count is deliberately not pinned, because writing the evidence changes it.

---

## D5. Documentation edits and byte-identical operator commands

**Decision**: Change exactly the four README lines that contain the old folder name, replacing
`extensions/speckit-orchestrator` with `extensions/auto-specify`; leave every other line — including
the whole Install section code block — untouched.

**Rationale**: FR-002 and FR-003 require the new name in every repo-relative path reference while the
documented install and update commands stay byte-identical. The four lines are:
the blockquote callout, the "What gets installed" code fence, the entry-point bullet, and the test
command. All four are path references, not prose; the surrounding words (including "orchestrator" as a
role description) stay, per the Clarifications answer that only the literal name and path are renamed.
The README's `# auto-specify` title and `pi install git:github.com/omid3098/auto-specify` line already
carry the correct name and are not edited.

**Alternatives considered**:
- *Regenerate or restructure the README* — out of scope, larger diff, and risks altering the pinned
  install/update wording; rejected.
- *Find-and-replace the word "orchestrator" throughout* — explicitly out of scope per FR-002/FR-007;
  rejected.

---

## D6. Post-rename verification: pinned test

**Decision**: The behavioral check after the rename is exactly
`node --test extensions/auto-specify/run.test.js`, and it must report **pass 12 / fail 0**.

**Rationale**: SC-003 pins this command and count, and the Clarifications session confirmed it. The
suite already covers the run state machine, pause parsing, artifact gates, worker isolation flags, and
the resume prompt — the operator-visible behaviors FR-005 says must not change. Because the test file
moves with the folder and uses relative requires, running it from the new path is a genuine proof that
the renamed location loads its modules. Verified at plan time against the pre-rename path:
`tests 12 / pass 12 / fail 0` on Node v24.15.0.

**Alternatives considered**:
- *Rely on the relative wording "checks pass from the renamed location"* — rejected; the Clarifications
  session pinned the exact command and count.
- *Add new tests for the rename itself (e.g. assert the path)* — the feature adds no behavior to test,
  and a test that asserts a string literal in the README would be a brittle, self-referential artifact;
  rejected under constitution V. The search evidence in D4 covers path correctness.

---

## D7. No new dependency, manifest, or build step

**Decision**: The change adds no file, dependency, manifest, or build step anywhere.

**Rationale**: FR-009 forbids them, and the existing setup needs none: Node ≥ 22.6 strips TypeScript
types at load time, the extension imports only `@earendil-works/pi-coding-agent` types plus Node
built-ins, and pi discovers the folder without a manifest (D2). Confirmed at plan time: no
`package.json` exists anywhere in the repository, and the checks run with `node --test` alone.

**Alternatives considered**: any — all rejected by FR-009 and constitution V; see D2's alternatives.

---

## Resolved Technical Context

| Item | Resolution |
|------|------------|
| Language/Version | TypeScript via Node type stripping; Node ≥ 22.6, verified v24.15.0 |
| Primary Dependencies | `@earendil-works/pi-coding-agent` (types only) + Node built-ins; none added (D7) |
| Storage | Filesystem paths only; in-memory run state unchanged |
| Testing | `node --test extensions/auto-specify/run.test.js` → pass 12 / fail 0 (D6) |
| Target Platform | pi CLI extension via conventional root `extensions/` discovery (D2) |
| Project Type | Single project — pi extension package at repository root |
| Performance Goals | None introduced; pure rename |
| Constraints | No new dep/manifest/build (D7); install/update commands byte-identical (D5) |
| Scale/Scope | 1 directory move (5 files, 805 LOC) + 4 README lines; 124 old-name lines to classify, 4 of them operator-facing (D3) |
