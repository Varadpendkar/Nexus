# SKILL: cross-device-testing

**Layer:** 08 — Responsive Mobile

**Goal:** Establish a repeatable, risk-based workflow for validating responsive layouts, interaction, accessibility, browser behavior, and performance across representative devices.

## Why This Matters (Senior Perspective)

A website that looks polished on one laptop is not necessarily ready for real users. A mobile navigation may work with a mouse but fail with a thumb; a heading may fit at 390 CSS pixels and clip at 375; a sticky action bar may cover a form field when the virtual keyboard opens; and a WebGL hero may run smoothly on a development machine but stutter on an older phone. These failures affect usability, accessibility, trust, conversion, and the amount of support work after launch.

Senior developers do not attempt every combination of device, operating system, browser, orientation, input method, pixel density, network, and preference. The combination space grows too quickly. Instead, they define supported environments, rank features by risk, automate repeatable checks, inspect visual changes, and use physical devices for behaviors emulation cannot reliably reproduce. The output is a defensible coverage statement, not a claim that every device in the world has been tested.

This is especially important for creative portfolios and agency sites. Large typography, scroll choreography, video, canvas, custom cursors, and fixed calls to action are often central to the visual concept. Cross-device testing should preserve that concept while ensuring the essential content and actions remain understandable when a feature is slow, unsupported, disabled by a preference, or operated without a mouse.

## Core Concepts

### 1. A test environment is a tuple

A device name alone is not a test specification. Record the CSS viewport, browser engine and version, operating system, input capabilities, orientation, device pixel ratio, user preferences, and runtime conditions when they affect the feature being tested.

- **Viewport:** CSS width and height, not simply physical display dimensions.
- **Engine:** Chromium, WebKit, and Gecko can differ in layout and APIs.
- **Input:** touch, mouse, keyboard, stylus, and hybrid combinations.
- **DPR:** affects rasterization and screenshot dimensions.
- **Preferences:** reduced motion, color scheme, contrast, and text scaling.
- **Runtime:** CPU, memory, network, GPU, and battery constraints.

```js
const environment = {
  id: "compact-android-portrait",
  viewport: { width: 360, height: 800 },
  engine: "Chromium",
  input: ["touch", "keyboard"],
  orientation: "portrait",
  devicePixelRatio: 3,
  reducedMotion: false,
  network: "constrained-4g"
};

console.table(environment);
```

This object documents a representative profile. It does not imply every Android phone has the same dimensions or behavior. Use actual device measurements when available.

```js
function environmentLabel({ engine, viewport, orientation, input }) {
  return `${engine} / ${viewport.width}x${viewport.height} / ${orientation} / ${input.join("+")}`;
}

console.log(environmentLabel(environment));
```

### 2. Risk-based coverage is more useful than exhaustive combinations

If a product supports five viewport classes, three engines, two orientations, three input modes, and two motion preferences, there are already 180 combinations before OS versions, device performance, network, and content variations. Testing all of them on every change is rarely practical.

Prioritize based on user impact, likelihood, uncertainty, audience share, and recent code changes. Primary journeys such as navigation, search, sign-up, contact, and checkout deserve more attention than decorative footer details. Features with high behavioral variance—sticky UI, virtual keyboards, custom gestures, animation, video, and WebGL—deserve targeted tests.

```js
function riskScore({ impact, likelihood, uncertainty }) {
  // Uncertain behavior receives more attention because its failure modes are less understood.
  return impact * likelihood * uncertainty;
}

const features = [
  { name: "contact form", impact: 5, likelihood: 4, uncertainty: 3 },
  { name: "decorative footer icon", impact: 1, likelihood: 2, uncertainty: 1 },
  { name: "mobile menu", impact: 5, likelihood: 3, uncertainty: 4 }
];

console.table(
  features.map(feature => ({ ...feature, score: riskScore(feature) }))
    .sort((a, b) => b.score - a.score)
);
```

A risk score supports a conversation; it is not a universal industry formula. Agree on a scale and keep the scale consistent across releases.

### 3. Emulation and physical devices serve different purposes

Browser developer tools are excellent for quick viewport iteration, touch-event emulation, CPU throttling, network throttling, and repeatable screenshots. They are not perfect simulations of physical hardware or operating systems.

Emulation may not faithfully reproduce virtual-keyboard behavior, collapsing browser chrome, GPU limits, thermal throttling, memory pressure, native autofill, platform form controls, real multi-touch gestures, all safe-area configurations, or screen-reader/browser combinations. Verify high-risk behavior on physical hardware where possible. If no device is available, mark the item unverified instead of reporting it as passed.

```js
const evidence = {
  issue: "sticky submit button is covered by the virtual keyboard",
  reproducedIn: ["desktop browser emulation"],
  physicalDeviceConfirmed: false,
  nextAction: "verify on physical iOS Safari",
  confidence: "provisional"
};

console.log(evidence);
```

### 4. Screenshots are evidence, not a complete test

A screenshot can expose clipping, unexpected wrapping, spacing drift, missing images, overflow, and visual regressions. It cannot prove that the menu is keyboard-operable, a form submits, a touch target is easy to use, focus is visible, or an animation remains smooth.

