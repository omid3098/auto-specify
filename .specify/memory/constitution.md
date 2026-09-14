# auto-specify Constitution

## Core Principles

### I. Spec-First Pipeline

Every feature MUST start as Spec Kit artifacts and follow
Specify → Clarify (when needed) → Plan → Tasks → Implement.
No implementation, refactor, or deployment work MAY start without a
current spec for that change. Skills and templates in `.specify/` are
the source of truth for each step; custom automation MUST invoke those
steps rather than reimplement their contracts.

**Rationale**: Unsupervised pipeline runs still need a durable spec,
plan, and task list. Skipping artifacts makes later steps unreviewable.

### II. Pause Only for Human Input

Deterministic Spec Kit steps MUST run to completion without waiting for
supervision. The pipeline MUST stop and return control to the user only
when a step requires human input (typically Clarify, or an explicit
review/approval gate). "Usually unsupervised" does not authorize skipping
Clarify when the spec is underspecified.

**Rationale**: The product goal is Specify, then Clarify if needed, then
unattended finish. Blocking the user on Plan/Tasks/Implement is waste.

### III. Isolated Subagent Execution

Specify, Plan, Tasks, Implement, and other heavy steps MUST run in
separate subagents (or equivalent isolated sessions) that receive only
the context required for that step. The main pi session is the
orchestrator: it dispatches work, collects results, and stays free for
user conversation. Subagents MUST NOT inherit the full parent transcript
by default.

**Rationale**: Full-transcript workers burn tokens and block the user.
Narrow context is cheaper and keeps the orchestrator interactive.

### IV. Orchestrator Observability

While a pipeline is running, the main session MUST remain usable and
MUST expose progress (current step, completed steps, blocked-on-user).
Progress MAY be a compact status line or progress bar; it MUST be
accurate enough to answer "how far has this gone?" without reading
subagent logs. Failures MUST surface to the orchestrator, not fail
silently in a worker.

**Rationale**: Unattended work is only safe if the user can see state
and keep talking to the orchestrator.

### V. Simplicity

Ship the smallest design that satisfies I–IV. Do not add workflow
engines, extra config surfaces, or new dependencies when Spec Kit
skills plus pi extension/subagent APIs already cover the path.
YAGNI: no speculative stages, dashboards, or persistence beyond what
resume/progress requires.

**Rationale**: An orchestrator that wraps existing skills should stay a
thin dispatcher. Complexity here becomes unattended failure later.

## Additional Constraints

- Target runtime is a **pi extension**. Automation MUST use pi's
  extension and subagent APIs rather than a parallel agent harness.
- Spec Kit command order for the default happy path is Specify →
  Clarify (conditional) → Plan → Tasks → Implement. Analyze, checklist,
  converge, and taskstoissues are out of the default path unless the
  user asks.
- Constitution updates are governance only. A constitution command MUST
  NOT implement features; those go through Specify and later steps.
- User-facing interruption MUST name the blocking question or decision.
  Do not pause "just in case."

## Development Workflow

1. Amend this constitution when a principle actually changes.
2. Specify the change (`/speckit-specify` or successor).
3. Clarify only if the spec is underspecified.
4. Plan, task, then implement; do not code from chat when a spec exists.
5. Reviews and PRs MUST check: pipeline order, pause-only-for-input,
   subagent isolation, and that the orchestrator still reports progress.

Quality gate: a step is done when its Spec Kit artifact exists and
matches the skill contract (spec.md, plan.md, tasks.md, or equivalent),
not when a worker merely claims success.

## Governance

This constitution supersedes informal practice, chat conventions, and
ad-hoc scripts. Amendments MUST update this file, bump the version, and
set Last Amended to the change date.

Versioning:

- MAJOR: remove or redefine a principle incompatibly.
- MINOR: add or materially expand a principle or section.
- PATCH: clarification, wording, or non-semantic fix.

Compliance: plans, tasks, and implementations MUST NOT contradict I–V.
Unjustified complexity (violating V) is a review-blocking defect.
Runtime guidance for Spec Kit steps lives in the skills and templates
under `.specify/` and `.agents/skills/`; this file does not duplicate
them.

**Version**: 1.0.0 | **Ratified**: 2026-09-14 | **Last Amended**: 2026-09-14
