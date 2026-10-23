# Framer Motion Patterns — Production Skill

## Why This Matters

Motion is part of interface behavior, not decoration added after the layout is finished. In production, animation bugs often appear as content that jumps during hydration, a menu that remains mounted after closing, a list that loses its identity when items reorder, or an interaction that works with a mouse but is inaccessible to keyboard and assistive-technology users. Poorly chosen layout animations can cause visual instability; unbounded spring motion can feel noisy; and animations that ignore reduced-motion preferences can make an interface uncomfortable.

Framer Motion—now commonly documented as Motion for React—provides declarative APIs for animating React components, gestures, layout changes, and presence. This skill focuses on reusable patterns and reliable implementation: stable keys, lifecycle-aware exits, layout measurement, variants, gestures, accessibility, reduced motion, and debugging. Match the API to the version installed in your project; current documentation may use the package name `motion/react`, while many existing projects use `framer-motion`.

### 1. Identify the Package and API Version

Before implementing examples, inspect the project's dependencies and existing imports. Do not mix APIs from different versions without confirming the migration path. Existing projects may import from `framer-motion`; newer Motion for React projects may import from `motion/react`.

```jsx
// Existing Framer Motion projects:
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

// Current Motion for React projects may use:
// import { motion, AnimatePresence, useReducedMotion } from "motion/react";
```

Choose one package path for the codebase and use it consistently. Check the installed package version, peer dependencies, and framework version before copying an example. In a server-rendered React framework, ensure client-only hooks and interactive components are placed in the appropriate client boundary.

**Gotcha:** Importing `motion` from a package that is not installed is a build-time failure, not an animation bug. Verify the lockfile and package manager before debugging runtime behavior.

### 2. Mental Models

1. **Animation values are state over time.** A target such as `opacity: 1` is a destination; the animation engine determines how the rendered value approaches it.
2. **React identity controls continuity.** Stable keys let React and Motion associate a visual element with the same logical item across renders.
3. **Presence is a lifecycle boundary.** A component cannot animate out after React has removed it unless a presence manager retains it long enough to finish the exit.
4. **Layout animation measures before and after.** Motion can interpolate the difference between layout positions, but unstable layout and changing keys make those measurements unreliable.
5. **Variants describe coordinated states.** A named state can be shared across a parent and its descendants, reducing duplicated animation configuration.
6. **Gestures are interactions, not just visual effects.** Hover, tap, drag, and focus behavior need clear semantics and accessible equivalents.
7. **Reduced motion changes the motion strategy.** It should reduce unnecessary travel and scale while preserving feedback and task completion.
8. **One element should have one clear transform owner.** Competing CSS transforms, Motion transforms, and imperative GSAP transforms can overwrite or compound each other unpredictably.

### 3. Animate Semantic Elements

Use `motion` versions of meaningful HTML elements rather than making the whole page a collection of generic animated containers. Semantic markup helps assistive technology and keeps document structure understandable.

```jsx
import { motion } from "framer-motion";

export function Notice() {
  return (
    <section aria-labelledby="notice-title">
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
      >
        <h2 id="notice-title">Project saved</h2>
        <p>Your changes are available.</p>
      </motion.article>
    </section>
  );
}
```

Use a `motion.button` for a button, `motion.li` for a list item, and `motion.nav` for navigation. Do not animate a semantic element into a different semantic role. A clickable `<div>` with an animation is still not a native button.

### 4. Understand `initial`, `animate`, and `exit`

`initial` describes the starting visual state, `animate` describes the active target, and `exit` describes the target while an element is leaving through `AnimatePresence`.

```jsx
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

export function ExpandableNotice() {
  const [open, setOpen] = useState(false);

  return (
    <section>
      <button type="button" aria-expanded={open} onClick={() => setOpen(value => !value)}>
        {open ? "Hide details" : "Show details"}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="notice-details"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <p>Additional information appears here.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
```

Height animation can affect layout and requires careful overflow handling. For content where layout movement is undesirable, use a simpler opacity transition or a different disclosure pattern. The trigger must expose `aria-expanded`, and the content should not remain keyboard reachable while visually hidden.

**Gotcha:** `exit` does not run merely because a component has an `exit` prop. It needs to be removed from the rendered React tree under an `AnimatePresence` boundary that can retain it during exit.

### 5. Use `AnimatePresence` for Exiting Elements

