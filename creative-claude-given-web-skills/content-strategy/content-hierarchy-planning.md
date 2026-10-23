# Content Hierarchy Planning

**Layer:** 5 — Content Strategy  
**Skill directory:** `content-hierarchy-planning/`  
**Target file:** `content-hierarchy-planning.md`  
**Purpose:** Plan the order, grouping, emphasis, and progressive disclosure of information so people can understand a page and complete its primary task without having to decode the interface.

---

## 1. Why This Matters

Content hierarchy planning is the practice of deciding what a page says first, what it says next, what belongs together, what deserves emphasis, and what can safely wait. It is not merely a typography exercise. Font size, color, spacing, and visual weight can reinforce hierarchy, but they cannot repair a page whose information has been ordered around internal team preferences instead of user needs.

A page may look polished and still fail because the visitor cannot answer basic questions: Where am I? Is this relevant to me? What can I do here? What will happen if I continue? What information do I need before choosing? When those answers are buried beneath a slogan, a long company story, decorative statistics, or several competing calls to action, people hesitate, scan past the useful content, or leave. In a product interface, that confusion can become an abandoned onboarding flow, an incomplete checkout, an incorrect configuration, or a support request that should never have been necessary.

A useful hierarchy starts with the user's situation and decision. A pricing page, for example, should usually make the available plans, meaningful differences, total cost conditions, and next step easy to find. A product detail page should establish what the item is, why it matters, whether it fits the visitor's constraints, and how to act. An account settings page has a different job: labels, current values, consequences, and save/cancel actions matter more than marketing-style persuasion. The hierarchy must follow the page's job rather than a reusable visual formula.

Hierarchy also reduces cognitive load. People do not read most interfaces from top to bottom as if they were essays. They scan headings, labels, numbers, summaries, familiar patterns, and action controls. If every section looks equally important, the visitor has to perform the prioritization that the design should have done. If the most important detail is visually quiet while a secondary promotion is loud, the interface communicates the wrong priorities even when every sentence is technically present.

Senior designers treat hierarchy as a set of explicit decisions that can be explained and tested. They identify the primary audience, the page's main task, the questions users must answer, the evidence required to make a decision, and the information that can be deferred. They distinguish business goals from user goals without pretending those goals are always identical. They use analytics, search terms, support tickets, usability sessions, content audits, and stakeholder knowledge as evidence; they do not treat the loudest stakeholder's preferred headline as proof of importance.

This skill matters in creative work because a portfolio case study, agency landing page, editorial page, or product launch needs a clear narrative. It matters in product design because a user must find the next safe action. It matters in freelance work because clients often ask for “more modern,” “more premium,” or “more engaging” without defining what the visitor needs to understand. A content hierarchy gives the team a concrete answer: which information comes first, what supports it, what is secondary, and why. That makes design reviews less subjective and helps prevent late-stage rearrangements that break responsive layouts or force copy to be rewritten after implementation.

The practical rule is simple: **hierarchy is a content decision first and a visual expression second**. Start by organizing meaning in plain text. Then use headings, grouping, whitespace, contrast, typography, and responsive behavior to make that organization visible. Validate the result with realistic users and tasks. A hierarchy is successful when people can locate the right information, understand the relationship between sections, compare options accurately, and take the intended action with less uncertainty—not merely when the page looks balanced in a screenshot.

### Production failures hierarchy should prevent

- **The headline promises one thing while the page leads with another.** Visitors arrive for a concrete service, but the first screen spends its space on a generic mission statement. The fix is not automatically a larger headline; it is aligning the opening message with the visitor's intent.
- **The primary action is surrounded by equally loud alternatives.** “Start free trial,” “Book a demo,” “Read the blog,” and “Contact sales” compete without explaining which path suits which user. The hierarchy needs a primary route and meaningful secondary routes.
- **Critical conditions appear after commitment.** A price looks low until a required fee, renewal condition, eligibility rule, or limitation appears much later. Important qualifications should be close to the decision they affect.
- **A long page becomes a wall of interchangeable sections.** Repeated heading sizes, repeated card layouts, and no useful summaries make scanning exhausting. Group related information, vary section roles intentionally, and provide navigation where length warrants it.
- **Mobile turns a carefully designed desktop composition into a confusing queue.** Side-by-side desktop content collapses in an order that separates claims from evidence or puts a low-priority promo before the main task. Specify and test reading order, not only column widths.
- **Accessibility exposes a hierarchy that exists only visually.** A designer uses large bold text as a heading but leaves it as a generic element, so screen-reader navigation cannot discover the section structure. Use semantic headings and a logical outline.
- **Stakeholders keep adding content without removing anything.** The page becomes longer but no longer clearer. A content inventory and explicit priority tiers help teams negotiate what must be present, what can be summarized, and what belongs elsewhere.

The beginner asks, “How can I make this section stand out?” The senior asks, “Should this section be here, does it answer a user question, and what should it outrank?” That change in question is the foundation of this skill.

---

## 2. Core Concepts

### 2.1 Define the page's job before arranging components

Every page needs a primary job expressed as an observable user outcome. “Explain our platform” is vague. “Help an operations manager decide whether the platform fits a team of 20–100 people and request a demo” is more actionable. The job statement determines which information is essential, which evidence is needed, and which action deserves emphasis.

A page can have secondary jobs, but they should not quietly compete with the primary job. For example, a product page may also support documentation discovery, newsletter signups, and cross-selling. Those are legitimate goals; they still need to be ordered around the page's main audience and intent.

```text
Page job:
Help a first-time visitor understand what the service does,
decide whether it fits their use case, and start the appropriate trial.

Primary user:
A team lead evaluating tools for a small team.

Primary decision:
Is this relevant, credible, and appropriate for my team's constraints?

Primary action:
Start a trial.

Secondary actions:
Read technical documentation; contact sales for a larger deployment.

Out of scope:
A full company history; every feature detail; unrelated announcements.
```

**Gotcha:** If the page job contains several unrelated verbs—learn, compare, subscribe, buy, explore, contact, and follow—there may be multiple page types competing for one URL. Split the page, create clear pathways, or explicitly choose a primary task.

**Naive approach:** Start with a hero component and fill in its slots.

**Better approach:** Write the job, audience, decision, and action in plain text before choosing the layout.

### 2.2 Separate user questions from internal content categories

Teams often organize pages according to departments: “About,” “Capabilities,” “Solutions,” “Innovation,” and “Resources.” Users arrive with questions: “Can it do this?”, “Will it work with my stack?”, “How much does it cost?”, “What happens to my data?”, “How do I get started?” Internal categories may be useful for governance, but they are not automatically a good user-facing hierarchy.

Build a question inventory from search queries, sales calls, customer interviews, support tickets, and observed behavior. Group questions by the decision they support. Then map each question to a section, a concise answer, and supporting evidence.

| User question | Decision it supports | Content needed | Likely placement |
|---|---|---|---|
| What does this do? | Relevance | Plain-language value statement | Opening section |
| Is it for a team like mine? | Fit | Audience, use cases, constraints | Early overview |
| Can I trust it? | Risk | Security details, proof, limitations | Near evaluation point |
| What does it cost? | Affordability | Price, billing rules, included limits | Pricing area |
| What happens next? | Commitment | Trial/demo steps and conditions | Near primary action |

**Gotcha:** Do not infer that a question is unimportant because it is absent from the current navigation. Missing content can be the reason people contact support or abandon the flow.

**Naive approach:** Reuse the company's sitemap as the page outline.

**Better approach:** Draft the page outline from user questions, then map those questions to the site's information architecture.

### 2.3 Rank content by decision value

A practical priority model uses four tiers:

1. **Essential now:** required to understand the page, make the current decision, or complete the primary task.
2. **Important support:** evidence, explanation, or detail that materially increases confidence.
3. **Useful later:** helpful context that can be summarized, linked, or disclosed on demand.
4. **Out of scope:** unrelated, duplicative, outdated, or better placed on another page.

Priority is not the same as word count. A one-line eligibility rule may matter more than a 500-word origin story. A safety warning may need high visibility even if only a small number of users encounter the relevant condition. A privacy statement may be essential at the moment data is requested but not necessarily the first paragraph of a marketing page.

A simple scoring model can help teams discuss trade-offs. Score each item for task relevance, decision impact, and urgency; score effort or complexity separately. Treat the numbers as a discussion aid, not objective truth.

