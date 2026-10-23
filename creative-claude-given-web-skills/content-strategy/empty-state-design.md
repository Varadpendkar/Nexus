# Empty State Design

**Layer:** 5 — Content Strategy  
**Skill directory:** `empty-state-design/`  
**Target file:** `empty-state-design.md`  
**Purpose:** Design the first-use, no-results, cleared, unavailable, and permission-related states that help people understand why a screen has no content and what useful action they can take next.

---

## 1. Why This Matters

An empty state is not simply a blank page with an illustration. It is a moment when the interface has no primary content to show—or when it cannot show that content—and the user needs enough context to understand what happened. The screen might be empty because the person has not created anything yet, because a search returned no matches, because filters excluded all results, because an item was deleted, because a network request failed, or because the user does not have permission to view the data. Those situations look superficially similar, but they need different explanations and actions.

Treating every empty state the same creates confusion. A first-time user who sees “No projects found” may assume the product is broken, even though they simply have not created a project. A person who carefully applies filters and sees no results needs help adjusting the query, not a large onboarding illustration. A user whose access has been revoked needs a clear explanation and an appropriate path to request access—not a button that promises to create content. A network failure should not be described as a genuine absence of data. The interface must distinguish what it knows from what it cannot confirm.

Good empty states reduce uncertainty, preserve user agency, and keep the next step connected to the user's actual goal. They can teach the first meaningful action, help recover from a search, explain a temporary state, or communicate that there is genuinely nothing to do. They should not manufacture urgency, blame the user, or use decorative copy that delays task completion. Their value is measured by whether people understand the state and can proceed—not by whether the illustration is memorable.

Empty-state design sits at the intersection of content strategy, interaction design, product logic, and accessibility. The content designer must know the state's cause. The designer must establish the visual hierarchy and action. Engineering must expose reliable state information and avoid treating every empty array as proof that the server has no data. Product and support teams can contribute evidence about the questions people ask when they encounter the screen. If the implementation cannot distinguish “no data” from “data not loaded,” polished copy cannot rescue the experience.

A useful empty state typically answers three questions:

1. **What is happening?** State the situation in language that matches the actual system state.
2. **Why does it matter to me?** Provide enough context to remove ambiguity, without overexplaining.
3. **What can I do next?** Offer a relevant action, a recovery route, or a clear indication that no action is needed.

Not every state requires all three in equal measure. A genuinely empty notification inbox may need a calm confirmation and no button. A first-use workspace may need one clear creation action. A search with no matches may need a way to clear filters or broaden the query. A permission state may need to explain who can grant access. A failed request needs retry guidance and, if the failure persists, a support path.

Senior practitioners begin with a state model, not an illustration. They list the causes that can lead to an empty-looking view, identify what the system can reliably know, and map each cause to appropriate content and behavior. They also decide whether an empty state should replace the main content, appear within a section, or be shown as a compact inline message. They test the state at realistic viewport sizes, with keyboard navigation, assistive technology, and actual error conditions. They ensure that an action is available only when it is valid and that copy does not promise an outcome the system cannot deliver.

This skill matters in portfolios and creative projects because empty states are often overlooked in demos: the polished happy path looks good, but the first-time experience feels unfinished. It matters in production because empty states appear in dashboards, search, inboxes, shopping, analytics, file management, collaboration tools, and onboarding. It matters in freelance work because clients may ask for an illustration while the real issue is missing state logic. A strong solution identifies the state, writes precise copy, chooses a proportionate action, and specifies how the interface changes after that action.

The core rule is: **an empty state must explain the actual reason for emptiness and support the user's next useful decision**. Do not confuse no data with no access, no results with no connection, or a first-use state with an error. Design the state semantics first; then write the message, choose the action, and style the component.

### Production failures this skill should prevent

- **A blank dashboard looks broken.** The API returns an empty list, but the interface renders nothing. The user cannot tell whether setup is required or the request failed.
- **Search results disappear with no recovery path.** A user applies several filters and sees “No results,” but there is no obvious way to clear them or broaden the query.
- **The copy lies about system status.** The interface says “You have no files” while the files request is still loading or has failed.
- **A permission problem is treated as a content problem.** The user is told to create a record even though their role cannot access the section.
- **A first-use screen presents too many choices.** Six onboarding actions compete, so the user cannot identify the most useful starting point.
- **The design celebrates an empty state that is actually a failure.** A cheerful illustration and “All clear!” message mask a broken integration or stale data.
- **The action is invalid in context.** “Create report” appears in a read-only view where the user lacks permission to create reports.
- **An accessible user cannot discover the message.** The state appears visually, but focus remains on a removed control or an asynchronous update is not announced appropriately.
- **A mobile layout hides the recovery action.** The message is visible, but the only useful button is pushed below an oversized illustration.
- **The empty state persists after success.** A record is created, but the screen does not refresh or move the user to the new content, making the action appear ineffective.

The beginner asks, “What illustration should go here?” The senior asks, “Why is this state empty, what can we prove about its cause, and what is the most useful next step?” That difference determines whether an empty state is a decorative placeholder or a reliable part of the product.

---

## 2. Core Concepts

### 2.1 Model the cause before writing the message

Start by listing the conditions that can produce an empty-looking view. At minimum, consider first use, genuinely empty data, no search matches, filters excluding all items, deleted content, unavailable data, permission restrictions, and request failure. Some products need additional states such as archived-only content, expired invitations, disconnected integrations, or data that is still being processed.

The visible state should come from a known application condition, not from a designer's assumption that an empty list means the same thing everywhere. If the request has not completed, the interface is loading. If it failed, it is an error. If it succeeded and returned zero records, it may be a legitimate empty state. If the current user cannot access the records, the interface should follow the product's permission and privacy rules.

```js
function getEmptyStateKind({
  hasLoaded,
  hasError,
  hasPermission,
  itemCount,
  hasActiveFilters,
  hasQuery,
}) {
  if (!hasLoaded) return "loading";
  if (hasError) return "error";
  if (!hasPermission) return "permission";
  if (itemCount > 0) return "content";
  if (hasQuery || hasActiveFilters) return "no-results";
  return "first-use";
}
```

**Gotcha:** This is a conceptual example, not a complete application state machine. Real applications may need distinct “known empty,” “archived,” “not found,” or “access denied” states. Define precedence and privacy rules with engineering.

**Naive approach:** Render one `EmptyState` component whenever `items.length === 0`.

**Better approach:** Resolve the data, loading, error, permission, query, and filter states before choosing the message and action.

### 2.2 Distinguish first use from genuinely empty data

A first-use state teaches the user how to begin. It can explain the value of creating the first project, dashboard, saved search, or collection. A genuinely empty state may instead confirm that there are currently no items to review. The distinction matters because first use often benefits from a creation action, while a naturally empty inbox may not need one.