`AnimatePresence` detects when its direct children are removed and allows their exit animations to complete. When rendering lists, use stable keys derived from item identity, not array indexes that change after insertion or deletion.

```jsx
import { AnimatePresence, motion } from "framer-motion";

export function MessageList({ messages }) {
  return (
    <ul aria-label="Messages">
      <AnimatePresence initial={false}>
        {messages.map(message => (
          <motion.li
            key={message.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {message.text}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
```

The keys must remain stable for the lifetime of each logical item. Avoid `Math.random()` or timestamps generated during render. Keep the presence boundary in the same component tree where removal occurs, and check nested presence behavior in the installed version.

### 6. Coordinate Components with Variants

Variants let you name visual states and coordinate child animation through a parent. They work well for menus, cards, dialogs, and staggered content. Keep variant labels meaningful and avoid building an opaque hierarchy of state names.

```jsx
import { motion } from "framer-motion";

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: "easeOut" }
  }
};

export function FeatureList({ items }) {
  return (
    <motion.ul variants={listVariants} initial="hidden" animate="visible">
      {items.map(item => (
        <motion.li key={item.id} variants={itemVariants}>
          {item.label}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

A parent variant label can propagate to children when the hierarchy and props are configured for variant orchestration. If a child needs independent control, use explicit animation state or a separate variant boundary rather than fighting propagation.

### 7. Use Layout Animation Deliberately

The `layout` prop lets Motion animate layout changes such as reorder, expansion, or a card moving between grid positions. Use it when the spatial relationship matters to the user. Avoid adding `layout` to every element by default because layout measurement and transforms can add work.

```jsx
import { motion } from "framer-motion";

export function SelectionGrid({ items, selectedId }) {
  return (
    <ul className="selection-grid">
      {items.map(item => (
        <motion.li key={item.id} layout>
          <button
            type="button"
            aria-pressed={selectedId === item.id}
          >
            {item.label}
          </button>
        </motion.li>
      ))}
    </ul>
  );
}
```

Stable keys are essential. If an item changes identity, Motion may treat it as a different element and animate it from the wrong place. For shared-element transitions, `layoutId` can link elements across different parts of the tree; ensure only the intended elements share an ID at a time.

**Gotcha:** Layout animation does not repair an unstable layout. If fonts load late, images lack dimensions, or content changes height after measurement, the element may still jump. Reserve media dimensions and test with real content.

### 8. Make Gesture Feedback Clear

Motion supports gesture props such as `whileHover`, `whileTap`, and `whileFocus`. Use them to provide feedback, not to make an element appear interactive when it is not. Native interactive elements are preferable for actions.

```jsx
import { motion } from "framer-motion";

export function SaveButton({ onSave }) {
  return (
    <motion.button
      type="button"
      onClick={onSave}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      whileFocus={{ outlineColor: "#2563eb" }}
      transition={{ duration: 0.12, ease: "easeOut" }}
    >
      Save changes
    </motion.button>
  );
}
```

Do not rely on hover alone: touch users may not have hover, and keyboard users need focus feedback. Ensure focus styling remains visible in CSS with `:focus-visible`; Motion gesture props are not a replacement for a complete focus treatment. Avoid scale changes that cause text or controls to overlap neighboring elements.

### 9. Respect Reduced Motion

Use `useReducedMotion` or the current version's equivalent to adapt animation based on the user's preference. Reduced motion does not necessarily mean no feedback; prefer opacity, color, or immediate state changes over large travel, parallax, or scale.

```jsx
import { motion, useReducedMotion } from "framer-motion";

