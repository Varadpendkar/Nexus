---
# SKILL: vite-creative-setup
**Layer:** 10 — Build Tooling
**Goal:** Configure Vite as a dependable foundation for creative websites, with predictable development behavior, production builds, asset handling, environment boundaries, and deployable output.

---

## Why This Matters (Senior Perspective)

A creative website can look excellent on a developer's machine and still fail at delivery because its build assumptions were never made explicit. Typical failures include a development server that silently relies on the project root, production assets that resolve from `/` when the site is hosted below a subpath, environment variables accidentally exposed to the browser, imported images that work locally but disappear after deployment, and a build that passes while the deployed page returns a blank screen. These are Vite setup failures, not mysterious frontend bugs. They waste client review time because the failure often appears only after a preview link is shared or the site is moved to its final host.

Senior developers treat the toolchain as part of the product contract. They make the entry point, public asset rules, base path, environment naming, output directory, and build commands visible and testable. They distinguish Vite's development server from the production bundle: the dev server provides module transformation and fast feedback, while `vite build` emits static assets that must work without the dev server. They also avoid cargo-cult configuration. Every plugin and override should solve a stated requirement, because unnecessary configuration increases upgrade risk and makes debugging harder.

In creative and freelance work, a reliable setup protects the handoff. A client may review a project locally, through a preview deployment, or from a nested URL such as `https://client.example.com/campaign/`. A site that works only at the domain root is not ready. This skill builds the habit of validating the exact deployment shape, checking generated files, and documenting the commands another developer needs to run the project without relying on hidden local state.

---

## Core Concepts

### 1. Vite's Development and Production Modes

Vite has two distinct operating modes. During development, the server serves source modules and transforms them as the browser requests them. This enables fast feedback and native ESM-based workflows. In production, Vite builds a dependency graph, processes assets, applies optimizations, and writes output to `dist` by default. A successful development session therefore proves only that the dev server can run; it does not prove that the production output is valid or deployable.

Keep the scripts explicit so a teammate can identify the intended action without remembering command flags. `preview` serves the already-built output locally; it does not rebuild it automatically. The order matters: build first, then preview. This is especially important for animations, fonts, dynamic imports, and asset paths, because those often behave differently after bundling.

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

The scripts are intentionally plain. Add a framework plugin only when the project actually uses that framework, and add a preview script rather than assuming the dev server is a production simulation. In CI, use `npm run build` as a repeatable check. A deployment pipeline should publish the contents of `dist`, not the repository's source tree.

**Gotcha:** `vite preview` is useful for checking built output, but it is not a production web server and should not be treated as one. It does not reproduce every host's caching, routing, compression, or rewrite behavior.

### 2. The Project Root and Entry HTML

Vite treats the current project root as the directory containing the entry HTML file, unless the root is changed in configuration or CLI arguments. In a basic Vite application, `index.html` is not merely a static template hidden outside the bundler. It is an entry point: Vite processes its module script and referenced assets. Running commands from an unexpected directory can make Vite report a missing entry file or operate on the wrong project.

A minimal structure keeps ownership obvious:

```text
creative-portfolio/
├── index.html
├── package.json
├── vite.config.js
├── public/
│   ├── favicon.svg
│   └── robots.txt
└── src/
    ├── main.js
    ├── styles.css
    └── assets/
        └── studio-mark.svg
```

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#101114" />
    <title>Northstar Studio — Selected Work</title>
  </head>
  <body>
    <main id="app"></main>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

Use a meaningful title and correct document language from the beginning. Creative portfolios often receive direct links from recruiters or clients, so an empty title or missing viewport declaration is an avoidable quality issue. Keep the entry script as a module and let Vite process it instead of adding a second manual script-loading mechanism.

**Gotcha:** The leading slash in `/src/main.js` is resolved by Vite's dev server as a root-relative source path. It is not the same decision as setting the production `base` option for a nested deployment. Test both paths deliberately.

### 3. Installation and Reproducible Dependencies

The setup should be reproducible on another machine and in continuous integration. `package.json` describes declared dependencies and scripts; the lockfile records the resolved dependency graph. Commit the lockfile for the package manager in use. Do not commit `node_modules`, because it is large, platform-sensitive, and reconstructed from the manifest and lockfile.

For an existing repository, inspect its package manager and lockfile before installing. Avoid generating `package-lock.json`, `pnpm-lock.yaml`, and `yarn.lock` together without a deliberate migration plan. Multiple lockfiles make it unclear which dependency resolution is authoritative.

```bash
# Create a Vite project using the official scaffolding command.
npm create vite@latest northstar-portfolio -- --template vanilla
cd northstar-portfolio
npm install
npm run dev
```

If the project already exists, do not blindly scaffold over it. Check `package.json`, the current Node.js version, and whether the repository uses npm, pnpm, or Yarn. For teams, align local and CI Node versions with the project's documented supported version. Vite's requirements evolve by major version, so consult the installed version's documentation when a version-specific compatibility question arises rather than assuming every Node release is supported.

