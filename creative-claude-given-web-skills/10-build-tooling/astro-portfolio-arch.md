# SKILL: astro-portfolio-arch
**Layer:** 10 — Build Tooling
**Goal:** Architect content-rich creative portfolios with Astro using a deliberate rendering strategy, reliable content collections, component islands, predictable asset handling, accessible navigation, and production-safe deployment.

---

## Why This Matters (Senior Perspective)

A portfolio can be visually exceptional and still be architecturally wrong for its content. Typical failures include shipping a large client-side application for pages that mostly display text and images, hydrating interactive components that do not need browser state, mixing content frontmatter without a schema, losing image optimization because assets bypass Astro's asset pipeline, and assuming local routing will behave the same after deployment to a subpath. These are not cosmetic issues. They affect initial JavaScript cost, crawlability, content editing, accessibility, and the ability to hand the project to another developer.

Astro is especially useful for sites whose default state is reading: portfolios, studios, case studies, editorial pages, documentation, and marketing sites. Its default architecture renders components to HTML and sends little or no client JavaScript unless a component is explicitly hydrated. That is a meaningful architectural choice, not a guarantee that every Astro site is fast. A page can still be slow because of oversized images, render-blocking fonts, expensive third-party embeds, too much HTML, poor caching, or a large hydrated island. Measure the shipped result rather than treating the framework name as a performance score.

Senior implementation begins with the content model and rendering contract. Decide what is static, what changes at request time, which pieces truly need browser interactivity, how content is validated, how assets are addressed, and what the hosting platform supports. Make these decisions explicit in the project structure and review checklist. A case study should have a stable URL and metadata; a gallery should preserve keyboard access; a project card should work without JavaScript; and a filter should still have a clear fallback if it requires client-side state. Build the simplest architecture that satisfies the interaction and deployment requirements, then add complexity only where the product needs it.

**Scope note:** Astro APIs and adapter capabilities evolve. Use documented, version-matched APIs for the version in `package.json`; do not copy configuration from a different major release without checking compatibility. Examples below use conventional current Astro project patterns and intentionally avoid invented config options.

---

## Core Concepts

### 1. Astro's HTML-First Rendering Model

Astro components (`.astro` files) execute on the server/build side and render HTML. They do not automatically ship a client runtime for their template logic. This makes them a strong default for portfolio shells, navigation, project grids, case-study content, footers, and static decorative elements. A component can use frontmatter to query content and prepare data, then render that data into HTML. The browser receives the result rather than a client-side component tree that must hydrate before it becomes useful.

```astro
---
const title = 'Selected Work';
const projects = [
  { title: 'Field Notes', href: '/work/field-notes/' },
  { title: 'Quiet Objects', href: '/work/quiet-objects/' },
];
---
<section aria-labelledby="selected-work-title">
  <h2 id="selected-work-title">{title}</h2>
  <ul class="project-grid">
    {projects.map((project) => (
      <li><a href={project.href}>{project.title}</a></li>
    ))}
  </ul>
</section>
```

Keep data preparation in frontmatter and output markup in the template. Avoid moving static rendering into a React/Vue/Svelte island merely because the team already knows that library. The island should earn its runtime cost through a real browser behavior: drag interactions, live filtering, a complex configurator, or a stateful widget. An animation that can be expressed with CSS does not automatically justify hydration.

**Gotcha:** “No hydration by default” does not mean “no JavaScript at all.” Scripts in the page, client directives, analytics, third-party embeds, and manually imported browser code can still ship JavaScript. Audit the output and network panel.

### 2. Project Structure and Route Ownership

Astro's file-based routing makes route ownership visible. Files under `src/pages/` define pages and endpoints; reusable layouts and components normally live under `src/layouts/` and `src/components/`; source-managed assets live under `src/`; and files under `public/` are copied as-is to the output root. Use a structure that makes content, page shells, reusable UI, and client islands easy to distinguish.

```text
src/
├── assets/
│   ├── projects/
│   └── portraits/
├── components/
│   ├── ProjectCard.astro
│   ├── SiteHeader.astro
│   └── FilterGallery.jsx
├── content.config.ts
├── content/
│   └── work/
│       ├── field-notes.md
│       └── quiet-objects.md
├── layouts/
│   └── SiteLayout.astro
├── pages/
│   ├── index.astro
│   ├── about.astro
│   └── work/
│       ├── index.astro
│       └── [...slug].astro
└── styles/
    └── global.css
public/
└── favicon.svg
```

The exact folders can vary; the principle is that each file has an understandable job. Avoid turning `src/components/` into a dumping ground for pages, content data, build scripts, and unrelated utilities. Keep the route tree aligned with the site's information architecture. A project detail route should be easy to locate, and its data should not be duplicated across the homepage and work index.

Use trailing-slash conventions consistently with the project and hosting environment. Astro's `trailingSlash` configuration can control generated URL behavior, but it must match deployment routing and canonical URL decisions. Do not assume that every static host redirects between `/work/project` and `/work/project/` correctly.

**Gotcha:** A file placed in `public/` is not processed like a source import. If you need bundler-managed hashing, transformations, or image metadata, use the source asset pipeline instead.

### 3. Content Collections and Schema Validation

A portfolio's project data is structured content, not an informal collection of copied markup. A case study may need a title, summary, publication date, hero image, image alt text, tags, role, year, and featured status. A schema helps catch missing or malformed fields at build time, before a broken card or incomplete metadata reaches a client. In current Astro versions, content collections are defined through the content configuration API; check the installed version's official guide when setting up the schema because APIs changed across major versions.

