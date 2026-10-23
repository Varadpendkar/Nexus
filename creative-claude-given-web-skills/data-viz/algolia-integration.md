# Algolia Integration

## Skill Metadata

- **Skill name:** `algolia-integration`
- **Layer:** `layer-19-data-viz`
- **Primary focus:** Integrate Algolia-powered search into a web product with secure indexing, relevant results, responsive search UX, and observable operations.
- **Use when:** A product needs hosted search across a catalog, documentation, articles, products, locations, or other indexed records.
- **Core principle:** Search quality is a product of data modeling, indexing, ranking, query design, user experience, security, and measurement—not merely an API call.

## Goal

Design and implement an Algolia integration that returns relevant, understandable results while keeping credentials secure and index data fresh. The implementation should define a searchable record schema, choose an indexing strategy, configure searchable and filterable attributes, integrate the client safely, support useful query states, and evaluate result quality with real user tasks.

This skill focuses on the engineering patterns around Algolia. Exact API names and configuration details can differ by SDK version, framework, and product features. Check the documentation for the installed SDK and the features enabled in the target Algolia account before relying on version-specific behavior.

## Why This Matters

Search often sits between a user's intent and the content they need. A technically successful request can still produce a poor experience when the index contains stale records, fields are weighted badly, filters are applied incorrectly, or results are difficult to scan. Security mistakes can expose administrative credentials or private records. Operational mistakes can leave the search index inconsistent with the source database.

A dependable integration has to answer:

- What is the source of truth?
- What fields should be searchable, displayed, filtered, or used for ranking?
- Which data is public, and which data requires authorization?
- How does the index stay synchronized with the source?
- How should the interface handle empty, loading, error, and no-result states?
- How will search relevance be evaluated and improved?
- How will the team detect indexing failures and quality regressions?

## 1. Understand the Search Architecture

Algolia is a hosted search service. A typical integration has three main responsibilities:

1. **Indexing pipeline:** sends normalized records from the source system into an Algolia index.
2. **Search client:** sends user queries and supported filter parameters to the search service.
3. **Search interface:** presents results, filters, suggestions, loading states, and recovery actions.

The source database or content system should normally remain the source of truth. The search index is a derived representation optimized for retrieval. It should not become the only place where business-critical data exists.

### Typical data flow

```text
Source database / CMS
        |
        v
Normalize and validate records
        |
        v
Indexing job or event-driven worker
        |
        v
Algolia index
        |
        v
Browser search client using a restricted search key
        |
        v
Results, facets, filters, and query state
```

The browser should never receive an administrative API key. Public search keys are designed for client-side search and can be restricted to particular indices and permissions. Private data should not be made public simply because the interface intends to hide it.

## 2. Identify the Search Use Case

Before configuring an index, determine what users are trying to find.

Common use cases include:
- Product or service catalogs.
- Documentation and knowledge bases.
- Articles, blog posts, and editorial content.
- Locations and service listings.
- Internal records with authenticated access.
- Autocomplete and query suggestions.
- Multi-category search across several record types.

The use case determines the record schema, ranking priorities, filters, and result layout. A product search may prioritize availability, category, brand, and product name. Documentation search may prioritize title, headings, and content relevance. An article archive may prioritize title and excerpt while respecting publication status.

Do not copy a generic schema into every index. Model the fields that genuinely help users find and evaluate the target content.

## 3. Design Search Records

Each indexed record needs a stable identifier and fields that represent the content users search for or use to narrow results.

Example product record:

```json
{
  "objectID": "product_4821",
  "name": "Wireless Noise-Cancelling Headphones",
  "brand": "Example Audio",
  "category": "Headphones",
  "description": "Over-ear headphones with active noise cancellation.",
  "price": 8999,
  "currency": "INR",
  "inStock": true,
  "popularity": 72,
  "updatedAt": 1792700000
}
```

This is illustrative data, not a claim about a specific product or account. The actual schema should match the source system and business requirements.

### Schema design rules

- Use a stable `objectID` that does not change when a title or slug changes.
- Normalize field types consistently.
- Keep searchable text concise and meaningful.
- Store numeric fields as numbers when numeric filtering or sorting is required.
- Use booleans for boolean attributes rather than strings such as `"true"`.
- Include only fields needed for search, filtering, ranking, display, or supported downstream workflows.
- Avoid indexing secrets, credentials, internal notes, or fields the user is not authorized to discover.
- Document the source of each field and how it is updated.
- Define what happens when a source record is deleted or becomes unpublished.

### Avoid accidental data leakage

