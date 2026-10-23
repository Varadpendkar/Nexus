---
# SKILL: nextjs-portfolio-arch
**Layer:** 10 — Build Tooling / Architecture
**Goal:** Design a maintainable Next.js portfolio architecture that supports strong project pages, accessible navigation, predictable rendering, reliable metadata, and production deployment without turning a small creative site into an over-engineered application.

---

## Why This Matters (Senior Perspective)

A Next.js portfolio can appear correct in local development and still fail in the situations that matter most: a project URL returns a 404 after deployment, a page that should be shareable has duplicate or missing metadata, a client component pulls a large dependency into every route, a server component tries to access `window`, or a static export is configured even though the site relies on server-only behavior. These are architectural failures. They usually come from unclear boundaries between routing, rendering, data, assets, and deployment—not from a single bad CSS rule.

Creative portfolios have unusually high expectations for both presentation and resilience. Visitors arrive from search results, social previews, recruiter messages, QR codes, and direct links to individual projects. A beautiful homepage does not compensate for project detail pages that fail on refresh, inaccessible navigation, or images that load only when the user enters through the homepage. Each route must work as an independent entry point. The architecture must also let the owner add a case study without copying a page and forgetting to update its title, image, or canonical URL.

The App Router changes how teams reason about a Next.js application. Layouts and pages are Server Components by default; client-side state and browser APIs belong behind explicit Client Component boundaries. This distinction affects bundle size, data access, caching, hydration, and where errors occur. Treating every file as a client component removes many benefits of the framework and can quietly increase JavaScript shipped to mobile visitors. Conversely, forcing interactivity into a Server Component creates build-time errors or runtime failures. Good architecture makes these boundaries visible and keeps the server/client split purposeful.

This skill establishes a route-first structure, typed project content, reusable presentation components, correct metadata, image handling, loading and error states, accessibility checks, and deployment verification. Examples use the current App Router conventions and ordinary JavaScript/TypeScript APIs rather than invented configuration keys. Adapt the details to the installed Next.js version; framework defaults and caching semantics can change between major releases, so confirm version-specific behavior before relying on it.

## Core Concepts


### 1. Choose App Router deliberately

The App Router organizes routes through folders and special files such as `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, and `not-found.tsx`. A folder is not a route until it contains a route-defining file. This gives a portfolio a discoverable map: the homepage, work index, project detail pages, and about/contact pages can share a shell while keeping route-specific concerns local. Avoid mixing the Pages Router and App Router without a migration reason; their data-fetching and routing conventions differ.

```tsx
app/
├── layout.tsx
├── page.tsx
├── work/
│   ├── page.tsx
│   └── [slug]/
│       └── page.tsx
├── about/page.tsx
└── contact/page.tsx
```

**Gotcha:** Do not validate this decision only through a successful homepage render. Test the route, asset, or rendering condition that exercises the boundary directly. For portfolio work, the failure often appears on a deep link, during a production build, or when the browser loads the page without prior navigation.


### 2. Keep the root layout stable

The root layout owns the document shell, global styles, font setup, and shared metadata defaults. It should be stable and relatively small. Route-specific content belongs in pages or nested layouts. Do not place page-specific title strings in a shared layout if every project needs its own title. The root layout must render `html` and `body`; nested layouts should render shared route structure without repeating those document elements.

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Studio Portfolio", template: "%s | Studio Portfolio" },
  description: "Selected digital design and development work.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

**Gotcha:** Do not validate this decision only through a successful homepage render. Test the route, asset, or rendering condition that exercises the boundary directly. For portfolio work, the failure often appears on a deep link, during a production build, or when the browser loads the page without prior navigation.


### 3. Model projects as content, not duplicated pages

A portfolio typically has repeated project structure: title, slug, summary, role, year, cover image, outcomes, and case-study sections. Keep those fields in a typed data source or content layer, then render one route template. This prevents inconsistent markup and makes adding work an editorial operation rather than a component-copying exercise. Validate slugs and required fields early. If the content grows into MDX or a CMS, preserve the same content contract.

```ts
export type Project = {
  slug: string;
  title: string;
  summary: string;
  year: number;
  role: string;
  cover: string;
  featured: boolean;
};

