# SKILL: monorepo-turborepo
**Layer:** 17 — Developer Experience
**Goal:** Design and operate a maintainable JavaScript/TypeScript monorepo with explicit workspace boundaries, reproducible installs, dependency-aware task execution, caching, and reliable CI.

---

## Why This Matters (Senior Perspective)

A monorepo places multiple related applications and packages in one version-controlled repository. It can make shared UI, design tokens, lint rules, API types, and build tooling easier to evolve together. It can also make every command slower and every change riskier when boundaries are unclear. The senior-level question is not “Should we use a monorepo because modern teams do?” It is “Do these projects benefit from coordinated changes, shared tooling, and one source of truth enough to justify the operational complexity?”

Turborepo is a task orchestrator for JavaScript and TypeScript monorepos. It understands a task graph, runs independent tasks in parallel, respects dependency relationships, and can cache outputs so unchanged work does not need to run again. It does not replace the package manager, define package boundaries automatically, or make poorly designed packages independent. If every app imports another app's private source files, the repository remains tightly coupled even if the task runner is fast.

Creative web teams often have a useful monorepo shape: a marketing site, an internal dashboard, a component library, shared tokens, and common configuration packages. A shared button or typography token can then be updated with its consumers in the same pull request. But this convenience comes with responsibilities: every workspace needs a clear owner and public API; package versions and peer dependencies must be understood; generated artifacts should not be committed casually; and CI should run the right tasks for the affected graph rather than blindly rebuilding everything.

A reliable setup starts with the package manager's workspace feature, then adds Turborepo configuration that expresses task dependencies and cacheable outputs. The repository should be installable from a clean clone with one lockfile, and its scripts should behave consistently locally and in CI. Cache correctness is especially important: if a task depends on an environment variable or file that Turbo does not know about, it may reuse a stale result. Remote caching can improve team performance, but it introduces credentials, trust boundaries, and retention questions. Treat the cache as an optimization backed by correct task definitions, not as the source of truth.

---

## Core Concepts

### 1. A monorepo is a repository boundary, not a package boundary

A monorepo can contain several applications and reusable packages, but each workspace still needs a clear responsibility. The repository boundary helps coordinate changes; package boundaries control dependencies and APIs. Do not confuse the two.

```text
repo/
  apps/
    marketing/
    dashboard/
  packages/
    ui/
    tokens/
    eslint-config/
    tsconfig/
```

A marketing app should consume the public API of `@acme/ui`, not reach into `apps/dashboard/src/internal/Button.tsx`. That kind of deep import couples unrelated applications and makes refactoring hazardous.

**Naive approach:** Put every folder in one repository and allow arbitrary relative imports between all of them.

**Correct approach:** Define workspaces intentionally, publish or expose package entry points, and enforce import boundaries with linting or dependency rules.

**Gotcha:** A folder under `packages/` is not automatically a workspace. It must be included by the package manager's workspace configuration and have the expected package metadata.

### 2. Choose a package manager and commit one lockfile

Workspace behavior depends on the package manager. npm, pnpm, and Yarn have different workspace configuration and lockfile formats. Choose one, document the version, and use it consistently across local development and CI.

```json
{
  "name": "acme-web",
  "private": true,
  "packageManager": "pnpm@10.0.0",
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck"
  }
}
```

This is an illustrative root manifest; pin a version compatible with the project and actual tooling. The `packageManager` field communicates the expected toolchain to supported package-manager tooling, but the team should still use a consistent Corepack or installation policy.

**Naive approach:** Let one developer use npm, another pnpm, and a CI runner use whichever lockfile it detects.

**Correct approach:** Standardize the package manager, commit its lockfile, and use a frozen or immutable install in CI.

**Gotcha:** A lockfile is meaningful only when installs respect it. A command that silently updates dependency resolution can hide drift.

### 3. Configure workspaces explicitly

The package manager discovers workspace packages according to its workspace configuration. In a pnpm repository, `pnpm-workspace.yaml` commonly lists workspace globs.

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

