# Web Workers — Production Skill

> **Scope:** Moving CPU-heavy JavaScript off the browser's main thread with dedicated workers, module workers, transferable buffers, worker pools, cancellation protocols, and OffscreenCanvas. This skill focuses on architecture and operational reliability rather than treating a worker as a magical performance switch. Examples use modern browsers and ES modules unless stated otherwise.

## Why This Matters

Main-thread stalls become user-visible failures: a search field stops accepting keystrokes while a 200,000-row filter runs; a canvas animation drops frames while an image is decoded and transformed; a large import freezes the page long enough for the browser to display an “unresponsive” warning; or a user clicks Cancel but the computation keeps running because the worker has no cancellation protocol. These are not merely benchmark problems. They damage input responsiveness, accessibility, perceived reliability, and task completion.

Workers let suitable computation run on a separate thread, but they introduce message latency, serialization cost, memory ownership, lifecycle management, and failure modes. Moving a function into a worker does not automatically make the function compatible: workers do not have `window` or the DOM, data crossing the boundary must be cloneable or transferable, and the worker may fail to load because of module, origin, MIME, CSP, or deployment-path mistakes. A worker can even make a small task slower if setup and message overhead dominate the computation.

Use workers for sustained CPU-bound work that can be separated from DOM access: parsing large files, indexing, image processing, cryptographic or scientific calculations, simulation, ranking, and processing large datasets. Keep layout, DOM updates, focus management, and user-facing state on the main thread. Measure before and after, including time spent cloning data and rendering results. Prefer a dedicated worker for a clearly owned task; use a pool only when measured concurrency needs justify the additional coordination.

## Operating Principles

- The main thread owns the DOM and user interface; workers own computation and worker-local resources.
- Treat `postMessage` as an asynchronous protocol, not a function call.
- Define message types, payload schemas, request IDs, cancellation, errors, and shutdown behavior explicitly.
- Prefer structured-cloneable data for simple messages and transfer ownership of large binary buffers when appropriate.
- Never transfer a buffer that the sender still needs to read.
- Bound concurrency and queued work; unbounded worker creation is not a pool strategy.
- A worker is a resource with a lifecycle: create, initialize, run, fail, cancel, and terminate.
- Preserve responsiveness by splitting long tasks or moving the heavy part off-thread; do not block the worker indefinitely if it must process cancellation messages.
- Render results in batches when the result itself is large.
- Measure end-to-end latency, not only the worker's compute time.

## 1. A Worker Is a Separate Execution Context

A dedicated worker runs JavaScript in a separate global context. It does not share the page's DOM and does not expose `window`, `document`, or layout APIs. It does have worker-specific globals such as `self`, `postMessage`, `close`, timers, fetch in supported environments, and `importScripts` in classic workers. Module workers use standard module imports and are usually easier to maintain in modern build systems.

This boundary is useful because code that tries to touch the DOM inside the worker fails immediately rather than subtly racing with page layout. It also means shared assumptions must be explicit. Pass configuration and data as messages, and return computed results as messages. Keep presentation and accessibility concerns on the main thread, where you can update semantic HTML, preserve focus, announce status changes, and honor user interaction.

```js
// main.js — create a module worker relative to this module.
const worker = new Worker(new URL('./compute.worker.js', import.meta.url), {
  type: 'module',
  name: 'search-index-worker',
});
worker.postMessage({ type: 'initialize', version: 1 });

// compute.worker.js
self.addEventListener('message', ({ data }) => {
  if (data?.type === 'initialize') {
    self.postMessage({ type: 'ready', version: data.version });
  }
});
```

**Gotcha:** The worker URL is resolved by the browser or bundler. A string such as `'/src/worker.js'` may work in development and fail after deployment under a subpath. The `new URL(..., import.meta.url)` pattern lets modern bundlers discover the dependency and rewrite the asset path correctly.

## 2. Dedicated, Shared, and Service Workers Have Different Jobs

A dedicated worker belongs to the page or worker that created it. It is the default for page-owned CPU work because ownership and teardown are straightforward. A shared worker can serve multiple browsing contexts through named ports, but it requires a connection protocol and has more complex lifetime semantics. A service worker is primarily an event-driven network/cache/offline proxy; it is not a general-purpose replacement for a dedicated compute worker and may be terminated when idle.

Choose based on ownership, not novelty. If one route starts an image transformation and should stop it when the route is left, a dedicated worker is a natural fit. If multiple tabs intentionally coordinate through a shared worker, that is a separate product requirement. If the problem is offline caching or request interception, investigate a service worker rather than trying to keep a compute thread alive forever.

```js
// Dedicated worker: simple owner and lifetime.
const worker = new Worker(new URL('./parser.worker.js', import.meta.url), {
  type: 'module',
});

// A shared worker requires connecting through its port.
const shared = new SharedWorker(new URL('./shared.worker.js', import.meta.url), {
  type: 'module',
});
shared.port.start();
shared.port.postMessage({ type: 'subscribe', topic: 'progress' });
```

**Mental model:** Dedicated worker = owned job. Shared worker = shared service with explicit connections. Service worker = browser-managed network/offline lifecycle. Similar names do not imply interchangeable lifecycle rules.

## 3. Define a Message Protocol Before Moving Code

Messages are an API boundary. A robust protocol uses a discriminant such as `type`, a request ID for correlation, and explicit success/error/progress forms. Validate inputs at the boundary even when both sides are written in the same repository; runtime data can become stale after refactors, can be malformed, and may arrive from a different version of a module. Keep payloads minimal, avoid sending DOM nodes or functions, and document whether progress messages are optional or guaranteed.

Avoid “magic object” protocols where the receiver guesses meaning from whichever fields happen to exist. Discriminated messages make logs readable and prevent one result from being confused with another. Include a protocol version when deployments may temporarily mix old and new assets, or when a worker may be cached independently from the page.

