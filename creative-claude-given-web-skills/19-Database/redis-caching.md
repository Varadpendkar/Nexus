# SKILL: redis-caching

**Layer:** `layer-19-database`  
**Goal:** Design, implement, and operate Redis-backed caching safely, choosing the right cache pattern, defining expiration and invalidation rules, protecting the origin database, and measuring whether caching improves the complete application.

## 1. The Senior Engineer's Perspective

Redis caching is not simply “put a value in Redis and read it later.” It is a distributed-systems design choice that introduces a second copy of data, new failure modes, consistency questions, operational costs, and a new dependency in the request path. A successful cache makes a product faster or more resilient without silently serving unacceptable data or overwhelming the database when the cache is cold.

The first question is not “Which Redis command should I use?” It is “What is expensive, how often is it repeated, and how stale may the answer be?” A cache is valuable when the cost of computing or retrieving a value repeatedly is greater than the cost of storing, retrieving, refreshing, and invalidating it. Caching a cheap query that is rarely repeated can make the system more complex without delivering a meaningful benefit.

A senior engineer evaluates:

- **Workload:** Which reads are frequent, expensive, or bursty? What proportion of requests repeat the same keys?
- **Freshness:** Is a few seconds of staleness acceptable, or must every read reflect the latest committed write?
- **Correctness:** What happens if an entry is missing, malformed, stale, or unavailable?
- **Failure behavior:** Can the application fall back to the database, and can that database survive the resulting traffic?
- **Key design:** Do keys represent stable identities, include relevant parameters, and avoid collisions between tenants or environments?
- **Capacity:** How much memory do values and metadata consume, and what is evicted when Redis reaches its limit?
- **Security:** Can one user's cached response leak into another user's response? Are secrets or sensitive records stored unnecessarily?
- **Measurement:** Does caching improve p95/p99 latency, database load, throughput, or cost under realistic traffic?
- **Operations:** Who monitors hit rate, evictions, memory, latency, connection saturation, and cache failures?

The core principle is: **a cache is an optimization, not the source of truth, unless the architecture explicitly makes Redis the authoritative datastore.** In the common cache-aside pattern, the database remains authoritative and Redis can be repopulated after loss.

### A disciplined caching workflow

1. Establish a baseline for the endpoint and its database work.
2. Identify a repeated and expensive read or computation.
3. Define an explicit freshness and consistency requirement.
4. Choose a cache pattern that matches the workload.
5. Design deterministic keys and a bounded value format.
6. Add expiration, invalidation, and failure handling.
7. Test cold-cache, warm-cache, concurrent-miss, and Redis-unavailable cases.
8. Measure user-visible latency and origin load.
9. Roll out gradually and watch for regressions.
10. Document the contract: what is cached, for how long, and how it is refreshed.

Do not add Redis because it is fashionable. Add it when a measured bottleneck and a clear consistency contract justify the extra system.

## 2. Core Concepts

### 2.1 What Redis is—and what a cache is not

Redis is an in-memory data store with data structures such as strings, hashes, lists, sets, sorted sets, streams, and more. It is often used for low-latency lookups, caching, rate limiting, coordination, queues, and ephemeral state. Redis persistence and deployment choices vary; do not assume every Redis installation is purely ephemeral or that every deployment provides the same durability guarantees.

A cache stores a copy or derived representation of data to avoid repeated expensive work. The origin might be PostgreSQL, MongoDB, a remote API, a template renderer, or a machine-learning inference service. The cached representation may be a serialized object, a list of IDs, a computed aggregate, or a rendered response.

The cache's value depends on reuse. If each request has a unique key, hit rate may be near zero. If a value changes constantly and must be synchronously invalidated, the coordination cost may exceed the benefit. If a cached response is user-specific, key construction must preserve authorization boundaries.

### 2.2 Cache hit, miss, and hit rate

A **hit** occurs when the requested key has a usable cached value. A **miss** occurs when it does not. A simple hit-rate estimate is:

\[
\text{hit rate} = \frac{\text{hits}}{\text{hits} + \text{misses}}
\]

A high hit rate is useful but not sufficient. A cache can have a 99% hit rate and still be wrong if it leaks tenant data or serves stale permissions. Conversely, a low hit rate may still help if the few hits avoid exceptionally expensive work. Track hit rate by workload or key family, not only as a single global number.

Also distinguish a cache miss from an error. A miss is an expected state. A timeout, connection failure, authentication error, or deserialization exception is an operational or data-quality event and should be observable separately.

### 2.3 Cache-aside (lazy loading)

Cache-aside is a common pattern:

1. Application reads the key from Redis.
2. On a hit, it returns the cached value.
3. On a miss, it reads from the authoritative source.
4. It stores the result in Redis with a TTL.
5. It returns the result.

The application controls the flow. The database is not automatically notified of Redis changes, so writes need an invalidation or refresh strategy. Cache-aside is straightforward and usually a strong starting point for read-heavy applications.

Pseudo-code:

```text
get(key):
    value = cache.get(key)
    if value exists:
        return decode(value)

    value = database.read(key)
    if value exists:
        cache.set(key, encode(value), ttl)
    return value
```

Important details: define what “exists” means, avoid caching transient database errors as successful empty results, apply a TTL, and consider what happens when many requests miss simultaneously.

### 2.4 Time to live (TTL)

A TTL limits how long an entry remains available before expiration. TTLs are a safety boundary against indefinitely stale data and a capacity-management tool. They are not a complete invalidation strategy: a ten-minute TTL still means a value may be stale for almost ten minutes unless a write invalidates it sooner.

Choose TTL based on the business freshness contract, update frequency, cost of recomputation, and acceptable stale window. A public category list may tolerate minutes. A user's account balance or permission decision may require a different design or no ordinary response cache at all.

TTL jitter spreads expiration times to avoid a large set of keys expiring at the same instant:

```python
import random

base_ttl_seconds = 300
ttl = base_ttl_seconds + random.randint(0, 45)
```

Do not use random jitter to obscure an undefined freshness requirement. It should smooth load while remaining inside the accepted freshness window.

### 2.5 Cache invalidation

Invalidation removes or updates a cached copy after the underlying data changes. It is difficult because the application must know which keys represent the changed data, and multiple processes may race.

Common approaches:

