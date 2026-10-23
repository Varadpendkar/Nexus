# SKILL: nextjs-api-routes
**Layer:** 18 — Backend Development
**Goal:** Design, implement, secure, test, and operate Next.js Route Handlers and API endpoints with clear HTTP semantics, runtime boundaries, validation, and deployment-aware behavior.

---

## Why This Matters (Senior Perspective)

A Next.js endpoint often sits directly between a polished interface and sensitive operations: account changes, checkout, project submissions, contact forms, file uploads, or data that should never reach a browser. It is easy to make a route appear functional with a `POST` handler that parses JSON and returns `{ success: true }`. The production risks begin where the happy path ends. A request can have the wrong content type, contain a forged identifier, arrive without a session, repeat after a client timeout, or exceed the platform's execution budget. A handler can also import a Node-only library into an Edge runtime, leak internal exception details, cache user-specific output, or return a response that works locally but fails behind a deployment proxy.

A beginner thinks “API route” means a file that receives a request. A senior engineer thinks in contracts and boundaries: which runtime executes the code, which methods are allowed, where identity is established, what input is trusted, how data access is authorized, which status codes are stable, and what happens when a dependency is slow or unavailable. They also distinguish the App Router's `app/**/route.ts` Route Handlers from the older Pages Router's `pages/api/**` API Routes. Their file conventions, request/response APIs, and rendering integration differ; copying examples between them without noticing the router is a common source of bugs.

This matters in portfolio and freelance projects because a beautiful dashboard is only as trustworthy as its server boundary. A project marketplace, appointment form, client portal, or CMS must not expose private records because of a guessed ID or a shared cache. Good route design makes the interface dependable, helps future maintainers understand the contract, and makes deployments diagnosable. The aim is not to turn every small app into a microservice. It is to make each endpoint explicit, least-privileged, testable, and honest about what it can guarantee.

---

## Core Concepts

### 1. Choose the router before choosing the handler API

Next.js has two commonly encountered server API conventions. In the App Router, a `route.ts` or `route.js` file exports named functions such as `GET` and `POST` and receives Web `Request` objects (often `NextRequest`). In the Pages Router, a file under `pages/api` exports a default handler that uses Node-style request and response objects. These are related capabilities, not interchangeable syntax. Start by locating the route tree and match the example to the router actually used by the project.

This choice affects how you read request bodies, set cookies, return responses, and compose handlers. A project may use both routers during migration, but each endpoint should have one clear owner. Do not create a parallel endpoint simply because a copied tutorial uses a different convention; duplicated paths and inconsistent auth behavior are difficult to reason about. Document migration boundaries if both systems coexist.

**Working example:**

```typescript
// App Router: app/api/projects/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ data: [{ id: 'prj_42', title: 'Studio redesign' }] });
}
```

```typescript
// Pages Router: pages/api/projects.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED' } });
  }
  return res.status(200).json({ data: [{ id: 'prj_42', title: 'Studio redesign' }] });
}
```

**Naive / wrong approach:** Copy an App Router handler into `pages/api` and assume `NextResponse` plus named exports will be discovered there.

```typescript
// Wrong for pages/api/projects.ts
export async function GET() {
  return Response.json({ data: [] });
}
```

**Correct approach:** Follow the file convention of the router that owns the route. Add a small integration test for the public path so a future file move cannot silently change the endpoint contract.

```typescript
// Correct App Router contract: named method export in app/api/projects/route.ts
export async function GET(request: Request) {
  const url = new URL(request.url);
  return Response.json({ data: [], query: url.searchParams.get('q') });
}
```

**Gotcha:** Route Handlers are App Router features. A `route.ts` file does not behave like a `page.tsx`, and route handlers cannot share the same route segment with a page file that owns the exact same URL path.

### 2. Use the Web Request and Response contract deliberately

App Router handlers are built around the Web Platform request/response model. Read query parameters from `new URL(request.url)`, read JSON asynchronously with `request.json()`, and return a `Response` or `NextResponse`. This makes the handler portable across supported Next.js runtimes, but it also means body parsing can reject and response bodies are streams. Treat parsing as an operation that can fail, not as a harmless property lookup.

Use `NextResponse` when Next.js-specific helpers such as cookie mutation or redirects are useful. Use the standard `Response` when its primitives are sufficient. Keep one response style per codebase where practical so developers recognize patterns quickly. A handler should return a response on every branch; falling through without a response is a control-flow defect, not a valid “empty success.”

**Working example:**

```typescript
// app/api/search/route.ts
export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = (url.searchParams.get('q') ?? '').trim();
  if (query.length > 100) {
    return Response.json({ error: { code: 'QUERY_TOO_LONG' } }, { status: 400 });
  }
  return Response.json({ data: [], query });
}
```

**Naive / wrong approach:** Treat `request.json()` as synchronous or assume every request body contains valid JSON.

```typescript
// Wrong: request.json() returns a Promise and may reject.
const body = request.json();
return Response.json({ title: body.title });
```

**Correct approach:** Await parsing inside a guarded block and validate the parsed value before using it.

```typescript
let body: unknown;
try {
  body = await request.json();
} catch {
  return Response.json({ error: { code: 'INVALID_JSON' } }, { status: 400 });
}
```

**Gotcha:** A request body is generally consumable once. If middleware or a helper has already read the stream, attempting to parse it again can fail; pass validated data forward instead of rereading the body.

### 3. Export only the HTTP methods the resource supports

A Route Handler can export `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`, and `HEAD` functions. Exporting a method is part of the endpoint contract: it communicates supported operations and helps Next.js produce method handling. Do not route all verbs through one large function unless a framework boundary specifically requires it. Separate handlers make authorization, validation, response codes, and observability easier to review.