```js
// Shared protocol shapes (document or define in a common TypeScript file).
// Main -> worker: { type: 'run', requestId, input, options }
// Main -> worker: { type: 'cancel', requestId }
// Worker -> main: { type: 'progress', requestId, fraction }
// Worker -> main: { type: 'result', requestId, result }
// Worker -> main: { type: 'failure', requestId, error: { name, message } }

function isRunMessage(value) {
  return value && value.type === 'run' &&
    typeof value.requestId === 'string' && value.input != null;
}
```

A useful protocol states what happens when a request is unknown, duplicated, cancelled after completion, or received before initialization. These cases are routine in real applications because UI components mount and unmount, users click repeatedly, and messages are asynchronous.

## 4. Structured Clone Is Convenient, Not Free

`postMessage` normally uses the structured clone algorithm. It supports many built-in data types, including plain objects, arrays, maps, sets, dates, typed arrays, and many other structured values. It does not clone functions or DOM nodes, and class instances do not preserve their full prototype behavior. Large nested objects can take meaningful time and memory to clone, so a worker that receives a huge object and returns another huge object may still produce jank or memory pressure.

Design messages around data, not object identity. Send only the fields the worker needs. If you are repeatedly passing the same static configuration, initialize it once and send small request messages afterwards. For large numeric arrays, compare clone time with transferable buffers. Do not assume every value is cloneable just because JSON serialization succeeds, and do not assume JSON serialization is equivalent to structured clone.

```js
const config = { locale: 'en', stopWords: ['a', 'the', 'of'] };
worker.postMessage({ type: 'configure', config });

try {
  worker.postMessage({ type: 'run', input: { callback: () => {} } });
} catch (error) {
  // DataCloneError: functions cannot be cloned.
  console.error('Message payload is not cloneable', error);
}
```

**Gotcha:** A `DataCloneError` is often a schema-design problem. Do not “fix” it by serializing everything to JSON without considering dates, maps, typed arrays, numeric precision, or the cost of parsing again.

## 5. Transfer Large Buffers When Ownership Can Move

Transferable objects allow certain resources, notably `ArrayBuffer` and `MessagePort`, to move between contexts without copying the underlying data. Transferring an `ArrayBuffer` detaches it from the sender: its byte length becomes zero and the sender can no longer use the data. This can reduce memory bandwidth and peak memory for large binary workloads, but it changes ownership semantics and must be intentional.

Use transfer for buffers that the sender no longer needs. If the UI must keep a preview while the worker processes a copy, either create a deliberate copy or design a pipeline where the worker returns a separate output buffer. Do not put the same buffer in a transfer list and then continue reading from the original typed array. The array view may still exist as an object, but its backing buffer has been detached.

```js
const bytes = new Uint8Array(4 * 1024 * 1024);
fillInput(bytes);

// Transfer the backing buffer; main-thread ownership is relinquished.
worker.postMessage({ type: 'transform', buffer: bytes.buffer }, [bytes.buffer]);
console.log(bytes.byteLength); // 0 after transfer in supporting browsers

// Worker side:
self.addEventListener('message', ({ data }) => {
  if (data.type !== 'transform') return;
  const input = new Uint8Array(data.buffer);
  const output = transformBytes(input);
  self.postMessage({ type: 'result', buffer: output.buffer }, [output.buffer]);
});
```

**Mental model:** Cloning duplicates data; transferring moves ownership. Pick based on who must continue using the bytes, not only on which option looks faster.

## 6. Worker Startup and Readiness Are Asynchronous

Creating a worker returns a `Worker` handle quickly, but the script still has to load, parse, and initialize. Do not assume the worker is ready merely because `new Worker()` succeeded. Use a `ready` message or another explicit handshake when initialization matters. Attach `message`, `error`, and `messageerror` handlers before sending requests that depend on the worker.

Initialization should be idempotent or reject repeated initialization clearly. If the worker loads a large model, dictionary, WASM module, or lookup table, report readiness only after those resources are usable. A loading state should be reflected in the UI without trapping keyboard focus or leaving a screen-reader user unaware of progress.

```js
function createReadyWorker(url) {
  const worker = new Worker(url, { type: 'module' });
  let resolveReady;
  let rejectReady;
  const ready = new Promise((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });

  worker.addEventListener('message', (event) => {
    if (event.data?.type === 'ready') resolveReady(worker);
  });
  worker.addEventListener('error', rejectReady, { once: true });
  worker.addEventListener('messageerror', rejectReady, { once: true });
  return { worker, ready };
}
```

A production implementation should also apply a bounded initialization timeout and remove temporary listeners after readiness. The timeout should produce an actionable error and terminate a worker that can no longer be trusted, rather than silently retrying forever.

## 7. Keep the Main Thread Responsive While Delivering Results

Moving computation off-thread does not guarantee a responsive interface if the main thread then parses a massive result, creates thousands of DOM nodes, or performs expensive layout in one task. Use result summaries, chunks, incremental rendering, and virtualization when the output is large. A worker can send progress, but sending a progress event for every loop iteration can saturate the message queue and cost more than the computation.

Throttle progress messages to meaningful milestones or a modest cadence. On the main thread, update status text and visual progress at a reasonable rate. Use semantic status elements such as `<output>` or an element with `role="status"` when appropriate, and do not rely on color alone to communicate completion or failure.

```js
// Worker: send progress only when a visible milestone changes.
for (let start = 0; start < records.length; start += chunkSize) {
  processChunk(records, start, chunkSize);
  if (shouldReportProgress(start, records.length)) {
    self.postMessage({ type: 'progress', requestId, fraction: start / records.length });
  }
}
self.postMessage({ type: 'result', requestId, result: summarize(records) });
```

## 8. Cancellation Must Be Part of the Protocol

Calling `worker.terminate()` stops the worker immediately, but it also destroys its state and may abandon unrelated requests. For a worker that handles multiple jobs, cancellation should be a message keyed by request ID. However, the worker cannot process a cancellation message while it is trapped inside a single long synchronous loop: it must yield to the event loop, divide work into chunks, or use a shared cancellation flag where supported and appropriate.

