# SKILL: changesets-versioning
**Layer:** 17 — Developer Experience
**Goal:** Manage package versions, changelogs, and releases in a JavaScript/TypeScript monorepo using Changesets or an equivalent reviewed release process, with predictable semver decisions and traceable published artifacts.

---

## Why This Matters (Senior Perspective)

A shared package can change several applications at once. A small adjustment to a design token, a UI component prop, or an API client may affect consumers that are not being edited in the same pull request. Versioning is the contract that tells downstream consumers whether a change is compatible, requires migration, or introduces a new capability. Without an explicit release process, teams guess which version to publish, forget to update changelogs, publish packages in inconsistent states, or ship a package whose source and published artifacts do not match.

Semantic Versioning (semver) provides a widely used vocabulary: patch releases are intended for compatible fixes, minor releases add compatible functionality, and major releases signal breaking changes. Semver is not magic. It only works when maintainers define what compatibility means for their packages and follow the policy. For a UI library, removing a component prop can be breaking even if the package compiles. For a TypeScript library, changing an exported type can break consumer builds. For a CSS token package, renaming a public variable can break a visual system. The correct version bump depends on the public contract, not the number of changed lines.

Changesets helps teams record release intent alongside ordinary code changes. A changeset file describes which packages need a version bump and why. During review, maintainers can discuss the impact before release automation updates versions and changelogs. In a monorepo, this is especially useful when one change touches a shared package and several apps. The release system can identify affected packages according to its configuration, update metadata, and create a release pull request or publish workflow.

Senior teams treat release automation as a controlled pipeline, not a button that publishes whatever is currently on the main branch. They validate the lockfile, package entry points, tests, build outputs, registry credentials, provenance requirements, and release notes. They distinguish private application deployments from packages published to a registry. They also plan for partial failure: one package may publish while another fails, a token may expire, or a release may need to be retried without publishing the same version twice. The process should be observable and recoverable.

For creative web work, versioning protects the design system and shared component contracts. A token rename may require coordinated migration; a new component prop may be additive; changing the default animation behavior could alter both accessibility and visual output. Release notes should help consumers understand what changed, why it matters, and what action they must take. A robust workflow makes releases boring in the best sense: changes are reviewed, version decisions are explainable, artifacts are reproducible, and consumers can upgrade with confidence.

---

## Core Concepts

### 1. Semantic Versioning describes compatibility intent

A semver version has the form `MAJOR.MINOR.PATCH`, such as `3.4.2`. A patch release is intended for backward-compatible fixes, a minor release adds backward-compatible functionality, and a major release signals incompatible public API changes. Pre-1.0 packages may follow a more conservative or explicitly documented policy because compatibility expectations are less settled.

```text
3.4.2
│ │ │
│ │ └── PATCH: compatible fix
│ └──── MINOR: backward-compatible feature
└────── MAJOR: breaking change
```

The package's public API determines compatibility. A TypeScript type can be part of that API; so can a CSS custom property, a component prop, a command-line flag, or a documented event. Do not infer the bump solely from the code diff size.

**Naive approach:** Bump the patch version for every change because the package still builds locally.

**Correct approach:** Identify the public contract affected, decide whether consumers must change their code or behavior, and choose the version level according to the documented policy.

**Gotcha:** A “minor” release is not automatically safe for every consumer. Consumers who rely on undocumented behavior may still be affected, which is why stable public APIs and clear release notes matter.

### 2. Record release intent with a changeset

A changeset is a small Markdown file that identifies affected packages, the intended bump level, and a human-readable summary. It travels with the code change so reviewers can challenge the release decision before publication.

```md
---
"@acme/ui": minor
---

Add an optional `density` prop to the ProjectCard component.
```

The package name must match the workspace package name. The summary should describe the consumer-visible change rather than the implementation details. Changesets uses its configuration to determine how these files are processed.

**Naive approach:** Merge a shared package change and decide the version manually on release day.

**Correct approach:** Include the release intent with the PR and review it alongside the implementation.