Pair visual checks with behavioral assertions. Verify the primary journey, keyboard focus, dismissal behavior, validation states, reduced-motion behavior, zoom, and the visibility of fixed elements.

```js
const coverage = {
  visual: ["no clipped title", "no root overflow", "footer CTA does not cover content"],
  behavior: ["menu opens", "Escape dismisses dialog", "form reports invalid input"],
  accessibility: ["focus is visible", "controls have accessible names", "zoom preserves content"]
};

console.log(coverage);
```

### 5. CSS pixels differ from physical pixels

A 390 CSS-pixel viewport on a device with DPR 3 may be represented by roughly 1170 physical pixels. Browser automation tools, screenshots, and remote-device platforms may report different dimensions depending on capture settings. Record the CSS viewport and DPR and normalize captures before comparing them.

```js
function estimatePhysicalPixels(cssPixels, dpr) {
  return Math.round(cssPixels * dpr);
}

console.log(estimatePhysicalPixels(390, 3));
```

Canvas code may need a high-resolution backing store, but blindly using a very high DPR can multiply memory and fill-rate costs. Cap DPR where the visual quality/performance trade-off is appropriate.

```js
function configureCanvas(canvas, width, height, maxDpr = 2) {
  // Limit backing-store size to protect GPU memory on dense displays.
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const context = canvas.getContext("2d");
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  return context;
}
```

### 6. Test around responsive boundaries

Testing only at named device presets misses the widths where a layout breaks. A navigation row may fit at 390px and 430px but fail at 402px because of intrinsic sizing or a long label. Test just below, at, and above each breakpoint, plus content-sensitive cases such as long headings, translated text, validation messages, empty states, and unusually long project names.

```js
function boundaryWidths(breakpoint, delta = 1) {
  return [breakpoint - delta, breakpoint, breakpoint + delta];
}

console.log(boundaryWidths(768));
```

For a fluid layout, test the narrowest supported width, the widest expected width, and intermediate widths. Resize continuously during manual inspection and watch for abrupt jumps, clipped content, and unintended horizontal scrolling.

### 7. Input modes change the interaction contract

A design that depends on hover is fragile on touch devices. A design that assumes touch can exclude keyboard and switch-device users. Hybrid laptops may support both touch and a fine pointer, so one capability check should not determine whether essential content exists.

```css
/* Baseline interaction remains usable on touch and keyboard. */
.project-card__link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0.75rem 1rem;
}

/* Hover is an enhancement, not the only way to access information. */
@media (hover: hover) and (pointer: fine) {
  .project-card__link:hover {
    text-decoration-thickness: 0.15em;
  }
}
```

If a project card reveals details on hover, expose those details through focus or a persistent mobile layout too.

```css
.project-card__details {
  opacity: 1;
}

@media (hover: hover) and (pointer: fine) {
  .project-card__details {
    opacity: 0;
    transition: opacity 180ms ease;
  }

  .project-card:hover .project-card__details,
  .project-card:focus-within .project-card__details {
    opacity: 1;
  }
}
```

### 8. Browser and operating-system behavior is part of the design

Viewport units, sticky positioning, form controls, font metrics, scrollbars, focus rings, media playback, safe areas, and keyboard overlays can vary across engines and OS versions. Avoid user-agent branching as the first response: reproduce the failure, identify the contract that is failing, and prefer feature detection or progressive enhancement.

```js
const capabilities = {
  visualViewport: "visualViewport" in window,
  intersectionObserver: "IntersectionObserver" in window,
  resizeObserver: "ResizeObserver" in window
};

console.table(capabilities);
```

### 9. Test degraded states, not only the ideal path

A page should still communicate and permit core actions if a font fails, a third-party script is blocked, video cannot autoplay, a WebGL context is unavailable, or the network is slow. Decorative effects can enrich a design, but should not be the only carrier of meaning.

```js
function activateHeroFallback(container, message) {
  // Keep the primary message and call to action available without the rendering effect.
  container.classList.add("hero--fallback");
  const status = container.querySelector("[data-hero-status]");
  if (status) status.textContent = message;
}
```

```css
.hero--fallback .hero__canvas {
  display: none;
}

.hero__fallback {
  display: none;
}

.hero--fallback .hero__fallback {
  display: block;
}
```

### 10. Reproducible evidence turns a complaint into a fix

“Broken on mobile” does not tell another developer what to reproduce. Record the environment, build, action sequence, expected behavior, actual behavior, severity, and supporting evidence. Attach a screenshot or recording when visual or timing behavior matters.

```js
const bugReport = {
  title: "Contact submit control is obscured",
  build: "release-candidate",
  environment: {
    browser: "Safari on iOS",
    viewportCssPixels: "390x844",
    orientation: "portrait",
    input: "touch"
  },
  steps: [
    "Open contact page",
    "Scroll to final form field",
    "Focus field to open virtual keyboard"
  ],
  expected: "The focused field and submit action remain reachable",
  actual: "Sticky action bar covers the submit button",
  evidence: ["screen recording", "screenshot"]
};

console.log(bugReport);
```

