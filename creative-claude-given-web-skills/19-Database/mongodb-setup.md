# SKILL: mongodb-setup

**Layer:** 19 — Database

**Goal:** Design, configure, query, secure, and operate MongoDB for a real application without treating a document database as an excuse to skip data modeling or operational discipline.

## Why This Matters (Senior Perspective)

MongoDB is useful when application data naturally forms documents: projects with nested configuration, products with flexible attributes, activity records, or profiles whose optional fields vary by user type. That flexibility speeds up product development, but it does not remove the need to decide what belongs together, what must remain consistent, and how data will be queried. A schema-less collection is not a plan. If a team stores every new requirement as another arbitrary field, production queries become inconsistent, documents grow without control, and changes become difficult to validate.

Senior engineers choose MongoDB based on access patterns and consistency requirements—not because JSON-shaped data looks convenient. They consider document boundaries, indexes, write contention, transaction needs, growth limits, and the consequences of duplicating data. Embedding can make reads fast, but duplicated values can become stale. References reduce duplication, but can turn one screen into many round trips. The right model supports important reads and writes while preserving business invariants.

For creative web work, MongoDB might store portfolio projects, content blocks, gallery metadata, user preferences, or CMS entries. Those features still need safe authentication, validation, pagination, error handling, backups, and a way to evolve the document shape. A polished portfolio that works in a demo but leaks credentials, exposes every record, or fails when a collection grows is not production-ready.

## Core Concepts

### 1. Documents, collections, and databases

MongoDB stores BSON documents. BSON is a binary representation with types such as dates, object identifiers, arrays, and numeric types. A document is similar to a JSON object, a collection groups related documents, and a database contains collections.

```javascript
// Keep fields that describe one portfolio project together.
const portfolioProject = {
  title: "Interactive Product Studio",
  slug: "interactive-product-studio",
  status: "published",
  technologies: ["Three.js", "TypeScript", "WebGL"],
  publishedAt: new Date("2026-09-12T10:00:00.000Z")
};
```

Documents in one collection can have different fields, but application validation should decide which differences are valid. A collection is a group of records with a shared purpose, not a bucket for unrelated objects.

### 2. Choose MongoDB based on access patterns

MongoDB fits when related fields are commonly read and written together, document structure has meaningful variation, and queries map well to document operations. It may be a poor fit when the core workload depends on complex relational joins, strict relational constraints, or analytics better represented as relational queries.

Write down important operations before modeling:

- Load one project by slug.
- List published projects newest first.
- Filter projects by technology.
- Update draft content.
- Find all projects owned by one author.
- Prevent unauthorized users from changing another author's project.

These operations shape document boundaries and indexes. A technology list shown on every project card may belong in the project document. A separate entity with independent ownership, lifecycle, and many-to-many relationships may need its own collection.

### 3. Embedding versus referencing

Embedding places related data inside a document. Referencing stores an identifier that points to another document. Neither approach is universally superior. Embed data when it is bounded, usually read with the parent, and benefits from being retrieved atomically. Reference data when it has an independent lifecycle, is shared by many parents, can grow without a clear bound, or is updated independently.

```javascript
// Bounded gallery images are often read with their parent project.
const projectDocument = {
  title: "Immersive Architecture Portfolio",
  slug: "immersive-architecture-portfolio",
  gallery: [
    { src: "/media/architecture-hero.webp", alt: "Exterior hero render", order: 1 },
    { src: "/media/architecture-detail.webp", alt: "Facade detail", order: 2 }
  ]
};

// A user has an independent profile lifecycle.
const projectWithOwnerReference = {
  title: "Immersive Architecture Portfolio",
  ownerId: new ObjectId("66a100000000000000000001")
};
```

Do not embed unlimited activity history, an ever-growing comment list, or every event associated with a user. MongoDB documents have a 16 MiB size limit. Large or unbounded child collections should usually be separate documents with an indexed parent reference.

### 4. Install the driver and manage configuration

Use a supported Node.js runtime and the official MongoDB Node.js driver. Keep credentials outside source control. Use environment variables locally and a hosting platform's secret manager in production.

```bash
npm install mongodb dotenv
```

```dotenv
# Keep this file out of version control.
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DATABASE=portfolio_app
```

Add `.env` to `.gitignore`. Never commit real credentials or put a database URI into browser-side JavaScript. Browser code is visible to users; privileged database credentials belong only in trusted server code.