**Gotcha:** A changeset file does not publish anything by itself. It is release metadata consumed by the configured Changesets workflow.

### 3. Use patch, minor, and major based on consumer impact

The version bump is a compatibility decision. Adding an optional prop may be minor; fixing a rendering bug may be patch; removing a required export or changing a prop's meaning may be major. Some changes require judgment, especially when defaults change or previously accepted inputs are rejected.

```md
---
"@acme/ui": major
---

Remove the deprecated `compact` prop. Consumers should use `density="compact"`.
```

The summary should include migration guidance for breaking changes. If several packages are affected, each package's bump should reflect its own public contract. Do not automatically apply the same bump to every package just because they changed in one PR.

**Naive approach:** Use one version bump for every package in the repository.

**Correct approach:** Evaluate each package's exported API and consumers separately, then record the appropriate release intent.

**Gotcha:** A change can be source-compatible but behaviorally breaking. For example, changing an animation default can alter motion, performance, or accessibility expectations even when TypeScript types remain unchanged.

### 4. Configure Changesets at the repository root

Changesets is usually configured at the root of a monorepo. The configuration controls the base branch, access level, changelog behavior, and package versioning strategy. Use settings that match the repository's publishing model.

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "restricted",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

This is an illustrative configuration. `access: "restricted"` is appropriate for private packages on registries that support restricted access; public npm packages generally need a public access policy. Validate fields against the Changesets version installed in the repository.

**Naive approach:** Copy a config from another repository without checking whether packages are public, private, fixed, or independently versioned.

**Correct approach:** Decide the release model first and configure Changesets to express it.

**Gotcha:** Configuration can change release behavior substantially. Review changes to `fixed`, `linked`, `ignore`, and internal dependency update policies as carefully as code.

### 5. Decide whether packages are independently or jointly versioned

Independent versioning lets each package have its own version and release cadence. Fixed versioning keeps a selected group of packages on the same version. Linked packages can be coordinated for version updates while retaining their own package identities.

```json
{
  "fixed": [],
  "linked": [],
  "updateInternalDependencies": "patch"
}
```

For example, a design-token package might release independently, while a family of tightly coupled adapters may be versioned together. Choose based on the compatibility contract, not simply because shared version numbers look tidy.

**Naive approach:** Force every package to version `1.0.0`, even when some packages change much more often than others.

**Correct approach:** Choose independent, fixed, or linked versioning deliberately and document the implications for consumers.

**Gotcha:** Fixed versioning can cause packages to release even when their individual APIs did not change. Independent versioning can require more careful dependency-range management.

### 6. Understand internal dependency updates

When one workspace package depends on another, a release may need to update the dependent package's version or dependency range. Changesets can update internal dependencies according to configuration and dependency relationships, but the intended behavior should be tested in the repository.

```json
{
  "name": "@acme/marketing-widgets",
  "version": "1.2.0",
  "dependencies": {
    "@acme/ui": "^2.3.0"
  }
}
```

If `@acme/ui` receives a compatible release, the consumer package's range may or may not need to change depending on the repository's release strategy and the dependency declaration. If the dependency's major version changes, the consumer may need a corresponding code update and a new release.

**Naive approach:** Assume a package can publish against any version of its internal dependency because the monorepo builds together.

**Correct approach:** Check the published dependency range, build and test the package against the intended dependency version, and release dependent packages when their contract or metadata requires it.

**Gotcha:** Workspace protocols can be transformed during publishing. Inspect the packed manifest to confirm that consumers will receive valid dependency ranges rather than a workspace-only declaration.

### 7. Generate changelogs for consumers, not just maintainers

A changelog should help consumers understand what changed and whether they need to act. A commit list may be useful for auditing but is rarely a good substitute for release notes. The summary should be understandable without knowing internal branch names or file paths.

```md
## 2.4.0

### Minor Changes

- Add an optional `density` prop to `ProjectCard` for compact dashboard layouts.

### Patch Changes

- Correct the fallback image when a project has no cover asset.
```

