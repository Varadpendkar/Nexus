# SKILL: information-architecture

**Layer:** 43 — UI/UX Design

**Goal:** Organize product content, navigation, labels, and relationships so people can predict where information lives, understand what choices mean, and complete tasks without needing the product team's internal knowledge.

---

## Why This Matters (Senior Perspective)

Information architecture (IA) is the structure behind the interface: how content is grouped, named, related, navigated, and found. People rarely arrive at a product with the same mental model as the team that built it. The team may organize features around departments, database entities, or the history of the codebase, while customers think in terms of goals: prepare a report, manage a subscription, invite a teammate, or resolve a problem. When these models diverge, users hesitate, choose the wrong category, repeat searches, or abandon tasks.

Strong IA makes a product feel understandable before a person has learned it. Navigation labels set expectations. Grouping creates a sense of what belongs together. Search and filters provide alternative routes when browsing does not work. Content hierarchy helps users distinguish primary destinations from secondary utilities. URL structure, breadcrumbs, and page titles maintain orientation across a journey. These details are not decoration; they influence discoverability, accessibility, support burden, and the perceived complexity of the product.

Information architecture is also a cross-functional system. Product strategy determines which user goals the product supports. Content design determines the language used to describe those goals. Research tests whether people understand categories and labels. Interaction design determines how navigation behaves. Engineering determines routes, state, permissions, and performance. Analytics helps identify where people fail to find information. If these disciplines operate independently, the result is often a navigation tree that looks tidy in a diagram but does not match actual user behavior.

A senior designer treats IA as a set of hypotheses to test rather than a hierarchy to defend. Card sorting can reveal how participants group concepts; tree testing can test whether people can find a destination in a proposed structure; search-log analysis can reveal vocabulary gaps; usability testing can expose problems caused by labels, page hierarchy, or navigation behavior. Each method answers a different question. No single diagram or method proves the architecture is correct for every audience.

Good IA also anticipates scale and change. A small product may begin with five destinations, then expand to multiple roles, settings, billing flows, and reporting tools. Without clear principles, navigation becomes a dumping ground. But adding hierarchy everywhere can be just as harmful: deep menus make simple tasks feel complex, while overly flat menus create long lists with little distinction. The goal is not the fewest categories or the most elegant taxonomy. The goal is a structure that supports the user's context, language, task frequency, and need for orientation.

**Senior perspective:** design the structure around the user's work, validate findability with evidence, and preserve orientation across navigation, search, page titles, URLs, and responsive layouts. A clean sitemap is only a hypothesis until people can use it.

---

## Core Concepts

### 1. Start with user goals and content inventory

Before designing navigation, inventory the content, tools, and tasks the product actually contains. Record what each item is for, who uses it, how often it matters, and which other items it depends on. This prevents the navigation from being shaped only by the current screen layout or engineering module names.

```text
Content inventory
Item: Saved reports
Primary user goal: Reopen and share a report
Audience: Analysts and team leads
Frequency: Weekly
Related items: Report history, export settings, permissions
Owner: Analytics product team
```

A content inventory can expose duplicates, orphaned pages, outdated content, and areas that need different navigation for different roles. Do not assume every route deserves a top-level navigation item. Some items may belong in context menus, settings, help, or search.

### 2. Distinguish taxonomy, navigation, and search

These concepts are related but not interchangeable. A taxonomy is the system used to classify and relate content. Navigation is the interface that exposes routes through that structure. Search is a retrieval mechanism that lets users query content directly or discover it through vocabulary.

```text
Taxonomy: Reports > Saved reports > Monthly reports
Navigation: Sidebar link "Reports"
Search: Query "June revenue" returns the matching report
```

A product can have a coherent taxonomy but poor navigation labels. It can have strong navigation and weak search. Diagnose which layer is failing before redesigning everything.

### 3. Use recognizable grouping principles

Group content by a meaningful principle: user goal, object type, workflow stage, audience, or frequency. Avoid switching principles unpredictably at the same hierarchy level. For example, mixing “Reports,” “For Managers,” “Advanced,” and “Recently Used” in one list makes users infer several different organizing rules.

