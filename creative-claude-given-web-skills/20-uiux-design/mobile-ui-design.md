# SKILL: mobile-ui-design

**Layer:** 43 — UI/UX Design

**Goal:** Design mobile interfaces that feel native to the device, remain understandable across screen sizes and input methods, and support real tasks under the constraints of touch, limited space, variable connectivity, accessibility needs, and interruption.

---

## Why This Matters (Senior Perspective)

Mobile UI design is not desktop UI compressed into a narrow column. A phone changes the physical relationship between a person and a product: the display is close, the available area is small, fingers obscure part of the interface, the device moves with the user, connectivity may fluctuate, and tasks are frequently interrupted. A screen can look polished in a static mockup while failing the moment the keyboard opens, the user increases text size, a permission is denied, or a network request takes longer than expected.

Senior designers therefore begin with the user's task and the conditions in which it happens. They decide what deserves the first viewport, what can be deferred, which actions need a forgiving touch target, and how the layout behaves when content grows. They distinguish responsive behavior from adaptive behavior: responsive layouts fluidly use available space, while adaptive layouts can change navigation, density, or interaction patterns when the environment changes materially. They treat accessibility, loading, empty, error, offline, and permission-denied states as part of the product—not as polish for later.

Mobile design also has business consequences. A checkout that loses its primary button beneath the keyboard can lower completion. A dashboard that renders tiny desktop charts on a phone can create false confidence. A gesture-only action can hide functionality from new users, keyboard users, and assistive technology. A permission prompt shown before its value is clear can lead to permanent denial. These are design defects even if the visual system is beautiful.

A strong mobile designer works with product, engineering, research, and content partners. They test on actual devices, inspect browser and platform differences, use semantic HTML where the product is web-based, and document behavior rather than handing off a screenshot alone. They can explain why a bottom action is appropriate for a one-handed flow, why a table becomes cards on narrow screens, or why a complex gesture needs a visible alternative. They optimize for clarity, reachability, resilience, and trust—not for novelty.

In portfolio and freelance work, mobile quality is often the fastest way to distinguish a thoughtful product designer from someone who merely arranges attractive cards. Show the full journey, including validation, keyboard behavior, loading, error recovery, and accessibility—not just the hero screen. A senior-quality deliverable makes the interface predictable under realistic conditions.

---

## Core Concepts

### 1. Start with the mobile task, not the desktop layout

Identify the user's main task, context, urgency, frequency, and consequences of failure. A user scanning a transit ticket has different needs from someone editing a complex spreadsheet. Map the happy path and the interruptions before choosing components.

A useful task brief includes the primary job, entry point, critical information, decision, completion signal, and recovery route.

```text
Task: Pay an invoice while away from a desk
Entry: Push notification or invoice list
Critical information: Merchant, amount, due date, account
Decision: Confirm amount and payment source
Completion: Clear receipt and updated status
Recovery: Retry safely without duplicate payment
```

Use this brief to remove low-priority content from the first screen. Do not remove information needed to make a safe decision merely to reduce scrolling.

**Gotcha:** “Mobile-first” does not mean “only design for the smallest screen.” It means establish the essential task and hierarchy under the tightest constraints, then expand deliberately.

### 2. Distinguish responsive from adaptive design

Responsive design lets content and layout respond continuously to available width. Adaptive design changes the composition or interaction model at meaningful thresholds—for example, replacing a bottom navigation bar with a side rail on a wide tablet.

Use content-driven breakpoints. A breakpoint should exist because the layout stops working, not because a particular device model has a popular width.

```css
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
  gap: 1rem;
}

@media (min-width: 52rem) {
  .product-page {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(18rem, 0.8fr);
    align-items: start;
    gap: 2rem;
  }
}
```

Test at intermediate widths, not only at named phone and desktop sizes. A layout that works at 390 px and 1440 px may fail at 720 px.

### 3. Treat the viewport as a changing environment

On mobile web, the visible area changes when browser chrome expands or collapses, the keyboard opens, or safe areas consume space. Avoid assuming `100vh` always equals the currently visible area.

```css
.app-shell {
  min-height: 100vh;   /* fallback */
  min-height: 100dvh;  /* dynamic viewport where supported */
}

.screen-content {
  padding:
    max(1rem, env(safe-area-inset-top))
    max(1rem, env(safe-area-inset-right))
    max(1rem, env(safe-area-inset-bottom))
    max(1rem, env(safe-area-inset-left));
}
```

Use `svh`, `lvh`, or `dvh` only when their semantics match the intended behavior, and provide a reasonable fallback. A fixed full-screen dialog should still allow its content to scroll when the available height shrinks.

**Gotcha:** Do not lock the page to the initial viewport height. Keyboard appearance and browser chrome changes can make important controls unreachable.