Use the changelog generator supported by the repository, and edit generated text when it is unclear or misleading. Breaking changes should include migration instructions and, where useful, before/after examples.

**Naive approach:** Publish notes like “update components,” “misc fixes,” or a list of commit hashes.

**Correct approach:** Explain the behavior change, its impact, and any required migration.

**Gotcha:** Automatically generated notes are only as good as the metadata and commit conventions feeding them. Automation does not guarantee good communication.

### 8. Separate version preparation from publishing

Many teams use a release pull request to update package versions and changelogs before anything is published. This creates a review point for version decisions and generated metadata. Publishing then happens only after the release PR is merged or a deliberate release event occurs.

```bash
# Illustrative Changesets workflow commands.
pnpm changeset status
pnpm changeset version
```

The exact commands and automation depend on the repository's package manager and Changesets setup. `changeset version` updates package manifests and changelogs based on pending changesets; it is not the same as publishing packages to a registry.

**Naive approach:** Run versioning and publish commands in a developer shell with no review of the generated files.

**Correct approach:** Inspect the planned version changes, review changelogs and dependency updates, run validation, then publish through a controlled release process.

**Gotcha:** Running versioning consumes or updates changeset metadata. Make sure the resulting files are committed through the intended release PR rather than leaving the repository in an ambiguous state.

### 9. Validate the package artifact, not only the source tree

The files in the repository are not always the files consumers install. A package may need compiled JavaScript, declaration files, CSS, assets, and correct `exports` metadata. A local app may resolve source files directly and conceal a broken package tarball.

```bash
pnpm --filter @acme/ui build
pnpm --filter @acme/ui pack
```

Inspect the resulting archive or use the package manager's pack dry-run capability where available. Verify `main`, `module`, `types`, and `exports` entries against the actual contents. Test a consumer using the packed package or a temporary installation, not only a workspace symlink.

**Naive approach:** Publish because the monorepo app builds successfully.

**Correct approach:** Build, pack, inspect, and test the package artifact in a consumer-like environment.

**Gotcha:** Files excluded by the package's `files` field or `.npmignore` may be missing from the published archive even though they exist locally.

### 10. Keep registry credentials out of source control

Publishing requires credentials, but they must not be committed in `.npmrc`, workflow files, or shell scripts. CI should receive credentials through an approved secret store and use the least privilege needed for the intended package scope.

```yaml
# Illustrative workflow fragment. Configure the registry token as a CI secret.
- name: Configure registry authentication
  run: |
    echo "//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}" >> ~/.npmrc
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

This fragment demonstrates the general principle, not a complete publishing workflow. Ensure the job only runs in a trusted context and that pull requests from forks cannot access publishing secrets. Prefer trusted release events and short-lived credentials where supported.

**Naive approach:** Put a registry token in a committed `.npmrc` so every contributor can publish.

**Correct approach:** Store credentials in CI secrets, restrict publishing jobs, and rotate any token that has been exposed.

**Gotcha:** A workflow can leak secrets through verbose logs or by running untrusted scripts. Secret masking is not a complete security boundary.

### 11. Use pre-release versions for testing release candidates

Pre-release identifiers allow teams to publish or distribute a version candidate before promoting it to a stable release. Common forms include `2.5.0-alpha.0`, `2.5.0-beta.1`, and `2.5.0-rc.2`. The exact workflow depends on Changesets configuration and registry support.

```text
2.5.0-alpha.0
2.5.0-beta.1
2.5.0-rc.2
2.5.0
```

Use pre-releases when consumers need to validate compatibility or when a package is undergoing a staged rollout. Clearly document that the package is experimental and avoid letting production apps accidentally resolve a pre-release range.

**Naive approach:** Publish a candidate under the stable version number and plan to overwrite it if something is wrong.

**Correct approach:** Use a distinct pre-release identifier and a deliberate promotion process.

**Gotcha:** Semantic version range behavior around pre-releases differs from ordinary stable releases. Test how your package manager resolves the candidate before relying on it.

### 12. Handle breaking changes with a migration path

A major release should communicate what breaks, why the old behavior is being removed, and how consumers can migrate. Deprecation can create a transition period, but it should be explicit and not indefinite.

```tsx
// Before
<ProjectCard compact />

