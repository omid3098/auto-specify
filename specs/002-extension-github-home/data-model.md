# Data Model: Extension GitHub Home

**Feature**: `002-extension-github-home` | **Date**: 2026-09-15
**Inputs**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md)

This feature introduces no runtime data store. The "entities" below are the repository and
distribution structures the design fixes, plus the one existing in-memory runtime model that must
survive the move unchanged.

---

## E1. Extension Home

The repository itself, as the canonical publishable product.

| Field | Type | Rules |
|---|---|---|
| `root` | repository root directory | MUST contain the extension folder, `README.md`, `LICENSE` (FR-001, FR-015) |
| `is_the_pi_package` | boolean | MUST be `false`: the repository root is the home, not the package that pi loads (FR-001) |
| `contents` | set of directories | `.specify/`, `specs/`, `.agents/skills/`, `.pi/prompts/`, `extensions/` — only `extensions/` is part of the package payload |
| `machine_only_state` | set | MUST be empty of absolute machine paths and credentials (FR-009) |

**Validation**
- A newcomer can locate the extension folder without being told a hidden folder name (SC-001).
- Installing the repository root as the extension is not a valid path (spec Edge Cases).

**Relationships**: contains exactly one E2. Produces E3.

---

## E2. Extension Folder (the dedicated first-class package payload)

| Field | Type | Rules |
|---|---|---|
| `path` | path | Exactly `extensions/speckit-orchestrator/` at the home root (FR-013) |
| `entry_point` | path | `extensions/speckit-orchestrator/index.ts` — the only file pi treats as an extension entry |
| `modules` | set of paths | `index.ts`, `run.ts`, `gates.ts`, `spawn.ts` (relative imports) |
| `checks` | path | `run.test.js`, runnable but NOT loaded as an extension |
| `hidden` | boolean | MUST be `false` — not a dot-prefixed, project-only overlay (FR-013) |
| `bundles_skills` | boolean | MUST be `false` (FR-010, FR-015) |

**Validation / state transitions**
- `absent` → `present` by moving the four modules and the check file from
  `.pi/extensions/speckit-orchestrator/`; the source location then becomes absent and stays absent.
- `present` with any module missing = install MUST NOT be treated as successful (spec Edge Case:
  "the home is all-or-nothing", FR-002).

**Relationships**: belongs to E1; is the payload of E3; depends on E6 (skills from the target
project); drives E7.

---

## E3. Published Payload

| Field | Type | Rules |
|---|---|---|
| `included` | set | `extensions/speckit-orchestrator/**`, `README.md`, `LICENSE` (FR-015) |
| `excluded` | set | `.agents/skills/speckit-*`, `.pi/prompts/*.md`, `.specify/**`, `specs/**` (FR-010, FR-015) |
| `runtime_deps` | set | empty — Node built-ins only; pi API import is type-only (research D10) |
| `manifest` | file | none required; pi discovers `extensions/` conventionally (research D1) |

**Validation**: `pi list` after install names the repository once; no Spec Kit skill or project
prompt is loaded from the package.

---

## E4. Installation Binding

| Field | Type | Rules |
|---|---|---|
| `source` | string | Unpinned git source `git:github.com/<owner>/<repo>` (FR-004, FR-014) |
| `pinned` | boolean | MUST be `false`; no tag/commit suffix |
| `authority` | enum | `default-branch-head` — the single definition of "latest" |
| `local_checkout_used` | boolean | MUST be `false`; local paths are not the install source (FR-004) |
| `loaded_copies` | integer | Exactly `1` (FR-008, SC-004) |
| `update_command` | string | `pi update --extensions` |
| `scope` | enum | `global` (user settings) or `project` (`.pi/settings.json`) — maintainer's choice; identity is the repository URL without ref |

**State transitions**

```text
not-installed ──pi install git:github.com/<owner>/<repo>──▶ installed(1 copy)
installed ──pi update --extensions──▶ installed(latest default-branch commit)
installed ──pi remove──▶ not-installed
```