If a record contains both public and private fields, do not index the entire source object blindly. Construct an explicit allowlist of fields to send. This is safer than trying to remove every sensitive field from an unrestricted object.

## 4. Choose a Stable Object ID

The object identifier is central to updates and deletion. If it changes every time a record is reindexed, the index can accumulate duplicates. If two unrelated records share the same ID, one can overwrite the other.

Good IDs are:
- Stable across updates.
- Unique within the index.
- Derived from a durable source identifier where possible.
- Consistent across create, update, and delete operations.

If multiple content types share an index, include a type prefix when needed, such as `article_123` and `product_123`. If separate indices are used, document how IDs are scoped.

Do not use a random ID generated anew on every indexing run. Do not use a mutable title as the only identifier. If the source's ID can be reused after deletion, define a strategy that prevents stale records from colliding with new entities.

## 5. Decide Which Fields Are Searchable

Searchable attributes should reflect how users describe what they need. Typical fields include:
- Name or title.
- Brand, category, or type.
- Summary or excerpt.
- Relevant descriptive text.
- Stable aliases or common synonyms, where supported and justified.

Not every field belongs in the searchable set. Searchable internal identifiers may produce confusing matches. Long unstructured descriptions can swamp more useful title matches if the ranking is not configured carefully.

### Attribute priority

A common starting order is:
1. Exact title or name.
2. Important labels such as brand or category.
3. Short summary or excerpt.
4. Detailed body text.

The right order depends on the domain. Test it with realistic queries rather than assuming a universal configuration.

### Field quality matters

Search cannot reliably recover information that is missing, inconsistent, or badly normalized. If the source stores a brand as `"Acme"`, `"ACME"`, and `"Acme Ltd."`, decide whether those are distinct entities or variations that should normalize to one canonical value. Keep the original display form if it matters, but make matching and filtering semantics deliberate.

## 6. Configure Attributes and Ranking Deliberately

Algolia index settings can control searchable attributes, custom ranking, filterable attributes, facets, and other retrieval behavior. Use the settings supported by the installed API and account configuration.

### Relevance dimensions

A result can be relevant because it:
- Matches the query closely.
- Matches a high-priority attribute.
- Has an exact or near-exact title match.
- Is popular or frequently selected.
- Is recent enough for the use case.
- Satisfies filters.
- Is available or otherwise eligible.

These dimensions can conflict. A highly popular result may be a poor answer to an exact-title query. A recent article may be less relevant than a canonical guide. Ranking should support intent rather than blindly optimize clicks.

### Ranking review questions

- Does an exact title match outrank a weak body-text match?
- Can a popularity signal overwhelm textual relevance?
- Is freshness important for this content type?
- Are unavailable records excluded or merely ranked lower?
- Does the ranking change in an understandable way when filters are applied?
- Are there queries for which the current ranking consistently fails?

Use a test set of queries and expected results. Change one major ranking factor at a time and compare outcomes.

## 7. Filters, Facets, and Numeric Constraints

A filter narrows results to records matching a condition. A facet helps users discover and select available values for a field. These capabilities depend on index configuration and supported filter syntax.

Typical filters include:
- Category or content type.
- Brand.
- Availability.
- Region or location.
- Publication status.
- Numeric ranges such as price.
- A supported access scope.

### Filter design rules

- Use canonical values for filter attributes.
- Decide whether multi-select means AND or OR within a facet.
- Make selected filters visible.
- Provide a clear way to remove one filter or reset all filters.
- Ensure the result count and available facet counts remain coherent.
- Do not send arbitrary user input as a raw filter expression.
- Validate filter values against the UI's supported choices.
- Keep authorization separate from ordinary user-selected filters.

A browser-provided filter is not a security boundary. If records require per-user authorization, enforce access control in a trusted layer or use an appropriate index and key strategy. Do not trust a client to request only records it is allowed to see.

## 8. Keep API Keys Secure

Client-side search generally requires a key with narrowly scoped search permissions. Administrative keys must remain on trusted server infrastructure.

Security practices:
- Never commit an admin key to a public repository.
- Never place an admin key in frontend environment variables that are bundled into client code.
- Restrict search-only keys to the intended index or indices.
- Apply supported restrictions such as permitted operations, filters, or expiry where appropriate.
- Rotate exposed keys promptly.
- Avoid logging credentials or signed search tokens.
- Keep private index access behind an authenticated server-side boundary.
- Review build output and browser network requests to verify that no secret is shipped.

A variable name such as `ALGOLIA_ADMIN_KEY` does not make a key secret if the build system exposes it to browser code. The trust boundary is determined by where the value is delivered, not by the variable's name.

