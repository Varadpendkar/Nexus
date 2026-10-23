# SKILL: iconography-illustration

**Layer:** 43 — UI/UX Design

**Goal:** Design, select, systematize, and implement icons and illustrations that communicate clearly, reinforce product identity, remain accessible, and scale across responsive interfaces and real product states.

---

## Why This Matters (Senior Perspective)

Icons and illustrations are not decoration added after the interface is finished. They are visual language. An icon can help a person recognize an action, scan a toolbar, identify a status, or understand a navigation destination. An illustration can explain an unfamiliar concept, make an empty state feel intentional, communicate a product's personality, or help a user recover from an error. When these elements are inconsistent, ambiguous, inaccessible, or visually louder than the content, they create friction rather than reducing it.

Beginners often choose icons because they look attractive in a library preview. That is not enough. Two icons can have similar silhouettes but different meanings across products. A heart might mean favorite, like, health, or saved content. A bell might indicate notifications, reminders, or alert settings. A magnifying glass is commonly understood as search, but an unusual abstract symbol may require a label. A senior designer considers the task, audience, context, surrounding text, cultural assumptions, and cost of misinterpretation before choosing a symbol.

Consistency matters as much as individual quality. Icons from different libraries often vary in stroke weight, corner treatment, perspective, fill style, optical size, and level of detail. Combining them without normalization makes a product feel assembled rather than designed. A system should define icon sizes, stroke or fill rules, alignment, active states, spacing, and rules for when labels are required. It should also establish whether icons are decorative, redundant with visible text, or the only accessible name for an action.

Illustrations require similar discipline. A landing-page hero illustration may support the brand story, while an onboarding illustration should help users understand the next step. A decorative scene that consumes half the screen but explains nothing can slow the task and compete with the headline. Illustration style must fit the product's audience and tone, and it must survive practical constraints: responsive cropping, dark mode, localization, loading performance, and use at different sizes.

For production work, the asset itself is only one part of the job. SVGs can contain oversized markup, hard-coded colors, inaccessible titles, or unexpected view boxes. Icon fonts may create alignment and accessibility problems. Raster illustrations can blur on high-density screens or increase transfer size. Inline SVG, external SVG, CSS masks, and image assets each have different trade-offs. A design system needs an implementation policy, not merely a folder of files.

This skill focuses on choosing and creating visual assets based on meaning, consistency, accessibility, and maintainability. It covers icon anatomy, grid and optical alignment, stroke consistency, semantic naming, SVG implementation, accessible names, illustration composition, empty and error states, responsive behavior, theming, performance, and quality assurance. The target is a portfolio or client product where visual assets feel deliberate and useful—not a page where icons are sprinkled into every card to make it appear more polished.

---

## Core Concepts

### 1. Start with meaning and task context

An icon should help users recognize or predict an action. Before choosing a symbol, write down what it represents, where it appears, and what happens when a person activates it. Then check whether the symbol is familiar to the intended audience and whether the surrounding interface provides enough context.

Do not assume that a symbol has a universal meaning. A flag can mean report, bookmark, country, or priority. A star can mean rating, favorite, or featured content. When the cost of misinterpretation is high, use visible text or a tooltip in addition to the icon. Labels are especially important for unfamiliar workflows, high-impact actions, and navigation destinations.

A practical review starts with a simple question: if the label disappeared, could a new user predict the control's purpose? If not, the icon may need a label, a more conventional symbol, or a different interaction design.

```html
<button class="toolbar-action" type="button" aria-label="Save report">
  <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
    <path d="M6 3.75h12v16.5l-6-3.5-6 3.5z" />
  </svg>
  <span class="toolbar-action__label">Save report</span>
</button>
```

For a desktop toolbar with limited space, the visible label may be omitted only if the control has a clear accessible name and an appropriate tooltip or other discoverability aid. Do not hide the label merely to make the interface look minimal.

### 2. Establish a coherent icon family

A coherent icon family shares visual rules: stroke width, cap and join style, corner radius, level of detail, perspective, filled versus outlined treatment, and optical size. Consistency does not require every icon to have identical geometry. A bell and a document naturally occupy their bounding boxes differently, but they should still feel like members of the same family.

Choose one primary library or define a custom drawing standard. If assets from multiple sources are necessary, normalize them before use. Do not combine a thin outlined search icon with a heavy filled cart and a detailed three-dimensional settings gear unless that contrast is intentional and meaningful.

```css
.icon {
  inline-size: 1.25rem;
  block-size: 1.25rem;
  flex: none;
  display: block;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
```

A CSS rule cannot make unrelated SVGs truly consistent if their path geometry and proportions differ. Inspect the actual artwork, not only its CSS box. When importing assets, compare them at the same rendered size beside each other.