```text
Reports
- Saved reports
- Scheduled reports
- Report templates

Workspace
- Members
- Roles and permissions
- Workspace settings
```

Grouping should help people predict what they will find in a category. If two categories overlap substantially, clarify the boundary or reconsider whether both are necessary.

### 4. Choose a hierarchy depth deliberately

Deep structures can reduce the number of choices at each step but make destinations harder to reach. Flat structures expose destinations quickly but can overwhelm people with long lists. Choose depth based on the number of destinations, their conceptual relationships, user expertise, and task frequency.

```text
Too deep:
Workspace > Administration > Access > People > Invitations

More direct:
Workspace > Members
  - People
  - Invitations
  - Roles
```

Do not optimize depth by counting clicks alone. A familiar, well-labeled two-step path can be easier than a single screen full of ambiguous options. Test important tasks rather than applying a universal maximum depth.

### 5. Write labels in the user's language

Labels should describe destinations in words the intended audience understands. Internal terms such as “entities,” “resources,” or “operations” may match a data model but often fail to communicate a user goal. Use research, support tickets, search queries, and customer vocabulary to evaluate terminology.

```text
Internal label: Artifacts
Possible user-facing label: Reports
Question to test: Do users expect saved analyses to live under "Reports"?
```

A label is not automatically better because it is shorter. “Activity” may be compact but ambiguous; “Recent changes” may better describe the content. Use consistent grammatical forms and avoid unexplained abbreviations.

**Gotcha:** using a label in the task prompt that exactly matches the destination can make findability appear better than it really is.

### 6. Design for information scent

Information scent is the degree to which a label or cue helps people predict whether a path will lead to their goal. Strong scent comes from specific wording, clear grouping, recognizable icons paired with labels, and useful contextual cues.

```text
Weak scent:
Tools

Stronger scent:
Export data
Import records
Manage API keys
```

Users should not have to open several unrelated destinations just to discover what they contain. A short supporting description may help for unfamiliar or high-impact categories, but avoid turning every navigation item into a paragraph.

### 7. Separate global, local, and contextual navigation

Global navigation provides access to major product areas. Local navigation helps people move within a section. Contextual navigation exposes actions or related destinations for the current object or task.

```text
Global: Dashboard | Projects | Reports | Settings
Local within Reports: Overview | Saved | Scheduled
Contextual on a report: Edit | Duplicate | Export | Share
```

Do not put every action in the global navigation. The user's current context should influence which controls are visible and how they are named. Keep critical actions findable without making every screen carry every possible option.

### 8. Preserve orientation with current-state cues

People need to know where they are, what section they are in, and what object they are viewing. Active navigation states, page titles, breadcrumbs, selected filters, and clear URL patterns can reinforce one another.

```html
<nav aria-label="Primary navigation">
  <a href="/dashboard">Dashboard</a>
  <a href="/reports" aria-current="page">Reports</a>
  <a href="/settings">Settings</a>
</nav>
```

Use semantic navigation landmarks and `aria-current="page"` for the active destination where appropriate. Do not rely on color alone to show the current location; use clear text, shape, weight, or another visible cue.

### 9. Use breadcrumbs when they help explain hierarchy

Breadcrumbs show a path through a meaningful hierarchy. They are most useful when users may enter deep pages directly, need to move to a parent category, or work in a large content structure. They are less useful when the hierarchy is shallow or the path does not reflect a real relationship.

```html
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/reports">Reports</a></li>
    <li><a href="/reports/saved">Saved reports</a></li>
    <li aria-current="page">June revenue</li>
  </ol>
</nav>
```

The final breadcrumb item should identify the current page, not pretend to be a link if it is not interactive. On small screens, consider how much space the trail consumes and whether a simpler parent link would preserve orientation.

### 10. Build a navigation model before polishing screens

Create a sitemap or route map that shows destinations, hierarchy, and important relationships. This makes structural problems easier to discuss before they become expensive UI changes. Include roles or permissions when the structure differs by audience.

