# SKILL: fastapi-python-backend
**Layer:** 18 — Backend Development
**Goal:** Build production-minded FastAPI services with validated contracts, secure authorization, efficient I/O, reliable persistence, and testable operational behavior.

---

## Why This Matters (Senior Perspective)

FastAPI makes it easy to expose a Python function as an HTTP endpoint, but production backend work is not just routing. A portfolio marketplace can appear correct in a local demo and still fail when two users update the same project, an anonymous visitor guesses a private project ID, a client submits a multi-megabyte file, or a partner API takes twenty seconds to respond. The visible symptom might be a 500 error, a frozen worker, leaked owner data, duplicate notifications, or a database connection pool exhausted during a traffic spike. These failures often emerge from boundaries that a beginner does not notice: an unbounded query parameter, a blocking call inside `async def`, a session that is never closed, or a request model that silently accepts fields the client should not control.

A senior developer treats each endpoint as a contract and each request as untrusted. They decide what the client is allowed to send, what the response is allowed to reveal, which identity is acting, and what happens when persistence or a downstream service fails. They distinguish authentication from authorization, short database transactions from distributed workflows, and in-process background tasks from durable queues. They also design for operations: useful status codes, structured logs, request IDs, metrics, timeouts, bounded work, and tests that reproduce failure conditions. `async` is selected because the whole I/O path supports it—not because the keyword looks modern. Dependencies are used to make shared resources and policies explicit rather than to hide a tangled graph.

For creative and freelance work, FastAPI is a practical way to power a portfolio CMS, project marketplace, image-processing service, client dashboard, booking form, or recommendation API. A beautifully animated front end still feels amateur if form submissions duplicate, project pages expose private drafts, uploads fail unpredictably, or the API returns inconsistent errors. Reliable API contracts let a polished Next.js or React interface behave consistently on mobile, under slow networks, and during real client use. The goal is to deliver an experience that looks intentional because the backend is equally intentional.

---

## Core Concepts

### 1. Choose a FastAPI application structure

Keep HTTP concerns at the edge and move business rules into services. A route should coordinate dependencies, validation, and response shape; it should not become the place where every database query and policy decision lives.

**Working pattern:**

```python
# app/main.py
from fastapi import FastAPI
from app.routers import projects

app = FastAPI(title="Studio Project API", version="1.0.0")
app.include_router(projects.router, prefix="/api/v1/projects", tags=["projects"])

@app.get("/health", include_in_schema=False)
def health_check() -> dict[str, str]:
    return {"status": "ok"}

```

This first example demonstrates the boundary or mechanism. Names describe the domain so the reader can reason about intent without mentally translating generic placeholders.

**A second production detail:**

```python
# app/routers/projects.py
from fastapi import APIRouter, HTTPException
from app.schemas.projects import ProjectOut
from app.services.projects import list_public_projects

router = APIRouter()

@router.get("/", response_model=list[ProjectOut])
def get_projects() -> list[ProjectOut]:
    # The route adapts the service result to an HTTP contract.
    return list_public_projects()

```

The second example shows how the same concept participates in a larger request flow. In a real service, connect these functions to a repository and configuration appropriate to the application; do not copy a demonstration in place of persistence, validation, or policy enforcement.

**Naive / wrong approach:**

```python
# Wrong: route owns database access, policy, and response formatting.
@router.get("/projects")
def get_projects():
    rows = database.execute("SELECT * FROM projects")
    return [dict(row) for row in rows]

```

This approach is attractive because it is shorter, but it leaves a correctness, security, or operations decision implicit. The omission becomes expensive when the endpoint is called concurrently or by a client outside your control.

**Correct approach:**

```python
# Better: route delegates and declares the public response contract.
@router.get("/", response_model=list[ProjectOut])
def get_projects():
    return list_public_projects()

```

Prefer the explicit contract and narrow responsibility. Keep validation at the boundary, policy in a reusable service or dependency, and persistence behavior behind a repository or session abstraction where that improves testability.

**Gotcha:** A small project can start with fewer modules, but separate schemas, services, and persistence once logic has independent tests or multiple callers. Avoid creating empty abstraction layers just to satisfy a folder diagram.


### 2. Model input and output with Pydantic

Treat request models as boundary contracts, not merely convenient dictionaries. Input schemas define what clients may send; output schemas define what the API promises to reveal.

**Working pattern:**

```python
from pydantic import BaseModel, ConfigDict, Field

class ProjectCreate(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    summary: str = Field(min_length=10, max_length=2000)
    price_inr: int = Field(ge=0, le=2_000_000)

class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    summary: str
    price_inr: int

```

This first example demonstrates the boundary or mechanism. Names describe the domain so the reader can reason about intent without mentally translating generic placeholders.

**A second production detail:**

```python
from fastapi import FastAPI
from app.schemas.projects import ProjectCreate, ProjectOut

app = FastAPI()

@app.post("/projects", response_model=ProjectOut, status_code=201)
def create_project(payload: ProjectCreate) -> ProjectOut:
    # Validation has already rejected malformed or out-of-range fields.
    return ProjectOut(id=42, **payload.model_dump())

```

The second example shows how the same concept participates in a larger request flow. In a real service, connect these functions to a repository and configuration appropriate to the application; do not copy a demonstration in place of persistence, validation, or policy enforcement.

**Naive / wrong approach:**

```python
# Wrong: accepts arbitrary keys and returns internal objects wholesale.
def create_project(payload: dict):
    return database.insert(payload)

```

This approach is attractive because it is shorter, but it leaves a correctness, security, or operations decision implicit. The omission becomes expensive when the endpoint is called concurrently or by a client outside your control.

**Correct approach:**

```python
# Better: validate input and filter output through an explicit schema.
def create_project(payload: ProjectCreate) -> ProjectOut:
    record = project_service.create(payload)
    return ProjectOut.model_validate(record)

```

Prefer the explicit contract and narrow responsibility. Keep validation at the boundary, policy in a reusable service or dependency, and persistence behavior behind a repository or session abstraction where that improves testability.

**Gotcha:** Use separate create, update, and output schemas when their permissions differ. Never assume a field safe for output is also safe for mass assignment on input.


