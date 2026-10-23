# SKILL: git-workflow-branching
**Layer:** 17 — Developer Experience
**Goal:** Establish predictable Git workflows for feature delivery, code review, release preparation, and collaboration while keeping the main branch stable and the history understandable.

---

## Why This Matters (Senior Perspective)

Git is not merely a place to save snapshots. It is the coordination protocol that lets multiple developers change the same codebase without losing work or making every integration a risky event. A good branching workflow makes work reviewable, gives CI a clear place to run, provides a controlled path to production, and makes it possible to recover from mistakes. A poor workflow creates long-lived branches that diverge, enormous pull requests that no one can review carefully, commits that mix unrelated concerns, and emergency fixes that are difficult to backport or audit.

A senior developer chooses a workflow based on team size, deployment frequency, risk, and release requirements rather than copying a branching diagram from a blog. Many web teams do well with short-lived feature branches and a protected main branch. Teams with strict release windows may need release branches, while teams that deploy continuously may prefer trunk-based development with very small changes and feature flags. None of these patterns makes bad communication disappear. The workflow must be supported by branch protection, automated checks, code review expectations, and a shared understanding of what a commit or pull request should contain.

For creative web projects, Git discipline protects visual polish as much as application logic. A redesign can change components, styles, assets, and routing simultaneously; separating work into focused commits helps reviewers understand which change caused a regression. A motion experiment may need a feature flag or preview deployment before it becomes the default. Asset-heavy repositories need `.gitignore`, large-file policies, and care around generated bundles. A reliable workflow keeps the production path clear while allowing developers to experiment, discard a failed approach, and recover without fear.

---

## Core Concepts

### 1. A commit should represent one coherent change

A commit is a named snapshot of the repository. Good commits are small enough to explain and complete enough to make sense on their own. They do not have to be one line, but they should have one main intent: fix a broken focus style, add a typed API parser, or update the project-card layout. When a commit mixes unrelated refactoring, generated files, formatting churn, and a feature, reviewers cannot easily isolate the cause of a regression or revert only the risky part.

```bash
git status --short
git add src/components/ProjectCard.tsx src/components/ProjectCard.css
git diff --cached
git commit -m "feat: add project card layout"
```

Review the staged diff before committing. `git diff --cached` shows exactly what will be recorded, while `git status --short` reveals unstaged and untracked files that might otherwise be forgotten.

**Naive approach:** Run `git add .` and commit everything, including a local `.env`, build output, or unrelated experiment.

**Correct approach:** Stage the intended files, inspect the staged diff, and split unrelated work into separate commits.

**Gotcha:** A commit message cannot rescue a commit that contains multiple unrelated changes. If you need to explain three independent reasons for the same commit, consider splitting it.

### 2. Keep the main branch releasable

The main branch should represent the version the team is willing to integrate and deploy according to its release policy. It does not mean every commit is guaranteed bug-free; it means the branch is protected by agreed checks and reviewed changes. Short-lived branches reduce merge conflicts because they spend less time diverging from the shared history.

```bash
git switch main
git pull --ff-only
git switch -c feat/project-gallery
```

`--ff-only` avoids creating an unexpected merge commit during a simple update. The branch name communicates the task without needing a long sentence.

**Naive approach:** Make all changes directly on `main`, then try to reconstruct which edits belong to which feature when something fails.

**Correct approach:** Use a short-lived branch for the change, keep it updated, and merge it through the team's review and CI process.

**Gotcha:** A local `main` branch can be outdated even when the remote is current. Fetch and inspect remote state before assuming the branch is synchronized.

### 3. Use branch names that make work discoverable

Branch names are small metadata, but consistent naming makes it easier to scan active work, associate branches with issues, and distinguish feature development from urgent fixes. The exact convention matters less than team consistency.

```text
feat/project-gallery
fix/mobile-nav-overflow
docs/deployment-guide
refactor/project-api-adapter
test/project-parser
chore/update-vite
hotfix/payment-timeout
```