### Public data versus private data

A public catalog can often be queried directly from the browser with a restricted search key. Internal records, tenant-specific content, or user-private documents need stronger access control. A UI filter that hides private records after retrieval is not sufficient because the data has already reached the browser.

## 9. Initialize the Search Client Safely

Use the supported Algolia SDK for the application and keep initialization in a shared module. Avoid creating a new client for every component render. Read public client configuration from the application's approved configuration mechanism.

Illustrative JavaScript pattern:

```ts
import { liteClient } from "algoliasearch/lite";

const appId = import.meta.env.VITE_ALGOLIA_APP_ID;
const searchKey = import.meta.env.VITE_ALGOLIA_SEARCH_KEY;

if (!appId || !searchKey) {
  throw new Error("Search configuration is missing");
}

export const searchClient = liteClient(appId, searchKey);
```

This is an example for a Vite-style environment and a compatible SDK version. Verify the correct import and client API for the version installed in the project. Environment variable prefixes differ by framework, and any variable bundled into client code must be treated as public.

### Initialization checklist

- Validate that required configuration exists.
- Use a search-only key in the browser.
- Reuse the client.
- Keep index names centralized.
- Avoid logging keys.
- Fail clearly when configuration is missing.
- Keep test and production environments separate.
- Verify that the requested index exists and the key has the required permissions.

## 10. React Integration Patterns

A React search component should separate query state, request state, result data, and selected filters. If using an official React integration package, follow the installed version's documented hooks and components rather than manually reproducing its state management without a reason.

A minimal conceptual component might maintain:
- Query text.
- Current results.
- Loading state.
- Error state.
- Selected facets.
- Pagination or infinite-scroll state.

Avoid fetching on every keystroke without a policy. Debouncing can reduce unnecessary work, but the UI should remain responsive and the previous result set should not be mistaken for the result of the new query.

### Debounce with intent

Debounce is useful for text input when the user is still typing. It is not automatically appropriate for every filter action. A checkbox filter often should apply immediately. A form with an explicit submit action may not need a debounce at all.

When debouncing:
- Cancel or supersede obsolete work.
- Do not let an older response overwrite a newer query.
- Keep the current query visible.
- Indicate when the result list corresponds to a previous query while the new query is pending.
- Respect keyboard and screen-reader interaction.
- Test fast typing, clearing, and quickly changing filters.

## 11. Use InstantSearch When It Fits

Algolia's InstantSearch ecosystem provides framework integrations and reusable search UI patterns. It can reduce the amount of custom code needed for query state, hits, facets, pagination, and related behavior.

Use a supported InstantSearch integration when:
- The product needs a conventional search results page.
- Standard widgets cover most of the desired UX.
- The team wants established state synchronization patterns.
- The installed framework integration supports the target application.

A custom client integration may be preferable when:
- The UI is highly specialized.
- Search is embedded in a custom workflow.
- The application already has a data-fetching architecture that must be integrated carefully.
- Standard widgets do not match the product's interaction model.

Do not combine two competing sources of query state without a clear synchronization contract. If the URL, a global store, and an InstantSearch widget all independently own the query, they can drift apart.

## 12. Query State and URL Synchronization

For a full search page, the URL often should represent the query and meaningful filters so users can share or bookmark a result view. This also improves browser back/forward behavior.

Decide which state belongs in the URL:
- Query text.
- Selected facets.
- Sort order.
- Page number or cursor.
- Relevant search scope.

Avoid putting sensitive values or internal authorization details in the URL. Normalize the URL representation and define how invalid or unsupported values are handled.

### URL state rules

- Loading a shared URL should restore the intended search state.
- Changing a filter should update the URL according to product conventions.
- Browser back should restore the previous state predictably.
- Clearing the query should clear the URL's query parameter.
- Default values should be omitted or represented consistently.
- The displayed results should always correspond to the visible URL state.

If the URL changes before the request completes, show a loading or pending state rather than presenting old results as if they match the new URL.

## 13. Autocomplete and Search Suggestions

Autocomplete helps users discover queries or jump directly to a result. It can include:
- Query suggestions.
- Recent searches stored under an approved privacy policy.
- Popular searches.
- Matching records.
- Category shortcuts.

Keep suggestions focused. A dropdown with too many sections and many results can make typing harder. Query suggestions and document results are different concepts; label them clearly.

### Keyboard behavior