```text
Workspace
├── Projects
│   ├── Active projects
│   └── Archived projects
├── Reports
│   ├── Saved reports
│   └── Scheduled reports
└── Settings
    ├── Members
    └── Billing
```

Treat the map as a model of user-facing destinations, not a literal copy of application folders or database tables. Annotate uncertain relationships so they can be tested.

### 11. Use card sorting to explore mental models

Card sorting asks participants to group content labels in ways that make sense to them. Open card sorting lets people create their own categories; closed card sorting asks them to place cards into predefined categories; hybrid sorting combines predefined categories with the option to create others.

```text
Prompt:
"Group these workspace features into categories that would make sense to you.
You may create, rename, or merge categories."

Cards:
Members, Roles, Billing, Saved reports, Export history, Notifications
```

Card sorting is useful for exploring possible groupings and vocabulary. It does not prove that people can find a destination in a finished navigation interface. Follow it with tree testing or task-based usability testing.

### 12. Use tree testing to evaluate findability

Tree testing presents a simplified hierarchy without visual styling and asks participants where they would go to complete a task. It helps isolate category names and structure from layout, color, and visual prominence.

```text
Task:
"You need to invite a contractor to your workspace. Where would you go?"

Tree:
Workspace
- Members
- Billing
- Notifications
- Reports
```

Track direct success, first click, backtracking, and the path chosen. A wrong first click can reveal a label or grouping problem even if the participant eventually finds the correct destination. Tree testing does not evaluate the full visual interface, so pair it with usability testing when interaction details matter.

### 13. Design search as a complementary path

Search is especially valuable when content is large, users know a specific name, or browsing categories is inefficient. It should support relevant terms, useful results, clear empty states, and a way to refine or recover from a poor query.

```text
Search behavior checklist
- Match expected names and common synonyms.
- Preserve the query when returning from a result.
- Show why a result may be relevant.
- Offer recovery for no-result searches.
- Avoid exposing content the current user cannot access.
```

Search should not be used to excuse a broken taxonomy. People often search when labels are unclear, and repeated failed searches may reveal a vocabulary gap or missing content. Review search logs with privacy safeguards.

### 14. Design filters and facets around real decisions

Filters help people narrow a result set by properties they understand. Facets should use labels and values that match the content and the user's task. Avoid filters that are technically accurate but meaningless to the audience.

```text
Report list filters
- Status: Draft, Ready, Archived
- Owner: Me, Team members
- Date updated: Last 7 days, Last 30 days, Custom range
```

Show active filters, provide a clear reset path, and make the effect of a filter understandable. On mobile, consider a dedicated filter panel with an obvious apply or close behavior. Test combinations and empty results rather than only a single filter.

### 15. Support multiple audiences without fragmenting the product

Different roles may need different destinations or permissions, but excessive role-specific navigation creates inconsistency and makes support harder. Separate access control from information architecture where possible: the structure should remain conceptually coherent even when certain destinations are unavailable.

```text
Role-aware navigation
All members: Projects, Reports
Workspace admins: Projects, Reports, Members, Billing
```

Explain restricted access when users encounter a link or a deep URL. Do not silently remove essential navigation in a way that makes people believe a feature does not exist if they are expected to request access.

### 16. Design URLs and page titles as orientation tools

Stable, readable URLs and descriptive page titles help people understand location, share destinations, and return to work. Route names should reflect user-facing concepts rather than temporary implementation details.

```text
Prefer:
 /workspace/members/invitations
 /reports/saved/june-revenue

Avoid exposing unstable internal identifiers as the only human-readable context:
 /view?mode=7&object=9841
```

A readable URL is not a substitute for access control. Validate permissions on the server for every protected resource, including direct navigation and copied links.

### 17. Plan responsive information architecture

Responsive design is not simply hiding desktop navigation on smaller screens. Decide which destinations remain persistent, which become a menu, and which actions need to stay close to the current task. Preserve labels and hierarchy even when the presentation changes.