First-use copy should be specific to the task. “Let's get started” is friendly but not informative. “Create your first project to organize tasks and invite teammates” explains both the action and its purpose. If the product requires setup before creation, state the prerequisite rather than letting the user discover it through a failed action.

```html
<section class="empty-state" aria-labelledby="first-project-title">
  <h2 id="first-project-title">Create your first project</h2>
  <p>Projects keep related tasks, files, and decisions in one place.</p>
  <a class="button button--primary" href="/projects/new">Create project</a>
</section>
```

**Gotcha:** Do not show first-use guidance to returning users whose content is temporarily unavailable. The state should reflect confirmed account data, not an incomplete fetch.

**Naive approach:** Use the same “Nothing here yet” message for every new and returning account.

**Better approach:** Decide whether the user needs an introduction, a confirmation, or a recovery action based on the actual data state.

### 2.3 Treat no-results as a query problem, not an onboarding problem

No-results states occur when a search or filter combination returns zero matches. The user has already expressed an intent, so the most useful response usually helps them revise that intent. Possible actions include clearing filters, removing one restrictive condition, broadening the date range, checking spelling, or changing the search term.

Do not erase the user's query without permission. Preserve their work and explain which filters are active. If the interface can identify the restrictive filters reliably, offer a targeted way to remove them. If it cannot, provide a clear reset action and keep the search field editable.

```html
<section class="empty-state" aria-labelledby="no-results-title">
  <h2 id="no-results-title">No results match these filters</h2>
  <p>Try a broader date range or remove a filter to see more items.</p>
  <button type="button">Clear all filters</button>
</section>
```

**Gotcha:** “No results found” can be technically accurate but still unhelpful. Avoid blaming the user or suggesting that the entire system contains no data when only the current query has no matches.

**Naive approach:** Show an illustration and a “Create your first item” button after every empty search.

**Better approach:** Keep the user's search context and provide the smallest useful recovery action.

### 2.4 Keep loading, empty, and error states separate

A loading state means the system has not finished retrieving or calculating the content. An empty state means the system has successfully established that there is nothing to display in the current context. An error state means the operation did not complete as expected. These are different claims and should not share the same copy.

The difference is especially important when the network is slow. If an empty message flashes before the request completes, users may interpret it as a data-loss event. If an error is disguised as an empty state, people may repeat searches or create duplicate records to compensate. Use explicit state flags and render the appropriate status.

```jsx
function ResultsPanel({ status, items, error, onRetry }) {
  if (status === "loading") return <p role="status">Loading results…</p>;

  if (status === "error") {
    return (
      <section aria-labelledby="results-error-title">
        <h2 id="results-error-title">Results couldn't be loaded</h2>
        <p>Check your connection and try again.</p>
        <button onClick={onRetry}>Try again</button>
      </section>
    );
  }

  if (items.length === 0) {
    return <p>No results match your current search.</p>;
  }

  return <Results items={items} />;
}
```

**Gotcha:** The component above is illustrative. Ensure `status` and `items` cannot contradict each other, and define what happens if the error object contains sensitive technical information. Do not expose stack traces to end users.

**Naive approach:** Treat any missing content as “nothing here.”

**Better approach:** Make loading, success-with-zero-results, and failure mutually clear states in the data flow and UI.

### 2.5 Explain permission and access states honestly

A permission state means the user cannot view or act on content under the current access rules. It is not the same as the content not existing. Copy should explain the next legitimate route: request access, switch account, contact an administrator, or return to a permitted area. Only disclose details the current user is allowed to know.

Security rules may intentionally avoid revealing whether a protected resource exists. In those cases, the message should follow the product's security policy rather than confirm hidden content. Do not include names, identifiers, or data from a record the user cannot access.

```html
<section aria-labelledby="access-title">
  <h2 id="access-title">You don't have access to this report</h2>
  <p>Ask a workspace administrator to review your permissions.</p>
  <a href="/help/access">Learn about report access</a>
</section>
```

**Gotcha:** Do not display a “Request access” action unless the product supports that workflow or the destination is real. A decorative button that cannot complete the promised task damages trust.

**Naive approach:** Tell every user that a record is missing when the actual issue is access.

**Better approach:** Match the wording and action to the permission model while preserving necessary privacy boundaries.

### 2.6 Choose one primary action

An empty state often has less content than a normal page, so multiple competing actions become especially distracting. Choose the action that best advances the user's current goal. A first-use project state may have “Create project” as primary and “Read the guide” as secondary. A no-results state may prioritize “Clear filters.” A disconnected integration may prioritize “Reconnect.”

A secondary link can still help users who are uncertain or need context, but it should not compete with the primary route. If there are several equally valid actions, the state may need a short decision aid or a different page structure rather than a row of bright buttons.

```html
<div class="empty-state__actions">
  <a class="button button--primary" href="/projects/new">Create project</a>
  <a class="text-link" href="/help/projects">Learn how projects work</a>
</div>
```

**Gotcha:** The action must match the state. “Create project” is wrong for a no-results search, and “Clear filters” is wrong when the user has no filters applied.

**Naive approach:** Add every possible next step to avoid choosing.

**Better approach:** Select one primary action, provide at most a small number of meaningful alternatives, and verify that each is valid in context.

### 2.7 Write a title that names the state

The title should quickly explain what is happening. “No projects yet,” “No matches for this search,” and “Activity couldn't be loaded” describe different states. Avoid titles that rely on jokes, metaphors, or vague phrases when the user needs to understand system behavior.

Tone can still be warm. Clarity and personality are compatible, but clarity should lead. The user should not have to read a paragraph or interpret an illustration to discover the reason the content is missing.

```text
Weak:  It's a little quiet in here.
Clear: No saved searches yet.

Weak:  Whoops! Nothing to see.
Clear: No results match your current filters.

Weak:  The magic is taking a break.
Clear: We couldn't load your reports.
```

**Gotcha:** Do not say “No items exist” if the state only means that no items match the current view. Be precise about scope.

**Naive approach:** Write a playful headline first and leave the user to infer the situation.

**Better approach:** Name the actual state in the heading; add personality only when it does not obscure meaning.

### 2.8 Write supporting copy that explains the cause or next step

Supporting text should add information that the title does not already provide. It can explain why the state exists, how to recover, what prerequisite is needed, or what will happen after the action. Avoid repeating the title with slightly different words.

For a first-use state, explain the benefit of the first action. For a no-results state, suggest a practical adjustment. For a permission state, explain who can help. For a failure, provide a safe recovery path. Keep the message proportionate to the impact and complexity of the situation.

```text
Title: No saved reports yet
Supporting copy: Save a report from the analytics view to return to it quickly.
Primary action: Open analytics

Title: No matching orders
Supporting copy: Try a wider date range or remove the status filter.
Primary action: Clear filters

Title: Connection needs attention
Supporting copy: Reconnect the service to refresh its latest data.
Primary action: Reconnect
```

**Gotcha:** Avoid claiming a cause you cannot verify. If the system knows only that a request failed, say it could not load the content; do not assert that the user's internet connection is broken.

