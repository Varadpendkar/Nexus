# SKILL: server-side-rendering
**Layer:** 18 — Backend Development
**Goal:** Design and ship Next.js pages that render the right content at the right time with secure data access, intentional caching, accessible HTML, and predictable production behavior.

---

## Why This Matters (Senior Perspective)

Server-side rendering is not simply “HTML generated on a server.” It is a set of choices about when data is read, who is allowed to see it, how long a representation remains valid, and what a visitor experiences while work is pending or failing. A poorly chosen cache policy can show one customer's account details to another visitor. A static page for inventory can advertise a product that has sold out. A client-only page can flash empty content, hurt search previews, or remain unusable on a slow connection. A server-rendered page can still be slow if it performs sequential network requests, blocks on an unreliable dependency, or repeats the same database work for metadata and page content.

A beginner often asks, “Should I use SSR or CSR?” and treats the answer as a framework preference. A senior asks what the data's freshness requirement is, whether it is public or personalized, how expensive it is to compute, which parts can stream independently, and what happens when a dependency times out. They distinguish React Server Components from the older Pages Router model, understand that hydration requires compatible initial output, and treat cache boundaries as correctness boundaries. They measure time to first byte, largest contentful paint, JavaScript shipped to the browser, backend load, and failure rates rather than optimizing a single benchmark.

These choices matter in real creative and freelance work. A portfolio's public case studies may be cached aggressively, while its client portal must remain private. A commerce landing page needs rich metadata and quick first paint, but price and stock may need fresher data than the editorial copy. A booking page cannot let stale availability become a false promise. If a client sees a blank page on mobile, a wrong social preview, or another customer's data, “it works on my laptop” is not an acceptable defense. Strong SSR engineering makes the experience fast without making it stale, secure without making it slow, and accessible before client-side JavaScript finishes loading.

---

## Core Concepts
### 1. SSR, SSG, ISR, and CSR are different execution contracts

**Mental model:** Choose rendering from data freshness, personalization, and latency—not from a framework trend. Server rendering creates HTML for a request; static generation creates HTML ahead of time; revalidation refreshes a previously generated result; client rendering fills in data after JavaScript runs.

**Scenario:** A public article can be cached and rendered statically, while a private account page needs request-specific authorization. Mixing these contracts causes stale prices, leaked user-specific markup, or a page that appears blank until hydration.

**Example file:** `app/articles/[slug]/page.tsx`

```tsx
import { notFound } from 'next/navigation';

type Article = { title: string; body: string; published: boolean };

async function getArticle(slug: string): Promise<Article | null> {
  const response = await fetch(`${process.env.CONTENT_API_URL}/articles/${slug}`, {
    next: { revalidate: 300 },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Article service unavailable');
  return response.json();
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article || !article.published) notFound();
  return <main><article><h1>{article.title}</h1><p>{article.body}</p></article></main>;
}
```

**What the example demonstrates:** The route makes its rendering and data behavior explicit. Types communicate the expected shape, errors are handled intentionally, and the output uses meaningful structure rather than relying on client JavaScript for essential content.

**Naive approach — wrong:**

```tsx
// Fragile: every request is treated the same, errors disappear,
// and private/public data boundaries are not considered.
export default function Page() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/data').then(r => r.json()).then(setData); }, []);
  return <div>{JSON.stringify(data)}</div>;
}
```

**Correct approach:** A marketing page can be static; an account balance cannot be shared across visitors.

```tsx
// Keep the initial content on the server when it is public or safely
// authorized there; use a client boundary only for actual interaction.
export default async function Page() {
  const data = await loadPageData();
  return <main><article><h1>{data.title}</h1><p>{data.summary}</p></article></main>;
}

async function loadPageData() {
  return { title: 'Project overview', summary: 'A server-rendered summary.' };
}
```

**Gotcha:** Do not choose static generation for content whose correctness depends on the current user's identity or a live inventory value.

**Review question:** What data is safe to share between requests, what must be resolved per request, and what should the visitor see if this dependency fails?

---
### 2. App Router server components are the default

**Mental model:** In the App Router, pages and layouts are Server Components unless marked otherwise. They can await server-side data directly and keep database credentials out of browser bundles.

**Scenario:** Keep the page shell and data orchestration on the server. Add Client Components only for interactions that require state, effects, event handlers, or browser-only APIs.

**Example file:** `app/catalog/page.tsx`

```tsx
type Product = { id: string; name: string; price: number };

async function listProducts(): Promise<Product[]> {
  const response = await fetch(`${process.env.CATALOG_API_URL}/products`, {
    next: { revalidate: 60 },
  });
  if (!response.ok) throw new Error('Could not load catalog');
  return response.json();
}

export default async function CatalogPage() {
  const products = await listProducts();
  return <main><h1>Catalog</h1><ul>{products.map((product) => <li key={product.id}>{product.name}: ₹{product.price}</li>)}</ul></main>;
}
```

**What the example demonstrates:** The route makes its rendering and data behavior explicit. Types communicate the expected shape, errors are handled intentionally, and the output uses meaningful structure rather than relying on client JavaScript for essential content.

**Naive approach — wrong:**

```tsx
// Fragile: every request is treated the same, errors disappear,
// and private/public data boundaries are not considered.
export default function Page() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/data').then(r => r.json()).then(setData); }, []);
  return <div>{JSON.stringify(data)}</div>;
}
```

**Correct approach:** Server Components reduce client JavaScript; they do not make slow backend calls magically fast.

```tsx
// Keep the initial content on the server when it is public or safely
// authorized there; use a client boundary only for actual interaction.
export default async function Page() {
  const data = await loadPageData();
  return <main><article><h1>{data.title}</h1><p>{data.summary}</p></article></main>;
}

async function loadPageData() {
  return { title: 'Project overview', summary: 'A server-rendered summary.' };
}
```

**Gotcha:** A Server Component cannot use useState, useEffect, or browser globals. Move only the interactive leaf into a client file instead of marking the whole route client-side.

