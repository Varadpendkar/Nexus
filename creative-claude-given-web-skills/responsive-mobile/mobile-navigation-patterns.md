# SKILL: mobile-navigation-patterns

**Layer:** 08 — Responsive Mobile

**Goal:** Design mobile navigation that stays understandable, accessible, responsive, and robust across narrow viewports, touch input, keyboard use, and real-world content changes.

## Why This Matters (Senior Perspective)

Mobile navigation is often the first part of a website a visitor touches and the first place a rushed implementation reveals its weaknesses. A desktop header compressed into a phone viewport usually produces tiny targets, unclear hierarchy, hidden destinations, and brittle breakpoint rules. A menu that looks good in a static mockup can still fail when a long translated label wraps, the browser's address bar changes the available height, a user zooms text, or the keyboard opens while a drawer is visible. The hard part is not hiding links behind a hamburger icon. It is preserving orientation and access to the site's important destinations under constrained space.

Senior navigation design starts with the information architecture, not the animation. Decide which destinations deserve first-level visibility, which belong in a secondary group, whether the mobile pattern should be a compact disclosure, a full-screen panel, a bottom navigation bar, or a responsive desktop menu, and how users close and recover from the open state. The implementation should have one clear source of truth for open/closed state, semantic controls, focus behavior, Escape handling, and a layout that does not rely on a fixed viewport assumption. A menu should remain usable when JavaScript fails or when content differs from the happy-path demo.

For creative agencies, portfolio sites, and client work, navigation also carries the brand's personality. A full-screen menu may feel editorial and cinematic; a compact disclosure may suit a product dashboard; bottom navigation may work for a small set of frequent tasks in an app-like experience. The visual treatment can be expressive, but the interaction contract should remain familiar. If users cannot tell where they are, cannot close the menu, or lose their place after selecting a destination, the animation is decoration over a broken information system.

## Core Concepts

### 1. Choose the pattern from the task model

**Mental model:** Navigation is an information architecture problem before it is a styling problem. Count the primary destinations, determine how often people use them, and identify whether the hierarchy is flat or grouped. A compact disclosure suits a small set of links. A modal drawer suits a focused full-screen navigation moment. Bottom navigation can suit a stable set of frequent peer-level tasks, but it is wasteful for a large sitemap. A desktop header should switch patterns when its content no longer fits—not merely because a device has a particular brand name.

```html
<header class="site-header">
  <a href="/" class="brand">Northstar Studio</a>
  <button type="button" data-menu-toggle aria-expanded="false" aria-controls="site-nav">Menu</button>
  <nav id="site-nav" aria-label="Primary navigation">
    <a href="/work">Work</a><a href="/services">Services</a>
    <a href="/studio">Studio</a><a href="/journal">Journal</a>
    <a href="/contact">Contact</a>
  </nav>
</header>
```

```css
.site-header { display:flex; align-items:center; justify-content:space-between; gap:1rem; }
#site-nav { display:flex; flex-wrap:wrap; gap:clamp(.75rem, 2vw, 1.75rem); }
[data-menu-toggle] { min-width:44px; min-height:44px; }
@media (max-width:48rem) {
  [data-menu-toggle] { display:inline-flex; }
  #site-nav { display:none; }
  #site-nav.is-open { display:grid; gap:1rem; }
}
```

```js
const toggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("#site-nav");
toggle.addEventListener("click", () => {
  const open = toggle.getAttribute("aria-expanded") !== "true";
  toggle.setAttribute("aria-expanded", String(open));
  nav.classList.toggle("is-open", open);
});
```

```js
function navigationPattern(width, destinationCount, hierarchical) {
  if (hierarchical || destinationCount > 7) return "grouped-drawer";
  if (width < 768) return "compact-disclosure";
  return "horizontal-header";
}
```

```js
const primaryDestinations = [
  { label: "Work", href: "/work" },
  { label: "Services", href: "/services" },
  { label: "Studio", href: "/studio" },
  { label: "Journal", href: "/journal" },
  { label: "Contact", href: "/contact" }
];
```

**Gotcha:** Treat the behavior, semantic state, and visible result as one contract. Verify the chosen pattern with keyboard input, touch input, text zoom, and real content before considering the component complete.

### 2. Keep state synchronized

**Mental model:** The menu has one state: open or closed. Visibility, `aria-expanded`, the toggle label, icon treatment, and any temporary scroll lock must agree. Centralize state changes in one function. In a framework, store state in the framework and derive the markup from it; do not combine framework state with unrelated direct DOM mutations. A disclosure is not accessible merely because its button has an ARIA attribute: the panel must actually be shown, hidden, and made unavailable to keyboard navigation in a coherent way.

```js
function setMenuOpen(open) {
  toggle.setAttribute("aria-expanded", String(open));
  nav.classList.toggle("is-open", open);
  toggle.textContent = open ? "Close menu" : "Menu";
}
```

```js
function menuIsOpen() {
  return toggle.getAttribute("aria-expanded") === "true";
}
```

```js
toggle.addEventListener("click", () => setMenuOpen(!menuIsOpen()));
```