A workspace package still needs a `package.json` with a unique package name and appropriate scripts. Keep glob patterns broad enough to include intended packages but not so broad that examples, fixtures, or generated directories become accidental workspaces.

**Naive approach:** Assume Turbo will discover any directory that looks like an app.

**Correct approach:** Configure the package manager's workspaces first, then confirm the package manager lists the expected packages before adding orchestration.

**Gotcha:** A workspace may be discoverable but still have a broken dependency declaration. Workspace discovery does not validate architecture.

### 4. Model task dependencies in `turbo.json`

Turborepo's task graph tells it which tasks must complete before others and which outputs can be cached. A build commonly depends on the build tasks of workspace dependencies. Linting and type checking may not need the same dependency chain as production builds.

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "lint": {
      "outputs": []
    },
    "typecheck": {
      "dependsOn": ["^typecheck"],
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

The example is illustrative and should be adapted to the frameworks and output paths in the repository. The `^build` syntax means dependency workspaces' build tasks run before the current package's build task. Do not declare an output path unless the task actually produces it.

**Naive approach:** Add `turbo.json` with broad defaults and assume the task graph will infer every dependency correctly.

**Correct approach:** Define task prerequisites and outputs deliberately, then inspect the graph and test behavior with a clean cache.

**Gotcha:** Incorrect output declarations can produce confusing cache behavior. Missing outputs may force needless work; overly broad outputs can preserve stale artifacts.

### 5. Declare internal dependencies as workspace dependencies

A package should declare the internal workspaces it imports. This makes the dependency graph explicit and lets the package manager link the correct local package.

```json
{
  "name": "@acme/dashboard",
  "private": true,
  "dependencies": {
    "@acme/ui": "workspace:*",
    "@acme/tokens": "workspace:*"
  },
  "scripts": {
    "build": "vite build",
    "dev": "vite",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  }
}
```

`workspace:*` is supported by pnpm and Yarn Berry but not by every package manager in the same way. Use the syntax supported by the chosen toolchain. Keep a package's runtime dependencies in `dependencies`, and use `devDependencies` for tools only needed to develop or build it, subject to your framework's deployment model.

**Naive approach:** Import another workspace's code but forget to declare the dependency because the local filesystem happens to make it resolve.

**Correct approach:** Declare every package dependency in the consumer manifest and use workspace-aware version syntax supported by the package manager.

**Gotcha:** Hoisting can make undeclared dependencies appear to work locally. A clean install or stricter package-manager setting may expose the error.

### 6. Separate source code from public package APIs

A package should expose a stable public surface. Consumers should import from documented entry points rather than internal file paths. This enables refactoring and lets package maintainers control what is supported.

```ts
// packages/ui/src/index.ts
export { Button } from "./components/Button";
export type { ButtonProps } from "./components/Button";
export { Card } from "./components/Card";
```

```tsx
// apps/marketing/src/pages/Home.tsx
import { Button, Card } from "@acme/ui";
```

For a package consumed by build tools, configure `exports`, `types`, and build outputs to match the actual packaging strategy. Some monorepos use source-level imports during development; others build packages first. Both can work if the contract is explicit.

**Naive approach:** Import `@acme/ui/src/components/Button` from many apps, then discover that moving a file breaks all consumers.

**Correct approach:** Provide public exports and make internal paths private by convention or package export maps.

**Gotcha:** A barrel file can become a performance or circular-dependency problem if it re-exports everything indiscriminately. Keep the public API intentional.

### 7. Understand the difference between task caching and dependency installation

Turborepo caches task results, not package-manager installation itself. The lockfile and package-manager cache determine how dependencies are resolved and downloaded. Turbo's local or remote task cache determines whether a task can reuse prior outputs.

```bash
# Install from the lockfile with pnpm.
pnpm install --frozen-lockfile

# Run the repository build through Turbo.
pnpm turbo run build
```

A cache hit is useful only when the task inputs and outputs are correctly modeled. A frozen install is useful only when the committed manifest and lockfile are consistent.

**Naive approach:** Assume enabling Turbo caching makes installs deterministic or removes the need for a lockfile.

**Correct approach:** Keep dependency resolution reproducible and task caching correct as separate concerns.

**Gotcha:** If a build uses a generated file or environment value that is not declared as an input, Turbo may reuse a result built under different conditions.

### 8. Configure cache inputs and outputs accurately

Turbo computes task hashes from declared inputs and relevant dependency information. `outputs` identifies generated files that should be restored from cache. Global dependencies can include files such as the root lockfile or shared configuration that affect many tasks.

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [
    "pnpm-lock.yaml",
    "tsconfig.base.json"
  ],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$"],
      "outputs": ["dist/**"]
    }
  }
}
```

This snippet illustrates the shape of a task definition; check the installed Turbo version's schema for supported options. Add only dependencies that actually affect the task. If a task reads environment variables, declare the relevant environment inputs using the syntax supported by the installed Turbo version.

**Naive approach:** Mark every task cacheable without identifying the files, variables, and external inputs that affect its output.

**Correct approach:** Start with default source inputs, add known shared dependencies and environment inputs, and test that changing each meaningful input invalidates the cache.

**Gotcha:** A cache can return an internally consistent but stale artifact if the task definition omits a real input. “Cache hit” does not mean “correct result” unless the hash models the task.

### 9. Run only affected work without losing correctness

A monorepo's task graph can avoid rebuilding unrelated packages. This is especially valuable when a change affects only documentation or one leaf package. However, a change to shared tokens, TypeScript configuration, or a common UI package may affect many consumers.

```bash
# Run a task for one workspace and its dependencies as configured.
pnpm turbo run build --filter=@acme/marketing

