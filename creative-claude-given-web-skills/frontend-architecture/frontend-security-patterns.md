# SKILL: frontend-security-patterns
**Layer:** 22 — Frontend Architecture
**Goal:** Reduce browser-side attack surface by handling untrusted data, authentication state, navigation, dependencies, and browser capabilities with explicit security boundaries.

---

## Why This Matters (Senior Perspective)
Frontend security failures often arise from treating the browser as a trusted environment. Rendering user-controlled HTML can create cross-site scripting; putting a secret in a client environment variable exposes it in the downloaded bundle; storing a bearer token in `localStorage` makes it readable by injected JavaScript; and redirecting to an unvalidated URL can enable phishing or open-redirect attacks. These issues are not theoretical: a single compromised dependency or unsafe rich-text preview can expose account data and damage customer trust. A polished interface does not make these risks less serious.

Senior engineers assume that all client-side code and state can be inspected or modified by the user. They enforce authorization on the server, use output encoding and safe DOM APIs, keep privileged credentials out of browser bundles, prefer secure cookie-based sessions where the architecture supports them, and validate data at trust boundaries. They understand that CORS is not authentication, hiding a button is not access control, and TypeScript types do not validate network input at runtime. Security is layered: content policy, dependency hygiene, safe URL handling, session protections, and clear error behavior work together.

Creative websites add risk through CMS-driven content, SVG uploads, embedded media, third-party scripts, contact forms, analytics, and custom WebGL or canvas code. Security decisions must preserve usability: accessible validation messages, safe external-link behavior, and graceful failure matter. The objective is not to claim that frontend code can make the whole system secure; it is to avoid introducing vulnerabilities in the client and to make the server/client trust boundary explicit.

---

## Core Concepts

### 1. Treat browser input as untrusted

URL parameters, forms, CMS content, and storage can all be manipulated.

Start by identifying the failure boundary: what changes, who owns it, and which consumers must remain unaffected. This question is more useful than asking where a file should live or whether a component is sufficiently reusable. A boundary should make dependencies visible and reduce the number of places a maintainer must inspect.

```ts
export function safeExternalUrl(value: string): URL | null {
  try {
    const url = new URL(value, window.location.origin);
    // Only allow intended web protocols; reject javascript: and data: URLs.
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url;
  } catch {
    return null;
  }
}

const candidate = safeExternalUrl(userProvidedUrl);
if (candidate) {
  window.location.assign(candidate.href);
}
```

**Wrong approach:** Let each consumer make its own decision about treat browser input as untrusted, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 2. Prevent DOM-based XSS

Prefer text rendering and safe DOM APIs over interpreting strings as HTML.

Prefer explicit contracts over hidden conventions. A teammate should be able to understand valid inputs, outputs, failure states, and ownership by reading the module boundary. When the contract depends on undocumented import order or a global mutable singleton, the architecture is brittle even if the current screen looks correct.

```ts
export function safeExternalUrl(value: string): URL | null {
  try {
    const url = new URL(value, window.location.origin);
    // Only allow intended web protocols; reject javascript: and data: URLs.
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url;
  } catch {
    return null;
  }
}

const candidate = safeExternalUrl(userProvidedUrl);
if (candidate) {
  window.location.assign(candidate.href);
}
```

**Wrong approach:** Let each consumer make its own decision about prevent dom-based xss, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 3. Keep secrets server-side

Anything shipped to the browser must be treated as public.

Compare the naive approach with the production approach. The naive version optimizes the first implementation and leaves edge cases to each caller. The production version makes the edge case part of the contract, so every consumer gets consistent behavior and tests can assert it once.

```ts
export function safeExternalUrl(value: string): URL | null {
  try {
    const url = new URL(value, window.location.origin);
    // Only allow intended web protocols; reject javascript: and data: URLs.
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url;
  } catch {
    return null;
  }
}

const candidate = safeExternalUrl(userProvidedUrl);
if (candidate) {
  window.location.assign(candidate.href);
}
```