### 3. Design for an icon grid without worshipping the grid

An icon grid gives a repeatable drawing area and helps align families of symbols. Common view boxes use a square coordinate system, but the path does not have to touch every edge. Internal optical margins are often necessary because a circular symbol can appear smaller than a square symbol even when both share the same dimensions.

Use the grid to establish consistency, then make small optical adjustments when a symbol looks visually too small, heavy, high, or low. The correction should be local and explainable. If every icon needs a different unexplained CSS transform, the underlying assets or alignment policy may be inconsistent.

```html
<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <circle cx="12" cy="12" r="8.25" />
</svg>
```

Review icons at their actual product sizes—often 16, 20, and 24 CSS pixels—rather than only at a large artboard scale. Thin strokes and small gaps can disappear at small sizes, particularly at fractional scaling factors.

### 4. Choose stroke weight and detail for the rendered size

Stroke weight affects visual emphasis and legibility. Very thin strokes can disappear on low-contrast displays or at small sizes. Heavy strokes can make a toolbar look crowded. Small internal details may merge when an icon is rendered at 16 pixels, even if they look elegant in a design file.

Set a baseline stroke weight for the family and test at realistic sizes. If an icon requires a different weight to remain legible, consider a dedicated small-size variant instead of applying arbitrary scaling. Filled and outlined variants can coexist, but define when each is used—for example, outline for default state and fill for selected state.

```css
.icon--small {
  inline-size: 1rem;
  block-size: 1rem;
  stroke-width: 2;
}

.icon--regular {
  inline-size: 1.25rem;
  block-size: 1.25rem;
  stroke-width: 1.8;
}

.icon--large {
  inline-size: 1.5rem;
  block-size: 1.5rem;
  stroke-width: 1.7;
}
```

These values are a starting point, not a universal specification. Compare actual glyphs side by side and verify contrast against the surface on which they appear.

### 5. Use labels when recognition is uncertain

Icons are efficient when users already know the meaning, but they are not a substitute for clear language. A label is usually appropriate for primary navigation, unfamiliar actions, destructive operations, and actions whose meaning changes by context. Icon-only controls may be appropriate for widely recognized actions in dense toolbars, provided they have accessible names and sufficient discoverability.

Do not rely on a tooltip as the only accessible name. Tooltips can be unavailable to touch users, may appear only after a delay, and can be difficult to discover. The control needs an accessible name in its markup, regardless of whether a tooltip is also present.

```html
<button type="button" class="icon-button" aria-label="Close dialog">
  <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
</button>
```

When the action is high impact, consider a text label and a confirmation flow rather than expecting a symbol alone to convey severity.

### 6. Treat SVG as structured interface markup

SVG is useful for icons because it scales cleanly, can inherit CSS color, and supports precise paths. Its markup still needs a deliberate contract. Use a predictable view box, remove editor metadata that is not required, avoid unnecessary filters for tiny icons, and decide whether the SVG is decorative or meaningful. Inline SVG can inherit `currentColor`; an external SVG file may be easier to cache and manage but has different styling constraints.

Avoid pasting a large exported SVG directly into a component without inspecting it. Design tools may include dozens of groups, clipping paths, hidden layers, or embedded raster data. Simplify the asset where practical and retain only the structure needed for the result.

```html
<svg
  class="icon"
  viewBox="0 0 24 24"
  aria-hidden="true"
  focusable="false"
>
  <path d="M4 12h16M12 4v16" />
</svg>
```

For meaningful standalone SVG images, provide an accessible name with an appropriate `<title>` or surrounding text. For icons that duplicate a button's visible label, hide the SVG from assistive technology so the name is not repeated.

### 7. Understand decorative and informative images

An image is decorative when it adds no information beyond the surrounding content. Decorative images should not create extra noise for screen-reader users. Informative illustrations communicate a concept, status, or relationship that may not be clear from nearby text and need an appropriate text alternative or equivalent explanation.

Do not write alt text that merely describes every visible detail. The text alternative should communicate the image's purpose in context. If an illustration shows a package arriving and the adjacent heading already says “Your order is on its way,” the image may be decorative. If a diagram explains a multi-step process that is not described elsewhere, provide a meaningful alternative or a nearby textual explanation.

```html
<!-- Decorative art: the adjacent heading communicates the message. -->
<img src="/assets/order-progress-illustration.svg" alt="" />

<!-- Informative diagram: concise alternative conveys its purpose. -->
<img
  src="/assets/approval-flow.svg"
  alt="Three-step approval flow: submitted, reviewed, and approved."
/>
```

Avoid redundant alt text such as “image of illustration showing.” State the useful information, and make sure the content remains understandable if the image fails to load.

