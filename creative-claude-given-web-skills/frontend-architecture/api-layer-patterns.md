# SKILL: api-layer-patterns
**Layer:** 22 — Frontend Architecture
**Goal:** Centralize frontend network behavior behind typed, testable API modules with consistent validation, authentication handling, cancellation, and error semantics.

---

## Why This Matters (Senior Perspective)
When every component calls `fetch` directly, the frontend develops several incompatible network stacks. One page forgets credentials, another parses JSON before checking `response.ok`, a third silently treats a 403 as an empty list, and a fourth retries a non-idempotent request after a timeout. These bugs are especially costly in checkout, account settings, and dashboards because the UI can display false success while the server rejected the operation. Duplicated URL construction and token handling also make migrations and security fixes slow.

Senior engineers treat the API layer as a boundary between unreliable remote systems and predictable UI state. The layer owns base URLs, request headers, serialization, response parsing, cancellation, status interpretation, and telemetry-safe error normalization. It does not swallow every error or force every endpoint into one generic abstraction. It separates transport errors from validation failures and authorization failures, models endpoint-specific contracts, and ensures components receive either usable data or a meaningful typed failure. Runtime validation remains valuable even with TypeScript because the server response is external input.

In creative sites, API calls often support CMS content, project galleries, contact forms, search, and user-specific dashboards. The API layer should preserve responsive interactions without allowing secrets into browser bundles. Public browser configuration may contain a public API base URL, but privileged keys must remain server-side. It should also support aborting stale search requests, avoiding duplicate submissions, and presenting accessible loading and retry states when a network is slow or offline.

---

## Core Concepts

### 1. Create one transport boundary

Centralize base URL, headers, parsing, and status interpretation.

Start by identifying the failure boundary: what changes, who owns it, and which consumers must remain unaffected. This question is more useful than asking where a file should live or whether a component is sufficiently reusable. A boundary should make dependencies visible and reduce the number of places a maintainer must inspect.

```ts
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(
      `Request failed with status ${response.status}`,
      response.status,
      response.headers.get("x-request-id") ?? undefined,
    );
  }
  return response.json() as Promise<T>;
}
```

**Wrong approach:** Let each consumer make its own decision about create one transport boundary, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 2. Model endpoint contracts

Give each endpoint explicit request and response types plus runtime validation where needed.

Prefer explicit contracts over hidden conventions. A teammate should be able to understand valid inputs, outputs, failure states, and ownership by reading the module boundary. When the contract depends on undocumented import order or a global mutable singleton, the architecture is brittle even if the current screen looks correct.

```ts
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(
      `Request failed with status ${response.status}`,
      response.status,
      response.headers.get("x-request-id") ?? undefined,
    );
  }
  return response.json() as Promise<T>;
}
```

**Wrong approach:** Let each consumer make its own decision about model endpoint contracts, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 3. Normalize errors without erasing meaning

Represent network, HTTP, validation, and abort failures distinctly.

Compare the naive approach with the production approach. The naive version optimizes the first implementation and leaves edge cases to each caller. The production version makes the edge case part of the contract, so every consumer gets consistent behavior and tests can assert it once.

```ts
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(
      `Request failed with status ${response.status}`,
      response.status,
      response.headers.get("x-request-id") ?? undefined,
    );
  }
  return response.json() as Promise<T>;
}
```

**Wrong approach:** Let each consumer make its own decision about normalize errors without erasing meaning, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 4. Handle HTTP status before parsing assumptions

A successful transport does not guarantee a successful HTTP response.

Check the boundary under failure, not only on the happy path. Consider missing configuration, stale data, a slow network, repeated interaction, route changes, malformed input, and a component being mounted or removed quickly. A design that cannot explain these states is not complete.

```ts
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(
      `Request failed with status ${response.status}`,
      response.status,
      response.headers.get("x-request-id") ?? undefined,
    );
  }
  return response.json() as Promise<T>;
}
```

**Wrong approach:** Let each consumer make its own decision about handle http status before parsing assumptions, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 5. Cancel stale requests

Abort search and route requests when newer intent makes old responses irrelevant.

Keep the abstraction proportional to the problem. A wrapper that merely renames a function can add indirection without adding policy. A useful abstraction centralizes a decision, enforces an invariant, or makes a dependency replaceable in tests. Remove abstractions that do none of these.

