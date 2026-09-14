# Phase 0 Research: Extension GitHub Home

**Feature**: `002-extension-github-home` | **Date**: 2026-09-15
**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

All Technical Context unknowns are resolved below. No `NEEDS CLARIFICATION` markers remain.

---

## D1. Payload location and entry point

**Decision**: The pi package payload is the repo-root directory `extensions/speckit-orchestrator/`,
with `index.ts` as the entry point and the existing sibling modules (`run.ts`, `gates.ts`,
`spawn.ts`) imported relatively. No root `package.json` and no `pi` manifest are added.

**Rationale**: pi loads a trusted package by looking for a `pi` manifest in `package.json`; if there
is none it falls back to conventional directories (`extensions/`, `skills/`, `prompts/`, `themes/`).
For the `extensions/` directory it iterates entries and, for each subdirectory, resolves `index.ts`
(or `index.js`, or a `package.json` `pi.extensions` list; first match wins). So
`extensions/speckit-orchestrator/index.ts` is discovered and loaded with zero extra files, and
`run.test.js` in the same folder is *not* loaded because only the resolved entry point is collected.
This satisfies FR-013 ("repo-root conventional pi package directory") without adding a manifest that
would itself become a new surface to maintain (constitution V).

**Verified against**: pi resource loader `collectAutoExtensionEntries` → `resolveExtensionEntries`
and `collectPackageResources` in the installed pi distribution (`dist/core/package-manager.js`).

**Alternatives considered**:
- *Root `package.json` with `pi.extensions: ["./extensions/speckit-orchestrator"]`* — works and pins
  the exact payload, but adds a file to maintain and another place to keep in sync; rejected under
  YAGNI. It can be introduced later if pi's conventions change, without moving any code.