A representative collection definition using Zod looks like this in a current content configuration file:

```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content';

const work = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
  }),
});

export const collections = { work };
```

This is an example of the schema shape, not a substitute for checking the exact collection API of the installed Astro release. Keep the schema aligned with actual content needs. Avoid fields that no page uses, but do not omit fields required for accessible image descriptions or search snippets. Defaults are useful when absence has a clear meaning; they are dangerous when they silently hide incomplete editorial input. For example, defaulting tags to an empty array is reasonable, while defaulting every image alt text to an empty string can conceal a missing description for an informative image.

When rendering a collection, sort and filter intentionally. Do not rely on filesystem order. Decide whether the newest case study comes first, whether featured projects appear in a separate section, and what happens when the collection is empty. Validate dates, slugs, and references during build and add a content review checklist for editorial changes.

**Gotcha:** A schema validates shape, not editorial truth. It cannot determine whether a project title is compelling, a summary is accurate, or an image description communicates the image's purpose.

### 4. Dynamic Routes and Static Path Generation

A dynamic route such as `src/pages/work/[slug].astro` or a catch-all route can render a page for each content entry. For a static build, dynamic routes generally need to declare which paths should be generated through `getStaticPaths()`. Each returned entry maps route parameters to data props. The function should be deterministic: the same committed content and configuration should produce the same routes.

```astro
---
import { getCollection } from 'astro:content';
import SiteLayout from '../../layouts/SiteLayout.astro';

export async function getStaticPaths() {
  const projects = await getCollection('work');
  return projects.map((project) => ({
    params: { slug: project.id },
    props: { project },
  }));
}

const { project } = Astro.props;
---
<SiteLayout title={project.data.title}>
  <article>
    <h1>{project.data.title}</h1>
    <p>{project.data.description}</p>
  </article>
</SiteLayout>
```

Adapt this example to the content model and Astro version in use. Markdown/MDX entry rendering APIs differ by content format and version, so consult the matching guide before adding `render()` or changing the entry shape. Keep the slug policy deliberate: stable slugs are part of the public URL contract. Renaming a project may require a redirect or an explicit migration, not merely changing a filename and hoping old links disappear harmlessly.

For static sites, test the generated route list and the output folder. A home page may render correctly while a dynamic project route was never generated. For server-rendered deployments, dynamic route handling depends on the adapter and deployment platform; do not mix static-only assumptions with request-time behavior.

**Gotcha:** A dynamic route file does not guarantee that every content item becomes a page. Confirm `getStaticPaths()` returns the expected params and that the output contains the resulting paths.

### 5. Layouts, Slots, and Page Metadata

A layout owns repeated document structure: `html`, `head`, global navigation, main content wrapper, footer, and shared styles. It should receive explicit page-level data such as title, description, canonical URL, and social preview image. Individual pages supply content through a slot. Avoid building a single enormous layout with many route-specific conditionals; that couples unrelated pages and makes metadata errors more likely.

```astro
---
interface Props {
  title: string;
  description?: string;
}
const { title, description = 'Selected work and experiments.' } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content={description} />
    <title>{title}</title>
  </head>
  <body>
    <slot />
  </body>
</html>
```

The example intentionally shows a minimal contract. A production site may also need canonical URLs, Open Graph fields, theme color, icons, and a consistent way to prevent duplicate metadata. Use absolute URLs for canonical and social image fields when required by crawlers, and derive them from a configured site URL rather than hardcoding a staging host. Avoid passing arbitrary HTML strings for metadata or using user-controlled values without appropriate handling.

Metadata is part of the route model. Each case study should have a unique title and useful description; the about page should not inherit the homepage title by accident. For a site with many pages, centralize repeated tag generation in a component or helper while keeping the page's data explicit.

**Gotcha:** A correct HTML title does not automatically create a correct canonical URL or social card. Inspect the final HTML for representative routes, not only the homepage.

### 6. Islands Architecture and Hydration Directives

Astro can render components from UI frameworks such as React, Vue, Svelte, or others when the corresponding integration is installed. By default, framework components can render to HTML without becoming interactive in the browser. Client directives opt into hydration. Select the directive based on the interaction's urgency and visibility: `client:load` hydrates immediately, `client:idle` waits until the browser is idle, and `client:visible` delays until the component enters the viewport. Other directives and behavior depend on the framework integration and Astro version, so use the official directive documentation as the source of truth.

```astro
---
import FilterGallery from '../components/FilterGallery.jsx';
---
<section aria-labelledby="gallery-title">
  <h2 id="gallery-title">Projects</h2>
  <FilterGallery client:visible />
</section>
```

Use `client:load` for controls that must work immediately on first paint, such as a critical menu that truly requires client state. Use `client:visible` for below-the-fold filters or galleries whose interaction can wait until they approach the viewport. Use `client:idle` only when delayed activation is acceptable and test behavior on busy devices. A client directive is not a performance decoration; it changes when JavaScript runs and when the control becomes interactive.

Before hydrating, ask whether plain links, `<details>`, CSS, native form controls, or a small isolated script can satisfy the requirement. A portfolio card grid rarely needs a framework runtime merely to show cards. A complex draggable comparison tool might. Keep hydrated islands bounded and pass only the data they need. Avoid creating many tiny islands that each initialize a large runtime unless the integration can share that runtime efficiently.

**Gotcha:** Hydration timing can create a period where server-rendered markup is visible but the control is not yet interactive. Make this state understandable, and do not hide essential content until hydration succeeds.

### 7. Static Output, SSR, and Adapters