**Review question:** What data is safe to share between requests, what must be resolved per request, and what should the visitor see if this dependency fails?

---
### 3. Client boundaries and hydration

**Mental model:** The `use client` directive marks a module boundary: that component and its imported client-side dependency graph become part of the client bundle. Hydration attaches behavior to server-rendered HTML.

**Scenario:** Keep the interactive boundary small. Render content and data on the server, then pass serializable props to a focused component such as a filter, menu, or favorite button.

**Example file:** `app/catalog/favorite-button.tsx`

```tsx
'use client';

import { useState } from 'react';

export function FavoriteButton({ productId, initiallySaved }: { productId: string; initiallySaved: boolean }) {
  const [saved, setSaved] = useState(initiallySaved);
  return <button type="button" aria-pressed={saved} onClick={() => setSaved((value) => !value)}>
    {saved ? 'Remove favorite' : 'Add favorite'} ({productId})
  </button>;
}
```

**What the example demonstrates:** The route makes its rendering and data behavior explicit. Types communicate the expected shape, errors are handled intentionally, and the output uses meaningful structure rather than relying on client JavaScript for essential content.

**Naive approach — wrong:**

```tsx
// Fragile: every request is treated the same, errors disappear,
// and private/public data boundaries are not considered.
export default function Page() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/data').then(r => r.json()).then(setData); }, []);
  return <div>{JSON.stringify(data)}</div>;
}
```

**Correct approach:** Hydration is a contract: the first client render must agree with the HTML the server sent.

```tsx
// Keep the initial content on the server when it is public or safely
// authorized there; use a client boundary only for actual interaction.
export default async function Page() {
  const data = await loadPageData();
  return <main><article><h1>{data.title}</h1><p>{data.summary}</p></article></main>;
}

async function loadPageData() {
  return { title: 'Project overview', summary: 'A server-rendered summary.' };
}
```

**Gotcha:** Do not pass functions, database objects, class instances, or secrets as Server Component props. Pass plain serializable data and perform privileged mutations on the server.

**Review question:** What data is safe to share between requests, what must be resolved per request, and what should the visitor see if this dependency fails?

---
### 4. Dynamic route params and async request APIs

**Mental model:** Route params identify a resource, but they are not authorization. Current App Router versions expose request-derived APIs such as `params`, `cookies()`, and `headers()` asynchronously; follow the installed Next.js version's types.

**Scenario:** Validate route parameters at the boundary, return a not-found result for invalid or missing resources, and check access independently after resolving the identifier.

**Example file:** `app/products/[productId]/page.tsx`

```tsx
import { notFound } from 'next/navigation';

export default async function ProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  if (!/^[a-z0-9-]{3,50}$/i.test(productId)) notFound();
  const product = await getProductById(productId);
  if (!product) notFound();
  return <main><h1>{product.name}</h1><p>{product.description}</p></main>;
}

async function getProductById(id: string): Promise<{ name: string; description: string } | null> {
  const response = await fetch(`${process.env.CATALOG_API_URL}/products/${encodeURIComponent(id)}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Product lookup failed');
  return response.json();
}
```

**What the example demonstrates:** The route makes its rendering and data behavior explicit. Types communicate the expected shape, errors are handled intentionally, and the output uses meaningful structure rather than relying on client JavaScript for essential content.

**Naive approach — wrong:**

```tsx
// Fragile: every request is treated the same, errors disappear,
// and private/public data boundaries are not considered.
export default function Page() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/data').then(r => r.json()).then(setData); }, []);
  return <div>{JSON.stringify(data)}</div>;
}
```

**Correct approach:** An identifier answers 'which record?'; an authorization check answers 'may this visitor see it?'

```tsx
// Keep the initial content on the server when it is public or safely
// authorized there; use a client boundary only for actual interaction.
export default async function Page() {
  const data = await loadPageData();
  return <main><article><h1>{data.title}</h1><p>{data.summary}</p></article></main>;
}

async function loadPageData() {
  return { title: 'Project overview', summary: 'A server-rendered summary.' };
}
```

**Gotcha:** Do not copy older synchronous `params` examples blindly into a newer Next.js app. Let TypeScript and the installed version's documentation determine the signature.

**Review question:** What data is safe to share between requests, what must be resolved per request, and what should the visitor see if this dependency fails?

---
### 5. Cache policy is part of correctness

**Mental model:** Server fetch caching, route rendering behavior, and HTTP/CDN caching are related but distinct layers. A cache key must include every input that changes the representation, and personalized responses must not be shared between users.

**Scenario:** For public catalog data, select an explicit revalidation interval. For private data, use request-specific authorization and avoid shared caching unless the cache is safely partitioned by identity and policy.

**Example file:** `lib/catalog.ts`

```tsx
export async function getPublicCatalog() {
  const response = await fetch(`${process.env.CATALOG_API_URL}/products`, {
    next: { revalidate: 120, tags: ['catalog'] },
  });
  if (!response.ok) throw new Error('Catalog request failed');
  return response.json() as Promise<Array<{ id: string; name: string }>>;
}