### 4. Design for touch, not mouse precision

Finger input is less precise than a pointer and can cover the target. Give interactive controls generous hit areas and enough separation to avoid accidental activation. A visually small icon may sit inside a larger invisible button target.

```css
.icon-button {
  display: inline-grid;
  place-items: center;
  min-inline-size: 44px;
  min-block-size: 44px;
  padding: 0.625rem;
  border: 0;
  border-radius: 0.75rem;
  background: transparent;
}

.icon-button:focus-visible {
  outline: 3px solid #2563eb;
  outline-offset: 3px;
}
```

A 44-by-44 CSS-pixel target is a useful design baseline, not a universal legal rule. Check the applicable accessibility standard and platform guidance for the product. Increase targets around destructive actions, dense toolbars, and frequently used controls.

### 5. Respect thumb reach and one-handed use

People often operate phones with one hand while walking, holding a bag, or supporting the device. Place frequent actions where they are easy to reach without making the interface unstable or hiding important content behind the thumb.

Create a reachability map for the actual device and use case. The lower region is often convenient, but it is not automatically the correct location for every action. Avoid placing critical controls too close to system gesture areas or the home indicator.

```text
Reachability review:
- Primary frequent action: comfortably reachable
- Secondary actions: visible without competing with the primary action
- Destructive action: deliberate, not easy to trigger accidentally
- System gesture edge: no conflicting custom gesture
- Content near bottom: not obscured by sticky controls or safe areas
```

**Gotcha:** A bottom action bar can improve reach but can also cover content, conflict with browser controls, or obscure validation errors. Reserve space for it and test with the keyboard open.

### 6. Establish a mobile information hierarchy

A small screen cannot present every secondary detail with equal prominence. Decide what users must see before acting, what can be progressively disclosed, and what can be summarized without losing meaning.

Use a clear sequence: page purpose, essential status or context, primary task, supporting information, and secondary actions. Keep headings descriptive and avoid making every card look equally important.

```html
<main>
  <header class="page-heading">
    <p class="eyebrow">Billing</p>
    <h1>Review your invoice</h1>
    <p>Confirm the amount and payment source before paying.</p>
  </header>

  <section aria-labelledby="invoice-summary-title">
    <h2 id="invoice-summary-title">Invoice summary</h2>
    <p class="amount">₹4,850</p>
    <p>Due 28 October</p>
  </section>

  <button class="primary-action" type="button">Continue to payment</button>
</main>
```

Semantic HTML improves navigation for assistive technology and gives the structure meaning beyond visual styling.

### 7. Choose navigation based on task frequency and depth

Bottom navigation works well for a small set of top-level destinations used frequently. A navigation drawer can support a larger or less frequently used set, but it adds a step and hides destinations. Tabs are best for closely related peer views, not unrelated areas of the product.

Do not copy a native platform pattern without considering the product's information architecture. Keep labels understandable, current location perceivable, and navigation state consistent when users open deep links.

```html
<nav aria-label="Primary">
  <ul class="bottom-nav">
    <li><a href="/home" aria-current="page">Home</a></li>
    <li><a href="/activity">Activity</a></li>
    <li><a href="/saved">Saved</a></li>
    <li><a href="/profile">Profile</a></li>
  </ul>
</nav>
```

A mobile web navigation element should remain usable with a keyboard and screen reader. Do not use icon-only links without accessible names.

### 8. Make forms keyboard-aware

The on-screen keyboard changes the usable viewport and may obscure fields, helper text, validation messages, or submit buttons. Use appropriate input types and autocomplete tokens so mobile browsers can offer the right keyboard and saved data.

```html
<form action="/checkout" method="post">
  <label for="email">Email address</label>
  <input
    id="email"
    name="email"
    type="email"
    autocomplete="email"
    inputmode="email"
    required
  >

  <label for="postal-code">Postal code</label>
  <input
    id="postal-code"
    name="postal-code"
    inputmode="numeric"
    autocomplete="postal-code"
    required
  >

  <button type="submit">Continue</button>
</form>
```

Keep labels visible, explain errors next to the relevant field, preserve valid values after errors, and move focus appropriately when a submission fails. Never rely on placeholder text as the only label.

**Gotcha:** A sticky submit button can cover the last field while the keyboard is open. Test the actual focus and scroll behavior on mobile browsers.

### 9. Use gestures as enhancements, not hidden requirements

Swipe, pinch, long press, and drag can make mobile interactions efficient, but discoverability and accessibility suffer when a gesture is the only way to complete a task. Provide a visible button or menu alternative, and avoid gesture conflicts with browser or operating-system navigation.

```html
<article class="saved-item">
  <h2>Research notes</h2>
  <p>Updated today</p>
  <button type="button" aria-label="More actions for Research notes">
    More actions
  </button>
</article>
```