A prefix such as `feat/`, `fix/`, `docs/`, or `refactor/` gives the branch an immediate category. If the team uses issue IDs, include them in a stable position, such as `feat/WEB-142-project-gallery`.

**Naive approach:** Use names like `new-work`, `changes`, `final-final`, or `varad-test-2`, which do not communicate the task.

**Correct approach:** Choose a short, descriptive name and use the same vocabulary as issue tracking and pull-request labels.

**Gotcha:** Do not put secrets, customer names, or sensitive incident details in branch names; branch names may appear in logs and external systems.

### 4. Fetch, pull, and push are different operations

`git fetch` downloads remote references without changing the current branch's working files. `git pull` fetches and then integrates the upstream changes according to the configured strategy. `git push` sends local commits to a remote. Knowing the difference helps prevent accidental integration when you only intended to inspect the latest remote state.

```bash
git fetch origin
git log --oneline --graph --decorate --all -20
git status -sb
```

This sequence updates remote-tracking references and lets you inspect the graph before deciding whether to merge, rebase, or push. Use `git pull --ff-only` when a fast-forward is expected and you want Git to stop rather than create an unexpected merge commit.

**Naive approach:** Run `git pull` repeatedly without understanding why the branch diverged.

**Correct approach:** Fetch first when diagnosing, inspect the graph and status, then choose an integration strategy that matches the team workflow.

**Gotcha:** Fetching does not update the current branch's files. A fresh `origin/main` reference is not proof that your local `main` has been updated.

### 5. Rebase and merge serve different purposes

A merge combines histories and preserves the fact that two lines of work were integrated. A rebase replays commits on top of another base, producing a linear history when successful. Both are valid; the team should decide how it wants integration history to look and how conflicts are handled.

```bash
# Rebase a private feature branch onto the latest main.
git fetch origin
git switch feat/project-gallery
git rebase origin/main
```

For a shared feature branch, coordinate before rebasing because rewriting commits changes their IDs and can disrupt collaborators. If a conflict occurs, resolve the affected files, stage the resolutions, and continue the rebase. If the operation becomes confusing, use `git rebase --abort` to return to the pre-rebase state.

**Naive approach:** Rebase a branch that several teammates are using, then force-push without warning.

**Correct approach:** Rebase private or explicitly coordinated branches; use merge commits where preserving integration history is more important or the team convention requires them.

**Gotcha:** Rebase does not automatically make a branch correct. Tests and review are still required after conflicts, because a conflict-free replay can change behavior.

### 6. Pull requests should be small, explain intent, and show evidence

A pull request (PR) is a review unit, not just a transport mechanism for code. It should explain the problem, the approach, the relevant risks, and how the change was verified. Smaller PRs are easier to review carefully and less likely to hide unrelated behavior changes.

```markdown
## Summary
- Add typed project-card data mapping.
- Handle missing cover images with a fallback.

## Verification
- `npm run typecheck`
- `npm test`
- `npm run build`

## Risks / follow-up
- Existing CMS records may not include `coverImage`.
```

A useful PR includes screenshots or a preview URL when visual changes are involved, but it should not expose credentials or private customer data. The reviewer should be able to understand what changed without reverse-engineering the entire branch.

**Naive approach:** Open a PR with “updates” as the description and no test or visual evidence.

**Correct approach:** State the user-facing effect, the technical approach, and how it was checked. Call out known limitations and migrations explicitly.

**Gotcha:** A green CI check does not prove the change meets the design intent. Review behavior, accessibility, edge cases, and user impact as well as test output.

### 7. Use branch protection and required checks

Branch protection makes the workflow enforceable rather than relying only on good intentions. Common controls include required reviews, status checks, conversation resolution, restricted force pushes, and restrictions on direct pushes to the main branch. The appropriate policy depends on repository risk and team size.

```yaml
# Illustrative CI workflow fragment; adapt action versions and project commands.
name: Verify
on:
  pull_request:
  push:
    branches: [main]
jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run typecheck --if-present
      - run: npm test -- --run
      - run: npm run build
```

The example assumes a project whose scripts support these commands; adapt them to the repository and pin action versions according to the organization's supply-chain policy. Configure the host's branch-protection settings separately.

