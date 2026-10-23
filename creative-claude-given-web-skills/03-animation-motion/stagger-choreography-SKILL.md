# Stagger Choreography — Production Skill

## Why This Matters

Staggered animation makes a group of elements enter, exit, or respond in sequence rather than all at once. Used well, it communicates hierarchy, creates a readable rhythm, and helps users understand how a collection relates. Used carelessly, it makes interfaces feel slow, delays access to important content, creates motion overload, and can leave elements invisible when an animation is interrupted or JavaScript fails.

Production failures often arise from coupling stagger order to unstable DOM order, applying long delays to large collections, animating every card on every render, and forgetting that users may prefer reduced motion. A good choreography has a clear purpose, a bounded duration, predictable interruption behavior, and a useful final state even if motion is skipped.

This skill covers CSS and Framer Motion stagger patterns, timing design, list changes, interaction feedback, accessibility, performance, debugging, and a practical build challenge. Prefer transform and opacity for visual movement, preserve semantic HTML, and measure the result on realistic content and devices.

### 1. Mental Models

1. **Stagger is a relationship, not decoration.** It should explain how elements belong together or establish a reading order.
2. **The parent owns the rhythm.** A parent variant or orchestration rule should define how children are sequenced, rather than every child inventing unrelated delays.
3. **Delay consumes attention.** Every delayed item is unavailable visually for longer, so the total choreography must fit the task.
4. **DOM order remains the semantic order.** Visual timing must not imply a reading order that differs from the DOM or keyboard sequence.
5. **The final state matters more than the entrance.** Users should not have to wait through a long animation to use a menu, dialog, or result list.
6. **Interruptions are normal.** Rapid filter changes, route navigation, and repeated clicks should settle into the latest intended state.
7. **Motion should degrade gracefully.** Reduced-motion settings should preserve the content and state while removing unnecessary travel or sequencing.
8. **Large collections need a budget.** A 6-item menu and a 200-item table should not receive the same stagger strategy.
9. **Stable identity prevents visual glitches.** React keys should identify items, not their current array index when items can reorder.
10. **A choreography is a system.** Timing, easing, semantics, focus, reduced motion, and performance must agree.

### 2. Design the Rhythm Before Coding

Choose what the stagger communicates: reading order, grouping, hierarchy, or response to a user action. Set a maximum total duration, then choose a per-item delay and a limit on how many elements animate. For example, an interval of 40 milliseconds across six items adds only 200 milliseconds between the first and last start; an interval of 100 milliseconds across twenty items adds 1.9 seconds before the last begins.

Use shorter intervals for dense interfaces and avoid animating every item in long result lists. A menu can use a compact stagger because the user expects a small set of choices. A data table should usually prioritize immediate access to content over decorative sequencing.

```js
function estimateStagger(count, intervalMs, durationMs) {
  const safeCount = Math.max(0, count);
  if (safeCount === 0) return 0;
  return (safeCount - 1) * intervalMs + durationMs;
}

console.table([
  { count: 6, intervalMs: 40, durationMs: 180,
    totalMs: estimateStagger(6, 40, 180) },
  { count: 20, intervalMs: 100, durationMs: 180,
    totalMs: estimateStagger(20, 100, 180) }
]);
```

**Gotcha:** Stagger intervals accumulate. A small per-item delay can become a long wait when applied to a large collection.

### 3. CSS Stagger with Custom Properties

CSS can stagger a small, known set of items with a custom property. Keep the base state visible by default when possible, and apply entrance animation only when a deliberate class is present. Avoid leaving content at `opacity: 0` if a script fails before adding the final class.

```html
<section class="feature-list" aria-labelledby="features-title">
  <h2 id="features-title">Features</h2>
  <ul class="feature-list__items">
    <li class="feature-card" style="--item-index: 0">Fast setup</li>
    <li class="feature-card" style="--item-index: 1">Accessible controls</li>
    <li class="feature-card" style="--item-index: 2">Reliable cleanup</li>
  </ul>
</section>
```

```css
.feature-list__items {
  display: grid;
  gap: 1rem;
  padding: 0;
  list-style: none;
}

.feature-card {
  opacity: 1;
  transform: none;
}

.feature-list.is-entering .feature-card {
  animation: feature-enter 180ms ease-out both;
  animation-delay: calc(var(--item-index, 0) * 40ms);
}

@keyframes feature-enter {
  from {
    opacity: 0;
    transform: translateY(0.5rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .feature-list.is-entering .feature-card {
    animation: none;
  }
}
```

