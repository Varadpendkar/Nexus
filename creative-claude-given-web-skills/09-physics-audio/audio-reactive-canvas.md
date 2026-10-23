# Audio Reactive Canvas

## Skill Metadata

- **Layer:** `layer-09-physics-audio`
- **Skill directory:** `audio-reactive-canvas`
- **Canonical file:** `audio-reactive-canvas.md`
- **Primary APIs:** Web Audio API, Canvas 2D, `requestAnimationFrame`
- **Level:** Intermediate
- **Goal:** Turn live audio-analysis data into a responsive, performant canvas visualization without coupling audio playback to drawing cadence.
- **Use this skill when:** Building music visualizers, audio-reactive backgrounds, waveform displays, sound-driven particles, spectrum bars, or ambient visual feedback.
- **Not a replacement for:** A full audio analysis system, a musical beat-tracking algorithm, or an accessibility alternative for spoken content.

## Goal

Build an audio-reactive canvas where audio is analyzed through an `AnalyserNode`, visualization data is sampled intentionally, and canvas drawing remains a presentation layer. The implementation should avoid per-frame allocation, stop unnecessary work when hidden, respect reduced-motion preferences, and communicate meaningful information without depending only on color or movement.

The key design rule is simple: **audio playback must not depend on the canvas animation loop**. If a visualization is paused, hidden, or reduced to a static state, audio should continue according to the player's transport policy.

## Why This Matters

Audio-reactive visuals can make an experience feel expressive and alive, but they can also become expensive and inaccessible quickly. A naive implementation creates a new typed array on every frame, samples the analyser multiple times, resizes the canvas without accounting for device pixel ratio, and draws hundreds of particles even when the tab is hidden. It may look fine on a desktop while draining battery or stuttering on a phone.

A reliable design separates five concerns:

1. **Audio source and routing:** the media or buffer source, processing nodes, and output.
2. **Analysis:** frequency bins or time-domain samples from an `AnalyserNode`.
3. **Feature extraction:** values such as average energy, bass energy, treble energy, or waveform peaks.
4. **Visualization model:** smoothed values, particles, geometry, colors, and layout.
5. **Canvas renderer:** device-pixel sizing, drawing, clearing, and lifecycle.

The analyser provides data; it does not decide what a musical event means. A spectrum peak is not necessarily a beat, and a loudness estimate is not a calibrated decibel meter. Name derived values honestly and tune them against the actual content.

## Core Concepts

### 1. AnalyserNode fundamentals

`AnalyserNode` exposes frequency-domain and time-domain data from an audio graph. It can be used to read spectral magnitudes or waveform samples without changing the audio signal.

```js
const analyser = audioContext.createAnalyser();
analyser.fftSize = 2048;
source.connect(analyser);
analyser.connect(audioContext.destination);
```

The graph must still reach the destination if the audio should be audible. If a gain node is present, choose whether the analyser belongs before or after it depending on whether the visualization should represent source energy or user-adjusted output.

### 2. Frequency-domain data

`getByteFrequencyData()` fills a `Uint8Array` with values in the range 0–255 representing frequency-bin magnitudes. `getFloatFrequencyData()` provides decibel-like values. The frequency bins are related to sample rate and FFT size, but bins are not automatically mapped to musical notes.

```js
const frequencyData = new Uint8Array(analyser.frequencyBinCount);
analyser.getByteFrequencyData(frequencyData);
```

Use byte data for straightforward normalized visuals. Use float data when the visual model benefits from decibel-scale reasoning. Avoid claiming the values are calibrated SPL measurements.

### 3. Time-domain data

`getByteTimeDomainData()` provides waveform samples around a centered range. This is useful for waveform traces, oscilloscope lines, and simple amplitude estimates.

```js
const waveform = new Uint8Array(analyser.fftSize);
analyser.getByteTimeDomainData(waveform);
```

A byte waveform typically centers near 128. Normalize it around zero before computing RMS or peak amplitude. Time-domain sampling can reveal the shape of a signal, but it is not a semantic understanding of speech or music.

### 4. FFT size and frequency resolution

`fftSize` controls the analysis window size and must be a power of two within the range supported by the browser. A larger FFT gives more frequency detail but represents a longer time window and may feel less responsive. A smaller FFT reacts faster but gives coarser frequency resolution.

Choose a size based on the visual behavior, not simply the maximum allowed value. Spectrum bars may work well at 1024 or 2048; a fine-grained frequency display may justify a larger window if latency and performance remain acceptable.

### 5. Smoothing time constant

`analyser.smoothingTimeConstant` blends analysis results over time. Higher values make visuals steadier; lower values make them react more sharply. Smoothing can be useful, but it can also hide transients and make the visual response feel delayed.

Tune smoothing alongside the drawing model. If the visual model already applies its own easing, too much analyser smoothing plus too much visual smoothing can make the result sluggish.

### 6. Sample rate and frequency mapping

The Nyquist frequency is half the audio sample rate. The `frequencyBinCount` bins span the usable analysis range. A rough bin frequency is:

```js
const hzPerBin = audioContext.sampleRate / analyser.fftSize;
const frequencyHz = binIndex * hzPerBin;
```

This is a useful mapping for labeling or grouping bins. It does not mean that every bin contains a single isolated frequency; real signals spread energy across windows and bins.

### 7. Feature extraction

Visuals usually need fewer values than the analyser provides. Compute bands or summary features such as low-frequency average, midrange average, high-frequency average, RMS amplitude, or peak magnitude.

```js
function averageBand(data, start, end) {
  const safeStart = Math.max(0, start);
  const safeEnd = Math.min(data.length, end);
  if (safeEnd <= safeStart) return 0;

  let sum = 0;
  for (let i = safeStart; i < safeEnd; i++) sum += data[i];
  return sum / (safeEnd - safeStart) / 255;
}
```

Keep feature extraction separate from drawing. This allows a spectrum bar chart, particle field, and background pulse to use the same analysis snapshot without each sampling the analyser independently.

### 8. RMS amplitude

Root mean square is a simple way to estimate signal energy over a waveform window. Normalize samples around zero, square them, average, then take the square root. It can drive a scale or opacity value more smoothly than a single peak sample.

```js
function rmsFromByteWaveform(data) {
  let sumSquares = 0;
  for (let i = 0; i < data.length; i++) {
    const sample = (data[i] - 128) / 128;
    sumSquares += sample * sample;
  }
  return Math.sqrt(sumSquares / data.length);
}
```

This is a visualization feature, not a calibrated loudness measurement. Content mastering, gain, and frequency weighting all affect perceived loudness.

### 9. Canvas coordinate space and device pixel ratio

The canvas has a CSS display size and an internal bitmap size. If the bitmap is too small, it appears blurry on high-density displays. If it is set to an enormous device-pixel size without a cap, fill and stroke operations can become expensive.

```js
function resizeCanvas(canvas, ctx, width, height, dpr = 1) {
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
```

Use CSS-pixel coordinates after setting the transform. Cap DPR on constrained devices when profiling shows the visual does not justify the cost.

### 10. Clear, redraw, and trails

A frame usually clears the canvas before drawing. Trails can be created by painting a translucent background instead of clearing fully, but this changes the visual model and can create unwanted persistence. Define the intended trail behavior explicitly.

Do not call `canvas.width = canvas.width` every frame as a clearing trick; assigning dimensions resets canvas state and can be costly. Use `clearRect()` for a clean frame.

### 11. Mapping spectrum to visual features

Map a meaningful feature to a controlled range. Bass energy might change a circle radius, high-frequency energy might alter fine particles, and overall RMS might change background intensity. Clamp and smooth the mapping so one loud transient does not throw the scene into an unreadable state.

### 12. Logarithmic frequency grouping

Musical perception is closer to logarithmic than linear frequency spacing. A linear set of bins gives too much visual width to upper frequencies and too little distinction at the low end. Group bins into logarithmically spaced bands for spectrum displays that should resemble perceived pitch distribution.

Use a minimum frequency above zero for logarithmic calculations, and handle ranges with no bins. A logarithmic mapping is a display choice, not a promise of musical-note detection.

### 13. Smoothing the visual model

Use exponential interpolation or damped motion to smooth features before drawing. For frame-rate-independent easing, derive a coefficient from elapsed time.

```js
function smooth(current, target, dt, response = 12) {
  const alpha = 1 - Math.exp(-response * dt);
  return current + (target - current) * alpha;
}
```

This prevents a fixed per-frame easing factor from behaving differently at 30 and 120 FPS. Clamp `dt` after a long pause so the first frame does not create a large visual jump.

### 14. Beat-like transient detection

A simple transient detector can compare current energy against a moving average and trigger when the current value rises sufficiently above the baseline. This can be useful for stylized pulses, but it is not a robust music beat detector. It can fire on speech, noise, or a single loud effect.

Use cooldowns, thresholds, and smoothing. If actual beat tracking is a product requirement, use an appropriate algorithm or library and describe the difference between detected transients and musical beats.

### 15. Particle systems

Particles can respond to frequency bands or amplitude, but they need bounded counts and reusable state. Store position, velocity, age, lifetime, and size in arrays or objects that are created once and updated in place. Avoid allocating a new particle object for every burst on every frame.

A pool allows expired particles to be reused. The canvas should draw only active particles, and a maximum count should prevent long-running sessions from accumulating unbounded state.

### 16. Resize and orientation changes

Observe the canvas container with `ResizeObserver` or handle window resize events. Update bitmap dimensions and projection/layout values together. Repeatedly resizing the canvas resets its drawing state, so only apply changes when dimensions or DPR actually changed.

### 17. Visibility and reduced motion

When the page is hidden, stop or slow the visualization loop. When `prefers-reduced-motion: reduce` is active, provide a calmer mode such as static spectrum bars, low-amplitude changes, or a user-controlled animation toggle. Audio playback and analysis can continue if that is the intended product behavior.

### 18. Avoiding allocation and garbage collection

