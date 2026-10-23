# SKILL: realtime-ml-ui
**Layer:** 15 — AI/ML Niche
**Goal:** Deliver streamed AI output with correct chunk assembly, cancellation, accessible status updates, and graceful recovery from interrupted connections.

---

## Why This Matters (Senior Perspective)
Streaming can make a slow model feel responsive, but it also introduces partial state. A naïve client may append duplicated chunks, display raw protocol frames, leave a spinner running after a disconnect, or continue consuming a response after the user navigates away. If partial text is rendered as trusted HTML, streaming increases the window in which unsafe content can reach the DOM. Users also need to know whether the model is still generating, has completed, or failed.

A senior developer treats streaming as a state machine, not a typing animation. The states include idle, connecting, streaming, complete, cancelled, and error. The transport parser must handle chunks that split across network reads, preserve UTF-8 boundaries, recognize protocol events, and distinguish completion from connection close. Cancellation must propagate to the server when possible, while retry logic must not silently duplicate billable generation.

For a creative portfolio or client product, progressive text arrival can support a refined experience, but visual polish should follow correctness. Use semantic status regions, reduced-motion-aware effects, a clear stop button, and a fallback for browsers or proxies that buffer streams. Keep credentials server-side, apply rate and token budgets, and test slow networks and mid-stream failures—not just a fast local connection.

---

## Core Concepts
### 1. Model streaming as a state machine

Explicit states prevent ambiguous spinner and duplicate-submit behavior. This decision should be explicit in code and verified with representative inputs, because downstream UI behavior depends on it.

**Working pattern:**
```python
# Model streaming as a state machine: keep this boundary explicit so failures can be isolated.
def validate_realtime_ml_ui_input(payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise TypeError("Request payload must be an object")
    if not payload:
        raise ValueError("Request payload cannot be empty")
    # Preserve a clear contract instead of silently guessing missing fields.
    return dict(payload)
```

**Naive approach:** accept arbitrary input and hope the model or UI can infer intent.

**Correct approach:** validate the shape and domain constraints before expensive work; return an actionable error when the contract is violated.

**Boundary check:**
```javascript
function isValidRealtimeMlUiRequest(payload) {
  // Reject malformed data before it enters application state.
  return payload !== null && typeof payload === "object" && !Array.isArray(payload);
}
```

**Gotcha:** schema-valid data can still be semantically invalid; for example, a numeric score outside the model’s supported range can pass a type check and still produce a misleading result.

**Before / after:**
```javascript
// Before: malformed values quietly flow into a later render.
const visibleResult = response.result || "No result";
// After: preserve the difference between absent, empty, and valid output.
const visibleResult = typeof response.result === "string" ? response.result : "Result unavailable";
```

### 2. Choose SSE or ReadableStream

SSE is convenient for server-to-client events; fetch streams offer lower-level control. This decision should be explicit in code and verified with representative inputs, because downstream UI behavior depends on it.

**Working pattern:**
```python
# Choose SSE or ReadableStream: keep this boundary explicit so failures can be isolated.
def validate_realtime_ml_ui_input(payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise TypeError("Request payload must be an object")
    if not payload:
        raise ValueError("Request payload cannot be empty")
    # Preserve a clear contract instead of silently guessing missing fields.
    return dict(payload)
```

**Naive approach:** accept arbitrary input and hope the model or UI can infer intent.

**Correct approach:** validate the shape and domain constraints before expensive work; return an actionable error when the contract is violated.

**Boundary check:**
```javascript
function isValidRealtimeMlUiRequest(payload) {
  // Reject malformed data before it enters application state.
  return payload !== null && typeof payload === "object" && !Array.isArray(payload);
}
```

**Gotcha:** schema-valid data can still be semantically invalid; for example, a numeric score outside the model’s supported range can pass a type check and still produce a misleading result.

**Before / after:**
```javascript
// Before: malformed values quietly flow into a later render.
const visibleResult = response.result || "No result";
// After: preserve the difference between absent, empty, and valid output.
const visibleResult = typeof response.result === "string" ? response.result : "Result unavailable";
```

### 3. Parse protocol frames incrementally

Network reads do not align with logical event boundaries. This decision should be explicit in code and verified with representative inputs, because downstream UI behavior depends on it.

**Working pattern:**
```python
# Parse protocol frames incrementally: keep this boundary explicit so failures can be isolated.
def validate_realtime_ml_ui_input(payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise TypeError("Request payload must be an object")
    if not payload:
        raise ValueError("Request payload cannot be empty")
    # Preserve a clear contract instead of silently guessing missing fields.
    return dict(payload)
```

