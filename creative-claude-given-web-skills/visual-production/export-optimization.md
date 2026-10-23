# Export Optimization

## Skill Metadata
- **Skill name:** `export-optimization`
- **Layer:** `layer-24-visual-production`
- **Goal:** Produce visual assets that retain the intended design quality while meeting practical requirements for file size, sharpness, color, transparency, dimensions, and delivery format.
- **Use when:** Exporting images, illustrations, icons, logos, UI mockups, social graphics, and web-ready visual assets from design tools.
- **Primary principle:** Optimize for the asset's real destination and use—not for the smallest file or highest resolution in isolation.

---

## Why This Matters

An asset can look excellent inside a design tool and still fail after export. It may be blurry on high-density displays, unnecessarily large, missing transparency, shifted in color, incorrectly cropped, or saved in a format that the target platform handles poorly.

Export optimization is the bridge between design intent and reliable delivery. It requires knowing where an asset will appear, how large it will render, whether it needs transparency or animation, how much detail it contains, and what quality loss is acceptable.

A good export workflow:
- Starts with the intended use and rendering dimensions.
- Chooses a format based on the content and destination.
- Uses the smallest dimensions that preserve the required display quality.
- Preserves transparency only when it is needed.
- Balances compression with visible quality.
- Uses predictable naming and repeatable export settings.
- Checks the actual exported file, not just the source canvas.
- Keeps an editable master separate from delivery-ready files.
- Validates accessibility and performance implications where assets are used in a product.

Do not assume one export setting is right for every image. A photographic hero, a transparent logo, a line icon, and a social poster have different requirements.

## Core Concepts

### 1. Identify the destination before exporting

First determine where the asset will be used. The destination informs dimensions, format, compression, color profile, transparency, and naming.

| Destination | Main considerations |
|---|---|
| Website hero | Responsive crop, image dimensions, compression, loading priority |
| Product thumbnail | Consistent aspect ratio, small file size, sharp details |
| Logo or UI icon | Vector where practical, transparent background, crisp edges |
| App interface | Density variants, predictable dimensions, platform requirements |
| Social media post | Platform aspect ratio, safe margins, color profile, text legibility |
| Print | Physical size, resolution at final size, color workflow, bleed where required |
| Email graphic | Conservative dimensions, broad format support, compact file size |
| Animated asset | Frame count, duration, loop behavior, compatibility, size budget |

**Rule:** never choose a format or resolution without knowing the use case. If the destination is unknown, export a flexible master and clarify the delivery requirements before making irreversible compromises.

### 2. Understand raster and vector assets

Raster images represent pixels. Common formats include JPEG, PNG, WebP, AVIF, and GIF. They work well for photographs, textured artwork, and complex pixel-based images.

Vector images describe paths and shapes. SVG is commonly used for logos, icons, diagrams, and scalable illustrations. Vector formats can remain crisp at many sizes, but they may not suit every image or platform.

```text
Photograph / realistic texture  → JPEG, WebP, or AVIF
Transparent photographic cutout → WebP or PNG, depending on support
Logo / simple icon / diagram    → SVG where supported
Pixel-art / lossless transparency → PNG
Simple looping animation       → WebP, GIF, or video, based on destination
Print handoff                   → Follow the printer's required format and profile
```

This is a starting guide, not a universal law. Check target-platform support, editing needs, transparency requirements, and any content-management constraints.

### 3. Match export dimensions to rendered dimensions

An image that renders at 1200 CSS pixels wide usually does not need a 6000-pixel-wide export for ordinary web display. However, high-density displays may benefit from a larger source.

A common starting point is to export at one or two times the expected CSS display size, then verify the visual result and performance budget. Responsive images may need multiple candidates rather than one oversized file.

```html
<img
  src="/images/team-1200.webp"
  srcset="
    /images/team-600.webp 600w,
    /images/team-1200.webp 1200w,
    /images/team-1800.webp 1800w
  "
  sizes="(max-width: 48rem) 100vw, 50vw"
  width="1200"
  height="800"
  alt="The team collaborating around a table"
>
```

The `srcset` descriptors must match the actual file widths. The `sizes` value should describe the layout's expected rendered width, not simply repeat the image's intrinsic dimensions.

### 4. Understand pixel density and scale factors

