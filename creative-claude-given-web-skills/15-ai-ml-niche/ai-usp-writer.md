# SKILL: ai-usp-writer
**Layer:** 15 — AI/ML Niche
**Goal:** Write credible AI product positioning that connects a real capability to a customer outcome, explains limits, and avoids unsupported claims.

---

## Why This Matters (Senior Perspective)
AI copy is unusually easy to overstate. Phrases such as “understands everything,” “100% accurate,” or “fully autonomous” create expectations that the product may not meet. The resulting gap appears in demos, onboarding, support tickets, procurement reviews, and sometimes legal review. A landing page that lists model names without explaining the customer benefit sounds technical but does not help buyers decide whether the product solves their problem.

A senior writer treats every claim as a hypothesis requiring evidence. They distinguish what the model does, what the workflow enables, and what the customer gets. They ask for a real before-and-after workflow, a measurable result, known failure conditions, data handling details, and a human review path. If evidence is missing, the copy should describe the capability precisely rather than invent a percentage or imply guaranteed outcomes. The best USP is specific enough to be falsifiable.

For creative web work, AI positioning must survive both the hero section and the implementation. The promise on the page should match the product’s actual interface, supported inputs, latency, and limitations. A concise value proposition can still be compelling: identify the audience, the costly task, the mechanism, and the evidence. Pair persuasive copy with a transparent “how it works” section and an honest account of where human judgment remains necessary.

---

## Core Concepts
### 1. Separate feature from outcome

A feature describes a mechanism; an outcome describes why the buyer cares. This decision should be explicit in code and verified with representative inputs, because downstream UI behavior depends on it.

