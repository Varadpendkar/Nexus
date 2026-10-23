# SKILL: restful-api-design

**Layer:** 18 — Backend Development  
**Goal:** Design resource-oriented HTTP APIs with predictable semantics, robust validation, secure access, and compatibility as clients and product requirements evolve.

---

## Why This Matters (Senior Perspective)

A REST API is a contract between independently deployed systems. If that contract is vague, small backend changes become production incidents: a frontend silently stops rendering because a response field changed, a retry creates duplicate payments, a list endpoint returns millions of records, or a user changes another user's resource by guessing an ID. These failures are rarely fixed by adding another route; they come from unclear resource boundaries, status-code misuse, inconsistent errors, and missing operational constraints.

A beginner often thinks in terms of URLs and controller functions: “What endpoint should I add?” A senior starts with the domain and its invariants: “What resource is being represented, who may act on it, what state transitions are legal, and what happens when the network retries?” The senior also considers API evolution, pagination cost, observability, caching, rate limits, and how a client can recover from failure without guessing.

This matters in creative and freelance work because a polished portfolio, booking site, e-commerce storefront, or interactive product demo often depends on APIs serving projects, images, users, forms, and checkout flows. A beautiful interface cannot compensate for an endpoint that leaks private data, breaks on mobile's slower network, or returns inconsistent data after an edit. Good REST design lets frontend work proceed independently, makes integrations easier to document, and gives a small team room to change internals without breaking customers. The goal is not to follow REST vocabulary mechanically; it is to create a stable, understandable, secure HTTP contract that behaves well under real traffic and failure.

---

## Core Concepts

### 1. Resources and Representations

A resource is a domain concept with identity; a representation is the JSON (or other media type) sent over HTTP. Name paths with nouns and let the HTTP method express the operation.

```http
GET /api/v1/projects/42
Accept: application/json
```

```json
{
  "id": "42",
  "title": "Editorial Portfolio",
  "status": "published"
}
```

The route identifies a project; the JSON is its current representation. Do not expose internal database rows wholesale: shape responses around the public contract.

**Naive:** `/api/v1/getProjectById?id=42` encodes the action into the URL.  
**Correct:** `GET /api/v1/projects/42` uses a resource path and standard method semantics.

**Gotcha:** A resource does not have to map one-to-one to a database table. A public `project-summary` representation may combine several internal tables.

### 2. HTTP Methods and Safety

Methods communicate intent and affect caching, retries, and client behavior. `GET` and `HEAD` are safe; `PUT` and `DELETE` are idempotent by definition; `POST` is not generally idempotent.

```http
GET    /api/v1/projects
POST   /api/v1/projects
GET    /api/v1/projects/42
PATCH  /api/v1/projects/42
DELETE /api/v1/projects/42
```

Use `POST` to create a subordinate resource or trigger a non-idempotent operation, `PUT` to replace a known resource representation, and `PATCH` for partial updates.

**Naive:** Use `GET /projects/42/delete` because it is easy to wire to a button.  
**Correct:** Send `DELETE /api/v1/projects/42` and protect it with authorization and CSRF controls where relevant.

**Gotcha:** Clients, proxies, and crawlers may prefetch `GET`; never make a `GET` request mutate state.

### 3. Status Codes Are Part of the Contract

Choose a status that communicates the outcome without forcing clients to parse prose. Common choices include `200`, `201`, `202`, `204`, `400`, `401`, `403`, `404`, `409`, `422`, `429`, and `500`.

```http
HTTP/1.1 201 Created
Location: /api/v1/projects/42
Content-Type: application/json
```

```json
{"id":"42","title":"Editorial Portfolio","status":"draft"}
```

Return `201 Created` for a successful creation, often with `Location`; return `204 No Content` when success has no response body. Use `202 Accepted` when work is queued rather than completed.