### 5. Reuse one database connection

Creating a new `MongoClient` for every request wastes sockets and adds connection overhead. Create a client once per application process and reuse its pool. In serverless deployments, follow platform guidance and do not assume every invocation shares a warm process.

```javascript
// src/database/mongo.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DATABASE;
if (!uri || !databaseName) {
  throw new Error("MONGODB_URI and MONGODB_DATABASE must be configured");
}

const client = new MongoClient(uri, {
  maxPoolSize: 20,
  serverSelectionTimeoutMS: 5000
});
let connectionPromise;

export async function getDatabase() {
  if (!connectionPromise) {
    connectionPromise = client.connect().catch((error) => {
      // Let a later request retry after an initial connection failure.
      connectionPromise = undefined;
      throw error;
    });
  }
  await connectionPromise;
  return client.db(databaseName);
}

export async function closeDatabaseConnection() {
  await client.close();
  connectionPromise = undefined;
}
```

Close the client during controlled shutdown, not after each request. Select pool limits with expected concurrency and deployment topology in mind.

### 6. Validate ObjectIds

MongoDB commonly uses `_id` values of type `ObjectId`. A URL parameter arrives as a string, so validate and convert it before querying. A string that resembles an ObjectId is not automatically equal to an actual ObjectId.

```javascript
import { ObjectId } from "mongodb";

export function parseObjectId(value) {
  if (typeof value !== "string" || !ObjectId.isValid(value)) return null;
  return new ObjectId(value);
}
```

An ID is not proof of authorization. After parsing it, verify that the current user may access the target record.

### 7. Query with filters, projections, and limits

A filter identifies matching documents, a projection restricts returned fields, and a limit caps result count. These reduce memory use, network transfer, and accidental exposure of private fields.

```javascript
const database = await getDatabase();
const projects = database.collection("projects");
const publishedProjects = await projects
  .find({ status: "published" }, {
    projection: { title: 1, slug: 1, technologies: 1, publishedAt: 1 }
  })
  .sort({ publishedAt: -1, _id: -1 })
  .limit(24)
  .toArray();
```

Do not use an empty filter plus `toArray()` on a potentially large collection in a public request handler. Prefer deliberate limits, pagination, and projections. Avoid returning internal fields simply because they exist in the document.

### 8. Validate document shapes

Flexible schema does not mean arbitrary input should be accepted. Validate input at the API boundary, then use MongoDB schema validation as a second line of defense where suitable.

```javascript
const projectValidation = {
  $jsonSchema: {
    bsonType: "object",
    required: ["title", "slug", "status"],
    properties: {
      title: { bsonType: "string", minLength: 1, maxLength: 160 },
      slug: { bsonType: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
      status: { enum: ["draft", "published", "archived"] },
      technologies: {
        bsonType: "array",
        items: { bsonType: "string" },
        maxItems: 20
      }
    }
  }
};

// Assumes the collection exists. Audit existing data before enforcing rules.
await database.command({
  collMod: "projects",
  validator: projectValidation,
  validationLevel: "strict",
  validationAction: "error"
});
```

For a new collection, supply the validator during collection creation. Test validators against existing documents before enforcing strict rules; a validator can reject updates to legacy records that do not satisfy the new shape.

### 9. Index actual query patterns

Indexes help MongoDB find matching documents without scanning every document, but they consume storage and add work to writes. Create indexes from observed query patterns and confirm their effect with `explain("executionStats")`.

```javascript
const projects = database.collection("projects");
await projects.createIndex({ slug: 1 }, { unique: true });
await projects.createIndex({ status: 1, publishedAt: -1, _id: -1 });
await projects.createIndex({ technologies: 1 });
```

MongoDB automatically indexes `_id`. A unique index is a data-integrity rule as well as a performance tool. Resolve existing duplicates before adding one. Compound index field order matters: design it around equality filters, sort order, and range conditions.

### 10. Make updates explicit and safe

Use `$set`, `$unset`, `$inc`, and `$addToSet` instead of replacing a whole document unintentionally. `replaceOne()` replaces document content other than `_id`; it is not a partial update. Include ownership or authorization constraints in the filter and check the result.

