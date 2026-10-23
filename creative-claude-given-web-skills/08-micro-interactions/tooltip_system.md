---
name: tooltip-system
layer: layer-08-micro-interactions
filename: tooltip_system.md
description: Design robust, accessible tooltips with correct triggers, positioning, dismissal, and lifecycle management.
---

# Tooltip System

## Why This Matters

A tooltip is a short, contextual explanation that appears when a user points to, focuses, or otherwise inspects an interface element. It is useful for clarifying an icon-only control, explaining a compact label, or adding a brief hint without permanently occupying layout space.

Tooltips are easy to make inaccessible. A tooltip that appears only on hover excludes keyboard users. A tooltip that cannot be dismissed can obscure content. A tooltip that appears on touch without a clear interaction model can become difficult to close. A tooltip that is visually attached to one element but positioned relative to another can cover the wrong content or drift on scroll.

A production-ready tooltip system should:
- Use a real trigger element with an accessible name.
- Keep tooltip content brief and non-interactive.
- Support keyboard focus and pointer hover without relying on either alone.
- Remain available long enough to read and provide a clear dismissal path.
- Position itself near the trigger while staying inside the viewport.
- Avoid interfering with pointer movement, touch, or assistive technology.
- Clean up listeners, timers, and observers when the component is removed.

Tooltips are not a substitute for labels, essential instructions, or interactive popovers. If content contains links, buttons, form controls, or substantial information, use a popover, dialog, or persistent help text instead.

## Core Concepts

### 1. Distinguish a Tooltip from a Popover

A tooltip provides a brief, non-interactive description. A popover can contain controls or longer content and needs a different focus and dismissal model.

```html
<button type="button" aria-describedby="save-tip">
  <span class="icon" aria-hidden="true">↓</span>
  <span class="sr-only">Download report</span>
</button>

<span id="save-tip" role="tooltip" class="tooltip">
  Download the current report
</span>
```

**Why:** Treating every floating panel as a tooltip often creates keyboard and screen-reader problems. If users need to interact with the floating content, choose a component designed for interaction.

### 2. The Trigger Needs Its Own Accessible Name

A tooltip may add context, but it should not be the only source of an icon button's name. The button must still be understandable when the tooltip is not visible.

```html
<button type="button" aria-label="Copy link" aria-describedby="copy-tip">
  <svg aria-hidden="true" viewBox="0 0 24 24">...</svg>
</button>
<span id="copy-tip" role="tooltip">Copy the current page link</span>
```

**Why:** Tooltips are transient and may not be exposed in every interaction mode. A clear accessible name remains available to screen-reader and voice-control users.

### 3. Use `aria-describedby` to Associate the Description

When appropriate, connect the trigger to the tooltip using a stable ID. The tooltip itself can use `role="tooltip"`.

```html
<button aria-describedby="help-tip" type="button">Help</button>
<div id="help-tip" role="tooltip">Open help for this field</div>
```

**Why:** This expresses a descriptive relationship in the accessibility tree. Test actual behavior with the assistive technology supported by your product; do not assume every browser and screen reader announces transient tooltip content identically.

### 4. Support Pointer Hover and Keyboard Focus

The tooltip should be available when the trigger is hovered and when it receives keyboard focus.

```css
.tooltip {
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
}

.tooltip-trigger:hover .tooltip,
.tooltip-trigger:focus-visible .tooltip {
  visibility: visible;
  opacity: 1;
}
```

**Why:** Hover-only behavior excludes users who navigate by keyboard. Focus behavior is essential, and a touch interaction model should be defined separately rather than assuming touch behaves like a mouse.

### 5. Avoid a Pointer Gap Between Trigger and Tooltip

If the tooltip is positioned with a gap, the pointer may leave the trigger before reaching the tooltip. The tooltip can disappear before it can be read.

**Why:** The tooltip should remain visible while the pointer moves from the trigger onto the tooltip when that movement is part of the intended interaction. Use a wrapper, a safe hover region, or a small invisible bridge rather than relying on a fragile timing delay.

### 6. Provide Dismissal Behavior

A tooltip should not trap focus or require a complex interaction to close. Escape is a useful dismissal action when the tooltip is open, especially for keyboard users.

**Why:** A tooltip that obscures nearby content must be dismissible. If it contains interactive elements or manages focus, it is no longer a simple tooltip and should use popover or dialog semantics.