export const projects: Project[] = [
  { slug: "field-notes", title: "Field Notes", summary: "A research-led editorial experience.", year: 2026, role: "Design and development", cover: "/images/field-notes.webp", featured: true },
];
```

**Gotcha:** Do not validate this decision only through a successful homepage render. Test the route, asset, or rendering condition that exercises the boundary directly. For portfolio work, the failure often appears on a deep link, during a production build, or when the browser loads the page without prior navigation.


### 4. Use dynamic route segments with explicit not-found behavior

A route such as `app/work/[slug]/page.tsx` maps each slug to a project. Resolve the slug against the content source and call `notFound()` when no project matches. Without this check, missing content can cause a crash, an empty shell, or an incorrect fallback page. A missing slug is a normal public-web condition: people mistype URLs, old links survive, and search engines revisit removed pages.

```ts
import { notFound } from "next/navigation";
import { projects } from "@/data/projects";

type Props = { params: Promise<{ slug: string }> };

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);
  if (!project) notFound();
  return <article><h1>{project.title}</h1><p>{project.summary}</p></article>;
}
```

**Gotcha:** Do not validate this decision only through a successful homepage render. Test the route, asset, or rendering condition that exercises the boundary directly. For portfolio work, the failure often appears on a deep link, during a production build, or when the browser loads the page without prior navigation.


### 5. Keep Server Components as the default

Server Components can read server-side data and render markup without shipping their component implementation as browser JavaScript. Use them for route composition, project content, metadata decisions, and static presentation. They cannot use browser-only APIs, state hooks, or event handlers. When interactivity is needed, isolate it in a small Client Component and pass serializable props across the boundary. Do not add `"use client"` to the root layout simply to make one menu interactive.

```tsx
// app/work/page.tsx — Server Component by default
import { projects } from "@/data/projects";
import { ProjectCard } from "@/components/project-card";

export default function WorkPage() {
  return <main><h1>Selected work</h1><ul>{projects.map((project) => (
    <li key={project.slug}><ProjectCard project={project} /></li>
  ))}</ul></main>;
}
```

**Gotcha:** Do not validate this decision only through a successful homepage render. Test the route, asset, or rendering condition that exercises the boundary directly. For portfolio work, the failure often appears on a deep link, during a production build, or when the browser loads the page without prior navigation.


### 6. Create narrow Client Component boundaries

A menu toggle, filter, carousel, or animated cursor may need client-side state. Put that behavior in a component marked with `"use client"`, and keep its imported dependency graph as small as possible. Anything imported by a Client Component can become part of the client bundle. A single client boundary around the whole application can turn a mostly static portfolio into a JavaScript-heavy site. Make boundaries align with actual browser interaction, not visual design sections.

```ts
"use client";
import { useState } from "react";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((value) => !value)}>
        {open ? "Close menu" : "Open menu"}
      </button>
      <nav id="mobile-nav" hidden={!open}><a href="/work">Work</a><a href="/about">About</a></nav>
    </div>
  );
}
```

**Gotcha:** Do not validate this decision only through a successful homepage render. Test the route, asset, or rendering condition that exercises the boundary directly. For portfolio work, the failure often appears on a deep link, during a production build, or when the browser loads the page without prior navigation.


### 7. Separate content, presentation, and route orchestration

Route files should orchestrate data lookup and compose page sections. Components should focus on a coherent presentation responsibility. Content data should not import UI components, and low-level UI primitives should not know a project slug or a business rule. This separation makes visual changes safer and allows the content source to evolve without rewriting every page. Keep abstractions proportional: a one-off section does not automatically need a generic rendering framework.

```tsx
// components/project-card.tsx
import type { Project } from "@/data/projects";

