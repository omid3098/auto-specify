# Data Model: Spec Kit Pipeline Orchestrator

In-memory only. Dropped on `session_shutdown`, `/reload`, process exit. At most one `PipelineRun` per main session.

## PipelineRun

| Field | Type | Rules |
|-------|------|--------|
| id | string | Generated at start; not persisted |
| featureDescription | string | Non-empty; from `/speckit-run` args |
| featureDir | string \| null | Set after Specify from `.specify/feature.json` |
| state | RunState | See transitions |
| steps | StepRecord[] | Fixed order: specify, clarify, plan, tasks, implement |
| currentStep | StepName \| null | The running or paused step |
| pause | PausePayload \| null | Set only in `blocked-on-user` |
| error | string \| null | Set only in `failed` |
| child | AbortController \| null | Live worker; aborted on cancel/shutdown |

**RunState**: `running` | `blocked-on-user` | `failed` | `cancelled` | `complete`

**StepName**: `specify` | `clarify` | `plan` | `tasks` | `implement`

### Transitions

```
(none) --/speckit-run--> running
running --artifact ok, next step--> running
running --specify ok, clarify needs input--> blocked-on-user
blocked-on-user --/speckit-answer--> running
running --all steps ok--> complete
running --gate fail | child fail--> failed
running | blocked-on-user --/speckit-cancel or shutdown--> cancelled
failed | cancelled | complete --/speckit-run--> running (new run replaces)
```

Forbidden: retry in place; second concurrent `/speckit-run` while `running` or `blocked-on-user`; resume after shutdown.

## StepRecord

| Field | Type | Rules |
|-------|------|--------|
| name | StepName | Immutable |
| status | pending \| running \| complete \| skipped \| failed \| cancelled | |
| startedAt | number \| null | ms |
| endedAt | number \| null | ms |

Clarify `skipped` when the worker finishes with no pause block (nothing to ask). Still listed in progress as skipped/complete so the snapshot is honest.

A step is `complete` only after the artifact gate passes.

## PausePayload

| Field | Type | Rules |
|-------|------|--------|
| step | StepName | Usually `clarify` |
| questions | string[] | Non-empty |
| hint | string | How to resume: `/speckit-answer ...` |

Parsed from worker last assistant text:

```
---speckit-pause---
{"questions":["..."]}
---end-speckit-pause---
```

Invalid/missing JSON → treat as worker failure, not a pause.

## ProgressSnapshot

Derived, not stored. Footer string from run:

- `running`: `speckit: specify ✓ · clarify … · plan · tasks · implement`
- `blocked-on-user`: `speckit: paused (clarify) — /speckit-answer`
- `failed`: `speckit: failed at plan — <short error>`
- `cancelled`: `speckit: cancelled`
- `complete`: `speckit: complete`
- idle: status key cleared

Must include current step, completed steps, and blocked/failed/cancelled.

## Feature artifacts (external, Spec Kit)

Owned by skills, not this extension:

- `.specify/feature.json` → `{ feature_directory }`
- `{featureDir}/spec.md`
- `{featureDir}/plan.md`
- `{featureDir}/tasks.md`

Orchestrator only reads them for gates.