**Wrong approach:** Let each consumer make its own decision about keep secrets server-side, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 4. Use secure session design

Prefer HttpOnly, Secure, appropriately SameSite cookies where suitable.

Check the boundary under failure, not only on the happy path. Consider missing configuration, stale data, a slow network, repeated interaction, route changes, malformed input, and a component being mounted or removed quickly. A design that cannot explain these states is not complete.

```ts
export function safeExternalUrl(value: string): URL | null {
  try {
    const url = new URL(value, window.location.origin);
    // Only allow intended web protocols; reject javascript: and data: URLs.
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url;
  } catch {
    return null;
  }
}

const candidate = safeExternalUrl(userProvidedUrl);
if (candidate) {
  window.location.assign(candidate.href);
}
```

**Wrong approach:** Let each consumer make its own decision about use secure session design, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 5. Enforce authorization on the server

Client routes and hidden buttons are not security boundaries.

Keep the abstraction proportional to the problem. A wrapper that merely renames a function can add indirection without adding policy. A useful abstraction centralizes a decision, enforces an invariant, or makes a dependency replaceable in tests. Remove abstractions that do none of these.

```ts
export function safeExternalUrl(value: string): URL | null {
  try {
    const url = new URL(value, window.location.origin);
    // Only allow intended web protocols; reject javascript: and data: URLs.
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url;
  } catch {
    return null;
  }
}

const candidate = safeExternalUrl(userProvidedUrl);
if (candidate) {
  window.location.assign(candidate.href);
}
```

**Wrong approach:** Let each consumer make its own decision about enforce authorization on the server, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 6. Validate URLs before navigation

Restrict redirect targets and allow only intended protocols and destinations.

Make observability intentional. Include enough stable context to understand what happened, but exclude credentials, personal data, and large payloads. Prefer structured event names and request identifiers over ad hoc logs that are impossible to correlate across browser and server.

```ts
export function safeExternalUrl(value: string): URL | null {
  try {
    const url = new URL(value, window.location.origin);
    // Only allow intended web protocols; reject javascript: and data: URLs.
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url;
  } catch {
    return null;
  }
}

const candidate = safeExternalUrl(userProvidedUrl);
if (candidate) {
  window.location.assign(candidate.href);
}
```

**Wrong approach:** Let each consumer make its own decision about validate urls before navigation, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 7. Protect state-changing requests

Use CSRF defenses appropriate to the cookie/session architecture.

Accessibility and performance are architectural concerns because they affect every consumer. Preserve native semantics, keyboard behavior, predictable focus, and meaningful loading states. Avoid importing a heavy optional module into the initial route when a dynamic boundary can defer it.

```ts
export function safeExternalUrl(value: string): URL | null {
  try {
    const url = new URL(value, window.location.origin);
    // Only allow intended web protocols; reject javascript: and data: URLs.
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url;
  } catch {
    return null;
  }
}

const candidate = safeExternalUrl(userProvidedUrl);
if (candidate) {
  window.location.assign(candidate.href);
}
```

**Wrong approach:** Let each consumer make its own decision about protect state-changing requests, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 8. Apply a Content Security Policy

Reduce script injection impact with a deliberate, tested policy.

Use tests to protect the public behavior rather than the internal arrangement. A test that asserts private filenames or exact component nesting makes refactoring expensive. A test that verifies the visible result, request contract, fallback, or permission outcome gives maintainers room to improve internals.

```ts
export function safeExternalUrl(value: string): URL | null {
  try {
    const url = new URL(value, window.location.origin);
    // Only allow intended web protocols; reject javascript: and data: URLs.
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url;
  } catch {
    return null;
  }
}

const candidate = safeExternalUrl(userProvidedUrl);
if (candidate) {
  window.location.assign(candidate.href);
}
```

**Wrong approach:** Let each consumer make its own decision about apply a content security policy, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 9. Review third-party scripts

Each script can access page context and may change without your release.

Start by identifying the failure boundary: what changes, who owns it, and which consumers must remain unaffected. This question is more useful than asking where a file should live or whether a component is sufficiently reusable. A boundary should make dependencies visible and reduce the number of places a maintainer must inspect.

