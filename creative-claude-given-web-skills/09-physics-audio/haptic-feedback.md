# Haptic Feedback for Web Interfaces

## Skill Metadata

- **Skill:** `haptic-feedback`
- **Layer:** `layer-09-physics-audio`
- **Primary domain:** Browser haptics, interaction feedback, mobile web UX, graceful capability degradation
- **Audience:** Front-end engineers, creative developers, interaction designers, and technical leads
- **Outcome:** Build haptic interactions that are purposeful, optional, accessible, restrained, and reliable when supported, while keeping the interface fully understandable when vibration is unavailable.
- **Prerequisites:** JavaScript events, semantic HTML, responsive design, browser feature detection, accessibility fundamentals
- **Core platform:** The Web Vibration API (`navigator.vibrate`) where supported, plus visual, textual, and optional audio alternatives
- **Important limitation:** Browser haptic support is inconsistent. A call to `navigator.vibrate()` is not proof that a device physically vibrated.

## Goal

Design and implement haptic feedback as one small part of a complete interaction system. A haptic cue should reinforce a meaningful event—such as a successful action, a boundary being reached, or a deliberate confirmation—without becoming the only way a user can understand the result. The interface must remain complete on desktop computers, devices without vibration hardware, browsers that omit the API, and environments where vibration is blocked.

This skill is not a guide to forcing vibration, simulating a native operating-system haptic engine, or treating every click as an opportunity to buzz the phone. The web platform does not provide a universal, cross-browser, fine-grained haptic motor API. The Vibration API is a best-effort capability, commonly available only in a subset of mobile browsers and devices. Use it as an enhancement rather than a dependency.

## Why This Matters

Interaction feedback helps people connect an action to its result. A concise tactile cue can make a supported mobile experience feel more responsive: a successful save may receive a subtle pulse; a game-like control may provide a short tick; an invalid boundary may be signaled by a brief pattern. Yet haptics are also easy to misuse. Unrequested vibration can surprise users, drain attention, create discomfort, or make an otherwise calm interface feel noisy. Long or repeated patterns can be especially unpleasant for people who are sensitive to vibration.

The web developer must also handle uncertainty. Browsers differ in whether they expose the API, whether the device has a vibrator, whether the page is in a permitted state, and whether user settings or browser policies allow the request. A successful JavaScript return value does not establish that the motor ran. Therefore the interface must communicate state independently through visible feedback and, where appropriate, accessible text or live-region announcements.

The best haptic system has three qualities:

1. **Semantic:** The cue maps to a meaningful event rather than a random interaction.
2. **Restrained:** It is short, infrequent, predictable, and easy to disable.
3. **Redundant:** Users can understand the event without feeling the vibration.

## Core Concepts

### 1. The Vibration API is a capability, not a guarantee

The relevant browser API is typically `navigator.vibrate(pattern)`. The argument may be a number representing a vibration duration in milliseconds or an array alternating between vibration and pause durations. The method returns a Boolean indicating whether the request was accepted by the user agent; it does not confirm physical vibration. Some browsers do not expose it, and platform support varies substantially.

Always feature-detect the method:

```js
export function canRequestVibration() {
  return typeof navigator !== "undefined"
    && typeof navigator.vibrate === "function";
}
```

Feature detection avoids a runtime error, but it is only the first step. It cannot establish hardware presence, permission, or successful physical output. Name functions and variables accordingly: `canRequestVibration` is honest; `deviceHasHaptics` would overstate what the browser can tell you.

### 2. Duration is expressed in milliseconds

A call such as `navigator.vibrate(25)` requests a brief vibration for 25 milliseconds. Actual timing may be clamped, rounded, delayed, or ignored by the browser or device. Use short durations for UI feedback and test on physical devices. A duration is a request, not a precise timing contract.

```js
function requestShortPulse(duration = 18) {
  if (!canRequestVibration()) return false;
  return navigator.vibrate(duration);
}
```

The function deliberately reports only whether a request was accepted. It does not claim the user felt it. Keep values conservative, and do not build essential logic around the exact length of a vibration.

### 3. Patterns alternate vibration and pause

An array can describe multiple pulses and pauses. For example, `[20, 35, 20]` requests a short pulse, a pause, then another short pulse. Patterns can communicate different categories, but complex patterns are not automatically better. Longer patterns are harder to predict, more intrusive, and more likely to be cut short or ignored.

```js
function requestDoublePulse() {
  if (!canRequestVibration()) return false;
  return navigator.vibrate([18, 40, 18]);
}
```

Use a small vocabulary of distinct patterns. If success, warning, and error each have elaborate unique rhythms, users may not learn them and assistive feedback may still be required. A simple cue plus visible status is usually more effective.

### 4. Cancellation is part of lifecycle management

Calling `navigator.vibrate(0)` or passing an empty pattern can request cancellation of an active vibration pattern in supporting browsers. This is useful when a route changes, a dialog closes, or an interaction is superseded. Cancellation is best-effort too; do not assume every browser will behave identically.

```js
export function cancelVibration() {
  if (!canRequestVibration()) return false;
  return navigator.vibrate(0);
}
```

Avoid leaving a repeating pattern running after the interaction that started it has ended. Prefer finite patterns for UI feedback. If a feature truly needs ongoing vibration, reconsider whether it belongs in a web page and provide an obvious stop control.

### 5. User activation and browser policy matter

The API is subject to browser and platform restrictions. Requests may be blocked in some contexts, including when the page is not active or when browser policy disallows the behavior. Do not try to evade these restrictions by hiding calls in timers, loops, or synthetic events. Trigger haptics only as a direct, restrained response to a real user action or a meaningful state transition that the user has initiated.

The safest pattern is to call the haptic helper from the same event handler that handles the action. Do not use vibration to attract attention to unsolicited marketing, background events, or notifications that the user did not ask to receive.

### 6. Haptics must never be the only state signal

A vibration does not communicate reliably to every user. Some people cannot feel it, have vibration disabled, use a device without a vibrator, or are browsing on a desktop. Success, errors, selection, and progress must also be represented through visible interface changes and appropriate text.

For example, after saving a setting, update the button label or status message to “Saved”. A brief vibration may accompany the result, but the status text carries the meaning. Use an `aria-live` region for concise status changes when appropriate, and avoid announcing every tiny animation frame.

### 7. Keep the haptic vocabulary small

A practical design system often needs only a few semantic categories:

- **Confirmation:** a very short pulse after a successful, deliberate action.
- **Selection:** optional, extremely subtle feedback when a user changes a meaningful choice.
- **Boundary:** a restrained cue when an interaction reaches a limit, such as a game-like control.
- **Warning or error:** usually prioritize clear visual and textual explanation; haptics are optional reinforcement, not a substitute for explaining the problem.

Do not assign a unique vibration pattern to every button. Reuse patterns consistently and document what each one means. If users need a legend to understand your haptics, the system may be too complex.

### 8. Haptic intensity is not directly controllable through the basic web API

The standard Vibration API primarily requests durations and pauses. It does not provide a universal control for motor intensity, waveform shape, or platform-native haptic styles. Avoid describing a 20 ms request as “low intensity” in a technical contract. It is a short duration request; perceived intensity depends on the device and motor.

Use product language carefully. “Subtle pulse” is a design intention, not a guaranteed physical output. If an application needs precise haptic engines, consult the relevant native platform APIs and acknowledge that a browser-only implementation cannot guarantee equivalent behavior.

### 9. Respect user preference and provide an opt-out

Because vibration is physical feedback, it should be easy to turn off. A simple setting such as “Haptic feedback” with a clear enabled/disabled state gives users control. Persist the preference using the application’s normal settings mechanism where appropriate, and default conservatively. Do not repeatedly prompt users to enable haptics.

The control itself must work when the API is unavailable. It may be useful to show a haptics setting only on supported contexts, but be careful: support can be uncertain and can change by device. A universal setting can instead describe “optional vibration feedback when supported,” and the rest of the interface remains functional.

### 10. Respect reduced-motion preferences without overgeneralizing

The `prefers-reduced-motion` media feature is primarily about reducing motion in visual interfaces; it is not a definitive haptic preference signal. Still, it is reasonable to consider reduced-motion preference as a reason to use more conservative interaction effects, especially when haptics are coupled to animations. Do not assume it necessarily means “disable every vibration”; provide an explicit haptic control when the product offers vibration.

```js
const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;
```

Use this as one design input, not as a substitute for user choice. When reduced motion is enabled, avoid pairing vibration with unnecessarily intense visual movement, flashing, or rapid repeated feedback.

### 11. Debounce repeated input

Rapid taps can cause repeated vibration requests. This is noisy and may also create a queue-like experience that does not match the visible interface. Use event-level guards, debounce, or a short cooldown when a control can be triggered repeatedly. The cooldown should prevent accidental bursts without delaying important state changes.

Do not debounce the core action in a way that makes the interface feel unresponsive. Update the UI state promptly; throttle only the optional haptic cue. This separation is important: the user’s action must still work even if the haptic request is skipped.

### 12. Separate interaction state from haptic side effects

The application should update its state first or as part of the same controlled event, then request optional feedback. Do not store the result of `navigator.vibrate()` as the business state of the action. A failed haptic request must not make a save fail, prevent a selection, or change a payment result.

A clean architecture separates three concerns: action logic, visible/accessibility feedback, and optional haptic side effect. This makes the core feature testable without a device vibrator and reduces the temptation to couple correctness to browser-specific behavior.

### 13. Use semantic HTML for controls

Haptics do not replace semantic controls. Use `<button>` for actions, `<input>` for values, and native form elements for selection where possible. A clickable `<div>` requires additional keyboard handling, focus behavior, and accessible semantics. It is usually the wrong foundation for an interactive haptic demo.

Native semantics give keyboard and assistive-technology users a predictable interaction model. Haptics can enhance the same action for supported devices, but must not change how the control is operated or understood.

### 14. Do not vibrate on every pointer movement

Pointer movement and drag updates can fire at high frequency. Vibrating for every `pointermove`, slider tick, or scroll position update can overwhelm the user and the device. Instead, trigger a cue at a meaningful threshold, a discrete selection change, a successful drop, or a boundary crossing. Keep continuous interactions smooth and reserve haptics for sparse events.

If a drag interaction has multiple meaningful milestones, detect transitions between milestones rather than emitting a cue on every frame. A set-membership or last-state guard can ensure that each milestone is signaled only once.

### 15. Visibility and lifecycle need attention

A page may be backgrounded, navigated away from, or placed into a suspended state while an interaction is in progress. Cancel an active pattern when the owning interaction is disposed or becomes irrelevant. Use `visibilitychange` only where it provides a real lifecycle benefit; do not add listeners everywhere without cleanup.

Lifecycle management is especially important for single-page applications. When a component unmounts or a route changes, it should cancel feedback it owns and remove listeners. Haptics should never continue as a ghost effect after the interface that initiated them has disappeared.

### 16. Avoid hidden or coercive vibration

Do not vibrate users unexpectedly to gain attention, simulate urgency, encourage compulsive engagement, or punish an error. Do not conceal the existence of physical feedback in a way that surprises users. In games, playful vibration should be bounded and optional. In financial, medical, or high-stakes flows, clarity and user control matter more than sensory theatrics.

The interaction should remain calm if vibration is unavailable or disabled. A product that depends on tactile pressure to make users react faster is likely using the wrong design pattern.

### 17. Accessibility includes more than screen readers

Accessibility considerations include sensory sensitivity, motor differences, device settings, keyboard access, readable status messages, and predictable behavior. Offer a visible setting to disable haptics. Do not encode critical distinctions solely as different rhythms. Ensure the action remains discoverable and operable using a keyboard and assistive technology.

For errors, explain what happened and how to recover. A short vibration cannot replace inline error text, focus management, or a clear association between the invalid field and its message.

### 18. Test on real devices

A desktop simulator may expose no Vibration API. A browser’s developer tools cannot prove that a physical motor responded. Test on representative real hardware and browsers, including an unsupported environment. Validate the actual experience rather than merely checking that a method exists.

Create a small test matrix: supported Android browser, browser with no API, desktop, haptics disabled in the product setting, and a reduced-motion configuration. Record expected visible behavior separately from optional tactile behavior.

### 19. Do not infer user preference from hardware support

The presence of `navigator.vibrate` does not mean a user wants vibration. Likewise, the absence of the API does not mean the user has a particular accessibility need. Capability and preference are separate concepts. Feature detection answers “can I request this?”; a setting answers “does this user want this?”.

Keep these states separate in code. Avoid setting `hapticsEnabled` automatically to true solely because the API is present. A conservative default and a clear preference produce more predictable behavior.

### 20. Treat the return value as limited telemetry