A good autocomplete generally supports:
- Typing without interruption.
- Arrow-key navigation through suggestions.
- Enter to select the active option.
- Escape to close the popup.
- A predictable focus model.
- Clear screen-reader announcements for result counts or changes.
- Pointer interaction without breaking keyboard state.

Follow an established accessible combobox pattern rather than inventing keyboard behavior. Avoid moving focus unexpectedly on every keystroke. Test with keyboard-only navigation and assistive technology.

### Avoid misleading suggestion ranking

Popular queries can help, but popularity should not override the user's typed intent. Suggestions should respond to the current query and use clear labels. If suggestions include sponsored or promoted content, distinguish that from ordinary relevance-based results.

## 14. Result Cards and Information Scent

Search results should make it easy to determine whether an item is worth opening. A typical result card may show:
- Title.
- Short excerpt with query context.
- Content type or category.
- Relevant metadata such as date, brand, or location.
- A clear navigation target.
- Optional image when it improves recognition.

Do not show every field in the indexed object. Choose the information that helps users compare results and understand why a record might match.

### Snippet quality

A snippet should provide enough context to assess relevance. Avoid blindly truncating the first characters of a long description if the query match occurs much later. Use supported highlighting or snippet behavior where appropriate, and verify that highlighted content is rendered safely.

Do not insert raw HTML from indexed content into the page. If the search SDK returns markup or highlight fragments, use the documented safe rendering mechanism and sanitize or escape content according to the framework's security model.

## 15. Empty Results and Query Recovery

“No results” is a normal search state, not necessarily an error. It should help the user recover.

Useful options:
- Show the query that produced no results.
- Offer spelling or wording suggestions when supported.
- Allow filters to be removed.
- Offer a broader search scope.
- Suggest related categories or known popular content.
- Explain if a selected filter is too restrictive.
- Preserve the user's query so they can edit it.

Do not automatically remove filters without telling the user. Do not show unrelated popular results as if they matched the query. If fallback recommendations are offered, label them as alternatives.

Differentiate:
- A successful query with no matches.
- A request failure.
- A missing or unauthorized index.
- A malformed query or configuration error.
- A search that returns results but no records after a separate local filter.

These states require different messages and debugging paths.

## 16. Indexing and Synchronization Strategy

The indexing pipeline should update Algolia whenever the source records change according to the product's freshness needs. Common strategies include:
- Scheduled full or incremental indexing.
- Source-system webhooks.
- Database change events.
- Background jobs triggered by application writes.
- A hybrid strategy with event-driven updates and periodic reconciliation.

A reliable pipeline should be idempotent where possible. Reprocessing the same source record should update the same `objectID`, not create duplicates. Deletions and unpublished content must be reflected in the index.

### Full reindex versus incremental update

A full reindex can be useful for rebuilding after schema changes or correcting widespread data issues. Incremental updates reduce routine work but can miss changes if the event pipeline fails. Many systems benefit from both: incremental updates for freshness and periodic reconciliation to detect drift.

The exact strategy depends on index size, update frequency, operational cost, and acceptable delay. Document the expected synchronization lag.

## 17. Data Normalization Before Indexing

Do not send inconsistent raw database records directly into the index. Normalize values:
- Canonical category and brand names.
- Stable booleans.
- Numeric price fields with a consistent currency convention.
- Consistent dates or timestamps.
- Clean searchable text.
- Explicit publication and availability status.
- Stable URLs or slugs.
- Required IDs and schema version where useful.

Be cautious with HTML content. If indexing article bodies, remove irrelevant markup and navigation noise while preserving meaningful text. If indexing multilingual content, define language-aware normalization and tokenization behavior supported by the platform.

### Normalize without destroying meaning

Do not strip punctuation indiscriminately from identifiers, model names, or technical terms. Punctuation can be semantically important in code, product models, version numbers, and abbreviations. Test normalization against real queries.

## 18. Deletion, Unpublishing, and Privacy Changes

Deletion is part of indexing, not an afterthought. If a record is removed from the source or changes to a private state, the indexing pipeline should remove or update the corresponding indexed record.

Potential failure cases:
- The source record is deleted but the delete event is lost.
- A record is unpublished but the update job fails.
- An indexing job partially completes.
- A record's `objectID` changes and the old version remains.
- A user loses access but cached results remain in the browser.

Use reconciliation jobs, tombstones, or other appropriate mechanisms to detect drift. For sensitive records, consider whether the system needs a rapid revocation path. The search index is a derived copy, so the security model must account for its update delay.

## 19. Ranking Evaluation and Search Analytics

Search quality should be evaluated with representative queries, not only a few successful manual tests.

