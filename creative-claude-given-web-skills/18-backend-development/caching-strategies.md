# SKILL: caching-strategies
**Layer:** 18 — Backend Development
**Goal:** Design and operate cache layers with explicit key identity, freshness, invalidation, privacy boundaries, resilience, and measurable performance benefits.

---

## Why This Matters (Senior Perspective)
Caching is one of the easiest ways to make a system look fast in a demo and one of the easiest ways to make production correctness mysterious. A project marketplace may cache a public project page, a featured-project list, a search result, and a user dashboard. An edit can update the database successfully while the old card remains visible on the homepage; a CDN can serve one customer’s personalized response to another; a cache outage can send every request directly to a database that was sized for cache hits; or a batch of entries can expire at once and create a stampede. These are not theoretical edge cases. They happen when teams treat caching as a single `get` and `set` call instead of a contract among identity, freshness, invalidation, and failure behavior.
A beginner asks, “What TTL makes this fast?” A senior asks, “Which result is safe to reuse, for whom, for how long, under what consistency requirement, and how do we know the cache is helping?” The senior maps each layer—browser, CDN, framework, process memory, distributed cache, database—and names the owner of each invalidation path. They distinguish cacheable public content from user-specific data, stable reference data from fast-changing inventory, and optional acceleration from a dependency required for correctness. They also decide what happens during Redis failure, when refresh races with a write, and when a stale value must never be served.
This matters in creative portfolio sites and freelance delivery because clients expect published edits to appear quickly, project galleries to load instantly, and admin dashboards to show accurate changes. A polished website with stale case-study text or a broken “featured work” list looks unreliable even when its database is healthy. For a client marketplace, cache design also affects cost: repeated uncached image metadata lookups, expensive search filters, and remote CMS requests can inflate hosting bills. The professional deliverable is not simply a high hit rate; it is a documented freshness promise, an invalidation plan, a safe fallback, and evidence that latency or origin load improved without leaking private information.

---

## Core Concepts

### 1. Cache as a contract, not a speed button

A cache stores a prior result and reuses it only while its correctness conditions still hold. The contract must define identity, freshness, invalidation, and what happens on a miss.

**Concrete scenario:** A product detail response may be cached by product ID and locale, but not by product ID alone if localized fields differ. A personalized dashboard has a different contract because the authenticated user changes the result.

**A practical implementation shape:**

```js
const cachePolicy = {
  resource: 'public-project-detail',
  keyInputs: ['projectId', 'locale'],
  freshForSeconds: 120,
  staleForSeconds: 60,
  invalidateOn: ['project.updated', 'project.deleted'],
};

function isCacheableProject(project) {
  return project.visibility === 'public' && project.status === 'published';
}
```

**Naive / wrong approach:**
```js
// Naive: “cache everything” has no correctness boundary.
await cache.set(`page:${request.url}`, JSON.stringify(responseBody));
```

**Correct approach:**
```js
// Correct: cache only a defined public representation with bounded freshness.
if (isCacheableProject(project)) {
  await cache.set(projectCacheKey(project.id, locale), JSON.stringify(project), { EX: 120 });
}
```

**How to reason about it:** Treat the cache as derived data. Decide whether a miss is cheap, whether stale data is acceptable, and whether invalidation can be retried. Measure behavior under concurrent requests rather than only testing a single request in a development process.

**Gotcha:** Start by naming the result, its inputs, its acceptable staleness, and the event that makes it obsolete.

**Review questions:**
- Which inputs define the cached representation?
- What event makes this value obsolete?
- What does the caller observe if the cache is empty or unavailable?

### 2. Cache keys encode every result-changing input

A cache key is a compact declaration of which requests are equivalent. If two requests can produce different correct answers, they must not collide in the cache.

**Concrete scenario:** Include tenant, user scope when appropriate, locale, query filters, schema version, and feature flags when they affect output. Normalize values before key generation so equivalent inputs do not fragment the cache.

**A practical implementation shape:**

```js
function projectCacheKey({ id, locale, tenantId, view }) {
  return ['project', 'v3', tenantId, id, locale, view].join(':');
}

const key = projectCacheKey({ id: 'p-204', locale: 'en-GB', tenantId: 'studio-7', view: 'public' });
```

**Naive / wrong approach:**
```js
// Naive: locale and tenant are omitted even though output differs.
const key = `project:${projectId}`;
```

**Correct approach:**
```js
// Correct: normalize and include all result-changing dimensions.
const key = projectCacheKey({ id: projectId, locale: normalizedLocale, tenantId: verifiedTenant.id, view: 'public' });
```

**How to reason about it:** Treat the cache as derived data. Decide whether a miss is cheap, whether stale data is acceptable, and whether invalidation can be retried. Measure behavior under concurrent requests rather than only testing a single request in a development process.

**Gotcha:** Keys that omit dimensions can leak data across tenants; keys that include irrelevant randomness destroy hit rate.

**Review questions:**
- Which inputs define the cached representation?
- What event makes this value obsolete?
- What does the caller observe if the cache is empty or unavailable?