```bash
# Reproduce the committed npm dependency graph in CI.
npm ci
npm run build
```

`npm ci` expects a compatible lockfile and fails rather than rewriting it to fit a changed manifest. That failure is useful: it reveals that the committed dependency metadata is inconsistent. On a developer machine, `npm install` is normal for adding or updating dependencies; in a clean CI environment, `npm ci` is typically the safer choice.

**Gotcha:** A build that works only because a globally installed package or a stale local `node_modules` directory exists is not reproducible. Test from a clean install before handoff.

### 4. `vite.config.js` and Configuration Boundaries

Vite configuration is executable JavaScript or TypeScript, not a loose JSON settings file. Use supported options and keep the configuration proportional to the project. A small vanilla portfolio may need no config at all; adding `defineConfig` is useful for editor assistance and readability, not mandatory magic. When configuration is needed, export a valid object and import plugins explicitly.

```js
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  // Use the repository root as the app root unless the layout requires otherwise.
  root: '.',
  // Keep the standard output folder predictable for deployment tooling.
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
```

The `root` option is a directory path, and `outDir` is the directory where the production build is written. `emptyOutDir` makes the intended output directory clean before building when Vite considers it safe to empty. Avoid adding invented keys such as `production: true` or arbitrary nested `assets` settings that Vite does not recognize. Unknown or misplaced options can be ignored, warned about, or fail depending on the tool and version; they do not create the behavior their names imply.

A config file should answer concrete questions: Is the app hosted under a subpath? Is a framework plugin required? Is a non-default output directory part of the deployment contract? Is there a build-time alias that improves imports? If there is no requirement, default behavior is often easier to maintain.

**Gotcha:** ESM syntax such as `import` and `export default` is valid in the standard Vite config file. If a project uses a different module format or filename, ensure that its Node and package configuration match that format.

### 5. The `base` Option and Subpath Deployment

The `base` option controls the public base path used in generated asset URLs. It matters when a site is deployed at the root of a domain versus beneath a path. A project hosted at `https://northstar.example/` can usually use the default root base. The same build deployed at `https://northstar.example/portfolio/` needs URLs that point into `/portfolio/`, not `/assets/` at the domain root.

```js
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  // Match the exact path prefix used by the hosting destination.
  base: '/portfolio/',
});
```

For a root deployment, the setting can be omitted or set to `/`. For a path-based deployment, use a leading and trailing slash so the intended prefix is clear. If the same artifact must be deployed to multiple paths, decide whether to build separately per target or use a deployment strategy that supports a relative base. Do not assume a relative base is always correct; it can change how assets resolve from nested routes and dynamically loaded chunks.

After building, inspect the HTML in `dist` and the Network panel when previewing the output. A broken logo or missing JavaScript chunk often reveals an incorrect base path. Validate the exact deployed URL, not only the domain root. Also remember that the hosting platform may need SPA fallback rewrites for client-side routes; `base` fixes asset prefixes but does not configure server-side route fallback.

**Gotcha:** A base path is a deployment contract, not a decorative preference. If the final hosting URL is unknown, ask before promising that one build will work unchanged everywhere.

### 6. `public/` Assets Versus Imported Assets

Vite provides two common asset workflows. Files in `public/` are served from the public root and copied as-is to the build output. They are useful for files whose names and paths must remain stable, such as `robots.txt`, a verification file, or a favicon referenced by a fixed public URL. Files imported from source are part of the module graph; Vite can fingerprint them, rewrite references, and include them in dependency-aware build processing.

```js
// src/main.js
import './styles.css';
import studioMarkUrl from './assets/studio-mark.svg';

const mark = document.querySelector('[data-studio-mark]');
if (mark) {
  // Use Vite's emitted URL rather than hard-coding the source directory.
  mark.src = studioMarkUrl;
}
```

```html
<!-- Public assets are referenced from the public root, not /public/. -->
<img src="/favicon.svg" alt="" />
```

Do not write `/public/favicon.svg`; the `public` directory is a source convention, not part of the served URL. Imported assets are generally preferable for content assets that belong to a component or module because the build can track them. Public assets are preferable when external systems expect a stable filename or when the file must be copied without being imported.

For a creative site, a common split is: hero photography imported from `src/assets/`, logos imported when they are module-owned, and `robots.txt` in `public/`. Large media files may deserve a dedicated CDN or optimization workflow; moving them into `public/` does not compress or optimize them automatically.

**Gotcha:** Hard-coded `/src/assets/hero.webp` paths can work during development and fail in production because source files are not copied as that path. Import the asset or intentionally place it in `public/` and reference the public URL.

### 7. Environment Variables and Browser Exposure

Environment variables are a boundary between build-time configuration and runtime secrets. In Vite, variables exposed to client-side code normally use the `VITE_` prefix. Those values are compiled into the browser bundle and must be treated as public. A prefix is not a secrecy mechanism; it is an explicit opt-in to browser exposure.

