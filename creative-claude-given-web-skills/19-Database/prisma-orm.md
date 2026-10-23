# SKILL: prisma-orm

**Layer:** 19 — Database

**Goal:** Use Prisma to model application data, generate a type-safe database client, perform safe queries and mutations, manage schema changes, and operate a production database without hiding database behavior behind an ORM.

## Why This Matters (Senior Perspective)

An ORM can make database work faster and safer, but it does not remove database engineering from the job. Prisma gives TypeScript applications a schema-driven client, generated types, relation APIs, and migration tooling. Those conveniences are valuable only when the schema represents real business rules and the generated queries match the workload. A developer can write code that compiles and still ship an N+1 query, an unsafe authorization boundary, a migration that locks a busy table, or an endpoint that returns every related record.

Senior engineers treat the Prisma schema as a versioned contract between application code and the database. They review model names, nullability, unique constraints, relation cardinality, indexes, deletion behavior, and migration SQL—not just whether `prisma generate` succeeds. They know when to use Prisma's query API, when a transaction is required, when to inspect the generated SQL, and when a carefully parameterized raw query is justified. The abstraction should improve clarity without obscuring performance or correctness.

For creative web projects, Prisma can power a portfolio CMS, project marketplace, agency website, booking workflow, or dashboard. A client site may start with a few projects and grow to thousands of content entries, users, and revisions. A reliable implementation needs validation, authentication, authorization, pagination, connection management, migration discipline, and useful errors from day one. The ORM is a tool for expressing the data model—not a replacement for understanding it.

## Core Concepts

### 1. Understand the Prisma workflow

Prisma commonly involves three connected parts:

- `schema.prisma`: models, fields, relations, datasource, and generator configuration.
- Prisma Client: generated, typed APIs for reading and changing records.
- Prisma Migrate: migration files that version schema changes.

A typical development cycle is: edit the schema, create a migration, generate the client when required by the workflow, implement the feature, and test against a real database engine. In a team, migration files should be committed with the application change so environments can reproduce the schema.

```bash
# Install Prisma tooling and the client in a Node.js project.
npm install @prisma/client
npm install --save-dev prisma

# Start a schema workflow for PostgreSQL.
npx prisma init --datasource-provider postgresql
```

The commands depend on the project's Prisma version and existing configuration. Follow the installed version's documentation when a CLI command or configuration location differs. Do not mix instructions for different major versions without checking compatibility.

### 2. Configure the datasource and keep secrets private

The datasource tells Prisma which database provider and connection configuration to use. Connection strings contain credentials and should remain server-side. Store them in environment variables or a deployment secret manager; never put them in frontend bundles, public source control, screenshots, or client-visible logs.

A conventional PostgreSQL configuration has this shape:

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

```dotenv
# Example for local development only; do not commit real credentials.
DATABASE_URL="postgresql://app_user:local_password@localhost:5432/portfolio_db?schema=public"
```

A local `.env` file should be ignored by Git. Production credentials should be supplied by the deployment environment. Use a least-privilege database role for the application rather than a database administrator account. Where supported by the hosting setup, separate migration privileges from ordinary runtime privileges.

### 3. Design models with explicit constraints

Prisma models express the structure of records. Fields have types, optionality, defaults, and attributes. Required fields should be required for a business reason; optional fields should represent real absence, not uncertainty about the model.

```prisma
model Project {
  id           String   @id @default(cuid())
  title        String   @db.VarChar(160)
  slug         String   @unique @db.VarChar(180)
  summary      String?
  status       ProjectStatus @default(DRAFT)
  publishedAt  DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

enum ProjectStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

This model defines a unique slug, explicit publication state, and timestamps. A database uniqueness constraint is more reliable than checking for a duplicate slug in application code before insertion: concurrent requests can otherwise pass the check together. Select identifier types intentionally and use a consistent strategy across related models.

### 4. Model relations deliberately

Prisma supports one-to-one, one-to-many, and many-to-many relations. The foreign key usually lives on the model on the “many” side of a one-to-many relationship. Relation fields provide a typed API, while the scalar foreign-key field represents the stored key.

```prisma
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String?
  projects  Project[]
  createdAt DateTime  @default(now())
}