## Reusable Testing Patterns

### Pattern 1: Risk-based device matrix

**Use when:** Planning a release without attempting every possible environment combination.

Create a table with case ID, environment, viewport, input, journey, priority, test type, result, and evidence. Keep the matrix small enough to maintain but explicit enough to show what is and is not covered.

```js
const matrix = [
  {
    id: "MOB-01",
    environment: "Android / Chromium",
    viewport: "360x800 CSS px",
    input: "touch",
    journey: "open menu and submit contact form",
    priority: "P0",
    testType: "emulated + physical smoke test"
  },
  {
    id: "MOB-02",
    environment: "iOS Safari",
    viewport: "390x844 CSS px",
    input: "touch + keyboard",
    journey: "focus final field with keyboard open",
    priority: "P0",
    testType: "physical device"
  },
  {
    id: "DESK-01",
    environment: "desktop Chromium",
    viewport: "1440x900 CSS px",
    input: "mouse + keyboard",
    journey: "navigation and primary action",
    priority: "P1",
    testType: "automated + manual"
  }
];

console.table(matrix);
```

```js
const resultRecord = {
  caseId: "MOB-01",
  build: "release-candidate-2026-10-23",
  status: "not-run",
  tester: "",
  evidenceLocation: "",
  linkedDefect: ""
};
```

### Pattern 2: Responsive boundary sweep

**Use when:** A layout changes at a breakpoint or contains content whose intrinsic size varies.

```js
const breakpoints = [480, 768, 1024, 1280];
const testWidths = [...new Set(
  breakpoints.flatMap(width => [width - 1, width, width + 1])
)].sort((a, b) => a - b);

console.log(testWidths);
```

A Playwright test can inspect document-level overflow across a set of widths.

```js
import { test, expect } from "@playwright/test";

const widths = [320, 359, 360, 374, 375, 390, 414, 479, 480, 481, 767, 768, 769, 1024, 1440];

for (const width of widths) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth
    }));
    expect(dimensions.content, `overflow at ${width}px`)
      .toBeLessThanOrEqual(dimensions.viewport + 1);
  });
}
```

If a page intentionally contains a horizontal gallery, inspect that component separately rather than hiding all overflow on the document root.

```js
const overflowReport = await page.evaluate(() => {
  const root = document.documentElement;
  return {
    viewport: root.clientWidth,
    documentWidth: root.scrollWidth,
    likelySources: [...document.querySelectorAll("body *")]
      .filter(element => element.scrollWidth > element.clientWidth + 1)
      .slice(0, 20)
      .map(element => ({
        tag: element.tagName,
        className: typeof element.className === "string" ? element.className : "",
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth
      }))
  };
});
console.log(overflowReport);
```

### Pattern 3: Cross-engine smoke tests with Playwright

**Use when:** The product supports multiple browser engines and its critical journeys can be automated.

```js
// playwright.config.js
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
    { name: "mobile-webkit", use: { ...devices["iPhone 13"] } }
  ]
});
```

Device profile names and the app's preview command depend on the installed tooling. Confirm the configuration against the version used in the project.

```js
// tests/contact-form.spec.js
import { test, expect } from "@playwright/test";

test("visitor can submit the contact form", async ({ page }) => {
  await page.goto("/contact");
  await page.getByLabel("Name").fill("Aarav Mehta");
  await page.getByLabel("Email").fill("aarav@example.com");
  await page.getByLabel("Project details").fill(
    "I need a responsive portfolio website."
  );
  await page.getByRole("button", { name: /send message/i }).click();
  await expect(page.getByRole("status")).toContainText(/received|sent|thank/i);
});
```

Use accessible roles and labels. If these selectors do not exist, improve the product's accessible interface rather than making the test depend on arbitrary styling classes.

### Pattern 4: Touch and keyboard parity audit

**Use when:** Menus, dialogs, carousels, tooltips, custom cursors, and hover-revealed cards are present.

```js
const parityChecklist = [
  "Every action has a semantic link or button",
  "Touch targets have adequate size and spacing",
  "Hover-only details are also available by focus or touch",
  "Tab order follows reading order",
  "Focus is visible",
  "Escape dismisses appropriate overlays",
  "Focus returns to the opener after a modal closes",
  "Dragging has a non-drag alternative where needed"
];

console.log(parityChecklist);
```

```css
:where(a, button, input, select, textarea, [tabindex]):focus-visible {
  outline: 3px solid #72a7ff;
  outline-offset: 3px;
}
```

```js
import { test, expect } from "@playwright/test";

test("navigation can be operated from the keyboard", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
  expect(focusedTag).toBeTruthy();
});
```

This is only a smoke check. A complete audit must inspect the focus sequence, visibility, and operation of each relevant control.

### Pattern 5: Orientation and visual viewport check

**Use when:** The page has fixed controls, full-screen dialogs, viewport-height hero sections, or forms on mobile.