```dotenv
# .env.development.local — safe only for values intended to be visible in the client.
VITE_PUBLIC_API_ORIGIN=https://api.northstar.example

# This is not exposed through import.meta.env by default.
PRIVATE_SERVICE_TOKEN=replace-with-a-server-side-secret
```

```js
// src/config.js
const apiOrigin = import.meta.env.VITE_PUBLIC_API_ORIGIN;

if (!apiOrigin) {
  // Fail with an actionable message instead of generating malformed requests.
  throw new Error('Missing VITE_PUBLIC_API_ORIGIN environment variable');
}

export const publicConfig = { apiOrigin };
```

A secret needed to authenticate a server-to-server request belongs on a backend, not in a static Vite frontend. If a browser bundle can read it, a user can inspect it. Add local environment files containing secrets to `.gitignore`, but remember that ignoring a file does not remove a value already committed to version control. Rotate leaked credentials and clean the repository according to the organization's incident process.

Vite loads mode-specific environment files, and `import.meta.env.MODE` can be used to branch on the current mode. Prefer explicit configuration and validation over scattered reads throughout the UI. Do not use `process.env` in browser code as if Vite were a Node server; browser code should use Vite's supported environment interface.

**Gotcha:** `VITE_PRIVATE_KEY` is still public after build. Naming it “private” does not make it private. Never place passwords, signing keys, database credentials, or privileged API tokens in variables exposed to the client.

### 8. CSS, Fonts, and URL Resolution

CSS imports are processed by Vite, and URL references inside CSS may be rewritten during production builds. This makes source-relative paths important. Keep font files and background images near the stylesheet or use a deliberate public path. Avoid copying a path from a design file or a local computer and assuming the bundler can resolve it.

```css
/* src/styles.css */
@font-face {
  font-family: 'Studio Grotesk';
  src: url('./assets/studio-grotesk.woff2') format('woff2');
  font-display: swap;
  font-weight: 100 900;
}

:root {
  font-family: 'Studio Grotesk', system-ui, sans-serif;
  color: #f4f2ee;
  background: #101114;
}
```

Use `font-display: swap` for a practical text-rendering fallback while a font loads. Ensure font licensing permits web embedding and that the production network response has an appropriate MIME type. When a font fails only after deployment, inspect its URL and response status before changing typography CSS. The problem may be a base path, missing asset, or host configuration rather than a font-face declaration.

Vite's asset processing can fingerprint imported files, which helps cache invalidation. It does not automatically make every third-party font request privacy-safe or guarantee that every browser supports a specific font format. Test the intended browsers and avoid relying on a local installed font as the only fallback.

**Gotcha:** A CSS URL is resolved relative to the CSS file in source, then rewritten as needed by the build. A root-relative URL such as `/fonts/studio.woff2` instead assumes the domain root and can break when the site is deployed under a subpath.

### 9. Aliases and Import Organization

Aliases can make imports easier to scan when the source tree has enough structure to justify them. A common pattern maps `@` to `src`, allowing `@/components/ProjectCard.js` rather than a long relative path. Configure the alias in Vite and in any separate type checker or editor configuration that needs to understand the same mapping. An alias that only the bundler understands may build correctly but produce editor warnings or broken test imports.

```js
// vite.config.js
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      // Convert the source directory to an absolute filesystem path.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
```

```js
// src/main.js
import { createProjectGallery } from '@/components/project-gallery.js';
import '@/styles.css';

createProjectGallery(document.querySelector('[data-project-gallery]'));
```

Aliases are an ergonomics tool, not a substitute for a coherent architecture. Avoid a dozen aliases that hide where modules live. Prefer a small number of stable roots and use descriptive filenames. If you add a test runner or a framework-specific compiler, configure its path resolution consistently.

**Gotcha:** Alias targets should be absolute filesystem paths in Vite configuration when needed. A bare relative string can be interpreted differently than expected, especially across platforms or when the config's working directory changes.

### 10. Dynamic Imports and Code Splitting

A dynamic `import()` creates an asynchronous module boundary. Vite can split eligible modules into separate chunks, so a page does not necessarily need to download every feature immediately. This is useful for optional project case studies, heavy visualization tools, or a rarely opened settings panel. It is not automatically a performance win: too many tiny chunks can create request overhead, and a chunk loaded on the initial viewport may not reduce initial work meaningfully.

```js
const caseStudyLinks = document.querySelectorAll('[data-case-study]');

for (const link of caseStudyLinks) {
  link.addEventListener('click', async (event) => {
    event.preventDefault();
    const projectSlug = link.dataset.caseStudy;

    // Load the selected project's renderer only when it is requested.
    const { renderCaseStudy } = await import('./case-studies/render-case-study.js');
    await renderCaseStudy(projectSlug);
  });
}
```

Dynamic imports are asynchronous and can reject if a chunk cannot be fetched. A polished interface should provide an error path for optional content, log useful diagnostic information, and avoid leaving the user with a permanently disabled control. If the hosting deployment replaces hashed assets while a user has an older page open, an old runtime may request a chunk that no longer exists. Robust deployment practices and a refresh/retry experience can reduce the impact of this edge case.