**Naive approach:** accept arbitrary input and hope the model or UI can infer intent.

**Correct approach:** validate the shape and domain constraints before expensive work; return an actionable error when the contract is violated.

**Boundary check:**
```javascript
function isValidRealtimeMlUiRequest(payload) {
  // Reject malformed data before it enters application state.
  return payload !== null && typeof payload === "object" && !Array.isArray(payload);
}
```

**Gotcha:** schema-valid data can still be semantically invalid; for example, a numeric score outside the model’s supported range can pass a type check and still produce a misleading result.

**Before / after:**
```javascript
// Before: malformed values quietly flow into a later render.
const visibleResult = response.result || "No result";
// After: preserve the difference between absent, empty, and valid output.
const visibleResult = typeof response.result === "string" ? response.result : "Result unavailable";
```

### 4. Handle split chunks and UTF-8

Decode streaming bytes with a persistent TextDecoder. This decision should be explicit in code and verified with representative inputs, because downstream UI behavior depends on it.

**Working pattern:**
```python
# Handle split chunks and UTF-8: keep this boundary explicit so failures can be isolated.
def validate_realtime_ml_ui_input(payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise TypeError("Request payload must be an object")
    if not payload:
        raise ValueError("Request payload cannot be empty")
    # Preserve a clear contract instead of silently guessing missing fields.
    return dict(payload)
```

**Naive approach:** accept arbitrary input and hope the model or UI can infer intent.

**Correct approach:** validate the shape and domain constraints before expensive work; return an actionable error when the contract is violated.

**Boundary check:**
```javascript
function isValidRealtimeMlUiRequest(payload) {
  // Reject malformed data before it enters application state.
  return payload !== null && typeof payload === "object" && !Array.isArray(payload);
}
```

**Gotcha:** schema-valid data can still be semantically invalid; for example, a numeric score outside the model’s supported range can pass a type check and still produce a misleading result.

**Before / after:**
```javascript
// Before: malformed values quietly flow into a later render.
const visibleResult = response.result || "No result";
// After: preserve the difference between absent, empty, and valid output.
const visibleResult = typeof response.result === "string" ? response.result : "Result unavailable";
```

### 5. Append text without quadratic work

Batch rendering updates so each token does not trigger excessive layout work. This decision should be explicit in code and verified with representative inputs, because downstream UI behavior depends on it.

**Working pattern:**
```python
# Append text without quadratic work: keep this boundary explicit so failures can be isolated.
def validate_realtime_ml_ui_input(payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise TypeError("Request payload must be an object")
    if not payload:
        raise ValueError("Request payload cannot be empty")
    # Preserve a clear contract instead of silently guessing missing fields.
    return dict(payload)
```

**Naive approach:** accept arbitrary input and hope the model or UI can infer intent.

**Correct approach:** validate the shape and domain constraints before expensive work; return an actionable error when the contract is violated.

**Boundary check:**
```javascript
function isValidRealtimeMlUiRequest(payload) {
  // Reject malformed data before it enters application state.
  return payload !== null && typeof payload === "object" && !Array.isArray(payload);
}
```

**Gotcha:** schema-valid data can still be semantically invalid; for example, a numeric score outside the model’s supported range can pass a type check and still produce a misleading result.

**Before / after:**
```javascript
// Before: malformed values quietly flow into a later render.
const visibleResult = response.result || "No result";
// After: preserve the difference between absent, empty, and valid output.
const visibleResult = typeof response.result === "string" ? response.result : "Result unavailable";
```

### 6. Cancellation and abort signals

An AbortController connects UI cancellation to fetch cancellation. This decision should be explicit in code and verified with representative inputs, because downstream UI behavior depends on it.

**Working pattern:**
```python
# Cancellation and abort signals: keep this boundary explicit so failures can be isolated.
def validate_realtime_ml_ui_input(payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise TypeError("Request payload must be an object")
    if not payload:
        raise ValueError("Request payload cannot be empty")
    # Preserve a clear contract instead of silently guessing missing fields.
    return dict(payload)
```

**Naive approach:** accept arbitrary input and hope the model or UI can infer intent.

**Correct approach:** validate the shape and domain constraints before expensive work; return an actionable error when the contract is violated.

**Boundary check:**
```javascript
function isValidRealtimeMlUiRequest(payload) {
  // Reject malformed data before it enters application state.
  return payload !== null && typeof payload === "object" && !Array.isArray(payload);
}
```

