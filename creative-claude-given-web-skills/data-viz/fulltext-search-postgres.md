---
name: fulltext-search-postgres
layer: layer-19-data-viz
description: Design, implement, tune, and operate production-quality full-text search in PostgreSQL, from document modeling and text configuration through ranking, highlighting, indexing, pagination, security, testing, and operational maintenance.
---

# Full-Text Search with PostgreSQL

## Goal

Build a dependable PostgreSQL full-text search feature that returns relevant, permission-safe results with predictable latency and understandable ranking. This skill covers the complete path from source text to a useful search experience: choosing a document representation, generating `tsvector` values, querying with `tsquery`, ranking results, adding indexes, highlighting matches, paginating results, and validating behavior under realistic data and load.

Use this skill when PostgreSQL is the primary source of truth and the application needs search across titles, descriptions, articles, product details, support records, documentation, or other structured content. It is especially appropriate when the search requirements are substantial enough to need linguistic tokenization and ranking, but do not yet justify a separate search service.

## Why This Matters

A `LIKE '%term%'` predicate is easy to write but is usually a poor foundation for relevance-oriented search. It does not naturally understand lexemes, language stemming, stop words, phrase proximity, or ranking. It can also force expensive scans when the pattern begins with a wildcard. PostgreSQL full-text search supplies a built-in representation for searchable documents, a query language, relevance functions, highlighting utilities, and index support.

The challenge is not merely to make a query return rows. A production search feature must answer several questions:

- What text is searchable, and how are fields weighted?
- Which language configuration should tokenize and normalize the text?
- How will inserts and updates keep the search document current?
- Which index supports the actual query operator?
- How is relevance ranked and how are ties made deterministic?
- How are access-control predicates applied before results are exposed?
- What happens with empty input, punctuation, stop words, typos, and very broad queries?
- How can performance be measured and regression-tested as the corpus grows?

The right implementation makes these decisions explicit rather than burying them in a single SQL statement.

## Scope and Non-Goals

This skill focuses on PostgreSQL's native full-text search system:

- `tsvector` document representations
- `tsquery` query representations
- `to_tsvector`, `to_tsquery`, `plainto_tsquery`, `phraseto_tsquery`, and `websearch_to_tsquery`
- `@@` matching
- `ts_rank` and `ts_rank_cd`
- `ts_headline`
- GIN indexes and index maintenance
- generated columns or trigger-maintained search documents
- language configurations and weighted fields
- safe query construction, authorization filters, pagination, testing, and operations

Native full-text search is not a universal replacement for every search engine. Typo tolerance, complex autocomplete, cross-system aggregation, sophisticated synonym management, vector similarity, and highly customized ranking may require additional techniques or a dedicated search platform. Do not promise capabilities that the selected implementation does not provide.

## Core Mental Model

PostgreSQL full-text search separates document processing from query processing.

1. A document's text is parsed and normalized into lexemes.
2. A `tsvector` stores the normalized terms and, optionally, their positions and weights.
3. User input is converted into a `tsquery`.
4. The `@@` operator determines whether the document vector matches the query.
5. Ranking functions estimate which matching documents are more relevant.
6. A GIN or another suitable index narrows the candidate set for supported search predicates.
7. Application code applies permissions, ordering, limits, and response formatting.

For example:

```sql
SELECT
  id,
  title,
  ts_rank(search_vector, websearch_to_tsquery('english', $1)) AS rank
FROM articles
WHERE search_vector @@ websearch_to_tsquery('english', $1)
ORDER BY rank DESC, id DESC
LIMIT 20;
```

This is a useful starting point, not a complete production design. The vector must be populated correctly, the language configuration must match the corpus, and the index must match the predicate.

## 1. Model the Searchable Document

Begin by defining what one search result represents. Search normally operates on an entity such as an article, product, help document, or support ticket—not on arbitrary fragments of database rows.

Write down the fields that should be searchable and their relative importance. A product title might matter more than a long description; a help article heading might matter more than its body; tags might be useful but should not dominate all other text.

Example schema:

```sql
CREATE TABLE articles (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title        text NOT NULL,
  summary      text NOT NULL DEFAULT '',
  body         text NOT NULL DEFAULT '',
  status       text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
```