**Naive:** Return `200 OK` for every outcome and place `"success": false` in JSON.  
**Correct:** Use a meaningful HTTP status and a stable error body.

**Gotcha:** `401` means authentication is missing or invalid; `403` means the caller is authenticated but not allowed. Some systems deliberately use `404` to avoid revealing whether a protected resource exists.

### 4. Collection and Item Routes

Use plural collection routes and a stable identifier for individual resources. Keep nested routes shallow; excessive nesting couples clients to ownership structure.

```http
GET /api/v1/projects
GET /api/v1/projects/42
GET /api/v1/users/7/projects
```

```json
{
  "data": [{"id":"42","title":"Editorial Portfolio"}],
  "meta": {"count": 1}
}
```

A nested route is useful when the relationship is central to the query. If nesting reaches three or four levels, consider a top-level resource route with filters.

**Naive:** `/users/7/teams/2/projects/42/comments/9` for every operation.  
**Correct:** Use `/comments/9` after authorization establishes whether the comment belongs to an accessible project.

**Gotcha:** Never trust a parent ID supplied in the URL as proof of ownership; verify the relationship in server-side logic.

### 5. Query Parameters, Filtering, and Sorting

Query parameters should refine a collection without changing the identity of the resource. Document allowed filters and sort fields rather than translating arbitrary client strings into SQL.

```http
GET /api/v1/projects?status=published&sort=-updatedAt&limit=20
```

```python
ALLOWED_SORTS = {"title", "createdAt", "updatedAt"}

def normalize_sort(value: str) -> str:
    descending = value.startswith("-")
    field = value[1:] if descending else value
    if field not in ALLOWED_SORTS:
        raise ValueError("Unsupported sort field")
    return f"{'-' if descending else ''}{field}"
```

Validate filter types, cap list sizes, and use parameterized database queries. Make sorting deterministic by adding a unique tie-breaker such as `id`.

**Naive:** Insert `sort` directly into an SQL `ORDER BY` string.  
**Correct:** Map accepted public sort keys to known database columns.

**Gotcha:** Sorting only by a non-unique field can cause records to jump between pages when values tie.

### 6. Pagination: Offset and Cursor

Pagination protects databases and clients from unbounded responses. Offset pagination is simple for small, stable datasets; cursor pagination is more reliable for feeds that change frequently.

```http
GET /api/v1/projects?limit=20&offset=40
GET /api/v1/projects?limit=20&cursor=eyJpZCI6IjQyIn0
```

```json
{
  "data": [{"id":"42","title":"Editorial Portfolio"}],
  "page": {"nextCursor":"eyJpZCI6IjQyIn0","hasMore":true}
}
```

Enforce a maximum page size, return a clear next-page token, and define what happens when the underlying collection changes.

**Naive:** Return every project and let the browser slice the array.  
**Correct:** Apply pagination in the database and return only the requested window.

**Gotcha:** A cursor is not an authorization token. Re-check permissions on every request, and avoid exposing sensitive raw database keys inside unsigned cursor data.

### 7. Request Validation and Schema Boundaries

Treat incoming JSON as untrusted. Validate types, lengths, formats, allowed enum values, and cross-field rules before business logic executes.

```python
from pydantic import BaseModel, Field
from typing import Literal

class ProjectCreate(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    status: Literal["draft", "published"] = "draft"
    description: str = Field(default="", max_length=5000)
```

A schema makes the accepted contract explicit and produces consistent validation errors. Keep transport validation separate from domain rules such as “only an owner may publish.”

**Naive:** Accept arbitrary JSON and write it directly to the database model.  
**Correct:** Parse into a request schema, then apply authorization and domain validation.

**Gotcha:** Validation at the API layer does not replace database constraints; concurrent requests can still violate uniqueness or referential integrity.

### 8. Consistent Error Representations

Clients need machine-readable error codes and safe human-readable messages. Do not leak SQL, stack traces, secrets, or internal service names.