**Gotcha:** schema-valid data can still be semantically invalid; for example, a numeric score outside the model’s supported range can pass a type check and still produce a misleading result.

**Before / after:**
```javascript
// Before: malformed values quietly flow into a later render.
const visibleResult = response.result || "No result";
// After: preserve the difference between absent, empty, and valid output.
const visibleResult = typeof response.result === "string" ? response.result : "Result unavailable";
```

### 7. Loading, complete, and error states

Represent completion and failure as distinct terminal states. This decision should be explicit in code and verified with representative inputs, because downstream UI behavior depends on it.

**Working pattern:**
```python
# Loading, complete, and error states: keep this boundary explicit so failures can be isolated.
def validate_realtime_ml_ui_input(payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise TypeError("Request payload must be an object")
    if not payload:
        raise ValueError("Request payload cannot be empty")
    # Preserve a clear contract instead of silently guessing missing fields.
    return dict(payload)
```

**Naive approach:** accept arbitrary input and hope the model or UI can infer intent.

**Correct approach:** validate the shape and domain constraints before expensive work; return an actionable error when the contract is violated.

**Boundary check:**
```javascript
function isValidRealtimeMlUiRequest(payload) {
  // Reject malformed data before it enters application state.
  return payload !== null && typeof payload === "object" && !Array.isArray(payload);
}
```

**Gotcha:** schema-valid data can still be semantically invalid; for example, a numeric score outside the model’s supported range can pass a type check and still produce a misleading result.

**Before / after:**
```javascript
// Before: malformed values quietly flow into a later render.
const visibleResult = response.result || "No result";
// After: preserve the difference between absent, empty, and valid output.
const visibleResult = typeof response.result === "string" ? response.result : "Result unavailable";
```

### 8. Accessible live announcements

Announce status changes without reading every token aloud. This decision should be explicit in code and verified with representative inputs, because downstream UI behavior depends on it.

**Working pattern:**
```python
# Accessible live announcements: keep this boundary explicit so failures can be isolated.
def validate_realtime_ml_ui_input(payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise TypeError("Request payload must be an object")
    if not payload:
        raise ValueError("Request payload cannot be empty")
    # Preserve a clear contract instead of silently guessing missing fields.
    return dict(payload)
```

**Naive approach:** accept arbitrary input and hope the model or UI can infer intent.

**Correct approach:** validate the shape and domain constraints before expensive work; return an actionable error when the contract is violated.

**Boundary check:**
```javascript
function isValidRealtimeMlUiRequest(payload) {
  // Reject malformed data before it enters application state.
  return payload !== null && typeof payload === "object" && !Array.isArray(payload);
}
```

**Gotcha:** schema-valid data can still be semantically invalid; for example, a numeric score outside the model’s supported range can pass a type check and still produce a misleading result.

**Before / after:**
```javascript
// Before: malformed values quietly flow into a later render.
const visibleResult = response.result || "No result";
// After: preserve the difference between absent, empty, and valid output.
const visibleResult = typeof response.result === "string" ? response.result : "Result unavailable";
```

### 9. Safe rendering of generated text

Render model output as text or sanitize any intentionally supported markup. This decision should be explicit in code and verified with representative inputs, because downstream UI behavior depends on it.

**Working pattern:**
```python
# Safe rendering of generated text: keep this boundary explicit so failures can be isolated.
def validate_realtime_ml_ui_input(payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise TypeError("Request payload must be an object")
    if not payload:
        raise ValueError("Request payload cannot be empty")
    # Preserve a clear contract instead of silently guessing missing fields.
    return dict(payload)
```

**Naive approach:** accept arbitrary input and hope the model or UI can infer intent.

**Correct approach:** validate the shape and domain constraints before expensive work; return an actionable error when the contract is violated.

**Boundary check:**
```javascript
function isValidRealtimeMlUiRequest(payload) {
  // Reject malformed data before it enters application state.
  return payload !== null && typeof payload === "object" && !Array.isArray(payload);
}
```

**Gotcha:** schema-valid data can still be semantically invalid; for example, a numeric score outside the model’s supported range can pass a type check and still produce a misleading result.

**Before / after:**
```javascript
// Before: malformed values quietly flow into a later render.
const visibleResult = response.result || "No result";
// After: preserve the difference between absent, empty, and valid output.
const visibleResult = typeof response.result === "string" ? response.result : "Result unavailable";
```