Decide whether related records belong in the same searchable document. If tags are stored in another table, for example, joining and aggregating them during every query may be expensive and complicated. Possible solutions include a denormalized search document, a materialized representation, or a separate search table maintained when related data changes. Choose based on update frequency, data volume, and consistency requirements.

### Search contract checklist

Before writing SQL, specify:

- The entity type returned for a match.
- Fields included in the search document.
- Relative field weights.
- Language or languages supported.
- Whether exact phrase queries are needed.
- Whether stemming is desirable.
- Whether punctuation, identifiers, codes, or part numbers must match literally.
- Which statuses are searchable.
- Which tenant or user permissions restrict visibility.
- Maximum query length and maximum result count.
- Expected corpus size, update rate, and latency target.

These decisions guide the schema, query syntax, index, and tests.

## 2. Understand `tsvector` and `tsquery`

A `tsvector` is a normalized representation of a document. A `tsquery` is a structured expression that describes the terms or logical relationships to match.

```sql
SELECT to_tsvector('english', 'The quick brown foxes are jumping');
```

The English configuration can remove stop words and normalize words to lexemes. The result is not simply a lowercase copy of the source text. Exact output depends on the text-search configuration and dictionaries.

A plain query:

```sql
SELECT plainto_tsquery('english', 'quick fox');
```

A phrase-oriented query:

```sql
SELECT phraseto_tsquery('english', 'quick brown fox');
```

A user-friendly web-style query:

```sql
SELECT websearch_to_tsquery('english', '"quick brown" OR fox -slow');
```

Use the query constructor that matches the product's query contract. Do not assume all constructors interpret punctuation and operators the same way.

### Choosing a query constructor

| Function | Best fit | Important behavior |
|---|---|---|
| `plainto_tsquery` | Plain text search box | Converts words into an AND-style query; user input is treated as text |
| `phraseto_tsquery` | Phrase matching | Represents word order and distance constraints |
| `websearch_to_tsquery` | Search box with familiar syntax | Supports quoted phrases, `OR`, and exclusion with a minus sign |
| `to_tsquery` | Trusted or carefully validated query syntax | Expects PostgreSQL text-search query syntax; raw user input can be invalid or unexpectedly expressive |

For ordinary search boxes, `websearch_to_tsquery` is often a good fit because it accepts familiar search syntax without requiring users to learn PostgreSQL's internal query grammar. `plainto_tsquery` is a simpler option when all terms should be treated as plain input. Choose one deliberately and test its edge cases.

## 3. Build a Search Vector with Weighted Fields

A common pattern combines multiple fields and assigns weights. PostgreSQL supports labels `A`, `B`, `C`, and `D`, where `A` is the highest-weight class.

```sql
SELECT
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(body, '')), 'D')
FROM articles;
```

The concatenation operator `||` combines vectors. `coalesce` prevents null fields from propagating null into the expression.

Weights should reflect the product's relevance model, not arbitrary intuition. A title match should often outrank a body-only match, but a very long body may contain many repeated terms. Ranking needs evaluation against representative queries and judged results.

### A generated search column

For a table where all relevant fields are on the same row, a stored generated column can keep the vector synchronized automatically:

```sql
ALTER TABLE articles
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(body, '')), 'D')
) STORED;
```

This is convenient because the database computes the value whenever the source row changes. Confirm generated-column capabilities and restrictions for the PostgreSQL version in use before adopting a design. For more complex document assembly—such as related-table data, language-specific configurations, or custom normalization—a trigger-maintained column or separate search-document table may be more appropriate.

### Trigger-maintained vector

A trigger is useful when the search document needs custom update logic. Keep the function small, deterministic, and covered by database tests.

```sql
CREATE FUNCTION articles_search_vector_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.body, '')), 'D');
  RETURN NEW;
END;
$$;
```

The table must have a compatible `search_vector` column before this trigger is installed. A trigger must be attached to inserts and relevant updates:

```sql
CREATE TRIGGER articles_search_vector_trigger
BEFORE INSERT OR UPDATE OF title, summary, body
ON articles
FOR EACH ROW
EXECUTE FUNCTION articles_search_vector_update();
```

Avoid maintaining the same column independently in application code and a database trigger. Two sources of truth can drift. Pick one authoritative mechanism.

## 4. Choose Language Configuration Carefully