Choose methods according to their semantics. `GET` should not mutate state. `POST` commonly creates a subordinate resource or triggers an operation. `PUT` conventionally replaces a representation, while `PATCH` applies a partial update. `DELETE` requests removal. Real applications may have domain-specific commands, but the public behavior must remain clear and documented. Unsupported methods should not accidentally perform the nearest available action.

**Working example:**

```typescript
// app/api/projects/[projectId]/route.ts
export async function GET(_request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  return Response.json({ data: { id: projectId, title: 'Studio redesign' } });
}

export async function PATCH(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const body = await request.json();
  return Response.json({ data: { id: projectId, accepted: Boolean(body) } });
}
```

**Naive / wrong approach:** Let a `GET` handler perform a write because the frontend happens to call it from a button.

```typescript
// Wrong: crawlers, prefetching, and retries can trigger a mutation.
export async function GET() {
  await deleteExpiredProjects();
  return Response.json({ deleted: true });
}
```

**Correct approach:** Keep reads safe and place state changes behind an explicit mutation method, with authentication and CSRF considerations where cookie auth is used.

```typescript
export async function POST(request: Request) {
  const result = await expireProjectsForAuthorizedOperator(request);
  return Response.json({ data: result }, { status: 200 });
}
```

**Gotcha:** `HEAD` is expected to behave like `GET` without a response body, and `OPTIONS` is often involved in CORS preflight. Verify framework behavior and your deployment path rather than assuming a custom export handles every edge case.

### 4. Treat route parameters and query strings as untrusted strings

Dynamic segments such as `[projectId]` and query strings are transport values, not proof that a resource exists or that the caller may access it. Validate format and bounds before using a value in a database query. Parse numbers deliberately: `Number('')` is zero, `parseInt('12cats', 10)` is twelve, and repeated query keys may produce multiple values. Define whether duplicate keys are allowed rather than letting incidental library behavior decide.

For App Router versions where `params` is asynchronous, await it. Type annotations do not validate the incoming URL at runtime. A route should distinguish malformed identifiers (`400`), absent records (`404`), and forbidden access (`403` or a deliberate `404` policy to avoid revealing existence). Keep that policy consistent across related routes.

**Working example:**

```typescript
const PROJECT_ID = /^prj_[a-zA-Z0-9]{6,32}$/;

export async function GET(_request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  if (!PROJECT_ID.test(projectId)) {
    return Response.json({ error: { code: 'INVALID_PROJECT_ID' } }, { status: 400 });
  }
  return Response.json({ data: { id: projectId } });
}
```

**Naive / wrong approach:** Pass an arbitrary URL segment into a query and hope the database rejects bad values.

```typescript
// Wrong: no format check, scope check, or authorization policy.
const project = await db.project.findUnique({ where: { id: params.projectId } });
```

**Correct approach:** Parse the identifier, query within the caller's permitted scope, then apply a deliberate not-found policy.

```typescript
const project = await db.project.findFirst({
  where: { id: projectId, ownerId: session.user.id },
});
if (!project) return Response.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });
```

**Gotcha:** In current App Router patterns, route context parameters may be typed as a `Promise`. Use the signature matching the installed Next.js version and confirm it against the project’s generated types.

### 5. Validate JSON payloads at the boundary

A JSON parser only proves that a byte sequence is valid JSON. It does not prove the result is an object, that required fields exist, or that values are safe for the domain. A body can be `null`, an array, a string, or an object containing unexpected properties. Use a schema validator or a narrow parsing function to turn `unknown` into a trusted domain input. Validation should specify required fields, length limits, allowed enum values, and whether unknown keys are rejected or stripped.

Keep validation close to the route boundary and pass a validated value to the service layer. This prevents a second caller—such as a background job—from accidentally relying on validation that only happened in the browser. Return a stable error code and field-level details that are useful without leaking internal implementation data.

**Working example:**

```typescript
import { z } from 'zod';

const CreateProject = z.object({
  title: z.string().trim().min(3).max(120),
  visibility: z.enum(['private', 'public']).default('private'),
}).strict();

type CreateProjectInput = z.infer<typeof CreateProject>;
```

**Naive / wrong approach:** Cast parsed input to a type and assume TypeScript has validated the network request.

```typescript
// Wrong: a type assertion changes no runtime data.
const input = (await request.json()) as CreateProjectInput;
await createProject(input);
```

**Correct approach:** Parse unknown data at runtime and handle validation failures as client errors.

```typescript
const raw: unknown = await request.json();
const parsed = CreateProject.safeParse(raw);
if (!parsed.success) {
  return Response.json({ error: { code: 'VALIDATION_FAILED', issues: parsed.error.issues } }, { status: 422 });
}
const project = await createProject(parsed.data);
```

**Gotcha:** Never return raw validator issues blindly if they can include sensitive input values. Expose field paths and safe messages, and cap the amount of error detail returned.

### 6. Choose Node.js or Edge runtime based on dependencies

The runtime is an architectural decision. The Node.js runtime supports Node APIs and many database drivers; the Edge runtime offers a constrained Web API environment and can be useful for lightweight, latency-sensitive logic. Do not mark a route as Edge just because it sounds faster. A library that imports `node:crypto`, reads files, uses native bindings, or opens a traditional TCP database connection may fail there. Conversely, a simple signed token check using Web Crypto may fit an Edge handler well.

Check the current Next.js version, hosting platform, and the exact libraries involved. Runtime compatibility is not fully inferred by TypeScript. Keep heavy database work and native dependencies in Node routes unless your data provider explicitly supports the target runtime. Measure latency with realistic deployment conditions rather than making assumptions from local development.

**Working example:**

```typescript
// app/api/reports/route.ts
export const runtime = 'nodejs';

export async function GET() {
  const report = await loadReportFromNodeCompatibleDatabase();
  return Response.json({ data: report });
}
```

**Naive / wrong approach:** Force a route into Edge runtime while importing a Node-only database client.

```typescript
// Wrong if the imported package requires unsupported Node APIs.
export const runtime = 'edge';
import { database } from '@/server/node-database-client';
```