**Naive approach:** Use one generic supporting sentence everywhere.

**Better approach:** Add only the explanation or guidance that resolves the user's uncertainty for this specific state.

### 2.9 Make illustrations support meaning, not compete with it

Illustrations can make an empty state feel approachable and help communicate a concept. They are optional. A useful illustration reinforces the task or state, remains subordinate to the message, and does not push the primary action out of view. A decorative image that takes up most of the mobile viewport may make a simple recovery task slower.

Do not use imagery that implies the wrong state. A celebratory illustration may fit a successfully completed inbox, but not a failed synchronization. A sad or blaming character can make a normal first-use state feel like a mistake. If the illustration is decorative, provide empty alternative text so assistive technology does not announce irrelevant details.

```html
<section class="empty-state" aria-labelledby="saved-title">
  <img src="/images/empty-bookmarks.svg" alt="" aria-hidden="true">
  <h2 id="saved-title">No saved items yet</h2>
  <p>Save useful pages to find them here later.</p>
  <a href="/explore">Explore pages</a>
</section>
```

**Gotcha:** `alt=""` is appropriate for purely decorative imagery. If the image conveys information not present in text, provide a meaningful alternative instead.

**Naive approach:** Start with a large illustration and fit the message around it.

**Better approach:** Establish the state, message, and action first; use imagery only when it adds useful understanding.

### 2.10 Preserve the user's context and work

When a search or filter yields no results, preserve the query, selected filters, and other user input unless there is a strong reason not to. The user has already invested effort in describing what they want. Resetting everything without explanation makes recovery harder and can feel like data loss.

If the user changes a filter and the result count becomes zero, keep the active filter visible and offer an intentional reset. If a form submission fails, preserve entered values whenever it is safe. If an item is deleted, explain whether the action is reversible and whether a restore path exists.

```jsx
function NoMatches({ query, filters, onClearFilters }) {
  const filterCount = Object.keys(filters).filter(
    (key) => filters[key] !== null && filters[key] !== ""
  ).length;

  return (
    <section aria-labelledby="no-matches-title">
      <h2 id="no-matches-title">No matches for “{query}”</h2>
      {filterCount > 0 ? (
        <p>Remove one or more filters to broaden the results.</p>
      ) : (
        <p>Try a different search term.</p>
      )}
      {filterCount > 0 && (
        <button type="button" onClick={onClearFilters}>
          Clear filters
        </button>
      )}
    </section>
  );
}
```

**Gotcha:** Do not display raw, untrusted input unsafely in HTML. Use framework text interpolation or proper escaping, and avoid building HTML strings from a search query.

**Naive approach:** Reset the whole search form because it is easier to implement.

**Better approach:** Preserve the user's intent and offer the smallest reversible change that can help.

### 2.11 Make asynchronous changes understandable

Empty states often appear after asynchronous requests, background processing, or live updates. If content is still being loaded, show a loading state. If the request completes with zero items, show the appropriate empty state. If the result changes after a user action, provide feedback so the user understands whether the action succeeded.

Avoid rapid flashes between empty and populated states. Consider retaining the previous content while refreshing when that is safe and clear. Use status messaging for meaningful asynchronous updates, but do not announce every small internal event to screen-reader users.

```jsx
function SavedItemsPanel({ status, items }) {
  if (status === "loading") {
    return <p role="status">Loading saved items…</p>;
  }

  if (status === "error") {
    return <p role="alert">Saved items couldn't be loaded.</p>;
  }

  if (items.length === 0) {
    return (
      <section aria-labelledby="saved-empty-title">
        <h2 id="saved-empty-title">No saved items yet</h2>
        <p>Save an item to keep it close at hand.</p>
      </section>
    );
  }

  return <SavedItemList items={items} />;
}
```

**Gotcha:** `role="alert"` is assertive and should be reserved for important, time-sensitive messages. A routine loading or empty message usually should not interrupt the user.

**Naive approach:** Let the empty state render during the first frame before the data request finishes.

**Better approach:** Model asynchronous states explicitly and announce only updates that users need to know about.

### 2.12 Design the state inside the surrounding layout

An empty state can occupy a whole page, a content panel, a table body, a search results area, or a single card. Its size and emphasis should match the scope of the missing content. If one widget has no data while the rest of a dashboard is useful, do not replace the whole dashboard with a page-level empty state.

Respect the surrounding context. An empty table may need a compact message spanning the table body. A full-page first-use state may justify a more spacious composition. An inline permission note should not look like a celebratory onboarding screen.

```html
<section aria-labelledby="activity-heading">
  <h2 id="activity-heading">Recent activity</h2>
  <div class="activity-panel">
    <p>No activity has been recorded for this workspace yet.</p>
  </div>
</section>
```

**Gotcha:** Oversized empty states can make a local absence feel like a system-wide failure. Match the component's footprint to the affected region.

**Naive approach:** Use the same full-screen component in every context.

**Better approach:** Define page-level, section-level, and inline variants with consistent language and proportionate emphasis.

### 2.13 Support keyboard and assistive-technology users

The state must be available in the semantic reading order. If an action is presented, it needs a clear name and normal keyboard behavior. If the state replaces a focused control after an action, manage focus intentionally so keyboard users are not stranded. For dynamic updates, use an appropriate status mechanism and avoid moving focus unnecessarily.

Decorative artwork should not add noise. Headings should use semantic heading elements. Actions should be native links or buttons depending on whether they navigate or perform an operation. Do not use a clickable `<div>` when a `<button>` communicates the interaction and provides built-in keyboard behavior.

```html
<section aria-labelledby="empty-title">
  <h2 id="empty-title">No notifications</h2>
  <p>You're up to date. New notifications will appear here.</p>
  <a href="/notification-settings">Review notification settings</a>
</section>
```

**Gotcha:** Do not move focus to every empty message when it appears. Focus management depends on the user's action and whether the change interrupts an active task.

**Naive approach:** Make the entire illustration clickable and leave the actual action unlabeled.

**Better approach:** Use a clear heading, meaningful text, native controls, and deliberate focus behavior.

### 2.14 Match the action to the user's current intent

The best next step depends on why the state occurred and what the user was trying to do. The same “no items” result may need different actions in different contexts. In a collection manager, create the first collection may be right. In a search view, clear filters may be right. In a report viewer, choose a date range may be right. In an access-controlled page, request access may be right.

Do not add a generic “Go home” action just because it is easy. It may be appropriate as a secondary escape route, but it rarely resolves the user's immediate goal. If there is genuinely no useful action, say so plainly rather than manufacturing a button.

```text
State: First project
Primary action: Create project

State: Search has no matches
Primary action: Clear filters or revise search

State: Report has no data for selected period
Primary action: Choose another date range

State: Integration disconnected
Primary action: Reconnect integration

State: No notifications
Primary action: None required; optional settings link
```

**Gotcha:** Do not offer an action that cannot succeed under the current permissions, configuration, or network state.