### 7. Use Visibility and Opacity Carefully

`opacity: 0` alone leaves an element in the accessibility tree and can leave it focusable if it contains focusable content. `visibility: hidden` helps prevent the hidden tooltip from being exposed, but the trigger's descriptive relationship still needs to be tested.

```css
.tooltip {
  visibility: hidden;
  opacity: 0;
  transition: opacity 120ms ease;
}

.tooltip[data-open="true"] {
  visibility: visible;
  opacity: 1;
}
```

**Why:** Visual hiding and accessibility exposure are not the same thing. Use non-interactive tooltip content, keep state transitions consistent, and verify the chosen pattern with screen readers.

### 8. Position Relative to the Trigger

The trigger's bounding rectangle is the anchor. Use its coordinates and the tooltip's measured dimensions to place the tooltip above, below, or beside it.

```js
const triggerRect = trigger.getBoundingClientRect();
const tooltipRect = tooltip.getBoundingClientRect();

const top = triggerRect.top - tooltipRect.height - 8;
const left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
```

**Why:** Hard-coded offsets fail when labels, font sizes, zoom, or viewport dimensions change. Positioning should respond to actual geometry and avoid clipping.

### 9. Clamp Position to the Viewport

A tooltip near the edge of the screen should flip or shift instead of extending beyond the viewport.

```js
const gutter = 8;
const left = Math.min(
  window.innerWidth - tooltipRect.width - gutter,
  Math.max(gutter, preferredLeft)
);
```

**Why:** Tooltips must remain readable at narrow widths, high zoom, and near viewport edges. A preferred placement is a starting point, not a guarantee.

### 10. Reposition on Scroll and Resize

The trigger's viewport coordinates change when the page or a scrollable ancestor moves. Recompute placement when relevant scroll or resize events occur, or use a positioning library that already handles these details.

**Why:** A tooltip that was correctly positioned at open time can drift away from its trigger. Avoid reading geometry on every global scroll event for every tooltip; only update active tooltips and coalesce updates when necessary.

### 11. Use Delays as a Usability Tool, Not a Fix for Bad Geometry

A short opening delay can prevent a tooltip from flashing when the pointer merely passes over a control. A close delay can help the pointer move into the tooltip.

**Why:** Delays should improve interaction, not compensate for a large gap or an unclear trigger. Keep timing consistent and avoid long waits that make the interface feel unresponsive.

### 12. Respect Reduced Motion and High Zoom

Tooltip transitions should be subtle and optional. The tooltip must remain legible at browser zoom and should not rely on a tiny arrow, faint color, or motion to communicate its relationship to the trigger.

```css
@media (prefers-reduced-motion: reduce) {
  .tooltip {
    transition: none;
  }
}
```

**Why:** Tooltip content is supplementary, but when shown it must be readable. Motion should not be required to discover the content, and zoom must not cause clipping.

## Patterns

### Pattern 1: CSS-Only Tooltip for Simple Content

**Use when:** The tooltip is short, decorative, and can be positioned by a nearby wrapper without viewport collision logic.

```html
<span class="tooltip-wrap">
  <button
    class="tooltip-trigger"
    type="button"
    aria-label="Copy link"
    aria-describedby="copy-link-tip"
  >
    <span aria-hidden="true">⧉</span>
  </button>
  <span class="tooltip" role="tooltip" id="copy-link-tip">
    Copy the current page link
  </span>
</span>
```

```css
.tooltip-wrap {
  position: relative;
  display: inline-flex;
}

.tooltip-trigger {
  display: inline-grid;
  place-items: center;
  min-width: 2.75rem;
  min-height: 2.75rem;
}

.tooltip {
  position: absolute;
  z-index: 20;
  left: 50%;
  bottom: calc(100% + 0.5rem);
  transform: translateX(-50%) translateY(2px);
  max-width: min(18rem, calc(100vw - 1rem));
  padding: 0.45rem 0.65rem;
  border-radius: 0.375rem;
  background: #191919;
  color: white;
  font-size: 0.8125rem;
  line-height: 1.35;
  text-align: center;
  white-space: normal;
  pointer-events: none;
  visibility: hidden;
  opacity: 0;
  transition: opacity 120ms ease, transform 120ms ease;
}

.tooltip-wrap:hover .tooltip,
.tooltip-wrap:focus-within .tooltip {
  visibility: visible;
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .tooltip {
    transition: none;
  }
}
```