Text-search configurations control parsing, stop-word removal, and normalization. The `english` configuration is common for English-language content, but it is not automatically correct for every dataset.

For example, stemming can make related word forms match. This improves recall for natural language, but can be undesirable for product SKUs, API names, usernames, legal identifiers, or exact technical terms.

Use the same intended configuration for vector generation and query construction. If the document vector uses English stemming while the query uses a different configuration, results can become surprising.

```sql
WHERE search_vector @@ websearch_to_tsquery('english', $1)
```

For multilingual content, decide whether each row has a language identifier and generate its vector with the appropriate configuration, or maintain language-specific vectors. A single language configuration over mixed-language content may produce inconsistent recall and ranking.

### Technical identifiers and mixed content

Full-text normalization may not preserve every symbol or token exactly as users expect. Test representative identifiers such as:

- `C++`
- `Node.js`
- `foo_bar`
- `AB-1234`
- email addresses
- version strings
- URLs
- file paths

If exact identifier matching is a core requirement, use a complementary normalized column, equality predicate, trigram index, or other suitable technique. Do not assume full-text search alone handles every punctuation-heavy token.

## 5. Index the Search Predicate

A GIN index is the usual starting point for indexing a `tsvector` column:

```sql
CREATE INDEX articles_search_vector_gin
ON articles
USING GIN (search_vector);
```

The query must use an index-supported predicate such as:

```sql
WHERE search_vector @@ websearch_to_tsquery('english', $1)
```

An index does not guarantee that every query will be fast. Broad queries, low-selectivity terms, large result sets, expensive ranking, and additional filters can still consume significant resources. Validate actual plans with `EXPLAIN (ANALYZE, BUFFERS)` on representative data.

### Build an index for an existing production table

For a busy table, a concurrent index build can reduce write blocking, subject to PostgreSQL's restrictions and operational considerations:

```sql
CREATE INDEX CONCURRENTLY articles_search_vector_gin
ON articles
USING GIN (search_vector);
```

`CREATE INDEX CONCURRENTLY` cannot run inside a transaction block. Follow the migration tool's instructions for non-transactional migrations and check for invalid indexes if a concurrent build fails.

### Partial indexes

If only published content is searchable, a partial index may reduce index size:

```sql
CREATE INDEX articles_published_search_gin
ON articles
USING GIN (search_vector)
WHERE status = 'published';
```

The query should include a compatible status predicate. The planner must be able to prove the query satisfies the partial-index condition. Partial indexes are not a substitute for authorization checks; they are a physical optimization.

## 6. Write a Safe Search Query

A baseline query should:

1. Convert user input using a safe query constructor.
2. Match against the vector.
3. Apply visibility and tenant filters.
4. Calculate rank for matching rows.
5. Sort by rank plus a deterministic tie-breaker.
6. Apply a bounded result limit.

```sql
WITH query AS (
  SELECT websearch_to_tsquery('english', $1) AS tsq
)
SELECT
  a.id,
  a.title,
  a.summary,
  ts_rank(a.search_vector, query.tsq) AS rank
FROM articles AS a
CROSS JOIN query
WHERE a.status = 'published'
  AND a.search_vector @@ query.tsq
ORDER BY rank DESC, a.id DESC
LIMIT $2;
```

Use bound parameters from the database driver. Do not concatenate user text into SQL. Parameterization prevents SQL injection, but it does not automatically define product-level query behavior: validate length, handle empty or stop-word-only input, and choose the right query constructor.

For a multi-tenant application, add the tenant predicate and any relevant access-control condition to the SQL query itself. Do not retrieve a broad set of results and filter unauthorized rows only after the database returns them.

### Empty and non-searchable input

A query can normalize to an empty `tsquery`, for example when it contains only stop words. Handle that explicitly:

```sql
WITH query AS (
  SELECT websearch_to_tsquery('english', $1) AS tsq
)
SELECT a.id, a.title
FROM articles AS a
CROSS JOIN query
WHERE numnode(query.tsq) > 0
  AND a.search_vector @@ query.tsq
  AND a.status = 'published'
ORDER BY a.id DESC
LIMIT $2;
```

The application may choose to show a helpful message, suggest a broader query, or avoid running the search. The correct response depends on the interface; the key is to avoid silently turning an empty query into an unintended full-table listing.

