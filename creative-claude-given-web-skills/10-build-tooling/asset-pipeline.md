# Asset Pipeline

**Layer:** 10 — Build Tooling / Architecture  
**Skill slug:** `asset-pipeline`  
**Focus:** Designing a repeatable path from source media to optimized, versioned, accessible, and correctly deployed website assets.

## Goal

Build an asset pipeline that makes image, video, font, icon, and downloadable-file delivery predictable across local development, CI, preview deployments, and production. The pipeline should preserve visual quality while controlling bytes, dimensions, formats, cache behavior, and URL correctness. It should also give developers a reliable way to discover where an asset came from, how it is transformed, and which output is safe to ship.

## Why This Matters

Asset delivery failures are often mistaken for styling or hosting problems because they appear at the point where a visitor sees the page. A hero image may work in development but 404 under a nested deployment path; a 7 MB photograph may delay the largest contentful paint; a font may flash or fail because its CORS headers are wrong; an SVG may contain scripts or external references; a video may monopolize mobile bandwidth; and a build may publish a stale asset because the output directory was not cleaned. Each of these failures has a different owner and requires a different diagnostic path. A deliberate pipeline makes the asset's source, transformation, output URL, caching policy, and runtime usage explicit.

The pipeline is not a one-time image-compression step. It is a contract between design, development, build tooling, hosting, and the browser. Source files should remain editable and attributable. Generated variants should be reproducible rather than hand-maintained. Public files should have stable, intentional URLs, while imported files should participate in the bundler's dependency graph and receive production-safe URLs. Responsive images should send an appropriate candidate for the viewport and pixel density, not merely shrink a large source with CSS. Fonts should load with a controlled subset and sensible fallback. Videos should have a poster, captions where speech matters, and playback behavior that respects user preferences and data constraints.

A strong pipeline also limits accidental complexity. Not every SVG needs a plugin; not every image needs a runtime transformation service; not every file should be copied to `public`; and not every asset should receive an opaque hash-free filename. Choose a rule that fits the deployment model, document exceptions, and test the generated output. The goal is not maximal tooling. The goal is that a teammate can add a project image, run the documented command, inspect the output, and know the asset will load efficiently at the real URL.

## Operating Principles

- Keep original source assets separate from generated derivatives; do not destructively overwrite source files.
- Choose imported assets when code references them and content-addressed caching is useful; choose public assets when stable literal paths are required.
- Optimize by measured role: hero, thumbnail, inline illustration, icon, font, video, or downloadable original.
- Prefer responsive source selection over using CSS to scale a single oversized file.
- Preserve accessible alternatives: meaningful alt text, captions, labels, and useful fallback behavior.
- Treat URL base paths, MIME types, CORS, cache headers, and case sensitivity as pipeline concerns.
- Make transformations deterministic and reviewable; pin versions for tools used in CI.
- Verify the built output and a deployed preview, not only the development server.

## Core Concepts

### 1. Classify Assets Before Choosing a Pipeline

Asset strategy starts with usage, not file extension. The same photograph may be a full-bleed hero, a card thumbnail, and a downloadable original. Those are three delivery requirements even if they originate from one source. Record the role, dimensions, expected display size, criticality, accessibility meaning, and cache expectations. This prevents an all-purpose `images/` folder from becoming an undocumented set of exceptions.

A useful inventory includes source path, media type, intrinsic dimensions, file size, owner or license, output variants, and pages that reference the file. The inventory can be a simple CSV for a small portfolio or metadata in a content collection for a larger project. Avoid inventing elaborate infrastructure before the number of assets justifies it; a short manifest and a naming convention often eliminate most confusion.

```text
src/assets/
  projects/aurora/source.jpg
  projects/aurora/card-640.webp
  projects/aurora/hero-1600.avif
  icons/arrow-up.svg
public/
  documents/press-kit.pdf
  favicon.svg
```

The example illustrates roles rather than prescribing a universal folder tree. In a real pipeline, generated variants should ideally be produced by a script or image service, not manually edited and committed without a clear reason. If the project commits generated outputs, document how they are regenerated and ensure CI can detect drift.

**Gotcha:** A filename such as `final-final-2.webp` does not explain whether it is a source, a compressed export, or a viewport-specific derivative. Name by content identity and role, or keep the role in a manifest. File names should aid maintenance without becoming a substitute for metadata.

### 2. Imported Assets Versus Public Assets

Bundlers distinguish assets that are part of the module graph from files copied as-is. In Vite, an image imported from source code can be fingerprinted and its final URL returned to the application. Files under `public/` are served or copied without being imported through the module graph and are referenced by their public URL. This distinction affects hashing, transformations, refactoring, and deployment under a base path.

Use imports for assets tied to a component or module. This allows the bundler to discover references, emit hashed files, and fail the build when a referenced local file is missing. Use the public directory for assets that require a stable name or are referenced by external systems, such as `robots.txt`, a manifest, or a PDF whose URL is printed in a brochure. Do not put every image in `public` simply because the path is easy to type; that forfeits some build-time guarantees.

```js
// src/components/ProjectCard.js
import coverUrl from '../assets/aurora-cover.webp';

export function ProjectCard() {
  const image = document.createElement('img');
  image.src = coverUrl;
  image.alt = 'Aurora installation in a dark gallery';
  return image;
}
```

```html
<!-- A public file has a literal public URL. For Vite, use BASE_URL when
     constructing paths in JavaScript if the app may deploy below a subpath. -->
<img src="/favicon.svg" alt="" />
```

The public example is root-relative, so it assumes domain-root hosting. For nested deployments, use the framework's documented base-path mechanism instead of assuming `/` is always the application root. Never use a source import path as if it were a public URL; they are resolved by different systems.

**Gotcha:** Moving an asset from imported source to `public/` can silently change its production URL and cache behavior even if the development page still looks correct. Treat such a move as a deployment change and retest output paths.

### 3. Image Dimensions, Responsive Variants, and `srcset`

The browser should select a source close to the rendered size and device pixel ratio. A 2400-pixel-wide image used in a 360-pixel card sends unnecessary bytes unless the browser can select a smaller candidate. CSS width controls presentation, not the intrinsic file transferred over the network. Generate a deliberate family of widths, commonly something like 480, 800, 1200, and 1600 pixels when the design actually needs those sizes. The exact set should come from layout breakpoints and content, not a ritual list.

Use `srcset` with width descriptors and a matching `sizes` attribute. `sizes` tells the browser the expected CSS slot width at different viewport conditions; without it, the browser may choose an unnecessarily large candidate. Keep the fallback `src` valid. Do not put unrelated crops into a width-based `srcset` unless the art direction remains equivalent; use `<picture>` and `<source media>` when a mobile crop should differ from a desktop crop.

```html
<img
  src="/images/studio-800.webp"
  srcset="/images/studio-480.webp 480w,
          /images/studio-800.webp 800w,
          /images/studio-1200.webp 1200w,
          /images/studio-1600.webp 1600w"
  sizes="(max-width: 640px) 100vw,
         (max-width: 1100px) 50vw,
         560px"
  width="1600"
  height="1067"
  alt="The studio's sunlit worktable"
/>
```