This approach is useful for a short, predictable set. If items are generated dynamically, assign indices carefully and avoid reusing stale inline values after reordering. For a long list, prefer no stagger or animate only the first visible subset.

### 4. Framer Motion Parent Variants

Framer Motion can orchestrate child animations with variants and `staggerChildren`. Keep parent and child states explicit. Current Framer Motion releases may also be branded as Motion for React, with package import conventions depending on the project. Use the API corresponding to the installed package and version.

```jsx
import { motion } from "framer-motion";

const listVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.02
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, ease: "easeOut" }
  }
};

export function FeatureList({ items }) {
  return (
    <motion.section
      aria-labelledby="features-heading"
      initial="hidden"
      animate="visible"
      variants={listVariants}
    >
      <h2 id="features-heading">Features</h2>
      <motion.ul>
        {items.map(item => (
          <motion.li key={item.id} variants={itemVariants}>
            {item.label}
          </motion.li>
        ))}
      </motion.ul>
    </motion.section>
  );
}
```

The parent transition controls the order while each child describes its own visual change. Use stable `key` values derived from item identity. Do not use array indices when items can be filtered, inserted, or reordered, because React may reuse an animated element for a different item.

### 5. Reusable Stagger Variants

Keep reusable variants close to the component or motion system that owns them. A small set of shared timing tokens helps the product feel coherent. Do not create dozens of slightly different stagger values without a reason.

```js
export const motionTiming = {
  fast: 0.12,
  standard: 0.18,
  deliberate: 0.28,
  staggerTight: 0.025,
  staggerDefault: 0.045,
  staggerRelaxed: 0.07
};

export const listVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: motionTiming.staggerDefault,
      delayChildren: 0.01
    }
  }
};
```

Document units: CSS animation delays are commonly written in milliseconds, while Framer Motion transition durations and stagger values are typically expressed in seconds. Converting values mentally is a frequent source of timing errors. Name tokens with units or keep the library's expected unit in the token name.

### 6. Reverse Stagger and Exit Sequencing

Some interfaces benefit from reverse order when closing, but the exit sequence must not delay an essential action. Reverse staggering can create a sense of collapse toward the trigger, but it should remain short and consistent with the opening sequence.

```jsx
import { motion } from "framer-motion";

const stackVariants = {
  open: {
    transition: {
      staggerChildren: 0.04,
      staggerDirection: 1
    }
  },
  closed: {
    transition: {
      staggerChildren: 0.025,
      staggerDirection: -1
    }
  }
};
```

A parent variant only orchestrates children that participate in the variant system. Ensure child variants define matching states and test rapid open-close-open sequences. If the user closes a menu, do not block focus return to its trigger until every decorative exit finishes.

**Gotcha:** Exit animations require an appropriate presence-management pattern. If the child is removed from the React tree immediately, its exit state may never render.

### 7. Stagger Dynamic Lists Safely

Filtered search results and live data can change while a stagger is in progress. Decide whether new items should enter, existing items should stay still, and removed items should exit. Avoid replaying the entire list animation on every data refresh.

```jsx
import { AnimatePresence, motion } from "framer-motion";

export function ResultList({ results }) {
  return (
    <motion.section aria-labelledby="results-heading">
      <h2 id="results-heading">Results</h2>
      <motion.ul>
        <AnimatePresence initial={false}>
          {results.map(result => (
            <motion.li
              key={result.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.14, ease: "easeOut" }}
            >
              {result.label}
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </motion.section>
  );
}
```

This example uses short per-item transitions rather than a full parent stagger because live result updates should remain responsive. Add parent choreography only if it improves comprehension. Check focus if a result containing the active element is removed, and provide a clear empty state when no results match.

### 8. Stagger in Menus and Popovers

Menus contain actionable controls, so motion should never undermine their availability. Use a short entrance and ensure the menu's semantic and focus state changes immediately. The animation is secondary to the interaction.

```jsx
import { motion } from "framer-motion";

const menuVariants = {
  closed: {},
  open: {
    transition: { staggerChildren: 0.03 }
  }
};

const menuItemVariants = {
  closed: { opacity: 0, y: 4 },
  open: { opacity: 1, y: 0 }
};

export function ActionMenu({ open, actions }) {
  return (
    <motion.nav
      aria-label="Actions"
      aria-hidden={!open}
      initial={false}
      animate={open ? "open" : "closed"}
      variants={menuVariants}
    >
      <ul>
        {actions.map(action => (
          <motion.li key={action.id} variants={menuItemVariants}>
            <a href={action.href}>{action.label}</a>
          </motion.li>
        ))}
      </ul>
    </motion.nav>
  );
}
```