Allocate typed arrays once after choosing the FFT size. Reuse particles and drawing structures. A frame loop should not build large arrays, create gradients unnecessarily, or generate thousands of short-lived objects. Cache stable gradients and paths when appropriate.

### 19. Rendering frequency and analysis cadence

Sampling analysis at every animation frame is often adequate, but the renderer does not need to redraw faster than the display can present. For expensive visualizations, sample at a lower rate or decouple analysis from drawing. Always ensure audio playback remains independent.

### 20. Color and contrast

A vibrant spectrum may be attractive but still fail contrast or meaning requirements. Avoid color-only status communication. Provide text or labels where a user needs to understand a selected mode, a warning, or a meaningful level. Decorative visualization can be hidden from assistive technology if it adds no semantic content.

## Architecture Blueprint

Use a small pipeline:

1. **Audio engine** routes the source through processing and an analyser.
2. **Sampler** reads frequency and/or waveform data into reusable buffers.
3. **Feature extractor** computes compact values such as band energy and RMS.
4. **Visual model** smooths features and updates particles or shape state.
5. **Renderer** draws the current model in CSS-pixel coordinates.
6. **Lifecycle controller** starts and stops loops, handles resize/visibility, and disposes listeners.

Keep the feature extractor independent from canvas drawing. If you change the visual style, you should not have to rebuild the audio graph.

## Pattern 1: Basic Analyzer Graph

```js
const analyser = audioContext.createAnalyser();
analyser.fftSize = 2048;
analyser.smoothingTimeConstant = 0.72;

source.connect(analyser);
analyser.connect(audioContext.destination);

const frequencyData = new Uint8Array(analyser.frequencyBinCount);
const waveformData = new Uint8Array(analyser.fftSize);
```

The arrays are allocated once and reused. If a gain node is part of the path, choose the analyzer's location intentionally and keep a single audible path to the destination.

## Pattern 2: Single Analysis Snapshot per Frame

```js
function sampleAudio() {
  analyser.getByteFrequencyData(frequencyData);
  analyser.getByteTimeDomainData(waveformData);

  return {
    bass: averageBand(frequencyData, 0, 12),
    mids: averageBand(frequencyData, 12, 90),
    highs: averageBand(frequencyData, 90, 260),
    rms: rmsFromByteWaveform(waveformData),
  };
}
```

The exact bin ranges depend on sample rate, FFT size, and the intended frequency bands. Treat these as starter ranges to tune, not universal musical definitions. Sample once and share the snapshot among visual features.

## Pattern 3: Frame-Rate-Independent Animation Loop

```js
let rafId = 0;
let previousTime = 0;
let running = false;

function animate(now) {
  if (!running) return;

  const dt = previousTime
    ? Math.min((now - previousTime) / 1000, 0.05)
    : 0;
  previousTime = now;

  const features = sampleAudio();
  updateVisualModel(features, dt);
  drawScene();

  rafId = requestAnimationFrame(animate);
}

function startVisualization() {
  if (running) return;
  running = true;
  previousTime = 0;
  rafId = requestAnimationFrame(animate);
}

function stopVisualization() {
  running = false;
  cancelAnimationFrame(rafId);
}
```

The loop has one owner and cannot be started twice accidentally. It clamps `dt` so returning from a background tab does not create a huge particle movement step.

## Pattern 4: Spectrum Bars

```js
function drawSpectrum(ctx, data, width, height, barCount = 64) {
  ctx.clearRect(0, 0, width, height);

  const barWidth = width / barCount;
  for (let bar = 0; bar < barCount; bar++) {
    const start = Math.floor((bar / barCount) * data.length);
    const end = Math.max(start + 1, Math.floor(((bar + 1) / barCount) * data.length));

    let peak = 0;
    for (let i = start; i < Math.min(end, data.length); i++) {
      peak = Math.max(peak, data[i]);
    }

    const normalized = peak / 255;
    const barHeight = normalized * height;
    ctx.fillRect(bar * barWidth, height - barHeight, Math.max(1, barWidth - 1), barHeight);
  }
}
```

This max-bin strategy is simple and preserves narrow peaks, but it can make bars twitchy. Average each group or smooth bar heights if a calmer display is desired. Use logarithmic grouping for a more perceptually useful frequency layout.

## Pattern 5: Waveform Trace

```js
function drawWaveform(ctx, data, width, height) {
  ctx.clearRect(0, 0, width, height);
  ctx.beginPath();

  for (let i = 0; i < data.length; i++) {
    const x = (i / (data.length - 1)) * width;
    const y = (data[i] / 255) * height;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.stroke();
}
```

This displays the sampled waveform. It is not a spectrogram or a transcription of the sound. For dense samples on a small canvas, downsample to the number of horizontal pixels to reduce unnecessary path commands.

## Pattern 6: Smooth Feature Values

```js
let smoothedBass = 0;
let smoothedRms = 0;

function updateVisualModel(features, dt) {
  smoothedBass = smooth(smoothedBass, features.bass, dt, 10);
  smoothedRms = smooth(smoothedRms, features.rms, dt, 14);
}
```

Use different response rates for different visual channels. A slow background pulse and a quick spectrum bar need not share the same smoothing value.