```ts
export function safeExternalUrl(value: string): URL | null {
  try {
    const url = new URL(value, window.location.origin);
    // Only allow intended web protocols; reject javascript: and data: URLs.
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url;
  } catch {
    return null;
  }
}

const candidate = safeExternalUrl(userProvidedUrl);
if (candidate) {
  window.location.assign(candidate.href);
}
```

**Wrong approach:** Let each consumer make its own decision about review third-party scripts, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 10. Validate uploads and rich content

Client checks improve UX but server validation remains authoritative.

Prefer explicit contracts over hidden conventions. A teammate should be able to understand valid inputs, outputs, failure states, and ownership by reading the module boundary. When the contract depends on undocumented import order or a global mutable singleton, the architecture is brittle even if the current screen looks correct.

```ts
export function safeExternalUrl(value: string): URL | null {
  try {
    const url = new URL(value, window.location.origin);
    // Only allow intended web protocols; reject javascript: and data: URLs.
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url;
  } catch {
    return null;
  }
}

const candidate = safeExternalUrl(userProvidedUrl);
if (candidate) {
  window.location.assign(candidate.href);
}
```

**Wrong approach:** Let each consumer make its own decision about validate uploads and rich content, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 11. Handle browser storage cautiously

Do not store sensitive session credentials in script-readable storage.

Compare the naive approach with the production approach. The naive version optimizes the first implementation and leaves edge cases to each caller. The production version makes the edge case part of the contract, so every consumer gets consistent behavior and tests can assert it once.

```ts
export function safeExternalUrl(value: string): URL | null {
  try {
    const url = new URL(value, window.location.origin);
    // Only allow intended web protocols; reject javascript: and data: URLs.
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url;
  } catch {
    return null;
  }
}

const candidate = safeExternalUrl(userProvidedUrl);
if (candidate) {
  window.location.assign(candidate.href);
}
```

**Wrong approach:** Let each consumer make its own decision about handle browser storage cautiously, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 12. Maintain dependency hygiene

Audit, update, pin, and review packages with attention to supply-chain risk.

Check the boundary under failure, not only on the happy path. Consider missing configuration, stale data, a slow network, repeated interaction, route changes, malformed input, and a component being mounted or removed quickly. A design that cannot explain these states is not complete.

```ts
export function safeExternalUrl(value: string): URL | null {
  try {
    const url = new URL(value, window.location.origin);
    // Only allow intended web protocols; reject javascript: and data: URLs.
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url;
  } catch {
    return null;
  }
}

const candidate = safeExternalUrl(userProvidedUrl);
if (candidate) {
  window.location.assign(candidate.href);
}
```

**Wrong approach:** Let each consumer make its own decision about maintain dependency hygiene, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Safe text rendering

**What it does:** Establishes a repeatable boundary for safe text rendering so behavior is consistent and independently testable.
**When to use it:** Use this pattern when multiple routes or contributors need the same guarantee, or when a failure could affect unrelated parts of the application.
**Implementation:**

```ts
export function safeExternalUrl(value: string): URL | null {
  try {
    const url = new URL(value, window.location.origin);
    // Only allow intended web protocols; reject javascript: and data: URLs.
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url;
  } catch {
    return null;
  }
}

const candidate = safeExternalUrl(userProvidedUrl);
if (candidate) {
  window.location.assign(candidate.href);
}
```

**Operational note:** Include the failure path in tests and make ownership explicit; do not treat this pattern as a substitute for server-side enforcement where authorization or secrets are involved.

### Pattern 2: Validated redirect target

**What it does:** Establishes a repeatable boundary for validated redirect target so behavior is consistent and independently testable.
**When to use it:** Use this pattern when multiple routes or contributors need the same guarantee, or when a failure could affect unrelated parts of the application.
**Implementation:**