Do not rely on `aria-hidden` alone to prevent focus from reaching hidden links. In a production component, conditionally render the menu or manage `inert`, focus, and presence behavior so hidden controls are not keyboard reachable. The trigger should expose `aria-expanded` and an appropriate `aria-controls` relationship.

### 9. Reduced Motion and Immediate Final States

Respect `prefers-reduced-motion` in both CSS and JavaScript animation systems. For Framer Motion, use the installed version's supported reduced-motion mechanism or `useReducedMotion`. A reduced-motion mode can remove stagger delays, avoid travel, or jump to the final state without hiding content.

```jsx
import { motion, useReducedMotion } from "framer-motion";

export function StaggeredItems({ items }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.ul
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: reduceMotion ? 0 : 0.04
          }
        }
      }}
    >
      {items.map(item => (
        <motion.li
          key={item.id}
          variants={{
            hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 },
            visible: { opacity: 1, y: 0 }
          }}
        >
          {item.label}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

Test the actual preference in browser DevTools and on an operating system configured for reduced motion. Avoid creating a situation where the reduced-motion state and the animated state disagree about whether content is visible. Accessibility also includes `:focus-visible`, semantic HTML, understandable focus order, and avoiding excessive screen-reader announcements.

**Gotcha:** Removing only the transition duration while leaving the hidden initial state can create a flash or leave content invisible if the final state is not applied. Test the final rendered state, not just the timing value.

### 10. Keep Stagger Performant

Staggering does not automatically make animation cheap. A large list can still cause many simultaneous style updates, and animated shadows, filters, or layout properties can trigger expensive paint or reflow. Prefer transform and opacity, avoid changing `top`, `left`, `width`, or `height` on every frame, and measure with DevTools Performance.

```css
.result-card {
  transform: translateY(0);
  opacity: 1;
}

.result-card.is-entering {
  animation: result-enter 160ms ease-out both;
}