Use the bundle analyzer or browser Network panel to verify that splitting changed the output as expected. The existence of `import()` in source does not prove the browser downloads less JavaScript on first load; inspect the actual chunks and request timing.

**Gotcha:** Dynamic imports are not a guarantee of lower total transfer. They change when code is requested and how it is partitioned. Measure the initial route and the feature route separately.

### 11. Build Output, Public Paths, and Deployment Artifacts

The default production output directory is `dist`. Treat it as a generated artifact, not a source directory. Do not hand-edit generated bundles because the next build overwrites them and the edits cannot be maintained. Deployment should publish the files inside `dist` to the host's configured document root or artifact location.

```bash
# Generate a fresh production artifact.
npm run build

# Inspect output files and sizes before deployment.
find dist -maxdepth 3 -type f -print

du -sh dist
```

A clean build should be repeatable from a clean checkout and lockfile install. If output is stale, check whether the build was run from the intended directory and whether a custom `outDir` is nested outside the project root. Avoid setting `emptyOutDir: true` on a directory that contains hand-maintained files. Keep deployment-generated output separate from source assets and configuration.

For static hosting, verify that the HTML references emitted asset filenames and that those files are actually uploaded. If a site uses client-side routing, configure the host's fallback behavior according to that platform's instructions. A Vite build is a collection of static files; it does not create a Node server that automatically handles application routes.

**Gotcha:** Uploading the repository root rather than the contents of `dist` often exposes source files and may leave the host serving the wrong HTML. Deployment documentation should name the exact output directory.

### 12. Build Validation and Failure Diagnosis

Build validation is a sequence of independent checks: dependency installation, static or type checks where available, production build, local preview, and host-specific smoke testing. Do not treat a green `npm run dev` as proof that all these stages passed. Each stage catches a different class of defect.

```bash
# A minimal pre-handoff validation sequence for an npm project.
npm ci
npm run build
npm run preview -- --host 127.0.0.1
```

The preview command runs until stopped; open the displayed local URL and exercise the actual page. Check the console for missing modules, inspect Network requests for 404s, and test direct navigation to important URLs. A build can pass while the app contains a runtime exception triggered only by a particular button or route, so test real interactions as well as the initial render.

When a failure occurs, classify it before changing config: dependency resolution, syntax or transform error, missing asset, wrong base path, environment mismatch, runtime exception, or host routing. This prevents random config edits that mask the underlying problem. Save the exact command and error output in a bug report so another developer can reproduce it.

**Gotcha:** The preview server is local evidence, not proof of CDN, rewrite, cache, or access-control behavior on the final host. Always perform a smoke test against the deployed preview when the hosting environment is part of the deliverable.

---

## Advanced Patterns / Integration Patterns

### Pattern 1: Minimal, Explicit Vanilla Starter

**What it does:** Establishes a small project with a single entry point, a CSS import, and scripts that clearly separate development from production. **When to use it:** A small marketing page, portfolio, microsite, prototype, or interactive art page that does not need a framework. It reduces setup overhead and gives the project a stable baseline before adding dependencies.

```js
// src/main.js
import './styles.css';

const status = document.querySelector('[data-build-status]');
if (status) {
  // Keep this small diagnostic in the DOM rather than relying on a dev-only console message.
  status.textContent = `Interactive portfolio ready — ${new Date().getFullYear()}`;
}
```

```html
<!-- index.html -->
<body>
  <main>
    <h1>Northstar Studio</h1>
    <p data-build-status>Loading studio details…</p>
  </main>
  <script type="module" src="/src/main.js"></script>
</body>
```

Keep initial scaffolding small. Add a framework only when state management, routing, reusable component composition, or team constraints justify it. A plain Vite setup is not a lesser architecture; it is an appropriate choice when the page's interaction model is modest. The important standard is that the entry point is understandable and the production build is repeatable.

### Pattern 2: Deployment-Aware Base Path

**What it does:** Makes asset URLs align with a known nested deployment location. **When to use it:** GitHub Pages project sites, campaign folders, client subdirectories, or any static host where the site is not mounted at `/`.

```js
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  // This must match the public URL prefix, including the trailing slash.
  base: '/campaign-2026/',
});
```

After building, inspect `dist/index.html` and confirm emitted script and stylesheet URLs begin with `/campaign-2026/`. Then preview and test the deployed path. If the final deployment root changes, rebuild with the matching configuration or select a documented relative-base strategy and test nested route behavior. Do not “fix” a path issue by moving files into random folders: the generated URLs and the hosting mount point must agree.

### Pattern 3: Validated Public Runtime Configuration

**What it does:** Reads required public configuration once and fails early with a helpful message when it is absent. **When to use it:** Frontends that call a public API origin or need a feature flag at build time. It improves diagnostics without pretending client-side variables are secret.

```js
// src/config.js
function requirePublicValue(name, value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Required public build variable is missing: ${name}`);
  }
  return value.trim();
}

