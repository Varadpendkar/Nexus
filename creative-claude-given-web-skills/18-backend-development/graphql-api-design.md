# SKILL: graphql-api-design
**Layer:** 18 — Backend Development
**Goal:** Design, implement, secure, and operate GraphQL APIs whose schema communicates domain intent while resolvers remain predictable, bounded, observable, and efficient under real client workloads.

---

## Why This Matters (Senior Perspective)

GraphQL gives clients control over the shape of a response, but it does not automatically make a backend efficient or safe. A portfolio site might request project cards, author details, and technology tags in one operation; a naive resolver can turn that into dozens or hundreds of database queries. This N+1 problem often hides in local development because the dataset is tiny, then becomes a production incident when a client opens a page with hundreds of records. Another common failure is allowing arbitrarily deep or wide queries: one request can trigger expensive nested joins, overwhelm a database connection pool, and consume CPU long before ordinary HTTP rate limits become useful. Schema mistakes also have long tails. Renaming a field that several clients rely on, changing a nullable field to non-null, or exposing internal persistence names can force coordinated deployments and break a client that was not tested by the team.

A beginner often treats GraphQL as “one endpoint that returns whatever the frontend asks for.” A senior engineer treats it as a typed contract plus an execution engine with cost, authorization, compatibility, and observability boundaries. The schema is a product surface: field names express domain meaning, nullability expresses guarantees, and input types constrain mutations. Resolvers are application code, not a place to scatter SQL and authorization checks. The senior design begins with expected queries, ownership boundaries, pagination, error semantics, and resource limits before adding fields. It also separates schema design from database design: the public graph should not expose accidental details of tables or ORM models.

For creative portfolios and freelance sites, GraphQL can help when a rich interface needs different combinations of project, author, media, category, and case-study data. It is less compelling for a tiny static site with one predictable payload; adding a graph runtime there can increase maintenance without improving the user experience. A client may ask for “one flexible API,” but the deliverable still needs predictable loading states, secure access to draft content, and fast responses on mobile. Good GraphQL design therefore balances expressive querying with strict execution budgets, stable contracts, clear ownership, and measurable performance.

## Core Concepts

### 1. The schema is the public contract

A GraphQL schema describes object types, fields, arguments, input types, and operations. Think of it as the contract the client compiles its query against—not a mirror of your database tables. A `Project` can expose `publishedAt` even if storage uses `published_at`, and it can combine fields from multiple services without revealing that implementation.

```graphql
# schema.graphql
 type Project {
  id: ID!
  title: String!
  slug: String!
  summary: String
  publishedAt: String
}

type Query {
  project(slug: String!): Project
}
```

The `!` means the field cannot be null in a valid result. Without it, the field is nullable. Choose this based on the domain guarantee, not optimism: if an imported project may lack a summary, `summary: String` is honest; if every persisted project must have an ID, `id: ID!` is appropriate.

**Naive / wrong:** expose every ORM field directly, including internal flags and storage-specific names.

```graphql
type Project {
  id: ID!
  deleted_at: String
  internal_review_state: String
  raw_storage_bucket_key: String
}
```

**Correct:** expose stable domain language and only fields clients are allowed to depend on.

```graphql
type Project {
  id: ID!
  title: String!
  visibility: ProjectVisibility!
}

enum ProjectVisibility {
  PUBLIC
  PRIVATE
}
```

**Gotcha:** changing a nullable output field to non-null is potentially breaking. If old records can produce `null`, GraphQL propagates that null upward until it reaches a nullable boundary, possibly removing an entire parent object from the response.

### 2. Query, mutation, and subscription have different jobs

`Query` reads data, `Mutation` represents state changes, and `Subscription` streams updates over a supported transport. This separation gives clients a readable operation model, but it does not itself make queries side-effect free or mutations transactional. Keep read resolvers safe to retry and put state-changing behavior behind explicit mutation fields.

```graphql
type Query {
  project(id: ID!): Project
  projects(first: Int = 20, after: String): ProjectConnection!
}

type Mutation {
  publishProject(input: PublishProjectInput!): PublishProjectPayload!
}

input PublishProjectInput {
  projectId: ID!
}

type PublishProjectPayload {
  project: Project
  userErrors: [UserError!]!
}

type UserError {
  field: String
  message: String!
}
```