If swipe-to-delete is supported, also provide a menu action and a clear undo opportunity. Ensure the interaction works without dragging and without requiring a precise multi-finger motion.

### 10. Account for safe areas and system UI

Devices with rounded corners, notches, and home indicators may require safe-area padding. The browser or operating system may also reserve space for status and navigation bars.

```css
.mobile-footer {
  position: sticky;
  inset-block-end: 0;
  padding: 0.875rem 1rem calc(0.875rem + env(safe-area-inset-bottom));
  background: Canvas;
  border-top: 1px solid color-mix(in srgb, CanvasText 15%, transparent);
}
```

Use safe-area variables in the context where the page is intended to extend edge-to-edge, and test on devices where they are non-zero. Avoid blindly adding the same inset twice when a container already accounts for it.

### 11. Build accessible mobile controls

Mobile users may use screen readers, switch control, voice control, external keyboards, magnification, or larger system text. A visually clear interface can still fail if labels, roles, states, and focus order are missing.

Use native HTML controls where possible. Native buttons, inputs, links, and select elements already expose expected semantics and behaviors. Custom controls must recreate keyboard interaction, accessible names, focus management, and state communication.

```css
.action {
  min-height: 44px;
  padding: 0.75rem 1rem;
}

.action:focus-visible {
  outline: 3px solid #1d4ed8;
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Test text enlargement, contrast, reduced motion, focus visibility, screen-reader announcements, and touch target size. Avoid encoding status through color alone.

### 12. Make content resilient to localization and text scaling

Labels grow in different languages. Users may increase text size, use bold text, or apply browser zoom. A design that relies on fixed heights or single-line labels can truncate meaning.

Prefer intrinsic sizing, wrapping, and flexible layout. Set `min-width: 0` on grid or flex children when necessary to let content shrink without overflow.

```css
.navigation-label {
  white-space: normal;
  overflow-wrap: anywhere;
}

.summary-card {
  min-width: 0;
  min-height: 8rem;
  padding: 1rem;
}

.summary-card h2 {
  line-height: 1.25;
  margin-block: 0 0.5rem;
}
```

Do not solve every text overflow with ellipsis. Truncation is appropriate only when the full value is available through a clear path and the missing text does not prevent a decision.

### 13. Design for intermittent connectivity

Mobile networks vary in latency, throughput, and availability. Users may enter a tunnel, switch networks, or lose connectivity during submission. Show progress for meaningful waits, preserve input, and communicate whether an action succeeded.

For important mutations, use idempotent server operations or request identifiers so retrying does not create duplicate payments, orders, or records. Do not imply that a write succeeded merely because the user tapped a button.

```text
Submission states:
1. Idle: action available
2. Submitting: prevent accidental duplicate activation
3. Success: confirm result and next step
4. Recoverable failure: preserve entered values and offer retry
5. Offline: explain what can be done now and what must wait
```

For offline-capable products, distinguish cached information from live information. Display freshness and synchronization status when stale data could change a decision.

### 14. Use loading, empty, error, and success states as part of the design

Every data-driven screen needs states beyond the ideal response. Skeletons can preserve layout during loading, but they should not imply that content is already available. Empty states should explain why nothing is shown and offer a relevant next action. Errors should say what happened and how to recover.

```html
<section aria-labelledby="orders-title" aria-busy="true">
  <h1 id="orders-title">Your orders</h1>
  <p role="status">Loading your orders…</p>
</section>
```

Use live-region semantics carefully; announcing every small change can overwhelm screen-reader users. Reserve urgent alerts for information that genuinely requires immediate attention.

**Gotcha:** A generic “Something went wrong” message is not enough when the user needs to know whether a payment or upload was completed. State the outcome clearly.

### 15. Avoid desktop tables and dense controls on narrow screens

Wide tables often become unreadable on phones. Choose a transformation based on task: stacked records, prioritized columns, horizontally scrollable data with clear affordances, or a focused detail view. Do not silently hide data that changes a decision.

```css
.data-table-wrap {
  overflow-x: auto;
  overscroll-behavior-inline: contain;
}

.data-table {
  border-collapse: collapse;
  min-width: 42rem;
  width: 100%;
}

@media (max-width: 36rem) {
  .desktop-comparison {
    display: none;
  }

  .mobile-comparison {
    display: grid;
    gap: 1rem;
  }
}
```

If horizontal scrolling is required, make the scroll container discoverable, preserve header relationships, and ensure keyboard users can reach the content.

### 16. Make mobile performance visible in the experience

Slow startup, layout shifts, oversized images, and heavy animation are usability problems. Use appropriately sized images, lazy-load below-the-fold media, avoid unnecessary JavaScript, and reserve space for content that will load later.

```html
<img
  src="/images/product-640.webp"
  srcset="/images/product-320.webp 320w, /images/product-640.webp 640w"
  sizes="(max-width: 40rem) 100vw, 40rem"
  width="640"
  height="480"
  alt="A compact desk lamp beside a notebook"
  loading="lazy"