export function ResultCard() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.22,
        ease: "easeOut"
      }}
    >
      <h2>Result</h2>
      <p>Motion is adapted to the preference.</p>
    </motion.article>
  );
}
```

Also consider CSS `@media (prefers-reduced-motion: reduce)` for non-Motion animation. Test the `prefers-reduced-motion: reduce` preference in browser DevTools and verify it applies to route transitions, modals, carousels, and decorative loops—not only one component. Accessibility also includes clear labels, logical focus order, visible focus, and avoiding announcements that fire on every animation frame.

### 10. Make Focus and Presence Agree

When a modal or menu closes, focus must move to a sensible location and hidden content must not remain interactive. Animation lifecycle and accessibility lifecycle are related but not identical: an element can still be visually exiting while the application needs to prevent interaction.

```jsx
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export function HelpDisclosure() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) triggerRef.current?.focus();
  }, [open]);

  return (
    <section>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}
      >
        Help
      </button>
      <AnimatePresence>
        {open && (
          <motion.aside
            key="help-panel"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            <p>Help content.</p>
            <button type="button" onClick={() => setOpen(false)}>Close help</button>
          </motion.aside>
        )}
      </AnimatePresence>
    </section>
  );
}
```

This disclosure example illustrates focus ownership, but a modal dialog requires a full dialog pattern: focus containment, background interaction management, Escape behavior, an accessible name, and restoration of focus. Do not treat `AnimatePresence` as a dialog accessibility implementation.

### 11. Avoid Transform Conflicts

Motion often animates transforms for performance. CSS transforms, inline styles, and imperative animation libraries can compete for the same property. If an element uses Motion for `x` and a CSS class also defines `transform`, the final result may not match either author's intention.

```css
.card-shell {
  transform: translateZ(0);
}

.card-motion {
  /* Let Motion own transform on this element. */
  will-change: auto;
}
```

Prefer nested elements when two systems need separate transforms: an outer wrapper can own layout or CSS styling, while an inner element is controlled by Motion. Do not add `will-change: transform` everywhere; it can increase compositor layer memory and should be justified by profiling.

**Gotcha:** Setting `transform` directly in CSS on the same node Motion animates can override or be overwritten by Motion's generated transform. Assign one clear owner or split responsibilities across wrappers.

### 12. Use Springs and Easing with Intent

Use spring transitions for interactions where a physical response feels helpful, and duration/easing transitions for predictable fades and simple entrances. Do not copy arbitrary spring numbers without knowing what stiffness, damping, and mass do. Tune motion against the size and meaning of the object.

```jsx
import { motion } from "framer-motion";

export function ToggleIndicator({ active }) {
  return (
    <motion.span
      aria-hidden="true"
      animate={{ x: active ? 18 : 0 }}
      transition={{
        type: "spring",
        stiffness: 420,
        damping: 32,
        mass: 0.7
      }}
    />
  );
}
```

A spring with low damping can oscillate and feel playful; higher damping reduces bounce. For a status badge or a small confirmation, a short `easeOut` duration may be clearer than a spring. Always test the final behavior at different refresh rates and with reduced motion enabled.

### 13. Build Reusable Transition Tokens

Centralize durations, easing curves, and stagger intervals so components feel related. Tokens also make it easier to reduce motion consistently and update the system after usability testing.

```jsx
export const motionTokens = {
  duration: {
    instant: 0,
    fast: 0.12,
    normal: 0.22,
    slow: 0.36
  },
  ease: {
    enter: "easeOut",
    exit: "easeIn",
    standard: "easeInOut"
  },
  stagger: {
    compact: 0.04,
    normal: 0.07
  }
};
```

Name tokens by purpose rather than arbitrary milliseconds. Keep the set small enough to be remembered, and document where each token should be used. Durations above are starting points, not universal rules; test them with the actual content and interaction.

### 14. Animate Conditional UI Without Layout Surprises

Disclosures, tooltips, banners, and inline validation messages often change layout. Choose whether the surrounding content should move with the animation. If the answer is yes, animate layout intentionally; if no, position the element in a way that avoids covering important controls.

```jsx
import { AnimatePresence, motion } from "framer-motion";

export function ValidationMessage({ message }) {
  return (
    <AnimatePresence initial={false} mode="wait">
      {message ? (
        <motion.p
          key={message}
          role="status"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          {message}
        </motion.p>
      ) : null}
    </AnimatePresence>
  );
}
```

Use `mode="wait"` when the next child should wait for the previous child to exit, and confirm the mode's availability and semantics for the installed version. Keep live announcements concise. Do not animate error text in a way that delays the user's ability to understand or correct the problem.

### 15. Use `layoutId` for Shared-Element Continuity

`layoutId` can connect the visual continuity of elements that move between different parts of the tree, such as a selected tab indicator or a card expanding into a detail view. It is not a general-purpose unique-key substitute.

```jsx
import { motion } from "framer-motion";