```js
function viewportSnapshot() {
  const visual = window.visualViewport;
  return {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    clientWidth: document.documentElement.clientWidth,
    clientHeight: document.documentElement.clientHeight,
    visualWidth: visual?.width ?? null,
    visualHeight: visual?.height ?? null,
    visualOffsetTop: visual?.offsetTop ?? null,
    visualScale: visual?.scale ?? null
  };
}

console.table(viewportSnapshot());
```

Capture values before and after focusing an input on a physical device. Desktop emulation does not prove that a real virtual keyboard will expose the same viewport.

```js
window.visualViewport?.addEventListener("resize", () => {
  // Diagnostic only: do not leave verbose viewport logging enabled in production.
  console.debug("visual viewport changed", {
    width: window.visualViewport.width,
    height: window.visualViewport.height,
    offsetTop: window.visualViewport.offsetTop
  });
});
```

### Pattern 6: Reduced-motion verification

**Use when:** Scroll effects, parallax, animated navigation, auto-playing media, or WebGL motion are present.

```css
.hero__object {
  animation: drift 6s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .hero__object {
    animation: none;
    transform: none;
  }

  html {
    scroll-behavior: auto;
  }
}
```

```js
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function applyMotionPolicy() {
  if (reducedMotion.matches) {
    stopDecorativeAnimation();
    renderStaticHero();
  } else {
    startDecorativeAnimation();
  }
}

reducedMotion.addEventListener("change", applyMotionPolicy);
applyMotionPolicy();
```

The lifecycle functions above must be implemented by the application. Stopping a CSS animation alone may not stop a JavaScript render loop or WebGL ticker.

### Pattern 7: Network and CPU degradation pass

**Use when:** The page uses large media, third-party widgets, client-side rendering, or GPU-heavy effects.

Throttle network and CPU in developer tools or a device lab. Confirm essential content and actions appear before optional assets finish loading. A slow visual should not block a contact link or make the interface look permanently frozen.

```js
const resources = performance.getEntriesByType("resource").map(entry => ({
  resource: entry.name.split("/").pop(),
  durationMs: Math.round(entry.duration),
  transferBytes: entry.transferSize ?? 0,
  decodedBytes: entry.decodedBodySize ?? 0
}));

console.table(resources.sort((a, b) => b.durationMs - a.durationMs).slice(0, 15));
```

Cross-origin timing data may be restricted unless the server exposes it. A zero transfer size is not proof that a resource has no cost.

```js
const navigationEntry = performance.getEntriesByType("navigation")[0];

if (navigationEntry) {
  console.table({
    domContentLoadedMs: Math.round(navigationEntry.domContentLoadedEventEnd),
    loadEventMs: Math.round(navigationEntry.loadEventEnd),
    transferBytes: navigationEntry.transferSize
  });
}
```

### Pattern 8: Stable screenshot regression

**Use when:** The visual design changes frequently and regressions are costly.

Use deterministic content, wait for fonts, reduce motion, and keep desktop and mobile baselines separate. Inspect every diff; do not blindly accept new screenshots as correct.

```js
import { test, expect } from "@playwright/test";

test("desktop home visual baseline", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page).toHaveScreenshot("home-desktop.png", {
    fullPage: true,
    animations: "disabled",
    caret: "hide"
  });
});
```

```js
import { test, expect } from "@playwright/test";

test("mobile home visual baseline", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page).toHaveScreenshot("home-mobile.png", {
    fullPage: true,
    animations: "disabled",
    caret: "hide"
  });
});
```

### Pattern 9: Form and virtual-keyboard journey

**Use when:** Forms contain multiple fields, validation, sticky actions, or long content.

```js
import { test, expect } from "@playwright/test";

test("empty form submission exposes errors", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/contact");
  await page.getByRole("button", { name: /send message/i }).click();
  await expect(page.getByText(/enter your name/i)).toBeVisible();
  await expect(page.getByText(/enter a valid email/i)).toBeVisible();
});
```

```js
import { test, expect } from "@playwright/test";

test("invalid email has a useful error", async ({ page }) => {
  await page.goto("/contact");
  await page.getByLabel("Name").fill("Aarav Mehta");
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByRole("button", { name: /send message/i }).click();
  await expect(page.getByText(/enter a valid email/i)).toBeVisible();
});
```

A physical-device pass is still needed to confirm that the native keyboard does not obscure the focused field or submit control.

### Pattern 10: Defect triage and retest

**Use when:** Multiple issues compete for release attention.

```js
const defects = [
  { id: "RWD-104", impact: 5, frequency: 4, workaround: 1 },
  { id: "RWD-105", impact: 2, frequency: 2, workaround: 4 },
  { id: "RWD-106", impact: 4, frequency: 3, workaround: 2 }
];

function priorityScore(defect) {
  // A poor workaround increases urgency because users cannot recover easily.
  return defect.impact * defect.frequency * (6 - defect.workaround);
}

console.table(defects.map(item => ({ ...item, score: priorityScore(item) }))
  .sort((a, b) => b.score - a.score));
```

A keyboard trap, blocked primary action, data loss, or security defect can be release-blocking regardless of a numeric score.

