# Web Audio UI

## Skill Metadata

- **Layer:** `layer-09-physics-audio`
- **Skill directory:** `web-audio-ui`
- **Canonical file:** `web-audio-ui.md`
- **Primary platform API:** Web Audio API
- **Level:** Intermediate
- **Goal:** Build accessible, responsive browser audio controls using a clear audio graph, predictable playback state, user-gesture-safe startup, and reliable resource cleanup.
- **Use this skill when:** An interface needs audio playback, sound effects, volume controls, mute, looping, playback-rate changes, simple mixing, meters, or audio visualization.
- **Not a replacement for:** A full digital audio workstation, professional mastering chain, or a promise that every browser and output device behaves identically.

## Goal

Create a Web Audio interface whose controls reflect the real audio state, whose audio graph has a clear signal path, and whose lifecycle is safe across pause, resume, source changes, page navigation, and browser restrictions. The interface should remain understandable and operable without sound, pointer precision, or visual waveform cues.

## Why This Matters

Audio controls appear simple until the browser blocks autoplay, a track is replaced while it is playing, a source node is started twice, a mute button updates visually but not acoustically, or an `AudioContext` remains alive after the UI disappears. These are not rare edge cases; they are the normal boundary between a web interface and a real-time media subsystem.

The Web Audio API models audio as a directed graph. Sources produce signals, processing nodes modify them, and destination nodes send them to an output. The UI should control that graph through explicit state transitions rather than directly manipulating unrelated DOM properties.

A strong implementation separates four responsibilities:

1. **Transport state:** whether playback is stopped, playing, paused, loading, or failed.
2. **Audio graph:** source, gain, filters, analyzers, and destination routing.
3. **Presentation:** buttons, progress display, meters, captions, and status messages.
4. **Lifecycle:** loading, resuming, disconnecting, and closing resources.

Audio is inherently temporal, so a control should describe what the system is doing now and what will happen when it is activated. A button labeled “Pause” should only be shown while playback is active; a mute control should communicate whether sound is muted; and errors should be surfaced without trapping users in a broken state.

## Core Concepts

### 1. AudioContext as the graph owner

`AudioContext` is the central object for creating nodes and scheduling audio. It can be suspended by browser policy, especially before a user gesture, and its lifecycle should be owned by one player or audio service.

```js
const audioContext = new AudioContext();
```

Prefer lazy initialization from an explicit user action. Do not create a new context on every play click. Reuse the context for multiple sources where possible, and close it when the owning feature is permanently disposed.

### 2. Autoplay and user activation

Browsers commonly restrict audible playback until a user gesture. A robust UI starts or resumes the context inside a click, key activation, or other valid user action.

```js
async function ensureAudioReady() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }
}
```

Treat `resume()` as asynchronous and handle rejection. Do not assume that calling it during page load guarantees audio will work later. Provide a clear Play button and an error or status message when the browser refuses to start audio.

### 3. Audio graph and signal flow

A typical player routes a source through a gain node to the destination:

```js
const source = audioContext.createBufferSource();
const gain = audioContext.createGain();

source.connect(gain);
gain.connect(audioContext.destination);
```

This graph makes volume control explicit. Add a filter or analyzer between nodes when needed. The graph should have a documented signal path, especially if one source feeds both the speakers and a visual analyzer.

### 4. Source node lifecycle

`AudioBufferSourceNode` is one-shot: a source node can be started once. To replay a decoded buffer, create a new source node and connect it to the reusable gain node. This is a common source of “cannot call start more than once” errors.

```js
function createBufferSource(buffer, destination) {
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(destination);
  return source;
}
```

For HTML media elements, use `createMediaElementSource()` to route media through the graph. A media element source has its own lifecycle constraints; do not repeatedly wrap the same media element with new source nodes.

### 5. Loading and decoding audio

Fetch and decode files asynchronously. Show loading state, handle network and decoding failures, and avoid assuming the file is available immediately.

```js
async function loadAudioBuffer(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Audio request failed: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return audioContext.decodeAudioData(arrayBuffer);
}
```

For large files, an HTML `<audio>` element can be more appropriate than decoding the entire asset into memory. Choose based on the product: short sound effects often fit buffer sources; long-form streaming playback may fit a media element.

### 6. Gain and volume

`GainNode` changes signal amplitude. The perceived loudness relationship is not linear, so a slider can map user-friendly values to gain according to the product's needs. Clamp values to a known range and avoid abrupt jumps when adjusting active audio.

```js
gainNode.gain.setTargetAtTime(
  Number(volumeSlider.value),
  audioContext.currentTime,
  0.015
);
```

A short smoothing time can reduce clicks. For mute, prefer a dedicated mute state or a gain target rather than destroying the graph. Remember that gain values above one can amplify and clip a signal; a typical user volume control stays between zero and one.