export function ProjectCard({ project }: { project: Project }) {
  return <article><a href={`/work/${project.slug}`}><h2>{project.title}</h2><p>{project.summary}</p></a></article>;
}
```

**Gotcha:** Do not validate this decision only through a successful homepage render. Test the route, asset, or rendering condition that exercises the boundary directly. For portfolio work, the failure often appears on a deep link, during a production build, or when the browser loads the page without prior navigation.


### 8. Use metadata as route data

Search previews and social sharing depend on accurate title, description, canonical URL, and Open Graph imagery. Use the Metadata API rather than manually inserting duplicate tags in page markup. Static routes can export a metadata object; dynamic routes can export `generateMetadata` after resolving their project data. A missing project should not accidentally inherit another project's title or preview image. Ensure the base URL is configured from a trusted deployment value.

```ts
import type { Metadata } from "next";
import { projects } from "@/data/projects";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);
  if (!project) return { title: "Project not found" };
  return { title: project.title, description: project.summary, openGraph: { title: project.title, description: project.summary, images: [project.cover] } };
}
```

**Gotcha:** Do not validate this decision only through a successful homepage render. Test the route, asset, or rendering condition that exercises the boundary directly. For portfolio work, the failure often appears on a deep link, during a production build, or when the browser loads the page without prior navigation.


### 9. Use next/image with a deliberate asset strategy

The Image component provides image optimization features, responsive sizing, and layout hints, but it is not a substitute for selecting appropriate source assets. Use `width` and `height` for intrinsic dimensions or `fill` inside a positioned container with a meaningful `sizes` value. Remote images require allowed host configuration. For a local portfolio, local static assets are often simpler and more reliable than arbitrary third-party URLs. Use descriptive alt text for meaningful images and empty alt text for decorative imagery.

```ts
import Image from "next/image";

export function ProjectCover() {
  return <div className="cover">
    <Image src="/images/field-notes.webp" alt="Field Notes editorial interface displayed on a laptop" width={1600} height={1000} sizes="(max-width: 700px) 100vw, 70vw" priority />
  </div>;
}
```

**Gotcha:** Do not validate this decision only through a successful homepage render. Test the route, asset, or rendering condition that exercises the boundary directly. For portfolio work, the failure often appears on a deep link, during a production build, or when the browser loads the page without prior navigation.


### 10. Treat loading, errors, and missing routes as designed states

A robust portfolio has a plan for slow data, a failed segment, a missing project, and a broken remote asset. `loading.tsx` provides a route-level loading UI where streaming or asynchronous work exists; `error.tsx` is a Client Component error boundary and must offer recovery appropriate to the failure. `not-found.tsx` handles intentional missing-route behavior. Do not show a spinner forever or expose raw exception messages to visitors.

```tsx
// app/work/[slug]/not-found.tsx
import Link from "next/link";

export default function ProjectNotFound() {
  return <main><h1>Project not found</h1><p>This case study may have moved.</p><Link href="/work">Browse all work</Link></main>;
}
```

**Gotcha:** Do not validate this decision only through a successful homepage render. Test the route, asset, or rendering condition that exercises the boundary directly. For portfolio work, the failure often appears on a deep link, during a production build, or when the browser loads the page without prior navigation.


### 11. Choose static, dynamic, and cached behavior consciously

A portfolio with content committed at build time can often render project pages statically, giving fast responses and fewer runtime dependencies. Pages that depend on per-request data, authentication, or fresh remote information may need dynamic rendering. Cache defaults vary across Next.js versions and data-fetching patterns; do not assume a request is cached merely because it appears server-side. State the freshness requirement first, then select and test the rendering strategy.

```ts
// For a build-time content source, static params can enumerate known slugs.
import { projects } from "@/data/projects";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

// Pair this with a not-found policy and verify output using the installed Next.js version.
```

**Gotcha:** Do not validate this decision only through a successful homepage render. Test the route, asset, or rendering condition that exercises the boundary directly. For portfolio work, the failure often appears on a deep link, during a production build, or when the browser loads the page without prior navigation.


### 12. Deploy according to the features the app actually uses

A Next.js application is not automatically equivalent to a folder of static HTML. Server rendering, route handlers, image optimization, middleware/proxy behavior, and runtime data access affect deployment choices. A static export can be appropriate for a content-only portfolio, but it cannot support every server feature. Choose the target host and output mode before depending on capabilities, and test direct requests to nested routes. Development mode does not reproduce the complete production runtime.

```ts
// next.config.ts — valid basic configuration for a static export when appropriate
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
};

export default nextConfig;
```

**Gotcha:** Do not validate this decision only through a successful homepage render. Test the route, asset, or rendering condition that exercises the boundary directly. For portfolio work, the failure often appears on a deep link, during a production build, or when the browser loads the page without prior navigation.


### 13. Validate the architecture with production-like checks

A green development server proves only that the current code can run under the dev toolchain. Run linting and a production build, inspect warnings, and serve or deploy the resulting output in the target environment. Check a direct deep link, refresh a project route, open the page with JavaScript disabled where feasible, and test mobile layout. A portfolio is finished when it works from an external entry point, not only after navigating from the homepage.

```text
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint ."
  }
}