Astro supports static generation and server-rendered output. Static generation is a strong default for a portfolio because pages can be generated at build time and served from a CDN with minimal runtime infrastructure. Server rendering becomes relevant when a page needs request-time personalization, protected data, dynamic request handling, or a platform-specific server capability. The choice affects deployment, caching, secrets, latency, and failure modes.

A static deployment typically publishes the generated output directory. A server-rendered deployment requires a compatible adapter and a hosting target that supports its runtime model. Do not add an adapter by habit, and do not assume a server route works on a purely static host. The correct adapter depends on the provider and the supported Astro version. Use the official adapter documentation for the chosen platform, then verify the actual deployment artifact and runtime logs.

```js
// astro.config.mjs — a minimal static configuration
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
});
```

This is a valid, explicit static-output example. For SSR, select the provider's adapter and configure the output mode according to the current documentation rather than inventing adapter properties. Document the deployment contract in the README: build command, output directory, environment variables, redirects, and required platform features.

**Gotcha:** A build that succeeds locally does not prove that the host's routing, image optimization, server runtime, or cache headers are correct. Test the deployed URL and at least one nested route.

### 8. Source Assets, Public Assets, and Image Handling

Astro distinguishes source assets that pass through the build pipeline from files in `public/` that are copied without processing. Source assets can be imported and, for supported image workflows, processed or transformed. Public assets are appropriate when a file must retain a stable known path, such as `robots.txt`, a favicon, or a vendor file that must be referenced by exact URL. They are less appropriate when you want the build system to discover and transform a local image dependency.

```astro
---
import heroImage from '../assets/projects/field-notes-hero.jpg';
import { Image } from 'astro:assets';
---
<Image
  src={heroImage}
  alt="A field notebook and camera arranged on a wooden table"
  widths={[640, 960, 1440]}
  sizes="(min-width: 60rem) 50vw, 100vw"
  format="webp"
/>
```

Check the image component's exact props against the installed Astro version. Supply meaningful alt text, responsive widths, and a sizes expression that reflects the actual layout. A decorative image should use empty alt text when it adds no information; do not repeat adjacent headings in alt text. Avoid shipping a 5000-pixel image to a 360-pixel mobile card when a responsive candidate can be used.

For galleries, preserve aspect-ratio intent with CSS and avoid layout shifts by providing dimensions or an aspect-ratio container. Audit both source images and output candidates. Image optimization can be affected by remote source policy, installed services, and deployment constraints. Keep originals organized and do not treat `public/` as an optimization service.

**Gotcha:** Setting `loading="lazy"` on the main above-the-fold hero can delay the visual content users came to see. Prioritize the actual LCP image and lazy-load below-the-fold media instead.

### 9. CSS Strategy, Fonts, and Design-System Boundaries

Astro supports scoped styles in `.astro` components and global stylesheets. Scoped styles help keep component rules local, while global styles are appropriate for resets, tokens, typography defaults, and shared utilities. Choose a clear strategy instead of mixing several CSS systems without ownership. A portfolio with a distinctive visual language benefits from central tokens for color, type scale, spacing, radii, motion, and content width.

```css
/* src/styles/global.css */
:root {
  color-scheme: light;
  --color-ink: #171717;
  --color-paper: #f5f2eb;
  --color-accent: #d55e36;
  --space-1: 0.5rem;
  --space-2: 1rem;
  --space-3: 1.5rem;
  --content-width: 72rem;
}

.page-shell {
  width: min(calc(100% - 2 * var(--space-2)), var(--content-width));
  margin-inline: auto;
}
```

Load styles deliberately. Avoid global selectors that accidentally alter third-party widget internals or component markup. Use logical properties when they improve writing-direction resilience. Fonts should have a fallback stack, sensible `font-display` behavior, and only the weights actually needed. Self-hosting fonts can improve control but requires licensing checks and careful file subsets; external font services introduce network and privacy considerations.

Do not use CSS scoping as a substitute for component design. A component should still expose clear structure, variants, and responsive behavior. Conversely, avoid forcing every style into global CSS; that makes ownership and deletion harder. Document the boundary between tokens, shared primitives, and page-specific art direction.

**Gotcha:** Scoped styles can behave differently around framework components or slotted content than a developer expects. Test the rendered DOM and use the appropriate Astro scoping mechanism rather than escalating selectors randomly.

### 10. Environment Variables, Site URL, and Secrets

Environment variables have different security properties depending on where they are consumed. Build-time public values may be embedded in generated HTML or JavaScript. Server-only secrets must never be imported into client components or serialized into page props. Astro has its own environment-variable conventions and type-safe environment API in modern versions; use the API documented for the project's installed release and distinguish values intended for client exposure from private values.

```dotenv
# .env — example public site configuration only
PUBLIC_SITE_NAME="Northstar Studio"
PUBLIC_ANALYTICS_ID="example-public-id"

# Server-only secret: never prefix with PUBLIC_
CMS_API_TOKEN="replace-in-local-environment"
```

```ts
// Example: server-side code should read a secret only where it is needed.
// Use the env API supported by your installed Astro version.
const token = import.meta.env.CMS_API_TOKEN;
if (!token) throw new Error('CMS_API_TOKEN is required');
```

Do not commit real secrets, even to a private repository. Add local environment files to `.gitignore`, provide `.env.example` with placeholder values, and configure real values in the deployment environment. If a secret is accidentally committed, deleting the line in a later commit is not sufficient: rotate the credential because it remains in repository history and may already have been copied.