## 7. Rank Results Deliberately

`ts_rank` and `ts_rank_cd` provide ranking scores for matching documents. `ts_rank` considers matching lexemes; `ts_rank_cd` also considers cover density and proximity. Neither score should be interpreted as a probability that a document is relevant.

A weighted vector gives title terms more influence than body terms. Ranking can also be adjusted by business signals, such as freshness or popularity, but those signals should be measured and bounded rather than allowed to overwhelm textual relevance.

Example:

```sql
WITH query AS (
  SELECT websearch_to_tsquery('english', $1) AS tsq
)
SELECT
  a.id,
  a.title,
  ts_rank_cd(a.search_vector, query.tsq, 32) AS text_rank
FROM articles AS a
CROSS JOIN query
WHERE a.status = 'published'
  AND a.search_vector @@ query.tsq
ORDER BY text_rank DESC, a.published_at DESC NULLS LAST, a.id DESC
LIMIT $2;
```

The normalization argument changes score scaling. It is not a universal relevance improvement; compare alternatives with a judged query set.

### Combine textual and business signals carefully

A conceptual combined score might be:

```sql
text_rank * 0.85 + freshness_score * 0.10 + popularity_score * 0.05
```

Treat this only as a design example. The weights need calibration, and every signal needs a defined scale. If freshness is measured in days and popularity is an unbounded count, the raw values are not comparable. Normalize features, inspect the top results, and test whether each added signal improves relevance for real user queries.

Avoid ranking every row in the corpus before applying the match predicate. Filter to matching candidates first, then compute rank and order the bounded result set.

## 8. Highlight Matches Safely

`ts_headline` can generate snippets that emphasize matching terms:

```sql
SELECT
  id,
  title,
  ts_headline(
    'english',
    body,
    websearch_to_tsquery('english', $1),
    'StartSel=<mark>, StopSel=</mark>, MaxWords=28, MinWords=12'
  ) AS snippet
FROM articles
WHERE search_vector @@ websearch_to_tsquery('english', $1)
  AND status = 'published'
ORDER BY id DESC
LIMIT 20;
```

Highlighting is presentation output, not trusted HTML. Decide how the application renders it. If a snippet contains original user-authored HTML or other markup, do not inject it into the page unsanitized. Configure markers intentionally and use a rendering strategy that escapes source text while preserving only the intended highlighting tags. Also consider whether snippets reveal text from fields that should not be exposed in search results.

`ts_headline` may need to inspect source text to build a snippet. On large documents, generating snippets for many candidates can be expensive. First identify and rank a bounded result set, then generate snippets for the final page where practical.

## 9. Pagination and Stable Ordering

Offset pagination is simple:

```sql
ORDER BY rank DESC, id DESC
LIMIT $limit OFFSET $offset;
```

But deep offsets can become costly, and relevance scores may change when documents are updated. Always include a deterministic tie-breaker such as a unique ID. Without it, equal scores can appear in different orders between requests.

For large datasets, consider keyset pagination. A keyset cursor must encode the complete ordering tuple and the query context. With a calculated rank, the cursor might include rank and ID, but floating-point equality and changing document scores require care. For some applications, a short-lived search session or materialized list of result IDs provides more stable paging.

Do not promise perfectly stable pagination when the corpus or rank values can change between requests. State the behavior clearly and test it under concurrent updates.

## 10. Keep the Search Document Current

The index is only as accurate as the underlying vector. Choose a maintenance strategy based on how text is stored.

- **Generated column:** best when all source fields are on the same row and the expression is supported.
- **Trigger:** useful for custom row-level computation or controlled update behavior.
- **Application-managed column:** can work, but only if every write path reliably maintains it.
- **Dedicated search-document table:** useful when text is assembled from related tables or needs a distinct lifecycle.
- **Materialized view:** useful for some read-heavy aggregate representations, but refresh freshness and locking must be planned.

If tags, categories, or related entities affect search, their updates must trigger a refresh of the corresponding search document. A design that only updates the vector when the article body changes will become stale when a related tag changes.

For backfills, measure the write load and plan the rollout. A large update can generate substantial WAL, table bloat, replication lag, and index work. Consider batching, monitoring, and a staged deployment rather than one unbounded update in peak traffic.