The Vibration API’s return value indicates whether the request was accepted, not whether the device physically vibrated or whether the user noticed it. It can help tests and debugging, but it is not a reliable success metric for the user’s interaction.

Do not send analytics events that say “user felt vibration” or “haptic delivered” based only on the return value. If you instrument usage, name events precisely—for example, `haptic_request_accepted`—and consider whether collecting that telemetry is necessary at all.

## Recommended Architecture

Use a small module that owns feature detection, preference checks, rate limiting, and pattern definitions. Components should request a semantic cue such as `success()` or `selection()` rather than passing arbitrary durations everywhere. Centralization helps keep patterns restrained and consistent.

The module should not own business logic. It should not save data, validate a form, or decide whether a payment succeeded. It only provides optional sensory reinforcement after the application has determined what happened.

### A minimal haptic utility

```js
const PATTERNS = Object.freeze({
  success: 18,
  selection: 10,
  boundary: [12, 35, 12],
});

let hapticsEnabled = true;
let lastRequestAt = 0;
const MIN_INTERVAL_MS = 120;

export function setHapticsEnabled(enabled) {
  hapticsEnabled = Boolean(enabled);
  if (!hapticsEnabled) cancelVibration();
}

export function canRequestVibration() {
  return typeof navigator !== "undefined"
    && typeof navigator.vibrate === "function";
}

export function cancelVibration() {
  if (!canRequestVibration()) return false;
  return navigator.vibrate(0);
}

export function haptic(kind = "selection") {
  if (!hapticsEnabled || !canRequestVibration()) return false;

  const now = Date.now();
  if (now - lastRequestAt < MIN_INTERVAL_MS) return false;

  const pattern = PATTERNS[kind];
  if (pattern === undefined) return false;

  lastRequestAt = now;
  return navigator.vibrate(pattern);
}
```

This is a small starting point, not a universal design-system prescription. The global preference shown here is in-memory only. A production application should connect it to the product’s settings model, decide whether it should persist, and handle server-rendered or non-browser execution safely. `Date.now()` is used for a simple cooldown; the cooldown is not part of the Vibration API and should not control business actions.

### Calling the utility from a real action

```js
saveButton.addEventListener("click", async () => {
  saveButton.disabled = true;
  status.textContent = "Saving…";

  try {
    await savePreferences();
    status.textContent = "Preferences saved.";
    haptic("success");
  } catch {
    status.textContent = "Could not save. Try again.";
    // A visible error is required even when haptics are unavailable.
  } finally {
    saveButton.disabled = false;
  }
});
```

The haptic request follows the confirmed outcome. If the save fails, the interface communicates the failure in text. A product may choose a restrained error cue, but the message remains primary. Never vibrate “success” before the operation actually succeeds.

## Semantic HTML and Accessible Interaction Example

```html
<section aria-labelledby="feedback-title">
  <h2 id="feedback-title">Feedback preferences</h2>

  <label>
    <input id="haptics-toggle" type="checkbox" checked>
    Optional vibration feedback when supported
  </label>

  <button id="confirm-button" type="button">
    Test feedback
  </button>

  <p id="feedback-status" role="status" aria-live="polite">
    Ready to test feedback.
  </p>
</section>
```

```js
const toggle = document.querySelector("#haptics-toggle");
const button = document.querySelector("#confirm-button");
const status = document.querySelector("#feedback-status");

toggle.addEventListener("change", () => {
  setHapticsEnabled(toggle.checked);
  status.textContent = toggle.checked
    ? "Optional vibration feedback enabled when supported."
    : "Vibration feedback disabled.";
});

button.addEventListener("click", () => {
  status.textContent = "Feedback test requested.";
  if (toggle.checked) haptic("success");
});
```

The example uses a native checkbox, a button, and a status region. In a production app, initialize the checkbox from the saved preference, and avoid implying that a vibration definitely occurred. “Feedback test requested” is more accurate than “You felt a vibration.” Consider whether a separate test button is needed at all; for some products, a simple preference is enough.

## Haptic Pattern Design

Patterns are not a standardized semantic language across devices. The following are design starting points for testing, not universal prescriptions. Device motors and operating-system behavior differ, so the same duration can feel different from one device to another.

| Semantic event | Example request | Intent | Guardrail |
|---|---:|---|---|
| Confirmed success | `18` | Small acknowledgment | Only after success is confirmed |
| Discrete selection | `10` | Tiny tactile tick | Avoid on every continuous movement |
| Boundary reached | `[12, 35, 12]` | Two-part cue | Use sparingly in bounded interactions |
| Cancel current pattern | `0` | Stop a pattern | Best-effort; do not assume universal behavior |
| No haptic cue | `null` in app logic | Keep feedback visual/textual | Valid default for low-value actions |

Do not copy the exact values without testing. Start with the smallest cue that conveys the intended interaction, then test with people and devices. A pattern that feels “subtle” to one person may feel intrusive to another.

## Interaction Patterns

### Pattern 1: Confirmed-action acknowledgment

Use a short cue after a meaningful action completes successfully, such as saving a preference or adding an item. Update the visible status first or in the same state transition. If the action fails, do not emit the success cue.

### Pattern 2: Discrete selection tick

For a control with clearly discrete choices, a very short cue can reinforce a selection change. Trigger it only when the selected value actually changes. Do not trigger it when focus moves onto a control or when the pointer passes over an option without selecting it.

### Pattern 3: Boundary-crossing cue

In a game or drag interaction, detect a transition into a boundary state and signal it once. Track the previous state so the cue does not repeat on every pointer event while the user remains beyond the threshold.

### Pattern 4: Error reinforcement with recovery

A failed action should be explained in visible text and associated with the relevant control. If a haptic cue is used, keep it secondary. Move focus only when appropriate and avoid unexpected focus jumps. A cue should not make the user infer the reason for failure.

### Pattern 5: User-controlled test

A preference panel may offer a “Test feedback” button so users can understand what the setting does. Make it explicit that vibration works only on supported devices and browsers. The test button should also update text, so the test is meaningful when no vibration is available.

### Pattern 6: Optional game feedback

Games can use more expressive patterns than productivity interfaces, but should still use restraint. Provide an in-game toggle, avoid long patterns, and do not couple haptics to every frame or collision calculation. Haptic events should be tied to discrete gameplay events rather than physics update frequency.

### Pattern 7: Cooldown for bursty input