## Pattern 7: Bass-Responsive Circle

```js
function drawPulse(ctx, cx, cy, baseRadius, bass, rms) {
  const radius = baseRadius + bass * 70 + rms * 20;
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(1, radius), 0, Math.PI * 2);
  ctx.stroke();
}
```

Keep the mapping bounded by the canvas dimensions and use smoothed features. If the circle can expand beyond the viewport, clamp the radius or make the composition responsive to the available space.

## Pattern 8: RMS-Driven Particle Emission

```js
function maybeEmitParticle(rms, particles, maxParticles, createParticle) {
  const threshold = 0.18;
  if (rms < threshold || particles.length >= maxParticles) return;

  particles.push(createParticle());
}
```

In production, use a pool instead of pushing new objects continuously. Add a cooldown or probability model so sustained loud audio does not fill the system instantly.

## Pattern 9: Particle Pool

```js
function createParticlePool(count, factory) {
  return Array.from({ length: count }, () => ({
    ...factory(),
    active: false,
    age: 0,
  }));
}

function activateParticle(pool, initialize) {
  const particle = pool.find(item => !item.active);
  if (!particle) return null;

  initialize(particle);
  particle.active = true;
  particle.age = 0;
  return particle;
}
```

The `find()` call is fine for a small pool. For thousands of particles, maintain a free-list or active index to avoid scanning the entire pool on every emission.

## Pattern 10: Device-Pixel-Ratio Resize

```js
function resizeCanvasToDisplaySize(canvas, ctx, maxDpr = 2) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));

  if (canvas.width === width && canvas.height === height) return false;

  canvas.width = width;
  canvas.height = height;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return true;
}
```

This function uses CSS-pixel drawing coordinates after applying the transform. Call it on relevant resize events, not on every frame unless you first compare dimensions as shown.

## Pattern 11: ResizeObserver Ownership

```js
const resizeObserver = new ResizeObserver(() => {
  resizeCanvasToDisplaySize(canvas, ctx);
  drawScene();
});

resizeObserver.observe(canvas.parentElement);

function disposeResizeObserver() {
  resizeObserver.disconnect();
}
```

The observer belongs to the visualization instance and must be disconnected during teardown. Avoid registering a new observer every time the player starts.

## Pattern 12: Visibility-Aware Drawing

```js
let pageVisible = !document.hidden;

function onVisibilityChange() {
  pageVisible = !document.hidden;
  if (pageVisible && visualizationEnabled) {
    startVisualization();
  } else {
    stopVisualization();
  }
}

document.addEventListener("visibilitychange", onVisibilityChange);
```

If the loop is already running, make `startVisualization()` idempotent. Decide separately whether the audio itself continues in the background; do not couple playback policy to decorative drawing without a product reason.

## Pattern 13: Reduced-Motion Mode

```js
const reducedMotionQuery = matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = reducedMotionQuery.matches;

function onMotionPreferenceChange(event) {
  reducedMotion = event.matches;
  if (reducedMotion) {
    drawStaticSummary();
    stopVisualization();
  } else if (visualizationEnabled && !document.hidden) {
    startVisualization();
  }
}

reducedMotionQuery.addEventListener("change", onMotionPreferenceChange);
```

A reduced-motion mode can display a static or gently updated spectrum rather than a rapidly moving particle field. Remove the media-query listener during teardown and provide a user setting if motion intensity is central to the experience.

## Pattern 14: Logarithmic Band Boundaries

```js
function logBandEdges(minHz, maxHz, count, sampleRate, fftSize) {
  const hzPerBin = sampleRate / fftSize;
  const edges = [];

  for (let i = 0; i <= count; i++) {
    const fraction = i / count;
    const hz = minHz * Math.pow(maxHz / minHz, fraction);
    edges.push(Math.max(0, Math.floor(hz / hzPerBin)));
  }

  return edges;
}
```

Ensure `minHz` is positive, clamp edges to the available data length, and handle repeated edges where the frequency resolution is too coarse for the chosen band count.

## Pattern 15: Simple Transient Pulse with Cooldown

```js
let energyBaseline = 0;
let lastPulseTime = -Infinity;

function detectTransient(energy, nowSeconds) {
  energyBaseline = smooth(energyBaseline, energy, 0.016, 2.5);

  const aboveBaseline = energy > energyBaseline * 1.65;
  const cooledDown = nowSeconds - lastPulseTime > 0.22;

  if (aboveBaseline && cooledDown) {
    lastPulseTime = nowSeconds;
    return true;
  }
  return false;
}
```

This is only a stylized transient heuristic. It can trigger on speech and noisy material. Use it for decorative pulses, not for claiming reliable beat synchronization.

## Pattern 16: Canvas Trails

```js
function clearWithTrail(ctx, width, height, alpha = 0.16) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}
```

Trails are intentional persistence, not a free performance optimization. Test contrast, ensure old marks fade predictably, and use a full clear when the user disables trails or selects reduced motion.

## Pattern 17: Semantic Status Outside Canvas