// After
<ProjectCard density="compact" />
```

A migration guide can include a codemod, a search-and-replace example, or a checklist. Run consumer builds against the new major version and identify downstream apps that need coordinated changes.

**Naive approach:** Remove a prop, bump the major version, and leave consumers to discover the breakage from compiler errors.

**Correct approach:** Add deprecation guidance where practical, include migration notes, and validate known consumers against the new API.

**Gotcha:** A codemod can handle mechanical syntax changes but cannot automatically decide whether the new behavior matches a product's design intent.

### 13. Design releases to be retryable and observable

Publishing is a sequence of steps: build, validate, create or verify package versions, authenticate, upload artifacts, and record the result. Partial failure is possible. A robust workflow records which packages were published, stops safely when a required step fails, and avoids silently reusing a version with different contents.

```text
validate → prepare versions → build artifacts → publish → verify registry
     │            │                 │             │
     └────────────┴─────────────────┴─────────────┴── logs and release record
```

Use immutable version numbers and make retry behavior explicit. If one package publishes but a later package fails, determine whether the remaining packages can be safely retried at the same version or whether a follow-up release is needed.

**Naive approach:** Rerun the entire release job blindly after a partial publish failure.

**Correct approach:** Inspect the registry and CI logs, identify completed steps, and retry only through the documented idempotent path.

**Gotcha:** Most registries do not let you replace an already-published version's contents. Never assume a failed job means nothing was published.

### 14. Connect release notes, artifacts, and source commits

A release should be traceable to the source commit, version metadata, CI run, and published artifact. This helps incident response and makes it possible to reproduce or investigate a release later.

```text
source commit
    ↓
reviewed release PR
    ↓
tag / version
    ↓
CI build and package archive
    ↓
registry publication + release notes
```

Use immutable tags or release records, keep build logs, and ensure the published package can be traced to the code that produced it. Where the registry and tooling support provenance or attestations, configure them according to the team's supply-chain policy.

**Naive approach:** Publish packages manually from a laptop and rely on a chat message to remember what was released.

**Correct approach:** Release through an auditable pipeline that records versions, source revisions, and artifacts.

**Gotcha:** A tag alone does not prove that the registry artifact was built from that tag. The pipeline must connect those steps and preserve the evidence.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Add a changeset to a feature PR

**What it does:** Records the intended version bump and consumer-facing release note alongside a code change.

**When to use it:** A reusable UI package gains a backward-compatible prop or fixes a published behavior.

```bash
pnpm changeset
```

Follow the interactive prompts, select the affected packages, choose the bump level, and write a clear summary. Review the generated Markdown file in the PR. If no published package contract changes, follow the repository's documented policy for whether a changeset is unnecessary.

### Pattern 2: Review pending release intent

**What it does:** Checks which packages have pending changesets and whether the planned release metadata is coherent.

**When to use it:** Before merging a batch of feature PRs or preparing a release PR.

```bash
pnpm changeset status
```

Use the command supported by the installed Changesets version and verify the output in CI or locally. Review missing changesets, unexpected package bumps, and summaries that do not explain consumer impact.

### Pattern 3: Prepare versions and changelogs

**What it does:** Applies pending changesets to package versions, changelogs, and relevant internal dependency metadata.

**When to use it:** In a release-preparation branch or automation-generated release PR.

```bash
pnpm changeset version
git diff -- package.json packages/*/package.json
git diff -- '**/CHANGELOG.md'
```

Inspect all changed manifests and changelogs. Confirm that internal dependency ranges, workspace protocol transformations, and package versions match the release policy before merging.

### Pattern 4: Build and inspect a package archive

**What it does:** Validates the actual files that consumers will install rather than trusting workspace resolution.

**When to use it:** Before publishing a TypeScript or UI package with compiled outputs and declaration files.

```bash
pnpm --filter @acme/ui build
pnpm --filter @acme/ui pack
```

Inspect the archive contents and verify that package entry points exist. For high-risk libraries, install the archive into a temporary consumer fixture and run a compile/build check.

### Pattern 5: Publish through a trusted CI release job

**What it does:** Publishes prepared package versions from a controlled environment using restricted credentials.

**When to use it:** After a reviewed release PR is merged or an approved tag is created.

```yaml
# Illustrative principles; complete this for the repository's release tooling.
- name: Install
  run: pnpm install --frozen-lockfile
