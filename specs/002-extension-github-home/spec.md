# Feature Specification: Extension GitHub Home

**Feature Branch**: `002-extension-github-home`

**Created**: 2026-09-15

**Status**: Draft

**Input**: User description: "bring the entire extention to this project without breaking the functionality and then install it in pi. this directory should be main home of this extention so I can publish it on github"

## Clarifications

### Session 2026-09-15

- Q: When someone installs this extension from this GitHub repository, what should pi actually load? → A: The repository is the public home; pi installs one dedicated, first-class extension folder from it (not a hidden overlay).
- Q: When pi installs this extension, should it use this local checkout or GitHub? → A: Gets the latest from GitHub only, not this checkout.

### Session 2026-09-15 (clarify follow-up)

- Q: Where should the dedicated first-class extension folder live, and what should it be called? → A: `extensions/speckit-orchestrator/` — a repo-root conventional pi package directory containing the extension.
- Q: What should happen to the existing project-local copy at `.pi/extensions/speckit-orchestrator/`? → A: Delete it once the extension lives in the new package folder.
- Q: Should install use an unpinned GitHub source or a pinned release reference? → A: Unpinned `git:github.com/omid3098/auto-specify`; `pi update --extensions` pulls the newest default-branch commit.
- Q: Where must the public description and install guidance live? → A: Root `README.md` plus the GitHub repository description field.
- Q: Besides the extension folder, what must ship in the published pi package? → A: Only the extension folder, plus `README` and `LICENSE`.

### Session 2026-09-15 (publish facts and verification)

- Q: May I create the public GitHub repository `omid3098/auto-specify` and push this home to it on `main`? → A: Yes — the home is published at `omid3098/auto-specify` on the default branch `main`.
- Q: Should the MIT LICENSE copyright line read `Copyright (c) 2026 Omid Saadat`? → A: Yes — the copyright holder is `Omid Saadat`.
- Q: Once the repository is published, should the install and `pi update --extensions` run in pi on this machine (T013)? → A: Yes — install it; installing the GitHub copy into pi is in scope.
- Q: How should the human-driven pi verification (quickstart V4–V8, tasks T014–T021 and T026) be closed out? → A: The maintainer verifies manually in a later session; the results are recorded then, and no unobserved scenario is claimed as passing.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - This repository is the public home (Priority: P1)

A maintainer treats this directory as the canonical home of the Spec Kit pipeline orchestrator. Anyone who opens the repository (locally or on GitHub) can see the complete extension as a first-class product — a dedicated extension folder in this home, not a hidden project-only add-on and not the whole repository pretending to be the extension — and can share or publish that home without reconstructing it from scattered files.

**Why this priority**: Without a real home, the extension cannot be published or installed as a product. This is the change the maintainer asked for.

**Independent Test**: Open the repository as a newcomer. Confirm the orchestrator is present as a complete, shareable product with a public description, that the installable piece is one dedicated first-class extension folder, and that nothing essential lives only in a disposable project-local overlay.

**Acceptance Scenarios**:

1. **Given** this repository as the working copy, **When** a newcomer inspects it, **Then** they can identify it as the home of the orchestrator and locate the dedicated first-class extension folder without hunting a hidden project-only overlay.
2. **Given** the repository is published on GitHub, **When** a visitor reads the public description and the root `README.md`, **Then** they understand what the extension does, that this repository is the public home, and that install gets the latest dedicated first-class extension folder from GitHub (not a local checkout).
3. **Given** the extension files that exist today, **When** they are brought into this home, **Then** no operator-facing capability is omitted (start, pause, answer, cancel, progress, isolation, one-run-per-session).

---

### User Story 2 - Install into pi without changing behavior (Priority: P1)

After the repository is the home and published on GitHub, the maintainer installs into pi by getting the latest dedicated first-class extension folder from GitHub, not from this local checkout. Subsequent pi sessions load that folder as the installed extension. Operators still run the same pipeline: start once, pause only for named questions, resume only with an explicit answer, cancel, always-on progress, and at most one active run per session.

**Why this priority**: A GitHub home that is not installed leaves the maintainer using an unofficial copy; an install that breaks the pipeline is worse than not moving.

**Independent Test**: Install from GitHub (latest) into pi, start a session, and complete both a no-clarification run and a pause-and-answer run. Confirm commands, progress, and rules match the existing orchestrator.