```css
.primary-navigation a:focus-visible {
  outline: 3px solid var(--focus-ring);
  outline-offset: 3px;
}

@media (max-width: 42rem) {
  .desktop-navigation {
    display: none;
  }

  /* The mobile navigation control and its expanded state
     must be implemented accessibly in the component logic. */
}
```

This snippet illustrates focus styling and a responsive presentation boundary, not a complete navigation component. Use a real button for menu toggling, expose its expanded state, and ensure keyboard users can reach and dismiss the menu. Test intermediate widths where a desktop layout may become crowded before the mobile breakpoint activates.

### 18. Handle empty, loading, and error states as part of IA

A category with no content, a failed search, or a permission error still communicates what the product contains and what the user can do. These states should preserve context and provide a useful next action.

```text
Empty state:
"No saved reports yet."
"Save a report to make it available here."
[Create report]

Search with no results:
"No reports match 'quarterly forecast'."
"Try a shorter term or clear the active filters."
```

Avoid generic “Something went wrong” messages when a more specific, safe explanation is available. Do not promise actions that the user lacks permission to perform.

### 19. Use analytics as a diagnostic signal

Analytics can reveal repeated search queries, high backtracking, abandoned paths, or frequent visits to help pages. These signals identify where to investigate; they do not explain the cause by themselves.

```text
Potential IA signals
- High no-result search rate for a common task
- Repeated navigation between two categories
- Frequent use of support links from a particular page
- Abandonment after selecting a filter
```

Pair analytics with interviews or usability observations. A high click count may reflect a complex task rather than bad IA, and a low count may reflect successful use or a feature that nobody needs.

### 20. Account for accessibility and assistive technology

Navigation structure should be understandable through semantic landmarks, meaningful link names, keyboard operation, and visible focus. Use heading levels to reflect content hierarchy rather than selecting them for visual size. Keep repeated navigation consistent and provide a clear name for each navigation region.

```html
<header>
  <a href="/dashboard" aria-label="Acme workspace home">Acme</a>
  <nav aria-label="Primary navigation">
    <a href="/projects">Projects</a>
    <a href="/reports" aria-current="page">Reports</a>
  </nav>
</header>

<main id="main-content">
  <h1>Reports</h1>
  <p>Review saved and scheduled reports.</p>
</main>
```

A “skip to main content” link can help keyboard users bypass repeated navigation. Verify focus order and focus visibility in the browser, and test with assistive technology when the audience and risk justify it. Avoid clickable generic containers when a semantic link or button communicates the action more reliably.

**Gotcha:** two navigation regions with the same accessible name can be confusing. Name them by purpose, such as “Primary navigation” and “Footer navigation.”

### 21. Establish governance for labels and structure

As products grow, different teams may create duplicate categories, inconsistent capitalization, and conflicting terminology. A lightweight governance system records approved labels, definitions, owners, and rules for adding new destinations.

```text
IA entry
Label: Members
Definition: People who belong to this workspace
Owner: Workspace experience team
Related labels: Invitations, Roles
Avoid: Users, Accounts, People (unless context requires them)
Review trigger: New member-management capability
```

Governance should enable useful change, not create a committee for every label. Define who can propose changes, who approves high-impact changes, and how evidence is used to resolve disagreement.

### 22. Manage localization and terminology differences

Labels that work in one language may become much longer, more formal, or ambiguous when localized. Avoid layouts that assume every label fits a fixed width. Work with localization specialists to distinguish translation problems from genuine structural problems.

```css
.navigation-link {
  min-width: 0;
  overflow-wrap: anywhere;
}
```

Use this only where wrapping is appropriate; do not allow critical labels to become unreadable by breaking words unpredictably. Test localized interfaces at realistic text expansion, and verify that truncation does not remove the distinguishing part of a label.

### 23. Make permissions and unavailable destinations understandable

A user may encounter a destination through search, a shared URL, or a colleague's instruction even when their role does not permit access. The interface should explain the situation at an appropriate level without leaking protected information.

```text
If access is restricted:
"You don't have access to workspace billing."
"If you need this information, ask a workspace administrator."
```