**Naive approach:** Assume that because the team usually reviews code, direct pushes and skipped checks are harmless.

**Correct approach:** Protect important branches, require the checks that actually matter, and define an explicit emergency path rather than silently bypassing policy.

**Gotcha:** CI configuration alone does not protect a branch. Repository settings must mark the relevant checks as required.

### 8. Resolve conflicts by understanding intent, not by choosing a side blindly

A merge conflict means Git cannot determine how to combine two edits. The markers show competing text, not which version is correct. A safe resolution requires understanding both changes and verifying the resulting behavior.

```text
<<<<<<< HEAD
const title = project.displayTitle;
=======
const title = project.title;
>>>>>>> feat/normalize-project-model
```

Before resolving, inspect the surrounding code and commit history. Determine whether one branch renamed the field, whether both changes are needed, or whether the conflict reveals an architectural mismatch. After editing, run the tests and inspect the final diff.

**Naive approach:** Click “Accept Current” or “Accept Incoming” for every conflict to get the merge completed quickly.

**Correct approach:** Reconcile the intent of both changes, remove all conflict markers, and verify the integrated result.

**Gotcha:** A conflict can be resolved syntactically but incorrectly semantically. The compiler may pass even if the code now drops a field or changes the order of an operation.

### 9. Use cherry-pick for a specific commit, not as a substitute for workflow

`git cherry-pick` applies the change introduced by a chosen commit onto the current branch. It is useful for backporting a fix to a release branch or moving a small isolated correction. It can also duplicate work if the commit is later merged through another route without coordination.

```bash
git switch release/2.4
git cherry-pick a1b2c3d
```

Inspect the source commit first and confirm it does not depend on other commits that are missing from the target branch. If a conflict occurs, resolve it and run the relevant checks. If the operation should be abandoned, use `git cherry-pick --abort`.

**Naive approach:** Cherry-pick a large feature commit into a release branch without checking its dependencies.

**Correct approach:** Prefer small, self-contained commits for backports, document why the change is being moved, and verify the target branch.

**Gotcha:** Cherry-picking creates a new commit with a different identity. It does not make the source and target branches equivalent.

### 10. Recover safely with reflog and revert

Mistakes happen: a branch may be reset incorrectly, a commit may be lost from the visible branch graph, or a change may need to be undone after it has been shared. `git reflog` records recent movements of local references and can help locate a previous commit. `git revert` creates a new commit that reverses a prior commit, making it appropriate for shared history.

```bash
# Inspect recent local reference movements.
git reflog --date=local

# Undo a shared commit by creating a new inverse commit.
git revert <commit-sha>
```

Use `git reset` only when you understand whether the changes are local, staged, or already shared. Before destructive commands, inspect `git status`, create a safety branch if needed, and avoid using `--hard` as a first response to confusion.

**Naive approach:** Force-reset the branch to an assumed commit and discard work before inspecting the reflog.

**Correct approach:** Diagnose first, preserve a recoverable reference, and prefer `revert` for changes already shared with collaborators.

**Gotcha:** Reflog is local and expires according to Git's maintenance rules. It is a recovery aid, not a substitute for remote backups or a safe collaboration policy.

### 11. Use tags and release branches intentionally

A tag names a specific commit, often to mark a release. A release branch allows stabilization or maintenance to proceed separately from active feature development. Teams that deploy continuously may not need long-lived release branches, while teams with coordinated releases or multiple supported versions may need them.

```bash
git switch main
git pull --ff-only
git tag -a v2.4.0 -m "Release 2.4.0"
git push origin v2.4.0
```

Only create a release tag after the release commit has passed the required checks and the version matches the team's release policy. Annotated tags carry metadata and are generally preferable for releases.

**Naive approach:** Tag whatever commit happens to be checked out and assume it represents the tested production version.

**Correct approach:** Confirm the commit, version, changelog, and checks; use a release process that maps tags to reproducible builds.

**Gotcha:** A Git tag does not automatically deploy an application or prove which artifact is running. The CI/CD system must define that relationship.