**Acceptance Scenarios**:

1. **Given** this repository is the extension home on GitHub, **When** the maintainer installs by getting the latest dedicated first-class extension folder from GitHub (not this checkout), **Then** a later pi session shows the orchestrator commands without relying on a local working copy or a hidden project-only overlay as the source of truth.
2. **Given** the extension is installed, **When** an operator starts a pipeline with a complete feature description, **Then** Specify → Plan → Tasks → Implement still run in order without extra start commands, and the main session stays usable.
3. **Given** the extension is installed, **When** clarification is required, **Then** the run still pauses with named questions, unrelated chat does not resume it, and an explicit answer continues the remaining steps.
4. **Given** the extension is installed, **When** the operator cancels or a step fails, **Then** later steps do not start and the operator is told which step stopped.

---

### User Story 3 - Safe to publish and reuse (Priority: P2)

A GitHub visitor (or the maintainer on another machine) installs by getting the latest from GitHub, not from a local checkout. Installing does not register the same commands twice, and a consumer project still needs Spec Kit skills in that project — same as today. Publishing does not require a separate product rewrite.

**Why this priority**: The home is only useful if GitHub can be the install source and if the first checkout does not end up with duplicate, conflicting copies.

**Independent Test**: With the home published on GitHub, confirm install instructions in the public description get the latest from GitHub (not a local checkout), commands appear once, and a project without Spec Kit skills fails the same way it does today (a step cannot run), not in a new confusing way.

**Acceptance Scenarios**:

1. **Given** the extension is already available from this home, **When** it is installed into pi, **Then** each orchestrator command appears once (no duplicate start/answer/cancel).
2. **Given** a GitHub visitor follows the public install guidance, **When** they install by getting the latest dedicated first-class extension folder from GitHub, **Then** they get the same operator commands as the maintainer.
3. **Given** a project that does not have Spec Kit skills, **When** an operator starts a run, **Then** the failure is about missing step skills, not about a broken or partial extension home.

---

### Edge Cases

- Both a leftover project-only copy and the installed home would load: the operator MUST see each command only once; duplicate registration is a defect, so the project-local copy is deleted rather than disabled.
- Install happens while a pipeline run is active: out of scope for v1; the maintainer installs when no run is in progress.
- Repository is incomplete (missing extension pieces): install MUST NOT be treated as successful; the home is all-or-nothing.
- Consumer has Spec Kit skills in the project: behavior matches the existing orchestrator.
- Session restart: installed extension still loads; in-progress runs still do not survive restart (unchanged from the current orchestrator).
- Publishing later to a package registry (beyond GitHub) is out of scope; GitHub is the public home.
- Installing the repository root as if it were the pi extension is not the v1 install path; pi loads the dedicated first-class extension folder gotten from GitHub.
- A local checkout of this home is present (even if it differs from GitHub): install MUST still get the latest from GitHub only; the working copy MUST NOT be the install source.
- Installing from a local path to this checkout is not the v1 install path.
- GitHub does not yet have the home, or the latest cannot be retrieved: install MUST NOT be treated as successful.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: This repository MUST be the canonical public home of the entire Spec Kit pipeline orchestrator — the copy that would be published on GitHub. The repository root is the home, not the pi extension package itself.
- **FR-002**: The home MUST include the complete operator-facing extension (start, pause, explicit answer, cancel, always-on progress, isolated workers, one active run per session) in one dedicated first-class extension folder. Partial moves are not allowed.
- **FR-003**: Rehoming and installing MUST NOT change existing pipeline behavior, quality gates, or pause rules defined for the current orchestrator.
- **FR-004**: Maintainers MUST be able to install into pi the dedicated first-class extension folder by getting the latest copy from GitHub. This local checkout MUST NOT be the install source.
- **FR-005**: After install, pi sessions MUST load the orchestrator from that installed extension folder, not from a hidden project-only overlay as the source of truth.
- **FR-006**: After install, operators MUST still be able to start one run, cancel it, and answer pause questions the same way they do today.
- **FR-007**: The public repository description and the root `README.md` MUST state what the extension is, that this directory is its home, and how to install by getting the latest dedicated first-class extension folder from GitHub (not this checkout, not the repository root, and not a hidden overlay).
- **FR-008**: Install MUST result in a single loaded copy of the extension (no duplicate commands or duplicate progress lines). Because pi deduplicates git packages by repository URL rather than by path, the pre-existing project-local copy at `.pi/extensions/speckit-orchestrator/` MUST be deleted once the extension lives in the new package folder, with no reliance on a disable setting.
- **FR-009**: The extension home MUST remain usable as a GitHub project without requiring the maintainer to strip private machine-only state first.
- **FR-010**: Spec Kit step skills stay a requirement of the target project, not something this feature reimplements or silently bundles as a substitute for those skills.
- **FR-011**: Existing automated checks for the orchestrator's run rules MUST still be runnable from this home after the move.
- **FR-012**: Constitution-only work and optional Spec Kit steps (analyze, checklist, converge, issue-export) stay out of this feature.
- **FR-013**: Pi MUST load exactly one dedicated, first-class extension folder from this home: the repo-root conventional pi package directory `extensions/speckit-orchestrator/`. That folder MUST NOT be a hidden project-only overlay.
- **FR-014**: Install MUST get the latest from GitHub only, using the unpinned source `git:github.com/omid3098/auto-specify` so the default branch `main` is the single source of truth for "latest". A local working copy of this home MUST NOT be used as the install source.
- **FR-015**: The published pi package MUST ship only the extension folder plus `README` and `LICENSE`. The `LICENSE` MUST be the MIT license with the fixed copyright holder `Omid Saadat`. Spec Kit step skills and this repository's project-only prompts MUST NOT be bundled.

