# Feature Specification: Spec Kit Pipeline Orchestrator

**Feature Branch**: `001-speckit-orchestrator`

**Created**: 2026-09-14

**Status**: Draft

**Input**: User description: "a pi extension that runs Specify → Clarify (stop if input needed) → Plan → Tasks → Implement via subagents, with the main session as orchestrator + progress."

## Clarifications

### Session 2026-09-14

- Q: When the run is paused for your answers, should every message you send be treated as those answers, or only an explicit reply? → A: Only an explicit answer to the listed questions counts; other messages are normal chat
- Q: If this session ends while a run is paused for your answers, should that run still be waiting when you come back? → A: v1 is this session only; restart means the run is gone
- Q: After a step fails, can you retry that step and continue, or do you have to start a new run? → A: Failed run is terminal; start a new run to try again
- Q: While a run is going, should progress stay visible on its own, or only when you ask how far it has gone? → A: Always-on compact progress (updates as steps change)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Unattended spec-to-implementation run (Priority: P1)

An operator describes a feature once. The orchestrator runs Specify, then Clarify only if the spec is underspecified, then Plan, Tasks, and Implement without asking the operator to start each step. The main conversation stays usable. The operator can see which step is running and which are done.

**Why this priority**: This is the whole product. Manual skill order is the pain being removed.

**Independent Test**: Start a run with a complete feature description that needs no clarification. Confirm Specify, Plan, Tasks, and Implement finish in order, artifacts exist for each, the operator was not prompted between steps, and the main session accepted other messages during the run.

**Acceptance Scenarios**:

1. **Given** no active run, **When** the operator starts a pipeline with a feature description, **Then** Specify runs first and later steps wait until the previous step's required artifact exists.
2. **Given** Specify produced a spec that does not need human input, **When** the pipeline continues, **Then** Clarify does not block, and Plan, Tasks, and Implement run in that order without operator prompts.
3. **Given** a step is running, **When** the operator sends an unrelated message in the main session, **Then** the session still responds and the run continues unless the operator asks to stop it.

---

### User Story 2 - Stop only when input is required (Priority: P1)

When Clarify (or any step) needs a human decision, the run pauses, names the blocking questions, and waits. After the operator gives an explicit answer to those questions in the main session, the run resumes from that step and continues unattended. Other messages while paused stay normal chat and do not resume the run.

**Why this priority**: Unattended finish is unsafe if Clarify is skipped, and useless if the operator must re-trigger every later step.

**Independent Test**: Start a run whose spec is underspecified. Confirm the orchestrator presents the blocking questions, does not start Plan until answers are in, then finishes Plan → Tasks → Implement after answers without further prompts.

**Acceptance Scenarios**:

1. **Given** Specify finished with unresolved questions, **When** Clarify needs input, **Then** the orchestrator pauses, shows the questions, and does not start Plan.
2. **Given** a paused run, **When** the operator explicitly answers the listed questions, **Then** the spec is updated and Plan → Tasks → Implement continue without another start command.
3. **Given** a paused run, **When** the operator sends a message that is not an explicit answer to the listed questions, **Then** the session treats it as normal chat, the run stays paused, and later steps do not start.
4. **Given** a running step that does not need input, **When** that step completes successfully, **Then** the next step starts automatically.

---

### User Story 3 - Isolated workers and visible progress (Priority: P2)

Each heavy step runs in an isolated worker that only receives what that step needs. The orchestrator keeps compact progress always visible and updates it as steps change (current step, completed steps, blocked-on-user, failed, or cancelled). The operator does not need to ask, or read worker logs, to know how far the run has gone. Worker failure appears in the main session.

**Why this priority**: Token cost and a blocked main session are the other half of the original pain; progress is how the operator trusts an unattended run.

**Independent Test**: During a multi-step run, confirm workers do not receive the full main-session transcript, progress lists at least current and completed steps, and a forced worker failure is reported in the main session.

**Acceptance Scenarios**:

1. **Given** a run in Plan, **When** the operator looks at the main session without asking for status, **Then** compact progress already shows Specify (and Clarify if it ran) complete, Plan in progress, later steps pending — without the operator reading worker output.
2. **Given** a worker fails, **When** the failure is known, **Then** the main session shows which step failed and that the pipeline has stopped; later steps do not start.
3. **Given** two consecutive steps, **When** the second worker starts, **Then** it receives that step's required context and artifacts, not the full parent conversation.

---

### Edge Cases