Use a safe server-side authorization check even if the UI hides the link. Do not rely on navigation visibility as a security boundary.

### 24. Validate IA iteratively

IA work should move through inventory, hypothesis, prototype, evaluation, revision, and post-launch observation. Do not wait for a complete redesign to test a label or grouping decision. Small tests can isolate high-risk uncertainties early.

```text
Inventory -> Draft structure -> Tree test
          -> Revise labels/groups -> Prototype navigation
          -> Usability test -> Ship carefully -> Monitor signals
```

Record the reason for major structural decisions so later teams understand what was tested and what remains uncertain. Re-test when the product's content, audience, or primary tasks change materially.

### 25. Keep orientation across deep links and return paths

People may enter a product from email, search results, notifications, or shared links rather than starting at the dashboard. Deep-linked pages should provide enough context to understand the object and a predictable way to return to a broader area.

```text
Deep-linked report page should show:
- A descriptive page title
- The report name and status
- A path or parent link to Reports
- Relevant available actions
- A clear response if the report was removed or access changed
```

Do not force users through the home page before allowing them to reach a valid destination. When a destination is no longer available, preserve useful context and offer a safe recovery route.

### 26. Debug IA problems in the actual interface

When users cannot find a destination, inspect the whole chain: wording, grouping, visibility, active state, responsive behavior, permissions, and search. Browser DevTools can reveal hidden or overlapping elements, incorrect routes, console errors, and CSS states that differ from the design file.

```text
Debug checklist
1. Reproduce the participant's path from a clean state.
2. Confirm the expected destination exists for that role.
3. Inspect labels, hierarchy, and active-state cues.
4. Test keyboard-only navigation and :focus-visible.
5. Check the route and browser console for failures.
6. Repeat at a narrow and an intermediate viewport.
7. Compare the observed path with the task and evidence notes.
```

Do not change labels based on a single anecdote before checking whether the destination was missing, the prototype was broken, or the participant's account lacked permission. The right fix depends on the cause.

### 27. Choose the right evaluation method

Different IA methods answer different questions. Use interviews to understand language and context, card sorting to explore grouping, tree testing to evaluate findability in a proposed hierarchy, usability testing to evaluate the full interaction, and analytics to locate patterns in live behavior.

```text
Question -> Method
"What words do people use?" -> Interview / search-log review
"How might content be grouped?" -> Card sorting
"Can people find a destination in this tree?" -> Tree testing
"Can people complete the task in the interface?" -> Usability test
"Where do live users repeatedly struggle?" -> Analytics plus qualitative follow-up
```

A method is useful when its evidence fits the question. Do not ask card sorting to prove the visual design works or use analytics alone to explain why a label confuses people.

### 28. Prioritize structural changes by user impact

Not every taxonomy inconsistency deserves immediate redesign. Prioritize based on the importance of the task, frequency of use, cost of failure, evidence strength, and the scope of the affected audience.

```text
Priority review
- Does this block a critical task?
- Does it cause wrong or risky outcomes?
- Is there repeated evidence across relevant sessions?
- Is the cause structural, linguistic, visual, or technical?
- Can a small change test the hypothesis safely?
```

Keep severity distinct from implementation effort. A small label change can resolve a major problem, while a large navigation overhaul may not address the real cause.

---

## Relevant Patterns

### Pattern 1: Goal-based navigation

**What it does:** groups destinations around the outcomes users want to achieve rather than internal departments or code modules.

**When to use it:** products with several workflows or teams whose internal boundaries do not match customer goals.

```text
Workspace
- Projects
- Reports
- Team
- Billing and plan
- Settings
```

Validate each label against realistic tasks. A goal-based label is only successful if users can predict what belongs inside it.

### Pattern 2: Progressive disclosure

**What it does:** presents common destinations first and exposes specialized options when relevant, reducing the initial choice burden.

**When to use it:** products with advanced settings or infrequent administrative tools.

```text
Settings
- Profile
- Notifications
- Security
- Advanced workspace settings
```