- **Delete on write:** update the database, then delete affected cache keys.
- **Write-through/update cache:** write the database and update the cached representation.
- **Short TTL:** allow stale entries to expire naturally.
- **Versioned keys:** include a data version in the key so a new version becomes a new cache entry.
- **Event-driven invalidation:** publish changes and let consumers invalidate related entries.
- **Tag/index-based invalidation:** maintain a mapping from a logical entity or tag to affected keys; useful but adds bookkeeping.

For cache-aside, deleting the entry after a successful database commit is often a practical baseline. But it does not create perfect consistency. If the delete fails, stale data remains until TTL expiry. If the delete happens before the database commit, another request can refill the cache from the old database value. The order and failure handling matter.

### 2.6 Cache stampedes and thundering herds

A cache stampede happens when a popular key expires or is evicted and many requests recompute it at once. The resulting burst can overwhelm the database or downstream API—the very dependency the cache was intended to protect.

Mitigations include:

- TTL jitter so many keys do not expire together.
- Per-key single-flight or request coalescing so only one local request recomputes a key.
- A distributed lock or lease for expensive cross-process recomputation, used carefully.
- Stale-while-revalidate, where a slightly stale value can be served while one worker refreshes it.
- Background refresh for known hot keys.
- A bounded fallback and concurrency limit to protect the origin.

A lock is not magic. It needs an expiration, safe ownership semantics, and a fallback when the lock holder crashes. A lock that waits indefinitely can be worse than a stampede.

### 2.7 Negative caching

Negative caching stores the fact that a lookup found no result—for example, that a username or public slug does not exist. It can protect the origin from repeated misses or scans. Use a shorter TTL than a normal positive entry when a new record might be created soon.

Never turn every exception into a negative cache entry. “Record not found” is not the same as “database unavailable,” “permission denied,” or “query timed out.” Cache only well-defined negative outcomes, and ensure a newly created record invalidates the negative entry.

### 2.8 Serialization and value shape

Redis stores bytes or strings for many common operations. The application must define a stable encoding: JSON, MessagePack, protobuf, or another format appropriate to the system. JSON is readable and easy to debug, but it has type limitations and may use more bytes than a binary format.

Include a schema/version marker when cached objects can outlive deployments:

```json
{
  "schemaVersion": 2,
  "data": {
    "id": "product_42",
    "name": "Desk lamp",
    "price": 1299
  }
}
```

If a deployment changes the value structure, old cached entries can cause parsing failures. Options include versioned key namespaces, versioned payloads with compatibility logic, or a deliberate cache flush during a controlled deployment. Prefer rolling-compatible changes when flushing would cause a traffic spike.

Avoid caching enormous objects when a smaller representation is enough. Large values increase network transfer, memory pressure, serialization cost, and tail latency.

### 2.9 Key design and namespaces

A key should be deterministic, unambiguous, and scoped to the data it represents. Include relevant query parameters, locale, tenant, permissions scope, and representation version. Use a namespace such as `prod:catalog:v2:product:42` to reduce collisions and make operational inspection easier.

Bad key: `user:profile`—which user's profile?  
Better key: `prod:tenant:acme:user:42:profile:v2`

When constructing keys from user input, normalize and bound input length. Do not put secrets, raw session tokens, or unnecessary personal information in key names. Keys can appear in logs, monitoring tools, diagnostic dumps, and operational dashboards.

For query-result caching, every parameter that affects the result must affect the key. A search for page 1 sorted by price must not collide with page 2 sorted by rating. The safest strategy is a canonical representation of the query inputs followed by a stable hash when the full key would be too long.

### 2.10 Cache consistency models

Caching introduces a period in which the copy may differ from the origin. Be precise about the consistency model:

- **Eventual consistency:** cached data converges after invalidation or expiration, but a brief stale window is accepted.
- **Bounded staleness:** the system promises an upper bound on how old a cached value can be, subject to documented failure behavior.
- **Read-your-writes:** after a user updates data, that same user should see the change. This may require bypassing cache, updating it, or versioning it.
- **Strong consistency:** every read reflects the latest committed state. Ordinary distributed cache-aside usually does not provide this guarantee by itself.

Do not use a generic TTL as a substitute for stating the consistency requirement. Product requirements should say what users may observe after an update.

## 3. Redis Setup and Practical Access

### 3.1 Local development and connection configuration

Run Redis locally using a supported installation method or a development container. In a team, prefer a documented, reproducible setup rather than relying on one developer's machine state. Production should use a managed or properly operated deployment with authentication, network controls, monitoring, and an explicit persistence/availability policy.

Keep connection settings in environment variables:

```bash
REDIS_URL=redis://localhost:6379/0
CACHE_TTL_SECONDS=300
```

The example is for local development only. Production URLs may require TLS and authentication, and secrets should be stored in the platform's secret manager rather than committed to source control.

Application startup should validate configuration without logging credentials. Set connection and socket timeouts appropriate to the latency budget. Reuse a connection pool rather than creating a new connection for every request.

### 3.2 Python example with redis-py

Install the client:

```bash
pip install redis
```

Create a shared client using environment configuration:

```python
import os
import redis

redis_client = redis.Redis.from_url(
    os.environ["REDIS_URL"],
    decode_responses=True,
    socket_connect_timeout=0.5,
    socket_timeout=0.5,
    health_check_interval=30,
)
```

`decode_responses=True` makes string responses easier to use. For binary serialization, keep byte responses and decode explicitly. Configure connection pool size according to concurrency and Redis limits; an oversized pool can amplify pressure rather than solve it.

A small JSON helper:

```python
import json

def cache_get_json(key: str):
    raw = redis_client.get(key)
    if raw is None:
        return None
    return json.loads(raw)

def cache_set_json(key: str, value, ttl_seconds: int) -> None:
    payload = json.dumps(value, separators=(",", ":"))
    redis_client.set(key, payload, ex=ttl_seconds)
```

This helper is illustrative, not a complete production abstraction. It does not handle serialization errors, schema versions, observability, cache bypass, or outages. Production code should make those policies explicit rather than hiding them inside a generic helper.

### 3.3 Basic Redis commands

```text
PING
GET product:42
SET product:42 '{"id":42,"name":"Lamp"}' EX 300
TTL product:42
DEL product:42
EXISTS product:42
INCR rate:client:abc
```

`SET ... EX` writes a value and its expiry in one command, avoiding the gap that can occur when setting a key and adding expiration separately. `TTL` helps inspect remaining lifetime, but production diagnostics should avoid scanning or dumping large keyspaces during peak load.