When a button can be tapped repeatedly, let every valid action work but limit the optional cue to a reasonable frequency. The cooldown should be short, documented, and tested with the control’s real interaction model. Do not let a haptic cooldown accidentally block keyboard or pointer actions.

### Pattern 8: Capability fallback

If vibration is unavailable, the same action should continue normally and visible feedback should remain. The fallback is not an error state; it is an expected platform variation. Do not show scary warnings merely because a device lacks a vibration API.

### Pattern 9: Route and component teardown

When an interaction is dismissed or the component that initiated a pattern is removed, request cancellation if appropriate and release event listeners. Avoid global vibration side effects from short-lived components. A haptic utility may be shared, but ownership of when to cancel should be explicit.

### Pattern 10: Respect preference changes immediately

When the user turns haptics off, stop any active pattern where possible and suppress future requests. The toggle should update immediately, and the rest of the app should not require a reload. Keep this preference independent from whether the API exists.

## Mental Models

1. **Haptics are an enhancement channel.** They reinforce information that already exists in the interface; they never carry the only copy of the meaning.
2. **Capability is not delivery.** An exposed method and an accepted request do not prove a physical motor moved.
3. **Preference is separate from support.** A supported device can have haptics disabled, and an unsupported device still deserves a complete interface.
4. **State transitions are the right trigger.** Haptic feedback belongs to meaningful changes, not every render, pointer movement, or frame.
5. **The action is primary; the cue is optional.** Saving, selecting, or submitting must work without the haptic module.
6. **Less is more.** A small, consistent vocabulary is more learnable and less intrusive than a different pattern for every event.
7. **Lifecycle has ownership.** The component or interaction that starts a pattern should have a clear rule for stopping or superseding it.
8. **Accessibility is redundant communication.** Visible state, readable text, keyboard operation, and assistive-technology semantics remain essential.
9. **Physical feedback is a user-experience decision.** Just because a browser permits a request does not mean the product should make it.
10. **Test reality, not only code.** Device behavior, browser policies, motor strength, and personal perception cannot be fully simulated in unit tests.

## Common Mistakes

| Mistake | Why it fails | Better approach |
|---|---|---|
| Calling `navigator.vibrate()` without feature detection | Unsupported browsers can throw or fail | Check that the method exists |
| Assuming a return value means the motor vibrated | The API reports request acceptance, not physical delivery | Use precise naming and keep visible feedback |
| Vibrating on every click | Makes the interface noisy and tiring | Use semantic event categories |
| Vibrating on every `pointermove` | High-frequency events overwhelm the user | Trigger only at meaningful thresholds |
| Using vibration as the only success message | Unsupported or insensitive users miss the result | Add visible status text |
| Using a success cue before async work finishes | Communicates a false result if the request fails | Emit only after confirmed success |
| Creating very long patterns | Intrusive and likely to be interrupted | Prefer short, finite requests |
| Building complex rhythms for every action | Users may not learn the distinctions | Use a small consistent vocabulary |
| Calling a duration “intensity” | The API does not universally control motor strength | Describe it as duration or a short pulse request |
| Treating feature detection as permission | The API can exist while requests are blocked | Handle the request as best-effort |
| Treating unsupported hardware as an error | Makes normal platform variation feel broken | Silently preserve the core interaction |
| Automatically enabling haptics whenever supported | Ignores user preference | Provide a clear setting and conservative defaults |
| Ignoring an opt-out toggle during an active pattern | Feedback can continue after the user disables it | Request cancellation and suppress future cues |
| Vibrating from timers unrelated to user action | Can surprise users and conflict with browser policy | Tie cues to real, meaningful interactions |
| Using haptics to create urgency | Can feel coercive or manipulative | Communicate urgency through clear, proportionate UI |
| Forgetting to cancel repeating patterns | Feedback may outlive the interaction | Prefer finite patterns and cancel on teardown |
| Leaving event listeners attached after unmount | Can create duplicate calls and memory leaks | Remove listeners in cleanup |
| Coupling business success to the API return value | A valid action can appear to fail on unsupported devices | Keep haptics outside business logic |
| Debouncing the entire action to limit vibration | Makes the product feel slow or drops legitimate input | Throttle only the optional cue |
| Vibrating during every slider value update | Creates an unpleasant stream of pulses | Use threshold crossings or release events |
| Assuming reduced motion is a haptics preference | The media query does not directly express vibration preference | Use it as a design signal and offer explicit control |
| Writing analytics as “haptic delivered” | The browser cannot confirm user perception | Track only what the code can actually observe |
| Testing only in desktop devtools | Cannot validate physical device response | Use a real-device test matrix |
| Showing “Your device has no vibrator” from API absence | API absence does not prove hardware absence | Say vibration feedback may not be supported |
| Using a clickable `div` for the demo | Adds unnecessary keyboard and accessibility work | Prefer semantic buttons and form controls |
| Triggering on hover or focus | Users may not intend to activate the control | Trigger after a deliberate action or state change |
| Giving error patterns no recovery text | Users cannot identify or fix the issue | Explain the error and next step |
| Using haptics for every animation milestone | Overloads attention | Reserve cues for meaningful milestones |
| Ignoring background or route changes | Stale feedback can continue | Manage visibility and component lifecycle |
| Calling the API from rendering code | Re-renders may produce repeated physical side effects | Call it from explicit event/state-transition handlers |

## Gotchas and Edge Cases

### API presence varies by browser and platform

Do not assume that support is universal, even among mobile devices. Maintain a fallback and verify target browsers. The absence of the API should not block a feature or cause a warning unless the product genuinely requires vibration—which is unusual for a web interface.

### Browser return values are not physical confirmation

A `true` return value means the request was accepted according to the API contract, not that the user felt it. Avoid user-facing claims and analytics that go beyond what is known.

### Background tabs and page lifecycle can interrupt patterns

Browser and operating-system policy may suspend or ignore requests when the page is hidden or inactive. Do not attempt to work around restrictions. If the interaction no longer matters, cancel it when possible.

### Patterns can be truncated or constrained

Browsers may impose limits or handle durations differently. Keep patterns short, finite, and low complexity. Never use a long pattern as a timing mechanism or as part of application correctness.

### Embedded contexts may behave differently

A page inside an iframe or an embedded web view can have different support and policy behavior. Test the actual deployment environment rather than assuming that a standalone browser test represents an embedded product.

### Accessibility settings and user sensitivity differ