Do not hide critical actions behind vague “More” menus. Test whether users can discover advanced options when they need them.

### Pattern 3: Contextual navigation

**What it does:** keeps actions near the object or task they affect.

**When to use it:** dashboards, editors, project management tools, and record-based workflows.

```text
Report detail
- Edit
- Duplicate
- Export
- Share
```

Use semantic links for navigation and buttons for actions. Ensure contextual controls remain available to keyboard users and are not discoverable only on hover.

### Pattern 4: Card-sorting discovery

**What it does:** reveals how participants naturally group labels and describe categories.

**When to use it:** early IA exploration when the correct category boundaries are uncertain.

```text
Give participants content cards.
Ask them to group by meaning.
Ask them to name each group.
Compare recurring patterns and outliers.
```

Treat results as input to a proposed taxonomy, not as an automatic final sitemap.

### Pattern 5: Tree-testing validation

**What it does:** tests whether people can locate destinations in a hierarchy without visual design cues.

**When to use it:** validating labels and category structure before implementation.

```text
Task: "Find where to invite a new teammate."
Record: direct success, first click, backtracking, and final path.
```

Use consistent task wording and avoid repeating the exact destination label in the prompt.

### Pattern 6: Search as a recovery route

**What it does:** gives users an alternate way to retrieve information when browsing is slow or unfamiliar.

**When to use it:** content-heavy products, large libraries, and products where users know an object's name.

```text
Query -> Relevant results -> Result context -> Destination
     -> Empty state -> Suggestions / clear filters / retry
```

Search must respect permissions and should not conceal a broken navigation model.

### Pattern 7: Orientation stack

**What it does:** reinforces location through a page title, active navigation, breadcrumb, and readable URL.

**When to use it:** deep hierarchies, direct links, large admin products, and multi-step workspaces.

```text
Primary navigation: Reports active
Breadcrumb: Reports > Saved reports
Page title: June revenue
URL: /reports/saved/june-revenue
```

Use only the cues that clarify the current structure; redundant navigation chrome can consume valuable space.

### Pattern 8: Role-aware information structure

**What it does:** presents relevant destinations while maintaining a coherent model across permission levels.

**When to use it:** products with member, manager, and administrator roles.

```text
Member: Projects, Reports
Administrator: Projects, Reports, Members, Billing
```

Validate access on the server. Hiding a navigation link is not authorization.

### Pattern 9: IA change validation loop

**What it does:** reduces risk by testing structural changes before broad rollout and checking their effect after launch.

**When to use it:** major taxonomy changes, high-traffic navigation, or repeated findability problems.

```text
Observe problem -> Form hypothesis -> Test structure
-> Revise -> Test interface -> Release -> Monitor
```