```javascript
const result = await projects.updateOne(
  { _id: projectId, ownerId: authenticatedUserId, status: "draft" },
  { $set: { title: validatedTitle, updatedAt: new Date() } }
);
if (result.matchedCount === 0) {
  // Avoid revealing whether another user's private record exists.
  throw new Error("Project not found or not editable");
}
```

A filter that includes owner and expected state prevents unauthorized changes and can guard against stale updates. For high-contention writes, use a version field or compare-and-set condition.

### 11. Understand atomicity and transactions

A single-document write is atomic. If an operation must change several documents as one all-or-nothing unit, a multi-document transaction may be appropriate—but transactions add coordination and operational cost.

```javascript
const session = client.startSession();
try {
  await session.withTransaction(async () => {
    await database.collection("orders").insertOne({
      customerId, totalCents, status: "created", createdAt: new Date()
    }, { session });

    const inventoryUpdate = await database.collection("inventory").updateOne(
      { sku, availableQuantity: { $gte: requestedQuantity } },
      { $inc: { availableQuantity: -requestedQuantity } },
      { session }
    );
    if (inventoryUpdate.modifiedCount !== 1) throw new Error("Insufficient inventory");
  });
} finally {
  await session.endSession();
}
```

This illustrates transaction shape, not a complete commerce system. Add input validation, idempotency, payment coordination, and error mapping before production use. An external payment API does not participate in a MongoDB transaction; external side effects need their own reliable coordination strategy.

### 12. Paginate without loading everything

Offset pagination using `skip()` is easy, but large offsets can become expensive and results can shift as records change. For a feed sorted by a stable indexed key, cursor pagination is often better.

```javascript
const pageSize = 20;
const filter = { status: "published" };
if (cursorPublishedAt && cursorId) {
  filter.$or = [
    { publishedAt: { $lt: new Date(cursorPublishedAt) } },
    { publishedAt: new Date(cursorPublishedAt), _id: { $lt: new ObjectId(cursorId) } }
  ];
}
const page = await database.collection("projects")
  .find(filter, { projection: { title: 1, slug: 1, publishedAt: 1 } })
  .sort({ publishedAt: -1, _id: -1 })
  .limit(pageSize + 1)
  .toArray();
const hasNextPage = page.length > pageSize;
const items = hasNextPage ? page.slice(0, pageSize) : page;
```

Return a cursor based on the last returned record. `_id` makes ordering deterministic when timestamps match. Validate cursor values and ensure sort keys and filters are backed by a suitable index.

### 13. Use aggregation pipelines

Aggregation pipelines filter, group, project, sort, and join related collections using `$lookup`. Put selective `$match` stages early when this preserves intended semantics, and inspect performance on representative data.

```javascript
const technologySummary = await database.collection("projects").aggregate([
  { $match: { status: "published" } },
  { $unwind: "$technologies" },
  { $group: { _id: "$technologies", projectCount: { $sum: 1 } } },
  { $sort: { projectCount: -1, _id: 1 } },
  { $limit: 10 },
  { $project: { _id: 0, technology: "$_id", projectCount: 1 } }
]).toArray();
```

Do not run expensive scans on every page request. Precompute or cache expensive summaries when freshness requirements allow it. Consider workload isolation so analytics does not interfere with latency-sensitive traffic.

### 14. Handle errors and timeouts

Translate database errors into stable application responses. Do not send stack traces, connection strings, server details, or raw database error objects to clients. Log enough context to diagnose failures without logging secrets or unnecessary personal data.

```javascript
export async function listPublishedProjects(request, response, next) {
  try {
    const database = await getDatabase();
    const projects = await database.collection("projects")
      .find({ status: "published" }, {
        projection: { title: 1, slug: 1, publishedAt: 1 }
      })
      .sort({ publishedAt: -1, _id: -1 })
      .limit(24)
      .toArray();
    response.json({ items: projects });
  } catch (error) {
    // Keep technical details in server logs; pass a controlled error onward.
    next(error);
  }
}
```

A centralized error handler should map validation failures to client errors, authentication failures to 401/403, missing resources to 404, and unexpected database failures to generic 500 responses. Make timeouts visible in metrics and logs. Retry only operations safe to repeat, and use idempotency controls for important writes.

## Relevant / Advanced Patterns

### Pattern 1: Environment-based configuration

**Use when:** local development, staging, and production need different endpoints without changing application code.

