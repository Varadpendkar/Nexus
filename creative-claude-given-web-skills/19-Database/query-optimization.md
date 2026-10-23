# SKILL: query-optimization

**Layer:** `layer-19-database`  
**Goal:** Diagnose slow database queries, read execution plans, choose effective indexes, reduce unnecessary work, and validate improvements without sacrificing correctness or maintainability.

## 1. The Senior Engineer's Perspective

Query optimization is the disciplined process of making a database workload meet its latency, throughput, and resource goals while preserving correct results. It is not a contest to write the shortest SQL statement, add the most indexes, or force a query planner to use a preferred strategy. The best optimization is the one supported by evidence from the actual workload.

A query can be slow because it reads too many rows, performs an inefficient join, sorts a large intermediate result, waits for a lock, returns far more data than the application needs, or runs too frequently. Sometimes the SQL is reasonable but the schema, data distribution, connection pool, or application access pattern is the real problem.

The senior engineer asks:

- What is the actual performance objective: p95 latency, throughput, cost, or all three?
- Which query or endpoint is responsible for the measured pain?
- How much work does the database perform to return the result?
- Does the plan match the expected access pattern?
- Are estimates close to actual row counts?
- Is the database CPU-bound, I/O-bound, lock-bound, or overloaded by concurrency?
- Does an index reduce total workload cost, or merely improve one query while hurting writes?
- Can the result be made smaller or the query executed less often?
- How will the improvement be measured and protected against regression?

A query that takes 800 ms once per hour may be less important than one that takes 80 ms thousands of times per minute. Optimize based on workload impact, not intuition or a single dramatic example.

### The optimization loop

1. **Measure:** establish a baseline from real requests or a representative benchmark.
2. **Isolate:** identify the exact query, parameters, frequency, and relevant data distribution.
3. **Inspect:** read the execution plan and database metrics.
4. **Hypothesize:** name the specific work that should be reduced.
5. **Change one thing:** rewrite SQL, add or adjust an index, alter the access pattern, or reduce returned data.
6. **Re-measure:** compare equivalent workloads and verify result correctness.
7. **Observe:** validate in staging or production and watch for regressions.
8. **Document:** record why the change helps and what trade-offs it introduces.

The key discipline is to optimize observed work, not imagined work.

## 2. Core Concepts

### 2.1 Latency, throughput, and tail performance

**Latency** is the time one operation takes. **Throughput** is how much work the system completes per unit of time. **Tail latency** describes slow requests near the end of a distribution, such as p95 or p99.

Average latency can hide painful outliers. If most requests finish in 20 ms but a small fraction take 3 seconds, users may still experience the system as unreliable. A change that improves average time but worsens p99 may be a regression for an interactive product.

Measure the metric that matches the product requirement. For an interactive search page, p95 and p99 may matter. For a reporting pipeline, total completion time and resource cost may matter more. Under concurrency, an optimization that reduces per-query work can improve both latency and throughput by releasing database resources sooner.

### 2.2 Query cost is not the same as elapsed time

A database execution plan often includes estimated cost, estimated rows, and plan-node details. Cost is a planner-relative estimate, not milliseconds. Use it to compare plans in context, but do not report an estimated cost reduction as a real latency improvement.

Elapsed time can include network transfer, connection acquisition, lock waits, disk reads, CPU work, serialization, and application processing. A query plan may look efficient while the endpoint remains slow because the application performs dozens of queries or returns a huge payload.

Measure the full request path as well as the database statement.

### 2.3 Read execution plans

An execution plan shows how the database intends to retrieve and combine data. In PostgreSQL, a common diagnostic command is:

```sql
EXPLAIN
SELECT id, created_at
FROM orders
WHERE customer_id = 42
ORDER BY created_at DESC
LIMIT 20;
```