Track the original problem so post-launch evaluation measures the intended outcome rather than only page traffic.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Organizing around internal teams | The product mirrors the org chart | Group by user goals and validate with realistic tasks |
| Using vague labels such as “Tools” | Short labels appear clean | Replace them with specific destination names and test information scent |
| Mixing grouping principles at one level | Categories evolve independently | Choose a consistent organizing rule for sibling categories |
| Making navigation too deep | Teams add layers to avoid long lists | Test task paths and remove unnecessary intermediate categories |
| Making navigation too flat | Every destination is promoted | Group related destinations and test whether users can scan the list |
| Treating the sitemap as proof | The diagram looks logical to its author | Evaluate findability with tree tests and real task scenarios |
| Using card sorting as the only validation | Grouping results feel conclusive | Follow with tree testing or interface usability testing |
| Revealing the answer in task wording | The moderator wants clarity | Describe the goal without repeating the target label |
| Treating search as a cure for poor IA | Search seems more flexible | Fix unclear labels and groupings while retaining search as a complementary path |
| Hiding active location cues | Visual minimalism removes orientation | Use clear page titles, active states, and breadcrumbs when useful |
| Relying on color alone for active state | The design relies on visual styling | Add text, shape, weight, or semantic current-page cues |
| Using clickable generic containers | Custom interactions are quick to style | Use semantic links and buttons with keyboard support |
| Making the whole navigation inaccessible | Mouse testing misses focus behavior | Test keyboard paths, visible focus, landmarks, and accessible names |
| Ignoring direct links | Teams assume users start at home | Provide context and safe recovery on deep-linked pages |
| Exposing internal identifiers in URLs | Routes mirror backend structure | Use readable route patterns while enforcing server-side permissions |
| Hiding restricted destinations without explanation | Permission states are considered edge cases | Provide a safe explanation and request-access path where appropriate |
| Treating analytics as causal evidence | Event counts appear objective | Use analytics to locate problems and qualitative methods to investigate causes |
| Ignoring empty and error states | Design focuses on populated screens | Design recovery, empty, loading, and permission states as part of the structure |
| Overfitting labels to one audience | A team tests only familiar users | Recruit across relevant experience levels and document segment differences |
| Failing to plan for localization | Labels fit only the source language | Test realistic text expansion and flexible layout behavior |
| Letting filters create unexplained empty results | Filter combinations are not tested | Show active filters, clear reset behavior, and useful no-results guidance |
| Treating navigation visibility as security | Hidden links seem inaccessible | Check permissions for every protected route on the server |
| Renaming labels without evidence | Stakeholder preference drives changes | Connect changes to observed confusion, search terms, or task results |
| Ignoring contradictory evidence | The team wants one clean story | Record exceptions and investigate different user contexts |
| Making every item top-level | Stakeholders compete for visibility | Prioritize by user goals, frequency, and task criticality |
| Overusing breadcrumbs | Hierarchy is shown by default | Use breadcrumbs when they improve orientation or parent navigation |
| Truncating localized labels carelessly | Fixed widths are easier to implement | Preserve distinguishing text and test realistic translations |
| Failing to maintain label governance | Different teams introduce synonyms | Keep a lightweight glossary, owner, and review rule |
| Treating a successful click as task success | The destination is reached but misunderstood | Verify the participant reached the correct object and understands its state |
| Skipping post-launch review | The redesign is considered complete at release | Monitor search, navigation, and task signals after implementation |

---

## Mental Models

1. **Structure is a hypothesis** — A tidy sitemap represents a design theory until people demonstrate that they can find destinations.
2. **User goals outrank org charts** — Internal ownership should not determine the customer-facing taxonomy by default.
3. **Labels create expectations** — People choose paths based on what labels suggest will be inside them.
4. **Information scent reduces exploration cost** — Specific cues let people predict a path before committing to it.
5. **Navigation, search, and taxonomy are separate layers** — A failure in one layer should not automatically trigger a redesign of all three.
6. **Orientation is cumulative** — Page titles, active states, breadcrumbs, and URLs reinforce each other.
7. **Deep links are first-class entry points** — People do not always start at the dashboard.
8. **Accessibility is structural** — Semantic landmarks, meaningful names, and keyboard operation determine whether the architecture is usable.
9. **Analytics locates; research explains** — Behavior counts point to friction but rarely establish its cause alone.
10. **Permissions are not navigation** — Hiding a link does not secure a route.
11. **A filter is a promise** — Users expect the displayed criteria to explain which results remain.
12. **Change should preserve evidence** — Record the original problem and verify whether the intervention solved it.

---

## Quick Reference

| Task | Recommended method or check | Output |
|---|---|---|
| Understand existing content | Content inventory | Items, audiences, owners, dependencies |
| Explore category groupings | Open or hybrid card sorting | Candidate taxonomy and vocabulary |
| Validate a proposed hierarchy | Tree testing | Findability, first clicks, backtracking |
| Test real interaction | Task-based usability testing | Task outcomes, errors, recovery |
| Investigate unknown vocabulary | Interviews and search-log review | User terms and label hypotheses |
| Define navigation levels | Global/local/contextual map | Consistent destination model |
| Preserve orientation | Active state, title, breadcrumb, URL | Clear current location |
| Improve retrieval | Search and filters | Relevant results and recovery paths |
| Support varied roles | Role and permission matrix | Coherent role-aware structure |
| Check accessibility | Keyboard, focus, landmarks, accessible names | Verified navigation behavior |
| Investigate live friction | Analytics plus qualitative follow-up | Candidate problem areas and explanations |
| Handle no-content states | Empty and error-state review | Recovery copy and next actions |
| Prevent label drift | Glossary and ownership rules | Consistent terminology |
| Validate a release | Repeat tasks and monitor signals | Outcome comparison and remaining risks |
| Debug findability | Reproduce path, inspect routes and UI states | Root cause and targeted fix |