model Project {
  id        String        @id @default(cuid())
  title     String
  slug      String        @unique
  ownerId   String
  owner     User          @relation(fields: [ownerId], references: [id], onDelete: Restrict)
  status    ProjectStatus @default(DRAFT)
  createdAt DateTime      @default(now())

  @@index([ownerId, createdAt])
}
```

The relation allows a project to refer to its owner. The index supports common owner-scoped listings. `onDelete: Restrict` is a business choice: it prevents deleting a user while projects still refer to them. A different product might use `Cascade` or `SetNull`, but the deletion behavior must be deliberate because it can remove or alter important data.

### 5. Reuse a single Prisma Client instance

Creating a new client for every request can create too many connections and exhaust the database connection limit. In a typical long-running Node.js server, create one shared client module and import it from route handlers and services.

```typescript
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prismaClient?: PrismaClient;
};

export const prisma =
  globalForPrisma.prismaClient ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  // Avoid creating a fresh client during each development hot reload.
  globalForPrisma.prismaClient = prisma;
}
```

This pattern is common in development environments with hot reload. Adapt it to the runtime and framework rather than copying it blindly. Serverless platforms need particular attention to connection reuse, concurrency, and provider connection limits. A pooler may be appropriate, but its mode and transaction behavior must be compatible with the Prisma version and database provider.

### 6. Use typed queries, but validate external input

Prisma Client's generated types help catch invalid field names and incompatible values at development time. They do not automatically validate untrusted JSON at runtime. A request body can still contain missing fields, excessively long strings, unexpected properties, or values that violate business rules.

```typescript
type CreateProjectInput = {
  title: string;
  slug: string;
  summary?: string;
};

function validateCreateProjectInput(value: unknown): CreateProjectInput {
  if (typeof value !== "object" || value === null) {
    throw new Error("Project input must be an object");
  }

  const input = value as Record<string, unknown>;

  if (typeof input.title !== "string" || input.title.trim().length === 0) {
    throw new Error("A project title is required");
  }

  if (input.title.length > 160) {
    throw new Error("Project title must be 160 characters or fewer");
  }

  if (typeof input.slug !== "string" ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) {
    throw new Error("Slug format is invalid");
  }

  if (input.summary !== undefined && typeof input.summary !== "string") {
    throw new Error("Summary must be a string");
  }

  return {
    title: input.title.trim(),
    slug: input.slug,
    summary: input.summary as string | undefined
  };
}
```

In a real codebase, prefer a runtime validation library or a well-tested validation layer over repeating ad hoc checks. Validate before constructing the Prisma query, and only pass allowed fields into `data`. Do not spread the entire request body into a mutation.

### 7. Read only the fields the feature needs

Use `select` when the application needs a known set of fields. It reduces payload size and makes the service's data contract explicit. Avoid returning password hashes, internal notes, tokens, or private fields because they happen to be part of the model.

```typescript
const projectCards = await prisma.project.findMany({
  where: { status: "PUBLISHED" },
  select: {
    id: true,
    title: true,
    slug: true,
    summary: true,
    publishedAt: true
  },
  orderBy: [
    { publishedAt: "desc" },
    { id: "desc" }
  ],
  take: 24
});
```

A hard upper limit is important even if the caller supplies a page size. Clamp requested values to an allowed range. Sorting by a second unique field makes ordering deterministic when publication timestamps match. Use `include` only when the related data is needed, and choose a bounded selection for nested relations.

### 8. Distinguish `select`, `include`, and relation loading

`select` chooses fields and relations explicitly. `include` requests related records alongside the base model. Both can be useful, but loading a large relation can make a small endpoint unexpectedly expensive.

```typescript
const projectDetail = await prisma.project.findUnique({
  where: { slug: "immersive-architecture" },
  select: {
    id: true,
    title: true,
    summary: true,
    owner: {
      select: {
        id: true,
        name: true
      }
    }
  }
});
```

A detail page may need the owner's display name but not their email or every project they own. Selecting only the necessary relation fields is a privacy and performance decision. Check query counts and generated SQL when relation loading becomes complex, and avoid solving every page by eagerly loading the entire object graph.

### 9. Prevent N+1 query behavior

An N+1 problem occurs when an endpoint fetches a list and then performs another query for each row. For example, loading 50 projects and separately loading each owner can create 51 queries. Relation selection or a batched query can often retrieve the needed data more efficiently.

```typescript
const projects = await prisma.project.findMany({
  where: { status: "PUBLISHED" },
  select: {
    id: true,
    title: true,
    slug: true,
    owner: {
      select: { id: true, name: true }
    }
  },
  orderBy: { createdAt: "desc" },
  take: 30
});
```

Do not assume every `include` produces one SQL join; actual behavior can vary by provider, query shape, and Prisma version. Measure the actual query pattern, inspect logs or query plans, and choose relation-loading strategies based on the workload.

### 10. Create and update records safely

Use `create`, `update`, `updateMany`, `upsert`, and other APIs according to their semantics. An `upsert` is useful when a record should be created if absent or updated if present, but its unique selector must represent the intended identity.

```typescript
const project = await prisma.project.create({
  data: {
    title: validatedInput.title,
    slug: validatedInput.slug,
    summary: validatedInput.summary,
    owner: {
      connect: { id: authenticatedUserId }
    }
  },
  select: {
    id: true,
    title: true,
    slug: true,
    status: true
  }
});
```

The owner connection uses a trusted authenticated user ID, not an owner ID supplied by the browser. The request's identity and permissions must be established by authentication middleware before this service runs. Use explicit allowlists and return only fields intended for the caller.

### 11. Put authorization in the query boundary

Authentication answers “who is making the request?” Authorization answers “what may this person do?” Do not fetch a private record by ID and assume the ID itself grants access. For user-owned content, include the owner constraint in the lookup or mutation whenever possible.

```typescript
const ownedProject = await prisma.project.findFirst({
  where: {
    id: projectId,
    ownerId: authenticatedUserId
  },
  select: {
    id: true,
    title: true,
    slug: true,
    status: true
  }
});