export const config = Object.freeze({
  apiOrigin: requirePublicValue(
    'VITE_PUBLIC_API_ORIGIN',
    import.meta.env.VITE_PUBLIC_API_ORIGIN,
  ),
  mode: import.meta.env.MODE,
});
```

This check intentionally validates presence, not whether the endpoint is trustworthy or available. Validate URL shape if the application needs it, and handle network failures in the API layer. Do not include private keys in this module. Since these values are bundled, every value in `config` should be safe to reveal to any site visitor.

### Pattern 4: Imported Asset With Stable Application Ownership

**What it does:** Lets Vite track a content asset and generate its production URL. **When to use it:** A hero image, case-study thumbnail, logo, or font that is part of the source module graph.

```js
// src/components/hero.js
import heroImageUrl from '../assets/atelier-interior.webp';

export function mountHero(container) {
  if (!container) return;

  const image = document.createElement('img');
  image.src = heroImageUrl;
  image.alt = 'Sunlit design studio with material samples on a long table';
  image.loading = 'eager';
  image.fetchPriority = 'high';
  container.replaceChildren(image);
}
```

The example treats the hero as a meaningful image, so it includes descriptive alternative text. If the image is purely decorative and the same content is already communicated in nearby text, use an empty `alt` attribute instead. Use `fetchPriority = 'high'` sparingly for the main image likely to be the Largest Contentful Paint element; applying it to every image competes for priority.

### Pattern 5: Feature-Level Dynamic Import With Recovery

**What it does:** Delays loading an optional feature and presents a recoverable failure if the chunk cannot be fetched or the feature throws. **When to use it:** Large case-study viewers, 3D product previews, maps, or other modules that are not needed on every first render.

```js
const viewerButton = document.querySelector('[data-open-viewer]');
const viewerRegion = document.querySelector('[data-viewer-region]');

viewerButton?.addEventListener('click', async () => {
  viewerButton.disabled = true;
  viewerRegion.textContent = 'Loading interactive viewer…';

  try {
    const { mountViewer } = await import('./viewer/mount-viewer.js');
    await mountViewer(viewerRegion);
  } catch (error) {
    // A chunk may be missing after a deployment, or the feature may fail at runtime.
    console.error('Unable to load the interactive viewer', error);
    viewerRegion.textContent = 'The viewer could not be loaded. Refresh the page and try again.';
  } finally {
    viewerButton.disabled = false;
  }
});
```

Do not swallow errors silently; provide a user-facing state and retain diagnostic detail for development. If retry is important, make the retry affordance explicit and ensure repeated calls do not mount duplicate canvases or event listeners. The dynamically loaded module should own cleanup for resources it creates.

### Pattern 6: Clean Build and Preview Gate

**What it does:** Creates a repeatable quality gate that catches dependency drift and production-only failures before delivery. **When to use it:** Every client handoff, release candidate, and CI pipeline for a Vite site.

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "check:release": "npm run build"
  }
}
```

```bash
# Run from a clean checkout in CI; fail the job on any command error.
npm ci
npm run check:release
```

The script is deliberately not pretending to run browser tests. If the project has linting, type checks, unit tests, or Playwright smoke tests, include them in the pipeline as separate named steps. Distinct steps make the failure source obvious. A green build is necessary but not sufficient for an interactive site, so include a human or automated browser pass for the most important user journeys.

### Pattern 7: Bundle Inspection Before Premature Optimization

**What it does:** Establishes a measurable baseline for production output and helps identify large dependencies. **When to use it:** When first-load performance is poor, a dependency is unexpectedly large, or a project has a bundle budget. Start with Vite's emitted output and a bundle visualizer compatible with the installed Vite version rather than guessing based on source file length.

```bash
# Build and inspect emitted files and aggregate size.
npm run build
find dist/assets -type f -maxdepth 1 -print
 du -sh dist/assets
```