**Correct approach:** Keep the route on Node.js or replace the dependency with a documented Edge-compatible client.

```typescript
export const runtime = 'nodejs';
import { database } from '@/server/node-database-client';
```

**Gotcha:** Runtime support can change by Next.js version and deployment adapter. Test a production build and a deployed preview; a successful dev server is not proof that the target runtime supports every import.

### 7. Make caching behavior explicit for user-specific responses

Caching is a correctness and privacy decision, not merely a performance toggle. Public, deterministic content may be cached aggressively. Session-dependent dashboards, account data, and permission-filtered records must not accidentally be reused across users. Next.js caching defaults and APIs have evolved across versions, so confirm behavior for the version in `package.json` and the specific data-fetching primitive. A Route Handler returning private data should use explicit response cache directives when needed and should not rely on a developer remembering every default.

Separate cacheable data from personalized composition. If the same public project catalogue is combined with the current user's saved items, cache the public catalogue under a safe key and fetch the private selection separately. Do not put a user identifier into a cache key unless the cache is designed and authorized for that scope. Test two sessions against the same URL to catch accidental cross-user reuse.

**Working example:**

```typescript
export async function GET() {
  const profile = await getCurrentUserProfile();
  return Response.json({ data: profile }, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
```

**Naive / wrong approach:** Return personalized data with a public cache directive.

```typescript
// Wrong for a response that changes according to the signed-in user.
return Response.json({ data: await getCurrentUserProfile() }, {
  headers: { 'Cache-Control': 'public, s-maxage=3600' },
});
```

**Correct approach:** Mark private output as private/no-store, and configure shared caching only for data that is genuinely public and safe to share.

```typescript
return Response.json({ data: await getCurrentUserProfile() }, {
  headers: { 'Cache-Control': 'private, no-store, max-age=0' },
});
```

**Gotcha:** Setting response headers is only one layer. CDN rules, middleware, fetch caching, and hosting adapters can affect caching too; verify the actual response headers and behavior from a deployed environment.

### 8. Authenticate first, then authorize the requested action

Authentication answers “who is making this request?” Authorization answers “may this identity perform this action on this resource?” A valid session does not imply access to every record. Every private read and mutation should check resource ownership, tenant membership, role, or another explicit policy. Avoid trusting a `userId` sent by the browser when the session already identifies the caller. Derive the actor from verified session state and scope database queries to that actor whenever possible.

Keep authorization in a reusable server-only service or policy function so a new route cannot omit it by accident. Do not rely exclusively on middleware: middleware can be useful for coarse routing, but fine-grained ownership checks belong close to the data operation. Decide whether unauthorized resource access returns `403` or a uniform `404` and use the same policy consistently.

**Working example:**

```typescript
export async function GET(_request: Request, context: { params: Promise<{ projectId: string }> }) {
  const session = await requireSession();
  const { projectId } = await context.params;
  const project = await db.project.findFirst({
    where: { id: projectId, ownerId: session.user.id },
    select: { id: true, title: true, visibility: true },
  });
  if (!project) return Response.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });
  return Response.json({ data: project });
}
```

**Naive / wrong approach:** Fetch a record by client-supplied ID and return it because the caller is logged in.

```typescript
// Wrong: any signed-in user may try another user's project ID.
const project = await db.project.findUnique({ where: { id: projectId } });
return Response.json({ data: project });
```

**Correct approach:** Scope the lookup to the verified identity or call a policy that proves access before returning data.

```typescript
const project = await db.project.findFirst({ where: { id: projectId, ownerId: session.user.id } });
if (!project) return Response.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });
```

**Gotcha:** Authorization must be checked again for mutations; a successful GET earlier in the browser is not proof that the user still has permission when a later PATCH arrives.

### 9. Handle cookies, CSRF, and CORS as different controls

Cookies can carry a session automatically, which is convenient but creates cross-site request considerations. CORS determines which browser origins may read certain responses; it is not authentication and does not stop curl, server-to-server calls, or every forged request. CSRF defenses address unwanted state-changing requests made with a victim's ambient credentials. For cookie-authenticated mutations, use appropriate `SameSite`, `Secure`, and `HttpOnly` cookie settings and a deliberate CSRF strategy based on the application’s threat model. For bearer-token APIs, avoid inventing cookie-specific controls that do not apply, but protect token storage and transport.

Do not reflect any arbitrary `Origin` into `Access-Control-Allow-Origin`. Use an allowlist, avoid wildcard origins with credentials, and answer preflight requests correctly. Prefer framework-supported session APIs for cookie mutation rather than hand-building fragile `Set-Cookie` strings.

**Working example:**

```typescript
const allowedOrigins = new Set(['https://studio.example.com']);

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  const headers = new Headers({
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Token',
    'Vary': 'Origin',
  });
  if (origin && allowedOrigins.has(origin)) headers.set('Access-Control-Allow-Origin', origin);
  return new Response(null, { status: 204, headers });
}
```

**Naive / wrong approach:** Enable credentialed CORS for every origin.

```typescript
// Wrong: wildcard origins cannot be combined safely with credentialed browser requests.
headers.set('Access-Control-Allow-Origin', '*');
headers.set('Access-Control-Allow-Credentials', 'true');
```

**Correct approach:** Match the origin against an allowlist and separately apply session and CSRF protections.

```typescript
if (origin && allowedOrigins.has(origin)) {
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Credentials', 'true');
  headers.append('Vary', 'Origin');
}
```

**Gotcha:** A successful CORS preflight is not proof that a user is authenticated or authorized. CORS is enforced by browsers, not a replacement for server-side access control.

### 10. Return a stable error envelope and correct HTTP status