if (!ownedProject) {
  // Avoid revealing whether another user's private project exists.
  throw new Error("Project not found");
}
```

For an update, prefer a mutation whose `where` clause includes both the identifier and the ownership condition when supported by the model and Prisma version. If the operation reports no matching record, return a controlled not-found or forbidden response according to the application's disclosure policy. Authorization must be applied to reads, updates, deletes, exports, and background jobs.

### 12. Handle unique constraints and expected errors

Application-level prechecks improve user experience but do not guarantee uniqueness under concurrency. Let the database enforce the unique constraint, then catch the expected Prisma error and map it to a stable application response.

```typescript
import { Prisma } from "@prisma/client";

try {
  const project = await prisma.project.create({
    data: {
      title: validatedInput.title,
      slug: validatedInput.slug,
      ownerId: authenticatedUserId
    },
    select: { id: true, title: true, slug: true }
  });

  return project;
} catch (error) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new Error("A project with this slug already exists");
  }

  throw error;
}
```

Keep database-specific details in server logs. Do not send raw error objects or stack traces to users. The example uses a general application error for readability; production code should use typed domain errors so the HTTP layer can map a conflict to 409 without confusing it with an unexpected server failure.

### 13. Use transactions for multi-step invariants

A transaction is appropriate when several database changes must succeed or fail together. Prisma supports interactive transactions and sequential transaction APIs; choose the smallest scope that preserves the invariant. Long transactions can hold locks or connections and harm throughput.

```typescript
const result = await prisma.$transaction(async (transaction) => {
  const order = await transaction.order.create({
    data: {
      customerId: authenticatedUserId,
      status: "CREATED",
      totalCents
    }
  });

  const inventory = await transaction.inventory.updateMany({
    where: {
      sku,
      availableQuantity: { gte: requestedQuantity }
    },
    data: {
      availableQuantity: { decrement: requestedQuantity }
    }
  });

  if (inventory.count !== 1) {
    throw new Error("Insufficient inventory");
  }

  return order;
});
```

The example is illustrative; it assumes the schema and values are validated and that the inventory row exists. A transaction does not include an external payment provider or email service. Use idempotency keys and an outbox or saga-style workflow for external side effects. Retry behavior must account for whether an operation is safe to repeat.

### 14. Use pagination with a stable order

Offset pagination with `skip` and `take` is simple for small administrative tables. Large offsets can become slow, and inserts between requests can shift results. Cursor pagination is often better for feeds, but it requires a unique and stable cursor field.

```typescript
const pageSize = 20;