- name: Validate
  run: pnpm lint && pnpm typecheck && pnpm test && pnpm build
- name: Publish
  run: pnpm changeset publish
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

The workflow must be wired to the intended release event and trusted branch. Ensure the publish step cannot run on untrusted pull requests, and verify that the repository's package manager and Changesets version support the commands shown.

### Pattern 6: Release a breaking API migration

**What it does:** Combines a major version bump with migration instructions and validation of known consumers.

**When to use it:** Removing a deprecated prop or renaming a public CSS token.

```md
---
"@acme/ui": major
---

Remove the deprecated `compact` prop. Migrate to `density="compact"`.
```

Include before/after examples in the changelog or migration guide. Build dependent applications against the new API and record any consumer-specific migration steps.

### Pattern 7: Publish a pre-release candidate

**What it does:** Gives selected consumers a distinct candidate version to test before a stable release.

**When to use it:** A new component architecture or major package release needs feedback from downstream apps.

```text
2.5.0-beta.0 → 2.5.0-beta.1 → 2.5.0-rc.0 → 2.5.0
```

Configure the pre-release workflow according to Changesets and registry behavior. Keep production dependency ranges from unintentionally resolving candidate versions.

### Pattern 8: Verify a release after publication

**What it does:** Confirms that the expected version exists in the registry and that its package metadata and files are correct.

**When to use it:** Immediately after an automated release or when investigating a partial publishing failure.

```bash
npm view @acme/ui version
npm pack @acme/ui@2.4.0
```

Use the actual package name and version. Inspect the downloaded archive, compare it with the intended release artifact, and record the CI run and source commit associated with publication.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Choosing version bumps by diff size | Compatibility impact is harder to judge than line count | Evaluate the public API and required consumer changes |
| Forgetting a changeset | Release metadata is treated as a later administrative task | Add a changeset to the PR checklist for published package changes |
| Writing vague changelog summaries | Notes are written for the implementer rather than the consumer | Describe the changed behavior and migration impact in plain language |
| Applying one bump level to every package | A monorepo change touches multiple packages together | Evaluate each package's own contract and dependency impact |
| Misconfiguring package access | A copied config assumes all packages have the same visibility | Set access based on the registry and package publishing policy |
| Assuming `changeset version` publishes packages | Version preparation and publication are conflated | Treat versioning and publishing as separate pipeline stages |
| Publishing without inspecting artifacts | Workspace symlinks hide missing files or broken entry points | Build, pack, inspect, and test a consumer-like installation |
| Committing registry tokens | Local publishing setup is copied into repository files | Use CI secret storage and rotate any exposed credentials |
| Letting fork PRs access publishing secrets | The release job runs on too broad a trigger | Restrict publishing to trusted release events and protected branches |
| Publishing pre-releases under stable versions | The team wants a quick test but skips version identifiers | Use explicit alpha, beta, or release-candidate versions |
| Removing an API without migration guidance | The major bump is treated as the only requirement | Document before/after changes and validate downstream consumers |
| Trusting generated changelogs blindly | Automation is assumed to communicate intent well | Review generated notes for clarity, completeness, and consumer impact |
| Ignoring internal dependency ranges | The monorepo build works with local package links | Inspect the packed manifest and test intended version ranges |
| Retrying a partial release blindly | A failed CI job is assumed to have published nothing | Inspect registry state and retry only the incomplete safe steps |
| Assuming a tag proves artifact provenance | Source tagging and registry publishing are treated as one event | Record the CI run, source commit, and artifact identity |
| Using fixed versions without a reason | Matching version numbers appear simpler | Choose independent, fixed, or linked versioning based on compatibility needs |
| Leaving deprecated APIs forever | Removal creates consumer work | Set a deprecation policy and a documented removal timeline |
| Changing release configuration casually | Config appears to be low-risk metadata | Review configuration changes for effects on package selection and version calculation |
| Publishing from a developer laptop | Manual steps feel faster during a release | Use a controlled pipeline with traceable credentials and logs |
| Treating a successful publish command as full verification | The command exits successfully, so consumers are assumed safe | Query the registry and inspect the published archive after release |