Use the analyzer to answer a concrete question: which dependency contributes most to the initial route, which modules are duplicated, or which feature can be deferred? A visualization is diagnostic evidence, not an optimization plan by itself. Verify whether the measured chunk is loaded on the initial route and whether removing or splitting it improves real user metrics. Never remove a required dependency solely because its name appears large.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Running commands from the wrong directory | The developer assumes the shell is at the repository root. | Run `pwd`, confirm `package.json` and `index.html` are present, then rerun the command from the intended Vite root. |
| Treating the dev server as production proof | Hot module replacement hides bundling and deployment issues. | Run `npm run build`, then `npm run preview`, and test the generated site. |
| Publishing the repository root | The hosting dashboard is pointed at the wrong folder. | Configure static hosting to publish the contents of `dist`, and verify the uploaded HTML references existing files. |
| Using `/public/logo.svg` in markup | The source directory name is mistaken for a URL prefix. | Put the file in `public/logo.svg` and reference `/logo.svg`, or import it from `src`. |
| Hard-coding `/src/assets/hero.webp` | A development URL is mistaken for a production asset URL. | Import the asset into a module or move it to `public` and use its public URL. |
| Forgetting a nested deployment prefix | The project was tested only at a domain root. | Set `base` to the real path prefix and verify generated URLs from `dist`. |
| Assuming `base` fixes client-side routing | Asset URL configuration is confused with host routing. | Configure the host's documented SPA fallback separately and test direct navigation to a nested route. |
| Exposing a secret through `VITE_` | The prefix is misunderstood as a private environment namespace. | Keep privileged credentials on a server and expose only values safe for every visitor to inspect. |
| Committing `.env.local` | Environment files are not covered by `.gitignore`. | Ignore local environment files, check repository history, and rotate any credential that was already committed. |
| Committing multiple package-manager lockfiles | Different developers use different install commands. | Select one package manager, retain its lockfile, and document the supported install command. |
| Relying on a global package | A local machine has hidden dependencies absent from CI. | Declare required tools in project dependencies or scripts and verify with a clean install. |
| Adding unsupported config keys | Options are copied from unrelated tools or old examples. | Check the documentation for the installed Vite version and remove keys that have no documented effect. |
| Editing files inside `dist` | Generated output looks like the easiest place to patch a deployment. | Fix source or config, rebuild, and treat `dist` as disposable generated output. |
| Using a relative alias without resolving it | The config's working directory differs between environments. | Resolve aliases to an absolute path based on `import.meta.url`. |
| Ignoring a failed dynamic import | Optional modules are assumed to be impossible to fail. | Catch the rejection, show a recoverable message, log diagnostics, and test the missing-chunk scenario. |
| Splitting every small module | Code splitting is treated as a universal performance improvement. | Split features with meaningful deferred cost and verify request count, initial bytes, and user metrics. |
| Forgetting the viewport meta tag | The entry HTML is treated as unimportant boilerplate. | Include a valid viewport declaration and check layout at mobile widths. |
| Shipping a missing font file | The font URL was validated only on the developer's machine. | Inspect the built URL and production response; confirm the file is emitted and served successfully. |
| Setting `emptyOutDir` on a shared folder | The output directory contains hand-maintained files. | Use a dedicated generated output folder and only clean a directory whose contents are disposable. |
| Assuming preview reproduces the host | Local preview has no knowledge of the CDN or hosting rewrite rules. | Test the deployed preview URL, including direct routes, cache behavior, and asset responses. |

---

## Mental Models

1. **Development is a workbench; production build is the deliverable** — success in one mode does not certify the other.
2. **The URL path is part of the deployment contract** — asset prefixes must match the place where the site is mounted.
3. **`public/` means stable public URL; imported asset means build-graph ownership** — choose based on how the file should be managed.
4. **A `VITE_` variable is browser-visible by design** — never store a secret in a client-exposed variable.
5. **`dist` is an output artifact, not a source of truth** — fix inputs and rebuild instead of patching generated files.
6. **A passing build proves compilation, not user journeys** — exercise routes, interactions, and failure states separately.
7. **Configuration should encode a requirement** — every non-default option should have a reason a teammate can explain.
8. **Optimize measured costs, not imagined ones** — use emitted chunks and field metrics before adding complex build machinery.

---

## Quick Reference

| Property / Situation | Value / Answer | Notes |
|---|---|---|
| Start development server | `npm run dev` | Uses Vite's development mode and HMR. |
| Create production output | `npm run build` | Runs `vite build` and writes output to `dist` by default. |
| Preview production output | `npm run preview` | Build first; preview serves existing output. |
| Default entry HTML | `index.html` | Located in the Vite root. |
| Default output directory | `dist/` | Generated; usually the deployment artifact. |
| Public asset source folder | `public/` | Contents copied as-is to output root. |
| Imported asset location | `src/assets/` or module-relative | Vite can process and fingerprint imported assets. |
| Nested deployment | `base: '/portfolio/'` | Must match actual public URL prefix. |
| Client-exposed environment variable | `VITE_PUBLIC_API_ORIGIN` | Visible in browser bundle; never a secret. |
| Local env file | `.env.local` / `.env.development.local` | Keep local values out of version control. |
| Clean npm CI install | `npm ci` | Requires a consistent committed lockfile. |
| Config module syntax | `import` + `export default` | Use documented Vite config options. |
| Alias target | Absolute filesystem path | Keep bundler, editor, and test resolution aligned. |
| Dynamic feature load | `await import('./feature.js')` | Async; handle rejection and test chunk failure. |
| Inspect output | `find dist -type f -print` | Confirm files expected by the host exist. |
| Inspect output size | `du -sh dist` | Useful first signal; not a full performance metric. |
| Browser error diagnosis | DevTools Console and Network | Check missing chunks, 404s, runtime errors, and font failures. |
| Client-side route fallback | Hosting-platform configuration | Separate from Vite's `base` setting. |
| Build compatibility | Installed Vite docs and Node version | Avoid assuming every Node release is supported. |

---

## Build Challenge

### Build a Deployment-Ready Creative Portfolio Starter

