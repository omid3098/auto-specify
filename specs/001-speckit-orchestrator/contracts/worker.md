# Contract: Isolated step worker

## Process

```
pi --mode json -p --no-session --no-extensions [--model <parent>] [prompt]
```

- cwd: parent `ctx.cwd`
- stdin: ignore
- stdout: JSONL events
- stderr: captured for failure text
- Abort: SIGTERM then SIGKILL after 5s (same idea as pi’s subagent example)

Do not pass `--no-skills`. Workers must load project Spec Kit skills.

Do not load this extension in the child (`--no-extensions`).

## Prompt (every step)

1. Full text of the matching skill (`speckit-specify`, `speckit-clarify`, `speckit-plan`, `speckit-tasks`, `speckit-implement`) from `.agents/skills/.../SKILL.md` (or `.pi/prompts` if that is what the repo uses — prefer the skill the host would expand for `/skill:speckit-*`).
2. A short rider:
   - You are a worker. Do not wait for a human unless the pause protocol below applies.
   - Do not start sibling Spec Kit steps.
   - Success = the skill’s artifacts, not a claim in chat.
3. Step-specific args (description for Specify; otherwise “continue the active feature from `.specify/feature.json`”).
4. For `/speckit-answer` resume: a short apply-answers prompt plus the operator’s answer blob. Do **not** re-send the full skill (that re-scans and asks another round).

## Pause protocol (Clarify rider)

If the skill would present questions and wait, emit **all** of them (max 5) in **one** pause block:

```
---speckit-pause---
{"questions":["question 1","question 2"]}
---end-speckit-pause---
```

Then stop. Do not ask one-at-a-time. Do not call tools after the pause block. Exit 0.

If nothing to ask, finish the skill as usual (no pause block).

Orchestrator: last assistant `message_end` text containing the fences → `blocked-on-user`. Missing/invalid JSON → fail the run. Resume worker applies answers and must not emit another pause.

## Success

| Step | Exit | Extra |
|------|------|--------|
| specify | 0, no pause | `.specify/feature.json` exists; `spec.md` exists at `feature_directory` |
| clarify | 0, optional pause | `spec.md` still exists |
| plan | 0, no pause | `{featureDir}/plan.md` |
| tasks | 0, no pause | `{featureDir}/tasks.md` |
| implement | 0, no pause | no extra file required |

Nonzero exit, `stopReason` error/aborted, or failed gate → run `failed`. No retry.

## Isolation

Child MUST NOT receive the parent session file (`--no-session`). Prompt is the only parent context besides cwd files on disk.