export function Tabs({ tabs, activeId, onSelect }) {
  return (
    <nav aria-label="Sections" className="tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          aria-current={tab.id === activeId ? "page" : undefined}
          onClick={() => onSelect(tab.id)}
        >
          {tab.label}
          {tab.id === activeId && (
            <motion.span
              layoutId="active-tab-indicator"
              aria-hidden="true"
              className="tab-indicator"
              transition={{ duration: 0.18, ease: "easeInOut" }}
            />
          )}
        </button>
      ))}
    </nav>
  );
}
```

Use unique IDs for independent shared-element groups. When two matching elements can exist at once, check whether a layout group is needed in your installed version. The indicator is decorative, so hide it from assistive technology and keep the selected tab's semantic state available independently of its motion.

### 16. Keep Server Rendering and Hydration Predictable

Server-rendered React applications can display one initial state on the server and another on the client. Avoid time-dependent random values in render, and be deliberate about `initial` animations when a component may render on both server and client. Confirm client-component boundaries for hooks and browser-only APIs.

```jsx
"use client";

import { motion } from "framer-motion";

export function HydrationSafeCard({ title }) {
  return (
    <motion.article
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <h2>{title}</h2>
      <p>Stable initial output.</p>
    </motion.article>
  );
}
```

`initial={false}` is useful when the first rendered frame should match the target state rather than animate from a hidden state. It is not a universal fix for hydration errors; diagnose mismatched markup, unstable keys, random IDs, and browser-only rendering separately.

**Gotcha:** Hiding important content in the initial render can cause a blank server-rendered page or make content harder to discover when scripts are delayed. Keep meaningful content available and use motion as enhancement rather than a requirement for reading it.

### 17. Debug Layout and Presence in DevTools

When an animation jumps or exits incorrectly, inspect React identity, computed styles, layout dimensions, and the presence boundary. Confirm the component remains mounted long enough to animate and that no parent immediately removes the entire boundary.

```jsx
function logMotionState(label, element) {
  if (!element) {
    console.warn(`${label}: element not found`);
    return;
  }

  const rect = element.getBoundingClientRect();
  console.table([{
    label,
    opacity: getComputedStyle(element).opacity,
    transform: getComputedStyle(element).transform,
    width: rect.width,
    height: rect.height,
    top: rect.top,
    left: rect.left
  }]);
}
```

Debug sequence:
1. Confirm the package import and installed version.
2. Inspect the rendered DOM and React keys.
3. Check whether the exiting node is still under `AnimatePresence`.
4. Inspect computed `opacity`, `transform`, `overflow`, and `position`.
5. Disable layout animation temporarily to isolate measurement problems.
6. Check whether CSS or GSAP is writing to the same transform.
7. Test with reduced motion enabled.
8. Profile repeated transitions for layout reads, paint work, and dropped frames.

Use React DevTools to inspect component state and keys, browser DevTools Elements and Computed panels to inspect styles, and the Performance panel to identify jank. Test Safari, Firefox, and Chromium-based browsers, and check current browser support information or caniuse for CSS features used alongside Motion.

### 18. Optimize Without Premature Layer Promotion

Opacity and transforms are usually good starting points for smooth motion. Animating `width`, `height`, `top`, and `left` may trigger layout or paint and can become expensive when repeated across many elements. Layout animation is still appropriate when the user needs to understand a structural change; measure before removing it.

```jsx
<motion.article
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2, ease: "easeOut" }}
>
  <h3>Fast entrance</h3>
  <p>Prefer transform and opacity when they express the same meaning.</p>
</motion.article>
```

Use `will-change` only when profiling demonstrates a benefit. Excessive compositor layers consume memory, especially on mobile. Avoid expensive synchronous layout reads in animation callbacks, and do not call `getBoundingClientRect()` for every item on every render. Measure real interactions on representative devices and watch for long tasks and dropped frames.

### 19. Keep Animation State Separate from Business State

A transition state should not become the source of truth for business logic. For example, a tab's active ID should control both the content and the indicator; the indicator's animated position should not decide which content is active. This separation prevents motion timing from delaying actions or creating inconsistent state.

```jsx
import { motion } from "framer-motion";