```javascript
export function readDatabaseConfig(environment = process.env) {
  const uri = environment.MONGODB_URI;
  const databaseName = environment.MONGODB_DATABASE;
  if (!uri || !databaseName) throw new Error("MongoDB connection settings are incomplete");
  return {
    uri,
    databaseName,
    maxPoolSize: Number(environment.MONGODB_MAX_POOL_SIZE || 20)
  };
}
```

Validate numeric settings too; a string such as `"many"` should not silently become an invalid pool size. Never print the full URI in logs.

### Pattern 2: Create-or-update with upsert

**Use when:** a preference document should exist after a settings-save operation, even if it has never been created before.

```javascript
await database.collection("userPreferences").updateOne(
  { userId: authenticatedUserId },
  {
    $set: {
      theme: validatedTheme,
      reducedMotion: validatedReducedMotion,
      updatedAt: new Date()
    },
    $setOnInsert: { createdAt: new Date() }
  },
  { upsert: true }
);
```

Add a unique index on `userId` if each user must have exactly one preferences document. Without that constraint, concurrent first writes can create duplicates. Validate values before the write; upsert does not replace validation or authorization.

### Pattern 3: Enforce uniqueness with an index

**Use when:** a slug, normalized email key, or external identifier must not be duplicated.

```javascript
await database.collection("projects").createIndex(
  { slug: 1 }, { unique: true, name: "unique_project_slug" }
);
```

Catch duplicate-key errors and translate them into a conflict response. A preflight query is not enough because two concurrent requests can both pass the check. The unique index is the final arbiter.

### Pattern 4: Optimistic concurrency

**Use when:** a collaborative editor may save the same record from multiple tabs.

```javascript
const result = await database.collection("projects").updateOne(
  { _id: projectId, ownerId: authenticatedUserId, version: expectedVersion },
  {
    $set: { title: validatedTitle, content: validatedContent, updatedAt: new Date() },
    $inc: { version: 1 }
  }
);
if (result.modifiedCount !== 1) throw new Error("Project changed or is no longer editable");
```

Initialize `version` on creation. If another update changed it, the filter no longer matches. Return a conflict response and let the user reload or reconcile changes.

### Pattern 5: Authorized repository boundary

**Use when:** several route handlers need the same ownership rule.

```javascript
export async function findOwnedProject(projectId, authenticatedUserId) {
  const database = await getDatabase();
  return database.collection("projects").findOne({
    _id: projectId,
    ownerId: authenticatedUserId
  });
}
```

Apply authorization to reads as well as writes. Avoid returning a private document first and checking ownership later. Keep repository methods narrow: `findOwnedProject`, `listPublishedProjects`, or `updateDraftProject`.

### Pattern 6: Bounded public list endpoint

**Use when:** a portfolio or client marketing site lists public projects.

```javascript
export async function getPublicProjectCards() {
  const database = await getDatabase();
  return database.collection("projects")
    .find({ status: "published" }, {
      projection: { title: 1, slug: 1, summary: 1, coverImage: 1, publishedAt: 1 }
    })
    .sort({ publishedAt: -1, _id: -1 })
    .limit(30)
    .toArray();
}
```

Expose only public fields. If results are cached, define invalidation after publish/unpublish actions and set a freshness policy. Cache keys must account for filters and user-specific visibility.

## Common Mistakes