### Key Entities

- **Extension home**: This repository as the canonical, publishable product for the orchestrator. It is not itself the pi extension package.
- **Extension folder**: The one dedicated, first-class folder inside the home that pi loads when the extension is installed — the repo-root `extensions/speckit-orchestrator/` package directory. It is not a hidden project-only overlay.
- **Installation**: The binding that makes pi load the extension folder gotten from an unpinned GitHub source (latest), not from a local checkout, in later sessions.
- **Operator commands**: Start a run, answer pause questions, cancel a run — unchanged in meaning from the current orchestrator.
- **Public description**: What a GitHub visitor reads to understand the home and install the extension folder by getting the latest from GitHub.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A newcomer can tell this repository is the orchestrator's home and find install guidance (repository description plus root `README.md`) in under 5 minutes without being told a hidden folder name.
- **SC-002**: After install, an operator completes a no-clarification pipeline with one start action and no extra step-start actions — same as today.
- **SC-003**: After install, an underspecified run still interrupts only for named questions, then finishes remaining steps after one explicit answer.
- **SC-004**: 100% of the previous operator commands remain available, and each appears exactly once in a session.
- **SC-005**: Install into pi succeeds using the latest GitHub copy of the dedicated first-class extension folder, without using this local checkout or copying files by hand into a project-only overlay.
- **SC-006**: Zero intended pipeline rules change: one run per session, pause only for input, failed/cancelled runs stay terminal, runs do not survive session restart.

## Assumptions

- The orchestrator already exists and works as specified in the prior pipeline-orchestrator feature; this feature rehomes and installs it, it does not redesign it.
- "Install it in pi" means the maintainer's pi environment loads the dedicated first-class extension folder gotten from GitHub (latest) as an installed product, not from this local checkout, not the repository root, and not a hidden project-only overlay.
- GitHub is the public distribution home for v1; publishing to a separate package registry is not required.
- Install uses an unpinned GitHub reference, so `pi update --extensions` advances to the newest default-branch commit without a re-pin step.
- The published pi package ships only the extension folder plus `README` and `LICENSE`; Spec Kit step skills and this repository's project-only prompts are not bundled.
- Spec Kit skills remain installed in the project where a run is started; this home ships the orchestrator, not a replacement Spec Kit.
- Install is performed when no pipeline run is active.
- The operator and maintainer are the same person in v1; there is no multi-user permission model.
- The home is published to the public GitHub repository `omid3098/auto-specify` on `main`, and install commands in the public description and `README.md` use that exact slug.
- Human-driven verification of installed-pi behavior (SC-002, SC-003, SC-004, SC-006) is performed manually by the maintainer after install; until it is observed and recorded, those outcomes remain unverified rather than assumed.
- Machine-only Spec Kit pointers and similar local state stay out of the published home.
- No new operator workflow stages, dashboards, or config surfaces are added (simplicity).