>
```

Do not lazy-load the most important above-the-fold image without measuring the effect. Set dimensions or aspect ratio to reduce layout shift. Test on realistic throttled connections and lower-powered devices, not only a high-end desktop.

### 17. Support dark mode and user preferences deliberately

Dark mode is not simply an inverted palette. Surface hierarchy, elevation, borders, images, and semantic colors need review in both themes. Honor system preferences when that matches product expectations, and keep text contrast and focus indicators clear.

```css
:root {
  color-scheme: light dark;
  --surface: #ffffff;
  --text: #172033;
  --border: #cbd5e1;
}

@media (prefers-color-scheme: dark) {
  :root {
    --surface: #10141c;
    --text: #f4f7fb;
    --border: #3b4555;
  }
}

body {
  color: var(--text);
  background: var(--surface);
}
```

If the product provides a manual theme control, define precedence between system preference and the user's explicit choice. Persist that choice according to product requirements and make the control understandable.

### 18. Respect native conventions while preserving product identity

Native platform patterns provide familiar expectations for back navigation, sheets, pickers, permissions, and system dialogs. Web interfaces should not pretend to be native in ways that break browser behavior or accessibility. Native apps should follow platform conventions unless there is a clear product reason to depart.

Use platform-specific interaction guidance as input, not as an excuse to duplicate every detail. Maintain a coherent brand through typography, color, illustration, and content voice while leaving core interaction behaviors predictable.

### 19. Design permission requests around user value

Request camera, location, notifications, or contacts only when the user reaches a feature that needs them. Explain the benefit in context before triggering the system permission prompt. Provide a useful alternative when permission is denied.

```text
Weak: Open the app and immediately request location.
Better: User selects “Find nearby clinics.”
Then explain why location helps, request permission, and offer manual location entry if declined.
```

Permission-denied and permanently-denied states should be designed and tested. Never make a core workflow impossible if a reasonable manual fallback exists.

### 20. Validate on real devices and representative conditions

Emulators and browser responsive modes are useful, but they do not fully reproduce touch ergonomics, keyboard behavior, system bars, font rendering, network variation, or assistive technology. Test a representative matrix of screen sizes, operating systems, browsers, and input methods.

Record the device, OS, browser, viewport, zoom, text scaling, and reproduction steps for defects. A bug report such as “button broken on mobile” is not actionable; “on Safari at 375 CSS px, opening the email keyboard covers the submit button and focus does not scroll it into view” is.

### 21. Create an explicit responsive behavior specification

A handoff should describe how layout changes, not only show a few frames. Include breakpoint intent, content ordering, sticky behavior, overflow policy, and what happens when labels or data grow.

```text
At narrow widths:
- One primary column
- Bottom navigation remains visible but respects safe-area insets
- Filters open in a sheet with a persistent Apply action
- Long values wrap; no fixed-height cards
- Tables transform into record cards when comparison across columns is not essential

At wide widths:
- Filters may remain in a side panel
- Related content can form two columns
- Desktop navigation replaces bottom navigation
```

Avoid documenting every possible pixel width. Describe the constraints and rules so engineering can implement behavior robustly.

### 22. Use motion with restraint

Motion can clarify a state transition or preserve spatial continuity, but it can also delay task completion, increase cognitive load, and cause discomfort. Keep feedback quick and purposeful, avoid blocking animations, and honor reduced-motion preferences.

```css
.panel {
  transition: opacity 160ms ease, transform 160ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .panel {
    transition: none;
    transform: none;
  }
}
```

Do not communicate essential state only through motion. A dismissed toast, expanded panel, or completed operation must also have a meaningful state and accessible announcement where appropriate.

### 23. Prevent accidental destructive actions

Small screens and touch input increase the risk of accidental activation. Use clear labels, adequate spacing, and confirmation proportional to consequence. For reversible actions, an undo pattern is often faster and less disruptive than a modal confirmation.

```text
Archive message:
- Perform immediately
- Show “Message archived” with Undo
- Restore the message if Undo is activated before the action expires