### 12. Keep generated files, secrets, and large assets under control

A repository should contain source files and the assets needed to reproduce the product, not every local artifact. Build output, dependency folders, local environment files, and caches typically belong in `.gitignore`. Large binary assets may need Git LFS or an external asset pipeline, depending on the project's needs.

```gitignore
node_modules/
dist/
coverage/
.env
.env.*
!.env.example
.DS_Store
```

The allowlisted `.env.example` should contain placeholder names and safe sample values, never real credentials. If a secret has already been committed, removing it in a later commit does not erase it from history; rotate the credential and follow the repository's incident process.

**Naive approach:** Commit a local `.env` because it makes the project work on one machine.

**Correct approach:** Commit a documented template, inject secrets through the approved environment or secret manager, and define a clear policy for generated output and large files.

**Gotcha:** `.gitignore` does not stop tracking files that are already tracked. Remove a tracked artifact from the index with a deliberate command, then verify the diff before committing.

### 13. Choose trunk-based development or Git Flow based on delivery needs

Trunk-based development emphasizes short-lived branches and frequent integration into the mainline, often using feature flags to keep incomplete behavior hidden. Git Flow uses longer-lived branches for development, release preparation, and hotfixes. The right choice depends on deployment cadence, release constraints, and team maturity.

```text
Trunk-based:
main ← small feature branch ← merge after checks

Release-oriented:
main ← release branch ← tested release
  ↑
hotfix branch ← urgent production correction
```

Do not choose a complicated branching model just because it looks comprehensive. Long-lived branches increase integration cost and often require repeated conflict resolution. Conversely, a team supporting several deployed versions may need a controlled backport process.

**Naive approach:** Adopt Git Flow by default for a small team deploying a web app every day, then spend more time merging branches than delivering changes.

**Correct approach:** Match the workflow to the release model, keep branches short-lived where possible, and document how hotfixes and backports are handled.

**Gotcha:** Feature flags reduce the need to hide unfinished work in long-lived branches, but they introduce cleanup obligations and must not be used to expose incomplete or unsafe functionality.

### 14. Treat Git history as a debugging and collaboration tool

Useful history makes it possible to answer what changed, why it changed, and which commit introduced a regression. Commit messages, focused diffs, issue references, and consistent PR descriptions improve the repository's diagnostic value.

```bash
git log --oneline --decorate --graph -30
git show --stat <commit-sha>
git blame -L 40,85 src/components/ProjectCard.tsx
git log --follow -- src/components/ProjectCard.tsx
```

Use `git blame` to find context, not to assign blame to a person. Read the associated commit and PR before judging a line in isolation. `git log --follow` can help track a file through renames, though it has limitations in complex histories.

**Naive approach:** Use a one-word commit message for every change and later try to infer intent from file names.

**Correct approach:** Write concise, meaningful messages and link substantial work to its review context, issue, or design decision.

**Gotcha:** History is evidence, not a complete explanation. A commit may have been made under constraints that are only documented in a discussion or issue.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Short-lived feature branch

**What it does:** Isolates one focused change while preserving a clear integration path back to `main`.

**When to use it:** A developer adds a project gallery card and wants independent review before the change reaches production.

```bash
git switch main
git pull --ff-only
git switch -c feat/project-gallery
# make focused changes and commit them
git push -u origin feat/project-gallery
```

Open a PR once the change is reviewable. Keep the branch narrow, update it according to team policy, and delete it after merge if the hosting platform does not do so automatically.

### Pattern 2: Conventional commit messages

**What it does:** Uses a consistent prefix and short description so history can be scanned and release automation can interpret changes when configured.

**When to use it:** A team wants predictable messages for features, fixes, documentation, refactoring, tests, and maintenance.

```text
feat: add project gallery
fix: handle missing cover image
docs: explain local environment setup
refactor: isolate project API mapping
test: cover invalid project payloads
chore: update TypeScript toolchain
```

Conventional Commits is a convention, not a Git requirement. Agree on whether scopes and breaking-change markers are required; do not assume automation exists just because the messages follow a pattern.