```js
nav.addEventListener("click", (event) => {
  const link = event.target.closest("a[href]");
  if (link) setMenuOpen(false);
});
```

```js
function syncMenuIcon(icon, open) {
  icon.classList.toggle("is-open", open);
  icon.setAttribute("aria-hidden", "true");
}
```

**Gotcha:** Treat the behavior, semantic state, and visible result as one contract. Verify the chosen pattern with keyboard input, touch input, text zoom, and real content before considering the component complete.

### 3. Disclosure versus modal drawer

**Mental model:** A disclosure expands content while leaving the page context available. A modal drawer temporarily takes over the interaction context. Do not visually create a modal while leaving background links operable, and do not trap focus inside a simple disclosure. Native `dialog` with `showModal()` provides a strong starting point for a true modal. It supplies modal behavior and Escape handling; custom implementations must deliberately recreate focus management, background inertness, and dismissal behavior.

```html
<button type="button" data-open-drawer aria-haspopup="dialog">Explore</button>
<dialog data-drawer aria-labelledby="drawer-title">
  <h2 id="drawer-title">Explore Northstar</h2>
  <button type="button" data-close-drawer>Close navigation</button>
  <nav aria-label="Primary"><a href="/work">Work</a><a href="/studio">Studio</a></nav>
</dialog>
```

```js
const drawer = document.querySelector("[data-drawer]");
document.querySelector("[data-open-drawer]").addEventListener("click", () => drawer.showModal());
document.querySelector("[data-close-drawer]").addEventListener("click", () => drawer.close());
```

```js
const drawerOpener = document.querySelector("[data-open-drawer]");
drawer.addEventListener("close", () => drawerOpener.focus());
```

```js
drawer.addEventListener("click", (event) => {
  if (event.target.closest("a[href]")) drawer.close();
});
```

```css
dialog::backdrop { background: rgb(0 0 0 / 62%); }
dialog[open] { color:#f7f7fb; background:#0b0c12; border:0; }
```

**Gotcha:** Treat the behavior, semantic state, and visible result as one contract. Verify the chosen pattern with keyboard input, touch input, text zoom, and real content before considering the component complete.

### 4. Focus order and restoration

**Mental model:** Opening a navigation surface changes the user's context. A modal drawer should move focus into itself, keep focus within the modal interaction, and return focus to its opener when the same page remains active. A simple disclosure normally allows the toggle to retain focus so the next Tab reaches the first link. Avoid moving focus merely because the pointer hovered over a menu. Client-side routing should move focus to the new page heading or main region after the route is ready and should update the document title.

```js
const firstDrawerLink = drawer.querySelector("nav a[href]");
document.querySelector("[data-open-drawer]").addEventListener("click", () => {
  drawer.showModal();
  firstDrawerLink?.focus();
});
```

```js
function focusMainHeading() {
  const heading = document.querySelector("main h1");
  if (!heading) return;
  heading.tabIndex = -1;
  heading.focus();
}
```

```js
function markHeadingProgrammaticallyFocusable(heading) {
  if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
}
```

```js
drawer.addEventListener("close", () => {
  if (!window.location.hash) drawerOpener.focus();
});
```

```js
function focusFirstVisibleLink(panel) {
  const links = [...panel.querySelectorAll("a[href]")];
  links.find((link) => link.getClientRects().length > 0)?.focus();
}
```

**Gotcha:** Treat the behavior, semantic state, and visible result as one contract. Verify the chosen pattern with keyboard input, touch input, text zoom, and real content before considering the component complete.

### 5. Predictable close behavior

**Mental model:** Opening behavior is only half the interaction contract. A custom disclosure can close on Escape, on its toggle, and when a real navigation link is activated. Outside-click handling should test whether the event happened inside the panel or toggle. Do not close on every bubbling click, because a nested disclosure or utility control may need to remain open. Native dialogs already have an Escape cancellation pathway; avoid duplicate global handlers that fight it.

```js
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuIsOpen()) {
    setMenuOpen(false);
    toggle.focus();
  }
});
```

```js
document.addEventListener("pointerdown", (event) => {
  if (!menuIsOpen()) return;
  if (nav.contains(event.target) || toggle.contains(event.target)) return;
  setMenuOpen(false);
});
```

```js
nav.addEventListener("click", (event) => {
  const nestedToggle = event.target.closest("[data-submenu-toggle]");
  if (nestedToggle) return;
  if (event.target.closest("a[href]")) setMenuOpen(false);
});
```

```js
drawer.addEventListener("cancel", () => {
  // Native dialog Escape behavior is retained; do not prevent it without a product reason.
});
```

```js
function closeMenuAndRestoreFocus() {
  setMenuOpen(false);
  toggle.focus({ preventScroll: true });
}
```

**Gotcha:** Treat the behavior, semantic state, and visible result as one contract. Verify the chosen pattern with keyboard input, touch input, text zoom, and real content before considering the component complete.

### 6. Content-driven breakpoints