### Before / After: unclear release intent

```md
---
"@acme/ui": patch
---

Fix stuff.
```

```md
---
"@acme/ui": minor
---

Add an optional `density` prop to `ProjectCard` so dashboard layouts can use a compact presentation without custom CSS.
```

The second changeset explains the consumer-visible capability and makes the version decision reviewable. The example is only correct if the prop is genuinely additive and backward-compatible; assess the actual API before choosing a bump.

---

## Mental Models

1. **Version numbers communicate compatibility promises** — they are not merely counters for release automation.
2. **A changeset is release intent in code review** — it makes version decisions visible while the change is still being discussed.
3. **The public API is larger than TypeScript declarations** — CSS tokens, defaults, runtime behavior, and documented commands can all be contracts.
4. **Version preparation is not publication** — generating changelogs and manifests should be a reviewable step before registry changes occur.
5. **The package archive is the product consumers install** — workspace builds alone can hide packaging defects.
6. **A release pipeline must be retryable** — partial publication is a normal failure mode that needs a documented recovery plan.
7. **A token is authority, not configuration text** — registry credentials should be scoped, protected, and kept out of source control.
8. **Changelogs are upgrade guidance** — the best note helps a consumer decide what to do next.
9. **A tag is an identifier, not proof** — trace the published artifact back to the source commit and CI run.
10. **Compatibility decisions are per package** — related changes do not necessarily imply identical version bumps.

---

## Quick Reference

| Task | Command / practice | Key caution |
|---|---|---|
| Create a changeset | `pnpm changeset` | Select the correct package and bump level |
| Inspect pending release intent | `pnpm changeset status` | Check missing or unexpected package changes |
| Prepare versions and changelogs | `pnpm changeset version` | Review every generated manifest and changelog |
| Publish prepared packages | `pnpm changeset publish` | Run only in a trusted release context |
| Inspect package version | `npm view @scope/package version` | Confirm registry and package name |
| Build one workspace | `pnpm --filter @scope/package build` | Ensure the script builds release artifacts |
| Pack a workspace | `pnpm --filter @scope/package pack` | Inspect the actual archive contents |
| Test a specific published version | `npm pack @scope/package@1.2.3` | Verify the downloaded artifact, not only source |
| Patch bump | Compatible bug fix | Confirm the public contract remains compatible |
| Minor bump | Backward-compatible new capability | Check defaults and runtime behavior too |
| Major bump | Breaking public API or behavior | Include migration guidance |
| Configure base branch | `baseBranch` in Changesets config | Keep it aligned with the repository workflow |
| Choose package access | `access` configuration | Public/private registry rules differ |
| Manage internal packages | Workspace dependency ranges | Inspect what is written to published manifests |
| Store registry credentials | CI secret store | Never commit tokens |
| Publish a pre-release | Alpha/beta/RC workflow | Test package-manager resolution behavior |
| Verify release traceability | Record tag, commit, CI run, and version | A tag alone does not prove artifact identity |
| Recover partial publish | Inspect registry and CI logs | Do not assume a failed job published nothing |
| Review breaking changes | Before/after examples and migration guide | A major bump alone is insufficient |
| Validate release candidates | Build, tests, consumer fixture | Confirm packaged behavior matches source |