A cancellation message is a request, not a guarantee. Define whether cancellation is best-effort, when it becomes effective, whether a cancelled request emits a terminal message, and what happens if cancellation arrives after the result. On the main thread, use `AbortController` to unify cancellation from route changes, user controls, and timeouts, then translate the signal into a protocol message.

```js
// Main thread: one request per controller.
function runJob(worker, requestId, input, signal) {
  return new Promise((resolve, reject) => {
    const onMessage = ({ data }) => {
      if (data.requestId !== requestId) return;
      if (data.type === 'result') finish(resolve, data.result);
      if (data.type === 'failure') finish(reject, new Error(data.error.message));
      if (data.type === 'cancelled') finish(reject, new DOMException('Cancelled', 'AbortError'));
    };
    const onAbort = () => worker.postMessage({ type: 'cancel', requestId });
    function finish(callback, value) {
      worker.removeEventListener('message', onMessage);
      signal?.removeEventListener('abort', onAbort);
      callback(value);
    }
    worker.addEventListener('message', onMessage);
    signal?.addEventListener('abort', onAbort, { once: true });
    if (signal?.aborted) onAbort();
    else worker.postMessage({ type: 'run', requestId, input });
  });
}
```

This sketch demonstrates the contract, not every production detail. A complete implementation should guard duplicate terminal messages, define timeout behavior, avoid request-ID collisions, and handle worker failure by rejecting all pending jobs.

## 9. Chunk Long Work So the Worker Can Hear Messages

A dedicated worker has its own event loop. If a handler performs a 20-second synchronous loop, queued messages such as `cancel` cannot be processed until the loop returns. Divide work into bounded chunks and schedule the next chunk through a task boundary. `setTimeout(..., 0)` is a simple baseline; scheduling policy should be measured for the workload. A microtask-only loop is not a reliable way to yield to incoming message tasks because microtasks can keep draining before the next task is processed.

Chunking also creates opportunities for progress reporting and cooperative cancellation. Pick chunk size from measured latency rather than a universal constant: a chunk should do enough useful work to avoid excessive scheduling overhead but not so much that cancellation feels broken. If each chunk has highly variable cost, budget by elapsed time or item complexity rather than only by item count.

```js
let activeJobs = new Map();

self.addEventListener('message', ({ data }) => {
  if (data.type === 'cancel') {
    activeJobs.get(data.requestId)?.cancel();
    return;
  }
  if (data.type === 'run') startChunkedJob(data);
});

function startChunkedJob({ requestId, input }) {
  let index = 0;
  let cancelled = false;
  activeJobs.set(requestId, { cancel: () => { cancelled = true; } });
  function step() {
    if (cancelled) {
      activeJobs.delete(requestId);
      self.postMessage({ type: 'cancelled', requestId });
      return;
    }
    const stop = Math.min(index + 1000, input.length);
    processRange(input, index, stop);
    index = stop;
    if (index < input.length) setTimeout(step, 0);
    else {
      activeJobs.delete(requestId);
      self.postMessage({ type: 'result', requestId, result: buildResult() });
    }
  }
  step();
}
```

## 10. Worker Pools Need Backpressure and Ownership

A worker pool is useful when jobs can run independently and one worker cannot keep up. But a pool is not simply “create N workers.” It needs a queue, a maximum queue size, worker readiness, task assignment, per-task correlation, cancellation, retry policy, and shutdown. The ideal size depends on device capabilities and workload; using `navigator.hardwareConcurrency` as a rough hint can help, but it is not a promise about cores available to your page or about performance under battery and thermal constraints.

Do not create a new worker for every keystroke or item in a gallery. Reuse workers where startup cost is significant, debounce or cancel superseded work, and cap outstanding jobs. If the queue is full, choose a clear policy: reject, replace an older low-priority request, or apply backpressure to the producer. Silent queue growth is a memory leak in slow motion.

```js
const suggested = navigator.hardwareConcurrency || 2;
const poolSize = Math.max(1, Math.min(4, suggested - 1));
// The cap is an application policy, not a universal optimum.
const pool = new WorkerPool({ size: poolSize, maxQueued: 100 });

const result = await pool.run({ type: 'index', documents }, { priority: 'normal' });
```

**Gotcha:** More workers can reduce performance when tasks compete for memory bandwidth, saturate CPU cores, duplicate large data, or contend with other tabs. Benchmark realistic devices, including lower-end mobile hardware.

## 11. Handle Errors, Crashes, and Message Deserialization Failures

Workers can fail during script loading, evaluation, runtime execution, and message deserialization. Listen for `error` and `messageerror`; the exact error detail exposed by browsers varies, so provide context in your own protocol and telemetry. A worker's runtime error may be recoverable only by replacing the worker. Do not assume its internal state is valid after an unhandled exception.

Associate pending promises with a worker instance. When that worker fails, reject all jobs assigned to it, mark the instance unhealthy, and decide whether to restart it. Restart loops should be bounded and observable. Do not retry non-idempotent work automatically unless the protocol supports deduplication or the job is known safe to repeat.

```js
worker.addEventListener('error', (event) => {
  reportWorkerFailure({ message: event.message, filename: event.filename, lineno: event.lineno });
  rejectAllPendingFor(worker, new Error('Worker crashed'));
  replaceWorkerIfPolicyAllows(worker);
});
worker.addEventListener('messageerror', () => {
  rejectAllPendingFor(worker, new Error('Worker message could not be deserialized'));
});
```

Do not expose internal stack traces, sensitive file contents, or raw user data in user-facing errors. Show a recoverable status and an explicit retry action when appropriate. Keep enough telemetry to distinguish a worker-load error from a compute failure and from a protocol mismatch.

## 12. Module Workers, CSP, and Deployment Paths