**Mental model:** A breakpoint should respond to the content's needs. Long translated labels, larger user fonts, and browser zoom can make a desktop header fail at widths that looked fine with short English labels. Use flexible gaps, wrapping, intrinsic sizing, and a content-driven switch to the compact pattern. Test narrow widths and 200% text zoom; a menu that only works with the designer's exact copy is not resilient.

```css
header { display:flex; align-items:center; gap:1rem; padding-inline:clamp(1rem,4vw,3rem); }
header nav { display:flex; flex-wrap:wrap; gap:clamp(.75rem,2vw,2rem); }
header a { overflow-wrap:anywhere; }
```

```css
@media (max-width:48rem) {
  header nav { display:none; }
  header nav.is-open { display:grid; }
}
```

```js
const fitTest = document.querySelector("[data-nav-fit-test]");
const hasOverflow = fitTest.scrollWidth > fitTest.clientWidth;
```

```css
@media (max-width:35rem) {
  .menu-panel { padding-inline:1rem; }
  .menu-panel a { max-width:100%; overflow-wrap:anywhere; }
}
```

```js
function normalizedPath(href) {
  const url = new URL(href, window.location.origin);
  return url.pathname.replace(/\/+$/, "") || "/";
}
```

**Gotcha:** Treat the behavior, semantic state, and visible result as one contract. Verify the chosen pattern with keyboard input, touch input, text zoom, and real content before considering the component complete.

### 7. Viewport and safe-area behavior

**Mental model:** Phones do not have a permanently fixed visible rectangle. Browser toolbars expand and collapse, orientation changes the available height, and devices with display cutouts need content inset from unsafe edges. Use `100vh` as a fallback and `100dvh` where supported. Safe-area variables are especially important for full-screen drawers and fixed bottom navigation. Confirm the viewport meta configuration and validate on hardware; emulation is not a complete substitute.

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

```css
 .full-screen-menu { min-height:100vh; min-height:100dvh;
  padding-block: max(1rem,env(safe-area-inset-top)) max(1rem,env(safe-area-inset-bottom));
  padding-inline: max(1rem,env(safe-area-inset-left)) max(1rem,env(safe-area-inset-right)); }
```

```css
 .bottom-nav { padding-bottom:calc(.5rem + env(safe-area-inset-bottom, 0px)); }
```

```css
 .menu-panel { max-height:calc(100dvh - 2rem); overflow-y:auto; overscroll-behavior:contain; }
```

```js
window.addEventListener("orientationchange", () => {
  // Re-evaluate panel sizing after the browser completes the orientation transition.
  requestAnimationFrame(updatePanelMeasurements);
});
```

**Gotcha:** Treat the behavior, semantic state, and visible result as one contract. Verify the chosen pattern with keyboard input, touch input, text zoom, and real content before considering the component complete.

### 8. Scroll locking

**Mental model:** A modal drawer may need to prevent background scrolling, but the lock is temporary and must be reversed on every close path. Prefer native modal behavior where it meets the design. If a custom panel needs a lock, save the exact prior inline value and restore it rather than assuming the original value was empty. Nested scrolling on mobile browsers can expose edge cases; test the panel at its top and bottom and the page at its own scroll boundaries.

```js
let oldOverflow = "";
function lockPageScroll() { oldOverflow = document.body.style.overflow; document.body.style.overflow = "hidden"; }
function unlockPageScroll() { document.body.style.overflow = oldOverflow; }
```

```js
function openCustomDrawer() {
  lockPageScroll();
  customDrawer.hidden = false;
}
```

```js
function closeCustomDrawer() {
  customDrawer.hidden = true;
  unlockPageScroll();
}
```

```css
customDrawerContent.style.overflowY = "auto";
customDrawerContent.style.overscrollBehavior = "contain";
```

```js
window.addEventListener("pagehide", () => {
  // Do not leave a custom scroll lock behind during page lifecycle transitions.
  unlockPageScroll();
});
```

**Gotcha:** Treat the behavior, semantic state, and visible result as one contract. Verify the chosen pattern with keyboard input, touch input, text zoom, and real content before considering the component complete.

### 9. Current route and route changes

**Mental model:** Navigation communicates both destinations and current location. Use `aria-current="page"` for the active page and a visible state that is not color-only. In client-side applications, update the current link after every route transition and update the document title. Avoid substring route matching: `/workshop` should not be treated as `/work`. Prefer the router's route matcher or compare normalized pathnames.

```html
<nav aria-label="Primary"><a href="/work" aria-current="page">Work</a><a href="/studio">Studio</a></nav>
```

```js
nav.querySelectorAll("a[href]").forEach((link) => {
  const samePage = new URL(link.href).pathname === window.location.pathname;
  if (samePage) link.setAttribute("aria-current", "page");
  else link.removeAttribute("aria-current");
});
```

```js
nav.querySelector('[aria-current="page"]')?.classList.add("is-current");
```

```js
document.title = "Work — Northstar Studio";
```

```js
function setCurrentLink(link) {
  nav.querySelectorAll("[aria-current]").forEach((item) => item.removeAttribute("aria-current"));
  link.setAttribute("aria-current", "page");
}
```