### 3. Use path parameters and query parameters intentionally

A path identifies the resource; query parameters shape a collection response. FastAPI parses typed parameters and returns a 422 response when conversion or validation fails.

**Working pattern:**

```python
from typing import Annotated
from fastapi import APIRouter, Query

router = APIRouter()

@router.get("/")
def search_projects(
    q: Annotated[str | None, Query(max_length=80)] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> dict:
    return project_service.search(query=q, page=page, page_size=page_size)

```

This first example demonstrates the boundary or mechanism. Names describe the domain so the reader can reason about intent without mentally translating generic placeholders.

**A second production detail:**

```python
@router.get("/{project_id}")
def read_project(project_id: int):
    project = project_service.get_by_id(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

```

The second example shows how the same concept participates in a larger request flow. In a real service, connect these functions to a repository and configuration appropriate to the application; do not copy a demonstration in place of persistence, validation, or policy enforcement.

**Naive / wrong approach:**

```python
# Wrong: unbounded user-controlled page size can trigger huge queries.
def list_projects(limit: int = 1000000):
    return repository.list(limit=limit)

```

This approach is attractive because it is shorter, but it leaves a correctness, security, or operations decision implicit. The omission becomes expensive when the endpoint is called concurrently or by a client outside your control.

**Correct approach:**

```python
# Better: constrain the input at the boundary.
def list_projects(limit: Annotated[int, Query(ge=1, le=100)] = 20):
    return repository.list(limit=limit)

```

Prefer the explicit contract and narrow responsibility. Keep validation at the boundary, policy in a reusable service or dependency, and persistence behavior behind a repository or session abstraction where that improves testability.

**Gotcha:** Use stable sorting whenever pagination is involved; otherwise rows can shift between pages as records are inserted. For public APIs, document whether page numbering starts at zero or one.


### 4. Choose HTTP methods and status codes by semantics

HTTP status codes are part of the client-facing contract. They let browsers, SDKs, monitoring, and retry logic distinguish success, invalid input, missing resources, and temporary failure.

**Working pattern:**

```python
from fastapi import Response, status

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=ProjectOut)
def create_project(payload: ProjectCreate):
    created = project_service.create(payload)
    return created

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int) -> Response:
    project_service.delete(project_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

```

This first example demonstrates the boundary or mechanism. Names describe the domain so the reader can reason about intent without mentally translating generic placeholders.

**A second production detail:**

```python
@router.put("/{project_id}", response_model=ProjectOut)
def replace_project(project_id: int, payload: ProjectCreate):
    return project_service.replace(project_id, payload)

@router.patch("/{project_id}", response_model=ProjectOut)
def update_project(project_id: int, payload: ProjectPatch):
    return project_service.patch(project_id, payload)

```

The second example shows how the same concept participates in a larger request flow. In a real service, connect these functions to a repository and configuration appropriate to the application; do not copy a demonstration in place of persistence, validation, or policy enforcement.

**Naive / wrong approach:**

```python
# Wrong: successful create returns 200 without a clear contract.
@router.post("/projects")
def create_project(payload: ProjectCreate):
    return project_service.create(payload)

```

This approach is attractive because it is shorter, but it leaves a correctness, security, or operations decision implicit. The omission becomes expensive when the endpoint is called concurrently or by a client outside your control.

**Correct approach:**

```python
# Better: communicate that a new resource was created.
@router.post("/projects", status_code=201, response_model=ProjectOut)
def create_project(payload: ProjectCreate):
    return project_service.create(payload)

```

Prefer the explicit contract and narrow responsibility. Keep validation at the boundary, policy in a reusable service or dependency, and persistence behavior behind a repository or session abstraction where that improves testability.

**Gotcha:** A 204 response must not include a JSON body. Use 202 Accepted only when work has been accepted for later processing, and give the client a way to inspect its status.


### 5. Inject shared resources with dependencies

Dependencies are FastAPI’s composition mechanism. They can supply authenticated users, database sessions, configuration, and reusable validation without hiding the dependency graph.

**Working pattern:**

```python
from typing import Annotated
from fastapi import Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal

def get_db():
    with SessionLocal() as session:
        yield session

DbSession = Annotated[Session, Depends(get_db)]

@router.get("/")
def list_projects(db: DbSession):
    return project_repository.list_visible(db)

```

This first example demonstrates the boundary or mechanism. Names describe the domain so the reader can reason about intent without mentally translating generic placeholders.

**A second production detail:**

```python
def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]) -> User:
    # Verify signature, expiry, issuer, and intended audience before trusting claims.
    claims = token_service.verify_access_token(token)
    user = user_repository.get_by_subject(claims.subject)
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return user

CurrentUser = Annotated[User, Depends(get_current_user)]

```

The second example shows how the same concept participates in a larger request flow. In a real service, connect these functions to a repository and configuration appropriate to the application; do not copy a demonstration in place of persistence, validation, or policy enforcement.

**Naive / wrong approach:**

```python
# Wrong: manually construct a database session inside every route.
def list_projects():
    db = SessionLocal()
    return project_repository.list_visible(db)

```

This approach is attractive because it is shorter, but it leaves a correctness, security, or operations decision implicit. The omission becomes expensive when the endpoint is called concurrently or by a client outside your control.

**Correct approach:**

```python
# Better: dependency lifecycle closes the session on success or failure.
def list_projects(db: DbSession):
    return project_repository.list_visible(db)

```

Prefer the explicit contract and narrow responsibility. Keep validation at the boundary, policy in a reusable service or dependency, and persistence behavior behind a repository or session abstraction where that improves testability.

**Gotcha:** Dependencies are not a substitute for clear architecture. Avoid a dependency graph that recursively depends on itself, and be deliberate about whether a dependency should run once per request or per subdependency.


### 6. Use async only when the call stack is async-capable

`async def` is useful when the handler awaits non-blocking I/O. It does not automatically make blocking database drivers, CPU-heavy image processing, or synchronous network calls faster.

**Working pattern:**

```python
import httpx
from fastapi import APIRouter, HTTPException

@router.get("/catalog-sync")
async def get_catalog():
    async with httpx.AsyncClient(timeout=5.0) as client:
        response = await client.get("https://catalog.example.org/v1/items")
    response.raise_for_status()
    return response.json()

```