Create a query set containing:
- Exact names.
- Partial names.
- Common spelling mistakes.
- Synonyms and alternate terms.
- Queries with multiple concepts.
- Queries that should return no results.
- Ambiguous queries.
- Queries that require filters.
- Long-tail queries.
- Queries for newly added or updated records.

For each query, define what a good result looks like. Relevance can be assessed with graded judgments, such as highly relevant, partially relevant, and irrelevant. Track measures appropriate to the task, such as whether relevant results appear near the top, but do not optimize a metric without checking whether it reflects user success.

### Useful signals

- Search success rate.
- Click-through rate, interpreted carefully.
- Query reformulation rate.
- No-result rate.
- Time to useful result.
- Filter usage.
- Conversion or task completion where appropriate.
- Queries with repeated failures.
- Latency and error rate.
- Index freshness lag.

Click-through alone is not proof of relevance. Users may click the first result because it is first, and a query can be resolved without a click. Combine quantitative analytics with task-based evaluation and privacy-conscious user research.

## 20. Analytics and Privacy

Search queries can contain personal or sensitive information. Collect only what the product needs, explain relevant analytics behavior, and follow applicable privacy and retention requirements.

- Avoid logging raw queries indefinitely without a reason.
- Redact sensitive values where possible.
- Do not place personal data into analytics events by default.
- Apply access controls to search analytics.
- Set retention periods.
- Aggregate data when individual-level history is unnecessary.
- Ensure query logs are not exposed to unrelated users.
- Test that analytics events are not emitted multiple times because components mount more than once.

Analytics can improve relevance, but the collection mechanism must not become a secondary data leak.

## 21. Performance and Cost Awareness

Search performance depends on network latency, query complexity, index settings, payload size, result count, rendering, and the number of requests.

Useful practices:
- Debounce query text where appropriate.
- Avoid duplicate requests for identical state.
- Request only the result count and attributes needed by the UI when supported.
- Keep result cards efficient.
- Paginate or use an appropriate infinite-scroll pattern.
- Avoid indexing large unused blobs.
- Use a shared client.
- Cache only where the semantics and privacy model permit it.
- Measure real latency and error rates.
- Avoid excessive autocomplete requests for every single character when the product does not need them.

Do not optimize by reducing result quality without measurement. A faster response with stale or irrelevant results may be worse than a slightly slower useful result.

## 22. Pagination and Infinite Scroll

Pagination makes the current position explicit and is often easier to navigate, share, and test. Infinite scroll can work well for exploratory discovery but needs deliberate focus, loading, and history behavior.

For pagination:
- Keep the current page in sync with the URL when useful.
- Reset the page when the query or filters change.
- Show the current page and available navigation controls.
- Handle an empty page after data changes.

For infinite scroll:
- Prevent duplicate page fetches.
- Keep loading indicators near the list.
- Avoid moving focus unexpectedly when new items arrive.
- Provide a route to reach the footer and other page controls.
- Consider a “Load more” button as a predictable, accessible alternative.
- Preserve scroll position when the user opens and returns from a result.

Do not append new pages if the query state has changed since the request began. An old response should not be added to the new result set.

## 23. Error Handling and Observability

Search failures can occur in the browser, network, service, index configuration, or indexing pipeline. Capture enough information to diagnose the issue without exposing credentials or sensitive content.

Useful metrics include:
- Search request latency.
- Request error rate.
- No-result rate by safe query grouping.
- Indexing job success and failure.
- Source-to-index synchronization lag.
- Number of records processed and rejected.
- Delete/update processing failures.
- Invalid schema records.
- Rate-limit responses.
- Search key or permission configuration failures.

Separate user-facing errors from internal diagnostics. A user can receive a simple message and retry action, while logs record a correlation ID, operation type, and safe status metadata.

## 24. Testing Strategy

### Unit tests

Test record normalization, object ID generation, filter construction, query parameter validation, URL serialization, and result formatting.

### Integration tests

Use a test index or mocked client to verify query submission, facet state, pagination, and empty/error behavior. Avoid depending on production data that changes unpredictably.

### Indexing tests

Verify that:
- A create operation produces one record.
- An update modifies the same record.
- A delete removes the record.
- A failed batch can be retried safely.
- A repeated job does not create duplicates.
- Private fields are excluded.
- An unpublished record is not returned where it should not be.
- The configured searchable and filterable attributes match the UI's assumptions.

### Browser tests

Test typing, debounce behavior, keyboard autocomplete, URL synchronization, filters, browser back/forward, no results, request failures, and small-screen layout.

### Security tests