A route's error response is part of its public API. A client should be able to distinguish invalid input, missing resources, authentication failure, rate limiting, and temporary dependency failure without parsing an internal stack trace. Use consistent machine-readable codes and safe messages. `400` commonly signals malformed input, `401` missing or invalid authentication, `403` denied action, `404` absent or intentionally hidden resources, `409` a state conflict, `422` semantically invalid input, `429` rate limiting, and `5xx` server/dependency failures. Pick a convention and document it.

Do not return `200` for every failure with `{ success: false }`; that hides failure from caches, monitoring, and generic clients. Conversely, do not expose database errors or environment values. Log the detailed exception server-side with a request ID, while returning a stable public code.

**Working example:**

```typescript
export function apiError(code: string, status: number, message: string) {
  return Response.json({ error: { code, message } }, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

// Usage: return apiError('VALIDATION_FAILED', 422, 'Check the highlighted fields.');
```

**Naive / wrong approach:** Send internal exception messages directly to the browser.

```typescript
// Wrong: may reveal schema names, SQL details, file paths, or secrets.
catch (error) {
  return Response.json({ error: String(error) }, { status: 500 });
}
```

**Correct approach:** Return a stable public error and log the original exception in a protected logging system.

```typescript
catch (error) {
  logger.error({ error, requestId }, 'Project update failed');
  return apiError('INTERNAL_ERROR', 500, 'The request could not be completed.');
}
```

**Gotcha:** Error responses can contain personal data in validation details or upstream messages. Treat them as data exports and keep public error payloads intentionally small.

### 11. Make writes safe against retries and duplicate submissions

Networks fail in ambiguous ways: a server may commit a write and the client may time out before receiving the response. The client then retries. For an ordinary edit, retrying may be harmless; for payment creation, booking, or publishing a paid order, it can create duplicates. Idempotency is a domain contract, not a property automatically granted by using `POST`. Decide which operations require an idempotency key, how long the key remains valid, and what response should be replayed for a repeated request.

The key must be associated with the authenticated actor and a normalized request fingerprint. Persist the key and outcome atomically with the domain write where possible. Reject reuse of the same key with a different payload. For simpler operations, a unique database constraint or natural idempotent `PUT` may be enough. Do not store idempotency keys only in process memory if requests can land on different instances.

**Working example:**

```typescript
// Pseudocode for the service boundary; enforce uniqueness in persistent storage.
export async function createBooking(actorId: string, key: string, input: BookingInput) {
  return db.transaction(async (tx) => {
    const prior = await tx.idempotency.findUnique({ where: { actorId_key: { actorId, key } } });
    if (prior) {
      if (prior.requestHash !== hash(input)) throw new ConflictError('IDEMPOTENCY_KEY_REUSED');
      return prior.responseBody;
    }
    const booking = await tx.booking.create({ data: { ...input, actorId } });
    const responseBody = { id: booking.id, status: booking.status };
    await tx.idempotency.create({ data: { actorId, key, requestHash: hash(input), responseBody } });
    return responseBody;
  });
}
```

**Naive / wrong approach:** Generate a fresh booking every time the browser retries a timed-out request.

```typescript
// Wrong: duplicate requests create duplicate bookings.
export async function POST(request: Request) {
  const input = await request.json();
  const booking = await db.booking.create({ data: input });
  return Response.json({ data: booking }, { status: 201 });
}
```

**Correct approach:** Require an idempotency key for high-impact operations and store it durably with a uniqueness constraint.

```typescript
const key = request.headers.get('Idempotency-Key');
if (!key || key.length > 200) return apiError('IDEMPOTENCY_KEY_REQUIRED', 400, 'Provide an idempotency key.');
const result = await createBooking(session.user.id, key, parsed.data);
return Response.json({ data: result }, { status: 201 });
```

**Gotcha:** A database transaction is only as correct as its constraints and isolation behavior. Verify unique indexes and race behavior with concurrent tests; a read-then-write sequence without a constraint can still duplicate work.

### 12. Bound request size, duration, and dependency work

Serverless and edge deployments often impose limits on body size, execution time, memory, and outbound connections. A route that accepts arbitrary JSON or downloads an unbounded URL can consume resources before validation finishes. Set explicit field and collection limits, validate content type, and use provider-specific body limits where available. For uploads, prefer signed direct-to-storage uploads or a carefully bounded streaming flow instead of buffering a huge file in memory.

Every external dependency should have a timeout or cancellation strategy. Avoid starting unlimited parallel operations from a user-controlled list. Keep the route's synchronous response work small; long-running reports, video processing, or multi-step AI workflows often belong in a durable background job rather than a request that may be terminated by the platform. Return `202 Accepted` only when the operation is actually queued and the client can inspect its status.

**Working example:**

```typescript
const MAX_ITEMS = 50;

const BatchRequest = z.object({
  projectIds: z.array(z.string().regex(/^prj_[a-zA-Z0-9]{6,32}$/)).min(1).max(MAX_ITEMS),
}).strict();

export async function POST(request: Request) {
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return apiError('UNSUPPORTED_MEDIA_TYPE', 415, 'Send application/json.');
  }
  const raw: unknown = await request.json();
  const parsed = BatchRequest.safeParse(raw);
  if (!parsed.success) return apiError('VALIDATION_FAILED', 422, 'The batch request is invalid.');
  return Response.json({ data: await loadProjectsInBoundedBatch(parsed.data.projectIds) });
}
```

**Naive / wrong approach:** Accept an unlimited list and issue one database request per item with no cap.

```typescript
// Wrong: an attacker can submit thousands of IDs and exhaust connections.
const records = await Promise.all(ids.map((id) => db.project.findUnique({ where: { id } })));
```

**Correct approach:** Bound list length, scope queries to authorization, and use bulk operations or controlled concurrency.

```typescript
if (ids.length > 50) return apiError('BATCH_TOO_LARGE', 413, 'Submit at most 50 project IDs.');
const records = await db.project.findMany({ where: { id: { in: ids }, ownerId: session.user.id } });
```