### 3. Freshness: TTL, stale windows, and hard expiry

TTL limits how long an entry is considered fresh. Some systems permit serving stale data while refreshing; others must reject stale values. The right policy follows the business cost of old data.

**Concrete scenario:** A portfolio page can tolerate a few minutes of stale project metadata. A balance, access decision, or inventory reservation usually needs stricter consistency and should not be made safe merely by setting a short TTL.

**A practical implementation shape:**

```js
const policy = {
  freshForMs: 120_000,
  staleForMs: 60_000,
  hardExpiryMs: 600_000,
};

function freshness(entry, now = Date.now()) {
  if (now < entry.createdAt + policy.freshForMs) return 'fresh';
  if (now < entry.createdAt + policy.staleForMs + policy.freshForMs) return 'stale-allowed';
  return 'expired';
}
```

**Naive / wrong approach:**
```js
// Naive: one huge TTL is used for content, permissions, and inventory alike.
await cache.set(key, value, { EX: 86400 });
```

**Correct approach:**
```js
// Correct: freshness is selected from the business staleness budget.
await cache.set(publicProjectKey, serializedProject, { EX: 120 });
// Permission decisions still run against the authoritative access policy.
```

**How to reason about it:** Treat the cache as derived data. Decide whether a miss is cheap, whether stale data is acceptable, and whether invalidation can be retried. Measure behavior under concurrent requests rather than only testing a single request in a development process.

**Gotcha:** A short TTL is not a substitute for a defined invalidation event or consistency requirement.

**Review questions:**
- Which inputs define the cached representation?
- What event makes this value obsolete?
- What does the caller observe if the cache is empty or unavailable?

### 4. HTTP cache directives and shared intermediaries

HTTP caching uses request and response semantics across browsers, CDNs, and reverse proxies. `Cache-Control`, `ETag`, `Last-Modified`, `Vary`, and status codes jointly influence reuse.

**Concrete scenario:** Public, identical content can use shared caching. Private responses should explicitly prevent shared reuse or be keyed by a trustworthy authorization boundary. Never assume a CDN understands application-specific identity unless configured.

**A practical implementation shape:**

```js
res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=120, stale-while-revalidate=60');
res.setHeader('ETag', '"project-p204-v7"');

if (req.headers['if-none-match'] === '"project-p204-v7"') {
  res.statusCode = 304;
  res.end();
} else {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ id: 'p-204', title: 'Light in Motion' }));
}
```

**Naive / wrong approach:**
```js
// Naive: shared caches may reuse personalized output.
res.setHeader('Cache-Control', 'public, max-age=3600');
res.end(JSON.stringify({ accountName, projects }));
```

**Correct approach:**
```js
// Correct: shared caching is for the same public representation only.
res.setHeader('Cache-Control', 'private, no-store');
res.end(JSON.stringify({ accountName, projects }));
```

**How to reason about it:** Treat the cache as derived data. Decide whether a miss is cheap, whether stale data is acceptable, and whether invalidation can be retried. Measure behavior under concurrent requests rather than only testing a single request in a development process.

**Gotcha:** A `Vary` header can multiply cache variants; use only dimensions that genuinely change the representation.

**Review questions:**
- Which inputs define the cached representation?
- What event makes this value obsolete?
- What does the caller observe if the cache is empty or unavailable?

### 5. Application memory caches and process boundaries

An in-process map is fast but local to one process and disappears on restart. In serverless or horizontally scaled deployments, each instance can have a different cache view.

**Concrete scenario:** Use memory caching for immutable reference data or opportunistic request coalescing, not as the only source of truth for shared sessions, inventory, or distributed locks.

**A practical implementation shape:**

```js
const localCache = new Map();

function getLocal(key) {
  const entry = localCache.get(key);
  if (!entry || entry.expiresAt <= Date.now()) {
    localCache.delete(key);
    return null;
  }
  return entry.value;
}

function setLocal(key, value, ttlMs = 30_000) {
  localCache.set(key, { value, expiresAt: Date.now() + ttlMs });
}
```

**Naive / wrong approach:**
```js
// Naive: process memory is assumed to be shared by every replica.
const session = localCache.get(`session:${sessionId}`);
```

**Correct approach:**
```js
// Correct: local cache is an optimization, while shared state has a shared store.
const publicMetadata = getLocal(`country-list:v1`);
const session = await sessionStore.get(sessionId);
```

**How to reason about it:** Treat the cache as derived data. Decide whether a miss is cheap, whether stale data is acceptable, and whether invalidation can be retried. Measure behavior under concurrent requests rather than only testing a single request in a development process.

**Gotcha:** A local cache can hide stale-state bugs during development because every request reaches the same process.

**Review questions:**
- Which inputs define the cached representation?
- What event makes this value obsolete?
- What does the caller observe if the cache is empty or unavailable?

### 6. Distributed caches and Redis semantics

A shared cache lets multiple application instances reuse values, but introduces network latency, serialization, eviction, availability, and concurrency concerns.

**Concrete scenario:** Set bounded connection timeouts, TTLs, memory limits, namespaced keys, and explicit behavior when Redis is unavailable. Choose serialization formats deliberately and validate data when deserializing.