### 7. Scheduled playback and time

Web Audio scheduling uses the audio context's clock, `audioContext.currentTime`, rather than `Date.now()` as the source of truth for precise audio events. This is useful for sequenced sound effects and crossfades. UI progress, however, may use a display clock and should tolerate drift.

Do not attempt to schedule precise audio by calling `setTimeout()` repeatedly. Timers can be delayed by background throttling. Schedule audio events on the audio clock and use timers or animation frames only to update the display.

### 8. Transport state machine

Model the player as a state machine instead of a collection of unrelated booleans. Typical states include `idle`, `loading`, `ready`, `playing`, `paused`, `ended`, and `error`. Define which transitions are valid and what each control does in each state.

A state machine prevents impossible combinations such as “loading and ended” or a Play button that starts a second source while the first source remains active. It also makes tests easier to write.

### 9. Pause and resume for buffer sources

An `AudioBufferSourceNode` cannot be paused and resumed directly. Track the offset and elapsed playback time, stop the active source, and create a new source for resumption. Use the audio clock and account for playback rate.

For media elements, use the built-in `pause()` and `play()` promises instead. Do not mix these two approaches without a clear abstraction.

### 10. HTMLMediaElement integration

An `<audio>` element provides useful native transport, streaming, and media controls. The Web Audio API can add processing and analysis. If you route it through an audio context, be aware that audible output is routed through the graph and must reach the destination.

```js
const media = document.querySelector("audio");
const mediaSource = audioContext.createMediaElementSource(media);
mediaSource.connect(gainNode);
gainNode.connect(audioContext.destination);
```

Create the media element source once per media element. A common mistake is to connect the same media element to the destination both directly and through the graph, producing duplicate output or confusing volume behavior.

### 11. AnalyserNode and meters

`AnalyserNode` exposes frequency and time-domain data for visualization. It does not need to alter the sound. Use an appropriate FFT size and read data at a sensible rate; do not update a large chart at every possible animation frame without a reason.

```js
const analyser = audioContext.createAnalyser();
analyser.fftSize = 2048;
gainNode.connect(analyser);
analyser.connect(audioContext.destination);
```

This route makes the analyzer part of the signal path. If the analyzer is only used for observation, it can be placed in a branch, but ensure the audible path still reaches the destination.

### 12. Filters and effects

A `BiquadFilterNode` can implement common filter types such as low-pass, high-pass, and peaking EQ. Effect controls should expose sensible ranges and avoid extreme values that can produce unexpected results.

```js
const filter = audioContext.createBiquadFilter();
filter.type = "lowpass";
filter.frequency.value = 12000;

source.connect(filter);
filter.connect(gainNode);
```

Use parameter automation for smooth changes. Abruptly changing frequency or gain can create audible artifacts, especially on sustained signals.

### 13. Crossfades

A crossfade changes two gains over time so one source fades out as another fades in. Schedule ramps against `currentTime` and avoid leaving old sources connected forever. Equal-power crossfades can preserve perceived loudness more naturally than a simple linear crossfade, depending on the material.

### 14. Playback rate and pitch

`AudioBufferSourceNode.playbackRate` changes playback speed and generally affects pitch for buffer playback. Media elements may offer `preservesPitch` behavior depending on browser support. Communicate the behavior in the UI and test the target browsers rather than assuming speed and pitch are independent.

### 15. Error handling

Audio can fail at multiple stages: network fetch, decoding, context resume, source start, media play promise, or device output. Keep errors specific enough to guide recovery without exposing raw stack traces to end users. A failed load should return the UI to a state where the user can retry or select another track.

### 16. State synchronization

Update the UI from actual state transitions and media events, not from a guess about what a click should have done. For an HTML media element, listen to `play`, `pause`, `ended`, `timeupdate`, `loadedmetadata`, and `error` as appropriate. For buffer sources, track start and stop timing explicitly.

### 17. Audio accessibility

Provide labeled controls and a visible status. Do not rely on audio alone to communicate success, failure, or a warning. If audio is essential to understand spoken content, provide captions or a transcript. Avoid automatically playing sound on page load.

### 18. Resource ownership

The player should know which nodes it owns, which media elements it controls, and when the context can be closed. Disconnect obsolete nodes, stop active sources, remove event listeners, and release decoded buffers when they are no longer needed. Do not close a shared context while another feature still uses it.

## Architecture Blueprint

A small but robust player can use these modules:

- `AudioEngine`: owns `AudioContext`, gain, filter, analyzer, source creation, and teardown.
- `TransportController`: manages loading, play, pause, stop, seek, ended, and error transitions.
- `AudioView`: updates buttons, slider labels, progress, and status.
- `AssetLoader`: fetches and decodes audio, caches reusable buffers, and handles aborts.
- `AccessibilityAdapter`: exposes keyboard behavior, labels, live status, and reduced-motion settings for visualizations.