**Gotcha:** Treat the behavior, semantic state, and visible result as one contract. Verify the chosen pattern with keyboard input, touch input, text zoom, and real content before considering the component complete.

### 10. Motion and progressive enhancement

**Mental model:** Motion should clarify a state change rather than delay access to destinations. Update semantic state immediately and use short opacity or transform transitions for visual feedback. Respect reduced-motion preferences. Do not leave an invisible panel focusable behind an opacity of zero. Core links should remain available if JavaScript fails; progressively enhance them with a toggle only after initialization has succeeded.

```css
@media (prefers-reduced-motion:reduce) {
  .menu-panel, .menu-panel a { transition:none !important; animation:none !important; }
}
```

```css
@keyframes menu-enter { from { opacity:0; transform:translateY(-.5rem); } to { opacity:1; transform:none; } }
```

```css
header[data-js-ready="true"] nav { display:none; }
header[data-js-ready="true"] nav.is-open { display:grid; }
```

```js
const root = document.querySelector("[data-enhanced-header]");
root.dataset.jsReady = "true";
```

```js
function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
```

**Gotcha:** Treat the behavior, semantic state, and visible result as one contract. Verify the chosen pattern with keyboard input, touch input, text zoom, and real content before considering the component complete.

## Reusable Patterns

### Pattern 1: Compact disclosure navigation

Use this when a site has a small, flat set of primary destinations and the page context should remain available. Keep the toggle a native button, synchronize its expanded state, and ensure the closed links are not keyboard-focusable.

```html
<header class="compact-header">
  <a href="/" class="brand">Northstar Studio</a>
  <button type="button" data-compact-toggle aria-expanded="false" aria-controls="compact-nav">Menu</button>
  <nav id="compact-nav" data-compact-nav aria-label="Primary">
    <a href="/work">Work</a><a href="/services">Services</a><a href="/studio">Studio</a><a href="/contact">Contact</a>
  </nav>
</header>
```

```css
.compact-header { display:flex; justify-content:space-between; align-items:center; gap:1rem; position:relative; }
[data-compact-toggle] { display:none; min-width:44px; min-height:44px; }
#compact-nav { display:flex; gap:1.25rem; }
@media (max-width:48rem) {
  [data-compact-toggle] { display:inline-flex; }
  #compact-nav { display:none; position:absolute; inset:100% 0 auto; z-index:5; padding:1.25rem; background:#10121a; }
  #compact-nav.is-open { display:grid; }
}
```

```js
const compactButton = document.querySelector("[data-compact-toggle]");
const compactNav = document.querySelector("[data-compact-nav]");
function setCompactOpen(open) {
  compactButton.setAttribute("aria-expanded", String(open));
  compactButton.textContent = open ? "Close menu" : "Menu";
  compactNav.classList.toggle("is-open", open);
}
compactButton.addEventListener("click", () => setCompactOpen(compactButton.getAttribute("aria-expanded") !== "true"));
compactNav.addEventListener("click", (event) => {
  if (event.target.closest("a[href]")) setCompactOpen(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && compactButton.getAttribute("aria-expanded") === "true") {
    setCompactOpen(false);
    compactButton.focus();
  }
});
```

### Pattern 2: Full-screen modal drawer

Use a modal drawer when navigation is a deliberate takeover moment or the destination hierarchy needs room. Native `dialog` is preferable to an improvised overlay when its behavior matches the design.

```html
<button type="button" data-drawer-open aria-haspopup="dialog">Explore</button>
<dialog data-site-drawer aria-labelledby="site-drawer-title">
  <header><h2 id="site-drawer-title">Explore Northstar</h2><button type="button" data-drawer-close>Close</button></header>
  <nav aria-label="Primary"><a href="/work">Work</a><a href="/services">Services</a><a href="/studio">Studio</a><a href="/contact">Contact</a></nav>
</dialog>
```

```css
[data-site-drawer] { width:100%; height:100vh; height:100dvh; max-width:none; max-height:none; margin:0; padding:max(1rem,env(safe-area-inset-top)) 1.25rem max(1rem,env(safe-area-inset-bottom)); border:0; background:#080910; color:#fff; }
[data-site-drawer]::backdrop { background:rgb(0 0 0 / 65%); }
[data-site-drawer] nav { display:grid; gap:1.5rem; margin-top:3rem; }
```

```js
const siteDrawer = document.querySelector("[data-site-drawer]");
const drawerOpen = document.querySelector("[data-drawer-open]");
const drawerClose = document.querySelector("[data-drawer-close]");
drawerOpen.addEventListener("click", () => { siteDrawer.showModal(); drawerClose.focus(); });
drawerClose.addEventListener("click", () => siteDrawer.close());
siteDrawer.addEventListener("close", () => drawerOpen.focus());
siteDrawer.querySelectorAll("a[href]").forEach((link) => link.addEventListener("click", () => siteDrawer.close()));
```

### Pattern 3: Bottom navigation for frequent tasks