`EXPLAIN` usually shows the estimated plan without executing the query. PostgreSQL's `EXPLAIN (ANALYZE, BUFFERS)` executes the statement and reports actual timing and row information as well as buffer activity:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, created_at
FROM orders
WHERE customer_id = 42
ORDER BY created_at DESC
LIMIT 20;
```

**Important:** `EXPLAIN ANALYZE` actually runs the query. For `UPDATE`, `DELETE`, or other mutating statements, this can change data unless executed in a safe transaction that is rolled back and appropriate for the operation. Even read queries can be expensive. Do not run production diagnostics casually.

Plan syntax and output vary by database engine. Learn the exact format for the engine and version you operate.

### 2.4 Sequential scans are not automatically bad

A sequential scan reads a table's rows in sequence. An index scan uses an index to locate relevant rows. A sequential scan can be the right choice when a query needs a large proportion of the table, the table is small, or index access would require many scattered reads.

The question is not “Did the database use an index?” It is “Did the chosen plan perform the least expensive work for this query and workload?”

For a query returning 70% of a table, scanning the table may be cheaper than walking an index and visiting most table pages. For a selective lookup returning a handful of rows from a large table, an appropriate index may reduce work dramatically.

Never force index use merely because the plan contains a sequential scan. First understand row selectivity, table size, caching, and the planner's estimates.

### 2.5 Estimated rows versus actual rows

A major diagnostic clue is the gap between estimated and actual row counts. If the planner expects 10 rows but receives 100,000, it may choose a join or access strategy that performs badly.

Estimates can be inaccurate because statistics are stale, data is skewed, columns are correlated, or parameter values vary substantially. Updating statistics can help, but it is not a universal fix. For PostgreSQL, `ANALYZE` collects planner statistics; automatic statistics collection is usually enabled, but unusual loads or data distributions may require investigation.

When estimates diverge:
1. identify the plan node where divergence first becomes large;
2. inspect the predicate and value distribution;
3. refresh statistics if appropriate;
4. consider extended statistics or a schema/query change when correlation is important;
5. compare plans using representative parameter values.

Do not optimize only with a convenient test parameter if production values have a different distribution.

### 2.6 Selectivity and cardinality

**Selectivity** describes how much data a predicate filters out. **Cardinality** is the number of rows expected or produced at a stage.

A predicate like `status = 'rare_state'` may be highly selective if only 0.1% of records match. A predicate like `is_active = true` may be weakly selective if 95% of rows are active. Selectivity affects whether an index is useful and how joins should be planned.

Data distribution matters. A column with a few common values and a few rare values may need a different plan for different parameters. Query plans that perform well for one tenant or status may perform poorly for another.

### 2.7 Indexes and their trade-offs

An index is an additional data structure that helps locate or order rows. It costs storage and adds work to inserts, updates, and deletes. Indexes may also increase maintenance, cache pressure, and deployment complexity.

Create indexes for demonstrated access patterns. Inspect:
- predicates in `WHERE`;
- join keys;
- sort order in `ORDER BY`;
- grouping requirements;
- selectivity and value distribution;
- table write rate;
- existing indexes and overlap;
- query frequency and latency contribution.

An index that speeds up one low-frequency query may be a poor trade if it slows a high-volume write path or duplicates another index.

### 2.8 Composite index order

A composite index stores keys in a defined order. For an index on `(customer_id, created_at)`, a query filtering by `customer_id` and ordering by `created_at` may benefit because the index groups records by customer and orders records within that key.

Example:

```sql
CREATE INDEX idx_orders_customer_created
ON orders (customer_id, created_at DESC);
```

This may support:

```sql
SELECT id, created_at, total_amount
FROM orders
WHERE customer_id = 42
ORDER BY created_at DESC
LIMIT 20;
```

Index order should match actual query patterns. An index beginning with `customer_id` is not generally equivalent to one beginning with `created_at`. The most useful order depends on predicates, sorting, selectivity, and the database engine's index rules.

Avoid memorizing simplistic rules such as “put the most selective column first” without considering the entire workload. The leftmost-prefix behavior of B-tree indexes, range predicates, and ordering requirements all matter.

### 2.9 Covering indexes and included columns

A covering index contains the keys and, where supported, additional values needed by a query, potentially avoiding table lookups. In PostgreSQL, `INCLUDE` columns can store non-key values in a B-tree index:

```sql
CREATE INDEX idx_orders_customer_created_cover
ON orders (customer_id, created_at DESC)
INCLUDE (total_amount);
```

This can help a query that filters by customer, orders by creation time, and returns the total. But an index-only scan is not guaranteed simply because the columns are present; engine-specific visibility and storage rules matter.

Covering indexes can become large and expensive to maintain. Add included columns only when measurements justify the cost.

### 2.10 Sargable predicates

A predicate is often called **sargable** when the database can use an index efficiently to search it. Applying a function or conversion to an indexed column may prevent use of a conventional index unless the engine can transform the predicate or a matching expression index exists.

Potentially less index-friendly:

```sql
SELECT id
FROM users
WHERE lower(email) = lower('Person@example.com');
```

A PostgreSQL expression index may support this pattern:

```sql
CREATE INDEX idx_users_lower_email
ON users (lower(email));
```

Alternatively, store a normalized value with a clear consistency policy. Do not normalize only the query input and assume the stored values have the same format.

Other examples include casting indexed columns, leading-wildcard searches such as `LIKE '%term'`, and arithmetic expressions over a column. The exact effect is engine- and index-specific; verify the plan rather than relying on labels alone.

### 2.11 Avoid selecting unnecessary columns

`SELECT *` often returns more data than the caller needs. That increases database-to-application transfer, decoding work, memory use, and coupling to schema changes. Prefer the required fields:

```sql
SELECT id, title, created_at
FROM projects
WHERE owner_id = $1;
```

Selecting fewer columns can also make a covering index possible. However, do not sacrifice correctness or create unreadable code simply to avoid a few bytes in a genuinely small query. Focus on high-volume or wide-row paths.

### 2.12 Pagination strategy

Offset pagination is straightforward:

```sql
SELECT id, created_at
FROM orders
ORDER BY created_at DESC, id DESC
LIMIT 20 OFFSET 10000;
```

Large offsets can be expensive because the database may still need to walk or discard many preceding rows. Results can also shift between requests as rows are inserted or deleted.

Keyset pagination uses a stable cursor:

```sql
SELECT id, created_at
FROM orders
WHERE (created_at, id) < ($1, $2)
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