Avoid having a button click handler contain fetch logic, source construction, UI changes, and disposal all at once. Small responsibilities make failures easier to recover from.

## Pattern 1: Lazy AudioContext Creation

```js
let audioContext = null;

function getAudioContext() {
  if (!audioContext || audioContext.state === "closed") {
    audioContext = new AudioContext();
  }
  return audioContext;
}

async function activateAudio() {
  const context = getAudioContext();

  if (context.state !== "running") {
    await context.resume();
  }

  return context;
}
```

Call `activateAudio()` from a user gesture and handle errors at the UI boundary. Do not silently swallow a failed resume.

## Pattern 2: Reusable Gain Stage

```js
let gainNode;

function createOutputStage(context) {
  gainNode = context.createGain();
  gainNode.gain.value = 0.8;
  gainNode.connect(context.destination);
  return gainNode;
}

function setVolume(value) {
  const clamped = Math.min(1, Math.max(0, Number(value)));
  gainNode.gain.setTargetAtTime(
    clamped,
    audioContext.currentTime,
    0.02
  );
}
```

A reusable gain node lets the interface adjust volume without rebuilding the graph. Clamp inputs at the boundary even if the slider itself declares a min and max.

## Pattern 3: One-Shot Buffer Playback

```js
function playBuffer(buffer, output, offset = 0) {
  const context = output.context;
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(output);
  source.start(0, offset);

  source.addEventListener?.("ended", () => {
    source.disconnect();
  });

  return source;
}
```

A new source is created for each playback. Keep the active source reference in the transport controller so stop and pause logic can act on the correct instance.

## Pattern 4: Media Element with Processing

```html
<audio id="track" preload="metadata" src="/audio/ambient.ogg"></audio>
```

```js
const mediaElement = document.querySelector("#track");
const mediaSource = audioContext.createMediaElementSource(mediaElement);
const mediaGain = audioContext.createGain();

mediaSource.connect(mediaGain);
mediaGain.connect(audioContext.destination);
```

This approach suits longer tracks and native media timing. Build the source node once, then change the media element's `src` when needed, calling `load()` where appropriate.

## Pattern 5: Play/Pause with Media Element

```js
async function togglePlayback(media) {
  try {
    if (media.paused || media.ended) {
      await media.play();
    } else {
      media.pause();
    }
  } catch (error) {
    announce("Playback could not start. Try pressing Play again.");
  }
}
```

`play()` returns a promise and may reject. Update the UI from media events and promise outcomes, not immediately on the assumption that playback started.

## Pattern 6: Mute Without Rebuilding the Graph

```js
let muted = false;
let previousVolume = 0.8;

function toggleMute() {
  muted = !muted;

  gainNode.gain.setTargetAtTime(
    muted ? 0 : previousVolume,
    audioContext.currentTime,
    0.015
  );

  muteButton.setAttribute("aria-pressed", String(muted));
  muteButton.textContent = muted ? "Unmute" : "Mute";
}
```

Keep volume and mute state separate. If the user changes the volume while muted, update the remembered volume without making the output audible until unmuted.

## Pattern 7: Smooth Filter Control

```js
function setLowPassFrequency(value) {
  const frequency = Math.max(40, Math.min(18000, Number(value)));
  filter.frequency.setTargetAtTime(
    frequency,
    audioContext.currentTime,
    0.03
  );
}
```

A range slider should expose a human-readable value, such as “Low-pass frequency: 4.5 kHz.” Avoid announcing every intermediate value to a screen reader while the user drags; update a nearby value label and announce on completion if needed.

## Pattern 8: Audio Meter Loop

```js
const samples = new Uint8Array(analyser.frequencyBinCount);
let meterFrame = 0;

function updateMeter() {
  analyser.getByteFrequencyData(samples);
  drawMeter(samples);
  meterFrame = requestAnimationFrame(updateMeter);
}

function stopMeter() {
  cancelAnimationFrame(meterFrame);
}
```

Use an animation loop only while the visualization is visible and relevant. If the page is hidden or the user enables reduced motion, reduce the update rate or stop decorative animation while keeping audio playback behavior independent.

## Pattern 9: Loading with Explicit UI State

```js
async function loadTrack(url) {
  setPlayerState("loading");

  try {
    const buffer = await loadAudioBuffer(url);
    currentBuffer = buffer;
    setPlayerState("ready");
  } catch (error) {
    setPlayerState("error");
    announce("The audio could not be loaded. Check the connection and retry.");
  }
}
```

For production, use an `AbortController` or request token so a slow request for an old track cannot overwrite the state for a newer selection.