**Naive approach:** Put “Try again” on every empty screen.

**Better approach:** Derive the action from the user's goal and the known state cause; omit it when there is no meaningful next step.

### 2.15 Explain a true zero state without implying failure

Some empty states are positive or neutral. A notification inbox with no unread messages may mean the user is up to date. A completed task queue may mean there is nothing left to do. An empty archive may simply contain no archived items. The copy should accurately describe the state without implying that content is missing or setup is incomplete.

Use completion language only when the system has reliable evidence that the task is complete. If the list is empty because a filter is active, “All caught up” may be misleading. If background sync has not completed, do not claim the data is current.

```html
<section aria-labelledby="inbox-empty-title">
  <h2 id="inbox-empty-title">You're all caught up</h2>
  <p>There are no unread notifications right now.</p>
  <a href="/notifications/all">View all notifications</a>
</section>
```

**Gotcha:** Positive tone can conceal a technical problem if the data is stale or incomplete. Confirm freshness before using completion language.

**Naive approach:** Label every empty list as a success state.

**Better approach:** State what is empty, for which scope, and whether that condition is expected or complete.

### 2.16 Avoid false certainty and unhelpful blame

Empty-state copy should describe what the system knows, not guess why the user is seeing it. “We couldn't load your files” is safer than “Your internet is down” unless the application has verified a connection failure. “No items match these filters” is more precise than “You searched incorrectly.” The language should be calm and respectful.

Avoid blaming the user, joking about mistakes, or making vague promises such as “Everything will be fixed soon” when no resolution time is known. When the system can offer a safe recovery action, explain it. When it cannot, state the limitation and provide a support path if appropriate.

```text
Avoid: You broke the search. Try again.
Prefer: No results match this search. Try a broader term.

Avoid: Your connection is definitely broken.
Prefer: We couldn't load your files. Try again.

Avoid: We'll fix this in a minute.
Prefer: The report is temporarily unavailable. Try again later or contact support.
```

**Gotcha:** A generic error can be honest but still leave users stranded. Include a useful next step when one exists, and do not invent a recovery path.

**Naive approach:** Use a humorous line to soften every missing-content state.

**Better approach:** Be precise, calm, and actionable; use warmth without blame or unsupported promises.

### 2.17 Make empty states testable

Treat empty states as product behavior that can be tested, not only as visual components. For each state, specify the triggering condition, expected title and supporting copy, available actions, accessibility behavior, and transition after the action. Test first use, zero results, error, permission, and loading separately.

Testing should include the state itself and the recovery journey. Does “Clear filters” actually clear them? Does the page refresh? Is the query preserved when appropriate? Does retry show progress? Is the error still visible if retry fails? Does a permission request explain what happens next? These details determine whether the state is useful.

```text
Test case: Search returns no matches
Given: The search request succeeded.
And: The current query returns zero records.
When: The results panel renders.
Then: The title identifies the no-results state.
And: The query remains visible.
And: The user can revise the query or clear active filters.
And: The interface does not show first-use creation guidance.
```

**Gotcha:** A screenshot test can verify the layout but not whether the state cause or action is correct. Include state-transition and interaction tests.

**Naive approach:** Review the illustration and typography, then mark the state complete.

**Better approach:** Verify the trigger, message, action, accessibility, and successful recovery path.

---

## 3. Empty-State Patterns and Integration Patterns

### Pattern 1: First-use creation

**Use when:** The user has no content because they have not created or configured the first item.

**Structure:** Specific title → brief benefit → one creation action → optional short prerequisite or guide.

```html
<section aria-labelledby="first-board-title">
  <h2 id="first-board-title">Create your first board</h2>
  <p>Boards organize tasks by project, status, or team.</p>
  <a href="/boards/new">Create board</a>
</section>
```

**Avoid:** A generic welcome message with no task. Do not show this state when data is merely loading or unavailable.

### Pattern 2: No search matches

**Use when:** A successful search returns zero items for the current query.

**Structure:** State the query scope → suggest a useful adjustment → preserve the query → offer a reset or edit path.

```html
<section aria-labelledby="search-empty-title">
  <h2 id="search-empty-title">No matches for “quarterly review”</h2>
  <p>Try fewer terms or remove a filter.</p>
  <button type="button">Clear filters</button>
</section>
```

**Avoid:** Telling the user to create content when they are trying to find existing content.

### Pattern 3: Filtered results are empty

**Use when:** Active filters exclude every record.

**Structure:** Identify the filter condition if known → offer targeted removal → retain other filter choices.

```text
No orders match:
Status: Delayed
Date range: Last 24 hours

Suggested action:
Remove the status filter or expand the date range.
```

**Avoid:** Resetting all filters without telling the user. Preserve useful work and make the reset reversible where possible.

### Pattern 4: Empty but complete

**Use when:** The absence is expected and can be confirmed as a normal or successful condition.

**Structure:** Calm confirmation → scope of the empty list → optional secondary destination.

```html
<section aria-labelledby="complete-title">
  <h2 id="complete-title">No pending approvals</h2>
  <p>All submitted requests have been reviewed.</p>
  <a href="/approvals/history">View approval history</a>
</section>
```

**Avoid:** Completion claims when the request is still processing or the data may be stale.

### Pattern 5: Unavailable due to error

**Use when:** The request failed and the system cannot confirm the underlying content state.

**Structure:** Honest failure statement → safe recovery guidance → retry action → support route if persistent.

```html
<section aria-labelledby="load-error-title">
  <h2 id="load-error-title">Reports couldn't be loaded</h2>
  <p>Your reports haven't been deleted. Try loading them again.</p>
  <button type="button">Try again</button>
</section>
```

**Avoid:** “No reports yet” when the request failed. Do not promise that data is safe unless the system can support that claim.

### Pattern 6: Permission or access restriction

**Use when:** The user lacks access or permission to view the relevant content.

**Structure:** Clear access statement → legitimate next step → optional policy explanation.

```html
<section aria-labelledby="permission-title">
  <h2 id="permission-title">Access to this folder is restricted</h2>
  <p>Ask the folder owner to grant you access.</p>
  <a href="/help/permissions">Learn about permissions</a>
</section>
```

**Avoid:** Revealing protected content or confirming resource existence when the security model prohibits it.

### Pattern 7: Disconnected integration

**Use when:** The page depends on an external account or integration that is no longer connected.

**Structure:** Name the connection problem → explain the consequence → offer reconnect or setup guidance.

```html
<section aria-labelledby="integration-title">
  <h2 id="integration-title">Reconnect your calendar</h2>
  <p>New events cannot sync until the connection is restored.</p>
  <button type="button">Reconnect calendar</button>
</section>
```

**Avoid:** Describing stale integration data as a genuine zero result. Show data freshness when it affects the user's decision.

### Pattern 8: No data for selected period

**Use when:** A report or dashboard has no data for the chosen date range or segment.