---

## Build Challenge

### Build: Auditable Monorepo Package Release Pipeline

Create a small monorepo with a reusable `@acme/ui` package and a `@acme/tokens` package. Add Changesets so every published package change records release intent, creates reviewable version updates, and can be published through a controlled CI process. The exercise should prove that the artifact consumers install matches the source and that release failures can be diagnosed.

### Requirements

1. Create a root package manifest and choose one package manager with a committed lockfile.
2. Configure `@changesets/cli` and add a repository-level Changesets configuration appropriate to the packages' visibility.
3. Create `@acme/ui` and `@acme/tokens` with explicit package names, entry points, build scripts, and exported files.
4. Document the public API of each package and identify which changes are patch, minor, or major.
5. Add a feature to `@acme/ui` and create a changeset that records the intended bump and consumer-facing summary.
6. Add a compatible bug fix and create a separate patch changeset.
7. Make a deliberately breaking change in a disposable branch and write a major changeset with before/after migration guidance.
8. Configure the release workflow so version preparation and publication are distinct steps.
9. Run the Changesets status command and verify that pending changesets identify the expected packages and bump levels.
10. Generate versions and changelogs in a release-preparation branch or automated release PR.
11. Review generated package manifests, dependency ranges, and changelogs before merging the release preparation.
12. Build and pack both packages; inspect the archives to ensure required JavaScript, declaration, CSS, and asset files are present.
13. Install a packed package into a temporary consumer fixture and run a compile/build check.
14. Configure CI to install from the lockfile and run lint, type checking, tests, and builds before publication.
15. Store registry credentials as CI secrets and restrict publishing to trusted release events.
16. Verify that untrusted pull requests cannot access publishing credentials.
17. Demonstrate a pre-release candidate using a distinct alpha, beta, or release-candidate identifier.
18. Simulate a partial publishing failure in a disposable test setup and document how to inspect registry state before retrying.
19. Record the source commit, release tag or version, CI run, and published package version for traceability.
20. Write a release checklist covering semver selection, changesets, artifacts, credentials, registry verification, and rollback or follow-up release decisions.

### Failure exercise

Create a package whose manifest points to `dist/index.js`, then deliberately configure the build to emit the file somewhere else. The monorepo app may still pass if it imports workspace source directly, but the packed artifact should reveal the defect. Fix the build or package metadata and prove that a temporary consumer can install and compile against the archive. Next, simulate a publishing job that fails after one package has been uploaded. Inspect the registry and logs before deciding what can safely be retried; do not assume the whole release was rolled back.

### Expected output

- A monorepo with two reusable packages and a documented public API.
- Changesets configuration that matches the repository's publishing model.
- Reviewed changesets and generated changelogs for patch, minor, and major changes.
- A package archive validated in a consumer-like environment.
- CI that checks the release artifacts before publication.
- Registry credentials restricted to trusted release automation.
- A documented pre-release and partial-failure recovery process.
- A release record connecting package version, source commit, and CI execution.

### Definition of Done

- [ ] A clean checkout installs reproducibly from the committed lockfile.
- [ ] Every public package has correct entry points and a documented API.
- [ ] The feature change has a changeset with a justified version bump.
- [ ] The breaking-change example includes migration instructions and a major bump.
- [ ] Version preparation updates only the expected packages and changelogs.
- [ ] Packed archives contain the files referenced by their manifests.
- [ ] A temporary consumer can install and compile against the packed artifact.
- [ ] CI runs required validation before any publish step.
- [ ] Registry credentials are stored outside the repository and restricted to trusted jobs.
- [ ] The pre-release candidate has a distinct pre-release version.
- [ ] The partial-failure exercise checks actual registry state before retrying.
- [ ] A release record connects the version to its source commit and CI run.
- [ ] The README documents how maintainers create changesets and prepare releases.