A user may have system-level vibration settings, sensory preferences, or a device that feels very different from yours. Provide product-level control and do not force repeated cues. Avoid interpreting a lack of response as user failure.

### A test control can still surprise someone

If a settings page offers a test, label it clearly and make the action deliberate. Avoid automatically vibrating when a page opens or when the user merely navigates to the settings screen.

### Timers do not make an unsupported API supported

Wrapping the call in `setTimeout`, `requestAnimationFrame`, or a promise does not solve capability or policy limitations. It can instead make the effect less predictable. Keep the request close to the action that justifies it.

### A fallback is not necessarily audio

When vibration is unavailable, visual state and text are usually the most reliable baseline. Audio may be appropriate in some contexts, but should also be optional and must not be added automatically as a replacement that creates a new sensory burden.

### Repeating patterns require a stronger justification

For a normal button, confirmation, or form, use finite cues. If the product is considering repeated vibration, confirm that the user expects it, that it is essential to the interaction, that it can be stopped, and that a non-vibrating path remains complete.

## Performance and Reliability Notes

- **Keep requests sparse.** Vibration is a physical side effect, not a frame-by-frame animation primitive.
- **Do not call from render loops.** In React or other component systems, keep haptic calls in event handlers or carefully scoped effects tied to a one-time state transition.
- **Throttle only optional feedback.** The core action should not wait for the haptic API.
- **Use short patterns.** This reduces intrusiveness and avoids depending on long-running device behavior.
- **Centralize pattern definitions.** A single utility makes review, tuning, testing, and opt-out behavior easier.
- **Cancel owned feedback.** When an interaction is closed or replaced, stop a pattern when appropriate.
- **Avoid needless listeners.** Add visibility or lifecycle listeners only when the feature requires them, and remove them on teardown.
- **Test unsupported paths.** The fallback path is a first-class path, not an exceptional failure.
- **Avoid layout work in the haptic helper.** It should not touch the DOM or trigger expensive rendering.
- **Do not use vibration as a clock.** Timing can vary; application logic must use its own reliable state and timekeeping.
- **Avoid analytics noise.** Record only useful events, and distinguish a request from confirmed application success.
- **Respect user settings immediately.** Turning haptics off should suppress future calls and request cancellation if relevant.
- **Keep patterns data-driven.** Store a small immutable mapping and reject unknown event names.
- **Handle non-browser environments.** Code that runs during server rendering or in tests should not reference `navigator` without checking that it exists.
- **Test real hardware and a no-API environment.** Both are necessary to validate the product contract.

## Testing Strategy

### Unit tests

Mock the Vibration API and verify that the helper:
- Does nothing when `navigator` or `navigator.vibrate` is absent.
- Does not call the API when haptics are disabled.
- Uses only known patterns.
- Cancels when requested.
- Respects the cooldown.
- Does not change business outcomes when a haptic request returns `false`.

A unit test can validate your logic, not the physical sensation. Keep those claims separate.

### Integration tests

Verify that the haptic request occurs only after the appropriate interaction. For asynchronous actions, assert that the success cue is requested after the promise resolves and not when it rejects. Verify that visible status text updates independently of the haptic API.

### Manual device matrix

| Environment | What to verify |
|---|---|
| Mobile browser with API | A deliberate action requests a short cue |
| Mobile browser without API | The action and status message still work |
| Desktop browser | No runtime error and no missing feedback |
| Haptics disabled in settings | No new haptic requests |
| Preference turned off mid-pattern | Cancellation is requested where possible |
| Slow network / failed save | No false success cue |
| Repeated tapping | The action remains correct; cues are restrained |
| Route change or dialog close | No stale interaction continues |
| Keyboard activation | Button works and visible status updates |
| Screen reader | Status is announced appropriately without excessive chatter |

## Example: Robust Utility With Injectable Dependencies

For more testable code, inject the environment rather than hard-coding global access in every function. This also makes it straightforward to test unsupported environments.

```js
export function createHaptics({
  getNavigator = () =>
    typeof navigator === "undefined" ? null : navigator,
  now = () => Date.now(),
  minInterval = 120,
} = {}) {
  const patterns = Object.freeze({
    success: 18,
    selection: 10,
    boundary: [12, 35, 12],
  });

  let enabled = true;
  let lastAt = -Infinity;

  function vibrate(pattern) {
    const nav = getNavigator();
    if (!enabled || !nav || typeof nav.vibrate !== "function") {
      return false;
    }

    const current = now();
    if (current - lastAt < minInterval) return false;
    lastAt = current;
    return nav.vibrate(pattern);
  }

  return {
    setEnabled(value) {
      enabled = Boolean(value);
      if (!enabled) this.cancel();
    },
    request(kind = "selection") {
      if (!Object.prototype.hasOwnProperty.call(patterns, kind)) {
        return false;
      }
      return vibrate(patterns[kind]);
    },
    cancel() {
      const nav = getNavigator();
      if (!nav || typeof nav.vibrate !== "function") return false;
      return nav.vibrate(0);
    },
  };
}
```

For a production library, avoid depending on `this` binding in methods that might be destructured. You can make `cancel` a local function and return it directly. This sample emphasizes dependency injection and testability; adapt its API style to your project conventions.

## Example: Boundary Feedback Without Repeating Every Frame

```js
function createBoundaryCue(haptics) {
  let wasInside = true;

  return function updateBoundary(position, min, max) {
    const isInside = position >= min && position <= max;

    if (wasInside && !isInside) {
      haptics.request("boundary");
    }

    wasInside = isInside;
    return isInside;
  };
}
```

This state-transition model sends one request when the interaction crosses from inside to outside. It does not request vibration for every frame spent outside the range. A more advanced implementation can distinguish crossing the lower and upper boundary, or reset the state when a drag begins, but it should preserve the same principle: trigger on a meaningful transition.

## Example: React Integration

```jsx
import { useCallback, useEffect, useRef } from "react";

export function useHaptics(enabled = true) {
  const lastRequest = useRef(0);

  const request = useCallback((pattern = 18) => {
    if (!enabled) return false;
    if (typeof navigator === "undefined") return false;
    if (typeof navigator.vibrate !== "function") return false;

    const now = Date.now();
    if (now - lastRequest.current < 120) return false;
    lastRequest.current = now;

    return navigator.vibrate(pattern);
  }, [enabled]);

  useEffect(() => {
    if (!enabled && typeof navigator !== "undefined"
      && typeof navigator.vibrate === "function") {
      navigator.vibrate(0);
    }
  }, [enabled]);

  return request;
}
```

