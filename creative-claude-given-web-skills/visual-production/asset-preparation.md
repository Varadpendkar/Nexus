# SKILL: asset-preparation
**Layer:** 24 — visual production  
**Goal:** Prepare, organize, inspect, and hand off source assets so visual projects remain consistent, editable, legally usable, and production-ready across design and development workflows.

---

## Why This Matters (Senior Perspective)

A polished interface can still feel unfinished when its assets are inconsistent: images have mismatched crops, logos contain accidental padding, filenames are ambiguous, icons use different stroke weights, and font or image licenses are unclear. These are not minor housekeeping issues. They create visual inconsistency, slow implementation, increase revision costs, and make handoffs fragile.

Senior designers and developers treat asset preparation as part of the design system. They inventory what exists, identify what is missing, verify quality and rights, standardize dimensions and naming, preserve source files, and deliver only the variants that the project actually needs. They also check how assets behave in the real interface instead of trusting a design-tool preview.

Without this discipline, a team may repeatedly recreate assets, ship unnecessarily large files, use the wrong logo version, or discover too late that an image cannot legally be used. A reliable preparation workflow makes creative work easier to maintain and safer to publish.

---

## Core Concepts

### 1. Asset inventory and purpose

Start by listing every asset, its role, its source, and its current status. This prevents missing files from appearing late in the project and makes duplicated or obsolete assets easier to identify.

```js
// A small inventory makes asset requirements visible before implementation.
const assetInventory = [
  {
    name: "brand-wordmark",
    type: "logo",
    purpose: "Primary website navigation",
    source: "brand-kit/wordmark.svg",
    status: "approved",
    owner: "brand-team"
  },
  {
    name: "homepage-hero",
    type: "photography",
    purpose: "Homepage hero background",
    source: "campaign/hero-original.tif",
    status: "needs-crop",
    owner: "creative-team"
  }
];

// Filter unresolved items so they can be handled before delivery.
const unresolvedAssets = assetInventory.filter(
  (asset) => asset.status !== "approved"
);
console.table(unresolvedAssets);
```

**Mental model:** an asset inventory is a small production backlog. It should answer what the asset is, where it came from, what it is for, who can approve it, and what still needs to happen.

**Gotcha:** a filename is not a sufficient description. `hero-final-2.jpg` tells a teammate almost nothing about intended crop, rights, or approval state.

### 2. Source files versus production files

Keep editable masters separate from optimized exports. A source file is for future changes; a production file is tuned for a specific delivery context. Do not overwrite the only editable source with a flattened or compressed export.

```text
project/
  source/
    brand-system.fig
    campaign-artwork.psd
    illustration-source.svg
  review/
    campaign-preview.jpg
  production/
    logo-wordmark.svg
    homepage-hero-1600.webp
    campaign-social-1080x1350.png
  manifest.md
```

Use the native source format when the team may need to change layers, typography, components, or paths. Production files should be reproducible from those masters.

**Wrong:** `Save As → optimized-final.jpg` and then delete the layered original.  
**Right:** preserve the master, export a separate delivery copy, and record which source produced it.

### 3. Naming conventions that communicate intent

Use predictable names based on role, variant, dimensions, and format where useful. Keep names lowercase and use hyphens to improve readability and avoid fragile paths.

```text
logo-symbol.svg
logo-wordmark.svg
homepage-hero-desktop-1600.webp
homepage-hero-mobile-800.webp
project-orbit-thumbnail-640x480.webp
campaign-spring-social-1080x1350.png
```

Avoid names such as `final.png`, `new-final-REAL.png`, or `Screenshot 2026-10-23 at 12.00.00.png`. If revisions must be tracked in filenames, use a clear, consistent revision scheme; otherwise let version control or the design system manage history.

**Gotcha:** filename dimensions must match the actual file. A label like `1600` is misleading if the export is actually 1200 pixels wide.

### 4. Dimensions, aspect ratio, and crop intent

Prepare assets around their actual use. A square thumbnail, a widescreen hero, and a portrait social post may require different crops. Do not stretch an image to fit an arbitrary frame.

```css
/* The frame defines the display crop; the image keeps its proportions. */
.project-card__image {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  object-position: center;
}

/* A focal-point adjustment can protect the subject in a hero. */
.homepage-hero__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 62% center;
}
```

When the subject changes position across responsive layouts, create separate art-directed crops rather than relying on one crop everywhere. Record crop intent for the developer when the focal point is important.

### 5. Resolution and density

The correct pixel dimensions depend on rendered size, display density, and whether the asset is raster or vector. Exporting every raster asset at maximum resolution wastes bandwidth and storage; exporting too small makes images blurry.