This first example demonstrates the boundary or mechanism. Names describe the domain so the reader can reason about intent without mentally translating generic placeholders.

**A second production detail:**

```python
# For CPU-heavy work, move computation to a worker/process rather than
# occupying the event loop while every other request waits.
from concurrent.futures import ProcessPoolExecutor

pool = ProcessPoolExecutor(max_workers=2)

def compute_recommendation_features(project_ids: list[int]) -> dict:
    return expensive_feature_calculation(project_ids)

```

The second example shows how the same concept participates in a larger request flow. In a real service, connect these functions to a repository and configuration appropriate to the application; do not copy a demonstration in place of persistence, validation, or policy enforcement.

**Naive / wrong approach:**

```python
# Wrong: blocking call stalls the event loop in an async route.
@router.get("/external")
async def external_catalog():
    return requests.get("https://catalog.example.org/items").json()

```

This approach is attractive because it is shorter, but it leaves a correctness, security, or operations decision implicit. The omission becomes expensive when the endpoint is called concurrently or by a client outside your control.

**Correct approach:**

```python
# Better: use an async client and await network I/O.
@router.get("/external")
async def external_catalog():
    async with httpx.AsyncClient(timeout=5) as client:
        response = await client.get("https://catalog.example.org/items")
        response.raise_for_status()
        return response.json()

```

Prefer the explicit contract and narrow responsibility. Keep validation at the boundary, policy in a reusable service or dependency, and persistence behavior behind a repository or session abstraction where that improves testability.

**Gotcha:** A synchronous route can be perfectly appropriate for a synchronous ORM. The goal is not to maximize the number of `async` keywords; it is to keep blocking work from starving concurrent requests.


### 7. Separate authentication from authorization

Authentication answers who is making the request. Authorization answers whether that identity may perform this action on this specific resource. Both checks must be explicit.

**Working pattern:**

```python
from typing import Annotated
from fastapi import Depends, HTTPException

@router.get("/{project_id}")
def get_project(project_id: int, user: CurrentUser, db: DbSession):
    project = project_repository.get(db, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    if not project.is_public and project.owner_id != user.id:
        # Avoid revealing private project existence to unauthorized callers.
        raise HTTPException(status_code=404, detail="Project not found")
    return project

```

This first example demonstrates the boundary or mechanism. Names describe the domain so the reader can reason about intent without mentally translating generic placeholders.

**A second production detail:**

```python
@router.delete("/{project_id}", status_code=204)
def remove_project(project_id: int, user: CurrentUser, db: DbSession):
    project = project_repository.get_owned(db, project_id, owner_id=user.id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    project_repository.delete(db, project)

```

The second example shows how the same concept participates in a larger request flow. In a real service, connect these functions to a repository and configuration appropriate to the application; do not copy a demonstration in place of persistence, validation, or policy enforcement.

**Naive / wrong approach:**

```python
# Wrong: a valid token is treated as permission to modify any project.
@router.delete("/{project_id}")
def delete_project(project_id: int, user: CurrentUser):
    project_service.delete(project_id)

```

This approach is attractive because it is shorter, but it leaves a correctness, security, or operations decision implicit. The omission becomes expensive when the endpoint is called concurrently or by a client outside your control.

**Correct approach:**

```python
# Better: scope the lookup to the caller's authority.
@router.delete("/{project_id}")
def delete_project(project_id: int, user: CurrentUser, db: DbSession):
    project_service.delete_owned(db, project_id, owner_id=user.id)

```

Prefer the explicit contract and narrow responsibility. Keep validation at the boundary, policy in a reusable service or dependency, and persistence behavior behind a repository or session abstraction where that improves testability.

**Gotcha:** Never trust an `owner_id` sent in the request body to establish ownership. Derive the actor from verified credentials and enforce resource-level permissions in every read and write path.


### 8. Return predictable errors without leaking internals

Clients need stable error codes and actionable messages; operators need detailed diagnostics. Those are different audiences, so do not expose tracebacks, SQL statements, or secrets in public responses.

**Working pattern:**

```python
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

@app.exception_handler(ProjectConflict)
async def project_conflict_handler(request: Request, exc: ProjectConflict):
    return JSONResponse(
        status_code=409,
        content={"error": {"code": "PROJECT_CONFLICT", "message": str(exc)}},
    )

```

This first example demonstrates the boundary or mechanism. Names describe the domain so the reader can reason about intent without mentally translating generic placeholders.

**A second production detail:**

```python
import logging
import uuid
from fastapi import Request

logger = logging.getLogger("studio.api")

@app.middleware("http")
async def attach_request_id(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["x-request-id"] = request_id
    return response

```

The second example shows how the same concept participates in a larger request flow. In a real service, connect these functions to a repository and configuration appropriate to the application; do not copy a demonstration in place of persistence, validation, or policy enforcement.

**Naive / wrong approach:**

```python
# Wrong: sends exception text, SQL, and deployment paths to an untrusted client.
except Exception as exc:
    raise HTTPException(status_code=500, detail=repr(exc))

```

This approach is attractive because it is shorter, but it leaves a correctness, security, or operations decision implicit. The omission becomes expensive when the endpoint is called concurrently or by a client outside your control.

**Correct approach:**

```python
# Better: log the exception privately and return a generic message.
except Exception:
    logger.exception("Unexpected project API failure")
    raise HTTPException(status_code=500, detail="Internal server error")

```

Prefer the explicit contract and narrow responsibility. Keep validation at the boundary, policy in a reusable service or dependency, and persistence behavior behind a repository or session abstraction where that improves testability.

**Gotcha:** Register handlers for known domain exceptions, but let truly unexpected errors reach a centralized handler after safe logging. Do not convert every failure into 200 or 400; that breaks retry and monitoring behavior.


### 9. Paginate and sort collection endpoints

Collection endpoints need bounded work and stable navigation. Pagination protects the database and API from accidental full-table reads and gives clients predictable response sizes.

**Working pattern:**