export function StatusBadge({ status }) {
  const isReady = status === "ready";

  return (
    <motion.span
      animate={{ opacity: isReady ? 1 : 0.75 }}
      transition={{ duration: 0.14, ease: "easeOut" }}
      aria-label={`Status: ${status}`}
    >
      {status}
    </motion.span>
  );
}
```

Keep state transitions immediate and animate the visual representation of the new state. If a transition can be interrupted, ensure the final semantic state is still correct. Do not make a user wait for an animation to finish before a save, selection, or navigation action can complete.

### 20. Build an Interaction Test Matrix

Every motion component needs tests for its state changes, not only a screenshot of the initial frame. Include keyboard input, reduced motion, rapid toggling, content changes, and unmount behavior.

```jsx
const motionChecks = [
  "rapid open-close toggles",
  "remove item during entrance",
  "reorder list with stable keys",
  "keyboard focus remains visible",
  "reduced-motion preference",
  "late image and font loading",
  "unmount during exit",
  "small viewport and zoom"
];

console.table(motionChecks.map(test => ({ test, status: "to verify" })));
```

Check that a user can still understand the page if animation is skipped or interrupted. Test long text and real content, not only placeholder copy. Verify that motion does not hide controls, block focus, create unexpected horizontal overflow, or produce repeated screen-reader announcements.

**Gotcha:** `mode="wait"` is useful for one child transition, but it can make a filtered list feel blocked if many items need to update together. Choose the presence mode based on the interaction and verify the installed version's behavior.

## Named Patterns

### Pattern: Fade-and-Lift Entrance

**What it does:** Introduces content with a small vertical offset and opacity change.

**When to use it:** Lightweight notices, cards, and non-critical content entrances.

```jsx
<motion.article
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2, ease: "easeOut" }}
>
  <h2>New update</h2>
</motion.article>
```

### Pattern: Presence-Aware List

**What it does:** Animates additions and removals while preserving item identity.

**When to use it:** Notifications, messages, and filterable lists.

```jsx
<AnimatePresence>
  {items.map(item => (
    <motion.li key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {item.label}
    </motion.li>
  ))}
</AnimatePresence>
```

### Pattern: Parent-Orchestrated Stagger

**What it does:** Coordinates child entrances through shared variant labels.

**When to use it:** Feature lists and menu content.

```jsx
const parent = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};
const child = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 }
};
```

### Pattern: Layout-Aware Reorder

**What it does:** Smooths the movement of items when their order changes.

**When to use it:** Sortable lists and selected-item grids.

```jsx
<motion.li layout key={item.id}>
  {item.label}
</motion.li>
```

### Pattern: Reduced-Motion Entrance

**What it does:** Preserves content while removing travel or delay for users who request reduced motion.

**When to use it:** Shared entrance components and page-level transitions.

```jsx
const reduceMotion = useReducedMotion();
const initial = reduceMotion ? false : { opacity: 0, y: 12 };
```

### Pattern: Shared Tab Indicator

**What it does:** Moves one decorative indicator between selected tabs.

**When to use it:** Navigation tabs where continuity helps explain the selection.

```jsx
{active && <motion.span layoutId="tab-indicator" aria-hidden="true" />}
```

### Pattern: Presence-Aware Disclosure

**What it does:** Animates conditional content while keeping its open state explicit.

**When to use it:** Help panels and optional inline details.

```jsx
<AnimatePresence>
  {open && <motion.aside key="details" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}
</AnimatePresence>
```

### Pattern: Motion Token System

**What it does:** Centralizes duration and easing choices for consistent interactions.

**When to use it:** Design systems with several teams or many animated components.

```jsx
const transitions = {
  quick: { duration: 0.12, ease: "easeOut" },
  standard: { duration: 0.22, ease: "easeInOut" }
};
```

### Pattern: Stable Hydration Frame

**What it does:** Keeps server output visually aligned with the first client render.

**When to use it:** SSR pages where content should be immediately available.

```jsx
<motion.article initial={false} animate={{ opacity: 1, y: 0 }}>
  <h2>Visible content</h2>
</motion.article>
```

### Pattern: Transform Ownership Wrapper

**What it does:** Separates CSS styling transforms from Motion-managed transforms.

**When to use it:** Components that combine Motion with utility CSS or another animation library.

```jsx
<div className="outer-transform">
  <motion.article animate={{ x: 0, opacity: 1 }}>Content</motion.article>