| Mistake | Why it fails | Fix |
|---|---|---|
| Choosing MongoDB only because data is JSON-shaped | Workload may need relational constraints or joins | Compare real query patterns and consistency requirements first |
| Treating flexible documents as unvalidated input | Code paths can write incompatible field types and values | Validate at the API boundary and consider collection validation |
| Embedding unbounded arrays | Documents grow and can hit the 16 MiB limit | Store growing children separately with an indexed parent reference |
| Creating a client for every request | Adds connection overhead and can exhaust resources | Reuse a `MongoClient` and its pool per process |
| Putting the database URI in frontend code | Users can inspect the bundle and steal credentials | Keep database access server-side and secrets in environment configuration |
| Querying by `_id` without checking ownership | IDs can become an authorization bypass | Include owner/access-control conditions in the filter |
| Returning every field by default | Private data can leak and payloads grow | Use projections and explicit public response objects |
| Calling `find({}).toArray()` on a growing collection | Memory and latency grow without a bound | Filter, project, limit, and paginate |
| Assuming a string ID equals an `ObjectId` | BSON types differ | Validate and convert IDs at the boundary |
| Checking uniqueness without an index | Concurrent requests can both pass the check | Enforce a unique index and handle duplicate-key errors |
| Using `replaceOne()` for a small edit | Unmentioned fields can be removed | Use `$set` or another targeted update operator |
| Adding indexes without measuring | Indexes increase write cost and storage | Inspect query plans and index for real access patterns |
| Starting transactions for every write | Adds overhead when one document is enough | Use transactions for cross-document invariants only |
| Retrying every failure | May duplicate non-idempotent writes or hide persistent faults | Classify errors and retry only safe operations |
| Logging raw database errors to users | Exposes implementation details and sensitive data | Log safe diagnostics server-side; return controlled messages |
| Enabling strict validation without checking old data | Existing records may fail updates | Audit legacy documents and test validator rollout |
| Trusting untested backups | A backup file does not prove recovery will work | Test restoration and document recovery objectives |
| Using large `skip()` values for endless feeds | Work grows and pages can shift | Use cursor pagination with stable indexed keys |
| Assuming transactions include external APIs | External services do not join MongoDB transactions | Use an outbox, saga, or idempotent workflow |

## Mental Models

1. **Model the query before the document.** Shape data to make important reads and writes straightforward.
2. **Embed what belongs together; reference what grows independently.** Boundaries reflect lifecycle and access patterns.
3. **Flexible schema still needs rules.** Flexibility is not a substitute for validation.
4. **An index is a trade-off, not free speed.** It can improve reads while making writes and storage more expensive.
5. **An ID identifies a record; it does not grant permission.** Authorization belongs in every relevant operation.
6. **One document is an atomic unit.** Cross-document invariants need an explicit transaction or workflow.
7. **A successful demo is not operational readiness.** Connection reuse, observability, backups, restore tests, and safe failure paths are part of the feature.

## Quick Reference

| Need | Recommended approach | Watch out for |
|---|---|---|
| Store related bounded fields | Embed in one document | Keep arrays and nested content bounded |
| Store independently changing entities | Reference by ID | Avoid excessive round trips and missing indexes |
| Connect from Node.js | Reuse one `MongoClient` per process | Tune pool size for deployment |
| Look up by slug | Unique index on `slug` | Resolve duplicates before index creation |
| List public records | Filter + projection + sort + limit | Do not return internal fields |
| Handle a large feed | Cursor pagination with stable keys | Validate cursor input |
| Enforce document shape | API validation plus collection validator | Plan rollout for legacy documents |
| Update a few fields | `$set`, `$inc`, `$addToSet` | Include authorization and expected state |
| Change several documents atomically | Transaction when required | External APIs do not participate |
| Prevent duplicate creation | Unique index and duplicate-key handling | A prior read is insufficient |
| Diagnose slow queries | `explain("executionStats")` and metrics | Avoid indexes without evidence |
| Protect credentials | Server-only secret configuration | Never expose URI to browser code |
| Recover from data loss | Automated backups and tested restores | Define RPO/RTO and verify recovery |
| Handle outages | Timeouts, safe error mapping, bounded retries | Never blindly retry non-idempotent writes |

## Build Challenge

Build a MongoDB-backed content API for a creative portfolio. It should support public project listings and private draft editing. Complete the work in one focused session and test with representative data.

### Requirements

1. Configure the official MongoDB Node.js driver with environment-based settings. Keep secrets out of source control and browser code.
2. Create a reusable connection module that reuses one `MongoClient` and exposes a database accessor.
3. Define a project document with `title`, `slug`, `summary`, `status`, `technologies`, `ownerId`, `coverImage`, `publishedAt`, `createdAt`, `updatedAt`, and `version`.
4. Validate required fields, string lengths, allowed status values, technology arrays, and identifiers.
5. Create a unique index for `slug` and an index supporting published projects sorted newest first.
6. Implement `GET /projects` to return only published projects, with projection, deterministic sort, and a hard maximum page size.
7. Implement `GET /projects/:id` so private drafts are not exposed to unauthorized users.
8. Implement `PATCH /projects/:id` so only the owner can update a draft. Use targeted update operators and optimistic concurrency or an explicit stale-write strategy.
9. Return controlled HTTP errors for invalid IDs, unauthorized access, duplicate slugs, validation failures, and unexpected database errors.
10. Add tests for malformed IDs, unauthorized access, duplicate slugs, empty results, pagination bounds, and database unavailability.
11. Document backup and restore. Perform a restore test in a non-production environment rather than assuming a backup is valid.
12. Explain one embed-versus-reference choice and identify the query or consistency requirement behind it.