```python
from typing import Annotated
from fastapi import Query

@router.get("/")
def list_projects(
    page_size: Annotated[int, Query(ge=1, le=50)] = 20,
    cursor: str | None = None,
    db: DbSession = None,
):
    # Cursor encodes the last stable ordering key, not an arbitrary SQL fragment.
    return project_service.list_page(db, page_size=page_size, cursor=cursor,
                                     order_by=("created_at", "id"))

```

This first example demonstrates the boundary or mechanism. Names describe the domain so the reader can reason about intent without mentally translating generic placeholders.

**A second production detail:**

```python
# A cursor response makes continuation explicit for clients.
class ProjectPage(BaseModel):
    items: list[ProjectOut]
    next_cursor: str | None
    has_more: bool

```

The second example shows how the same concept participates in a larger request flow. In a real service, connect these functions to a repository and configuration appropriate to the application; do not copy a demonstration in place of persistence, validation, or policy enforcement.

**Naive / wrong approach:**

```python
# Wrong: unbounded offset pagination and no deterministic order.
def list_projects(offset: int = 0, limit: int = 100000):
    return db.query(Project).offset(offset).limit(limit).all()

```

This approach is attractive because it is shorter, but it leaves a correctness, security, or operations decision implicit. The omission becomes expensive when the endpoint is called concurrently or by a client outside your control.

**Correct approach:**

```python
# Better: cap page size and order by unique stable keys.
def list_projects(page_size: Annotated[int, Query(ge=1, le=50)] = 20):
    return repository.list_ordered(limit=page_size, order_by=("created_at", "id"))

```

Prefer the explicit contract and narrow responsibility. Keep validation at the boundary, policy in a reusable service or dependency, and persistence behavior behind a repository or session abstraction where that improves testability.

**Gotcha:** Offset pagination is straightforward for small admin tables; cursor pagination is usually better for frequently changing feeds. The cursor must be opaque, validated, and tied to the same filter and ordering contract.


### 10. Control transactions and database consistency

A transaction is a boundary for a set of changes that must succeed or fail together. Keep the transaction as short as possible and never hold locks while waiting on a slow external API.

**Working pattern:**

```python
from sqlalchemy.orm import Session
from app.models import Project, ProjectAudit


def publish_project(db: Session, project_id: int, actor_id: int) -> Project:
    with db.begin():
        project = db.get(Project, project_id)
        if project is None:
            raise ProjectNotFound(project_id)
        if project.owner_id != actor_id:
            raise ProjectForbidden(project_id)
        project.status = "published"
        db.add(ProjectAudit(project_id=project.id, actor_id=actor_id,
                            action="published"))
    return project

```

This first example demonstrates the boundary or mechanism. Names describe the domain so the reader can reason about intent without mentally translating generic placeholders.

**A second production detail:**

```python
# Perform external work after committing local state; use an outbox when
# delivery must be durable across process crashes.
project = publish_project(db, project_id, actor_id)
notification_outbox.enqueue_project_published(project.id)

```

The second example shows how the same concept participates in a larger request flow. In a real service, connect these functions to a repository and configuration appropriate to the application; do not copy a demonstration in place of persistence, validation, or policy enforcement.

**Naive / wrong approach:**

```python
# Wrong: call a remote service while holding the database transaction open.
with db.begin():
    project.status = "published"
    payment_provider.charge(customer_id, amount)

```

This approach is attractive because it is shorter, but it leaves a correctness, security, or operations decision implicit. The omission becomes expensive when the endpoint is called concurrently or by a client outside your control.

**Correct approach:**

```python
# Better: validate and commit local changes, then coordinate external work
# with an idempotent workflow or transactional outbox.
project = project_service.mark_pending_publication(db, project_id)
outbox_repository.add_event(db, "project.publication_requested", project.id)

```

Prefer the explicit contract and narrow responsibility. Keep validation at the boundary, policy in a reusable service or dependency, and persistence behavior behind a repository or session abstraction where that improves testability.

**Gotcha:** A transaction cannot make a third-party HTTP call atomic with your database. Use idempotency keys, an outbox, and reconciliation for workflows spanning multiple systems.


### 11. Protect APIs with rate limits and resource bounds

A route is a resource consumer. Validate body size, query complexity, concurrency, and external timeouts so one client cannot monopolize workers or create an expensive bill.

**Working pattern:**

```python
from fastapi import Request, HTTPException

MAX_BODY_BYTES = 1_000_000

@app.middleware("http")
async def enforce_body_limit(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_BODY_BYTES:
        raise HTTPException(status_code=413, detail="Request body too large")
    return await call_next(request)

```

This first example demonstrates the boundary or mechanism. Names describe the domain so the reader can reason about intent without mentally translating generic placeholders.

**A second production detail:**

```python
# Production rate limits should use a shared store such as Redis when the
# app has multiple workers or replicas; process-local counters are not global.
from fastapi import Depends, HTTPException

def require_request_budget(user: CurrentUser):
    if not rate_limiter.allow(key=f"user:{user.id}", limit=60, window_seconds=60):
        raise HTTPException(status_code=429, detail="Too many requests")

```

The second example shows how the same concept participates in a larger request flow. In a real service, connect these functions to a repository and configuration appropriate to the application; do not copy a demonstration in place of persistence, validation, or policy enforcement.

**Naive / wrong approach:**

```python
# Wrong: unbounded external call can pin a worker for a long time.
response = await client.get(partner_url)

```

This approach is attractive because it is shorter, but it leaves a correctness, security, or operations decision implicit. The omission becomes expensive when the endpoint is called concurrently or by a client outside your control.

**Correct approach:**

```python
# Better: every network dependency has explicit connect/read timeout policy.
async with httpx.AsyncClient(timeout=httpx.Timeout(5.0, connect=1.5)) as client:
    response = await client.get(partner_url)

```

Prefer the explicit contract and narrow responsibility. Keep validation at the boundary, policy in a reusable service or dependency, and persistence behavior behind a repository or session abstraction where that improves testability.

**Gotcha:** `Content-Length` is only an early rejection hint; chunked uploads and proxy behavior require limits at the reverse proxy and streaming layer too. Rate-limit by meaningful identities and endpoints, not only by IP, because NAT and distributed clients complicate IP-based rules.


### 12. Handle file uploads as untrusted input