Redis commands have different complexity characteristics. Avoid treating `KEYS *` as a harmless inspection command on a large production instance; it can block Redis while scanning the keyspace. Use `SCAN` carefully for incremental operational tasks, or maintain a deliberate index if you need to enumerate a specific family of keys.

### 3.4 Connection and timeout discipline

A Redis call is network I/O. Even if the server is in memory, network delays, connection setup, queueing, and large payloads still matter. Use a shared client and bounded timeouts. A cache timeout should not consume the entire endpoint latency budget.

Set timeout values based on measurements and the architecture. A 500 ms cache timeout may be unacceptable in an endpoint with a 200 ms target. On the other hand, an extremely low timeout can cause unnecessary fallback traffic during normal jitter. Tune using latency distributions and load tests.

If a request makes several independent Redis calls, consider pipelining where it reduces round trips. Do not pipeline unbounded amounts of data or combine operations in a way that changes correctness assumptions.

## 4. The Cache-Aside Pattern in Production

### 4.1 A small, explicit repository boundary

Keep caching logic near the data-access boundary rather than scattering Redis calls throughout controllers and templates. This makes key construction, serialization, TTL, and invalidation testable. The repository can expose `get_product(id)` while hiding whether the value came from Redis or the database.

Illustrative Python:

```python
import json
import random

PRODUCT_TTL = 300
PRODUCT_KEY = "app:catalog:v2:product:{product_id}"

def get_product(product_id, db, cache):
    key = PRODUCT_KEY.format(product_id=product_id)

    try:
        raw = cache.get(key)
        if raw is not None:
            return json.loads(raw)
    except Exception:
        # Record a metric/log with the exception class; do not log secrets.
        pass

    product = db.fetch_product(product_id)
    if product is None:
        return None

    payload = json.dumps(product, separators=(",", ":"))
    ttl = PRODUCT_TTL + random.randint(0, 30)

    try:
        cache.set(key, payload, ex=ttl)
    except Exception:
        # Cache population failure should not discard a valid DB result.
        pass

    return product
```

The broad exception handling here is a teaching simplification. In production, catch the Redis client's expected connection/timeout exceptions and JSON decoding errors separately, emit structured telemetry, and decide whether malformed cached data should be deleted. Do not swallow programming errors indiscriminately.

### 4.2 Read path and write path must agree

A cache key is a contract shared by readers and writers. If `get_product` reads `app:catalog:v2:product:42`, the update path must know that this key is affected by a product update. When a product changes:

1. Validate the request.
2. Commit the database transaction.
3. Invalidate or refresh the cache.
4. Return the result with behavior consistent with the product's freshness contract.

For strict read-your-writes behavior, simply deleting after commit may still race with concurrent reads. For many product catalog or content pages, a short stale window is acceptable. For critical state, consider bypassing the cache on the writer's subsequent read or using a versioned design.

A common anti-pattern is to update Redis first and then write the database. If the database write fails, the cache may advertise a change that never committed. Another is to invalidate before the database commit, allowing a concurrent miss to refill from the old committed value. Design the order around the database's transaction boundary.

### 4.3 Cache query results carefully

Caching a list or search result is harder than caching one entity. The key must include filters, pagination, sort order, tenant, locale, and any visibility rules. If the result contains IDs, the application may still need to fetch current entities; if it contains full objects, invalidation becomes more complex because one entity can appear in many result keys.

Possible approaches:

- Cache stable, popular query results with short TTLs.
- Cache only IDs and hydrate them separately when entity freshness matters.
- Use versioned collection keys when a whole collection changes.
- Avoid caching high-cardinality search queries with little reuse.
- Use a dedicated search engine or database index if the underlying query pattern is fundamentally unsuitable.

Do not cache an authorization-filtered result using a key that omits the user's permission scope. This can turn a performance optimization into a data leak.

## 5. Advanced Patterns

### Pattern 1 — Stale-While-Revalidate

**Use when:** A slightly stale response is acceptable, the key is popular, and recomputation is expensive.

**Idea:** Store both the payload and freshness metadata. Before the soft-expiry time, serve normally. After soft expiry but before hard expiry, return the stale payload and schedule or trigger one refresh. After hard expiry, wait for a refresh or use a controlled fallback.

A conceptual record:

```json
{
  "data": {"count": 1842},
  "freshUntil": 1790000000,
  "hardExpiresAt": 1790000300
}
```

The timestamps above are illustrative. A production implementation must use a consistent clock strategy, define what happens if refresh fails, and avoid scheduling a refresh for every request. Use a per-key refresh guard or queue, and bound the number of concurrent refresh jobs.

**Trade-offs:** The user may receive stale data by design. This is not suitable for authorization decisions, payment state, or other values whose correctness cannot tolerate stale reads. Document the stale window and expose refresh failures in telemetry.

### Pattern 2 — Single-flight request coalescing

**Use when:** Many concurrent requests in one application process miss on the same expensive key.

**Idea:** The first request performs the load. Other requests for the same key await the same in-flight operation rather than issuing duplicate database calls.

Pseudo-code:

```text
if cache has key:
    return value

if a load for key is already in flight:
    await that load
else:
    register in-flight load
    try:
        value = origin.load(key)
        cache value
        resolve waiting requests
    finally:
        remove in-flight marker
```

The exact implementation depends on the language's async/runtime model. Ensure errors reach all waiters, cancellation does not leave a permanent in-flight marker, and one caller's cancellation does not accidentally cancel work required by others. Local single-flight protects one process only; ten application replicas can still perform ten origin loads. A distributed lease may help for exceptionally expensive keys, but adds complexity and must fail safely.

### Pattern 3 — Distributed lock for expensive refresh

**Use when:** Cross-process duplicate recomputation is costly enough to justify coordination.

A common Redis locking primitive uses a unique random token and an expiry:

```text
SET lock:report:weekly <unique-token> NX PX 10000
```

`NX` means only set if the key does not exist; `PX` specifies expiry in milliseconds. If the operation succeeds, the worker owns a short lease. Release must verify that the token still matches; blindly deleting the lock can remove a newer worker's lock after the original lease expires.

Conceptual release:

```lua
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
else
  return 0
end
```

