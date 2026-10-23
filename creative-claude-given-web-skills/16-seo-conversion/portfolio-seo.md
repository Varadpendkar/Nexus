---
# SKILL: portfolio-seo
**Layer:** 16 — SEO / Conversion
**Goal:** Make a portfolio discoverable, understandable, and eligible for rich search presentation without sacrificing its visual design or performance.
---
## Why This Matters (Senior Perspective)
A portfolio can be visually excellent and still be invisible when its page titles are vague, project pages are inaccessible to crawlers, or every route describes the same work. Search engines need stable URLs, clear page purpose, crawlable links, useful text, and evidence that matches the claims being made. SEO is not a last-minute metadata pass; it is an information-architecture and publishing discipline.

For a creative portfolio, the trade-off is unusually sharp: the design may depend on motion, canvas, WebGL, or sparse typography, while visitors and crawlers still need to understand the work quickly. Senior implementation keeps the core story in semantic HTML, treats JavaScript as enhancement, and measures outcomes with Search Console and analytics rather than promising rankings. The goal is qualified discovery—recruiters, clients, collaborators, and press finding the right case study—not traffic at any cost.
---
## Core Concepts
### 1. Search intent and page purpose
Give every indexable route one clear job. A homepage can establish identity and specialties; a case study should explain one project, its role, constraints, decisions, and outcomes. Avoid making a single page target every phrase.


```html
<main id="main-content">
  <article class="project-case-study">
    <h1>Transit App — Product Design Case Study</h1>
    <p>Research, interaction design, and usability outcomes.</p>
    <a href="/work/transit-app/">Read the full case study</a>
  </article>
</main>
```

**Before / after.** Before: the implementation treats “search intent and page purpose” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Give every indexable route one clear job. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Search intent and page purpose is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 2. Title and description design
Titles should be distinct, accurate, and front-load the page's subject. Descriptions are snippets, not guaranteed ranking levers; write them as concise previews that help a relevant searcher choose the result.


```html
<main id="main-content">
  <article class="project-case-study">
    <h1>Transit App — Product Design Case Study</h1>
    <p>Research, interaction design, and usability outcomes.</p>
    <a href="/work/transit-app/">Read the full case study</a>
  </article>
</main>
```

**Before / after.** Before: the implementation treats “title and description design” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Titles should be distinct, accurate, and front-load the page's subject. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Title and description design is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 3. Semantic content and heading structure
Use one descriptive H1 for the page's main topic, then headings that reflect information hierarchy. Headings are not a styling system; CSS should create the visual scale without skipping document structure.


```html
<main id="main-content">
  <article class="project-case-study">
    <h1>Transit App — Product Design Case Study</h1>
    <p>Research, interaction design, and usability outcomes.</p>
    <a href="/work/transit-app/">Read the full case study</a>
  </article>
</main>
```

**Before / after.** Before: the implementation treats “semantic content and heading structure” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Use one descriptive H1 for the page's main topic, then headings that reflect information hierarchy. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Semantic content and heading structure is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 4. Canonical URLs and duplicate routes
Choose one preferred URL for each page and redirect or canonicalize alternate variants. Canonicals are hints, not a replacement for consistent internal links and redirect hygiene.


```html
<main id="main-content">
  <article class="project-case-study">
    <h1>Transit App — Product Design Case Study</h1>
    <p>Research, interaction design, and usability outcomes.</p>
    <a href="/work/transit-app/">Read the full case study</a>
  </article>
</main>
```

**Before / after.** Before: the implementation treats “canonical urls and duplicate routes” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Choose one preferred URL for each page and redirect or canonicalize alternate variants. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Canonical URLs and duplicate routes is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 5. Crawlability and indexability
Robots directives, HTTP status, internal links, and rendered content have different jobs. A page blocked from crawling cannot reliably communicate a page-level noindex directive to a crawler.


```html
<main id="main-content">
  <article class="project-case-study">
    <h1>Transit App — Product Design Case Study</h1>
    <p>Research, interaction design, and usability outcomes.</p>
    <a href="/work/transit-app/">Read the full case study</a>
  </article>
</main>
```

**Before / after.** Before: the implementation treats “crawlability and indexability” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Robots directives, HTTP status, internal links, and rendered content have different jobs. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Crawlability and indexability is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 6. Structured data boundaries
Use only schema.org types and properties that accurately describe visible page content. JSON-LD can clarify entities, but it does not guarantee rich results or compensate for misleading content.