A design tool may export at 1×, 2×, or 3×. These labels represent scale factors relative to the design's logical dimensions. A 400 × 300 logical-pixel image exported at 2× becomes 800 × 600 pixels.

Do not export every asset at 3× automatically. Larger files cost more bandwidth and memory, and may be unnecessary for the rendered size. Conversely, small text or thin strokes may need a higher-density raster export to stay crisp.

For web photography, responsive `srcset` candidates are usually more flexible than manually choosing a single universal density. For interface assets, follow the platform's documented scale conventions.

### 5. Choose a format by visual content

- **JPEG:** broadly compatible and effective for photographs without transparency; lossy compression may introduce artifacts around sharp edges and text.
- **PNG:** lossless raster format with alpha transparency; useful for screenshots, pixel art, and graphics where artifacts are unacceptable, but can be large.
- **WebP:** supports lossy and lossless compression plus transparency and animation in modern browsers.
- **AVIF:** can offer strong compression for photographic and complex images, but encoding cost and target support should be considered.
- **SVG:** resolution-independent for appropriate vector graphics; avoid embedding huge raster data or untrusted active content.
- **GIF:** widely recognized for simple animation but limited color quality; consider modern alternatives when the destination supports them.
- **PDF:** often used for document and print handoff; follow the receiving workflow's requirements rather than treating it as a generic web image.

A good workflow compares candidates at the intended display size. The format with the smallest byte count is not automatically the best if the visible quality is poor or the destination cannot display it.

### 6. Balance compression and visual quality

Lossy compression discards information to reduce file size. The acceptable amount depends on the image and how it will be viewed.

Photographs can often tolerate some compression, while fine line art, small text, gradients, and UI screenshots may reveal artifacts quickly. Inspect high-contrast edges, skin tones, shadows, subtle gradients, and repeated patterns.

```text
Export candidate A → inspect at actual display size
Export candidate B → compare quality and byte size
Export candidate C → check whether further savings are visibly harmful
Choose the smallest candidate that still satisfies the visual requirement
```

Avoid selecting a quality number by habit. Quality scales differ between tools and formats, so a setting such as “80” is not a universal visual-quality guarantee.

### 7. Preserve transparency intentionally

Transparency is needed for logos, overlays, cutouts, icons, and assets placed on changing backgrounds. If an asset does not need transparency, removing the alpha channel may reduce file size or simplify downstream use.

Check the exported image over both light and dark backgrounds. Look for:
- A white or colored matte around formerly transparent edges.
- Fringes caused by incorrect premultiplication or background assumptions.
- Semi-transparent pixels that appear unexpectedly dark.
- An opaque background where transparency was expected.
- Unwanted transparent padding that affects alignment.

Do not use a transparent format merely because it is available. Choose it because the design needs alpha transparency.

### 8. Keep color management predictable

Color can shift when assets move between design applications, browsers, operating systems, and print workflows. Most ordinary web assets should use an appropriate sRGB-oriented workflow unless the destination explicitly supports and expects another profile.

For print, ask the printer or production team for the required color space, profile, and PDF/export settings. Do not blindly convert every print file to CMYK or assume a generic CMYK profile is correct.

```text
Web delivery:
- Use the destination's supported color workflow.
- Check exported colors in a browser, not only in the design tool.
- Avoid unnecessary profile conversions.

Print delivery:
- Confirm the printer's profile and output requirements.
- Confirm whether bleed, crop marks, and embedded fonts are needed.
- Review a proof when color accuracy matters.
```

Color conversion can change saturated colors, especially when the target gamut is narrower. Check brand colors and gradients after export.

### 9. Export at the correct aspect ratio and crop

A correctly compressed image can still fail if the crop cuts off a face, product detail, logo, or key text. Decide whether the asset should preserve the whole image, fill a fixed frame, or provide alternate crops for different layouts.

```css
.product-image {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  object-position: center;
}

.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 60% center;
}
```

Use `object-position` as a layout-level adjustment when one asset can work across contexts. When the subject requires different crops, create art-directed variants rather than forcing a single crop everywhere.

### 10. Remove unnecessary data without damaging the asset

Metadata can include camera details, editing history, embedded previews, profiles, and other information. Some metadata is useful for attribution, rights, color, or workflow; some may be unnecessary for delivery.

Remove metadata only when it is safe and permitted. Preserve copyright or licensing information where required. Do not strip color profiles blindly if doing so changes how the asset is interpreted.