## 11. Search UX Boundaries

Database search quality is only one part of the user experience. The API should define behavior for:

- Empty input.
- Input containing only stop words.
- Very long input.
- Punctuation-heavy identifiers.
- Quoted phrases and exclusion syntax.
- No results.
- Too many broad results.
- Slow or timed-out queries.
- Content that becomes unpublished during a search.
- A user losing permission to a record between requests.

The interface should preserve the submitted query and provide useful feedback. If typo tolerance is required, PostgreSQL full-text search alone may not satisfy it. Consider `pg_trgm` for similarity and substring-style matching, a carefully designed fallback, or a separate search engine. Keep the fallback bounded and do not run an unindexed wildcard scan over a large table.

## 12. Security and Privacy

Search endpoints can become data-leak paths because they aggregate information from many records. Apply tenant and permission predicates in SQL, use least-privilege database roles, and avoid exposing internal rank calculations or private fields unnecessarily.

Important safeguards:

- Parameterize every user-supplied value.
- Allowlist sortable fields and directions if sorting is dynamic.
- Enforce a maximum query length and result limit.
- Apply authorization predicates before results are returned.
- Avoid including hidden or restricted content in snippets.
- Review logs for personal data and sensitive search terms.
- Rate-limit endpoints when broad queries can be expensive.
- Use statement timeouts or request deadlines appropriate to the service.
- Test that unpublished, deleted, and cross-tenant records never leak.

Parameter binding prevents SQL injection, but it does not prevent a user from asking a valid query that is too expensive. Query limits and resource controls remain necessary.

## 13. Performance Diagnosis

Start with a realistic dataset and realistic queries. Use:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, title
FROM articles
WHERE status = 'published'
  AND search_vector @@ websearch_to_tsquery('english', 'database indexing')