@keyframes result-enter {
  from { opacity: 0; transform: translateY(0.375rem); }
  to { opacity: 1; transform: translateY(0); }
}
```

Use `will-change` only after profiling shows a benefit, and remove it after the animation when possible. Too many promoted layers can increase memory usage, particularly on mobile devices. A good performance budget considers animation count, stagger delay, total duration, content size, and the device class.

### 11. Stagger Grids and Responsive Layouts

A grid's visual order may differ from the DOM order at different viewport widths. Keep the semantic and keyboard order stable, and use stagger indices that remain meaningful when the layout changes. Avoid assigning timing based on visual row and column unless the layout and order are well-defined.

```jsx
export function CardGrid({ cards }) {
  return (
    <section aria-labelledby="card-grid-heading">
      <h2 id="card-grid-heading">Explore</h2>
      <ul className="card-grid">
        {cards.map((card, index) => (
          <li
            className="card-grid__item"
            key={card.id}
            style={{ "--item-index": index }}
          >
            <a href={card.href}>{card.title}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
  gap: 1rem;
  padding: 0;
  list-style: none;
}

.card-grid__item {
  animation: none;
}

@media (prefers-reduced-motion: no-preference) {
  .card-grid.is-entering .card-grid__item {
    animation: result-enter 160ms ease-out both;
    animation-delay: calc(var(--item-index, 0) * 30ms);
  }
}
```

For large grids, cap the stagger index or animate only a first batch. Recalculate when data changes, but do not force a full replay because a responsive breakpoint changed. Check browser support for CSS features such as `min()` and `auto-fit` if older browsers are in scope.

### 12. Avoid Replaying Animation on Every Render

Animation should be tied to meaningful state transitions, not incidental renders. A parent can rerender because a counter changes, data refreshes, or a context value updates. Avoid changing keys or variant targets unnecessarily.

```jsx
import { motion } from "framer-motion";

export function EntryPanel({ isOpen, children }) {
  return (
    <motion.section
      aria-label="Details"
      initial={false}
      animate={isOpen ? "open" : "closed"}
      variants={{
        open: { opacity: 1, y: 0 },
        closed: { opacity: 0, y: 8 }
      }}
      transition={{ duration: 0.16, ease: "easeOut" }}
    >
      {children}
    </motion.section>
  );
}
```

For a real collapsible panel, also control whether hidden content remains focusable and whether the panel is in the accessibility tree. An opacity of zero is not the same as a hidden or inert state. Use appropriate semantics, `aria-expanded`, and presence management rather than relying on visual appearance alone.

### 13. CSS Animation Delay and Fill Modes

CSS `animation-delay` postpones the start but does not automatically guarantee that the element is visible before the animation starts. `animation-fill-mode: both` applies the first keyframe during the delay and the final keyframe afterward. This can be useful for a coordinated entrance, but it can also leave content hidden if the animation is never activated or canceled.

```css
.stagger-item {
  opacity: 1;
  transform: none;
}

.stagger-list.is-entering .stagger-item {
  animation: item-in 180ms ease-out both;
  animation-delay: calc(var(--item-index, 0) * 35ms);
}

@keyframes item-in {
  from { opacity: 0; transform: translateY(0.5rem); }
  to { opacity: 1; transform: translateY(0); }
}
```

Keep the non-animated base state usable. If the class is removed while the animation is running, verify that the computed state returns to the intended default. Use DevTools' Animations panel and Computed panel to inspect timing, fill mode, transforms, and opacity.

### 14. Stagger with Data and State Changes

When items arrive from a network request, decide whether to animate the entire result set or only newly added entries. For a loading list, a single loading indicator may communicate progress more clearly than staggering skeletons and then staggering real content again. Keep state transitions explicit and avoid animating stale results after a query has changed.

```js
function getNewIds(previousItems, nextItems) {
  const previousIds = new Set(previousItems.map(item => item.id));
  return nextItems
    .filter(item => !previousIds.has(item.id))
    .map(item => item.id);
}

console.table(
  getNewIds(
    [{ id: "a" }, { id: "b" }],
    [{ id: "b" }, { id: "c" }]
  ).map(id => ({ newItemId: id }))
);
```

If network responses can arrive out of order, cancel stale requests or compare request identities before updating state. Otherwise an older result can replace newer content and restart the choreography unexpectedly. Use a loading and empty state that remains understandable with animation disabled.

### 15. Accessibility and Interaction Safety

Staggered motion must not change the expected keyboard sequence. Preserve semantic HTML, meaningful accessible names, and visible `:focus-visible` outlines. Do not move focus automatically through a list just because items animate in sequence. Avoid announcing every animated child as a live update unless the content genuinely represents a user-relevant status change.

For menus and dialogs, update the semantic open state immediately, manage focus according to the interaction pattern, and ensure that exiting content does not retain focus after it becomes visually hidden. `prefers-reduced-motion` should reduce movement and sequencing while preserving the final content and interaction state.

```css
.stagger-item:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .stagger-list *,
  .stagger-grid * {
    animation-duration: 0.01ms !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

The CSS rule is a broad safety net, not a substitute for testing JavaScript-driven animation. If a component's initial variant explicitly sets opacity to zero, ensure its reduced-motion state still sets opacity to one. Accessibility testing should include keyboard-only navigation, screen-reader review where relevant, reduced-motion mode, and a pass with animations disabled.

### 16. Debugging Stagger Timing

When a sequence looks wrong, inspect the parent state, child variants, delays, and the order in which children are rendered. In DevTools, verify the computed `animation-delay`, duration, easing, transform, and opacity. For Framer Motion, check whether the children use the expected variants and whether a changing key is remounting them.

```js
function inspectStagger(items, intervalSeconds) {
  const report = items.map((item, index) => ({
    id: item.id,
    index,
    delaySeconds: index * intervalSeconds,
    delayMilliseconds: index * intervalSeconds * 1000
  }));

  console.table(report);
  return report;
}

inspectStagger(
  [{ id: "alpha" }, { id: "beta" }, { id: "gamma" }],
  0.04
);
```

Debug sequence:
1. Confirm the list order and stable React keys.
2. Inspect the parent's active variant or the CSS class that activates the animation.
3. Check computed delay, duration, easing, opacity, and transform.
4. Toggle `prefers-reduced-motion` and confirm all items remain visible.
5. Rapidly open and close the component to reveal interruption problems.
6. Filter or reorder data while the sequence is running.
7. Profile the list in DevTools Performance and look for layout, paint, and long tasks.
8. Check Safari, Firefox, and Chromium-based browsers if CSS animation features differ.

### 17. Motion Tokens and Easing

Define a small set of motion tokens that match the product's interaction hierarchy. Entrance effects should usually settle quickly. Longer timing can work for large, intentional spatial changes, but it should not delay access to controls. Use named easing curves or a documented easing function rather than unexplained numeric values.

```js
export const motionTokens = {
  duration: {
    fast: 0.12,
    standard: 0.18,
    emphasis: 0.26
  },
  stagger: {
    compact: 0.025,
    default: 0.04,
    relaxed: 0.06
  },
  ease: {
    enter: "easeOut",
    exit: "easeInOut"
  }
};
```

Keep the unit clear: Framer Motion uses seconds for durations and stagger delays, while CSS uses time units such as `ms` or `s`. Test the total sequence duration as a whole, not only the per-item transition. Avoid using a long delay to create importance; visual hierarchy, typography, and spacing should carry the primary meaning.

### 18. Browser Compatibility and Progressive Enhancement

CSS animations and modern selectors have varying levels of browser support. Check caniuse and current browser support for the features used by the project, and use `@supports` for optional CSS enhancements. Test Safari, Firefox, and Chromium-based browsers, including keyboard focus rings and responsive grids.

```css
@supports (animation-delay: 20ms) {
  .stagger-list.is-entering .stagger-item {
    animation-delay: calc(var(--item-index, 0) * 35ms);
  }
}
```

The example feature query is intentionally simple; it is not a complete test for all animation behavior. Keep a readable static state if an enhancement fails. JavaScript animation libraries also require version and framework compatibility checks; a CSS `@supports` query cannot validate a JavaScript API.

### 19. Performance Budget for Large Collections

For long lists, avoid a full stagger across every row. Consider animating only the first visible batch, using a single parent transition, or skipping entrance animation on subsequent pagination. Profile actual devices and watch for jank caused by too many simultaneous elements, expensive shadows, filters, and layout-triggering properties.

```js
function getStaggerDelay(index, intervalMs, maxIndex = 6) {
  const boundedIndex = Math.min(Math.max(index, 0), maxIndex);
  return boundedIndex * intervalMs;
}

console.table(
  Array.from({ length: 12 }, (_, index) => ({
    index,
    delayMs: getStaggerDelay(index, 32)
  }))
);
```

The cap prevents later items from waiting longer and longer. It does not mean every item needs an animation; consider removing motion entirely for very large collections. Avoid using `will-change` on every child. Excessive compositor layers can increase memory usage, while animating `width`, `height`, `top`, or `left` can trigger reflow and repaint. Prefer transform and opacity, then validate with a performance trace.

### 20. Build a Choreographed Collection

Build a responsive feature collection that uses a small, purposeful stagger, remains fully usable with motion disabled, and supports data changes without replaying every element.

1. Use a semantic `<section>`, heading, and `<ul>`/`<li>` structure.
2. Give every item a stable ID and use that ID as the React key.
3. Define a parent variant that controls stagger order and a child variant that controls the entrance.
4. Use named timing tokens with explicit units and a documented easing curve.
5. Keep the initial state readable if the animation library fails to initialize.
6. Respect `prefers-reduced-motion` in both CSS and JavaScript animation code.
7. Ensure reduced-motion mode shows the final visible state with no unnecessary travel.
8. Keep links and buttons keyboard accessible with visible `:focus-visible` styles.
9. Test filtering while the stagger is running and verify that stale items do not return.
10. Test rapid open-close-open interaction and confirm the latest state wins.
11. Limit the stagger for large result sets and document the chosen cap.
12. Avoid animating layout-triggering properties such as `top`, `left`, `width`, or `height` every frame.
13. Use DevTools Performance to check for jank, long tasks, and unnecessary paint.
14. Verify behavior in Safari, Firefox, and Chromium-based browsers.
15. Add a failure test that removes the active item while it contains keyboard focus.
16. Add a failure test that enables reduced motion while the list is already animating.
17. Verify that the final state is correct when animations are disabled in tests.
18. Confirm that screen readers are not flooded with redundant live announcements.
19. Confirm that the total entrance duration remains appropriate for the number of items.
20. Document when the collection should skip animation entirely.

## Definition of Done

- [ ] Stagger has a clear communication purpose.
- [ ] Semantic DOM order and keyboard order remain aligned.
- [ ] React children use stable identity keys.
- [ ] The total sequence duration is bounded and documented.
- [ ] CSS and JavaScript animations respect reduced-motion preferences.
- [ ] The final visible state remains correct when animation is skipped.
- [ ] Dynamic filtering and reordering do not replay or misassign animations.
- [ ] Focus does not remain inside removed or hidden content.
- [ ] Performance has been checked with realistic collection sizes.
- [ ] The interface has been tested with keyboard-only navigation.
- [ ] Safari, Firefox, and Chromium-based behavior has been reviewed.
- [ ] Failure tests cover rapid toggles, data changes, and preference changes.

## Named Patterns

### Pattern: Parent-Owned Stagger

**What it does:** Centralizes sequence timing on the parent variant.

**When to use it:** A small group of related elements enters as one meaningful unit.

```jsx
const parent = {
  visible: { transition: { staggerChildren: 0.04 } }
};
```

### Pattern: CSS Index Delay

**What it does:** Computes a child's delay from a CSS custom property.

**When to use it:** A short static or server-rendered list with predictable order.

```css
.item {
  animation-delay: calc(var(--item-index, 0) * 35ms);
}
```

### Pattern: Capped Stagger

**What it does:** Limits how long later items wait.

**When to use it:** Responsive grids or lists with variable item counts.

```js
const delay = Math.min(index, 6) * 0.035;
```

### Pattern: Reduced-Motion Final State

**What it does:** Shows content without travel or sequencing.

**When to use it:** Interfaces with motion-sensitive users or test modes.

```css
@media (prefers-reduced-motion: reduce) {
  .stagger-item {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

### Pattern: New-Item-Only Motion

**What it does:** Animates newly added entries without replaying the entire list.

**When to use it:** Live search results, feeds, or data updates.

```js
const previousIds = new Set(previousItems.map(item => item.id));
const added = nextItems.filter(item => !previousIds.has(item.id));
```

### Pattern: Reverse Exit

**What it does:** Collapses the sequence in reverse order.

**When to use it:** A small popover or menu closing toward its trigger.

```js
const closing = {
  transition: { staggerChildren: 0.025, staggerDirection: -1 }
};
```

### Pattern: Immediate Semantic State

**What it does:** Updates the accessible open/closed state independently of visual timing.

**When to use it:** Menus, dialogs, and expandable controls.

```jsx
<button aria-expanded={open} aria-controls="actions-menu">
  Actions
</button>
```

### Pattern: Progressively Enhanced CSS

**What it does:** Keeps the static list visible unless the animation class is deliberately applied.

**When to use it:** Content pages where JavaScript failure must not hide information.

```css
.item { opacity: 1; transform: none; }
.is-entering .item { animation: item-in 180ms ease-out both; }
```

### Pattern: Stable-Key Reordering

**What it does:** Preserves the relationship between data identity and the animated element.

**When to use it:** Sortable or filterable React collections.

```jsx
{items.map(item => <motion.li key={item.id}>{item.label}</motion.li>)}
```

### Pattern: First-Batch Entrance

**What it does:** Restricts decorative entrance motion to a bounded initial subset.

**When to use it:** Large result sets and paginated collections.

```js
const shouldAnimate = index < 8;
```

## Common Mistakes and Fixes

| Mistake | Why it fails | Fix |
|---|---|---|
| Staggering every row in a huge table | Delays access and adds visual noise | Animate only a small first batch or skip motion |
| Using array indices as React keys | Reordered data inherits the wrong animation state | Use stable IDs from the data model |
| Making all content initially transparent | JavaScript failure can leave the page blank | Keep a visible base state and activate animation deliberately |
| Using a long delay for every child | Total sequence becomes unexpectedly slow | Calculate total duration and cap the stagger |
| Replaying on every rerender | Incidental updates restart the entrance | Tie motion to meaningful state transitions |
| Removing children before exit completes | Exit animation never appears | Use presence management or an intentional immediate removal |
| Leaving focus inside exiting content | Keyboard focus can be lost or hidden | Move focus according to the interaction pattern |
| Hiding controls only with opacity | Invisible links may remain keyboard reachable | Use conditional rendering, `inert`, or correct presence handling |
| Ignoring reduced motion | Sequence may be uncomfortable or disorienting | Remove travel and delay while preserving content |
| Reducing duration but keeping hidden initial state | Items may flash or remain invisible | Ensure reduced-motion mode sets the final visible state |
| Using CSS milliseconds as library seconds | Animation timing becomes incorrect | Name tokens with units and convert explicitly |
| Animating width and height every frame | Can cause layout and paint work | Prefer transform and opacity |
| Applying `will-change` to every item | Excessive layers use memory | Add it only after profiling and remove it afterward |
| Ignoring focus outlines | Keyboard focus becomes difficult to track | Keep a visible `:focus-visible` treatment |
| Announcing every child as a live update | Screen readers receive excessive announcements | Use live regions only for meaningful status changes |
| Ignoring rapid toggle behavior | Stale animation state can win | Test interruption and ensure the latest state wins |
| Replaying the whole list on new data | Users lose visual continuity | Animate only newly added items where appropriate |
| Staggering a large responsive grid by visual row | DOM and visual order can diverge | Preserve semantic order and keep delay logic simple |
| Relying on `aria-hidden` alone | Hidden descendants may still receive focus | Manage focusability or unmount the hidden content |
| Using unrelated easing values per item | The group lacks a coherent rhythm | Define shared easing and timing tokens |
| Failing to inspect computed delay | CSS overrides can make the rhythm inconsistent | Use DevTools Computed and Animations panels |
| Testing only the first render | Dynamic updates may expose key and exit bugs | Test filter, reorder, and remove scenarios |
| Ignoring browser differences | Focus rings and animation behavior can vary | Test Safari, Firefox, and Chromium |
| Making motion necessary to understand hierarchy | Reduced-motion users lose context | Ensure typography and layout communicate hierarchy |
| Forgetting a no-animation test path | CI snapshots may be flaky or incomplete | Assert final state with animations disabled |

## Quick Reference

| Need | Starting point | Notes |
|---|---|---|
| Parent orchestration | `staggerChildren` | Centralize timing on the parent |
| Initial child state | `hidden` variant | Ensure reduced motion still reaches visible state |
| Stable identity | `key={item.id}` | Avoid index keys for reorderable data |
| CSS delay | `animation-delay` | Keep a visible base state |
| CSS index | `--item-index` | Recompute after data changes |
| Reverse sequence | `staggerDirection: -1` | Keep exits short |
| Presence handling | `AnimatePresence` | Needed for managed exit animations |
| Reduced motion | `useReducedMotion` | Verify API for installed version |
| CSS preference | `prefers-reduced-motion` | Include a static final state |
| Keyboard focus | `:focus-visible` | Do not hide outlines without replacement |
| Large lists | Capped or first-batch stagger | Avoid long accumulated delays |
| Timing units | Seconds vs milliseconds | Document units in token names |
| Performance | DevTools Performance | Watch paint, reflow, and long tasks |
| Browser checks | Safari, Firefox, Chromium | Test responsive and keyboard behavior |
| Debug timing | `console.table` | Report index and computed delay |
| Layout-safe motion | Transform and opacity | Avoid per-frame layout changes |
| Hidden menu content | `inert` or conditional render | Opacity alone does not remove focusability |
| Easing | Named easing token | Avoid unexplained numeric curves |

## Additional Gotchas

**Gotcha:** If a staggered list contains buttons and the list is removed during an exit animation, move focus to a sensible surviving control before the focused element disappears.

**Gotcha:** A delay is not the same as duration. When reviewing the feel of the sequence, calculate the start delay of the final child plus its own animation duration.

**Gotcha:** CSS `animation-fill-mode: both` can preserve the first keyframe during the delay. If that frame is transparent, ensure the animation class cannot be applied to essential content before the enhancement is ready.

**Gotcha:** A reduced-motion CSS rule does not automatically override a JavaScript library's inline animation values. Test both systems independently and ensure they agree on the final visible state.



## Advanced Orchestration: Nested Groups

Nested choreography can help when a page contains meaningful groups, such as a heading followed by a set of cards. It can also create a compounded delay that is much longer than either individual stagger suggests. If a parent delays a group and the group then delays every child, calculate the worst-case start time for the final child before using the pattern.

```jsx
import { motion } from "framer-motion";

const groupVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.02
    }
  }
};

const childVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.16, ease: "easeOut" }
  }
};