# Inspect affected work relative to the base branch.
pnpm turbo run lint test build --filter="...[origin/main]"
```

Filtering syntax and behavior depend on Turbo version and repository conventions. Confirm the base branch reference exists in CI and fetch enough history for affected-package detection to work correctly.

**Naive approach:** Run only the changed app's build regardless of which shared package it imports.

**Correct approach:** Use dependency-aware filtering and ensure changes to shared packages trigger validation of their dependents.

**Gotcha:** Shallow CI clones or a missing base reference can make change detection incomplete or fail outright. Treat the base commit as an explicit CI input.

### 10. Use package scripts as the stable command interface

Root scripts should provide a consistent interface for common tasks. Package-level scripts define what each workspace can do. Avoid hard-coding a framework-specific command in every CI workflow when the repository already has a standard script.

```json
{
  "scripts": {
    "dev": "turbo run dev --parallel",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck"
  }
}
```

Each workspace does not need every script, but task names should be consistent where practical. If one package uses `check-types` and another uses `typecheck`, the root command becomes harder to reason about.

**Naive approach:** Have CI, local docs, and deployment scripts each invent different commands for the same task.

**Correct approach:** Define conventional root scripts and document package-specific exceptions.

**Gotcha:** A root script can succeed while silently skipping packages that do not define the named task. Use `--if-present` intentionally and do not mistake it for proof that every package was checked.

### 11. Keep environment variables and secrets explicit

Builds may depend on public configuration, private credentials, feature flags, or environment-specific values. These should not be handled as an undocumented side channel. Turbo needs to know which environment values affect cacheable tasks, while CI must inject secrets securely.

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "env": ["VITE_PUBLIC_API_ORIGIN"],
      "passThroughEnv": ["SENTRY_AUTH_TOKEN"]
    }
  }
}
```

The exact configuration keys and behavior vary by Turbo version; validate against the version pinned in the repository. Public variables can affect the output and should be hashed when appropriate. Secrets that are only passed through to upload source maps should not be printed or written into public build artifacts.

**Naive approach:** Let tasks read arbitrary environment variables without declaring them, then wonder why a cache hit contains configuration from another build.

**Correct approach:** Inventory environment inputs, declare those that affect output, and keep secrets out of logs and artifacts.

**Gotcha:** Passing a secret through does not automatically make the task safe. A script can still leak it to logs or generated files.

### 12. Decide whether packages should build from source or from artifacts