```js
const retest = {
  defectId: "RWD-104",
  originalEnvironment: "iOS Safari, portrait, touch",
  fixedBuild: "release-candidate",
  originalStepsRepeated: true,
  adjacentChecks: ["landscape", "keyboard navigation", "small Android viewport"],
  result: "pass",
  evidence: "new screenshot and recording"
};

console.log(retest);
```

## Common Mistakes

| Mistake | Why it fails | Better approach |
|---|---|---|
| Testing only on the developer's phone | Hides engine, input, font, and hardware differences. | Use a documented matrix and include a second engine. |
| Treating DevTools as a physical device | Keyboard, GPU, browser chrome, and OS behavior can differ. | Verify high-risk behavior on real hardware. |
| Testing only familiar viewport presets | Intermediate widths can expose wrapping and overflow. | Test breakpoint edges and content-driven widths. |
| Taking screenshots without interaction tests | Appearance does not prove operability. | Pair visual tests with journey assertions. |
| Treating screenshot pixels as CSS pixels | DPR and capture methods change dimensions. | Record viewport and DPR, then normalize images. |
| Testing hover but not focus | Keyboard users may not reveal hidden content. | Test focus-visible and focus-within states. |
| Assuming touch devices never hover | Hybrid devices can expose multiple input capabilities. | Use capability queries and retain non-hover access. |
| Ignoring reduced motion | Motion can cause discomfort or obscure content. | Test the preference and stop JS-driven animation too. |
| Hiding overflow globally | Masks the source and can make content unreachable. | Identify the overflowing element and fix its constraints. |
| Testing only page load | Failures may appear after scroll, focus, or submission. | Test the complete critical journey. |
| Ignoring slow network and CPU | Optional assets can delay meaningful content. | Throttle and test fallback/loading states. |
| Blindly accepting visual baselines | Regressions can become the new expected output. | Review diffs and require a reason for baseline updates. |
| Using styling classes as test selectors | CSS refactors can break unrelated tests. | Prefer accessible roles and labels. |
| Writing vague bug reports | Teammates cannot reproduce the failure. | Include environment, build, steps, expected/actual, and evidence. |
| Skipping adjacent retests | A narrow fix may break another viewport. | Retest the original issue and nearby risks. |
| Treating passing automation as universal proof | Only configured environments and assertions are covered. | State coverage boundaries and retain manual checks. |
| Ignoring zoom and text scaling | Fixed heights may clip enlarged content. | Test zoom and avoid rigid content heights. |
| Forgetting orientation changes | Cached measurements and fixed layouts can become stale. | Test portrait, landscape, and rotation back. |
| Testing only happy paths | Error, empty, and loading states often fail differently. | Include representative failure states. |
| Capturing live, unpredictable content | Random data and timestamps create noisy diffs. | Freeze data and disable motion for captures. |

## Mental Models

1. **Coverage is a risk budget.** Spend time where a failure would hurt users most.
2. **An environment is a tuple.** Viewport, engine, OS, input, preferences, and hardware all influence behavior.
3. **Emulation is a filter, not a verdict.** It catches many issues but cannot replace every physical check.
4. **A screenshot proves one instant of appearance.** Behavior, accessibility, and performance need separate evidence.
5. **Boundaries expose fragility.** Test just around breakpoints and content-size transitions.
6. **Progressive enhancement protects the core journey.** Optional effects can fail without removing essential content.
7. **A bug report is a reproduction recipe.** Precise environment and steps turn a complaint into actionable work.

## Quick Reference

| Need | Check | Evidence |
|---|---|---|
| Find root overflow | Compare `scrollWidth` and `clientWidth` | Width report |
| Test breakpoint edges | Check `b - 1`, `b`, `b + 1` | Boundary matrix |
| Compare engines | Run core journeys in supported engines | CI report |
| Check touch targets | Activate controls on a physical phone | Recording |
| Verify keyboard access | Tab through the complete journey | Focus-order notes |
| Check hover alternatives | Test focus and touch disclosure | Interaction checklist |
| Verify reduced motion | Emulate preference and inspect animation lifecycle | Behavior notes |
| Check mobile keyboard | Focus final fields on physical device | Screen recording |
| Verify orientation | Rotate portrait and landscape | Before/after captures |
| Compare DPR output | Record CSS viewport and DPR | Capture metadata |
| Check slow network | Throttle network and CPU | Waterfall and usability notes |
| Stabilize font capture | Wait for `document.fonts.ready` | Stable screenshot |
| Test forms | Submit invalid and valid values | Assertions and screenshots |
| Check effect fallback | Disable optional rendering | Fallback capture |
| Retest a defect | Repeat original steps on fixed build | Retest record |
| Test zoom | Increase browser zoom and inspect content | Zoom screenshots |
| Inspect resources | Review Resource Timing entries | Resource summary |
| Stabilize visual diffs | Freeze data and disable motion | Reviewed baseline |
| Confirm release scope | Mark tested and untested cases | Signed-off matrix |
| Track recurring failures | Link cases to defect IDs | Test management record |

## Build Challenge