This pattern is a coordination aid, not a universal correctness guarantee. The lease may expire while work is still running, clocks and pauses can complicate timing, and Redis failover semantics matter. Keep the critical section bounded, make refresh idempotent, and have a fallback for lock contention. For correctness-critical distributed coordination, evaluate stronger primitives and the system's actual failure model.

### Pattern 4 — Versioned cache keys

**Use when:** You need to make old entries unreachable after a data or schema change without enumerating every dependent key.

Instead of `catalog:featured`, use a key such as `catalog:v17:featured`. A separate version pointer identifies the active generation. When content changes, increment the version or publish a new generation. Readers use only the active version, leaving old keys to expire naturally.

This reduces invalidation complexity but introduces coordination around the version pointer and may leave old values occupying memory until expiry or eviction. If the pointer itself is cached, the design can reintroduce staleness. Keep version changes atomic where possible and define how readers behave during rollout.

### Pattern 5 — Cache warming and background refresh

**Use when:** A known set of hot keys is expensive to calculate and cold-cache latency is unacceptable.

A warm-up job can populate popular product pages, configuration, or aggregate summaries before expected traffic. A background refresh can update entries before they expire. Both need bounded concurrency, rate limits, retries with backoff, and clear ownership so multiple schedulers do not duplicate the same work.

Do not warm the entire database into Redis without a capacity plan. Estimate serialized bytes plus key/metadata overhead, test realistic memory usage, and consider whether a warm-up burst will overload the origin. Warming should be observable: track completion, failure counts, duration, and coverage of expected hot keys.

### Pattern 6 — Negative cache with explicit outcomes

**Use when:** Repeated misses are expensive and nonexistent resources are common or predictable.

Represent outcomes explicitly rather than confusing a missing value with a cache failure:

```json
{"kind":"not_found","schemaVersion":1}
```

Use a short TTL and invalidate the negative entry after a create operation. If the database query failed, do not store `not_found`. If access is denied, do not cache that result under a key that other users can reuse. Authorization decisions should generally be evaluated using a key that includes the correct security scope or should not be cached at all.

### Pattern 7 — Request-local memoization plus Redis

**Use when:** A single request may ask for the same entity more than once, while many requests also reuse that entity.

A request-local map avoids duplicate work inside one HTTP request. Redis handles reuse across requests. This layered approach can reduce network calls to Redis and database calls without introducing an additional shared consistency mechanism for the request-local map, because its lifetime ends with the request.

Keep request-local caches short-lived and scoped to one request or job. Never use a process-global dictionary as an unbounded substitute for Redis; it creates inconsistent copies across replicas and may leak user-specific data between requests.

### Pattern 8 — Atomic counters and rate-limit windows

**Use when:** You need a lightweight shared counter, such as a request quota or approximate usage window.

Redis commands such as `INCR` are atomic at the command level. However, the sequence “increment, then if first increment set expiration” has a crash window if those steps are separate. Use a Lua script or another atomic pattern when counter creation and expiry must be coordinated. Define whether the limit is fixed-window, sliding-window, token-bucket, or leaky-bucket; those algorithms have different fairness and burst behavior.

Rate limiting is not ordinary response caching. It has security and correctness implications, so test concurrency, boundary conditions, key scope, clock assumptions, and behavior during Redis outage. Decide whether the system should fail open or fail closed when it cannot enforce the limit.

## 6. Cache Failure Modes and Resilience

### 6.1 Redis unavailable: fail open or fail closed?

For a non-critical cache, the common behavior is **fail open**: continue to the origin when Redis is unavailable. This keeps the user path working but shifts load to the database. A cache outage can therefore become a database outage if the fallback is unbounded.

For security controls, rate limiting, or a workflow where Redis holds authoritative state, failing open may be unacceptable. Choose based on the function of the data, not a blanket rule.

A resilient fallback can include:

- Short Redis timeouts.
- Circuit breaking to avoid repeated slow connection attempts.
- Concurrency limits around origin reads.
- Stale values when the consistency contract allows them.
- Backpressure or graceful degradation when the origin approaches capacity.
- A recovery plan for Redis returning, including avoiding a synchronized cold-cache flood.

### 6.2 Avoid cascading failures

When Redis fails, every cache miss may hit PostgreSQL. If database capacity was sized assuming a high cache hit rate, the origin can be overwhelmed. A simple “catch error and query DB” handler is not enough at high traffic.

Estimate the worst-case origin request rate under a cold cache. Load test the system with Redis disabled or slow, not only with a warm cache. Consider limiting concurrent database loads, serving stale-but-acceptable values, returning a graceful temporary response, or reducing non-essential work. A controlled degraded mode is better than allowing all requests to pile up.

### 6.3 Cache poisoning and malformed values

Cached values may become invalid because of bugs, manual writes, deployment incompatibilities, or unexpected input. Validate decoded structures before use. If decoding fails, record the event and decide whether to delete the bad entry and reload from the origin. Do not expose raw serialized content or secrets in logs.

Treat any cache data that can be influenced by untrusted input with care. Construct keys safely, validate query parameters before key creation, and do not let arbitrary user-supplied strings become unrestricted key names. Use namespaces and access controls to prevent unrelated applications from overwriting each other's entries.

### 6.4 Memory pressure and eviction

Redis memory includes value bytes, keys, data-structure overhead, client buffers, replication buffers, and internal overhead. A rough payload-size sum is not a reliable capacity estimate. Measure memory usage with realistic values and account for peaks.

An eviction policy determines what happens when the configured memory limit is reached. The correct choice depends on whether all keys are cache entries or whether Redis also stores state that must not be evicted. If the instance contains both cache and durable application state, an eviction event can become a correctness incident. Separate workloads when their memory and durability requirements differ.

Monitor `used_memory`, fragmentation, evictions, keyspace hits/misses, latency, rejected connections, and replication health where applicable. An unexpected rise in evictions may indicate oversized values, missing TTLs, an undersized instance, or a new key pattern.

### 6.5 Redis should not become an unbounded database by accident

A common failure is storing every request result forever. Apply TTLs to cache entries unless there is a deliberate reason not to. Set limits for value size and key cardinality. Avoid using random IDs or raw query strings in keys if those create millions of unique entries with little reuse.

For each key family, document expected cardinality, average value size, TTL, and whether eviction is safe. If a dataset must be durable, queryable, and complete, evaluate whether Redis is the right primary store or whether a relational/document database is more appropriate.

## 7. Security, Privacy, and Multi-Tenancy