### 8. Make icon-only controls accessible

An icon-only button must have a programmatic name. The visible SVG should usually be hidden from assistive technology when the button already has a name. Ensure the control is keyboard reachable, has a visible focus indicator, and provides a usable hit area. A 16-pixel glyph can sit inside a much larger button target.

Use a native `<button>` for an action rather than a clickable `<span>` or `<div>`. Native controls supply keyboard behavior and semantics that custom elements would otherwise need to recreate. Keep the accessible name specific to the action and context: “Remove team member” is clearer than “Remove” when several remove buttons appear on one screen.

```html
<button class="icon-button" type="button" aria-label="Remove saved filter">
  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13" />
  </svg>
</button>
```

If the control changes state, expose that state using the correct semantic attribute, such as `aria-pressed` for a toggle button. Do not use `aria-pressed` on a button that simply navigates to another page.

### 9. Design icon states, not just the default appearance

An icon can communicate default, hover, focus, pressed, selected, disabled, loading, success, or error states. These states should be predictable across the product. Do not rely on color alone to show selection; combine color with a filled variant, indicator, label, or other meaningful change where appropriate.

State changes should preserve the icon's recognizable silhouette. If a selected bookmark becomes an unrelated star, the user may interpret it as a different action. Keep the interaction feedback visible and make sure disabled controls remain understandable without appearing active.

```css
.favorite-button {
  color: var(--icon-muted);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 0.5rem;
}

.favorite-button[aria-pressed="true"] {
  color: var(--favorite-color);
  background: var(--favorite-surface);
}

.favorite-button:focus-visible {
  outline: 3px solid var(--focus-ring);
  outline-offset: 3px;
}
```

Test state styling in light and dark themes and with high-contrast settings where applicable. Check hover, focus, and pressed states independently instead of assuming one state will cover all interactions.

### 10. Select illustration style based on product character

Illustration style communicates personality. Geometric shapes may feel technical and systematic; soft organic forms may feel approachable; detailed editorial drawings can suggest craft; simple diagrams can communicate process. None is universally better. The right style is the one that supports the product's audience, trust requirements, brand, and task.

Create a short style specification before commissioning or drawing a set: palette, line style, perspective, shape language, character proportions, texture, detail level, and rules for backgrounds. Without that specification, a team may create individual illustrations that look good alone but do not belong together.

```css
.illustration-frame {
  background: var(--illustration-surface);
  border-radius: 1.5rem;
  padding: clamp(1rem, 3vw, 2.5rem);
  overflow: clip;
}

.illustration-frame img {
  display: block;
  inline-size: 100%;
  block-size: auto;
}
```

Do not choose a playful illustration style for a high-trust financial workflow without considering whether it undermines seriousness. Brand character should support the user's confidence, not compete with it.

### 11. Give illustrations a clear job

Every illustration should have a reason to exist. It may explain a concept, make an empty state less confusing, reinforce a brand promise, guide attention, or make a success state feel rewarding. If it does none of these things, it may be decoration that increases download size and visual noise.

Write the job in one sentence before creating the art. For an empty project list, the job might be “help users understand that no projects exist yet and direct them to create the first one.” The image should reinforce that message, not introduce a competing story.

```html
<section class="empty-state" aria-labelledby="empty-projects-title">
  <img src="/assets/empty-projects.svg" alt="" />
  <h2 id="empty-projects-title">Start your first project</h2>
  <p>Create a project to organize work, files, and team updates.</p>
  <a class="button" href="/projects/new">Create project</a>
</section>
```

The action and explanation remain available without the image. The illustration supports the message rather than carrying the entire meaning alone.

### 12. Design empty states around the next useful action

An empty state is not merely a blank screen with a cute drawing. It should explain why the region is empty, what the user can do next, and whether the emptiness is expected. A new account with no saved reports differs from a search that returned no results or a connection that failed.

Choose an illustration that supports the specific state. A new-user empty state can show a starting point; a filtered search with no matches may need a small search symbol and suggestions to change filters; an error state may need a restrained status illustration that does not distract from recovery instructions.

```html
<section class="empty-state" aria-labelledby="no-results-title">
  <svg class="empty-state__icon" viewBox="0 0 48 48" aria-hidden="true">
    <circle cx="20" cy="20" r="11" />
    <path d="m28 28 9 9M14 20h12" />
  </svg>
  <h2 id="no-results-title">No reports match these filters</h2>
  <p>Try a wider date range or remove one of the selected filters.</p>
  <button type="button">Clear filters</button>
</section>
```

Avoid generic “Nothing here” messaging when the user needs a reason or a recovery action. The state should be informative even if the illustration is hidden or unavailable.