```ts
export function safeExternalUrl(value: string): URL | null {
  try {
    const url = new URL(value, window.location.origin);
    // Only allow intended web protocols; reject javascript: and data: URLs.
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url;
  } catch {
    return null;
  }
}

const candidate = safeExternalUrl(userProvidedUrl);
if (candidate) {
  window.location.assign(candidate.href);
}
```

**Operational note:** Include the failure path in tests and make ownership explicit; do not treat this pattern as a substitute for server-side enforcement where authorization or secrets are involved.

### Pattern 3: HttpOnly session boundary

**What it does:** Establishes a repeatable boundary for httponly session boundary so behavior is consistent and independently testable.
**When to use it:** Use this pattern when multiple routes or contributors need the same guarantee, or when a failure could affect unrelated parts of the application.
**Implementation:**

```ts
export function safeExternalUrl(value: string): URL | null {
  try {
    const url = new URL(value, window.location.origin);
    // Only allow intended web protocols; reject javascript: and data: URLs.
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url;
  } catch {
    return null;
  }
}

const candidate = safeExternalUrl(userProvidedUrl);
if (candidate) {
  window.location.assign(candidate.href);
}
```

**Operational note:** Include the failure path in tests and make ownership explicit; do not treat this pattern as a substitute for server-side enforcement where authorization or secrets are involved.

### Pattern 4: CSP defense in depth

**What it does:** Establishes a repeatable boundary for csp defense in depth so behavior is consistent and independently testable.
**When to use it:** Use this pattern when multiple routes or contributors need the same guarantee, or when a failure could affect unrelated parts of the application.
**Implementation:**

```ts
export function safeExternalUrl(value: string): URL | null {
  try {
    const url = new URL(value, window.location.origin);
    // Only allow intended web protocols; reject javascript: and data: URLs.
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url;
  } catch {
    return null;
  }
}

const candidate = safeExternalUrl(userProvidedUrl);
if (candidate) {
  window.location.assign(candidate.href);
}
```

**Operational note:** Include the failure path in tests and make ownership explicit; do not treat this pattern as a substitute for server-side enforcement where authorization or secrets are involved.

### Pattern 5: Untrusted upload preview

**What it does:** Establishes a repeatable boundary for untrusted upload preview so behavior is consistent and independently testable.
**When to use it:** Use this pattern when multiple routes or contributors need the same guarantee, or when a failure could affect unrelated parts of the application.
**Implementation:**

```ts
export function safeExternalUrl(value: string): URL | null {
  try {
    const url = new URL(value, window.location.origin);
    // Only allow intended web protocols; reject javascript: and data: URLs.
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url;
  } catch {
    return null;
  }
}

const candidate = safeExternalUrl(userProvidedUrl);
if (candidate) {
  window.location.assign(candidate.href);
}
```

**Operational note:** Include the failure path in tests and make ownership explicit; do not treat this pattern as a substitute for server-side enforcement where authorization or secrets are involved.

### Pattern 6: Dependency and script inventory

**What it does:** Establishes a repeatable boundary for dependency and script inventory so behavior is consistent and independently testable.
**When to use it:** Use this pattern when multiple routes or contributors need the same guarantee, or when a failure could affect unrelated parts of the application.
**Implementation:**

```ts
export function safeExternalUrl(value: string): URL | null {
  try {
    const url = new URL(value, window.location.origin);
    // Only allow intended web protocols; reject javascript: and data: URLs.
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url;
  } catch {
    return null;
  }
}

const candidate = safeExternalUrl(userProvidedUrl);
if (candidate) {
  window.location.assign(candidate.href);
}
```