### Project: Cross-device release gate for a creative agency landing page

Build a repeatable test suite and manual test plan for an agency homepage containing responsive navigation, an animated hero, a project grid, a contact form, and a sticky mobile call to action. Use an existing site if available; otherwise create a compact demonstration page. Evaluate it as a product, not only as a screenshot.

### Requirements

1. Define supported viewport widths, browser engines, input modes, orientation behavior, and reduced-motion expectations.
2. Create a risk-based matrix with at least 12 cases and fields for priority, environment, journey, test type, status, and evidence.
3. Run a width sweep around each breakpoint and include narrow, intermediate, and wide layouts.
4. Automate document-level overflow checks and report likely source elements without globally hiding overflow.
5. Add cross-engine smoke coverage for navigation and a primary user journey.
6. Verify keyboard focus visibility, logical order, menu dismissal, and CTA access without a mouse.
7. Confirm touch usability and ensure essential information is not hover-only.
8. Test empty submission, invalid email, valid submission, and visible confirmation.
9. Verify reduced motion removes or limits decorative motion while retaining content and actions.
10. Test portrait and landscape, including sticky elements and navigation.
11. If possible, physically test the virtual keyboard with the final form field focused; otherwise mark this behavior unverified.
12. Run a constrained-network pass and confirm essential content appears before optional media.
13. Capture separate desktop and mobile visual baselines under stable conditions; inspect every diff.
14. Simulate a missing decorative asset or disabled WebGL effect and verify a useful fallback.
15. Write at least five reproducible defect reports with environment, steps, expected/actual behavior, severity, and evidence.
16. Retest every fix using the original steps and at least one adjacent regression case.
17. Separate automated results, manual checks, physical-device checks, and unverified assumptions.
18. Produce a release decision listing blockers, accepted risks, and evidence required before shipping.

### Expected output

- `playwright.config.js` or equivalent cross-browser configuration.
- Automated tests for overflow, navigation, form validation, and visual snapshots.
- A responsive matrix with at least 12 test cases.
- Reviewed desktop and mobile screenshots.
- Five or more reproducible defect reports and retest records.
- A one-page release summary stating what was tested, what failed, what remains unverified, and whether the build is safe to ship.

### Success criteria

Another developer must be able to reproduce the test run, understand coverage boundaries, repeat the manual checks, and make a release decision from evidence. Tests must validate user-visible behavior, not merely that the page loads. No unresolved P0 defect may be hidden by a passing screenshot baseline, and all untested high-risk behaviors must be disclosed.

### Suggested work session

1. First 30 minutes: define risk and supported environments.
2. Next 45 minutes: create the matrix and automate overflow checks.
3. Next 60 minutes: add navigation, keyboard, and form tests.
4. Next 45 minutes: capture and review visual baselines.
5. Next 45 minutes: run touch, orientation, and reduced-motion checks.
6. Final 30 minutes: document defects, retests, and the release decision.

A disciplined cross-device process does not require identical pixels everywhere. It requires a product that remains understandable, accessible, and functional in the environments it claims to support, with evidence behind that claim.


## Additional Focused Test Snippets

Use these small diagnostics as building blocks. Adapt selectors and expectations to the real accessible interface; a generic snippet does not by itself prove full coverage.

### Playwright viewport helper

```js
async function openAtViewport(page, width = 390, height = 844) {
  await page.setViewportSize({ width, height });
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");
}
```

### Document overflow helper

```js
async function readDocumentOverflow(page) {
  return page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
    overflow: document.documentElement.scrollWidth >
      document.documentElement.clientWidth + 1
  }));
}
```

### Touch target measurement

```js
function measureTarget(element) {
  const rect = element.getBoundingClientRect();
  return {
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    atLeast44By44: rect.width >= 44 && rect.height >= 44
  };
}
```

### Environment metadata

```js
const metadata = await page.evaluate(() => ({
  userAgent: navigator.userAgent,
  viewport: `${innerWidth}x${innerHeight}`,
  dpr: devicePixelRatio,
  language: navigator.language,
  colorScheme: matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}));
console.table(metadata);
```

### Wait for fonts before capture

```js
await page.evaluate(async () => {
  await document.fonts.ready;
});
```

### Capture console errors

```js
const consoleErrors = [];
page.on("console", message => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
```

### Capture failed requests

```js
const failedRequests = [];
page.on("requestfailed", request => {
  failedRequests.push({
    url: request.url(),
    reason: request.failure()?.errorText ?? "unknown"
  });
});
```

### Keyboard dismissal check

```js
await page.getByRole("button", { name: /open menu/i }).click();
await page.keyboard.press("Escape");
await expect(page.getByRole("navigation")).toBeHidden();
```

### Form status check

```js
await page.getByLabel("Name").fill("Aarav Mehta");
await page.getByLabel("Email").fill("aarav@example.com");
await page.getByRole("button", { name: /send message/i }).click();
await expect(page.getByRole("status")).toBeVisible();
```

### Failure screenshot

```js
await page.screenshot({
  path: "artifacts/mobile-menu-failure.png",
  fullPage: true
});
```