**Structure:** Identify the selected scope → state that no data is available for that scope → suggest an appropriate range or segment.

```text
No activity recorded for 1–7 October.
Try a wider date range or select another team.
```

**Avoid:** Claiming the product has no data overall when only one time period is empty.

### Pattern 9: Completed queue

**Use when:** The user has completed all items in a task queue and the system can confirm it.

**Structure:** Confirm the queue is clear → state which queue and scope → optionally link to history or the next workflow.

```html
<section aria-labelledby="queue-clear-title">
  <h2 id="queue-clear-title">Your review queue is clear</h2>
  <p>There are no items awaiting your review.</p>
  <a href="/reviews/history">View completed reviews</a>
</section>
```

**Avoid:** Celebrating when items are hidden by filters, assigned to someone else, or not yet loaded.

### Pattern 10: Deleted or archived content

**Use when:** Content was removed or moved out of the current active view.

**Structure:** Explain the current scope → state whether recovery is possible → provide a restore or archive route if supported.

```text
No active documents in this folder.
Archived documents are available in Archive.
```

**Avoid:** Implying that deleted content can be restored if the product has permanently removed it.

### Pattern 11: Permission-gated action in a read-only view

**Use when:** The user can view the screen but cannot create, edit, or delete its content.

**Structure:** Explain the missing permission → identify the appropriate administrator or role → do not display a disabled action without context.

```html
<section aria-labelledby="readonly-title">
  <h2 id="readonly-title">You can view these reports</h2>
  <p>Report creation is limited to workspace editors.</p>
  <a href="/help/roles">Review workspace roles</a>
</section>
```

**Avoid:** Offering a creation button that will predictably fail. If a disabled control must remain visible, explain why and how to obtain access.

### Pattern 12: Empty state inside a dashboard widget

**Use when:** One panel has no data while the rest of the dashboard remains useful.

**Structure:** Keep the widget title and local context → use compact copy → offer a local action only if it is relevant.

```html
<section aria-labelledby="activity-widget-title">
  <h2 id="activity-widget-title">Recent activity</h2>
  <p>No activity for this date range.</p>
  <a href="/activity">View activity settings</a>
</section>
```

**Avoid:** Replacing the whole dashboard or using an oversized illustration for a single empty panel.

---

## 4. Common Mistakes and Distinct Fixes

| Mistake | Why it fails | Better fix |
|---|---|---|
| One component for every empty-looking result | It confuses first use, no results, permissions, and errors. | Model distinct causes and choose copy/actions by state. |
| Showing empty copy before data loads | It creates false alarms and makes the app appear unreliable. | Keep loading and empty states separate. |
| Treating request failure as zero records | Users may assume their data is gone. | Show an error state and a safe retry route. |
| Showing onboarding after a failed search | It ignores the intent to find existing content. | Preserve query context and offer search recovery. |
| Using “Nothing here” as the title | It does not identify what is empty or why. | Name the scope and state directly. |
| Using humor before clarity | Users must decode the message to understand system behavior. | State the cause plainly; add light tone only afterward. |
| Adding too many actions | The user has to choose among competing routes. | Prioritize one action tied to the current goal. |
| Showing an invalid action | The button cannot work under current permissions or state. | Check action eligibility before rendering it. |
| Hiding the message behind an illustration | The visual dominates and delays comprehension. | Put title and action first in the hierarchy. |
| Making the illustration enormous on mobile | The useful action may fall below the visible area. | Use a compact responsive asset or omit it. |
| Resetting all search filters | It destroys useful user input and increases recovery effort. | Offer targeted filter removal and preserve the query. |
| Revealing protected resource details | It can violate permission or privacy rules. | Follow the access model and disclose only allowed information. |
| Promising a fix soon | The product may not know the recovery time. | Give an honest next step without inventing a deadline. |
| Showing “All caught up” with stale data | The interface asserts success without reliable evidence. | Verify freshness and scope before using completion language. |
| Announcing every change assertively | Screen-reader users may be interrupted by routine updates. | Choose status semantics based on urgency and user need. |
| Leaving focus on a removed element | Keyboard users may lose their place after the state changes. | Define focus behavior for the transition that removed the control. |
| Using a clickable generic container | Keyboard behavior and interaction semantics may be missing. | Use native links or buttons according to the action. |
| Forgetting the post-action state | The user clicks but cannot tell whether anything happened. | Specify loading, success, failure, and refresh behavior. |
| Replacing an entire dashboard for one empty widget | It hides useful information unrelated to the empty panel. | Scope the state to the affected section. |
| Testing only the happy path | The empty and error experiences remain unverified. | Test each cause, action, and state transition separately. |

### Review questions for each empty state

1. What exact condition triggers this state?
2. Has the system successfully established that the relevant data is empty?
3. What does the user believe they were trying to do?
4. What does the heading tell them without requiring the body copy?
5. Does the supporting copy add new information?
6. Is there a useful action, and is it valid under the current permissions?
7. Does the action preserve user work and context?
8. What happens after the action succeeds?
9. What happens if the action fails?
10. Can a keyboard and screen-reader user discover the message and use its controls?
11. Does the state occupy the correct scope of the interface?
12. Does the copy reveal only information the current user is allowed to know?

---

## 5. Mental Models

### Model 1: Empty is an outcome, not a cause

An empty list is only an observation. It does not explain whether the user has never created content, whether a filter excluded every item, whether access was denied, or whether the request failed. Think of “empty” as a rendered result that must be interpreted using state information.

**Use it when:** Defining API states, React component conditions, loading behavior, and copy variants.

**Failure signal:** One generic message appears for unrelated system conditions.

### Model 2: The state truth contract

Every message makes a claim about the system. “No reports yet” claims that the relevant report collection has been checked and is empty. “All caught up” claims that the relevant queue is current and complete. “Your files are safe” claims that the system knows their status. Do not write claims the data layer cannot prove.

**Use it when:** Writing error copy, status labels, success messages, and data-dependent dashboards.

**Failure signal:** The UI sounds certain while the underlying request is pending or failed.

### Model 3: The next-step bridge

An empty state should bridge the gap between the user's current goal and the available next action. A good action reduces that gap. A generic home link may take the user away from their goal; a targeted filter reset may move them closer to it.

**Use it when:** Choosing buttons and links for first use, no-results, and disconnected states.

**Failure signal:** The user understands the message but still has no idea how to continue.

### Model 4: The recovery-cost budget

Every recovery action costs effort. Clearing one restrictive filter is cheaper than resetting a whole search. Retrying a request is cheaper than rebuilding a form. Requesting access with a clear explanation is easier than finding an administrator without guidance. Preserve work and choose the smallest effective recovery step.

**Use it when:** Designing search, forms, upload flows, and integration recovery.

**Failure signal:** The user has to repeat steps they already completed.

### Model 5: The visibility boundary