```html
<section aria-labelledby="visualizer-heading">
  <h2 id="visualizer-heading">Audio visualizer</h2>
  <p id="visualizer-description">
    Decorative bars respond to the currently playing track.
  </p>
  <canvas id="visualizer" aria-hidden="true"></canvas>
  <p id="visualizer-status" role="status" aria-live="polite">
    Visualizer ready.
  </p>
  <button type="button" id="motion-toggle">Pause animation</button>
</section>
```

If the canvas is purely decorative, hide it from the accessibility tree and provide the controls and status in HTML. If it conveys meaningful data, provide an equivalent summary or accessible data representation.

## Pattern 18: Shared Snapshot for Multiple Visuals

```js
function renderFrame(features) {
  drawSpectrumPanel(features);
  drawParticleField(features);
  drawBackgroundPulse(features);
}
```

All visual modules receive the same feature object. They should not independently sample the analyser, which can produce inconsistent timing and repeated work. Keep drawing functions deterministic given the current feature and visual state.

## Mental Models

### 1. The analyser is a sensor, not an interpreter

It returns signal measurements. It does not know whether a musical beat, spoken word, or emotional moment occurred. Derived features should be named and described honestly.

### 2. Audio and visuals have separate clocks

Audio playback and scheduled sound use the audio context's clock. Canvas animation uses the display's animation frame cadence. The visualizer may stop while the audio continues.

### 3. One sample can drive many visual decisions

Sample the analyser once, compute a compact feature snapshot, and share it. This reduces repeated work and keeps multiple visual layers synchronized.

### 4. Feature extraction is a reusable boundary

Raw frequency bins are low-level data. Bass energy, RMS, and high-band energy are more useful to visual modules. Keep the mapping between raw data and features in a dedicated function.

### 5. Pixel count is a performance multiplier

Doubling canvas width and height creates roughly four times as many pixels to paint. Device pixel ratio must be chosen with actual device performance in mind.

### 6. Smoothness has a latency cost

More smoothing reduces jitter but delays response. Combine analyser smoothing and visual easing deliberately instead of maximizing both.

### 7. A particle is state with a lifetime

A particle should have bounded memory and a clear expiration rule. Pools and free-lists prevent unbounded object creation during long playback sessions.

### 8. A frame is a presentation opportunity

A frame loop should update the model and draw what is currently needed. It should not fetch audio, rebuild the graph, resize the canvas unconditionally, or create large collections of objects.

### 9. Canvas is not a semantic interface

Canvas pixels do not expose labels, control names, or meaningful status by themselves. Use semantic HTML for controls and provide equivalent information when the visual represents data.

### 10. Reduced motion is a mode, not a failure

A calmer visualization can preserve the experience's purpose without fast movement. Keep the user in control and separate motion preference from audio playback.

### 11. A transient is not necessarily a beat

A sudden increase in energy may be a consonant, a noise, or a percussion hit. Name simple heuristics as transient detection unless actual beat tracking is implemented.

### 12. Lifecycle is part of rendering quality

A hidden animation loop wastes battery and can compete with the audio interface. Stop loops and observers when they are no longer needed.

## Gotchas

1. The analyzer must be connected in a way that preserves an audible route to the destination.
2. Byte frequency values are normalized display values, not calibrated decibels.
3. Waveform bytes are centered around 128, not zero.
4. FFT size affects both resolution and responsiveness.
5. Smoothing in both the analyser and visual model can create noticeable lag.
6. Linear frequency bins do not produce logarithmic musical spacing.
7. A large device-pixel ratio can multiply fill cost dramatically.
8. Assigning canvas dimensions resets drawing state.
9. Creating typed arrays inside the frame loop increases garbage collection.
10. A spectrum peak is not proof of a musical beat.
11. RMS is not a calibrated loudness measurement.
12. Particle counts need a maximum and an expiration rule.
13. A hidden tab may pause animation frames while audio keeps running.
14. ResizeObserver must be disconnected during cleanup.
15. Reduced-motion preference can change while the page is open.
16. Trail rendering can leave stale marks if its fade model is not explicit.
17. Repeated analyser reads by separate modules waste work and may desynchronize effects.
18. Canvas content alone is not accessible as a meaningful data interface.
19. High-frequency visual updates can be expensive on mobile GPUs.
20. A visualizer should not assume the audio source is always playing or decoded.

## Common Mistakes and Corrections