### 7.1 Cache keys must preserve isolation

If a response depends on tenant, user, role, locale, currency, feature flag, or permission scope, those dimensions must either be included in the cache key or safely handled outside the cached representation. Never assume that a URL alone uniquely defines a response.

For example, a dashboard result for tenant A must not be reused for tenant B simply because both requested `/dashboard`. Use a tenant-scoped key and test cross-tenant access explicitly. If results vary by user permissions, keying only by tenant may still be unsafe.

### 7.2 Do not cache secrets casually

Avoid caching passwords, access tokens, session secrets, payment credentials, or unnecessary sensitive personal information. If session state must be stored in Redis, use appropriate TTLs, access controls, TLS where supported, secret rotation, and data minimization. Keep Redis private on the network and require authentication; never expose an unauthenticated Redis endpoint to the public internet.

Operational tools and logs may reveal keys or values. Use opaque identifiers where possible, redact sensitive fields, and limit access to production diagnostics. Apply least privilege to Redis credentials and separate development, staging, and production namespaces or instances.

### 7.3 Authorization and revocation

Caching a protected response can accidentally preserve access after permissions change. If a role is revoked, a cached response may remain visible until invalidation or TTL expiry. Decide whether the revocation requirement permits that window. For sensitive resources, re-check authorization at the appropriate boundary and avoid caching data in a way that bypasses access control.

Do not cache a final “allowed” decision for longer than the system's revocation contract permits. If authorization is cached, include the relevant identity and policy version, use a short TTL, and invalidate on policy changes. A cache hit must never be treated as proof that the current requester is authorized.

## 8. Observability and Performance Measurement

### 8.1 Metrics that answer real questions

Track at least:

- Hits, misses, and hit rate by key family.
- Redis operation latency, especially p95 and p99.
- Connection errors, timeouts, and pool wait time.
- Origin reads avoided and origin load during misses.
- Cache population failures and deserialization failures.
- Evictions, memory usage, fragmentation, and key count.
- Stampede indicators, lock contention, and refresh failures.
- Endpoint latency before and after rollout.
- Staleness or age of data when freshness matters.

Avoid high-cardinality metric labels containing user IDs, raw keys, or arbitrary query parameters. Use bounded labels such as `cache_family="product_detail"` or `operation="get"`. Logs may include a hashed or redacted key identifier when needed for debugging.

### 8.2 Benchmark cold and warm behavior

A warm-cache microbenchmark can be misleading. Test at least three scenarios:

1. **Cold cache:** keys are missing, and the origin must load values.
2. **Warm cache:** the expected hot set is present.
3. **Degraded cache:** Redis is slow or unavailable.

Use representative concurrency, payload sizes, data distribution, and TTL behavior. Measure endpoint p50/p95/p99, database QPS, CPU, Redis latency, and error rate. Ensure the benchmark does not accidentally reuse one tiny key when production has a large working set.

Compare equivalent outputs and verify correctness. A faster response is not an improvement if it is stale beyond the agreed limit or contains data for the wrong tenant.

### 8.3 Roll out with evidence

Introduce caching behind a feature flag or to a limited traffic cohort where practical. Compare the cached and uncached paths, observe hit rate and origin load, and have a rollback plan. If the first version changes the response shape or consistency semantics, test it as a product behavior change, not only a performance change.

A cache can improve the average and worsen the tail if serialization, network payloads, or cold misses are expensive. Review distribution metrics rather than a single average. Record the baseline, the hypothesis, the result, and any new failure modes.

## 9. Common Mistakes

| Mistake | Why it hurts | Better approach |
|---|---|---|
| Caching without measuring | Adds complexity without solving a real bottleneck | Establish latency and workload baseline first |
| No TTL on ordinary cache entries | Stale data and memory growth can persist indefinitely | Set a documented TTL or explicit lifecycle |
| Key omits a query parameter | Different results collide and users receive incorrect data | Canonicalize all result-affecting inputs |
| Key omits tenant/user scope | Can expose one user's or tenant's data to another | Include security scope and test isolation |
| Invalidate before database commit | A concurrent miss can refill from old committed data | Coordinate invalidation with successful commit |
| Treat all exceptions as “not found” | Outages become cached false negatives | Distinguish misses from failures |
| Cache every unique search | High cardinality, low hit rate, memory pressure | Cache only repeated, valuable queries |
| Use `KEYS *` in production | Can block Redis on a large keyspace | Use controlled `SCAN` or an explicit index |
| Ignore cold-cache load | Origin collapses during deploy, failover, or eviction | Load-test cold and degraded scenarios |
| Assume high hit rate means success | Cache may be stale, unsafe, or not improve endpoint latency | Measure correctness, latency, origin load, and cost |
| Use distributed locks for everything | Coordination overhead and lock bugs may exceed recomputation cost | Start with simple TTL/cache-aside; add locks only when justified |
| Swallow all cache errors silently | Incidents become invisible and diagnosis is difficult | Emit metrics/logs and catch expected failures narrowly |
| Cache sensitive data by URL only | Authorization context may be missing | Scope keys and re-check authorization |
| Flush all keys during every deploy | Creates synchronized misses and origin spikes | Use versioned namespaces and gradual expiration |
| Store huge payloads | Serialization, transfer, and memory costs rise | Cache the smallest useful representation |

### 9.1 Debugging checklist

When a cache does not improve performance, ask:

1. Is the key reused enough to create meaningful hits?
2. Are the cached values small enough?
3. Is the origin actually the bottleneck?
4. Is the Redis round trip slower than the avoided work?
5. Does the endpoint make multiple sequential cache calls?
6. Is serialization/deserialization expensive?
7. Are TTLs too short for the workload?
8. Are key parameters preventing reuse?
9. Are misses caused by invalidation races or high cardinality?
10. Is the bottleneck actually network transfer, application CPU, or lock waiting?

When data appears stale, ask:

1. Which code path writes the source of truth?
2. Which keys represent the changed record or query?
3. Does invalidation happen only after successful commit?
4. Can invalidation fail silently?
5. Are replicas or event consumers delayed?
6. Is the TTL consistent with the promised stale window?
7. Is an old application version still writing old-format values?
8. Are negative entries invalidated after create operations?

## 10. Mental Models