This PostgreSQL-style tuple comparison works for the matching sort direction shown; adapt carefully for mixed sort directions and null handling. A stable unique tie-breaker such as `id` prevents ambiguous page boundaries. Keyset pagination is especially useful for feeds and large ordered datasets, but it is less suited to jumping directly to arbitrary page numbers.

### 2.13 Join strategies

Databases can use nested-loop, hash, merge, or other join strategies. None is universally best.

- **Nested loop:** often effective when one side is small and the other can be efficiently indexed.
- **Hash join:** can be effective for larger equality joins when a hash table fits appropriate memory limits.
- **Merge join:** can be effective when inputs are ordered on the join key or can be efficiently sorted.

A slow join may result from missing indexes, incorrect row estimates, a many-to-many explosion, type mismatch, or a predicate applied too late. Inspect intermediate row counts and the first node where the plan grows unexpectedly.

Do not rewrite every join into a subquery or CTE based on style preference. Modern planners may transform many equivalent forms. Measure the chosen plan.

### 2.14 N+1 queries

The N+1 pattern occurs when an application fetches a list and then issues another query for each item. For example, loading 100 projects and then querying the owner separately for each project may create 101 queries.

Possible solutions include a join, a batch `WHERE id IN (...)` query, or an ORM eager-loading feature. The correct approach depends on relationship cardinality, result size, and consistency requirements.

Do not replace N+1 queries with one enormous join that multiplies rows across several one-to-many relationships. A carefully chosen batch strategy may be better.

### 2.15 Connection pools and concurrency

A slow endpoint is not always caused by a bad query plan. Requests may wait for a database connection, the server may be saturated, or too many concurrent queries may overwhelm CPU, memory, and I/O.

Inspect connection-pool wait time, active sessions, queue length, lock waits, and database saturation. Increasing the pool size can worsen overload by allowing more concurrent work than the database can sustain. Pool sizing should consider database capacity, workload duration, replicas, and other services sharing the server.

### 2.16 Locks and blocking

A query can spend most of its elapsed time waiting for a lock rather than executing. A plan alone may not explain this. Inspect lock-wait metrics and blocking sessions using engine-specific tools.

A long transaction can hold locks or delay cleanup, causing unrelated queries to queue. Optimize transaction duration, review isolation requirements, and avoid holding transactions open while performing network calls or waiting for user input.

### 2.17 Caching and query optimization

Caching can reduce repeated database work, but it changes consistency and invalidation requirements. Before adding a cache, ask whether the query itself can be made cheaper, whether the data is reused enough to justify caching, and how stale the result may be.

A cache should have an explicit policy for:
- cache key design;
- expiration;
- invalidation after writes;
- tenant/user isolation;
- failure behavior;
- observability of hit rate and stale data.

Do not cache authorization-sensitive results under an incomplete key. Query optimization and caching are complementary, not interchangeable.

### 2.18 Aggregation and grouping