**Naive / wrong:** use a query field to publish a project because the frontend already has a convenient query helper.

```graphql
type Query {
  publishProject(id: ID!): Project!
}
```

**Correct:** make the command explicit and return a payload that can communicate domain validation outcomes.

```graphql
type Mutation {
  publishProject(input: PublishProjectInput!): PublishProjectPayload!
}
```

**Gotcha:** GraphQL executes top-level mutation fields serially within one operation, but that does not mean multiple fields form one database transaction. Wrap multi-record invariants in a transaction in the application layer.

### 3. Object types should describe domain relationships

The graph is useful when relationships are explicit. A `Project` may have an `author`, a set of `technologies`, and a collection of `caseStudySections`. Model these as fields with their own types instead of returning a large serialized JSON blob that clients must interpret themselves.

```graphql
type Project {
  id: ID!
  title: String!
  author: Author!
  technologies: [Technology!]!
  caseStudySections: [CaseStudySection!]!
}

type Author {
  id: ID!
  displayName: String!
  profileUrl: String
}

type Technology {
  id: ID!
  name: String!
}

type CaseStudySection {
  heading: String!
  body: String!
}
```

The list notation matters: `[Technology!]!` means the list itself and each member must be non-null. `[Technology]` allows both a null list and null members. Prefer the narrowest guarantee the resolver can actually keep.

**Naive / wrong:** encode relationships as comma-separated text.

```graphql
type Project {
  technologies: String!
}
```

**Correct:** expose a typed collection so the client can select exactly the fields it needs.

```graphql
type Project {
  technologies: [Technology!]!
}
```

**Gotcha:** non-null is a runtime promise, not a documentation flourish. If a downstream service is allowed to fail, either handle the failure and provide a valid fallback or model the field as nullable with a clear client strategy.

### 4. Resolvers are field execution functions

A resolver receives parent/root, arguments, context, and execution metadata. The parent is often the object returned by the previous resolver. Context is the right place for request-scoped dependencies such as an authenticated principal, database access, and DataLoader instances. Avoid creating a new database client for every field invocation.

```javascript
const resolvers = {
  Query: {
    project: async (_parent, { slug }, context) => {
      return context.repositories.projects.findPublishedBySlug(slug);
    },
  },
  Project: {
    author: (project, _args, context) => {
      return context.loaders.authorById.load(project.authorId);
    },
  },
};
```

**Naive / wrong:** call the database directly from every nested field with no shared request scope.

```javascript
const resolvers = {
  Project: {
    author: (project) => db.author.findUnique({ where: { id: project.authorId } }),
  },
};
```

**Correct:** route access through a request-scoped loader or repository that can batch and instrument calls.

```javascript
const resolvers = {
  Project: {
    author: (project, _args, { loaders }) => loaders.authorById.load(project.authorId),
  },
};
```

**Gotcha:** resolver return values may be promises. GraphQL awaits them, but a promise per list item can still cause excessive parallel work and overwhelm a connection pool if batching and concurrency are not designed.

### 5. Selection sets define response shape, not cost

Clients request fields in a selection set. This avoids over-fetching fields the client does not need, but nested selections can still be expensive. The cost of `projects { author { projects { author { ... }}}}` grows with fan-out and depth. Treat client flexibility as a budgeted capability.

```graphql
query ProjectIndex {
  projects(first: 12) {
    nodes {
      id
      title
      author {
        displayName
      }
      technologies {
        name
      }
    }
  }
}
```

**Naive / wrong:** assume a single HTTP request is automatically cheaper than several REST requests.

```graphql
query Everything {
  projects(first: 500) {
    nodes {
      author { projects(first: 500) { nodes { author { displayName } } } }
    }
  }
}
```

**Correct:** inspect likely operations and cap depth, pagination, and resolver fan-out.

```javascript
const limits = {
  maxDepth: 8,
  maxPageSize: 50,
  maxEstimatedCost: 1200,
};
```

**Gotcha:** aliases can request the same expensive field repeatedly under different names. Cost analysis must account for aliases and argument values, not just count distinct field names.

### 6. Arguments and input types validate intent

Arguments belong on fields; input object types group mutation inputs and make validation rules explicit. Use enums for finite choices, scalars for atomic values, and dedicated input types for commands. Avoid reusing output object types as mutation inputs because output objects often contain server-owned fields such as IDs, timestamps, or computed values.