**Trade-off:** This is small and easy to maintain, but it does not flip or shift intelligently near viewport edges. Use a positioning system for tooltips that can appear near the edges or inside scrollable containers.

### Pattern 2: JavaScript Tooltip with Explicit Open State

**Use when:** You need consistent hover and focus triggers, Escape dismissal, and lifecycle cleanup.

```html
<span class="tooltip-host">
  <button
    type="button"
    class="tooltip-trigger"
    aria-label="Archive item"
    aria-describedby="archive-tooltip"
  >
    <span aria-hidden="true">▣</span>
  </button>
  <span class="tooltip" role="tooltip" id="archive-tooltip" data-open="false">
    Move this item to the archive
  </span>
</span>
```

```css
.tooltip {
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
  transition: opacity 120ms ease;
}

.tooltip[data-open="true"] {
  visibility: visible;
  opacity: 1;
}
```

```js
function mountTooltip(host) {
  const trigger = host.querySelector(".tooltip-trigger");
  const tooltip = host.querySelector('[role="tooltip"]');

  if (!trigger || !tooltip) return () => {};

  let open = false;
  let closeTimer = 0;

  function setOpen(next) {
    open = next;
    tooltip.dataset.open = String(next);
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = 0;
    }
  }

  function scheduleClose(delay = 80) {
    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      closeTimer = 0;
      setOpen(false);
    }, delay);
  }

  function onPointerEnter() {
    setOpen(true);
  }

  function onPointerLeave() {
    scheduleClose();
  }

  function onFocus() {
    setOpen(true);
  }

  function onBlur() {
    scheduleClose();
  }

  function onKeyDown(event) {
    if (event.key === "Escape" && open) {
      setOpen(false);
      trigger.focus();
    }
  }

  trigger.addEventListener("pointerenter", onPointerEnter);
  trigger.addEventListener("pointerleave", onPointerLeave);
  trigger.addEventListener("focus", onFocus);
  trigger.addEventListener("blur", onBlur);
  host.addEventListener("keydown", onKeyDown);

  return () => {
    if (closeTimer) clearTimeout(closeTimer);
    trigger.removeEventListener("pointerenter", onPointerEnter);
    trigger.removeEventListener("pointerleave", onPointerLeave);
    trigger.removeEventListener("focus", onFocus);
    trigger.removeEventListener("blur", onBlur);
    host.removeEventListener("keydown", onKeyDown);
  };
}

const host = document.querySelector(".tooltip-host");
if (host) {
  const unmountTooltip = mountTooltip(host);
  // Call unmountTooltip() when the host is removed.
}
```

**Notes:**
- This is a foundation, not a full positioning engine.
- The pointer-leave delay is deliberately short; if the pointer must enter the tooltip, track pointer state across the full hover region rather than hiding the tooltip on trigger leave.
- Escape dismissal should be tested with the product's keyboard interaction model. Do not steal focus unless the interaction design genuinely requires it; a non-interactive tooltip generally should not move focus.
- Keep the `aria-describedby` relationship stable rather than attaching and detaching IDs on every animation frame.

### Pattern 3: Pointer-Safe Hover Region

**Use when:** The tooltip is visually separated from its trigger but should remain open while the pointer moves between them.

```html
<span class="tooltip-wrap">
  <button class="tooltip-trigger" type="button" aria-describedby="tip-download">
    Download
  </button>
  <span id="tip-download" class="tooltip" role="tooltip">
    Download a copy in CSV format
  </span>
</span>
```

```css
.tooltip-wrap {
  position: relative;
  display: inline-flex;
}

.tooltip {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 0.5rem);
  transform: translateX(-50%);
  pointer-events: auto;
  visibility: hidden;
  opacity: 0;
}

.tooltip-wrap:hover .tooltip,
.tooltip-wrap:focus-within .tooltip {
  visibility: visible;
  opacity: 1;
}

/* Invisible bridge prevents a small gap from ending hover. */
.tooltip::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  height: 0.6rem;
}
```

**Why:** The hover region includes the trigger, tooltip, and a bridge between them. This avoids relying on a close delay to mask a geometry problem.