Confirm that only an intended search key is present in the browser, private records are not indexed into public indices, filters cannot bypass server authorization, and sensitive query data is not unintentionally logged.

## 25. Common Mistakes

| Mistake | Why it fails | Better approach |
|---|---|---|
| Shipping an admin key to the browser | Exposes privileged operations | Use a restricted search-only key |
| Indexing an entire database object | Can leak private fields and increase payload size | Build an explicit indexed-record schema |
| Generating a new object ID every run | Creates duplicate records | Use stable IDs |
| Treating the index as the source of truth | Index can lag or drift | Keep authoritative data in the source system |
| Making every field searchable | Noisy matches and weak ranking | Prioritize meaningful attributes |
| Ranking only by popularity | Exact-intent queries can be buried | Balance text relevance and business signals |
| Using arbitrary raw filter strings | Invalid or unsafe filter behavior | Construct filters from validated choices |
| Hiding private results only in the UI | Data has already reached the client | Enforce access control before results are exposed |
| Ignoring delete events | Stale or private records remain searchable | Handle deletion and reconcile periodically |
| Showing old results for a new query without context | Users may misunderstand the current state | Track query/result correspondence |
| Treating no results as a server error | Confuses normal search outcomes | Render a recovery-oriented empty state |
| Using click-through as the only quality metric | Position bias distorts conclusions | Combine metrics and judged query sets |
| Allowing old requests to overwrite new state | Search results mismatch the visible query | Cancel, sequence, or ignore obsolete responses |
| Rendering indexed HTML unsafely | Creates injection risk | Use safe text rendering and documented highlighting |
| Ignoring URL state | Breaks sharing and browser navigation | Synchronize meaningful query state |
| Reindexing without monitoring | Index drift can remain undetected | Track job status, rejected records, and lag |

## 26. Build Challenge: Searchable Product Catalog

Build a search page for a catalog with name, brand, category, description, price, availability, and product URL.

### Requirements

1. Define a typed source record.
2. Define an explicit indexed record.
3. Generate stable `objectID` values.
4. Normalize text and field types.
5. Exclude sensitive fields.
6. Configure searchable attributes.
7. Configure supported filterable attributes.
8. Configure a deliberate ranking strategy.
9. Use a restricted browser search key.
10. Keep administrative credentials server-side.
11. Implement query input.
12. Debounce query text if appropriate.
13. Prevent obsolete responses from replacing current results.
14. Add category filtering.
15. Add an availability filter.
16. Add a numeric price range if the product needs it.
17. Keep selected filters visible.
18. Implement a clear-all action.
19. Show loading state.
20. Show successful empty state.
21. Show a recoverable error state.
22. Provide readable result cards.
23. Format price with the correct currency.
24. Make result navigation keyboard accessible.
25. Support URL state if the page is shareable.
26. Implement pagination or accessible load-more behavior.
27. Test exact-name queries.
28. Test partial and misspelled queries.
29. Test a no-result query.
30. Test a filter combination with no matches.
31. Test index updates.
32. Test deletion or unpublishing.
33. Test repeated indexing for duplicate prevention.
34. Measure latency and no-result rate.
35. Document the source-to-index freshness target.
36. Add a reconciliation strategy.
37. Verify private fields are not exposed.
38. Test narrow-screen layout.
39. Document relevance tradeoffs.
40. Write a short operational runbook for indexing failures.

## 27. Failure-Injection Exercises

Deliberately test these cases:
- Missing application ID or search key.
- Invalid or expired search key.
- Requested index does not exist.
- Searchable attributes differ from the UI's expectations.
- A record lacks an object ID.
- Two source records map to the same object ID.
- An update job is replayed twice.
- A delete job fails.
- A source record becomes private.
- A query returns no results.
- A request fails while an earlier result list is visible.
- A slow response arrives after a faster response for a newer query.
- A facet selection removes all matches.
- The URL contains an unsupported filter.
- A long query exceeds the product's allowed input length.
- The index contains malformed or inconsistent field types.
- A user presses Escape in autocomplete.
- A user navigates backward after changing filters.
- A browser key is accidentally configured with excessive permissions.
- A search analytics event contains sensitive query text.

For each case, decide whether the expected outcome is a validation error, a user-facing empty state, a retry, a rejected indexing record, or an operational alert. Do not let failure behavior emerge accidentally from a generic catch block.

## 28. Definition of Done