| Mistake | Why it fails | Better approach |
|---|---|---|
| Drawing without an audible graph path | Audio may become silent while visuals still react | Ensure the source reaches the destination through the intended graph |
| Treating byte bins as decibels | Values are scaled for display, not calibrated SPL | Label features as normalized magnitude or use float data carefully |
| Treating waveform bytes as centered at zero | RMS calculation is biased | Subtract the midpoint and normalize |
| Using the largest FFT size automatically | Response can feel slow and data may be unnecessary | Choose FFT size for the intended visual |
| Applying heavy smoothing twice | Visual response becomes sluggish | Tune analyser smoothing and model easing together |
| Mapping frequency bins linearly to bars | Low frequencies receive poor visual distinction | Use logarithmic band grouping when appropriate |
| Creating arrays each frame | Garbage collection can cause stutters | Allocate reusable typed arrays once |
| Sampling the analyser in every drawing module | Repeated work and inconsistent snapshots | Create one analysis snapshot per frame |
| Resizing the canvas every frame | Resets context state and can cost time | Compare dimensions and resize only on change |
| Ignoring device pixel ratio | Canvas looks blurry on high-density screens | Scale bitmap with a sensible DPR cap |
| Using raw RMS as perceived loudness | Content and frequency balance affect perception | Treat it as a visual energy feature |
| Calling a transient heuristic a beat detector | It can fire on speech and noise | Describe it as transient detection or use a proper beat tracker |
| Allocating a new particle for every pulse | Memory churn grows with duration | Reuse a pool with bounded capacity |
| Allowing particles to live forever | Active particle count becomes unbounded | Add lifetime and expiration logic |
| Keeping animation active in hidden tabs | Wastes CPU and battery | Stop or throttle the loop on visibility change |
| Coupling audio playback to RAF | Audio may stop when drawing is paused | Keep transport and visualization lifecycle separate |
| Ignoring reduced-motion preference | Fast visual movement may be uncomfortable | Offer static or calmer visualization modes |
| Forgetting to disconnect ResizeObserver | Retains references and triggers stale callbacks | Disconnect during teardown |
| Using canvas-only controls | Controls are inaccessible and hard to test | Use semantic HTML outside the canvas |
| Announcing every frame to screen readers | Produces constant announcement spam | Announce meaningful state changes only |
| Using color alone to indicate energy state | Some users cannot distinguish the signal | Add labels or other cues where the state matters |
| Leaving trail opacity uncontrolled | Old content persists unpredictably | Define and test trail fade behavior |
| Drawing every waveform sample on a tiny canvas | Wastes path operations | Downsample to available pixel width |
| Ignoring no-audio state | Visualizer may look broken when silence is valid | Show a clear idle or waiting state |
| Recreating gradients every frame | Adds avoidable work | Cache stable gradients and reuse them |
| Not clamping visual mappings | One spike can create off-screen geometry | Clamp features and resulting dimensions |
| Leaving RAF active after unmount | Work continues against removed DOM | Cancel the frame and mark the loop stopped |
| Forgetting to remove media-query listeners | Old visualizer instances remain referenced | Remove listeners during teardown |
| Assuming `ResizeObserver` exists everywhere | Older target environments may fail | Feature-detect and provide a resize fallback if required |

## Semantic HTML and Accessibility

Canvas is excellent for expressive drawing, but it does not replace an accessible interface. Controls, descriptions, status messages, and meaningful data summaries should live in HTML.

### Semantic HTML example

```html
<section class="visualizer" aria-labelledby="visualizer-title">
  <h2 id="visualizer-title">Audio visualizer</h2>
  <p id="visualizer-help">
    The animation responds to audio energy. Use the controls to pause or reduce motion.
  </p>

  <canvas id="audio-canvas" aria-hidden="true"></canvas>

  <div role="group" aria-label="Visualizer settings">
    <button type="button" id="animation-toggle" aria-pressed="false">
      Pause animation
    </button>
    <label>
      <input type="checkbox" id="reduced-effects">
      Reduce visual effects
    </label>
  </div>

  <p id="visualizer-status" role="status" aria-live="polite">
    Visualizer ready.
  </p>
</section>
```

### Accessibility checklist

1. Use semantic buttons and native inputs for every control.
2. Give the canvas a heading and concise explanation.
3. Mark purely decorative canvas content `aria-hidden="true"`.
4. If the canvas communicates meaningful measurements, provide a textual summary or accessible data table.
5. Ensure pause, resume, and reduce-effects controls are keyboard-operable.
6. Provide visible focus indicators.
7. Do not use color alone to convey a meaningful state.
8. Respect `prefers-reduced-motion` and allow a user override.
9. Keep animation intensity moderate and avoid rapid flashing.
10. Avoid announcing every animation frame or raw analyser value.
11. Announce meaningful playback and visualization state changes through a polite status region.
12. Keep audio controls separate from visualization controls.
13. Make controls usable at high zoom and on mobile.
14. Do not steal focus when the visualizer starts or stops.
15. Provide captions or a transcript if the underlying audio includes speech.
16. Avoid sound-only instructions or alerts.
17. Test keyboard navigation and screen-reader reading order.
18. Ensure a no-canvas fallback still provides playback controls and status.
19. Allow users to stop decorative animation without stopping required audio.
20. Make reduced-motion mode useful, not an empty blank region.

### Reduced-motion implementation example

```js
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
let motionAllowed = !motionPreference.matches;

function applyMotionPreference() {
  if (!motionAllowed) {
    stopVisualization();
    drawStaticSummary();
  } else if (visualizationEnabled && !document.hidden) {
    startVisualization();
  }
}

motionPreference.addEventListener("change", event => {
  motionAllowed = !event.matches;
  applyMotionPreference();
});
```

If the user explicitly chooses a motion setting, define whether that choice overrides or follows system preference and label the behavior clearly.