**Gotcha:** A JavaScript timeout wrapper does not necessarily cancel the underlying database query. Prefer driver-level timeouts and propagate `AbortSignal` when the dependency supports cancellation.

### 13. Keep server-only code and secrets out of client bundles

Route handlers execute on the server, but modules imported by client components can be bundled for the browser. Keep database clients, private API keys, token-signing secrets, and privileged service functions in server-only modules. Use environment variables without the `NEXT_PUBLIC_` prefix for secrets, and consider importing the `server-only` marker in modules that must never be pulled into a client component. A secret hidden behind a conditional branch is still a secret in source code and can still leak if the module crosses the client boundary.

Do not return environment configuration to the frontend for debugging. Provide a minimal health endpoint that reports readiness without printing hostnames, credentials, or connection strings. Review build output and use secret scanning in CI. Rotate a credential if it was ever committed; deleting it from the latest commit does not erase it from history.

**Working example:**

```typescript
// lib/server/project-service.ts
import 'server-only';
import { db } from './database';

export async function listProjectsForOwner(ownerId: string) {
  return db.project.findMany({
    where: { ownerId },
    select: { id: true, title: true, updatedAt: true },
  });
}
```

**Naive / wrong approach:** Put a private API key in a variable with a `NEXT_PUBLIC_` prefix.

```typescript
// Wrong: Next.js exposes NEXT_PUBLIC_ variables to browser bundles.
const billingKey = process.env.NEXT_PUBLIC_BILLING_SECRET;
```

**Correct approach:** Read secrets only from server-only modules and expose only a safe result to client components.

```typescript
import 'server-only';
const billingKey = process.env.BILLING_SECRET;
if (!billingKey) throw new Error('BILLING_SECRET is required');
```

**Gotcha:** Environment values are often inlined at build time for public variables. Changing a public variable after deployment may not update already-built browser assets.

### 14. Observe requests without logging sensitive payloads

A route can return correct responses and still be difficult to operate if failures cannot be correlated. Generate or accept a trusted request ID, log route name, status, duration, and safe outcome codes, and connect dependency errors to the same ID. Avoid logging passwords, access tokens, full cookie headers, medical details, or entire request bodies by default. Structured logs are easier to filter than interpolated strings and can be sampled or redacted consistently.

Health checks should answer distinct questions. Liveness asks whether the process can respond; readiness asks whether it can safely accept work. Do not make liveness fail because a transient database query failed, or a platform may restart a healthy process repeatedly. Keep readiness dependency checks bounded and avoid exposing diagnostics to anonymous callers unless the response is intentionally minimal.

**Working example:**

```typescript
export async function GET(request: Request) {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const startedAt = Date.now();
  try {
    const ready = await checkReadiness({ timeoutMs: 800 });
    const status = ready ? 200 : 503;
    logger.info({ requestId, status, durationMs: Date.now() - startedAt }, 'Readiness check');
    return Response.json({ status: ready ? 'ready' : 'not_ready', requestId }, { status });
  } catch (error) {
    logger.error({ requestId, error }, 'Readiness check failed');
    return Response.json({ status: 'not_ready', requestId }, { status: 503 });
  }
}
```

**Naive / wrong approach:** Log every request body and authorization header to debug a failing form.

```typescript
// Wrong: this can put secrets and personal data into long-lived logs.
logger.info({ headers: Object.fromEntries(request.headers), body: await request.text() });
```

**Correct approach:** Log an allowlisted set of fields and a correlation identifier.

```typescript
logger.info({ requestId, route: '/api/projects', method: 'POST', status: 201, durationMs }, 'Request completed');
```

**Gotcha:** Client-provided request IDs can be forged or contain control characters. Validate their format or generate your own ID and preserve the inbound value only as a separate, sanitized correlation hint.

### 15. Test handlers at contract and integration boundaries

Unit tests are useful for pure validation and policy functions, but they cannot prove that the framework discovers the route, that cookies are parsed, or that a database constraint behaves under concurrency. Test the public contract: allowed methods, status codes, response shape, authentication, authorization, invalid JSON, and cache headers. Use an integration test against the route or a test server for behavior that depends on Next.js request handling. Keep test data isolated and avoid using a developer's production credentials.

Test failure paths deliberately. An endpoint that has only a success test has not demonstrated safe behavior. Include regressions for cross-user resource access, duplicate idempotency keys, and invalid payloads. Mock external systems only where the behavior under test is truly outside the contract; if every dependency is mocked, a broken integration can remain invisible until deployment.

**Working example:**

```typescript
import { describe, it, expect } from 'vitest';

// Example contract test for an extracted route function.
describe('project payload contract', () => {
  it('rejects a title shorter than three characters', () => {
    const result = CreateProject.safeParse({ title: 'ab', visibility: 'private' });
    expect(result.success).toBe(false);
  });

  it('rejects unexpected properties', () => {
    const result = CreateProject.safeParse({ title: 'Studio site', admin: true });
    expect(result.success).toBe(false);
  });
});
```

**Naive / wrong approach:** Assert only that the endpoint returns some `200` response.

```typescript
// Weak test: it cannot catch leaked fields or incorrect authorization.
expect(response.status).toBe(200);
```

**Correct approach:** Assert the exact contract and negative cases that protect the boundary.

```typescript
expect(response.status).toBe(401);
expect(await response.json()).toEqual({ error: { code: 'UNAUTHENTICATED' } });
expect(response.headers.get('cache-control')).toContain('no-store');
```

**Gotcha:** Tests against a mocked handler may not exercise the actual route file. Keep at least one test that builds or invokes the route through the project's real Next.js setup.

### 16. Deploy with explicit platform assumptions

Local development hides deployment differences: filesystem persistence may disappear between invocations, serverless instances may scale horizontally, and long requests may be terminated. Do not store durable uploads in a temporary local directory or use module-level memory as a shared lock. Verify environment variables, runtime support, outbound network access, database connection limits, and request duration limits on the actual hosting platform. Build-time and runtime environment variables can have different availability.