Create a one-page portfolio starter for a fictional design studio called **Northstar Studio**. The page must have a hero image, project cards, a custom font, and a lazily loaded project viewer. It must run in development, produce a valid production bundle, and support deployment under `/northstar/`. Complete the requirements in one focused session and retain the output as a reviewable repository.

1. Create the project using Vite's official scaffolding flow or convert an existing clean Vite starter; do not mix multiple package managers.
2. Include a valid `package.json` with explicit `dev`, `build`, and `preview` scripts, and commit the package manager lockfile.
3. Keep `index.html` as the Vite entry, include the viewport meta tag, a meaningful document title, and the correct document language.
4. Organize application code under `src/`, place one stable public file such as `robots.txt` in `public/`, and demonstrate one imported image from `src/assets/`.
5. Add a custom `@font-face` rule referencing a real font asset that exists in the repository; include a system-font fallback and `font-display: swap`.
6. Configure the production base path as `/northstar/` and explain why it is necessary for the target deployment.
7. Read `VITE_PUBLIC_API_ORIGIN` through `import.meta.env`, validate that it is present, and document that the value is public. Do not add a real secret or private credential to the frontend.
8. Add a project viewer loaded through `import()` only after the visitor activates its control; include a visible loading state and a failure message.
9. Configure the viewer so repeated activation does not create duplicate canvases or duplicate event listeners. If it allocates WebGL or other disposable resources, provide a cleanup method.
10. Run a clean dependency installation and a production build; save the exact commands and confirm the command exit statuses.
11. Inspect `dist/index.html` and verify that emitted JS, CSS, font, and image URLs are compatible with `/northstar/`; no asset should incorrectly depend on `/src/` or `/public/` paths.
12. Run the production preview and test the hero, project cards, viewer activation, viewer failure state, and browser console. Test at desktop width and at a mobile viewport around 375 CSS pixels wide.
13. Simulate a real edge condition: temporarily make the dynamic import target unavailable or trigger a controlled import rejection. Verify the interface exits its loading state, shows a recovery message, and does not leave the button permanently disabled.
14. Document the deployment artifact as the contents of `dist/`, name the expected hosting path, and list any host-specific rewrite configuration that is still required.

**Expected output:** A repository with reproducible install instructions, valid Vite configuration, a production build, a tested preview, a short deployment note, and evidence that the missing-chunk edge case is handled. Success is not “the page appears on localhost”; success means another developer can install, build, preview, and understand how to deploy the project at the declared path.

---

## Definition of Done / Success Criteria

- [ ] A clean install using the chosen package manager succeeds from the committed manifest and lockfile.
- [ ] `npm run dev` starts the expected project from the documented root without relying on global packages.
- [ ] `npm run build` completes successfully and writes the expected files into `dist/`.
- [ ] `npm run preview` serves the built output, and browser Console and Network checks reveal no unexpected runtime errors or missing assets.
- [ ] The configured `base` matches the intended deployment prefix, and built asset URLs have been checked rather than assumed.
- [ ] Public environment variables are validated and contain no credentials that must remain private.
- [ ] Imported and public assets follow the correct path rules; no output is manually patched after the build.
- [ ] The optional viewer handles loading, success, failure, and repeated activation without duplicate resources.
- [ ] The project has been checked at desktop and narrow mobile widths, with readable text and functional controls.
- [ ] A deployment note identifies the artifact directory, expected URL prefix, and any host routing requirement.

---

## Topic-Specific Gotchas and Diagnostic Notes

**Gotcha: “It works on localhost” is an incomplete acceptance test.** The dev server resolves source modules and provides HMR. A production build uses emitted asset URLs and chunk files. Always build and preview before handing the site to someone else.

**Gotcha: Public does not mean “put `/public/` in the URL.”** The directory is copied to the public root. A file at `public/robots.txt` is referenced as `/robots.txt` at the root base, or with the appropriate base prefix when deployed under a subpath.

**Gotcha: Client environment variables are not server environment variables.** A value exposed via `import.meta.env.VITE_*` is shipped to the browser. Do not put a private token there and assume deployment settings make it safe.

**Gotcha: `base` is not a universal routing fix.** It controls the public base for generated URLs. If the host cannot serve the app shell for a nested client-side route, configure the host's fallback separately and test a direct URL load.

**Gotcha: Dynamic imports create a real failure boundary.** A stale page can request a chunk that was removed during a deployment, or a network interruption can block the request. Keep a recoverable UI state and avoid leaving controls disabled after a rejected promise.

**Gotcha: More configuration can mean more failure surfaces.** Plugins, aliases, custom output paths, and manual chunk rules are useful only when they solve a requirement. Start from defaults, add one change at a time, and verify the built output after each change.

**Gotcha: A large `dist` folder is a signal, not a diagnosis.** It can contain high-resolution imagery, fonts, source maps, or JavaScript. Inspect file types and initial-route requests before selecting an optimization. Do not set an arbitrary byte budget without deciding whether it covers compressed transfer size, uncompressed output, or a particular chunk.