export function GroupedFeatures({ groups }) {
  return (
    <section aria-labelledby="grouped-features-title">
      <h2 id="grouped-features-title">Feature groups</h2>
      {groups.map(group => (
        <motion.article
          key={group.id}
          variants={groupVariants}
          initial="hidden"
          animate="visible"
        >
          <h3>{group.title}</h3>
          <motion.ul variants={groupVariants}>
            {group.items.map(item => (
              <motion.li key={item.id} variants={childVariants}>
                {item.label}
              </motion.li>
            ))}
          </motion.ul>
        </motion.article>
      ))}
    </section>
  );
}
```

This code demonstrates the shape of nested variants; validate propagation and parent/child orchestration against the installed Framer Motion version. If both levels apply a stagger, the sequence may feel slower than expected. A simpler alternative is to stagger groups and let the children appear together, or stagger children inside one group without delaying the groups themselves.

**Gotcha:** Nested `staggerChildren` values add to the effective wait. Measure the final child's start time instead of judging only the individual delay values.

## Animation Ownership and CSS/JavaScript Boundaries

Do not let CSS and a JavaScript motion library compete for the same `transform` or `opacity` property on one element. If CSS runs a keyframe animation while Framer Motion writes inline transforms, the visible result can depend on timing and property composition. Assign one animation owner per property, or place effects on separate nested elements with clear responsibilities.

```jsx
export function LayeredCard({ children }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      <div className="card__decorative-layer" aria-hidden="true" />
      <div className="card__content">{children}</div>
    </motion.article>
  );
}
```

In this example, Motion owns the outer article's entrance. If the decorative layer needs a CSS animation, animate that inner layer rather than assigning a second transform animation to the article. This division makes computed styles easier to understand in DevTools and reduces accidental overrides.

**Gotcha:** A transform written by a motion library may be serialized differently from a hand-authored CSS transform. Avoid assuming two independent systems will merge transform functions in the order you intended.

## Stagger with Loading, Empty, and Error States

Loading states should explain the current data state without making users watch decorative motion. Prefer a concise progress indicator or a small set of skeleton placeholders over a large staggered skeleton wall. When data resolves, animate the result only if it helps orient the user; keep empty and error states immediately visible.

```jsx
export function SearchResults({ status, results, error }) {
  if (status === "loading") {
    return <p role="status">Loading results…</p>;
  }

  if (status === "error") {
    return <p role="alert">{error || "Results could not be loaded."}</p>;
  }

  if (results.length === 0) {
    return <p>No matching results. Try changing your search.</p>;
  }

  return (
    <section aria-labelledby="search-results-heading">
      <h2 id="search-results-heading">Search results</h2>
      <ul>
        {results.map(result => (
          <li key={result.id}>{result.label}</li>
        ))}
      </ul>
    </section>
  );
}
```

The example intentionally keeps status states static. If you add motion later, preserve the live status semantics only where needed and avoid announcing every result as it animates. The error message should explain the problem in plain language and offer a useful next action when possible.

## Interrupted Animations and State Convergence

Animation libraries often handle interpolation when a target changes, but your application still needs a clear state model. Treat the latest application state as authoritative. A rapid sequence such as open → close → open should settle on open, not on a stale completion callback from the first transition. Avoid using completion callbacks to make essential state changes when the state can be represented directly.

```jsx
import { useState } from "react";
import { motion } from "framer-motion";