```ts
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(
      `Request failed with status ${response.status}`,
      response.status,
      response.headers.get("x-request-id") ?? undefined,
    );
  }
  return response.json() as Promise<T>;
}
```

**Wrong approach:** Let each consumer make its own decision about cancel stale requests, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 6. Prevent duplicate mutations

Disable repeat submissions and use server idempotency where supported.

Make observability intentional. Include enough stable context to understand what happened, but exclude credentials, personal data, and large payloads. Prefer structured event names and request identifiers over ad hoc logs that are impossible to correlate across browser and server.

```ts
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(
      `Request failed with status ${response.status}`,
      response.status,
      response.headers.get("x-request-id") ?? undefined,
    );
  }
  return response.json() as Promise<T>;
}
```

**Wrong approach:** Let each consumer make its own decision about prevent duplicate mutations, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 7. Keep credentials out of URLs

URLs leak through logs, history, referrers, and analytics.

Accessibility and performance are architectural concerns because they affect every consumer. Preserve native semantics, keyboard behavior, predictable focus, and meaningful loading states. Avoid importing a heavy optional module into the initial route when a dynamic boundary can defer it.

```ts
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(
      `Request failed with status ${response.status}`,
      response.status,
      response.headers.get("x-request-id") ?? undefined,
    );
  }
  return response.json() as Promise<T>;
}
```

**Wrong approach:** Let each consumer make its own decision about keep credentials out of urls, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 8. Separate retries by request semantics

Retry transient reads cautiously; do not blindly repeat non-idempotent writes.

Use tests to protect the public behavior rather than the internal arrangement. A test that asserts private filenames or exact component nesting makes refactoring expensive. A test that verifies the visible result, request contract, fallback, or permission outcome gives maintainers room to improve internals.

```ts
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(
      `Request failed with status ${response.status}`,
      response.status,
      response.headers.get("x-request-id") ?? undefined,
    );
  }
  return response.json() as Promise<T>;
}
```

**Wrong approach:** Let each consumer make its own decision about separate retries by request semantics, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 9. Validate untrusted response data

TypeScript declarations do not validate bytes received over the network.

Start by identifying the failure boundary: what changes, who owns it, and which consumers must remain unaffected. This question is more useful than asking where a file should live or whether a component is sufficiently reusable. A boundary should make dependencies visible and reduce the number of places a maintainer must inspect.

```ts
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(
      `Request failed with status ${response.status}`,
      response.status,
      response.headers.get("x-request-id") ?? undefined,
    );
  }
  return response.json() as Promise<T>;
}
```

**Wrong approach:** Let each consumer make its own decision about validate untrusted response data, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 10. Respect pagination and rate limits

Represent continuation and retry timing explicitly.

Prefer explicit contracts over hidden conventions. A teammate should be able to understand valid inputs, outputs, failure states, and ownership by reading the module boundary. When the contract depends on undocumented import order or a global mutable singleton, the architecture is brittle even if the current screen looks correct.

```ts
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(
      `Request failed with status ${response.status}`,
      response.status,
      response.headers.get("x-request-id") ?? undefined,
    );
  }
  return response.json() as Promise<T>;
}
```

**Wrong approach:** Let each consumer make its own decision about respect pagination and rate limits, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 11. Expose observability safely

Log endpoint labels and correlation IDs, not tokens or sensitive bodies.

Compare the naive approach with the production approach. The naive version optimizes the first implementation and leaves edge cases to each caller. The production version makes the edge case part of the contract, so every consumer gets consistent behavior and tests can assert it once.

```ts
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(
      `Request failed with status ${response.status}`,
      response.status,
      response.headers.get("x-request-id") ?? undefined,
    );
  }
  return response.json() as Promise<T>;
}
```

**Wrong approach:** Let each consumer make its own decision about expose observability safely, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 12. Test transport and endpoint behavior separately

Mock the network boundary while retaining contract-focused tests.

Check the boundary under failure, not only on the happy path. Consider missing configuration, stale data, a slow network, repeated interaction, route changes, malformed input, and a component being mounted or removed quickly. A design that cannot explain these states is not complete.

```ts
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(
      `Request failed with status ${response.status}`,
      response.status,
      response.headers.get("x-request-id") ?? undefined,
    );
  }
  return response.json() as Promise<T>;
}
```