// Run the scripts supported by the project's installed versions and package manager.
```

**Gotcha:** Do not validate this decision only through a successful homepage render. Test the route, asset, or rendering condition that exercises the boundary directly. For portfolio work, the failure often appears on a deep link, during a production build, or when the browser loads the page without prior navigation.


## Named Architecture Patterns


### Pattern: Route-first file tree

What it does: gives every URL a predictable owner and keeps route-specific files close to their page. When to use: use it for portfolios with a home page, work index, dynamic case studies, and a few editorial pages.

```tsx
app/
├── layout.tsx
├── page.tsx
├── work/page.tsx
├── work/[slug]/page.tsx
├── work/[slug]/loading.tsx
├── work/[slug]/not-found.tsx
├── about/page.tsx
└── globals.css
```

Operational check: verify the pattern in a fresh browser session and in a production build. Confirm that it handles missing content and does not depend on prior client navigation. Document the reason for the pattern in the repository so a future change does not remove it as apparently unnecessary complexity.

### Pattern: Typed content registry

What it does: defines one validated contract for project cards, detail pages, and metadata. When to use: use it when projects share a predictable schema and content is stored in TypeScript, JSON, or a CMS adapter.

```tsx
export type Project = { slug: string; title: string; summary: string; cover: string; year: number; role: string };
export const projects: Project[] = [
  { slug: "field-notes", title: "Field Notes", summary: "Editorial design system", cover: "/images/field-notes.webp", year: 2026, role: "Design and development" }
];
```

Operational check: verify the pattern in a fresh browser session and in a production build. Confirm that it handles missing content and does not depend on prior client navigation. Document the reason for the pattern in the repository so a future change does not remove it as apparently unnecessary complexity.

### Pattern: Server shell with interactive islands

What it does: leaves the document, route composition, and static sections on the server while moving only controls that require browser state into client components. When to use: use it for menus, filters, theme switches, and small carousels.

```tsx
// Server Component
import { MobileMenu } from "@/components/mobile-menu";
export default function Header() { return <header><a href="/">Studio</a><MobileMenu /></header>; }