```json
{
  "error": {
    "code": "PROJECT_TITLE_TOO_SHORT",
    "message": "Title must contain at least 3 characters.",
    "requestId": "req_7f3a"
  }
}
```

Use one error envelope across endpoints, include field-level details when useful, and log technical context server-side under a correlation ID.

**Naive:** Return different shapes such as `{"error":"bad"}`, an HTML traceback, or a bare string.  
**Correct:** Centralize exception mapping and keep the response schema stable.

**Gotcha:** Error messages can reveal whether an email or account exists; consider privacy implications before returning detailed authentication errors.

### 9. Authentication and Authorization

Authentication answers “who are you?” Authorization answers “may you perform this action on this resource?” Both are required for protected APIs.

```python
def can_edit_project(user, project) -> bool:
    return user.is_active and (
        project.owner_id == user.id or user.role == "admin"
    )
```

Check access on every request, including reads and nested objects. Prefer explicit policy functions or framework dependencies over scattered role checks.

**Naive:** Hide the Edit button in the frontend and assume users cannot call the endpoint.  
**Correct:** Enforce object-level permission checks on the server before returning or changing data.

**Gotcha:** An unpredictable UUID reduces guessing but does not replace authorization; leaked links and logs still exist.

### 10. Idempotency and Retry Safety

Networks fail after the server may have committed a change but before the client receives the response. Idempotency keys let clients safely retry operations that would otherwise create duplicates.

```http
POST /api/v1/orders
Idempotency-Key: 4d0b8d90-0d48-4e95-9cb6-5c75d7ef0f1a
Content-Type: application/json
```

Store the key, caller scope, request hash, and result atomically with the operation. A repeated key with the same payload returns the original result; the same key with a different payload should be rejected.

**Naive:** Retry every failed `POST` blindly.  
**Correct:** Use an idempotency record for payments, orders, and other duplicate-sensitive actions.

**Gotcha:** A key without durable storage or a uniqueness constraint can still race under concurrent retries.

### 11. Versioning and Compatibility

Versioning is a compatibility strategy, not permission to break clients casually. Prefer additive changes, preserve existing field meaning, and announce deprecations with a migration window.

```http
GET /api/v1/projects/42
```

```json
{
  "id": "42",
  "title": "Editorial Portfolio",
  "createdAt": "2026-10-21T09:00:00Z"
}
```

A new optional response field is usually compatible; renaming a field, changing units, or changing a field from scalar to object is generally breaking. Use explicit dates and UTC for timestamps.

**Naive:** Rename `createdAt` to `created_at` in place because the backend team prefers it.  
**Correct:** Keep the public contract stable or introduce a deliberate versioned migration.

**Gotcha:** “Optional” is not always safe: clients may reject unknown fields, so know the actual client ecosystem and schema rules.

### 12. Caching, ETags, and Conditional Requests

Caching reduces latency and server load, but cache policy must respect data sensitivity. `ETag` supports conditional requests and helps clients avoid downloading unchanged representations.

```http
HTTP/1.1 200 OK
ETag: "project-42-v8"
Cache-Control: private, max-age=60
```

```http
GET /api/v1/projects/42
If-None-Match: "project-42-v8"
```

If the representation has not changed, respond `304 Not Modified` without a body. Use `Cache-Control: no-store` for sensitive responses where storage is inappropriate.

**Naive:** Add `public, max-age=3600` to every endpoint.  
**Correct:** Choose policy by resource sensitivity, personalization, and freshness needs.

**Gotcha:** Shared caches can leak personalized content if cache keys and directives are incorrect.

### 13. Rate Limits, Payload Limits, and Abuse Resistance