Optimization should also include:
- Removing unused layers from delivery exports when the format supports them.
- Avoiding oversized transparent margins.
- Removing hidden or off-canvas content from final raster output.
- Avoiding duplicate exports with unclear names.
- Keeping the editable source file separately.

### 11. Make naming and versioning predictable

A delivery folder should make each asset's role, variant, and dimensions easy to identify. Names should be descriptive, consistent, and safe for the receiving system.

```text
assets/
  hero/
    studio-hero-800.webp
    studio-hero-1600.webp
    studio-hero-2400.webp
  logos/
    brand-mark.svg
    brand-wordmark.svg
  social/
    campaign-launch-1080x1350.png
```

Avoid names such as `final-final2.png`, `new-export.png`, or `image1.webp`. If versioning is needed, use a consistent version or revision convention and keep source files in a separate location.

### 12. Preserve editable masters

A flattened delivery file is not a replacement for the source document. Keep an editable master in the design application's native format, with named layers, components, linked assets, and useful artboards where applicable.

A robust delivery can include:
- Editable master file.
- Optimized production exports.
- A preview or contact sheet.
- A short manifest of formats, dimensions, and intended usage.
- Licensing or attribution details when relevant.

Do not deliver every intermediate experiment unless the recipient needs them. Make the final handoff clear and maintainable.

### 13. Optimize for perceived quality, not only file size

A technically smaller file may look worse, load no faster in the actual context, or be inappropriate for the display dimensions. Evaluate assets in the real layout.

Consider:
- Does the asset load at the moment it is needed?
- Is it visually sharp at its actual CSS dimensions?
- Does compression create visible ringing, banding, or smearing?
- Does the image crop work on narrow and wide screens?
- Is the asset decoded and rendered efficiently?
- Does the file size fit the page's overall performance budget?

Image optimization is part of page performance, but not the only factor. Too many requests, lazy-loading the primary hero incorrectly, and poor responsive selection can undermine an otherwise well-compressed asset.

### 14. Validate the exported file

Never assume a successful export dialog means the output is correct. Reopen or preview the file and inspect its properties.

Check:
- Dimensions and aspect ratio.
- Actual file size.
- File format and alpha transparency.
- Sharpness and compression artifacts.
- Color and gradient rendering.
- Crop and safe margins.
- Filename and destination folder.
- Correct version and intended usage.
- Metadata and licensing requirements.
- Appearance in the real interface or receiving application.

## Advanced Patterns

### Pattern 1: Create a responsive image set

Use multiple sizes for layouts where the rendered width varies significantly.

```html
<picture>
  <source
    type="image/avif"
    srcset="
      /images/landscape-800.avif 800w,
      /images/landscape-1400.avif 1400w,
      /images/landscape-2000.avif 2000w
    "
    sizes="(max-width: 48rem) 100vw, 80vw"
  >
  <img
    src="/images/landscape-1400.jpg"
    srcset="
      /images/landscape-800.jpg 800w,
      /images/landscape-1400.jpg 1400w,
      /images/landscape-2000.jpg 2000w
    "
    sizes="(max-width: 48rem) 100vw, 80vw"
    width="1400"
    height="900"
    alt="A landscape at sunset"
    loading="lazy"
  >
</picture>
```

Make sure each candidate has the expected dimensions and that the fallback is usable. Do not lazy-load an above-the-fold image that is critical to the initial view; choose loading behavior based on when the asset appears.

### Pattern 2: Art-direct different crops

Use `<picture>` when the composition needs to change across breakpoints, not just the resolution.

```html
<picture>
  <source
    media="(max-width: 40rem)"
    srcset="/images/product-portrait.webp"
  >
  <img
    src="/images/product-landscape.webp"
    width="1600"
    height="1000"
    alt="A product displayed on a worktable"
  >
</picture>
```

Art-directed variants should preserve the subject and intended message. Verify the mobile crop separately rather than simply shrinking the desktop image.

### Pattern 3: Use a repeatable export checklist

```text
[ ] Destination and display dimensions confirmed
[ ] Correct format chosen for content and platform
[ ] Crop and aspect ratio verified
[ ] Transparency checked over light and dark backgrounds
[ ] Color checked in the target environment
[ ] Compression inspected at actual display size
[ ] File size meets the project's budget
[ ] Filename follows the naming convention
[ ] Export reopened and verified
[ ] Editable master retained
```