Module workers support `import` and use module loading rules. They are usually the best default for modern codebases because dependencies remain explicit and tree-shaking/build tooling can participate. Classic workers may still be required for legacy environments or libraries that depend on `importScripts`. Worker URLs, MIME types, content security policy, cross-origin rules, and deployment paths can all break loading in production.

Test the production build, not only the development server. A development server may allow source paths or permissive headers that a CDN or static host does not. If Content Security Policy is used, review the relevant worker policy directive (commonly `worker-src`, with fallback behavior depending on policy and browser). Cross-origin worker scripts are subject to origin and security constraints; do not attempt to bypass them with arbitrary blob URLs without understanding CSP and deployment implications.

```js
// Preferred with bundlers that understand import.meta.url.
const worker = new Worker(new URL('./search.worker.js', import.meta.url), {
  type: 'module',
  name: 'search-worker',
});

// Deployment checklist: verify emitted asset path, correct JS MIME type,
// CSP worker-src policy, HTTPS context where required, and source maps.
```

## 13. OffscreenCanvas Moves Rendering Work, Not UI Semantics

`OffscreenCanvas` can allow canvas rendering to happen in a worker, reducing main-thread work for supported rendering pipelines. It is especially relevant to particle systems, visualizations, image processing, and custom renderers. It does not grant DOM access to the worker, and it does not remove the need to size the canvas correctly, handle device pixel ratio, stop rendering when hidden, or preserve an accessible non-canvas representation.

Feature-detect the capability you need and keep a fallback path. Transfer control of a canvas only once; the transfer changes how the canvas is managed and cannot be treated as an ordinary reversible toggle. Keep keyboard and screen-reader interactions in the document, and provide semantic controls or a textual summary for important information that would otherwise exist only in pixels.

```js
const canvas = document.querySelector('#chart-canvas');
if ('transferControlToOffscreen' in canvas && supportsWorkerRendering()) {
  const offscreen = canvas.transferControlToOffscreen();
  worker.postMessage({ type: 'init-canvas', canvas: offscreen }, [offscreen]);
} else {
  renderOnMainThread(canvas);
}
```

**Gotcha:** Moving canvas drawing off-thread can improve input responsiveness, but it does not automatically improve frame pacing if the renderer still performs excessive allocations, uploads, or work per frame. Profile the complete pipeline.

## 14. SharedArrayBuffer and Atomics Require a Deliberate Memory Model

`SharedArrayBuffer` allows multiple execution contexts to access shared memory. This can be useful for high-throughput pipelines and low-latency coordination, but it creates concurrency hazards that ordinary message passing avoids. Availability is subject to browser security requirements, commonly cross-origin isolation headers. `Atomics` can coordinate access to shared typed arrays, but every shared state variable needs a clear synchronization rule.

Prefer message passing and transferable buffers until profiling proves that shared memory is necessary. Shared memory can introduce data races, inconsistent snapshots, deadlocks, and hard-to-reproduce bugs. Keep critical sections short, document the ownership of each index and flag, and test on the actual browsers and deployment environment. Never use a busy-wait loop on the main thread; it will freeze the UI.

```js
// Illustrative shared counter. Both contexts must follow the same protocol.
const shared = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT);
const counter = new Int32Array(shared);
Atomics.add(counter, 0, 1);
const current = Atomics.load(counter, 0);
```

This small example is not a complete lock or queue. Do not infer that an atomic increment makes a multi-step data structure thread-safe. The synchronization protocol must protect the entire invariant, not just one individual operation.

## 15. Test the Boundary and Measure the User Experience

Worker tests should cover protocol contracts, not only the pure compute function. Unit-test the computation separately from the worker adapter. Then test request/result correlation, duplicate requests, cancellation, malformed messages, startup failure, runtime failure, worker termination, and cleanup of pending promises. Use deterministic input and avoid relying on exact wall-clock timing in tests unless the test is specifically about a measured latency budget.

Measure end-to-end responsiveness: input delay, time to first useful result, total completion time, memory, worker startup, serialization/transfer cost, and main-thread rendering. Compare against a baseline on representative devices. DevTools performance traces can reveal long tasks on the main thread; worker timelines and console logs help identify whether the cost is computation, message handling, or result rendering. Test with CPU throttling and large realistic inputs, not only with a fast development machine.

```js
performance.mark('job:start');
worker.postMessage({ type: 'run', requestId, input });

worker.addEventListener('message', function onMessage({ data }) {
  if (data.requestId !== requestId || data.type !== 'result') return;
  performance.mark('job:result-received');
  performance.measure('job:round-trip', 'job:start', 'job:result-received');
  worker.removeEventListener('message', onMessage);
});
```

Remember that round-trip time includes more than compute: posting, cloning or transferring, queue delay, worker scheduling, return transport, and any main-thread contention. Instrument worker-side compute separately if you need to identify the dominant term.

## 16. Accessibility and Progressive Enhancement Are Part of the Contract

Off-thread execution must not make the interface harder to understand. Keep status text accessible, avoid rapid live-region announcements for every tiny progress update, retain keyboard access to cancel and retry actions, and preserve focus when results replace a view. If a worker fails, provide a useful error state rather than leaving a spinner running forever. For visual outputs such as charts or image previews, provide semantic labels, summaries, or equivalent data when the output conveys important information.

Use semantic HTML such as `<button>` for actions, `<label>` for form fields, `<output>` for calculated values, and `<progress>` when determinate progress is available. Do not use a clickable `<div>` when a native control expresses the interaction. Visible focus styling with `:focus-visible` helps keyboard users understand where cancellation and retry controls are. For animations produced by a worker, honor `prefers-reduced-motion` and stop or reduce nonessential movement when requested.

```html
<section aria-labelledby="analysis-title">
  <h2 id="analysis-title">Document analysis</h2>
  <p id="analysis-status" role="status" aria-live="polite">Ready to analyze.</p>
  <progress id="analysis-progress" max="100" value="0" hidden>0%</progress>
  <button id="start-analysis" type="button">Analyze document</button>
  <button id="cancel-analysis" type="button" disabled>Cancel analysis</button>
  <output id="analysis-result" for="start-analysis"></output>
</section>
```