Delete account:
- Explain consequence and scope
- Require deliberate confirmation
- Re-authenticate if appropriate
- Provide a clear cancellation path
```

Do not ask for confirmation for every minor action; excessive dialogs train users to dismiss them automatically.

### 24. Measure task success, not screenshot similarity

A visually accurate implementation can still be a poor mobile experience. Measure completion rate, error rate, time on task, abandonment, recovery success, and user confidence. Segment results by device and context when the difference is meaningful.

Use qualitative observation to understand why a metric changed. If users abandon a form when the keyboard opens, inspect layout and validation behavior rather than assuming they lack motivation. Pair analytics with privacy-respecting research and avoid collecting unnecessary personal data.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Sticky primary action with reserved content space

**What it does:** Keeps the main action available during a long mobile task.

**When to use it:** Multi-step checkout, application forms, or detail screens where the next action must remain easy to reach.

```css
.page {
  padding-block-end: calc(5.5rem + env(safe-area-inset-bottom));
}

.primary-bar {
  position: sticky;
  inset-block-end: 0;
  padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom));
  background: Canvas;
  border-top: 1px solid color-mix(in srgb, CanvasText 15%, transparent);
}

.primary-bar button {
  width: 100%;
  min-height: 48px;
}

.primary-bar button:focus-visible {
  outline: 3px solid #2563eb;
  outline-offset: 3px;
}
```

Validate that the bar does not cover fields, error messages, or browser controls. If it conflicts with the keyboard, adjust its behavior rather than forcing it to remain fixed.

### Pattern 2: Progressive disclosure for secondary details

**What it does:** Presents essential information first and reveals secondary information on demand.

**When to use it:** Product details, transaction summaries, filters, and long records with optional context.

```html
<details>
  <summary>View fee breakdown</summary>
  <dl>
    <div><dt>Service fee</dt><dd>₹120</dd></div>
    <div><dt>Tax</dt><dd>₹21.60</dd></div>
  </dl>
</details>
```

Use native disclosure semantics when they fit. Do not hide information that users need to make an informed decision, and ensure the collapsed state communicates that more detail exists.

### Pattern 3: Bottom navigation for a small set of peer destinations

**What it does:** Makes frequent top-level destinations reachable with a thumb.

**When to use it:** Products with roughly three to five equally important destinations used repeatedly.

```html
<nav aria-label="Primary">
  <ul class="bottom-nav">
    <li><a href="/home" aria-current="page"><span aria-hidden="true">⌂</span><span>Home</span></a></li>
    <li><a href="/activity"><span aria-hidden="true">◷</span><span>Activity</span></a></li>
    <li><a href="/saved"><span aria-hidden="true">☆</span><span>Saved</span></a></li>
    <li><a href="/profile"><span aria-hidden="true">○</span><span>Profile</span></a></li>
  </ul>
</nav>
```

Use a real icon set in production and keep text labels available. Indicate the current destination with more than color alone. Test screen readers and large text.

### Pattern 4: Mobile record cards as a table alternative

**What it does:** Transforms a dense comparison layout into vertically scannable records.

**When to use it:** Narrow screens where users inspect one record at a time and cross-column comparison is not essential.

```html
<article class="order-card">
  <h2>Order #48217</h2>
  <p><span class="field-label">Status:</span> Shipped</p>
  <p><span class="field-label">Total:</span> ₹2,450</p>
  <p><span class="field-label">Updated:</span> 22 October</p>
  <a href="/orders/48217">View order details</a>
</article>
```

Keep data labels explicit and preserve the same information available on desktop. If column-to-column comparison is essential, retain a usable table with horizontal scrolling or a focused comparison workflow.

### Pattern 5: Form recovery with field-level errors

**What it does:** Helps people correct errors without losing entered data or searching for a generic error at the top.

**When to use it:** Checkout, sign-up, profile editing, or any form with validation.

```html
<div class="field">
  <label for="phone">Mobile number</label>
  <input id="phone" name="phone" type="tel" autocomplete="tel"
         aria-describedby="phone-help phone-error" aria-invalid="true">
  <p id="phone-help">Include the country code if needed.</p>
  <p id="phone-error">Enter a valid mobile number.</p>
</div>
```

Render `aria-invalid="true"` only when the field is invalid. Preserve the user's other values, provide a clear correction, and ensure error messages remain visible when the keyboard is open.

### Pattern 6: Offline-aware action state

**What it does:** Explains which actions require connectivity and protects user work during interruptions.

**When to use it:** Forms, messaging, travel, inventory, and field-work applications.

```text
Offline behavior contract:
- Show a visible but non-alarming offline status.
- Keep unsent form values locally where privacy and security allow.
- Mark cached records as potentially stale.
- Queue safe actions only when their semantics are clear.
- Do not queue payments or other high-risk mutations without an explicit, safe design.
- Confirm server acceptance after reconnecting; distinguish queued from completed.
```

For queued operations, show pending, synced, and failed states. Ensure retry behavior cannot duplicate a transaction.

### Pattern 7: Contextual permission request with fallback

**What it does:** Connects a system permission to a clear user benefit and offers a path forward if permission is denied.

**When to use it:** Location search, camera capture, notifications, or file access.

```html
<section aria-labelledby="location-title">
  <h2 id="location-title">Find services near you</h2>
  <p>Location can sort nearby services first. You can also enter an area manually.</p>
  <button type="button">Use my location</button>
  <a href="/choose-area">Enter an area instead</a>