Aggregations can be expensive when they scan large datasets or group by high-cardinality values. Consider whether filters can be applied early, whether an index helps the predicate or grouping order, and whether the application really needs the full aggregation on every request.

For recurring expensive reports, options include pre-aggregated tables, materialized views, summary tables maintained by jobs, or a dedicated analytics system. These approaches add freshness and maintenance concerns. Define how quickly the summary must reflect new writes and how it is rebuilt after a failure.

### 2.19 Query parameters and prepared statements

Parameterized queries improve security and can improve statement reuse depending on the driver and database. Avoid string concatenation with untrusted input.

```python
# Example using a placeholder style commonly used by Python DB-API drivers.
cursor.execute(
    "SELECT id, title FROM projects WHERE owner_id = %s",
    (owner_id,),
)
```

Placeholder syntax differs between libraries. Parameterization protects values, not arbitrary SQL identifiers such as column names or sort directions. For dynamic identifiers, use a strict allowlist and the database library's identifier-quoting facilities.

Prepared statements may use generic or parameter-sensitive plans depending on engine and driver. If performance varies sharply by parameter, inspect the database's plan behavior instead of abandoning parameterization.

### 2.20 Statistics, vacuuming, and maintenance

Planner statistics describe data distribution. Stale statistics can lead to poor plans, while table bloat and incomplete maintenance can affect I/O. In PostgreSQL, `ANALYZE` updates statistics, while `VACUUM` and autovacuum support dead-tuple cleanup and visibility-map maintenance.

Maintenance is not a magic fix for every slow query. Diagnose first: identify whether the issue is a plan estimate, bloat, I/O, lock contention, or workload overload. Check operational guidance for the exact database engine.

## 3. A Repeatable Diagnostic Workflow

### Step 1: Establish a baseline

Capture the query text or normalized query identifier, representative parameters, frequency, latency distribution, rows returned, and database resource impact. Record both typical and worst-case parameters. Do not compare a warmed cache run with a cold run and call the difference an optimization unless that is the actual production condition.

### Step 2: Find the expensive work

Use the database's query statistics, slow-query logs, tracing, or application instrumentation. Rank by total time as well as individual latency. A query that is moderately slow but executes extremely often may be the best target.

Separate:
- time waiting for a connection;
- time waiting for locks;
- server execution time;
- network transfer;
- application deserialization and processing.

### Step 3: Inspect the plan

Look for:
- large sequential scans that are not justified by the result size;
- estimated versus actual row-count divergence;
- expensive sorts or hash operations;
- repeated nested-loop work;
- large intermediate result sets;
- filters that discard most rows late in the plan;
- temporary disk spills;
- repeated table lookups;
- lock waits not represented by the plan.

Use engine-specific plan tools. Read from the leaves upward to understand how rows are retrieved, and then follow how joins, filters, and sorts transform them.

### Step 4: Form a specific hypothesis

A good hypothesis identifies a measurable source of waste. For example: “This endpoint sorts all orders for a customer and then discards all but 20 rows; a composite index on customer and descending creation time may avoid the sort and reduce rows visited.”

A weak hypothesis is “Indexes make databases faster.” The stronger statement can be tested and falsified.

### Step 5: Change one variable

Change one major factor at a time: index, predicate, join shape, selected columns, pagination, batching, or application query count. If you change five things at once and performance improves, you may not know which change helped or which one created a hidden trade-off.

### Step 6: Compare equivalent runs

Compare the same parameters, data volume, cache conditions, concurrency, and measurement method. Check result equivalence, not just speed. A faster query that omits rows or changes ordering semantics is a bug.

### Step 7: Validate the workload trade-off

Measure write overhead, index size, CPU, memory, pool wait, and neighboring query performance. An index may improve one endpoint while slowing inserts or consuming cache needed by other queries.

### Step 8: Roll out and monitor

Deploy to a controlled environment, compare production metrics, and monitor for regressions. Have a rollback or index-removal plan where appropriate. Document the original bottleneck, evidence, change, and result.

## 4. Reading a PostgreSQL Plan

Consider a query:

```sql
SELECT id, created_at, total_amount
FROM orders
WHERE customer_id = 42
ORDER BY created_at DESC
LIMIT 20;
```

A conceptual plan might contain a scan on `orders`, a sort, and a limit. The important questions are:
- How many rows did the scan examine?
- How many survived the filter?
- Did the sort process thousands or millions of rows?
- Was the limit applied only after the expensive work?
- Could an index retrieve the relevant customer's newest orders directly?