## 17. Security and Data-Minimization Boundaries

Workers are not a security sandbox for untrusted application logic. They run with the origin's applicable privileges and can make network requests permitted by the environment. Treat messages from any boundary as untrusted input, validate types and limits, and avoid sending secrets or personally identifiable information that the worker does not need. If processing uploaded files, constrain sizes and formats before allocating large buffers.

A worker can reduce accidental coupling to the DOM, but it does not make dangerous parsing or evaluation safe. Never use `eval` to execute message payloads. Avoid building executable code from user-controlled strings. Keep errors and logs free of raw document contents, tokens, or credentials. When using shared memory or cross-origin isolation, review the security implications of response headers and embedded third-party resources.

## 18. Lifecycle, Visibility, and Resource Cleanup

A worker should not outlive the work that owns it unless reuse is intentional. On route change or component teardown, cancel owned jobs, remove listeners, settle pending promises, and terminate the worker when no other owner needs it. If the worker is pooled, return a job slot only after a terminal message or worker failure. Ensure cleanup is idempotent because UI frameworks can mount and unmount components more than once during development or navigation.

Visibility is a product decision: some jobs should continue in a background tab, while visual renderers and unnecessary preview work should pause. Do not assume a hidden tab is a reliable place to finish a deadline-sensitive task. Browser scheduling and process lifecycle can change. For work that must survive navigation or browser shutdown, a worker is not durable storage or a guaranteed background execution mechanism.

```js
function attachOwnedWorker(worker, signal) {
  const onAbort = () => worker.terminate();
  if (signal.aborted) onAbort();
  else signal.addEventListener('abort', onAbort, { once: true });
  return () => {
    signal.removeEventListener('abort', onAbort);
    worker.terminate();
  };
}
```

This helper is intentionally small. A real controller should first cancel or reject pending work, ensure any shared pool references are removed, and make termination safe to call more than once.

## 19. Debugging Workers in DevTools

Use the browser's Sources panel to locate the worker context and set breakpoints inside worker scripts. Inspect messages at both ends, use request IDs in logs, and capture worker errors with enough context to reproduce them. Performance traces should include the main thread and worker thread when the browser exposes both. CPU throttling helps reveal whether a solution only works on a developer workstation.

When a worker fails only in production, verify the emitted URL, response status, MIME type, CSP, module imports, source-map path, and whether the worker script is cached independently from the page. A local `file://` test is not a substitute for testing through the intended HTTP(S) deployment. Check that logs do not leak sensitive input and that worker restarts do not create an infinite error loop.

## 20. Production Readiness: Choose the Smallest Reliable Architecture

Start with the simplest design that solves the measured bottleneck: pure function on the main thread for small tasks, a dedicated worker for an isolated heavy job, a reusable worker for repeated work, and a bounded pool for parallel independent jobs. Add transferables when data movement is measurable, chunking when cancellation or progress requires it, and shared memory only when the simpler approaches cannot meet a proven requirement.

A good worker design has explicit inputs and outputs, bounded memory, observable progress, cancellation semantics, a predictable failure path, cleanup ownership, and a baseline comparison. It also has a fallback for unsupported capabilities where the product needs one. The goal is not to maximize worker usage; the goal is to preserve a responsive, understandable, and reliable user experience while completing expensive work.

## 21. Mental Models to Keep

1. **A worker is a separate context, not a background version of `window`.** It owns computation and worker-local state; the main thread owns the DOM and user interaction.
2. **A message is a protocol event, not a synchronous call.** Design correlation, ordering assumptions, terminal states, and errors explicitly.
3. **Structured clone has a cost.** A worker may move CPU work away from the UI while still paying significant serialization and allocation costs.
4. **Transfer changes ownership.** A transferred buffer is no longer usable by the sender; code should make that handoff obvious.
5. **Cancellation requires cooperation or termination.** A worker cannot process a cancel message while blocked in a long synchronous task.
6. **More workers are not always faster.** Memory bandwidth, startup, contention, and thermal limits can make parallelism slower.
7. **The result can still freeze the page.** Main-thread parsing, rendering, and accessibility updates need their own budget.
8. **Failure is part of the protocol.** Loading, runtime, deserialization, cancellation, and shutdown must all settle pending work.
9. **A worker is not durable background infrastructure.** Browser lifecycle and scheduling remain outside your guarantee.
10. **Measure the whole path.** Include startup, transport, queueing, compute, result handling, and rendering.

## 22. Implementation Pattern: A Minimal Typed Request/Result Worker

**What it does:** Establishes a request ID and a discriminated message shape so the main thread can match a result to the operation that produced it.

**When to use it:** Use this for a first dedicated worker when one active request is expected or when the request lifecycle can be managed simply. Extend it before allowing overlapping requests.

```js
// main.js
const worker = new Worker(new URL('./sum.worker.js', import.meta.url), { type: 'module' });
const requestId = crypto.randomUUID();
worker.addEventListener('message', ({ data }) => {
  if (data.requestId !== requestId) return;
  if (data.type === 'result') showTotal(data.total);
  if (data.type === 'failure') showError(data.message);
});
worker.postMessage({ type: 'sum', requestId, values: [1, 2, 3] });

// sum.worker.js
self.addEventListener('message', ({ data }) => {
  if (data?.type !== 'sum') return;
  try {
    const total = data.values.reduce((sum, value) => sum + value, 0);
    self.postMessage({ type: 'result', requestId: data.requestId, total });
  } catch (error) {
    self.postMessage({ type: 'failure', requestId: data.requestId, message: String(error) });
  }
});
```

A production version should validate `values`, constrain its length, settle the request on worker error, and remove listeners when the request ends. This pattern shows the protocol boundary; it is not a substitute for lifecycle management.

## 23. Implementation Pattern: Transfer an ArrayBuffer

**What it does:** Moves a large binary buffer to the worker without copying its backing storage where transfer support applies.