```js
const contentItems = [
  { id: "value", relevance: 5, impact: 5, urgency: 5 },
  { id: "security", relevance: 4, impact: 5, urgency: 4 },
  { id: "company-story", relevance: 2, impact: 1, urgency: 1 },
];

const ranked = contentItems
  .map((item) => ({
    ...item,
    score: item.relevance * 0.4 + item.impact * 0.4 + item.urgency * 0.2,
  }))
  .sort((a, b) => b.score - a.score);

console.table(ranked);
```

**Gotcha:** Numeric scoring can create false precision. Use it to expose assumptions and disagreements, not to claim that a score of 4.2 proves a section belongs above a score of 4.0.

**Naive approach:** Put content in the order it was written or supplied by stakeholders.

**Better approach:** Rank content against a named user decision, explain the ranking, and revisit it when evidence changes.

### 2.4 Design the opening viewport around orientation and value

The first viewport should quickly answer the questions most relevant to the page type: where the visitor is, what the offering or task is, why it matters, and what the next step is. Not every page needs a dramatic marketing hero. A dashboard, support article, form, or settings screen should often begin with a direct page title and useful task context.

The opening area usually benefits from a clear heading, a short supporting explanation, a primary action where appropriate, and any critical qualification needed before the user proceeds. Supporting proof can appear nearby if it helps the user judge credibility. Avoid forcing the first viewport to contain every feature, every testimonial, and every call to action.

```html
<main>
  <section aria-labelledby="hero-title">
    <p class="eyebrow">For growing operations teams</p>
    <h1 id="hero-title">Know where every order stands.</h1>
    <p>
      Track fulfillment, exceptions, and handoffs from one shared workspace.
    </p>
    <a class="button button--primary" href="/start">Start a trial</a>
    <p class="supporting-note">No credit card required. Cancel at any time.</p>
  </section>
</main>
```

**Gotcha:** “Above the fold” is not a fixed number of pixels. Screen sizes, browser chrome, zoom, and user settings vary. Optimize the opening sequence, not a mythical universal fold.

**Naive approach:** Use the hero to make the brand feel impressive before explaining the offering.

**Better approach:** Orient the visitor and communicate useful value before adding brand narrative or decoration.

### 2.5 Use headings to create a meaningful outline

Headings are both visual signposts and semantic structure. A useful outline lets someone scan the page and predict what each section contains. Heading text should name the subject or answer a question, not merely repeat a generic label such as “Our approach” when a more specific heading is possible.

Use heading levels according to document structure. A page typically has one main `<h1>` describing its central topic, followed by `<h2>` section headings and `<h3>` headings for nested topics. Do not select `<h4>` simply because its default visual style is smaller. Style headings with CSS rather than misusing the outline.

```html
<main>
  <article>
    <h1>Choose a plan for your team</h1>
    <section aria-labelledby="plans-heading">
      <h2 id="plans-heading">Compare plan limits</h2>
      <section aria-labelledby="seats-heading">
        <h3 id="seats-heading">Included team members</h3>
        <p>Each plan includes a different number of seats.</p>
      </section>
    </section>
    <section aria-labelledby="billing-heading">
      <h2 id="billing-heading">Understand billing</h2>
      <p>Review the billing period and renewal terms before checkout.</p>
    </section>
  </article>
</main>
```

**Gotcha:** A visually attractive heading that skips levels or uses a generic element can make the outline harder to navigate. Check the document outline and the headings in isolation.

**Naive approach:** Choose heading tags based on their default font size.

**Better approach:** Choose semantic levels based on parent-child relationships; set visual size in the design system.

### 2.6 Group information by meaning, not by card count

A card is a presentation component, not a content strategy. Use a card when its content represents a coherent, independently scannable unit—such as a plan, product, article, or task. Do not turn every paragraph into a card merely to create a modern-looking grid.

Group information when the items answer the same question, share a relationship, or support one decision. Separate information when the reader must make a different decision or when the content has a different role. Clear grouping reduces the mental work required to infer relationships.

```html
<section aria-labelledby="requirements-heading">
  <h2 id="requirements-heading">Before you connect your account</h2>
  <ul>
    <li>Use an account with administrator permissions.</li>
    <li>Keep your recovery method available.</li>
    <li>Review which data the integration can access.</li>
  </ul>
</section>
```

**Gotcha:** Visual proximity can imply a relationship that does not exist. Do not place a warning beside an unrelated button and assume users will understand which action it qualifies.

**Naive approach:** Split content into equal cards because the grid looks balanced.

**Better approach:** Define the relationship between items first, then choose a layout that makes that relationship obvious.

### 2.7 Distinguish primary, secondary, and tertiary actions

Actions need a clear priority. A primary action advances the page's main task. A secondary action offers a legitimate alternative or supporting path. Tertiary actions are less central and should not visually compete with the main route.

Priority should reflect user intent and risk, not just the business team's conversion target. A destructive action such as deleting an account may need strong wording and deliberate confirmation, but it should not be styled like a routine primary conversion button. A secondary action can remain discoverable without being equally prominent.

```html
<div class="action-group" aria-label="Plan actions">
  <a class="button button--primary" href="/checkout">Choose this plan</a>
  <a class="button button--secondary" href="/compare">Compare all plans</a>
  <a class="text-link" href="/sales">Talk to sales</a>
</div>
```

**Gotcha:** If three buttons share the same visual weight, users must decide which one the design team should have prioritized. If an action is not a meaningful alternative, consider moving it to a contextual link or another page.

**Naive approach:** Make every stakeholder-requested action a bright button.

**Better approach:** Name one primary action for the current context, then give secondary paths proportionate emphasis.

### 2.8 Make evidence appear close to the claim it supports

Claims create questions. “Fast setup” invites “How fast?” “Secure by design” invites “What protections?” “Save 30%” invites “Compared with what?” Evidence should appear near the claim or be one clear step away. Evidence may be a measurable result, a customer example, a technical explanation, a limitation, a review, or a transparent methodology.

Avoid floating proof points that look impressive but do not substantiate the nearby promise. A testimonial from an unrelated user group may not help a buyer evaluate fit. A statistic without a date, denominator, or definition may create more uncertainty than confidence.

```html
<section aria-labelledby="setup-heading">
  <h2 id="setup-heading">Set up your workspace in a few steps</h2>
  <p>Most teams finish the guided setup in under 20 minutes.</p>
  <p class="evidence-note">
    Based on completed onboarding sessions during the last quarter.
  </p>
  <a href="/setup-guide">See the setup steps</a>
</section>
```

**Gotcha:** Never invent a benchmark to make a hierarchy feel persuasive. If evidence is unavailable, qualify the claim, remove it, or state what is known and unknown.

**Naive approach:** Put all testimonials and statistics in a generic proof section near the footer.

**Better approach:** Pair each consequential claim with the evidence needed to evaluate it, and link to deeper evidence when appropriate.

### 2.9 Use progressive disclosure without hiding essential information

Progressive disclosure reveals complexity when it becomes relevant. It is useful for advanced settings, optional explanations, long filters, technical details, and secondary help. It is harmful when it hides fees, eligibility, risks, required steps, or information needed for informed consent.

Before hiding content behind an accordion, tooltip, tab, or “Learn more” link, ask: Does the user need this information to make the current decision? Is the control discoverable? Does the collapsed state communicate that more information exists? Can keyboard and assistive-technology users access it?

```html
<details>
  <summary>How is usage calculated?</summary>
  <p>
    Usage is measured by completed jobs. Failed jobs are not counted.
    Review the full usage policy before choosing a plan.
  </p>
</details>
```

**Gotcha:** A tooltip is a poor home for long, critical, or mobile-essential information. Important qualifications should remain visible or be available through a clear, accessible disclosure control.

**Naive approach:** Hide anything that makes the page look dense.

**Better approach:** Hide optional complexity, not essential decision information; test whether people can find and understand the disclosed content.

### 2.10 Write summaries that preserve the decision

A summary is not simply the first sentence copied from a longer section. It should preserve the main conclusion, the condition that changes it, and the next useful step. Summaries help people scan long pages, compare options, and decide whether to read the detail.

For example, “Enterprise plan” is a label, not a summary. “For teams that need SSO, audit logs, and centralized administration” helps readers decide whether to inspect the plan. A summary must not omit a limitation that reverses the recommendation.