An uploaded filename, MIME type, and file content are all user-controlled. Treat upload processing as a pipeline: enforce limits, inspect content, store under a generated key, and keep files outside executable web roots.

**Working pattern:**

```python
from typing import Annotated
from fastapi import File, HTTPException, UploadFile

ALLOWED_TYPES = {"image/jpeg", "image/png", "application/pdf"}
MAX_UPLOAD_BYTES = 8 * 1024 * 1024

@router.post("/{project_id}/assets", status_code=201)
async def upload_asset(project_id: int, file: Annotated[UploadFile, File()],
                       user: CurrentUser, db: DbSession):
    project_service.require_edit_permission(db, project_id, user.id)
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported file type")
    stored = await asset_service.store_limited(file, max_bytes=MAX_UPLOAD_BYTES)
    return {"asset_id": stored.id, "content_type": stored.detected_type}

```

This first example demonstrates the boundary or mechanism. Names describe the domain so the reader can reason about intent without mentally translating generic placeholders.

**A second production detail:**

```python
async def store_limited(file: UploadFile, max_bytes: int) -> StoredAsset:
    total = 0
    chunks: list[bytes] = []
    while chunk := await file.read(64 * 1024):
        total += len(chunk)
        if total > max_bytes:
            raise HTTPException(status_code=413, detail="Upload too large")
        chunks.append(chunk)
    content = b"".join(chunks)
    detected_type = file_type_detector.detect(content)
    if detected_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail="File content is not allowed")
    return await object_store.put_generated_key(content, detected_type)

```

The second example shows how the same concept participates in a larger request flow. In a real service, connect these functions to a repository and configuration appropriate to the application; do not copy a demonstration in place of persistence, validation, or policy enforcement.

**Naive / wrong approach:**

```python
# Wrong: user filename becomes a path and MIME header is trusted.
path = upload_dir / file.filename
path.write_bytes(await file.read())

```

This approach is attractive because it is shorter, but it leaves a correctness, security, or operations decision implicit. The omission becomes expensive when the endpoint is called concurrently or by a client outside your control.

**Correct approach:**

```python
# Better: generate storage keys and inspect bytes before making files available.
stored_asset = await asset_service.store_limited(upload, max_bytes=8 * 1024 * 1024)

```

Prefer the explicit contract and narrow responsibility. Keep validation at the boundary, policy in a reusable service or dependency, and persistence behavior behind a repository or session abstraction where that improves testability.

**Gotcha:** For large files, stream to object storage instead of accumulating every chunk in RAM. Add malware scanning and image re-encoding where the threat model requires it; authorization must be checked before accepting the upload.


### 13. Use background tasks for small follow-up work

Background tasks are suitable for lightweight work after a response, such as sending a simple notification. They are not a durable queue: process crashes, deploys, and timeouts can lose in-process tasks.

**Working pattern:**

```python
from fastapi import BackgroundTasks

@router.post("/", status_code=201, response_model=ProjectOut)
def create_project(payload: ProjectCreate, background_tasks: BackgroundTasks,
                   user: CurrentUser, db: DbSession):
    project = project_service.create(db, payload, owner_id=user.id)
    # Non-critical best-effort email can run after the response is prepared.
    background_tasks.add_task(email_service.send_project_receipt,
                              user.email, project.id)
    return project

```

This first example demonstrates the boundary or mechanism. Names describe the domain so the reader can reason about intent without mentally translating generic placeholders.

**A second production detail:**

```python
# Durable alternative: persist a job/event and let a worker claim it.
def request_thumbnail_generation(db: Session, asset_id: int) -> str:
    job = job_repository.create(db, kind="generate_thumbnail",
                                payload={"asset_id": asset_id})
    return job.id

```

The second example shows how the same concept participates in a larger request flow. In a real service, connect these functions to a repository and configuration appropriate to the application; do not copy a demonstration in place of persistence, validation, or policy enforcement.

**Naive / wrong approach:**

```python
# Wrong: long-running video conversion is performed as an in-process task.
background_tasks.add_task(convert_video, uploaded_video_path)

```

This approach is attractive because it is shorter, but it leaves a correctness, security, or operations decision implicit. The omission becomes expensive when the endpoint is called concurrently or by a client outside your control.

**Correct approach:**

```python
# Better: enqueue a durable job with retry and status tracking.
job_id = media_jobs.enqueue("convert_video", {"asset_id": asset.id})
return {"job_id": job_id, "status_url": f"/api/v1/jobs/{job_id}"}

```

Prefer the explicit contract and narrow responsibility. Keep validation at the boundary, policy in a reusable service or dependency, and persistence behavior behind a repository or session abstraction where that improves testability.

**Gotcha:** Background tasks run in the application process and are not a substitute for Celery, RQ, Dramatiq, a managed queue, or a durable workflow engine when work must survive restarts or be retried.


### 14. Test the API contract at multiple levels

A route test should verify externally visible behavior: status, response shape, validation, authentication, authorization, and persistence effects. Unit tests alone cannot catch routing or dependency wiring mistakes.

**Working pattern:**

```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_project_rejects_short_title():
    response = client.post("/api/v1/projects/", json={
        "title": "AI", "summary": "A complete project summary", "price_inr": 500
    })
    assert response.status_code == 422

```

This first example demonstrates the boundary or mechanism. Names describe the domain so the reader can reason about intent without mentally translating generic placeholders.

**A second production detail:**

```python
def test_private_project_is_not_visible_to_anonymous_user():
    response = client.get("/api/v1/projects/77")
    assert response.status_code in (401, 404)
    assert "owner_email" not in response.text

```

The second example shows how the same concept participates in a larger request flow. In a real service, connect these functions to a repository and configuration appropriate to the application; do not copy a demonstration in place of persistence, validation, or policy enforcement.

**Naive / wrong approach:**

```python
# Wrong: test only calls the helper and never exercises HTTP validation.
def test_project_service():
    assert project_service.validate_title("AI") is False

```

This approach is attractive because it is shorter, but it leaves a correctness, security, or operations decision implicit. The omission becomes expensive when the endpoint is called concurrently or by a client outside your control.

**Correct approach:**

