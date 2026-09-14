# Contract: Operator commands

All commands are pi extension commands. They do not go through the LLM.

## `/speckit-run <feature description>`

**When**: No run in `running` or `blocked-on-user`.

**Args**: Non-empty description. If empty, notify and no-op.

**Effect**: Create `PipelineRun`, set status line, spawn Specify worker, then continue the machine.

**Refuse**: If a run is `running` or `blocked-on-user`, notify that a run is already active. Do not queue.

## `/speckit-cancel`

**When**: Run is `running` or `blocked-on-user`.

**Effect**: Abort child if any; mark run `cancelled`; status `speckit: cancelled`. In-flight worker MUST be killed.

**Idle**: Notify nothing to cancel.

## `/speckit-answer <text>`

**When**: Run is `blocked-on-user`.

**Args**: The answer to the one question currently shown. Empty args → notify and stay paused.

**Effect**: Record the answer for the current question. If questions remain, show the next one and stay paused. Only after the last answer resume the paused step’s worker with the full Q/A blob (or continue from post-clarify Plan if Clarify already wrote Q/A into spec — implementer’s choice as long as Plan does not start until answers are applied). Clear `pause`. Other chat MUST NOT invoke this.

**Wrong state**: Notify not paused; do not start a run.

## Progress (no command)

Always-on `ctx.ui.setStatus("speckit", snapshot)`. Clear when idle (no run, or after complete/failed/cancelled once the operator starts something else is optional; keep last terminal snapshot until next `/speckit-run` or session end).