export async function getPrivateProfile(token: string) {
  const response = await fetch(`${process.env.ACCOUNT_API_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Profile request failed');
  return response.json();
}
```

**What the example demonstrates:** The route makes its rendering and data behavior explicit. Types communicate the expected shape, errors are handled intentionally, and the output uses meaningful structure rather than relying on client JavaScript for essential content.

**Naive approach — wrong:**

```tsx
// Fragile: every request is treated the same, errors disappear,
// and private/public data boundaries are not considered.
export default function Page() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/data').then(r => r.json()).then(setData); }, []);
  return <div>{JSON.stringify(data)}</div>;
}
```

**Correct approach:** Freshness is a product requirement: define how stale each field may be.

```tsx
// Keep the initial content on the server when it is public or safely
// authorized there; use a client boundary only for actual interaction.
export default async function Page() {
  const data = await loadPageData();
  return <main><article><h1>{data.title}</h1><p>{data.summary}</p></article></main>;
}

async function loadPageData() {
  return { title: 'Project overview', summary: 'A server-rendered summary.' };
}
```

**Gotcha:** Do not assume a route is safe to cache just because it uses GET. The response may contain a user's address, entitlement, or account state.

**Review question:** What data is safe to share between requests, what must be resolved per request, and what should the visitor see if this dependency fails?

---
### 6. Metadata, canonical URLs, and social previews

**Mental model:** Metadata is part of the rendered document, not a decorative afterthought. Search engines, link unfurlers, and accessibility tooling depend on accurate titles, descriptions, canonical URLs, and image metadata.

**Scenario:** Generate metadata from the same validated resource used by the page. Handle missing records intentionally and avoid building canonical URLs from an untrusted Host header.

**Example file:** `app/articles/[slug]/page.tsx`

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleForMetadata(slug);
  if (!article) return { title: 'Article not found' };
  const canonical = `https://www.example.com/articles/${encodeURIComponent(slug)}`;
  return {
    title: article.title,
    description: article.summary,
    alternates: { canonical },
    openGraph: { title: article.title, description: article.summary, url: canonical, type: 'article' },
  };
}

async function getArticleForMetadata(slug: string): Promise<{ title: string; summary: string } | null> {
  const response = await fetch(`${process.env.CONTENT_API_URL}/articles/${encodeURIComponent(slug)}`, { next: { revalidate: 300 } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Metadata lookup failed');
  return response.json();
}
```

**What the example demonstrates:** The route makes its rendering and data behavior explicit. Types communicate the expected shape, errors are handled intentionally, and the output uses meaningful structure rather than relying on client JavaScript for essential content.

**Naive approach — wrong:**

```tsx
// Fragile: every request is treated the same, errors disappear,
// and private/public data boundaries are not considered.
export default function Page() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/data').then(r => r.json()).then(setData); }, []);
  return <div>{JSON.stringify(data)}</div>;
}
```

**Correct approach:** A page that looks right in a browser can still share the wrong title or preview image in chat.

```tsx
// Keep the initial content on the server when it is public or safely
// authorized there; use a client boundary only for actual interaction.
export default async function Page() {
  const data = await loadPageData();
  return <main><article><h1>{data.title}</h1><p>{data.summary}</p></article></main>;
}

async function loadPageData() {
  return { title: 'Project overview', summary: 'A server-rendered summary.' };
}
```

**Gotcha:** Metadata generation can trigger data work. Reuse compatible cached data access rather than making an unrelated duplicate request on every page view.

**Review question:** What data is safe to share between requests, what must be resolved per request, and what should the visitor see if this dependency fails?

---
### 7. Loading and error states are route design

**Mental model:** Streaming lets a route send useful shell content while slower regions resolve. `loading.tsx`, Suspense boundaries, `error.tsx`, and `not-found.tsx` describe distinct states and should match the user journey.

**Scenario:** Put boundaries around independently slow regions. Keep errors actionable for the user while logging technical details privately; error boundaries must be Client Components when required by Next.js conventions.

**Example file:** `app/dashboard/loading.tsx`

```tsx
export default function DashboardLoading() {
  return <main aria-busy="true" aria-live="polite">
    <h1>Dashboard</h1>
    <p>Loading your latest activity…</p>
  </main>;
}

// app/dashboard/error.tsx
'use client';

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main role="alert">
    <h1>Dashboard unavailable</h1>
    <p>Your data could not be loaded. Try again.</p>
    <button type="button" onClick={() => reset()}>Retry</button>
  </main>;
}
```

**What the example demonstrates:** The route makes its rendering and data behavior explicit. Types communicate the expected shape, errors are handled intentionally, and the output uses meaningful structure rather than relying on client JavaScript for essential content.

**Naive approach — wrong:**

```tsx
// Fragile: every request is treated the same, errors disappear,
// and private/public data boundaries are not considered.
export default function Page() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/data').then(r => r.json()).then(setData); }, []);
  return <div>{JSON.stringify(data)}</div>;
}
```

**Correct approach:** Every asynchronous region needs a loading story and a failure story.

```tsx
// Keep the initial content on the server when it is public or safely
// authorized there; use a client boundary only for actual interaction.
export default async function Page() {
  const data = await loadPageData();
  return <main><article><h1>{data.title}</h1><p>{data.summary}</p></article></main>;
}

async function loadPageData() {
  return { title: 'Project overview', summary: 'A server-rendered summary.' };
}
```

**Gotcha:** Do not show a permanent spinner for an error, or reveal raw stack traces and internal URLs to visitors.

**Review question:** What data is safe to share between requests, what must be resolved per request, and what should the visitor see if this dependency fails?

---
### 8. Mutations belong in actions or route handlers

**Mental model:** A page render should be safe to repeat. Writes belong in Server Actions or Route Handlers with validation, authentication, authorization, and explicit cache invalidation.

**Scenario:** Use Server Actions for UI-driven mutations where appropriate, or a Route Handler for a public HTTP interface, webhooks, and clients outside the React tree. A form submission is untrusted input either way.

**Example file:** `app/actions/update-profile.ts`

```tsx
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';

const profileSchema = z.object({ displayName: z.string().trim().min(2).max(60) });

export async function updateProfile(formData: FormData) {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({ displayName: formData.get('displayName') });
  if (!parsed.success) return { ok: false as const, message: 'Enter a name between 2 and 60 characters.' };
  await saveDisplayName(user.id, parsed.data.displayName);
  revalidatePath('/settings/profile');
  return { ok: true as const };
}