</section>
```

Trigger the platform permission only after the user chooses the action. Do not treat a denial as a dead end.

### Pattern 8: Adaptive navigation across widths

**What it does:** Uses a compact navigation pattern on phones and a more spacious one on tablets or desktops.

**When to use it:** Products with the same information architecture but different navigation capacity across screen sizes.

```css
.mobile-navigation {
  display: block;
}

.desktop-navigation {
  display: none;
}

@media (min-width: 56rem) {
  .mobile-navigation {
    display: none;
  }

  .desktop-navigation {
    display: block;
  }
}

.mobile-navigation a:focus-visible,
.desktop-navigation a:focus-visible {
  outline: 3px solid #2563eb;
  outline-offset: 3px;
}
```

The breakpoint should follow the content and navigation's fit, not a device marketing label. Keep route state and accessible names consistent when switching presentations.

### Pattern 9: Safe-area-aware edge-to-edge layout

**What it does:** Lets content use available display space without placing controls under device cutouts or system gestures.

**When to use it:** Full-screen media, immersive views, sticky bottom actions, and apps designed to extend to screen edges.

```css
.edge-to-edge-shell {
  min-height: 100vh;
  min-height: 100dvh;
  padding-block-start: env(safe-area-inset-top, 0px);
  padding-inline:
    max(1rem, env(safe-area-inset-left, 0px))
    max(1rem, env(safe-area-inset-right, 0px));
}

.edge-to-edge-footer {
  padding-block-end: calc(1rem + env(safe-area-inset-bottom, 0px));
}
```

Test on devices and browsers where insets are non-zero. Do not assume every page needs edge-to-edge rendering or that one safe-area rule works for every nested container.

### Pattern 10: Accessible gesture enhancement

**What it does:** Adds efficient touch interaction while preserving a discoverable non-gesture path.

**When to use it:** Swipeable cards, carousels, reorderable lists, and dismissible items.

```html
<article class="notification-card">
  <h2>Payment reminder</h2>
  <p>Your bill is due tomorrow.</p>
  <button type="button">Dismiss notification</button>
  <button type="button">More actions</button>
</article>
```

The visual swipe may be an enhancement, but the visible controls must still complete the task. Support keyboard access and announce state changes appropriately.

### Pattern 11: Mobile-first content grid

**What it does:** Starts with a readable single-column structure and expands only when there is enough room for useful parallel content.

**When to use it:** Product lists, cards, editorial pages, and service directories.

```css
.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
}

.content-grid > * {
  min-width: 0;
}