Every public endpoint needs resource budgets. A valid request can still be abusive if it asks for huge pages, expensive filters, or repeated costly operations.

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 30
RateLimit-Limit: 100
RateLimit-Remaining: 0
```

Apply per-user or per-token limits where possible, request-body size caps, timeouts, and concurrency limits. Return a retry hint when known and instrument limit events.

**Naive:** Allow arbitrary `limit=1000000` because the query is valid.  
**Correct:** Clamp or reject oversized requests and enforce query timeouts.

**Gotcha:** Rate limiting only by IP can punish users behind a shared NAT and can be bypassed by distributed clients; combine signals thoughtfully.

### 14. End-to-End Resource Lifecycle

A production endpoint combines routing, validation, authentication, authorization, domain rules, persistence, and a stable response. These layers should be independently testable.

```python
def publish_project(project_id, user, repo):
    project = repo.get_by_id(project_id)
    if project is None:
        raise NotFound("Project not found")
    if project.owner_id != user.id:
        raise Forbidden("You cannot publish this project")
    if not project.title.strip():
        raise Conflict("A project needs a title before publishing")
    project.status = "published"
    repo.save(project)
    return project
```

The route should translate HTTP input to application calls and application outcomes to HTTP responses. Keep business rules out of route-string parsing and avoid returning ORM objects without a response schema.

**Naive:** Put SQL, authorization, state transitions, and JSON serialization in one giant route handler.  
**Correct:** Separate transport, application/domain, and persistence responsibilities while keeping the request flow easy to trace.

**Gotcha:** Check-then-save logic can race; use transactions and database constraints for invariants that must hold under concurrent requests.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Collection with Bounded Pagination

**What it does:** Returns a predictable page of records with explicit continuation metadata.

**When to use it:** A portfolio page loads published projects and must remain responsive as the catalogue grows.

```python
def list_projects(repo, limit: int = 20, cursor: str | None = None):
    limit = max(1, min(limit, 100))
    rows, next_cursor = repo.fetch_page(limit=limit, cursor=cursor)
    return {"data": rows, "page": {
        "nextCursor": next_cursor,
        "hasMore": next_cursor is not None
    }}
```

The repository should apply ordering and cursor conditions in the database. Avoid offset pagination for rapidly changing feeds where duplicates and gaps matter.

### Pattern 2: Explicit PATCH Allowlist

**What it does:** Updates only fields the caller is allowed to change.

**When to use it:** An editor changes a project's title or description without overwriting its owner or publication status.

```python
EDITABLE_FIELDS = {"title", "description"}

def apply_project_patch(project, payload):
    unknown = set(payload) - EDITABLE_FIELDS
    if unknown:
        raise ValueError(f"Unsupported fields: {', '.join(sorted(unknown))}")
    for key, value in payload.items():
        setattr(project, key, value)
    return project
```

A schema should validate each field before this function runs. For complex updates, use explicit commands such as `publish` rather than exposing privileged state fields.

### Pattern 3: Centralized Error Mapping

**What it does:** Converts known application exceptions into consistent HTTP error responses.

**When to use it:** Several routes need the same JSON error format and request ID behavior.

```python
def error_response(code, message, status, request_id):
    return {
        "status": status,
        "body": {"error": {
            "code": code,
            "message": message,
            "requestId": request_id
        }}
    }
```

Keep internal exception details in protected logs, not the response. Do not turn every exception into `400`; unexpected failures should remain visible as server errors.

### Pattern 4: Conditional GET with ETag

**What it does:** Avoids transferring a representation that has not changed.

**When to use it:** A public project detail page is fetched repeatedly but changes infrequently.

```python
import hashlib
import json

def make_etag(payload: dict) -> str:
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return '"' + hashlib.sha256(canonical.encode()).hexdigest() + '"'
```

Compare the incoming `If-None-Match` header with the current validator and return `304` when appropriate. Never use a public cache policy for personalized data merely because an ETag exists.

### Pattern 5: Idempotent Create Command

**What it does:** Makes retries safe for operations that must not create duplicates.

**When to use it:** A checkout client retries order creation after a mobile connection drops.

```python
def create_order_once(key, request_hash, store, create_order):
    prior = store.find_idempotency_record(key)
    if prior:
        if prior.request_hash != request_hash:
            raise ValueError("Idempotency key reused with different request")
        return prior.response
    # In production, key reservation, order creation, and result storage
    # must be coordinated transactionally with a unique key constraint.
    return create_order()