## Performance Notes

1. Allocate frequency and waveform arrays once.
2. Sample analysis once per frame and share the resulting features.
3. Cap the canvas device-pixel ratio on constrained devices.
4. Resize only when the container dimensions or DPR change.
5. Keep particle count bounded and recycle expired particles.
6. Stop or throttle animation while the page is hidden.
7. Offer a reduced-effects mode that lowers particle count and drawing complexity.
8. Cache gradients and stable drawing resources.
9. Downsample waveform traces to the canvas pixel width when needed.
10. Use a sensible FFT size instead of maximizing resolution by default.
11. Avoid rebuilding the audio graph when only the visual style changes.
12. Separate audio transport from the canvas animation loop.
13. Use elapsed-time-based smoothing so behavior is stable at different frame rates.
14. Clamp large frame deltas after visibility changes.
15. Profile the actual target mobile devices, not just a desktop development machine.
16. Avoid expensive blur and shadow effects on every particle.
17. Avoid unnecessary `save()` and `restore()` calls in deeply nested loops when state can be managed more simply.
18. Cancel animation frames, observers, and media-query listeners during teardown.

## Testing Strategy

### Visual behavior

- Test silence, low-level audio, dense music, sharp transients, and spoken audio.
- Verify the visual mapping does not explode on one loud transient.
- Test both waveform and spectrum modes.
- Confirm the canvas remains sharp at common DPR values.
- Test narrow and wide layouts and orientation changes.
- Verify trails clear or fade as designed.

### Lifecycle behavior

- Start and stop visualization repeatedly.
- Hide and reveal the tab while audio continues.
- Toggle reduced motion while the player is running.
- Resize the container several times.
- Unmount and remount the component without duplicate loops or observers.
- Confirm the audio transport can continue while the visualization is stopped.
- Confirm all animation frames and event listeners are removed during teardown.

### Performance checks

- Measure frame time at the expected particle count.
- Test a constrained mobile device.
- Track allocations during a long playback session.
- Confirm no unbounded particle growth occurs.
- Confirm hidden-tab and reduced-motion modes substantially reduce drawing work.

## Teardown and Resource Lifecycle

Every visualization instance should own its loop, observers, media-query listeners, and typed arrays. The audio engine may be shared, so the visualizer should disconnect only nodes it created and should not close a context it does not own.

### Teardown requirements

1. Set the running flag to false.
2. Cancel the active animation frame.
3. Disconnect `ResizeObserver`.
4. Remove `visibilitychange` and media-query listeners.
5. Clear particle pools and references if the instance will not be reused.
6. Disconnect any analyser branch owned by the visualization.
7. Do not stop or close shared audio playback unless the visualizer owns it.
8. Remove UI listeners and clear any pending application effects.
9. Ensure repeated disposal is safe.
10. Restore or remove inline canvas styles only if the component owns them.

```js
let disposed = false;

function disposeVisualizer() {
  if (disposed) return;
  disposed = true;

  stopVisualization();
  resizeObserver?.disconnect();
  document.removeEventListener("visibilitychange", onVisibilityChange);
  motionPreference.removeEventListener("change", onMotionPreferenceChange);

  animationToggle.removeEventListener("click", onAnimationToggle);
  analyserBranch?.disconnect();

  particles.length = 0;
  previousTime = 0;
}
```

If the analyzer is shared with the audio engine, disconnect only the visualizer's own branch and leave the shared playback graph intact. The exact cleanup depends on graph ownership, which should be documented at construction time.

## Quick Reference

| Need | Preferred approach | Avoid |
|---|---|---|
| Analyze sound | `AnalyserNode` | Trying to infer audio from canvas pixels |
| Frequency snapshot | Reused `Uint8Array` + `getByteFrequencyData()` | Allocating a new array per frame |
| Waveform snapshot | `getByteTimeDomainData()` | Treating byte values as centered on zero |
| Estimate signal energy | RMS from normalized waveform | Calling it calibrated loudness |
| Pick FFT size | Match detail and responsiveness needs | Always choosing the maximum |
| Smooth values | Time-based exponential easing | Fixed per-frame interpolation |
| Frequency labels | Sample rate and FFT bin mapping | Assuming bins equal musical notes |
| Bass/mid/high features | Band aggregation | Sampling analyser separately per visual |
| Spectrum display | Grouped bins and bounded heights | Unbounded mappings |
| High-DPI canvas | CSS size + capped DPR bitmap | Ignoring DPR or setting it excessively high |
| Resize | ResizeObserver with dimension checks | Resizing canvas every frame |
| Clear frame | `clearRect()` | Reassigning canvas width as a clear trick |
| Trails | Explicit translucent fade | Uncontrolled stale persistence |
| Particles | Bounded pool and lifetime | Unbounded object creation |
| Hidden tab | Stop/throttle visual loop | Continuing decorative drawing |
| Reduced motion | Static or calmer mode | Ignoring system preference |
| Audio continuity | Separate audio and render lifecycle | Stopping audio when RAF stops |
| Multiple visual layers | Shared feature snapshot | Duplicate analyser reads |
| Beat-like pulse | Label as transient heuristic | Claiming reliable beat detection |
| Canvas semantics | HTML controls and text summary | Canvas-only UI |
| Cleanup | Cancel RAF and disconnect observers | Leaving callbacks active |
| Performance tuning | Profile real devices | Guessing based on desktop |
| Color meaning | Add labels or other cues | Color-only state |
| Error/idle state | Explicit waiting or silent state | Treating silence as broken |
| Graph routing | Keep audible path intact | Analyzer branch that bypasses output |