Intrinsic `width` and `height` reserve an aspect ratio before the image loads, reducing layout shifts. They do not force the image to render at those CSS dimensions. Use CSS such as `width: 100%; height: auto` or a deliberate `object-fit: cover` container. If candidates have different crops, preserve the same meaning and use `<picture>` for art direction.

**Gotcha:** `srcset` is not an instruction to download every candidate. It is a candidate list from which the browser selects. Test in browser developer tools at several viewport widths and with network throttling rather than judging only from the source markup.

### 4. Format Selection and Quality Budgets

Use modern formats where they improve the balance of quality and bytes, but preserve a reliable fallback for environments that do not support the preferred format. WebP and AVIF are common photographic formats; JPEG remains useful as a fallback; PNG is useful when lossless pixels or alpha are needed, though it is often wasteful for photos; SVG is suitable for vector artwork and icons when its content is safe and its complexity is reasonable. Animated formats should be chosen with care because an animated GIF can be many times larger than a video or modern animation format.

Format selection should be based on content type. Photographs, flat illustrations, transparent logos, and screenshots behave differently under compression. AVIF can be excellent for photos but may encode more slowly. WebP often provides a practical compromise. PNG may be necessary for pixel-accurate screenshots or certain alpha workflows. Avoid converting every file to one format automatically and assuming the result is optimal.

```html
<picture>
  <source
    type="image/avif"
    srcset="/images/exhibit-800.avif 800w,
            /images/exhibit-1400.avif 1400w"
    sizes="(max-width: 700px) 100vw, 70vw"
  />
  <source
    type="image/webp"
    srcset="/images/exhibit-800.webp 800w,
            /images/exhibit-1400.webp 1400w"
    sizes="(max-width: 700px) 100vw, 70vw"
  />
  <img src="/images/exhibit-1400.jpg" width="1400" height="933"
       alt="A sculptural installation in a bright room" />
</picture>
```

Set quality by visual inspection at actual display size, then record an agreed maximum byte budget by role. A hero photograph might have a different limit from a 120-pixel thumbnail. Do not treat a quality number as portable across encoders: quality 75 in one tool does not necessarily equal quality 75 in another. Review artifacts around gradients, fine textures, faces, text embedded in images, and transparency edges.

**Gotcha:** The smallest file is not always the best output. Banding, ringing, noisy edges, and damaged typography can make an optimized portfolio look unprofessional. Optimize to a quality threshold, not bytes alone.

### 5. Image Transformation and Reproducible Generation

A transformation pipeline should be deterministic: given the same source and configuration, it should produce the same set of named outputs, or at least outputs with equivalent behavior and a traceable tool version. Common transformations include resize, crop, format conversion, quality adjustment, metadata stripping, and generation of blur placeholders. Choose a local CLI, build plugin, CMS image service, or hosted image CDN according to the project's size and deployment constraints.

For a local script, keep source images untouched and write outputs to a generated directory. Fail on missing input rather than silently skipping it. Log output dimensions and byte size so regressions are visible. A simple command using a known tool is easier to maintain than a custom image-processing framework written for a small portfolio. If using a library, pin it through the project's package manager and verify its platform support in CI.

```json
{
  "scripts": {
    "assets:check": "node scripts/check-assets.mjs",
    "assets:build": "node scripts/build-assets.mjs",
    "build": "npm run assets:check && vite build"
  }
}
```

These are project-owned script names, not built-in Vite commands. The scripts must exist in the repository for the package scripts to work. Keep the asset generation step separate from the framework build when it has different dependencies or produces a large set of variants. If outputs are generated before bundling, define whether they are committed, ignored, or produced only in CI.

**Gotcha:** A script that writes generated files into the same folder as source files can overwrite originals or repeatedly recompress already-compressed images. Enforce separate input and output paths, and make destructive operations opt-in.

### 6. Fonts: Formats, Subsets, and Loading Strategy

Fonts are assets with layout consequences. Large font families, multiple weights, and broad language coverage can add substantial bytes and delay text rendering. Use WOFF2 for modern web delivery where available, subset language ranges when licensing and build tools allow it, and include only weights and styles actually used. Variable fonts can reduce file count, but one variable file may still be large; measure the real transfer size and verify browser support for the font's axis behavior.

Use `font-display` deliberately. `swap` makes fallback text visible quickly but can cause a visual change when the web font arrives. `fallback` and `optional` have different timing behavior and should be selected based on brand needs and performance. Set fallback fonts with similar metrics to reduce layout movement. Preload only fonts that are truly critical for above-the-fold rendering, and ensure the preload URL, type, and `crossorigin` behavior match the eventual font request. Over-preloading can compete with the hero image and other important resources.

```css
@font-face {
  font-family: "Studio Sans";
  src: url("/fonts/studio-sans-latin.woff2") format("woff2");
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
}

:root {
  font-family: "Studio Sans", "Helvetica Neue", Arial, sans-serif;
}
```

The weight range is appropriate only if the file is actually a variable font. For a static font file, declare its real weight such as `400` or `700`; claiming a range does not turn a static font into a variable one. If a font is cross-origin, configure the host's CORS response correctly. Self-hosting can improve control but does not remove license obligations.

**Gotcha:** A font can return HTTP 200 and still fail to load because the MIME type, CORS policy, or file contents are wrong. Inspect the console and network response, not only the status code.

### 7. SVG Safety, Sprites, and Icon Strategy

SVG is a text-based vector format, which makes it scalable and easy to theme, but also means it can contain more than simple paths. Treat externally supplied SVG as untrusted input. Remove scripts, event-handler attributes, unexpected foreign objects, and external references before shipping. A sanitization tool must be configured and tested; a filename ending in `.svg` is not proof that the content is safe.

Use inline SVG when the application needs to style individual paths, animate parts, or expose a precise accessible name. Use an external image URL for decorative or static artwork when it does not need internal styling. An SVG sprite can reduce repeated markup for many icons, but it introduces symbol naming, cache, and accessibility considerations. Do not build a sprite system for four icons if a few small files are simpler.

```html
<!-- Decorative icon: hide it from assistive technology because adjacent text
     already names the action. -->
<button type="button">
  <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
    <path d="M5 12h14M13 6l6 6-6 6" fill="none"
          stroke="currentColor" stroke-width="1.8" />
  </svg>
  View project
</button>
```

If an icon alone communicates a control's purpose, provide an accessible name on the button, not a vague label on the SVG path. Avoid `title` as the only naming strategy for critical controls. Preserve `viewBox`, set dimensions or CSS sizing, and use `currentColor` when theming is desired. Verify that optimization tools do not remove IDs required by gradients, masks, or symbol references.

**Gotcha:** SVGO and similar optimizers can change IDs and remove metadata. This is generally helpful, but it can break references if multiple optimized SVGs are concatenated or if the application relies on IDs. Test complex artwork after optimization.

### 8. Video, Audio, Posters, and Captions

Video is often the heaviest asset on a creative site. Choose resolution and bitrate based on the displayed size, provide a poster image, and avoid autoplay with sound. Background loops should be muted, short, and nonessential to understanding the page. On mobile, consider a static poster or a lower-bandwidth alternative. If video contains meaningful speech or information, provide captions or a transcript. Audio should have controls and must not begin unexpectedly.