**When to use it:** Use for image pixels, binary file parsing, numeric simulations, and other workloads where the sender no longer needs the original buffer during processing.

```js
const buffer = await file.arrayBuffer();
worker.postMessage({ type: 'parse-file', buffer }, [buffer]);
// Do not read buffer here: ownership was transferred.
```

The receiving side should verify the payload and size before allocating derived structures. If the main thread needs the original bytes for a preview, create an intentional copy or arrange the pipeline so the preview is generated before transfer. Benchmark the copy-based and transfer-based designs with realistic data.

## 24. Implementation Pattern: Cooperative Cancellation with Chunks

**What it does:** Breaks a long task into bounded pieces so the worker can process cancellation and progress messages between chunks.

**When to use it:** Use when jobs can run long enough that users may cancel, when progress matters, or when one worker processes multiple requests over time.

```js
let currentJob = null;
self.onmessage = ({ data }) => {
  if (data.type === 'cancel' && currentJob?.id === data.requestId) currentJob.cancelled = true;
  if (data.type === 'run') {
    currentJob = { id: data.requestId, cancelled: false };
    processNextChunk(data.items, 0, currentJob);
  }
};
function processNextChunk(items, start, job) {
  if (job.cancelled) {
    self.postMessage({ type: 'cancelled', requestId: job.id });
    return;
  }
  const end = Math.min(start + 500, items.length);
  processRange(items, start, end);
  if (end < items.length) setTimeout(() => processNextChunk(items, end, job), 0);
  else self.postMessage({ type: 'result', requestId: job.id, result: collectResult() });
}
```

This simplified pattern assumes one active job. If multiple jobs may overlap, maintain a map keyed by request ID and define scheduling policy. Do not let a stale job write into the result state of a newer job.

## 25. Implementation Pattern: A Bounded Worker Pool

**What it does:** Reuses a fixed number of worker instances and limits how much work can be queued at once.

**When to use it:** Use for independent CPU-bound jobs with repeated demand, such as indexing document batches or transforming image thumbnails. Avoid a pool for a single short task unless measurement justifies it.

```js
class SimplePool {
  constructor(createWorker, size, maxQueued = 50) {
    this.workers = Array.from({ length: size }, createWorker);
    this.maxQueued = maxQueued;
    this.queue = [];
    this.available = [...this.workers];
  }
  run(payload) {
    if (this.available.length) return this.dispatch(this.available.pop(), payload);
    if (this.queue.length >= this.maxQueued) return Promise.reject(new Error('Worker queue full'));
    return new Promise((resolve, reject) => this.queue.push({ payload, resolve, reject }));
  }
  dispatch(worker, payload) {
    // Production implementation must correlate IDs, settle errors, and return worker to pool.
    return sendJob(worker, payload);
  }
}
```

This is an architectural sketch, not a complete pool implementation. Add worker readiness, request correlation, timeouts, cancellation, error replacement, queue fairness, and a `close()` method before using it in production. The queue limit is a backpressure policy and should be tuned to the user experience.

## 26. Implementation Pattern: Worker-Owned OffscreenCanvas

**What it does:** Transfers rendering control to a worker for supported canvas workloads, allowing drawing to avoid the main thread.

**When to use it:** Use for rendering-heavy visualizations, particle fields, or image pipelines when profiling identifies main-thread drawing as a bottleneck and browser support is adequate.

```js
const canvas = document.querySelector('#visualization');
if (canvas && typeof canvas.transferControlToOffscreen === 'function') {
  const offscreen = canvas.transferControlToOffscreen();
  worker.postMessage({ type: 'attach-canvas', canvas: offscreen }, [offscreen]);
} else {
  startFallbackRenderer(canvas);
}
```

Keep labels, controls, keyboard navigation, focus behavior, and semantic summaries in the DOM. The worker's canvas is a rendering implementation, not a replacement for accessible application structure. Handle resize and device-pixel-ratio changes explicitly.

## 27. Implementation Pattern: Latest-Request-Wins Search

**What it does:** Avoids wasting resources on results for obsolete search input by cancelling or ignoring stale work.

**When to use it:** Use for typeahead, filter previews, client-side search, or any interface where newer input supersedes older input.

```js
let latestRequest = 0;
function search(query) {
  const requestId = String(++latestRequest);
  worker.postMessage({ type: 'search', requestId, query });
}
worker.addEventListener('message', ({ data }) => {
  if (data.type !== 'search-result') return;
  if (Number(data.requestId) !== latestRequest) return; // Ignore stale result.
  renderSearchResults(data.results);
});
```

Ignoring stale results preserves correctness but does not stop stale computation. If the search is expensive, pair this with a cancellation protocol or a chunked worker that can abandon obsolete jobs. Debouncing can reduce job creation, but it should not make keyboard interaction feel sluggish.

## 28. Implementation Pattern: Progress That Is Useful and Accessible

**What it does:** Reports meaningful milestones without flooding the main thread with progress messages.

**When to use it:** Use for import, indexing, analysis, or transformations long enough to warrant feedback.

```js
// Worker: send at meaningful boundaries, not on every item.
if (completed % 5000 === 0 || completed === total) {
  self.postMessage({ type: 'progress', requestId, completed, total });
}
```

On the page, update a native `<progress>` element when total work is known. Use a concise status announcement for meaningful transitions such as “Processing started,” “Halfway complete,” or “Finished.” Avoid sending every percentage to an assertive live region; that can overwhelm assistive technology users.

## 29. Implementation Pattern: Explicit Shutdown and Pending-Job Settlement

**What it does:** Stops work, settles requests, removes listeners, and releases worker resources when an owner is disposed.

**When to use it:** Use for route-owned workers, modal workflows, editors, or any component that may be mounted and removed repeatedly.

```js
function disposeWorkerController(controller) {
  if (controller.disposed) return;
  controller.disposed = true;
  for (const pending of controller.pending.values()) {
    pending.reject(new DOMException('Worker controller disposed', 'AbortError'));
  }
  controller.pending.clear();
  controller.worker.terminate();
}
```