Design a route around the guarantees the platform really offers. Durable work should use a queue or persistent job table. Connection pooling should match the hosting model. Scheduled tasks should use the platform scheduler or an external scheduler with authentication, not a route assumed to run by itself. Make migrations a deliberate release step and keep readiness checks useful during rollouts.

**Working example:**

```typescript
// app/api/jobs/route.ts
export async function POST(request: Request) {
  const secret = process.env.JOB_TRIGGER_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: { code: 'UNAUTHENTICATED' } }, { status: 401 });
  }
  const job = await queueReportGeneration({ requestedAt: new Date().toISOString() });
  return Response.json({ data: { jobId: job.id, status: 'queued' } }, { status: 202 });
}
```

**Naive / wrong approach:** Start a long report and keep the HTTP request open until all work finishes.

```typescript
// Wrong for a job that may exceed the platform's request execution budget.
const report = await buildMonthlyReportForEveryCustomer();
return Response.json({ data: report });
```

**Correct approach:** Persist a job, return a job identifier, and expose a separately authorized status endpoint.

```typescript
const job = await queueReportGeneration({ requestedBy: session.user.id });
return Response.json({ data: { jobId: job.id, status: 'queued' } }, { status: 202 });
```

**Gotcha:** A `202` response means processing was accepted, not completed. The API needs a reliable way for the caller to discover completion, failure, and retryability.

### 17. Integrate a complete project-management API slice

The final test of route mastery is not one isolated handler; it is a vertical slice that connects a route to validation, identity, authorization, domain logic, persistence, and observable responses. Imagine a project marketplace where an owner creates a portfolio project, edits its visibility, and retrieves it later. The route should reject malformed input, prevent another owner from changing the project, and avoid exposing internal database columns. Shared helpers should reduce duplicated policy without hiding control flow behind a large generic abstraction.

Start with the smallest public contract, then add tests for both allowed and denied behavior. Keep the data-access layer server-only. Return stable DTOs rather than serializing ORM objects wholesale. Make private caching explicit and attach request IDs to logs. Finally, test the deployed preview with two distinct user sessions: same URL, different permissions, and no cross-user data leakage. That test exercises the combined system rather than a single function.

**Working example:**

```typescript
// app/api/projects/route.ts
import { z } from 'zod';
import { requireSession } from '@/lib/server/auth';
import { createProject } from '@/lib/server/project-service';

const Input = z.object({ title: z.string().trim().min(3).max(120) }).strict();

export async function POST(request: Request) {
  const session = await requireSession();
  let raw: unknown;
  try { raw = await request.json(); }
  catch { return Response.json({ error: { code: 'INVALID_JSON' } }, { status: 400 }); }
  const parsed = Input.safeParse(raw);
  if (!parsed.success) return Response.json({ error: { code: 'VALIDATION_FAILED' } }, { status: 422 });
  const project = await createProject({ ownerId: session.user.id, title: parsed.data.title });
  return Response.json({ data: { id: project.id, title: project.title } }, {
    status: 201,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
```

**Naive / wrong approach:** Let the route return the raw persistence model and trust the frontend to hide fields.

```typescript
// Wrong: persistence objects can include internal columns and relations.
return Response.json({ data: await db.project.create({ data: input }) });
```

**Correct approach:** Use a deliberate output DTO, with only fields that belong in the public contract.

```typescript
const created = await createProject({ ownerId: session.user.id, title: parsed.data.title });
return Response.json({ data: { id: created.id, title: created.title, visibility: created.visibility } }, { status: 201 });
```

**Gotcha:** The route is not production-ready just because each helper looks clean. Test the composed endpoint with the actual auth adapter, database constraints, runtime, and deployment cache behavior.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Thin route, typed service boundary

**What it does:** Keep transport concerns in the route and business rules in a server-only service.

**When to use it:** several endpoints or background jobs need the same operation. Do not create a generic service framework for a single two-line read.

```typescript
// lib/server/project-service.ts
import 'server-only';
export async function renameProject(ownerId: string, projectId: string, title: string) {
  return db.project.updateMany({ where: { id: projectId, ownerId }, data: { title } });
}
```

**Nuance:** Keep the pattern proportional to the risk. A reusable boundary should make policy easier to audit, not conceal which identity, resource, or side effect is involved.

### Pattern 2: Schema-first request parsing

**What it does:** Define the payload contract once and infer TypeScript types from the runtime schema.

**When to use it:** forms, API clients, and tests need one canonical input shape. Keep response schemas separate when the public DTO differs from the database model.

```typescript
const RenameProject = z.object({ title: z.string().trim().min(3).max(120) }).strict();
type RenameProjectInput = z.infer<typeof RenameProject>;

export async function PATCH(request: Request) {
  const raw: unknown = await request.json();
  const parsed = RenameProject.safeParse(raw);
  if (!parsed.success) return Response.json({ error: { code: 'VALIDATION_FAILED' } }, { status: 422 });
  return Response.json({ data: parsed.data });
}
```

**Nuance:** Keep the pattern proportional to the risk. A reusable boundary should make policy easier to audit, not conceal which identity, resource, or side effect is involved.

### Pattern 3: Authorization-scoped database query

**What it does:** Apply ownership or tenant scope in the query itself where possible.

**When to use it:** records belong to users or organizations. If the policy involves complex roles, centralize the decision but do not skip it on individual mutation routes.

```typescript
const document = await db.document.findFirst({
  where: { id: documentId, organizationId: session.organization.id },
  select: { id: true, title: true, updatedAt: true },
});
if (!document) return Response.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });
```

**Nuance:** Keep the pattern proportional to the risk. A reusable boundary should make policy easier to audit, not conceal which identity, resource, or side effect is involved.

### Pattern 4: Public and private cache split

**What it does:** Cache public catalogue data separately from user-specific selections.