```html
<video
  controls
  preload="metadata"
  poster="/media/reel-poster.webp"
  width="1280"
  height="720"
>
  <source src="/media/reel.webm" type="video/webm" />
  <source src="/media/reel.mp4" type="video/mp4" />
  <track kind="captions" src="/media/reel.en.vtt" srclang="en" label="English" />
  Your browser does not support embedded video.
</video>
```

For a decorative loop, use `muted` and `playsinline` if autoplay is required, and respect reduced-motion preferences by offering a static alternative or disabling movement. Do not assume `preload="none"` or `metadata` will be honored identically by every browser in every context; it is a hint. Test actual network behavior and ensure the poster carries the intended visual composition when the video has not loaded.

Use a streaming service or adaptive streaming format when long-form or high-resolution media warrants it. A single MP4 may be adequate for a short reel, but it should not be the default for a large video library. Keep content licensing and privacy implications in mind when embedding third-party video players.

**Gotcha:** A visually attractive autoplay background can create motion discomfort, consume data, and compete with the main content. Make sure the page remains complete and understandable if the video never downloads.

### 9. Asset URLs, Base Paths, and Deployment Roots

A path that works at `https://example.com/` can fail at `https://example.com/portfolio/`. Root-relative URLs begin at the origin root; relative URLs resolve against the current document URL; imported assets are generally rewritten by the bundler. These behaviors are not interchangeable. A pipeline must know the hosting model: domain root, subpath, CDN, or a combination of origin and asset host.

In Vite, configure `base` when the application is deployed under a known subpath, and use `import.meta.env.BASE_URL` for runtime-built public paths. In other frameworks, use the framework's documented asset-prefix or base-path option; do not copy configuration names across frameworks. Test a production build at the real deployment prefix, including direct navigation to nested routes and refreshing those routes.

```js
// vite.config.js — valid minimal configuration for a known subpath.
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/portfolio/',
});
```

The base must match the deployed prefix, including leading and trailing slashes as appropriate. If the site may be deployed at multiple prefixes, decide whether to build per environment or use a deployment strategy that supports relative output paths. A base-path change is not merely a server setting: it affects URLs emitted into HTML, CSS, JavaScript, and asset manifests.

**Gotcha:** A homepage can load correctly while an image inside a nested route breaks because a relative URL is resolved relative to that route. Prefer bundler-generated URLs or explicit base-aware URL construction for assets.

### 10. Cache Headers, Fingerprints, and Invalidation

Caching is part of asset correctness. Content-hashed filenames allow long-lived immutable caching because a changed file receives a new URL. Stable filenames such as `/logo.svg` need a different strategy because the browser or CDN may retain an old response after the file changes. HTML usually needs shorter caching than fingerprinted assets because it points to the current set of hashes.

A typical policy is to serve fingerprinted static assets with a long `max-age` and `immutable`, while HTML is revalidated or given a shorter lifetime. The exact header is a hosting decision, not something Vite automatically guarantees for every deployment provider. Ensure the hosting configuration, CDN rules, and service worker do not conflict. Never put a long immutable cache header on a mutable stable URL unless the update process includes a reliable version change.

```http
# Example policy for a fingerprinted asset; configure this in the host/CDN.
Cache-Control: public, max-age=31536000, immutable
```

The snippet illustrates an HTTP response header, not a file to paste into JavaScript. For HTML, a common strategy is `Cache-Control: no-cache` so the browser can revalidate; this does not mean the response cannot be cached. Static asset policies should be validated in the actual response headers after deployment.

**Gotcha:** Clearing a browser cache is not a sustainable release strategy. Correct fingerprinting and cache headers let old and new versions coexist safely while HTML references the correct asset set.

### 11. Content Security, Licensing, and Provenance

An asset pipeline handles content that may come from designers, clients, stock libraries, CMS uploads, AI tools, or third-party packages. Track license terms, attribution requirements, allowed modifications, and restrictions on redistribution. A website launch should not depend on a file whose license or source is unknown. Keep a provenance record for externally sourced fonts, stock imagery, icons, and video, especially when the deliverable will be handed off or resold.

Security matters too. Avoid rendering untrusted SVG inline, avoid embedding user-uploaded HTML as an asset, and do not let filenames or metadata become unsanitized HTML. Set appropriate content types and consider Content Security Policy for script and media sources. If a CMS or upload endpoint is involved, validate allowed MIME types and inspect file contents rather than trusting extensions alone. A malicious file can claim to be an image while containing unexpected data.

```text
assets-manifest.csv columns:
source_path,license,attribution,owner,usage_scope,generated_variants
```

A manifest is not a legal substitute for reading the license. It is a way to make the review process visible and repeatable. When licensing is uncertain, replace the asset or obtain written permission rather than assuming that public availability means commercial use is permitted.

**Gotcha:** Optimizing a licensed asset does not automatically grant the right to redistribute it. Transformation and deployment remain subject to the original license.

### 12. Asset Budgets, Manifests, and CI Enforcement

An asset budget converts a vague performance goal into a check that can fail before release. Set budgets by role: total critical image bytes, hero image dimensions, font transfer size, total video bytes loaded on initial view, count of font files, and number of oversized raster files. The correct numbers depend on the project, audience, and network conditions; choose explicit thresholds and tune them from real measurements. A portfolio can start with a 250 KB target for a hero image at a common desktop width, a 100 KB target for a card thumbnail, and no more than two font files on the initial route, then adjust after visual review and field data.

A manifest can connect each asset to its intended role, alt text guidance, generated variants, and budget. Automated checks can detect missing files, suspicious extensions, files larger than a configured limit, duplicate hashes, and references to files that are not emitted. They cannot reliably decide whether alt text is meaningful or whether compression artifacts are acceptable; keep human review for those concerns.

```js
// scripts/check-assets.mjs — simple size gate for a source directory.
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('public/images');
const maxBytes = 500 * 1024;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath);
    } else {
      const info = await stat(fullPath);
      if (info.size > maxBytes) {
        console.error(`${fullPath}: ${(info.size / 1024).toFixed(1)} KB exceeds 500 KB`);
        process.exitCode = 1;
      }
    }
  }
}

await walk(root);
```

This checker assumes `public/images` exists. A production-ready version should report a clear error if the directory is missing, accept limits by asset class, and inspect the final emitted bundle as well as source files. It checks raw file size only; it does not know whether the asset is critical, whether it is referenced, or whether a 600 KB video is more appropriate than a 300 KB video at the same quality.

**Gotcha:** A source-size gate can pass while the deployed page still downloads too much because of duplicate variants, CSS background images, font requests, or third-party embeds. Measure network requests for real pages and keep a human-reviewed budget report.

## Development and Production Differences

During development, a framework may serve original assets, transform modules on demand, or expose files directly from a public directory. The browser's request paths can therefore differ from the final emitted paths. Production builds commonly fingerprint imported assets, rewrite references, minify CSS, and copy public files. Hosting then adds another layer: redirects, CDN caching, MIME types, compression, CORS, and base-path behavior. A local dev server does not prove that the host is configured correctly.

Use a deliberate verification sequence:

1. Run the asset checks against source files.
2. Generate image or font derivatives using the documented, pinned toolchain.
3. Build from a clean checkout with the lockfile installed.
4. Inspect the output directory and confirm expected files were emitted.
5. Serve the production output locally using the framework's supported preview command where available.
6. Deploy to a preview URL that matches the production base path and headers.
7. Inspect network requests, console errors, image candidates, response MIME types, and cache headers.
8. Test on a narrow viewport and with throttled network conditions.

For Vite, `npm run build` runs the project's build script and `npm run preview` runs a preview server if those scripts are configured. Preview is useful for testing generated files, but it is not a substitute for testing the actual production host. For Next.js or Astro, use the framework's build and preview/start commands according to the selected output mode; do not assume a static output and a server-rendered output have the same asset behavior.

## Debugging Workflow

Start from the failing request, not from a broad guess about the bundler. Record the exact URL, request initiator, response status, content type, and whether the URL differs between development and production. A 404 often points to a bad path or missing emitted file; a 200 with an image decode error can indicate an incorrect MIME type or a non-image response; a font failure may involve CORS or a malformed font; and an asset that is old despite a successful response may indicate caching or a stable filename.

When a URL is wrong, identify which system authored it: source import, CSS `url()`, HTML literal, framework helper, CMS content, or CDN rewrite. Fix the owning layer. Do not patch the output file by hand because the next build will replace it. When a file is missing from the output directory, check whether it was imported, placed in the correct public directory, excluded by a script, or generated only on a developer's machine. If the file exists but is absent from the deployed site, inspect the deployment artifact and publish directory.

When performance is poor, inspect transfer size and timing before changing format. Determine whether the resource is requested early, duplicated, blocked by CSS, or discovered only after JavaScript runs. For a hero image, verify the browser chose the right candidate and that the request is not delayed by a late client render. For fonts, check the number of weights and whether preload is justified. For video, check whether the browser downloads the full media file before user interaction.

## Named Implementation Patterns

### Pattern 1 — Source and Generated Output Separation

**What it does:** Keeps editable originals apart from compressed, resized, or converted outputs.  
**When to use it:** Any project that generates multiple variants or needs reproducible optimization.

```text
assets-source/       # original, retained inputs
assets-generated/    # deterministic derivatives
src/                 # code imports selected outputs or build inputs
```

Make the generation command explicit, preserve the original dimensions and license record, and ensure CI can rebuild the derivatives. If generated files are committed, verify that regeneration does not introduce unexplained changes. This pattern prevents repeated lossy compression and accidental destruction of source media.

### Pattern 2 — Role-Based Responsive Image Family

**What it does:** Produces a small set of widths for a known layout role and allows browser source selection.  
**When to use it:** Project cards, editorial images, galleries, and hero media with stable layout slots.

```html
<img src="/media/work-800.webp"
     srcset="/media/work-480.webp 480w, /media/work-800.webp 800w, /media/work-1400.webp 1400w"
     sizes="(max-width: 700px) 100vw, 50vw"
     width="1400" height="900" alt="A modular timber pavilion" />
```

The candidate family should be generated from one approved source and use consistent crops unless art direction requires `<picture>`. Validate the chosen resource in the browser rather than assuming `sizes` is correct from its syntax alone.

### Pattern 3 — Base-Aware Public URL

**What it does:** Builds public asset paths using the configured deployment base instead of assuming domain-root hosting.  
**When to use it:** Vite applications deployed to a project subpath or a configurable static host.

```js
const posterUrl = `${import.meta.env.BASE_URL}media/poster.webp`;
```

Use this only in a Vite context where `import.meta.env.BASE_URL` is available. Frameworks expose different helpers. Test the resulting URL after a production build and watch for doubled or missing slashes.

### Pattern 4 — Content-Hashed Immutable Asset

**What it does:** Lets changed content receive a changed URL so long-lived caches remain safe.  
**When to use it:** Bundled CSS, JS, images, and fonts that the build tool fingerprints.

```text
hero.8fd31c2a.webp  -> Cache-Control: public, max-age=31536000, immutable
index.html          -> short cache or revalidation policy
```

The host must actually emit the header, and the filename must be content-addressed or otherwise versioned. Do not apply immutable caching to a mutable filename simply because the file is in an assets folder.

### Pattern 5 — Critical Resource Preload with Restraint

**What it does:** Hints that a genuinely critical font or image should be discovered early.  
**When to use it:** Only when measurements show a key resource is discovered too late and the preload target is stable.

```html
<link rel="preload" as="image" href="/media/hero-1200.avif" type="image/avif" />
```

Preload must match the resource the page will actually use. If responsive candidates are used, use the appropriate responsive preload attributes supported by the target browsers, or avoid preloading and let the browser select the candidate. Excessive preloads compete with CSS, scripts, and other important requests.

### Pattern 6 — Manifest-Driven Budget Gate

**What it does:** Makes asset roles, expected outputs, and size limits reviewable by people and scripts.  
**When to use it:** A portfolio with many projects, a team pipeline, or a build where regressions are expensive.

```json
{
  "heroMaxBytes": 256000,
  "thumbnailMaxBytes": 102400,
  "fontFileCountMax": 2,
  "requiredFiles": ["public/favicon.svg", "public/robots.txt"]
}
```

This is an example project-owned manifest, not a built-in bundler configuration. Write a validator that reads it and returns a nonzero exit code for violations. Keep limits explicit and reviewable rather than hiding them inside multiple scripts.

### Pattern 7 — Accessible Media Fallback

**What it does:** Keeps meaning and core functionality available when an asset cannot load or motion is unwanted.  
**When to use it:** Video heroes, animated illustrations, icon-only controls, and media that conveys information.

```html
<video muted playsinline loop poster="/media/scene-poster.webp">
  <source src="/media/scene.webm" type="video/webm" />
  <source src="/media/scene.mp4" type="video/mp4" />
</video>
<p class="visually-hidden">A short description of the visual scene.</p>
```

A visually hidden description should be included only when the video conveys information not already available in nearby text. Decorative media should not add redundant announcements. For meaningful speech, provide captions or a transcript rather than relying on a general scene description.

### Pattern 8 — Clean Build Artifact Verification

**What it does:** Checks the files that will actually be deployed, not only the source tree.  
**When to use it:** Every release pipeline, especially after changing asset plugins, base paths, or output directories.

```bash
rm -rf dist
npm run build
find dist -type f -maxdepth 4 | sort
npm run preview
```

Use the clean command only when `dist` is the intended generated output directory. Verify the build script before running it, and do not delete a directory that contains hand-maintained content. A clean build catches stale generated files that can hide a broken asset pipeline.

## Common Mistakes