## Definition of Done

- [ ] The analyser is connected to the intended point in the audio graph.
- [ ] Audio playback remains independent from canvas animation.
- [ ] FFT size and smoothing are chosen intentionally.
- [ ] Frequency and waveform arrays are reused.
- [ ] Analysis data is sampled once per frame and shared.
- [ ] Feature extraction is separated from drawing code.
- [ ] Feature values and drawing dimensions are clamped.
- [ ] Canvas sizing accounts for CSS dimensions and a capped DPR.
- [ ] Resizing occurs only when dimensions or DPR change.
- [ ] The animation loop has a single owner and is idempotent.
- [ ] Hidden-tab behavior reduces unnecessary rendering work.
- [ ] Reduced-motion mode offers a useful calmer presentation.
- [ ] Particle counts and lifetimes are bounded.
- [ ] Transient detection is described honestly and tested against varied content.
- [ ] Semantic controls exist outside the canvas.
- [ ] Meaningful data has a text alternative where needed.
- [ ] Live-region updates are limited to meaningful state changes.
- [ ] Teardown cancels RAF and disconnects observers and listeners.
- [ ] Shared audio resources are not accidentally stopped or closed.
- [ ] Performance is tested on at least one constrained device.
- [ ] The visualizer behaves sensibly during silence and loading.
- [ ] Repeated mount/unmount does not duplicate work.

## Build Challenge: Responsive Audio Visualizer

Create an audio-reactive canvas that can visualize a short music track and a spoken sample. It should offer spectrum bars, waveform mode, and a restrained particle mode. Meet all ten requirements:

1. **Audio graph:** Connect a source through an analyser and preserve the intended audible output route.
2. **Analysis buffers:** Allocate reusable frequency and waveform typed arrays after configuring FFT size.
3. **Feature extraction:** Calculate at least three features, including low-band energy, high-band energy, and RMS.
4. **Visualization modes:** Implement spectrum, waveform, and particle presentations that consume one shared feature snapshot.
5. **Responsive canvas:** Support CSS sizing, device-pixel-ratio scaling with a cap, and resize observation.
6. **Frame loop:** Use one animation loop, elapsed-time-based smoothing, and a bounded delta after stalls.
7. **Performance limits:** Pool particles, cap active counts, cache stable resources, and stop decorative drawing when hidden.
8. **Accessibility:** Provide semantic controls, a pause-animation action, reduced-motion mode, visible focus, and meaningful status text.
9. **Lifecycle:** Disconnect observers and listeners, cancel RAF, and leave shared audio playback intact when the visualizer is disposed.
10. **Verification:** Test silence, speech, music, transients, resize, reduced-motion changes, hidden-tab behavior, and repeated mount/unmount.

### Suggested project structure

```text
audio-reactive-canvas/
├── index.html
├── src/
│   ├── main.js
│   ├── audio/
│   │   └── analyser-setup.js
│   ├── analysis/
│   │   ├── sample-audio.js
│   │   └── features.js
│   ├── visual/
│   │   ├── canvas-renderer.js
│   │   ├── spectrum-mode.js
│   │   ├── waveform-mode.js
│   │   └── particle-mode.js
│   ├── lifecycle/
│   │   └── visualizer-controller.js
│   └── styles.css
└── README.md
```

### Acceptance tests

- Spectrum and waveform modes respond to a playing source without breaking audio output.
- The three modes use the same sampled feature snapshot for a given frame.
- The visualization remains legible across common viewport sizes and DPR values.
- Particle count stays below its configured maximum during long playback.
- Switching to reduced motion stops rapid animation and presents a useful static or calmer state.
- Hiding the tab stops decorative drawing without unexpectedly stopping audio.
- A single resize observer and animation loop exist per visualizer instance.
- Silence displays a calm idle state rather than a misleading error.
- The canvas has an appropriate text alternative or is marked decorative.
- Disposing the visualizer removes its own work and leaves shared audio infrastructure operational.

## Final Engineering Principles

An audio-reactive canvas is a pipeline from signal to features to visual state to pixels. Keep those stages separate. Reuse analysis buffers, choose a sensible FFT size, use time-based smoothing, and keep canvas resolution and particle count within a measured budget. Most importantly, never let decorative drawing control the lifetime of audio playback.

Accessibility and lifecycle are part of the implementation, not optional finishing touches. Provide HTML controls and meaningful text, offer a reduced-motion mode, stop hidden or abandoned loops, and respect shared resource ownership. A good visualizer reacts clearly, remains smooth on real devices, and becomes quiet in its own resource usage when the user no longer needs to see it.