For responsive web photography, provide a useful range of widths and let the browser choose an appropriate candidate. For interface assets, follow the platform's density conventions. For print, calculate effective resolution at the final placed size and follow the production specification.

```html
<img
  src="/assets/project-orbit-960.webp"
  srcset="
    /assets/project-orbit-480.webp 480w,
    /assets/project-orbit-960.webp 960w,
    /assets/project-orbit-1440.webp 1440w
  "
  sizes="(max-width: 48rem) 100vw, 33vw"
  width="960"
  height="720"
  alt="Orbit project dashboard displayed on a laptop"
>
```

**Gotcha:** `srcset` width descriptors must match the real intrinsic pixel widths. The `sizes` attribute should describe the expected CSS layout width, not the export scale factor.

### 6. Format selection

Choose a format based on image content, transparency, destination support, and editing requirements.

| Asset type | Common starting choice | Important check |
|---|---|---|
| Photographs | WebP, AVIF, or JPEG | Compression artifacts and target support |
| Logo or simple illustration | SVG where suitable | Correct paths, viewBox, and safe content |
| Transparent raster artwork | PNG or WebP | Alpha edges on light and dark backgrounds |
| Screenshot with fine UI text | PNG or carefully tested modern format | Text and edge artifacts |
| Print handoff | Printer-specified PDF or production format | Profile, bleed, fonts, and placed-image resolution |
| Animated visual | WebP, video, GIF, or platform-specific format | Compatibility, duration, and file size |

This is not a universal format mandate. Check where the asset will be used, the project's browser or platform support, and whether the receiving team needs editability.

### 7. Transparent assets and edge quality

A transparent PNG or WebP can still look wrong if the source has a matte, fringe, excessive transparent padding, or unwanted semi-transparent pixels. Inspect logos and cutouts against both light and dark backgrounds.

```css
/* A QA page can place the same asset on contrasting surfaces. */
.asset-preview {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.asset-preview__surface {
  display: grid;
  place-items: center;
  min-height: 12rem;
  padding: 2rem;
}

.asset-preview__surface--light {
  background: #fff;
}

.asset-preview__surface--dark {
  background: #16181d;
}

.asset-preview img {
  max-width: 100%;
  max-height: 8rem;
  object-fit: contain;
}
```

For logos, also inspect the SVG or raster bounds. Excess whitespace in an icon can make it appear misaligned even when its CSS box is correct.

### 8. Quality checks and visual consistency

Assets should be reviewed as a set, not only one at a time. Compare crop, color temperature, contrast, corner treatment, icon stroke weight, image style, and background transparency.

A useful review asks:
- Are the images from the same visual world or campaign?
- Do thumbnails use consistent aspect ratios and focal-point logic?
- Are icons optically balanced at their actual display size?
- Are logo clear-space and minimum-size rules respected?
- Are color and contrast still correct after export?
- Are any files visibly compressed, stretched, pixelated, or over-sharpened?

Do not normalize everything mechanically. A consistent system can still allow intentional exceptions, such as a portrait image within a set of landscape thumbnails, if the exception supports the content and is handled deliberately.

### 9. Fonts and other linked dependencies

A design file may depend on fonts, linked images, plugins, or external libraries that are not embedded in the project. Before handoff, identify those dependencies and confirm that recipients can access them.

```text
Handoff dependencies
- Font family and exact styles used
- Font license and permitted usage
- Linked images and their source locations
- Required icon library or SVG source
- External mockup assets or device frames
- Any special export plugin or color profile
```

Do not package or redistribute font files unless the license allows it. When recipients cannot access the original font, provide the family/style information and an approved fallback strategy.

### 10. Rights, attribution, and consent

Asset preparation includes confirming that the project has permission to use each asset in the intended context. “Found online” does not mean free to publish. Stock licenses may restrict use, redistribution, templates, resale, or certain commercial contexts.

Track the source URL or provider, creator, license, acquisition date where relevant, attribution requirements, and any usage restrictions. For photos featuring identifiable people, check the required model releases and the context in which the image may be used.

```js
// A lightweight rights record makes the review auditable.
const assetRights = {
  file: "homepage-hero.webp",
  creator: "Studio North",
  source: "licensed-stock-library",
  license: "commercial-web-use",
  attributionRequired: false,
  redistributionAllowed: false,
  reviewedBy: "project-owner",
  approvedFor: ["marketing-website"],
  notes: "Do not redistribute the original stock file."
};

// Do not publish until the intended usage has been reviewed.
const canPublish = assetRights.approvedFor.includes("marketing-website");
console.log({ canPublish });
```