### 13. Keep illustration composition responsive

Illustrations designed for a wide desktop hero may become awkward on mobile. Important subjects can be cropped, details can become too small, and the illustration can push the primary action below the fold. Plan responsive behavior as part of the composition rather than shrinking the entire artwork blindly.

Use responsive image assets or alternate crops when the composition genuinely differs by viewport. If a single illustration works at every size, use a flexible width and natural aspect ratio. Avoid fixed height and `object-fit: cover` unless cropping is intentional and the important content stays inside the safe area.

```css
.hero-art {
  inline-size: min(100%, 36rem);
  block-size: auto;
  display: block;
  margin-inline: auto;
}

@media (max-width: 42rem) {
  .hero-art {
    inline-size: min(100%, 24rem);
  }
}
```

Check the artwork with the real headline and call to action. A responsive illustration is not successful if it looks beautiful but pushes the task-critical content too far down the page.

### 14. Use color and contrast deliberately

Icons and illustrations must remain legible against their backgrounds. A pale icon on a light surface can disappear, and a complex illustration can lose meaning when its colors have insufficient separation. Use contrast appropriate to the content and purpose, and do not communicate status through hue alone.

Decorative artwork may have different contrast needs from functional icons, but functional controls and meaningful graphical objects should remain distinguishable. Review assets in light and dark themes, grayscale, and high-contrast environments where practical. Use the product's color tokens instead of embedding arbitrary hex values in every SVG.

```css
.icon-button {
  color: var(--icon-foreground);
  background: var(--control-surface);
  border: 1px solid var(--control-border);
}

.icon-button:hover {
  background: var(--control-surface-hover);
}
```

A contrast checker can help assess colors, but visual inspection is still needed for thin strokes, intricate details, and icons that depend on subtle differences in shape.

### 15. Support dark mode and theme changes

Assets may contain hard-coded dark outlines or white backgrounds that become awkward in a dark interface. Prefer transparent backgrounds for reusable artwork and define how icon strokes, fills, and illustration palettes adapt to theme tokens. Some illustrations need separate light and dark variants because their visual structure depends on the background.

Do not blindly invert every image. Inversion can distort brand colors, skin tones, shadows, and semantic colors. Instead, define theme-specific variables or select a dedicated asset variant where appropriate.

```css
:root {
  color-scheme: light;
  --icon-foreground: #334155;
  --illustration-surface: #f1f5f9;
}

[data-theme="dark"] {
  color-scheme: dark;
  --icon-foreground: #e2e8f0;
  --illustration-surface: #1e293b;
}

.icon {
  color: var(--icon-foreground);
  stroke: currentColor;
}
```

Check each asset on the actual surface where it appears. A transparent SVG can still contain hard-coded white shapes that become visible as unwanted blocks in dark mode.

### 16. Choose an asset delivery strategy

Inline SVG, external SVG, CSS masks, and raster images serve different needs. Inline SVG offers direct styling and convenient accessibility control, but duplicating large markup across many pages can increase document size. External SVG can be cached and reused, though styling internal paths from the parent page is limited. CSS masks can work well for monochrome decorative icons but require a reliable fallback and careful handling of color and semantics. Raster assets are appropriate for detailed artwork and textured scenes, but must be exported at suitable resolutions and sizes.

Choose based on interaction, caching, theming, complexity, and build setup. Document the chosen approach so developers do not invent a new technique for every screen.

```css
.status-symbol {
  inline-size: 1.25rem;
  block-size: 1.25rem;
  background-color: currentColor;
  mask: url("/assets/status-check.svg") center / contain no-repeat;
}
```

A CSS mask is usually decorative unless paired with a properly named control or adjacent text. Do not assume that the mask's source filename becomes an accessible name.

### 17. Optimize assets without degrading visual quality

Large illustrations can slow the initial page, particularly on mobile connections. Export only the required artwork, remove unused layers and metadata, compress SVG markup safely, and use responsive raster formats where suitable. Do not optimize by removing important details or lowering resolution until text-like details become unreadable.

Set explicit width and height or an aspect ratio where appropriate to reduce layout shift. Lazy-load below-the-fold illustrations, but avoid delaying the main hero artwork if it is a critical part of the initial experience. Test the real network transfer and rendering behavior rather than assuming a vector file is automatically small.

```html
<img
  src="/assets/workspace-empty-state.svg"
  alt=""
  width="320"
  height="240"
  loading="lazy"
  decoding="async"
/>
```

Use lazy loading only when it helps. The browser should not have to wait for a lazy-loaded image that is central to the first viewport. Measure image weight and layout shift with browser DevTools and performance tooling.

### 18. Name, organize, and document assets

