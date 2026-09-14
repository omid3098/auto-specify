# Feature Specification: Auto-Specify Naming Alignment

**Feature Branch**: `003-auto-specify-naming`

**Created**: 2026-09-15

**Status**: Draft

**Input**: User description: "the name in the readme and in the extention directory should be auto-specify. same as the project name on github"

## Clarifications

### Session 2026-09-15

- Q: Should this feature's own workflow artifacts (plan, tasks, contracts/research files) be exempt from the "zero old-name references" rule so they can name the old extension folder when describing the move? → A: Exempt this feature's own artifacts (plan.md, tasks.md, contracts/, research.md, data-model.md, quickstart.md) from the old-name check; operator-facing docs stay strict.
- Q: Does the rename replace only the literal extension name and path, or must descriptive uses of the word "orchestrator" in the README also be replaced? → A: Replace only the literal old name and path; descriptive prose such as "the orchestrator" may stay.
- Q: Besides the in-repo folder references, does anything in the documented install and update instructions change? → A: Only in-repo folder paths change; the install/update commands and their wording stay exactly as they are.
- Q: What evidence must exist to show the zero-old-name outcome was actually achieved, and over which files is that check run? → A: Run and record a repository-wide search for the old name; every remaining hit must be confined to the exempt change record or to historical feature records.
- Q: Should the post-rename extension check be pinned to a concrete command and pass count instead of the relative wording? → A: Pin it — `node --test extensions/auto-specify/run.test.js` must report pass 12 / fail 0.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - One recognizable product name across the home (Priority: P1)

A visitor who lands on the repository — on GitHub or in a local checkout — sees a single product name, `auto-specify`, used consistently in the repository's public description (the README) and for the installable extension itself. The name matches the GitHub project name, so the extension, the repository, and the install command all refer to the same thing.

**Why this priority**: Today the repository is named `auto-specify` but the installable extension folder is named `speckit-orchestrator`, so newcomers cannot tell whether they are looking at one product or two. This is the change the maintainer asked for and the reason the feature exists.

**Independent Test**: Open the repository as a newcomer, read the README, and look at the repository contents. Confirm the product name used in the README and the name of the installable extension folder both read `auto-specify` and match the GitHub project name.

**Acceptance Scenarios**:

1. **Given** the published repository, **When** a newcomer reads the README, **Then** the extension is named `auto-specify` everywhere the README refers to it, and no longer under the previous name.
2. **Given** the repository working copy, **When** a newcomer inspects the installable extension location, **Then** the extension directory is named `auto-specify`, so the folder name matches the GitHub project name.
3. **Given** the install path documented for operators, **When** the README is followed, **Then** every path and file reference points at the renamed `auto-specify` extension location and remains copy-paste correct.

---

### User Story 2 - Installed extension keeps working after the rename (Priority: P1)

An operator who follows the README installs the extension from GitHub under its new name and runs the normal Spec Kit pipeline. Commands, pause-and-answer behavior, cancellation, progress reporting, and the one-run-per-session rule are unchanged; nothing about daily use breaks because of the rename.

**Why this priority**: A consistent name that breaks the install or the pipeline is worse than the old inconsistent name. The rename must be a pure naming change to the operator.

**Independent Test**: Install from GitHub as documented, start a session, and complete a normal run. Confirm the commands, progress, and pause rules behave exactly as before the rename.

**Acceptance Scenarios**:

1. **Given** the renamed extension installed from GitHub, **When** an operator starts a run, **Then** the pipeline advances through its usual steps and reports progress exactly as before the rename.
2. **Given** a run that needs a human answer, **When** the operator replies with the answer command, **Then** the run resumes as before, with no behavior change caused by the rename.
3. **Given** the repository after the rename, **When** the extension's own checks are run, **Then** they pass and load the renamed location without errors.

---

### User Story 3 - No stale old-name references remain (Priority: P2)

A maintainer reading any operator-facing documentation or path in the repository finds no leftover reference to the previous extension name, so there is no confusing half-renamed state. References inside historical, immutable records of earlier work may remain as history.

**Why this priority**: A partially applied rename is the worst outcome — it substitutes one confusing state for another. Completeness keeps the product name trustworthy.

**Independent Test**: Search the operator-facing documentation and paths for the previous name. Confirm every current reference uses the new name, and any remaining occurrences are confined to historical records of past work.

**Acceptance Scenarios**:

1. **Given** the operator-facing documentation, **When** it is searched for the previous name, **Then** no current reference remains.
2. **Given** existing historical feature records, **When** they are searched for the previous name, **Then** occurrences there are acceptable and are not treated as defects.
3. **Given** the repository after the rename, **When** the extension is located through the documented path, **Then** it resolves to the new name with no broken link or missing file.
4. **Given** this feature's own change artifacts (plan, tasks, contracts, research, data model, quickstart), **When** they are searched for the previous name, **Then** naming the folder being renamed there is acceptable and is not treated as a defect.