Do not put links or buttons inside this tooltip. If the content needs interaction, switch to a popover with appropriate focus management.

### Pattern 4: Viewport-Aware Positioning

**Use when:** Tooltips can appear near screen edges or inside dynamic layouts.

```js
function positionTooltip(trigger, tooltip, {
  placement = "top",
  gap = 8,
  gutter = 8,
} = {}) {
  const triggerRect = trigger.getBoundingClientRect();

  // Make the tooltip measurable while visually hidden.
  const previousVisibility = tooltip.style.visibility;
  const previousDisplay = tooltip.style.display;
  tooltip.style.visibility = "hidden";
  tooltip.style.display = "block";

  const tooltipRect = tooltip.getBoundingClientRect();
  let top;
  let left;

  if (placement === "bottom") {
    top = triggerRect.bottom + gap;
  } else {
    top = triggerRect.top - tooltipRect.height - gap;
  }

  left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;

  // Flip vertically when the preferred side does not fit.
  if (placement === "top" && top < gutter) {
    top = triggerRect.bottom + gap;
  } else if (
    placement === "bottom" &&
    top + tooltipRect.height > window.innerHeight - gutter
  ) {
    top = triggerRect.top - tooltipRect.height - gap;
  }

  left = Math.max(
    gutter,
    Math.min(window.innerWidth - tooltipRect.width - gutter, left)
  );

  tooltip.style.position = "fixed";
  tooltip.style.top = `${top}px`;
  tooltip.style.left = `${left}px`;
  tooltip.style.visibility = previousVisibility;
  tooltip.style.display = previousDisplay;
}
```

**Implementation notes:**
- Call this when the tooltip opens and when the viewport or relevant scroll containers move.
- For a production system, schedule repositioning in `requestAnimationFrame` and update only open tooltips.
- This basic example handles top/bottom placement and horizontal clamping; it does not fully account for clipping ancestors, visual viewport behavior, RTL layout, or complex nested scrolling.
- A maintained positioning library is often the better choice for a design system with many tooltip placements.

### Pattern 5: React Tooltip with Stable IDs and Cleanup

**Use when:** A tooltip is part of a reusable React component library.

```jsx
import { useId, useState } from "react";

export function TooltipButton({
  label,
  tooltip,
  children,
  onClick,
  type = "button",
}) {
  const tooltipId = useId();
  const [open, setOpen] = useState(false);

  return (
    <span
      className="tooltip-wrap"
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <button
        type={type}
        className="tooltip-trigger"
        aria-label={label}
        aria-describedby={tooltipId}
        onClick={onClick}
      >
        {children}
      </button>

      <span
        id={tooltipId}
        className="tooltip"
        role="tooltip"
        data-open={open ? "true" : "false"}
      >
        {tooltip}
      </span>
    </span>
  );
}
```

**Implementation notes:**
- `useId` prevents collisions when multiple instances render.
- `label` provides the control's accessible name; `tooltip` adds supplementary context.
- This simple version does not include Escape dismissal, delayed closing, viewport collision handling, or touch-specific behavior. Add them if required by the product.
- Use the wrapper as the hover region so moving into the tooltip does not immediately close it.
- Avoid applying pointer/focus handlers to a broad parent that includes unrelated controls.

### Pattern 6: Escape Dismissal Without Focus Theft

**Use when:** A keyboard user needs to dismiss a visible tooltip.

```js
function addEscapeDismissal(host, trigger, setOpen) {
  function onKeyDown(event) {
    if (event.key !== "Escape") return;
    setOpen(false);
    // Do not force focus unless the trigger has actually lost focus
    // and the product's interaction model calls for restoration.
  }

  host.addEventListener("keydown", onKeyDown);

  return () => host.removeEventListener("keydown", onKeyDown);
}
```

A tooltip should not normally take focus. Escape can hide it while focus stays on the trigger. If the user needs to tab into the floating content, use a popover instead.

### Pattern 7: Touch-Friendly Help Disclosure

**Use when:** Touch users need access to explanatory content and hover cannot be assumed.

For essential help, prefer a visible label or a disclosure button rather than a tooltip that depends on a long press. A button that opens a short help popover is often a better pattern on touch devices.