### Pattern 3: Interactive rebase for a private branch

**What it does:** Lets a developer clean up the commits in a private feature branch before review.

**When to use it:** A branch has temporary “fix typo” commits that should be combined into a coherent history, and no teammate depends on the branch's existing commit IDs.

```bash
git switch feat/project-gallery
git rebase -i origin/main
```

Use `reword`, `squash`, or `fixup` deliberately. Do not rewrite shared history without coordination, and do not treat a cleaned-up history as a substitute for tests.

### Pattern 4: Revert a faulty production change

**What it does:** Creates a new commit that reverses a shared change without rewriting history.

**When to use it:** A merged navigation change causes a production regression and the team needs a traceable rollback.

```bash
git switch main
git pull --ff-only
git revert <faulty-commit-sha>
git push origin main
```

Follow the team's incident process, verify the revert in CI, and confirm deployment. Reverting a merge commit may require specifying the mainline parent, so inspect the commit graph before running the command.

### Pattern 5: Release hotfix and backport

**What it does:** Applies a narrow fix to the maintained release line and ensures the correction is not lost from ongoing development.

**When to use it:** A supported production release needs an urgent patch while `main` contains unrelated work that is not ready to ship.

```bash
git switch release/2.4
git cherry-pick <self-contained-fix-sha>
# run release checks, then create the patch release
```

Afterward, ensure the same fix exists in `main`, either through a merge or a separate reviewed change. Document the backport so future releases do not reintroduce the defect.

### Pattern 6: CI gates on pull requests

**What it does:** Runs repeatable validation before a change can merge, reducing reliance on local environment assumptions.

**When to use it:** A team wants type checking, tests, and a production build to run for every PR.

```yaml
name: Verify
on:
  pull_request:
  push:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm test -- --run
      - run: npm run build
```

Adapt commands to the repository's package scripts and pin action versions under the team's supply-chain policy. Required checks must also be enabled in the repository's branch protection settings.

### Pattern 7: Safe staged-diff review

**What it does:** Ensures the commit contains only the intended change and avoids accidental inclusion of secrets, generated files, or unrelated experiments.

**When to use it:** A developer has multiple tasks in progress in the same working tree.

```bash
git status --short
git add src/components/ProjectCard.tsx src/components/ProjectCard.css
git diff --cached
git diff --cached --check
```

If unrelated work is already staged, unstage only the relevant paths and inspect the result before committing. Never rely on memory about what `git add .` included.

### Pattern 8: Feature flags for incomplete behavior

**What it does:** Allows code to be integrated while a feature remains disabled for users, reducing the need for long-lived branches.

**When to use it:** A new case-study transition or gallery layout needs several incremental commits before the complete experience is ready.

```ts
const isNewGalleryEnabled =
  import.meta.env.VITE_NEW_GALLERY === 'true';

export function GalleryEntry() {
  return isNewGalleryEnabled
    ? <NewGallery />
    : <LegacyGallery />;
}
```