</div>
```

**Gotcha:** Motion's `whileFocus` state is not a substitute for an accessible name, native semantics, or CSS focus styling. A button still needs an understandable label and a visible `:focus-visible` indicator.

## Common Mistakes and Fixes

| Mistake | Why it fails | Fix |
|---|---|---|
| Using unstable list keys | Motion associates the wrong visual item after changes | Use persistent IDs from the data model |
| Adding `exit` without presence management | The element disappears before its exit can complete | Wrap conditional children in `AnimatePresence` |
| Mixing package imports | APIs or exports do not match the installed dependency | Confirm version and use one import path consistently |
| Animating every element with `layout` | Adds unnecessary measurement and transforms | Apply layout animation only where spatial change matters |
| Hiding content in `initial` forever | Content may remain unavailable if the target state never runs | Keep semantic state and rendering conditions correct |
| Using hover as the only feedback | Touch and keyboard users miss the interaction cue | Add `:focus-visible` and clear active states |
| Treating focus styling as optional | Keyboard navigation becomes difficult to track | Keep a strong visible focus indicator |
| Animating modal exit without dialog behavior | Focus and background interaction can remain incorrect | Implement a full accessible dialog pattern |
| Competing CSS and Motion transforms | One transform overwrites or compounds another | Assign one owner or use nested wrappers |
| Using random keys | Every render looks like removal and insertion | Use stable item IDs |
| Overusing springs | Repeated bounce distracts from the task | Use purpose-fit easing and damping |
| Ignoring reduced motion | Large travel and scaling can be uncomfortable | Adapt transitions using the preference |
| Animating layout properties blindly | Can cause repeated layout and paint | Prefer transform and opacity or profile the tradeoff |
| Leaving hidden content focusable | Keyboard focus enters invisible UI | Manage mount, inertness, and focus lifecycle |
| Using `layoutId` as a list key | Shared transition identity is not item identity | Keep React `key` and `layoutId` responsibilities separate |
| Forgetting SSR client boundaries | Hooks and browser APIs may run in the wrong environment | Follow framework client-component requirements |
| Relying on `initial={false}` to fix all hydration issues | Underlying markup mismatch remains | Inspect unstable output and server/client state |
| Running expensive work in animation callbacks | Transitions become janky | Keep callbacks small and defer expensive work |
| Promoting all elements with `will-change` | Layer memory use can grow excessively | Add only after performance profiling |
| Ignoring font and image dimensions | Layout measurements shift after load | Reserve dimensions and test late loading |
| Announcing every visual frame | Screen readers receive noisy updates | Announce meaningful state changes only |
| Removing an item during animation without testing | Lifecycle edge cases can interrupt transitions | Test rapid updates and unmount behavior |
| Letting motion decide business state | Timing can desynchronize content and indicators | Use application state as the source of truth |
| Failing to test browser differences | CSS and rendering behavior can vary | Test Safari, Firefox, and Chromium |
| Making duration tokens arbitrary | Interface motion feels inconsistent | Name tokens by purpose and document intended use |

## Quick Reference

| Need | Pattern or API | Notes |
|---|---|---|
| Motion component | `motion.article`, `motion.button` | Preserve semantic element roles |
| Enter or update state | `initial`, `animate` | Define a stable initial and target state |
| Animate exit | `exit` with `AnimatePresence` | Presence boundary must retain the child |
| Named state groups | `variants` | Use clear labels and intentional propagation |
| Stagger children | `staggerChildren` | Keep intervals short and purposeful |
| Layout movement | `layout` | Use selectively and maintain stable keys |
| Shared element | `layoutId` | Not a replacement for React `key` |
| Hover feedback | `whileHover` | Do not rely on hover alone |
| Press feedback | `whileTap` | Keep scale changes subtle |
| Focus feedback | `whileFocus` plus CSS | Retain `:focus-visible` styling |
| Reduced motion | `useReducedMotion` | Adapt travel, scale, and loops |
| Transition type | `type: "spring"` or duration | Tune based on interaction meaning |
| Wait for exit | `mode="wait"` | Confirm behavior in the installed version |
| Inspect geometry | `getBoundingClientRect()` | Compare before and after layout |
| Inspect styles | `getComputedStyle()` | Look for transform conflicts |
| Profile jank | Performance panel | Check layout, paint, and long tasks |
| SSR first frame | `initial={false}` | Use only when matching the target state is intended |
| Clean up effects | React effect cleanup | Do not create instances during render |
| Browser CSS fallback | `@supports` | Use when surrounding CSS needs a fallback |

**Gotcha:** `overflow: clip` can cut off an animated element or its focus outline. Inspect the focused state and the final animation frame, and keep important controls inside a visible region.

## Browser Support and Compatibility

Motion runs within React's supported environment, but browser behavior also depends on the CSS and web APIs used by the component. Test Safari, Firefox, and Chromium-based browsers. Check browser support and caniuse for CSS features such as `overflow: clip`, newer color functions, and any browser APIs used by your surrounding code. Use `@supports` when a CSS feature needs a fallback rather than allowing a decorative style to break layout.

```css
.motion-panel {
  overflow: hidden;
}