```graphql
enum ProjectStatus {
  DRAFT
  REVIEW
  PUBLISHED
}

input UpdateProjectInput {
  id: ID!
  title: String
  summary: String
  status: ProjectStatus
}

type Mutation {
  updateProject(input: UpdateProjectInput!): ProjectUpdatePayload!
}

type ProjectUpdatePayload {
  project: Project
  userErrors: [UserError!]!
}
```

**Naive / wrong:** accept a generic JSON scalar for an entire update request, leaving the schema unable to describe the shape.

```graphql
scalar JSON

type Mutation {
  updateProject(payload: JSON!): Project
}
```

**Correct:** use a typed input, then validate business rules in the service layer.

```graphql
input UpdateProjectInput {
  id: ID!
  title: String
  status: ProjectStatus
}
```

**Gotcha:** omitted input fields and explicitly supplied `null` are different states. For patch-style updates, check whether a property is present before deciding whether to leave it unchanged or clear it.

### 7. Nullability is an error-propagation design choice

GraphQL errors can coexist with partial data. If a nullable field fails, that field can become null while sibling fields remain available. If a non-null field fails, null bubbles to its parent; repeated non-null boundaries can null the whole result. Use nullability to describe what your service guarantees under expected failure conditions.

```graphql
type Project {
  id: ID!
  title: String!
  previewImage: MediaAsset
  author: Author!
}

type MediaAsset {
  url: String!
  alt: String!
}
```

**Naive / wrong:** declare every field non-null to make generated client types convenient.

```graphql
type Project {
  author: Author!
  previewImage: MediaAsset!
}
```

**Correct:** if a legacy project may have no preview image, express that uncertainty in the schema and handle it in the UI.

```graphql
type Project {
  author: Author!
  previewImage: MediaAsset
}
```

**Gotcha:** a nullable field does not mean “ignore errors.” Log resolver failures with operation and field context, return a deliberate null only when the failure is expected and safe, and avoid leaking internal exception text.

### 8. Pagination is part of the contract

Large lists should have explicit limits and a stable continuation strategy. Offset pagination is easy to understand but can skip or duplicate rows as records are inserted before the current offset. Cursor pagination is usually better for feeds and changing collections when the cursor represents a stable ordering key.

```graphql
type ProjectEdge {
  cursor: String!
  node: Project!
}

type PageInfo {
  hasNextPage: Boolean!
  endCursor: String
}

type ProjectConnection {
  edges: [ProjectEdge!]!
  pageInfo: PageInfo!
}
```

**Naive / wrong:** allow clients to ask for an unbounded list.

```graphql
type Query {
  projects(first: Int): [Project!]!
}
```

**Correct:** enforce a default and a maximum in resolver/service code, even if schema arguments are typed.

```javascript
function normalizePageSize(requested) {
  const DEFAULT_PAGE_SIZE = 20;
  const MAX_PAGE_SIZE = 50;
  if (requested == null) return DEFAULT_PAGE_SIZE;
  if (!Number.isInteger(requested) || requested < 1) {
    throw new Error("first must be a positive integer");
  }
  return Math.min(requested, MAX_PAGE_SIZE);
}
```

**Gotcha:** a cursor should not be trusted as authorization. Decode and validate it, then apply the current viewer’s access rules to every page.

### 9. DataLoader prevents the N+1 query pattern

If a query returns 30 projects and each `author` resolver performs a separate query, the request may issue 31 database calls. A DataLoader batches IDs requested during one execution window and memoizes them for that request. Its batch function must return results in the same positional order as the input keys, including missing records.

```javascript
import DataLoader from "dataloader";

function createLoaders(repositories) {
  return {
    authorById: new DataLoader(async (ids) => {
      const authors = await repositories.authors.findByIds(ids);
      const byId = new Map(authors.map((author) => [author.id, author]));
      // Preserve key order: DataLoader maps each returned slot to one requested ID.
      return ids.map((id) => byId.get(id) ?? null);
    }),
  };
}
```

**Naive / wrong:** return database rows in whatever order the database happened to use.

```javascript
const authors = await db.author.findMany({ where: { id: { in: ids } } });
return authors;
```

**Correct:** map results back to the requested keys and preserve missing slots.