Use the `site` setting in Astro configuration when generating canonical URLs and sitemaps, and verify production URLs in output. A staging URL accidentally embedded in canonical metadata can harm indexing. Avoid assuming that a public environment variable is hidden because it came from an environment file; public means it may be exposed to the browser.

**Gotcha:** Build-time configuration can become part of static output. Never put credentials in a value that a page, client island, or generated JavaScript can access.

### 11. Integrations, MDX, and Content Rendering Boundaries

Astro integrations extend the build pipeline: UI frameworks, sitemap generation, MDX, and deployment adapters are common examples. Add an integration only when a project requirement needs it. Every integration increases dependency surface, may change build behavior, and must be compatible with the installed Astro version. Keep `astro.config.mjs` concise so reviewers can understand which integrations affect routing, content, rendering, and output.

MDX is useful when case studies need structured components inside editorial content. It is also easy to overuse. If every content entry is a bespoke component tree, non-developer editing becomes difficult and content review loses consistency. Define a small approved set of embeds—image sequence, quote, metric, video, or callout—and document their required fields and accessibility behavior.

```mdx
---
 title: "Field Notes"
 description: "A visual identity and editorial system for an outdoor journal."
---

The project began with a simple editorial question: how can a field journal feel both precise and personal?

<figure>
  <img src="/images/field-notes-detail.jpg" alt="Close-up of the journal's printed cover and paper texture" />
  <figcaption>Printed cover study and paper selection.</figcaption>
</figure>
```

This illustrates the content idea, not every version-specific import or content-collection API. Verify how MDX components are registered in the installed version and prefer optimized source assets when appropriate. Content authoring should be tested with missing images, long titles, special characters, and empty optional sections.

**Gotcha:** Rich content can bypass assumptions made by your layout. Test headings, lists, links, images, and embedded components for spacing, keyboard behavior, and semantic structure.

### 12. Performance Validation and Production Diagnostics

Astro's default rendering strategy can reduce client JavaScript, but performance must be measured across the whole page. Inspect the generated HTML, network requests, image sizes, font loading, JavaScript transfer, layout stability, and real user experience. A portfolio may be visually minimal yet ship a heavy video background, a large animation library, multiple font families, and several third-party trackers. The framework cannot cancel those costs.

Use a repeatable validation sequence: clean install from the lockfile, run checks, build, preview the output, inspect console errors, test representative routes, and measure performance at mobile conditions. Lighthouse lab metrics are useful diagnostics, not proof of real-user outcomes. Where available, review field data and performance telemetry after deployment. A single perfect Lighthouse run should not excuse an untested route or a broken keyboard interaction.

```bash
# Reproduce dependencies from the committed lockfile.
npm ci

# Run the project's declared checks and production build.
npm run check
npm run build

# Serve the generated output locally for a smoke test.
npm run preview
```

Only run scripts that exist in `package.json`; add a `check` script if the project uses Astro's type/content diagnostics and the command is appropriate for its setup. For pnpm or Yarn, use the equivalent frozen-lockfile install command documented by that package manager. Do not copy `npm ci` into a pnpm project without changing the workflow.

A practical performance budget should be agreed before the design becomes expensive to change. Example starting targets for a creative portfolio: LCP at or below 2.5 seconds, CLS at or below 0.1, INP at or below 200 milliseconds at the 75th percentile when field data is available, initial compressed JavaScript under a team-defined limit (for example 170 KB), and a hero image selected for the actual viewport. Treat bundle budgets as project-specific policy, not a universal law. Set exceptions for a justified feature and record who approved them.

**Gotcha:** Lighthouse's lab INP-like interaction diagnostics and field INP are not interchangeable. Report which metric and environment were measured.

---

## Advanced Patterns / Integration Patterns

### Pattern 1: Static-First Portfolio Shell

**What it does:** Renders shared navigation, page content, and footer as HTML while keeping the client runtime absent unless a feature requires it.

**When to use:** Editorial pages, project indexes, biographies, and case studies where most content is readable without interaction.

```astro
---
import SiteHeader from '../components/SiteHeader.astro';
import SiteFooter from '../components/SiteFooter.astro';
interface Props { title: string; description?: string }
const { title, description = 'Selected work and experiments.' } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content={description} />
    <title>{title}</title>
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to content</a>
    <SiteHeader />
    <main id="main"><slot /></main>
    <SiteFooter />
  </body>
</html>
```

Keep the shell stable and intentionally small. A skip link is useful only when it is visible on keyboard focus and points to a real landmark. Avoid turning every repeated region into a client island. Verify the generated HTML includes the main content before JavaScript runs and that headings form a logical outline.

### Pattern 2: Schema-Driven Work Collection

**What it does:** Defines a consistent editorial contract and makes missing data fail early.

**When to use:** A portfolio with multiple case studies, tags, featured projects, and predictable metadata.

```ts
// Current Astro projects define collections in src/content.config.ts.
import { defineCollection, z } from 'astro:content';

const work = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    publishDate: z.coerce.date(),
    role: z.string(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
  }),
});
export const collections = { work };
```

Use the collection API for the Astro version in the repository; older projects may use a different configuration file convention. Add only fields that the product consumes. If the content schema evolves, migrate entries in the same change and run the full build so old files do not fail unexpectedly.

### Pattern 3: Predictable Static Dynamic Routes

**What it does:** Creates a page for every approved content item and keeps the route map inspectable.

**When to use:** Case-study detail pages that are generated from committed content.