## Pattern 10: Buffer Pause and Resume Offset

```js
let activeSource = null;
let startedAt = 0;
let pausedOffset = 0;
let isPlaying = false;

function startBufferPlayback(buffer) {
  const context = getAudioContext();
  activeSource = context.createBufferSource();
  activeSource.buffer = buffer;
  activeSource.connect(gainNode);
  startedAt = context.currentTime;
  activeSource.start(0, pausedOffset);
  isPlaying = true;
}

function pauseBufferPlayback() {
  if (!activeSource || !isPlaying) return;

  pausedOffset += audioContext.currentTime - startedAt;
  activeSource.stop();
  activeSource.disconnect();
  activeSource = null;
  isPlaying = false;
}
```

This simple offset calculation assumes playback rate remains one. If rate changes, accumulate elapsed audio time multiplied by the active rate, or use a more explicit transport timeline. Clamp the offset to the buffer duration and reset it on track change.

## Pattern 11: Scheduled Crossfade

```js
function crossfade(oldGain, newGain, duration = 1) {
  const now = audioContext.currentTime;
  const end = now + Math.max(0.01, duration);

  oldGain.gain.cancelScheduledValues(now);
  newGain.gain.cancelScheduledValues(now);

  oldGain.gain.setValueAtTime(oldGain.gain.value, now);
  newGain.gain.setValueAtTime(newGain.gain.value, now);

  oldGain.gain.linearRampToValueAtTime(0, end);
  newGain.gain.linearRampToValueAtTime(1, end);
}
```

For a more consistent perceived loudness, use an equal-power curve and test with the actual audio. Before crossfading, ensure the incoming source is ready and connected.

## Pattern 12: Visibility-Aware Visualization

```js
function onVisibilityChange() {
  if (document.hidden) {
    cancelAnimationFrame(meterFrame);
  } else if (visualizationEnabled) {
    meterFrame = requestAnimationFrame(updateMeter);
  }
}

document.addEventListener("visibilitychange", onVisibilityChange);
```

Do not automatically pause meaningful audio solely because the page becomes hidden unless that matches the product contract. Decorative visual updates can stop while audio continues.

## Pattern 13: Safe Track Replacement

```js
let requestId = 0;

async function selectTrack(url) {
  const id = ++requestId;
  setPlayerState("loading");

  try {
    const buffer = await loadAudioBuffer(url);
    if (id !== requestId) return;

    stopActiveSource();
    currentBuffer = buffer;
    pausedOffset = 0;
    setPlayerState("ready");
  } catch (error) {
    if (id !== requestId) return;
    setPlayerState("error");
  }
}
```

A request token prevents late responses from replacing a newer selection. For fetch-based loading, abort the previous request when practical and still verify the active request before applying its result.

## Pattern 14: Idempotent Teardown

```js
let disposed = false;

function disposeAudioPlayer() {
  if (disposed) return;
  disposed = true;

  stopActiveSource();
  cancelAnimationFrame(meterFrame);
  document.removeEventListener("visibilitychange", onVisibilityChange);

  mediaElement?.removeEventListener("play", onMediaPlay);
  mediaElement?.removeEventListener("pause", onMediaPause);

  sourceNode?.disconnect();
  filterNode?.disconnect();
  analyserNode?.disconnect();
  gainNode?.disconnect();
}
```

If the context is owned exclusively by this player, close it after stopping sources and disconnecting nodes. If it is shared, the owner should manage context shutdown.

## Pattern 15: Semantic Controls and Status

```html
<div class="audio-player" aria-labelledby="audio-title">
  <h2 id="audio-title">Ambient Sound</h2>
  <button type="button" id="play-button">Play</button>
  <button type="button" id="mute-button" aria-pressed="false">Mute</button>
  <label for="volume">Volume</label>
  <input id="volume" type="range" min="0" max="1" step="0.01" value="0.8">
  <p id="audio-status" role="status" aria-live="polite">Ready to play.</p>
</div>
```

Use native controls where possible. Add a seek control only if the transport supports seeking, and label its current value in a way that communicates time or progress.

## Pattern 16: Source and Destination Graph Branches

```js
source.connect(gainNode);
gainNode.connect(audioContext.destination);
gainNode.connect(analyserNode);
```

A node can have multiple outgoing connections. Decide whether analysis should happen before or after volume control: before gain shows the source's level; after gain shows the user-adjusted output level. Keep the graph diagram or comments aligned with the actual routing.

## Pattern 17: Error Recovery and Retry

```js
async function handlePlayRequest() {
  try {
    await activateAudio();
    await beginPlayback();
    setPlayerState("playing");
  } catch (error) {
    setPlayerState("error");
    announce("Audio could not start. Use Retry to try again.");
  }
}
```