const projects = await prisma.project.findMany({
  where: { status: "PUBLISHED" },
  orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  take: pageSize,
  ...(cursorId
    ? {
        cursor: { id: cursorId },
        skip: 1
      }
    : {}),
  select: {
    id: true,
    title: true,
    slug: true,
    createdAt: true
  }
});
```

This basic pattern uses the unique ID as the cursor while ordering by creation time and ID. For complex ordering, verify cursor semantics and the generated SQL for the installed Prisma version. Validate cursors, enforce a maximum page size, and test behavior when the cursor record has been deleted.

### 15. Manage schema changes with migrations

A migration is a versioned database change. Use migrations to create repeatable changes in development, CI, staging, and production. Do not treat `db push` as a production migration history; it synchronizes schema state but does not create the same reviewed migration trail.

```bash
# Development: create a named migration and apply it locally.
npx prisma migrate dev --name add_project_publication

# Production/CI deployment: apply committed migrations.
npx prisma migrate deploy

# Inspect migration state.
npx prisma migrate status
```

Review generated SQL before deployment, especially for large tables, new non-null fields, unique indexes, and destructive changes. Production migrations should be rehearsed on representative data. A safer rollout may add a nullable field, deploy code that writes it, backfill existing rows, and only then enforce non-null constraints. Avoid deleting or renaming a field in the same release that still has code reading it.

### 16. Inspect performance beyond the TypeScript API

Type-safe query code can still be slow. Use Prisma query logging carefully, inspect generated SQL, and use the database's query-plan tools. Add indexes based on actual filters and sort patterns, not guesses. An index improves some reads but costs storage and adds write overhead.

```typescript
const prisma = new PrismaClient({
  log: [
    { emit: "event", level: "query" },
    { emit: "stdout", level: "error" }
  ]
});

prisma.$on("query", (event) => {
  // Log duration and query shape only in a controlled diagnostic setup.
  // Avoid printing parameters that may contain personal or secret data.
  console.info("Database query duration (ms):", event.duration);
});
```

Query event logging is for diagnostics, not a reason to log all SQL and parameters indefinitely in production. Protect logs, sample where appropriate, and correlate slow queries with endpoint latency. Use `EXPLAIN` or the provider's query-plan tooling to confirm whether indexes are used.

### 17. Know when raw SQL is appropriate

Prisma's query API covers many common operations. Parameterized raw SQL can be useful for provider-specific features, specialized reporting, or a query that the ORM cannot express clearly. The safety rule is non-negotiable: parameterize values and never concatenate untrusted input into SQL.

```typescript
const publishedProjects = await prisma.$queryRaw<
  Array<{ id: string; title: string }>
>`
  SELECT id, title
  FROM "Project"
  WHERE status = 'PUBLISHED'
  ORDER BY "publishedAt" DESC NULLS LAST
  LIMIT ${24}
`;
```

Use the tagged-template APIs correctly and keep identifiers separate from values. Parameter placeholders generally cannot represent table or column names. If dynamic identifiers are needed, choose them from a strict allowlist and use the database driver's safe identifier mechanism where available. Never use unsafe raw-query APIs with interpolated user input.

### 18. Plan for database outages and graceful shutdown

A database can be unavailable because of network problems, restarts, connection limits, bad credentials, or maintenance. Applications should fail predictably, surface useful telemetry, and avoid turning a brief outage into a retry storm. Use request timeouts, bounded retry policies for safe operations, health checks, and centralized error handling.

```typescript
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "ok" as const };
  } catch {
    // Do not leak connection details through a public health endpoint.
    return { status: "unavailable" as const };
  }
}
```

A readiness check can fail traffic routing when the database is unavailable, while a liveness check should not necessarily restart a process just because a downstream service is temporarily down. During shutdown, stop accepting new work, allow in-flight requests to finish within a deadline, and disconnect the client using the lifecycle hooks appropriate to the runtime.

## Relevant / Advanced Patterns

### Pattern 1: A small service boundary with an allowlist

**Use when:** several API routes need to create projects and should share validation and field-selection rules.

```typescript
type CreateProjectCommand = {
  title: string;
  slug: string;
  summary?: string;
  ownerId: string;
};