Use a bottom bar only for a small, stable set of peer-level destinations. Pair icons with visible labels and reserve space in the page so content is not hidden behind the fixed bar.

```html
<nav class="bottom-nav" aria-label="Primary">
  <a href="/overview" aria-current="page"><span aria-hidden="true">⌂</span><span>Overview</span></a>
  <a href="/projects"><span aria-hidden="true">▦</span><span>Projects</span></a>
  <a href="/activity"><span aria-hidden="true">◷</span><span>Activity</span></a>
  <a href="/profile"><span aria-hidden="true">○</span><span>Profile</span></a>
</nav>
```

```css
.bottom-nav { position:fixed; z-index:20; inset-inline:0; inset-block-end:0; display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); padding:.5rem .75rem calc(.5rem + env(safe-area-inset-bottom,0px)); background:#0b0c12; }
.bottom-nav a { display:grid; justify-items:center; gap:.25rem; min-height:44px; padding:.35rem; font-size:.75rem; }
.bottom-nav a[aria-current="page"] { text-decoration:underline; text-underline-offset:.3em; }
main { padding-bottom:calc(5rem + env(safe-area-inset-bottom,0px)); }
```

### Pattern 4: Grouped menu for a complex sitemap

Group destinations by user goal, not by internal department names. Give each group a heading and avoid presenting every destination as one undifferentiated list.

```html
<nav aria-label="Explore Northstar" class="grouped-nav">
  <section aria-labelledby="group-work"><h2 id="group-work">Selected work</h2><a href="/work/digital">Digital experiences</a><a href="/work/identity">Identity systems</a></section>
  <section aria-labelledby="group-studio"><h2 id="group-studio">Studio</h2><a href="/services">Services</a><a href="/journal">Journal</a></section>
  <section aria-labelledby="group-contact"><h2 id="group-contact">Start a conversation</h2><a href="/contact">Contact the studio</a></section>
</nav>
```

```css
.grouped-nav { display:grid; gap:2rem; }
.grouped-nav section { display:grid; gap:.75rem; }
.grouped-nav h2 { font-size:.8rem; text-transform:uppercase; letter-spacing:.08em; color:#aeb4c7; }
@media (min-width:38rem) { .grouped-nav { grid-template-columns:repeat(2,minmax(0,1fr)); } }
```

### Pattern 5: Progressive enhancement

Start with meaningful links. Only collapse the navigation after JavaScript has initialized and the toggle is known to work. A script failure should not erase access to essential destinations.

```html
<header data-enhanced-header>
  <a href="/">Northstar</a>
  <button type="button" data-enhanced-toggle aria-expanded="true" aria-controls="enhanced-nav">Hide navigation</button>
  <nav id="enhanced-nav" aria-label="Primary"><a href="/work">Work</a><a href="/studio">Studio</a><a href="/contact">Contact</a></nav>
</header>
```

```css
[data-enhanced-header][data-js-ready="true"] nav { display:none; }
[data-enhanced-header][data-js-ready="true"] nav.is-open { display:grid; }
@media (min-width:48rem) { [data-enhanced-header][data-js-ready="true"] nav { display:flex; } }
```

```js
const enhancedHeader = document.querySelector("[data-enhanced-header]");
const enhancedToggle = document.querySelector("[data-enhanced-toggle]");
const enhancedNav = document.querySelector("#enhanced-nav");
enhancedHeader.dataset.jsReady = "true";
enhancedToggle.setAttribute("aria-expanded", "false");
enhancedToggle.textContent = "Open navigation";
enhancedToggle.addEventListener("click", () => {
  const open = enhancedToggle.getAttribute("aria-expanded") !== "true";
  enhancedToggle.setAttribute("aria-expanded", String(open));
  enhancedToggle.textContent = open ? "Close navigation" : "Open navigation";
  enhancedNav.classList.toggle("is-open", open);
});
```


## Common Mistakes

| Mistake | Why it fails | Better fix |
|---|---|---|

| Hiding desktop links without a replacement | Destinations vanish at small widths. | Switch to a tested mobile pattern before the header overflows. |

| Using a clickable div for the toggle | Native keyboard and button semantics are absent. | Use a button with aria-expanded and aria-controls. |

| Updating the class but not ARIA | Assistive technology hears a false state. | Centralize all state changes in one function. |

| Treating a disclosure as modal | Focus and page interaction are blocked unnecessarily. | Choose the pattern based on whether the page context is taken over. |

| Making a modal without focus restoration | Users lose their place when it closes. | Return focus to the opener when the same page remains active. |

| Closing on every bubbling click | Nested controls become unusable. | Close only on defined close actions or navigation-link activation. |

| Forgetting Escape | Keyboard users lack a predictable dismissal path. | Handle Escape for custom panels and retain native dialog behavior. |

| Leaving hidden links focusable | Tab reaches invisible controls. | Use hidden/display state or modal semantics that match visibility. |

| Using fixed header widths | Long labels overlap or clip. | Use flexible gaps and intrinsic sizing. |

| Choosing breakpoints by device brand | The layout fails at other widths and zoom settings. | Switch when content no longer fits. |