A Retry button should rerun the required activation and playback sequence. Do not permanently disable the player after one rejection unless the underlying asset is known to be unavailable.

## Pattern 18: Separate Audio Clock from UI Clock

Use `audioContext.currentTime` to schedule sound and measure buffer-source playback. Use `requestAnimationFrame()` to paint meters or progress. On each display update, derive the display from the current transport model; do not assume the animation frame is a precise clock.

## Mental Models

### 1. Audio is a graph, not a file player

The source is only one node in a signal path. Gain, filters, analyzers, compressors, and destination routing all affect the outcome. Debug by tracing connections from source to destination.

### 2. The audio clock is not the wall clock

The audio context clock is designed for audio scheduling. JavaScript timers and animation frames are for orchestration and display. Use the right clock for the job.

### 3. A source node is disposable; the engine is reusable

A buffer source plays once, while a context and reusable processing nodes can serve multiple playbacks. Separate source lifetime from engine lifetime.

### 4. UI state is a reflection, not a prediction

A click requests a transition. A promise, media event, or known transport transition confirms what happened. Render the UI from the resulting state.

### 5. Muting is not the same as pausing

Mute keeps transport running but silences output. Pause stops or suspends playback progression. Keep these controls distinct in both behavior and labels.

### 6. Loading is part of playback

Audio fetching and decoding take time and can fail. Treat loading, ready, playing, paused, ended, and error as real states rather than brief implementation details.

### 7. The context has ownership

A shared context can support multiple sources and effects. The component that owns the context decides when it can be closed; an individual track should not close shared infrastructure.

### 8. Accessibility does not depend on sound

Status, errors, and controls must be available visually and semantically. Audio feedback should supplement the interface, not be the only way to understand it.

### 9. Visual meters are optional presentation

The audio graph can continue working even when a meter is hidden. Rendering frequency should not dictate the timing of audio.

### 10. Smoothing prevents discontinuities

Abrupt gain or filter changes can create clicks and harsh transitions. Schedule parameter changes using the audio clock when smoothness matters.

### 11. Long tracks and short effects have different needs

Decoded buffers offer precise scheduling but consume memory. Media elements are often better suited to long streaming content. Choose by asset length, seeking requirements, and control needs.

### 12. Cleanup is part of correctness

An abandoned animation loop or connected node is not merely untidy. It can waste CPU, retain memory, or keep audio active after the interface disappears.

## Gotchas

1. `AudioContext` may start suspended because of autoplay restrictions.
2. `resume()` can reject and must be handled.
3. An `AudioBufferSourceNode` cannot be started twice.
4. Buffer-source pause/resume requires offset tracking and a new source.
5. `createMediaElementSource()` should not be repeated for the same element.
6. A source that is not connected to the destination path will not be audible.
7. A media element routed through Web Audio needs a valid graph path to output.
8. A gain slider should clamp values and avoid sudden jumps.
9. Mute and volume are separate state variables.
10. `play()` on an HTML media element returns a promise.
11. Decoding and fetching can fail independently.
12. A late load response can replace a newer track unless guarded.
13. `currentTime` is not interchangeable with `Date.now()`.
14. Timer callbacks can be delayed in background tabs.
15. An analyzer does not automatically make a graph audible.
16. Very frequent visualization updates can waste CPU while hidden.
17. A context shared by several features must not be closed by one child component.
18. Removing DOM does not automatically disconnect every audio node.
19. Repeatedly creating contexts can exhaust browser resources.
20. Changing a filter abruptly can cause audible artifacts.

## Common Mistakes and Corrections