ORDER BY id DESC
LIMIT 20;
```

Look for:

- Whether the expected index is considered.
- Actual rows compared with estimated rows.
- Rows removed by filters.
- Time spent scanning, sorting, and fetching heap tuples.
- Buffer hits and reads.
- Whether a broad query returns a large candidate set.
- Whether rank computation or snippet generation dominates.

An index may not be selected for a query matching a large fraction of the table because a sequential scan can be cheaper. Do not force an index without evidence. Inspect statistics, table distribution, and query shape before changing configuration.

### Operational signals

Track at least:

- Search request count and error rate.
- Latency percentiles.
- Empty-query and zero-result rates.
- Query length and result count distributions.
- Timeout and cancellation rates.
- Database CPU and I/O around search traffic.
- Index size and table bloat.
- Replication lag during backfills.
- Top expensive query patterns, with sensitive query text handled appropriately.

Performance budgets should be measured at realistic concurrency, not only in a local development database.

## 14. Testing Strategy

A full-text search implementation needs behavior tests and performance tests.

### Unit and integration behavior

Create representative fixtures covering:

- A term in the title versus the body.
- Singular and plural forms.
- Stop words.
- Phrases and phrase order.
- `OR` and excluded terms if using web-style syntax.
- Null and empty fields.
- Punctuation-heavy identifiers.
- Accented and multilingual text if supported.
- Unpublished records.
- Tenant boundaries and permission filters.
- Updates to searchable fields.
- Updates to related tags or categories.
- Empty or normalized-to-empty queries.

Assert expected result inclusion and exclusion, not only that the query runs.

### Relevance regression tests

Create a small, version-controlled query set with expected relevant documents. Measure metrics such as precision at a chosen cutoff or reciprocal rank when appropriate. Compare top results after changes to weights, configuration, or ranking formulas.

A ranking score alone is not a quality metric. A higher numeric score does not prove that users see better results.

### Performance tests

Load enough records to make the index and query planner behave realistically. Test common, rare, and broad terms; short and long documents; concurrent writes; and first-page versus deep-page requests. Record query plans and latency distributions so regressions can be identified.

## 15. Common Failure Modes

### Search vector is null or stale

**Likely cause:** the maintenance path was never installed, misses one field, or related-table changes do not refresh the document.

**Response:** inspect the vector for known records, verify trigger or generated-column behavior, and add a regression test for every write path.

### Results are too broad

**Likely cause:** query semantics are too permissive, the application uses OR behavior unintentionally, or ranking is not filtering candidates as expected.

**Response:** verify the actual `tsquery`, define AND/OR behavior explicitly, and test with representative queries.

### Results are too narrow

**Likely cause:** stemming configuration mismatch, stop-word removal, punctuation-heavy tokens, or AND semantics for every term.

**Response:** inspect generated vectors and query trees; test alternative query constructors; use a complementary identifier or trigram path when needed.

### GIN index is not used

**Likely cause:** query shape does not match the index, the predicate is not selective, statistics are stale, or a sequential scan is cheaper.

**Response:** inspect `EXPLAIN (ANALYZE, BUFFERS)`, verify the `@@` predicate, refresh statistics where justified, and test with production-like distributions.

### Ranking feels wrong

**Likely cause:** field weights, long documents, repeated terms, freshness, or popularity signals are poorly calibrated.

**Response:** build a judged query set, inspect top results, change one factor at a time, and measure quality rather than relying on a few anecdotal queries.

### Snippets leak markup or private text

**Likely cause:** the application trusts generated snippets as safe HTML or builds snippets from fields not meant for display.

**Response:** define a safe rendering contract, escape source content, and test authorization at the snippet level.

### Search gets slow as the corpus grows

**Likely cause:** broad queries, deep offsets, expensive rank/sort operations, large snippets, or stale statistics.

**Response:** measure the query plan, cap input and results, reduce unnecessary work, and consider specialized infrastructure if the requirements exceed PostgreSQL's practical fit.

## 16. Implementation Blueprint

Use this sequence for a new feature:

1. Define searchable fields, language, visibility rules, and relevance expectations.
2. Add the source schema and decide how the vector is maintained.
3. Build the `tsvector` expression and inspect output for representative documents.
4. Add a GIN index.
5. Implement a parameterized query using a deliberate query constructor.
6. Apply authorization and publication filters in SQL.
7. Add deterministic ordering and a bounded result limit.
8. Add snippet generation only if the interface needs it.
9. Write behavior, permission, and relevance tests.
10. Load representative data and inspect execution plans.
11. Deploy with migration and rollback considerations.
12. Monitor latency, errors, result counts, and index maintenance.

Do not start by tuning rank weights before confirming that the document representation and query semantics are correct.

## 17. Production Example

The following example assumes `articles.search_vector` is already populated and indexed. The application should pass the query and limit as bound parameters.

```sql
WITH input AS (
  SELECT websearch_to_tsquery('english', $1) AS tsq
),
matched AS (
  SELECT
    a.id,
    a.title,
    a.summary,
    a.body,
    a.published_at,
    ts_rank_cd(a.search_vector, input.tsq, 32) AS rank
  FROM articles AS a
  CROSS JOIN input
  WHERE numnode(input.tsq) > 0
    AND a.status = 'published'
    AND a.search_vector @@ input.tsq
)
SELECT
  id,
  title,
  summary,
  rank,
  ts_headline(
    'english',
    coalesce(summary, '') || ' ' || coalesce(body, ''),
    websearch_to_tsquery('english', $1),
    'MaxWords=32, MinWords=12'
  ) AS snippet