| Using only 100vh | Mobile chrome can make panels too tall. | Use a fallback followed by 100dvh and test on hardware. |

| Ignoring safe areas | Controls sit under cutouts or the home indicator. | Add env safe-area padding at relevant edges. |

| Covering content with bottom navigation | The final content becomes unreachable. | Reserve bottom padding equal to the bar's occupied area. |

| Using icon-only destinations | Users must guess unfamiliar symbols. | Pair icons with visible text labels. |

| Marking several pages current | Current location becomes ambiguous. | Apply aria-current to the single matching route. |

| Using substring route matching | Similar route prefixes collide. | Normalize pathnames or use the router's matcher. |

| Animating before updating state | Visual and semantic states disagree. | Update interaction state immediately; animate only presentation. |

| Staggering every link for too long | Navigation is delayed by decoration. | Keep motion short and destinations immediately available. |

| Locking scroll without restoring prior styles | The page may remain unscrollable. | Save and restore the exact prior inline overflow value. |

| Duplicating native dialog Escape handling | Multiple close paths conflict. | Use native cancel behavior unless there is a documented reason not to. |

| Depending entirely on JavaScript | A failed script can hide all destinations. | Keep links in the baseline markup and progressively enhance. |

| Moving focus into every disclosure | Users lose their place after expanding a simple menu. | Keep focus on the toggle unless the pattern requires movement. |

| Using a full-screen panel for two links | The menu adds needless friction. | Use a compact disclosure for a small flat list. |

| Showing a giant ungrouped sitemap | Users cannot scan the hierarchy. | Group by user goals and label each group. |

| Leaving sample routes in production | Links lead to dead ends. | Replace every example URL and contact detail with verified destinations. |

| Testing only with a mouse | Touch, focus, safe areas, and browser chrome are missed. | Test keyboard and physical iOS/Android devices. |

| Removing focus outlines | Keyboard users cannot locate focus. | Design a clear :focus-visible treatment. |

| Ignoring text zoom | Labels wrap into overlapping controls. | Test 200% zoom and allow panel scrolling. |

| Not closing after route change | The old panel can cover the new page. | Close during route transition and focus the new page heading. |

| Restoring focus after a route change to old trigger | Focus returns to obsolete context. | Restore only when the opener still belongs to the active view. |


## Mental Models

1. **Information architecture first:** The pattern should reflect hierarchy and frequency, not fashion.
2. **One state, many representations:** Visibility, label, icon, and `aria-expanded` must agree.
3. **Disclosure is not modal:** Inline expansion leaves the page context available.
4. **Focus follows context:** A modal owns focus temporarily and restores it when that context returns.
5. **Content chooses the breakpoint:** Switch when labels and controls no longer fit.
6. **The viewport moves:** Browser chrome and safe areas are part of the layout model.
7. **Motion is feedback:** Animation clarifies change and never gates access.
8. **Graceful failure:** Core links remain discoverable if enhancement code fails.

## Quick Reference

| Need | Recommended approach | Verification |
|---|---|---|
| Menu trigger | Native button | Enter and Space activate it. |
| Expanded state | `aria-expanded` | Updates with visibility. |
| Connect panel | `aria-controls` | ID points to the correct element. |
| Landmark name | `aria-label` or heading | Primary and secondary nav are distinguishable. |
| Current page | `aria-current="page"` | One correct route is marked. |
| Small menu | Disclosure | Focus remains predictable. |
| Modal takeover | `dialog.showModal()` | Focus enters the modal; Escape closes it. |
| Visible close | Native button | Easy to find and activate. |
| Escape | Custom handler or native dialog | No duplicate event handling. |
| Restore focus | Focus opener on close | Only when old context remains active. |
| Link activation | Close on actual navigation | Nested controls remain operable. |
| Outside click | Explicit containment check | Clicks inside do not dismiss. |
| Breakpoint | Content-driven media query | Header fits at the threshold. |
| Long labels | Flexible sizing and wrapping | No horizontal page overflow. |
| Full-height panel | `100vh` fallback then `100dvh` | Toolbar changes do not clip links. |
| Cutout support | `env(safe-area-inset-*)` | Controls avoid unsafe edges. |
| Bottom bar | Fixed bar plus content clearance | Last content is not obscured. |
| Touch target | Aim for 44 CSS px where practical | Adjacent targets are separated. |
| Reduced motion | `prefers-reduced-motion` | Core operation remains clear. |
| Progressive enhancement | Baseline links | Destinations work without JS. |
| Scroll lock | Native modal or reversible lock | Scroll restores on every close path. |
| Focus indicator | `:focus-visible` | Keyboard focus is visible. |
| Route matching | Normalized path or router | Similar prefixes do not collide. |
| Long menu | Internal scrolling and max-height | Landscape still exposes final link. |
| Icon treatment | Icon plus label | Meaning is not icon-only. |
| Animation | Short opacity/transform | No long delay before access. |
| Test matrix | Portrait, landscape, zoom, real devices | Safe areas and chrome are verified. |
| No-JS state | Semantic links remain present | Destinations are still discoverable. |
| SPA transition | Update title and focus destination | New context is clear. |
| Outside dismissal | Pointer containment | Panel controls remain clickable. |
| Scroll behavior | `overscroll-behavior: contain` | Drawer scroll does not leak unexpectedly. |
| Native modal | `showModal()` | Background context is inert. |
| Label length | Test translated content | Toggle and logo do not overlap. |
| Focus trap | Modal only | Disclosure remains in normal tab order. |