### Read visual viewport

```js
const visualState = () => ({
  width: visualViewport?.width ?? innerWidth,
  height: visualViewport?.height ?? innerHeight,
  offsetTop: visualViewport?.offsetTop ?? 0,
  scale: visualViewport?.scale ?? 1
});
```

### Create a stable case record

```js
function createCase(id, environment, journey, priority = "P1") {
  return { id, environment, journey, priority, status: "not-run", evidence: [] };
}
```

### Record test result

```js
const outcomes = new Map();
function recordOutcome(id, status, note = "") {
  outcomes.set(id, { status, note, checkedAt: new Date().toISOString() });
}
```

### Check document language

```js
const language = await page.locator("html").getAttribute("lang");
expect(language, "document should declare a language").toBeTruthy();
```

### Check image loading

```js
const imageStates = await page.locator("img").evaluateAll(images =>
  images.map(image => ({
    source: image.currentSrc,
    loaded: image.complete && image.naturalWidth > 0
  }))
);
```

### Check page title

```js
await expect(page).toHaveTitle(/studio|agency|portfolio/i);
```

### Inspect heading clipping

```js
const headingState = await page.locator("h1").evaluate(element => ({
  clientHeight: element.clientHeight,
  scrollHeight: element.scrollHeight,
  possibleClip: element.scrollHeight > element.clientHeight
}));
```

### Check reduced-motion preference

```js
await page.emulateMedia({ reducedMotion: "reduce" });
await page.goto("/");
const reduceMotionRequested = await page.evaluate(() =>
  matchMedia("(prefers-reduced-motion: reduce)").matches
);
```

### Set landscape viewport

```js
await page.setViewportSize({ width: 844, height: 390 });
await page.reload();
await expect(page.getByRole("navigation")).toBeVisible();
```

### Check email input type

```js
const emailType = await page.getByLabel("Email").getAttribute("type");
expect(emailType).toBe("email");
```

### Check menu links

```js
const count = await page.getByRole("navigation").getByRole("link").count();
expect(count).toBeGreaterThan(0);
```

### Measure main content bounds

```js
const bounds = await page.locator("main").evaluate(element => {
  const rect = element.getBoundingClientRect();
  return { left: rect.left, width: rect.width, right: rect.right };
});
```

### Collect navigation timing

```js
const navigationTiming = await page.evaluate(() => {
  const entry = performance.getEntriesByType("navigation")[0];
  return entry ? {
    domContentLoaded: Math.round(entry.domContentLoadedEventEnd),
    loadEvent: Math.round(entry.loadEventEnd),
    transferSize: entry.transferSize
  } : null;
});
```

### Collect slow resources

```js
const slowResources = performance.getEntriesByType("resource")
  .sort((a, b) => b.duration - a.duration)
  .slice(0, 10)
  .map(entry => ({ name: entry.name, duration: Math.round(entry.duration) }));
console.table(slowResources);
```

### Build screenshot filename

```js
function screenshotName(pageName, width, height, engine) {
  return `${pageName}-${width}x${height}-${engine}.png`;
}
```

### Make a defect identifier

```js
function defectId(sequence) {
  return `RWD-${String(sequence).padStart(3, "0")}`;
}
```

### Classify severity

```js
function severityFor({ blocksPrimaryAction, dataLoss, cosmeticOnly }) {
  if (dataLoss || blocksPrimaryAction) return "P0";
  if (cosmeticOnly) return "P2";
  return "P1";
}
```

### Test link destination

```js
const destination = await page.getByRole("link", { name: /contact/i })
  .getAttribute("href");
expect(destination).toMatch(/contact/);
```

### Test a visible submit button

```js
const submitCount = await page.getByRole("button", {
  name: /send message/i
}).count();
expect(submitCount).toBe(1);
```

### Capture a fixed viewport screenshot

```js
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: "artifacts/home-390x844.png", fullPage: true });
```

### Observe visual viewport changes

```js
window.visualViewport?.addEventListener("resize", () => {
  console.debug("visual viewport changed", {
    width: window.visualViewport.width,
    height: window.visualViewport.height,
    top: window.visualViewport.offsetTop
  });
});
```

### Check sticky element bounds

```js
const stickyBounds = await page.locator("[data-sticky-cta]").boundingBox();
expect(stickyBounds, "sticky CTA should be rendered").not.toBeNull();
```

### Read overflow candidates

```js
const candidates = await page.evaluate(() =>
  [...document.querySelectorAll("body *")]
    .filter(element => element.scrollWidth > element.clientWidth + 1)
    .slice(0, 12)
    .map(element => ({
      tag: element.tagName,
      className: typeof element.className === "string" ? element.className : "",
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth
    }))
);
```

### Create a manual device note

```js
const note = {
  environment: "iOS Safari / portrait",
  check: "focus final form field",
  result: "unverified",
  reason: "physical device not available"
};
```

### Check page readiness

```js
await page.goto("/");
await page.waitForLoadState("domcontentloaded");
await expect(page.locator("main")).toBeVisible();
```