| Mistake | Why it fails | Fix |
|---|---|---|
| A. Sending a desktop image to every viewport | CSS scaling does not reduce transferred bytes. | Generate responsive candidates and validate `sizes` against real layout slots. |
| B. Using root-relative URLs on a subpath deployment | `/media/x.webp` points to the origin root, not `/portfolio/`. | Use imports or the framework's base-aware public URL helper. |
| C. Moving every file into `public/` | Build-time reference checking and fingerprinting may be lost. | Import code-owned assets; reserve public files for stable literal paths. |
| D. Hand-editing files in the output directory | The next build overwrites the edit. | Fix the source, generation script, or hosting configuration. |
| E. Recompressing generated output as new input | Repeated lossy encoding degrades image quality. | Keep source and derivative directories separate. |
| F. Preloading every font weight | Critical requests compete for bandwidth and decoding. | Preload only a measured, above-the-fold font that is actually used. |
| G. Declaring a static font as variable | The browser cannot create weights absent from the font file. | Declare the real weight or use a verified variable font. |
| H. Optimizing SVG without regression tests | IDs, masks, or gradients can break. | Test complex artwork and configure the optimizer for required references. |
| I. Trusting an SVG extension | The content may include unsafe scripts or references. | Sanitize untrusted SVG and restrict accepted upload content. |
| J. Applying immutable caching to stable URLs | Visitors can retain old content indefinitely. | Use fingerprinted URLs or explicit versioning for long-lived cache headers. |
| K. Assuming local dev proves deployment | Dev servers can rewrite paths and bypass production headers. | Test a production build and a preview deployment at the real base path. |
| L. Omitting image dimensions | Late image layout can shift nearby content. | Set intrinsic width and height or reserve the correct aspect ratio in CSS. |
| M. Using `loading="lazy"` on the LCP image | The browser may defer the most important image. | Keep the likely LCP image eager; lazy-load below-the-fold media. |
| N. Lazy-loading every image without checking | Some visible images may appear late and harm perceived quality. | Lazy-load only images that start outside the initial viewport. |
| O. Forgetting video captions | Speech or meaningful audio becomes inaccessible. | Provide a captions track and/or transcript for meaningful media. |
| P. Serving a font with incorrect CORS | Browser blocks the font even when the file exists. | Configure allowed origins and verify the actual response headers. |
| Q. Relying on filename case-insensitivity | Linux hosts commonly treat case as significant. | Match import and file casing exactly; test on the deployment platform. |
| R. Keeping duplicate full-resolution variants | Extra files increase storage and invite accidental downloads. | Generate only documented widths and remove unreferenced derivatives. |
| S. Setting a quality value without visual review | Different encoders and content produce different artifacts. | Inspect representative outputs at their actual display sizes. |
| T. Treating `vite preview` as production hosting | It does not reproduce all CDN, rewrite, and caching behavior. | Use preview for build inspection and a real deployment for host validation. |
| U. Ignoring content licensing | Publicly available assets may not be licensed for redistribution. | Record provenance and confirm usage rights before shipping. |
| V. Trusting a source-only size check | CSS and runtime requests can still duplicate or inflate downloads. | Inspect the production network waterfall and emitted files. |
| W. Using `srcset` without correct `sizes` | The browser may choose an oversized candidate. | Describe the rendered slot at each relevant breakpoint. |
| X. Publishing stale output files | Old files can hide missing current outputs or confuse cache behavior. | Build into a clean generated directory and deploy that directory only. |

## 13. Choose Loading Priority by User Experience

Asset loading priority should follow what the user needs first. The likely largest contentful paint image should be discoverable early and should not be lazy-loaded if it is visible at initial render. Images below the fold can usually use native lazy loading. Avoid adding `fetchpriority="high"` to multiple unrelated images because priority hints only help when used selectively. A large decorative background hidden behind a modal is not automatically critical just because it is visually large in source code.

```html
<img src="/media/hero-1200.webp"
     width="1200" height="760"
     fetchpriority="high"
     alt="A sculptural chair beside a sunlit window" />

<img src="/media/project-detail-800.webp"
     width="800" height="600"
     loading="lazy"
     alt="Close-up of the chair's joinery" />
```

Use high priority only when measurement and page structure support it. For responsive images, ensure the high-priority request can select the correct candidate. Do not combine eager loading, preload, and high priority reflexively; each mechanism should have a reason. Measure the initial request waterfall to confirm the intended resource is discovered early and does not crowd out essential CSS.

**Gotcha:** An image may be the LCP element on desktop but not on mobile. Test the actual responsive layout and avoid global rules that assume the same critical asset for every viewport.

## 14. Background Images, CSS URLs, and Discovery

CSS background images are appropriate for decorative surfaces, textures, and art-directed compositions that do not need alternative text. They are less suitable for content images because the browser and assistive technology do not treat them like semantic `<img>` elements. Background assets can also be discovered later if their CSS is loaded late, and responsive background URLs need explicit media or image-set rules.

```css
.hero {
  background-image: image-set(
    url('/media/hero-1x.webp') 1x,
    url('/media/hero-2x.webp') 2x
  );
  background-position: center;
  background-size: cover;
}
```

The `image-set()` example is for a decorative background and assumes the paths are valid at the deployed URL. When assets are imported from source CSS, the bundler may rewrite URLs; a literal public path follows public URL rules. Use `<picture>` or `<img>` when you need alt text, responsive art direction, intrinsic dimensions, or native loading controls. For a CSS background that is essential to the first viewport, verify when the stylesheet and image are requested.

**Gotcha:** A CSS background has no native alt text. If the image communicates content, use semantic markup or provide the equivalent information elsewhere.

## 15. Duplicate Detection and Cleanup

Duplicate assets often enter a project through repeated exports, renamed downloads, copied CMS files, or separate team members saving the same source. Exact byte duplicates can be found with hashes; visually similar images require more nuanced review because different crops or compression settings may be intentional. Do not automatically delete every duplicate-looking file. First check references, licenses, crop differences, and whether the same content is served from a CMS or CDN.

A safe cleanup process creates a report, identifies references, removes dead files in a dedicated change, and validates all routes afterward. If an asset is generated from a manifest, remove the manifest entry and regenerate outputs rather than deleting only the output file. Otherwise, the next generation run may bring it back. Keep original licensed files when retention is required even if the deployed output uses a smaller derivative.

```bash
# Example inventory command on macOS/Linux; review output before deleting anything.
find public src/assets -type f -print0 | xargs -0 shasum -a 256 | sort
```

Hash inventories can reveal exact duplicate bytes but not semantic duplicates. Keep the report in the pull request or release notes when cleanup is substantial. Automated deletion should be avoided unless the pipeline can prove that the file is unreferenced and not needed by an external URL.

## 16. Build Challenge: Ship a Reliable Portfolio Asset Set

Implement the following as a focused practice task. The challenge should be completed in a small repository with a Vite-based site, but the asset strategy should be documented well enough to transfer to another framework.

1. Create an asset inventory for at least 12 assets across photographs, icons, fonts, and media.
2. Record the source, license or origin, intended role, and accessibility treatment for each asset.
3. Keep original source images separate from generated derivatives.
4. Generate at least three responsive widths for two photographic assets.
5. Provide a modern format and a fallback for at least one photographic image.
6. Implement correct `srcset` and `sizes` for a card image and a hero image.
7. Add intrinsic dimensions or a CSS aspect-ratio reservation to every content image.
8. Use `loading="lazy"` only for images that are not initially visible.
9. Configure a font-face with a valid format, correct weight declaration, and intentional `font-display` value.
10. Ensure SVGs used in the interface are either trusted source files or sanitized before use.
11. Add a video poster and captions track for a clip with meaningful speech, or document why the clip is decorative.
12. Add a project-owned manifest with explicit image and font size limits.
13. Write a validation script that exits nonzero when a configured budget is exceeded.
14. Add an asset-check command to `package.json` and run it before the production build.
15. Build from a clean checkout using the lockfile and documented Node version.
16. Inspect the generated output and confirm every referenced asset exists.
17. Configure the site for a non-root base path such as `/showcase/` and verify the output paths.
18. Deploy a preview or serve the production output under that base path, not only at `/`.
19. Test a direct nested-route refresh and verify that the correct HTML and assets load.
20. Simulate one failure by renaming a referenced source asset and confirm the build or asset check fails clearly.
21. Simulate a second failure by exceeding an image budget and confirm the CI command returns a nonzero exit status.
22. Inspect the network waterfall at a narrow viewport with throttling enabled.
23. Verify cache headers and MIME types on the actual preview host.
24. Check that the page remains understandable when video does not load and when motion is reduced.
25. Document the commands to regenerate assets, run checks, build, preview, and deploy.