**A practical implementation shape:**

```js
const redisOptions = {
  socket: { connectTimeout: 500, reconnectStrategy: (attempt) => Math.min(attempt * 100, 1000) },
  commandsQueueMaxLength: 1000,
};

// The actual client is created once at process startup and reused.
const cacheNamespace = 'projecthub:prod';
```

**Naive / wrong approach:**
```js
// Naive: a new network client is created for every request.
async function readCache(key) {
  const redis = createRedisClient(process.env.REDIS_URL);
  return redis.get(key);
}
```

**Correct approach:**
```js
// Correct: reuse a configured client and place a deadline around cache operations.
const cached = await withTimeout(redis.get(`${cacheNamespace}:${key}`), 150);
```

**How to reason about it:** Treat the cache as derived data. Decide whether a miss is cheap, whether stale data is acceptable, and whether invalidation can be retried. Measure behavior under concurrent requests rather than only testing a single request in a development process.

**Gotcha:** A cache outage should not automatically become an outage for the whole product; decide which reads can fall back safely.

**Review questions:**
- Which inputs define the cached representation?
- What event makes this value obsolete?
- What does the caller observe if the cache is empty or unavailable?

### 7. Cache-aside: read, fill, invalidate

In cache-aside, the application checks the cache, loads from the database on a miss, stores the result, and returns it. Writes usually update the source of truth and invalidate affected keys.

**Concrete scenario:** This pattern is simple for product catalogs and article metadata. It needs careful invalidation when one entity appears in lists, search results, counts, and detail views.

**A practical implementation shape:**

```js
async function readThroughProject(id, cache, repository) {
  const key = `project:v2:${id}`;
  const hit = await cache.get(key);
  if (hit !== null) return JSON.parse(hit);
  const row = await repository.findPublishedById(id);
  if (!row) return null;
  await cache.set(key, JSON.stringify(row), { EX: 90 });
  return row;
}
```

**Naive / wrong approach:**
```js
// Naive: write new content but keep all cached representations forever.
await repository.update(projectId, changes);
return { ok: true };
```

**Correct approach:**
```js
// Correct: update the source and invalidate every dependent cache family.
await repository.update(projectId, changes);
await Promise.all([cache.del(projectKey), cache.del(featuredListKey), cache.del(categoryListKey)]);
```

**How to reason about it:** Treat the cache as derived data. Decide whether a miss is cheap, whether stale data is acceptable, and whether invalidation can be retried. Measure behavior under concurrent requests rather than only testing a single request in a development process.

**Gotcha:** Invalidating one detail key does not invalidate derived list caches unless the dependency graph is explicit.

**Review questions:**
- Which inputs define the cached representation?
- What event makes this value obsolete?
- What does the caller observe if the cache is empty or unavailable?

### 8. Write-through, write-behind, and refresh-ahead

Write-through updates cache as part of the write path; write-behind queues persistence later; refresh-ahead refreshes entries before expiry. These trade latency, durability, and complexity differently.

**Concrete scenario:** Write-through can suit tightly controlled data access. Write-behind requires durable queues and replay semantics. Refresh-ahead is useful for predictable hot keys where background refresh can safely recompute results.

**A practical implementation shape:**

```js
async function persistProject(changes) {
  const updated = await database.transaction(async (tx) => tx.projects.update(changes));
  await cache.del(`project:${updated.id}`);
  return updated;
}

// For write-behind, persist an event durably before acknowledging the request.
await outbox.insert({ type: 'ProjectChanged', aggregateId: updated.id });
```

**Naive / wrong approach:**
```js
// Naive: acknowledge before a non-durable background write is persisted.
queue.push({ type: 'SAVE', payload: updatedProject });
return { status: 'saved' };
```

**Correct approach:**
```js
// Correct: commit authoritative data first; queue optional refresh after durable commit.
const updated = await repository.updateInTransaction(changes);
await outbox.publishAfterCommit({ type: 'ProjectUpdated', id: updated.id });
```

**How to reason about it:** Treat the cache as derived data. Decide whether a miss is cheap, whether stale data is acceptable, and whether invalidation can be retried. Measure behavior under concurrent requests rather than only testing a single request in a development process.

**Gotcha:** Write-behind can acknowledge a write before durable storage and lose data if its queue is not durable.

**Review questions:**
- Which inputs define the cached representation?
- What event makes this value obsolete?
- What does the caller observe if the cache is empty or unavailable?

### 9. Stampedes, single-flight, and jitter

When a hot key expires, many concurrent requests may recompute the same expensive result. Coalescing collapses duplicate work; jitter spreads expirations across time.

**Concrete scenario:** Apply per-key single-flight around expensive database or API work and add randomized TTL offsets for large batches of similar entries. Bound waiting callers and ensure the leader failure wakes everyone.

**A practical implementation shape:**

```js
const inFlight = new Map();

async function singleFlight(key, load) {
  if (inFlight.has(key)) return inFlight.get(key);
  const promise = Promise.resolve().then(load);
  inFlight.set(key, promise);
  try { return await promise; }
  finally { if (inFlight.get(key) === promise) inFlight.delete(key); }
}
```