| Mistake | Why it fails | Better approach |
|---|---|---|
| Creating a context on every Play click | Wastes resources and can hit browser limits | Reuse one context per audio service |
| Starting audio on page load | Browser may block audible autoplay | Start or resume from a user gesture |
| Ignoring `resume()` rejection | UI can claim playback is active when it is not | Handle the promise and expose retry |
| Calling `start()` twice on a buffer source | Buffer source nodes are one-shot | Create a fresh source for each playback |
| Trying to pause a buffer source directly | It has no native pause operation | Track offset, stop, then create a new source |
| Reusing a media element source node incorrectly | A media element source has lifecycle constraints | Create it once and reuse the element |
| Forgetting to connect to destination | The graph produces no audible output | Trace the graph to `audioContext.destination` |
| Connecting direct and processed media paths unintentionally | Audio may play twice or bypass volume | Choose one clear output path |
| Setting gain immediately for every slider event | Fast jumps may click or sound rough | Use parameter smoothing |
| Letting gain exceed intended range | Output may clip | Clamp and document volume mapping |
| Treating mute as pause | Transport semantics become confusing | Keep mute and playback state separate |
| Updating the Play label before playback succeeds | The browser may reject the request | Update from promise outcome and media events |
| Not handling decode errors | UI can remain stuck in loading | Add an error state and retry |
| Letting an old fetch win a race | A previous track can replace the selected one | Abort old requests or use request tokens |
| Using wall-clock timers for musical scheduling | Timers are not precise enough | Schedule with `currentTime` |
| Using RAF as the audio clock | RAF may be throttled or paused | Use RAF only for presentation |
| Leaving analyzer loops running when hidden | Wastes battery and CPU | Pause or throttle visualization |
| Closing a shared context in a child component | Other audio features stop working | Let the context owner close it |
| Removing the UI without disconnecting nodes | Resources and audio can remain active | Implement explicit teardown |
| Announcing every meter frame to screen readers | Creates unusable announcement spam | Announce only meaningful state changes |
| Using unlabeled range inputs | Assistive technology cannot identify purpose | Associate visible labels |
| Relying on color-only meter meaning | Users may miss critical information | Add text or labels where meaningful |
| Playing alerts at full volume | Startles users and can cause discomfort | Use moderate level, user controls, and restraint |
| Assuming all browsers support identical pitch behavior | Playback-rate results differ | Test target browsers and describe behavior |
| Not stopping the old source on track change | Old and new audio can overlap unexpectedly | Stop and disconnect the old source deliberately |
| Failing to reset the offset on track change | New track may start at an invalid time | Reset transport position when selecting new media |
| Closing the context before stopping nodes | Teardown may be inconsistent | Stop sources, disconnect, then close owned context |
| Ignoring media `error` events | UI can show stale playback state | Listen for media lifecycle events |
| Treating audio output as guaranteed | Device routing or permission conditions can fail | Provide state feedback and retry paths |

## Semantic HTML and Accessibility

Use native controls first. A player should work with keyboard navigation and assistive technology, and should never require a user to hear a sound to understand a status change.

### Semantic HTML example

```html
<section class="player" aria-labelledby="player-heading">
  <h2 id="player-heading">Audio preview</h2>
  <p id="player-help">Press Play to listen. Volume can be changed at any time.</p>

  <div role="group" aria-label="Playback controls">
    <button type="button" id="play-toggle" aria-describedby="player-help">Play</button>
    <button type="button" id="mute-toggle" aria-pressed="false">Mute</button>
  </div>

  <label for="volume-control">Volume</label>
  <input id="volume-control" type="range" min="0" max="1" step="0.01" value="0.8">

  <p id="player-status" role="status" aria-live="polite">Ready to play.</p>
</section>
```

### Accessibility checklist

1. Do not autoplay audible content without a clear user action.
2. Give Play, Pause, Stop, Mute, and other controls visible names.
3. Use native `<button>`, `<input>`, and `<label>` elements.
4. Ensure the volume slider has an associated label and a meaningful value.
5. Use `aria-pressed` for toggle buttons when the control is genuinely a toggle.
6. Make all controls operable with keyboard alone.
7. Keep visible focus styles and logical tab order.
8. Announce loading, failure, playback start, and completion when those changes matter.
9. Avoid announcing every `timeupdate` or meter sample to a live region.
10. Provide transcripts or captions for spoken content where appropriate.
11. Provide visual feedback for important sound-only events.
12. Avoid startling sounds and offer a user-controlled volume.
13. Respect reduced-motion preferences for animated meters and visualizers.
14. Keep decorative animations separate from audio transport.
15. Ensure controls remain usable at high zoom and on narrow screens.
16. Do not use color alone to communicate muted or active states.
17. Ensure disabled controls have a clear reason and become enabled when appropriate.
18. Do not steal focus when playback begins or ends.
19. Explain keyboard shortcuts in visible help text if shortcuts exist.
20. Test with keyboard-only navigation and at least one screen reader.

### State announcement example

```js
function announce(message) {
  statusElement.textContent = message;
}

function renderTransportState(state) {
  const isPlaying = state === "playing";
  playButton.textContent = isPlaying ? "Pause" : "Play";
  playButton.setAttribute("aria-label", isPlaying ? "Pause audio" : "Play audio");
}
```

Avoid announcing the same message on every render. Call `announce()` only when a meaningful transition occurs.

## Performance Notes