### 10. Backpressure and long responses

Cap output length and avoid unbounded client-side buffers. This decision should be explicit in code and verified with representative inputs, because downstream UI behavior depends on it.

**Working pattern:**
```python
# Backpressure and long responses: keep this boundary explicit so failures can be isolated.
def validate_realtime_ml_ui_input(payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise TypeError("Request payload must be an object")
    if not payload:
        raise ValueError("Request payload cannot be empty")
    # Preserve a clear contract instead of silently guessing missing fields.
    return dict(payload)
```

**Naive approach:** accept arbitrary input and hope the model or UI can infer intent.

**Correct approach:** validate the shape and domain constraints before expensive work; return an actionable error when the contract is violated.

**Boundary check:**
```javascript
function isValidRealtimeMlUiRequest(payload) {
  // Reject malformed data before it enters application state.
  return payload !== null && typeof payload === "object" && !Array.isArray(payload);
}
```

**Gotcha:** schema-valid data can still be semantically invalid; for example, a numeric score outside the model’s supported range can pass a type check and still produce a misleading result.

**Before / after:**
```javascript
// Before: malformed values quietly flow into a later render.
const visibleResult = response.result || "No result";
// After: preserve the difference between absent, empty, and valid output.
const visibleResult = typeof response.result === "string" ? response.result : "Result unavailable";
```

### 11. Retries, idempotency, and cost

Retries must not replay a paid request unless the server supports safe resumption. This decision should be explicit in code and verified with representative inputs, because downstream UI behavior depends on it.

**Working pattern:**
```python
# Retries, idempotency, and cost: keep this boundary explicit so failures can be isolated.
def validate_realtime_ml_ui_input(payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise TypeError("Request payload must be an object")
    if not payload:
        raise ValueError("Request payload cannot be empty")
    # Preserve a clear contract instead of silently guessing missing fields.
    return dict(payload)
```

**Naive approach:** accept arbitrary input and hope the model or UI can infer intent.

**Correct approach:** validate the shape and domain constraints before expensive work; return an actionable error when the contract is violated.

**Boundary check:**
```javascript
function isValidRealtimeMlUiRequest(payload) {
  // Reject malformed data before it enters application state.
  return payload !== null && typeof payload === "object" && !Array.isArray(payload);
}
```

**Gotcha:** schema-valid data can still be semantically invalid; for example, a numeric score outside the model’s supported range can pass a type check and still produce a misleading result.

**Before / after:**
```javascript
// Before: malformed values quietly flow into a later render.
const visibleResult = response.result || "No result";
// After: preserve the difference between absent, empty, and valid output.
const visibleResult = typeof response.result === "string" ? response.result : "Result unavailable";
```

### 12. Proxy buffering and observability

Reverse proxies may buffer chunks; verify deployment behavior end to end. This decision should be explicit in code and verified with representative inputs, because downstream UI behavior depends on it.

**Working pattern:**
```python
# Proxy buffering and observability: keep this boundary explicit so failures can be isolated.
def validate_realtime_ml_ui_input(payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise TypeError("Request payload must be an object")
    if not payload:
        raise ValueError("Request payload cannot be empty")
    # Preserve a clear contract instead of silently guessing missing fields.
    return dict(payload)
```

**Naive approach:** accept arbitrary input and hope the model or UI can infer intent.

**Correct approach:** validate the shape and domain constraints before expensive work; return an actionable error when the contract is violated.

**Boundary check:**
```javascript
function isValidRealtimeMlUiRequest(payload) {
  // Reject malformed data before it enters application state.
  return payload !== null && typeof payload === "object" && !Array.isArray(payload);
}
```

**Gotcha:** schema-valid data can still be semantically invalid; for example, a numeric score outside the model’s supported range can pass a type check and still produce a misleading result.

**Before / after:**
```javascript
// Before: malformed values quietly flow into a later render.
const visibleResult = response.result || "No result";
// After: preserve the difference between absent, empty, and valid output.
const visibleResult = typeof response.result === "string" ? response.result : "Result unavailable";
```

---

## Relevant Patterns / Integration Patterns / Advanced Patterns
### Pattern 1: SSE event stream

**What it does:** Use named events for content, completion, and errors.
**When to use it:** Use this when implementing sse event stream in a public-facing AI feature where correctness, user trust, and debuggability matter.