## Build Challenge

Build a **mobile navigation system for a creative studio portfolio** with a compact desktop header and a touch-friendly mobile menu. Choose one primary mobile pattern and document why it fits the site.

### Requirements

1. Create a semantic header with a home link and a primary navigation landmark.
2. Use a native button and synchronize `aria-expanded`, the accessible label, and panel visibility.
3. Connect toggle and panel with a valid `aria-controls` ID.
4. Include at least five named destinations rather than generic placeholder labels.
5. Choose disclosure or modal drawer intentionally and explain the trade-off.
6. If modal, move focus into it, support Escape, and restore focus when the same page remains active.
7. If disclosure, do not trap focus or block the page behind it.
8. Mark the current route with `aria-current="page"` and a non-color visual indicator.
9. Add visible focus styles for every interactive control.
10. Keep touch targets practical and space adjacent controls.
11. Handle long labels and narrow widths without horizontal page overflow.
12. Test at 320 CSS pixels and at 200% text zoom.
13. Use dynamic viewport units and safe-area padding for full-screen or fixed-edge panels.
14. If using bottom navigation, reserve space so content is not covered.
15. Add reduced-motion styling that removes or shortens decoration.
16. Provide a visible close control for a modal drawer.
17. Keep core links available if JavaScript fails or document the enhancement dependency.
18. Test Escape, Tab, Shift+Tab, Enter, Space, and touch activation.
19. Test portrait and landscape with mobile browser chrome expanded and collapsed.
20. Verify on physical iOS and Android devices, or record which checks remain outstanding.
21. Ensure route selection closes the panel and focus does not return to an obsolete page.
22. Confirm hidden links are not keyboard-focusable when closed.
23. Group a multi-level sitemap by user goals and meaningful headings.
24. Document the breakpoint and the content constraint that determines it.

### Expected output

A working navigation component with semantic HTML, responsive CSS, and JavaScript, plus a concise README covering pattern choice, state model, focus policy, safe-area handling, reduced motion, and test results.

### Success criteria

- Every destination is reachable by keyboard and touch.
- Visible and accessible menu states never disagree.
- A modal behaves as modal; a disclosure behaves as disclosure.
- Close behavior is predictable and focus returns to the right context.
- Long labels, zoom, landscape, and browser chrome do not hide destinations.
- Current location is communicated semantically and visually.
- Essential links remain available if enhancement code fails.
- Motion clarifies state without delaying access.
- Physical-device checks and unresolved issues are recorded honestly.


## Production Review Checklist

Use this checklist during a code review rather than treating a successful local click as proof that navigation is complete.

- **Information hierarchy:** Can a first-time visitor predict where each top-level destination leads? If labels are vague, fix the information architecture before tuning animation.
- **State consistency:** Is there one state variable or one centralized state function? Search for class toggles and ARIA mutations that bypass it.
- **Closed state:** Can keyboard users tab to hidden links? Inspect the DOM and test with Tab, not only with a screenshot.
- **Open state:** Does the panel have a clear heading, visible close path, and a scrollable layout if its content exceeds the viewport?
- **Modal behavior:** If the panel blocks the page, is background interaction prevented and is focus restored appropriately?
- **Disclosure behavior:** If the panel is inline, does it avoid an unnecessary focus trap or body scroll lock?
- **Responsive fit:** Test the actual longest label, translated strings if available, browser zoom, and a narrow landscape viewport.
- **Viewport changes:** Open and collapse browser chrome and rotate the device while the panel is open.
- **Safe areas:** Verify top, bottom, and horizontal insets on a device that has a display cutout or home indicator.
- **Route state:** Confirm only the correct destination has `aria-current`, and that route matching does not confuse similar prefixes.
- **Motion:** Confirm reduced-motion preferences remove decorative transitions without hiding a state change.
- **Failure behavior:** Disable JavaScript or force an initialization error and verify that essential destinations remain available.
- **Touch:** Test repeated taps, outside taps, scroll gestures inside the panel, and a link activation near the panel edge.
- **Keyboard:** Test Tab, Shift+Tab, Enter, Space, and Escape. Check that focus never disappears behind an overlay.
- **Real hardware:** Record device model, browser, orientation, and observed issue rather than writing “tested on mobile.”
- **Content maintenance:** Ensure the navigation remains coherent when a destination is added or renamed; avoid duplicated hard-coded labels in multiple components.
- **Analytics:** If measuring menu opens, distinguish an open action from a close action and do not count every state synchronization as a new user intent.
- **Performance:** Avoid expensive layout reads and writes in a loop while animating the menu. Use CSS transitions on transforms and opacity when appropriate.
- **Security and trust:** Use verified internal routes and contact addresses. A visually polished menu with broken or misleading destinations damages trust.
- **Ownership:** Document who owns the sitemap and who updates the active route state when the site changes.

