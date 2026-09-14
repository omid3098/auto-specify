# Data Model: Auto-Specify Naming Alignment

**Feature**: `003-auto-specify-naming` | **Date**: 2026-09-15
**Input**: [spec.md](./spec.md) Key Entities, [plan.md](./plan.md), [research.md](./research.md)

This feature has no runtime data. The "entities" are the repository's naming and path facts, and the
only state transition is the rename itself. Fields below are what a reviewer can check on disk.

---

## E1. Product Name

The single name used for the extension, the repository, and the install target.

| Field | Type | Value | Validation |
|-------|------|-------|------------|
| `name` | string | `auto-specify` | Exactly this literal; matches the GitHub project name (FR-001) |
| `reference_source` | string | GitHub project name | The reference value; it is NOT renamed by this feature (Assumptions) |
| `surfaces` | set | extension directory name, README references, install command target | Every surface reads `auto-specify` (FR-001, FR-002) |

**Invariants**

- **INV-1**: The extension directory name equals `auto-specify` (FR-001).
- **INV-2**: The README's install and update commands already name `auto-specify` and MUST remain
  byte-identical (FR-003, FR-008) — verified by SC-005 (no manual fix-ups).
- **INV-3**: No second name for the extension exists in any current, operator-facing surface (FR-007).

**Out of scope for this entity**: the word "orchestrator" used as a role description is not a product
name and is not renamed (FR-002, FR-007; Clarifications).

---

## E2. Extension Location

The repository-relative directory holding the installable pi extension.

| Field | Type | Before | After | Validation |
|-------|------|--------|-------|------------|
| `path` | path | `extensions/speckit-orchestrator/` | `extensions/auto-specify/` | The `After` value is the only allowed current value (FR-001) |
| `entry_point` | path | `<path>/index.ts` | `extensions/auto-specify/index.ts` | Resolved by pi's conventional `extensions/` scan without a manifest (FR-006) |
| `modules` | set | `run.ts`, `gates.ts`, `spawn.ts` | unchanged names, new parent | Relative imports mean no content change (research D1) |
| `test_entry` | path | `<path>/run.test.js` | `extensions/auto-specify/run.test.js` | Runs green at the new path: pass 12 / fail 0 (FR-004, SC-003) |
| `manifest` | absent | absent | absent | No `package.json`/manifest is added (FR-009) |

**Invariants**

- **INV-4**: The old path MUST NOT exist after the rename; there is no alias, copy, or redirect (FR-007).
- **INV-5**: Every file's byte content inside the folder is unchanged by the rename — the diff is a
  pure path change (Assumptions; research D1).
- **INV-6**: `entry_point` resolves after the move, so the installed extension still loads (Edge Cases;
  FR-006).

**Validation rule for README pointers**: every current repo-relative path document reference to the
extension points at `extensions/auto-specify/` and is copy-paste correct (FR-003, SC-002, SC-005).

---

## E3. Operator-Facing Documentation

Current guidance naming the extension or its location. Today this set contains exactly one file.

| Field | Type | Value | Validation |
|-------|------|-------|------------|
| `files` | set | `README.md` | The only current, operator-facing surface naming the extension (research D3) |
| `occurrences` | count | 4 lines at plan time | All 4 point at `extensions/auto-specify/` after the change |
| `role_word_hits` | set | uses of "orchestrator" as a role description | Left unchanged; not a naming defect (FR-002) |
| `install_block` | text | the Install section commands | Byte-identical before and after (FR-003, FR-008) |

**Invariants**

- **INV-7**: A repository-wide search for the old name returns zero hits in `README.md` (FR-007, SC-001).
- **INV-8**: The README's documented install and update commands, their wording, and their sequence are
  unchanged (FR-003).
- **INV-9**: A newcomer can state the extension's name and location from the README alone on the first
  attempt (SC-002).

---

## E4. Historical Record

Earlier feature artifacts that legitimately mention the old name. Explicitly not renamed.

| Member | Path | Old-name hits at plan time | Rule |
|--------|------|---------------------------|------|
| Feature 001 | `specs/001-speckit-orchestrator/**` | 33 lines across 5 files (`plan.md`, `quickstart.md`, `research.md`, `spec.md`, `tasks.md`) | Immutable history; unchanged (FR-007) |
| Feature 002 | `specs/002-extension-github-home/**` | 61 lines across 9 files (`checklists/requirements.md`, `contracts/operator-commands.md`, `contracts/package-layout.md`, `data-model.md`, `plan.md`, `quickstart.md`, `research.md`, `spec.md`, `tasks.md`) | Immutable history; unchanged (FR-007) |
| This feature | `specs/003-auto-specify-naming/**` | Not pinned — this change record necessarily names the folder it renames, and writing more of it adds more hits | Exempt by Clarifications: these artifacts must name the folder being renamed (FR-007) |

**Invariants**

- **INV-10**: No historical record is edited by this feature (the whole 001/002 trees stay byte-identical).
- **INV-11**: Exemption is by *location*, not by content: a hit outside E4 is a defect (SC-001).

---

## E5. Verification Evidence

The recorded proof that the sweep was complete and the extension still works.

| Field | Type | Value | Validation |
|-------|------|-------|------------|
| `search_command` | command | `grep -rn "speckit-orchestrator" . --exclude-dir=.git -i` | Run repository-wide after the rename (SC-001) |
| `classified_hits` | list | every remaining hit attributed to E4 (historical) or this feature's artifacts | No hit left unattributed (SC-001) |
| `readme_hits` | count | 0 | Zero hits in E3 after the rename (INV-7) |
| `test_command` | command | `node --test extensions/auto-specify/run.test.js` | Pinned by SC-003 and the Clarifications session |
| `test_result` | result | pass 12 / fail 0 | Exact expected outcome (SC-003) |

**Invariants**

- **INV-12**: The evidence record itself lives only in this feature's exempt artifacts
  ([quickstart.md](./quickstart.md), research D4); no new repo-level evidence file is added (FR-009, V).

---

## State Transition: the rename

There is exactly one transition, and it is atomic from a reviewer's perspective.

```text
BEFORE                                          AFTER
extensions/speckit-orchestrator/                extensions/auto-specify/
  index.ts  run.ts  gates.ts  spawn.ts            index.ts  run.ts  gates.ts  spawn.ts
  run.test.js                                     run.test.js
                                                (identically named files, same bytes)

README.md: 4 refs to extensions/speckit-orchestrator/  →  4 refs to extensions/auto-specify/
README.md: install/update commands                     →  byte-identical (unchanged)
specs/001-*/**, specs/002-*/**                         →  byte-identical (unchanged)
specs/003-*/artifacts                                  →  exempt (may name the old folder)
```

**Transition rules**

1. The move is performed as a single directory move (`git mv`), not a copy-then-delete (research D1).
2. Before the move, the pinned test passes at the old path (baseline: 12/12).
3. After the move and the 4 README edits, the pinned test passes at the new path (12/12) and the
   recorded search shows zero operator-facing hits.
4. If either condition fails, the change is NOT complete — there is no partial-success state (SC-001,
   SC-005, and the spec's note that a half-renamed repository is the worst outcome).

**Terminal states**: `renamed-and-verified` (the only success state) or `incomplete` (any surviving
operator-facing old-name reference, or a failing check). A failure is reported as a defect, never as a
waiver.