```javascript
const byId = new Map(authors.map((author) => [author.id, author]));
return ids.map((id) => byId.get(id) ?? null);
```

**Gotcha:** DataLoader caches within its lifetime. Create loaders per request when permissions or tenant scope vary by user; a global loader can accidentally reuse data across users.

### 10. Authorization belongs at every data boundary

Authentication answers who the caller is; authorization answers whether that principal can perform this action on this resource. Hiding a field in the frontend is not access control. Every resolver that exposes private data or performs a mutation must enforce the applicable policy, preferably through a reusable service or policy layer.

```javascript
async function getProjectForViewer(projectId, viewer, projects) {
  const project = await projects.findById(projectId);
  if (!project) return null;
  if (project.visibility === "PUBLIC") return project;
  if (!viewer || project.ownerId !== viewer.id) {
    throw new Error("Not authorized to access this project");
  }
  return project;
}
```

**Naive / wrong:** trust a client-supplied `ownerId` when creating a project.

```javascript
createProject: (_parent, { input }) => projects.create(input)
```

**Correct:** derive ownership from authenticated context, never from untrusted input.

```javascript
createProject: (_parent, { input }, { viewer, services }) => {
  if (!viewer) throw new Error("Authentication required");
  return services.projects.create({ ...input, ownerId: viewer.id });
}
```

**Gotcha:** field-level authorization alone may not be enough. A query can expose private records through a list, count, search result, or nested relation. Apply policy before pagination and aggregation so totals do not leak restricted information.

### 11. Mutations need idempotency and domain validation

Mutations should express commands such as `publishProject`, not generic table updates. Validate user intent at the schema boundary, then enforce domain invariants in the service. For retry-prone operations, use an idempotency key or a naturally idempotent state transition so a mobile client retry does not publish twice, charge twice, or enqueue duplicate work.

```graphql
input PublishProjectInput {
  projectId: ID!
  idempotencyKey: String!
}
```

```javascript
async function publishProject({ projectId, idempotencyKey, viewer, services }) {
  return services.idempotency.run(idempotencyKey, async () => {
    const project = await services.projects.findOwned(projectId, viewer.id);
    if (!project) throw new Error("Project not found");
    if (project.status === "PUBLISHED") return project;
    return services.projects.publishAtomically(project.id);
  });
}
```

**Naive / wrong:** perform side effects before checking ownership and current state.

```javascript
await mailer.sendPublicationNotice(projectId);
await projects.publish(projectId);
```

**Correct:** authorize, validate state, commit the transition, then enqueue a reliable notification through an outbox or post-commit job.

```javascript
const published = await projects.publishAtomically(projectId, viewer.id);
await outbox.enqueue({ type: "PROJECT_PUBLISHED", projectId: published.id });
return published;
```

**Gotcha:** an idempotency key needs a scope and retention policy. Bind it to the authenticated principal and operation, store the completed result, and reject reuse with a different payload.

### 12. Errors need a stable client-facing strategy

GraphQL responses can contain both `data` and `errors`. Treat error messages as part of the client contract: expose safe, actionable messages for expected business failures, but keep SQL text, stack traces, secrets, and internal hostnames out of responses. Include correlation IDs in logs so a frontend report can be tied to server diagnostics.

```javascript
function toPublicError(error, requestId) {
  if (error.code === "PROJECT_NOT_FOUND") {
    return { message: "Project was not found", extensions: { code: "NOT_FOUND", requestId } };
  }
  if (error.code === "FORBIDDEN") {
    return { message: "You cannot perform this action", extensions: { code: "FORBIDDEN", requestId } };
  }
  return { message: "Unexpected server error", extensions: { code: "INTERNAL_SERVER_ERROR", requestId } };
}
```

**Naive / wrong:** serialize the original exception to the client.

```javascript
catch (error) {
  return { message: error.stack };
}
```

**Correct:** log the detailed exception privately and send a normalized public error.

```javascript
catch (error) {
  logger.error({ err: error, requestId }, "GraphQL resolver failed");
  throw new GraphQLError("Unexpected server error", {
    extensions: { code: "INTERNAL_SERVER_ERROR", requestId },
  });
}
```

**Gotcha:** clients must inspect both `data` and `errors`. A non-2xx HTTP status is not the only way GraphQL reports an operation failure, and partial data may still be useful depending on the UI.