**Wrong approach:** Let each consumer make its own decision about test transport and endpoint behavior separately, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Typed transport client

**What it does:** Establishes a repeatable boundary for typed transport client so behavior is consistent and independently testable.
**When to use it:** Use this pattern when multiple routes or contributors need the same guarantee, or when a failure could affect unrelated parts of the application.
**Implementation:**

```ts
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(
      `Request failed with status ${response.status}`,
      response.status,
      response.headers.get("x-request-id") ?? undefined,
    );
  }
  return response.json() as Promise<T>;
}
```

**Operational note:** Include the failure path in tests and make ownership explicit; do not treat this pattern as a substitute for server-side enforcement where authorization or secrets are involved.

### Pattern 2: Endpoint-specific adapter

**What it does:** Establishes a repeatable boundary for endpoint-specific adapter so behavior is consistent and independently testable.
**When to use it:** Use this pattern when multiple routes or contributors need the same guarantee, or when a failure could affect unrelated parts of the application.
**Implementation:**

```ts
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(
      `Request failed with status ${response.status}`,
      response.status,
      response.headers.get("x-request-id") ?? undefined,
    );
  }
  return response.json() as Promise<T>;
}
```

**Operational note:** Include the failure path in tests and make ownership explicit; do not treat this pattern as a substitute for server-side enforcement where authorization or secrets are involved.

### Pattern 3: Abortable search query

**What it does:** Establishes a repeatable boundary for abortable search query so behavior is consistent and independently testable.
**When to use it:** Use this pattern when multiple routes or contributors need the same guarantee, or when a failure could affect unrelated parts of the application.
**Implementation:**

```ts
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(
      `Request failed with status ${response.status}`,
      response.status,
      response.headers.get("x-request-id") ?? undefined,
    );
  }
  return response.json() as Promise<T>;
}
```

**Operational note:** Include the failure path in tests and make ownership explicit; do not treat this pattern as a substitute for server-side enforcement where authorization or secrets are involved.

### Pattern 4: Mutation submission guard

**What it does:** Establishes a repeatable boundary for mutation submission guard so behavior is consistent and independently testable.
**When to use it:** Use this pattern when multiple routes or contributors need the same guarantee, or when a failure could affect unrelated parts of the application.
**Implementation:**

```ts
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(
      `Request failed with status ${response.status}`,
      response.status,
      response.headers.get("x-request-id") ?? undefined,
    );
  }
  return response.json() as Promise<T>;
}
```

**Operational note:** Include the failure path in tests and make ownership explicit; do not treat this pattern as a substitute for server-side enforcement where authorization or secrets are involved.

### Pattern 5: Normalized error mapping

**What it does:** Establishes a repeatable boundary for normalized error mapping so behavior is consistent and independently testable.
**When to use it:** Use this pattern when multiple routes or contributors need the same guarantee, or when a failure could affect unrelated parts of the application.
**Implementation:**

```ts
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(
      `Request failed with status ${response.status}`,
      response.status,
      response.headers.get("x-request-id") ?? undefined,
    );
  }
  return response.json() as Promise<T>;
}
```

**Operational note:** Include the failure path in tests and make ownership explicit; do not treat this pattern as a substitute for server-side enforcement where authorization or secrets are involved.

### Pattern 6: Contract test harness

**What it does:** Establishes a repeatable boundary for contract test harness so behavior is consistent and independently testable.
**When to use it:** Use this pattern when multiple routes or contributors need the same guarantee, or when a failure could affect unrelated parts of the application.
**Implementation:**

```ts
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(
      `Request failed with status ${response.status}`,
      response.status,
      response.headers.get("x-request-id") ?? undefined,
    );
  }
  return response.json() as Promise<T>;
}
```