```html
<button
  type="button"
  aria-expanded="false"
  aria-controls="field-help"
  id="field-help-trigger"
>
  Why do you need this?
</button>

<div id="field-help" hidden>
  We use this value to calculate your estimated delivery date.
</div>
```

This is a disclosure pattern, not a tooltip. If the help contains only a short, non-interactive description and you still choose a tooltip on touch, define whether a tap toggles it and ensure a second tap, outside tap, or Escape-equivalent mechanism can close it. Do not make long-press the only route to the content.

### Pattern 8: Tooltip State for a Dynamic Trigger

**Use when:** The trigger can be disabled, removed, or updated while a tooltip is open.

```js
function createTooltipState(tooltip) {
  let open = false;

  return {
    open() {
      open = true;
      tooltip.dataset.open = "true";
    },
    close() {
      open = false;
      tooltip.dataset.open = "false";
    },
    isOpen() {
      return open;
    },
  };
}
```

When a trigger becomes disabled or is removed, close its tooltip and remove its event handlers. Native disabled buttons do not receive focus and may not emit pointer events consistently across browsers. If the user needs an explanation for why an action is unavailable, put that explanation in visible help text or use a wrapper strategy that preserves the disabled control's semantics.

## Common Mistakes

| Mistake | Why It Fails | Better Approach |
|---|---|---|
| Using a tooltip for interactive content | Keyboard users cannot reach its controls | Use a popover or dialog |
| Giving an icon button no accessible name | Tooltip may not be available in every mode | Add a stable `aria-label` or visible label |
| Relying on hover only | Excludes keyboard users | Support focus as well |
| Hiding the tooltip when the pointer crosses a small gap | Tooltip becomes impossible to read | Make a shared hover region or safe bridge |
| Using opacity alone to hide content | Hidden content can remain exposed or interactive | Coordinate visibility, semantics, and pointer behavior |
| Forcing focus on Escape | Can disrupt the user's current focus position | Keep focus on the trigger unless restoration is needed |
| Positioning with a fixed hard-coded offset | Breaks with zoom, content length, and viewport edges | Measure and clamp or use a positioning library |
| Repositioning every tooltip on every scroll | Wastes work | Update only open tooltips |
| Using a long delay to fix bad geometry | Feels slow and remains fragile | Fix the hover region first |
| Assuming touch has hover | Help may be inaccessible or stuck open | Provide a tap-based disclosure when appropriate |
| Using the tooltip as the only label | Trigger is ambiguous when closed | Give the control its own accessible name |
| Making the tooltip too long | It becomes a poor reading surface | Use concise text or a popover |
| Forgetting stable IDs in reusable components | Multiple instances can reference the wrong tooltip | Use unique IDs, such as React `useId` |
| Leaving timers or listeners active | Can update removed components | Clean up on unmount |
| Showing tooltips for disabled controls without a plan | Disabled elements may not receive events or focus | Add persistent help or a carefully designed wrapper |
| Ignoring browser zoom | Tooltip may clip or cover important content | Test at zoom and narrow viewport sizes |
| Relying on color alone | Contrast or state may be unclear | Use readable text, contrast, and clear placement |

## Mental Models

1. **A tooltip describes; it does not contain a workflow.** The moment users need to interact with the floating content, choose a popover or dialog.
2. **The trigger must stand on its own.** Its accessible name remains meaningful even when the tooltip is closed.
3. **Hover is a region, not a single event.** The pointer should be able to move between trigger and tooltip without losing the interaction.
4. **Position is geometry, not a magic offset.** Measure actual dimensions and adapt to viewport constraints.
5. **Dismissal should not steal focus.** A tooltip is supplementary and should not trap or unexpectedly move keyboard focus.
6. **Touch needs an explicit model.** Do not treat a tap as a mouse hover and hope the result is intuitive.
7. **Every open state has a cleanup path.** Timers, listeners, observers, and positioning work should stop when the tooltip closes or its trigger disappears.

## Quick Reference

### Trigger and behavior checklist

| Input or state | Expected behavior |
|---|---|
| Pointer enters trigger | Tooltip opens, possibly after a short delay |
| Pointer moves into tooltip | Tooltip remains open if hover interaction is intended |
| Pointer leaves hover region | Tooltip closes according to a consistent policy |
| Keyboard focus enters trigger | Tooltip becomes available |
| Escape pressed | Tooltip closes without unnecessary focus movement |
| Touch interaction | Explicit tap/disclosure behavior or persistent help |
| Reduced motion | Transition is removed or simplified |
| Viewport or scroll changes | Active tooltip remains anchored and visible |
| Trigger removed or disabled | Tooltip closes and work is cleaned up |