This simplified example is a build-time flag, not a secure access-control mechanism. Remove obsolete branches and flags after rollout, and never rely on a client-side flag to protect sensitive data or privileged actions.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Committing directly to `main` | Branches feel like overhead for a small change | Use a short-lived branch and protect the main branch with required checks |
| Running `git add .` without reviewing | The developer assumes the working tree contains only the intended task | Inspect status, stage focused paths, and review `git diff --cached` |
| Creating commits with unrelated changes | Work accumulated in the same editor session | Split changes by intent and keep each commit independently understandable |
| Keeping feature branches open for weeks | The feature is too large or integration is postponed | Break work into smaller vertical slices and merge behind a feature flag when appropriate |
| Rebasing a shared branch without warning | Linear history is prioritized over collaboration | Coordinate first or use the agreed merge strategy for shared branches |
| Force-pushing without understanding the impact | A rejected push is treated as a nuisance | Inspect branch state; use `--force-with-lease` only when rewriting is intentional and coordinated |
| Accepting one side of every conflict | The UI makes conflict resolution look like a binary choice | Read both changes, reconcile intent, and run relevant tests after resolution |
| Cherry-picking a commit with hidden dependencies | The selected diff looks small but relies on earlier work | Inspect the source commit and dependencies; backport a self-contained fix |
| Reverting a change without checking its effects | Revert appears safer than understanding the regression | Review downstream dependencies and validate the rollback in a preview or test environment |
| Assuming CI YAML protects `main` | Automation exists in the repository, so protection is presumed | Configure required status checks and review rules in repository settings |
| Committing secrets and then deleting the file | The developer assumes a later deletion removes history | Rotate exposed credentials and follow secret-removal procedures |
| Tracking generated output accidentally | Local build output appears in the working tree | Add appropriate ignore rules and remove already tracked artifacts from the index carefully |
| Using vague branch names | The developer names a branch in the moment | Use stable prefixes and a task or issue identifier |
| Writing useless commit messages | The author focuses on code and treats history as incidental | Describe the intent and user-visible effect in a concise message |
| Assuming a tag triggers deployment | The tag is mistaken for a deployment mechanism | Verify the CI/CD mapping from tag to artifact and environment |
| Treating `git blame` as personal fault-finding | The line history shows an author's name | Use blame to locate context, then inspect the commit and review discussion |
| Deleting a branch before confirming merge | The branch list looks cluttered | Confirm the PR merged and the target branch contains the intended commit |
| Using reset to undo shared work | Reset seems like a universal undo command | Prefer `git revert` for shared commits and use reset only after checking what will be discarded |

### Before / After: a risky commit

```bash
# Before: stages everything, including unrelated or sensitive files.
git add .
git commit -m "changes"
```

```bash
# After: inspect, stage intentionally, and verify the staged snapshot.
git status --short
git add src/components/ProjectCard.tsx src/components/ProjectCard.css
git diff --cached
git diff --cached --check
git commit -m "feat: add project card layout"
```

The second workflow adds a small verification step before history is changed. For teams, enforceable checks and code review should complement this local discipline.

---

## Mental Models

1. **A branch is a proposal, not a private copy forever** — short-lived branches keep the path to integration visible.
2. **A commit is a unit of explanation** — the snapshot and message should communicate one coherent reason for change.
3. **Merge history is a collaboration record** — choose merge or rebase based on team needs, not aesthetic preference alone.
4. **Conflict markers show uncertainty, not truth** — Git cannot decide the semantic intent of competing changes.
5. **Shared history is a public interface** — rewriting it can disrupt every collaborator who based work on it.
6. **CI is an executable agreement** — the checks should express the team's actual quality bar and be required where it matters.
7. **Recovery begins with diagnosis** — inspect status, history, and reflog before running destructive commands.
8. **A release is more than a tag** — tags, tested artifacts, deployment records, and release notes must be connected by a defined process.

---

## Quick Reference

| Task | Command / practice | Key caution |
|---|---|---|
| Create a feature branch | `git switch -c feat/short-name` | Start from an updated base |
| Update remote references | `git fetch origin` | Fetch does not update the current branch |
| Fast-forward local main | `git pull --ff-only` | Stops when history has diverged |
| Inspect staged changes | `git diff --cached` | Review before committing |
| Check whitespace errors | `git diff --cached --check` | Does not replace code review |
| Publish a new branch | `git push -u origin feat/short-name` | Confirm remote and branch name |
| Rebase private work | `git rebase origin/main` | Avoid rewriting a shared branch without coordination |
| Abort a conflicted rebase | `git rebase --abort` | Use when the rebase should be abandoned |
| Continue a resolved rebase | `git add <files>` then `git rebase --continue` | Run checks after integration |
| Revert a shared commit | `git revert <sha>` | Merge commits may need a mainline parent |
| Recover reference history | `git reflog` | Reflog is local and not permanent backup |
| Inspect a commit | `git show <sha>` | Check its context and dependencies |
| Search recent history | `git log --oneline --graph --decorate -20` | A graph still needs human interpretation |
| Create an annotated tag | `git tag -a vX.Y.Z -m "Release X.Y.Z"` | Tag the tested release commit |
| Ignore local secrets | `.env` in `.gitignore` | Rotate secrets already committed |
| Verify PR locally | Typecheck, tests, build | Match the actual project scripts |
| Backport a small fix | `git cherry-pick <sha>` | Ensure required dependencies exist on target branch |
| Inspect tracked changes | `git status --short` | Untracked files may still contain important work |
| Review a file's history | `git log --follow -- <path>` | Renames and complex history have limitations |
| Remove an obsolete branch | Delete only after merge confirmation | Ensure the merged target contains the expected work |