@supports (overflow: clip) {
  .motion-panel {
    overflow: clip;
  }
}
```

Do not clip focus rings or essential content. Ensure the page remains understandable when transitions are skipped, delayed, or interrupted. Browser compatibility testing should include touch, keyboard, zoom, reduced motion, and assistive technology—not just visual snapshots on one desktop browser.

## Build Challenge: Animated Product Explorer

Build a small product explorer with a filterable list, a selected-item detail panel, and a disclosure for additional information.

1. Use semantic `<main>`, `<nav>`, `<section>`, `<ul>`, `<li>`, `<article>`, and native `<button>` elements where appropriate.
2. Use stable item IDs for every mapped React child.
3. Add a presence-aware transition when filtered items enter or leave.
4. Use variants for one coordinated list entrance, with a modest stagger.
5. Apply `layout` only to the items whose spatial changes help explain the new arrangement.
6. Use `layoutId` for a selected indicator or shared visual only if it improves continuity.
7. Implement clear hover, tap, and `:focus-visible` feedback without relying on hover alone.
8. Use `useReducedMotion` to remove unnecessary travel, scale, and decorative delay.
9. Keep the selected product ID as application state; do not infer selection from an animated element's position.
10. Ensure the detail panel and disclosure remain usable when animations are skipped.
11. Test rapid filtering, rapid open-close toggles, item removal during entrance, and route/component unmount.
12. Reserve image dimensions and verify that font loading does not create layout jumps.
13. Avoid transform conflicts between Motion, CSS classes, and any imperative animation library.
14. Use browser DevTools and React DevTools to inspect keys, computed styles, presence behavior, and performance.
15. Test keyboard-only navigation, screen-reader names, focus restoration, and reduced-motion preference.
16. Test Safari, Firefox, and Chromium-based browsers at narrow and wide viewports.
17. Include a failure test where an item is removed during its entrance animation; verify no stale item or focus trap remains.
18. Include a failure test where reduced motion is enabled before opening the explorer; verify content remains visible and the interaction still works.
19. Profile repeated filter changes and ensure layout animation does not cause obvious jank.
20. Document which package name and API version the project uses.

## Definition of Done

- [ ] Package imports match the installed Motion/Framer Motion version.
- [ ] React keys remain stable across filtering, sorting, and removal.
- [ ] Exiting elements use a valid presence boundary.
- [ ] Layout animations are intentional and measured on real content.
- [ ] Focus remains visible and keyboard users can complete every action.
- [ ] Reduced motion removes optional travel and scale while preserving task feedback.
- [ ] Business state remains correct when animations are interrupted.
- [ ] Server-rendered output does not depend on random or time-varying render values.
- [ ] DevTools confirms there are no transform ownership conflicts.
- [ ] Performance remains acceptable on a representative lower-powered device.
- [ ] Failure tests for removal during entrance and reduced motion pass.
- [ ] The experience works across target browsers, viewport sizes, and zoom levels.



## Production Review: Motion as Progressive Enhancement

Review each animation as a layer on top of an already usable interface. The page should still communicate its state if JavaScript loads late, a transition is interrupted, the browser reduces motion, or a test disables animations. Avoid making important copy depend on an entrance animation to become visible. If an element begins at zero opacity, verify that all code paths eventually set a visible target and that conditional rendering cannot leave it hidden indefinitely.

Use a short production review before shipping:
- Confirm every animated state has a clear semantic state in React.
- Confirm the starting frame does not hide information that should be available immediately.
- Confirm the exit state does not leave focus inside removed or visually hidden content.
- Confirm reduced-motion preferences apply to route-level transitions, carousels, dialogs, and repeated decorative effects.
- Confirm the animation remains understandable when skipped, interrupted, or completed instantly.
- Confirm performance has been checked on a mobile-class device and not only a high-end desktop.

```jsx
import { motion, useReducedMotion } from "framer-motion";