### Expected output

- A reusable database connection module.
- A project repository or service layer with bounded queries.
- An API router and centralized error handling.
- A setup document listing environment variables and local run steps.
- Tests covering expected behavior and important failure paths.
- A design note describing indexes, document boundaries, authorization, and recovery.

### Success criteria

- No database credentials are shipped to the browser or committed to version control.
- Every public listing is bounded and returns only explicitly approved fields.
- Every private read or write checks the authenticated user's authorization.
- MongoDB enforces unique slugs; uniqueness is not just a preliminary query.
- The connection is reused rather than created for every request.
- Pagination remains deterministic when projects share a publication timestamp.
- Invalid input and database failures produce controlled responses without stack traces.
- The design explains where single-document atomicity is enough and where a transaction or workflow is required.
- A restore test demonstrates that the recovery procedure works.

## Production Readiness Notes

### 15. Separate application validation from database validation

These two layers solve different problems. API validation can tell a user that a title is too long or that a status value is unsupported. Collection validation protects the stored collection even when a script, scheduled job, admin tool, or another service writes to it. Neither layer replaces authorization, and neither proves that a value is true. A string can have the right shape but still be an invalid business value.

For example, a request validator should reject a client-provided `ownerId` if ownership is assigned from the authenticated session. Otherwise, a user may submit another person's identifier and attempt to create a record under that identity. The server should derive trusted ownership fields rather than accepting them as ordinary form input.

A safe write pipeline looks like this:

1. Authenticate the caller.
2. Validate the request's shape and allowed values.
3. Derive trusted fields such as owner identity from server-side authentication state.
4. Apply authorization and expected-state constraints in the query filter.
5. Perform the write using a targeted update or insert.
6. Translate database outcomes into a stable API response.
7. Emit a structured, privacy-conscious log event for important failures.

This order reduces the risk that validation is mistaken for permission. Validation answers “is this input well formed?” Authorization answers “may this caller do this?” They are separate questions.

### 16. Plan schema evolution

Applications evolve. A field that begins as `coverImage` may later need a responsive image object with width, height, alternative text, and a CDN identifier. A migration plan should define how old documents are handled while application versions roll forward.

A low-risk evolution often follows an expand-and-contract sequence:

1. Add code that can read both the old and new representation.
2. Deploy code that writes the new representation while remaining compatible with existing records.
3. Backfill old documents in bounded batches and record progress.
4. Verify counts, required fields, and representative application behavior.
5. Tighten validators and remove compatibility code only after the old representation is no longer needed.

Avoid rewriting a very large collection in one unbounded operation during peak traffic. Batch migrations, make them resumable, measure their effect, and define how to stop safely if errors increase. A migration should be observable and repeatable where possible. If it is not naturally idempotent, record enough progress to avoid applying destructive changes twice.

### 17. Make writes idempotent when retries are possible

Network failures create ambiguity. A client may send a request, the database may commit it, and the response may be lost. The client sees a timeout but cannot know whether the write succeeded. Blindly retrying a create operation can create duplicates or charge a downstream service twice.

For important operations, accept an idempotency key generated for one logical action and persist its result under a unique constraint. Repeated requests with the same key should return the same outcome rather than execute the action again. The exact design depends on the business operation, but the invariant is simple: a repeated delivery of the same intent must not accidentally produce repeated effects.

```javascript
// The unique index on idempotencyKey is part of the correctness design.
await database.collection("processedRequests").createIndex(
  { idempotencyKey: 1 },
  { unique: true }
);

// Store a request result in a way that lets the service recognize retries.
const requestRecord = {
  idempotencyKey: validatedIdempotencyKey,
  operation: "create-project",
  createdAt: new Date(),
  status: "completed",
  resourceId: createdProjectId
};
```

This is a sketch of the stored record, not a complete race-free handler. A production implementation must define how an in-progress key is claimed, how duplicate-key races are handled, how long keys are retained, and what happens if the operation fails after the key is claimed. For operations involving several writes, transaction boundaries or a durable state machine may be required.

### 18. Observe database behavior in production