1. Reuse an audio context rather than creating one per interaction.
2. Reuse gain and filter nodes when their role is stable.
3. Create one-shot buffer source nodes only when a playback begins.
4. Disconnect stopped sources and obsolete graph branches.
5. Cache decoded buffers when repeated playback justifies the memory.
6. Prefer media elements for long tracks when streaming and seeking are important.
7. Keep audio graph routing simple and documented.
8. Choose analyzer FFT size and update rate based on actual visual needs.
9. Stop decorative meter animation when the visualization is hidden.
10. Avoid allocating new typed arrays every animation frame.
11. Avoid excessive parameter automation events from noisy pointer movement.
12. Use smoothing for volume and filter changes rather than rebuilding the graph.
13. Use request cancellation or request tokens to prevent stale loads.
14. Limit simultaneous sound effects and avoid unnecessary overlapping sources.
15. Close an owned context when the feature is permanently disposed.
16. Profile on mobile devices; audio, canvas, and UI work compete for the same resources.
17. Keep large decoded buffers out of long-lived caches unless reuse is likely.
18. Do not log per-frame audio data in production.

## Testing Strategy

### Functional checks

- Play starts only after a valid user action and handles rejected promises.
- Pause and resume preserve the expected position for the chosen playback model.
- Replaying a buffer creates a fresh source node.
- Mute silences output while preserving the stored volume.
- Volume changes smoothly and stays within the defined range.
- Track replacement stops or crossfades the previous source intentionally.
- Decode and network failures show a recoverable error state.
- Ended playback returns the UI to the correct state.

### Browser and lifecycle checks

- Test current supported desktop and mobile browsers.
- Test first interaction after page load and after returning from a background tab.
- Test route unmount while audio is playing.
- Test repeated mount/unmount for duplicate listeners and contexts.
- Test long tracks and short effects separately.
- Test with audio output unavailable or blocked where feasible.
- Test keyboard navigation, focus visibility, zoom, and screen-reader announcements.

### State-transition matrix

| Current state | Action or event | Expected result |
|---|---|---|
| idle | Play | loading or playing, depending on asset readiness |
| loading | load success | ready |
| loading | load failure | error with retry |
| ready | Play | playing after activation succeeds |
| playing | Pause | paused |
| playing | natural end | ended |
| paused | Play | playing from stored position |
| any active state | Select new track | old request/source is retired |
| error | Retry | loading or ready |
| any state | Dispose | all owned work stops |

## Teardown and Resource Lifecycle

Teardown is part of the feature contract. It should be idempotent and should stop active sources, stop visual loops, remove listeners, disconnect nodes, and close the context only when this player owns it.

### Teardown checklist

1. Mark the player as disposed so new actions are rejected.
2. Stop the active buffer source or pause the media element.
3. Cancel analyzer and progress animation frames.
4. Remove DOM and media event listeners.
5. Disconnect nodes owned by the player.
6. Abort pending fetches or invalidate their request tokens.
7. Clear references to active sources and decoded buffers when no longer needed.
8. Close the context only if it is not shared.
9. Clear status timers or queued presentation events.
10. Make repeated disposal calls safe.

```js
async function dispose() {
  if (disposed) return;
  disposed = true;

  cancelAnimationFrame(meterFrame);
  cancelAnimationFrame(progressFrame);
  abortController?.abort();

  if (activeSource) {
    try {
      activeSource.stop();
    } catch {
      // The source may already have ended.
    }
    activeSource.disconnect();
    activeSource = null;
  }

  mediaElement?.pause();
  document.removeEventListener("visibilitychange", onVisibilityChange);

  for (const node of ownedNodes) {
    node.disconnect();
  }
  ownedNodes.clear();

  if (ownsAudioContext && audioContext?.state !== "closed") {
    await audioContext.close();
  }
}
```

Do not blindly close a context that belongs to a shared application service. For shared contexts, dispose only this player's nodes and let the service decide when the context can be closed.

## Quick Reference

| Need | Preferred approach | Avoid |
|---|---|---|
| Create audio engine | Lazy, reusable `AudioContext` | One context per click |
| Start audio | Resume from user gesture | Audible autoplay assumption |
| Build signal path | Source → processing → destination | Disconnected graph |
| Buffer replay | Create a fresh source node | Starting the same source twice |
| Long track | Consider `<audio>` element | Decoding huge assets without need |
| Volume | Reusable `GainNode` | Rebuilding the graph for every change |
| Mute | Separate mute state | Overwriting stored volume |
| Smooth parameter change | `setTargetAtTime()` or scheduled ramps | Abrupt changes on every event |
| Schedule audio | `audioContext.currentTime` | Repeated `setTimeout()` scheduling |
| Pause media element | `pause()` and `play()` | Manual offset tracking unnecessarily |
| Pause buffer source | Store offset and create a new source | Expecting native pause support |
| Visual meter | `AnalyserNode` with bounded update rate | Per-frame allocation and hidden loops |
| Handle load error | Error state and retry | Infinite loading spinner |
| Replace track | Cancel/invalidate old load and stop old source | Allowing stale requests to win |
| Announce status | Polite live region on transitions | Announcing every progress tick |
| Teardown nodes | Stop, disconnect, clear listeners | Removing only the DOM |
| Close context | Only if owned | Closing a shared context from a child |
| Browser support | Test target browsers | Assuming identical behavior everywhere |
| Audio captions | Transcript or captions for speech | Sound-only information |
| Volume slider | Labeled native range input | Unlabeled custom slider |
| Background tab | Keep audio policy separate from visual updates | Coupling audio to RAF |
| Crossfade | Schedule gain automation | Abruptly swapping active sources |
| Playback rate | Explain speed/pitch behavior | Assuming pitch is always preserved |
| Resource cache | Cache selectively | Retaining every decoded file forever |
| Error messages | Actionable, user-friendly recovery | Raw stack traces in the UI |

