---
# SKILL: og-image-generator
**Layer:** 16 — SEO / Conversion
**Goal:** Generate consistent, readable Open Graph preview images for portfolio routes and social sharing, with safe fallbacks and deterministic output.
---
## Why This Matters (Senior Perspective)
A link preview is often the first visual impression of a project shared in a chat, professional network, or social feed. A broken, generic, cropped, or text-heavy preview can make excellent work look unfinished. The generator must produce predictable dimensions, contrast, typography, and a correct public URL for every route without requiring a designer to hand-export each page.

The implementation is a small publishing pipeline, not merely an image template. Inputs need validation, fonts and assets need to be available in the build environment, output paths must be stable, and generation failures should be visible. Open Graph consumers cache previews independently, so a successful local render is not proof that every platform has refreshed its cache.
---
## Core Concepts
### 1. Preview canvas and safe zones
Choose a target canvas such as 1200×630 and keep key text away from edges. Platforms may crop differently, so critical information belongs in a central safe area.


```ts
type SocialCardInput = { title: string; category: string; image?: string };

function validateCard(input: SocialCardInput) {
  if (!input.title.trim()) throw new Error("Social card title is required");
  return { ...input, title: input.title.trim().slice(0, 120) };
}
```

**Before / after.** Before: the implementation treats “preview canvas and safe zones” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Choose a target canvas such as 1200×630 and keep key text away from edges. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Preview canvas and safe zones is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 2. Route-driven content model
Map each route to a title, category, optional image, and brand treatment. Treat missing fields as validation errors or intentional fallbacks rather than silently printing undefined.


```ts
type SocialCardInput = { title: string; category: string; image?: string };

function validateCard(input: SocialCardInput) {
  if (!input.title.trim()) throw new Error("Social card title is required");
  return { ...input, title: input.title.trim().slice(0, 120) };
}
```

**Before / after.** Before: the implementation treats “route-driven content model” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Map each route to a title, category, optional image, and brand treatment. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Route-driven content model is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 3. Typography and contrast
Use a bundled font and predictable line wrapping. Long titles need explicit maximum lines and a deliberate fallback; tiny text that looks fine on a desktop preview can become unreadable in a feed.


```ts
type SocialCardInput = { title: string; category: string; image?: string };

function validateCard(input: SocialCardInput) {
  if (!input.title.trim()) throw new Error("Social card title is required");
  return { ...input, title: input.title.trim().slice(0, 120) };
}
```

**Before / after.** Before: the implementation treats “typography and contrast” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Use a bundled font and predictable line wrapping. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Typography and contrast is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 4. Deterministic asset generation
Build output should be repeatable from committed inputs. Avoid current timestamps, random IDs, or remote images that may change between builds.


```ts
type SocialCardInput = { title: string; category: string; image?: string };

function validateCard(input: SocialCardInput) {
  if (!input.title.trim()) throw new Error("Social card title is required");
  return { ...input, title: input.title.trim().slice(0, 120) };
}
```

**Before / after.** Before: the implementation treats “deterministic asset generation” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Build output should be repeatable from committed inputs. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Deterministic asset generation is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 5. Image composition
Use one dominant visual and limited text hierarchy. If a screenshot is used, crop it with a focal point and overlay contrast behind text instead of stretching it.


```ts
type SocialCardInput = { title: string; category: string; image?: string };

function validateCard(input: SocialCardInput) {
  if (!input.title.trim()) throw new Error("Social card title is required");
  return { ...input, title: input.title.trim().slice(0, 120) };
}
```

**Before / after.** Before: the implementation treats “image composition” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Use one dominant visual and limited text hierarchy. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Image composition is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 6. Metadata integration
Each HTML route should reference an absolute og:image URL, matching title and description, and the appropriate image dimensions and type.


```ts
type SocialCardInput = { title: string; category: string; image?: string };

function validateCard(input: SocialCardInput) {
  if (!input.title.trim()) throw new Error("Social card title is required");
  return { ...input, title: input.title.trim().slice(0, 120) };
}
```

**Before / after.** Before: the implementation treats “metadata integration” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Each HTML route should reference an absolute og:image URL, matching title and description, and the appropriate image dimensions and type. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Metadata integration is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 7. Caching and invalidation
Use versioned asset names or deliberate cache headers when designs change. Social crawlers cache separately; update the URL or use platform debugging tools when a stale preview persists.


```ts
type SocialCardInput = { title: string; category: string; image?: string };

function validateCard(input: SocialCardInput) {
  if (!input.title.trim()) throw new Error("Social card title is required");
  return { ...input, title: input.title.trim().slice(0, 120) };
}
```