Logs are useful for individual incidents, but metrics show trends. At minimum, monitor request latency, error rate, connection failures, pool saturation, query duration, timeout counts, and the rate of rejected writes. For managed MongoDB, also review the provider's database metrics, storage growth, replication health, and backup status.

A slow request is not automatically a slow database query. The delay could come from server selection, connection pool wait, network latency, application-side transformation, or a downstream service. Record timings around meaningful boundaries so that the team can distinguish them. Do not log the complete database URI or entire user documents merely to gain observability.

Use query plans to answer specific questions: Is the intended index being used? How many documents were examined compared with the number returned? Is a sort happening in memory? Did a new filter change the selectivity? Compare the plan against realistic data volume; a query that looks fast with twenty seed documents can become expensive with hundreds of thousands of records.

### 19. Backups, recovery, and operational safety

A backup strategy should state what data loss is acceptable and how quickly service must recover. Recovery point objective (RPO) describes the acceptable amount of data loss; recovery time objective (RTO) describes the target time to restore service. These are business decisions, not just database settings.

A practical recovery checklist includes:

- Identify the backup schedule and retention policy.
- Confirm whether backups are snapshots, logical exports, or point-in-time recovery.
- Restrict who can access and restore backups.
- Store recovery instructions somewhere available during an outage.
- Restore into a separate non-production environment on a schedule.
- Validate document counts, indexes, validators, permissions, and a few critical application workflows after restoration.
- Record the elapsed recovery time and any missing steps.

Do not test recovery by overwriting production data. A restore procedure that has never been exercised is an assumption. A backup is only useful when the team can locate it, restore it, and prove that the recovered application behaves correctly.

### 20. Choose consistency deliberately

MongoDB offers different read and write concerns, and replica-set configuration affects durability and visibility. Do not change read or write concerns simply to make a benchmark faster without understanding the guarantee the application loses. A user profile update, a financial ledger, and a public view counter may have different tolerance for stale reads or acknowledged writes.

Ask what the user must observe after a successful write. Must the next read immediately reflect it? Can a public analytics dashboard lag by a few seconds? Would losing the last acknowledged update be acceptable? The answers inform write concern, read preference, caching, and architecture choices. When the application requires a guarantee, document that guarantee and test it under the deployment topology rather than assuming defaults satisfy every use case.

### 21. Keep query construction safe

SQL injection is commonly discussed in relational databases, but untrusted query objects can also be dangerous in MongoDB applications. Do not accept a raw filter object from a browser and pass it directly into `find()`. A caller may be able to submit operators or predicates the endpoint never intended to expose.

Instead, parse supported query parameters into a small, explicit filter. For example, accept a known `status` value and a bounded search term, then construct the filter on the server. Validate sort fields against an allowlist rather than allowing a caller to sort on arbitrary fields. Enforce maximum page sizes and request timeouts. This keeps the API contract narrow and prevents clients from turning a simple listing endpoint into an unrestricted query interface.

### 22. Treat data duplication as a consistency decision

Embedding or denormalizing a display name can make a page faster, but it creates a decision about what happens when the source name changes. If the same author name is copied into one hundred project documents, changing the profile does not automatically update those copies. Sometimes a snapshot is correct—for example, the author's name at the time of a historical event. Sometimes it is an unwanted inconsistency.

Before duplicating a field, state which copy is authoritative and how the other copies are updated. Options include accepting a snapshot, updating dependent documents, reading the canonical value separately, or asynchronously propagating a change. Choose based on freshness requirements and failure recovery. Do not duplicate fields merely because it saves one query; understand the write path that keeps the copies coherent.

## Additional Common Mistakes to Watch For

| Mistake | Why it fails | Fix |
|---|---|---|
| Accepting a client-supplied owner field | A caller may impersonate another owner | Derive ownership from trusted authentication context |
| Passing a raw browser filter into `find()` | Clients can submit unexpected query operators or expensive filters | Build filters from an explicit allowlist of parameters |
| Assuming a timeout means the write did not happen | The database may have committed before the response was lost | Design idempotency and safe retry behavior for important writes |
| Changing validators before checking legacy records | Existing records can become difficult to update | Use a staged migration and audit existing shapes first |
| Measuring queries only with tiny seed data | The chosen plan may degrade at realistic volume | Test explain output and latency with representative data sizes |
| Logging entire documents for debugging | Logs may accumulate private user data | Log minimal identifiers, operation names, timing, and safe error codes |
| Treating denormalized copies as automatically synchronized | Related values can drift when the source changes | Define the authoritative value and update or snapshot policy |
| Ignoring pool saturation | Requests wait for connections even when queries are fast | Monitor pool wait and tune concurrency and pool limits together |
| Running a migration as one giant update | Can create load spikes and make recovery difficult | Use bounded batches, checkpoints, and a tested rollback/forward plan |
| Assuming defaults meet every durability need | Different workloads have different consistency requirements | Document required guarantees and choose read/write concerns intentionally |