**When to use it:** a page combines public project details with a signed-in user’s saved items. Avoid shared caching for the composed private response unless the cache is explicitly user-scoped and safe.

```typescript
export async function GET() {
  const publicProjects = await loadPublicProjects();
  const session = await getOptionalSession();
  const savedIds = session ? await loadSavedProjectIds(session.user.id) : [];
  return Response.json({ data: { projects: publicProjects, savedIds } }, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
```

**Nuance:** Keep the pattern proportional to the risk. A reusable boundary should make policy easier to audit, not conceal which identity, resource, or side effect is involved.

### Pattern 5: Durable asynchronous job handoff

**What it does:** Persist work and return a job identifier when the operation can exceed request limits.

**When to use it:** for exports, media processing, and large report generation. Do not return `202` before the queue has durably accepted the work.

```typescript
export async function POST(request: Request) {
  const session = await requireSession();
  const job = await enqueueExport({ requestedBy: session.user.id });
  return Response.json({ data: { id: job.id, state: 'queued' } }, { status: 202 });
}
```

**Nuance:** Keep the pattern proportional to the risk. A reusable boundary should make policy easier to audit, not conceal which identity, resource, or side effect is involved.

### Pattern 6: Contract-focused route tests

**What it does:** Test status, error codes, DTO shape, auth, and cache headers instead of only testing that the handler does not throw.

**When to use it:** an endpoint is consumed by more than one UI or by an external client. Add a deployed smoke test for runtime-specific behavior.

```typescript
it('does not disclose a project to a different owner', async () => {
  const response = await callProjectRoute({ userId: 'usr_other', projectId: 'prj_owned' });
  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({ error: { code: 'NOT_FOUND' } });
});
```

**Nuance:** Keep the pattern proportional to the risk. A reusable boundary should make policy easier to audit, not conceal which identity, resource, or side effect is involved.

### Pattern 7: Request correlation and safe operational logs

**What it does:** Attach a request ID and log status plus duration with a safe allowlist of fields.

**When to use it:** a production incident must be traced across route, service, and dependency calls. Redact tokens and payloads before they enter persistent logs.

```typescript
const requestId = crypto.randomUUID();
const startedAt = Date.now();
try {
  const result = await updateProject(input);
  logger.info({ requestId, status: 200, durationMs: Date.now() - startedAt }, 'Project updated');
  return Response.json({ data: result }, { headers: { 'X-Request-Id': requestId } });
} catch (error) {
  logger.error({ requestId, error }, 'Project update failed');
  return Response.json({ error: { code: 'INTERNAL_ERROR', requestId } }, { status: 500 });
}
```

**Nuance:** Keep the pattern proportional to the risk. A reusable boundary should make policy easier to audit, not conceal which identity, resource, or side effect is involved.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Using a Pages Router default handler inside `app/api` | The developer confuses two file conventions | Export named HTTP methods from `app/**/route.ts` and use Web Request/Response APIs |
| Exporting `GET` from `pages/api` | A tutorial's router context was ignored | Use the default `NextApiRequest`/`NextApiResponse` handler in `pages/api` |
| Trusting TypeScript casts on request JSON | Compile-time types are mistaken for runtime validation | Parse `unknown` through a runtime schema before calling domain logic |
| Reading route params without awaiting them | Code was copied from an older Next.js signature | Match the installed version's route context type and await async `params` |
| Using `GET` to mutate data | A UI click was mistaken for an HTTP contract | Move the side effect to `POST`, `PATCH`, or `DELETE` and protect it |
| Assuming login means ownership | Identity and permission are collapsed into one concept | Scope each query and mutation to the actor or tenant policy |
| Returning ORM models directly | Persistence shape is treated as the public DTO | Select and serialize only fields approved for the API contract |
| Caching personalized output publicly | Cache behavior is not considered part of security | Send private/no-store headers and test two sessions against one URL |
| Reflecting any Origin header | CORS is treated as authentication | Match origins against a maintained allowlist and keep auth checks server-side |
| Returning stack traces to callers | Debugging convenience outranks data minimization | Log details server-side and return stable public error codes |
| Parsing JSON outside error handling | Valid JSON is assumed for every client | Catch parse errors and return a controlled `400` response |
| Allowing unlimited batch arrays | Request cost is assumed to be constant | Cap collection size and use bulk queries or bounded concurrency |
| Using process memory as a shared lock | Local single-process development hides horizontal scaling | Use durable uniqueness constraints or a distributed coordination mechanism |
| Doing lengthy work in a request | Local development does not expose platform time limits | Enqueue durable work and return a job ID with `202` |
| Logging cookies and request bodies | Full payload logging seems useful for debugging | Log allowlisted metadata and redact sensitive values |
| Assuming Edge supports every package | Runtime is chosen for branding rather than dependencies | Audit imports and use Node runtime for Node-only drivers |
| Returning `200` for every failure | Client handling is made superficially simple | Map validation, auth, conflict, rate limit, and server failures to stable statuses |
| Testing only the happy path | The endpoint is judged by one successful demo | Test auth denial, malformed bodies, cache headers, and cross-owner access |

**Before → After: unsafe route**

```typescript
// Before: no auth, validation, DTO boundary, or stable error behavior.
export async function POST(request: Request) {
  const input = await request.json();
  return Response.json({ data: await db.project.create({ data: input }) });
}
```

```typescript
// After: validate at the boundary, derive identity from the session, and serialize deliberately.
export async function POST(request: Request) {
  const session = await requireSession();
  let raw: unknown;
  try { raw = await request.json(); }
  catch { return Response.json({ error: { code: 'INVALID_JSON' } }, { status: 400 }); }
  const parsed = CreateProject.safeParse(raw);
  if (!parsed.success) return Response.json({ error: { code: 'VALIDATION_FAILED' } }, { status: 422 });
  const created = await createProject({ ownerId: session.user.id, ...parsed.data });
  return Response.json({ data: { id: created.id, title: created.title } }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
}
```