**Naive / wrong approach:**
```js
// Naive: every request misses and starts the same expensive query.
const value = await expensiveRecommendationQuery(userSegment);
```

**Correct approach:**
```js
// Correct: coalesce identical work within this process and add TTL jitter.
const value = await singleFlight(key, () => expensiveRecommendationQuery(userSegment));
await cache.set(key, JSON.stringify(value), { EX: ttlWithJitter(180, 30) });
```

**How to reason about it:** Treat the cache as derived data. Decide whether a miss is cheap, whether stale data is acceptable, and whether invalidation can be retried. Measure behavior under concurrent requests rather than only testing a single request in a development process.

**Gotcha:** A process-local single-flight only coordinates requests inside that process, not across all replicas.

**Review questions:**
- Which inputs define the cached representation?
- What event makes this value obsolete?
- What does the caller observe if the cache is empty or unavailable?

### 10. Negative caching and error-aware policies

Negative caching stores an absence result briefly, preventing repeated expensive misses. Errors should not be cached as if they were valid empty results unless that behavior is explicitly intended.

**Concrete scenario:** Cache a confirmed “slug not found” for a short period to protect a database from repeated bot requests. Avoid long negative TTLs when new content may appear under that key.

**A practical implementation shape:**

```js
const cachedResult = {
  kind: 'not-found',
  cachedAt: Date.now(),
};
await cache.set(`slug-miss:${slug}`, JSON.stringify(cachedResult), { EX: 15 });
```

**Naive / wrong approach:**
```js
// Naive: all exceptions become a cached empty list for an hour.
try { return await searchProjects(query); }
catch { await cache.set(key, '[]', { EX: 3600 }); return []; }
```

**Correct approach:**
```js
// Correct: cache only a confirmed absence; propagate transient failures.
const project = await repository.findBySlug(slug);
if (project === null) await cache.set(negativeKey(slug), 'not-found', { EX: 15 });
return project;
```

**How to reason about it:** Treat the cache as derived data. Decide whether a miss is cheap, whether stale data is acceptable, and whether invalidation can be retried. Measure behavior under concurrent requests rather than only testing a single request in a development process.

**Gotcha:** Caching a transient upstream 500 can amplify an incident by making recovery invisible after the upstream is healthy.

**Review questions:**
- Which inputs define the cached representation?
- What event makes this value obsolete?
- What does the caller observe if the cache is empty or unavailable?

### 11. Cache invalidation as dependency management

Invalidation is a graph problem: one write may affect detail pages, category pages, counts, recommendations, and rendered pages. Tags or dependency indexes can make this tractable.

**Concrete scenario:** After updating a project, invalidate the project detail, relevant category listing, featured-project set, and any aggregate whose output depends on it. Document the graph beside the write path.

**A practical implementation shape:**

```js
const dependencies = {
  project: (id) => [`project:${id}`, 'featured-projects', 'project-search'],
};

async function invalidateProject(cache, id) {
  for (const key of dependencies.project(id)) await cache.del(key);
}
```

**Naive / wrong approach:**
```js
// Naive: clear only the detail key, leaving cached listings stale.
await cache.del(`project:${projectId}`);
```

**Correct approach:**
```js
// Correct: invalidate the dependency set tied to the changed entity.
await invalidateProject(cache, projectId);
await cache.del(`category:${previousCategorySlug}`);
await cache.del(`category:${updated.categorySlug}`);
```

**How to reason about it:** Treat the cache as derived data. Decide whether a miss is cheap, whether stale data is acceptable, and whether invalidation can be retried. Measure behavior under concurrent requests rather than only testing a single request in a development process.

**Gotcha:** Broad “clear everything” invalidation can cause a thundering herd; narrow invalidation is more efficient but easier to get wrong.

**Review questions:**
- Which inputs define the cached representation?
- What event makes this value obsolete?
- What does the caller observe if the cache is empty or unavailable?

### 12. Personalization, tenancy, and privacy boundaries

A cache can become a cross-user data leak if a shared cache stores personalized content under a public key. Cache correctness includes authorization and privacy, not only matching values.

**Concrete scenario:** Separate public and private caches. For private data, derive the key from a validated identity and tenant scope, or avoid shared caching. Never trust a client-supplied user ID as the sole key boundary.

**A practical implementation shape:**

```js
function privateDashboardKey({ tenantId, userId }) {
  return `private-dashboard:v1:${tenantId}:${userId}`;
}

const cacheControl = 'private, no-store';
```

**Naive / wrong approach:**
```js
// Naive: user ID from the query string is trusted as cache identity.
const key = `dashboard:${req.query.userId}`;
```

**Correct approach:**
```js
// Correct: identity comes from validated server-side authentication.
const identity = await requireAuthenticatedUser(req);
const key = privateDashboardKey({ tenantId: identity.tenantId, userId: identity.id });
```

**How to reason about it:** Treat the cache as derived data. Decide whether a miss is cheap, whether stale data is acceptable, and whether invalidation can be retried. Measure behavior under concurrent requests rather than only testing a single request in a development process.