The data above is illustrative. Record the actual terms, and seek clarification when the license or consent requirements are unclear.

### 11. Accessibility metadata

Assets need appropriate text alternatives and semantic treatment when used on the web. Decorative images should not add redundant noise to screen-reader output; informative images need concise alternative text that communicates their relevant purpose.

```html
<!-- Informative: describe the relevant information conveyed by the image. -->
<img
  src="/assets/quarterly-growth-chart.png"
  alt="Revenue increased each quarter, from 1.2 million in Q1 to 1.9 million in Q4."
>

<!-- Decorative: the adjacent text already provides the meaning. -->
<img src="/assets/decorative-divider.svg" alt="">
```

Do not bake important text into an image when real HTML text would be more responsive and accessible. If the image itself is a chart or complex diagram, provide the essential information in surrounding text or a data table as appropriate.

### 12. Responsive and contextual validation

An asset's quality is defined by how it behaves in the actual layout. Check it at its intended rendered size, at narrow and wide viewports, and on backgrounds that resemble the real product.

For web projects, verify:
- The image does not distort when the container changes.
- The crop protects the subject at key breakpoints.
- The correct responsive candidate can be selected.
- Intrinsic dimensions or CSS aspect ratio prevent layout jumps.
- The asset does not obscure text or controls.
- The file loads from the correct path and casing.
- The appearance remains acceptable on high-density displays.

```html
<img
  src="/assets/homepage-hero-1600.webp"
  width="1600"
  height="1000"
  alt="A designer reviewing a prototype with a teammate"
  decoding="async"
>
```

Intrinsic dimensions help the browser reserve space before the image loads. Use loading priority based on context; a critical above-the-fold hero should not automatically be lazy-loaded.

### 13. Handoff documentation

A handoff should make the right asset easy to find and use. Include a short manifest for large sets or assets with important usage constraints.

```md
# Asset handoff

- `logo-wordmark.svg` — primary header wordmark; preserve aspect ratio.
- `homepage-hero-desktop-1600.webp` — desktop hero image; focal point on right.
- `homepage-hero-mobile-800.webp` — mobile-specific crop.
- `project-orbit-thumbnail-960.webp` — project card; 4:3 crop.
- `campaign-social-1080x1350.png` — approved social campaign artwork.

Source files: `source/`
Production exports: `production/`
Rights notes: `asset-rights.md`
```

Document unusual behavior: safe areas, focal points, minimum display sizes, logo clear space, intended backgrounds, and restrictions. Do not make the recipient infer these details from the file name.

### 14. Final verification and change control

Before delivery, compare the exports against the approved source and check the actual files. Confirm dimensions, format, transparency, color, crop, naming, rights, and paths. If a source changes, regenerate dependent exports and update the manifest.

```js
const requiredDeliverables = [
  "logo-wordmark.svg",
  "homepage-hero-desktop-1600.webp",
  "homepage-hero-mobile-800.webp",
  "asset-rights.md"
];

const deliveredFiles = new Set([
  "logo-wordmark.svg",
  "homepage-hero-desktop-1600.webp",
  "asset-rights.md"
]);

const missingFiles = requiredDeliverables.filter(
  (fileName) => !deliveredFiles.has(fileName)
);

if (missingFiles.length > 0) {
  console.error("Handoff is incomplete:", missingFiles);
} else {
  console.log("Required deliverables are present.");
}
```

This example checks names only, not file integrity. Use file inspection or build tooling to verify dimensions, hashes, color profiles, and other properties when a project requires automated validation.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Build an asset manifest before implementation

**What it does:** creates a shared source of truth for asset roles, variants, dimensions, and status.  
**When to use it:** multi-page sites, campaign launches, design systems, and projects with multiple contributors.

```json
{
  "assets": [
    {
      "name": "homepage-hero-desktop",
      "file": "homepage-hero-desktop-1600.webp",
      "purpose": "Desktop homepage hero",
      "width": 1600,
      "height": 1000,
      "status": "approved",
      "rightsReviewed": true
    },
    {
      "name": "homepage-hero-mobile",
      "file": "homepage-hero-mobile-800.webp",
      "purpose": "Mobile-specific hero crop",
      "width": 800,
      "height": 1000,
      "status": "approved",
      "rightsReviewed": true
    }
  ]
}
```

**Integration notes:** update the manifest when exports change. Treat the values as verified facts, not estimates copied from the design canvas.

### Pattern 2: Create a browser-based asset QA sheet

**What it does:** displays assets at useful sizes and on contrasting backgrounds so visual defects are easier to spot.  
**When to use it:** icon libraries, logos, product catalogs, and batches of transparent images.