```html
<main id="main-content">
  <article class="project-case-study">
    <h1>Transit App — Product Design Case Study</h1>
    <p>Research, interaction design, and usability outcomes.</p>
    <a href="/work/transit-app/">Read the full case study</a>
  </article>
</main>
```

**Before / after.** Before: the implementation treats “structured data boundaries” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Use only schema. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Structured data boundaries is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 7. Image discoverability and accessibility
Use descriptive file names and contextual alt text for meaningful images. Decorative visuals use empty alt text; captions and surrounding case-study copy should carry the project's actual story.


```html
<main id="main-content">
  <article class="project-case-study">
    <h1>Transit App — Product Design Case Study</h1>
    <p>Research, interaction design, and usability outcomes.</p>
    <a href="/work/transit-app/">Read the full case study</a>
  </article>
</main>
```

**Before / after.** Before: the implementation treats “image discoverability and accessibility” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Use descriptive file names and contextual alt text for meaningful images. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Image discoverability and accessibility is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 8. Internal linking and project taxonomy
Link case studies from relevant index pages and related projects. Keep labels descriptive, links crawlable, and taxonomy shallow enough that important work is reachable without relying on client-side search.


```html
<main id="main-content">
  <article class="project-case-study">
    <h1>Transit App — Product Design Case Study</h1>
    <p>Research, interaction design, and usability outcomes.</p>
    <a href="/work/transit-app/">Read the full case study</a>
  </article>
</main>
```

**Before / after.** Before: the implementation treats “internal linking and project taxonomy” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Link case studies from relevant index pages and related projects. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Internal linking and project taxonomy is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 9. Performance as an SEO input
Measure real-user Core Web Vitals and keep the first meaningful content available before heavy animation or 3D initialization. Avoid claiming that a Lighthouse score guarantees ranking position.


```html
<main id="main-content">
  <article class="project-case-study">
    <h1>Transit App — Product Design Case Study</h1>
    <p>Research, interaction design, and usability outcomes.</p>
    <a href="/work/transit-app/">Read the full case study</a>
  </article>
</main>
```

**Before / after.** Before: the implementation treats “performance as an seo input” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Measure real-user Core Web Vitals and keep the first meaningful content available before heavy animation or 3D initialization. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Performance as an SEO input is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 10. Measurement and iteration
Connect Search Console query/page data with analytics events. Distinguish impressions, clicks, engaged visits, and qualified contact actions; a rise in traffic alone does not prove business value.


```html
<main id="main-content">
  <article class="project-case-study">
    <h1>Transit App — Product Design Case Study</h1>
    <p>Research, interaction design, and usability outcomes.</p>
    <a href="/work/transit-app/">Read the full case study</a>
  </article>
</main>
```

**Before / after.** Before: the implementation treats “measurement and iteration” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Connect Search Console query/page data with analytics events. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Measurement and iteration is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 11. International and location signals
Use language and location cues only when they reflect the actual audience or service area. If localized pages exist, provide unique useful content and correct language annotations instead of duplicating pages with city names swapped.


```html
<main id="main-content">
  <article class="project-case-study">
    <h1>Transit App — Product Design Case Study</h1>
    <p>Research, interaction design, and usability outcomes.</p>
    <a href="/work/transit-app/">Read the full case study</a>
  </article>
</main>
```

**Before / after.** Before: the implementation treats “international and location signals” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Use language and location cues only when they reflect the actual audience or service area. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: International and location signals is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 12. Launch and migration hygiene
Before launch, map old URLs to their closest replacements, verify redirects and sitemap URLs, and keep a rollback plan. Monitor crawl errors and query performance after deployment rather than assuming launch-day checks are enough.


```html
<main id="main-content">
  <article class="project-case-study">
    <h1>Transit App — Product Design Case Study</h1>
    <p>Research, interaction design, and usability outcomes.</p>
    <a href="/work/transit-app/">Read the full case study</a>
  </article>
</main>
```

**Before / after.** Before: the implementation treats “launch and migration hygiene” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Before launch, map old URLs to their closest replacements, verify redirects and sitemap URLs, and keep a rollback plan. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Launch and migration hygiene is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

---
## Relevant Patterns
### Pattern 1: Case-study landing page
Create a crawlable overview that links to detailed case studies; include project type, role, year, and a short outcome summary. Use the overview to help users choose, not to duplicate each full case study.