### Build Challenge Acceptance Tests

The challenge is complete only if the failure tests are meaningful. A missing referenced import should not quietly produce a broken page. A budget violation should be reported with the offending path, measured size, and allowed limit. The non-root deployment should not rely on a development-server rewrite that is absent in production. Every generated variant should have a clear source, and the source should remain intact after repeated runs. Include screenshots or a concise test report for responsive candidate selection, visual compression quality, and the final deployed network waterfall.

## 17. Mental Models

1. **An asset is a dependency, not decoration.** It has a source, a transform, a URL, a cache policy, and a runtime role.
2. **CSS sizing changes presentation, not transfer cost.** The browser needs an appropriate source candidate to reduce bytes.
3. **The output directory is the release artifact.** Source-tree correctness does not prove that the deployed files are complete.
4. **A URL is interpreted by a context.** Imports, root-relative paths, relative paths, and framework helpers follow different resolution rules.
5. **A cache key is part of versioning.** Long-lived caching is safe when changed content receives a changed URL.
6. **Optimization is a quality trade-off.** The goal is an acceptable visual result within an explicit byte budget.
7. **Accessibility belongs in the asset contract.** Alt text, captions, control names, and reduced-motion alternatives are not optional post-processing.
8. **Reproducibility beats manual memory.** A script and manifest are safer than relying on a teammate to remember export settings.
9. **Criticality is contextual.** A large image can be noncritical if it is below the fold; a small font can be critical if it blocks visible text styling.
10. **A successful HTTP status is not a complete diagnosis.** MIME, CORS, decoding, caching, and content correctness still matter.
11. **Source retention protects future quality.** Keep originals so a new crop or format can be generated without compounding compression loss.
12. **Every exception creates maintenance cost.** Record why an asset bypasses the standard pipeline and when that exception should be revisited.

## 18. Quick Reference

| Need | Preferred approach | Verify |
|---|---|---|
| Component-owned image | Import from source | Emitted URL and fingerprint |
| Stable public file | Public directory | Base path and stable URL |
| Responsive photo | `srcset` plus `sizes` | Selected candidate in Network panel |
| Different mobile crop | `<picture>` with media sources | Art direction at breakpoint |
| Photographic compression | AVIF/WebP plus fallback where needed | Visual quality and transferred bytes |
| Transparent logo | SVG or suitable raster with alpha | Safe content and crisp edges |
| Web font | WOFF2, required weights only | CORS, MIME, fallback, layout shift |
| Critical hero | Eager loading and measured priority | LCP element and request timing |
| Below-fold image | Native lazy loading | No visible loading gap near viewport |
| Decorative video | Poster, muted playback, fallback | Reduced motion and mobile behavior |
| Long-lived cache | Fingerprinted URL plus immutable header | Actual response headers |
| Subpath hosting | Framework base-aware URL handling | Production build under prefix |
| Asset regression | Manifest and CI size gate | Nonzero exit on violation |
| Duplicate media | Hash inventory and reference audit | No broken routes after cleanup |
| External source | Provenance and license record | Usage rights before release |

## Definition of Done / Success Criteria

- [ ] Source assets and generated derivatives are clearly separated or their generation process is explicitly documented.
- [ ] Every shipped asset has an intentional role, correct URL, and known origin or license status.
- [ ] Responsive photographs use suitable candidates and correct `sizes` where multiple widths are available.
- [ ] Content images reserve layout space and provide accurate alternative text; decorative images are hidden from assistive technology when appropriate.
- [ ] Font files, weights, fallbacks, loading behavior, and cross-origin responses have been checked.
- [ ] SVG and media files have been reviewed for safety, accessibility, and fallback behavior.
- [ ] Asset budgets are numeric, documented, and enforced by a repeatable command.
- [ ] A clean production build emits every referenced asset and contains no unexplained stale output.
- [ ] The production artifact works at the real deployment base path and on the actual preview host.
- [ ] Cache headers, MIME types, responsive selection, and loading priority have been verified in browser tools.
- [ ] At least one missing-file failure and one budget failure are caught automatically.
- [ ] Another developer can regenerate, validate, build, preview, and deploy the asset set using the documented instructions.


## Operational Review 1: Review Asset Ownership and Change History

For each asset, decide who can approve a replacement and what the replacement must preserve: subject, crop, aspect ratio, transparency, contrast, or brand treatment. A replacement may be technically valid yet alter the composition that the layout depends on. Store this expectation with the component or content entry when it is important. In team workflows, review image changes as product changes, especially for a hero image that dominates the first viewport. Check the diff in both the source file and the browser; binary diffs alone are not informative.

Keep a small manifest field such as `role`, `source`, `license`, and `variants`. When a replacement is committed, ask whether old variants are still referenced and whether the new dimensions satisfy all placements. If content is sourced from a CMS, keep the transformation rules in code or the CMS schema rather than documenting them only in a one-off export note.

**Review prompt:** Can a teammate identify the owner, expected output, failure signal, and verification step for this decision without asking the original author? If not, add a manifest field, test, or concise note.


## Operational Review 2: Choose a Single Transformation Authority

A common source of drift is running the same image through multiple systems: a designer exports a compressed file, a build script recompresses it, and a CDN transforms it again. This can increase processing time, obscure the actual quality setting, and make byte budgets hard to interpret. Select the authoritative stage for resize and format conversion. The browser can still choose among already generated candidates, but it should not be unclear which stage owns crop, dimensions, and quality.

For a static portfolio, local generation plus committed or CI-produced variants may be enough. For a content-heavy site, a CMS or image CDN may own derivatives. Record which system is authoritative and avoid duplicate resizing unless there is a specific reason, such as a CDN producing device-aware variants from original uploads.

**Review prompt:** Can a teammate identify the owner, expected output, failure signal, and verification step for this decision without asking the original author? If not, add a manifest field, test, or concise note.


## Operational Review 3: Validate Dimensions and Aspect Ratios

Intrinsic dimensions communicate aspect ratio to the browser before media is downloaded. They are also useful for validating a manifest: if an expected landscape asset becomes portrait after a replacement, a script can flag the change for review. CSS `object-fit` is a display choice, not a substitute for knowing the crop. For art-directed media, document the focal point and intended crop at each breakpoint.

A dimensions check should distinguish acceptable ratios from exact pixel dimensions. Responsive variants naturally have different widths but often share the same ratio. If a card uses a crop that differs from the original, record that as a distinct art-directed output rather than forcing it into the same family.