```astro
---
import { getCollection } from 'astro:content';
import SiteLayout from '../../layouts/SiteLayout.astro';

export async function getStaticPaths() {
  const entries = await getCollection('work');
  return entries.map((entry) => ({
    params: { slug: entry.id },
    props: { entry },
  }));
}
const { entry } = Astro.props;
---
<SiteLayout title={entry.data.title} description={entry.data.description}>
  <article>
    <h1>{entry.data.title}</h1>
    <p>{entry.data.description}</p>
  </article>
</SiteLayout>
```

Check the entry shape and rendering method for the content format and Astro version. Test at least one route with punctuation in its title, one with optional fields omitted, and one newly added entry. If a slug changes, decide how old URLs will redirect rather than letting the change silently break backlinks.

### Pattern 4: A Small, Explicit Client Island

**What it does:** Hydrates one interaction-heavy widget while leaving surrounding page content as server-rendered HTML.

**When to use:** Searchable/filterable galleries or a real-time comparison interface that cannot be implemented cleanly with native controls alone.

```astro
---
import ProjectFilter from '../components/ProjectFilter.jsx';
const filters = ['All', 'Identity', 'Digital', 'Editorial'];
---
<section aria-labelledby="projects-heading">
  <h2 id="projects-heading">Projects</h2>
  <ProjectFilter filters={filters} client:visible />
</section>
```

Install and configure the correct framework integration before using framework components. `client:visible` is a deliberate delay: verify that the interaction remains understandable before hydration and that the component does not contain the only copy of important content. If the project list can be represented as ordinary links and category pages, prefer the simpler architecture.

### Pattern 5: Responsive Optimized Image

**What it does:** Uses build-time asset handling to emit appropriate image candidates and reduces layout instability.

**When to use:** Project thumbnails, portraits, and case-study hero images stored in source assets.

```astro
---
import { Image } from 'astro:assets';
import hero from '../assets/work/field-notes-hero.jpg';
---
<Image
  src={hero}
  alt="A printed journal open beside a pencil and camera"
  widths={[640, 960, 1440]}
  sizes="(min-width: 64rem) 60vw, 100vw"
  format="webp"
/>
```

Confirm supported formats and component properties in the installed version. Use an alt description that reflects the image's information, not its file name. The `sizes` value should match the actual CSS layout; a mismatched hint can cause the browser to download a larger candidate than needed. Do not lazy-load the LCP image merely because lazy loading is the default pattern for galleries.

### Pattern 6: Environment-Safe Configuration

**What it does:** Keeps public configuration separate from server-only credentials and centralizes the canonical site origin.