**Gotcha:** Adding `Vary: Cookie` indiscriminately can destroy shared cache efficiency and still does not replace authorization.

**Review questions:**
- Which inputs define the cached representation?
- What event makes this value obsolete?
- What does the caller observe if the cache is empty or unavailable?

### 13. Observability: hit rate is not enough

Hit rate describes reuse, but does not prove the cache helps. Measure latency, backend load, stale serves, evictions, error rate, payload size, and refresh cost together.

**Concrete scenario:** Tag metrics by cache tier and operation without exposing user IDs or sensitive key contents. Sample high-cardinality details rather than using raw keys as metric labels.

**A practical implementation shape:**

```js
metrics.increment('cache_request_total', { tier: 'redis', result: 'hit' });
metrics.observe('cache_lookup_duration_ms', elapsedMs, { tier: 'redis' });
metrics.increment('cache_stale_served_total', { resource: 'project-detail' });
```

**Naive / wrong approach:**
```js
// Naive: user IDs and full keys become metric labels.
metrics.increment('cache_hit', { key: `user:${userId}:dashboard` });
```

**Correct approach:**
```js
// Correct: bounded-cardinality labels, with sensitive detail in controlled logs if needed.
metrics.increment('cache_request_total', { tier: 'redis', result: 'miss' });
logger.debug('cache miss', { resource: 'project-detail', requestId });
```

**How to reason about it:** Treat the cache as derived data. Decide whether a miss is cheap, whether stale data is acceptable, and whether invalidation can be retried. Measure behavior under concurrent requests rather than only testing a single request in a development process.

**Gotcha:** A high hit rate can hide harmful stale data or a cache that saves little because hits are cheap anyway.

**Review questions:**
- Which inputs define the cached representation?
- What event makes this value obsolete?
- What does the caller observe if the cache is empty or unavailable?

### 14. Consistency, races, and versioned values

Concurrent writes and refreshes can reorder operations. Versioning, compare-and-set, fencing tokens, or atomic scripts may be required when stale writers can overwrite newer values.

**Concrete scenario:** For a mutable record, store a source version with the cached value and refuse to replace a newer version with an older refresh result. Use database transactions for business invariants; cache locks are not a substitute.

**A practical implementation shape:**

```js
const candidate = await repository.findById(id);
const current = await cache.getWithVersion(key);
if (!current || candidate.version >= current.version) {
  await cache.compareAndSet(key, current?.version ?? null, {
    version: candidate.version,
    value: candidate,
  });
}
```

**Naive / wrong approach:**
```js
// Naive: an old slow refresh overwrites a newer write.
const staleValue = await slowRepositoryRead(id);
await cache.set(key, JSON.stringify(staleValue));
```

**Correct approach:**
```js
// Correct: reject an older version and keep business invariants in the database.
await cache.writeIfVersionAtLeast(key, candidate.version, candidate);
// Transactions and unique constraints still enforce authoritative invariants.
```

**How to reason about it:** Treat the cache as derived data. Decide whether a miss is cheap, whether stale data is acceptable, and whether invalidation can be retried. Measure behavior under concurrent requests rather than only testing a single request in a development process.

**Gotcha:** Deleting a key after a write can race with an older in-flight read that repopulates stale data.

**Review questions:**
- Which inputs define the cached representation?
- What event makes this value obsolete?
- What does the caller observe if the cache is empty or unavailable?

### 15. Layered caching and end-to-end policy

Browser, CDN, framework, application, and database caches may all exist. Each layer needs a compatible freshness policy and a clear owner for invalidation.

**Concrete scenario:** A public project page may use browser revalidation, CDN caching, and an application cache, while its admin edit route bypasses public caching. Map the path from request to origin before tuning.

**A practical implementation shape:**

```js
const candidate = await repository.findById(id);
const current = await cache.getWithVersion(key);
if (!current || candidate.version >= current.version) {
  await cache.compareAndSet(key, current?.version ?? null, {
    version: candidate.version,
    value: candidate,
  });
}
```

**Naive / wrong approach:**
```js
// Naive: an old slow refresh overwrites a newer write.
const staleValue = await slowRepositoryRead(id);
await cache.set(key, JSON.stringify(staleValue));
```

**Correct approach:**
```js
// Correct: reject an older version and keep business invariants in the database.
await cache.writeIfVersionAtLeast(key, candidate.version, candidate);
// Transactions and unique constraints still enforce authoritative invariants.
```

**How to reason about it:** Treat the cache as derived data. Decide whether a miss is cheap, whether stale data is acceptable, and whether invalidation can be retried. Measure behavior under concurrent requests rather than only testing a single request in a development process.

**Gotcha:** A correct policy at one layer can be undermined by a more permissive upstream or downstream layer.

**Review questions:**
- Which inputs define the cached representation?
- What event makes this value obsolete?
- What does the caller observe if the cache is empty or unavailable?


---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Cache-aside with bounded TTL

**What it does:** Loads on demand and stores a successful source result for a limited period.