A checklist reduces missed details during repetitive asset production and makes review easier for teams.

### Pattern 4: Generate a delivery manifest

For multi-asset handoffs, document intended usage and technical properties. Keep the manifest simple and human-readable.

```json
{
  "assets": [
    {
      "file": "studio-hero-1600.webp",
      "purpose": "desktop hero image",
      "width": 1600,
      "height": 1000,
      "format": "webp",
      "transparency": false
    },
    {
      "file": "brand-mark.svg",
      "purpose": "header logo",
      "format": "svg",
      "transparency": true
    }
  ]
}
```

The values above are illustrative. Record actual exported dimensions and formats; do not copy the sample values without checking the files.

### Pattern 5: Prepare a print-ready export

Print requirements depend on the vendor, paper, process, and physical size. Confirm the specification before exporting.

```text
1. Confirm trim size and bleed requirements.
2. Confirm resolution at final physical size for raster images.
3. Confirm color profile and output format with the printer.
4. Check font embedding or outlining requirements.
5. Verify overprint, transparency, and effects in the output.
6. Export to the requested PDF or production format.
7. Inspect the PDF and request a proof when appropriate.
```

Do not assume that “300 DPI” alone makes a file print-ready. Effective resolution depends on image dimensions at final placed size, and the output workflow may require additional settings.

### Pattern 6: Compare candidates objectively

When choosing between formats or compression settings, compare both quality and size.

```text
Candidate A: 420 KB — clean gradients, good detail
Candidate B: 250 KB — slight texture loss, acceptable at display size
Candidate C: 130 KB — visible banding around shadows

Decision: choose B only if its artifacts are not noticeable in the real layout.
```

The numbers are examples, not targets. Use a representative set of assets and inspect each candidate at both actual display size and a closer zoom level.

### Pattern 7: Separate master, review, and production exports

```text
delivery/
  source/
    campaign-artwork.fig
  review/
    campaign-preview.jpg
  production/
    campaign-social-1080x1350.png
    campaign-banner-1920x600.webp
  manifest.md
```

Use the native source for future edits, a lightweight preview for review, and production files for deployment. Keep the delivery structure understandable to someone who did not create the asset.

## Common Mistakes

1. **Exporting every asset at maximum resolution.** This increases download size and memory use without necessarily improving the rendered result.
2. **Using one file for every viewport.** A large desktop asset may be wasteful on mobile, while a small export can look soft on large screens.
3. **Choosing a format by habit.** JPEG, PNG, WebP, AVIF, SVG, and PDF have different strengths and constraints.
4. **Compressing until the file is tiny.** Visible artifacts can damage brand perception and readability.
5. **Assuming transparent means clean edges.** Matte fringes and semi-transparent pixels may appear on different backgrounds.
6. **Ignoring the actual crop.** Important subjects or text may be clipped in the rendered frame.
7. **Exporting from a canvas with accidental padding.** Transparent margins can misalign icons and logos in layouts.
8. **Ignoring color profiles.** Colors may shift when assets move between applications or delivery contexts.
9. **Using 300 DPI as a universal web rule.** Web display depends on pixel dimensions and rendered size, not a universal DPI setting.
10. **Using print settings without the printer's specification.** Color, bleed, and PDF requirements vary by production workflow.
11. **Deleting source files after export.** This makes future revisions slower and can destroy editable work.
12. **Using ambiguous filenames.** Teams cannot reliably tell which file is current or where it belongs.
13. **Trusting the export dialog without inspecting the file.** Wrong dimensions, color shifts, missing transparency, and wrong destinations can go unnoticed.
14. **Lazy-loading every image indiscriminately.** A critical hero image may be delayed, while off-screen images should often be deferred.
15. **Optimizing only for byte count.** Real performance and perceived quality depend on rendering, request count, responsive selection, and placement.
16. **Failing to document handoff details.** Recipients may not know which file is final or what each variant is for.

## Mental Models