An empty state has a scope: page, panel, table, search results, or one widget. Its visual footprint should match that scope. If one dashboard panel has no data, the rest of the dashboard should remain available. If the entire first-use product has no content, a page-level state may be appropriate.

**Use it when:** Choosing component size and placement.

**Failure signal:** A local absence is presented as a full-page failure.

### Model 6: The action eligibility gate

A button should appear only when the action is meaningful and available in the current context. Eligibility can depend on permission, connection state, selection, quota, or workflow status. A visually prominent action that predictably fails is worse than a clear explanation of the limitation.

**Use it when:** Defining component props, permission-aware actions, and state-specific CTA rules.

**Failure signal:** The empty state invites a user to do something the system will reject.

### Model 7: The accessibility transition

Accessibility is not only the static screen. When a user performs an action, the interface may replace a result list with an empty state or replace an empty state with new content. The focus position and announcement behavior must remain understandable across that transition.

**Use it when:** Implementing dynamic search, deletion, creation, and retry actions.

**Failure signal:** Keyboard focus disappears or assistive technology receives no meaningful indication of the result.

### Model 8: The proportional response

The intensity of the visual treatment should match the importance and scope of the state. A routine empty inbox can be quiet. A failed report load needs a clear error message. A first-use dashboard may justify a more instructional layout. Do not use the same illustration scale, color, and emotional tone for all states.

**Use it when:** Defining a shared design-system component.

**Failure signal:** Routine absence looks catastrophic, or a serious failure looks like a celebration.

---

## 6. Quick Reference

| Situation | Heading direction | Supporting copy | Primary action |
|---|---|---|---|
| First project | “Create your first project” | Explain the benefit of starting | Create project |
| No search matches | “No results match this search” | Suggest broadening the query | Edit search or clear filters |
| Filters exclude all items | “No items match these filters” | Name the restrictive scope if known | Remove filters |
| Empty notification inbox | “No unread notifications” | Explain that the inbox is clear | Usually none; optional settings |
| Successful empty queue | “No pending reviews” | State the queue and scope | Optional history link |
| Loading | “Loading results…” | Usually no extra explanation | No retry unless loading is stuck |
| Request failure | “Results couldn't be loaded” | Safe, honest recovery guidance | Try again |
| Permission denied | “You don't have access to this report” | Explain the legitimate route | Request access or contact owner |
| Disconnected integration | “Reconnect your calendar” | Explain what is not syncing | Reconnect |
| No data in date range | “No activity for this period” | State the chosen scope | Change date range |
| Archived content | “No active documents” | Point to archive if supported | Open archive |
| Deleted content | State deletion accurately | Explain restore availability if known | Restore, if supported |
| Read-only user | “You can view these reports” | Explain who can create them | Learn about roles |
| Empty dashboard widget | Use the widget's specific subject | Keep it compact | Local relevant action |
| Failed form submission | Name the failed operation | Preserve entered values and explain retry | Retry submission |
| Quota reached | Name the limit | Explain what affects the limit | Manage items or review plan |
| Unavailable integration data | Name the unavailable source | Include freshness if relevant | Reconnect or retry |
| Search spelling issue | “No matches for this term” | Suggest checking spelling | Edit query |
| No saved items | “No saved items yet” | Explain how saving helps | Explore or save an item |
| No content by design | State the confirmed condition | Reassure without overpromising | No action required |

### Copy checklist

- [ ] The title names the state and its scope.
- [ ] The message does not confuse loading, no results, and failure.
- [ ] The explanation is supported by information the system knows.
- [ ] The copy does not blame the user.
- [ ] The primary action matches the user's current intent.
- [ ] Every action is available and valid in the current context.
- [ ] The user’s query or form input is preserved when safe.
- [ ] Important privacy and permission boundaries are respected.
- [ ] The visual treatment is proportionate to the state.
- [ ] The next state after the action is defined and testable.

---

## 7. Build Challenge

### Challenge: Design a robust empty-state system for a project dashboard

Build a dashboard that shows projects, recent activity, and saved reports. The interface must handle first use, successful zero results, active filters with no matches, loading, request failure, and restricted access. The goal is not to create six illustrations; it is to build a state model whose messages and actions accurately match the system.

#### Requirements

1. Define the data states and their precedence.
2. Separate loading, error, permission, content, first-use, and no-results conditions.
3. Write a distinct heading and supporting message for each state.
4. Select one primary action per actionable state.
5. Preserve search terms and filters when no results are found.
6. Ensure creation actions are shown only when the user has permission.
7. Provide retry behavior for recoverable request failures.
8. Do not expose protected resource information in permission states.
9. Use semantic headings and native controls.
10. Choose page-level or widget-level empty states according to scope.
11. Define keyboard focus and screen-reader announcement behavior for transitions.
12. Test the dashboard at desktop and narrow mobile widths.
13. Include at least six automated state tests.
14. Conduct at least three task-based usability checks.
15. Document the assumptions that the application must verify before showing each message.

#### State matrix

| State | Trigger | Message goal | Primary action |
|---|---|---|---|
| Loading | Request is pending | Set expectation without claiming absence | None by default |
| Error | Request failed | Explain that data could not be loaded | Retry |
| Permission | Access is denied | Explain the permitted next route | Request access or contact owner |
| First use | Successful response, no items, no query/filter | Teach the first meaningful action | Create project |
| No results | Successful response, query or filters active, zero matches | Help recover the search | Edit query or clear filters |
| Content | Successful response with items | Show the results | Item-specific action |

#### Example state function

```js
function resolveProjectView(state) {
  if (state.status === "loading") return "loading";
  if (state.status === "error") return "error";
  if (state.status === "forbidden") return "permission";
  if (state.projects.length > 0) return "content";

  if (state.query.trim() || state.activeFilterCount > 0) {
    return "no-results";
  }

  return "first-use";
}
```

This example is deliberately small. In a real implementation, define how unknown states, partial data, stale cache results, archived items, and access restrictions are handled. The application should not use `projects.length` before confirming that the request completed successfully.

#### Suggested implementation structure

```jsx
function ProjectPanel({ view, projects, onCreate, onRetry, onClearFilters }) {
  switch (view) {
    case "loading":
      return <p role="status">Loading projects…</p>;

    case "error":
      return (
        <section aria-labelledby="projects-error-title">
          <h2 id="projects-error-title">Projects couldn't be loaded</h2>
          <p>Your project list is unavailable right now.</p>
          <button type="button" onClick={onRetry}>Try again</button>
        </section>
      );

    case "permission":
      return (
        <section aria-labelledby="projects-access-title">
          <h2 id="projects-access-title">You don't have access to these projects</h2>
          <p>Ask a workspace administrator to review your access.</p>
        </section>
      );

    case "no-results":
      return (
        <section aria-labelledby="projects-empty-search-title">
          <h2 id="projects-empty-search-title">No projects match this view</h2>
          <p>Change the search or remove a filter to see more projects.</p>
          <button type="button" onClick={onClearFilters}>Clear filters</button>
        </section>
      );

    case "first-use":
      return (
        <section aria-labelledby="projects-first-title">
          <h2 id="projects-first-title">Create your first project</h2>
          <p>Keep tasks and decisions organized in one place.</p>
          <button type="button" onClick={onCreate}>Create project</button>
        </section>
      );

    case "content":
      return <ProjectList projects={projects} />;

    default:
      return <p role="status">Project view is unavailable.</p>;
  }
}
```