```html
<article aria-labelledby="enterprise-title">
  <h3 id="enterprise-title">Enterprise</h3>
  <p>
    Best for organizations that need SSO, audit logs, and centralized controls.
  </p>
  <a href="/plans/enterprise">Review enterprise requirements</a>
</article>
```

**Gotcha:** A summary can become misleading when it compresses away an exception. Keep conditions that materially affect suitability, safety, cost, or commitment.

**Naive approach:** Write a catchy teaser that sounds appealing but answers no practical question.

**Better approach:** Summarize who the content is for, what it enables, and the most important condition or next step.

### 2.11 Plan comparison around the differences that change a choice

Comparison tables should prioritize decision-relevant differences, not list every possible feature with equal emphasis. Use consistent units, clear row labels, and explicit definitions for terms such as “unlimited,” “priority,” or “advanced.” If a difference affects price, compatibility, security, or eligibility, it usually deserves more prominence than a minor convenience feature.

On narrow screens, comparison tables can become difficult to navigate. Consider a compact summary plus detailed comparison, stacked plan details, or a horizontally scrollable table with clear context. Do not remove the very differences people need to compare simply to avoid responsive complexity.

```html
<table>
  <caption>Plan limits and support</caption>
  <thead>
    <tr>
      <th scope="col">Capability</th>
      <th scope="col">Starter</th>
      <th scope="col">Team</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Team members</th>
      <td>Up to 3</td>
      <td>Up to 25</td>
    </tr>
    <tr>
      <th scope="row">Support</th>
      <td>Email</td>
      <td>Email and live chat</td>
    </tr>
  </tbody>
</table>
```

**Gotcha:** A checkmark alone may not explain whether a feature is included, limited, or conditional. Provide text labels and accessible table headers.

**Naive approach:** Give every feature the same row treatment and expect users to find the meaningful differences.

**Better approach:** Identify the decisions users make, order comparison rows around those decisions, and preserve meaningful context on mobile.

### 2.12 Design for scanning and for deeper reading

A good hierarchy supports two modes: quick scanning and focused reading. Scanning depends on descriptive headings, short summaries, visible labels, consistent grouping, and meaningful emphasis. Deeper reading depends on coherent transitions, sufficient explanation, definitions, examples, and a logical progression.

Do not fragment every sentence into a bullet list. Lists work well for parallel items, steps, requirements, and concise options. Prose works better for nuanced explanations and connected reasoning. The page should offer enough landmarks for scanning without making the reading experience choppy.

```html
<section aria-labelledby="migration-heading">
  <h2 id="migration-heading">Move your existing data</h2>
  <p>
    The migration tool imports supported records and checks for common
    formatting issues before finalizing the transfer.
  </p>
  <ol>
    <li>Download the sample template.</li>
    <li>Map your fields to the supported format.</li>
    <li>Review the validation report before importing.</li>
  </ol>
</section>
```

**Gotcha:** Too many bold phrases, callouts, bullets, and colored labels make every element compete for attention. Emphasis works only when it is selective.

**Naive approach:** Turn all copy into short bullets to make it “scannable.”

**Better approach:** Match the content form to its relationship: prose for explanation, lists for parallel items, and steps for sequence.

### 2.13 Make mobile reading order intentional

Responsive design changes more than column count. It can change which content is encountered first, how controls relate to explanations, and whether a comparison remains understandable. The DOM order should normally reflect the meaningful reading sequence, because CSS visual rearrangement does not necessarily change keyboard or screen-reader order.

Write a mobile sequence as an explicit requirement. Decide whether the proof belongs before or after the feature summary, whether the action should repeat after a long explanation, and whether secondary material can move below the main task. Avoid CSS tricks that make the visual sequence contradict the semantic sequence.

```html
<section class="feature">
  <div class="feature__copy">
    <h2>Resolve exceptions sooner</h2>
    <p>See delayed orders and their owners in one queue.</p>
    <a href="/exceptions">Explore exception handling</a>
  </div>
  <figure class="feature__media">
    <img src="/images/exception-queue.webp"
         alt="A queue showing delayed orders and assigned owners">
    <figcaption>Example exception queue.</figcaption>
  </figure>
</section>
```

```css
.feature {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 2rem;
  align-items: center;
}

@media (max-width: 48rem) {
  .feature {
    grid-template-columns: 1fr;
  }
}
```

**Gotcha:** `order` and grid placement can change visual position without changing source order. Use visual reordering only when the reading and interaction sequence remains coherent.

**Naive approach:** Design desktop first, then stack the columns without checking the resulting narrative.

**Better approach:** Specify and test the semantic sequence at every breakpoint, with keyboard navigation included.

### 2.14 Use navigation and wayfinding for long content

Long pages need orientation. A contents list, section navigation, breadcrumbs, progress indicator, or sticky in-page navigation can help users understand where they are and move to relevant information. The right pattern depends on content length and task structure. Do not add a table of contents to a short page just because it looks editorial.

Use descriptive anchor labels and ensure the target headings have stable identifiers. Sticky navigation must not obscure focused headings or content when users follow links. On mobile, a compact contents disclosure may be more appropriate than a full horizontal menu.

```html
<nav aria-label="On this page">
  <h2>On this page</h2>
  <ul>
    <li><a href="#overview">Overview</a></li>
    <li><a href="#requirements">Requirements</a></li>
    <li><a href="#pricing">Pricing</a></li>
    <li><a href="#next-steps">Next steps</a></li>
  </ul>
</nav>

<main>
  <section id="overview" aria-labelledby="overview-heading">
    <h2 id="overview-heading">Overview</h2>
    <p>...</p>
  </section>
  <section id="requirements" aria-labelledby="requirements-heading">
    <h2 id="requirements-heading">Requirements</h2>
    <p>...</p>
  </section>
</main>
```

**Gotcha:** An in-page link that lands beneath a sticky header feels broken. Account for sticky offsets and visible focus, and test actual navigation rather than only clicking with a mouse.

**Naive approach:** Add navigation links without checking where they land.

**Better approach:** Provide wayfinding only when it reduces meaningful effort, and validate the destination, focus, and reading context.

### 2.15 Distinguish content hierarchy from visual hierarchy

Content hierarchy is the intended order of meaning and importance. Visual hierarchy is how typography, spacing, color, position, imagery, and contrast communicate that order. The two should align, but they are not identical. A visually small privacy note may be semantically important; a large decorative statistic may be visually prominent but low in decision value.

A mismatch is a design defect. If a secondary promotion dominates the page, the visual system contradicts the content plan. If all headings look the same, section structure becomes harder to scan. If an important disclaimer is visually hidden, its mere presence in the DOM does not make it effectively communicated.

```css
.page-title {
  font-size: clamp(2rem, 4vw, 3.75rem);
  line-height: 1.05;
  max-width: 14ch;
}

.section-title {
  font-size: clamp(1.5rem, 2.4vw, 2.25rem);
  line-height: 1.15;
}

.supporting-copy {
  max-width: 65ch;
  color: var(--color-text-muted);
}

.critical-note {
  border-inline-start: 0.25rem solid var(--color-warning);
  padding-inline-start: 1rem;
}
```

**Gotcha:** Do not use color alone to communicate importance or risk. Pair visual treatment with clear wording, structure, and—where appropriate—an icon or label.

**Naive approach:** Assume that a correct visual style guarantees the right information order.

**Better approach:** Audit the outline and content order separately from the visual treatment, then check whether the two reinforce one another.

### 2.16 Build hierarchy for accessibility and inclusive use

A hierarchy must remain understandable when someone uses a screen reader, keyboard, browser zoom, high-contrast mode, or a narrow viewport. Semantic landmarks such as `<header>`, `<nav>`, `<main>`, `<aside>`, and `<footer>` help users navigate. Labels should describe controls; link text should make sense out of context; images should have alternative text when they communicate content.

Do not make visual position the only clue about relationships. A form label should be programmatically associated with its input. A table should have meaningful headers. A disclosure should expose its expanded state through native semantics or correctly implemented accessible controls. When a chart or diagram contains important information, provide a textual equivalent.

```html
<form action="/search" method="get">
  <label for="site-query">Search documentation</label>
  <input id="site-query" name="q" type="search">
  <button type="submit">Search</button>
</form>
```

**Gotcha:** Placeholder text is not a replacement for a persistent label. It disappears as people type and may have insufficient contrast.

**Naive approach:** Use bold text, spacing, and icons to communicate everything visually.

**Better approach:** Build a semantic structure first, then add visual cues that strengthen—not replace—the structure.