```

The abbreviated function illustrates the contract; production storage must handle concurrent requests atomically. Expire records only after the retry window and business requirements are understood.

### Pattern 6: Object-Level Authorization

**What it does:** Ensures a valid identity can access only resources permitted by policy.

**When to use it:** Users can edit their own portfolio projects, while administrators have an explicit override.

```python
def get_editable_project(project_id, user, repo):
    project = repo.get_by_id(project_id)
    if project is None:
        raise LookupError("Project not found")
    if project.owner_id != user.id and user.role != "admin":
        raise PermissionError("Forbidden")
    return project
```

Call this policy for every mutation and any sensitive read. Choose whether unauthorized resources return `403` or a privacy-preserving `404` consistently.

### Pattern 7: Contract Tests for API Compatibility

**What it does:** Verifies route behavior, schemas, status codes, and error shapes from a client's perspective.

**When to use it:** A frontend and backend are deployed separately and must not drift silently.

```python
def test_project_detail_contract(client):
    response = client.get("/api/v1/projects/42")
    assert response.status_code == 200
    body = response.json()
    assert {"id", "title", "status"} <= body.keys()
    assert isinstance(body["id"], str)
```

Test both successful and failure cases, including authorization and validation. Avoid asserting irrelevant implementation details such as private helper names or database query counts unless they are performance requirements.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Using verbs in every route | Treating URLs as function names | Model nouns as resources and use HTTP methods for standard operations |
| Mutating state through `GET` | Confusing navigation with commands | Make `GET` safe and use `POST`, `PATCH`, or `DELETE` for mutations |
| Returning `200` for validation failures | Treating HTTP status as decoration | Map validation to a documented `400` or `422` policy |
| Returning an unbounded collection | Testing only with a tiny local dataset | Add database pagination and a maximum page size |
| Trusting client-supplied owner IDs | Assuming frontend fields are trustworthy | Derive identity from the authenticated principal and verify ownership |
| Serializing ORM objects directly | Confusing persistence schema with public API | Use explicit response schemas and field allowlists |
| Accepting arbitrary sort columns | Passing client strings into SQL | Map allowed public keys to fixed database columns |
| Retrying non-idempotent creates blindly | Assuming every timeout means no write happened | Use idempotency keys and durable uniqueness constraints |
| Leaking exception text | Returning developer diagnostics to speed debugging | Log internals privately and return stable safe error codes |
| Changing response fields in place | Underestimating independently deployed clients | Add compatible fields or run a documented version migration |
| Caching personalized responses publicly | Optimizing latency without considering identity | Use private/no-store directives and correct cache keys |
| Checking permissions only in the UI | Confusing interface visibility with security | Enforce object-level authorization on the server |
| Using offset pages on a volatile feed | Assuming records remain still between requests | Use a deterministic cursor and stable ordering |
| Treating UUIDs as access control | Believing hard-to-guess IDs are secret | Verify authorization for every resource operation |
| Ignoring payload and query limits | Assuming authenticated requests are safe | Set body caps, timeouts, query budgets, and rate limits |
| Returning inconsistent error shapes | Each route implements errors independently | Centralize exception mapping and contract tests |
| Forgetting concurrency invariants | Testing only single-request flows | Use transactions, unique constraints, and race-condition tests |

**Before → After**

```http
# Before: ambiguous action route
GET /api/deleteProject?id=42