Asset names should describe purpose or meaning rather than appearance alone. `search.svg`, `notification-bell.svg`, and `empty-projects.svg` are more useful than `blue-icon-04.svg`. Names based only on color or position become misleading when themes and layouts change.

Keep a documented source of truth for icon families, variants, ownership, and usage restrictions. Record whether an asset is decorative, which themes it supports, and whether it can be recolored. A shared asset library should make the right asset easy to find and discourage local copies that drift apart.

```text
assets/
  icons/
    search.svg
    close.svg
    notification.svg
  illustrations/
    empty-projects.svg
    report-ready.svg
    connection-error.svg
```

Avoid creating near-duplicate files with unclear differences. If variants are needed, use consistent names such as `notification-filled.svg` and `notification-outline.svg`, and document when each is appropriate.

### 19. Test icons and illustrations in context

An asset can look excellent in a design file and fail inside a real control. It may appear too small beside text, shift a button baseline, become low contrast on a tinted background, or lose detail at the smallest supported size. Test assets in their actual components, not only in an isolated gallery.

Create a visual QA sheet with common sizes, themes, states, and backgrounds. Inspect the icon family side by side. Check whether stroke weight and optical scale are consistent, and whether labels and icons remain aligned when text wraps or the interface switches to another language.

```html
<nav aria-label="Primary navigation">
  <a href="/overview">
    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m3 11 9-7 9 7M5 10v10h14V10" />
    </svg>
    <span>Overview</span>
  </a>
</nav>
```

Use browser DevTools to inspect dimensions, computed colors, overflow, focus behavior, and image loading. Add visual regression checks for high-use controls and test keyboard navigation with real focus states.

### 20. Define when not to use an illustration

Not every state needs artwork. A small inline status icon may be enough for a compact form message. A dense enterprise dashboard may benefit more from clear labels and charts than from large decorative scenes. A destructive error may need direct instructions rather than a playful character.

Choose the simplest visual treatment that supports the task. Use illustrations when they clarify, orient, reassure, or strengthen the brand. Avoid them when they delay the primary action, add cognitive load, create accessibility work without benefit, or make a serious situation feel trivial.

```html
<p class="field-error" id="email-error">
  Enter an email address in the format name@example.com.
</p>
```

This field error needs clear text and a programmatic relationship to the input, not a large illustration. Visual craft includes knowing when to remove decoration.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Icon button with an accessible name

**What it does:** Provides a compact visual action while preserving a reliable accessible name and keyboard interaction.

**When to use it:** Use it for close, search, more options, remove, and other familiar actions in toolbars or compact controls.

```html
<button type="button" class="icon-button" aria-label="Open notification settings">
  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M12 3a6 6 0 0 0-6 6v4l-2 3h16l-2-3V9a6 6 0 0 0-6-6zM10 19a2 2 0 0 0 4 0" />
  </svg>
</button>
```

Keep the hit area larger than the visual glyph and add a visible `:focus-visible` style. The accessible name should describe the action in context.

### Pattern 2: Icon plus visible label

**What it does:** Combines a recognizable symbol with language so users can identify the action quickly.

**When to use it:** Use it for primary navigation, unfamiliar actions, onboarding, and controls where ambiguity would slow the user down.

```html
<a class="nav-link" href="/billing">
  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M8 8h8M8 12h8M8 16h4" />
  </svg>
  <span>Billing</span>
</a>
```

The icon should reinforce the label, not introduce a second interpretation. Preserve the visible label on small screens unless the information architecture explicitly supports a different navigation pattern.

### Pattern 3: Consistent SVG icon component

**What it does:** Applies shared dimensions, stroke behavior, and alignment to icons from one coherent family.

**When to use it:** Use it in a component library where icons recur across buttons, navigation, forms, and status messages.

```css
.icon {
  inline-size: 1.25rem;
  block-size: 1.25rem;
  display: block;
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
```

The shared CSS is a baseline, not a substitute for checking the path geometry. Review imported assets at their final sizes before declaring the family consistent.

### Pattern 4: Empty state with a useful next action

**What it does:** Explains why content is absent and provides a concrete path forward.

**When to use it:** Use it for first-use screens, empty collections, no-result searches, and setup workflows.

```html
<section class="empty-state" aria-labelledby="empty-title">
  <img src="/assets/empty-projects.svg" alt="" width="240" height="180" />
  <h2 id="empty-title">No projects yet</h2>
  <p>Create a project to keep tasks and files together.</p>
  <a href="/projects/new">Create your first project</a>
</section>
```

Keep the explanation and action meaningful without the image. For no-results states, offer ways to revise filters instead of treating the situation as a first-use state.

### Pattern 5: Theme-aware icon color

**What it does:** Uses design tokens so icons remain coherent when surfaces and themes change.