```python
# Better: verify route-level status and response contract.
def test_invalid_create_payload_is_rejected():
    response = client.post("/api/v1/projects/", json={"title": "AI"})
    assert response.status_code == 422
    assert "detail" in response.json()

```

Prefer the explicit contract and narrow responsibility. Keep validation at the boundary, policy in a reusable service or dependency, and persistence behavior behind a repository or session abstraction where that improves testability.

**Gotcha:** Use dependency overrides to isolate infrastructure in unit tests, then add integration tests against a real test database for transaction and migration behavior. Include failure tests: expired credentials, duplicate idempotency key, unavailable dependency, and oversized upload.


### 15. Ship a complete, observable project API slice

A production slice is not one route: it is a consistent flow through schema validation, authentication, resource-level authorization, service logic, persistence, error handling, tests, and logs.

**Working pattern:**

```python
# app/routers/projects.py
@router.post("/", status_code=201, response_model=ProjectOut)
def create_project(payload: ProjectCreate, user: CurrentUser, db: DbSession):
    created = project_service.create(db, payload, owner_id=user.id)
    logger.info("project_created", extra={"project_id": created.id,
                                          "actor_id": user.id})
    return created

@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: int, user: CurrentUser, db: DbSession):
    project = project_service.get_visible(db, project_id, viewer_id=user.id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

```

This first example demonstrates the boundary or mechanism. Names describe the domain so the reader can reason about intent without mentally translating generic placeholders.

**A second production detail:**

```python
# Integration test outline: public contract plus denied access and retry behavior.
def test_project_lifecycle(authenticated_client, anonymous_client):
    created = authenticated_client.post("/api/v1/projects/", json={
        "title": "Portfolio Case Study", "summary": "A detailed project summary",
        "price_inr": 1200,
    })
    assert created.status_code == 201
    project_id = created.json()["id"]
    assert authenticated_client.get(f"/api/v1/projects/{project_id}").status_code == 200
    assert anonymous_client.get(f"/api/v1/projects/{project_id}").status_code in (401, 404)

```

The second example shows how the same concept participates in a larger request flow. In a real service, connect these functions to a repository and configuration appropriate to the application; do not copy a demonstration in place of persistence, validation, or policy enforcement.

**Naive / wrong approach:**

```python
# Wrong: a route returns ORM data directly with private fields and no policy.
@router.get("/{project_id}")
def get_project(project_id: int):
    return database.get_project(project_id)

```

This approach is attractive because it is shorter, but it leaves a correctness, security, or operations decision implicit. The omission becomes expensive when the endpoint is called concurrently or by a client outside your control.

**Correct approach:**

```python
# Better: enforce visibility in the service and serialize through a public schema.
@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: int, user: CurrentUser, db: DbSession):
    return project_service.get_visible_or_404(db, project_id, user.id)

```

Prefer the explicit contract and narrow responsibility. Keep validation at the boundary, policy in a reusable service or dependency, and persistence behavior behind a repository or session abstraction where that improves testability.

**Gotcha:** The integrated example is the target mental model for a client marketplace or creative portfolio backend: one consistent contract, observable behavior, and explicit denial paths—not a pile of unrelated endpoint snippets.

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Router + service + repository

**What it does:** Separates HTTP adaptation from business policy and persistence.

**When to use it:** Use it when the same project rules are needed by a REST endpoint, a scheduled job, and an admin command.

```python
# app/services/projects.py
from sqlalchemy.orm import Session
from app.models import Project
from app.schemas.projects import ProjectCreate


def create_project(db: Session, payload: ProjectCreate, owner_id: int) -> Project:
    project = Project(title=payload.title, summary=payload.summary,
                      price_inr=payload.price_inr, owner_id=owner_id,
                      status="draft")
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

```

Do not add layers that merely rename a one-line call. Introduce each layer when it owns a meaningful rule or allows a valuable test boundary.

### Pattern 2: Typed dependency bundle

**What it does:** Shares request-scoped resources and verified identity through FastAPI dependency injection.

**When to use it:** Use it when several routes need the same database session and current user, and tests must override either dependency.

```python
from typing import Annotated
from fastapi import Depends
from sqlalchemy.orm import Session

DbSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]

@router.get("/mine")
def list_my_projects(db: DbSession, user: CurrentUser):
    return project_repository.list_by_owner(db, owner_id=user.id)

```

Avoid putting unrelated side effects into dependencies. Their value is explicit reuse and lifecycle management, not making route signatures mysterious.

### Pattern 3: Schema-first partial update

**What it does:** Distinguishes omitted fields from explicit null values so PATCH semantics are deliberate.

**When to use it:** Use it when a profile or project editor can update only title, summary, or price without overwriting every other field.

```python
from pydantic import BaseModel, ConfigDict, Field

class ProjectPatch(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str | None = Field(default=None, min_length=3, max_length=120)
    summary: str | None = Field(default=None, min_length=10, max_length=2000)
    price_inr: int | None = Field(default=None, ge=0, le=2_000_000)


def apply_project_patch(project: Project, patch: ProjectPatch) -> Project:
    changes = patch.model_dump(exclude_unset=True)
    for field_name, field_value in changes.items():
        setattr(project, field_name, field_value)
    return project

```

If `null` is not a meaningful value for a field, reject it explicitly rather than treating null and omission as interchangeable.

### Pattern 4: Authorization-scoped repository query

**What it does:** Combines resource lookup with the actor’s allowed scope, reducing accidental insecure direct object references.

**When to use it:** Use it when users can view public projects but edit only their own drafts.

```python
def get_editable_project(db: Session, project_id: int, actor_id: int) -> Project | None:
    # Scope the query so an unrelated private record is never returned for editing.
    return db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == actor_id,
        Project.status != "deleted",
    ).one_or_none()

```

Keep permission logic understandable and test it independently. If the policy includes roles, organization membership, and ownership, centralize it rather than scattering slightly different checks.

### Pattern 5: Idempotent create endpoint

**What it does:** Makes retries safe by associating a client-supplied idempotency key with one durable result.

**When to use it:** Use it for checkout, booking, payment initiation, or any request likely to be retried after a timeout.