---

## Build Challenge

Design the information architecture for a fictional project-management workspace used by individual contributors, team leads, and workspace administrators. The product includes projects, archived projects, saved reports, scheduled reports, members, invitations, billing, notifications, and help content. The goal is to make the structure predictable for first-time users without overwhelming experienced administrators.

### Requirements

1. **Create a content inventory.** For every destination, record its user goal, intended audience, expected frequency, owner, and dependencies.
2. **Define the primary audiences.** Describe the main tasks for an individual contributor, team lead, and administrator.
3. **Draft the taxonomy.** Group destinations using a clear principle and explain why sibling categories belong together.
4. **Create a sitemap.** Show global, local, and contextual navigation separately.
5. **Write user-facing labels.** Avoid internal team names and vague labels; record alternative labels that need testing.
6. **Write five realistic findability tasks.** Do not include the exact destination label in each task prompt.
7. **Plan a card-sorting exercise.** Specify the participants, cards, instructions, and how results will inform the draft taxonomy.
8. **Plan a tree test.** Define outcome measures including direct success, first click, backtracking, and final path.
9. **Prototype navigation states.** Include active destination cues, a page title, and breadcrumbs where hierarchy makes them useful.
10. **Specify role-aware behavior.** Show which destinations each role can access and what happens when a restricted destination is reached through a direct link.
11. **Design search and empty states.** Include a no-results state, clear-filter behavior, and a safe permission-aware result model.
12. **Address accessibility.** Use semantic navigation landmarks, meaningful names, `aria-current` where appropriate, keyboard operation, and visible `:focus-visible` styling.
13. **Test responsive behavior.** Review wide, intermediate, and narrow viewports; verify that menu controls work with a keyboard and expose their expanded state.
14. **Define analytics signals.** Identify events or patterns that could reveal findability problems, and explain which qualitative method would investigate the cause.
15. **Write an evidence-based recommendation.** State the observed problem, evidence, impact, confidence, proposed change, success measure, and guardrail.
16. **Create a validation plan.** Repeat the original tasks after implementation and record whether outcomes improved.
17. **Document governance.** Define who owns labels and how new destinations are reviewed without creating unnecessary process overhead.

### Failure and edge conditions

The challenge fails if the taxonomy simply mirrors internal engineering modules, task prompts reveal the intended destination, role permissions are enforced only by hiding links, or the report claims that a small study represents the whole customer population. It also fails if mobile navigation removes critical destinations without a discoverable alternative, active location is conveyed by color alone, or empty search results offer no recovery. A visually polished sitemap is not sufficient evidence that users can find what they need.

### Definition of Done

- Every content item has a documented goal, audience, and owner.
- The taxonomy uses a consistent and defensible grouping principle.
- Global, local, and contextual navigation are clearly distinguished.
- Labels are understandable to the intended audience and uncertain labels are flagged for research.
- Findability tasks are goal-based and do not reveal the answer.
- Card sorting and tree testing answer distinct, explicit questions.
- Outcomes include first-click behavior and backtracking, not only eventual success.
- Direct links and permissions are designed as separate concerns.
- Search, filters, empty states, and errors provide useful recovery.
- Navigation uses semantic HTML and supports keyboard interaction with visible focus.
- Responsive layouts preserve access to important destinations.
- Analytics is treated as a diagnostic signal and paired with qualitative investigation.
- Recommendations link to observed evidence and define success measures.
- Post-launch validation checks task outcomes and possible regressions.
- Label governance is documented and proportionate to product scale.
