# Contract: Package Layout & Public Surface

**Feature**: `002-extension-github-home` | **Date**: 2026-09-15
**Related**: [spec.md](../spec.md) FR-001, FR-007, FR-013, FR-014, FR-015 · [data-model.md](../data-model.md) E1–E4

This contract fixes what the repository must contain, what pi must load from it, and what a GitHub
visitor must read. It is the acceptance surface for "this repository is the home and installs from
GitHub".

---

## 1. Required repository layout

```text
<home root>/
├── README.md                                  # required (FR-007, FR-015)
├── LICENSE                                    # required (FR-015)
├── extensions/
│   └── speckit-orchestrator/
│       ├── index.ts                           # entry point (default export: (pi) => void)
│       ├── run.ts
│       ├── gates.ts
│       ├── spawn.ts
│       └── run.test.js
├── .agents/skills/speckit-*/SKILL.md          # Spec Kit skills: target-project requirement, not payload
├── .pi/prompts/*.md                           # project-only prompts: not payload
├── .specify/                                  # project state: not payload
└── specs/                                     # feature artifacts: not payload
```

## 2. Payload rules

| Rule | Requirement |
|---|---|
| P-1 | pi loads exactly one extension: `extensions/speckit-orchestrator/index.ts` (FR-013) |
| P-2 | The extension folder path is exact; renaming or nesting deeper breaks the home |
| P-3 | `run.test.js` is present in the folder but is NOT loaded as an extension |
| P-4 | No Spec Kit step skill is bundled or vendored (FR-010, FR-015) |
| P-5 | No `.pi/prompts/*.md` content is bundled (FR-015) |
| P-6 | No runtime npm dependency is required; the pi API import stays type-only |
| P-7 | The old `.pi/extensions/speckit-orchestrator/` path MUST NOT exist after the change (FR-008) |
| P-8 | The repository root is NOT installable as the extension (spec Edge Cases) |

## 3. Install contract

```bash
# install (unpinned → default branch is the source of latest)      FR-004, FR-014
pi install git:github.com/<owner>/<repo>

# update to the newest default-branch commit                        FR-014
pi update --extensions

# verify exactly one entry
pi list
```

- `<owner>/<repo>` is substituted with the real slug at publish time (research D9).
- A local path to a checkout MUST NOT be used as the install source.
- Install MUST NOT be reported successful if the GitHub home is missing, the latest cannot be
  retrieved, or more than one copy would load.
- After the first successful install, the project-local overlay is already gone (P-7), so no
  duplicate commands or status lines can appear (FR-008, SC-004).

## 4. Public description

**GitHub repository description field** (set in repository settings; not a file):

```text
Home of the Spec Kit pipeline orchestrator for pi — install the extensions/speckit-orchestrator folder from GitHub to run Specify → Clarify → Plan → Tasks → Implement unattended.
```

**README.md required content**, in this order:

1. One-paragraph statement of what the extension is and that **this repository is its home**
   (FR-007).
2. The installable piece is the dedicated first-class folder `extensions/speckit-orchestrator/`
   — not the repository root, not a hidden overlay (FR-007, FR-013).
3. Install + update commands from §3, with the real slug (FR-004, FR-014).
4. Prerequisite: Spec Kit skills (`speckit-specify`, `speckit-clarify`, `speckit-plan`,
   `speckit-tasks`, `speckit-implement`) must exist in the **target project** under
   `.agents/skills/`; this package does not bundle them (FR-010).
5. Operator command reference (see [operator-commands.md](./operator-commands.md)).
6. Behavior summary: unattended pipeline, pause only for named questions, one run per session,
   runs do not survive session restart (FR-003).

**Acceptance**: a reader who has never seen the project can state the home, find the extension
folder, and copy the install command within 5 minutes without being told a hidden folder name
(SC-001).

## 5. License

`LICENSE` at the root contains the full MIT license text with the repository owner as copyright
holder (FR-015; decision + alternatives in [research.md](../research.md#d5-license)).

## 6. Non-goals

- No npm/registry publishing, no version file, no release pipeline.
- No new pi config surface, settings file, or disable entry.
- No change to the operator command set, pause protocol, or worker isolation flags.