```text
Trigger: a route or visitor reaches the case-study landing page workflow.
Action: validate required inputs, execute the smallest reliable implementation, and verify the observable output.
Failure path: log the route or variant and preserve a usable fallback.
```

### Pattern 2: Project detail page
Lead with a human-readable project title, short summary, role, constraints, approach, and evidence-backed outcome. Include a canonical URL and meaningful links to related work.


```text
Trigger: a route or visitor reaches the project detail page workflow.
Action: validate required inputs, execute the smallest reliable implementation, and verify the observable output.
Failure path: log the route or variant and preserve a usable fallback.
```

### Pattern 3: Metadata helper
Centralize title, description, canonical, and Open Graph fields in a typed page metadata object so routes cannot silently inherit the homepage's copy.


```text
Trigger: a route or visitor reaches the metadata helper workflow.
Action: validate required inputs, execute the smallest reliable implementation, and verify the observable output.
Failure path: log the route or variant and preserve a usable fallback.
```

### Pattern 4: Launch audit
Run a repeatable check for status codes, title uniqueness, canonical correctness, sitemap membership, robots rules, and internal links on every release.


```text
Trigger: a route or visitor reaches the launch audit workflow.
Action: validate required inputs, execute the smallest reliable implementation, and verify the observable output.
Failure path: log the route or variant and preserve a usable fallback.
```

### Pattern 5: Search-to-conversion review
Review search queries that produce impressions, inspect whether the landing page answers that intent, then add evidence or links before rewriting metadata blindly.


```text
Trigger: a route or visitor reaches the search-to-conversion review workflow.
Action: validate required inputs, execute the smallest reliable implementation, and verify the observable output.
Failure path: log the route or variant and preserve a usable fallback.
```

### Pattern 6: Performance-safe visual enhancement
Render essential project text and links in HTML first; load expensive motion after initial content and honor reduced-motion preferences.


```text
Trigger: a route or visitor reaches the performance-safe visual enhancement workflow.
Action: validate required inputs, execute the smallest reliable implementation, and verify the observable output.
Failure path: log the route or variant and preserve a usable fallback.
```

---
## Common Mistakes
| Mistake | Why It Happens | Fix |
|---|---|---|
| Every route uses the same title | Shared defaults leak into project pages and blur search result meaning | Generate route-specific metadata from required page data and fail the build when title fields are missing. |
| Homepage is only a canvas | Text is absent until a shader or client bundle runs | Keep the project introduction and navigation in semantic HTML; use canvas as a decorative layer. |
| Robots blocks a page that needs noindex | Crawler cannot fetch the page-level directive | Allow crawling when the crawler must read noindex, and separately remove accidental internal links. |
| Canonical points to the homepage | Copied metadata canonicalizes all case studies to one URL | Build canonical from a validated route map and test each production URL. |
| Alt text repeats keywords | Image description becomes spammy and unhelpful | Describe the image's information or function in context; leave purely decorative images with empty alt. |
| Sitemap includes redirects | Submitted URLs waste crawl attention and create inconsistent signals | Emit only canonical, indexable, successful final URLs in the sitemap. |
| Project outcome is asserted without evidence | Marketing copy overstates impact or invents metrics | Label estimates, state measurement method, or remove unsupported numbers. |
| Client-side links are not anchors | Crawlers and keyboard users cannot follow a button-only navigation flow | Use real anchor elements with href for route navigation. |
| Heading levels chosen for size | Document outline becomes confusing to screen readers and search parsers | Use semantic heading order and style it independently with CSS. |
| All images ship at full resolution | Large assets slow first content and mobile visits | Use responsive image sources, explicit dimensions, and modern formats with a fallback. |
| No redirect map during redesign | Valuable legacy URLs become 404s | Create a one-to-one redirect map before launch and test representative old URLs. |
| Analytics treats every page view as success | High-volume low-intent traffic masks weak conversion | Track qualified contact submissions and project engagement as separate events. |
| Locale pages are cloned | Near-identical pages compete without serving different audiences | Publish localized content only where language, service, or evidence genuinely differs. |
| SEO promises ranking positions | Ranking depends on competition and search systems outside the site's control | Define deliverables as implementation, measurement, and iteration—not guaranteed rankings. |