**When to use it:** Use it for project details or public catalog records where occasional bounded staleness is acceptable.

```js
async function getProject(projectId, cache, repository) {
  const key = `project:v3:${projectId}`;
  const cached = await cache.get(key);
  if (cached !== null) return JSON.parse(cached);
  const project = await repository.findById(projectId);
  if (!project) return null;
  await cache.set(key, JSON.stringify(project), { EX: 120 });
  return project;
}
```

Do not cache transient database errors as `null`; distinguish not-found from unavailable. A production adapter should validate deserialized values and enforce a timeout.

### Pattern 2: Write then invalidate

**What it does:** Commits the authoritative update, then removes the cached representation.

**When to use it:** Use it when editing a project should make the next read fetch the updated row.

```js
async function updateProject(projectId, changes, repository, cache) {
  const updated = await repository.update(projectId, changes);
  await cache.del(`project:v3:${projectId}`);
  await cache.del(`project-list:v2:featured`);
  return updated;
}
```

If invalidation fails after the database commits, record a retryable invalidation event or use an outbox. The returned write can succeed while a stale cache remains otherwise.

### Pattern 3: TTL jitter for synchronized expiry

**What it does:** Adds bounded randomness to expiration so a batch of keys does not all expire together.

**When to use it:** Use it when thousands of records are warmed at once or generated with the same nominal TTL.

```js
function ttlWithJitter(baseSeconds, spreadSeconds = 30) {
  if (baseSeconds < 1 || spreadSeconds < 0) throw new RangeError('Invalid TTL');
  return baseSeconds + Math.floor(Math.random() * (spreadSeconds + 1));
}

await redis.set(cacheKey, JSON.stringify(payload), {
  EX: ttlWithJitter(300, 45),
});
```

Jitter smooths load; it does not eliminate duplicate work for one extremely hot key. Combine it with request coalescing when necessary.

### Pattern 4: Stale-while-revalidate response

**What it does:** Serves a previously computed value within a bounded stale window while refresh happens in the background.

**When to use it:** Use it for noncritical public content where low latency is more valuable than immediate freshness.

```js
async function readWithRefresh(key, store, load) {
  const entry = await store.get(key);
  if (entry && Date.now() < entry.staleUntil) {
    if (Date.now() >= entry.freshUntil) {
      void refreshOnce(key, store, load).catch((error) => {
        console.error('Background cache refresh failed', { key, message: error.message });
      });
    }
    return { value: entry.value, stale: Date.now() >= entry.freshUntil };
  }
  return { value: await refreshOnce(key, store, load), stale: false };
}
```

The storage adapter must implement `refreshOnce` with single-flight semantics and atomic replacement. Never apply this policy to authorization or financial decisions.

### Pattern 5: HTTP validator with ETag

**What it does:** Allows clients to revalidate a representation without downloading its full body when unchanged.

**When to use it:** Use it for stable public JSON or portfolio content that clients may revisit frequently.

```js
import { createHash } from 'node:crypto';

function etagFor(body) {
  return `"${createHash('sha256').update(body).digest('base64url')}"`;
}

function sendProjectJson(req, res, project) {
  const body = JSON.stringify(project);
  const etag = etagFor(body);
  res.setHeader('ETag', etag);
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=120, stale-while-revalidate=60');
  if (req.headers['if-none-match'] === etag) return res.status(304).end();
  return res.status(200).type('application/json').send(body);
}
```

The ETag must correspond to the selected representation, including relevant locale or content encoding variants. Private responses need a private policy.

### Pattern 6: Tag-based invalidation

**What it does:** Associates cached outputs with semantic tags so one content update can invalidate several dependent representations.

**When to use it:** Use it in frameworks or cache layers that support tags when an item appears on multiple cached pages and query results.

```js
const projectTag = (id) => `project:${id}`;
const categoryTag = (slug) => `category:${slug}`;

async function saveProject(project, repository, cacheTags) {
  const saved = await repository.save(project);
  await cacheTags.invalidate(projectTag(saved.id));
  await cacheTags.invalidate(categoryTag(saved.categorySlug));
  await cacheTags.invalidate('featured-projects');
  return saved;
}
```

Tags are a dependency index, not magic. Confirm that every cached query is tagged and that invalidation is supported in the deployed framework/runtime.

### Pattern 7: Graceful cache bypass

**What it does:** Falls back to the source when cache infrastructure is unavailable, but only for operations whose source can absorb the load.

**When to use it:** Use it for optional public metadata cache; choose a fail-closed or explicit unavailable response for critical controls and overloaded databases.

```js
async function safeCachedRead(cache, repository, key, id) {
  try {
    const value = await cache.get(key);
    if (value !== null) return JSON.parse(value);
  } catch (error) {
    console.warn('Cache read failed; using bounded origin path', { message: error.message });
  }
  return repository.findByIdWithTimeout(id, { timeoutMs: 800 });
}
```

Fallbacks must be bounded by origin timeouts, concurrency limits, and circuit breaking. Otherwise a cache outage can overload the database.