1. **The cache is a copy, not a truth oracle.** In cache-aside, the database is authoritative; Redis is a performance layer.
2. **Every cached value creates a freshness promise.** TTL and invalidation behavior define what users may observe.
3. **A key is part of correctness.** If two different requests can produce different answers, they must not accidentally share a key.
4. **A miss is normal; a cache outage is different.** Instrument them separately and design distinct handling.
5. **The cold path determines resilience.** A warm cache can hide an origin that cannot handle real traffic.
6. **Invalidation is a dependency graph.** A source record may appear in detail, list, search, aggregate, and user-specific caches.
7. **Hit rate is a means, not the goal.** The goal is correct user-visible performance and manageable origin load.
8. **TTL is both a freshness bound and a capacity mechanism.** It does not by itself guarantee immediate consistency.
9. **Coordination has a cost.** A lock is useful only when duplicate work costs more than lock complexity.
10. **Cache only what you can explain.** Every key family should have an owner, a reason, a TTL, and a failure policy.
11. **A cache can amplify failure.** If Redis fails and every request hits the database, an optimization becomes a traffic multiplier.
12. **Security context belongs in the data model.** A cache key that omits authorization scope is a correctness bug.
13. **Optimize the workload, not the technology.** Redis is not a substitute for an appropriate index, query, or data model.
14. **Observability is part of the implementation.** A cache without metrics is a hidden second data path.

## 11. Quick Reference

| Situation | Starting approach | Watch out for |
|---|---|---|
| Popular entity detail | Cache-aside with TTL | Invalidate on entity update |
| Public configuration | Longer TTL or versioned key | Deploy compatibility and stale config |
| Expensive aggregate | Stale-while-revalidate | Document permitted staleness |
| Repeated nonexistent lookup | Short negative cache | Invalidate after create |
| Search result | Short TTL, complete query key | High cardinality and tenant leakage |
| Hot key expires under load | Single-flight or controlled refresh | Distributed replicas and lock expiry |
| Session state | Explicit TTL and security controls | May be authoritative state, not a disposable cache |
| Rate limit counter | Atomic Redis operations/script | Fail-open vs fail-closed behavior |
| Redis outage | Bounded fallback/degraded mode | Database overload |
| Schema change | Versioned key or payload | Old entries and rollout compatibility |
| Multi-tenant response | Tenant-scoped key | User/role permission scope may also matter |
| Cache misses are too frequent | Inspect reuse, TTL, key cardinality | Do not blindly increase memory |
| Memory usage climbs | Inspect TTLs, value sizes, key count, eviction | Cache leaks and unbounded keys |
| Latency remains high | Profile whole endpoint | Redis may not be the bottleneck |

### Operational command reference

| Need | Command or metric | Notes |
|---|---|---|
| Check connectivity | `PING` | A simple health check, not a full workload test |
| Read a value | `GET key` | Avoid dumping sensitive values in shared terminals |
| Set with expiry | `SET key value EX 300` | Sets value and TTL together |
| Inspect TTL | `TTL key` | `-1` indicates no expiry; `-2` indicates missing key |
| Delete key | `DEL key` | Use only when key ownership is understood |
| Increment counter | `INCR key` | Coordinate expiry separately or atomically |
| Inspect server stats | `INFO` | Restrict and sanitize operational access |
| Check memory | `INFO memory` | Use trends and realistic overhead |
| Inspect keyspace | `SCAN` | Iterate in bounded batches; not a snapshot guarantee |
| Track hit ratio | hits / (hits + misses) | Segment by workload family |
| Check evictions | eviction metric / `INFO stats` | May indicate memory pressure or wrong TTL policy |

## 12. Build Challenge: Add a Safe Cache to a Product API

Build a small API endpoint that reads product details from a relational database and uses Redis as a cache-aside layer. The challenge is not complete when `GET` returns a cached object once; it is complete when the design has explicit freshness, invalidation, failure, and measurement behavior.

### Requirements

1. Create a `get_product(product_id)` data-access function that reads Redis before the database.
2. Use a deterministic, namespaced key such as `app:catalog:v1:product:<id>`.
3. Serialize values using a documented format and include a schema version.
4. Set a TTL when writing each cache entry.
5. Return the database result even if cache population fails.
6. Distinguish a cache miss from a Redis timeout or connection error in metrics.
7. Add an update path that commits the database transaction before invalidating the relevant cache key.
8. Decide and document the behavior for nonexistent product IDs.
9. If negative caching is implemented, use a shorter TTL and invalidate it after a create operation.
10. Ensure tenant or permission context is part of the key when the response varies by scope.
11. Add a test proving that a second read can use the cache without calling the database again.
12. Add a test proving that an update invalidates the cached representation.
13. Add a test for Redis being unavailable while the database remains healthy.
14. Add a test for malformed cached JSON or an incompatible schema version.
15. Simulate concurrent misses for one popular key and observe whether the origin is overloaded.
16. Test the endpoint with a cold cache and a warm cache under representative concurrency.
17. Record p50, p95, p99 latency and database query count before and after enabling the cache.
18. Document acceptable staleness, TTL selection, and the rollback plan.
19. Ensure logs do not expose credentials, session tokens, or sensitive cached payloads.
20. Add a short runbook describing how to inspect hit rate, memory, evictions, timeouts, and refresh failures.

### Suggested implementation sequence

1. Implement the uncached database function and add correctness tests.
2. Measure its baseline latency and query count.
3. Introduce a Redis client configured from environment variables.
4. Add a cache-aside wrapper with a stable key and TTL.
5. Add narrow error handling for Redis failures and malformed values.
6. Add write-side invalidation after a successful commit.
7. Add metrics for hits, misses, errors, and origin loads.
8. Run cold-cache and warm-cache tests.
9. Simulate Redis timeout and database slowdown separately.
10. Review the key for tenant, locale, role, and query parameters.
11. Validate that cache failures do not cause unbounded origin concurrency.
12. Document the trade-offs and only then enable the feature for production traffic.

### Test matrix

