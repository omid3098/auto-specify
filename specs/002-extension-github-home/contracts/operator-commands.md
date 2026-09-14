# Contract: Operator Commands

**Feature**: `002-extension-github-home` | **Date**: 2026-09-15
**Related**: [spec.md](../spec.md) FR-006, FR-008, SC-002…SC-004, SC-006 · [data-model.md](../data-model.md) E5, E7

The operator-facing command surface MUST be identical before and after the move. Every command below
MUST be registered exactly once per session; a second registration of any of them is a defect
(FR-008, SC-004).

---

## Exact-once rule

| Command | Registered by | Registration count per session | Duplicate symptom |
|---|---|---|---|
| `/speckit-run` | `extensions/speckit-orchestrator/index.ts` | 1 | Two entries in the command list; two "On it — handing off…" messages |
| `/speckit-cancel` | same | 1 | Two "speckit: cancelled" messages |
| `/speckit-answer` | same | 1 | Question re-asked or answered twice |

Guarantee mechanism: the project-local copy `.pi/extensions/speckit-orchestrator/` is deleted, so the
only loadable copy is the installed package. No `pi config` disable setting is used
(research [D3](../research.md#d3-preventing-duplicate-registration)).

---

## `/speckit-run <feature description>`

| Aspect | Contract |
|---|---|
| Input | Non-empty feature description; everything after the command name is used verbatim |
| Precondition | No active run (`running` or `blocked-on-user`) |
| Effect | Creates a run, paints status, sends `On it — handing off to Spec Kit: <first 120 chars>`, then drives `specify → clarify → plan → tasks → implement` |
| Success | Each step's gate passes in order; on the last step the run completes with `speckit: complete` |
| Empty input | Notifies `Usage: /speckit-run <feature description>`; no run starts |
| Active run present | Notifies `A speckit run is already active`; the existing run is untouched (one run per session) |
| Extra start commands | NOT required and NOT expected: the pipeline auto-advances (SC-002) |

## `/speckit-cancel`

| Aspect | Contract |
|---|---|
| Input | None |
| Precondition | Active run (`running` or `blocked-on-user`) |
| Effect | Aborts the in-flight worker, marks the run `cancelled`, clears status, sends `speckit: cancelled` |
| Postcondition | Terminal: no later step starts; a new `/speckit-run` becomes allowed |
| No active run | Notifies `Nothing to cancel`; nothing changes |

## `/speckit-answer <answer>`

| Aspect | Contract |
|---|---|
| Input | Non-empty answer text for the currently shown question |
| Precondition | Run is `blocked-on-user` |
| Effect | Records the answer; if more questions remain, shows the next one (`question i/n`) and stays paused; when the last question is answered, sends the answers to the worker and resumes the remaining steps |
| Postcondition | Resume continues from the paused step; steps before it are not re-run |
| Empty input | Notifies `Usage: /speckit-answer <answer> — still paused`; stays paused |
| No paused run | Notifies `No paused speckit run` |
| Unrelated chat text | MUST NOT resume the run — only this command resumes it (US2 AS3) |

---

## Progress reporting (always on)

While a run is active the main session shows a `speckit` status line and remains usable (FR-003,
SC-006).

| Run state | Status text | Notes |
|---|---|---|
| `running` | `speckit: <done>/5 <current>` plus elapsed seconds for the current step | Repainted once per second |
| `blocked-on-user` | `speckit: paused (<step>) — /speckit-answer` | Ticker stops |
| `failed` | `speckit: failed at <step>` (plus a `speckit: failed at <step> — <error>` message) | Ticker stops |
| `cancelled` | `speckit: cancelled` | Ticker stops |
| `complete` | `speckit: complete` | Ticker stops |
| No run | status cleared | — |

Per-step messages that MUST still appear after the move:

- `speckit: <step> worker pid <pid> · <n> byte prompt · <provider>/<model>` at worker start
- `speckit: <step> ✓` on success, or `speckit: <step> skipped` when `clarify` found nothing to ask
- the pause head `speckit: paused (<step>) — question i/n` with `Reply: /speckit-answer <your answer>`

---

## Failure contract

| Failure | Required behavior |
|---|---|
| Missing step skill in the target project | Fail at that step with `missing skill <path>`; name the step; do NOT report a broken extension home (US3 AS3) |
| Worker non-zero exit / error / abort | Fail at the step with the worker error message, stderr, or exit code |
| Artifact gate not satisfied after a step | Fail at the step with the gate error (e.g. `missing plan.md`) |
| Malformed pause fence | Fail with `invalid pause JSON: <error>` |
| Any failure or cancel | Later steps MUST NOT start (SC-006) |