export async function createProject(command: CreateProjectCommand) {
  return prisma.project.create({
    data: {
      title: command.title,
      slug: command.slug,
      summary: command.summary,
      ownerId: command.ownerId
    },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      createdAt: true
    }
  });
}
```

The service accepts a narrow command rather than an entire request body. Validate the command before calling the service and derive `ownerId` from trusted authentication context. This boundary is especially useful when a project has internal fields that should never be writable by clients.

### Pattern 2: Safe ownership-scoped update

**Use when:** a project editor must ensure that a user can update only their own draft.

```typescript
export async function updateOwnedDraft(
  projectId: string,
  authenticatedUserId: string,
  title: string
) {
  const result = await prisma.project.updateMany({
    where: {
      id: projectId,
      ownerId: authenticatedUserId,
      status: "DRAFT"
    },
    data: {
      title,
      updatedAt: new Date()
    }
  });

  if (result.count !== 1) {
    throw new Error("Project not found or not editable");
  }
}
```

`updateMany` returns a count and avoids depending on a unique selector that might not include ownership in older schema/client combinations. It does not return the updated record; fetch the approved fields afterward if needed. Use a version field when stale writes must be detected.

### Pattern 3: Add a relation index to match a screen

**Use when:** a dashboard lists a user's newest projects.

```prisma
model Project {
  id        String   @id @default(cuid())
  ownerId   String
  title     String
  createdAt DateTime @default(now())

  @@index([ownerId, createdAt(sort: Desc)])
}
```

The compound index matches an equality filter on `ownerId` followed by descending `createdAt` ordering. Confirm syntax support for the provider and Prisma version in use, then inspect the resulting database index and query plan. Do not create every conceivable index: each index has a write and storage cost.

### Pattern 4: A staged migration for a required field

**Use when:** a production table already contains rows and a new field eventually needs to be mandatory.

1. Add the field as optional.
2. Deploy application code that writes the field for new and changed records.
3. Backfill existing records in bounded batches.
4. Verify no rows remain missing the value.
5. Change the schema to required and create the follow-up migration.
6. Deploy and monitor errors and query latency.

This expand-and-contract approach avoids assuming all old rows satisfy a new constraint immediately. For very large tables, examine the provider's locking behavior and rehearse the exact migration against production-like data.

### Pattern 5: Cursor-based public project listing

**Use when:** a portfolio listing grows beyond a small fixed set of cards.

```typescript
export async function listPublicProjects(cursorId?: string) {
  const take = 24;

  return prisma.project.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
    ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      publishedAt: true
    }
  });
}
```

The route must validate the cursor and enforce its own maximum page size. If the cursor field does not align with ordering, test the exact behavior and consider a compound cursor strategy supported by the provider and Prisma version. Keep public selection separate from the internal model.

### Pattern 6: Translate Prisma errors into domain errors

**Use when:** route handlers need consistent HTTP behavior.

```typescript
import { Prisma } from "@prisma/client";