---

### Edge Cases

- What happens to references to the old extension path inside historical feature records for earlier work? They are history and stay as-is; only current, operator-facing references must change.
- What happens if a documentation reference is missed during the rename? The repository is left half-renamed; the completeness check (User Story 3) exists to catch this before the change is considered done.
- What happens to an already-installed copy under the old name on an operator's machine? It is not this feature's concern beyond noting that only in-repo paths change; the documented install and update commands themselves stay exactly as written, and operators get the new name by running them as documented.
- What happens to the word "orchestrator" where it is only a role description rather than the extension name? It stays; only the literal extension name and path are renamed.
- What happens if the renamed extension's entry point is not found after the move? The install or run would fail; the "installed extension keeps working" checks must confirm the renamed folder still loads.
- What happens to the repository's GitHub project name? It already reads `auto-specify` and is the reference the other names must match, so it does not change.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The installable extension MUST be named `auto-specify`, matching the GitHub project name.
- **FR-002**: The README MUST use the new literal name and path, `auto-specify`, in every place it currently uses the previous extension name or its path. Descriptive prose that uses the word "orchestrator" as a role description (not as the extension's name) MAY remain unchanged.
- **FR-003**: Every path and file reference in the README that points inside the repository at the extension MUST point at the `extensions/auto-specify` location and remain copy-paste correct. The documented install and update commands themselves — their source, branch, wording, and sequence — MUST stay byte-identical.
- **FR-004**: The extension's own checks MUST continue to run and pass from the renamed location.
- **FR-005**: Operator-visible capability MUST NOT change: start, pause for named questions, answer to resume, cancel, always-on progress, isolated step execution, and at most one active run per session all behave exactly as before the rename.
- **FR-006**: The extension MUST continue to be discoverable by pi through the repository's conventional extension directory after the rename.
- **FR-007**: No current, operator-facing documentation or path reference to the previous extension name MAY remain. The rename replaces only the literal extension name and path; descriptive uses of the word "orchestrator" are out of scope. Occurrences inside historical records of earlier work MAY remain, and this feature's own change artifacts (plan.md, tasks.md, contracts/, research.md, data-model.md, quickstart.md) are exempt because they must be able to name the folder being renamed.
- **FR-008**: The documented install and update commands MUST continue to install the extension under its new name without the operator needing extra steps beyond what the README states. The install source, update command, and their sequence MUST NOT change; only in-repo paths that point at the extension folder become `extensions/auto-specify`.
- **FR-009**: The repository MUST NOT gain any new dependency, manifest, or build step as part of the rename.

### Key Entities *(include if feature involves data)*

- **Product name**: The single name `auto-specify` used for the extension, the repository, and the install target; the GitHub project name is the reference value.
- **Extension location**: The repository-relative directory that holds the installable extension; its name is what changes from the previous name to `auto-specify`.
- **Operator-facing documentation**: The README and any current guidance that names the extension or its location; all of it must use the new name.
- **Historical record**: Feature artifacts for earlier completed work that mention the previous name; explicitly out of scope for renaming. This feature's own change artifacts (plan, tasks, contracts, research, data model, quickstart) are likewise exempt, because they must name the folder being renamed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of current operator-facing references to the extension use the name `auto-specify`, evidenced by a recorded repository-wide search for the previous name in which every remaining hit is individually listed and attributed to an exempt location: this feature's own change artifacts (plan.md, tasks.md, contracts/, research.md, data-model.md, quickstart.md) or a historical record of earlier work.
- **SC-002**: A newcomer can identify the extension's name and location from the README alone on the first attempt, with no reference to two different names for the same product.
- **SC-003**: The extension's checks pass from the renamed location; the check is pinned to the repository's documented command, `node --test extensions/auto-specify/run.test.js`, which reports pass 12 / fail 0.
- **SC-004**: A normal pipeline run completes after the rename with no operator-visible behavior difference from before the rename.
- **SC-005**: Zero manual fix-ups are needed after following the README: every documented path and command works as written, with the same recorded-search evidence from SC-001 confirming no missed old-name path.

## Assumptions

- The GitHub project name `auto-specify` is correct and is the reference all other names must match; it is not being renamed by this feature.
- The previous extension name was introduced for distribution reasons in earlier work, and the maintainer now wants it aligned with the repository name; no functional reason to keep two names exists.
- The rename is intentionally a pure naming and path change with no behavior change, in line with the project's simplicity principle.
- Historical feature records for earlier completed work are immutable history and are excluded from the rename, as are this feature's own change artifacts (which must name the old folder); only current, operator-facing content must change.
- The rename touches only the literal extension name and its in-repo path; the word "orchestrator" used as a role description stays, and the documented install and update commands are not edited.
- The extension continues to be installed from the same public GitHub repository and the same default branch; only the name inside the repository changes.
- No repository name change is required on GitHub, so no external redirect or rename process is in scope.