A candidate index is:

```sql
CREATE INDEX idx_orders_customer_created
ON orders (customer_id, created_at DESC);
```

The index may let the engine seek to a customer's range and return rows in the required order, stopping once it has enough. Whether it does so depends on statistics, data distribution, selected columns, and the actual planner.

Use:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, created_at, total_amount
FROM orders
WHERE customer_id = 42
ORDER BY created_at DESC
LIMIT 20;
```

Compare actual rows, loops, execution time, and buffer activity before and after. `BUFFERS` helps reveal cache and I/O behavior, but interpret the numbers in context. `EXPLAIN ANALYZE` adds instrumentation overhead and executes the query, so measurements may differ from ordinary execution.

### Plan-node interpretation

- **Seq Scan:** reads a table sequentially. It may be optimal for small tables or broad results.
- **Index Scan:** uses an index to locate rows and fetches table data as needed.
- **Index Only Scan:** may answer from index contents when visibility and other requirements permit.
- **Bitmap Index/Heap Scan:** combines index matches and visits heap pages in a batched pattern.
- **Sort:** orders rows; inspect the number of rows and whether it spills to disk.
- **Nested Loop:** repeats the inner operation for outer rows; watch loop count and inner cost.
- **Hash Join:** builds/probes a hash structure; inspect memory and spill behavior.
- **Aggregate:** computes grouped or global values; consider input row count and grouping cardinality.
- **Limit:** restricts output, but does not necessarily reduce upstream work if the plan must sort or scan first.

Never judge a plan node by name alone. The row counts, loops, actual time, and surrounding plan determine whether it is problematic.

## 5. Advanced Patterns

### Pattern 1: Composite index aligned with filter and order

**Use when:** a high-volume endpoint filters by an equality key and returns the newest or oldest records.

```sql
CREATE INDEX idx_events_account_time
ON events (account_id, occurred_at DESC, id DESC);
```

For a query that filters `account_id`, orders by `occurred_at DESC, id DESC`, and applies a limit, this index may support both lookup and ordering. Include a unique tie-breaker in the ordering for stable pagination.

**Validate:** compare plan shape, rows visited, buffers, latency distribution, index size, and write overhead. Avoid creating the index if the query is rare or another index already serves the same pattern.

### Pattern 2: Keyset pagination for deep feeds

**Use when:** clients page through a large, ordered dataset.

```sql
SELECT id, occurred_at, event_type
FROM events
WHERE account_id = $1
  AND (occurred_at, id) < ($2, $3)
