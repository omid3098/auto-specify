# auto-specify

This repository is the **home** of the Spec Kit pipeline orchestrator for
[pi](https://github.com/earendil-works/pi) — a pi extension that runs the full Spec Kit pipeline
`specify → clarify → plan → tasks → implement` unattended, and stops only when a step genuinely needs
a human answer.

> Home of the Spec Kit pipeline orchestrator for pi — install the extensions/auto-specify
> folder from GitHub to run Specify → Clarify → Plan → Tasks → Implement unattended.

## What gets installed

The installable piece is the dedicated, first-class pi package folder:

```text
extensions/auto-specify/     # index.ts · run.ts · gates.ts · spawn.ts · run.test.js
```

- pi discovers this folder through its conventional repo-root `extensions/` directory and loads
  `extensions/auto-specify/index.ts` as the extension entry point.
- The **repository root is not** the extension, and there is no hidden project-local overlay: this
  folder is the single source of truth. `run.test.js` ships alongside the modules but is not loaded
  as an extension.

## Install

Requires the pi CLI (`pi --version`).

```bash
# install — unpinned, so the default branch is the source of "latest"
pi install git:github.com/omid3098/auto-specify

# update to the newest default-branch commit
pi update --extensions

# confirm exactly one entry
pi list
```

Restart pi after installing so the extension is loaded in a new session. Do not install from a local
path to a checkout of this repository — the GitHub source is the install path, and it is the only
supported one.

## Prerequisite: Spec Kit skills live in *your* project

This package ships the orchestrator only. The step skills it drives must exist in the **target
project** where you start a run:

```text
<target project>/.agents/skills/speckit-specify/SKILL.md
<target project>/.agents/skills/speckit-clarify/SKILL.md
<target project>/.agents/skills/speckit-plan/SKILL.md
<target project>/.agents/skills/speckit-tasks/SKILL.md
<target project>/.agents/skills/speckit-implement/SKILL.md
```

No Spec Kit skill or prompt is bundled here, by design. If a skill is missing, the run fails at that
step with `missing skill <path>` and starts no later step.

## Commands

| Command | Input | Effect |
|---|---|---|
| `/speckit-run <feature description>` | non-empty feature description, used verbatim | Starts one run and drives `specify → clarify → plan → tasks → implement` on its own. Refused with `A speckit run is already active` if a run is already active. |
| `/speckit-cancel` | none | Aborts the in-flight worker, marks the run `cancelled`, clears the status line. Terminal: no later step starts, and a new `/speckit-run` is then accepted. With no active run it reports `Nothing to cancel`. |
| `/speckit-answer <answer>` | non-empty answer to the question currently shown | Records one answer. If more questions were asked together, the next one is shown and the run stays paused; the last answer resumes the remaining steps without re-running earlier ones. Only this command resumes a paused run — unrelated chat text does not. |

Progress is always visible in the main session, which stays usable while a run is in flight:

- `speckit: <done>/5 <current>` with elapsed seconds while running;
- `speckit: <step> worker pid <pid> · <n> byte prompt · <provider>/<model>` when a step's worker starts;
- `speckit: <step> ✓`, or `speckit: <step> skipped` when `clarify` finds nothing to ask;
- `speckit: paused (<step>) — question i/n` plus `Reply: /speckit-answer <your answer>`;
- terminal states `speckit: complete`, `speckit: cancelled`, or `speckit: failed at <step>`.

## Behavior

- **Unattended pipeline.** One `/speckit-run` is enough; the orchestrator advances the steps itself and
  gates each step on its artifacts (for example `missing plan.md` fails the run at `plan`).
- **Pause only for named questions.** The run interrupts only for questions a worker emits, and each
  question is answered explicitly with `/speckit-answer`.
- **One run per session.** A run is started, cancelled, or answered — never two at once.
- **Runs do not survive a session restart.** Run state is in-memory per session; restarting pi loses
  an in-progress run and its state. The installed extension itself still loads normally.
- **Isolated workers.** Each step runs in its own worker process, so the main session remains yours.
- **Nothing about the pipeline changed** in the move to this home: command set, pause rules,
  artifact gates, and progress reporting are identical to the previous project-local copy.

## Tests

The orchestrator's run rules are covered by the checks that ship in this home:

```bash
node --test extensions/auto-specify/run.test.js   # expect: pass 12 / fail 0
```

Requires Node ≥ 22.6 (the checks load the TypeScript modules directly via type stripping). No
manifest, build step, or dependency install is needed — the extension uses Node built-ins only.

## License

MIT — see [LICENSE](./LICENSE).