---

## Build Challenge

### Build: Reviewable Feature Delivery Workflow

Create a repository for a small portfolio website and use it to demonstrate a safe collaboration workflow from issue to release. The site should include a project gallery, a responsive navigation menu, and a detail page. The exercise is about the delivery process as much as the UI.

### Requirements

1. Initialize a Git repository and document the runtime, package manager, and setup commands.
2. Add a `.gitignore` for dependency folders, build output, coverage, local environment files, and operating-system artifacts.
3. Create a safe `.env.example` with placeholder names only; confirm no real secrets are committed.
4. Add a concise `README.md` describing the project and local development workflow.
5. Create a protected `main` branch policy appropriate to the available hosting platform.
6. Define a branch naming convention for features, fixes, tests, docs, and maintenance.
7. Create an issue or task description for the project gallery and create a matching feature branch.
8. Implement the gallery in at least three focused commits rather than one unreviewable snapshot.
9. Write commit messages that explain the intent of each change.
10. Open a PR with a summary, verification steps, screenshots or preview URL, and known risks.
11. Configure CI to install dependencies from the lockfile, run type checking, run tests, and build the production bundle.
12. Mark the appropriate CI checks as required for merging when the hosting platform supports it.
13. Demonstrate a merge conflict between two branches and resolve it by reconciling both changes rather than choosing a side blindly.
14. Create a private feature branch and demonstrate an interactive rebase or commit cleanup without rewriting shared history.
15. Simulate a faulty change and use `git revert` to undo it in a new commit.
16. Create an annotated version tag after all release checks pass.
17. Document how a hotfix would be backported to a supported release branch and reconciled with `main`.
18. Demonstrate `git reflog` in a disposable branch and explain what it can and cannot recover.
19. Include a sample PR checklist covering tests, accessibility, visual regression, and secrets.
20. Document the difference between `fetch`, `pull`, `merge`, `rebase`, `revert`, `reset`, and `cherry-pick`.

### Failure exercise

Create two branches that edit the same navigation component. On one branch, change the accessible label; on the other, update the mobile layout. Merge the branches and resolve the conflict while preserving both improvements. Then introduce a deliberately faulty card link, merge it through the normal PR process in the disposable repository, and revert the resulting commit. Verify the fix through tests and a production build. Do not rewrite the shared branch to make the faulty commit disappear.

### Expected output

- A repository with a stable main branch and documented contribution workflow.
- Focused commits and a reviewable PR.
- Automated checks that run consistently from a clean install.
- A resolved merge conflict with both intended changes preserved.
- A demonstrated rollback using `git revert`.
- A release tag connected to the tested commit.
- Documentation explaining how the team handles hotfixes and history recovery.

### Definition of Done

- [ ] A clean clone can install dependencies and run the project using the documented steps.
- [ ] The repository ignores generated output and local secrets.
- [ ] Every feature branch has a clear purpose and follows the naming convention.
- [ ] Commits are focused and have meaningful messages.
- [ ] The PR explains the problem, approach, verification, and known risks.
- [ ] CI checks pass from a clean environment.
- [ ] Branch protection requires the relevant checks and review policy.
- [ ] The conflict exercise preserves both intended edits and passes validation.
- [ ] The rebase demonstration does not rewrite a branch used by collaborators.
- [ ] The faulty change is undone with a revert commit and is traceable in history.
- [ ] The release tag points to the tested release commit.
- [ ] The README documents branching, PR, rollback, and release procedures.