| Scenario | Expected behavior | Evidence to capture |
|---|---|---|
| First request for a product | Cache miss, one origin read, cache population | Miss metric and DB query count |
| Second request before TTL expiry | Cache hit, no duplicate origin read | Hit metric and lower latency |
| Key expires | Origin read and refreshed cache value | TTL and miss behavior |
| Product update commits | Cache entry invalidated or refreshed | Subsequent read returns updated value |
| Database update fails | Old authoritative value remains; cache is not falsely updated | Transaction test |
| Redis unavailable | Request follows documented fallback/degraded policy | Error metric and bounded latency |
| Redis value is malformed | Invalid entry is handled and origin may repopulate | Decode-failure metric |
| Product does not exist | Correct not-found result; negative cache only if intended | Short TTL and create invalidation |
| Concurrent cold requests | Origin work remains bounded or the limitation is documented | Origin concurrency and p99 |
| Tenant A vs tenant B | No cross-tenant result reuse | Isolation tests |
| Cache memory pressure | Eviction behavior is understood and observable | Memory and eviction metrics |
| New payload schema deployed | Old entries are handled safely | Compatibility test |

### Definition of done

The challenge is complete when:

- The endpoint returns correct data with Redis warm, cold, and unavailable.
- Key design covers every response-affecting parameter and security boundary.
- Cache entries have explicit expiration and a documented invalidation contract.
- Cache errors are observable without leaking sensitive information.
- Tests cover read, update, miss, malformed value, and outage behavior.
- The load test demonstrates measured impact on endpoint latency and origin load.
- The team can explain when stale data may be served and for how long.
- A rollback or cache-bypass path is documented.
- The implementation does not depend on Redis being infallible.
- The cache exists because measurement supports it, not because it was added by default.

## 13. Final Review Checklist

Before approving a Redis caching change, review these questions with the team:

- What measured bottleneck is this intended to solve?
- What is the source of truth?
- What is the maximum acceptable staleness?
- Which exact keys are read, written, invalidated, or versioned?
- Can a key collide across tenants, users, locales, or environments?
- Does every entry have a TTL or deliberate lifecycle?
- What happens when Redis is slow, unavailable, or returns invalid data?
- Can cache misses overload the database?
- Is there a stampede risk for popular keys?
- How much memory will the expected working set require?
- What does the eviction policy mean for every key family?
- Are cache errors, hit rate, latency, and origin load observable?
- Are deployment and rollback behavior safe with old and new application versions?
- Does the cache preserve authorization checks?
- Has the implementation been tested with realistic concurrency and cold-cache conditions?

If these questions have clear answers, the cache is a deliberate system component. If not, begin with measurement and a smaller design. A good cache is one whose correctness boundary, failure behavior, and performance benefit are understood by the engineers who operate it.



## 14. Detailed Design Notes and Review Cases

### 14.1 Choosing a TTL from the freshness contract

Start with the product's freshness requirement, not a round number copied from another service. Ask the owner what a user is allowed to see after a change, then translate that answer into a technical contract. If a public news feed may be stale for one minute, a TTL of thirty seconds may be reasonable, but invalidation, refresh delay, and outage behavior still affect the real bound. If the product promises that a user immediately sees a saved profile update, a five-minute TTL alone cannot satisfy the promise.

TTL selection also involves economics. A very short TTL increases misses and origin work. A very long TTL increases the possible stale window and may retain obsolete data in memory. Estimate the reuse interval of a key: if the next request normally arrives after the value has expired, the cache provides little value. If the value is requested hundreds of times per second, a moderate TTL may remove substantial origin load.

Use separate TTL policies for different key families. A product detail, a search result, an exchange-rate snapshot, and an authorization decision should not inherit one global default without review. A shared helper may provide a default, but call sites should make exceptional freshness needs visible.

### 14.2 TTL does not equal guaranteed maximum staleness in every failure mode

A TTL limits the normal lifetime of an individual cache entry. It does not automatically guarantee a business-level freshness bound if refreshes can fail, stale-while-revalidate deliberately serves expired values, replicas lag, or a client-side cache adds another layer. Write down all layers that can retain the value.

For example, a backend might cache an entity for five minutes, while a browser or CDN caches a response for another ten minutes. The user-visible staleness could be longer than either layer's TTL if cache-control headers, stale fallback, or intermediary behavior permit it. Define which layer owns freshness and ensure downstream cache headers do not contradict it.

If a strict upper bound matters, test it end to end. Include clock behavior, asynchronous event delays, and outage policy. Do not advertise “fresh within 30 seconds” based only on a Redis `EX 30` setting unless the entire data path supports that claim.

### 14.3 Write ordering and race conditions

Consider this sequence: request A begins reading a product from the database; request B updates the product and deletes the cache key; request A then finishes its old database read and stores the old value in Redis. The key is stale even though B invalidated it after committing. This race can occur with cache-aside.

Possible mitigations depend on the consistency requirement. A short TTL may be sufficient for ordinary content. A versioned key can make old writes land in an obsolete namespace. A monotonic version check can prevent an older value from replacing a newer one. An event-driven invalidation system can improve convergence but still needs retry and ordering guarantees. Avoid claiming strict consistency unless the design addresses concurrent fills and writes.

One approach is to store the source version with the payload. When a refresh attempts to populate the cache, compare its version to the active version and reject an older value. This requires an authoritative or safely maintained version and atomic compare/update behavior; a plain GET followed by SET can itself race. The lesson is not that every cache needs version logic, but that the race should be consciously accepted or prevented.

### 14.4 Cache keys for lists, filters, and pagination

A query result key should encode the logical query, not merely the endpoint name. For example, a product listing may depend on category, price range, sort direction, page size, page cursor, locale, inventory visibility, tenant, and feature flags. If any result-affecting input is omitted, unrelated requests may collide.

Canonicalize inputs before hashing. Sort map keys, normalize equivalent values, apply defaults consistently, and distinguish an omitted parameter from a parameter explicitly set to a different value when semantics differ. Hashing can keep keys manageable, but the unhashed canonical input should remain available in safe diagnostic tooling if debugging requires it.

Pagination makes invalidation difficult because one insert can shift many page boundaries. This is one reason short TTLs or caching only stable query fragments may be preferable to maintaining perfect invalidation for every page. If the list is extremely dynamic, an appropriate database index or search system may be simpler and more correct than elaborate result caching.

### 14.5 Cache values versus cache identifiers

Caching complete objects minimizes origin reads but makes each entry larger and creates more invalidation dependencies. Caching only identifiers reduces payload size and can keep list membership separate from entity content, but it may require additional database reads to hydrate results. There is no universally best choice.

For a popular product detail endpoint, caching the full safe representation may work well. For a large paginated search, caching a short list of IDs may reduce memory and simplify some updates. For security-sensitive data, fetching the current record after a cached identifier can help ensure current authorization and state are applied, but it may remove much of the performance gain. Measure the complete path before selecting a representation.