### 13. Query complexity and depth limits are resource controls

Depth limits prevent endlessly nested operations, but depth alone is insufficient: a shallow request for 10,000 nodes can still be costly. Add maximum page sizes, field-cost estimates, timeouts, concurrency limits, persisted operations where appropriate, and request-level rate limits. Use cost rules that account for list multipliers and aliases.

```javascript
const policy = {
  maxDepth: 8,
  maxAliases: 10,
  maxPageSize: 50,
  requestTimeoutMs: 4000,
};

function validatePageSize(first, maxPageSize = policy.maxPageSize) {
  if (first > maxPageSize) {
    throw new Error(`first cannot exceed ${maxPageSize}`);
  }
}
```

**Naive / wrong:** rely only on an HTTP request-count rate limit.

```javascript
// One request can still ask for thousands of nested records.
const rateLimit = { requestsPerMinute: 100 };
```

**Correct:** estimate work per operation and enforce limits before expensive resolvers run.

```javascript
const cost = calculateOperationCost(document, variables);
if (cost > policy.maxEstimatedCost) {
  throw new GraphQLError("Query exceeds the operation cost limit", {
    extensions: { code: "QUERY_TOO_COMPLEX" },
  });
}
```

**Gotcha:** complexity estimators must be tested against fragments, aliases, directives, and variable-driven list sizes. An incorrect estimator can undercount the very operations it is intended to stop.

### 14. Real-world integration: a portfolio project graph

A production portfolio API combines public project discovery, author profiles, media metadata, and private draft editing. Public queries should return only published projects; draft mutations require an authenticated owner; nested author and technology fields should batch efficiently; and list operations must have stable cursors and cost limits. Keep schema definitions, resolver wiring, service rules, and repositories separate enough that each can be tested independently.

```graphql
type Query {
  publicProjects(first: Int = 12, after: String): ProjectConnection!
  projectBySlug(slug: String!): Project
  viewer: Viewer
}

type Viewer {
  id: ID!
  displayName: String!
  draftProjects(first: Int = 20): [Project!]!
}

type Project {
  id: ID!
  slug: String!
  title: String!
  summary: String
  author: Author!
  technologies: [Technology!]!
  heroImage: MediaAsset
}
```

**Naive / wrong:** use one generic `projects` field for public search, private drafts, admin review, and owner editing, then hope each UI filters correctly.

```graphql
type Query {
  projects(includeDrafts: Boolean): [Project!]!
}
```

**Correct:** make public and viewer-scoped access paths explicit, and still enforce authorization in the service layer.

```javascript
const resolvers = {
  Query: {
    publicProjects: (_parent, args, { services }) => services.projects.listPublished(args),
    projectBySlug: (_parent, { slug }, { services }) => services.projects.findPublishedBySlug(slug),
    viewer: (_parent, _args, { viewer }) => viewer,
  },
  Viewer: {
    draftProjects: (viewer, args, { services }) => services.projects.listDraftsForOwner(viewer.id, args),
  },
  Project: {
    author: (project, _args, { loaders }) => loaders.authorById.load(project.authorId),
    technologies: (project, _args, { loaders }) => loaders.technologiesByProjectId.load(project.id),
  },
};
```

**Gotcha:** a field called `publicProjects` is not secure merely because of its name. Repository methods must encode visibility rules, and tests should verify that draft records never appear in public list, search, count, or nested relationship results.

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Schema-first domain modeling

**What it does:** defines the client-facing graph before resolver implementation, making names, nullability, and relationships reviewable as a contract.

**When to use it:** a portfolio API will be consumed by a web frontend and a mobile client maintained by different developers, so field changes need explicit review.

```graphql
schema {
  query: Query
  mutation: Mutation
}

type Query {
  projectBySlug(slug: String!): Project
}

type Project {
  id: ID!
  slug: String!
  title: String!
  summary: String
}
```

Keep public names independent of table names. Add a field only when its semantics and nullability can be explained; do not expose internal status flags as a shortcut to avoid writing a domain type.

### Pattern 2: Request-scoped DataLoader registry

**What it does:** batches repeated relationship lookups and caches them only for one GraphQL request.

**When to use it:** a project listing requests authors and technologies for many cards, and tracing shows database calls rising with the number of cards.