The real controller should also remove external event listeners and prevent new jobs from being submitted after disposal. Make disposal idempotent so repeated cleanup does not throw or leave promises pending.

## 30. Implementation Pattern: Instrument End-to-End Latency

**What it does:** Measures the time from dispatch through result receipt so serialization and queue delays are visible alongside compute time.

**When to use it:** Use before and after a worker migration to prove the user-facing result improved rather than simply moving time to another thread.

```js
performance.mark(`worker:${id}:start`);
worker.postMessage({ type: 'run', requestId: id, input });
// When matching result arrives:
performance.mark(`worker:${id}:received`);
performance.measure(`worker:${id}:roundtrip`, `worker:${id}:start`, `worker:${id}:received`);
```

Measure worker-side compute separately if needed. Do not log raw sensitive input to correlate requests; use opaque IDs and bounded telemetry. Compare p50 and p95 on representative devices, and track errors and cancellation rates along with duration.

## 31. Mistakes and Their Fixes

| ID | Mistake | Why it fails | Fix |
|---|---|---|---|
| A | Moving DOM code into a worker | DOM globals are unavailable | Keep DOM operations on the main thread and send data to the worker |
| B | Assuming worker construction means ready | Loading and initialization are asynchronous | Add a readiness handshake and bounded startup timeout |
| C | Sending functions in a message | Functions are not structured-cloneable | Send a command identifier and serializable arguments |
| D | Posting a huge object repeatedly | Clone and allocation costs can dominate | Send minimal data and cache worker configuration |
| E | Transferring a buffer still needed by the UI | The sender loses access to the transferred backing buffer | Copy deliberately or transfer only after the sender is finished |
| F | Creating a worker for every keystroke | Startup and queued jobs waste resources | Reuse a worker, debounce appropriately, and cancel obsolete jobs |
| G | Starting an unbounded number of workers | CPU and memory contention increase | Use a bounded pool and benchmark the size |
| H | Sending progress for every item | Message traffic can overwhelm useful work | Report milestones or throttled progress updates |
| I | Expecting cancel messages to interrupt a tight loop | The worker event loop cannot process messages during synchronous work | Chunk work or terminate the worker when appropriate |
| J | Ignoring `messageerror` | Deserialization failures become silent hangs | Handle message errors and reject affected requests |
| K | Leaving pending promises unresolved after a crash | UI spinners and queues remain stuck | Reject all pending jobs assigned to the failed worker |
| L | Retrying every failed job indefinitely | Failure loops consume CPU and hide root causes | Bound retries, classify errors, and report unhealthy workers |
| M | Using a classic worker by accident | Imports or build assumptions may fail | Choose `type: 'module'` deliberately and verify production output |
| N | Hardcoding a development URL | Deployment under a subpath breaks loading | Use bundler-compatible URLs and test the production build |
| O | Treating a service worker as a compute worker | Its lifecycle is event-driven and may be terminated | Use a dedicated worker for page-owned CPU jobs |
| P | Assuming OffscreenCanvas is universal | Unsupported paths break rendering | Feature-detect and retain a fallback where required |
| Q | Returning an enormous result at once | Main-thread handling can cause a new long task | Return summaries or chunks and render incrementally |
| R | Sharing memory without synchronization rules | Concurrent writes can violate invariants | Define ownership and synchronization, or prefer messages |
| S | Logging sensitive worker payloads | Diagnostics can expose user data | Log opaque IDs, sizes, timing, and sanitized error details |
| T | Forgetting worker teardown | Detached components retain resources and listeners | Make cleanup explicit, idempotent, and tested |
| U | Testing only on a fast desktop | Startup, memory, and contention differ on lower-end devices | Test CPU-throttled and mobile-like conditions |
| V | Measuring compute only | Transport and rendering may dominate end-to-end time | Measure round-trip, queueing, and UI rendering separately |
| W | Ignoring keyboard cancellation | Some users cannot stop long-running work | Provide a semantic, keyboard-accessible cancel control |
| X | Announcing every progress increment | Assistive technology output becomes noisy | Announce meaningful state changes and keep detailed progress visual |

## 32. Quick Reference

| Need | Recommended approach | Important caveat |
|---|---|---|
| One expensive isolated calculation | Dedicated worker | Include startup and message costs in the measurement |
| Repeated jobs from one feature | Reusable dedicated worker | Define ownership and shutdown |
| Independent jobs at sustained volume | Bounded worker pool | Cap queue length and define backpressure |
| Large binary payload | Transferable `ArrayBuffer` | Transfer detaches the sender's buffer |
| Small configuration object | Structured clone | Avoid repeated deep cloning of large configuration |
| Long cancellable computation | Chunked work and cancel messages | A synchronous loop cannot receive cancel messages mid-loop |
| Progress indicator | Throttled progress messages | Avoid flooding the main thread or live region |
| Canvas rendering bottleneck | OffscreenCanvas where supported | Keep DOM semantics and accessibility on the main thread |
| Multiple browsing contexts sharing a service | SharedWorker when appropriate | Requires explicit port and connection lifecycle |
| Offline caching and request interception | Service worker | Not a general-purpose compute worker |
| Startup-sensitive work | Readiness handshake | Handle timeout and startup error |
| Worker crash | Reject pending jobs and replace by policy | Do not retry forever |
| Production-only load failure | Check URL, MIME, CSP, imports, and deployment path | Development server behavior can hide deployment errors |
| High-throughput shared memory | SharedArrayBuffer and Atomics only if justified | Requires synchronization and browser security support |
| Large result set | Summaries, chunks, or virtualized rendering | Rendering can still block the main thread |
| Route/component disposal | Cancel, settle, remove listeners, terminate | Cleanup should be idempotent |
| Latency analysis | Measure round-trip and compute separately | Avoid sensitive payload logging |
| Keyboard cancellation | Native button with clear status | Keep focus visible and status understandable |
| Reduced-motion support | Honor user motion preferences for visual output | Worker execution does not bypass accessibility requirements |
| Regression testing | Protocol tests plus realistic workload benchmark | Do not assert fragile exact timings in ordinary unit tests |