FROM matched
ORDER BY rank DESC, published_at DESC NULLS LAST, id DESC
LIMIT LEAST(GREATEST($2, 1), 50);
```

This illustrates the major pieces, but production implementation should avoid repeating query conversion unnecessarily if the query plan and driver support a clean alternative. It should also ensure that snippet source text is authorized for display and safely rendered. The maximum limit should be enforced at the API boundary as well as, where useful, in SQL.

## 18. Review Checklist

### Data and semantics

- [ ] Searchable fields are explicitly documented.
- [ ] Nulls are handled with `coalesce` where needed.
- [ ] The same intended text-search configuration is used for vectors and queries.
- [ ] Query constructor behavior is tested and documented.
- [ ] Technical identifiers have a defined matching strategy.
- [ ] Search vectors refresh for every relevant write path.

### Query and index

- [ ] The vector is indexed with an appropriate index, usually GIN.
- [ ] The query uses an index-supported `@@` predicate.
- [ ] User values are bound parameters.
- [ ] Authorization and publication filters are applied in SQL.
- [ ] Empty queries are handled explicitly.
- [ ] Ordering includes a deterministic tie-breaker.
- [ ] Result limits are enforced.

### Quality and operations

- [ ] Relevance is evaluated against representative queries.
- [ ] Query plans are inspected on realistic data.
- [ ] Snippets are safely rendered and do not expose hidden content.
- [ ] Latency, timeouts, errors, and result counts are observable.
- [ ] Backfills and index builds have an operational plan.
- [ ] There is a clear threshold for adding a complementary or external search system.

## 19. Practice Challenge

Implement full-text search for a small knowledge-base application.

Requirements:

1. Search `title`, `summary`, and `body`.
2. Give title matches the highest weight.
3. Support plain search-box input and quoted phrases.
4. Exclude unpublished articles.
5. Return a stable first page of results with rank and a short snippet.
6. Add tests for stop words, plurals, phrases, punctuation-heavy identifiers, and permissions.
7. Demonstrate the query plan before and after creating the GIN index.
8. Record a small set of expected top results for at least ten representative queries.

Deliverables should include the migration, query implementation, test fixtures, relevance notes, and a short performance report. A successful implementation is not simply one that returns matches: it should return the right matches, avoid unauthorized disclosures, and remain understandable to maintainers.

## 20. Review Rubric

Evaluate the implementation across five dimensions:

- **Correctness:** vectors stay current; query constructors are used appropriately; empty input and null values are handled.
- **Relevance:** field weights and ranking are validated against representative queries rather than guessed.
- **Security:** bound parameters, tenant and permission filters, bounded input, and safe snippet rendering are present.
- **Performance:** an appropriate index exists, plans are inspected on realistic data, and broad queries are controlled.
- **Maintainability:** schema choices, query semantics, operational signals, and known limitations are documented.

A strong implementation makes trade-offs explicit. It does not claim typo tolerance, exact identifier behavior, or stable cross-request pagination unless those behaviors are implemented and tested.

## 21. Advanced Considerations

### GIN maintenance and write load

GIN indexes are effective for text-search workloads, but index maintenance adds write cost. Bulk imports and frequent document updates can increase I/O and WAL volume. Measure both read latency and write throughput. PostgreSQL's GIN implementation has maintenance behavior and configuration options that may matter at scale; consult the documentation for the deployed major version before changing settings.

Do not blindly increase maintenance settings based on a single benchmark. Test with the actual data distribution, write rate, storage, and memory budget. Observe index size and database health after a representative import.

### Partitioning and tenant scale

Partitioning can help when data naturally separates by tenant, time, or lifecycle, but it is not an automatic search optimization. Partition pruning depends on predicates that identify relevant partitions. If every query must search every partition, partitioning may add planning complexity without reducing work. Benchmark the real query shape before adopting it.

For multi-tenant data, consider whether the tenant predicate is selective and whether indexes should be global or partition-local. Authorization remains a logical requirement independent of the physical partition design.

### Search configuration migrations

Changing dictionaries, stop-word lists, language configurations, or vector expressions can change the terms stored in existing vectors. Plan a rebuild or backfill when a configuration change requires regenerated vectors. A rolling deployment may need compatibility planning so old and new application versions do not interpret vectors differently during the transition.

Keep a documented version or migration record for important search configuration changes. Include regression queries and expected behavior so the team can distinguish an intentional relevance change from a defect.

### When PostgreSQL is no longer enough

Consider a complementary service or a dedicated search engine when requirements include advanced typo tolerance, sophisticated autocomplete, extensive synonym control, complex facets, federated search across multiple sources, independent search scaling, or ranking experimentation beyond what the current implementation can maintain comfortably.

Make this decision using measured evidence: query volume, latency, quality gaps, operational cost, and development complexity. A separate system introduces synchronization, consistency, deployment, and incident-response responsibilities. It is not free performance.

## 22. Final Principles

- Treat search as a product contract, not a single SQL expression.
- Keep document generation and query generation consistent.
- Use parameterized queries and enforce visibility in the database query.
- Index the predicate that the application actually executes.
- Rank matching candidates, use deterministic ordering, and bound the response.
- Test language behavior, edge cases, permissions, and relevance.
- Measure query plans and real latency before tuning.
- Be explicit about the limits of native full-text search and add other techniques only when the requirements justify them.