**Working pattern:**
```python
# Separate feature from outcome: keep this boundary explicit so failures can be isolated.
def validate_ai_usp_writer_input(payload: dict) -> dict:
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
function isValidAiUspWriterRequest(payload) {
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

### 2. Identify the audience and costly job

Name a role and workflow, not an abstract demographic. This decision should be explicit in code and verified with representative inputs, because downstream UI behavior depends on it.

**Working pattern:**
```python
# Identify the audience and costly job: keep this boundary explicit so failures can be isolated.
def validate_ai_usp_writer_input(payload: dict) -> dict:
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
function isValidAiUspWriterRequest(payload) {
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

### 3. Build a claim-evidence ledger

Record the source and confidence behind each marketing claim. This decision should be explicit in code and verified with representative inputs, because downstream UI behavior depends on it.

**Working pattern:**
```python
# Build a claim-evidence ledger: keep this boundary explicit so failures can be isolated.
def validate_ai_usp_writer_input(payload: dict) -> dict:
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
function isValidAiUspWriterRequest(payload) {
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

### 4. Describe the mechanism plainly

Explain what the system does in language the buyer uses at work. This decision should be explicit in code and verified with representative inputs, because downstream UI behavior depends on it.

**Working pattern:**
```python
# Describe the mechanism plainly: keep this boundary explicit so failures can be isolated.
def validate_ai_usp_writer_input(payload: dict) -> dict:
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
function isValidAiUspWriterRequest(payload) {
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

### 5. Quantify only verified outcomes

Never convert a benchmark into a customer outcome without evidence. This decision should be explicit in code and verified with representative inputs, because downstream UI behavior depends on it.

**Working pattern:**
```python
# Quantify only verified outcomes: keep this boundary explicit so failures can be isolated.
def validate_ai_usp_writer_input(payload: dict) -> dict:
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
function isValidAiUspWriterRequest(payload) {
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

### 6. Explain limits without undermining value

A limitation can increase trust when it clarifies the right use case. This decision should be explicit in code and verified with representative inputs, because downstream UI behavior depends on it.

**Working pattern:**
```python
# Explain limits without undermining value: keep this boundary explicit so failures can be isolated.
def validate_ai_usp_writer_input(payload: dict) -> dict:
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
function isValidAiUspWriterRequest(payload) {
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

### 7. Differentiate from generic AI claims

Differentiate by workflow, data, controls, or integration—not model hype. This decision should be explicit in code and verified with representative inputs, because downstream UI behavior depends on it.

**Working pattern:**
```python
# Differentiate from generic AI claims: keep this boundary explicit so failures can be isolated.
def validate_ai_usp_writer_input(payload: dict) -> dict:
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
function isValidAiUspWriterRequest(payload) {
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

### 8. Translate technical terms

Define necessary terms in context instead of stacking acronyms. This decision should be explicit in code and verified with representative inputs, because downstream UI behavior depends on it.

**Working pattern:**
```python
# Translate technical terms: keep this boundary explicit so failures can be isolated.
def validate_ai_usp_writer_input(payload: dict) -> dict:
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
function isValidAiUspWriterRequest(payload) {
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

### 9. Write headline-subhead-proof hierarchy

Headline earns attention; proof earns belief; CTA earns the next step. This decision should be explicit in code and verified with representative inputs, because downstream UI behavior depends on it.

**Working pattern:**
```python
# Write headline-subhead-proof hierarchy: keep this boundary explicit so failures can be isolated.
def validate_ai_usp_writer_input(payload: dict) -> dict:
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
function isValidAiUspWriterRequest(payload) {
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

### 10. Handle trust, privacy, and review

Tell users what data is processed and where human review fits. This decision should be explicit in code and verified with representative inputs, because downstream UI behavior depends on it.

**Working pattern:**
```python
# Handle trust, privacy, and review: keep this boundary explicit so failures can be isolated.
def validate_ai_usp_writer_input(payload: dict) -> dict:
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
function isValidAiUspWriterRequest(payload) {
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

### 11. Run message testing

Test comprehension and qualified conversion, not clicks alone. This decision should be explicit in code and verified with representative inputs, because downstream UI behavior depends on it.

**Working pattern:**
```python
# Run message testing: keep this boundary explicit so failures can be isolated.
def validate_ai_usp_writer_input(payload: dict) -> dict:
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
function isValidAiUspWriterRequest(payload) {
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

### 12. Maintain claim governance

Assign an owner and review date to claims that can become stale. This decision should be explicit in code and verified with representative inputs, because downstream UI behavior depends on it.

**Working pattern:**
```python
# Maintain claim governance: keep this boundary explicit so failures can be isolated.
def validate_ai_usp_writer_input(payload: dict) -> dict:
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
function isValidAiUspWriterRequest(payload) {
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
### Pattern 1: Claim-evidence ledger

**What it does:** Tie every quantitative or comparative claim to a named source and review date.
**When to use it:** Use this when implementing claim-evidence ledger in a public-facing AI feature where correctness, user trust, and debuggability matter.

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

### Pattern 2: Outcome-first hero

**What it does:** Lead with a workflow result, then explain the AI mechanism.
**When to use it:** Use this when implementing outcome-first hero in a public-facing AI feature where correctness, user trust, and debuggability matter.

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

### Pattern 3: Trust-and-limits panel

**What it does:** Explain data handling, human review, and known failure boundaries.
**When to use it:** Use this when implementing trust-and-limits panel in a public-facing AI feature where correctness, user trust, and debuggability matter.

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

### Pattern 4: Before/after workflow story

**What it does:** Describe the old process and the exact step the product changes.
**When to use it:** Use this when implementing before/after workflow story in a public-facing AI feature where correctness, user trust, and debuggability matter.

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

### Pattern 5: Audience-specific message variant

**What it does:** Use the vocabulary and success metric of one buyer role per variant.
**When to use it:** Use this when implementing audience-specific message variant in a public-facing AI feature where correctness, user trust, and debuggability matter.

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

### Pattern 6: Claim review gate

**What it does:** Block publication when evidence is missing or a claim has expired.
**When to use it:** Use this when implementing claim review gate in a public-facing AI feature where correctness, user trust, and debuggability matter.

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

### Build: AI USP writer — production-minded portfolio feature

Create a working ai usp writer that fits a polished portfolio and can be evaluated without access to private services. Build it in one focused session using a small, deterministic dataset or mocked provider where appropriate; keep all secrets out of browser code.

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

### Operational review checklist for ai usp writer

Before shipping, inspect the feature as if you were the engineer who will be paged when it fails. Start in browser DevTools Network: verify the request destination, status code, response size, timing, and whether the stream or payload is actually arriving incrementally. Inspect the Console for unhandled rejections, hydration warnings, and rendering errors. In the server logs, correlate requests by a non-sensitive request ID and distinguish validation failures, upstream timeouts, rate-limit responses, and internal exceptions. A single generic “failed” metric is not enough to decide what to fix.

Run a small adversarial test set. Include a blank input, a very long input, unexpected types, Unicode, repeated submission, slow upstream response, disconnect during response, and an input that attempts to override system instructions. For retrieval features, include a question whose answer is deliberately absent from the corpus and verify that the product abstains. For visualizations, include an empty array, a single observation, extreme values, and a data set large enough to reveal frame drops. For copy, ask a reviewer to identify which claims are supported by evidence and which are product hypotheses. For model-serving APIs, restart the service and confirm that readiness reflects whether the artifact has loaded.

Do not optimize only for the average successful request. Inspect p95 latency, failure rate, cost per completed task, and the proportion of requests that end in a useful outcome. A fast but unsupported answer is not a success; neither is a beautiful chart that hides missing values. Establish thresholds that match the product and document who owns changes to prompts, models, source data, and public claims. Keep rollbacks simple: a feature flag or server-side configuration should be able to disable the AI path while leaving the rest of the website functional.

**Security and privacy review:** confirm that credentials are injected at runtime, request bodies are size-limited, user input is treated as untrusted, access controls are enforced server-side, and logs do not accidentally retain sensitive content. Apply an explicit retention policy to any stored conversation or inference record. CORS controls browser access but does not replace authentication, authorization, abuse prevention, or server-side validation. If the feature processes personal or client-confidential data, do not use real data in portfolio fixtures; use synthetic data and state the boundary clearly.

**Release note template:** “This release adds ai usp writer for [SUPPORTED USER TASK]. It accepts [INPUT TYPES], returns [OUTPUT SHAPE], and is evaluated against [TEST SET]. Known limits include [LIMITATIONS]. The fallback is [FALLBACK]. The owner should review [MODEL/PROMPT/SOURCE] when [TRIGGER].” Fill the bracketed fields from verified implementation details before publishing; do not present the template itself as user-facing product copy.

## Production scenarios and decision notes

### Scenario 1: A benchmark measured on a curated data set is not a guarantee for every customer environment; include the data conditions near the claim.

A benchmark measured on a curated data set is not a guarantee for every customer environment; include the data conditions near the claim. The practical response is to reproduce the case in a test fixture, write down the expected behavior, and make the relevant boundary observable. Avoid “fixes” that merely suppress the visible symptom while preserving the underlying ambiguity.

### Scenario 2: “Human-in-the-loop” is not a sufficient explanation by itself

“Human-in-the-loop” is not a sufficient explanation by itself: state which decisions need review and what the reviewer can change. The practical response is to reproduce the case in a test fixture, write down the expected behavior, and make the relevant boundary observable. Avoid “fixes” that merely suppress the visible symptom while preserving the underlying ambiguity.

### Scenario 3: If a product supports multiple workflows, lead with one primary job and give the other workflows their own evidence and copy hierarchy.

If a product supports multiple workflows, lead with one primary job and give the other workflows their own evidence and copy hierarchy. The practical response is to reproduce the case in a test fixture, write down the expected behavior, and make the relevant boundary observable. Avoid “fixes” that merely suppress the visible symptom while preserving the underlying ambiguity.

## Senior implementation notes: evidence discipline

Use a claim ledger during discovery. For each proposed headline or metric, record the exact product behavior, evidence source, test population, limitations, approval owner, and review date. If a claim says “cuts review time by 40%,” ask whether the measurement is a controlled comparison, how many workflows were sampled, and whether setup time was included. If the evidence cannot answer those questions, replace the number with a precise qualitative claim until stronger evidence exists. Clear boundaries are not weak copy; they help the right customer trust the promise.

```typescript
typescript
// A marketing claim should not ship without evidence metadata.
type Claim = { text: string; evidenceUrl: string; reviewedAt: string; owner: string };
function canPublishClaim(claim: Claim): boolean {
  return Boolean(claim.text.trim() && claim.evidenceUrl.startsWith("https://")
    && claim.owner.trim() && Number.isFinite(Date.parse(claim.reviewedAt)));
}

```

### Additional validation cases

The happy path is only one slice of the contract. Add a regression case for a missing field, a value at the supported boundary, a value just beyond that boundary, an empty result, and a dependency failure. For user-facing AI behavior, also include an adversarial instruction embedded inside user content or retrieved material. Write down the expected state and message for each case so that a refactor cannot quietly change the product’s promise.

When reviewing a pull request, ask three questions: can the input be trusted, can the output be interpreted without guessing, and can the failure be diagnosed without exposing private data? If any answer is no, add a boundary or a test before adding polish. This review habit is especially valuable in portfolio demos because the public internet supplies malformed inputs and unexpected traffic even when the project is small.

### Verification snippet 1: evidence discipline

```javascript
// Keep the feature deterministic at the boundary under test.
const caseName0 = "ai-usp-writer-case-1";
const hasUsableInput0 = (value) => value !== null && value !== undefined;
if (!hasUsableInput0(null)) {
  console.info(`${caseName0}: rejected missing input`);
}
```

### Verification snippet 2: evidence discipline

```javascript
// Keep the feature deterministic at the boundary under test.
const caseName1 = "ai-usp-writer-case-2";
const hasUsableInput1 = (value) => value !== null && value !== undefined;
if (!hasUsableInput1(null)) {
  console.info(`${caseName1}: rejected missing input`);
}
```

### Verification snippet 3: evidence discipline

```javascript
// Keep the feature deterministic at the boundary under test.
const caseName2 = "ai-usp-writer-case-3";
const hasUsableInput2 = (value) => value !== null && value !== undefined;
if (!hasUsableInput2(null)) {
  console.info(`${caseName2}: rejected missing input`);
}
```

### Verification snippet 4: evidence discipline

```javascript
// Keep the feature deterministic at the boundary under test.
const caseName3 = "ai-usp-writer-case-4";
const hasUsableInput3 = (value) => value !== null && value !== undefined;
if (!hasUsableInput3(null)) {
  console.info(`${caseName3}: rejected missing input`);
}
```

### Verification snippet 5: evidence discipline

```javascript
// Keep the feature deterministic at the boundary under test.
const caseName4 = "ai-usp-writer-case-5";
const hasUsableInput4 = (value) => value !== null && value !== undefined;
if (!hasUsableInput4(null)) {
  console.info(`${caseName4}: rejected missing input`);
}
```

### Verification snippet 6: evidence discipline

```javascript
// Keep the feature deterministic at the boundary under test.
const caseName5 = "ai-usp-writer-case-6";
const hasUsableInput5 = (value) => value !== null && value !== undefined;
if (!hasUsableInput5(null)) {
  console.info(`${caseName5}: rejected missing input`);
}
```

### Verification snippet 7: evidence discipline

```javascript
// Keep the feature deterministic at the boundary under test.
const caseName6 = "ai-usp-writer-case-7";
const hasUsableInput6 = (value) => value !== null && value !== undefined;
if (!hasUsableInput6(null)) {
  console.info(`${caseName6}: rejected missing input`);
}
```

### Verification snippet 8: evidence discipline

```javascript
// Keep the feature deterministic at the boundary under test.
const caseName7 = "ai-usp-writer-case-8";
const hasUsableInput7 = (value) => value !== null && value !== undefined;
if (!hasUsableInput7(null)) {
  console.info(`${caseName7}: rejected missing input`);
}
```