**When to use it:** Use it for monochrome icons that should inherit text or semantic colors.

```css
:root {
  --icon-color: #334155;
  --focus-ring: #2563eb;
}

[data-theme="dark"] {
  --icon-color: #e2e8f0;
  --focus-ring: #93c5fd;
}

.icon {
  color: var(--icon-color);
  stroke: currentColor;
}
```

Do not recolor multi-color illustrations blindly. Theme-specific artwork may need a dedicated asset variant and explicit QA.

### Pattern 6: Responsive illustration frame

**What it does:** Keeps artwork proportional and prevents it from dominating narrow layouts.

**When to use it:** Use it for landing-page heroes, onboarding panels, product explainers, and empty states.

```css
.illustration-frame {
  inline-size: min(100%, 34rem);
  margin-inline: auto;
}

.illustration-frame img {
  display: block;
  inline-size: 100%;
  block-size: auto;
}
```

Check the composition with the real text and action beside it. If the mobile crop changes meaning, provide a separate crop or reposition the artwork instead of forcing one layout everywhere.

### Pattern 7: State icon with text redundancy

**What it does:** Uses icon shape and text together to communicate a status without relying only on color.

**When to use it:** Use it for success, warning, failure, and pending states in forms, dashboards, and transaction flows.

```html
<p class="status status--success">
  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="m5 12 4 4L19 6" />
  </svg>
  <span>Payment received</span>
</p>
```

Color may reinforce the state, but the label remains explicit. Ensure the status is announced appropriately if it updates dynamically.

### Pattern 8: Asset inventory and usage contract

**What it does:** Documents the meaning, variant, theme support, and accessibility expectations of visual assets.

**When to use it:** Use it when several designers and developers share assets across a product or client portfolio.

```text
Asset: notification-outline.svg
Purpose: Opens notification preferences
Style: Outline, 1.8-unit stroke, rounded joins
Sizes: 16, 20, 24 CSS pixels
Accessible use: Hide SVG inside a named button
Theme behavior: Inherit currentColor
Do not use for: Notification count or warning state
```

This small contract prevents asset names from becoming the only documentation and makes visual reviews more consistent.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Choosing icons only because they look attractive | The symbol is reviewed outside its task context | Validate the meaning with the actual label, workflow, and target audience |
| Mixing unrelated icon families | Assets are collected from multiple libraries without normalization | Select one primary family and document stroke, cap, join, and size rules |
| Using icon-only controls without names | Visual recognition is mistaken for accessible labeling | Add a specific accessible name and test it with a screen reader |
| Using tooltips as the only name | Hover behavior is treated as equivalent to semantic markup | Put the accessible name on the control and use the tooltip only as additional help |
| Scaling a thin icon down without inspection | The source looks crisp on a large artboard | Test at actual CSS sizes and use a small-size variant if needed |
| Using color alone for status | Color is the fastest visual distinction during design | Pair color with text, shape, or another clear state indicator |
| Treating every image as informative | Alt text is added without considering the surrounding content | Use empty alt text for decorative images and concise alternatives for informative images |
| Writing overly detailed alt text | The author describes every visible object rather than the purpose | Describe the information needed in the current context |
| Using a large illustration for a minor message | Decoration is mistaken for product personality | Use the smallest visual treatment that supports the task |
| Making an empty state purely decorative | The image is designed before the user's next action | Explain the empty condition and provide a useful next step |
| Hard-coding icon colors in SVG paths | Exported markup is used without a theming plan | Use `currentColor` for monochrome icons or document intentional fixed colors |
| Inverting all artwork for dark mode | Theme support is treated as a simple filter | Create theme-aware tokens or dedicated variants and inspect every asset |
| Shipping oversized exported SVGs | The file is assumed to be efficient because it is vector | Remove unnecessary groups and metadata, then measure transfer size |
| Lazy-loading the hero illustration | All images are given the same loading behavior | Prioritize critical above-the-fold artwork and lazy-load noncritical images |
| Using fixed-height illustration containers carelessly | Desktop composition is copied to mobile | Preserve aspect ratio or define intentional responsive crops |
| Making the icon smaller instead of enlarging the hit area | The visible glyph size is confused with target size | Keep the glyph visually balanced inside a larger interactive control |
| Using a clickable `div` for an icon action | Styling is prioritized over native semantics | Use a native `<button>` or `<a>` according to the action |
| Forgetting selected and disabled states | Only the default icon is included in the design file | Specify hover, focus, pressed, selected, disabled, and loading behavior |
| Allowing decorative artwork to compete with the heading | Illustration scale is judged in isolation | Review the full composition and reduce artwork prominence when hierarchy suffers |
| Naming assets by color or position | Files are organized around a single screenshot | Use stable names based on purpose and maintain a documented inventory |
| Making a status icon ambiguous | A generic symbol is used without adjacent language | Add a concise status label and use a recognizable visual treatment |
| Relying on SVG titles for button names | SVG semantics are confused with control semantics | Name the button itself and hide redundant icon markup from assistive technology |
| Ignoring RTL and localization | Assets are tested only in one language and direction | Check text expansion, directional icons, layout order, and logical spacing |
| Leaving focus indicators clipped | An overflow container was added without keyboard QA | Inspect `:focus-visible` states and change the container or focus treatment |
| Keeping one illustration for every viewport despite meaning loss | Reuse is prioritized above composition | Use a responsive crop or alternate asset when the subject's hierarchy changes |