---

## Mental Models

1. **A route is a contract, not a file.** Its methods, status codes, body schema, auth rules, and caching behavior are all observable API behavior.
2. **The browser is an untrusted caller.** A TypeScript interface does not validate a request sent over the network.
3. **Identity is not permission.** Authentication establishes the actor; authorization scopes that actor to an action and resource.
4. **Cache keys are security boundaries.** If two users can receive different data at the same URL, shared caching must be explicit and carefully scoped.
5. **A timeout creates uncertainty.** If a write may have committed, retries need idempotency or a domain-level duplicate guard.
6. **Runtime is a dependency constraint.** Choose Node or Edge after checking the APIs imported by the route, not before.
7. **Every response is a client-facing promise.** Stable error codes and DTOs let clients evolve without depending on internal implementation details.
8. **A successful local request proves very little.** Runtime, CDN, database, and deployment behavior need tests at the boundary where they actually occur.

---

## Quick Reference

| Property/Situation | Value/Answer | Notes |
|---|---|---|
| App Router handler file | `app/api/name/route.ts` | Uses named HTTP method exports |
| Pages Router API file | `pages/api/name.ts` | Uses a default Node-style handler |
| Read query string | `new URL(request.url).searchParams` | Validate duplicates and bounds |
| Read JSON | `await request.json()` | Can reject; catch parse failures |
| Return JSON | `Response.json(data, { status })` | `NextResponse.json` is also available |
| Dynamic segment | `app/api/projects/[projectId]/route.ts` | Validate segment format |
| Route params | `await context.params` where required | Match installed Next.js version |
| Created resource | `201 Created` | Include representation or location when useful |
| Accepted background job | `202 Accepted` | Work is queued, not finished |
| Invalid syntax/body | `400 Bad Request` | Use stable error code |
| Unauthenticated | `401 Unauthorized` | Authentication is missing or invalid |
| Authenticated but denied | `403 Forbidden` | Some systems intentionally use `404` to hide existence |
| Resource absent | `404 Not Found` | Keep policy consistent |
| State conflict | `409 Conflict` | Useful for duplicates or stale state |
| Valid JSON, invalid domain shape | `422 Unprocessable Content` | Document the chosen convention |
| Too many requests | `429 Too Many Requests` | Consider `Retry-After` |
| Temporary server/dependency failure | `503 Service Unavailable` | Use only when retry may help |
| Private response cache | `Cache-Control: private, no-store` | Verify CDN behavior in deployment |
| CORS allowlist | Explicit set of origins | Never reflect arbitrary origins with credentials |
| Runtime for Node-only DB client | `export const runtime = 'nodejs'` | Confirm current hosting adapter support |
| Server-only module | `import 'server-only'` | Helps prevent accidental client imports |
| Safe request correlation | `crypto.randomUUID()` | Do not log auth headers alongside it |
| Idempotency | Persistent key + request fingerprint | Add uniqueness constraints for race safety |
| Request validation | Runtime schema such as Zod | Type assertions do not validate input |
| Secret environment variable | No `NEXT_PUBLIC_` prefix | Public-prefixed values may enter browser bundles |
| Route integration test | Real route contract + negative cases | Mocks alone cannot prove deployment behavior |

---

## Build Challenge

### Build: The Secure Project Marketplace Route Suite

Build a small App Router API slice for a project marketplace. Owners can create projects, list only their own private projects, update project titles, and request a long-running export. The challenge proves mastery because it requires a coherent contract across routing, runtime validation, authorization, DTOs, caching, failure handling, and deployment assumptions—not just a route that returns JSON.

**Requirements**

1. Implement `GET` and `POST` in `app/api/projects/route.ts` using named exports.
2. Implement `GET` and `PATCH` in `app/api/projects/[projectId]/route.ts` and await route params according to the installed Next.js version.
3. Define strict runtime schemas for create and update inputs, including length bounds and rejection of unexpected keys.
4. Require a verified session for private project operations; never accept the acting owner ID from the request body.
5. Scope data reads and writes to the authenticated owner and return a consistent `404` policy for inaccessible records.
6. Return explicit DTOs instead of raw persistence objects and add `Cache-Control: private, no-store` to personalized responses.
7. Catch malformed JSON and return stable error envelopes without exposing exception text.
8. Add an export endpoint that durably queues work and returns `202` with a job ID rather than performing an unbounded report in the request.
9. Add request correlation and structured logs that exclude cookies, tokens, and full payloads.
10. Add tests for invalid JSON, schema failure, unauthenticated access, cross-owner access, successful creation, and cache headers.
11. Add a concurrency test or database constraint test proving duplicate submissions cannot create duplicate high-impact operations.
12. Deploy a preview and test the route under the intended runtime; document environment variables and database connection assumptions.

**Expected output / definition of success**

- Every required route is discovered by Next.js and returns the documented method-specific response.
- Invalid requests produce stable `4xx` responses; unexpected failures produce safe `5xx` responses and correlated server logs.
- User A cannot read or modify User B's private project by guessing an ID.
- The response contains only the approved DTO fields, never internal database fields or secrets.
- Private responses are not reused across sessions by shared caches in the deployed preview.
- The export endpoint returns only after the job is durably accepted, with a separate way to inspect job state.
- Automated tests cover the named positive and negative cases and run in CI.
- Runtime and environment assumptions are written down and verified in the production-like deployment.
- No endpoint depends on in-memory state for correctness across multiple instances.

**Suggested focused-session plan:** 35 minutes to map the router and public contract; 55 minutes to implement schemas and handlers; 45 minutes for auth and ownership scope; 35 minutes for error envelopes, cache policy, and logs; 50 minutes for tests and duplicate-operation protection; 30 minutes for deployed smoke tests and documentation. Total: approximately 4 hours 10 minutes.