```typescript
// Keep the boundary typed so UI code cannot depend on provider-specific internals.
type FeatureResult = {
  status: "ok" | "error";
  message: string;
  requestId?: string;
};

function presentResult(result: FeatureResult): string {
  if (result.status === "error") return "This feature is temporarily unavailable.";
  return result.message;
}
```

Do not use this pattern to hide a fundamental model failure; surface an explicit recovery path and record a non-sensitive diagnostic event.

### Pattern 2: Incremental fetch reader

**What it does:** Decode byte chunks and assemble complete protocol frames.
**When to use it:** Use this when implementing incremental fetch reader in a public-facing AI feature where correctness, user trust, and debuggability matter.

```typescript
// Keep the boundary typed so UI code cannot depend on provider-specific internals.
type FeatureResult = {
  status: "ok" | "error";
  message: string;
  requestId?: string;
};

function presentResult(result: FeatureResult): string {
  if (result.status === "error") return "This feature is temporarily unavailable.";
  return result.message;
}
```

Do not use this pattern to hide a fundamental model failure; surface an explicit recovery path and record a non-sensitive diagnostic event.

### Pattern 3: Cancel generation

**What it does:** Connect a visible stop control to AbortController and server cancellation.
**When to use it:** Use this when implementing cancel generation in a public-facing AI feature where correctness, user trust, and debuggability matter.

```typescript
// Keep the boundary typed so UI code cannot depend on provider-specific internals.
type FeatureResult = {
  status: "ok" | "error";
  message: string;
  requestId?: string;
};

function presentResult(result: FeatureResult): string {
  if (result.status === "error") return "This feature is temporarily unavailable.";
  return result.message;
}
```

Do not use this pattern to hide a fundamental model failure; surface an explicit recovery path and record a non-sensitive diagnostic event.

### Pattern 4: Accessible progress status

**What it does:** Announce state changes without announcing every token.
**When to use it:** Use this when implementing accessible progress status in a public-facing AI feature where correctness, user trust, and debuggability matter.

```typescript
// Keep the boundary typed so UI code cannot depend on provider-specific internals.
type FeatureResult = {
  status: "ok" | "error";
  message: string;
  requestId?: string;
};

function presentResult(result: FeatureResult): string {
  if (result.status === "error") return "This feature is temporarily unavailable.";
  return result.message;
}
```

Do not use this pattern to hide a fundamental model failure; surface an explicit recovery path and record a non-sensitive diagnostic event.

### Pattern 5: Buffered render updates

**What it does:** Batch text updates to avoid excessive re-rendering.
**When to use it:** Use this when implementing buffered render updates in a public-facing AI feature where correctness, user trust, and debuggability matter.

```typescript
// Keep the boundary typed so UI code cannot depend on provider-specific internals.
type FeatureResult = {
  status: "ok" | "error";
  message: string;
  requestId?: string;
};

function presentResult(result: FeatureResult): string {
  if (result.status === "error") return "This feature is temporarily unavailable.";
  return result.message;
}
```

Do not use this pattern to hide a fundamental model failure; surface an explicit recovery path and record a non-sensitive diagnostic event.

### Pattern 6: Stream interruption recovery

**What it does:** Show partial output and a retry action without duplicating prior text.
**When to use it:** Use this when implementing stream interruption recovery in a public-facing AI feature where correctness, user trust, and debuggability matter.

```typescript
// Keep the boundary typed so UI code cannot depend on provider-specific internals.
type FeatureResult = {
  status: "ok" | "error";
  message: string;
  requestId?: string;
};

function presentResult(result: FeatureResult): string {
  if (result.status === "error") return "This feature is temporarily unavailable.";
  return result.message;
}
```