**Operational note:** Include the failure path in tests and make ownership explicit; do not treat this pattern as a substitute for server-side enforcement where authorization or secrets are involved.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Fetch calls scattered in UI | Fast implementation copied across screens | Route requests through a shared transport boundary |
| response.ok never checked | Network success confused with HTTP success | Check status before treating payload as success |
| All errors become empty arrays | Failure and no-data are conflated | Return empty only for valid empty results and surface failures |
| Token placed in URL | Convenience overlooked leakage | Use the intended header or secure cookie session |
| Blind retry on POST | Retry policy ignores side effects | Use idempotency keys or require explicit retry safety |
| Old search response overwrites new query | Requests race | Abort the previous request and ignore aborted results |
| Type assertion trusts server JSON | Compile-time types mistaken for validation | Validate external payloads at runtime |
| Error body shown raw | Backend details leak to user | Map to safe message and keep diagnostics in trusted logs |
| No timeout or cancellation plan | Network is assumed reliable | Pass AbortSignal and define request lifetime |
| Credentials included on every cross-origin request | Cookie scope was not reviewed | Use same-origin defaults and explicit credential policy |
| Pagination metadata discarded | Only first response was modeled | Represent cursor or page metadata in endpoint types |
| Rate limit ignored | 429 treated like generic failure | Respect Retry-After and show a recoverable wait state |
| API key embedded in client | Build environment misunderstood | Move privileged calls behind a server endpoint |
| Tests mock component internals | Transport contract is untested | Mock fetch or the API adapter and assert request semantics |

---

## Mental Models

1. **The network is untrusted:** even a typed client must validate external data.
2. **HTTP success is not transport success:** check status and interpret the response deliberately.
3. **Errors carry categories:** preserve distinctions that change the user’s next action.
4. **Cancellation is correctness:** stale responses can be wrong even when they are valid.
5. **Retries need semantics:** a safe retry depends on idempotency and operation type.
6. **Secrets do not belong in bundles:** browser code is inspectable by design.

---

## Quick Reference

| Decision | Recommended default | Review question |
|---|---|---|
| Base URL | Central configuration | Can environments differ safely? |
| Headers | Transport boundary | Are credentials appropriate? |
| HTTP status | Check response.ok | Is failure distinguishable? |
| Runtime data | Schema validation | Can server payload drift? |
| Errors | Typed normalized categories | What action should UI take? |
| Cancellation | AbortController | Can old response win? |
| Mutation retry | Idempotency strategy | Could action duplicate? |
| Rate limit | Honor Retry-After | Can user recover? |
| Pagination | Typed cursor/page | Is all data reachable? |
| Secrets | Server-side only | Does key ship to browser? |
| Logging | Request ID and safe labels | Are sensitive fields excluded? |
| Testing | Mock fetch boundary | Are headers and status tested? |
| Timeout | AbortSignal policy | Can request hang indefinitely? |
| Serialization | Endpoint-specific encoding | Are dates and nulls correct? |
| Credentials | Explicit same-origin policy | Can cookies leak cross-origin? |

---

## Advanced Operational Notes

### Transport versus domain adapter

A transport helper should handle repeated mechanics such as credentials policy, JSON parsing, status checks, and request identifiers. Endpoint adapters should describe domain-specific request and response contracts. Do not build a universal client with dozens of boolean options that attempts to encode every endpoint. A small transport boundary plus focused endpoint functions is easier to test and reason about. If the server changes the shape of a project response, update the project adapter instead of scattering mapping logic through cards, pages, and charts.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Runtime validation and schema drift

TypeScript only checks code against the type declarations available at build time. It cannot guarantee that a deployed server sends the expected fields. Validate critical external payloads at runtime, especially when data drives permissions, money, routing, or complex visualizations. Treat unknown fields intentionally: ignore harmless additions where forward compatibility is desired, but reject missing or malformed required fields. Log schema failures with a request ID and endpoint name, not a full potentially sensitive payload.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Cancellation and request races

Search boxes and route transitions often issue requests faster than the network can answer. If a user types `ca` then `cat`, the `ca` response may arrive last and overwrite the more relevant result. Use an AbortController tied to the request lifetime and ensure aborts are not shown as ordinary user-facing failures. Also guard against state updates after the owning view has moved on. Cancellation improves correctness as well as resource usage, particularly on mobile connections.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Mutation safety and idempotency

A button being disabled after click is useful UX but does not guarantee the server receives only one request. Network retries, browser refreshes, and multiple tabs can still duplicate mutations. For operations with financial or irreversible effects, design server-side idempotency keys and clear duplicate semantics. In the UI, show pending state, prevent accidental repeat submission, and make the result visible. Do not retry a mutation automatically unless its semantics are explicitly safe.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Error semantics and user recovery

A 401 usually means the session is missing or expired; a 403 means the identity is known but the action is forbidden. A 404 may be a missing resource, while 422 often describes invalid input and 429 indicates throttling. Preserve these distinctions in the API layer so the UI can offer the right next step. Avoid a single `Request failed` message for every case. Still keep internal diagnostics separate from public messages to avoid exposing implementation details.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Observability without leakage