### 2.17 Use content evidence to validate the hierarchy

Hierarchy is a hypothesis about what people need and how they will find it. Validate it with realistic tasks: ask participants to identify a plan that fits a constraint, find a policy condition, understand a product's limits, or explain the next step. Observe where they look, what they miss, and what they misunderstand. Do not ask only whether the page “looks clear,” because people may be polite or may not notice a problem until they attempt a task.

Useful evidence includes task completion, time to locate information, incorrect choices, scroll and click behavior, search queries, support contacts, and qualitative explanations. Analytics can show a pattern but rarely explain its cause by itself. Pair quantitative signals with usability observation and content review.

```text
Validation task:
“You manage a 12-person team. Find the lowest-cost plan that includes
single sign-on. Tell me the billing period and any setup condition.”

Observe:
- Which heading or label does the participant use first?
- Can they compare the relevant plans without guessing?
- Do they notice the billing condition before choosing?
- Can they explain why the selected plan fits?
- What content did they expect but fail to find?
```

**Gotcha:** A high click-through rate does not prove that users understood the content. They may click the wrong path, misunderstand the promise, or discover a blocker later.

**Naive approach:** Validate with a screenshot preference poll.

**Better approach:** Test whether people can find, understand, compare, and act on the information the hierarchy is meant to support.

---

## 3. Hierarchy Patterns and Integration Patterns

### Pattern 1: Orient → Explain value → Prove → Act

Use for landing pages, service pages, product launches, and portfolio introductions. Begin with a specific description, explain the relevant outcome, support the claim with credible evidence, and make the next step clear. The proof may be a customer result, a sample, a process preview, or a transparent limitation—not necessarily a wall of logos.

```html
<main>
  <section aria-labelledby="intro-title">
    <p class="eyebrow">Inventory operations</p>
    <h1 id="intro-title">Spot stock issues before they delay orders.</h1>
    <p>See low stock, incoming shipments, and exceptions in one view.</p>
    <a href="/demo">View a product demo</a>
  </section>
  <section aria-labelledby="proof-title">
    <h2 id="proof-title">See how the workflow works</h2>
    <figure>
      <img src="/images/inventory-workflow.webp"
           alt="Inventory dashboard with low-stock items highlighted">
      <figcaption>Example workflow using sample data.</figcaption>
    </figure>
  </section>
</main>
```

**Use when:** The visitor needs to understand an offering before committing to an action.

**Avoid when:** The user is already in the middle of a task and needs a direct control, not a marketing narrative.

### Pattern 2: Question → Answer → Evidence → Detail

Use for FAQ pages, technical documentation, policy pages, and evaluation content. State the answer early, provide the condition or evidence, then link to deeper detail. This prevents readers from having to search through paragraphs before discovering the actual answer.

```html
<section aria-labelledby="retention-heading">
  <h2 id="retention-heading">How long is activity data retained?</h2>
  <p>Activity data is retained for 90 days on the standard plan.</p>
  <p>The retention period begins when each event is recorded.</p>
  <a href="/policies/data-retention">Read the retention policy</a>
</section>
```

**Use when:** Readers arrive with a specific question or need a trustworthy reference.

**Avoid when:** The answer is conditional enough that a single sentence would mislead. State the main condition alongside the answer.

### Pattern 3: Summary → Compare → Decide

Use for pricing, plan selection, product comparison, and service packages. Give a concise summary of who each option suits, surface the differences that affect the choice, and make the next step explicit. Detailed feature lists can follow, but should not obscure the main distinction.

```html
<section aria-labelledby="plans-title">
  <h2 id="plans-title">Choose a plan</h2>
  <div class="plan-grid">
    <article>
      <h3>Starter</h3>
      <p>For individuals validating a workflow.</p>
      <p>Includes 3 seats and email support.</p>
      <a href="/checkout/starter">Choose Starter</a>
    </article>
    <article>
      <h3>Team</h3>
      <p>For teams coordinating shared work.</p>
      <p>Includes 25 seats and live chat support.</p>
      <a href="/checkout/team">Choose Team</a>
    </article>
  </div>
</section>
```

**Use when:** Users need to choose between distinct options.

**Avoid when:** The options cannot be compared on consistent criteria. Explain the different use cases instead of manufacturing a table of false equivalences.

### Pattern 4: Task → Requirements → Steps → Confirmation

Use for onboarding, forms, setup flows, and operational instructions. Explain what the user is trying to accomplish, what they need beforehand, the sequence of actions, and what success looks like. Requirements belong before the user invests effort.

```html
<article aria-labelledby="connect-title">
  <h1 id="connect-title">Connect your workspace</h1>
  <section aria-labelledby="before-title">
    <h2 id="before-title">Before you begin</h2>
    <ul>
      <li>Administrator access to the workspace</li>
      <li>The verification method for your account</li>
    </ul>
  </section>
  <section aria-labelledby="steps-title">
    <h2 id="steps-title">Connect in three steps</h2>
    <ol>
      <li>Choose your workspace provider.</li>
      <li>Review requested permissions.</li>
      <li>Confirm the connection.</li>
    </ol>
  </section>
</article>
```

**Use when:** The task has prerequisites, ordered steps, or a meaningful success state.

**Avoid when:** The task is a single, self-explanatory action. Do not add ceremony that slows the user down.

### Pattern 5: Risk → Consequence → Choice

Use when a user is about to make a consequential decision, such as deleting data, changing permissions, accepting a renewal, or submitting sensitive information. Explain the consequence in plain language before the final action. Present safe alternatives when available.

```html
<section aria-labelledby="delete-heading">
  <h2 id="delete-heading">Delete this workspace?</h2>
  <p>
    Deleting the workspace removes its projects and access for all members.
    This action cannot be undone.
  </p>
  <div class="action-group">
    <button type="button" class="button button--danger">
      Delete workspace
    </button>
    <button type="button" class="button button--secondary">
      Keep workspace
    </button>
  </div>
</section>
```

**Use when:** The action is destructive, irreversible, costly, or affects other people.

**Avoid when:** The consequence is trivial. Over-warning routine actions teaches people to ignore warnings.

### Pattern 6: Progressive disclosure by expertise

Use when a page serves both newcomers and experienced users. Keep the common path visible, then reveal advanced options or technical detail through clear disclosures. Label the advanced content so people know what it contains.

```html
<section aria-labelledby="import-heading">
  <h2 id="import-heading">Import a data file</h2>
  <p>Upload a CSV using the sample column format.</p>
  <a href="/templates/import.csv">Download sample CSV</a>
  <details>
    <summary>Advanced mapping options</summary>
    <p>Map custom fields and choose how duplicate records are handled.</p>
  </details>
</section>
```

**Use when:** A mixed-experience audience needs a simple default path and optional complexity.

**Avoid when:** Advanced details change the user's consent, cost, eligibility, or safety decision. Keep those details visible at the decision point.

### Pattern 7: Long-form narrative with landmarks

Use for case studies, editorial articles, research summaries, and detailed guides. Create a clear thesis, group evidence into meaningful sections, use descriptive headings, and provide a summary or contents list when length makes navigation difficult.

```html
<article>
  <header>
    <p class="eyebrow">Customer story</p>
    <h1>How the team reduced order handoff delays</h1>
    <p class="article-summary">
      The team clarified ownership, surfaced exceptions, and standardized
      its daily review process.
    </p>
  </header>
  <nav aria-label="Article contents">
    <ul>
      <li><a href="#challenge">The challenge</a></li>
      <li><a href="#changes">What changed</a></li>
      <li><a href="#results">Results and limits</a></li>
    </ul>
  </nav>
  <section id="challenge">
    <h2>The challenge</h2>
    <p>...</p>
  </section>
  <section id="changes">
    <h2>What changed</h2>
    <p>...</p>
  </section>
  <section id="results">
    <h2>Results and limits</h2>
    <p>...</p>
  </section>
</article>
```

**Use when:** The content needs a sustained argument or story.

**Avoid when:** The user needs a quick operational answer. Offer a concise answer first and deeper explanation afterward.

---

## 4. Common Mistakes and Distinct Fixes