```javascript
import DataLoader from "dataloader";

export function buildContext({ request, repositories, auth }) {
  const viewer = auth.fromRequest(request);
  const loaders = {
    authorById: new DataLoader(async (ids) => {
      const rows = await repositories.authors.findByIds(ids, { viewer });
      const byId = new Map(rows.map((row) => [row.id, row]));
      return ids.map((id) => byId.get(id) ?? null);
    }),
  };
  return { viewer, repositories, loaders };
}
```

Never share this loader registry globally across requests when results depend on tenant or viewer permissions. DataLoader reduces round trips; it does not replace database indexes or sensible query plans.

### Pattern 3: Cursor pagination with a deterministic sort

**What it does:** returns a bounded page with a continuation cursor tied to a stable ordering.

**When to use it:** the portfolio receives new projects while visitors scroll, and offset pages sometimes repeat or skip records after inserts.

```javascript
function encodeCursor(project) {
  return Buffer.from(`${project.publishedAt.toISOString()}|${project.id}`).toString("base64url");
}

function decodeCursor(cursor) {
  const decoded = Buffer.from(cursor, "base64url").toString("utf8");
  const [publishedAt, id] = decoded.split("|");
  if (!publishedAt || !id || Number.isNaN(Date.parse(publishedAt))) {
    throw new Error("Invalid project cursor");
  }
  return { publishedAt: new Date(publishedAt), id };
}
```

The database order must use the same tuple as the cursor, for example `publishedAt DESC, id DESC`. A cursor is opaque to clients, but it is not a secret and must not carry authorization claims.

### Pattern 4: Service-layer authorization

**What it does:** centralizes access decisions so resolvers, background jobs, and other entry points share the same rules.

**When to use it:** draft projects are editable by their owner and visible to public visitors only after publication.

```javascript
export async function updateProject({ input, viewer, repositories }) {
  if (!viewer) throw new DomainError("AUTH_REQUIRED");
  const current = await repositories.projects.findById(input.id);
  if (!current || current.ownerId !== viewer.id) throw new DomainError("FORBIDDEN");
  return repositories.projects.updateOwnedDraft({ ...input, ownerId: viewer.id });
}
```

The service must verify ownership against stored data, not merely trust an owner ID passed from the GraphQL input. For systems with organization membership, include tenant and role checks in the policy rather than adding ad hoc resolver conditionals.

### Pattern 5: Normalized mutation payloads

**What it does:** gives clients a stable place to read the changed object and expected validation errors.

**When to use it:** a form needs to show field-level feedback for duplicate slugs or invalid publication state without parsing arbitrary server exceptions.

```graphql
type UpdateProjectPayload {
  project: Project
  userErrors: [UserError!]!
}

type UserError {
  field: String
  code: String!
  message: String!
}
```

Use payload errors for expected domain validation; use GraphQL execution errors for unexpected infrastructure failures or failures that prevent the operation from producing a valid payload. Document the distinction so clients do not treat every business rejection as a server outage.

### Pattern 6: Persisted operations for controlled clients

**What it does:** allows approved operations to be identified by a hash or registry entry, reducing arbitrary query surface and improving observability.

**When to use it:** a high-traffic public site has a known set of frontend operations and needs tighter control over expensive or unreviewed queries.

```javascript
const persistedOperations = new Map([
  ["project-index-v1", projectIndexDocument],
  ["project-detail-v1", projectDetailDocument],
]);

function resolveOperation(operationId) {
  const document = persistedOperations.get(operationId);
  if (!document) throw new Error("Unknown persisted operation");
  return document;
}
```

Persisted operations are not a replacement for authentication, authorization, complexity limits, or input validation. Keep a safe rollout path for adding operations and monitor unknown-operation rates before turning off unrestricted development queries.

### Pattern 7: Resolver observability and budget enforcement

**What it does:** records operation identity, duration, resolver cost, database calls, and errors without logging sensitive variables.

**When to use it:** users report that the project detail page is slow, but HTTP-level metrics do not reveal which nested field dominates latency.

```javascript
async function measuredResolver(name, resolver, args) {
  const startedAt = performance.now();
  try {
    return await resolver();
  } finally {
    args.metrics.observe("graphql.resolver.duration_ms", performance.now() - startedAt, {
      resolver: name,
      operationName: args.operationName ?? "anonymous",
    });
  }
}
```