### Useful CSS

```css
.tooltip {
  position: absolute;
  z-index: 100;
  max-width: min(18rem, calc(100vw - 1rem));
  padding: 0.45rem 0.65rem;
  border-radius: 0.375rem;
  background: #191919;
  color: white;
  font-size: 0.8125rem;
  line-height: 1.35;
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
  transition: opacity 120ms ease;
}

.tooltip[data-open="true"] {
  visibility: visible;
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .tooltip {
    transition: none;
  }
}
```

### Debugging sequence

1. Check that the trigger has a meaningful accessible name.
2. Confirm the tooltip is associated with the intended trigger.
3. Test hover and keyboard focus separately.
4. Move the pointer from the trigger to the tooltip and check for flicker.
5. Test Escape dismissal without unexpected focus changes.
6. Check placement near all viewport edges.
7. Test page scroll, nested scrolling, and resize while open.
8. Test browser zoom and narrow screens.
9. Verify touch users have a clear way to access and dismiss help.
10. Check screen-reader output with the tooltip closed and open.
11. Remove the trigger while the tooltip is open and verify cleanup.
12. Confirm that long or interactive content uses a popover instead.

### Production checklist

- [ ] Trigger has its own accessible name.
- [ ] Tooltip content is concise and non-interactive.
- [ ] `aria-describedby` relationship is stable and correctly associated.
- [ ] Pointer hover and keyboard focus are supported.
- [ ] Pointer movement into the tooltip does not close it unexpectedly.
- [ ] Escape dismissal is implemented where appropriate.
- [ ] Focus is not moved unnecessarily.
- [ ] Positioning accounts for viewport edges and scroll.
- [ ] Active tooltips are the only ones being repositioned.
- [ ] Touch behavior is explicit and testable.
- [ ] Reduced-motion preferences are respected.
- [ ] Timers, listeners, and observers are cleaned up.
- [ ] Disabled controls have an accessible explanation strategy.
- [ ] Browser zoom and screen-reader behavior are tested.
- [ ] Interactive content is implemented as a popover or dialog instead.

## Build Challenge

Build a reusable tooltip system for an analytics dashboard with icon-only actions for copy, download, and archive. Tooltips should open on pointer hover and keyboard focus, stay open while the pointer moves into the tooltip, close with Escape, and avoid clipping at viewport edges.

### Requirements

1. Give every icon button a stable accessible name.
2. Associate concise tooltip text with the trigger.
3. Support pointer and keyboard interaction.
4. Implement a safe hover region.
5. Add Escape dismissal without unnecessary focus theft.
6. Position tooltips based on measured trigger and tooltip geometry.
7. Clamp or flip placement near viewport edges.
8. Respect reduced-motion preferences.
9. Define touch behavior explicitly.
10. Ensure interactive help uses a popover, not a tooltip.
11. Clean up event listeners, timers, observers, and scheduled positioning work.
12. Test with keyboard, touch, zoom, and a screen reader.

### Acceptance criteria

- Every icon button remains understandable when its tooltip is hidden.
- Tooltips appear on both hover and focus.
- Pointer movement between trigger and tooltip does not cause flicker.
- Escape closes the tooltip while preserving appropriate focus.
- Tooltips remain inside the viewport at narrow sizes and high zoom.
- Touch users have an explicit route to help content.
- No tooltip contains focusable controls.
- The effect works without relying on motion.
- Cleanup prevents stale timers or handlers after unmount.
- Longer or interactive content uses a different component pattern.

### Review questions

1. What distinguishes a tooltip from a popover?
2. Why should an icon button have an accessible name even when it has a tooltip?
3. How does `aria-describedby` help connect a tooltip to its trigger?
4. Why is a shared hover region better than a long close delay?
5. Why should Escape dismissal avoid unnecessary focus movement?
6. How can a tooltip stay within the viewport?
7. Which events should cause an active tooltip to reposition?
8. Why does touch need a separate interaction model?
9. What cleanup is required when a tooltip component unmounts?
10. How would you test the tooltip with keyboard and screen-reader users?