Do not use this pattern to hide a fundamental model failure; surface an explicit recovery path and record a non-sensitive diagnostic event.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Trusting every model answer | Fluent language is mistaken for evidence. | Require source-grounded claims and abstain when no supporting chunk is available. |
| Sending provider secrets to the browser | A quick prototype skips the server boundary. | Move provider calls into a server route and read credentials from environment configuration. |
| Ignoring malformed inputs | The happy path dominates development. | Validate type, size, required fields, and domain ranges at the API boundary. |
| Treating a score as certainty | The visual or copy implies probability without calibration. | Label the metric accurately and show calibration evidence before calling it a probability. |
| No timeout on upstream calls | The model is assumed to always respond. | Set a deadline and return a controlled timeout state with a retry option. |
| Retrying every failure blindly | Retries appear to improve reliability without considering cost. | Retry only transient failures, cap attempts, and use an idempotency strategy where supported. |
| Logging complete prompts by default | Debugging convenience overrides privacy. | Log request IDs, latency, token counts, and redacted error categories instead. |
| Using untrusted text as instructions | Retrieved or user-provided text is concatenated into the prompt. | Delimit evidence as data and explicitly deny it authority over system policy. |
| No empty-state design | Design is reviewed only with populated data. | Render an intentional empty state with an example question or next step. |
| No mobile layout test | Desktop data density is assumed to scale down. | Use responsive layout constraints and test narrow viewports with long output. |
| Ignoring cancellation | Only completion is modeled in the UI. | Propagate AbortSignal and ensure cancelled responses cannot overwrite newer state. |
| Unbounded output length | The model is allowed to fill the whole context window. | Set an output token ceiling and a product-specific response length target. |
| Unclear error messages | Raw provider errors leak into user-facing copy. | Map internal failures to safe messages and attach a traceable request ID. |
| No evaluation set | A successful demo is treated as proof of quality. | Maintain regression questions or payloads and run them on every prompt/model change. |
| No keyboard path | Interaction is designed around hover and pointer events. | Use semantic controls, visible focus, and keyboard-operable alternatives. |
| Hard-coded model assumptions | One provider/model version is treated as permanent. | Centralize model configuration and test behavior before changing the deployment target. |

**Before → after:**
```javascript
// Before: expose raw internal details and make recovery impossible.
setError(String(error));
// After: give the user a safe action while keeping diagnostics server-side.
setError("We could not complete that request. Please try again shortly.");
```

---

## Mental Models

1. **Evidence before eloquence** — a persuasive answer is not a correct answer until its claims are supported.
2. **Boundaries beat prompts** — security and validation belong in architecture, not only in instructions to a model.
3. **Every async path has an ending** — success, failure, timeout, and cancellation all need defined UI states.
4. **Measure the pipeline, not the demo** — isolate retrieval, inference, rendering, and latency before changing components.
5. **The browser is untrusted** — anything shipped to the client can be inspected or modified by the visitor.
6. **Uncertainty is product information** — explain confidence limits rather than concealing them behind polished visuals.
7. **Small contracts scale** — explicit request and response shapes reduce coordination cost across frontend and backend.

---

## Quick Reference

| Situation | Recommended decision | Notes |
|---|---|---|
| Provider credential | Server environment variable | Never bundle secrets into client assets. |
| Input validation | Schema plus domain checks | Reject before costly inference. |
| Timeout | Explicit request deadline | Return a recoverable UI state. |
| Public knowledge | Allowlisted source registry | Keep private notes out of ingestion. |
| Retrieval | Hybrid or vector search as justified | Measure recall on real questions. |
| Generation | Bounded output and clear instruction hierarchy | Treat retrieved text as untrusted. |
| Citations | Stable source identifiers | Link claims to actual evidence. |
| No evidence | Abstain gracefully | Do not guess credentials or facts. |
| Streaming | SSE or incremental fetch reader | Parse events across arbitrary chunks. |
| Cancellation | AbortSignal plus server support | Prevent stale output from rendering. |
| Visualization | Choose by data density and task | Pair with text/table when needed. |
| Uncertainty | Show calibrated ranges or limitations | Do not relabel raw scores as probability. |
| Error response | Safe message plus request ID | Keep tracebacks server-side. |
| Rate limiting | Per-user/IP limits and budget ceilings | Protect public endpoints. |
| Logging | Redacted structured events | Avoid unnecessary prompt retention. |
| Accessibility | Semantic controls and status region | Test keyboard and screen reader behavior. |
| Model change | Version and regression test | Prompt changes can alter output quality. |
| Artifact deployment | Pin dependencies and artifact hash | Keep preprocessing compatible. |
| CORS | Allow known origins | CORS does not authenticate requests. |
| Evaluation | Versioned test set and acceptance thresholds | Include failure and adversarial cases. |

---

## Build Challenge

### Build: Realtime ML UI — production-minded portfolio feature

Create a working realtime ml ui that fits a polished portfolio and can be evaluated without access to private services. Build it in one focused session using a small, deterministic dataset or mocked provider where appropriate; keep all secrets out of browser code.