async function saveDisplayName(userId: string, displayName: string) {
  await database.profile.update({ where: { userId }, data: { displayName } });
}
```

**What the example demonstrates:** The route makes its rendering and data behavior explicit. Types communicate the expected shape, errors are handled intentionally, and the output uses meaningful structure rather than relying on client JavaScript for essential content.

**Naive approach — wrong:**

```tsx
// Fragile: every request is treated the same, errors disappear,
// and private/public data boundaries are not considered.
export default function Page() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/data').then(r => r.json()).then(setData); }, []);
  return <div>{JSON.stringify(data)}</div>;
}
```

**Correct approach:** Rendering reads; explicit mutation paths write.

```tsx
// Keep the initial content on the server when it is public or safely
// authorized there; use a client boundary only for actual interaction.
export default async function Page() {
  const data = await loadPageData();
  return <main><article><h1>{data.title}</h1><p>{data.summary}</p></article></main>;
}

async function loadPageData() {
  return { title: 'Project overview', summary: 'A server-rendered summary.' };
}
```

**Gotcha:** A hidden button or a Server Action identifier is not an authorization mechanism. Verify the current user and ownership on every mutation.

**Review question:** What data is safe to share between requests, what must be resolved per request, and what should the visitor see if this dependency fails?

---
### 9. Authentication and authorization must be server-enforced

**Mental model:** A signed-in user is not automatically allowed to read every record. Authentication establishes identity; authorization evaluates permissions for the specific resource and action.

**Scenario:** Resolve the session on the server, scope queries by user or tenant, and avoid fetching broad data before filtering it. Use redirects for browser navigation and API-appropriate status codes for HTTP endpoints.

**Example file:** `lib/projects.ts`

```tsx
export async function getProjectForViewer(projectId: string, viewerId: string) {
  return database.project.findFirst({
    where: { id: projectId, OR: [{ ownerId: viewerId }, { members: { some: { userId: viewerId } } }] },
    select: { id: true, name: true, updatedAt: true },
  });
}

// In a page, the session is resolved on the server before rendering.
// If this query returns null, show not-found rather than leaking whether
// an inaccessible project exists, according to the application's policy.
```

**What the example demonstrates:** The route makes its rendering and data behavior explicit. Types communicate the expected shape, errors are handled intentionally, and the output uses meaningful structure rather than relying on client JavaScript for essential content.

**Naive approach — wrong:**

```tsx
// Fragile: every request is treated the same, errors disappear,
// and private/public data boundaries are not considered.
export default function Page() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/data').then(r => r.json()).then(setData); }, []);
  return <div>{JSON.stringify(data)}</div>;
}
```

**Correct approach:** Authorization should shape the query, not merely hide a button.

```tsx
// Keep the initial content on the server when it is public or safely
// authorized there; use a client boundary only for actual interaction.
export default async function Page() {
  const data = await loadPageData();
  return <main><article><h1>{data.title}</h1><p>{data.summary}</p></article></main>;
}

async function loadPageData() {
  return { title: 'Project overview', summary: 'A server-rendered summary.' };
}
```

**Gotcha:** Never rely solely on middleware redirects: data access helpers and mutation handlers must enforce access too.

**Review question:** What data is safe to share between requests, what must be resolved per request, and what should the visitor see if this dependency fails?

---
### 10. Parallel data fetching and waterfalls

**Mental model:** Independent requests should start together when their results do not depend on one another. Serial awaits add their latencies; excessive parallelism can overload a backend or duplicate expensive work.

**Scenario:** Identify dependencies first. Use `Promise.all` for independent required data, `Promise.allSettled` when partial results are useful, and Suspense for regions that can load independently.

**Example file:** `app/dashboard/page.tsx`

```tsx
export default async function DashboardPage() {
  const [profile, activity, recommendations] = await Promise.all([
    getProfile(),
    getRecentActivity(),
    getRecommendations(),
  ]);
  return <main>
    <h1>Welcome, {profile.displayName}</h1>
    <ActivityList items={activity} />
    <RecommendationList items={recommendations} />
  </main>;
}

async function getProfile() { return { displayName: 'Asha' }; }
async function getRecentActivity() { return [{ id: 'a1', label: 'Published a project' }]; }
async function getRecommendations() { return [{ id: 'r1', label: 'Portfolio review' }]; }
function ActivityList({ items }: { items: Array<{ id: string; label: string }> }) { return <section><h2>Activity</h2><ul>{items.map(x => <li key={x.id}>{x.label}</li>)}</ul></section>; }
function RecommendationList({ items }: { items: Array<{ id: string; label: string }> }) { return <section><h2>Recommended</h2><ul>{items.map(x => <li key={x.id}>{x.label}</li>)}</ul></section>; }
```

**What the example demonstrates:** The route makes its rendering and data behavior explicit. Types communicate the expected shape, errors are handled intentionally, and the output uses meaningful structure rather than relying on client JavaScript for essential content.

**Naive approach — wrong:**

```tsx
// Fragile: every request is treated the same, errors disappear,
// and private/public data boundaries are not considered.
export default function Page() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/data').then(r => r.json()).then(setData); }, []);
  return <div>{JSON.stringify(data)}</div>;
}
```

**Correct approach:** Await dependencies, not unrelated siblings.

```tsx
// Keep the initial content on the server when it is public or safely
// authorized there; use a client boundary only for actual interaction.
export default async function Page() {
  const data = await loadPageData();
  return <main><article><h1>{data.title}</h1><p>{data.summary}</p></article></main>;
}