#### Test cases

- [ ] Pending request renders loading, not first-use copy.
- [ ] Successful empty response with no query renders first-use copy.
- [ ] Successful empty response with active filters renders no-results copy.
- [ ] Failed request renders error copy and a retry action.
- [ ] Permission denial does not expose protected project names or details.
- [ ] A successful retry moves the view out of the error state.
- [ ] Clearing filters preserves the search term unless the user explicitly clears it.
- [ ] Creation is not offered to a read-only user.
- [ ] A widget-level empty state does not hide other dashboard content.
- [ ] Focus and announcements remain understandable after an action.

#### Evaluation rubric

Score each category from 0 to 3:

- **0 — Missing:** State behavior is absent or incorrect.
- **1 — Weak:** Some states exist, but copy or actions are generic.
- **2 — Solid:** State causes are distinct, and actions are mostly appropriate.
- **3 — Strong:** States are accurate, accessible, testable, responsive, and validated with user tasks.

| Area | Strong result |
|---|---|
| State model | All relevant causes are represented distinctly |
| Copy | Message states only what the system can support |
| Action | One useful, valid primary route per actionable state |
| Context preservation | Query and input are retained where safe |
| Permissions | No protected data is disclosed |
| Accessibility | Semantic structure, keyboard access, and transition behavior work |
| Responsive layout | The message and action remain easy to find on mobile |
| Testing | State transitions and recovery paths are covered |
| Usability | People can explain the state and complete the next step |
| Documentation | Assumptions and unresolved edge cases are recorded |

---

## 8. Definition of Done

- [ ] The empty-state inventory covers first use, no results, filtered zero results, loading, errors, permission restrictions, and any product-specific states.
- [ ] Each state has an explicit trigger and a clear precedence rule.
- [ ] The interface never interprets a pending or failed request as confirmed empty data.
- [ ] Titles identify what is empty or unavailable and define the relevant scope.
- [ ] Supporting copy explains the cause, consequence, or recovery path without repeating the title.
- [ ] Copy avoids blame, false certainty, and unsupported promises.
- [ ] The primary action matches the user's intent and is valid in the current state.
- [ ] Secondary actions are limited to meaningful alternatives.
- [ ] Search queries, filters, and form values are preserved when safe.
- [ ] Permission states follow privacy and security rules.
- [ ] Visual treatment is proportional to the affected page, panel, or widget.
- [ ] Illustrations support the message and do not obscure the action.
- [ ] Decorative images do not create unnecessary screen-reader noise.
- [ ] Headings, links, and buttons use semantic elements and clear names.
- [ ] Focus behavior is defined for transitions that remove or replace interactive content.
- [ ] Dynamic status messages use appropriate announcement behavior.
- [ ] Mobile layouts keep the message and action visible and usable.
- [ ] Every action has a defined success and failure outcome.
- [ ] Automated tests cover the state triggers and recovery paths.
- [ ] Task-based usability checks confirm that users understand the state and can proceed.
- [ ] Ownership and review conditions are documented for high-impact messages.

### Handoff notes

Deliver the state matrix alongside the component design. Include the trigger, data assumptions, heading, supporting copy, action label, eligibility requirements, accessibility behavior, and expected transition for each state. Identify the exact data condition that proves a state is empty and the conditions that mean it is merely unavailable.

Engineering should keep the state logic explicit, avoid deriving empty states from unverified data, and make each action's outcome observable. Design should specify responsive hierarchy and component scope. Content should ensure the wording is accurate, calm, and distinct for each cause. QA should test both the visible state and the transition after the action.

An empty state is complete only when it tells the truth, helps the user understand their situation, and offers a useful next step—or clearly communicates that no action is required.


### State review case 1: First-use collection

Use a task-specific invitation and explain the benefit of creating the first item. Do not force a tutorial if the action is self-explanatory.

**Verify:** The trigger is known, the message is truthful, the action is valid, and the next state is specified. If any of these cannot be confirmed, document the limitation instead of inventing certainty.


### State review case 2: No search matches

Keep the search term visible. Suggest spelling, synonyms, or a broader term only when those are relevant; do not imply that the whole dataset is empty.

**Verify:** The trigger is known, the message is truthful, the action is valid, and the next state is specified. If any of these cannot be confirmed, document the limitation instead of inventing certainty.


### State review case 3: Active filters

Show the relevant filter context and offer targeted removal when possible. A full reset should be explicit because it discards the user's choices.

**Verify:** The trigger is known, the message is truthful, the action is valid, and the next state is specified. If any of these cannot be confirmed, document the limitation instead of inventing certainty.


### State review case 4: Request pending

Use a loading status or skeleton appropriate to the layout. Do not display a zero-state illustration before the request settles.

**Verify:** The trigger is known, the message is truthful, the action is valid, and the next state is specified. If any of these cannot be confirmed, document the limitation instead of inventing certainty.


### State review case 5: Request failed

Say that the content could not be loaded. Offer retry only when retry is safe and meaningful; avoid exposing technical details.

**Verify:** The trigger is known, the message is truthful, the action is valid, and the next state is specified. If any of these cannot be confirmed, document the limitation instead of inventing certainty.


### State review case 6: Permission denied

Follow the authorization model. If resource existence is sensitive, use the approved neutral message rather than disclosing protected details.

**Verify:** The trigger is known, the message is truthful, the action is valid, and the next state is specified. If any of these cannot be confirmed, document the limitation instead of inventing certainty.


### State review case 7: Disconnected source

Explain which source needs attention and what will remain stale or unavailable. Provide a real reconnect route.

**Verify:** The trigger is known, the message is truthful, the action is valid, and the next state is specified. If any of these cannot be confirmed, document the limitation instead of inventing certainty.


### State review case 8: Empty date range

Name the date range or selected segment so users know the absence is scoped, not global.

**Verify:** The trigger is known, the message is truthful, the action is valid, and the next state is specified. If any of these cannot be confirmed, document the limitation instead of inventing certainty.


### State review case 9: No notifications

If the system can verify the inbox is current, use calm confirmation. A settings link may be useful but is not required.

**Verify:** The trigger is known, the message is truthful, the action is valid, and the next state is specified. If any of these cannot be confirmed, document the limitation instead of inventing certainty.


### State review case 10: Completed review queue

Confirm the relevant queue is complete only when the source data is current and the user is looking at the intended queue.

**Verify:** The trigger is known, the message is truthful, the action is valid, and the next state is specified. If any of these cannot be confirmed, document the limitation instead of inventing certainty.


