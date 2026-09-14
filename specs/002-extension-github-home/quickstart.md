# Quickstart Validation: Extension GitHub Home

**Feature**: `002-extension-github-home` | **Date**: 2026-09-15
**Prereqs**: [spec.md](./spec.md), [plan.md](./plan.md), [contracts/](./contracts) · **Payload rules**: [contracts/package-layout.md](./contracts/package-layout.md)

Runnable scenarios that prove the home is publishable and installs from GitHub without changing
pipeline behavior. Each scenario lists the command, the observable expectation, and the requirement
it validates. Implementation detail lives in the contracts and in `tasks.md`, not here.

---

## Prerequisites

| Need | Check |
|---|---|
| pi CLI on `PATH` | `pi --version` |
| Node ≥ 22.6 (type stripping) for the automated checks | `node --version` |
| This repository on its default branch, published to GitHub as `<owner>/<repo>` | GitHub shows the repository and its description |
| A target project with Spec Kit skills | `.agents/skills/speckit-{specify,clarify,plan,tasks,implement}/SKILL.md` exist in that project |
| No pipeline run in progress | No active `speckit` status line |

Replace `<owner>/<repo>` with the real slug everywhere below before running (research D9).

---

## V1 — Home is identifiable (SC-001, FR-001, FR-007, FR-013)

```bash
# from the home root
ls README.md LICENSE extensions/speckit-orchestrator/index.ts
test ! -e .pi/extensions/speckit-orchestrator && echo "overlay gone"
```

- **Expect**: `README.md` and `LICENSE` exist; `extensions/speckit-orchestrator/index.ts` exists;
  `overlay gone` is printed.
- **Expect (human check)**: reading only the README's first screen (plus the GitHub description)
  tells you this repository is the home and how to install, in under 5 minutes, without being told
  the folder name (SC-001).

## V2 — Payload contains only what it should (FR-002, FR-010, FR-013, FR-015)

```bash
ls extensions/speckit-orchestrator          # index.ts run.ts gates.ts spawn.ts run.test.js
find extensions -name 'SKILL.md'            # expect: nothing
find extensions -name '*.md'                # expect: nothing (no bundled skills/prompts)
ls .pi/prompts/*.md                         # project-only prompts stay here, unpackaged
```

- **Expect**: all five extension files present; no `.md` at all under `extensions/` (so no bundled
  skill or prompt); `.pi/prompts/` is outside the payload folder. All-or-nothing: any missing module
  means install is not a success.

## V3 — Existing automated checks still run from this home (FR-011)

```bash
node --test extensions/speckit-orchestrator/run.test.js
```

- **Expect**: `pass 12`, `fail 0` (run state machine, pause parse, artifact gates, worker flags,
  resume prompt).
- Also run the same command from a clean clone of the published repository to prove the checks do not
  depend on local state.

## V4 — Install from GitHub, latest only (FR-004, FR-005, FR-014, SC-005)

```bash
pi install git:github.com/<owner>/<repo>
pi list
```

- **Expect**: `pi list` shows the repository once, as an unpinned git source (no `@ref`).
- **Expect**: the checkout comes from GitHub — pointing pi at a local path or copying files into a
  project-local overlay is NOT a valid pass.
- **Expect**: commands are usable in a **new** pi session (restart pi after install).
- **Update check**: after pushing a commit to the default branch,
  `pi update --extensions` then a new session exists — this proves "latest" is the default branch and
  no re-pin is needed.

## V5 — Each command appears exactly once (FR-008, SC-004)

In a fresh session, list the available commands (pi's command palette / help).

- **Expect**: `/speckit-run`, `/speckit-cancel`, `/speckit-answer` each exactly once.
- **Expect**: only one `speckit` status line while a run is active.
- Failure mode to confirm absent: two "On it — handing off…" messages, or a question asked twice.
- Cross-check: `pi list` shows the repository once and `.pi/extensions/speckit-orchestrator/` does
  not exist in the target project.

## V6 — No-clarification run completes with one start (FR-003, FR-006, SC-002, SC-006)

In the target project:

```text
/speckit-run Add a small, fully specified feature description here
```

- **Expect**: status advances `specify` → (`clarify` skipped if nothing to ask) → `plan` → `tasks` →
  `implement` without any further start command, ending with `speckit: complete`.
- **Expect**: one worker line per step (`worker pid … · <n> byte prompt · <model>`), step results
  (`✓` or `skipped`), and artifacts written into the target project (`specs/<feature>/spec.md`,
  `plan.md`, `tasks.md`).
- **Expect**: the main session stays usable while the run is in progress (you can keep chatting with
  the orchestrator).

## V7 — Underspecified run pauses, then resumes with one answer (SC-003, US2 AS3)

```text
/speckit-run Add a feature with intentionally vague requirements
```

- **Expect**: the run stops with `speckit: paused (clarify) — question 1/n` and
  `Reply: /speckit-answer <your answer>` naming the question.
- **Expect**: typing unrelated chat text does **not** resume it; the status stays `blocked-on-user`.
- **Expect**: each `/speckit-answer <answer>` advances to the next question (when several were
  emitted in one fence), and the final answer resumes `plan → tasks → implement` to `complete`.

## V8 — Cancel and failure stay terminal (FR-003, SC-006)

Cancel path:

```text
/speckit-run <description>
/speckit-cancel
```

- **Expect**: `speckit: cancelled`; no later step starts; a new `/speckit-run` is then accepted.
- Repeating `/speckit-cancel` with no run prints `Nothing to cancel`.

Failure path (missing step skills): start a run in a project **without** `.agents/skills/`.

- **Expect**: the run fails at the first step with a message naming that step and `missing skill
  <path>` — the failure is about missing step skills, not about a broken or partial extension home
  (US3 AS3).
- **Expect**: later steps do not start.

## V9 — Home is publish-clean (FR-009)

```bash
grep -rn "speckit-orchestrator" .pi/settings.json 2>/dev/null   # expect: no such file / no match
```

- **Expect**: no machine-only state must be stripped before publishing — the install binding lives in
  pi's own settings, not in the repository; no absolute local paths or credentials are present in the
  published content.
- **Expect**: `git status` inside the home shows no leftover `.pi/extensions/` directory.

---

## Validation summary

| Scenario | Requirements covered |
|---|---|
| V1 | FR-001, FR-007, FR-013, SC-001 |
| V2 | FR-002, FR-010, FR-013, FR-015 |
| V3 | FR-011 |
| V4 | FR-004, FR-005, FR-014, SC-005 |
| V5 | FR-008, SC-004 |
| V6 | FR-003, FR-006, SC-002, SC-006 |
| V7 | FR-003, FR-010, SC-003 |
| V8 | FR-003, FR-006, SC-006 |
| V9 | FR-009 |

Done when V1–V9 pass against the published GitHub home, with V4/V5/V6/V7 run from a **new** pi
session after installing from GitHub.