---

## Mental Models

1. **Meaning before decoration** — An icon or illustration should have a clear job before it is selected or drawn.
2. **A family needs shared rules** — Consistency comes from common stroke, geometry, scale, and state conventions.
3. **The rendered size is the real test** — Artwork must be judged in its actual control and viewport, not only on a design canvas.
4. **Accessible names belong to actions** — The button or link needs a name even when its visible content is an icon.
5. **Illustrations support the message** — They should clarify, orient, reassure, or reinforce identity rather than replace essential instructions.
6. **State must survive grayscale** — Meaning should not depend on color alone.
7. **Assets are product code** — File size, naming, theming, loading, and semantic behavior affect maintainability.
8. **Responsive composition is intentional composition** — A desktop illustration may need a different crop or position on mobile.
9. **Less can be more useful** — The right icon or short label can outperform a large decorative scene.
10. **Test in context** — An asset is only successful when it works inside the real component, with real content and interactions.

---

## Quick Reference

| Need | Recommended approach | Validate |
|---|---|---|
| Choose an icon | Start with task meaning and familiar conventions | Ask whether users can predict the action |
| Keep an icon family coherent | Standardize stroke, caps, joins, grid, and optical scale | Compare icons at 16, 20, and 24 CSS pixels |
| Build icon-only actions | Use native buttons with specific accessible names | Test keyboard focus and screen-reader output |
| Add labels | Prefer visible labels when recognition is uncertain | Check discoverability without relying on hover |
| Handle decorative images | Use empty alt text when surrounding content carries the meaning | Verify no redundant announcement occurs |
| Handle informative illustrations | Provide concise alternative text or a nearby explanation | Confirm the information remains available without the image |
| Build empty states | Explain the condition and offer the next useful action | Test first-use, no-results, and failure scenarios separately |
| Support dark mode | Use theme tokens or dedicated artwork variants | Inspect hard-coded fills and backgrounds |
| Keep assets fast | Remove unused markup and measure transfer size | Check loading and layout shift in DevTools |
| Make illustrations responsive | Preserve aspect ratio or create deliberate alternate crops | Review narrow and wide layouts with real content |
| Communicate status | Pair icon shape and color with text | Confirm meaning remains clear in grayscale |
| Organize the library | Use purpose-based names and a usage contract | Search for duplicate or unexplained variants |
| Support keyboard use | Use native controls and visible `:focus-visible` styles | Navigate the complete flow without a pointer |
| Debug alignment | Inspect box size, view box, baseline, and computed styles | Use browser DevTools and a visual QA sheet |
| Avoid unnecessary decoration | Select the smallest treatment that supports the task | Check whether the illustration competes with the primary action |

---

## Build Challenge

### Project: Create a production-ready visual asset system for a SaaS workspace

Build a small interface for **Northstar Workspace**, a team productivity product. It includes a primary navigation, icon-only toolbar actions, a project list, an empty state, a payment status, a warning message, and a responsive onboarding panel with an illustration. Your task is to create a coherent icon and illustration system that is meaningful, accessible, theme-aware, and maintainable.

### Requirements