```html
<section class="asset-grid" aria-label="Asset quality review">
  <figure class="asset-card">
    <div class="asset-card__preview asset-card__preview--light">
      <img src="/assets/logo-wordmark.svg" alt="">
    </div>
    <figcaption>
      <strong>Logo wordmark</strong>
      <span>SVG · Light background</span>
    </figcaption>
  </figure>

  <figure class="asset-card">
    <div class="asset-card__preview asset-card__preview--dark">
      <img src="/assets/logo-wordmark.svg" alt="">
    </div>
    <figcaption>
      <strong>Logo wordmark</strong>
      <span>SVG · Dark background</span>
    </figcaption>
  </figure>
</section>
```

```css
.asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
  gap: 1rem;
}

.asset-card {
  margin: 0;
  border: 1px solid #d7dbe1;
  border-radius: 0.75rem;
  overflow: hidden;
}

.asset-card__preview {
  display: grid;
  place-items: center;
  min-height: 12rem;
  padding: 1.5rem;
}

.asset-card__preview img {
  display: block;
  max-width: 100%;
  max-height: 8rem;
}

.asset-card__preview--light {
  background: #fff;
}

.asset-card__preview--dark {
  background: #17191f;
  color: #fff;
}

.asset-card figcaption {
  display: grid;
  gap: 0.25rem;
  padding: 0.875rem;
}
```

**Integration notes:** this review page is not a replacement for checking real layouts. It helps expose issues that may be hard to notice when assets are reviewed individually in a design tool.

### Pattern 3: Use responsive image variants with documented focal points

**What it does:** supports responsive loading while preserving a deliberate crop for each layout.  
**When to use it:** hero photography, campaign imagery, editorial features, and product storytelling.

```html
<picture>
  <source
    media="(max-width: 40rem)"
    srcset="/assets/homepage-hero-mobile-800.webp"
  >
  <source
    type="image/avif"
    srcset="
      /assets/homepage-hero-desktop-1000.avif 1000w,
      /assets/homepage-hero-desktop-1600.avif 1600w
    "
    sizes="100vw"
  >
  <img
    src="/assets/homepage-hero-desktop-1600.webp"
    width="1600"
    height="1000"
    alt="A designer presenting a prototype in a bright studio"
    fetchpriority="high"
  >
</picture>
```

**Integration notes:** the media-specific source is art direction, while `srcset` candidates are resolution selection. Ensure the source order, dimensions, fallback, and alt text match the actual content.

### Pattern 4: Automate filename and dimension checks

**What it does:** catches basic naming and inventory issues before a handoff.  
**When to use it:** large asset folders, repeated campaign exports, or teams with strict naming rules.

```js
const assetFiles = [
  { name: "logo-wordmark.svg", width: 600, height: 120 },
  { name: "homepage-hero-1600.webp", width: 1600, height: 1000 },
  { name: "project-orbit-thumbnail-960.webp", width: 960, height: 720 }
];

const invalidNames = assetFiles.filter(({ name }) => {
  // Lowercase hyphenated names reduce platform and handoff ambiguity.
  return !/^[a-z0-9]+(?:-[a-z0-9]+)*\.(svg|png|jpe?g|webp|avif)$/.test(name);
});

const invalidDimensions = assetFiles.filter(({ width, height }) => {
  // Zero or missing dimensions usually indicate incomplete metadata.
  return !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0;
});

console.log({ invalidNames, invalidDimensions });
```

**Integration notes:** the example validates supplied metadata, not the actual files. A production script should read dimensions from files and check the project's full naming rules.

### Pattern 5: Package a reliable client handoff

**What it does:** separates editable sources, approved previews, production exports, and rights notes.  
**When to use it:** freelance deliveries, agency handoffs, and projects transferred to another team.

```text
delivery/
  source/
  review/
  production/
  documentation/
    asset-manifest.json
    asset-rights.md
    usage-notes.md
```

**Integration notes:** include only files the recipient needs. Confirm that source files open correctly and that any linked assets or licensed fonts are handled according to their terms.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Keeping only flattened exports | The source seems unnecessary after delivery | Preserve editable masters and separate production files |
| Using ambiguous names | Files are exported quickly without a naming scheme | Use descriptive names that indicate role and variant |
| Stretching assets to fit frames | The layout dimensions were chosen without crop planning | Preserve aspect ratio and use deliberate cropping or alternate variants |
| Exporting everything at maximum resolution | Bigger is mistaken for safer | Match dimensions to actual use and responsive needs |
| Ignoring transparent edges | The source is reviewed only on one background | Inspect over light and dark surfaces |
| Using an asset without checking its license | Availability is confused with permission | Record the source and approved usage |
| Forgetting alt text | Asset preparation is separated from implementation | Supply meaningful alt guidance and mark decorative images clearly |
| Failing to update the manifest | Files change after review | Re-run checks and update the handoff documentation |
| Treating a design-tool preview as final QA | The exported file is assumed to match the canvas | Reopen and inspect the real output in context |
| Shipping obsolete variants | Old exports remain in the folder | Remove or clearly archive superseded files |