// MobileMenu owns its own "use client" directive and state.
```

Operational check: verify the pattern in a fresh browser session and in a production build. Confirm that it handles missing content and does not depend on prior client navigation. Document the reason for the pattern in the repository so a future change does not remove it as apparently unnecessary complexity.

### Pattern: Metadata from the content source

What it does: keeps page title, description, and social image aligned with the displayed project. When to use: use it for every dynamic project route and any page shared through social or professional channels.

```tsx
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projects.find((entry) => entry.slug === slug);
  return project ? { title: project.title, description: project.summary } : { title: "Project not found" };
}
```

Operational check: verify the pattern in a fresh browser session and in a production build. Confirm that it handles missing content and does not depend on prior client navigation. Document the reason for the pattern in the repository so a future change does not remove it as apparently unnecessary complexity.

### Pattern: Asset manifest with stable paths

What it does: centralizes asset references so a content record cannot silently point to an unknown file. When to use: use it when a project includes several responsive screenshots, videos, and cover images.

```tsx
export const projectAssets = {
  fieldNotesCover: "/images/field-notes-cover.webp",
  fieldNotesMobile: "/images/field-notes-mobile.webp",
} as const;
```

Operational check: verify the pattern in a fresh browser session and in a production build. Confirm that it handles missing content and does not depend on prior client navigation. Document the reason for the pattern in the repository so a future change does not remove it as apparently unnecessary complexity.

### Pattern: Production gate in CI

What it does: blocks delivery when lint or build fails before the hosting platform publishes the site. When to use: use it for team projects and any portfolio that is regularly updated.

```tsx
# Example shell sequence in a CI job
npm ci
npm run lint
npm run build
```

Operational check: verify the pattern in a fresh browser session and in a production build. Confirm that it handles missing content and does not depend on prior client navigation. Document the reason for the pattern in the repository so a future change does not remove it as apparently unnecessary complexity.

### Pattern: Explicit not-found recovery

What it does: turns an invalid slug into a clear recovery route instead of an empty page or accidental server error. When to use: use it whenever URLs are derived from user-visible content or can become stale.

```tsx
import { notFound } from "next/navigation";
const project = projects.find((item) => item.slug === slug);
if (!project) notFound();
```

Operational check: verify the pattern in a fresh browser session and in a production build. Confirm that it handles missing content and does not depend on prior client navigation. Document the reason for the pattern in the repository so a future change does not remove it as apparently unnecessary complexity.


## Common Mistakes and Specific Fixes

| Mistake | Why it fails | Fix |
|---|---|---|
| A. Marking the root layout as client-side for one menu | It broadens the client dependency graph and can prevent server-only imports from being used safely. | Move stateful behavior into a dedicated `MobileMenu` client component and keep the root layout server-rendered. |
| B. Duplicating a page for every case study | Copies drift in spacing, metadata, and accessibility fixes. | Store case-study fields in a typed registry and render them through one dynamic route template. |
| C. Returning an empty element for an unknown slug | Visitors receive a blank page and monitoring cannot distinguish missing content from success. | Call `notFound()` when lookup fails and provide a route-level `not-found.tsx`. |
| D. Using `window` during server rendering | The server has no browser global, so rendering throws before the page is delivered. | Read browser APIs inside a Client Component effect or event handler with appropriate feature detection. |
| E. Importing a large animation library at the root | Every route can inherit avoidable client JavaScript. | Load animation code only in the interactive component that needs it and measure the resulting bundle. |
| F. Hard-coding one title in the root metadata | Every project may share the same search and social preview text. | Use the metadata template for defaults and `generateMetadata` for project-specific values. |
| G. Using arbitrary remote image URLs | Remote hosts may be blocked or optimization may reject unconfigured hosts. | Prefer local assets or explicitly configure the exact trusted remote image pattern. |
| H. Omitting `sizes` from a fill image | The browser may download an image larger than the rendered slot needs. | Add a `sizes` expression that reflects the actual responsive layout widths. |
| I. Using empty alt text for meaningful project screenshots | Screen-reader users lose information carried by the image. | Write concise alt text describing the relevant visual or interface state. |
| J. Using verbose alt text for purely decorative shapes | Assistive technology announces noise that does not add meaning. | Use `alt=""` for decorative images and ensure surrounding content carries the message. |
| K. Treating dev success as deployment proof | Production bundling, route hosting, environment values, and asset paths can differ. | Run the production build and test the deployed URL directly, including nested route refreshes. |
| L. Enabling static export without checking server features | Server-only routes or runtime behavior may not exist in exported output. | Audit route handlers, runtime data needs, image optimization, and hosting requirements before enabling `output: "export"`. |
| M. Using an untrusted environment variable as a public base URL | A typo can generate invalid canonical links or broken previews. | Validate the deployment URL in the build environment and provide a safe fallback for local development. |
| N. Forgetting stable React keys in project lists | React can reuse the wrong list item state after filtering or reordering. | Use each project's unique `slug` as the list key rather than its array index. |
| O. Building navigation only from click handlers | Keyboard users and direct navigation lose normal link semantics. | Use real links for route changes and buttons only for actions that change local state. |
| P. Hiding a menu visually but leaving it keyboard reachable | Focus can move into controls users cannot see. | Use a state-driven hidden strategy that removes closed content from interaction and verify tab order. |
| Q. Showing a generic spinner for all failures | Permanent errors appear to be slow loading and offer no recovery. | Separate loading, error, and not-found states and give each an appropriate retry or navigation action. |
| R. Assuming cache behavior from memory | Framework defaults and APIs differ across Next.js versions. | Check the installed version's documentation and verify freshness by changing source data in a controlled test. |
| S. Adding a dependency for a trivial interaction | Dependency weight and upgrade surface exceed the feature's value. | Implement the small interaction with platform APIs unless measured requirements justify a library. |
| T. Publishing without checking direct project links | Internal navigation may work while hosting rewrites or static output omit the deep route. | Open a project URL in a fresh tab, refresh it, and test the exact production host's routing behavior. |
| U. Putting content-specific rules in a generic card | The component becomes coupled to a particular slug or project. | Pass explicit display props and keep project-specific logic in the route or content adapter. |
| V. Failing to test keyboard focus after animation | Motion can obscure focus or leave focus on a hidden element. | Test menu open/close, reduced-motion behavior, and focus restoration using only the keyboard. |


## Mental Models

1. **A route folder is a URL contract.** Treat each public URL as an independently testable entry point, not merely a screen reached from the homepage.
2. **Server Components are the default delivery format.** Add client-side execution only when browser interaction or state actually requires it.
3. **A client boundary is a bundle boundary.** The imports reachable from a Client Component can affect shipped JavaScript, so place that boundary with care.
4. **Content is a contract, not incidental markup.** Typed fields and validation keep card layouts, detail pages, and metadata in agreement.
5. **Metadata is part of the page's interface.** Search previews and social cards are user-facing representations of the same content.
6. **A missing slug is an expected input.** Invalid links should have an intentional not-found outcome rather than crashing or returning blank markup.
7. **Build output is a separate product artifact.** Development mode is a tool for iteration; production output must be tested in the form that will actually ship.
8. **Performance is architectural before it is micro-optimization.** Avoiding unnecessary client bundles and oversized images often matters more than tuning tiny render details.
9. **The host is part of the system.** Static export, server rendering, image optimization, and route refresh behavior must match the target platform.
10. **Accessibility is behavior, not a final polish pass.** Real links, focus order, meaningful image alternatives, and reduced-motion support should shape components from the start.

## Build Challenge: A Production-Ready Creative Portfolio

Build a small portfolio with a homepage, work index, dynamic case-study pages, about page, and contact link. The goal is not merely to make the design render; it is to prove that route structure, content, rendering boundaries, metadata, assets, and production behavior agree.

Requirements:
1. Create an App Router project with a root layout and a clear `app/` route tree.
2. Define at least four projects using a shared typed content schema containing slug, title, summary, year, role, and cover image.
3. Render the work index from the content source rather than hard-coding each card separately.
4. Implement `app/work/[slug]/page.tsx` and resolve the slug through a single lookup function.
5. Make an unknown slug call `notFound()` and provide a useful not-found UI linking back to the work index.
6. Keep the route and root layout as Server Components unless there is a concrete browser-interaction need.
7. Implement one small Client Component for mobile navigation or project filtering; ensure its closed state is keyboard-safe.
8. Generate page-specific metadata from project content, and use a title template for shared defaults.
9. Render local cover assets with `next/image`, meaningful dimensions or a positioned fill container, and responsive sizing.
10. Give every meaningful image useful alternative text and every decorative image empty alternative text.
11. Add a loading state if the route performs asynchronous work, and a client error boundary if a segment can throw at runtime.
12. Choose a deployment mode after listing the features the site uses; do not enable static export without checking compatibility.
13. Run the project's lint command and production build using the package manager lockfile already committed.
14. Test a case-study URL by opening it directly in a fresh browser tab, refreshing, and navigating back to the index.
15. **Failure injection:** temporarily request a slug that does not exist and verify the designed not-found UI appears without a stack trace or blank page.
16. **Failure injection:** temporarily rename one cover image and confirm the failure is noticed during review/build or the fallback is intentional; restore the asset afterward.
17. Inspect the production output or deployed version for console errors, missing assets, and unexpected client-side JavaScript.
18. Test keyboard navigation, focus visibility, reduced-motion preferences for any nonessential animation, and a narrow mobile viewport.
19. Confirm the deployed canonical/base URL and social preview image are correct for the actual host.
20. Write a short README explaining install, development, lint, build, preview/start, content editing, and deployment assumptions.

## Quick Reference

| Concern | Recommended default | Verify |
|---|---|---|
| Routing | App Router folders with special files | Direct-load each public route |
| Shared shell | Root `app/layout.tsx` | Exactly one `html` and `body` |
| Project content | Typed data registry or CMS adapter | Required fields and unique slugs |
| Dynamic route | `app/work/[slug]/page.tsx` | Valid and invalid slug behavior |
| Missing content | `notFound()` plus `not-found.tsx` | No blank output or leaked stack trace |
| Rendering | Server Components by default | No browser globals in server modules |
| Interactivity | Small `"use client"` islands | Inspect dependency imports and bundle |
| Metadata | Metadata API | Unique title, description, and social image |
| Images | `next/image` with dimensions or `fill` | Correct sizing and allowed remote host if used |
| Navigation | `next/link` for internal routes | Keyboard access and refresh behavior |
| Loading | `loading.tsx` where useful | Slow-path experience is understandable |
| Runtime error | `error.tsx` for relevant segments | Recovery action and safe messaging |
| Static generation | `generateStaticParams` where suitable | Generated paths match content slugs |
| Static export | `output: "export"` only when compatible | Server-only feature audit |
| Environment | Validate public URL values | No secrets exposed in public variables |
| Production check | Lint and `next build` | Warnings reviewed, not ignored blindly |
| Deployment | Match host to rendering strategy | Deep-link refresh and asset paths |
| Accessibility | Semantic links, labels, alt text, focus | Keyboard-only walkthrough |
| Performance | Limit client code and image bytes | Real-device or field data where available |
| Documentation | README with exact project commands | Fresh clone can run without hidden steps |

## Definition of Done / Success Criteria

- [ ] Every intended route has a clear owner in the App Router tree and works when loaded directly.
- [ ] Project cards and detail pages are rendered from one validated content source; slugs are unique.
- [ ] Unknown slugs produce a designed not-found response and a route back to useful content.
- [ ] Server/client boundaries are deliberate; browser APIs and hooks appear only in Client Components.
- [ ] Metadata is accurate per route, and canonical/social URLs match the target deployment.
- [ ] Images have appropriate alternatives, sizing, and trusted sources; no broken production assets remain.
- [ ] The production build succeeds with the installed toolchain, and relevant lint/build warnings are resolved or documented.
- [ ] A project URL survives direct entry and refresh on the actual deployment target.
- [ ] Keyboard navigation and focus are usable, and motion respects the reduced-motion preference when applicable.
- [ ] The README enables another developer to install, run, build, and deploy the project without undocumented knowledge.

## Troubleshooting Checklist

When a route fails, check the URL-to-folder mapping first, then inspect the special file name, parameter shape, and slug lookup. When an unknown slug crashes, confirm the lookup has a deliberate failure branch before rendering fields. When a server/client error mentions `window`, `document`, or a hook, identify which module imports the browser-only code and move the smallest possible boundary to a Client Component. When a page renders locally but fails on the host, compare the actual deployment mode with the app's use of server rendering, route handlers, and image optimization.

When metadata is wrong, verify which route exports metadata and whether a dynamic `generateMetadata` function reads the same content record as the page. When an image fails, check the file path, casing, source host allowlist, intrinsic dimensions, and whether the target host supports the optimization path. When a build becomes slow or output grows, inspect imports from client entry points before adding more caching or splitting logic. When navigation works only after entering from the homepage, open the failing URL in a new session and inspect the hosting platform's fallback/rewrite behavior.

**Gotcha:** A successful `next build` does not prove that every runtime route or external integration works on the selected host. Build validation and deployment smoke tests are complementary.

**Gotcha:** Next.js behavior evolves across major versions. If a sample's parameter type or caching semantics differ from the installed version, follow that version's documented API rather than forcing an outdated snippet into the project.

**Gotcha:** Static export is a deployment decision, not a performance checkbox. It must be compatible with the routes, data freshness, image handling, and server capabilities the portfolio actually needs.

**Gotcha:** A page can be visually correct and still be inaccessible when the menu is open, the keyboard focus is hidden, or a project image's text alternative is missing. Include interaction checks in acceptance testing.

## Operational Handoff

Keep the README aligned with the actual package scripts and deployment target. Explain where project content lives, how a new slug is added, where cover images are stored, and how the app decides between static and dynamic behavior. Avoid documenting commands that do not exist in `package.json`. Commit the lockfile and use the package manager that created it for reproducible CI installation. Never commit private API keys. Variables prefixed for browser exposure must be considered public; do not put credentials in them.

Before handing the portfolio to a client or recruiter, test it as an outside visitor: open the homepage, enter a case study directly, refresh, use the browser back button, follow the contact link, and share the URL in a context that displays metadata. Check the production host rather than assuming local preview is identical. Record any known limitation, especially if static export excludes a feature or if content changes require a rebuild. A small, documented architecture is more valuable than a clever one that only its original author can safely modify.