**When to use:** Builds that call a CMS, generate metadata, or deploy to staging and production.

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://portfolio.example.com',
  output: 'static',
});
```

Keep secrets in the deployment environment and read them only in server-side code paths. Public variables are not secret. If preview and production use different domains, ensure the canonical origin comes from the intended deployment configuration and does not accidentally publish the staging host.

### Pattern 7: Production Build and Route Smoke Test

**What it does:** Checks that the lockfile reproduces dependencies and that generated routes and assets work without the development server.

**When to use:** Before client review, merge, or deployment.

```bash
npm ci
npm run build
npm run preview
```

These commands assume an npm project and a declared build script. Confirm the actual scripts before using them. Add automated checks for required output paths and broken internal links where practical. Test the deployed preview as well: a local preview cannot reproduce every host rewrite, cache, compression, or base-path rule.

---

## Common Mistakes

| Mistake | Why it fails | Distinct fix |
|---|---|---|
| Hydrating every component | Ships unnecessary client JavaScript and delays interaction readiness | Keep static markup in `.astro` files and hydrate only proven interactive islands |
| Using `client:load` for every island | Starts all widgets eagerly and competes for main-thread time | Select the directive according to interaction urgency and viewport position |
| Treating Astro as automatically fast | Images, fonts, embeds, and scripts can dominate performance | Measure transfer sizes, rendering, and field experience after deployment |
| Defining content fields only by convention | Missing values break cards or metadata late in review | Add a collection schema and validate with a clean build |
| Sorting projects by implicit filesystem order | Display order can change unexpectedly | Sort by an explicit date, rank, or editorial field |
| Changing slugs without redirects | Old portfolio links and search results become broken | Preserve stable IDs and add redirects for intentional URL changes |
| Assuming a dynamic route creates every static page | Unreturned paths may not exist in output | Inspect `getStaticPaths()` results and generated files |
| Mixing static and SSR assumptions | Server-only features may fail on a static host | Choose output mode and adapter from the hosting requirements |
| Adding an adapter without a runtime need | Increases deployment complexity and failure surface | Keep static output unless request-time behavior is required |
| Using public assets for every image | Skips source-asset processing and makes imports less explicit | Import local content assets through the supported asset pipeline |
| Importing source assets for exact-path files | Hashed output may not match external systems expecting a fixed path | Use `public/` for files that require stable unprocessed URLs |
| Omitting alt text on informative images | Screen-reader users lose important visual context | Require a meaningful alt field for informative editorial imagery |
| Repeating nearby headings in alt text | Adds redundant narration without extra information | Describe the image's meaningful content or use empty alt for decoration |
| Lazy-loading the main hero image | Can delay the largest visible content element | Prioritize the LCP candidate and lazy-load below-the-fold media |
| Setting a global `img { width: 100% }` blindly | Can distort icons or inline images | Scope responsive image rules to content and media components |
| Copying configuration from another Astro major version | API names or file conventions may no longer match | Check documentation against the exact installed package version |
| Installing several UI integrations by default | Adds dependencies and configuration without user value | Install only the framework integration used by a real island |
| Serializing server secrets into props | Exposes credentials in rendered HTML or browser bundles | Keep secrets in server-only modules and never pass them to client components |
| Hardcoding a staging canonical URL | Search engines may index the wrong origin | Configure the production `site` origin and inspect emitted metadata |
| Using one generic title on every page | Weakens page identity and search previews | Pass a unique title and description from each route's content |
| Ignoring empty collection states | The page can look broken when content is temporarily absent | Render a clear editorial fallback or fail the build when emptiness is invalid |
| Assuming MDX content is automatically accessible | Embedded headings, images, and custom components can break semantics | Test all content primitives with keyboard and screen-reader expectations |
| Treating a successful build as full deployment proof | Hosting rewrites and runtime behavior can still fail | Smoke-test the deployed preview and nested URLs |
| Measuring only desktop Lighthouse | Mobile CPU and network conditions expose different bottlenecks | Record a repeatable mobile test profile and inspect field data when available |
| Adding animation libraries for simple fades | Increases bundle and maintenance costs | Prefer CSS for simple state transitions and reserve libraries for complex sequences |
| Letting third-party embeds load immediately | Adds network, privacy, and performance cost before the user needs them | Use a consent-aware or click-to-load placeholder where appropriate |
| Forgetting keyboard focus in filters | Pointer users can operate controls while keyboard users cannot | Use native buttons, visible focus, and meaningful selected-state semantics |
| Using a single enormous page component | Couples content, route logic, layout, and interaction state | Split reusable shell, content components, and truly interactive islands |
| Keeping unused integration packages | Increases upgrade and audit burden | Remove unused integrations and validate the lockfile after cleanup |
| Using inconsistent trailing-slash URLs | Can create duplicate or broken paths across hosts | Choose one URL policy and verify redirects/canonical links |
| Testing only the home page | Nested routes and long content often reveal different bugs | Smoke-test home, about, index, detail, and a missing route |
| Ignoring image aspect ratios | Causes layout shifts while media loads | Set dimensions or a stable aspect-ratio container |
| Making all content client-rendered | Hides core reading content behind JavaScript execution | Keep primary content in generated HTML and use progressive enhancement |
| Relying on defaults without documenting them | Future maintainers cannot tell intentional behavior from accident | Record route, output, asset, and deployment assumptions in README |
| Failing to pin or lock dependencies | Builds can resolve different transitive versions | Commit one package-manager lockfile and use its reproducible CI install |
| Ignoring build warnings | Warnings can signal future errors or oversized dependencies | Review each warning and document intentional exceptions |
| Using a placeholder alt value everywhere | Passes superficial checks but communicates no useful image meaning | Write contextual alt text or mark genuinely decorative images empty |
| Treating Lighthouse lab metrics as field metrics | Misrepresents real-user responsiveness and layout stability | Label the measurement source and use field data for field claims |
| Forgetting 404 and redirect behavior | Visitors can land on broken URLs from old links | Configure host-compatible redirects and test a not-found route |
| Passing huge datasets into an island | Increases serialized HTML and hydration cost | Pass only required fields and paginate or filter at build/request time |
| Building an inaccessible custom menu | Pointer interaction may work while keyboard and escape behavior fail | Prefer semantic links and buttons; implement focus management if a dialog is required |

---

## Mental Models

1. **HTML is the default product; hydration is an opt-in cost.** Start with what a visitor can read and navigate before client code runs, then add the smallest interaction layer that solves the actual task.
2. **Content is data with a contract.** A schema and stable slug policy turn case studies from copied markup into a maintainable publishing system.
3. **A route is a public interface.** Filenames, canonical URLs, redirects, and trailing-slash rules affect external links and should be treated as compatibility decisions.
4. **Build output is a separate artifact.** The dev server is a workbench; production output must stand on its own under the target host's routing and caching rules.
5. **A client island has a budget.** Every hydrated component consumes transfer, parse, execution, and maintenance budget; justify it with user value.
6. **An asset path expresses ownership.** Source imports are build-managed dependencies; public files are stable-path assets copied as-is. Choose based on required behavior.
7. **A performance budget is a product decision.** Numeric targets help teams discuss trade-offs, but the budget must match the page's purpose and be measured consistently.
8. **A green build is necessary, not sufficient.** Route smoke tests, accessibility checks, deployed previews, and performance measurements cover failure modes a compiler cannot detect.
9. **Editorial quality and schema validity are different checks.** Valid fields prevent structural errors; human review ensures the content is meaningful, accurate, and appropriate.
10. **The cheapest runtime is the one you do not need.** Native HTML, CSS, and links are often enough for a portfolio's default reading experience.
11. **Framework compatibility is versioned.** Config snippets are only trustworthy when they match the package version, integration, and host runtime in the repository.
12. **Progressive enhancement preserves value under failure.** If a filter or animation fails to initialize, the visitor should still be able to understand the work and reach its detail pages.

---

## Quick Reference

| Need | Preferred Astro approach | Validation |
|---|---|---|
| Shared document shell | `.astro` layout with a slot | Inspect title, description, landmarks, and generated HTML |
| Repeated case studies | Content collection with schema | Run build after adding malformed test content |
| Static detail pages | Dynamic route with `getStaticPaths()` | Confirm expected paths exist in output |
| Complex browser interaction | Framework island with explicit client directive | Inspect JS transfer and test before/after hydration |
| Basic navigation | Semantic links in `.astro` components | Keyboard-test focus order and destinations |
| Local image processing | Import from `src/` and use supported image APIs | Inspect emitted candidates and dimensions |
| Stable URL file | `public/` asset | Confirm exact URL in deployment |
| Canonical origin | `site` configuration and shared metadata logic | Inspect production HTML on multiple routes |
| Static hosting | Static output and published generated directory | Verify nested routes and host fallback behavior |
| Request-time logic | Compatible SSR output and adapter | Test runtime logs and deployed route behavior |
| Public configuration | Documented public environment variable | Confirm no private values appear in bundle or HTML |
| Private credentials | Server-only environment value | Scan output and rotate any leaked credential |
| Typography tokens | Global stylesheet or design tokens | Test font loading, fallbacks, and layout shift |
| Below-the-fold gallery | Responsive image and appropriate lazy loading | Confirm hero is not accidentally delayed |
| Page-level metadata | Unique title, description, canonical, social fields | Inspect emitted metadata, not only source templates |
| CI dependency install | Lockfile-backed frozen install | Run from a clean checkout |
| Performance acceptance | Explicit LCP/CLS/INP and asset budgets | Record device, network, and measurement source |
| Content migration | Schema update plus entry migration | Build all entries and review changed URLs |
| Third-party media | Deferred, consent-aware embed where suitable | Measure requests before and after activation |
| Release verification | Build, preview, route smoke tests, accessibility checks | Verify the actual deployment preview |

---

## Build Challenge

### Build a Production-Ready Creative Portfolio with Astro

Create a portfolio for a small design studio with a homepage, project index, at least four case-study routes, an about page, and a contact route or contact section. The goal is not to maximize the number of libraries. The goal is to demonstrate a clear content model, static-first rendering, intentional client interactivity, accessible media, and a deployment artifact that behaves correctly.

**Requirements**

1. Scaffold an Astro project using a supported version and commit exactly one package-manager lockfile.
2. Create a shared layout with a skip link, semantic landmarks, responsive viewport metadata, unique page title support, and a description field.
3. Define a `work` content collection with validated title, description, date, role, tags, and featured status; adapt the API to the installed Astro version.
4. Add at least four case-study entries with distinct stable IDs, useful descriptions, meaningful image alternatives, and non-identical content.
5. Build a project index that sorts entries by an explicit rule and renders a clear state if no projects are available.
6. Generate a detail route for every collection entry and verify the expected generated output paths.
7. Create a responsive image treatment for thumbnails and hero media; set a deliberate aspect ratio and avoid delaying the LCP image.
8. Implement navigation with semantic links, visible keyboard focus, and a mobile layout that remains usable without JavaScript.
9. Add one client island only if a real interaction requires it, such as category filtering; document why plain HTML or CSS was insufficient.
10. Choose the hydration directive based on urgency and visibility, and test the pre-hydration state for clarity.
11. Add unique page metadata and canonical URL behavior using a configured production origin; verify at least three routes in the built HTML.
12. Keep secrets out of public environment variables, client props, generated HTML, and source control; provide an `.env.example` with placeholders only.
13. Decide whether static output meets the requirements; if SSR is necessary, document the adapter and runtime requirements instead of mixing deployment assumptions.
14. Add an explicit trailing-slash and redirect policy and verify a nested URL and a missing URL on the deployment preview.
15. Add a README describing prerequisites, package manager, install command, development command, build command, output directory, and deployment assumptions.
16. Run the project from a clean checkout using the package manager's reproducible install command, then run the declared checks and production build.
17. Serve the generated output with the project's preview command and smoke-test the homepage, project index, all detail routes, about page, and not-found behavior.
18. Measure performance using a repeatable mobile profile; record LCP, CLS, and interaction metrics with their measurement source, rather than claiming a single lab score proves field performance.
19. Set a compressed initial JavaScript budget, for example 170 KB as a starting team target, and document any approved exception with the feature that justifies it.
20. Check the hero and gallery image sizes, font loading, layout shift, console errors, failed requests, and unused integrations before release.
21. Test keyboard navigation and focus visibility across the header, project links, filters, and contact controls.
22. Simulate a content failure by temporarily omitting a required schema field and confirm the build surfaces a useful error; restore valid content afterward.
23. Simulate a deployment edge case by testing a nested route under the chosen host and confirming its asset URLs resolve correctly.
24. Review the output directory to ensure the deployment publishes generated artifacts rather than source files or `node_modules`.

**Required failure scenarios:** The challenge is incomplete unless it demonstrates (a) a content-schema failure that is caught before release, (b) a broken or missing nested route that is detected during smoke testing, and (c) an asset or image-loading issue that is found and fixed. Record the observed symptom, root cause, fix, and regression test for each scenario.

---

## Definition of Done / Success Criteria

- [ ] A clean checkout installs from one committed lockfile and produces a successful production build.
- [ ] The collection schema validates required project fields and invalid content fails in a predictable way.
- [ ] Every intended case-study route exists in the output or is handled by the documented SSR runtime.
- [ ] Primary content and navigation remain useful before client hydration.
- [ ] Client JavaScript is limited to documented interactions and measured against the agreed budget.
- [ ] Images have appropriate alt text, stable layout dimensions, responsive candidates, and intentional loading priority.
- [ ] Page titles, descriptions, canonical URLs, and social metadata are correct on representative routes.
- [ ] No secret appears in the repository, generated HTML, browser bundle, or client props.
- [ ] Keyboard navigation, focus visibility, headings, and landmark structure pass manual review.
- [ ] The chosen output mode and adapter match the actual hosting platform.
- [ ] Nested routes, redirects, asset URLs, and the not-found experience are verified on a deployment preview.
- [ ] LCP, CLS, interaction responsiveness, and bundle budgets are recorded with device and measurement context.
- [ ] All challenge failure scenarios have a root cause, fix, and regression check.
- [ ] README instructions are sufficient for a new developer to run, build, preview, and deploy the project.

---

## Topic-Specific Gotchas and Diagnostic Notes

**Gotcha — “It renders on localhost, so the route is correct.”** Local development can conceal static path-generation gaps and hosting rewrite problems. Inspect the generated route list, then open nested routes on the preview host directly rather than navigating to them only from the homepage.

**Gotcha — “Astro means zero JavaScript.”** Framework islands, inline scripts, analytics, video players, and third-party embeds still contribute JavaScript. Inspect the network panel and built assets to identify the actual source of client cost.

**Gotcha — “A content schema means the content is complete.”** Schemas validate structure and types. They do not assess image meaning, factual accuracy, writing quality, or whether a project description duplicates another entry. Keep an editorial review step.

**Gotcha — “Every image should be lazy-loaded.”** A hero image that determines LCP may need high priority, while gallery images below the fold are good lazy-loading candidates. Choose by visual position and measurement, not a universal rule.

**Gotcha — “Public environment files are private because they are not committed.”** Build tools can embed public values into browser-visible output. Treat public-prefixed values as exposed and inspect the generated HTML and JavaScript for accidental secret leakage.

**Gotcha — “Static preview equals production.”** The preview server helps inspect generated files but does not reproduce every host's redirects, caching headers, compression, runtime, or access policy. Test the real deployment preview too.

**Gotcha — “A hydration directive is a styling option.”** It changes when client code executes. Delayed hydration can leave a visible but temporarily inert control, so test the transition and provide a reasonable fallback.

**Gotcha — “A file under `public/` is automatically optimized.”** Public files are generally copied as-is. Use the supported source asset pipeline when you need build-time image processing and responsive output.

---

## Troubleshooting Decision Tree

### The content page fails during build

1. Read the first schema or route error rather than the final summary line only.
2. Confirm the entry's frontmatter matches the collection schema, including date formats and required fields.
3. Check whether the project uses the content API matching its installed Astro version.
4. Fix the entry or intentionally migrate the schema; do not silence the validation just to make the build green.
5. Re-run the full build and keep a regression fixture or content check where practical.

### A project card appears but its detail page returns 404

1. Confirm the entry is included by the collection query and has the expected ID/slug.
2. Confirm the dynamic route returns the corresponding `params` from `getStaticPaths()` for static output.
3. Inspect the generated output path and match it to the host's trailing-slash policy.
4. Open the nested URL directly on the deployment preview.
5. If a public slug changed, add a redirect and verify the old URL.

### Images or fonts are missing after deployment

1. Inspect the failed request URL and status code in the browser network panel.
2. Determine whether the asset is a source import or a public file; check that the chosen path matches the asset ownership model.
3. Check whether the project is deployed at a domain root or subpath and verify the generated URL.
4. Inspect the output directory for the expected emitted asset and candidate variants.
5. Rebuild from a clean checkout and retest the deployed preview.

### The page feels slow despite low JavaScript

1. Measure LCP, CLS, and interaction responsiveness under a documented mobile profile.
2. Inspect hero image transfer size, responsive `sizes`, dimensions, and loading priority.
3. Check font requests, render-blocking CSS, video backgrounds, and third-party requests.
4. Review long tasks and layout shifts instead of blaming the framework without evidence.
5. Fix the largest measured bottleneck first and rerun the same test profile.

### An interactive island is visible but does not respond immediately

1. Check which client directive is used and whether delayed hydration is expected.
2. Confirm the relevant framework integration is installed and compatible.
3. Check console errors and whether the component is rendered as HTML but its client bundle failed.
4. Verify that the component's initial server markup matches its client assumptions.
5. Use an earlier hydration strategy only if the interaction genuinely needs to be available sooner; otherwise provide a clear fallback.

---

## Release Checklist for Creative Projects

- [ ] Confirm the installed Astro version and use version-matched documentation for config and content APIs.
- [ ] Confirm the project is intentionally static or SSR and that the hosting provider supports the chosen mode.
- [ ] Validate all content entries, stable IDs, required metadata, and redirects for renamed projects.
- [ ] Inspect HTML output for titles, descriptions, canonical URLs, heading structure, and landmarks.
- [ ] Inspect client JavaScript and remove unnecessary integrations, duplicated runtimes, and unused scripts.
- [ ] Check the hero image's loading priority and gallery images' responsive behavior.
- [ ] Confirm fonts have sensible fallbacks and do not cause avoidable layout shifts.
- [ ] Test keyboard operation, visible focus, reduced-motion preferences, and mobile navigation.
- [ ] Check 404, nested routes, trailing slashes, and any redirect rules on the real preview host.
- [ ] Run a clean lockfile-backed install, project checks, production build, and preview smoke test.
- [ ] Record performance measurements and compare them with the project's stated budgets.
- [ ] Verify no credentials or private environment values appear in repository history or generated assets.
- [ ] Confirm the published directory contains the expected generated output and no development-only files.
- [ ] Update README deployment instructions and document any known trade-offs or approved budget exceptions.

## Final Engineering Principle

Astro is most effective when its architecture reflects the shape of the product: content first, static HTML by default, validated editorial data, optimized assets, and client-side behavior only where the visitor benefits from it. A strong portfolio is not the one with the most integrations or the cleverest rendering trick. It is the one whose pages are understandable, fast under realistic conditions, accessible without hidden assumptions, stable at their public URLs, and straightforward for another developer to maintain. Treat the generated output and deployed site as the deliverable—not merely the source code that looked right in development.
