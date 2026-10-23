# SKILL: eslint-prettier-setup
**Layer:** 17 — Developer Experience
**Goal:** Build a reliable ESLint and Prettier setup that catches real defects, formats code consistently, integrates cleanly with editors and CI, and stays predictable across a creative web project.

---

## Why This Matters (Senior Perspective)

Linting and formatting are separate controls in a JavaScript or TypeScript codebase. Formatting decides how code is laid out; linting identifies suspicious, unsafe, inconsistent, or prohibited code patterns. When a team blurs those jobs, the repository becomes noisy: developers argue with style rules, editor saves rewrite files unexpectedly, CI fails on formatting differences, and real bugs are hidden inside hundreds of low-value warnings. A portfolio project can look polished while still shipping accidental `any` values, unhandled promises, stale React dependencies, or browser-only code that breaks during server rendering. A reliable setup makes those risks visible before the work reaches a client.

A senior developer does not start by copying a popular configuration and turning every rule on. They decide which tool owns each concern, choose rules that fit the runtime and framework, define how warnings become failures, and test the configuration against representative files. They also think about the whole developer path: a new contributor clones the repository, installs the locked dependencies, opens the editor, runs one documented command, and gets the same result as CI. That is a system, not a pile of packages. The setup should be explainable, reproducible, and easy to change deliberately.

This matters in creative web work because interactive portfolios combine many failure-prone surfaces: React components, animation callbacks, WebGL utilities, build scripts, server routes, and browser APIs. A rule suitable for a Node script may be wrong for a client component; a formatting command that touches generated bundles can create enormous diffs; and a pre-commit hook that takes forty seconds encourages developers to bypass it. A good setup reduces review friction without pretending that linting proves correctness. It should catch repeatable mistakes, leave design decisions to humans, and give the team fast feedback locally plus a trustworthy final check in CI.

---

## Core Concepts

### 1. Formatting and linting have different jobs

Prettier is an opinionated formatter. It parses supported source files and prints them in a consistent layout. ESLint analyzes JavaScript and TypeScript syntax and can report suspicious constructs, enforce conventions, and run plugin rules for React, accessibility, imports, or promises. Treating them as interchangeable leads to fragile configuration: style rules compete with Prettier, or a formatter is expected to catch defects it was never designed to detect.

```json
{
  "scripts": {
    "format": "prettier . --write",
    "format:check": "prettier . --check",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

The commands expose separate intent. `format` changes files; `format:check` verifies formatting without editing; `lint` reports lint findings; `lint:fix` applies only fixes ESLint considers safe or configured. CI should generally run checks, not write changes into the checkout.

**Naive approach:** Configure ESLint with dozens of formatting rules and then run Prettier over the same files. Developers see contradictory diagnostics, and the winning result depends on which command ran last.

**Correct approach:** Let Prettier own whitespace, wrapping, quotes, and layout. Let ESLint own code-quality and correctness rules. If using stylistic ESLint rules, ensure they do not duplicate Prettier's responsibilities.

**Gotcha:** Prettier does not understand project intent. It can make code consistently formatted while leaving a logic bug untouched. Passing formatting checks is not equivalent to passing lint or tests.

**Verification:** prove that formatting and linting fail for different reasons.

```bash
# Formatting should report the file without rewriting it.
npx prettier src/FeaturedProject.tsx --check
# Linting should report code-quality findings for the same file.
npx eslint src/FeaturedProject.tsx
```

Review the output separately: a formatting diff is not a lint diagnosis, and a clean lint run does not prove the file follows the team's formatting policy.

### 2. Choose a configuration model that matches the installed ESLint version

Modern ESLint uses flat configuration in `eslint.config.js`, `.mjs`, or `.cjs`. Older projects may use `.eslintrc` files. Mixing formats without understanding the installed version can cause configuration to be ignored or loaded differently than expected. Before copying a config, inspect `package.json`, the lockfile, and the installed ESLint major version.

```bash
npm ls eslint prettier
```

A minimal flat config for a JavaScript project can be written as:

```js
// eslint.config.js
import js from "@eslint/js";