### Check empty state

```js
await page.goto("/projects?query=unlikely-project-name");
await expect(page.getByText(/no projects found|no results/i)).toBeVisible();
```

### Check fallback class

```js
await page.locator("[data-hero]").evaluate(element => {
  element.classList.add("hero--fallback");
});
await expect(page.locator(".hero__fallback")).toBeVisible();
```

### Report browser capabilities

```js
const featureReport = await page.evaluate(() => {
  const canvas = document.createElement("canvas");
  return {
    webgl: Boolean(canvas.getContext("webgl") || canvas.getContext("webgl2")),
    visualViewport: Boolean(window.visualViewport),
    resizeObserver: "ResizeObserver" in window
  };
});
console.table(featureReport);
```

### Check all navigation items have names

```js
const unnamedLinks = await page.getByRole("navigation").getByRole("link")
  .evaluateAll(links => links.filter(link => !link.innerText.trim() &&
    !link.getAttribute("aria-label")).length);
expect(unnamedLinks).toBe(0);
```

### Test browser zoom reminder record

```js
const zoomCheck = {
  browserZoomLevels: ["100%", "200%", "400%"],
  inspected: ["navigation", "main heading", "form", "sticky CTA"],
  result: "record after manual verification"
};
```

### Make a release coverage summary

```js
function coverageSummary({ automated, manual, physical, unverified }) {
  return { automated, manual, physical, unverified, total:
    automated + manual + physical + unverified };
}
```

### Compare before and after dimensions

```js
function dimensionDelta(before, after) {
  return {
    width: after.width - before.width,
    height: after.height - before.height
  };
}
```

### Validate a result record

```js
function isCompleteResult(result) {
  return Boolean(result.caseId && result.status && result.build && result.evidence);
}
```

### Check CSS media preference

```js
const preferenceSnapshot = await page.evaluate(() => ({
  reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
  darkMode: matchMedia("(prefers-color-scheme: dark)").matches,
  coarsePointer: matchMedia("(pointer: coarse)").matches,
  hoverAvailable: matchMedia("(hover: hover)").matches
}));
```

### Use a concise manual checklist

```js
const manualChecklist = [
  "tap each primary action",
  "rotate device",
  "open virtual keyboard",
  "enable reduced motion",
  "increase text size",
  "check focus and dismissal"
];
```

### Check console and network together

```js
const diagnostics = {
  consoleErrors,
  failedRequests,
  hasFailures: consoleErrors.length > 0 || failedRequests.length > 0
};
console.log(diagnostics);
```

### Document a retest

```js
const retestRecord = {
  defectId: "RWD-104",
  build: "fixed-build",
  originalStepsRepeated: true,
  adjacentViewportChecked: true,
  result: "pass",
  evidence: "attach screenshot and recording"
};
```



## Manual Device Pass by Environment

Use the following as a repeatable checklist after automated tests. Record pass/fail and evidence for every item rather than treating the section heading as a completed test.

### Compact phone

- [ ] Start at the narrowest supported CSS width and inspect the page root for horizontal scrolling.
- [ ] Read the main heading at default and increased text size; verify the last line is not clipped.
- [ ] Open and close the navigation by touch and keyboard; verify focus does not become stranded.
- [ ] Scroll to the bottom and check that sticky controls do not cover the final content or footer.
- [ ] Submit invalid form data and verify the error is visible without requiring a precise scroll gesture.

### Large phone

- [ ] Check that the fluid layout does not become awkwardly stretched between phone and tablet rules.
- [ ] Inspect long project titles, button labels, and translated strings for unexpected wrapping.
- [ ] Open a modal and verify its close control remains visible while the content scrolls.
- [ ] Check whether hover-inspired overlays are available by touch and focus.
- [ ] Compare the screenshot with the compact-phone capture and explain meaningful differences.

### Tablet and hybrid input

- [ ] Check portrait and landscape, including navigation and card grid transitions.
- [ ] Use touch and keyboard separately; a hybrid device should not require only one input mode.
- [ ] Connect a keyboard if possible and inspect focus order through menus, dialogs, and forms.
- [ ] Check whether hover states obscure content after a touch interaction.
- [ ] Verify large viewport spacing does not create excessively long text lines.

### Desktop and keyboard

- [ ] Navigate the critical journey without a mouse and confirm visible focus at every step.
- [ ] Check that sticky headers do not obscure anchor targets or focused controls.
- [ ] Inspect at 200% and 400% zoom where applicable, with no lost content or required two-dimensional scrolling.
- [ ] Test reduced motion and ensure JavaScript animation loops are stopped or replaced.
- [ ] Check browser console and failed requests after the full journey, not only on initial load.

### Low-powered or constrained runtime

- [ ] Throttle CPU and network and observe when primary text and actions become available.
- [ ] Disable optional media or WebGL and verify the fallback communicates the same essential message.
- [ ] Observe long tasks or visible frame drops during the heaviest animation.
- [ ] Check that loading indicators eventually resolve to success, failure, or a retry action.
- [ ] Verify third-party failures do not block navigation or the main contact path.