**Before / after.** Before: the implementation treats “caching and invalidation” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Use versioned asset names or deliberate cache headers when designs change. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Caching and invalidation is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 8. Security and untrusted input
Escape text in SVG markup and restrict remote image sources. User-controlled strings must not be allowed to inject SVG elements or external resource references.


```ts
type SocialCardInput = { title: string; category: string; image?: string };

function validateCard(input: SocialCardInput) {
  if (!input.title.trim()) throw new Error("Social card title is required");
  return { ...input, title: input.title.trim().slice(0, 120) };
}
```

**Before / after.** Before: the implementation treats “security and untrusted input” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Escape text in SVG markup and restrict remote image sources. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Security and untrusted input is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 9. Build-time versus request-time
For a finite portfolio, build-time generation is usually simpler and more cacheable. Request-time rendering is justified only when content changes frequently and infrastructure supports it.


```ts
type SocialCardInput = { title: string; category: string; image?: string };

function validateCard(input: SocialCardInput) {
  if (!input.title.trim()) throw new Error("Social card title is required");
  return { ...input, title: input.title.trim().slice(0, 120) };
}
```

**Before / after.** Before: the implementation treats “build-time versus request-time” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** For a finite portfolio, build-time generation is usually simpler and more cacheable. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Build-time versus request-time is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 10. Testing rendered output
Validate file existence, dimensions, file size, text clipping, and image decoding. Automated checks should be complemented by visual inspection at thumbnail scale.


```ts
type SocialCardInput = { title: string; category: string; image?: string };

function validateCard(input: SocialCardInput) {
  if (!input.title.trim()) throw new Error("Social card title is required");
  return { ...input, title: input.title.trim().slice(0, 120) };
}
```

**Before / after.** Before: the implementation treats “testing rendered output” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Validate file existence, dimensions, file size, text clipping, and image decoding. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Testing rendered output is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 11. Fallback strategy
Provide a brand-level default image for unknown routes and a route-specific fallback for missing project artwork. Never emit an empty og:image URL.


```ts
type SocialCardInput = { title: string; category: string; image?: string };

function validateCard(input: SocialCardInput) {
  if (!input.title.trim()) throw new Error("Social card title is required");
  return { ...input, title: input.title.trim().slice(0, 120) };
}
```

**Before / after.** Before: the implementation treats “fallback strategy” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Provide a brand-level default image for unknown routes and a route-specific fallback for missing project artwork. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Fallback strategy is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 12. Operational observability
Log which route failed, which input was missing, and the output path. Fail a production build for broken required assets while allowing intentional optional artwork to fall back.


```ts
type SocialCardInput = { title: string; category: string; image?: string };

function validateCard(input: SocialCardInput) {
  if (!input.title.trim()) throw new Error("Social card title is required");
  return { ...input, title: input.title.trim().slice(0, 120) };
}
```

**Before / after.** Before: the implementation treats “operational observability” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Log which route failed, which input was missing, and the output path. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Operational observability is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

---
## Relevant Patterns
### Pattern 1: Build-time batch renderer
Load a route manifest, validate every record, render each image, and emit a summary of generated and failed paths.


```text
Trigger: a route or visitor reaches the build-time batch renderer workflow.
Action: validate required inputs, execute the smallest reliable implementation, and verify the observable output.
Failure path: log the route or variant and preserve a usable fallback.
```

### Pattern 2: Template with safe title wrapping
Measure title width, split by words, cap line count, and shorten gracefully instead of clipping characters.


```text
Trigger: a route or visitor reaches the template with safe title wrapping workflow.
Action: validate required inputs, execute the smallest reliable implementation, and verify the observable output.
Failure path: log the route or variant and preserve a usable fallback.
```

### Pattern 3: Route metadata contract
Require ogTitle, ogDescription, and absolute ogImage fields in the page model; reject relative production image URLs.


```text
Trigger: a route or visitor reaches the route metadata contract workflow.
Action: validate required inputs, execute the smallest reliable implementation, and verify the observable output.
Failure path: log the route or variant and preserve a usable fallback.
```

### Pattern 4: Focal-point crop
Use a known focal point for project screenshots and cover art; test both light and dark images under the text overlay.


```text
Trigger: a route or visitor reaches the focal-point crop workflow.
Action: validate required inputs, execute the smallest reliable implementation, and verify the observable output.
Failure path: log the route or variant and preserve a usable fallback.
```