ORDER BY occurred_at DESC, id DESC
LIMIT 50;
```

This PostgreSQL example assumes compatible descending order and non-null cursor fields. Handle nulls and mixed sort directions explicitly. The cursor must encode the last row's complete sort key. Keyset pagination avoids walking a huge offset and is more stable under inserts than offset pagination, but it does not naturally support arbitrary page jumps.

### Pattern 3: Replace N+1 queries with a bounded batch

**Use when:** application code issues one query for a list and one additional query per row.

Instead of querying each owner's profile separately, fetch the required owners in one batch:

```sql
SELECT id, display_name, avatar_url
FROM users
WHERE id = ANY($1);
```

This is PostgreSQL-style syntax; driver array binding varies. An ORM may offer eager loading or a batch loader. Ensure the batch is bounded and does not fetch every user in the system. Preserve missing-related-record behavior and avoid multiplying rows by joining several independent one-to-many relationships into one huge result.

### Pattern 4: Partial indexes for stable subsets

**Use when:** queries repeatedly target a small, well-defined subset such as unprocessed jobs.

```sql
CREATE INDEX idx_jobs_ready_created
ON jobs (created_at, id)
WHERE status = 'ready';
```

Partial indexes are supported by some engines, including PostgreSQL. They can reduce index size and write overhead compared with indexing every row, but the query predicate must be compatible with the index predicate for the planner to use it. If the subset changes or the predicate is not stable, this may not be a good fit.

### Pattern 5: Expression indexes for normalized lookups

**Use when:** queries repeatedly use a stable expression over a column.

```sql
CREATE INDEX idx_users_email_lower
ON users (lower(email));
```

The query should use a compatible expression. Consider collation, locale, normalization rules, and uniqueness semantics before making a normalized expression unique. An expression index accelerates lookup; it does not automatically ensure that the application stores normalized values consistently.

### Pattern 6: Pre-aggregation for recurring reports

**Use when:** an expensive aggregation is requested repeatedly and slight staleness is acceptable.

Instead of recomputing total daily sales from a huge order table for every dashboard request, maintain a daily summary table or materialized view. Define:
- the allowed freshness delay;
- how updates and late-arriving records are handled;
- how summaries are rebuilt;
- how duplicate processing is prevented;
- how summary totals are reconciled against source data.

Pre-aggregation trades query-time cost for write-time or scheduled maintenance. It is inappropriate if strict real-time correctness is required and the update strategy cannot guarantee it.

### Pattern 7: Reduce database round trips

**Use when:** latency is dominated by sequential queries rather than one expensive plan.

Batch independent lookups, avoid repeated existence checks, and fetch only required relationships. Where safe, parallelize independent operations, but do not overwhelm the connection pool or create uncontrolled concurrency. A transaction may improve consistency but can increase lock duration; use it because the operations need a shared consistency boundary, not simply as a performance decoration.

### Pattern 8: Diagnose parameter-sensitive plans

**Use when:** the same SQL is fast for one parameter and slow for another.

A query for a tiny tenant may return ten rows; the same query for a very large tenant may return millions. One plan may not be optimal for both. Check data skew, statistics, prepared-statement behavior, and representative parameter values. Database-specific options may influence plan selection, but forcing a plan or disabling planner features should be a last resort supported by measurements.

Prefer schema and query designs that behave predictably across the expected parameter distribution. If different workload classes need fundamentally different strategies, separate query paths may be clearer than a fragile planner hint.

## 6. Common Mistakes

| Mistake | Why it fails | Better approach |
|---|---|---|
| Adding indexes before measuring | Increases storage and write cost without proof | Find the expensive query and inspect its plan |
| Assuming a sequential scan is always bad | Broad scans can be cheaper than random index lookups | Evaluate rows returned, table size, and selectivity |
| Trusting planner cost as milliseconds | Cost is an internal estimate | Measure actual elapsed time and workload impact |
| Testing only one parameter | Data skew can change the plan dramatically | Test typical and worst-case parameters |
| Using `SELECT *` everywhere | Transfers unnecessary data and increases coupling | Select only needed fields on hot paths |
| Using deep `OFFSET` pagination | Work grows as earlier rows are skipped | Use keyset pagination where appropriate |
| Fixing N+1 with an enormous join | One-to-many relationships can multiply rows | Use a bounded batch or carefully designed eager load |
| Increasing pool size blindly | More concurrent work can overload the database | Measure pool waits and server saturation |
| Caching without invalidation rules | Stale or cross-user data may be served | Define keys, freshness, and invalidation explicitly |
| Optimizing SQL while ignoring lock waits | Query plan may not be the source of elapsed time | Inspect blocking and transaction duration |
| Changing many variables at once | The reason for improvement or regression is unclear | Test one major hypothesis at a time |
| Ignoring write overhead of indexes | Inserts and updates become more expensive | Measure total workload, not just one read |
| Running `EXPLAIN ANALYZE` carelessly | It executes the query and may mutate data | Use safe diagnostics and understand side effects |
| Assuming ORM calls are one query | Lazy loading may produce N+1 behavior | Inspect emitted SQL and query counts |
| Forcing an index without evidence | Can prevent the planner from choosing a better plan | Diagnose estimates and data distribution first |
| Comparing incomparable benchmarks | Cache, parameters, concurrency, and data differ | Use repeatable, representative conditions |
| Optimizing a rare query over a hot one | Total system impact may be negligible | Rank by total time and business impact |
| Ignoring result correctness | Faster output may be incomplete or differently ordered | Compare results and semantics as well as time |

## 7. Performance Testing and Verification

### 7.1 Establish representative test data

Data distribution matters as much as row count. A table with one million evenly distributed rows may behave differently from one with a few extremely large tenants, many duplicate values, or a handful of unusually common statuses.

Include realistic:
- table sizes;
- value distributions;
- null rates;
- tenant sizes;
- relationships and fan-out;
- recent versus historical data;
- read/write ratios.

### 7.2 Measure multiple dimensions

Capture at least:
- median, p95, and p99 latency where meaningful;
- throughput under realistic concurrency;
- rows returned and rows examined;
- database CPU and I/O;
- buffer/cache behavior;
- lock waits and connection-pool wait;
- index storage and write impact.

Do not report a single best-case run as proof. Repeat tests and understand variability.

### 7.3 Verify correctness

Compare result sets, row counts, ordering, null behavior, and boundary conditions. An optimization must preserve semantics unless the product requirement explicitly changes. A keyset pagination rewrite, for example, must handle ties and null sort values correctly.

### 7.4 Roll out carefully

Use staging or a controlled production rollout. Monitor the target query and neighboring workload. An index may improve one query but create cache pressure or slow writes elsewhere. Have a way to disable the changed code path or remove an unnecessary index if the impact is negative.

### 7.5 Keep a record

Document the original symptom, query identifier, baseline, plan evidence, hypothesis, change, before/after results, and trade-offs. This creates a knowledge base and prevents future engineers from repeating ineffective experiments.

## 8. Framework and Application Integration

### ORM query inspection

An ORM improves ergonomics but does not remove the need to understand SQL. Inspect generated queries, number of round trips, join shape, selected columns, and transaction boundaries. Use the ORM's logging or query-event facilities in development and controlled diagnostic environments. Avoid logging secrets or sensitive parameter values.

### Prisma-style example

An application-level pattern can accidentally load relations one by one. Use supported relation selection or include features when appropriate, but verify the emitted SQL and query count. The right query shape depends on relation cardinality and the ORM/database versions.

```typescript
const projects = await prisma.project.findMany({
  where: { ownerId },
  select: {
    id: true,
    title: true,
    createdAt: true,
  },
  orderBy: { createdAt: "desc" },
  take: 20,
});
```

Selecting only required fields and limiting the result set can reduce transfer and decoding. Add indexes based on the actual filter and ordering pattern, then inspect the database plan.

### Drizzle-style example

```typescript
const recentOrders = await db
  .select({
    id: orders.id,
    createdAt: orders.createdAt,
    totalAmount: orders.totalAmount,
  })
  .from(orders)
  .where(eq(orders.customerId, customerId))
  .orderBy(desc(orders.createdAt))
  .limit(20);