export function ExpandableDetails() {
  const [open, setOpen] = useState(false);

  return (
    <section>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="details-panel"
        onClick={() => setOpen(current => !current)}
      >
        {open ? "Hide details" : "Show details"}
      </button>
      {open && (
        <motion.div
          id="details-panel"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.14, ease: "easeOut" }}
        >
          <p>Details are available immediately after the control is activated.</p>
        </motion.div>
      )}
    </section>
  );
}
```

For production, consider how focus should behave when the panel closes, whether unmounting is appropriate, and whether exit animation is necessary. If an exit transition is used, presence management must keep the element mounted for the exit and the focus policy must not leave the user inside hidden content. Test repeated clicks with reduced motion enabled as well as with normal timing.

## Build-Time and Runtime Validation

Animation code should be reviewed both statically and at runtime. Static review catches unstable keys, conflicting ownership, unexplained timing values, and missing reduced-motion paths. Runtime review catches dropped frames, unexpected computed styles, and state changes that arrive while a sequence is running.

A useful validation pass includes:
- Search for `opacity: 0` and verify each path reaches a visible state.
- Search for index-based React keys and confirm the collection cannot reorder, or replace them with stable IDs.
- Search for `will-change` and confirm each use has a measured reason.
- Search for `top`, `left`, `width`, and `height` in animation targets and replace them with transform-based motion where appropriate.
- Toggle reduced motion in DevTools and verify that every element remains visible and usable.
- Inspect keyboard focus while a menu opens, closes, and removes children.
- Use the Performance panel to compare a small list with the largest realistic list.
- Check current browser support and caniuse for CSS features that are part of the experience.

```js
function summarizeMotionAudit({ count, intervalSeconds, durationSeconds }) {
  const totalSeconds = count > 0
    ? (count - 1) * intervalSeconds + durationSeconds
    : 0;

  const result = {
    count,
    intervalSeconds,
    durationSeconds,
    estimatedTotalSeconds: Number(totalSeconds.toFixed(3)),
    exceedsHalfSecond: totalSeconds > 0.5
  };

  console.table(result);
  return result;
}

summarizeMotionAudit({
  count: 8,
  intervalSeconds: 0.035,
  durationSeconds: 0.16
});
```

The half-second threshold is a review prompt, not a universal rule. A sequence that exceeds it may still be appropriate for a deliberate, non-blocking decorative reveal, while a shorter sequence may still feel wrong if it delays an essential control. Judge the full interaction and its task context.


## Final Principle

A good stagger communicates hierarchy without holding the interface hostage. Keep the sequence short, preserve semantic and keyboard order, animate only what benefits from motion, and make the correct final state available even when every animation is skipped.