---

## Mental Models

1. **Inventory before polish** — you cannot reliably prepare assets you have not identified.
2. **Source and delivery are different products** — preserve editability while optimizing production output.
3. **The filename is interface design for teammates** — good naming reduces search and implementation errors.
4. **Crop is a composition decision** — aspect ratio alone does not preserve the message.
5. **A file is not approved until it is checked in context** — inspect the actual export at its intended size and background.
6. **Rights are part of quality** — an attractive asset that cannot legally be used is not production-ready.
7. **Handoff should remove guesswork** — document purpose, variants, focal points, dependencies, and restrictions.

---

## Quick Reference

| Property / Situation | Recommended answer | Notes |
|---|---|---|
| First step | Create an asset inventory | Track source, purpose, status, and owner |
| Editable master | Keep separately from exports | Avoid destructive overwrites |
| Naming | Lowercase, descriptive, hyphenated | Include dimensions or role when useful |
| Responsive photography | Multiple candidates and accurate `srcset`/`sizes` | Match descriptors to real widths |
| Different composition by viewport | Use art-directed crops | A single crop may not fit all layouts |
| Logo or icon | SVG when appropriate | Check bounds, viewBox, and background |
| Transparent raster | PNG or WebP as supported | Inspect alpha edges on contrasting backgrounds |
| Rights review | Record creator, source, license, and restrictions | Confirm intended commercial use |
| Accessibility | Provide alt-text guidance | Decorative images usually use empty alt text |
| Handoff | Manifest plus organized source and production folders | Include usage constraints |
| Final QA | Inspect the exported file in context | Check crop, color, size, transparency, and paths |

---

## Build Challenge

### Project: Prepare a complete asset pack for a studio website

You are given a folder containing 30 mixed assets: several logo versions, unoptimized photos, inconsistent project thumbnails, icons with uneven padding, a campaign graphic, and a few images downloaded from unknown sources. Prepare the pack for implementation on a responsive studio website.

**Build:**
1. An asset inventory with role, source, status, owner, and usage rights.
2. A clear separation between editable masters, review previews, and production exports.
3. A consistent naming convention for all approved files.
4. Responsive hero and thumbnail variants with correct dimensions and crop intent.
5. A logo and icon set checked for bounds, transparency, and visual alignment.
6. A rights review that flags unknown or restricted sources rather than assuming permission.
7. A small browser QA sheet for light/dark backgrounds and real display sizes.
8. An asset manifest and concise handoff notes.
9. A final validation pass for missing files, wrong dimensions, obsolete versions, and broken paths.

**Failure scenarios to test:**
- The approved logo has a large invisible margin.
- The mobile hero crop removes the main subject.
- An image has no verifiable source or license.
- A filename says 1600 pixels but the file is only 1200 pixels wide.
- A transparent logo has a light fringe on a dark header.
- A thumbnail appears stretched in a 4:3 card.
- A developer cannot locate the font or linked source image.
- A production export is changed but the manifest still lists the old dimensions.
- A decorative image is announced redundantly by a screen reader.
- An old logo variant is mistakenly included in the production folder.

**Definition of done:** another designer or developer can identify every approved asset, understand its intended use, find its source and rights information, implement the correct variant without guessing, and reproduce or revise the output later.

---

## Final Checklist

- [ ] All required assets are inventoried and assigned a purpose.
- [ ] Missing, duplicate, obsolete, and unapproved files are identified.
- [ ] Editable source files are preserved.
- [ ] Production exports use consistent names and folder structure.
- [ ] Dimensions, aspect ratios, crops, and focal points are verified.
- [ ] Transparent edges and logo bounds are checked.
- [ ] Format and compression suit the destination.
- [ ] Fonts, linked files, and other dependencies are documented.
- [ ] Licenses, attribution, and consent requirements are reviewed.
- [ ] Alt-text guidance distinguishes informative from decorative assets.
- [ ] Responsive variants are tested in the real layout.
- [ ] Manifest and handoff notes match the final files.
- [ ] Exported assets have been reopened and inspected.