```python
@router.post("/bookings", status_code=201)
def create_booking(payload: BookingCreate, user: CurrentUser,
                   idempotency_key: Annotated[str, Header(min_length=16, max_length=128)],
                   db: DbSession):
    # Unique constraint on (user_id, idempotency_key) resolves concurrent duplicates.
    return booking_service.create_once(db, user_id=user.id,
                                       key=idempotency_key, payload=payload)

```

A process-local dictionary is not sufficient when the API has multiple workers or restarts. Store the key, payload hash, and result in durable storage with a uniqueness constraint.

### Pattern 6: Outbox-backed asynchronous work

**What it does:** Commits a domain change and the event to publish in the same database transaction.

**When to use it:** Use it when project publication must reliably trigger indexing, email, or thumbnail generation even if a worker crashes.

```python
def request_project_publication(db: Session, project_id: int, actor_id: int) -> None:
    with db.begin():
        project = project_repository.get_owned_for_update(db, project_id, actor_id)
        project.status = "publishing"
        db.add(OutboxEvent(topic="project.publication_requested",
                           aggregate_id=str(project.id),
                           payload={"project_id": project.id}))

```

Outbox consumers should be idempotent because delivery is generally at least once. Monitor age of the oldest unprocessed event, not only queue depth.

### Pattern 7: Contract test with dependency overrides

**What it does:** Tests the HTTP contract while replacing expensive or nondeterministic infrastructure.

**When to use it:** Use it when validating 401/403/404 behavior and response shape without contacting a real identity provider.

```python
from fastapi.testclient import TestClient
from app.main import app

app.dependency_overrides[get_current_user] = lambda: User(id=7, email="dev@example.org")
client = TestClient(app)

def test_create_project_returns_public_contract():
    response = client.post("/api/v1/projects/", json={
        "title": "Studio Portfolio", "summary": "A detailed case study description",
        "price_inr": 1500,
    })
    assert response.status_code == 201
    assert set(response.json()) >= {"id", "title", "summary", "price_inr"}

```

Always clear overrides between tests and keep a smaller set of integration tests against the real test database. A fully mocked suite can pass while migrations or transaction behavior are broken.

### Pattern 8: Request correlation and structured logs

**What it does:** Connects one request’s route, service, and dependency failures without recording sensitive payloads.

**When to use it:** Use it when a client reports a failed upload or intermittent 500 and you need to trace the request across logs.

```python
import logging
import uuid
from fastapi import Request

logger = logging.getLogger("studio.api")

@app.middleware("http")
async def request_context(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["x-request-id"] = request_id
    logger.info("http_request_complete", extra={
        "request_id": request_id,
        "method": request.method,
        "path": request.url.path,
        "status_code": response.status_code,
    })
    return response

```

Do not trust an arbitrary client request ID as globally unique without validation; never log authorization headers, raw passwords, payment details, or full uploaded document contents.

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Returning ORM entities without a response model | Internal database columns are mistaken for the public API contract. | Add a dedicated Pydantic output schema and declare it with `response_model`. |
| Trusting `owner_id` from JSON | The request body is incorrectly treated as proof of identity. | Derive actor ID from verified credentials and ignore client-supplied ownership fields. |
| Using `async def` with blocking network calls | The `async` keyword is assumed to parallelize synchronous code. | Use an async client or move blocking work to an appropriate thread/process boundary. |
| Creating a database session without closing it | Happy-path testing hides resource leaks. | Yield the session from a dependency with deterministic cleanup. |
| Leaving list limits unbounded | Developers optimize for the demo dataset only. | Constrain page size and enforce query timeouts and indexes. |
| Returning `200` for every outcome | Status codes are treated as decorative. | Use 201, 204, 400/422, 401, 403/404, 409, 413, 429, and 5xx according to semantics. |
| Catching every exception and returning its text | Debug details are confused with client-facing information. | Log the exception privately and return a stable generic 500 envelope. |
| Checking authentication but not object permission | A valid identity is mistaken for universal access. | Scope repository reads and writes to ownership, role, or organization policy. |
| Performing external I/O inside a database transaction | A local transaction is assumed to cover remote services. | Commit short local work and coordinate remote side effects with outbox or saga patterns. |
| Using in-process tasks for durable work | BackgroundTasks looks like a queue but has no durable retry guarantee. | Persist a job in a durable queue and expose job status. |
| Trusting upload filename and MIME type | Client metadata is mistaken for verified file content. | Generate storage keys, cap bytes, inspect signatures, and scan where appropriate. |
| Implementing rate limits in a process-local dictionary | One process is mistaken for the whole deployment. | Use shared storage such as Redis or gateway-level limits across replicas. |
| Using mutable defaults in Pydantic or Python models | Shared-object semantics are overlooked. | Use `Field(default_factory=list)` for mutable Pydantic defaults. |
| Forgetting deterministic ordering in pagination | The database is assumed to return rows in stable order. | Sort by a stable key and include a unique tie-breaker in the cursor. |
| Logging raw request bodies for debugging | Observability is optimized without considering data minimization. | Log request ID, route, status, duration, and safe identifiers only. |
| Relying only on mocked tests | Test isolation hides schema, migration, and transaction defects. | Add integration tests against an isolated test database and real migrations. |
| Accepting unknown fields on sensitive write schemas | Extra client keys are silently ignored or passed through. | Configure `extra="forbid"` and use explicit input schemas. |
| Running migrations automatically in every worker startup | Each replica attempts deployment-time schema changes. | Run migrations as a controlled release step before application rollout. |

**Before → after: remove mass assignment**

```python
# Before: a client could attempt to set owner_id or moderation_status.
project = Project(**payload.model_dump())
```

```python
# After: server-owned fields are assigned from trusted context.
project = Project(title=payload.title, summary=payload.summary,
                  owner_id=current_user.id, moderation_status="pending")
```

---

## Mental Models

1. **A route is a boundary, not a business layer** — parse, authorize, call the service, and return a stable contract.
2. **Every client field is a proposal** — validate it, constrain it, and never treat it as trusted identity or policy.
3. **Authentication names the actor; authorization limits the action** — a valid token does not imply access to every record.
4. **Async only helps when the wait is non-blocking** — one synchronous call can stall the event loop for everyone.
5. **Local transactions stop at the database boundary** — remote side effects need retries, idempotency, or durable orchestration.
6. **A retry is a normal network event** — design writes so a timeout does not create duplicate bookings or charges.
7. **Every unbounded input becomes an operational risk** — limit bytes, rows, time, concurrency, and downstream fan-out.
8. **Logs are an interface for operators** — correlate requests while minimizing sensitive data.