- *Publish the repository root itself as a single-file extension* — rejected by the spec
  (Edge Cases: "Installing the repository root as if it were the pi extension is not the v1 install
  path").
- *Keep the folder under a dot-directory (e.g. `.pi/extensions/speckit-orchestrator/`)* — rejected by
  FR-005/FR-008/FR-013: a hidden project-only overlay is exactly what must stop being the source of
  truth.

## D2. Install source and "latest" semantics

**Decision**: Install with the unpinned git shorthand:

```bash
pi install git:github.com/<owner>/<repo>
```

Updates use `pi update --extensions`. No ref/tag is pinned.

**Rationale**: pi treats a git source with no `@ref` as unpinned, so the clone follows the default
branch; `pi update --extensions` reconciles the clone and moves it to the newest default-branch
commit, resetting/cleaning the checkout first. That makes the default branch the single source of
truth for "latest" (FR-014) with no re-pin step. Because the repository contains no root
`package.json`, pi also skips the post-reconcile `npm install` step, so there is no dependency
install to go stale.

**Alternatives considered**:
- *Pinned tag/commit (`@v1`)* — explicitly rejected by the clarify session: `pi update` would not
  advance it, requiring a re-pin for every change.
- *Local path (`pi install ./…` or an absolute path)* — rejected by FR-004/FR-014 and the edge case
  "Installing from a local path to this checkout is not the v1 install path".
- *npm package* — out of scope for v1 (publishing to a registry is explicitly excluded).

## D3. Preventing duplicate registration

**Decision**: Move the extension to `extensions/speckit-orchestrator/` and **delete**
`.pi/extensions/speckit-orchestrator/` in the same change. Do not add a `pi config` disable entry.

**Rationale**: pi's package identity is source-based — for git packages it is the repository URL
*without* the ref — so two copies of the same code reached by different paths are not deduplicated by
path. Leaving the overlay in place would register `/speckit-run`, `/speckit-cancel`, and
`/speckit-answer` twice and paint two `speckit` status lines. Deleting the overlay makes the
duplicate structurally impossible, which is what FR-008 requires ("with no reliance on a disable
setting"). The repository has no `.pi/settings.json` and the user settings list no entry for this
extension, so there is no leftover enable/disable state to clean up.

**Alternatives considered**:
- *Disable the overlay via settings* — rejected by FR-008; also leaves a dead copy in the home.
- *Keep both and rely on pi's path canonicalization* — the installer-facing dedup key is the repo
  URL for git packages; the overlay is a project-local resource, not a git package, so both load.

## D4. Public description and README content

**Decision**: Ship a root `README.md` and set the GitHub repository description to the exact string
recorded in [contracts/package-layout.md](./contracts/package-layout.md#4-public-description). Content
requirements:

1. what the extension is (unattended Specify → Clarify → Plan → Tasks → Implement orchestrator for pi);
2. that **this repository is its home**, and the installable piece is the `extensions/speckit-orchestrator/` folder;
3. the install command (unpinned GitHub source) and update command;
4. the prerequisite that Spec Kit skills must exist in the *target project*;
5. the three operator commands.

**Rationale**: FR-007 requires both the repository description and the root `README.md` to convey
home + install path. The GitHub description field is repository metadata set through the GitHub UI or
API, not a file, so the plan fixes its text in a contract and repeats it in the README; the
description is short and the README carries the full guidance. SC-001 (newcomer identifies home and
install path in under 5 minutes) is met by leading the README with the "what/where/install" blocks
before any internals.

**Alternatives considered**:
- *README only* — fails FR-007, which names the description field explicitly.
- *Description only* — no room for prerequisites and command reference.

## D5. License

**Decision**: `LICENSE` at the repository root, **MIT**, copyright the repository owner.

**Rationale**: FR-015 requires a `LICENSE` in the published package and the spec assumes reuse by
GitHub visitors (US3). MIT is the recommended default here: it is the most common license for pi
packages and extensions, is short enough to keep in one file, and imposes no conditions on the
unattended-pipeline use case. The license choice is a maintainer/legal decision, so the plan records
it as a decision to confirm rather than silently inventing terms.

**Alternatives considered**:
- *Apache-2.0* — provides an explicit patent grant; heavier and unnecessary for a small extension.
- *No license* — would make the install guidance legally unusable by visitors, contradicting US3/SC-005.

## D6. Test command after the move

**Decision**: Document and use `node --test extensions/speckit-orchestrator/run.test.js`.

**Rationale**: `run.test.js` uses `node:test` + `node:assert` and `require()`s the `.ts` modules;
Node 24 runs that with built-in type stripping, verified green (12/12) in this environment. Running
it by explicit path needs no `package.json`, no test script, and no config — consistent with D1 and
constitution V. The relative `require("./run.ts")` etc. stay valid after the move because the test
file moves together with the modules it loads.

**Alternatives considered**:
- *`bun test <path>`* — works, but requires a `./`-prefixed path to be treated as a path rather than
  a filter, and adds a second documented runtime.
- *Add a root `package.json` with a `test` script* — introduces the manifest rejected in D1 purely to
  shorten one command.

## D7. Machine-only state exclusion (FR-009)

**Decision**: Keep the published home free of machine-only state, and record the check rather than
adding a tooling step. The install binding lives in pi's own settings on the maintainer's machine,
never in this repository.

**Rationale**: Inspecting the home shows no absolute machine paths, credentials, or local install
pointers in the content that stays (`.specify/`, `specs/`, `.agents/skills/`, the extension folder):
`.specify/feature.json` and `.specify/integration.json` hold project-relative values only, and there
is no `.pi/settings.json` pinning paths. The only machine-only artifact today is the project-local
overlay that D3 deletes. No stripping work is required, so FR-009 is satisfied by construction.

**Alternatives considered**:
- *Add a `.gitignore`/scrub script* — no private file to ignore; rejected as unnecessary machinery.
- *Commit a `.pi/settings.json` with the install source* — would hard-code a machine/project binding
  into the home and risk a second registration path; rejected.

## D8. Versioning and update path

**Decision**: No version file is added. Updates flow through the unpinned git source and
`pi update --extensions`.

**Rationale**: With no `package.json` and no registry publication, a version field would have nothing
to drive (FR-014 makes the default branch the source of truth). Adding one now would be a config
surface with no consumer.

**Alternatives considered**: `package.json` `version` + release tags — rejected with D1/D2; the spec
pins the unpinned-source model for v1.

## D9. Owner/repository slug

**Decision**: The install guidance uses `git:github.com/<owner>/<repo>`; the literal slug is
substituted by the maintainer at publish time. The repository currently has no git remote, so no slug
exists to bake in yet.

**Rationale**: FR-014 fixes the *form* of the source (unpinned `git:github.com/<owner>/<repo>`); the
concrete owner/repo is a publication-time fact, not a design decision. The README states the command
with the real slug after the repository is created, and the quickstart validation installs from that
same command. Any remaining placeholder text must be replaced before the publish step is considered
done (FR-007, SC-005).

**Alternatives considered**: Hard-coding a guessed slug — would produce install guidance that fails
at publish time; rejected.

## D10. Runtime imports and clone footprint

**Decision**: Keep the extension dependency-free: only Node built-ins at runtime; the
`@earendil-works/pi-coding-agent` import stays `import type`-only and is erased by type stripping.

**Rationale**: Because the module graph has no runtime package imports, the git clone needs no
`npm install`; the clone stays limited to the repository contents, which keeps the "package ships only
the extension folder plus README and LICENSE" constraint (FR-015) true in practice and keeps install
fast and offline-friendly apart from the clone itself.

**Alternatives considered**: Declaring pi API packages as `peerDependencies` and running install —
unnecessary for a type-only import and would add a manifest plus a network install step.

---

## Resolved unknowns summary

| Technical Context slot | Resolution |
|---|---|
| Language/Version | TypeScript loaded directly by pi (Node 24.15 / Bun 1.4); no build |
| Primary Dependencies | pi API types (erased) + Node built-ins only; Spec Kit skills come from the target project |
| Storage | Filesystem: `extensions/speckit-orchestrator/`, `README.md`, `LICENSE`; in-memory run state |
| Testing | `node --test extensions/speckit-orchestrator/run.test.js` |
| Target Platform | pi coding agent; distribution via unpinned GitHub git source |
| Project Type | Single pi package inside a GitHub repository that is also the Spec Kit project home |
| Performance Goals | N/A — unchanged 1 s status repaint |
| Constraints | GitHub-only install, single loaded copy, no bundled skills/prompts, no npm publish |
| Scale/Scope | 1 extension folder (5 files), 2 root docs, 3 commands, 1 deleted overlay |

**Unresolved clarifications**: none. Open maintainer confirmations (already decided with defaults,
not blockers): license text (D5) and the concrete `<owner>/<repo>` slug (D9).
