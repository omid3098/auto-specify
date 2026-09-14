# Contract: Worker Isolation & Pause Protocol

**Feature**: `002-extension-github-home` | **Date**: 2026-09-15
**Related**: [spec.md](../spec.md) FR-003, FR-010, SC-003, SC-006 · [data-model.md](../data-model.md) E6, E7

This contract is preserved byte-for-byte by the move. It is the boundary between the orchestrator
(main pi session) and the isolated step worker, and the only channel through which a run may ask for
human input.

---

## 1. Worker invocation

```text
<pi executable> --mode json -p --no-session --no-extensions [--model <provider>/<model>] \
  --append-system-prompt <temp prompt file> "Follow the worker instructions. Produce the skill artifacts."
```

| Flag | Purpose | Rule |
|---|---|---|
| `--mode json` | Machine-readable event stream on stdout | Required — the parent parses `message_end` events |
| `-p` | Non-interactive run | Required |
| `--no-session` | Worker does not share the parent session | Required for isolation (FR-003) |
| `--no-extensions` | Worker does not load pi extensions, so it cannot start a nested orchestrator | Required — no recursive runs |
| `--append-system-prompt <file>` | Carries the skill prompt + worker rider | Prompt is written to a temp file to avoid the Windows argv length cap; the temp directory is removed after the worker exits |

Worker output is parsed line-by-line for `{"type":"message_end","message":{role:"assistant",…}}`. The
last assistant text of the run is the only thing scanned for a pause fence, and `stopReason` /
`errorMessage` / exit code determine failure.

**Isolation invariants**

- The worker receives only: the step's `SKILL.md` (with `$ARGUMENTS` substituted), the worker rider,
  and — on resume only — the operator answers. It MUST NOT receive the parent transcript.
- The worker runs with `cwd` = the target project directory, so artifacts (`spec.md`, `plan.md`,
  `tasks.md`, `.specify/feature.json`) land in the project being orchestrated, not in the extension
  home.
- A worker MUST NOT start sibling Spec Kit steps.

---

## 2. Step prompt sources

| Step | Skill read from target project | Arguments |
|---|---|---|
| `specify` | `.agents/skills/speckit-specify/SKILL.md` | the feature description from `/speckit-run` |
| `clarify` | `.agents/skills/speckit-clarify/SKILL.md` | `Continue the active feature from \`.specify/feature.json\`` |
| `plan` | `.agents/skills/speckit-plan/SKILL.md` | same |
| `tasks` | `.agents/skills/speckit-tasks/SKILL.md` | same |
| `implement` | `.agents/skills/speckit-implement/SKILL.md` | same |

- `SKILL.md` is resolved from the **target project** (`ctx.cwd`). If it does not exist, the step
  fails immediately with `missing skill <path>` — the skill is not bundled in this home (FR-010).
- Every occurrence of the literal `$ARGUMENTS` in the skill file is replaced before the rider is
  appended.

## 3. Resume prompt

When operator answers exist for a paused run, the resume prompt replaces the skill prompt entirely:

```text
You are a worker. Apply the operator answers below to the active feature spec from .specify/feature.json.
Write the updated spec.md (and checklist markers if that file exists). Do not re-scan for new questions. Do not emit a pause block. Do not start sibling Spec Kit steps. Then stop.

Operator answers:
<Q: … / A: … blocks>
```

Rules: no skill file is re-sent, no pause fence is requested, and the prompt stays small
(< 800 bytes in the existing check).

---

## 4. Pause fence

A worker that needs human input MUST end its turn with exactly this fence:

```text
---speckit-pause---
{"questions":["question 1","question 2"]}
---end-speckit-pause---
```

| Rule | Detail |
|---|---|
| Placement | Last assistant text of the worker turn |
| Parse | Last `---speckit-pause---` occurrence, then the first `---end-speckit-pause---` after it |
| Body | JSON object with `questions`: a non-empty array of strings |
| All questions at once | The worker MUST emit every question in one fence (max 5) and then stop — no one-at-a-time asking, no tool calls after the fence |
| Question text | The complete question exactly as the skill specifies it, including the interrogative, the "Why it matters" sentence, the recommended option and reasoning, and the option table; line breaks are encoded as JSON `\n` |
| No questions | The worker finishes normally with NO fence — that is not a pause |
| Malformed fence (bad JSON, empty array, non-string entries, missing end) | Treated as a failure of the run (`invalid pause JSON: <error>`), never as a pause |
| No fence | The step is treated as complete; the artifact gate then decides success |

## 5. Pause / answer cycle

1. Pause parsed → run becomes `blocked-on-user`; the orchestrator shows question 1 with
   `Reply: /speckit-answer <your answer>`.
2. Each `/speckit-answer` records one answer and advances the index; while questions remain the run
   stays `blocked-on-user` and the ticker stays stopped.
3. When the last answer is collected, the answers are rendered as `Q: …\nA: …` blocks and the run
   resumes with the resume prompt.
4. Unrelated chat text MUST NOT resume the run. Only `/speckit-answer` (or `/speckit-cancel`)
   affects a paused run.
5. A cancelled run in any state is terminal; a failed run is terminal; neither can be resumed.

## 6. Change control

Any edit to this contract is a behavior change and MUST NOT be part of the rehome feature
(FR-003, FR-012). The move changes only file paths inside the home; the fence tokens, rider text,
isolation flags, and resume shape remain identical.