Prefer operation names and field paths over raw query variables in logs. Set budgets from observed latency and capacity, then alert on regressions rather than relying on a single average that hides slow tails.

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Mirroring every database column in the schema | Storage structure is mistaken for a stable public contract | Define domain output types and map persistence names in resolvers |
| Declaring optional legacy fields non-null | The schema is written from ideal data instead of observed records | Audit existing rows and mark uncertain output fields nullable |
| Performing writes from query resolvers | The developer treats operation names as labels only | Put state transitions under explicit mutation fields |
| Returning unordered DataLoader results | Database `IN` queries are assumed to preserve input order | Build a key map and return one result slot per requested key |
| Sharing DataLoader across requests | Caching is assumed to be universally safe | Instantiate loaders in the request context and scope them to the viewer |
| Leaving list size unbounded | Flexible client selection is confused with free execution | Normalize pagination arguments and enforce a server-side maximum |
| Limiting query depth only | Nesting is counted but list fan-out is ignored | Add field-cost estimation, page-size multipliers, and alias limits |
| Trusting client-supplied owner IDs | Input types are mistaken for trusted identity | Derive ownership from authenticated context and verify stored ownership |
| Authorizing only detail queries | Lists and aggregates are overlooked as data leaks | Apply visibility filters before search, counts, and pagination |
| Returning raw exception messages | Developer diagnostics are exposed as client UX | Normalize public error codes and log full errors privately with request IDs |
| Treating all errors as total failure | Partial GraphQL data is not understood | Render usable nullable fields while handling `errors` explicitly |
| Using output types as mutation inputs | Shared types look convenient but contain server-owned fields | Create command-specific input objects with only writable fields |
| Making mutation retries non-idempotent | Network retries are treated as rare exceptions | Use idempotency keys or safe state-transition checks around side effects |
| Breaking field names without a deprecation period | Schema changes are treated like local refactors | Add a replacement field, deprecate the old one, measure usage, then remove it |
| Logging raw variables and tokens | Debugging convenience outweighs privacy concerns | Redact secrets and sensitive variables before telemetry is emitted |
| Assuming one request means one database query | GraphQL's transport shape hides resolver fan-out | Track database calls per operation and batch common relationship access |
| Treating cursor values as permission tokens | Opaque encoding is confused with security | Validate cursor format and apply current authorization independently |

**Before → After: remove an N+1 relationship lookup**

```javascript
// Before: one database request for every project row.
const resolversBefore = {
  Project: {
    author: (project) => db.author.findUnique({ where: { id: project.authorId } }),
  },
};
```

```javascript
// After: all author IDs requested during this operation can be batched.
const resolversAfter = {
  Project: {
    author: (project, _args, { loaders }) => loaders.authorById.load(project.authorId),
  },
};
```

## Mental Models

1. **The schema is a promise** — every field name, nullability marker, and enum value is a contract clients will build against.
2. **The graph is not the database** — model relationships in domain language and let repositories translate them into storage queries.
3. **Selection is not cost control** — a short query can still trigger enormous fan-out; bound execution on the server.
4. **A resolver is a boundary** — it should delegate business rules, authorization, and persistence rather than becoming a mini-application.
5. **Cache scope follows identity scope** — request-dependent data must not leak through process-wide caches.
6. **Nullability predicts blast radius** — a non-null failure can erase parent objects, so make guarantees intentionally.
7. **Retries are part of the network** — mutations must tolerate duplicate delivery or clearly reject it.
8. **Measure the operation, not only the endpoint** — the endpoint may be fast for one query and slow for another.

## Quick Reference