**Review prompt:** Can a teammate identify the owner, expected output, failure signal, and verification step for this decision without asking the original author? If not, add a manifest field, test, or concise note.


## Operational Review 4: Keep Alt Text Close to Content

Alt text is usually content metadata, not a property that can be inferred reliably from the filename. A filename like `aurora-hero.webp` may identify the project but not describe what the image communicates. Store the alt text alongside the content record or component props so editors can update it when the image changes. For purely decorative images, use an empty alt attribute; do not write phrases such as 'image of' unless that wording is useful in context.

For galleries, consider whether the visible caption already supplies the same information. Avoid repetitive announcements where an image and its caption say the same thing. An automated audit can identify missing `alt` attributes, but human review is needed to judge whether the alternative is meaningful and concise.

**Review prompt:** Can a teammate identify the owner, expected output, failure signal, and verification step for this decision without asking the original author? If not, add a manifest field, test, or concise note.


## Operational Review 5: Treat Fonts as a Performance and Design System

A font file affects network cost, text metrics, and brand expression. Adding a weight for one small label can increase transfer size and create another request. Review actual computed usage before shipping a font family. A variable font may simplify the stylesheet and reduce request count, but only if the file supports the required axes and its size is reasonable. Fallback metrics matter because a large shift when the web font loads can move buttons, headings, and navigation.

Use the browser's font panel and network panel to determine which files are requested. Test with cache disabled and under a slow connection to see the fallback state. Do not preload every face simply to avoid flashes; instead preload the one or two faces that have a clear first-render benefit and keep the rest discoverable when needed.

**Review prompt:** Can a teammate identify the owner, expected output, failure signal, and verification step for this decision without asking the original author? If not, add a manifest field, test, or concise note.


## Operational Review 6: Make Cache Policy Match URL Stability

A cache policy should be chosen together with filename strategy. Fingerprinted files can be cached aggressively because a content change changes the URL. Stable public URLs may be needed for external links, but then they need revalidation or explicit versioning. HTML has a different role from immutable media because it tells the browser which current asset URLs to request. A CDN may override origin headers, so verify the response seen by visitors.

When a stale asset is reported, inspect the requested URL and response headers before asking the visitor to clear cache. If the URL is identical after content changed, the pipeline may not be fingerprinting the file or the deployment may be serving stale HTML. Fix versioning and headers rather than making cache invalidation a manual release step.

**Review prompt:** Can a teammate identify the owner, expected output, failure signal, and verification step for this decision without asking the original author? If not, add a manifest field, test, or concise note.


## Operational Review 7: Build for the Actual Hosting Shape

The hosting prefix, trailing slash behavior, CDN domain, and route fallback rules all affect asset delivery. A build intended for `/` may not work under `/portfolio/`. An absolute URL can point to the wrong origin, and a relative URL can be interpreted differently on a nested route. Write down the intended deployment shape and test it with production output before launch.

If the deployment prefix changes between environments, make the build configuration explicit and reproducible. Avoid scattered string concatenation for asset URLs; centralize the base-aware helper or use the bundler's generated import URLs. Test direct navigation, refresh, and asset requests on a nested route, not just clicking from the homepage.

**Review prompt:** Can a teammate identify the owner, expected output, failure signal, and verification step for this decision without asking the original author? If not, add a manifest field, test, or concise note.


## Operational Review 8: Measure the Page, Not Only Individual Files

An individual asset can meet its own size limit while the page remains heavy because it loads many images, fonts, embeds, or duplicate sources. Page-level measurement captures discovery order, request count, priority, and transferred bytes. It also reveals whether a file is downloaded even though it is hidden or whether JavaScript delays its discovery.

Use a repeatable test route and viewport. Record a cold-cache run and, where relevant, a warm-cache run. Inspect the Network waterfall and the performance trace; compare the results after changes. A manifest and size gate are useful guardrails, but field and lab measurements are needed to confirm the user experience.

**Review prompt:** Can a teammate identify the owner, expected output, failure signal, and verification step for this decision without asking the original author? If not, add a manifest field, test, or concise note.


## Operational Review 9: Review SVG and Embedded Media as Input

SVG, media metadata, and externally supplied assets should be treated as content that can carry unexpected features. A sanitized SVG can still be visually broken if optimizer settings remove IDs used by a mask or gradient. A media file can have an extension that does not match its content. For uploads, validate the actual format and consider where the file will be served and whether it can be interpreted as active content.

Prefer trusted assets and well-maintained sanitization tools. If users can upload content, establish allowed types, size limits, storage isolation, and server-side validation. Do not solve safety by merely renaming a file or stripping its extension. Keep a regression sample of complex SVGs so optimizer upgrades can be tested.

**Review prompt:** Can a teammate identify the owner, expected output, failure signal, and verification step for this decision without asking the original author? If not, add a manifest field, test, or concise note.


## Operational Review 10: Make Generated Artifacts Auditable

When an asset is generated, a reviewer should be able to understand the source, transformation, and output set. This does not require a huge metadata platform. A script with documented arguments, pinned dependencies, and a concise report can be enough. The report should show dimensions, byte sizes, and warnings for unexpected outputs.

Use deterministic output names or a manifest that maps generated names to source assets. Avoid time stamps in filenames unless they serve a deliberate versioning purpose. In CI, fail on missing required output and preserve logs that make it easy to identify which input caused a failure.

**Review prompt:** Can a teammate identify the owner, expected output, failure signal, and verification step for this decision without asking the original author? If not, add a manifest field, test, or concise note.


## Operational Review 11: Account for Third-Party Asset Delivery

External media services and CDNs can improve delivery, but they add dependencies on availability, privacy behavior, URL stability, and configuration. A third-party player may add scripts and requests even before a visitor plays a video. An external font provider can require additional origins in a Content Security Policy. Evaluate the total page impact, not only the media bytes.

For each third-party asset service, document the domain, fallback behavior, privacy implications, and whether the asset must be available for the page to function. Self-hosting may be preferable for small stable assets, while adaptive video delivery may justify a service. Avoid making a critical brand mark dependent on a remote request if a local copy is feasible and licensed.

**Review prompt:** Can a teammate identify the owner, expected output, failure signal, and verification step for this decision without asking the original author? If not, add a manifest field, test, or concise note.


## Operational Review 12: Test Asset Failure Deliberately

Asset failures are easy to overlook because browser caches hide missing files and local directories contain stale outputs. Deliberately test a missing import, a wrong public path, an oversized image, and a font request blocked by CORS when that configuration applies. The expected result should be a clear build error, validation message, or visible fallback—not an unexplained blank region.

Keep the failure exercise small enough to run in a pull request or periodic pipeline test. For each failure, record how it is detected and what a developer should do next. Do not leave a broken asset in the main branch after testing; use a temporary branch or test fixture that is removed after the check.

**Review prompt:** Can a teammate identify the owner, expected output, failure signal, and verification step for this decision without asking the original author? If not, add a manifest field, test, or concise note.


## Operational Review 13: Make Media Respect User Preferences

Asset delivery includes how content moves and plays. A looping background video, animated GIF, or motion-heavy image sequence may be visually central but should not prevent a visitor from accessing the content. Respect reduced-motion preferences and provide a static alternative when animation is nonessential. Captions and transcripts matter for audio information, while alt text and nearby text matter for images.