- Operator starts a second run while one is active: reject or queue is out of scope; v1 MUST refuse a second concurrent pipeline in the same session and say a run is already active.
- Session ends or the main session restarts while a run is active or paused: the run is gone; v1 MUST NOT restore it. A later session starts with no active run.
- Operator asks to stop or cancel: the run MUST stop starting new steps; in-flight work MUST be marked cancelled; progress MUST show cancelled.
- A step finishes but the required artifact is missing: treat as failure; do not start the next step. The run is terminal; v1 MUST NOT retry that step in place.
- Operator wants to try again after failed or cancelled: they MUST start a new run (allowed once the previous run is failed, cancelled, or complete).
- Clarify finds nothing to ask: skip the pause and continue.
- Main session is used for other work during a run (including while paused): allowed; that talk MUST NOT be treated as answers. Only an explicit reply to the listed questions counts as answers.
- Worker produces a successful-looking message but the quality gate (artifact exists and matches the step contract) fails: treat as failure.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Operators MUST be able to start one pipeline run from the main session by providing a feature description.
- **FR-002**: A run MUST execute steps in this order: Specify → Clarify (only if human input is required) → Plan → Tasks → Implement.
- **FR-003**: Analyze, checklist, converge, and issue-export steps MUST NOT run unless the operator asks for them on that run.
- **FR-004**: The orchestrator MUST invoke the existing Spec Kit step contracts (skills/templates). It MUST NOT reimplement those contracts.
- **FR-005**: A step MUST be considered complete only when its required artifact exists and satisfies that step's contract, not when a worker merely claims success.
- **FR-006**: The pipeline MUST NOT wait for operator approval between steps that do not require human input.
- **FR-007**: When human input is required, the orchestrator MUST pause, name the blocking questions or decisions, and MUST NOT start later steps until those are resolved.
- **FR-008**: After the operator explicitly answers the listed pause questions in the main session, the run MUST resume automatically from the paused step. Other messages MUST NOT count as answers and MUST NOT resume the run.
- **FR-009**: Each Specify, Clarify, Plan, Tasks, and Implement execution MUST run in an isolated worker that does not inherit the full parent transcript by default.
- **FR-010**: Each worker MUST receive only the context required for its step (feature description and/or current artifacts for that feature).
- **FR-011**: The main session MUST remain able to converse with the operator while a run is in progress.
- **FR-012**: While a run is active, the orchestrator MUST keep compact progress always visible and MUST update it when the current step or run state changes. Progress MUST include at least: current step, completed steps, and whether the run is blocked on the user, failed, or cancelled. The operator MUST NOT need to ask for status to see that snapshot.
- **FR-013**: Worker failures MUST surface in the main session with the failed step named; the run MUST become failed (terminal); later steps MUST NOT start; v1 MUST NOT retry the failed step in place.
- **FR-014**: Operators MUST be able to cancel an active run from the main session.
- **FR-015**: v1 MUST allow at most one active pipeline per main session. After a run is failed, cancelled, or complete, the operator MUST be able to start a new run in that same session.
- **FR-016**: Constitution-only work MUST remain out of this pipeline; this feature does not run constitution updates.
- **FR-017**: A pipeline run MUST exist only for the current main session. If that session ends or restarts, the run MUST be discarded; v1 MUST NOT resume a previous session's run.

### Key Entities

- **Pipeline run**: One attempt to take a feature from description through Implement, scoped to the current main session. States include running, blocked-on-user, failed, cancelled, complete. Failed and cancelled are terminal (no in-place retry). Ending the session discards the run.
- **Step**: One Spec Kit stage (Specify, Clarify, Plan, Tasks, Implement) with a required output artifact.
- **Worker**: Isolated execution of a single step with a narrow context bundle.
- **Progress snapshot**: Current step, completed steps, run state — enough to answer "how far has this gone?"
- **Feature artifacts**: The spec, plan, and task list (and implementation result) produced by steps; they are the completion gate.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a feature that needs no clarification, the operator starts the run once and does not need to start Plan, Tasks, or Implement by hand.
- **SC-002**: On a feature that needs clarification, the operator is interrupted only for those questions, then the remaining steps finish without another start command.
- **SC-003**: During a run, a correct progress snapshot (current step and completed steps) is visible without the operator asking and without reading worker logs.
- **SC-004**: The main session answers an unrelated operator message while a step is running (run not treated as a blocking exclusive lock on chat).
- **SC-005**: 100% of happy-path steps that claim success have the required artifact present before the next step starts; missing artifacts never count as success.
- **SC-006**: A failed or cancelled step results in no later step starting, and the operator is told which step stopped and why (failed vs cancelled).

## Assumptions

- The host is a pi coding-agent session with Spec Kit skills already installed in the project.
- Default path is Specify → conditional Clarify → Plan → Tasks → Implement, matching the project constitution.
- "pi extension" means this capability is delivered as a pi extension the operator can load; no second agent product.
- Isolated workers are pi subagents or equivalent isolated sessions; v1 does not require a custom workflow engine, extra config files, or a persistent dashboard.
- Progress is always-on compact status (status line or progress bar) in the main session; no separate UI app. Asking for status is unnecessary, not forbidden.
- A run does not survive session end or restart. Pause and progress exist only while this main session is alive; history of old runs is out of scope.
- Concurrent pipelines, multi-session farms, and optional Spec Kit commands (analyze, checklist, converge, taskstoissues) are out of scope for v1.
- The operator is the same person talking to the main session; there is no multi-user permission model.
- Existing Spec Kit quality gates (artifact paths, skill contracts) are reused, not redesigned.