| Property/Situation | Value/Answer | Notes |
|---|---|---|
| Non-null output field | `title: String!` | Resolver must never return null for valid data |
| Nullable output field | `summary: String` | Suitable when absence is part of the domain |
| Non-null list of non-null items | `[Technology!]!` | Neither list nor members may be null |
| Query operation | `type Query { ... }` | Use for read operations without side effects |
| Mutation operation | `type Mutation { ... }` | Use for explicit state changes |
| Subscription operation | `type Subscription { ... }` | Requires supported streaming transport and lifecycle handling |
| Group mutation input | `input UpdateProjectInput { ... }` | Only include client-writable fields |
| Finite field choices | `enum ProjectStatus { DRAFT REVIEW PUBLISHED }` | Safer than unconstrained strings |
| Resolver context | `{ viewer, repositories, loaders }` | Request-scoped dependencies belong here |
| DataLoader batch result | `ids.map(id => byId.get(id) ?? null)` | Preserve exact input key order |
| Default page size | `20` | Choose from UX and capacity measurements |
| Maximum page size | `50` | Enforce on the server, not only in client UI |
| Cursor ordering | `publishedAt DESC, id DESC` | Include a unique tie-breaker for deterministic pages |
| Authenticated principal | `context.viewer` | Never accept identity from mutation input |
| Expected validation error | `userErrors: [UserError!]!` | Keep domain feedback stable for forms |
| Unexpected resolver failure | Normalized GraphQL error | Log detailed cause privately with request ID |
| Query depth | Example cap: `8` | Tune to actual schema and client operations |
| Alias budget | Example cap: `10` | Count repeated expensive field calls |
| Persisted operation | Stable operation ID/hash | Still enforce auth and resource limits |
| Schema compatibility | Add new field, deprecate old field | Remove only after client usage reaches zero |
| Mutation retry safety | Idempotency key or safe transition | Scope keys by principal and operation |
| DataLoader cache scope | One request | Prevent cross-user or cross-tenant reuse |
| Partial response | Inspect `data` and `errors` | Both can be present in one response |

## Build Challenge

### Build: The Production-Ready Creative Portfolio Graph

Build a GraphQL API for a portfolio where visitors browse published projects while authenticated owners edit drafts and publish case studies. This challenge tests schema design, resolver boundaries, pagination, batching, authorization, and failure handling together. It must also include a deliberately failing scenario: disable the author DataLoader or inject a slow nested resolver, prove the regression with measurements, and then restore bounded behavior.

**Requirements**

1. Define `Project`, `Author`, `Technology`, `MediaAsset`, and `ProjectConnection` with intentional nullability.
2. Implement `publicProjects(first, after)` using cursor pagination with a deterministic sort and a server-enforced maximum page size.
3. Implement `projectBySlug` so unpublished projects are not returned to anonymous visitors.
4. Add a `viewer` field that resolves only from authenticated request context.
5. Implement `updateProject(input)` with a dedicated input type that excludes server-owned fields such as owner ID and publication timestamps.
6. Put owner checks and state-transition validation in a service function that can be unit tested without GraphQL execution.
7. Create request-scoped DataLoaders for authors and technologies; batch results must preserve input key order and represent missing records safely.
8. Add a stable mutation payload with `project` and `userErrors` for expected validation failures.
9. Enforce maximum page size, query depth, alias count, and an operation cost budget before expensive resolvers execute.
10. Normalize unexpected errors and attach a request ID without returning stack traces, SQL details, or secrets to clients.
11. Add tests proving that anonymous visitors cannot retrieve drafts through detail, list, nested relationship, search, or count paths.
12. Simulate an N+1 regression by temporarily bypassing the loader; measure query count for 1, 10, and 30 projects, then restore batching and record the new counts.
13. Add an idempotency strategy for publishing so a retry cannot enqueue duplicate publication notifications.
14. Document one additive schema change using `@deprecated`, plus a safe removal process based on observed operation usage.

**Definition of done / Success criteria**

- The schema validates and all documented operations execute against a seeded test database.
- A request for 30 projects does not trigger 30 separate author queries; batching is verified by a test or query counter.
- Requests asking for more than the configured maximum page size fail with a safe, stable error.
- Public operations never expose drafts, including through nested fields and aggregate results.
- A non-owner cannot update or publish another owner's project, even if they guess its ID.
- Invalid input returns structured `userErrors`; unexpected failures return a normalized public error and a traceable request ID.
- Repeating the same publish command with the same idempotency key produces one state transition and one notification event.
- A slow or over-complex operation is rejected or timed out within the configured resource budget.
- Tests cover nullable field failure and confirm that partial data behaves as the schema promises.

**Suggested focused-session plan:** 35 minutes schema and operation design; 50 minutes resolver and service implementation; 35 minutes pagination and DataLoader; 35 minutes authorization and mutation retry safety; 35 minutes failure injection, tests, and query-cost tuning; 15 minutes schema compatibility notes. Total: approximately 3 hours 25 minutes.