Some monorepos let applications compile workspace source directly. Others require a package to build into `dist/` and expose that output. Source consumption can simplify development but depends on the app bundler understanding the package's source format. Artifact consumption more closely resembles published-package behavior but requires build ordering.

```json
{
  "name": "@acme/tokens",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.build.json"
  }
}
```

This is a simplified package manifest. The referenced output must actually be produced, and the package's TypeScript configuration must emit declarations and JavaScript in the expected locations.

**Naive approach:** Point `exports` to `dist/` before any build creates that directory.

**Correct approach:** Align package exports, compiler output, and Turbo's build dependencies; test from a clean checkout.

**Gotcha:** Development may work because stale `dist/` files exist locally, while a clean CI checkout fails because the required build order is missing.

### 13. Treat shared configuration as a versioned dependency

Shared ESLint, TypeScript, Tailwind, or design-token configuration affects many workspaces. A change to one of these packages can create repository-wide behavior changes. Put shared configuration in an explicit package and test representative consumers.

```json
{
  "name": "@acme/tsconfig",
  "private": true,
  "files": ["base.json", "react-library.json"],
  "exports": {
    "./base.json": "./base.json",
    "./react-library.json": "./react-library.json"
  }
}
```

A consumer can then extend a stable path rather than reaching across repository folders with brittle relative paths. If the package is private to the monorepo, it still needs clear ownership and change review.

**Naive approach:** Copy slightly different config files into every app until they drift.

**Correct approach:** Centralize common defaults, keep documented escape hatches, and validate changes across relevant packages.

**Gotcha:** A single shared config change can break apps with different frameworks. Do not assume every consumer has identical compiler or lint requirements.

### 14. Integrate the full graph in a clean CI environment

A monorepo build that succeeds only on a developer's laptop is not reliable. CI should install from the lockfile, run the defined task graph, and use cache settings that cannot hide missing outputs. Clean builds are especially important after changing package boundaries or task configuration.

```yaml
name: Monorepo CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
```

This workflow is illustrative. Pin versions according to the team's policy, ensure scripts exist, and configure any remote cache credentials through the CI secret store. Fetching full history can help affected-package filtering; use the least history that still supports the chosen detection method.

**Naive approach:** Run one app's build locally and assume all workspace dependencies are healthy.

**Correct approach:** Validate the repository from a clean environment and run tasks according to the dependency graph.

**Gotcha:** A CI cache can make a broken clean build appear healthy. Periodically run a cache-disabled verification job or test clean-cache behavior when changing task definitions.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Standard apps-and-packages layout

**What it does:** Separates deployable applications from reusable packages and shared tooling.

**When to use it:** A team maintains a marketing site, a dashboard, and a shared design system in one repository.

```text
apps/
  marketing/
  dashboard/
packages/
  ui/
  tokens/
  eslint-config/
  tsconfig/
```

Keep application-specific routes and server code inside their app. Move code into a package when there is a real reuse or ownership reason, not simply because a folder looks reusable.

### Pattern 2: pnpm workspace with a single root lockfile

**What it does:** Links internal packages and resolves external dependencies through a shared lockfile.

**When to use it:** Multiple TypeScript apps need consistent dependency resolution and shared packages.

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

```json
{
  "name": "@acme/marketing",
  "private": true,
  "dependencies": {
    "@acme/ui": "workspace:*"
  }
}
```

Use the package manager version selected by the repository and install in frozen mode in CI. Avoid mixing lockfiles from different package managers.

### Pattern 3: Dependency-aware build graph

**What it does:** Ensures a package's dependencies are built before the package itself and caches generated outputs.