```

The exact API depends on the installed Drizzle version and schema definitions. The application query still needs database-level measurement and appropriate indexing.

### Raw SQL and parameterization

Parameterized SQL makes values safe and can enable statement reuse. Never build query strings by concatenating untrusted input. Parameters typically cannot stand in for table names or sort directions; use allowlists and identifier-quoting features for dynamic SQL structure.

### Application tracing

Correlate endpoint traces with database query timings. A slow page may issue many individually fast queries, wait for a pool connection, or serialize a large result. Database metrics and application traces together reveal the bottleneck more reliably than either alone.

## 9. Security and Reliability Considerations

- Parameterize all data values to reduce SQL injection risk.
- Use allowlists for dynamic sort keys and identifiers.
- Avoid logging credentials, tokens, or sensitive query parameters.
- Apply row-level access and tenant filters consistently.
- Include tenant identity in cache keys where relevant.
- Set sensible statement timeouts for workloads that can hang or become unexpectedly expensive.
- Avoid granting broad database privileges solely to simplify diagnostics.
- Test cancellation and timeout behavior.
- Treat query-plan output and database logs as potentially sensitive operational data.

Performance must not come at the expense of authorization or correctness. A query that accidentally omits a tenant filter is not an optimization; it is a data-isolation defect.

## 10. Production Investigation Runbook

### Before changing anything
- [ ] Identify the affected endpoint and normalized query.
- [ ] Capture baseline latency and query frequency.
- [ ] Check pool wait, lock waits, CPU, I/O, and connection counts.
- [ ] Record representative parameters and data volume.
- [ ] Capture an execution plan using safe diagnostic methods.
- [ ] Identify the plan node or application behavior that accounts for most work.
- [ ] State one testable optimization hypothesis.

### During the experiment
- [ ] Change one major factor at a time.
- [ ] Verify result correctness.
- [ ] Compare equivalent parameters and cache conditions.
- [ ] Measure read and write workload effects.
- [ ] Check index size and deployment impact where applicable.
- [ ] Keep a clear way to revert the experiment.

### After rollout
- [ ] Compare latency percentiles and throughput.
- [ ] Watch error rates, pool waits, lock waits, and database saturation.
- [ ] Verify the target query is actually using the intended strategy.
- [ ] Check neighboring queries and write performance.
- [ ] Remove redundant indexes only after careful analysis.
- [ ] Document evidence, results, and trade-offs.

## 11. Mental Models

**Optimize work, not syntax.** A shorter query is not inherently faster; the execution plan and workload determine the cost.

**The plan is a hypothesis from the optimizer.** Compare estimated and actual behavior, and investigate where they diverge.

**Indexes are workload investments.** They trade storage and write cost for faster access patterns.

**Latency has layers.** Query execution, lock waits, pool acquisition, network transfer, and application processing are different problems.

**Cardinality drives strategy.** The number and distribution of rows affect scans, joins, sorts, and index usefulness.

**One query is part of a workload.** A local win can be a system-wide loss if it slows writes or consumes shared resources.

**Correctness is a hard constraint.** An optimization that changes results, authorization boundaries, or stable ordering is not a valid optimization.

**Measure again after deployment.** Staging benchmarks are evidence, not a guarantee that production has the same distribution or concurrency.

## 12. Quick Reference

| Symptom | What to inspect first |
|---|---|
| Slow selective lookup | Predicate, matching index, estimates, table lookups |
| Slow broad report | Rows scanned, aggregation cost, summary strategy |
| Slow `ORDER BY ... LIMIT` | Composite index aligned with filter and order |
| Deep pages are slow | Offset cost; consider keyset pagination |
| Same query varies by tenant | Data skew, statistics, parameter-sensitive plans |
| Endpoint makes many queries | N+1 behavior and round trips |
| Query plan looks fast but endpoint is slow | Pool wait, locks, transfer size, app processing |
| Slow join | Join cardinality, row estimates, key types, indexes |
| Large sort or hash spills | Row volume, memory settings, earlier filtering |
| High database CPU | Query frequency, repeated work, scans, concurrency |
| High I/O | Access pattern, cache behavior, table/index size |
| New index slows writes | Index count, maintenance overhead, overlap |
| Stale results after caching | Cache keys, expiration, invalidation |
| Plan estimates are far off | Statistics, skew, correlated predicates |
| Production-only regression | Real data distribution, concurrency, parameter values |

### Questions to ask before approving an optimization

1. What metric is currently failing?
2. How frequently does the query execute?
3. What evidence identifies the dominant work?
4. Are estimated and actual row counts close?
5. Does the change preserve result semantics?
6. What is the read/write/storage trade-off?
7. Were representative parameters and concurrency tested?
8. How will the production result be monitored?
9. What is the rollback path?
10. What evidence will prove that the change helped?

## 13. Build Challenge: Optimize a Marketplace Orders Feed

A marketplace dashboard displays the newest 20 orders for a selected customer. The current endpoint is slow for customers with many orders and makes additional queries to retrieve associated customer display names.

### Requirements

1. Capture baseline latency and query frequency.
2. Inspect the SQL and execution plan for the orders feed.
3. Design an index based on the actual filter and sort order.
4. Ensure pagination has a stable unique tie-breaker.
5. Replace N+1 customer lookups with an appropriate join or bounded batch.
6. Select only the fields the interface needs.
7. Compare offset and keyset pagination at realistic depths.
8. Verify the same records and ordering are returned.
9. Measure write overhead and index storage.
10. Document rollout, monitoring, and rollback.

### Deliverables
- [ ] Baseline report with latency percentiles and query frequency.
- [ ] Before-plan and after-plan evidence.
- [ ] SQL or ORM changes with parameterization.
- [ ] Index migration and reasoned column ordering.
- [ ] Correctness tests for ties, empty results, and page boundaries.
- [ ] A performance test using realistic tenant sizes.
- [ ] Production monitoring checklist.
- [ ] Short explanation of trade-offs and remaining risks.

### Evaluation rubric

| Area | What good looks like |
|---|---|
| Diagnosis | Identifies the measured bottleneck rather than guessing |
| Plan literacy | Explains important nodes and row-count estimates |
| Index design | Matches a real filter/order pattern and considers write cost |
| Query shape | Avoids unnecessary fields and N+1 round trips |
| Correctness | Preserves results, authorization, and stable ordering |
| Measurement | Compares equivalent workloads and reports percentiles |
| Operations | Includes rollout monitoring and a recovery plan |
| Communication | Documents evidence, reasoning, and trade-offs |

**Completion standard:** the endpoint meets its performance target under representative load, returns the correct records in stable order, respects tenant boundaries, and has a documented explanation for why the change works.