---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Using one key for all locales | The representation differs by locale, but the key pretends requests are equivalent. | Add a normalized locale segment and test two locales against the same resource. |
| Caching authenticated dashboards publicly | A shared cache may replay one user’s data to another request. | Set `Cache-Control: private, no-store` and avoid a shared CDN cache for this route. |
| Setting TTL without invalidation | A successful write can remain invisible until the expiry clock runs out. | Invalidate entity and dependent list keys after commit, with a retryable outbox if needed. |
| Caching database exceptions as empty data | A transient outage is converted into a plausible but false empty result. | Cache only successful values and confirmed not-found outcomes; propagate infrastructure errors. |
| Using process memory as distributed truth | Each replica owns a different map and restarts erase it. | Move shared sessions and cross-instance coordination to a shared durable store. |
| Letting every miss hit origin at once | Concurrent misses multiply expensive work during expiry or traffic spikes. | Wrap recomputation in per-key single-flight and cap concurrent origin requests. |
| Setting identical TTLs on bulk-warmed keys | Synchronized expiration creates a predictable burst of origin traffic. | Apply bounded TTL jitter to bulk-created entries. |
| Deleting only a detail key | Search results and category lists still contain the old entity state. | Maintain a dependency list or semantic tags for all derived representations. |
| Trusting a client-supplied identity in a key | An attacker can choose another user’s key or create misleading variants. | Derive private cache identity from the validated server-side session or token claims. |
| Failing open on cache outage without limits | Every request floods the database when the cache is down. | Use origin timeouts, concurrency bulkheads, and a circuit breaker on the fallback path. |
| Caching unbounded payloads | Large serialized values consume memory and increase network and parse latency. | Enforce a maximum payload size and cache a compact DTO rather than an entire ORM graph. |
| Ignoring serialization changes | New code cannot safely parse older cached object shapes. | Version key namespaces such as `project:v3:` when serialized contracts change. |
| Assuming `no-cache` means no storage | The directive allows storage but requires revalidation before reuse. | Use `no-store` when compliant caches must not store the response. |
| Using raw cache keys as metric labels | Every unique key can create a separate time series and overload monitoring. | Record low-cardinality labels such as tier, operation, resource type, and outcome. |
| Allowing an old refresh to overwrite a newer write | A slow read completes after a newer update and repopulates stale data. | Store source versions and use compare-and-set or a version-aware write operation. |
| Treating cache locks as database transactions | A lock can expire or be lost while a worker is still running. | Enforce invariants with database transactions, constraints, and idempotent writes. |
| Serving stale authorization decisions | Revoked access can remain valid if permissions are cached too broadly. | Re-check authorization against the required source of truth or use explicit revocation-aware invalidation. |
| Failing to test the deployed cache layer | Local tests bypass CDN and framework caching differences. | Run staging tests that inspect actual response headers and repeat requests through the production-like path. |

**Before → after: cache a public representation without confusing private data**

```js
// Before: a shared response contains a user-specific dashboard.
res.setHeader("Cache-Control", "public, max-age=600");
res.end(JSON.stringify({ user: session.user, projects: dashboardProjects }));
```

```js
// After: private data is not stored by shared or browser caches.
res.setHeader("Cache-Control", "private, no-store");
res.end(JSON.stringify({ user: session.user, projects: dashboardProjects }));
```


---

## Mental Models

1. **A cache is a promise** — Every cached value promises that its identity and freshness rules still apply.

2. **Keys define equivalence** — If two requests can produce different valid answers, they need different cache identities.

3. **TTL is a limit, not a plan** — Expiration bounds reuse; invalidation keeps important updates visible.

4. **Derived data can be rebuilt** — The source of truth remains authoritative; cached data must be safe to discard.

5. **Every cache has a failure mode** — Decide whether a miss, timeout, or outage causes fallback, stale service, or explicit failure.

6. **Privacy is part of correctness** — A fast response delivered to the wrong person is a severe cache bug, not a performance success.

7. **Invalidation follows dependencies** — Think beyond the entity page to lists, counts, search, and rendered routes.

8. **Measure the whole path** — A hit rate is meaningful only beside latency, origin load, freshness, and failure metrics.


---

## Quick Reference