## 33. Production Build Challenge

Build a worker-backed file-analysis panel. The implementation must demonstrate a clear protocol, bounded resource use, failure recovery, accessible status, and evidence that the worker improves the experience for the intended workload.

### Requirements

1. Create a module worker with a deployment-safe URL.
2. Define explicit `run`, `progress`, `result`, `failure`, `cancel`, and `cancelled` messages.
3. Include a request ID in every request-specific message.
4. Validate incoming message shape and enforce a documented input-size limit.
5. Add a readiness handshake and startup failure path.
6. Handle both `error` and `messageerror` events.
7. Ensure all pending requests settle if the worker fails or is disposed.
8. Support cancellation for an in-progress request.
9. Chunk long-running work so cancellation can be observed between chunks.
10. Report progress at meaningful milestones rather than on every iteration.
11. Use a transferable buffer for a suitable large binary input and document the ownership change.
12. Never access the DOM from the worker.
13. Keep a semantic status element and a keyboard-accessible Cancel button in the page.
14. Provide a visible focus indicator using `:focus-visible` for interactive controls.
15. Avoid excessive live-region announcements during progress updates.
16. Add a fallback or a clear unsupported-capability message for any optional advanced API.
17. Add a test for malformed input and a test for an uncloneable message payload.
18. Add a test for cancellation while the job is active.
19. Add a test for worker startup or runtime failure and verify no request remains pending forever.
20. Add a failure test where the user starts a second request before the first request completes; ensure stale results cannot overwrite the latest UI state.
21. Test an input larger than the documented limit and confirm rejection occurs before large allocations.
22. Test repeated mount/unmount or create/dispose cycles and verify that workers and listeners do not accumulate.
23. Measure baseline main-thread execution against worker execution on representative data.
24. Record round-trip duration, compute duration, and result-render duration separately.
25. Test the production build under the intended path and security headers, not only the local development server.

### Definition of Done / Success Criteria

- All message types and terminal states are documented and validated.
- No pending promise remains unresolved after cancellation, failure, or disposal.
- Cancellation has a bounded, tested response time for the selected workload.
- Large payloads use a deliberate clone/transfer policy with ownership documented.
- The UI remains keyboard-operable and exposes meaningful status and errors.
- Worker startup, runtime errors, and message deserialization errors are observable.
- Resource limits and queue limits prevent unbounded memory growth.
- Performance measurements demonstrate the actual benefit or justify retaining the simpler main-thread implementation.
- Production deployment succeeds with correct asset paths and CSP settings.
- The failure tests pass, including stale results and repeated lifecycle transitions.

## 34. Debugging Checklist

When the worker does not load, inspect the emitted script URL, response status, MIME type, CSP policy, module imports, and deployment base path. If the worker starts but no result arrives, log request IDs on both sides, verify the discriminant, inspect pending-request bookkeeping, and check whether the worker threw or the payload failed to deserialize. If cancellation does not work, check whether the worker is inside a synchronous loop and whether the cancellation message can reach its event loop.

Use DevTools to set breakpoints in the worker context and inspect its own console. Record marks around posting, receiving, and rendering. Simulate a slower CPU and use large, realistic inputs. A benchmark that excludes startup, transfer, result rendering, and garbage collection may describe only one part of the user's experience.

## 35. Browser Support and Progressive Enhancement

Dedicated Web Workers are broadly supported in modern browsers, while module workers, OffscreenCanvas, SharedArrayBuffer, and particular transferable features have more specific compatibility and deployment requirements. Verify the exact capability needed rather than testing only whether `Worker` exists. Shared memory typically requires cross-origin isolation; OffscreenCanvas support can vary by browser and rendering context. A robust application should have a fallback for optional capabilities when the feature is essential to task completion.

Feature detection should be local to the feature and its actual use. If OffscreenCanvas is missing, a main-thread canvas path may be acceptable for small datasets; for a very large dataset, the UI may need a reduced-quality mode or a clear unsupported state. Do not silently claim the same performance when a fallback has materially different limits. Test the target browsers in the production deployment configuration.

## 36. Performance Rules of Thumb

- Profile the baseline first. A worker is useful only if computation is a real bottleneck and the boundary cost is acceptable.
- Send minimal messages. Large object graphs cost memory and time to clone.
- Transfer large buffers only when ownership can move safely.
- Reuse workers for repeated jobs when startup overhead is material.
- Bound queues and concurrency to keep memory predictable.
- Chunk long tasks when cancellation, progress, or fairness matters.
- Avoid creating thousands of result objects if a compact representation will do.
- Do not render every result synchronously; batch, summarize, or virtualize the output.
- Measure on lower-end devices and under CPU throttling.
- Track failures and cancellation alongside latency; a fast result that frequently fails is not a win.

## 37. Final Decision Framework

Ask these questions before adopting a worker:

1. Is the bottleneck sustained CPU work, rather than network latency, layout, or a poorly optimized algorithm?
2. Can the work be expressed as data-in/data-out without direct DOM access?
3. Is the payload small enough to clone efficiently, or can a buffer be transferred safely?
4. Does the job need progress, cancellation, parallelism, or reuse?
5. What is the queue limit and overload policy?
6. How are startup failures, runtime failures, and deserialization failures handled?
7. What is the owner of the worker, and when is it disposed?
8. How will the UI communicate progress, errors, cancellation, and success accessibly?
9. What fallback is available for optional APIs or unsupported environments?
10. What end-to-end measurement will demonstrate improvement?

If these questions do not have clear answers, start with a pure computation function and a benchmark. Move it behind a worker boundary only when the boundary and lifecycle can be made explicit. A worker is a tool for responsiveness, not a badge of architectural sophistication.