The integration is ready for review when:
- The search use case and success criteria are explicit.
- The indexed record schema is documented.
- Object IDs are stable and unique.
- Searchable and filterable attributes are deliberate.
- Ranking is evaluated against representative queries.
- Public and private data boundaries are enforced.
- Administrative credentials never reach the browser.
- The index is synchronized with the source system.
- Update, delete, and unpublish paths are covered.
- Query, filters, and pagination have predictable state.
- Empty, loading, and error states are distinct.
- Autocomplete is keyboard accessible if present.
- Query and URL state remain consistent where applicable.
- Analytics are privacy-conscious.
- Relevance and freshness are monitored.
- Tests cover both search and indexing.
- The team can diagnose a stale or broken index.

## 29. Final Mental Model

Treat search as a complete retrieval system:

**Source Data → Normalized Records → Indexing Pipeline → Index Settings → Query & Filters → Ranking → Result UX → Analytics & Reconciliation**

The browser client is only one part of the system. A polished search box cannot compensate for an incorrect schema, poor ranking, stale index, or insecure data boundary. Design the record model and indexing lifecycle first, use a restricted client key, make the interface explain its state, and measure relevance with real user intent.


## 30. Recipe: Construct a Safe Filter Model

Represent filter choices as application state, not as free-form strings copied into a search request. For example, a category selection should come from a known list of categories, and a numeric range should be validated for finite values and sensible bounds before it becomes a filter expression.

Keep filter construction in one tested function. This avoids a category widget using one field name while a server-generated link uses another. It also makes the AND/OR semantics explicit. If multiple categories are selected, decide whether the user expects any selected category or all selected categories. Do not assume the library's filter syntax will automatically match the product's mental model.

A client-side filter is appropriate for narrowing a public catalog, but it is not a substitute for authorization. A user must not be able to remove a security restriction by editing the browser state. For protected data, enforce access scope in a trusted layer and verify it independently of the visible filter controls.

## 31. Recipe: Search-as-You-Type Without Race Conditions

When a user types quickly, several queries may be in flight. If the response for `ca` arrives after the response for `camera`, naïve state updates can replace the more relevant result set with the older one.

Use a request sequence or cancellation strategy. Each response should be associated with the query and filter state that produced it. Before applying a response, verify that it is still current. If the SDK or framework integration already handles this correctly, rely on its documented behavior rather than adding a second competing mechanism.

Test with deliberately delayed responses, not just normal network speed. Also test clearing the input while a request is pending, changing a facet during a query, and navigating away before a response arrives. The desired result is that the interface never labels old results as if they belong to a newer query.

## 32. Recipe: Searchable Documentation

Documentation search needs a record model that reflects how people ask technical questions. Useful fields may include page title, headings, excerpt, body text, product version, language, section, and canonical URL. Keep navigation boilerplate and repeated footer text from overwhelming meaningful page content.

Version is often an important filter. A user reading documentation for an older release should not unknowingly receive instructions for a newer version. Decide whether version is a hard filter, a ranking signal, or a visible label. For breaking changes, the distinction can matter more than a small increase in textual relevance.

Index headings and excerpts that give useful context. A result should show the relevant section and a snippet near the match where supported. Preserve code identifiers and punctuation that matter to developers. Evaluate exact API names, error messages, acronyms, and partial command strings as separate query cases.

## 33. Recipe: Indexing Job Reliability

An indexing worker should report what it attempted, what succeeded, what failed, and what remains to retry. A single “job failed” status is not enough when a batch partially completed. Record safe metadata such as job ID, source range, index name, record counts, duration, and error category.

Make retries idempotent and bounded. If a job can partially succeed, design the retry to update the same records safely. For large reindex operations, consider building and validating a new index before switching traffic, using the supported index-management approach for the service and SDK version. Confirm how aliases or index swaps behave in the target setup rather than assuming an atomic operation that may not be available.

Periodic reconciliation should compare the source of truth with the index at a useful level. The comparison can be based on record IDs, version fields, checksums, or other suitable metadata. The goal is to detect missing, stale, or orphaned records before they become a user-facing search problem.

## 34. Recipe: Synonyms and Alternate Vocabulary

Synonyms can improve retrieval when users use different words for the same concept, but careless synonym expansion can broaden queries too far. Begin with evidence from no-result queries, query reformulations, support tickets, and domain terminology. Add synonyms for genuine equivalence, not merely related concepts.

Distinguish a synonym from a category relationship. “Laptop” and “notebook computer” may be equivalent in a catalog, while “laptop” and “charger” are related but not interchangeable. Search should not imply that two different products or concepts are identical simply because users often browse them together.

Evaluate synonym changes against a fixed query set. Check both positive cases, where recall should improve, and negative cases, where unrelated results must not become prominent. Record why each synonym was added and who owns future review. Remove rules that create systematic false matches.