# After: standard resource operation
DELETE /api/v1/projects/42
```

The second form makes the mutation explicit to clients, monitoring, and infrastructure. It still requires authentication, authorization, and appropriate protections.

---

## Mental Models

1. **The API is a contract, not a controller.** Clients depend on observable behavior, not your internal function names.
2. **URLs identify; methods act.** Put resource identity in the path and operation semantics in the HTTP method.
3. **Validate at the edge, enforce in the domain.** Syntax belongs in request schemas; business invariants belong in domain logic and the database.
4. **Every ID is a permission question.** Finding a record and being allowed to access it are separate decisions.
5. **Assume the network will retry.** Design duplicate-sensitive operations to remain safe after timeouts and repeated requests.
6. **Bound every expensive dimension.** Response size, page size, query time, payload bytes, and request rate all need limits.
7. **Compatibility is measured at the client boundary.** A backend refactor is safe only if the public behavior remains compatible.
8. **Errors are part of the interface.** Stable status codes and error codes let clients recover without scraping prose.

---

## Quick Reference

| Need | Recommended design |
|---|---|
| Read a collection | `GET /api/v1/projects` |
| Read one resource | `GET /api/v1/projects/{id}` |
| Create a resource | `POST /api/v1/projects` with `201 Created` |
| Replace a full representation | `PUT /api/v1/projects/{id}` |
| Partially update | `PATCH /api/v1/projects/{id}` |
| Delete a resource | `DELETE /api/v1/projects/{id}` |
| Accepted asynchronous work | `202 Accepted` plus a status resource |
| Successful mutation with no body | `204 No Content` |
| Missing/invalid credentials | `401 Unauthorized` |
| Authenticated but disallowed | `403 Forbidden` (or consistent privacy-preserving `404`) |
| Conflicting current state | `409 Conflict` |
| Invalid request data | `400` or `422`, consistently documented |
| Rate limit reached | `429 Too Many Requests` with retry guidance |
| Avoid unbounded responses | Database pagination and a capped page size |
| Stable error contract | `error.code`, `error.message`, `error.requestId` |
| Safe retry of create | Idempotency key with durable unique storage |
| Cache revalidation | `ETag`, `If-None-Match`, `304 Not Modified` |
| Public API evolution | Additive changes, deprecation window, explicit version strategy |
| Prevent object access bugs | Server-side object-level authorization |
| Trace a request | Correlation/request ID in logs and error responses |

---

## Build Challenge

### Build: Portfolio Projects REST API

Build a versioned REST API for a creative portfolio with projects, tags, and contact submissions. The API must be usable by a separately deployed frontend and must remain safe when requests are invalid, repeated, or unauthorized.

**Requirements**

1. Implement `GET /api/v1/projects` with `status`, `tag`, `sort`, and bounded cursor pagination.
2. Implement `GET /api/v1/projects/{id}`, `POST /api/v1/projects`, `PATCH /api/v1/projects/{id}`, and `DELETE /api/v1/projects/{id}`.
3. Define request and response schemas; reject unknown write fields and invalid enum values.
4. Enforce owner/admin authorization on all protected operations.
5. Use a consistent error envelope with stable codes and a request ID.
6. Add idempotency support to contact submission or another duplicate-sensitive `POST`.
7. Add ETag revalidation to public project detail responses and choose cache directives intentionally.
8. Apply body-size, page-size, rate, and database-query limits.
9. Write contract tests for success, validation errors, unauthenticated access, forbidden access, not-found behavior, pagination, and retry behavior.
10. Document all routes, status codes, examples, and compatibility policy.

**Definition of Done**

- Every route has a documented method, path, input schema, output schema, and status-code behavior.
- No protected operation relies on frontend-only permission checks.
- Collection responses are bounded and deterministically ordered.
- Invalid requests never expose stack traces or database details.
- Repeating an idempotent request does not create a duplicate side effect.
- Tests cover both successful requests and realistic failure paths.
- API documentation matches the implementation and includes at least one request/response example per route.
- A new optional response field can be added without changing the meaning of existing fields.