### State review case 11: Deleted item

State whether the item was deleted, archived, or removed from the current view. Explain recovery only when supported.

**Verify:** The trigger is known, the message is truthful, the action is valid, and the next state is specified. If any of these cannot be confirmed, document the limitation instead of inventing certainty.


### State review case 12: Quota reached

Explain the limit and the available options, such as removing items or changing a plan. Do not offer creation as if it will succeed.

**Verify:** The trigger is known, the message is truthful, the action is valid, and the next state is specified. If any of these cannot be confirmed, document the limitation instead of inventing certainty.


### State review case 13: Read-only role

Keep viewable information available and explain why editing is unavailable. Do not use a disabled action as the only explanation.

**Verify:** The trigger is known, the message is truthful, the action is valid, and the next state is specified. If any of these cannot be confirmed, document the limitation instead of inventing certainty.


### State review case 14: Form submission failed

Preserve safe input values and identify the failed operation. Avoid forcing the user to re-enter the whole form.

**Verify:** The trigger is known, the message is truthful, the action is valid, and the next state is specified. If any of these cannot be confirmed, document the limitation instead of inventing certainty.


### State review case 15: Upload contains no supported items

Explain the accepted file types or format and provide a template or documentation link if available.

**Verify:** The trigger is known, the message is truthful, the action is valid, and the next state is specified. If any of these cannot be confirmed, document the limitation instead of inventing certainty.


### State review case 16: Background processing

Distinguish an empty result from a job that is still processing. If the job takes time, explain whether the user can leave and return.

**Verify:** The trigger is known, the message is truthful, the action is valid, and the next state is specified. If any of these cannot be confirmed, document the limitation instead of inventing certainty.


### State review case 17: Offline mode

State whether the displayed data is cached or unavailable. Do not imply that a retry can succeed while the app knows it is offline.

**Verify:** The trigger is known, the message is truthful, the action is valid, and the next state is specified. If any of these cannot be confirmed, document the limitation instead of inventing certainty.


### State review case 18: Search index delay

If new content may take time to appear in search, explain the indexing delay only if the system can verify that condition.

**Verify:** The trigger is known, the message is truthful, the action is valid, and the next state is specified. If any of these cannot be confirmed, document the limitation instead of inventing certainty.


### State review case 19: Empty dashboard widget

Keep the rest of the dashboard intact and explain the widget's scope. Do not replace the entire page.

**Verify:** The trigger is known, the message is truthful, the action is valid, and the next state is specified. If any of these cannot be confirmed, document the limitation instead of inventing certainty.


### State review case 20: No saved items

Explain how an item becomes saved and where users can find the save action. Avoid a primary CTA that takes them away without guidance.

**Verify:** The trigger is known, the message is truthful, the action is valid, and the next state is specified. If any of these cannot be confirmed, document the limitation instead of inventing certainty.


### Working example: State contract

```text
type ViewState =
  | { status: "loading" }
  | { status: "error"; retryable: boolean }
  | { status: "forbidden" }
  | { status: "success"; items: unknown[]; query: string; hasFilters: boolean };

// Keep state variants explicit so that "no data" is only inferred
// from a successful response with a known, empty collection.
```


### Working example: State copy map

```text
const copyByState = {
  firstUse: {
    title: "Create your first project",
    body: "Projects keep related work organized.",
    action: "Create project",
  },
  noResults: {
    title: "No projects match this view",
    body: "Change your search or remove a filter.",
    action: "Clear filters",
  },
  error: {
    title: "Projects couldn't be loaded",
    body: "Try again. Your list is unavailable right now.",
    action: "Try again",
  },
};
```


### Working example: Action eligibility

```jsx
function canCreateProject({ permission, connection, quotaReached }) {
  return permission === "editor" && connection === "ready" && !quotaReached;
}

// Render the create action only when the result is true.
// If false, explain the relevant limitation rather than offering a broken action.
```


### Working example: State transition outline

```text
idle
  -> loading
  -> success-with-content
  -> success-empty-first-use
  -> success-empty-no-results
  -> error
  -> permission-denied

On action:
no-results --clear filters--> loading or updated results
error --retry--> loading
first-use --create--> creating -> success or error
permission-denied --request access--> request pending or support route
```


### Working example: Keyboard review

```text
1. Tab to the primary action.
2. Confirm the visible focus indicator.
3. Activate the action using the keyboard.
4. Confirm the resulting state is announced when needed.
5. Confirm focus remains logical after the old control disappears.
6. Confirm the user can continue without a mouse.
```


### Working example: QA test fixture

```text
const fixtures = [
  { name: "first-use", status: "success", items: [], query: "", filters: 0 },
  { name: "no-results", status: "success", items: [], query: "invoice", filters: 1 },
  { name: "error", status: "error", items: null, query: "", filters: 0 },
  { name: "loading", status: "loading", items: null, query: "", filters: 0 },
  { name: "permission", status: "forbidden", items: null, query: "", filters: 0 },
];
```


### Working example: Responsive component sizing

```css
.empty-state {
  max-width: 34rem;
  margin-inline: auto;
  padding: clamp(1rem, 4vw, 2.5rem);
  text-align: center;
}

.empty-state img {
  width: min(100%, 12rem);
  height: auto;
  margin-inline: auto;
}

.empty-state__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
}
```


### Working example: Support escalation note

```text
State: Report could not be loaded
Known: The request failed with a service error.
Unknown: Whether the user’s network is also experiencing problems.
Copy: “We couldn't load this report. Try again, or contact support if the problem continues.”
Do not expose: Raw stack trace, internal endpoint, private identifiers.
```


### Working example: State instrumentation

```text
Track meaningful outcomes, not every render:
- empty_state_viewed with state_kind and surface
- empty_state_action_clicked with action_name and state_kind
- recovery_completed with state_kind and result
- retry_failed with a safe error category

Avoid logging sensitive query text or protected record identifiers by default.
```


### Working example: Copy length check

```text
Title: No reports match this period
Body: Choose a wider date range to include more activity.
Action: Change date range

The title names the scope; the body suggests recovery; the action advances it.
```


### Additional implementation guardrails

- Do not use an empty array as a substitute for request status.
- Do not show an action until its permissions and prerequisites are checked.
- Keep the query and filter context available in the no-results state.
- Make “clear filters” and “clear search” distinct when they do different things.
- Use “unavailable” when the system cannot confirm absence.
- Avoid exposing backend error codes in customer-facing messages.
- Use a live status message only when the update helps users understand progress or outcome.
- Keep the empty-state title in the document outline.
- Ensure illustration alt text matches whether the image is decorative or informative.
- Use a local empty state when only one widget or section has no data.
- Define retry behavior and prevent duplicate submissions.
- Make all actions keyboard-operable with visible focus.
- Preserve form values after recoverable failures where safe.
- Explain the consequence of a permission restriction without exposing protected content.
- Review empty-state copy when the underlying data model or workflow changes.