| Mistake | Why it fails | Better fix |
|---|---|---|
| Starting from the component library | Component slots dictate the story before the user need is understood. | Write a page job and question inventory before selecting components. |
| Treating all content as equally important | Users must do the prioritization themselves. | Assign explicit priority tiers and document why each item belongs. |
| Using the company sitemap as the page outline | Internal language may not match users' questions. | Reorganize around decisions and user tasks; map internal categories afterward. |
| Making the headline vague | Visitors cannot tell whether the page matches their intent. | Name the offering, audience, or outcome in plain language. |
| Adding multiple primary CTAs | Competing actions weaken the intended path. | Choose one primary action for the page context and demote legitimate alternatives. |
| Hiding critical conditions in accordions | People may commit without seeing information that changes the decision. | Keep fees, risks, eligibility, and consent details visible at the decision point. |
| Using cards for every section | Equal containers imply equal importance and relationship. | Use cards only for coherent, independently scannable units. |
| Making headings clever but uninformative | Wordplay can obscure the section's subject. | Prefer descriptive headings; use personality after clarity is established. |
| Overusing bold and accent color | Emphasis loses meaning when applied everywhere. | Reserve strong emphasis for a small number of high-value signals. |
| Writing summaries that omit conditions | The shortened version can become misleading. | Preserve constraints that change suitability, cost, risk, or next steps. |
| Putting evidence far from a claim | Readers must remember a promise while searching for proof. | Pair consequential claims with evidence or a direct evidence link. |
| Making mobile order an afterthought | Stacked content may tell the story in the wrong sequence. | Specify source order and test each breakpoint and keyboard sequence. |
| Using visual font size to choose heading tags | The semantic outline becomes illogical. | Choose heading levels structurally and style them with CSS. |
| Using placeholder text as the only label | The label disappears and may not be accessible. | Use persistent `<label>` elements associated with controls. |
| Creating comparison tables full of checkmarks | Differences and limitations remain ambiguous. | Use explicit row labels, scoped headers, units, and explanatory text. |
| Adding a table of contents to every page | Extra navigation adds noise to short content. | Add wayfinding only when length or task complexity justifies it. |
| Treating scroll depth as proof of comprehension | Scrolling does not show whether content was understood. | Test real tasks and ask users to explain their choice. |
| Prioritizing stakeholder preference over evidence | The loudest opinion can displace important user information. | Record assumptions and compare them with research, support, and behavior data. |
| Using a promotional module to interrupt a critical task | The business message competes with the user's immediate goal. | Place promotion after task-critical content or remove it from the flow. |
| Leaving obsolete content in place | Outdated statements undermine trust and create contradictory signals. | Assign owners and review dates; remove or update content based on evidence. |

### Review protocol for each section

For every proposed section, answer these questions:

1. Which user question does this section answer?
2. What decision or task does that answer support?
3. What must the reader already know to understand it?
4. What evidence supports its claims?
5. What should the reader do or understand next?
6. What would break if the section were removed?
7. Does the section duplicate another section?
8. Is its position justified by the user's journey rather than internal preference?

If the team cannot answer these questions, the section may be unnecessary, misplaced, or too vague to implement.

---

## 5. Mental Models

### Model 1: The hierarchy ladder

Think of content as a ladder of increasing detail. The top rung orients the reader; the next rung explains the core value or task; the middle rungs provide evidence and meaningful distinctions; lower rungs contain edge cases, technical depth, and optional context. The ladder is not a rule that every page must follow the same sequence. It is a way to ask whether a reader has enough context to understand the next level.

**Use it when:** Reviewing a long page or deciding what belongs in the opening viewport.

**Failure signal:** A reader is asked to evaluate detailed claims before the page has explained what those claims refer to.

### Model 2: The decision-distance test

Every piece of information has a distance from the decision it affects. A price condition far from the plan choice has a high decision distance. A setup requirement far from the start button may be discovered too late. Reduce distance for information that changes cost, risk, eligibility, compatibility, or commitment. Lower-priority background can live farther away.

**Use it when:** Reviewing pricing, checkout, onboarding, permission requests, and destructive actions.

**Failure signal:** Users repeatedly say, “I didn't know that before I clicked.”

### Model 3: The scan path

Imagine the page being scanned in short bursts rather than read linearly. Descriptive headings, summaries, labels, and grouped information form landmarks. The scan path should allow a visitor to infer the page's structure and find likely answers without reading every paragraph.

**Use it when:** Working on documentation, editorial content, feature pages, and complex settings.

**Failure signal:** A user scrolls repeatedly, misses an important section, or opens unrelated links because headings are too generic.

### Model 4: The information scent

A label or heading gives a clue about what lies behind it. Strong information scent means the user can predict the destination accurately. “Security and data retention” has stronger scent for a privacy question than “Our commitment.” “Review billing terms” is clearer than “Continue.”

**Use it when:** Naming headings, navigation items, links, buttons, tabs, and disclosures.

**Failure signal:** People choose a link based on a guess and arrive at unexpected content.

### Model 5: The hierarchy budget

Attention is limited. Every large heading, bright button, callout, badge, statistic, and image spends some of the page's attention budget. If every element demands attention, none of them can guide the user. Spend the strongest visual emphasis on the information that most supports the current task, and use quieter treatments for secondary content.

**Use it when:** A page feels noisy despite having good individual components.

**Failure signal:** A quick squint test reveals many equally prominent focal points.

### Model 6: Progressive disclosure as a promise

A disclosure control makes a promise: “There is more detail here, and you can reveal it when needed.” The label must make the hidden content predictable, and the control must work for keyboard and assistive-technology users. The hidden content must not contain information that the user should have seen before making the current decision.

**Use it when:** Adding accordions, advanced settings, expandable help, or technical detail.

**Failure signal:** People do not notice the disclosure, or they discover a critical limitation only after committing.

### Model 7: The semantic outline

The DOM outline is the content's structural skeleton. If the page's meaning is understandable only when colors, font sizes, and positions are visible, the hierarchy is fragile. A coherent semantic outline supports assistive technology, browser tools, search engines, and future redesigns.

**Use it when:** Auditing accessibility or preparing a page for responsive redesign.

**Failure signal:** Heading navigation reads like a random list of slogans or jumps between unrelated levels.

### Model 8: The claim-evidence chain

Every important promise creates a need for support. A claim should lead to evidence, and the evidence should lead to a reasonable interpretation. If the evidence is weak, old, irrelevant, or missing, the content should be qualified rather than amplified.

**Use it when:** Designing landing pages, product pages, case studies, and comparison content.

**Failure signal:** A page contains impressive numbers but cannot explain how they were measured or whether they apply to the visitor.

---

## 6. Quick Reference

| Decision | Prefer | Avoid |
|---|---|---|
| Page purpose | One observable primary user outcome | A list of unrelated goals |
| Opening section | Orientation, value, next step | A vague brand slogan alone |
| Content priority | Essential, support, later, out of scope | Treating every request as mandatory |
| Heading copy | Descriptive and specific | Clever but ambiguous labels |
| Heading semantics | Logical nested levels | Choosing tags by font size |
| Content grouping | Meaningful relationships | Cards for every paragraph |
| Primary action | One clearly prioritized route | Several equally loud buttons |
| Secondary action | A useful alternative with lower emphasis | Hiding a legitimate alternative |
| Evidence | Near the claim it supports | Generic proof detached from claims |
| Progressive disclosure | Optional complexity | Critical fees or conditions hidden |
| Summary | Main conclusion plus key condition | A teaser that omits constraints |
| Comparison | Decision-relevant differences and units | Unexplained checkmarks |
| Mobile | Intentional semantic reading order | Visual order that contradicts DOM order |
| Long page | Landmarks and useful wayfinding | Navigation added without need |
| Accessibility | Semantic structure and labels | Visual-only cues |
| Validation | Task-based usability evidence | Screenshot preference alone |
| Analytics | Combine behavior with observation | Treating one metric as comprehension |
| Governance | Named owner and review date | Content with no maintenance plan |
| Stakeholder conflict | Explicit rationale and evidence | “The loudest person wins” |
| Final audit | Find, understand, compare, act | “Looks balanced” as the only criterion |

### Fast hierarchy audit

- Can a new visitor identify the page's purpose in a few seconds?
- Is the primary audience reflected in the opening copy?
- Does the main heading describe the actual page rather than a vague brand idea?
- Is the primary action clear and distinct from secondary paths?
- Are critical fees, risks, prerequisites, and limitations near the relevant decision?
- Do headings describe the sections accurately when read alone?
- Are related items grouped, and unrelated items separated?
- Can a user compare options without guessing what a label means?
- Does the mobile reading sequence preserve the intended narrative?
- Is the heading outline logical without CSS?
- Can keyboard users access every control and disclosure?
- Are important claims supported by evidence?
- Is any section redundant, stale, or included only because a stakeholder asked?
- Does task-based testing confirm that users can find and understand what they need?