async function loadPageData() {
  return { title: 'Project overview', summary: 'A server-rendered summary.' };
}
```

**Gotcha:** Parallelize only independent work. If recommendations require the resolved user or profile, express that dependency rather than starting a request with incomplete inputs.

**Review question:** What data is safe to share between requests, what must be resolved per request, and what should the visitor see if this dependency fails?

---
### 11. SEO, semantic HTML, and accessible output

**Mental model:** Server-rendered markup is a chance to deliver meaningful content before JavaScript. Semantic structure helps assistive technology and makes content more robust when scripts fail or are delayed.

**Scenario:** Use landmarks and headings in a logical hierarchy, real links for navigation, buttons for actions, and descriptive text for images. SSR does not excuse inaccessible interaction states.

**Example file:** `app/portfolio/page.tsx`

```tsx
export default async function PortfolioPage() {
  const projects = await getFeaturedProjects();
  return <main>
    <header><h1>Selected projects</h1><p>Case studies from recent client work.</p></header>
    <section aria-labelledby="featured-heading">
      <h2 id="featured-heading">Featured work</h2>
      <div className="project-grid">
        {projects.map((project) => <article key={project.slug}>
          <figure><img src={project.imageUrl} alt={project.imageAlt} /><figcaption>{project.category}</figcaption></figure>
          <h3><a href={`/projects/${project.slug}`}>{project.title}</a></h3>
          <p>{project.summary}</p>
        </article>)}
      </div>
    </section>
  </main>;
}

async function getFeaturedProjects() { return [{ slug: 'care-platform', title: 'Care platform', category: 'Product design', imageUrl: '/images/care-platform.webp', imageAlt: 'Care dashboard showing appointment status', summary: 'A clear workflow for clinic teams.' }]; }
```

**What the example demonstrates:** The route makes its rendering and data behavior explicit. Types communicate the expected shape, errors are handled intentionally, and the output uses meaningful structure rather than relying on client JavaScript for essential content.

**Naive approach — wrong:**

```tsx
// Fragile: every request is treated the same, errors disappear,
// and private/public data boundaries are not considered.
export default function Page() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/data').then(r => r.json()).then(setData); }, []);
  return <div>{JSON.stringify(data)}</div>;
}
```

**Correct approach:** HTML is the first interface; JavaScript enhances it.

```tsx
// Keep the initial content on the server when it is public or safely
// authorized there; use a client boundary only for actual interaction.
export default async function Page() {
  const data = await loadPageData();
  return <main><article><h1>{data.title}</h1><p>{data.summary}</p></article></main>;
}

async function loadPageData() {
  return { title: 'Project overview', summary: 'A server-rendered summary.' };
}
```

**Gotcha:** Do not use clickable `div` elements as substitutes for links and buttons. Ensure images have meaningful alt text or empty alt text when purely decorative.

**Review question:** What data is safe to share between requests, what must be resolved per request, and what should the visitor see if this dependency fails?

---
### 12. Runtime boundaries, secrets, and external services

**Mental model:** Server code can access secrets, but only if those secrets remain on the server. Runtime compatibility matters: Node.js packages may rely on APIs unavailable in an Edge runtime, and network calls can fail or time out.

**Scenario:** Keep secret environment variables unprefixed by `NEXT_PUBLIC_`, use supported runtime APIs, set bounded timeouts, and avoid leaking upstream response bodies. Prefer a shared server-only data access module.

**Example file:** `lib/server/catalog-client.ts`

```tsx
import 'server-only';

export async function fetchCatalogItem(id: string, signal?: AbortSignal) {
  const baseUrl = process.env.CATALOG_API_URL;
  const apiKey = process.env.CATALOG_API_KEY;
  if (!baseUrl || !apiKey) throw new Error('Catalog service is not configured');
  const response = await fetch(`${baseUrl}/items/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: 'no-store',
    signal,
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Catalog service returned ${response.status}`);
  return response.json();
}
```

**What the example demonstrates:** The route makes its rendering and data behavior explicit. Types communicate the expected shape, errors are handled intentionally, and the output uses meaningful structure rather than relying on client JavaScript for essential content.

**Naive approach — wrong:**

```tsx
// Fragile: every request is treated the same, errors disappear,
// and private/public data boundaries are not considered.
export default function Page() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/data').then(r => r.json()).then(setData); }, []);
  return <div>{JSON.stringify(data)}</div>;
}
```

**Correct approach:** A runtime is a deployment contract, not a toggle to guess at.

```tsx
// Keep the initial content on the server when it is public or safely
// authorized there; use a client boundary only for actual interaction.
export default async function Page() {
  const data = await loadPageData();
  return <main><article><h1>{data.title}</h1><p>{data.summary}</p></article></main>;
}

async function loadPageData() {
  return { title: 'Project overview', summary: 'A server-rendered summary.' };
}
```

**Gotcha:** Never place secrets in `NEXT_PUBLIC_*` variables or import server-only clients into Client Components.

**Review question:** What data is safe to share between requests, what must be resolved per request, and what should the visitor see if this dependency fails?

---
### 13. Real-world integrated route: a fast, private project dashboard

**Mental model:** A production dashboard combines route validation, server-side identity, ownership-scoped queries, independent reads, streaming boundaries, and cache discipline. These concerns must reinforce each other instead of being solved in separate snippets.

**Scenario:** Build a page that renders a private project list and recent activity. Do not cache the personalized aggregate globally. Handle missing sessions, partial failures, empty states, and accessible output explicitly.

**Example file:** `app/workspace/page.tsx`

```tsx
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getSession } from '@/lib/auth';
import { listProjectsForUser, listActivityForUser } from '@/lib/workspace';

export default async function WorkspacePage() {
  const session = await getSession();
  if (!session) redirect('/login?next=%2Fworkspace');
  const [projects, activity] = await Promise.all([
    listProjectsForUser(session.user.id),
    listActivityForUser(session.user.id),
  ]);
  return <main>
    <header><h1>Your workspace</h1><p>Private projects and recent changes.</p></header>
    <section aria-labelledby="projects-heading">
      <h2 id="projects-heading">Projects</h2>
      {projects.length ? <ul>{projects.map(p => <li key={p.id}><a href={`/projects/${p.id}`}>{p.name}</a></li>)}</ul> : <p>You have not created a project yet.</p>}
    </section>
    <Suspense fallback={<p>Loading activity…</p>}>
      <section aria-labelledby="activity-heading"><h2 id="activity-heading">Recent activity</h2><ul>{activity.map(a => <li key={a.id}>{a.label}</li>)}</ul></section>
    </Suspense>
  </main>;
}
```

**What the example demonstrates:** The route makes its rendering and data behavior explicit. Types communicate the expected shape, errors are handled intentionally, and the output uses meaningful structure rather than relying on client JavaScript for essential content.

**Naive approach — wrong:**

```tsx
// Fragile: every request is treated the same, errors disappear,
// and private/public data boundaries are not considered.
export default function Page() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/data').then(r => r.json()).then(setData); }, []);
  return <div>{JSON.stringify(data)}</div>;
}
```

**Correct approach:** Private dashboards should optimize for safe identity-scoped data first, then speed.

```tsx
// Keep the initial content on the server when it is public or safely
// authorized there; use a client boundary only for actual interaction.
export default async function Page() {
  const data = await loadPageData();
  return <main><article><h1>{data.title}</h1><p>{data.summary}</p></article></main>;
}