**Operational note:** Include the failure path in tests and make ownership explicit; do not treat this pattern as a substitute for server-side enforcement where authorization or secrets are involved.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| User string inserted as HTML | Trusted content is assumed | Render text by default and sanitize only when rich HTML is required |
| Secret in VITE or NEXT_PUBLIC variable | Public build variables misunderstood | Move privileged credentials to server-only runtime configuration |
| JWT stored in localStorage | Convenience outweighs XSS exposure | Prefer an HttpOnly Secure cookie session when architecture allows |
| Hidden button used as authorization | UI state mistaken for policy | Authorize each operation server-side |
| Redirect accepts any URL | Open redirect risk ignored | Allowlist destinations or constrain redirects to same origin |
| CORS treated as authentication | Browser policy misunderstood | Authenticate and authorize requests independently of CORS |
| CSP copied without testing | Policy directives break real app flows | Deploy report-only first and refine against observed violations |
| Third-party script added casually | Supply-chain and page access ignored | Inventory, minimize, pin where possible, and review permissions |
| Client validates upload only | Server trusts browser checks | Validate size, MIME, extension, and content on the server |
| Raw backend exception displayed | Debug output leaks internals | Map errors to safe user messages and correlate with request IDs |
| Sensitive data written to analytics | Telemetry payload not reviewed | Apply event schemas and redact identifiers before sending |
| Dependency update never audited | Transitive risk is invisible | Run lockfile audits and review advisories before release |
| Unsafe SVG rendered inline | SVG active content overlooked | Sanitize uploaded SVG or serve it as a download/image with safe policy |
| CSRF ignored with cookie auth | Cookie ambient authority misunderstood | Use SameSite appropriately and add CSRF tokens/origin checks as required |

---

## Mental Models

1. **The browser is user-controlled:** client state and code cannot enforce trust.
2. **Encode by default:** interpret data as text unless rich content is intentionally sanitized.
3. **Public bundle means public:** build-time client variables are not secrets.
4. **Defense is layered:** CSP, safe rendering, sessions, and server authorization complement each other.
5. **Types are not runtime validation:** external data needs checks at trust boundaries.
6. **Least privilege applies to scripts:** every third-party script expands the page’s attack surface.

---

## Quick Reference

| Decision | Recommended default | Review question |
|---|---|---|
| Untrusted text | Render as text | Is HTML interpretation necessary? |
| Secrets | Server runtime only | Can bundle expose it? |
| Session | HttpOnly Secure cookie when suitable | Can JS read credential? |
| Authorization | Server-side per action | Can direct request bypass UI? |
| Redirects | Same-origin or allowlist | Can URL be attacker-controlled? |
| CORS | Not authentication | Is request independently authorized? |
| CSP | Tested restrictive policy | Are unsafe exceptions necessary? |
| Third-party script | Inventory and review | What data can it access? |
| Uploads | Server validation | Can content spoof MIME? |
| Rich text | Sanitize by allowlist | Are dangerous attributes removed? |
| CSRF | Session-appropriate defense | Can ambient cookies be abused? |
| Telemetry | Redact fields | Could PII leave the app? |
| Dependencies | Audit lockfile | Are advisories addressed? |
| SVG | Sanitize or isolate | Can active content execute? |
| Errors | Safe user message | Are internals disclosed? |

---

## Advanced Operational Notes

### Trust boundaries and threat modeling

Start by listing data sources that an attacker can influence: query parameters, route segments, postMessage payloads, CMS content, form fields, local storage, uploaded files, and third-party responses. Trace each value to its sinks: HTML rendering, navigation, URL construction, script execution, API requests, or analytics. This is a practical threat model for a frontend feature. It helps reviewers ask whether the value is validated and encoded at the correct boundary rather than applying generic sanitization everywhere.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### XSS and safe rendering

Cross-site scripting occurs when untrusted content is interpreted as executable markup or script. React escapes ordinary text interpolation, but APIs such as `dangerouslySetInnerHTML`, direct DOM writes, unsafe URL attributes, and third-party widgets can reintroduce risk. If rich HTML is required, use a maintained sanitizer with an explicit allowlist and keep the trusted rendering path narrow. Do not write a home-grown sanitizer with a few string replacements; HTML parsing and browser behavior are more complex than simple text patterns.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Authentication and session handling

A frontend can store a session identifier in an HttpOnly cookie so ordinary JavaScript cannot read it, with Secure and appropriate SameSite attributes configured by the server. The exact architecture may require CSRF defenses and careful domain/path scoping. Do not store long-lived bearer credentials in localStorage or sessionStorage as a default. A client can display login state, but it must not be the authority that grants access. On logout, clear server session state where applicable and handle stale tabs consistently.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Navigation and URL safety