---

## 7. Build Challenge

### Challenge: Rebuild the hierarchy of a cluttered product page

Create a product page for a fictional team scheduling tool. The current draft contains a slogan, seven feature cards, three competing calls to action, two testimonials, a pricing note, an integration list, a setup requirement, and a long company story. The content is all technically present, but the page does not help a visitor decide whether the tool fits their team.

#### Requirements

1. Define one primary audience and one primary user outcome.
2. Write a page job statement, the primary decision, and the primary action.
3. Create a content inventory with at least 15 items.
4. Assign each item a priority tier: essential now, important support, useful later, or out of scope.
5. List at least eight user questions and map each to a section.
6. Draft the page outline using semantic headings before writing final copy.
7. Write a clear opening heading, supporting paragraph, primary action, and one relevant qualification.
8. Include evidence close to at least two consequential claims.
9. Design a plan comparison that emphasizes three decision-relevant differences.
10. Keep setup requirements visible before the user commits to a trial.
11. Place company history and low-priority details where they do not interrupt the decision.
12. Define a mobile reading order and explain any content that moves or collapses.
13. Check the heading outline, labels, links, table headers, and keyboard access.
14. Run at least three task-based usability tests with realistic tasks.
15. Record one hierarchy change made because of evidence rather than personal taste.

#### Example content inventory

| Item | Priority | Reason | Placement |
|---|---|---|---|
| Plain-language product description | Essential now | Establishes relevance | Opening |
| Who the tool is for | Essential now | Helps visitors self-select | Opening or early section |
| Main scheduling workflow | Essential now | Explains core value | Early overview |
| Trial setup requirements | Essential now | Prevents late surprise | Before trial action |
| Pricing and billing conditions | Essential now | Changes commitment | Pricing section |
| Integration compatibility | Important support | Affects fit | Evaluation section |
| Customer evidence | Important support | Supports trust | Near relevant claims |
| Advanced permission details | Useful later unless decision-critical | Serves deeper evaluation | Disclosure or documentation |
| Company origin story | Useful later | Context, not primary decision | About page or footer |
| Unrelated company announcement | Out of scope | Does not support the page job | Remove or separate page |

#### Deliverables

- A one-sentence page job.
- A user-question map.
- A prioritized content inventory.
- A semantic outline.
- A text-only wireframe.
- A responsive reading-order note.
- A short accessibility audit.
- Three usability tasks with observations.
- A before/after explanation of at least four hierarchy changes.

#### Suggested text-only wireframe

```text
[Header: logo, primary navigation, account link]

[Main]
  [H1: specific product outcome]
  [Short value explanation]
  [Primary action]
  [Trial requirement or key qualification]

  [H2: How the workflow helps]
    [Three related capabilities, not seven equal cards]

  [H2: Is it right for your team?]
    [Audience and use cases]
    [Important limitations]

  [H2: Compare plans]
    [Three decision-relevant differences]
    [Billing conditions]

  [H2: Evidence from real use]
    [Claim + relevant proof + context]

  [H2: Set up the trial]
    [Prerequisites]
    [Steps]
    [Primary action repeated where useful]

  [H2: More details]
    [Integrations, advanced details, company context]

[Footer: secondary navigation, policy links]
```

#### Evaluation rubric

Score each area from 0 to 3:

- **0 — Missing:** No explicit decision or structure.
- **1 — Weak:** Structure exists but priorities are unclear.
- **2 — Solid:** Hierarchy is coherent and mostly supported by user needs.
- **3 — Strong:** Every major placement is justified, tested, accessible, and responsive.

| Area | What a strong result demonstrates |
|---|---|
| Page job | A clear audience, decision, and observable outcome |
| Priority | Essential information is visible at the right moment |
| Outline | Headings form a coherent semantic structure |
| Action hierarchy | Primary and secondary paths are distinguishable |
| Evidence | Claims are supported close to the decision |
| Disclosure | Optional complexity is available without hiding critical details |
| Responsive order | Mobile preserves the task's logical sequence |
| Accessibility | Semantic landmarks, headings, labels, and keyboard access work |
| Validation | Testing changes the hierarchy based on observed behavior |
| Rationale | Trade-offs are documented rather than based on taste |

---

## 8. Definition of Done

A content hierarchy is ready for implementation when the following checkpoints are met:

- [ ] The page job identifies a primary audience, task, decision, and outcome.
- [ ] The content inventory includes all proposed sections and identifies duplicates, stale items, and out-of-scope content.
- [ ] Each item has a documented priority and placement rationale.
- [ ] The hierarchy answers the user's most important questions in a useful order.
- [ ] The opening section orients the visitor without relying on vague slogans.
- [ ] The primary action is distinguishable from secondary and tertiary actions.
- [ ] Critical costs, risks, prerequisites, eligibility conditions, and limitations appear near the decisions they affect.
- [ ] Headings are descriptive and form a logical semantic outline.
- [ ] Related content is grouped by meaning rather than by visual symmetry.
- [ ] Important claims have relevant evidence or are qualified appropriately.
- [ ] Summaries preserve conditions that change the decision.
- [ ] Progressive disclosure is used only for information that can safely be deferred.
- [ ] Comparison content uses consistent criteria, clear labels, and meaningful units.
- [ ] The mobile reading order is intentional and does not contradict semantic order.
- [ ] Navigation and in-page links land at visible, understandable destinations.
- [ ] Controls have labels and all interactions are keyboard-accessible.
- [ ] Visual emphasis supports the content priority rather than competing with it.
- [ ] Task-based testing confirms that users can find, understand, compare, and act.
- [ ] Decisions, assumptions, and evidence are documented for future revisions.
- [ ] Content has an owner and a review trigger or date.

### Handoff notes for design and engineering

The hierarchy specification should include more than a screenshot. Hand off the page job, target audience, priority inventory, semantic outline, primary and secondary actions, disclosure rules, mobile reading order, and the reason for any content that is intentionally hidden or omitted. Identify content that must remain adjacent—for example, a claim and its qualification, a price and its billing condition, or a permission request and its explanation.

Engineering should preserve semantic source order, use heading levels structurally, implement native elements where they fit, and ensure responsive changes do not separate critical relationships. Design should encode hierarchy through a consistent system of type, spacing, contrast, grouping, and emphasis. Content authors should maintain descriptive headings and avoid reintroducing vague slogans or duplicate sections after the structure has been approved.

Finally, treat hierarchy as something that can change. New user research, a new product capability, a pricing change, or a repeated support question may change what belongs near the top. A reviewable content plan makes that change intentional instead of letting the page accumulate more sections indefinitely.


### Before/after review 1: A vague opening

**Before:** Our next-generation platform empowers teams.

**After:** Schedule handoffs without losing track of ownership.

**Why:** A concrete outcome lets visitors decide whether to keep reading.

```text
Before: Our next-generation platform empowers teams.
After:  Schedule handoffs without losing track of ownership.
Decision: Keep the version that best supports the page's primary user task.
```


### Before/after review 2: A hidden fee

**Before:** The price is shown now; the required setup fee is in a distant FAQ.

**After:** Show the recurring price and required setup fee together.

**Why:** Conditions that change total cost belong at the decision point.

```text
Before: The price is shown now; the required setup fee is in a distant FAQ.
After:  Show the recurring price and required setup fee together.
Decision: Keep the version that best supports the page's primary user task.
```


### Before/after review 3: Competing calls to action

**Before:** Start trial / Book demo / Contact us / Explore blog all look primary.

**After:** Use one primary action and quieter, contextual alternatives.

**Why:** Do not force every route into the same visual priority.

```text
Before: Start trial / Book demo / Contact us / Explore blog all look primary.
After:  Use one primary action and quieter, contextual alternatives.
Decision: Keep the version that best supports the page's primary user task.
```


### Before/after review 4: An unhelpful heading

**Before:** Our approach

**After:** How we review and assign delayed orders

**Why:** A descriptive heading creates stronger information scent.

```text
Before: Our approach
After:  How we review and assign delayed orders
Decision: Keep the version that best supports the page's primary user task.
```


### Before/after review 5: Proof without context

**Before:** Teams save 40%.

**After:** In a measured pilot, participating teams reduced manual review time by 40%; results vary by workflow.