**When to use it:** Apps import compiled output from shared packages.

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    }
  }
}
```

Adjust output paths per framework and package. If an app compiles workspace source directly, it may not need every dependency build step; model the real build process rather than copying this configuration blindly.

### Pattern 4: Filter work to an affected app and dependencies

**What it does:** Runs tasks for a chosen workspace while including the packages it depends on.

**When to use it:** A developer wants a fast local build for the dashboard and its shared packages.

```bash
pnpm turbo run build --filter=@acme/dashboard
```

For CI, use the repository's tested affected-change filter and ensure the base branch exists. Verify that edits to shared packages cause dependent apps to be included.

### Pattern 5: Remote cache for team CI

**What it does:** Allows CI and teammates to reuse task outputs generated elsewhere when task inputs match.

**When to use it:** Builds are expensive and multiple contributors repeatedly validate the same graph.

```bash
# Illustrative command; configure the remote cache according to
# the installed Turbo version and your organization's credentials policy.
pnpm turbo run build
```

Remote caching is configured through the supported Turbo account or self-hosted cache setup and CI environment. Do not hard-code tokens in repository files. Treat cache access as a security boundary and follow your organization's retention and trust requirements.

### Pattern 6: Shared UI package with explicit exports

**What it does:** Gives applications a stable import surface for common components.

**When to use it:** Multiple apps share buttons, cards, modal primitives, and typography components.

```ts
// packages/ui/src/index.ts
export { Button } from "./components/Button";
export type { ButtonProps } from "./components/Button";
export { ProjectCard } from "./components/ProjectCard";
```

```tsx
import { Button, ProjectCard } from "@acme/ui";
```

Keep dependencies such as React as peer dependencies when appropriate for the package model. Test package consumers and avoid exporting internal implementation files unnecessarily.

### Pattern 7: Shared environment contract

**What it does:** Documents required environment values and ensures output-affecting variables are represented in task configuration.

**When to use it:** Apps have public API origins, feature flags, or build-time analytics configuration.

```text
# .env.example — placeholders only
VITE_PUBLIC_API_ORIGIN=https://api.example.invalid
VITE_NEW_GALLERY=false
```

Do not put real tokens in the template. Document which variables are public and which must remain server-side. Configure Turbo's environment handling for the installed version so cache keys reflect output-affecting values.

### Pattern 8: Clean-cache release verification

**What it does:** Checks that the build can be reproduced without relying on stale local or remote outputs.

**When to use it:** Changing Turbo task inputs, package exports, TypeScript config, or release tooling.

```bash
pnpm install --frozen-lockfile
pnpm turbo run lint typecheck test build --force
```

`--force` is intended here to force task execution rather than reuse cached results; confirm the exact option in the pinned Turbo version. Run the workflow from a clean checkout when possible and verify that generated outputs are created by the declared tasks.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Adding Turbo before defining workspaces | The task runner is mistaken for a package manager | Configure and verify package-manager workspaces first |
| Committing multiple lockfiles | Contributors use different package managers | Standardize one package manager and remove accidental competing lockfiles through a reviewed change |
| Leaving internal dependencies undeclared | Hoisting or workspace symlinks hide missing manifest entries | Declare every imported workspace package in the consumer's manifest |
| Importing another app's private source | Relative imports are convenient during initial development | Move reusable code into a package and expose a documented public API |
| Omitting build dependencies | Local stale output makes an app build appear successful | Model dependency build order with `dependsOn` and validate from a clean checkout |
| Declaring the wrong output directory | Framework defaults are copied without checking actual build output | Inspect the produced files and list only real task outputs |
| Caching a long-running dev task | Every task is treated as cacheable by default | Mark persistent development tasks as non-cacheable and persistent where supported |
| Forgetting environment inputs | Builds read values from the shell outside task configuration | Declare output-affecting variables using the pinned Turbo version's supported config |
| Passing secrets into public output | All environment variables are treated alike | Separate public build-time config from private server-side secrets and inspect artifacts |
| Assuming cache hits guarantee correctness | A green cache result is treated as proof of correct inputs | Test cache invalidation and periodically run forced clean verification |
| Filtering out affected consumers | CI checks only the app whose files changed | Use dependency-aware filters and test changes to shared packages |
| Using inconsistent script names | Workspaces evolved independently | Standardize task names and document exceptions |
| Allowing root scripts to skip checks silently | `--if-present` is used without reviewing coverage | Verify expected workspaces and fail CI if required checks are missing |
| Duplicating shared configuration | Each app is configured separately for convenience | Centralize shared defaults and test framework-specific consumers |
| Over-centralizing unrelated code | Monorepo adoption is mistaken for a requirement to share everything | Keep package boundaries aligned with genuine reuse and ownership |
| Storing credentials in repository config | Remote cache setup is copied from a local terminal | Use CI secret storage and restrict cache access to trusted workflows |
| Assuming all package managers support identical syntax | Workspace protocols are treated as universal | Follow the syntax and capabilities of the chosen package manager |
| Depending on stale `dist/` output | Local artifacts conceal missing build steps | Delete generated directories and verify the build graph recreates them |
| Using a monorepo for unrelated projects without a reason | One repository seems simpler to administer | Compare shared-change benefits with access, release, and tooling costs before consolidating |
| Failing to define package ownership | Shared packages become everyone’s and no one’s responsibility | Assign maintainers, document compatibility expectations, and require consumer-aware review |

### Before / After: an undeclared workspace dependency

```tsx
// Before: this relative import reaches into another package's private source.
import { Button } from "../../../packages/ui/src/components/Button";
```

```tsx
// After: the dependency is declared in package.json and imported via its public API.
import { Button } from "@acme/ui";
```

The second form makes the architectural dependency visible to the package manager and the team. It also allows the UI package to reorganize internal files without changing every consumer.

---

## Mental Models

1. **The repository is the coordination boundary; the package is the API boundary** — one Git repository does not justify unrestricted imports.
2. **The package manager resolves dependencies; Turbo schedules tasks** — they solve related but different problems.
3. **A task graph is an executable build contract** — dependency edges and outputs must match how the code is really built.
4. **Cache correctness depends on input completeness** — a missing input can turn a fast build into a stale build.
5. **Shared code multiplies both leverage and blast radius** — reusable packages need ownership, tests, and deliberate APIs.
6. **A clean checkout is the truth test** — stale local artifacts often hide missing declarations and task dependencies.
7. **Filtering is an optimization, not an excuse to skip dependents** — affected consumers must still be validated.
8. **Remote cache is infrastructure with a trust boundary** — credentials, artifacts, and cache write permissions need policy.
9. **A workspace is not automatically a good package** — promote code into a package when its reuse and ownership are real.
10. **One root command should be predictable** — stable scripts make local development, documentation, and CI easier to align.

---

## Quick Reference

| Task | Command / configuration | Key caution |
|---|---|---|
| Declare workspace folders | `pnpm-workspace.yaml` | Use the chosen package manager's format |
| Install deterministically | `pnpm install --frozen-lockfile` | Keep manifests and lockfile in sync |
| Run all builds | `pnpm turbo run build` | Ensure every relevant workspace defines the task |
| Run one app's build | `pnpm turbo run build --filter=@acme/marketing` | Include needed dependencies and verify filter semantics |
| Run linting | `pnpm turbo run lint` | Confirm expected packages actually have lint scripts |
| Run type checking | `pnpm turbo run typecheck` | Model dependency order when package types are built |
| Declare internal dependency | `"@acme/ui": "workspace:*"` | Syntax depends on package manager |
| Build dependencies first | `"dependsOn": ["^build"]` | Only use when dependency build ordering is required |
| Cache build outputs | `"outputs": ["dist/**"]` | Match actual generated paths |
| Disable dev-task cache | `"cache": false` | Check configuration schema for pinned Turbo version |
| Mark dev server persistent | `"persistent": true` | Persistent tasks are not ordinary finite CI tasks |
| Add shared config input | `globalDependencies` | Include only files that affect task results |
| Declare environment input | `env` / supported environment configuration | Confirm syntax against installed Turbo version |
| Inspect task graph | `pnpm turbo run build --dry` or version-supported graph command | Verify exact flags for pinned version |
| Force task execution | `pnpm turbo run build --force` | Verify the option in the installed Turbo version |
| Inspect workspace packages | `pnpm list --recursive --depth -1` | Output depends on package manager version |
| Run one package script | `pnpm --filter @acme/ui build` | Ensure workspace package name matches |
| Create a public export | `packages/ui/src/index.ts` | Avoid accidental circular exports |
| Validate from clean install | Remove local generated output, then install and build | Do not delete uncommitted work |
| Configure remote cache | Use supported Turbo remote-cache setup | Never commit cache tokens |
| Check root task coverage | Compare expected workspaces with scripts | Silent skipping can hide missing quality gates |

---

## Build Challenge

### Build: Multi-App Design System Monorepo

Create a monorepo for a small creative studio with a public marketing site, a private dashboard, a reusable UI package, shared design tokens, and shared TypeScript/lint configuration. Use Turborepo to orchestrate development and production tasks. The result should be reproducible from a clean clone and should demonstrate that a shared package change triggers the appropriate dependent checks.

### Requirements

1. Create a root package manifest with a private repository name, pinned package-manager metadata, and stable root scripts.
2. Add the selected package manager's workspace configuration for `apps/*` and `packages/*`.
3. Create two applications: `apps/marketing` and `apps/dashboard`, each with its own manifest and meaningful `dev`, `build`, `lint`, `test`, and `typecheck` scripts where applicable.
4. Create `packages/ui` with at least three reusable components and a documented public export file.
5. Create `packages/tokens` with shared design tokens such as color, spacing, radius, and typography values.
6. Create a shared TypeScript configuration package and a shared lint configuration package, with explicit export paths and clear ownership.
7. Declare internal workspace dependencies in the consuming package manifests using syntax supported by the chosen package manager.
8. Configure `turbo.json` with build dependencies, output paths, task caching, and persistent non-cacheable development tasks.
9. Document the difference between dependency installation caching and Turbo task caching.
10. Add `.gitignore` and `.env.example` files that prevent local secrets and generated artifacts from being committed.
11. Define which environment variables affect each build and configure the task graph accordingly.
12. Ensure package exports match the files actually emitted by each package's build.
13. Add a CI workflow that installs from the lockfile and runs lint, typecheck, tests, and production builds.
14. Include enough Git history in CI for the chosen affected-package filter to identify the base commit.
15. Demonstrate that a change to `packages/tokens` causes dependent apps or packages to be validated.
16. Demonstrate a cache hit for an unchanged task and a cache miss after changing a declared input.
17. Run a forced or clean-cache build to verify that stale artifacts are not hiding missing dependencies.
18. Document how to add a new workspace, declare dependencies, and expose a public package API.
19. Document remote-cache credential handling without committing any token or secret.
20. Add a failure test that intentionally omits a workspace dependency or output declaration, show how the clean CI build catches it, and then correct the configuration.

### Failure exercise

First build both apps successfully on a developer machine. Then remove a generated `dist/` directory from the shared UI package and run the consumer build from a clean checkout. If it fails, fix the missing task dependency or output configuration rather than restoring a stale artifact manually. Next, change a shared token and verify the affected graph includes the correct consumers. Finally, alter an environment variable that changes generated output and confirm the task cache is invalidated as expected.

### Expected output

- A repository with two apps and several explicitly defined packages.
- A single package-manager lockfile and reproducible install command.
- A Turbo task graph with meaningful dependencies and output declarations.
- Shared UI and tokens imported through public package APIs.
- CI that validates all required workspaces and uses affected filtering safely.
- Demonstrated cache hit, cache miss, and clean-cache build.
- Documentation of workspace conventions, environment variables, and cache security.

### Definition of Done

- [ ] A clean clone installs successfully using the documented package manager and lockfile.
- [ ] Workspace discovery lists only the intended apps and packages.
- [ ] Internal dependencies are declared in package manifests.
- [ ] Apps import shared code through public package APIs rather than private relative paths.
- [ ] Turbo's task dependencies and outputs match the real build process.
- [ ] Development tasks are configured so persistent processes are not incorrectly cached.
- [ ] Changes to shared packages trigger validation of affected consumers.
- [ ] Environment variables that affect task output are represented in the task configuration.
- [ ] CI runs lint, type checking, tests, and builds for the intended graph.
- [ ] The clean-cache verification succeeds without relying on stale generated files.
- [ ] Remote cache credentials are stored outside source control.
- [ ] The README explains how to add a workspace and how to run common root commands.