@media (min-width: 42rem) {
  .content-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 68rem) {
  .content-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.5rem;
  }
}
```

Check whether the content remains readable at intermediate widths and zoom levels. Do not increase column count simply because the viewport allows it if cards become too narrow to support their content.

### Pattern 12: Explicit state feedback for asynchronous actions

**What it does:** Prevents uncertainty during operations that take time or can fail.

**When to use it:** Uploads, saves, checkout, search, and data synchronization.

```html
<button type="button" aria-describedby="save-status">Save changes</button>
<p id="save-status" role="status">Changes saved.</p>
```

Update status text only when the result is known. Use `aria-busy` for regions actively updating when it helps users understand the change, and avoid announcing noisy progress updates repeatedly.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Shrinking a desktop design until it fits a phone | The designer preserves desktop density rather than task priority | Re-rank content by the mobile user's primary task, then define what moves, collapses, or becomes a separate step |
| Using fixed heights for content cards | Static mockups hide variable copy and text scaling | Prefer intrinsic sizing and test with long localized strings and 200% zoom |
| Placing small icons directly on the hit area | Visual dimensions are mistaken for touch-target dimensions | Wrap icons in controls with at least a practical 44 CSS-pixel hit area and sufficient separation |
| Hiding key actions behind gestures | Gestures look elegant in prototypes | Add a visible button or menu alternative and test without gesture knowledge |
| Using `100vh` as the only full-screen rule | The design assumes a stable mobile viewport | Add an appropriate dynamic viewport fallback and test keyboard/browser chrome changes |
| Ignoring the keyboard during form design | The screen is reviewed only before focus | Test every field with the keyboard open and ensure the focused control and submit action remain reachable |
| Putting the primary action under the thumb but over content | Sticky placement is treated as free space | Reserve bottom padding, respect safe areas, and inspect scroll and keyboard states |
| Using placeholder text as the only field label | It creates a visually minimal form | Add a persistent semantic label and use placeholders only for examples or hints |
| Making a wide table unreadable instead of changing its structure | Desktop components are reused without task analysis | Convert to labeled cards or provide an accessible, clearly signaled scroll region |
| Requesting permissions at app launch | Permission access is treated as an onboarding requirement | Request permission at the moment the user invokes the related feature and explain the benefit first |
| Showing a generic error after a high-risk action | Error handling is disconnected from transaction semantics | State whether the action completed, failed, or has unknown status; make retry safe |
| Announcing every visual change to screen readers | Accessibility is added without considering announcement frequency | Use status and alert semantics according to urgency and avoid repeated noisy updates |
| Relying on color alone for active navigation | The design focuses on visual polish | Combine color with labels, indicators, and semantic current-page state |
| Testing only in responsive desktop emulation | Device-specific behavior is not visible | Validate on representative real devices, keyboards, browsers, and assistive technologies |
| Overusing confirmation dialogs | Designers fear accidental actions | Prefer undo for reversible actions and reserve confirmation for consequential operations |
| Treating dark mode as a global inversion | Theme design is reduced to a filter | Define semantic tokens for surfaces, text, borders, focus, and status colors in each theme |
| Lazy-loading the most important image | Performance advice is applied without context | Measure loading priority and avoid delaying likely above-the-fold content |
| Building custom controls without keyboard support | The interaction is optimized for touch alone | Prefer native controls or implement roles, focus, keyboard operation, and state communication |
| Using device-specific breakpoint names as requirements | Mockup sizes are mistaken for behavior rules | Document the layout constraint each breakpoint resolves and test around it |
| Omitting offline and stale-data states | The prototype assumes perfect connectivity | Define freshness, queueing, retry, and completion states for each network-dependent task |
| Making text truncate without a way to inspect it | Cards are forced to a fixed layout | Allow wrapping or provide a clear full-value detail path when truncation is justified |
| Adding motion without reduced-motion support | Transitions are treated as decoration | Keep motion purposeful and respect `prefers-reduced-motion` |
| Hiding the current navigation destination | Selected state is conveyed by a subtle color shift | Expose `aria-current="page"` on the active link and add a visible state marker |
| Assuming safe-area padding is always zero | Desktop testing does not reveal device insets | Use safe-area environment variables where edge-to-edge content requires them and verify on hardware |

---

## Mental Models

1. **The phone is a moving context, not a small canvas** — Design for interruptions, variable light, one-handed use, and changing connectivity.
2. **Reachability is part of hierarchy** — An action's location affects whether users can perform it comfortably and safely.
3. **A responsive layout is a set of rules** — Good design specifies how content adapts, not only what it looks like at a few fixed widths.
4. **Every interaction has states** — Loading, empty, error, offline, denied, and success states are part of the feature.
5. **Touch targets are forgiving contracts** — A control should tolerate imprecise input instead of demanding pixel-perfect taps.
6. **Progressive disclosure preserves focus** — Reveal secondary complexity without removing information required for informed decisions.
7. **Native semantics are a multiplier** — Semantic HTML provides keyboard, assistive technology, and browser behaviors that custom visual controls must otherwise recreate.
8. **A gesture needs a discoverable equivalent** — Efficiency must not depend on memorizing hidden interaction rules.
9. **Connectivity is uncertain; outcome must be explicit** — Never confuse a tap, a queued request, and a server-confirmed success.
10. **The keyboard is part of the layout** — Focus and input change the available space and must be tested as a real screen state.
11. **Design for the longest realistic content** — Localization, zoom, and user-generated data expose fragile fixed dimensions.
12. **A screenshot is evidence of appearance, not usability** — Validate completion, recovery, and accessibility in real conditions.

---

## Quick Reference

| Concern | Practical rule | Verify |
|---|---|---|
| Touch targets | Use generous hit areas, often at least 44 CSS px as a baseline | Targets are not crowded and are comfortable one-handed |
| Focus | Style `:focus-visible` clearly | Keyboard users can locate every interactive control |
| Viewport | Use `dvh` where appropriate with fallback | Keyboard and browser chrome do not hide content |
| Safe areas | Use `env(safe-area-inset-*)` for edge-to-edge layouts | Controls avoid cutouts and home indicators |
| Breakpoints | Derive from content constraints | Intermediate widths do not break |
| Forms | Use labels, autocomplete, and appropriate input types | Keyboard, errors, and submit action remain reachable |
| Gestures | Provide visible alternatives | Core tasks work without swiping or pinching |
| Navigation | Keep destinations and active state clear | Screen reader and visual state agree |
| Network | Distinguish pending, queued, completed, and failed | Retry cannot duplicate a critical mutation |
| Loading | Reserve space and communicate meaningful waits | Layout does not jump unexpectedly |
| Empty states | Explain why the view is empty and what to do next | Users have a relevant next step |
| Errors | Preserve user input and explain recovery | The user can correct the problem without restarting |
| Text scaling | Avoid fixed heights and unnecessary truncation | Long strings and zoom remain usable |
| Tables | Choose cards, scrolling, or focused detail based on task | Important relationships and values remain available |
| Dark mode | Use semantic theme tokens | Contrast, focus, and status colors remain clear |
| Motion | Respect `prefers-reduced-motion` | No task depends on animation |
| Permissions | Ask in context and provide fallback | Denial does not create an avoidable dead end |
| Performance | Size images and reserve layout space | Test on throttled networks and lower-powered devices |
| Testing | Include real devices and assistive technology | Defects have reproducible device and state details |
| Measurement | Track task completion and recovery | Metrics are interpreted alongside observed behavior |

---

## Build Challenge

Design a mobile-first service-booking flow for a fictional neighborhood health clinic. Users need to search for a clinic, select a service, choose a time, provide contact details, and receive a trustworthy booking confirmation. The same experience must expand to tablet and desktop without losing task clarity.

### Requirements

1. Define the primary user task and list at least three contexts in which the task might be completed, including one-handed use and weak connectivity.
2. Create a mobile screen sequence for search, service selection, available times, contact details, review, confirmation, and recovery from failure.
3. Establish a responsive layout specification for narrow phones, wide phones, tablets, and desktops. Explain the constraints that cause each layout change rather than relying on device names alone.
4. Use semantic HTML for headings, navigation, form fields, buttons, and status messages. Ensure every field has a persistent label and appropriate autocomplete or input type.
5. Define touch target sizes and spacing for primary actions, time slots, navigation, and secondary controls.
6. Document how the page behaves when the keyboard opens, including focused-field visibility, validation feedback, scrolling, and any sticky action bar.
7. Provide a visible alternative for every gesture-based interaction. The core task must remain possible using keyboard input and assistive technology.
8. Define loading, no-results, unavailable-time, offline, permission-denied, submission-pending, success, and recoverable-error states.
9. Make the booking submission safe against accidental duplicate requests. Explain how the interface distinguishes a request in progress from a confirmed booking.
10. Include safe-area handling for edge-to-edge mobile layouts and demonstrate a plan for testing devices with non-zero insets.
11. Support reduced motion, text enlargement, keyboard focus visibility, contrast, and screen-reader announcements for important state changes.
12. Optimize images and layout stability. Explain what is lazy-loaded and what remains high priority.
13. Test at multiple viewport widths and at 200% zoom. Include a test with long clinic names and translated service labels.
14. Run a manual device test on at least one iOS and one Android browser or device, and record any differences that affect the design.
15. Document the user outcome after a failed booking request, including whether a time is held, how to retry, and how to avoid creating duplicate bookings.

### Definition of Done

- Every critical screen has a documented default, loading, empty or unavailable, error, and success state where applicable.
- The flow can be completed without a gesture-only interaction and without a mouse.
- Focus indicators remain visible and focus order follows the visual and task sequence.
- No primary action is obscured by the keyboard, sticky footer, or safe-area inset.
- Long text and text scaling do not hide prices, service names, time labels, or consent details.
- Offline and ambiguous submission outcomes are explained without falsely claiming success.
- A retry cannot create a duplicate booking, and the confirmation includes enough information to verify the booking.
- Responsive behavior is tested at intermediate widths rather than only at the smallest and largest target sizes.
- A device test log records the device, OS, browser, viewport, issue, and reproduction steps.
- A reviewer can explain the design decisions using task completion, reachability, accessibility, and recovery—not visual taste alone.

### Review Checklist

Before handing off the design, inspect it in browser DevTools and on representative devices:

- [ ] Check the smallest supported viewport and one intermediate width.
- [ ] Open the virtual keyboard on every form step and verify focused controls remain visible.
- [ ] Test keyboard-only navigation and confirm every action has a visible `:focus-visible` state.
- [ ] Inspect semantic headings, form labels, current navigation state, and status announcements.
- [ ] Increase text size or zoom and verify there is no clipped content or lost functionality.
- [ ] Test reduced motion and both light and dark themes if both are supported.
- [ ] Disable network access and verify the offline and retry behavior.
- [ ] Simulate a slow request and an ambiguous response; confirm the interface does not falsely claim completion.
- [ ] Verify touch target dimensions and spacing with DevTools measurements.
- [ ] Test safe-area behavior and sticky controls on a real device.
- [ ] Record browser-specific issues and distinguish design defects from platform constraints.