export function StatusMessage({ visible, children }) {
  const reduceMotion = useReducedMotion();

  if (!visible) return null;

  return (
    <motion.p
      role="status"
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.16,
        ease: "easeOut"
      }}
    >
      {children}
    </motion.p>
  );
}
```

The `role="status"` example should be used only for a meaningful status update. Do not add live-region semantics to every static label. Excessive announcements can be just as disruptive as missing announcements. The component also illustrates a useful principle: when reduced motion is requested, skip the entrance travel while still rendering the status text and preserving its meaning.

## Route Transitions and Navigation

Route transitions are especially easy to overcomplicate because routing frameworks control when page components mount and unmount. Decide whether the transition adds useful orientation. If users need fast navigation, preserve a stable shell and animate only the changing content. Do not delay the route's semantic update or keyboard access until an elaborate transition finishes.

```jsx
import { AnimatePresence, motion } from "framer-motion";

export function RouteContent({ routeKey, children }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.main
        key={routeKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.14, ease: "easeOut" }}
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );
}
```

This pattern is only appropriate when `routeKey` accurately represents the route identity and the routing system allows the old page to remain mounted long enough to exit. Coordinate scroll restoration, focus management, page headings, and browser history behavior with the router. After navigation, move focus according to the application's accessibility strategy; visual fading alone does not tell assistive technology that the page context changed.

**Gotcha:** If the route key changes on every render, the page can repeatedly exit and re-enter. Derive it from stable route identity, not a newly created object or random value.

## Animation and Testing Strategy

Visual snapshots can catch a missing class or a wrong target, but they rarely prove that an interaction is robust. Test transitions at their boundaries: before they start, while they run, after they complete, and when they are interrupted. A close button should remain usable during a panel's entrance; repeated toggles should not create duplicate children; and a removed list item should not return because a stale key or stale state update reintroduces it.

Use fake timers only when the test environment and animation implementation make them reliable. For browser-level tests, prefer asserting the meaningful end state rather than relying on a fragile exact frame timing. A test can disable or shorten animation while still checking that the DOM, focus, and accessible state are correct.

```js
const cases = [
  { name: "open then close immediately", expected: "closed" },
  { name: "filter while item enters", expected: "filtered result" },
  { name: "remove focused row", expected: "focus restored" },
  { name: "reduced motion enabled", expected: "visible final state" }
];

console.table(cases);
```

For automated accessibility checks, inspect accessible names, button roles, `aria-expanded`, focus order, and whether hidden panels remain in the tab order. Use a real keyboard pass as well: automated tools do not reliably detect every confusing interaction. Check both CSS `prefers-reduced-motion: reduce` and the JavaScript preference hook because CSS animations and Motion-driven animations may be controlled through different code paths.

## Motion Budget and Content Priority

A motion budget is a practical limit on how much movement competes for attention in one viewport. It does not need to be a strict numeric score. It means choosing one dominant transition for the user's current task and keeping supporting elements quiet. If a modal, backdrop, heading, list, and every list item all animate independently, the user may have trouble identifying the actual state change.

Prioritize:
1. **State clarity:** make the result of the user's action obvious.
2. **Spatial continuity:** animate movement when it helps explain where an item went.
3. **Hierarchy:** use stagger or scale sparingly to direct attention.
4. **Responsiveness:** keep interactions feeling immediate.
5. **Comfort:** adapt large movement and repeated effects to motion preferences.

If two animations compete, remove one before adding more easing. Reduce stagger delays for large lists, avoid animating every item when a filter returns hundreds of results, and consider animating only the visible subset. Do not use motion to disguise slow data loading; provide loading feedback and keep the interface responsive.

## Final Compatibility Pass

Before release, check that the project uses one documented import path and a known version. Search the codebase for both `framer-motion` and `motion/react` to identify accidental duplication. Review the framework's client/server boundaries, and verify the browser console is clean on first render, route changes, and unmount. Test with CSS animations disabled if your test setup allows it, then test the reduced-motion preference separately.

For CSS-based transitions, use `@supports` for optional features that could affect layout and check current browser support or caniuse. For Motion behavior, rely on the installed library's documentation and tests rather than assuming a CSS feature query can detect JavaScript API support. Confirm behavior in Safari, Firefox, and Chromium-based browsers, especially where transforms, clipping, scrolling, and focus outlines interact.

## Final Principle

Choose motion to clarify state, continuity, and hierarchy. Keep React identity stable, treat presence as lifecycle, preserve accessibility when animation is skipped, and measure performance before adding complexity.