1. **Create an icon inventory.** Include at least 12 icons used for distinct actions or navigation destinations. Record each icon's purpose and avoid ambiguous duplicate meanings.
2. **Define visual rules.** Document icon view box, rendered sizes, stroke weight, caps, joins, filled variants, and optical correction policy.
3. **Implement native controls.** Use semantic buttons and links for actions and navigation rather than clickable generic elements.
4. **Name icon-only controls.** Give every icon-only action a contextual accessible name and ensure the visible SVG is hidden from assistive technology when redundant.
5. **Add focus states.** Include visible `:focus-visible` styling and verify the focus ring is not clipped by parent containers.
6. **Create state variants.** Demonstrate default, hover, focus, selected, disabled, and status appearances where relevant.
7. **Build three illustrations.** Create or select artwork for an empty project list, a successful report, and a connection failure. Give each illustration a specific communication goal.
8. **Write image alternatives.** Mark decorative art with empty alt text and provide meaningful alternatives or equivalent text for informative artwork.
9. **Implement an empty state.** Explain why content is absent and provide a clear next action. Make the state useful without the illustration.
10. **Support theme changes.** Use theme tokens for monochrome assets and provide appropriate variants for illustrations that cannot be safely recolored.
11. **Make the artwork responsive.** Preserve important subjects at narrow widths and avoid cropping that changes the illustration's meaning.
12. **Optimize asset delivery.** Remove unused SVG markup, set image dimensions where appropriate, and lazy-load only noncritical below-the-fold artwork.
13. **Test status clarity.** Ensure success, warning, and failure states are understandable without relying on color alone.
14. **Create an asset usage guide.** Document file names, intended purpose, variants, theme behavior, and accessibility expectations.
15. **Test localization and layout.** Check longer labels, RTL behavior where supported, and how icons align when text wraps.
16. **Run visual QA.** Compare icons at their final sizes and inspect them beside real labels, surfaces, and controls.
17. **Use browser DevTools.** Inspect dimensions, computed colors, overflow, image requests, and focus behavior. Record and fix at least three concrete issues found during inspection.

### Failure condition

The challenge fails if any icon-only control lacks an accessible name, the focus indicator is invisible or clipped, status meaning depends only on color, the empty state provides no next action, or a responsive illustration crops away information necessary to understand its message. It also fails if the asset set mixes inconsistent icon families without a documented reason, contains unnecessary heavy markup that has not been reviewed, or only works in one theme.

### Definition of Done / Success Criteria

- [ ] Every icon has a documented purpose and uses a coherent visual family.
- [ ] Icon-only controls use native semantics and specific accessible names.
- [ ] Decorative and informative images are distinguished correctly.
- [ ] The empty state explains the condition and provides a clear next step.
- [ ] Status states remain understandable without color alone.
- [ ] Focus indicators remain visible during keyboard navigation.
- [ ] Assets render cleanly at their real sizes and across supported viewports.
- [ ] Dark-mode artwork has been reviewed rather than blindly inverted.
- [ ] SVG and raster asset delivery has been checked for size and layout shift.
- [ ] Longer labels and localized layouts do not break icon alignment.
- [ ] The asset inventory explains names, variants, and intended use.
- [ ] At least three issues discovered through browser DevTools have been corrected and documented.

---

## Production Debugging Checklist

1. Reproduce the visual issue in the actual component, at the affected viewport and theme.
2. Inspect the SVG view box, path bounds, rendered dimensions, and computed stroke or fill.
3. Compare the icon with neighboring assets at the same CSS size to identify family inconsistencies.
4. Inspect the control's accessible name, native semantics, keyboard reachability, and `:focus-visible` behavior.
5. Check whether a parent clips the focus ring or crops the illustration.
6. Verify contrast, state clarity, and whether meaning remains understandable without color.
7. Inspect image transfer size, loading priority, and layout shift in browser DevTools.
8. Test with longer text, screen-reader output, keyboard navigation, and the product's alternate theme.
9. Remove temporary diagnostic styles and record the corrected asset or component rule.
10. Add a regression check for the specific size, state, theme, or content condition that exposed the issue.

### Topic-specific gotchas

- **Gotcha:** `aria-label` on an SVG does not automatically give a containing button the correct accessible name; name the interactive control itself.
- **Gotcha:** A vector file is not automatically lightweight. Exported filters, masks, metadata, and nested groups can make an SVG surprisingly expensive.
- **Gotcha:** A CSS mask can look correct visually while contributing no accessible name. Treat it as decorative and name the control or provide nearby text.
- **Gotcha:** A selected icon that changes to an unrelated silhouette can make the state look like a different action rather than the same action being active.
- **Gotcha:** `object-fit: cover` can crop a meaningful character, label, or diagram step at mobile widths even when the image box is technically responsive.
- **Gotcha:** A white shape embedded in an SVG may become an opaque-looking patch on dark surfaces even if the outer SVG background is transparent.

### Browser support and tooling notes

SVG, CSS custom properties, `currentColor`, CSS Grid, Flexbox, and `:focus-visible` are supported by current evergreen browsers. Check the actual browser matrix for the product, especially when using CSS masks, advanced SVG filters, or newer image formats. Use browser DevTools to inspect computed dimensions, contrast-related styles, overflow, focus states, and network transfer. Test screen-reader output and keyboard navigation in addition to visual appearance. Automated visual regression is useful for detecting changes in icon alignment and asset rendering, but it cannot replace a human review of meaning, accessible names, and whether an illustration genuinely helps the task.