**Gotcha: Browser cache can make a deployment appear inconsistent.** Hashed asset names are designed to support cache invalidation, but stale HTML or a partially uploaded deployment can still reference unavailable chunks. Deploy a coherent artifact set and avoid deleting old assets before your hosting strategy accounts for active clients.

---

## Release Checklist for Creative Projects

Before sharing a review link, run through the checklist below. The goal is to make the handoff repeatable rather than dependent on the original developer's memory.

- Confirm the repository root and package manager; remove accidental competing lockfiles.
- Confirm the Node.js version against the installed Vite version and the team's documented environment.
- Check that environment files containing local values are ignored and that no secrets are referenced from client code.
- Build from a clean dependency installation rather than relying only on an old local dependency tree.
- Inspect emitted files and confirm that expected hero images, fonts, icons, and lazy-loaded chunks are present.
- Preview the production output and exercise controls, keyboard interaction, route entry points, and mobile layouts.
- Check the actual deployment prefix and verify direct requests to CSS, JS, font, and image assets return successful responses.
- Verify any host rewrite rules independently from the Vite `base` setting.
- Confirm the deployed page title, document language, viewport configuration, and image alternative text.
- Record known limitations, the exact build command, the output directory, and the destination path in the handoff note.

For a project with a performance target, extend this checklist with measured metrics rather than treating build size as a proxy for user experience. As a starting point for a typical public page, target Largest Contentful Paint (LCP) at or below 2.5 seconds, Cumulative Layout Shift (CLS) at or below 0.1, and Interaction to Next Paint (INP) at or below 200 milliseconds at the 75th percentile. These are user-experience targets, not settings that Vite can guarantee. Validate them with suitable lab and field measurement, optimize the actual bottleneck, and document the device/network assumptions for any local budget.

A useful initial bundle policy might set a review threshold when the main JavaScript entry exceeds 200 KiB uncompressed or an individual initial JavaScript chunk exceeds 150 KiB uncompressed. Those are project guardrails, not universal web standards. Define whether the budget refers to raw bytes, gzip, or Brotli, and measure it consistently in CI. Images and fonts should have their own budgets; a page can have a small JavaScript bundle and still load slowly because a hero image is several megabytes. Treat budgets as prompts for investigation and architectural decisions, not as a reason to delete necessary functionality without evaluating user impact.

---

## Troubleshooting Decision Tree

### The dev server does not start

First confirm the current working directory and whether `package.json` is present. Next confirm dependencies are installed with the repository's chosen package manager. Read the complete error, not only the final line: an unsupported Node version, a missing plugin import, a port conflict, or invalid configuration require different fixes. If the config imports a package, verify that package is declared in the project. Avoid globally installing Vite as a workaround, because that can hide a missing local dependency.

### The build fails but development appeared fine

Run the build again and capture the first actionable error. A syntax or transform failure may occur only when a module is included in the production graph; a missing environment variable may be validated only during a particular build path; an asset import may refer to a file whose case differs from the actual filename. On case-sensitive production systems, `Hero.webp` and `hero.webp` are different names even if a local filesystem treats them similarly. Correct the source or config, then rebuild from a clean state.

### The page loads but images, fonts, or scripts are missing

Open the browser Network panel and inspect the exact failing URL and response code. If the URL begins at the domain root but the site is hosted under a subpath, revisit `base`. If it contains `/src/` or `/public/` unexpectedly, correct the source reference. If the request returns 404 even with a correct path, verify that the file exists in `dist` and was uploaded to the host. Do not rewrite every URL until you identify which part of the path is wrong.

### The initial page works but a feature fails after a click

Check the Console for a rejected dynamic import or a runtime exception inside the feature. Inspect the requested chunk URL in Network. A 404 often indicates a stale deployment, wrong base path, or incomplete upload; a successful response followed by an exception points toward module code or runtime assumptions. Ensure the loading UI is cleared in both success and failure paths and that repeated activation does not duplicate resources.

### The app works at `/` but not at `/northstar/`

Confirm the intended mount path and the value of `base`, then rebuild. Test the generated HTML and asset requests under the nested prefix. If the app has client-side routes, separately confirm that direct navigation to those routes returns the app shell. Remember that an asset prefix and an SPA fallback solve different problems.

### The deployed page is slower than expected

Measure before changing the config. Inspect initial HTML, render-blocking CSS, hero image transfer size, font requests, JavaScript entry size, and long tasks. Use a bundle analyzer to locate large modules, but correlate the result with what is loaded on the initial route. For user-facing performance, evaluate LCP, CLS, and INP using a consistent methodology. Consider responsive images, proper image dimensions, font loading strategy, and deferring optional features before introducing complicated manual chunk rules.

---

## Final Engineering Principle

A Vite setup is ready when its assumptions are explicit and its output has been tested in the environment that matters. Keep configuration small, assets traceable, environment boundaries honest, and production verification repeatable. When a project breaks, use the generated URLs, command output, and browser diagnostics to identify the owning layer instead of changing unrelated settings until the symptom disappears.