| Property/Situation | Value/Answer | Notes |
|---|---|---|
| Public immutable asset | `public, max-age=31536000, immutable` | Only when URL changes whenever content changes. |
| Public dynamic page | `public, s-maxage=120, stale-while-revalidate=60` | CDN directives vary by provider; verify actual behavior. |
| Private response | `private, no-store` | Use for highly sensitive or user-specific responses when reuse is unsafe. |
| Force revalidation | `no-cache` | Allows storage but requires validation before reuse; not the same as `no-store`. |
| Prevent storage | `no-store` | Use when a response must not be stored by compliant caches. |
| Entity validator | `ETag: "..."` | Return 304 when If-None-Match matches and representation is unchanged. |
| Last modification validator | `Last-Modified: ...` | Lower precision than ETag; compare HTTP dates carefully. |
| Cache key prefix | `project:v3:<id>` | Version keys when schema or serialized shape changes. |
| Redis expiration | `EX 120` | Set TTL on write rather than relying on later cleanup. |
| Cache stampede | Single-flight + TTL jitter | Distributed hot keys may need coordination across instances. |
| Missing record | Short negative TTL | Do not conflate 404 with a transient upstream failure. |
| Write invalidation | Commit source, then invalidate | Use an outbox/retry path if invalidation reliability matters. |
| Tenant isolation | Include validated tenant scope | Never key private records by untrusted client identifiers. |
| Cache observability | Hit/miss, latency, stale, evictions | Avoid raw cache keys as high-cardinality metric labels. |
| Redis outage | Bounded fallback or explicit failure | Do not let all requests overwhelm the database at once. |
| Request variation | `Vary: Accept-Language` | Only declare dimensions that change the selected representation. |
| Browser cache debugging | Inspect response headers and DevTools | CDN behavior may differ from local development. |
| Framework cache | Use documented APIs for installed version | Semantics differ between framework versions and runtimes. |
| Stale refresh failure | Keep last known good value within policy | Expose refresh failures in telemetry; avoid infinite stale serving. |
| Sensitive values | Do not cache tokens or secrets casually | Encryption does not fix incorrect access boundaries. |
| Cache payload size | Set size limits and serialize deliberately | Large values can increase latency and eviction pressure. |
| Cache correctness test | Assert key isolation and invalidation | A high hit rate alone is not a correctness test. |
| Negative result policy | Cache confirmed absence separately | Keep its TTL short if new records can appear. |
| Layered cache map | Document browser → CDN → app → DB | Set coherent freshness and invalidation expectations. |

---

## Build Challenge

### Build: ProjectHub Multi-Layer Cache Reliability Lab

Build a public project catalog and a private creator dashboard with measurable cache behavior. The challenge proves you can make content fast without allowing stale edits, tenant leakage, or a cache outage to cascade into the database. Use a real database repository and a cache adapter; keep cache policy explicit and observable.

**Requirements**

1. Create a cache policy document for project detail, featured list, category list, and creator dashboard routes.

2. Implement a versioned cache-key builder that includes locale and tenant scope wherever they change output.

3. Implement cache-aside reads with a bounded TTL and distinguish a cache miss from a confirmed not-found result.

4. Add write-then-invalidate behavior for project title, category, publication status, and deletion changes.

5. Invalidate at least three dependent representations when a featured project changes.

6. Add TTL jitter to a bulk warm operation and document why jitter alone does not prevent a hot-key stampede.

7. Implement per-key single-flight for an expensive featured-project query and test concurrent misses.

8. Add an ETag or framework-supported HTTP revalidation path for a public project detail response.

9. Prove private dashboard responses cannot be served from a shared public cache and derive identity server-side.

10. Inject a Redis timeout and verify the documented bounded fallback or explicit unavailable behavior.

11. Inject a transient database error and verify that it is not cached as an empty successful result.

12. Create a race test in which an older refresh completes after a newer write; prevent stale overwrite with versioning or invalidation retry.

13. Expose cache hit, miss, latency, stale-served, eviction, and refresh-failure metrics without raw user IDs in labels.

14. Write staging instructions to verify headers and cache behavior through the same CDN or reverse proxy used in deployment.


**Expected output / definition of success**

- The second request for an unchanged public project returns a cache hit and reduces origin reads.

- Updating a project makes the changed detail and dependent listings visible within the documented freshness promise.

- Requests for two locales or tenants never collide when the representation differs.

- Private dashboard data is not stored in a shared cache and cannot be fetched by another identity.

- A cache outage does not create unbounded database concurrency or indefinite request hangs.

- A transient database failure does not poison the cache with an empty result.

- The concurrent-miss test shows a single refresh per key per process and records the limitation across replicas.

- Metrics reveal hit rate, origin latency, stale responses, and cache errors without high-cardinality sensitive labels.

- A README explains key design, TTL selection, invalidation dependencies, failure policy, and deployment verification.


**Suggested focused-session plan:** 45 minutes to map representations and freshness promises; 75 minutes for cache-aside and invalidation; 45 minutes for key isolation and HTTP validators; 60 minutes for concurrency and outage tests; 45 minutes for metrics, staging verification, and documentation. Total: approximately 4.5 hours.


---

## Production Review Checklist

- [ ] Every cached representation has a named owner and freshness promise.

- [ ] Every key contains all inputs that change the correct response.

- [ ] Public and private data have distinct cache policies and tests.

- [ ] Writes have a documented invalidation path, including derived lists and aggregates.

- [ ] Cache operations have bounded timeouts and payload sizes.

- [ ] Origin fallback is concurrency-limited and appropriate for the source system.

- [ ] Expiration behavior is tested under concurrent load, not just single requests.

- [ ] Negative results and transient failures use different policies.

- [ ] Serialization has a versioning strategy and validates values on read.

- [ ] Observability covers cache latency, hit/miss, stale service, refresh failures, and origin impact.

- [ ] Framework and CDN behavior is verified against the actual deployed versions and configuration.

- [ ] Business invariants remain enforced by the authoritative database or service, not by cache state.