#### Numbered requirements
1. Define a written user job and a supported-use boundary.
2. Implement a typed request and response contract.
3. Validate malformed, oversized, and semantically invalid inputs.
4. Keep provider credentials and privileged operations server-side.
5. Add explicit loading, success, empty, error, timeout, and cancellation states where applicable.
6. Provide a keyboard-accessible interaction path and visible focus.
7. Add a responsive layout that works at 360px wide and desktop widths.
8. Include a deterministic fallback for provider or model unavailability.
9. Record latency and outcome metadata without logging sensitive content by default.
10. Add rate or resource limits appropriate to a public demo.
11. Include at least five regression cases covering success and failure.
12. Document known limitations and the source of any factual claims.
13. Add a health/status check or a visible diagnostic mode for development.
14. Test slow network behavior and a mid-request failure.
15. Provide a concise README with setup, architecture, and deployment notes.

#### Suggested implementation sequence
1. Write the contract and one success test before building the UI.
2. Implement the service boundary and deterministic test fixture.
3. Add the frontend states and accessibility behavior.
4. Add observability, limits, and failure-path tests.
5. Review claims, privacy, and mobile behavior before deploying.

#### Definition of Done
The feature returns correct, contract-compliant results for valid inputs; rejects invalid inputs safely; never exposes credentials; remains usable on mobile and with a keyboard; recovers from timeout and cancellation; and documents measurable limitations. A successful build includes a short screen recording or screenshots, regression results, and a README explaining how to run it locally.

**Success criteria:** all 15 requirements are checked, no unhandled promise or server exception reaches the visitor, and the demo’s visible promise matches what the implementation actually supports.

### Operational review checklist for realtime ml ui

Before shipping, inspect the feature as if you were the engineer who will be paged when it fails. Start in browser DevTools Network: verify the request destination, status code, response size, timing, and whether the stream or payload is actually arriving incrementally. Inspect the Console for unhandled rejections, hydration warnings, and rendering errors. In the server logs, correlate requests by a non-sensitive request ID and distinguish validation failures, upstream timeouts, rate-limit responses, and internal exceptions. A single generic “failed” metric is not enough to decide what to fix.

Run a small adversarial test set. Include a blank input, a very long input, unexpected types, Unicode, repeated submission, slow upstream response, disconnect during response, and an input that attempts to override system instructions. For retrieval features, include a question whose answer is deliberately absent from the corpus and verify that the product abstains. For visualizations, include an empty array, a single observation, extreme values, and a data set large enough to reveal frame drops. For copy, ask a reviewer to identify which claims are supported by evidence and which are product hypotheses. For model-serving APIs, restart the service and confirm that readiness reflects whether the artifact has loaded.

Do not optimize only for the average successful request. Inspect p95 latency, failure rate, cost per completed task, and the proportion of requests that end in a useful outcome. A fast but unsupported answer is not a success; neither is a beautiful chart that hides missing values. Establish thresholds that match the product and document who owns changes to prompts, models, source data, and public claims. Keep rollbacks simple: a feature flag or server-side configuration should be able to disable the AI path while leaving the rest of the website functional.

**Security and privacy review:** confirm that credentials are injected at runtime, request bodies are size-limited, user input is treated as untrusted, access controls are enforced server-side, and logs do not accidentally retain sensitive content. Apply an explicit retention policy to any stored conversation or inference record. CORS controls browser access but does not replace authentication, authorization, abuse prevention, or server-side validation. If the feature processes personal or client-confidential data, do not use real data in portfolio fixtures; use synthetic data and state the boundary clearly.

**Release note template:** “This release adds realtime ml ui for [SUPPORTED USER TASK]. It accepts [INPUT TYPES], returns [OUTPUT SHAPE], and is evaluated against [TEST SET]. Known limits include [LIMITATIONS]. The fallback is [FALLBACK]. The owner should review [MODEL/PROMPT/SOURCE] when [TRIGGER].” Fill the bracketed fields from verified implementation details before publishing; do not present the template itself as user-facing product copy.

## Production scenarios and decision notes

### Scenario 1: A stream can end without a completion event because a proxy or network failed; treat missing terminal protocol state as interruption, not success.

A stream can end without a completion event because a proxy or network failed; treat missing terminal protocol state as interruption, not success. The practical response is to reproduce the case in a test fixture, write down the expected behavior, and make the relevant boundary observable. Avoid “fixes” that merely suppress the visible symptom while preserving the underlying ambiguity.

### Scenario 2: If partial text is persisted, store the request identity and terminal status so a reconnect does not accidentally append a duplicate generation.

If partial text is persisted, store the request identity and terminal status so a reconnect does not accidentally append a duplicate generation. The practical response is to reproduce the case in a test fixture, write down the expected behavior, and make the relevant boundary observable. Avoid “fixes” that merely suppress the visible symptom while preserving the underlying ambiguity.