**Failure states (MUST NOT report success)**
- GitHub has no such home, or the latest cannot be retrieved (spec Edge Cases).
- More than one copy would load (overlay still present) — the install step is incomplete until E2's
  old location is absent.

**Relationships**: binds E2 into pi; supersedes the deleted project-local overlay.

---

## E5. Operator Command

| Field | Type | Rules |
|---|---|---|
| `name` | string | `/speckit-run`, `/speckit-cancel`, `/speckit-answer` — all three MUST be registered (FR-006, SC-004) |
| `registration_count` | integer | Exactly `1` per command per session (FR-008, SC-004) |
| `arguments` | string | `/speckit-run <feature description>` (required), `/speckit-answer <answer>` (required), `/speckit-cancel` (none) |
| `allowed_state` | enum | `run`: no active run; `answer`: `blocked-on-user`; `cancel`: `running` or `blocked-on-user` |
| `rejected_behavior` | string | A command invoked in the wrong state notifies and changes nothing |

**Validation**: after install, each command appears once; invoking `/speckit-answer` with unrelated
chat text does not resume a paused run (US2 AS3).

**Relationships**: operates on E7.

---

## E6. Spec Kit Step Skill (external requirement, not owned)

| Field | Type | Rules |
|---|---|---|
| `name` | string | `speckit-specify`, `speckit-clarify`, `speckit-plan`, `speckit-tasks`, `speckit-implement` |
| `location` | path | `<target project>/.agents/skills/<name>/SKILL.md` — resolved from the run's `cwd` |
| `owned_by_home` | boolean | MUST be `false`; the home ships the orchestrator, not Spec Kit (FR-010) |
| `missing_behavior` | string | The step fails with `missing skill <path>`; the failure names the step, and is not reported as a broken extension home (US3 AS3) |

**Relationships**: read by E2's entry point at run time; prerequisite for E7.

---

## E7. Pipeline Run (existing runtime model — unchanged)

Preserved verbatim by this feature; documented here only to fix the invariants the move must not
break (FR-003, FR-012, SC-002, SC-003, SC-006).

| Field | Type | Rules |
|---|---|---|
| `id` | uuid | New per run |
| `featureDescription` | string | From `/speckit-run` |
| `featureDir` | path \| null | Resolved from `.specify/feature.json` after `specify` |
| `state` | enum | `running`, `blocked-on-user`, `failed`, `cancelled`, `complete` |
| `steps` | list | Fixed order `specify`, `clarify`, `plan`, `tasks`, `implement`; status `pending`/`running`/`complete`/`skipped`/`failed`/`cancelled` |
| `currentStep` | enum \| null | The step in flight |
| `pause` | object \| null | `{ step, questions[], answers[], index, hint }` |
| `error` | string \| null | Set when failing |
| `child` | AbortController \| null | Cancels the isolated worker |

**State transitions**

```text
running ──pause fence parsed──▶ blocked-on-user ──one answer per question──▶ running
running | blocked-on-user ──cancel──▶ cancelled            (terminal)
running ──gate/exit/invalid pause──▶ failed                (terminal)
running ──all steps done──▶ complete                       (terminal)
any ──session shutdown──▶ dropped (not persisted; runs do not survive restart)
```

**Invariants (MUST NOT change)**
- At most one active run per session (`isActive`), `failed`/`cancelled` are terminal, and later steps
  never start after failure or cancel; the operator is told which step stopped (FR-003, SC-006).
- `clarify` is recorded `skipped` when the spec was already sufficient — no extra start action.
- Progress is always visible while a run is active, and failures surface to the orchestrator, not
  only in worker output.

---

## Entity relationship summary

```text
E1 Extension Home
 ├─ contains exactly one ─▶ E2 Extension Folder ──published as──▶ E3 Published Payload
 ├─ documented by ─────────▶ Public description (README + GitHub description field)
 └─ bound into pi by ──────▶ E4 Installation Binding
                                   │ loads once
                                   ▼
                             E2 entry point ──registers──▶ E5 Operator Commands ──drive──▶ E7 Pipeline Run
                                                                                              │ reads at run time
                                                                                              ▼
                                                                                   E6 Spec Kit Step Skills (target project)
```