Use the hook from a user event handler, not during rendering:

```jsx
function SaveButton({ onSave, hapticsEnabled }) {
  const requestHaptic = useHaptics(hapticsEnabled);

  async function handleSave() {
    await onSave();
    requestHaptic(18);
  }

  return <button type="button" onClick={handleSave}>Save</button>;
}
```

This example is intentionally small. In a production app, show loading and error states, guard against duplicate submissions, and ensure that a failed save does not request a success cue. If the handler is used in a complex component, preserve error handling and accessibility semantics.

## Design Review Checklist

Before shipping a haptic interaction, ask:

- Does the cue correspond to a meaningful event?
- Would the interface still be understandable if no vibration occurred?
- Is the request short and finite?
- Is the pattern used consistently across the product?
- Does the action work on a browser without the API?
- Can the user turn the feature off?
- Is the setting’s meaning clear?
- Are success cues emitted only after success is confirmed?
- Are errors explained in visible text?
- Are repeated interactions rate-limited without blocking the action?
- Are pointer movement and animation frames free of haptic calls?
- Is any active pattern cancelled when the interaction is no longer relevant?
- Are listeners and component effects cleaned up?
- Has the experience been tested on physical devices?
- Are analytics labels precise about what the browser can observe?
- Does the experience avoid coercion, surprise, and sensory overload?

## Definition of Done

A `haptic-feedback` implementation is complete when all of the following are true:

1. The core feature works even when the Vibration API is missing.
2. All API access is guarded by feature detection.
3. Haptics are requested only for meaningful, deliberate interactions.
4. The product does not claim that an accepted request proves physical delivery.
5. Every important state is also represented visually and, where appropriate, in text.
6. The haptic vocabulary is small, documented, and consistent.
7. Patterns are short, finite, and tested on real devices.
8. The user can disable haptics, and the preference takes effect immediately.
9. Turning haptics off attempts to cancel an active pattern where supported.
10. Repeated input cannot create a burst of unnecessary vibration requests.
11. No haptic calls occur inside rendering loops or continuous pointer movement.
12. Async success feedback occurs only after confirmed success.
13. Errors have an understandable message and recovery path.
14. Keyboard and assistive-technology use remain complete.
15. Lifecycle listeners are removed and owned feedback is cancelled when appropriate.
16. Unit tests cover API absence, preference, patterns, cooldown, and cancellation.
17. Integration tests verify state order and visible fallback.
18. Manual tests include a real supported device and an unsupported browser.
19. Documentation states platform limitations plainly.
20. No product requirement depends on the user feeling a vibration.

## Build Challenge: Create a Haptic Preference and Feedback Demo

Build a small mobile-first demo page that offers optional haptic feedback for a few meaningful actions. The challenge is to demonstrate the full interaction contract, not merely call `navigator.vibrate()`.

### Required features

1. Create a semantic page with a heading, short explanation, and a native checkbox for enabling/disabling optional vibration.
2. Add a “Test feedback” button that requests a short cue only when the preference is enabled.
3. Add a “Save setting” action that simulates an asynchronous save and requests success feedback only after success.
4. Add a simulated failure path that displays an error message and never emits a success cue.
5. Provide a visible status region using `role="status"` or an appropriate live region.
6. Feature-detect the Vibration API and support browsers where it is absent.
7. Display a neutral support note such as “Vibration may not be available in this browser or device,” without claiming that hardware is definitely missing.
8. Use a small, documented pattern map with no more than three semantic patterns.
9. Add a short cooldown that limits repeated haptic requests but never blocks the actual button action.
10. Request cancellation when the preference is switched off.
11. Ensure that no vibration occurs on page load, focus, hover, or passive navigation.
12. Use keyboard-operable native controls and preserve a visible focus indicator.
13. Respect the reduced-motion preference for associated visual animations, without treating it as a definitive haptic preference.
14. Add a small testable utility module with injected or mockable dependencies.
15. Write unit tests for API absence, disabled preference, unknown pattern, cooldown, and cancellation.
16. Write an integration test proving that successful async completion triggers the success request and rejection does not.
17. Test a supported mobile browser and at least one environment without the API.
18. Add a manual QA checklist covering repeated taps, turning the setting off, keyboard use, and failure states.
19. Document the difference between an accepted request and confirmed physical vibration.
20. Keep the UI restrained: no flashing, no forced audio fallback, and no unsolicited vibration.
21. Keep business logic independent from haptic utility return values.
22. Include a “Reset demo” control that restores the visible state and preference without causing vibration.
23. Ensure errors are associated with the relevant action and include a recovery instruction.
24. Confirm that route changes or component teardown cannot leave a repeating pattern active.
25. Add a short README section explaining API limitations and how to test the demo on a real device.

### Suggested folder structure

```text
haptic-feedback-demo/
├── index.html
├── styles.css
├── src/
│   ├── haptics.js
│   ├── feedback-controller.js
│   └── main.js
├── tests/
│   ├── haptics.test.js
│   └── feedback-flow.test.js
└── README.md
```

### Evaluation rubric

| Area | Weight | Strong result |
|---|---:|---|
| Correct API use | 20% | Feature-detected, conservative, and best-effort |
| Accessibility | 20% | Semantic controls, visible status, keyboard access, opt-out |
| State correctness | 20% | Haptics follow confirmed outcomes and never control business logic |
| Reliability | 15% | Cooldown, cancellation, cleanup, unsupported fallback |
| Testing | 15% | Unit, integration, and physical-device coverage |
| Design restraint | 10% | Small vocabulary, no surprise cues, clear documentation |

### Stretch goals

- Add a preference adapter so settings can be persisted using the project’s existing storage layer.
- Add a diagnostic panel that reports whether the API is exposed and whether a request was accepted, using wording that does not imply physical delivery.
- Add a game-like boundary demo where feedback fires only on state transitions.
- Add a test harness that replaces `navigator.vibrate` with a spy and records requested patterns.
- Add a browser compatibility note reviewed against current target-device testing.

## Quick Reference