export function translatePrismaError(error: unknown): Error {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return new Error("A record with this unique value already exists");
    }

    if (error.code === "P2025") {
      return new Error("The requested record was not found");
    }
  }

  return new Error("The database operation could not be completed");
}
```

In production, use typed domain error classes with status codes and safe public messages. Log the original error server-side with a correlation ID, but do not expose query text, credentials, or internal stack traces to clients.

## Common Mistakes

| Mistake | Why it fails | Fix |
|---|---|---|
| Treating Prisma as a replacement for database knowledge | Typed code can still produce slow or incorrect queries | Learn constraints, indexes, transactions, and query plans |
| Spreading `req.body` into `data` | Users may set fields they should not control | Validate input and map an explicit allowlist |
| Creating a client per request | Can exhaust database connections | Reuse a shared Prisma Client according to the runtime |
| Committing a real connection string | Leaks credentials | Use ignored local environment files and production secret management |
| Using `db push` as the production release plan | Does not provide a reviewed migration history | Commit migration files and deploy them with the migration workflow |
| Adding a required field immediately to a populated table | Existing rows or deployment order can break | Use a staged expand, backfill, and contract migration |
| Fetching a record by ID then checking permissions later | Can leak data and create a gap between check and use | Scope the query or mutation by authenticated ownership |
| Returning the whole model | Can expose internal fields and enlarge responses | Use explicit `select` objects or response DTOs |
| Assuming TypeScript types validate HTTP input | Types disappear at runtime | Validate unknown input before querying |
| Loading nested relations without bounds | Can create huge responses and expensive queries | Select only required relation fields and paginate child lists |
| Ignoring N+1 query patterns | One request can issue many database round trips | Batch or load relations deliberately and inspect query counts |
| Trusting a pre-insert uniqueness check | Concurrent writes can race | Use database unique constraints and handle Prisma's unique error |
| Opening transactions around network calls | Holds resources while waiting and cannot roll back external services | Keep database transactions short and coordinate external effects separately |
| Retrying every failed transaction | May duplicate side effects or increase load | Retry only known transient failures and make writes idempotent |
| Using raw SQL with string concatenation | Enables SQL injection | Use parameterized tagged templates and allowlist dynamic identifiers |
| Logging every query parameter in production | Parameters may contain secrets or personal data | Log safe metadata, durations, and correlation IDs |
| Adding indexes without measurement | Increases write cost and storage without guaranteed benefit | Tie indexes to actual filters and sorts, then inspect plans |
| Ignoring deletion behavior on relations | Can orphan records or cascade-delete valuable data | Choose `Restrict`, `Cascade`, or `SetNull` deliberately |
| Assuming local development proves production readiness | Connection limits, migration locks, and data volume differ | Test with representative data and deployment-like settings |

## Mental Models

1. **The schema is a contract.** Model names, nullability, relations, and constraints are part of the application's behavior.
2. **Generated types are not runtime validation.** Untrusted input still needs parsing and validation.
3. **A typed query can still be a bad query.** Measure round trips, result size, indexes, and latency.
4. **Authorization belongs next to the data operation.** An identifier is not permission.
5. **Migrations are deployment code.** Review and test them like application code.
6. **Transactions protect database invariants, not outside services.** Coordinate emails, payments, and webhooks separately.
7. **Abstractions should make behavior clearer.** When performance or correctness is uncertain, inspect the SQL and the database plan.

## Quick Reference

| Need | Prisma approach | Watch out for |
|---|---|---|
| Define tables and relations | `schema.prisma` models and relation fields | Nullability and deletion semantics |
| Generate typed APIs | Prisma Client generation | Generated client must match the schema |
| Change schema safely | `migrate dev` in development, `migrate deploy` for deployment | Review SQL and rehearse risky migrations |
| Read a few fields | `select` | Do not expose sensitive model fields |
| Load related data | Nested `select` or `include` | Bound child collections and avoid N+1 queries |
| Enforce unique values | `@unique` or `@@unique` | Handle duplicate-key errors |
| List a feed | Stable `orderBy`, `take`, cursor | Clamp page size and validate cursor |
| Protect user data | Ownership-scoped `where` clauses | Apply to reads, updates, deletes, and exports |
| Group multiple writes | `$transaction` | Keep transactions short |
| Use provider-specific SQL | Parameterized `$queryRaw` | Never concatenate untrusted input |
| Debug slow queries | Query logging and database query plans | Avoid logging sensitive parameters |
| Avoid connection exhaustion | Reuse Prisma Client and tune pooling | Consider serverless and pooler behavior |
| Recover from failure | Health checks, controlled errors, tested backup/restore | Avoid retry storms and untested backups |

## Build Challenge

Build a Prisma-backed content API for a creative portfolio or small agency website. The application should list public projects and allow authenticated owners to manage drafts. Complete it in one focused session, then test the important failure paths.

### Requirements

1. Configure Prisma with a local PostgreSQL database and a secret-safe `DATABASE_URL`.
2. Define `User` and `Project` models with explicit relation behavior, a unique slug, publication status, timestamps, and a version field for stale-write detection.
3. Add an index for listing a user's projects by creation time and an index or query-supporting design for public published listings.
4. Create and commit a migration for the initial schema.
5. Generate Prisma Client and verify the generated client corresponds to the committed schema.
6. Implement `GET /projects` with public-only filtering, an explicit field selection, deterministic ordering, and a bounded page size.
7. Implement a project detail endpoint that does not reveal private drafts to unauthorized users.
8. Implement create and update operations using validated input and explicit field allowlists.
9. Ensure project updates are scoped to the authenticated owner and expected state. Detect stale updates with a version or equivalent compare-and-set rule.
10. Map unique constraint failures to a conflict response and unexpected database failures to a generic server response.
11. Add tests for invalid input, duplicate slugs, unauthorized reads and writes, empty listings, pagination limits, and database unavailability.
12. Document how to apply migrations in staging/production and how to roll out a required field safely.
13. Inspect at least one representative query plan and explain why each important index exists.

### Expected output

- A checked-in `schema.prisma` and migration directory.
- A reusable Prisma Client module.
- A validation and service layer with authorization-aware queries.
- API routes with bounded responses and centralized error mapping.
- Tests for normal behavior and failure cases.
- A short README covering environment setup, migration commands, and database recovery assumptions.

### Success criteria

- No real database credentials are committed or sent to the browser.
- Incoming JSON is runtime-validated and only approved fields reach Prisma mutations.
- Private project operations are scoped to the authenticated owner.
- Public endpoints return only approved fields and a bounded number of records.
- Database constraints—not only application prechecks—enforce unique slugs.
- A single Prisma Client is reused according to the runtime's connection model.
- Migrations are committed, reviewed, and tested in a deployment-like environment.
- Errors are mapped to safe responses without exposing raw database internals.
- The implementation explains how relation loading, indexing, and transactions affect performance and correctness.


### 19. Handle nullable values and database defaults carefully

A nullable field and a field with a default mean different things. `String?` means a stored value may be `NULL`; `@default(...)` defines what the database or Prisma supplies when the caller omits the field. A default does not mean the value can never be null if the field is also nullable. Decide whether “unknown,” “not provided,” and “intentionally empty” are distinct states in the product.

```prisma
model Profile {
  id          String   @id @default(cuid())
  displayName String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Be cautious when changing an optional field to required. First determine how existing records should be populated, backfill them, and only then enforce the constraint. A placeholder such as `"Unknown"` can be misleading if the product treats it as a real name. Prefer a documented migration rule based on the domain.

### 20. Treat deletion and soft deletion as product decisions

Hard deletion physically removes a row and can trigger foreign-key actions. Soft deletion retains a record with a marker such as `deletedAt`, allowing recovery or audit history but requiring every relevant query to exclude deleted records.

```prisma
model Project {
  id        String    @id @default(cuid())
  title     String
  slug      String    @unique
  deletedAt DateTime?
  createdAt DateTime  @default(now())
}
```

```typescript
const activeProjects = await prisma.project.findMany({
  where: { deletedAt: null },
  select: { id: true, title: true, slug: true },
  orderBy: { createdAt: "desc" },
  take: 30
});
```

Soft deletion is not automatic authorization. Every read, update, search, report, and background task must follow the deletion policy. Unique slugs introduce another decision: should a deleted project's slug remain reserved, or should another project be allowed to reuse it? The answer affects index design and restoration behavior.

### 21. Test against the real database provider

Mocked Prisma calls can test application branching, but they do not prove that a migration works, a constraint is enforced, a relation behaves as expected, or a provider-specific query is valid. Include integration tests against the same database engine and a schema created from migrations.

A useful test strategy has three levels:

- **Unit tests:** input validation, authorization decisions, error translation, and pure business rules.
- **Integration tests:** Prisma queries, unique constraints, relations, transactions, and migration compatibility.
- **End-to-end tests:** an authenticated user creates a draft, another user cannot read it, the owner publishes it, and the public listing then exposes only approved fields.

Use isolated test data and clean it up predictably. Do not point automated tests at production. If tests run concurrently, use unique fixture values and avoid assumptions about global record counts.

### 22. Design observability without leaking data

Useful database observability includes endpoint latency, query duration, error rate, connection saturation, transaction failures, migration status, and slow-query samples. Logs should have a request or trace identifier so a slow endpoint can be correlated with database activity. Avoid logging secrets, full connection strings, authentication tokens, or raw personal data.

A useful incident record says which operation failed, how long it took, which service handled it, and which correlation ID links related events. It does not need to include every parameter sent to the database. Keep diagnostic logging access-controlled and define retention limits. During an incident, increase diagnostic detail deliberately and turn it back down afterward.

## Additional Production Review Checklist

Before merging a Prisma-backed feature, review these questions:

- **Data model:** Are identifiers, nullability, uniqueness, and relation cardinality intentional?
- **Access pattern:** Does the query return only the fields and rows required by the screen?
- **Authorization:** Is ownership or role scope applied to the actual database operation?
- **Input:** Are request values validated at runtime and mapped through an allowlist?
- **Concurrency:** What happens when two requests edit the same row at the same time?
- **Transactions:** Which invariants must be atomic, and can the transaction remain short?
- **Indexes:** Does each important filter and sort have a measured indexing strategy?
- **Migration:** Has the SQL been reviewed and tested with representative data?
- **Operations:** Are connection limits, timeouts, logs, backups, and recovery procedures understood?
- **Failure behavior:** Do expected conflicts produce clear responses while unexpected errors remain private?

A feature is not done merely because its happy-path test passes. The review should also explain the likely failure modes and how the implementation contains them.


### 23. Separate application and migration responsibilities

A runtime application often needs to read and write records but should not necessarily have permission to create tables or alter constraints. A migration process needs broader permissions because it changes database structure. Separating these responsibilities reduces the damage a compromised runtime credential can cause.

In a small project, the distinction may be implemented through separate database roles and deployment secrets. The application role receives only the data permissions it needs. The migration job receives schema-changing permissions and runs during the release process. Make sure the deployment pipeline uses the intended credentials; a carefully designed role model is ineffective if both secrets are the same administrator account.

### 24. Be explicit about enum and status transitions

A Prisma enum constrains a field to a set of allowed values, but it does not by itself express every allowed transition. For example, a project may move from `DRAFT` to `PUBLISHED`, then to `ARCHIVED`, while a published project may require a review before returning to draft. Encode those rules in a domain service and test them separately from the database type.

```typescript
type ProjectStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export function canTransitionProject(
  current: ProjectStatus,
  next: ProjectStatus
): boolean {
  const transitions: Record<ProjectStatus, ProjectStatus[]> = {
    DRAFT: ["PUBLISHED", "ARCHIVED"],
    PUBLISHED: ["ARCHIVED"],
    ARCHIVED: ["DRAFT"]
  };

  return transitions[current].includes(next);
}
```

Before applying a status update, read or atomically constrain the current status so concurrent requests cannot bypass the transition rule. The exact approach depends on whether stale-state conflicts are acceptable and whether the state transition also updates related records.


### 25. Keep generated artifacts aligned

After changing a Prisma schema, regenerate the client using the workflow required by the installed version and verify that the application build uses that generated artifact. Stale generated types can create confusing editor errors or cause CI to fail even when a developer's local machine appears healthy. CI should install dependencies reproducibly, apply or validate migrations against a disposable database, generate the client, and run tests. Do not rely on an untracked local database state or a developer's cached generated files as proof that a clean deployment will work.