Useful telemetry includes a stable endpoint label, HTTP status, duration, correlation ID, and a safe error category. Avoid logging authorization headers, cookies, full query strings, or request bodies by default. If an endpoint handles personal or payment data, define a redaction policy before adding instrumentation. Correlate browser errors with server logs through a request ID where possible. Good observability shortens incident resolution without turning logs into a second data leak.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Caching and freshness

Choose caching based on data semantics. Public CMS content may tolerate stale-while-revalidate behavior; account balances and permissions need stricter freshness. Do not cache authenticated responses in a shared cache without carefully defined keys and controls. If the API uses ETags or cache headers, let the transport layer respect them instead of adding ad hoc component caches. Document invalidation after mutations so the UI does not show stale state after a successful update.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Contract testing and mocks

Tests should verify URL, method, headers, serialization, status handling, cancellation, and error mapping. Mock at the network boundary for UI tests, but keep at least one integration or contract test that checks the endpoint adapter against a representative schema. Avoid mocks that always return success because they hide failure-handling defects. Use deterministic fixtures for malformed payloads, empty pages, 429 responses, and delayed responses so edge cases remain reproducible.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.


---

## Build Challenge

### Build: Production-ready API Layer Patterns for a multi-route creative SaaS

Build a small but realistic application slice that demonstrates the skill in a production-like environment. Include a clear README describing assumptions, architecture decisions, commands, and known limitations. Do not submit only a diagram or isolated snippet; the result must run and must demonstrate at least one recoverable failure.

### Requirements

1. Create a typed transport helper and two endpoint adapters.
2. Check HTTP status before parsing a success payload.
3. Represent network, HTTP, validation, and abort errors distinctly.
4. Validate at least one untrusted response at runtime.
5. Cancel a stale search request.
6. Prevent duplicate form submission.
7. Handle 401, 403, 404, 422, 429, and 500 with suitable UI behavior.
8. Use no privileged API key in browser code.
9. Add tests for request headers and failure status.
10. Respect a server-provided retry delay where present.
11. Log request identifiers without sensitive request bodies.
12. Demonstrate malformed JSON or an unexpected payload and recover safely.

### Required failure injection

Before calling the build complete, deliberately introduce a realistic failure: missing configuration, a malformed server response, a child render exception, a missing flag service response, or attacker-controlled input, depending on the skill. Record the expected behavior, the observed behavior, and the test or diagnostic that proves the system recovered safely.

### Definition of done

- [ ] The application builds and its documented checks run from a clean checkout.
- [ ] All mandatory architecture sections and public contracts are documented.
- [ ] At least one failure scenario is automated in a test.
- [ ] No secret or sensitive diagnostic data is exposed to the browser.
- [ ] Keyboard-accessible recovery and clear user-facing states are present.
- [ ] The implementation has no known circular dependency or unhandled critical failure.
- [ ] The README explains trade-offs, limitations, and how to extend the design.

### Debugging sequence

1. Reproduce the failure with the smallest known input or route.
2. Inspect browser DevTools console and network panel; identify the first meaningful failure rather than the last cascading error.
3. Confirm the failing boundary and whether it owns the behavior.
4. Check response status, configuration, imports, and runtime state relevant to this skill.
5. Add a regression test before changing the implementation.
6. Apply the narrowest fix and rerun the failure test plus the adjacent happy path.
7. Verify production build behavior and a keyboard-only pass.

### Browser, framework, and deployment notes

Examples assume a modern TypeScript frontend and React where component lifecycle examples are needed. Confirm exact framework and bundler behavior against the project version. Browser support for APIs such as `AbortController`, CSP directives, and dynamic imports varies by environment and policy; check current browser support and test Safari, Firefox, and Chromium targets relevant to the product. Never assume a development server's behavior proves the production bundle is safe.

### Final review checklist

- [ ] Does the design have one clear owner for each responsibility?
- [ ] Are error and edge states modeled explicitly?
- [ ] Are dependencies and trust boundaries visible?
- [ ] Can the behavior be tested without private implementation knowledge?
- [ ] Are performance, accessibility, and security implications documented?
- [ ] Are all examples syntactically realistic and free of hardcoded secrets?