async function loadPageData() {
  return { title: 'Project overview', summary: 'A server-rendered summary.' };
}
```

**Gotcha:** A Suspense boundary only streams work that is actually pending beneath it; putting already-resolved data behind it does not create useful progressive rendering.

**Review question:** What data is safe to share between requests, what must be resolved per request, and what should the visitor see if this dependency fails?

---
## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Public content with bounded revalidation

**What it does:** Serve mostly stable editorial content from a cache and refresh it on a known interval.

**When to use it:** Use for a portfolio, documentation page, or article whose content can tolerate a few minutes of staleness.

```tsx
export async function getArticle(slug: string) {
  const response = await fetch(`${process.env.CONTENT_API_URL}/articles/${encodeURIComponent(slug)}`, {
    next: { revalidate: 300, tags: [`article:${slug}`] },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Content API failed');
  return response.json() as Promise<{ title: string; body: string }>;
}
```

Do not use a long revalidation interval for fields that determine payment, stock, or access control.

---

### Pattern 2: Private request-scoped page

**What it does:** Resolve identity on the server and query only records the viewer can access.

**When to use it:** Use for account settings, private dashboards, invoices, and client portals.

```tsx
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const account = await database.account.findFirst({
    where: { userId: session.user.id },
    select: { displayName: true, plan: true },
  });
  if (!account) return <main><h1>Account unavailable</h1></main>;
  return <main><h1>{account.displayName}</h1><p>Plan: {account.plan}</p></main>;
}
```

The query is scoped to the authenticated identity. Avoid putting the resulting private object in a shared cache.

---

### Pattern 3: Parallel independent data with progressive regions

**What it does:** Start independent reads together and stream slower regions when partial page content is useful.

**When to use it:** Use when a dashboard header and project list can render while an analytics panel is still loading.

```tsx
import { Suspense } from 'react';

export default async function AnalyticsPage() {
  const summary = await getSummary();
  return <main><h1>Analytics</h1><SummaryCards summary={summary} />
    <Suspense fallback={<p>Loading chart data…</p>}><AnalyticsPanel /></Suspense>
  </main>;
}

async function AnalyticsPanel() {
  const points = await getChartPoints();
  return <section aria-labelledby="trend-heading"><h2 id="trend-heading">Trend</h2><pre>{JSON.stringify(points)}</pre></section>;
}
async function getSummary() { return { visits: 1240, conversions: 87 }; }
async function getChartPoints() { return [{ day: 'Mon', visits: 140 }, { day: 'Tue', visits: 180 }]; }
function SummaryCards({ summary }: { summary: { visits: number; conversions: number } }) { return <section><h2>Summary</h2><p>{summary.visits} visits</p><p>{summary.conversions} conversions</p></section>; }
```

Do not add Suspense as decoration. It helps only when a child can suspend and the shell can provide useful content first.

---

### Pattern 4: Shared data access for page and metadata

**What it does:** Centralize resource lookup and cache-compatible options so metadata and page content agree.

**When to use it:** Use when a dynamic article title, canonical URL, and body must all represent the same published revision.

```tsx
import { cache } from 'react';

export const getArticle = cache(async (slug: string) => {
  const response = await fetch(`${process.env.CONTENT_API_URL}/articles/${encodeURIComponent(slug)}`, { next: { revalidate: 300 } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Article lookup failed');
  return response.json() as Promise<{ title: string; summary: string; body: string }>;
});
```

React `cache` deduplicates work in the relevant server render context; it is not a replacement for a durable distributed cache or an authorization strategy.

---

### Pattern 5: Explicit timeout and safe upstream failure

**What it does:** Bound how long a page waits on an external service and translate upstream failures into a controlled user-facing state.

**When to use it:** Use when a third-party API sometimes stalls and the page still needs a useful fallback.

```tsx
export async function getReviews() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(`${process.env.REVIEWS_API_URL}/reviews`, { signal: controller.signal, cache: 'no-store' });
    if (!response.ok) throw new Error(`Reviews API status ${response.status}`);
    return await response.json() as Array<{ id: string; quote: string }>;
  } finally {
    clearTimeout(timeout);
  }
}

```

The timeout is a budget, not a guarantee that the entire page meets a performance target. Log the failure and design a fallback if reviews are non-critical.

---

### Pattern 6: On-demand invalidation after a mutation

**What it does:** Refresh public cached content after a trusted write changes its source data.

**When to use it:** Use after a content editor publishes an article or a product manager updates public catalog copy.

```tsx
'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { requireEditor } from '@/lib/auth';

export async function publishArticle(slug: string) {
  await requireEditor();
  await database.article.update({ where: { slug }, data: { published: true } });
  revalidateTag(`article:${slug}`);
  revalidatePath(`/articles/${slug}`);
  return { ok: true };
}

```

Use the invalidation APIs and signatures supported by your installed Next.js version. Invalidation does not replace checking that the editor may publish this specific article.

---

### Pattern 7: Production-safe error boundary

**What it does:** Expose a clear recovery path while keeping stack traces and upstream details in server logs.

**When to use it:** Use for a route that depends on an analytics service or database and needs a retry affordance.

```tsx
'use client';

export default function ErrorBoundary({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main role="alert">
    <h1>We could not load this page</h1>
    <p>Your work has not been deleted. Try again in a moment.</p>
    <button type="button" onClick={reset}>Try again</button>
  </main>;
}

```

Do not put sensitive error messages in the UI. Record a correlation ID or framework digest so operators can find the matching event.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Marking the entire route `use client` to add one button | The client boundary is mistaken for a page-level rendering switch | Keep the page server-rendered and move the button into a focused Client Component |
| Caching personalized HTML or profile data globally | Developers equate GET with public data | Use request-scoped identity checks and `cache: 'no-store'` where appropriate |
| Treating route params as permission | A hard-to-guess ID is mistaken for access control | Scope every query to the authenticated viewer or tenant |
| Fetching independent resources sequentially | `await` is used immediately after each call without checking dependencies | Use `Promise.all` for independent operations and model real dependencies explicitly |
| Using static output for live stock or booking availability | Build-time output is assumed to be current forever | Define a freshness budget and revalidate or request live state at the decision point |
| Putting a secret in `NEXT_PUBLIC_*` | Environment variable naming is treated as configuration only | Keep secrets server-only and prevent server modules from entering client imports |
| Reading `window` during server rendering | Browser-only code is copied into a shared component | Move browser access into a Client Component effect or event handler |
| Rendering a different initial tree on the client | Time, random values, locale, or browser state changes initial markup | Make the first render deterministic and apply browser-specific changes after hydration |
| Swallowing upstream errors and rendering empty data | Empty state and failed state are treated as equivalent | Distinguish empty successful responses from service failure and provide retry/logging |
| Duplicating page and metadata fetch logic | Metadata is treated as unrelated to page content | Share a cache-compatible server data helper and use the same validated resource |
| Adding Suspense around already-resolved work | Suspense is treated as a visual spinner component | Place the boundary around the component that actually awaits independent work |
| Returning raw database records to components | Convenience wins over stable contracts and data minimization | Select only required fields and map them to explicit serializable view models |
| Using a redirect as the only access check | Navigation control is confused with authorization | Enforce authorization in the data-access layer and in every mutation path |
| Trusting the incoming Host header for canonical URLs | Request headers are assumed to be trustworthy origin configuration | Configure a canonical base URL from trusted environment settings |
| Assuming Edge runtime supports every Node package | Runtime selection is made without checking dependencies | Test runtime compatibility and select Node.js for packages needing unsupported APIs |
| Using a long cache lifetime for metadata that changes on publish | Cache behavior is tuned without editorial workflow requirements | Revalidate the route and tagged data after publication or unpublication |
| Returning raw exception messages to visitors | Debugging convenience is prioritized over information security | Show a generic message; log structured diagnostics server-side |
| Using a client-side fetch for content that must be indexed immediately | CSR is chosen for simplicity without checking discovery requirements | Server-render the essential content and reserve client fetches for interactions or live updates |
| Ignoring empty states in server-rendered lists | Only populated production-like data is tested | Render explicit empty-state copy and a meaningful next action |
| Assuming React cache is a persistent cross-request cache | Memoization and data caching are conflated | Choose request deduplication, Next.js data caching, or an external cache intentionally |

### Before → After: avoid leaking private data through shared caching

**Before — unsafe design:**

```tsx
export async function getBillingSummary(userId: string) {
  return fetch(`${process.env.BILLING_API_URL}/users/${userId}/summary`, {
    next: { revalidate: 3600 },
  }).then((response) => response.json());
}
```

**After — safer default for private data:**

```tsx
import 'server-only';

export async function getBillingSummary(accessToken: string) {
  const response = await fetch(`${process.env.BILLING_API_URL}/me/summary`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Billing summary unavailable');
  return response.json() as Promise<{ currentBalance: number; currency: string }>;
}
```

The second version does not by itself prove the token is valid; the billing service must verify it and authorize the identity. It does make the private-data intent explicit and avoids opting into a shared revalidation cache for this request.

---

### Version-aware implementation note: Pages Router versus App Router

These APIs belong to different routing systems. Do not combine their data-loading conventions in one page. The Pages Router uses `getServerSideProps` for request-time server rendering; the App Router uses Server Components and request/data APIs with its own cache semantics.

```tsx
// pages/legacy-project.tsx — Pages Router example
import type { GetServerSideProps } from 'next';

type Props = { project: { name: string } | null };

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const slug = context.params?.slug;
  if (typeof slug !== 'string') return { notFound: true };
  const project = await findPublicProject(slug);
  if (!project) return { notFound: true };
  return { props: { project } };
};

export default function LegacyProjectPage({ project }: Props) {
  if (!project) return <main><h1>Project unavailable</h1></main>;
  return <main><article><h1>{project.name}</h1></article></main>;
}

async function findPublicProject(slug: string): Promise<Props['project']> {
  return slug === 'care-platform' ? { name: 'Care platform' } : null;
}
```

### Hydration mismatch: stabilize the first render

```tsx
'use client';

import { useEffect, useState } from 'react';

export function LocalClock() {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    setTime(new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(new Date()));
  }, []);
  return <time>{time ?? 'Local time available after hydration'}</time>;
}
```

This intentionally renders a stable placeholder on the server and on the first client render. If a date/time is essential content, prefer formatting it in a consistent known timezone on the server rather than hiding it until hydration.

---

## Mental Models

1. **Render is a data contract** — decide whether the output is public, personalized, fresh, or safely reusable before choosing a rendering mode.
2. **Cache keys are security boundaries** — if two visitors must see different data, their representations must not collide in a shared cache.
3. **Server is not synonymous with secure** — server code still needs validation, authentication, authorization, least privilege, and safe error handling.
4. **Hydration is a handshake** — initial client output must agree with server HTML; browser-only differences belong after hydration.
5. **Latency is a dependency graph** — parallelize independent work, bound slow calls, and stream regions that can fail or finish separately.
6. **Freshness is a product decision** — write down how stale each field may be; choose caching and invalidation to meet that budget.
7. **HTML is the first interface** — semantic, useful content should arrive before client JavaScript has completed.
8. **Failure is a page state** — design loading, empty, not-found, and error experiences as deliberately as the success path.
9. **Identity follows every data path** — every private read and write must enforce the viewer's permissions where the data is accessed.

---

## Quick Reference

| Property/Situation | Value/Answer | Notes |
|---|---|---|
| App Router default | Server Component | Add `use client` only when client capabilities are needed |
| Pages Router page data | `getServerSideProps` | Runs on the server for each request in supported Pages Router deployments |
| Static generation (Pages Router) | `getStaticProps` | Build-time/static output; can combine with ISR |
| Dynamic App Router route | `app/[slug]/page.tsx` | Current Next.js versions may type `params` as a Promise |
| Client boundary | `'use client'` | Defines a module boundary, not just one component's behavior |
| Server-only guard | `import 'server-only'` | Helps prevent accidental client imports of privileged modules |
| Request-specific fetch | `cache: 'no-store'` | Appropriate for data that should not be shared through the Data Cache |
| Time-based revalidation | `next: { revalidate: 60 }` | Use a freshness interval aligned to product needs |
| Tag cached data | `next: { tags: ['catalog'] }` | Enables tag-based invalidation with supported APIs |
| Not-found UI | `notFound()` / `not-found.tsx` | Use for missing or intentionally undisclosed resources |
| Browser navigation redirect | `redirect('/login')` | Usually preferable to returning raw auth errors from a page |
| Loading boundary | `loading.tsx` / `<Suspense>` | Boundary should cover work that can actually suspend |
| Route error boundary | `error.tsx` | Client Component convention; provide recovery and safe messaging |
| Metadata | `metadata` / `generateMetadata` | Generate titles, descriptions, canonical URLs, and social metadata |
| Parallel reads | `Promise.all([...])` | Only for independent requests; it rejects if any required promise rejects |
| Partial parallel results | `Promise.allSettled([...])` | Use when each result can be handled independently |
| Server-side mutation | Server Action or Route Handler | Validate input and authorize every mutation |
| Safe canonical origin | Trusted environment configuration | Do not blindly trust arbitrary request Host values |
| Timeout | `AbortController` | Bound waiting time for fetches and clear timeout resources |
| Semantic main content | `<main>` | One primary main landmark per page view |
| Article content | `<article>` | Appropriate for independently meaningful content |
| Section heading | `<section aria-labelledby="...">` | Give sections a meaningful accessible name when useful |
| Navigation | `<nav>` and `<a>` | Use links for navigation, not clickable generic containers |
| User action | `<button type="button">` | Use a button for an action, not for navigation |
| Runtime selection | Node.js or Edge | Verify package and API compatibility before choosing |
| Private record query | Scope by viewer/tenant | Prefer authorization-aware database predicates |
| Cache invalidation | `revalidatePath` / `revalidateTag` | Match API signatures to the installed Next.js version |
| Performance signal | TTFB, LCP, hydration cost, error rate | Measure in production-like conditions and real devices |
| Build verification | `next build` plus tests | Catch route, type, and rendering issues before deployment |

---

## Build Challenge

### Build: Portfolio + Private Client Workspace

Build a Next.js application with a public portfolio and a private client workspace. The public side should be quick to load, indexable, and cacheable; the private side must be identity-scoped and must never leak data across visitors.

**Required features**

1. Create a public `/projects` listing with semantic HTML and useful metadata.
2. Create `/projects/[slug]` pages that handle invalid slugs, missing projects, canonical URLs, and a deliberate public-data revalidation policy.
3. Build a private `/workspace` page that resolves a server-side session and redirects unauthenticated visitors to login.
4. Scope project and activity queries to the authenticated user or membership relation. Do not fetch every user's data and filter it in the browser.
5. Fetch independent workspace sections in parallel. Add a loading boundary around a genuinely slow section and design an explicit empty state.
6. Add an editor-only publishing mutation. Validate its input, verify editor authorization, persist the change, and invalidate the correct public cache entries.
7. Add a route-level error UI that gives visitors a safe retry path without exposing stack traces.
8. Keep API keys and database access in server-only modules. Verify the client bundle contains no secrets.
9. Test missing sessions, forbidden resources, missing slugs, upstream failure, empty data, and cache invalidation after publishing.
10. Test at a narrow mobile viewport and on a slow connection; verify useful HTML appears before optional client interactions finish.

**Definition of Done**

- `next build` passes with no unresolved type errors.
- Public project pages render meaningful server HTML and have accurate title, description, and canonical metadata.
- Public content freshness is documented and matches the selected cache/revalidation policy.
- A user cannot access another user's workspace by changing an ID or URL.
- Private requests are not placed in a shared cache accidentally.
- Loading, empty, not-found, and error states are visibly distinct and accessible.
- Publishing updates the source of truth and refreshes the intended public representation.
- No secret is exposed in client-side JavaScript or HTML.
- Independent server requests run concurrently where safe, and slow dependencies have a bounded failure path.
- Tests cover authorization and cache behavior, not just the successful rendering path.
- The README explains why each route is static, revalidated, or request-specific and records the assumptions behind those choices.

**Review checklist**

- Can every rendered field be classified as public, private, or derived?
- What is the freshness budget for each cached field?
- Which layer enforces authorization if middleware is bypassed?
- Does the initial HTML remain useful with JavaScript disabled or delayed?
- Is the first client render deterministic?
- Can an upstream timeout leave the entire page blank unnecessarily?
- Are errors observable to operators without exposing internal details to visitors?
- Are framework-specific caching APIs compatible with the installed Next.js version?

The challenge is complete when the app is not merely rendered on the server, but has an explainable rendering policy, secure data boundaries, deliberate freshness, accessible fallbacks, and tests for the failure modes most likely to hurt a real client.