| Need | Recommended approach | Avoid |
|---|---|---|
| Check API availability | `typeof navigator.vibrate === "function"` | Assuming every mobile browser supports it |
| Request a brief pulse | Use a short duration in milliseconds | Long patterns for ordinary actions |
| Request multiple pulses | Use a small array of durations and pauses | Elaborate rhythms with unclear meaning |
| Cancel an active pattern | `navigator.vibrate(0)` where supported | Assuming cancellation is guaranteed everywhere |
| Handle missing API | Continue the action and show visible status | Throwing an error or blocking the feature |
| Report success | Show text/state and optionally request a cue | Treating vibration as the only confirmation |
| Report failure | Explain the error and recovery step | Relying on a warning pulse alone |
| Respect preference | Maintain an explicit enabled setting | Auto-enabling merely because API exists |
| Turn haptics off | Suppress requests and attempt cancellation | Leaving active feedback running |
| Handle rapid taps | Cooldown the optional cue | Blocking the actual action |
| Handle drag boundaries | Detect threshold transitions | Vibrating on every pointer event |
| Integrate with async work | Request success only after resolution | Vibrating before the result is known |
| Use with React | Call from event handlers or scoped effects | Calling during render |
| Support screen readers | Use concise visible status and semantic controls | Encoding meaning only in rhythm |
| Support keyboard users | Use native buttons and inputs | Clickable generic containers without full behavior |
| Consider reduced motion | Reduce associated visual effects and offer control | Treating the media query as a definitive haptics setting |
| Test behavior | Use real devices plus mocked unit tests | Trusting desktop simulation alone |
| Instrument requests | Name metrics according to observable behavior | Claiming the user felt the vibration |
| Use in a game | Tie cues to meaningful discrete events | Coupling vibration to physics frames |
| Use in forms | Prioritize field errors and recovery text | Vibrating on every invalid keystroke |
| Embedded page | Test the actual web view or iframe environment | Assuming standalone browser behavior |
| Background page | Let browser policy apply and cancel when relevant | Trying to bypass background restrictions |
| Design patterns | Keep a small semantic vocabulary | A unique pattern for every button |
| Accessibility preference | Provide an easy opt-out | Forcing or repeatedly prompting for haptics |
| Teardown | Remove listeners and cancel owned patterns | Leaving effects after a route change |
| Test utility | Inject navigator/time dependencies | Hard-coding globals that are hard to mock |
| State management | Keep haptics separate from business success | Making API return values determine action outcome |
| Audio fallback | Use only when suitable and optional | Automatically replacing vibration with sound |
| Support messaging | Say “may not be supported” | Claiming no vibrator exists from API absence |
| Product copy | Say “optional vibration feedback” | Promising a guaranteed tactile sensation |

## Final Principles

A high-quality web haptic system is deliberately modest. It uses the platform capability when available, keeps the user in control, and treats every vibration request as optional. The core interface must communicate its state without touch, and the application’s correctness must never depend on the haptic API. Prefer a short cue after a meaningful transition, a clear status message for every important outcome, and an explicit way to disable physical feedback.

The most important engineering habit is precision in claims. You can know that a method exists, that you requested a pattern, and possibly that the browser accepted the request. You generally cannot know from the web page alone that the motor vibrated or that the user felt it. Build your architecture, tests, product language, and analytics around that distinction.


## Implementation note: settings persistence

Store the user preference in the application's established settings layer rather than scattering local-storage calls through buttons. If local storage is appropriate, guard it in environments where storage is unavailable and handle malformed values. Treat an absent preference as the documented default, not as proof of support.

On initialization, read the preference and initialize the control and haptic utility from the same value. Avoid a flash where the checkbox shows enabled while the utility is disabled. When the user changes the setting, update the UI immediately and persist asynchronously if needed.

Do not sync a haptic preference across accounts or devices without a product reason and a clear settings model. It is a sensory preference, and users may reasonably want different behavior on different devices.



## Implementation note: server rendering and hydration

Server-rendered applications do not have a browser navigator during server rendering. Keep the capability check inside a function that runs in the browser or inject the environment. Never evaluate `navigator.vibrate` unguarded at module initialization if the module can be imported by a server.

Hydration should not depend on detecting haptic support to decide whether the main interaction exists. Render the same core action for every environment. A small support hint can update after the browser initializes, but it should not change the semantic structure in a way that causes confusing hydration differences.

Do not call a haptic function from an effect that runs merely because a component mounted. Mounting is not a deliberate user action and can occur more than once during development or lifecycle transitions.



## Implementation note: component boundaries

Choose whether a component or a shared service owns the haptic preference. A small application can use a module-level utility; a larger app may inject a service through context. In either case, keep pattern names centralized and make disabling feedback a single clear operation.

Do not let arbitrary leaf components create new pattern durations without review. A central semantic API such as `request('success')` makes it easier to audit intensity, frequency, and user-preference behavior.

Keep haptic code independent of visual animation code. An animation can be reduced or disabled while the action still succeeds, and a haptic request can be unavailable while the visual status remains intact.



## Implementation note: cooldown design

A cooldown is a product-level safeguard against repeated optional side effects. Choose a value based on the interaction and test it with fast input. The sample uses a short interval only as a starting point; it is not a browser standard.

Update the cooldown timestamp only when the utility actually attempts a request, and decide explicitly whether a browser rejection should consume the cooldown. Either choice can be reasonable, but it should be consistent and tested.

Do not apply one global cooldown to unrelated interaction classes if it makes feedback unpredictable. Conversely, do not create independent cooldowns for every button if users can then trigger a burst from several controls. Pick the smallest model that fits the product.



## Implementation note: cancellation and ownership

Cancellation is a best-effort request to the browser, not a transactional guarantee. Call it when a user disables feedback or when a feature that owns a finite interaction is dismissed, but do not write application logic that waits for cancellation to finish.

If multiple components share one global vibration channel, cancellation from one component may interrupt another component's pattern. Decide whether this is acceptable; for most web UI patterns, a single shared channel with sparse, short cues is appropriate.

Prefer finite patterns so cancellation is rarely needed. Infinite or long-running patterns introduce ownership, lifecycle, and user-control problems that ordinary web UI does not need.



## Implementation note: product language

Use words such as “request,” “optional,” and “when supported” in developer documentation. User-facing copy can be simpler, but should not promise universal behavior.

A setting labeled “Haptics” may be familiar to some users, while “Vibration feedback” is clearer in a broad audience. Use the product’s language conventions and test comprehension. The setting must have an accessible name and a visible checked state.

Do not expose technical API return values to ordinary users. A diagnostic view for developers may report “request accepted by browser,” but that is not a user-facing success state.



## Test case: API missing