**Why:** Keep the metric honest and provide its context.

```text
Before: Teams save 40%.
After:  In a measured pilot, participating teams reduced manual review time by 40%; results vary by workflow.
Decision: Keep the version that best supports the page's primary user task.
```


### Before/after review 6: A generic feature list

**Before:** Powerful, flexible, seamless, innovative.

**After:** Assign an owner to each exception and track its next step.

**Why:** Describe what the user can do rather than stacking adjectives.

```text
Before: Powerful, flexible, seamless, innovative.
After:  Assign an owner to each exception and track its next step.
Decision: Keep the version that best supports the page's primary user task.
```


### Before/after review 7: A hidden prerequisite

**Before:** Click connect, then discover administrator access is required.

**After:** State the administrator-access requirement before the connect action.

**Why:** Prerequisites should be discoverable before effort is invested.

```text
Before: Click connect, then discover administrator access is required.
After:  State the administrator-access requirement before the connect action.
Decision: Keep the version that best supports the page's primary user task.
```


### Before/after review 8: An overloaded hero

**Before:** Headline, six badges, two videos, three CTAs, and a testimonial carousel.

**After:** Headline, concise value statement, one action, one useful qualification.

**Why:** The first viewport is for orientation, not an entire sitemap.

```text
Before: Headline, six badges, two videos, three CTAs, and a testimonial carousel.
After:  Headline, concise value statement, one action, one useful qualification.
Decision: Keep the version that best supports the page's primary user task.
```


### Before/after review 9: A misleading plan label

**Before:** Advanced

**After:** For teams needing SSO and audit logs

**Why:** Name the distinguishing value so the plan can be self-selected.

```text
Before: Advanced
After:  For teams needing SSO and audit logs
Decision: Keep the version that best supports the page's primary user task.
```


### Before/after review 10: An ambiguous link

**Before:** Click here

**After:** Review the data-retention policy

**Why:** Link text should remain understandable out of context.

```text
Before: Click here
After:  Review the data-retention policy
Decision: Keep the version that best supports the page's primary user task.
```


### Before/after review 11: A mobile narrative break

**Before:** Image and promotion appear before the explanation after stacking.

**After:** Place the explanation before the supporting image in semantic order.

**Why:** Visual order should not contradict reading order.

```text
Before: Image and promotion appear before the explanation after stacking.
After:  Place the explanation before the supporting image in semantic order.
Decision: Keep the version that best supports the page's primary user task.
```


### Before/after review 12: An inaccessible heading

**Before:** A bold paragraph styled to look like a heading.

**After:** Use an h2 for a real section heading and style it in CSS.

**Why:** Structure must survive CSS removal and assistive navigation.

```text
Before: A bold paragraph styled to look like a heading.
After:  Use an h2 for a real section heading and style it in CSS.
Decision: Keep the version that best supports the page's primary user task.
```


### Before/after review 13: A table of checkmarks

**Before:** ✓ / ✓ / — with no definitions.

**After:** Use explicit Included, Limited, and Not included labels with criteria.

**Why:** Symbols alone rarely communicate the relevant condition.

```text
Before: ✓ / ✓ / — with no definitions.
After:  Use explicit Included, Limited, and Not included labels with criteria.
Decision: Keep the version that best supports the page's primary user task.
```


### Before/after review 14: A buried warning

**Before:** Important data-loss warning below a long explanation.

**After:** Place the warning before the destructive confirmation action.

**Why:** Warnings need proximity to the action they qualify.

```text
Before: Important data-loss warning below a long explanation.
After:  Place the warning before the destructive confirmation action.
Decision: Keep the version that best supports the page's primary user task.
```


### Before/after review 15: An overlong introduction

**Before:** Four paragraphs of company background before the answer.

**After:** Answer the user's main question first, then provide context.

**Why:** Lead with the information that supports the current task.

```text
Before: Four paragraphs of company background before the answer.
After:  Answer the user's main question first, then provide context.
Decision: Keep the version that best supports the page's primary user task.
```


### Before/after review 16: A cluttered settings page

**Before:** Every setting appears as an equally weighted card.

**After:** Group settings by task and consequence, with destructive actions separated.

**Why:** Grouping should reflect mental models, not visual symmetry.

```text
Before: Every setting appears as an equally weighted card.
After:  Group settings by task and consequence, with destructive actions separated.
Decision: Keep the version that best supports the page's primary user task.
```


### Before/after review 17: A redundant section

**Before:** A second feature section repeats the same claim with new adjectives.

**After:** Merge duplicate claims and use the space for evidence or remove it.

**Why:** Repetition is not hierarchy; it is often unresolved content scope.

```text
Before: A second feature section repeats the same claim with new adjectives.
After:  Merge duplicate claims and use the space for evidence or remove it.
Decision: Keep the version that best supports the page's primary user task.
```


### Scenario 1: SaaS pricing

Put the plan's best-fit summary, price, billing period, seat limits, and critical exclusions together. Keep detailed feature documentation one step away.

**Planning prompt:** Which user decision is this page supporting, and what information could change that decision?

**Review prompt:** If a visitor scans only the main heading, section headings, summaries, and action labels, can they predict the page's structure and next step?


### Scenario 2: Portfolio case study

Lead with the project outcome and the designer's role. Follow with constraints, approach, key decisions, evidence, and lessons. Do not make readers search through decorative mockups to discover the problem.

**Planning prompt:** Which user decision is this page supporting, and what information could change that decision?

**Review prompt:** If a visitor scans only the main heading, section headings, summaries, and action labels, can they predict the page's structure and next step?


### Scenario 3: Help article

Start with a direct answer or a short purpose statement, then prerequisites, steps, expected result, and recovery path. Keep troubleshooting close to the step where the error can occur.

**Planning prompt:** Which user decision is this page supporting, and what information could change that decision?

**Review prompt:** If a visitor scans only the main heading, section headings, summaries, and action labels, can they predict the page's structure and next step?


### Scenario 4: Account settings

Group by the user's mental model—profile, security, notifications, billing. Show current state, consequence, and save behavior. Separate destructive controls from routine edits.

**Planning prompt:** Which user decision is this page supporting, and what information could change that decision?

**Review prompt:** If a visitor scans only the main heading, section headings, summaries, and action labels, can they predict the page's structure and next step?


### Scenario 5: Checkout

Keep item, price, fees, delivery details, payment method, and final total understandable before the final commitment. Avoid introducing optional cross-sells between the total and submit action.

**Planning prompt:** Which user decision is this page supporting, and what information could change that decision?

**Review prompt:** If a visitor scans only the main heading, section headings, summaries, and action labels, can they predict the page's structure and next step?


### Scenario 6: Healthcare information

Use plain-language headings, define unfamiliar terms, and distinguish general information from urgent instructions. Do not bury eligibility, contraindications, or when to seek professional help.

**Planning prompt:** Which user decision is this page supporting, and what information could change that decision?

**Review prompt:** If a visitor scans only the main heading, section headings, summaries, and action labels, can they predict the page's structure and next step?


### Scenario 7: Education course page

Surface who the course is for, prerequisites, learning outcomes, workload, format, and assessment before optional instructor biography or promotional material.

**Planning prompt:** Which user decision is this page supporting, and what information could change that decision?

**Review prompt:** If a visitor scans only the main heading, section headings, summaries, and action labels, can they predict the page's structure and next step?


### Scenario 8: Event registration

Place date, location or online format, audience, cost, accessibility details, and cancellation conditions near registration. Explain what happens after submission.

**Planning prompt:** Which user decision is this page supporting, and what information could change that decision?

**Review prompt:** If a visitor scans only the main heading, section headings, summaries, and action labels, can they predict the page's structure and next step?


### Scenario 9: Job listing

Lead with role, location or remote status, level, compensation where available, responsibilities, requirements, and application steps. Separate required qualifications from nice-to-haves.

**Planning prompt:** Which user decision is this page supporting, and what information could change that decision?

**Review prompt:** If a visitor scans only the main heading, section headings, summaries, and action labels, can they predict the page's structure and next step?


### Scenario 10: Data dashboard

Start with the user's question and the key metric. Provide units, timeframe, comparison, and data freshness. Put methodology and edge cases nearby without crowding the primary reading path.

**Planning prompt:** Which user decision is this page supporting, and what information could change that decision?

**Review prompt:** If a visitor scans only the main heading, section headings, summaries, and action labels, can they predict the page's structure and next step?