---
## Mental Models
1. **Intent before implementation:** A page or event exists to answer a visitor question or a product decision.
2. **HTML is the source of meaning:** Visual effects should enhance content rather than hide the page's essential purpose.
3. **Evidence beats certainty:** Measurement supports a decision; it does not guarantee rankings or prove causation by itself.
4. **One URL, one canonical purpose:** Consistent URLs and links reduce ambiguity for users, crawlers, and analytics.
5. **Failures need a designed path:** Missing data, blocked scripts, and network errors must not erase the useful experience.
6. **Privacy is a product requirement:** Collect only the information needed to improve the experience and protect it deliberately.
7. **Ship a reversible change:** A launch is safer when verification and rollback are planned before release.

---
## Quick Reference
| Area | Check | Expected result |
|---|---|---|
| Title | Unique, descriptive, within a sensible display length | Verified in the production-like route or documented as not applicable |
| Description | Accurate preview; no unsupported promises | Verified in the production-like route or documented as not applicable |
| H1 | One primary page heading | Verified in the production-like route or documented as not applicable |
| Canonical | Absolute preferred URL | Verified in the production-like route or documented as not applicable |
| Robots | No accidental noindex or blocked assets | Verified in the production-like route or documented as not applicable |
| Sitemap | Only canonical indexable URLs | Verified in the production-like route or documented as not applicable |
| Status | Important pages return 200 | Verified in the production-like route or documented as not applicable |
| Redirects | Old URLs map to closest replacement | Verified in the production-like route or documented as not applicable |
| Links | Project navigation uses anchors | Verified in the production-like route or documented as not applicable |
| Images | Alt text reflects purpose | Verified in the production-like route or documented as not applicable |
| Structured data | Valid JSON-LD and visible matching content | Verified in the production-like route or documented as not applicable |
| Performance | Real-user metrics reviewed | Verified in the production-like route or documented as not applicable |
| Analytics | Qualified events defined | Verified in the production-like route or documented as not applicable |
| Mobile | Content and actions usable at narrow widths | Verified in the production-like route or documented as not applicable |
| Evidence | Outcomes substantiated or clearly qualified | Verified in the production-like route or documented as not applicable |

---
## Build Challenge
Build a production-ready implementation for a creative portfolio with a homepage, three case studies, a contact route, and responsive navigation. The challenge is complete only when the following requirements are satisfied:

- [ ] Create a clear route model with unique page data and a documented fallback.
- [ ] Keep essential text, headings, and navigation in semantic HTML.
- [ ] Use meaningful names and comments that explain why a non-obvious decision exists.
- [ ] Validate required inputs at build time or before a request is processed.
- [ ] Support narrow mobile viewports and keyboard-only interaction.
- [ ] Handle missing assets and optional data without breaking the page.
- [ ] Keep personal information out of analytics event payloads.
- [ ] Define a verification step for generated metadata, previews, events, or experiment assignment.
- [ ] Document the release checks and a practical rollback procedure.
- [ ] Record one primary success metric and at least one quality or accessibility guardrail.

### Implementation starter

```html
<head>
  <title>Transit App Case Study | Varad Pendkar</title>
  <meta name="description" content="A product design case study covering research and interaction decisions.">
  <link rel="canonical" href="https://portfolio.example/work/transit-app/">
</head>
```


```js
const indexable = page.status === 200 && !page.noindex && Boolean(page.canonical);
if (!indexable) throw new Error("Page is not eligible for sitemap output");
```


```xml
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://portfolio.example/work/transit-app/</loc></url>
</urlset>
```

### Definition of done / Success criteria
- The implementation has no broken links, missing required fields, or console errors on the supported routes.
- The relevant output is verified: search metadata, generated image, CTA completion, analytics event, or experiment assignment.
- Keyboard interaction and narrow viewport behavior are checked, not assumed.
- No personal data is exposed through public metadata or analytics events.
- The fallback and rollback path are documented and tested.
- The owner can explain the metric, its denominator, and what evidence would change the next decision.

### Production review notes
Treat platform behavior as something to verify against current official documentation. Search engines and social networks may rewrite titles, cache previews, or change reporting interfaces. Do not promise ranking positions, guaranteed social preview refresh times, statistical certainty from inadequate samples, or a specific conversion lift. For legal/privacy questions, document the implementation and seek qualified advice where required; this skill is technical guidance, not a legal guarantee.