### 14.6 Cache warming during deploys and failovers

A deployment that changes the key namespace can create a cold cache even when Redis itself remains healthy. If traffic is high, the origin may receive a sudden burst. The same effect occurs after failover, a cache flush, a mass expiration, or a change in serialization version.

Plan the transition. Warm only a bounded hot set, stagger refreshes, and cap concurrent origin loads. Where possible, use overlapping versions so old and new application instances can coexist safely. Do not have every application replica independently warm the same huge dataset at startup. Record warm-up progress and stop the job if origin health degrades.

### 14.7 When not to cache

Caching is often a poor fit when values are cheap to compute, rarely reused, extremely high-cardinality, or required to be strongly consistent. It may also be unnecessary when a database index already makes the query fast enough. A cache can make a simple architecture more difficult to debug and operate.

Do not cache a response merely because the endpoint is slow. First identify whether the time is spent in SQL, lock waits, remote services, application serialization, or network transfer. If the bottleneck is an unindexed query, a missing index may be the durable fix. If the endpoint is slow because it calls a remote API sequentially, parallelization or batching may help more. Cache only after the bottleneck is understood.

### 14.8 Review examples

**Example A: Public category list.** The list changes a few times a day and receives heavy traffic. A cache-aside entry with a modest TTL plus invalidation after category edits is a reasonable starting point. The team should monitor hit rate and origin query count, and confirm that the data is not personalized.

**Example B: User account balance.** The balance changes through transactions and users expect accurate results. A long-lived response cache is risky. Prefer the authoritative database for balance reads, or design a narrowly scoped cache with an explicit consistency contract and a way to bypass it after writes. Never use a generic five-minute TTL without product approval.

**Example C: Product search.** Search parameters have many combinations. A cache may help for common category pages or popular queries but produce low hit rate for arbitrary filters. Measure key cardinality and reuse before caching all searches. Ensure tenant and inventory visibility are included.

**Example D: Permission check.** A cached allow decision can survive a role revocation. The cache key must include identity and policy version, the TTL must fit the revocation contract, and sensitive decisions may be better evaluated directly. Correct authorization is more important than a small latency reduction.

**Example E: Expensive report.** Many users request the same aggregate. Stale-while-revalidate can make the report responsive while one worker refreshes it. Show the report's “as of” timestamp if the business needs to understand freshness. Bound refresh concurrency and preserve a fallback when generation fails.

## 15. Implementation Quality: Tests, Review, and Runbooks

### 15.1 Unit tests

Unit tests should cover deterministic key construction, serialization, TTL selection, and branching behavior. Use a fake cache or a small Redis test instance depending on the behavior under test. A fake is useful for fast tests, but it may not reproduce Redis command semantics, expiration timing, connection failures, or atomicity. Keep a smaller integration suite that exercises a real Redis-compatible server.

Test the cache hit path without allowing the origin to be called. Test the miss path with a known database result. Test missing records separately from exceptions. Test malformed payloads, unsupported schema versions, and a Redis write failure after a successful database read. Assert that the endpoint still returns correct origin data when the cache is optional.

### 15.2 Integration and concurrency tests

Integration tests should validate actual serialization, TTL behavior, command usage, and invalidation. Avoid tests that rely on sleeping for long durations; use a controllable clock where possible or very short TTLs in a dedicated test environment. Clean up only keys created by the test, using a unique namespace. Do not flush a shared Redis instance that may be used by parallel tests.

Concurrency tests should simulate multiple requests missing on the same key and multiple writes racing with reads. Measure how many origin calls occur. If the implementation intentionally allows duplicate loads, document the expected upper bound; if it uses single-flight or a lease, test both normal completion and failure of the loader/lock holder.

### 15.3 Runbook essentials

A useful runbook answers what to check first and what actions are safe. Include dashboard links in the real deployment documentation, alert thresholds, owner contacts, Redis endpoint/cluster identity, expected key families, and the origin's safe fallback capacity. Do not include passwords or secret connection strings.

When hit rate falls suddenly, inspect deploys, TTL changes, key namespace changes, key cardinality, and traffic mix. When evictions rise, inspect memory usage, value size, missing expirations, and whether an unexpected key family is growing. When Redis latency rises, inspect CPU, network, command mix, payload sizes, connection pool behavior, and slow-command telemetry. When the database spikes, determine whether Redis is down, cold, or missing the expected hot set before blindly increasing database capacity.

### 15.4 Safe operational interventions

Deleting a known cache key is often safe if the origin can repopulate it, but it may trigger expensive work. Deleting an entire key family or flushing the whole instance can cause a stampede. Before a broad invalidation, estimate the number of affected keys and the origin's ability to rebuild them. Prefer gradual expiration or versioned namespaces where possible.

Changing eviction policy or memory limits can alter behavior for every key family on an instance. If Redis holds more than disposable cache data, understand the impact before changing policy. A production cache is an operational dependency; treat configuration changes as controlled releases with monitoring and rollback.

### 15.5 Documentation template for each cache family

For each cached value, record:

- **Owner:** team or component responsible for correctness and operations.
- **Source of truth:** database, API, or computation that produces the value.
- **Key format:** namespace, version, identity, tenant, and query parameters.
- **Value format:** encoding and schema version.
- **TTL:** normal lifetime and any jitter range.
- **Invalidation:** write path, event, version switch, or expiry-only strategy.
- **Freshness contract:** acceptable staleness and read-your-writes behavior.
- **Failure mode:** fallback, stale response, fail-open, fail-closed, or graceful error.
- **Capacity expectation:** approximate key count, value size, and peak traffic.
- **Observability:** metrics, logs, alerts, and dashboard.
- **Security:** sensitive fields, tenant scope, and authorization behavior.
- **Testing:** relevant unit, integration, and load tests.
- **Rollback:** cache bypass, old key namespace, or safe disablement path.

This documentation should be concise enough to maintain. Its purpose is to make the hidden assumptions visible to reviewers and operators.

## 16. Final Principle

A good Redis cache is a deliberately bounded copy of data with a named owner, a stable key, an explicit freshness promise, a recovery path, and evidence of value. If the design cannot explain what happens on a miss, a write race, an eviction, a malformed value, or an outage, it is not finished. Keep the initial implementation simple, measure it under realistic conditions, and add advanced coordination only when a demonstrated workload requires it.