- **Export is a production step, not a save button.** It translates an editable design into a deliverable with constraints.
- **The destination defines the budget.** Dimensions, format, quality, and color choices follow the asset's real use.
- **Quality is judged in context.** Inspect the asset at its actual display size and background.
- **The master is the source of truth.** Production exports can be regenerated; flattened output should not replace editable work.
- **Smallest is not always best.** Choose the smallest asset that still meets the quality and compatibility requirements.
- **One design may need multiple outputs.** Responsive sizes, alternate crops, and print versions are legitimate production variants.
- **Verification closes the loop.** The exported file—not the settings you intended to use—is the final result.

## Quick Reference

| Need | Recommended approach | Common risk |
|---|---|---|
| Website photography | WebP/AVIF or JPEG fallback where needed; responsive candidates | One oversized image for all devices |
| Logo and simple icons | SVG when supported and appropriate | Raster blur or unsafe/unnecessary SVG content |
| Transparent cutout | PNG or WebP depending on target support | Edge halos and accidental opaque background |
| UI screenshot with text | Compare lossless or modern formats carefully | Lossy artifacts around text |
| Responsive image | `srcset` and accurate `sizes` | Descriptors that do not match actual dimensions |
| Different mobile composition | `<picture>` art direction | Cropping important content |
| Print handoff | Follow printer specs for size, profile, bleed, and format | Assuming DPI alone is enough |
| File naming | Descriptive, consistent names and variants | Multiple ambiguous “final” files |
| Team handoff | Keep master, production files, and manifest separate | Missing source or unclear deliverables |
| Final QA | Reopen and inspect exported files in destination context | Trusting export settings without validation |

## Build Challenge: Optimize an Asset Pack for a Responsive Website

### Scenario

A small studio website needs:
- A photographic hero image.
- Six project thumbnails.
- A transparent brand logo.
- Three UI icons.
- One social media campaign graphic.
- A print-ready version of the campaign graphic.

The current exports are oversized, filenames are inconsistent, the logo has a white background, and the mobile hero crop cuts off the subject.

### Requirements

1. Identify the intended use and display size for each asset.
2. Choose an appropriate format for each file.
3. Create responsive image candidates for the hero and thumbnails.
4. Produce a mobile-specific crop if the composition requires it.
5. Preserve genuine transparency in the logo.
6. Verify icon dimensions and remove unnecessary padding.
7. Compare compression candidates at actual display size.
8. Confirm color requirements for web and print independently.
9. Name the files consistently and organize them into a clear folder structure.
10. Retain editable source files and create a delivery manifest.
11. Reopen the exported files and verify dimensions, size, color, crop, and transparency.
12. Document any format or quality trade-offs.

### Suggested implementation sequence

1. Build an asset inventory with destination, dimensions, format, and transparency needs.
2. Confirm display dimensions and responsive breakpoints.
3. Prepare crops and compositions before compression.
4. Export a small set of format/quality candidates.
5. Compare candidates in the real layout.
6. Generate responsive variants and ensure descriptors match actual widths.
7. Check transparent assets against light and dark backgrounds.
8. Prepare print output only after confirming the printer's requirements.
9. Run the final QA checklist and organize the handoff.

### Failure scenarios

- The hero is 4 MB and takes too long to load.
- The 2× export is accidentally labeled as the 1× asset.
- The transparent logo displays a white rectangle.
- A compressed gradient shows visible banding.
- The mobile crop removes the subject's face.
- The print export uses the wrong color profile.
- The manifest lists dimensions that do not match the files.
- The production folder contains two files both named `final.png`.
- A thumbnail appears blurry on a high-density display.
- The source file is missing when a revision is requested.

### Definition of done

The asset pack is successful when each file is appropriate for its destination, visual quality is preserved at the required display size, dimensions and filenames are accurate, transparency and color behave as expected, responsive variants are usable, print requirements are confirmed, and the editable source is retained.

## Final Checklist

- [ ] Destination and usage are known.
- [ ] Raster or vector format is appropriate.
- [ ] Export dimensions match intended display and density needs.
- [ ] Aspect ratio and crop have been checked.
- [ ] Compression artifacts are acceptable at actual display size.
- [ ] Transparency is intentional and edge quality is clean.
- [ ] Color is verified in the target environment.
- [ ] File names and folder structure are consistent.
- [ ] Exported files have been reopened and inspected.
- [ ] Responsive variants use accurate dimensions and descriptors.
- [ ] Print settings are based on confirmed production requirements.
- [ ] Editable master files are preserved.
- [ ] Handoff includes a manifest or clear usage notes where needed.