## Additional Focused Code Patterns

The snippets below are small, focused utilities for recurring implementation decisions. They are not intended to replace the larger patterns above.

### Normalize a route before comparison

```js
function routePath(urlValue) {
  const url = new URL(urlValue, window.location.origin);
  return url.pathname.replace(/\/+$/, "") || "/";
}
```

### Apply current-page semantics to a set of links

```js
function updateCurrentPage(links, currentPath) {
  for (const link of links) {
    if (routePath(link.href) === currentPath) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
}
```

### Check whether an element is visible

```js
function isRendered(element) {
  return Boolean(element && element.getClientRects().length);
}
```

### Find a visible link without forcing focus into a hidden menu

```js
function focusVisibleNavigationLink(panel) {
  const link = [...panel.querySelectorAll("a[href]")].find(isRendered);
  link?.focus();
}
```

### Preserve a previous inline style value

```js
function saveInlineOverflow(body) {
  return body.style.overflow;
}
```

### Restore a saved inline style value

```js
function restoreInlineOverflow(body, savedValue) {
  body.style.overflow = savedValue;
}
```

### Close on Escape for a custom disclosure

```js
function closeDisclosureOnEscape(event, isOpen, close, opener) {
  if (event.key !== "Escape" || !isOpen()) return;
  close();
  opener.focus();
}
```

### Keep the current link visible in a scrollable drawer

```js
function revealCurrentLink(panel) {
  const current = panel.querySelector('[aria-current="page"]');
  current?.scrollIntoView({ block: "nearest" });
}
```

### Avoid hiding an active focused element

```js
function moveFocusBeforeHiding(panel, opener) {
  if (panel.contains(document.activeElement)) opener.focus();
}
```

### Apply a state update without duplicating labels

```js
function updateToggle(toggle, panel, open) {
  toggle.setAttribute("aria-expanded", String(open));
  toggle.textContent = open ? "Close menu" : "Menu";
  panel.classList.toggle("is-open", open);
}
```

### Measure overflow after layout

```js
function navigationOverflows(element) {
  return element.scrollWidth > element.clientWidth;
}
```

### Keep a menu panel inside the visible viewport

```css
.mobile-menu-panel {
  max-height: calc(100dvh - 1.5rem);
  overflow-y: auto;
  overscroll-behavior: contain;
}
```

### Give keyboard focus a visible treatment

```css
.site-header a:focus-visible,
.site-header button:focus-visible {
  outline: 3px solid #78a9ff;
  outline-offset: 3px;
}
```

### Respect reduced motion in a component

```css
@media (prefers-reduced-motion: reduce) {
  .mobile-menu-panel,
  .mobile-menu-panel * {
    animation-duration: 0.01ms;
    transition-duration: 0.01ms;
    scroll-behavior: auto;
  }
}
```

### Make a panel safe-area aware

```css
.mobile-menu-panel {
  padding:
    max(1rem, env(safe-area-inset-top, 0px))
    max(1rem, env(safe-area-inset-right, 0px))
    max(1rem, env(safe-area-inset-bottom, 0px))
    max(1rem, env(safe-area-inset-left, 0px));
}
```

### Set the active route from an explicit route value

```js
function applyActiveRoute(nav, route) {
  nav.querySelectorAll("a[href]").forEach((link) => {
    const active = routePath(link.href) === route;
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}
```

### Keep bottom navigation from overlapping content

```css
.page-shell {
  padding-bottom: calc(4.75rem + env(safe-area-inset-bottom, 0px));
}
```

### Verify that a toggle controls the intended panel

```js
function controlledPanel(button) {
  const panelId = button.getAttribute("aria-controls");
  return panelId ? document.getElementById(panelId) : null;
}
```

### Update a menu without moving focus unexpectedly

```js
function toggleDisclosure(toggle, panel) {
  const open = toggle.getAttribute("aria-expanded") !== "true";
  toggle.setAttribute("aria-expanded", String(open));
  panel.hidden = !open;
}
```

### Check if reduced motion is preferred

```js
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
function motionDuration(normalDuration) {
  return reducedMotionQuery.matches ? 0 : normalDuration;
}
```

### Close a drawer after a successful route transition

```js
function afterRouteChange(dialog, destinationHeading) {
  if (dialog.open) dialog.close();
  destinationHeading?.focus();
}
```

### Test route normalization boundaries

```js
console.assert(routePath("/work/") === "/work");
console.assert(routePath("/workshop") === "/workshop");
console.assert(routePath("/") === "/");
```

### Keep the current page visible in a menu

```css
nav a[aria-current="page"] {
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: .3em;
}
```

These helpers should be used selectively. If a project already has a router, component state system, or design-system navigation primitive, extend that existing contract instead of introducing a second competing mechanism.