Treat redirect destinations and URLs from user-controlled sources as untrusted. Parse them with the URL API, allow only intended protocols, and constrain redirects to same-origin paths or a reviewed allowlist. Reject `javascript:` and other unexpected schemes. For external links, use clear link text and appropriate `rel` attributes when opening a new tab. Do not assume that checking for a string prefix such as `https` is equivalent to parsing and validating the full destination.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### CSRF, CORS, and authorization

CORS determines whether browser JavaScript can read certain cross-origin responses; it does not prove the caller is authorized. If cookies automatically accompany state-changing requests, evaluate CSRF risk and apply defenses appropriate to the session architecture, such as SameSite policy, origin checks, and CSRF tokens. The server must still authenticate the caller and authorize the requested resource. Test direct requests to protected endpoints rather than relying on a disabled button or hidden route.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Content Security Policy and script supply chain

A Content Security Policy can reduce the impact of injection by limiting where scripts, frames, and other resources may load. It should be designed around the real app and tested in report-only mode before enforcement when feasible. Avoid broad unsafe directives as a permanent workaround. Third-party scripts execute with meaningful access to the page context, so inventory them, review their business need, and remove unused tags. A compromised analytics or chat script can create the same browser risk as first-party code.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Uploads, SVG, and rich previews

Client-side file checks are helpful feedback but are bypassable. The server should validate file size, allowed content type, file signature where appropriate, storage policy, and access controls. SVG deserves special care because it can contain active content; do not blindly inline untrusted SVG markup. For previews, prefer safe rendering paths, sandboxing, or serving files as downloads when interactive rendering is not required. Ensure filenames and metadata are encoded before appearing in the DOM.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Dependencies, telemetry, and incident response

Dependencies can introduce vulnerabilities through direct code or transitive packages. Keep a lockfile, run audit tools, review high-risk updates, and understand the difference between a reported vulnerability and actual reachability in the deployed app. Telemetry should exclude tokens, cookies, passwords, sensitive form values, and unnecessary personal data. If a client-side security incident occurs, preserve relevant release and request metadata, rotate exposed credentials, remove unsafe content paths, and ship a regression test. A dependency audit alone is not a complete security program.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.


### Secure-by-default review workflow

Security review is most effective when it is attached to ordinary engineering work. For a new form, review validation, output rendering, CSRF assumptions, authorization, rate limiting, and telemetry before the feature ships. For a new third-party integration, record the data it can access, the domains it contacts, and how it is removed if the vendor is replaced. For a new dependency, review its maintenance status, transitive footprint, permissions, and vulnerability reports. Add automated checks for obvious regressions, but keep a human threat review for trust boundaries that tooling cannot understand. When a vulnerability is discovered, first reduce exposure, then fix the root cause, rotate credentials if they may have leaked, and add a test that proves the original path is blocked. Document residual risk honestly; passing a scanner does not prove that an application is secure.

---

## Build Challenge

### Build: Production-ready Frontend Security Patterns for a multi-route creative SaaS

Build a small but realistic application slice that demonstrates the skill in a production-like environment. Include a clear README describing assumptions, architecture decisions, commands, and known limitations. Do not submit only a diagram or isolated snippet; the result must run and must demonstrate at least one recoverable failure.

### Requirements

1. Render untrusted user content safely and demonstrate an XSS regression test.
2. Validate redirect destinations and reject dangerous protocols.
3. Keep all privileged credentials server-side.
4. Document secure session cookie attributes and CSRF strategy.
5. Enforce authorization in the server/API example.
6. Add a tested Content Security Policy plan.
7. Validate uploaded file type and size on the server-side example.
8. Review and document third-party script access.
9. Redact sensitive data from logs and analytics events.
10. Handle API errors without exposing stack traces.
11. Add a dependency audit step to the workflow.
12. Test malformed URL, unsafe HTML, and denied authorization scenarios.

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