### Scenario 11: Mobile onboarding

State the purpose, explain requested permissions at the moment they matter, show progress when meaningful, and let users understand how to recover from a failed step.

**Planning prompt:** Which user decision is this page supporting, and what information could change that decision?

**Review prompt:** If a visitor scans only the main heading, section headings, summaries, and action labels, can they predict the page's structure and next step?


### Scenario 12: Product comparison

Choose criteria that change the decision, keep units consistent, explain ambiguous terms, and show limitations. Avoid selecting criteria solely because one option wins.

**Planning prompt:** Which user decision is this page supporting, and what information could change that decision?

**Review prompt:** If a visitor scans only the main heading, section headings, summaries, and action labels, can they predict the page's structure and next step?


### Scenario 13: Security page

Use precise statements about controls, scope, and limitations. Link certifications to their scope and date; do not imply that a logo proves every security claim.

**Planning prompt:** Which user decision is this page supporting, and what information could change that decision?

**Review prompt:** If a visitor scans only the main heading, section headings, summaries, and action labels, can they predict the page's structure and next step?


### Scenario 14: Editorial article

Use a clear thesis, descriptive headings, meaningful transitions, and a summary when the article is long. Avoid inserting unrelated promotions into the argument's key sequence.

**Planning prompt:** Which user decision is this page supporting, and what information could change that decision?

**Review prompt:** If a visitor scans only the main heading, section headings, summaries, and action labels, can they predict the page's structure and next step?


### Scenario 15: Agency homepage

Tell visitors what the agency does, for whom, and what outcome it supports. Use a relevant work sample and a clear inquiry path before long founder narratives.

**Planning prompt:** Which user decision is this page supporting, and what information could change that decision?

**Review prompt:** If a visitor scans only the main heading, section headings, summaries, and action labels, can they predict the page's structure and next step?


### Scenario 16: Support contact page

Help users choose the right channel, state response expectations honestly, and explain what information to prepare. Avoid forcing every problem through one generic contact form.

**Planning prompt:** Which user decision is this page supporting, and what information could change that decision?

**Review prompt:** If a visitor scans only the main heading, section headings, summaries, and action labels, can they predict the page's structure and next step?


### Scenario 17: Permission request

Explain what data or capability is requested, why it is needed, and what happens if permission is declined. Keep the explanation next to the choice.

**Planning prompt:** Which user decision is this page supporting, and what information could change that decision?

**Review prompt:** If a visitor scans only the main heading, section headings, summaries, and action labels, can they predict the page's structure and next step?


### Scenario 18: Cancellation flow

Make the consequences and effective date clear. Offer a relevant alternative without obscuring cancellation or using misleading button labels.

**Planning prompt:** Which user decision is this page supporting, and what information could change that decision?

**Review prompt:** If a visitor scans only the main heading, section headings, summaries, and action labels, can they predict the page's structure and next step?


### Scenario 19: Search results

Make the query context visible, label filters clearly, show useful result metadata, and provide a meaningful empty or no-match route. Do not let promotions masquerade as results.

**Planning prompt:** Which user decision is this page supporting, and what information could change that decision?

**Review prompt:** If a visitor scans only the main heading, section headings, summaries, and action labels, can they predict the page's structure and next step?


### Scenario 20: Feature release

State what changed, who benefits, availability, prerequisites, and migration impact. Put compatibility or breaking-change information before the user attempts an upgrade.

**Planning prompt:** Which user decision is this page supporting, and what information could change that decision?

**Review prompt:** If a visitor scans only the main heading, section headings, summaries, and action labels, can they predict the page's structure and next step?


### Working example: Plain-text outline before design

```text
Page job: Help a first-time buyer select a suitable plan.
Audience: Team leads evaluating a shared workflow tool.
Decision: Does the plan meet our seat, security, and budget needs?
Primary action: Choose a plan.
Essential: plan fit, price, billing terms, seat limits, security requirements.
Support: customer evidence, migration guide, integration list.
Later: company story, advanced API examples.
Out of scope: unrelated product announcements.
```


### Working example: Content inventory data shape

```text
const inventory = [
  { id: "price", tier: "essential", decision: "affordability" },
  { id: "seat-limit", tier: "essential", decision: "team fit" },
  { id: "case-study", tier: "support", decision: "confidence" },
  { id: "company-history", tier: "later", decision: "background" },
  { id: "unrelated-news", tier: "out-of-scope", decision: null },
];

const allowedTiers = new Set(["essential", "support", "later", "out-of-scope"]);
const invalid = inventory.filter((item) => !allowedTiers.has(item.tier));
if (invalid.length) throw new Error("Every item needs a valid priority tier.");
```


### Working example: Semantic document skeleton

```html
<header>
  <a href="/" aria-label="Example home">Example</a>
  <nav aria-label="Primary navigation">
    <a href="/features">Features</a>
    <a href="/pricing">Pricing</a>
  </nav>
</header>
<main>
  <article>
    <h1>Manage shared work with fewer missed handoffs</h1>
    <section aria-labelledby="overview-title">
      <h2 id="overview-title">How it works</h2>
      <p>...</p>
    </section>
  </article>
</main>
<footer>
  <nav aria-label="Legal">
    <a href="/privacy">Privacy</a>
    <a href="/terms">Terms</a>
  </nav>
</footer>
```


### Working example: A disclosure with an explicit label

```html
<details>
  <summary>View technical limits</summary>
  <p>Each workspace can contain up to 50 active projects.</p>
  <p>Archived projects do not count toward the active limit.</p>
</details>
```


### Working example: Accessible comparison

```html
<table>
  <caption>Limits that affect plan selection</caption>
  <thead>
    <tr>
      <th scope="col">Requirement</th>
      <th scope="col">Starter</th>
      <th scope="col">Team</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Single sign-on</th>
      <td>Not included</td>
      <td>Included</td>
    </tr>
    <tr>
      <th scope="row">Audit log retention</th>
      <td>30 days</td>
      <td>365 days</td>
    </tr>
  </tbody>
</table>
```


### Working example: Task-based usability note

```text
Task: Find a plan that supports 12 users and single sign-on.
Observed: Participant compared seat limits first, then missed the SSO row.
Change: Move security requirements into the plan summary and retain the detailed table.
Follow-up: Test with a participant who evaluates plans primarily by security needs.
```


### Working example: Responsive hierarchy check

```text
Check at narrow viewport:
1. Page title appears before promotional material.
2. The main explanation precedes supporting media.
3. The primary action remains near the decision it advances.
4. Critical limitations remain visible.
5. No horizontal overflow hides comparison labels.
6. Focus order matches the visible reading sequence.
```


### Working example: Claim and evidence record

```text
Claim: Teams can identify overdue handoffs sooner.
Evidence: Five moderated sessions showed faster discovery of the overdue queue.
Limit: This is qualitative usability evidence, not a measured productivity claim.
Content decision: Say “find overdue handoffs more directly,” not “cuts delays by 40%.”
```


### Working example: Review ownership

```text
Content item: Billing terms
Owner: Product operations
Review trigger: Any pricing or renewal-policy change
Last verified: Record the actual review date in the project tracker
Risk if stale: Visitors may make a decision using incorrect cost information
```


### Working example: Before and after outline

```text
Before:
- Welcome
- Innovation
- Features
- Our story
- Why us
- More features
- Contact

After:
- H1: Schedule team handoffs without losing ownership
- H2: How the workflow works
- H2: Is it right for your team?
- H2: Compare plans and billing
- H2: See the workflow in practice
- H2: Set up your workspace
- H2: Technical details and support
```


### Implementation guardrails

- Keep the most important user question close to the beginning.
- Use content priority to decide placement before choosing component style.
- Prefer specific, descriptive headings over vague brand language.
- Use one clear primary action for a page's main task.
- Keep qualifications beside claims and conditions beside decisions.
- Preserve the semantic sequence when columns collapse.
- Do not hide essential content solely to make a screenshot cleaner.
- Use semantic elements for document structure and native controls where possible.
- Give tables captions and scoped headers when the data needs tabular comparison.
- Make links describe their destination or action.
- Test with keyboard navigation, browser zoom, and a narrow viewport.
- Remove duplicate sections rather than styling them differently.
- Add a contents list only when it genuinely helps navigation.
- Review high-impact claims when their underlying evidence changes.
- Record unresolved assumptions so they do not become invisible design decisions.