### Scenario 3: Some screen readers will announce every update in a live region; announce state transitions and keep the full text available in a normal document region.

Some screen readers will announce every update in a live region; announce state transitions and keep the full text available in a normal document region. The practical response is to reproduce the case in a test fixture, write down the expected behavior, and make the relevant boundary observable. Avoid “fixes” that merely suppress the visible symptom while preserving the underlying ambiguity.

## Senior implementation notes: stream correctness

Do not assume that each network read contains one complete event or one complete token. The browser may receive half a JSON line, several events together, or a multi-byte character split across reads. A parser must retain its incomplete buffer between reads and only dispatch an event when its delimiter is present. On disconnect, distinguish a completed generation from a partial one; the user should be able to copy the partial text, retry explicitly, or cancel without accidentally paying for duplicate work.

```javascript
javascript
// Decode UTF-8 incrementally so a multi-byte character can span reads.
const decoder = new TextDecoder();
function decodeChunk(bytes, isFinal = false) {
  return decoder.decode(bytes, { stream: !isFinal });
}

```

### Additional validation cases

The happy path is only one slice of the contract. Add a regression case for a missing field, a value at the supported boundary, a value just beyond that boundary, an empty result, and a dependency failure. For user-facing AI behavior, also include an adversarial instruction embedded inside user content or retrieved material. Write down the expected state and message for each case so that a refactor cannot quietly change the product’s promise.

When reviewing a pull request, ask three questions: can the input be trusted, can the output be interpreted without guessing, and can the failure be diagnosed without exposing private data? If any answer is no, add a boundary or a test before adding polish. This review habit is especially valuable in portfolio demos because the public internet supplies malformed inputs and unexpected traffic even when the project is small.

### Verification snippet 1: stream correctness

```javascript
// Keep the feature deterministic at the boundary under test.
const caseName0 = "realtime-ml-ui-case-1";
const hasUsableInput0 = (value) => value !== null && value !== undefined;
if (!hasUsableInput0(null)) {
  console.info(`${caseName0}: rejected missing input`);
}
```

### Verification snippet 2: stream correctness

```javascript
// Keep the feature deterministic at the boundary under test.
const caseName1 = "realtime-ml-ui-case-2";
const hasUsableInput1 = (value) => value !== null && value !== undefined;
if (!hasUsableInput1(null)) {
  console.info(`${caseName1}: rejected missing input`);
}
```

### Verification snippet 3: stream correctness

```javascript
// Keep the feature deterministic at the boundary under test.
const caseName2 = "realtime-ml-ui-case-3";
const hasUsableInput2 = (value) => value !== null && value !== undefined;
if (!hasUsableInput2(null)) {
  console.info(`${caseName2}: rejected missing input`);
}
```

### Verification snippet 4: stream correctness

```javascript
// Keep the feature deterministic at the boundary under test.
const caseName3 = "realtime-ml-ui-case-4";
const hasUsableInput3 = (value) => value !== null && value !== undefined;
if (!hasUsableInput3(null)) {
  console.info(`${caseName3}: rejected missing input`);
}
```

### Verification snippet 5: stream correctness

```javascript
// Keep the feature deterministic at the boundary under test.
const caseName4 = "realtime-ml-ui-case-5";
const hasUsableInput4 = (value) => value !== null && value !== undefined;
if (!hasUsableInput4(null)) {
  console.info(`${caseName4}: rejected missing input`);
}
```

### Verification snippet 6: stream correctness

```javascript
// Keep the feature deterministic at the boundary under test.
const caseName5 = "realtime-ml-ui-case-6";
const hasUsableInput5 = (value) => value !== null && value !== undefined;
if (!hasUsableInput5(null)) {
  console.info(`${caseName5}: rejected missing input`);
}
```

### Verification snippet 7: stream correctness

```javascript
// Keep the feature deterministic at the boundary under test.
const caseName6 = "realtime-ml-ui-case-7";
const hasUsableInput6 = (value) => value !== null && value !== undefined;
if (!hasUsableInput6(null)) {
  console.info(`${caseName6}: rejected missing input`);
}
```

### Verification snippet 8: stream correctness

```javascript
// Keep the feature deterministic at the boundary under test.
const caseName7 = "realtime-ml-ui-case-8";
const hasUsableInput7 = (value) => value !== null && value !== undefined;
if (!hasUsableInput7(null)) {
  console.info(`${caseName7}: rejected missing input`);
}
```