### Pattern 5: Preview regression suite
Generate sample short, long, accented, and punctuation-heavy titles and compare output screenshots at thumbnail size.


```text
Trigger: a route or visitor reaches the preview regression suite workflow.
Action: validate required inputs, execute the smallest reliable implementation, and verify the observable output.
Failure path: log the route or variant and preserve a usable fallback.
```

### Pattern 6: Cache refresh workflow
Version the image URL when artwork changes, then verify the page metadata and test the platform's preview debugger.


```text
Trigger: a route or visitor reaches the cache refresh workflow workflow.
Action: validate required inputs, execute the smallest reliable implementation, and verify the observable output.
Failure path: log the route or variant and preserve a usable fallback.
```

---
## Common Mistakes
| Mistake | Why It Happens | Fix |
|---|---|---|
| Text is placed at the canvas edge | Different platforms crop preview images differently | Reserve a 64px minimum safe margin and validate critical text bounds in a rendered image test. |
| Titles overflow the card | A long project name has no wrapping policy | Measure text using the actual bundled font and use a defined two-line ellipsis fallback. |
| SVG inserts raw project title | Special characters can alter markup or introduce unwanted elements | Escape XML text nodes and allowlist any attributes used in generated SVG. |
| Remote screenshot makes builds flaky | The image can timeout or change without a code change | Download approved assets during a controlled step or store them in the repository with licenses recorded. |
| Metadata uses a relative image path | Social crawlers may not resolve it against the intended origin | Construct absolute HTTPS URLs from a validated production base URL. |
| Default image masks route failures | Missing project records appear valid at a glance | Emit a report listing every fallback use and fail when a required route has no manifest entry. |
| Preview is readable only at full size | Small-feed thumbnails compress text and details | Inspect at 300px-wide display and remove secondary copy until hierarchy is obvious. |
| Build output changes on every run | Timestamp or random data breaks caching | Keep generated content deterministic and include only stable route data. |
| Wrong content type is served | Some consumers reject or mishandle the image | Serve the correct image MIME type and verify the actual response headers. |
| Image is too heavy | Slow crawlers or social clients time out | Optimize output format and quality while preserving legibility; enforce a project-specific byte budget. |
| Dark logo disappears on dark artwork | Brand mark lacks a contrast treatment | Place the logo on a controlled solid or translucent brand plate with verified contrast. |
| Stale preview blamed on code | Platform caches can persist after metadata changes | Verify source HTML first, then use the platform's official refresh/debug flow or version the image URL. |
| All routes share one generic preview | Project-specific sharing loses context | Generate route-level previews from validated project metadata and keep a global fallback only for unknown routes. |
| No visual regression cases | Font or renderer changes silently alter layouts | Keep a small fixture set and review output after dependency, font, or template changes. |

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
| Canvas | Consistent target dimensions | Verified in the production-like route or documented as not applicable |
| Safe zone | Text and logo away from crop edges | Verified in the production-like route or documented as not applicable |
| Typography | Bundled font and defined wrapping | Verified in the production-like route or documented as not applicable |
| Contrast | Readable on varied artwork | Verified in the production-like route or documented as not applicable |
| Manifest | Required route fields validated | Verified in the production-like route or documented as not applicable |
| Fallback | Intentional default and logged use | Verified in the production-like route or documented as not applicable |
| Escaping | SVG text safely encoded | Verified in the production-like route or documented as not applicable |
| Output | Deterministic filenames | Verified in the production-like route or documented as not applicable |
| Dimensions | Explicit width and height metadata | Verified in the production-like route or documented as not applicable |
| Absolute URL | Public HTTPS image URL | Verified in the production-like route or documented as not applicable |
| MIME type | Correct response header | Verified in the production-like route or documented as not applicable |
| Weight | Enforced file-size budget | Verified in the production-like route or documented as not applicable |
| Cache | Versioning strategy documented | Verified in the production-like route or documented as not applicable |
| Tests | Long-title and Unicode fixtures | Verified in the production-like route or documented as not applicable |
| Visual QA | Thumbnail-scale review | Verified in the production-like route or documented as not applicable |

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

```ts
const dimensions = { width: 1200, height: 630 };
const safeMargin = 64;
// Keep title and brand mark inside the safe area for cross-platform crops.
```


```html
<meta property="og:title" content="Transit App Case Study">
<meta property="og:description" content="Research and interaction design decisions.">
<meta property="og:image" content="https://portfolio.example/social/transit-app-v2.png">
```


```js
if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) {
  throw new Error("Social preview asset is missing or served with the wrong type");
}
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