export default [
  {
    ignores: ["dist/**", "coverage/**", ".next/**", "node_modules/**"],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
];
```

This is a starting point, not a universal framework config. TypeScript, React, tests, and server code need their own parser or plugin support when those files exist.

**Naive approach:** Paste a configuration from a tutorial that targets a different ESLint major version and then debug cryptic schema errors.

**Correct approach:** Pin compatible major versions, read the installed package's configuration format, and migrate intentionally rather than mixing legacy and flat-config examples.

**Gotcha:** A syntactically valid config can still fail to cover the files you care about. Always test it against a known source file and a known violation.

**Verification:** ask ESLint which configuration is effective for a file.

```bash
npx eslint --print-config src/FeaturedProject.js > /tmp/eslint-effective-config.json
node -e "JSON.parse(require('node:fs').readFileSync('/tmp/eslint-effective-config.json', 'utf8')); console.log('Effective config is valid JSON')"
```

The printed config helps distinguish a rule that is disabled from a file that never matched the intended configuration. Inspect the output when a rule seems to have no effect.

### 3. Install packages with the project's package manager

A formatter and linter are development tools, so they belong in `devDependencies` unless the application genuinely needs them at runtime—which it normally does not. Use the package manager already established by the repository. Mixing npm, pnpm, and Yarn can produce multiple lockfiles, inconsistent dependency resolution, and confusing install instructions.

```bash
npm install --save-dev eslint @eslint/js prettier eslint-config-prettier
```

For a new project, keep one authoritative lockfile and commit it. CI should install from the lockfile using the package manager's reproducible mode, such as `npm ci`. Do not manually edit lockfiles to resolve version conflicts; use the package manager to update the dependency graph.

**Naive approach:** Install the latest version of every package globally, then rely on the developer's machine to supply them.

**Correct approach:** Declare tool versions in the repository, commit the lockfile, and document the supported runtime version. Local and CI behavior should be reproducible from a clean checkout.

**Gotcha:** A package can install successfully while its peer dependency range conflicts with the chosen ESLint major. Inspect warnings and compatibility documentation instead of assuming the install output is harmless.

**Verification:** confirm that the project-local executables and dependency tree are being used.

```bash
npm ls eslint prettier eslint-config-prettier
npm exec eslint -- --version
npm exec prettier -- --version
```

Run these commands after a clean install. If a tool is missing or the version differs from the documented setup, repair dependency declarations rather than installing a global workaround.

### 4. Make Prettier configuration explicit

Prettier's defaults are reasonable, but teams benefit from recording the few decisions they care about. The configuration should be stable and small; a giant list of options makes the style system harder to maintain. Use `.prettierrc.json` for serializable settings and `.prettierignore` to avoid generated or irrelevant files.

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

```gitignore
# .prettierignore
node_modules/
dist/
coverage/
.next/
build/
public/vendor/
package-lock.json
```

Ignore generated outputs because formatting them creates noise and may modify artifacts that are regenerated by builds. Do not ignore source directories merely because they currently contain many formatting issues; fix those files or introduce a deliberate baseline plan.

**Naive approach:** Depend on each contributor's editor defaults. Two people can save the same file and create a large formatting diff.

**Correct approach:** Store formatting choices in the repository and ensure editor integrations use the local Prettier version.

**Gotcha:** `printWidth` is a wrapping preference, not a hard maximum line-length rule. Prettier may keep a line longer when changing it would make the structure less readable.

**Verification:** test formatting against a known source file and inspect the ignore behavior.

```bash
npx prettier src/FeaturedProject.tsx --check
npx prettier dist/generated-bundle.js --check
```

The source file should be checked, while generated output should be excluded according to the repository's ignore policy. If the generated file is still processed, review the ignore file and the command's working directory.

### 5. Prevent ESLint and Prettier from fighting

`eslint-config-prettier` disables ESLint rules that conflict with Prettier. In flat configuration, place it after configurations whose stylistic rules it should neutralize. Do not assume installing the package activates it automatically.

```js
// eslint.config.js
import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier/flat";

export default [
  { ignores: ["dist/**", "coverage/**", "node_modules/**"] },
  js.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs}"],
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  // Keep this late so conflicting formatting rules are disabled.
  prettierConfig,
];
```

The exact import path depends on the installed package version. Verify it against that version's documentation. `eslint-config-prettier` is different from `eslint-plugin-prettier`: the former turns off conflicts; the latter runs Prettier as an ESLint rule. Most teams can keep the tools separate and avoid the extra integration layer.

**Naive approach:** Add `eslint-config-prettier` near the top, then add another style-heavy config after it, reintroducing the conflicts.

**Correct approach:** Order configs intentionally and inspect the final effective rules for a representative file.

**Gotcha:** Flat config is an ordered array. Later matching configuration objects can override earlier settings, so order is part of the behavior.

**Verification:** inspect the final effective configuration for a style rule known to conflict with formatting.

```bash
npx eslint --print-config src/FeaturedProject.js > /tmp/eslint-config.json
node -e "const c=require('/tmp/eslint-config.json'); console.log('quotes:', c.rules.quotes, 'semi:', c.rules.semi)"
```

The output should reflect the intended ownership boundary. If later configuration objects re-enable conflicting style rules, reorder or simplify the config instead of asking contributors to alternate commands until the output looks right.

### 6. Define file scope and ignore rules carefully

A repository can contain application source, tests, scripts, generated bundles, configuration files, and copied vendor code. ESLint should analyze the files the team owns, not every file that happens to exist on disk. Broad ignore rules can hide defects; narrow rules can waste time linting minified output.

```js
// eslint.config.js
export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "coverage/**",
      ".next/**",
      "storybook-static/**",
      "public/vendor/**",
    ],
  },
  {
    files: ["src/**/*.{js,jsx,ts,tsx}", "scripts/**/*.{js,mjs,cjs}"],
    rules: {
      "no-debugger": "error",
    },
  },
];
```

For monorepos, decide whether the root config applies to every package or whether packages can extend it with local settings. Make the ownership boundary visible. A rule that applies only to `src` should not accidentally omit a security-sensitive script under `scripts`.

**Naive approach:** Use `eslint .` with no ignore plan, then complain that generated files are slow or produce hundreds of irrelevant errors.

**Correct approach:** Establish the intended source-of-truth globs and exclusions; add tests to verify important folders are included.

**Gotcha:** An ignore pattern is not a substitute for understanding ESLint's working directory and config matching. A command run from a package folder may discover a different set of files than a command run at the repository root.

**Verification:** compare a file that should be linted with an artifact that should be ignored.

```bash
npx eslint src/FeaturedProject.tsx
npx eslint scripts/release-check.mjs
npx eslint dist/generated-bundle.js
```

The first two files should be covered if they are part of the repository's declared source scope. The generated artifact should be ignored. Treat unexpected “no files matched” or ignored-file messages as evidence to review the scope.

### 7. Add TypeScript support without weakening type safety

ESLint's default JavaScript parser does not parse all TypeScript syntax. TypeScript projects need `typescript-eslint` and a config appropriate to the installed version. Some rules can use type information, but those rules cost more because they need a TypeScript program. Start with syntax-aware recommended rules, then enable type-aware rules where their value justifies the runtime cost.

```js
// eslint.config.js — representative flat-config shape
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier/flat";

