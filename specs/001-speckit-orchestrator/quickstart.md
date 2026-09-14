# Quickstart: Spec Kit Pipeline Orchestrator

## Prerequisites

- pi coding agent, this repo trusted
- Spec Kit skills present (`.agents/skills/speckit-*`)
- Extension file at `.pi/extensions/speckit-orchestrator/index.ts` (after implement)

## Load

Start pi in this repo. Confirm `/speckit-run` appears in command autocomplete.

## Happy path (no clarify)

1. `/speckit-run add a health endpoint that returns ok`
2. Footer shows `speckit:` with specify then plan, tasks, implement.
3. Chat still works (send `ping`); do not use `/speckit-answer`.
4. When complete: `specs/*/spec.md`, `plan.md`, `tasks.md` exist; implement ran.
5. You did not type `/speckit-plan` or `/speckit-implement`.

## Pause path

1. `/speckit-run` a vague description so Clarify must ask.
2. Footer: `paused` + `/speckit-answer`.
3. Send unrelated chat → run stays paused.
4. `/speckit-answer` with answers → plan/tasks/implement continue.

## Failure / cancel

1. Mid-run: `/speckit-cancel` → status cancelled; no later step.
2. After fail or cancel: `/speckit-run` again is allowed.
3. Second `/speckit-run` while active → refused.

## Isolation check

Worker processes are `pi --mode json -p --no-session --no-extensions`. Parent transcript is not their session file.

## Tests

From repo root after implement:

```
node --test .pi/extensions/speckit-orchestrator/*.test.js
```

(or the `.ts` equivalent if the test file is loaded via the same runner you pick in tasks). Expect state-machine tests green without network.