---

## Quick Reference

| Situation | FastAPI tool or decision | Notes |
|---|---|---|
| Create an application | `FastAPI()` | Set title, version, metadata, and lifespan deliberately. |
| Group routes | `APIRouter` + `include_router` | Apply prefixes and tags at the composition point. |
| Validate JSON body | Pydantic `BaseModel` | Use distinct input and output models. |
| Constrain query values | `Query(ge=1, le=100)` | Bound expensive parameters. |
| Constrain path ID | `Path(gt=0)` or typed `int` | Return predictable validation errors. |
| Inject a session | `Depends(get_db)` | Ensure cleanup happens on errors too. |
| Inject current user | `Depends(get_current_user)` | Verify token signature and claims first. |
| Return created resource | `status_code=201` | Include a stable response model. |
| Return no body | `Response(status_code=204)` | A 204 response has no content. |
| Raise expected HTTP error | `HTTPException` | Use accurate status and safe detail. |
| Register domain error handler | `@app.exception_handler(...)` | Translate domain errors consistently. |
| Use async HTTP client | `httpx.AsyncClient` | Configure timeouts and close client resources. |
| Upload a file | `UploadFile` | Limit bytes and inspect content, not just metadata. |
| Schedule best-effort work | `BackgroundTasks` | Not durable across process crashes. |
| Durable background work | Queue + persisted job | Add retries, idempotency, and status tracking. |
| Protect sensitive records | Scoped repository query | Enforce per-object authorization on every operation. |
| Paginate results | Bounded page or opaque cursor | Ensure stable sort order. |
| Handle duplicate writes | Idempotency key + unique constraint | Store payload hash and original result. |
| Correlate incidents | Request ID + structured logs | Do not log secrets or raw sensitive payloads. |
| Test endpoint behavior | `TestClient` | Verify status, schema, validation, and denied access. |
| Override dependencies in tests | `app.dependency_overrides` | Reset overrides to prevent test pollution. |
| Add CORS policy | `CORSMiddleware` | Explicit origins for credentialed requests. |
| Run production server | ASGI server such as Uvicorn | Configure workers and proxy settings for the platform. |
| Manage schema changes | Alembic migrations | Deploy migrations as a controlled release step. |
| Inspect OpenAPI | `/docs`, `/openapi.json` | Keep schema descriptions and response contracts accurate. |
| Enforce request size | Reverse proxy plus application checks | Header checks alone do not cover all streaming cases. |
| Protect against overload | Shared rate limiter and timeouts | Monitor 429s, latency, saturation, and downstream errors. |

---

## Build Challenge

### Build: The Studio Project Marketplace API

Build a FastAPI backend slice for a creative project marketplace. Users can create projects, browse public projects, edit their own drafts, upload a project cover image, and request thumbnail generation. The challenge is complete only when the success path and failure paths are demonstrated through automated tests.

#### Requirements

1. Create an `app/main.py` application and router modules under `app/routers/`; version the API under `/api/v1`.
2. Define separate Pydantic create, patch, and output schemas; reject unknown write fields and enforce title, summary, and price constraints.
3. Add a database-session dependency with deterministic cleanup and use a test database for integration tests.
4. Implement `POST /projects/` with `201 Created`, a public response model, and ownership assigned from the authenticated user.
5. Implement `GET /projects/` with bounded pagination, deterministic ordering, and public-only visibility for anonymous visitors.
6. Implement `GET /projects/{project_id}` and ensure private projects are not disclosed to unauthorized callers.
7. Implement `PATCH /projects/{project_id}` so omitted fields remain unchanged and only the owner can edit a draft.
8. Implement `DELETE /projects/{project_id}` with a bodyless `204 No Content` response and an ownership check.
9. Add a duplicate-submission test using an idempotency key or a uniqueness constraint; prove that a retry does not create two logical records.
10. Implement an upload endpoint that checks authorization, limits bytes, detects the actual file type, and stores the file under a generated key rather than the client filename.
11. Move thumbnail generation to a durable job queue or persisted job record; expose a status endpoint and make worker retries idempotent.
12. Add a stable error response for known conflicts and ensure unexpected exceptions do not leak tracebacks, SQL, or secret values.
13. Add request IDs and structured logs containing safe metadata such as route, status, and actor ID without logging tokens or raw payloads.
14. Add rate limiting and explicit timeouts for any external HTTP dependency; document where gateway-level limits complement application checks.
15. Write tests for invalid payloads, missing authentication, non-owner access, missing resources, duplicate requests, oversized uploads, and a simulated downstream timeout.
16. Document how to run the app, apply database migrations, execute tests, and configure secrets through environment variables.

#### Failure injection exercise

After the happy path works, deliberately break one dependency at a time: make the database unavailable, make the thumbnail worker retry the same job, submit a private project ID as another user, send a file just over the size limit, and simulate a client retry after the server committed but before the response arrived. For each case, record the expected status or durable state, the log evidence, and why the failure does not expose private data or create duplicate side effects.

#### Definition of done

- [ ] All 16 requirements are implemented or explicitly documented where an external infrastructure service is required.
- [ ] The OpenAPI schema shows correct request models, response models, and status codes.
- [ ] Tests prove both allowed and denied resource access; no test relies only on a happy-path assertion.
- [ ] Upload validation does not trust the supplied filename or MIME type and rejects an oversized body.
- [ ] Retrying a write cannot create duplicate logical work or repeat a non-idempotent side effect.
- [ ] Database sessions close on both success and exceptions; migrations run as a release step.
- [ ] Unexpected errors return safe client messages while retaining correlated operator diagnostics.
- [ ] Pagination is bounded and deterministic; external calls have explicit timeout behavior.
- [ ] The README includes local setup, environment variables, migration commands, and test commands.
- [ ] A reviewer can explain the difference between async I/O, background tasks, durable queues, authentication, authorization, and database transactions.