export default tseslint.config(
  { ignores: ["dist/**", "coverage/**", "node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  prettierConfig,
);
```

Treat this as an adaptable configuration example; package exports and recommended config names can change between releases. Validate it against the exact versions in the lockfile. Avoid silencing every TypeScript rule just because a migration exposes existing debt.

**Naive approach:** Turn off type-aware rules because linting became slow, then leave `any` and unsafe casts everywhere.

**Correct approach:** Separate fast syntax rules from type-aware rules, measure the expensive part, and use narrow suppressions with explanations when a rule cannot yet be satisfied.

**Gotcha:** ESLint rules and TypeScript compiler checks are complementary. `tsc --noEmit` is still needed to catch type errors that lint rules do not cover.

**Verification:** use the compiler and linter to expose different classes of failure.

```bash
npx tsc --noEmit
npx eslint src/FeaturedProject.tsx
```

Create a temporary type error and a separate lint violation in a disposable branch to verify each command catches its own class of problem. Remove both fixtures before merging.

### 8. Configure React rules around actual runtime behavior

React lint rules are valuable when they catch invalid hook usage, missing dependencies, or suspicious component patterns. They should not be treated as a cosmetic checklist. A missing effect dependency can create stale data; adding every dependency without understanding the effect can create a loop. Follow the rule's intent and redesign the effect when the dependency list reveals an unstable model.

```tsx
import { useEffect, useState } from 'react';

type Project = { id: string; title: string };

export function FeaturedProject({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProject() {
      const response = await fetch(`/api/projects/${projectId}`, {
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Project request failed: ${response.status}`);
      }
      setProject((await response.json()) as Project);
    }

    void loadProject().catch((error: unknown) => {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Unable to load featured project', error);
      }
    });

    return () => controller.abort();
  }, [projectId]);

  return <article>{project ? <h2>{project.title}</h2> : <p>Loading project…</p>}</article>;
}
```

This example demonstrates dependency awareness and cancellation, but production code should also expose an intentional error state rather than relying only on logging. Configure the React plugin and hooks rules that match your React version.

**Naive approach:** Disable `react-hooks/exhaustive-deps` whenever it reports a warning.

**Correct approach:** Ask whether the effect represents synchronization with an external system; move derived calculations into render, stabilize callbacks only when needed, and model asynchronous cancellation explicitly.

**Gotcha:** Effects can run more than once in development under Strict Mode. Code must tolerate setup and cleanup rather than relying on a single mount.

**Verification:** inspect effect dependencies and cancellation behavior during review.

```tsx
useEffect(() => {
  const controller = new AbortController();
  void loadFeaturedProject(projectId, controller.signal);
  return () => controller.abort();
}, [projectId]);
```

This is a shape to compare against the actual component, not a substitute for its error state. Confirm that each reactive value used by the effect is represented in the dependency list and that cleanup prevents stale requests from updating the UI.

### 9. Set severity intentionally and make warnings actionable

A warning is not harmless if it appears hundreds of times. Teams quickly stop reading noisy output. Reserve `error` for violations that should block merge, and use `warn` for a migration or a concern that is not yet ready to be a hard gate. For every warning rule, define what progress looks like; otherwise it becomes permanent background noise.

```js
export default [
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-debugger": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "eqeqeq": ["error", "always"],
    },
  },
];
```

Do not blindly make every rule an error on a legacy repository with thousands of findings. Establish a baseline, fix high-risk issues first, and then tighten the gate. Conversely, do not leave critical correctness rules as warnings indefinitely just to keep CI green.

**Naive approach:** Run `eslint . || true` in CI so the pipeline passes regardless of findings.

**Correct approach:** Make the lint command return a failing exit code, document temporary exceptions, and track the removal of warning-level debt.

**Gotcha:** Some CI wrappers accidentally swallow process exit codes. Test the workflow by deliberately adding a known lint violation and confirming the job fails.

**Verification:** prove that an error severity blocks the command while a warning remains visible.

```bash
npx eslint src/FeaturedProject.tsx --max-warnings=0
```

`--max-warnings=0` makes warnings fail this invocation too. Use it only when the repository intends a zero-warning gate; otherwise configure the rule severities and migration policy explicitly.

### 10. Keep editor behavior aligned with command-line behavior

Editor integration is a convenience layer, not the source of truth. The repository config and package scripts must work even when a contributor uses a different editor. If format-on-save invokes a global Prettier version or a different working directory, the result may differ from CI.

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

Place this in a project-level `.vscode/settings.json` only if the team wants to recommend these settings. Avoid forcing editor preferences that are not necessary for correctness. Explain that contributors should install the workspace's dependencies and use the repository's scripts to reproduce CI results.

**Naive approach:** Tell contributors to “install the extension and it should work,” with no documented command-line fallback.

**Correct approach:** Document editor recommendations, package scripts, supported runtime versions, and how to diagnose extension/config discovery issues.

**Gotcha:** Editor settings have changed across VS Code releases. Keep the workspace settings minimal and verify that save actions use the expected ESLint extension version and local config.

**Verification:** reproduce an editor-reported issue from the terminal before changing settings.

```bash
npm run format:check
npm run lint -- --debug
```

If the terminal succeeds but the editor fails, compare the editor's selected workspace, Node runtime, local dependency path, and discovered config. Avoid “fixing” editor state by weakening the repository rules.

### 11. Make linting safe in CI and pull requests

CI should check the same rules developers can run locally. Run formatting verification, lint, type checking, and tests as separate steps or clearly labeled commands. Separate steps make failures easier to diagnose. CI should not auto-fix and commit changes; it should report what needs to be corrected.

```yaml
# .github/workflows/quality.yml
name: Quality checks

on:
  pull_request:
  push:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run format:check
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test -- --runInBand
```

The test command shown is appropriate only if the project's test runner supports that flag; adapt it to the actual runner. Pin action versions according to the repository's dependency policy and keep the Node version aligned with the project's support matrix.

**Naive approach:** Make a CI workflow that runs only on pushes to the default branch, so contributors discover lint failures after merging.

**Correct approach:** Run checks on pull requests and on protected branches, use a clean install, and preserve failure output as a reviewable log.

**Gotcha:** A green lint job does not guarantee the application builds. Keep lint, typecheck, tests, and build validation as separate quality signals.

**Verification:** inspect the exit status rather than relying only on the rendered log.

```bash
npm run lint
printf 'lint exit code: %s\n' "$?"
```

Run the check in a controlled branch with a deliberate violation. A job that displays an error but reports success is not a reliable merge gate; trace shell wrappers and workflow conditionals until the non-zero status reaches CI.

### 12. Integrate hooks without making commits painful

Git hooks can run staged-file checks before a commit, but they are a fast feedback layer rather than a security boundary. A common setup uses Husky and lint-staged so only staged files are processed. Running the full repository lint suite on every commit can be too slow for a creative project with many assets and generated files.

```json
{
  "scripts": {
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx,mjs,cjs}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,css,scss,yml,yaml}": [
      "prettier --write"
    ]
  }
}
```

This configuration is a representative modern Husky/lint-staged arrangement. Follow the installed Husky version's instructions for creating the hook file and ensure the command is committed. Do not put secrets or deployment actions in pre-commit hooks. Developers can bypass local hooks, so CI remains authoritative.

**Naive approach:** Run formatting over the whole repository before every commit, causing long waits and unrelated modifications.

**Correct approach:** Use staged-file matching for quick checks, while CI runs the complete repository validation.

**Gotcha:** Auto-fixing a staged file can change the index state. Verify that lint-staged stages its modifications as expected and test a commit with both a formatting issue and a lint issue.

**Verification:** stage one file with a formatting issue and one unrelated file, then commit in a disposable branch.

```bash
git add src/FeaturedProject.tsx README.md
npx lint-staged
git diff --stat
git diff --cached --stat
```

Only staged files matching the configured patterns should be processed. Inspect both working-tree and index diffs so that hook behavior is understood before the team relies on it.

### 13. Manage legacy code and suppressions as explicit debt

A mature repository may not be clean on day one. The safest migration is scoped and measurable: establish which paths are covered, fix high-risk findings, and use narrow inline suppressions only when a rule is genuinely inapplicable. Every suppression should communicate why it exists and, where possible, what condition would allow it to be removed.

```ts
// The API returns a union that cannot yet be narrowed because its schema
// is maintained by a separate service; remove this suppression after migration.
 // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const legacyPayload = response.data;
```

Prefer a one-line or one-rule suppression over disabling all rules for an entire file. Use comments that explain the risk decision, not comments that merely repeat the lint message. Consider a baseline strategy for a large migration, but avoid committing a permanent ignore list that silently expands.

**Naive approach:** Add `/* eslint-disable */` at the top of every difficult file to get CI green.

**Correct approach:** Suppress the narrowest rule on the narrowest line, explain the reason, and create a follow-up to remove the exception when the underlying problem is fixed.

**Gotcha:** An inline disable can hide future violations on that line, not just the original one. Keep the scope as small as possible.

**Verification:** search for broad disables and require a written justification for each remaining occurrence.

```bash
grep -RInE 'eslint-disable($|[[:space:]]*\*/)' src scripts --include='*.ts' --include='*.tsx' --include='*.js'
```

Review each match in context. Prefer rule-specific suppressions with an explanation; broad file-level disables should be treated as an exception requiring explicit ownership.

### 14. Diagnose the full toolchain as one integrated system

The final concept is a real-world workflow for a portfolio or client project that uses React, TypeScript, animation code, and server-side endpoints. The quality system needs to catch a malformed config, inconsistent formatting, unsafe TypeScript, and a failing CI exit code without rewriting generated assets or exposing secrets. Treat the setup as a pipeline with observable stages.

```json
{
  "scripts": {
    "format": "prettier . --write",
    "format:check": "prettier . --check",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "typecheck": "tsc --noEmit",
    "check": "npm run format:check && npm run lint && npm run typecheck"
  }
}
```

The `check` script is useful as a local aggregate, but the separate commands should remain available so a contributor can identify which stage failed. Keep tests and build checks in CI as well. A failed check should lead to a reproducible diagnosis: inspect the command, confirm the local package versions, run against one file, and then widen the scope.

**Naive approach:** Fix a failing CI check by changing the workflow until it passes, without reproducing the failure locally.

**Correct approach:** Reproduce the command using the lockfile, isolate the smallest failing file or config, make the smallest justified change, and rerun the entire quality gate.

**Gotcha:** A config may work on one developer's machine because a global package or cached dependency is present. Validate from a clean install before calling the issue resolved.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

**Verification:** run the exact quality command from a clean checkout and record the first failing stage.

```bash
npm ci
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

Run the sequence in the same runtime version used by CI. Fix the first real failure, rerun that stage, and then rerun the full sequence to detect interactions that a single isolated command would miss.

### Pattern 1: Separate quality commands with one local entry point

**What it does:** Keeps formatting, linting, type checking, and tests individually diagnosable while giving developers one convenient command for the common quality gate.

**When to use it:** A React or TypeScript project where contributors need fast local feedback before opening a pull request.

```json
{
  "scripts": {
    "format:check": "prettier . --check",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "check": "npm run format:check && npm run lint && npm run typecheck && npm run test"
  }
}
```

Use the actual test runner command installed in the repository. If the project has a slow integration suite, keep it separate from the fast local check and run it in CI.

### Pattern 2: TypeScript-aware linting by file class

**What it does:** Applies TypeScript rules only to TypeScript files and leaves JavaScript configuration files with JavaScript-appropriate parsing and rules.

**When to use it:** A gradual migration from JavaScript to TypeScript, or a monorepo containing both source languages.

```js
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "coverage/**"] },
  js.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs}"],
    rules: { "no-debugger": "error" },
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [...tseslint.configs.recommended],
    rules: { "@typescript-eslint/no-explicit-any": "warn" },
  },
);
```

Verify the `typescript-eslint` config API for the installed version. Do not apply typed rules to files that have no TypeScript program context.

### Pattern 3: CI as a read-only quality gate

**What it does:** Checks repository state without editing files, so a passing workflow proves the committed tree already meets the agreed checks.

**When to use it:** Pull requests, protected branches, and release branches where a maintainer needs a trustworthy pass/fail signal.

```yaml
- run: npm ci
- run: npm run format:check
- run: npm run lint
- run: npm run typecheck
- run: npm run test
- run: npm run build
```

Keep each command as its own CI step so the failure label points to the relevant layer. A successful format check must not hide a failed type check.

### Pattern 4: Staged-file autofix with lint-staged

**What it does:** Applies safe lint fixes and formatting only to files staged for commit, keeping the feedback loop quick.

**When to use it:** A project where developers commit frequently and full-repository checks take too long to run before every commit.

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css,scss}": ["prettier --write"]
  }
}
```

Do not include generated bundles or lockfiles in broad source globs. Keep full validation in CI because local hooks can be skipped.

### Pattern 5: Narrow, explained rule suppression

**What it does:** Records a temporary or justified exception without disabling unrelated rules in a whole file.

**When to use it:** A boundary around a legacy API, an unavoidable third-party type gap, or a documented false positive that cannot be resolved safely today.

```ts
// The legacy SDK's declaration is incomplete; validate the payload before use.
 // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const rawProjectPayload = legacySdk.getProject();
```

The suppression is not permission to trust the data. Add runtime validation at the boundary and remove the suppression once the SDK types are corrected.

### Pattern 6: Config verification with a known-bad fixture

**What it does:** Proves that the linter actually loads the intended config and fails on a known violation.

**When to use it:** After changing ESLint versions, moving from legacy config to flat config, or debugging a CI job that unexpectedly reports zero problems.

```bash
# Run against a known file that contains a deliberate no-debugger violation.
npx eslint scripts/lint-fixture.js

# The quality gate should exit non-zero for the fixture.
```

Use a temporary fixture or a controlled test in a disposable branch. Never leave intentional violations in production source just to prove that linting works.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Running Prettier through ESLint without a clear reason | The team assumes one command is always simpler than two | Keep formatting and linting separate; add `eslint-config-prettier` after style-bearing configs |
| Installing ESLint globally | Local and CI package versions drift apart | Declare ESLint in `devDependencies` and use package scripts or `npx` with the project install |
| Mixing legacy and flat config syntax | Tutorial examples target different ESLint generations | Check `npm ls eslint` and use one config format supported by that version |
| Ignoring all TypeScript lint rules | Type-aware linting is slower or initially noisy | Start with recommended TS rules, then measure and add type-aware checks selectively |
| Disabling `exhaustive-deps` broadly | Effect dependencies reveal an unstable component design | Restructure effects around external synchronization and stabilize only necessary values |
| Using `eslint . || true` in CI | A team wants green builds while hiding unresolved errors | Let the command fail and use scoped warning rules for planned migrations |
| Formatting generated bundles | The source scope is not defined | Add explicit ignores for `dist`, coverage, framework output, and vendored assets |
| Relying only on editor extensions | The developer assumes local save behavior equals CI | Keep canonical package scripts and document command-line verification |
| Auto-fixing the entire repo in a pre-commit hook | The hook was designed without measuring its cost | Run lint-staged on staged files and run full checks in CI |
| Committing multiple lockfiles | Contributors use different package managers | Choose one package manager, remove accidental competing lockfiles, and document it |
| Treating a warning as permanent background noise | No owner or deadline was assigned to warning debt | Promote high-value rules deliberately and track remaining warnings by category |
| Using a broad `eslint-disable` comment | A quick suppression seems cheaper than understanding the failure | Disable one rule on one line and explain the boundary or migration reason |
| Assuming lint proves type correctness | Lint and compiler checks overlap in places but are not equivalent | Add `tsc --noEmit` to the documented quality gate |
| Letting CI auto-fix source | The workflow tries to repair the branch instead of validating it | Use read-only checks in CI and ask contributors to commit fixes locally |
| Failing to test the failure path | A green run is mistaken for proof that the config is active | Add a controlled known-bad fixture and verify the process exits non-zero |
| Running different Node versions locally and in CI | Runtime support was never written down | Declare a supported Node version and use the same version in local setup and CI |
| Ignoring configuration files outside `src` | Lint globs were written around the app only | Include build scripts and security-sensitive configuration files explicitly |

Before → After:

```json
{
  "scripts": {
    "lint": "eslint . || true"
  }
}
```

```json
{
  "scripts": {
    "lint": "eslint .",
    "format:check": "prettier . --check",
    "typecheck": "tsc --noEmit",
    "check": "npm run format:check && npm run lint && npm run typecheck"
  }
}
```

The second version preserves a meaningful exit code and separates distinct checks. Add the project's real test and build commands to CI rather than relying on lint as the only gate.

---

## Mental Models

1. **Formatter and linter are different instruments** — one standardizes presentation; the other flags suspicious or disallowed code.
2. **The repository is the source of truth** — editor extensions should reproduce the local config, not replace it.
3. **A green check must be earned** — commands that swallow exit codes turn a quality gate into decoration.
4. **Warnings spend attention** — every warning should be actionable or intentionally temporary.
5. **Scope is part of correctness** — a rule cannot protect a file that the configuration never visits.
6. **Fast feedback belongs near the edit** — staged checks help locally; complete checks belong in CI.
7. **Suppressions are debt with an address** — narrow scope and a reason make future removal possible.

---

## Quick Reference

| Situation | Recommended action | Notes |
|---|---|---|
| New JavaScript project | Install ESLint, `@eslint/js`, Prettier, and `eslint-config-prettier` | Match the configuration format to the ESLint major |
| TypeScript source exists | Add `typescript-eslint` | Keep TS rules scoped to TS files |
| React components exist | Add React and hooks plugin rules | Follow plugin guidance for the installed React version |
| Formatting should be checked | `prettier . --check` | Does not edit files |
| Formatting should be applied | `prettier . --write` | Review the resulting diff |
| Lint should block a merge | `eslint .` | Do not swallow its exit code |
| Safe lint fixes are desired | `eslint . --fix` | Inspect changes before committing |
| Type errors must be checked | `tsc --noEmit` | Use the project's `tsconfig.json` |
| CI needs reproducible dependencies | `npm ci` | Requires a committed npm lockfile |
| Generated output creates noise | Add explicit ignore patterns | Do not ignore source code to hide findings |
| ESLint and Prettier conflict | Add `eslint-config-prettier` last | Confirm later configs do not re-enable style rules |
| Commit-time checks are too slow | Use lint-staged | Keep complete validation in CI |
| A legacy warning is unavoidable | Use a narrow suppression and explain why | Prefer a follow-up to remove it |
| CI reports zero lint findings suspiciously | Run a known-bad fixture | Verify the job fails as expected |
| Local and CI differ | Compare runtime, lockfile, working directory, and command | Reproduce from a clean install |
| Rule needs to become stricter | Introduce a warning period with an exit plan | Avoid permanent warning debt |
| Client bundle might contain secrets | Keep secrets out of source and browser-exposed variables | Linting is not a secret scanner |
| Build artifacts are accidentally changed | Exclude generated folders from format and lint | Generated code should be recreated by builds |
| Quality checks need one entry point | Add a `check` script | Keep component commands separately runnable |
| New contributor needs setup steps | Document install, Node version, and commands | A clean clone should be enough to reproduce checks |

---

## Build Challenge

### Build: Quality Gate for a React Portfolio Repository

Build a maintainable ESLint and Prettier system for a portfolio application that includes TypeScript React components, animation utilities, API routes, tests, and generated build output. The goal is not to maximize the number of rules; it is to make useful failures reproducible and keep the developer workflow fast.

#### Requirements

1. Create a repository using one package manager and commit exactly one authoritative lockfile.
2. Install ESLint, Prettier, and the compatibility package that prevents formatting rules from conflicting with ESLint.
3. Use a configuration format supported by the exact installed ESLint version; document the version choice.
4. Add a TypeScript-aware configuration for `.ts` and `.tsx` files without breaking JavaScript configuration scripts.
5. Define explicit ignores for dependencies, coverage, framework output, generated bundles, and vendored assets.
6. Add package scripts for `format`, `format:check`, `lint`, `lint:fix`, `typecheck`, `test`, and a combined local `check`.
7. Add at least one React hooks rule and demonstrate how a missing dependency is diagnosed and corrected rather than silenced.
8. Configure at least three meaningful correctness rules, with severity chosen deliberately and explained in the README.
9. Add project-level editor recommendations without making the editor extension a requirement for running checks.
10. Create a pull-request CI workflow that installs from the lockfile and runs formatting verification, lint, type checking, tests, and a production build.
11. Add staged-file checks for fast local feedback, and prove that a normal commit does not format unrelated files.
12. Create a controlled lint fixture that intentionally violates a rule; demonstrate that the command exits non-zero, then remove the fixture from production source.
13. Add one narrow suppression with a comment explaining the underlying boundary and a concrete plan to remove it.
14. Include an API-route example that handles an unsuccessful response or rejected promise and does not expose credentials to client code.
15. Confirm that generated files are ignored while source files in both `src/` and `scripts/` are still checked.
16. Run the entire quality gate from a clean checkout and compare the commands and runtime with CI.

#### Required failure exercise

After the first successful run, deliberately break one part of the setup: move the Prettier compatibility config before a style-bearing config, introduce a known lint violation, or alter a file so formatting verification fails. Confirm the exact job that fails, capture the useful error, and fix the underlying configuration or source. Do not “solve” the exercise by appending `|| true`, disabling the rule globally, or ignoring the file.

#### Expected output

- A clean repository with a documented toolchain and lockfile.
- An ESLint config whose file scope and rule ownership are easy to explain.
- A Prettier config and ignore file that do not touch generated output.
- Package scripts that behave consistently in a terminal and CI.
- A pull-request workflow that fails for real lint, formatting, type, test, or build errors.
- A short README section explaining how contributors install dependencies, run checks, and diagnose common failures.

#### Definition of Done

- [ ] `npm ci` succeeds from a clean checkout with the documented Node version.
- [ ] `npm run format:check` passes without modifying files.
- [ ] `npm run lint` checks the intended source and scripts, and fails on the controlled violation.
- [ ] `npm run typecheck` reports TypeScript errors independently of ESLint.
- [ ] Tests and the production build run in CI with visible, separate step names.
- [ ] A staged-file commit does not rewrite unrelated source files.
- [ ] No generated bundle, secret, or local machine path is committed.
- [ ] Every lint suppression is narrow and justified.
- [ ] The README explains the commands and why formatting, linting, and type checking are separate.
- [ ] The deliberate failure was reproduced, diagnosed, fixed, and retested.