## Definition of Done

- [ ] Audio context creation is centralized and not repeated on every click.
- [ ] The first audible start is initiated through a user action.
- [ ] Context resume and media play promises are handled.
- [ ] The audio graph has a clear source-to-destination path.
- [ ] Buffer source nodes are created anew for each playback.
- [ ] The selected playback model has correct pause/resume behavior.
- [ ] Loading, ready, playing, paused, ended, and error states are represented.
- [ ] Volume is clamped and changes smoothly.
- [ ] Mute state is separate from stored volume.
- [ ] Track changes cannot be overwritten by stale asynchronous loads.
- [ ] Analyzer updates are bounded and stop when not needed.
- [ ] UI labels and status reflect actual playback transitions.
- [ ] Controls are semantic, named, and keyboard-operable.
- [ ] Spoken content has captions or transcripts where appropriate.
- [ ] Visual effects respect reduced-motion preferences.
- [ ] Teardown stops sources, cancels loops, removes listeners, and disconnects owned nodes.
- [ ] Shared context ownership is documented.
- [ ] Repeated mount/unmount has been tested.
- [ ] Error and retry flows have been tested.
- [ ] The experience works without relying solely on sound or color.

## Build Challenge: Accessible Audio Control Deck

Build a compact audio player for a short sound-effect library and one long ambient track. Meet all ten requirements:

1. **Central engine:** Create one lazy `AudioContext` service and reuse its output gain stage.
2. **Two playback models:** Use decoded buffer playback for short effects and an HTML media element for the long ambient track.
3. **Transport state:** Represent loading, ready, playing, paused, ended, and error states with explicit transitions.
4. **Volume and mute:** Provide a labeled volume slider and a separate mute toggle with smooth gain changes.
5. **Track replacement:** Prevent stale requests from overwriting the current selection and stop old sources intentionally.
6. **Visualization:** Add a simple analyzer-driven meter that pauses its decorative animation when hidden.
7. **Recovery:** Handle network, decode, autoplay, and media-play failures with actionable retry UI.
8. **Accessibility:** Use semantic buttons and labels, keyboard support, focus styles, polite status announcements, and captions or transcripts for spoken content.
9. **Lifecycle:** Implement an idempotent `dispose()` function that cancels loops, removes listeners, stops sources, disconnects owned nodes, and respects shared-context ownership.
10. **Verification:** Test repeated playback, mute/volume interaction, pause/resume, track switching, background/foreground behavior, keyboard operation, and teardown.

### Suggested project structure

```text
audio-control-deck/
├── index.html
├── src/
│   ├── main.js
│   ├── audio/
│   │   ├── audio-engine.js
│   │   ├── buffer-player.js
│   │   ├── media-player.js
│   │   └── asset-loader.js
│   ├── state/
│   │   └── transport-controller.js
│   ├── ui/
│   │   ├── player-controls.js
│   │   ├── meter.js
│   │   └── status.js
│   └── styles.css
└── README.md
```

### Acceptance tests

- The first Play action resumes the audio context and reports failures clearly.
- Replaying a short effect works repeatedly without attempting to restart a one-shot source.
- The long track can pause and resume using media-element semantics.
- Mute silences output and unmute restores the remembered volume.
- Switching tracks cannot be undone by a late response from the previous request.
- The analyzer visualization stops its animation loop when hidden.
- Loading and playback errors expose a retry path.
- Every essential action can be completed with a keyboard.
- Screen readers receive meaningful state transitions but not a stream of progress announcements.
- Disposing the player stops owned audio work without closing a shared context.

## Final Engineering Principles

Build the audio graph deliberately, use the audio clock for scheduling, and let explicit state transitions drive the interface. Treat browser activation rules and asynchronous failures as ordinary product behavior, not exceptional afterthoughts. Reuse the context and stable processing nodes, create one-shot source nodes only when needed, and make cleanup ownership explicit.

The best audio UI is not the one with the most effects. It is the one that starts when the user asks, changes volume predictably, recovers when loading or playback fails, communicates state accessibly, and leaves no unwanted work running after it is gone.