## A Practical Review Checklist

Before merging a MongoDB-backed feature, review it against these questions:

- **Data model:** Are document boundaries based on actual reads, writes, lifecycle, and growth? Are embedded arrays bounded?
- **Validation:** Are request fields typed, length-limited, and allowlisted? Are trusted fields derived server-side?
- **Authorization:** Does every private read and write include a meaningful permission check? Can one user change another user's ID in a request?
- **Query safety:** Are filters constructed on the server? Are sort keys allowlisted? Are page size and response shape bounded?
- **Indexes:** Does each important query have an index strategy? Has the query plan been checked against representative data? Are unique constraints enforced in MongoDB?
- **Concurrency:** Could simultaneous writes overwrite each other? Is optimistic concurrency or another conflict strategy required?
- **Reliability:** Are connection failures and timeouts handled? Are retries safe? Are important writes idempotent where needed?
- **Operations:** Are metrics available? Are backups monitored? Has a restore been tested? Is schema evolution documented?
- **Privacy:** Are secrets excluded from browser code and logs? Are projections preventing accidental data exposure?
- **Maintainability:** Are repository methods narrow and named by intent? Can another developer understand why the chosen model embeds or references each relationship?

A review checklist is not paperwork for its own sake. It is a compact way to catch problems that tend to surface only after the feature has real users, real data volume, and real failure conditions.

## Mini Scenario: A Portfolio Goes from Demo to Production

Imagine a designer's portfolio initially has twelve projects. The first implementation loads all documents, sorts them in JavaScript, and returns each full document to the browser. This appears acceptable because the data set is tiny. After a marketing campaign, the portfolio contains thousands of projects, private drafts, large content blocks, and metadata added by an editor.

A senior engineer does not begin by adding random indexes. First, they list the actual user journeys: a visitor loads a public listing, opens a project by slug, and filters by technology; an authenticated editor saves a draft; an administrator archives a project. Each journey gets a narrow query contract. Public reads filter for `status: "published"`, project only public fields, and use a deterministic sort with a page-size cap. The slug gets a unique index, and the public listing gets an index aligned to its filter and sort. Private reads include the authenticated owner's ID or a deliberate admin permission check.

Next, the engineer examines the document shape. A bounded set of gallery images can stay embedded because the project page normally needs them together. An edit history that grows indefinitely should not be embedded in the project forever; it can become a separate collection indexed by project ID and timestamp. The team documents whether an author's display name is a historical snapshot or a live profile value before duplicating it into project documents.

Finally, the engineer adds operational behavior. A database outage produces a controlled error rather than a leaked stack trace. Logs capture request identifiers and duration without dumping user content. A migration is tested against a copy of representative data. Backups are restored in a non-production environment, and the team records the recovery time. The resulting application is not merely connected to MongoDB; it has a model, bounded workload, security boundaries, and a recovery plan.

## When MongoDB Is Not the Right Shortcut

Do not choose MongoDB solely to avoid designing a schema. If the domain has many tightly connected entities, frequent joins, and important relational constraints, a relational database may express those invariants more directly. MongoDB supports references, aggregation, and transactions, but using those features to reproduce every relational pattern can make the system harder to reason about than a relational model would be.

Likewise, do not assume that every flexible content system needs a document database. A relational database can store JSON fields for genuinely variable metadata while retaining foreign keys and relational queries for core entities. The choice should be based on the application's consistency needs, team expertise, expected query shapes, operations budget, and hosting constraints—not on a trend or the shape of a sample object.

The right answer may also be hybrid: a primary transactional database for authoritative business data, a search engine for full-text discovery, and a cache for frequently accessed public results. Each additional system adds deployment, monitoring, backup, security, and consistency responsibilities. Introduce one only when its benefit justifies that operational cost.