Test the experience with reduced motion enabled and with media blocked or slow. Make sure controls remain keyboard accessible and that playback does not begin with sound unexpectedly. If media is decorative, keep it from producing redundant announcements; if it communicates information, make the equivalent information available in another form.

**Review prompt:** Can a teammate identify the owner, expected output, failure signal, and verification step for this decision without asking the original author? If not, add a manifest field, test, or concise note.


## 19. Lazy Loading and the Initial Viewport

Native lazy loading is a useful default for below-the-fold images because it lets the browser defer requests until they are likely to be needed. It is not a universal setting to apply to every image. If the primary hero is lazy-loaded, it can be discovered late and become the largest contentful paint bottleneck. Conversely, eagerly loading every gallery image can flood the first viewport with requests. Identify which assets appear before the first scroll and choose priority intentionally.

```html
<img src="/media/hero.webp" width="1440" height="900" alt="A sunlit gallery" />
<img src="/media/detail.webp" width="900" height="600" loading="lazy" alt="A detail of the installation" />
```

**Gotcha:** Treat the output as a hypothesis until it has been checked in the target browser and hosting environment. Build-time success cannot validate every network, cache, or accessibility behavior.


## 20. CSS and JavaScript Asset Discovery

CSS backgrounds are discovered when the stylesheet is parsed, while assets created only after JavaScript executes may be discovered later. This matters when an image is visually important but its URL is hidden inside a component that mounts after hydration or an interaction. Avoid unnecessary client-side indirection for a critical image. Keep content media in semantic markup when possible, and inspect the request initiator to see which layer triggered a request.

```css
/* Decorative asset referenced from a loaded stylesheet. */
.hero-surface {
  background-image: url("/media/surface-texture.webp");
}
```

**Gotcha:** Treat the output as a hypothesis until it has been checked in the target browser and hosting environment. Build-time success cannot validate every network, cache, or accessibility behavior.


## 21. MIME Types and Content Delivery

A file's extension does not guarantee that a server returns the correct `Content-Type`. Fonts, SVG, WebP, AVIF, and video can fail or behave unexpectedly when a host sends the wrong type or forces downloads. Some issues appear only on a production CDN, not on a local development server. Validate response headers from the public URL and confirm that the body is the intended file rather than an HTML error page returned with status 200.

```bash
# Run against a deployed asset URL; inspect both headers and body behavior.
curl -I https://example.com/media/hero.webp
```

**Gotcha:** Treat the output as a hypothesis until it has been checked in the target browser and hosting environment. Build-time success cannot validate every network, cache, or accessibility behavior.


## 22. Case Sensitivity and Portable Paths

A project may be developed on a case-insensitive filesystem and deployed to a case-sensitive Linux host. An import written as `Hero.webp` can appear to work when the file is named `hero.webp` locally but fail after deployment. Keep casing exact and avoid spaces or ambiguous punctuation in generated filenames unless a documented URL-encoding policy exists. Test from a clean checkout on the same kind of environment used for CI.

```js
import heroUrl from './assets/hero.webp';
// The actual filename must match this path's casing exactly.
```

**Gotcha:** Treat the output as a hypothesis until it has been checked in the target browser and hosting environment. Build-time success cannot validate every network, cache, or accessibility behavior.


## 23. Data URLs and Inline Asset Trade-offs

Inlining a tiny icon or placeholder as a data URL can remove a request, but it increases the containing CSS or JavaScript payload and can make caching less granular. Large inlined images are usually a poor trade because they inflate every consumer of that bundle. Let the build tool decide inlining only when its documented threshold matches the project, and inspect the output to understand what happened. Do not invent configuration options; verify the exact option supported by the installed tool version.

```css
/* Small inline SVG is reasonable when it is part of a component's markup. */
const marker = '<svg viewBox="0 0 8 8" aria-hidden="true"><circle cx="4" cy="4" r="3"/></svg>';
```

**Gotcha:** Treat the output as a hypothesis until it has been checked in the target browser and hosting environment. Build-time success cannot validate every network, cache, or accessibility behavior.


## 24. Static Exports and Server-Rendered Output

A static export and a server-rendered application may publish assets differently. A static site usually has an output directory that can be copied to a host, while a server-rendered framework may need a runtime server and framework-specific asset handling. Do not assume that copying a `public` directory alone is a complete deployment. Read the selected framework's output mode and verify all emitted assets in the built artifact.

```bash
# Generic release check: inspect the configured output, not an assumed directory.
find dist -type f -print | sort
```

**Gotcha:** Treat the output as a hypothesis until it has been checked in the target browser and hosting environment. Build-time success cannot validate every network, cache, or accessibility behavior.


## 25. Asset Review in Pull Requests

Review asset changes for both visual quality and operational impact. A new hero may add several megabytes, change the aspect ratio, introduce a license restriction, or replace a fingerprinted import with a stable URL. A reviewer should see the source or preview, the generated variants, and the change in size. For large binary files, summarize dimensions and byte deltas in the pull request description.

```bash
# Example report line from a project-owned asset checker:
# public/media/hero.webp: 214.3 KB, 1600x1000, within 256 KB hero budget
```

**Gotcha:** Treat the output as a hypothesis until it has been checked in the target browser and hosting environment. Build-time success cannot validate every network, cache, or accessibility behavior.


## 26. Rollback and Asset Retention

A deployment can roll back HTML while a CDN still has cached assets from a newer release, or the reverse. Keep hashed assets available long enough that cached HTML and rollback releases can still request them. Avoid cleanup jobs that immediately delete every file not referenced by the latest build if visitors or caches may still reference older hashes. Retention policy should match release frequency and cache lifetime.

```bash
# Deployment policy concept, not a universal command:
# publish new hashed assets -> publish HTML -> retain prior hashes during cache window
```

**Gotcha:** Treat the output as a hypothesis until it has been checked in the target browser and hosting environment. Build-time success cannot validate every network, cache, or accessibility behavior.


## 27. Audit External References

An asset manifest should identify assets that are loaded from outside the repository, including remote fonts, video embeds, analytics-loaded images, and CMS media. External references can change, disappear, or add tracking behavior without a source-code change. Keep a short list of origins and expected purpose, then check that the Content Security Policy and privacy disclosure match actual behavior.

```bash
# Example origin inventory columns:
# origin, asset_type, purpose, owner, fallback, privacy_review
```

**Gotcha:** Treat the output as a hypothesis until it has been checked in the target browser and hosting environment. Build-time success cannot validate every network, cache, or accessibility behavior.


## 28. Avoid Overengineering the Pipeline

A build step should earn its maintenance cost. A tiny portfolio may need only clear folders, responsive image exports, and a script that catches files over budget. A content platform with thousands of uploads may justify a CMS transformation service, manifests, queueing, and CDN variants. Do not add an image CDN, custom plugin, or multi-stage asset graph merely because it is fashionable. Start with measurable failure modes and add machinery only when it removes them.

```bash
# Minimal package scripts can be enough for a small site:
# "assets:check": "node scripts/check-assets.mjs"
# "build": "npm run assets:check && vite build"
```

**Gotcha:** Treat the output as a hypothesis until it has been checked in the target browser and hosting environment. Build-time success cannot validate every network, cache, or accessibility behavior.