## 35. Recipe: Typo Tolerance and Exact Terms

Typo tolerance helps with ordinary misspellings, but technical domains contain identifiers where a single character matters. Product model numbers, software versions, command flags, part codes, and short acronyms may require different behavior from natural-language text.

Build a test set that includes common misspellings, exact identifiers, transposed characters, and near-collision terms. Confirm whether the service's typo-tolerance and ranking settings return the intended item. Do not disable typo tolerance globally just because one identifier is sensitive; consider field-specific settings or a query strategy supported by the platform.

When a query has no result, a suggestion can help the user recover, but do not silently rewrite a query in a way that changes its meaning. Make corrections understandable and preserve the original input so the user can choose.

## 36. Recipe: Multi-Index Search

A product may search across articles, products, and help pages. Decide whether the user expects one blended result list or separate result groups. A blended list requires a shared ranking strategy or a clear way to compare result types. Separate groups can be easier to interpret when content types have different relevance signals.

Keep each index's schema and access boundary explicit. Do not assume that a field called `category` has the same semantics in every index. If the UI merges results, normalize them into a common presentation shape while retaining their source type and canonical destination.

Test queries that match multiple content types. Ensure a highly relevant help page is not buried by many popular product results unless that is the intended product behavior. If each index has separate pagination or result limits, explain how the combined view decides which results to show first.

## 37. Review Rubric: Search Relevance

A relevance review should use a stable query set and a stated expectation for each query. Include exact names, broad topics, synonyms, misspellings, filters, ambiguous wording, and queries that should return nothing. Review the top results, not just whether the intended record appears somewhere in a long list.

Look for systematic patterns: titles being outranked by body text, popular items dominating exact queries, new records failing to appear, synonyms producing false positives, or filters hiding expected records. Change one major setting at a time and keep before/after results. If relevance is evaluated with a numerical metric, pair it with human inspection and task completion; no single metric captures every search goal.

## 38. Review Rubric: Security and Data Lifecycle

Review the full path from source record to browser result. Which fields are indexed? Which indices can the browser key search? Can a user alter filters to retrieve unauthorized records? How quickly are private or deleted records removed? What happens when an indexing job fails after a source permission change?

Test the key permissions directly, not only the user interface. Inspect the built frontend and browser requests for leaked secrets. Confirm that protected data is not copied into a public index and then hidden with CSS. For user-specific content, review cache isolation, tenant boundaries, and logout cleanup. Treat indexing delay as part of the security model when access can be revoked.

## 39. Review Rubric: UX and Accessibility

Test search with keyboard only. Can the user reach the input, navigate suggestions, select a result, clear filters, and recover from no results? Does focus remain predictable? Are selected filters and the active query visible? Are loading and error states announced appropriately without excessive announcements?

Check that result cards provide enough information to distinguish similar items. Avoid showing an unhelpful snippet, raw field names, or inaccessible clickable containers. Make clear whether clicking a title, card, or separate action opens the result. Test at narrow widths and with long titles, empty excerpts, and missing images. Search is a workflow, not just a list of hits.

## 40. Operational Runbook: Index Drift

If users report missing or outdated results, first identify the affected record IDs and expected source state. Check the source record, transformation output, indexing job history, and indexed record. Determine whether the problem is in source data, normalization, delivery, permissions, or query settings.

If the record is missing, verify that the indexing pipeline processed it and that the object ID is stable. If it is stale, compare update timestamps or source versions. If it appears when it should not, investigate publication state, deletion processing, index scope, and authorization. Avoid manually patching a single record without understanding whether the same defect affects many records.

After recovery, run reconciliation for the affected scope and verify the result with representative queries. Record the root cause and add a regression test. If the index was rebuilt or settings changed, re-run the fixed relevance test set.

## 41. Acceptance Checklist for Release

Before release, confirm:
- Index schema and source-of-truth ownership are documented.
- The browser receives only the intended search key.
- Indexed fields follow an explicit allowlist.
- Object IDs are stable and unique.
- Ranking has been evaluated with representative queries.
- Filters have documented semantics.
- Private data is protected by a trusted authorization boundary.
- Create, update, delete, and unpublish paths are tested.
- Search state and URL behavior are consistent.
- Autocomplete works with keyboard and touch.
- No-result recovery is useful and does not misrepresent unrelated results.
- Query and indexing latency are monitored.
- Analytics collection is privacy-conscious.
- Index drift can be detected and corrected.
- The team has a runbook for key, index, and pipeline failures.