Arrange a test environment where `navigator` is absent or has no `vibrate` method. Invoke the semantic request and assert that it returns a safe false-like result and does not throw. Then verify the main action still changes state and displays its normal status message.

Test both an entirely absent navigator and an object that exists without a vibration method. This catches code that checks only for `navigator` but assumes the method is present.



## Test case: disabled preference

Set the preference to disabled and invoke each semantic pattern. Assert that no vibration call occurs. If a pattern was already active, assert that disabling the setting attempts cancellation where the API is available.

Verify that turning the preference off does not undo the user’s main action, close a dialog unexpectedly, or hide the visible confirmation. It should affect only the optional feedback channel.



## Test case: async success and failure

Mock a save operation that resolves and verify that the success status appears and the haptic request is made only after resolution. Then mock a rejection and verify the error message appears, the recovery path is clear, and the success pattern is not requested.

Test a rapid double submission. Ensure the application prevents duplicate business operations according to its own rules while the haptic cooldown remains independent from action correctness.



## Test case: keyboard and assistive technology

Activate the button with Enter and Space where the native button behavior supports them. Confirm that the action and status update are the same as pointer activation. Do not require a pointer event to trigger the haptic request.

Use a screen reader to confirm the status message is concise and not announced repeatedly. Avoid updating a live region on every frame or for every minor internal event.



## Test case: real-device validation

Test the same pattern on more than one physical device if the feature is important. Perceived intensity and timing may vary, and a test on one model does not establish universal behavior.

Include a device/browser combination where the API is unavailable or blocked. The interface should not display a failure banner merely because the optional cue could not be requested.



## Code review prompts

Can a reviewer identify every place that requests vibration by searching for the central utility? If not, direct API calls may be scattered and difficult to govern.

Does the code use semantic pattern names instead of unexplained durations at call sites? Are pattern values documented and intentionally limited?

Does the request occur after the actual result is known? If it is tied to a promise, state transition, or server response, is the order correct?

Is the fallback path explicitly tested, or is the implementation only exercised on one phone?

Can a user disable the feature without navigating through multiple screens or reloading the application?

Does the code make any claim that a haptic was delivered when it only knows a request was accepted?



## Design review prompts

Would the interaction still be understandable if the user had no tactile sensation? If not, add a visible or textual signal before shipping.

Is the cue worth the sensory interruption? If removing it would not meaningfully reduce understanding, remove it.

Does the cue repeat so frequently that it becomes background noise? Reduce frequency or trigger only on state transitions.

Could the cue surprise someone who is simply exploring the interface? Make the trigger deliberate and the preference discoverable.

Are error messages and recovery instructions sufficient without vibration? Ensure they are.

Is the pattern vocabulary consistent enough that repeated use creates a stable expectation? Avoid one-off novelty patterns.



## Operational guidance

Keep a small compatibility note in the project documentation and revisit it when the supported browser matrix changes. Browser behavior evolves, and feature support should be verified against the application's actual target platforms.

Do not treat the absence of bug reports as proof that vibration works. Most users cannot report a cue that they never expected, and telemetry cannot reliably measure subjective perception.

If a product support ticket concerns missing haptics, first verify the browser and device context, the user preference, the event path, and whether visible feedback worked. Do not suggest that the user’s device is broken merely because the API request was not accepted.

Make haptics easy to remove. Because they are optional, a well-factored implementation should be possible to disable without rewriting the core interaction flow.



## Scenario Notes

### Form submission

A form should announce validation errors next to the affected fields and summarize the outcome. If submission succeeds, update the page or status region before requesting an optional cue. Never vibrate on each keystroke or every invalid field change.

### Shopping cart

Adding an item can produce a brief acknowledgment after the cart state is updated. The visible cart count and confirmation text remain the source of truth. If a network request fails, show a retry path and do not imply that the item was added.

### Toggle or setting

A toggle should change its native checked state and update any dependent content. A haptic cue is optional and should not be the only indication that the value changed. Avoid feedback on focus alone.

### Game control

Use event transitions such as crossing a threshold, collecting an item, or completing a level. Do not tie vibration to the physics engine's update loop. Provide an in-game setting and a way to stop ongoing feedback.

### Drag-and-drop

A cue can mark a successful drop or entry into a valid target. Track whether the target state changed, and avoid repeated pulses while the pointer remains over the same target. Show a clear visual highlight and final placement.

### Slider

For continuous sliders, prefer no cue during every value update. If discrete detents are meaningful, trigger at most once per detent transition and consider waiting until the user releases the control. The numeric value must remain visible or programmatically available.

### Dialog confirmation

When a user confirms an important dialog, wait for the action result before using success feedback. Closing the dialog alone is not proof that the requested operation succeeded.

### Offline state

When a network operation fails because the page is offline, show an actionable offline message. A vibration pattern cannot explain the cause and should not be the primary alert.

### Authentication

For sign-in or security-sensitive actions, prioritize accurate state, readable errors, and secure flow behavior. Avoid using vibration to create urgency or imply that an authentication attempt was accepted before the server confirms it.

### Media controls

A media play/pause action can update the control label and state. Haptics are usually unnecessary for every playback change unless the product has a clear mobile interaction rationale. Never vibrate continuously to match audio playback.

### Navigation

Changing tabs or opening a route usually does not need a cue. If a navigation action is significant, use a consistent pattern sparingly and keep the active tab state visible. Do not vibrate merely because a route mounted.

### Notification-like events

Do not use a page-level haptic call to attract attention to unsolicited background events. Web pages may not be active, and unexpected vibration can be intrusive. Use the platform's intended notification model where applicable and respect user permission.


## Compact API Notes

- `navigator.vibrate(number)` requests one vibration duration in milliseconds.
- `navigator.vibrate(array)` requests an alternating sequence of vibration and pause durations.
- A zero duration or empty pattern can request cancellation in supporting implementations.
- The method may be missing, constrained, ignored, or interrupted.
- A returned Boolean is about the request, not the user’s perception.
- The API does not expose a universal motor-strength control.
- Treat this capability as progressive enhancement and retain visible feedback.
- Never make application correctness depend on a vibration request.

## Final Review

The goal of haptic feedback is not to make a website feel busy or to imitate every native interaction. It is to add a small, deliberate tactile acknowledgment where it improves understanding. The implementation should be easy to audit, easy to disable, easy to test without hardware, and safe to omit entirely. A strong solution has a complete semantic interface first, a carefully designed haptic layer second, and clear documentation about what the browser can and cannot guarantee.
