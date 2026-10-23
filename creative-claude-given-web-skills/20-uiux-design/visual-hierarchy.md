# SKILL: visual-hierarchy
**Layer:** 43 — UI/UX Design
**Goal:** Build interfaces that guide attention in a deliberate order so users can understand the message, find the next action, and move through a page without visual guesswork.

---

## Why This Matters (Senior Perspective)

Visual hierarchy is the difference between a page that merely contains information and a page that communicates it. A visitor does not read a portfolio, SaaS landing page, or dashboard in the order its source code happens to appear. They scan for contrast, position, scale, grouping, and familiar patterns, then decide what deserves attention. If every heading is oversized, every card has a bright accent, every section has a shadow, and every button looks equally important, the interface has no hierarchy. The visitor must do the design work themselves. In production, that shows up as users overlooking the primary call to action, misunderstanding a pricing tier, missing a warning in a dashboard, or leaving a portfolio without seeing the strongest project.

Beginners often treat hierarchy as a collection of styling tricks: make the title bigger, color the button, add a gradient, and call it finished. Senior designers work backwards from the user's decision. They define the page's communication goal, identify the most important message and action, then allocate visual weight to each element. They test hierarchy in grayscale, at reduced size, on mobile, and with realistic content. They understand that a visually dominant element is not automatically the most useful element; prominence must match meaning. They also know that spacing, alignment, line length, and repetition can create hierarchy without adding more colors or decoration.

For creative developers and freelancers, this skill directly affects perceived quality and client outcomes. An award-caliber portfolio should make the developer's specialty, strongest case study, and contact path obvious within seconds. A client landing page should distinguish its value proposition from supporting proof, secondary links, and legal details. An AI product should make the answer, confidence or limitation, and next safe action understandable without making every panel compete. If the hierarchy is wrong, polished animation can amplify the confusion rather than fix it. Use hierarchy as a system: establish roles, apply consistent tokens, check real content, and validate the result with people who did not build it.

---

## Core Concepts

### 1. Hierarchy Starts With a User Decision

Visual hierarchy is an ordering of attention, not a ranking of font sizes. Before styling, state what a person should notice first, understand second, and do third. This sequence differs by page: a portfolio may lead with specialty and proof; a checkout may lead with order total and confirmation; a dashboard may lead with a critical change or exception.

```html
<main class="portfolio-hero">
  <p class="eyebrow">Independent creative developer</p>
  <h1>Digital experiences built to feel effortless.</h1>
  <p class="hero-summary">
    Strategy, interaction design, and frontends for ambitious teams.
  </p>
  <a class="primary-action" href="#selected-work">Explore selected work</a>
</main>
```

```css
.portfolio-hero {
  max-width: 68rem;
  margin-inline: auto;
  padding: clamp(4rem, 10vw, 9rem) 1.5rem;
}

.portfolio-hero .eyebrow {
  margin: 0 0 1rem;
  color: #526173;
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.portfolio-hero h1 {
  max-width: 12ch;
  margin: 0;
  color: #142033;
  font-size: clamp(2.8rem, 7vw, 6rem);
  line-height: 0.98;
  letter-spacing: -0.055em;
}

.hero-summary {
  max-width: 42rem;
  margin-block: 1.5rem 2rem;
  color: #526173;
  font-size: clamp(1.05rem, 1.7vw, 1.25rem);
  line-height: 1.65;
}

.primary-action {
  display: inline-flex;
  align-items: center;
  min-height: 3rem;
  padding: 0.85rem 1.2rem;
  border-radius: 999px;
  background: #173f70;
  color: #fff;
  font-weight: 700;
  text-decoration: none;
}

.primary-action:focus-visible {
  outline: 3px solid #f2a900;
  outline-offset: 4px;
}
```

The markup puts the headline before the supporting copy and the action. The CSS reinforces the intended order through scale, width, contrast, and spacing. The action is prominent but does not overpower the actual promise.

**Naive approach:** Make the headline, paragraph, badges, navigation, and every CTA bold and bright because each feels important.

**Correct approach:** Pick one dominant message, one supporting explanation, and one primary action for the first viewport. Let other content earn lower prominence.

**Gotcha:** A large headline can become the wrong first impression if its claim is vague. Visual prominence magnifies meaning; it cannot repair unclear copy.

### 2. Visual Weight Is a Budget

Visual weight is the amount of attention an element attracts. Size, contrast, saturation, density, position, shape, and whitespace all contribute. Think of attention as a limited budget: if five elements demand the same level of attention, the user receives no useful ranking.

```html
<section class="feature-section" aria-labelledby="feature-title">
  <header class="section-heading">
    <p class="eyebrow">What we do</p>
    <h2 id="feature-title">One clear system, from idea to launch.</h2>
  </header>
  <ul class="feature-list">
    <li><strong>Strategy</strong><span>Choose the right problem to solve.</span></li>
    <li><strong>Design</strong><span>Make the value obvious and usable.</span></li>
    <li><strong>Engineering</strong><span>Ship a reliable, responsive experience.</span></li>
  </ul>
</section>
```

```css
.feature-section {
  padding: 5rem 1.5rem;
  background: #f7f8fa;
}

.section-heading {
  max-width: 44rem;
  margin-bottom: 2.5rem;
}

.section-heading h2 {
  margin: 0;
  color: #142033;
  font-size: clamp(2rem, 4vw, 3.5rem);
  line-height: 1.08;
}

.feature-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.5rem;
  padding: 0;
  list-style: none;
}

.feature-list li {
  display: grid;
  align-content: start;
  gap: 0.6rem;
  padding-top: 1.25rem;
  border-top: 2px solid #d6dde6;
}

.feature-list strong {
  color: #173f70;
  font-size: 1.1rem;
}

.feature-list span {
  color: #526173;
  line-height: 1.6;
}

@media (max-width: 42rem) {
  .feature-list {
    grid-template-columns: 1fr;
  }
}
```

**Naive approach:** Give every feature card a saturated background, large icon, shadow, border, and oversized heading.

**Correct approach:** Reserve the strongest contrast for the page's primary message or action. Use quieter repeated styling for supporting information.

**Gotcha:** Equal visual weight is sometimes correct—for example, a set of equivalent payment methods. Do not force a primary/secondary ranking where the product decision is genuinely neutral.

### 3. Scale Creates a First Read

Scale is one of the fastest ways to establish hierarchy, but scale must be relational. A headline's size matters in relation to its surrounding copy, not in isolation. A predictable type scale makes hierarchy repeatable across pages and responsive widths.

```css
:root {
  --type-display: clamp(2.75rem, 7vw, 5.75rem);
  --type-heading: clamp(1.75rem, 3.5vw, 3rem);
  --type-subheading: 1.375rem;
  --type-body: 1rem;
  --type-caption: 0.8125rem;
}

.page-title {
  font-size: var(--type-display);
  line-height: 0.98;
  letter-spacing: -0.05em;
}

.section-title {
  font-size: var(--type-heading);
  line-height: 1.1;
  letter-spacing: -0.035em;
}

.card-title {
  font-size: var(--type-subheading);
  line-height: 1.25;
}

.body-copy {
  font-size: var(--type-body);
  line-height: 1.65;
}

.metadata {
  font-size: var(--type-caption);
  line-height: 1.4;
}
```

Use a small number of named roles rather than choosing a fresh size for each component. A role communicates intent: `section-title` is more meaningful than `font-size: 37px`.

**Naive approach:** Set every heading to a custom pixel size until the page looks acceptable at one viewport.

**Correct approach:** Define a small responsive scale, map components to roles, then tune only where content or hierarchy justifies a deliberate exception.

**Gotcha:** `clamp()` prevents runaway sizing but does not guarantee good line breaks. Check the actual title length at narrow and wide viewports.

### 4. Contrast Is More Than Color

Contrast can come from lightness, size, weight, spacing, shape, texture, or position. A primary action can stand out because it is filled while secondary actions are text links. This is often more coherent than making every element a different color.

```html
<nav class="project-navigation" aria-label="Project navigation">
  <a class="nav-brand" href="/">Studio North</a>
  <div class="nav-actions">
    <a class="nav-secondary" href="#work">Work</a>
    <a class="nav-secondary" href="#about">About</a>
    <a class="nav-primary" href="#contact">Start a project</a>
  </div>
</nav>
```

```css
.project-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}

.nav-brand {
  color: #142033;
  font-size: 1.125rem;
  font-weight: 800;
  text-decoration: none;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.nav-secondary {
  color: #344256;
  text-decoration: none;
}

.nav-primary {
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  background: #173f70;
  color: white;
  font-weight: 700;
  text-decoration: none;
}

.nav-secondary:focus-visible,
.nav-primary:focus-visible,
.nav-brand:focus-visible {
  outline: 3px solid #f2a900;
  outline-offset: 4px;
}
```

**Naive approach:** Use a different accent color for every navigation item.

**Correct approach:** Create contrast through a consistent role system: brand, secondary navigation, and primary action.

**Gotcha:** A color difference alone may not communicate a state to users with color-vision differences. Pair color with labels, shape, weight, or another visible cue.

### 5. Position and Reading Paths

People do not follow one universal scan pattern. Layout, language, device, familiarity, and task affect where attention goes. Use position to support the expected task, but verify it with real content rather than relying on claims such as “everyone scans in an F-pattern.”

```html
<main class="case-study">
  <header class="case-study-header">
    <p class="case-study-category">AI product · 2026</p>
    <h1>Making complex recommendations easier to trust.</h1>
    <p class="case-study-intro">A case study in decision support, clarity, and usable data.</p>
  </header>
  <figure class="case-study-visual">
    <img src="/images/recommendation-dashboard.webp"
         alt="Recommendation dashboard with ranked options and comparison details">
    <figcaption>The ranking is visible before the detailed comparison.</figcaption>
  </figure>
  <section class="case-study-outcome" aria-labelledby="outcome-title">
    <h2 id="outcome-title">The outcome</h2>
    <p>Users can compare the leading option before exploring supporting details.</p>
  </section>
</main>
```

```css
.case-study {
  max-width: 72rem;
  margin-inline: auto;
  padding: clamp(2rem, 6vw, 5rem) 1.25rem;
}

.case-study-header {
  max-width: 52rem;
  margin-bottom: clamp(2rem, 5vw, 4rem);
}

.case-study-header h1 {
  max-width: 16ch;
  margin-block: 0.75rem 1rem;
  font-size: clamp(2.5rem, 6vw, 5rem);
  line-height: 1;
}

.case-study-visual {
  margin: 0;
}

.case-study-visual img {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: 1.25rem;
}

.case-study-visual figcaption {
  margin-top: 0.75rem;
  color: #526173;
  font-size: 0.875rem;
}
```

**Naive approach:** Place the most impressive visual first even when it does not explain what the case study is about.

**Correct approach:** Align the reading path with the user's questions: what is this, why should I care, what proves it, and what can I do next?

**Gotcha:** On mobile, a multi-column desktop order may collapse into an unintuitive sequence. Check DOM order and keyboard order, not only the desktop screenshot.

### 6. Whitespace Separates Meaning

Whitespace is active structure. Space around a heading can signal that it begins a new section; tighter spacing between a label and its value signals that they belong together. Consistent spacing helps users infer relationships before reading every word.

```css
:root {
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;
}

.project-card {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-6);
}

.project-card h3 {
  margin: 0;
}

.project-card p {
  margin: 0;
  line-height: 1.6;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-8);
}

.project-section {
  padding-block: var(--space-16);
}
```

**Naive approach:** Add arbitrary margins to individual elements until the composition seems balanced.

**Correct approach:** Use a spacing scale and define relationships: small gaps within a component, medium gaps between related components, and large gaps between sections.

**Gotcha:** Too much whitespace can disconnect a label from its content or push an important action below the fold. Whitespace should clarify grouping, not simply make the page feel expensive.

### 7. Grouping and Gestalt Relationships

Proximity, similarity, continuity, and common region help users understand which things belong together. A pricing price and its billing interval should feel like one unit; a form label should sit closer to its input than to the next field's label. These relationships reduce the amount of interpretation users must perform.

```html
<form class="contact-form" action="/contact" method="post">
  <fieldset class="form-group">
    <legend>Tell us about your project</legend>
    <label class="form-field">
      <span>Your work email</span>
      <input type="email" name="email" autocomplete="email" required>
    </label>
    <label class="form-field">
      <span>What do you want to build?</span>
      <textarea name="project" rows="4" required></textarea>
    </label>
  </fieldset>
  <button class="form-submit" type="submit">Send project details</button>
</form>
```

```css
.contact-form {
  max-width: 42rem;
}

.form-group {
  display: grid;
  gap: 1.25rem;
  padding: 1.5rem;
  border: 1px solid #d6dde6;
  border-radius: 1rem;
}

.form-group legend {
  padding-inline: 0.5rem;
  font-weight: 800;
}

.form-field {
  display: grid;
  gap: 0.5rem;
  color: #243247;
  font-weight: 650;
}

.form-field input,
.form-field textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 0.8rem;
  border: 1px solid #9aa8b8;
  border-radius: 0.5rem;
  color: #142033;
  font: inherit;
}

.form-field input:focus-visible,
.form-field textarea:focus-visible,
.form-submit:focus-visible {
  outline: 3px solid #f2a900;
  outline-offset: 3px;
}
```

**Naive approach:** Put all fields in one long list with identical gaps and no grouping.

**Correct approach:** Use labels, fieldsets, legends, proximity, and common-region styling to show the form's structure.

**Gotcha:** Visual grouping must not replace semantic grouping. A border around a group does not provide the programmatic relationship that `fieldset` and `legend` provide.

### 8. Repetition Creates a Stable System

Repeated visual patterns teach users how to interpret the interface. If every project card uses the same title position, metadata style, and interaction affordance, users can scan the portfolio quickly. Repetition is not sameness for its own sake; it reduces the effort needed to learn the interface.

```html
<section class="selected-work" aria-labelledby="selected-work-title">
  <h2 id="selected-work-title">Selected work</h2>
  <div class="work-grid">
    <article class="work-card">
      <p class="work-type">AI / Data</p>
      <h3><a href="/work/medpay">Making health-plan comparisons clearer</a></h3>
      <p>Decision support with ranked recommendations and transparent details.</p>
    </article>
    <article class="work-card">
      <p class="work-type">Commerce</p>
      <h3><a href="/work/inventory">Helping teams see inventory risk sooner</a></h3>
      <p>A dashboard concept focused on exceptions and next actions.</p>
    </article>
  </div>
</section>
```

```css
.work-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem;
}

.work-card {
  padding: 1.5rem;
  border: 1px solid #d6dde6;
  border-radius: 1rem;
  background: white;
}

.work-type {
  margin: 0 0 0.75rem;
  color: #526173;
  font-size: 0.8rem;
  font-weight: 750;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.work-card h3 {
  margin: 0;
  font-size: 1.35rem;
  line-height: 1.25;
}

.work-card a {
  color: #142033;
  text-decoration-thickness: 0.08em;
  text-underline-offset: 0.15em;
}

.work-card p:last-child {
  color: #526173;
  line-height: 1.6;
}

@media (max-width: 44rem) {
  .work-grid {
    grid-template-columns: 1fr;
  }
}
```

**Naive approach:** Give each card a different layout because each one should feel unique.

**Correct approach:** Keep the structure stable and express individuality through the image, title, content, or a restrained accent.

**Gotcha:** Repetition can become misleading if unlike controls look identical. Keep equivalent items visually consistent, but distinguish actions, statuses, and navigation roles clearly.

### 9. Responsive Hierarchy Is Recomposition

A responsive design should preserve meaning, not merely shrink desktop styling. On a small screen, a secondary sidebar may move below the main content; a row of equal cards may become a vertical list; metadata may wrap or move into a disclosure. The important question is whether the intended first read survives.

```css
.case-study-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(15rem, 0.8fr);
  gap: clamp(1.5rem, 4vw, 4rem);
  align-items: start;
}

.case-study-main {
  min-width: 0;
}

.case-study-sidebar {
  position: sticky;
  top: 1.5rem;
  padding: 1.25rem;
  border-radius: 0.875rem;
  background: #f1f4f7;
}

@media (max-width: 48rem) {
  .case-study-layout {
    grid-template-columns: 1fr;
  }

  .case-study-sidebar {
    position: static;
    order: 2;
  }
}
```

**Naive approach:** Keep every desktop column and reduce its width until the content becomes cramped.

**Correct approach:** Decide which content supports the primary task, then change the layout at a breakpoint when the hierarchy needs a new arrangement.

**Gotcha:** CSS `order` changes visual order but not DOM or keyboard order. Prefer a semantic source order that remains understandable when styles are removed or when a screen reader follows the document.

### 10. Accessibility Is Part of Hierarchy

A hierarchy that only works for a sighted mouse user is incomplete. Heading levels expose document structure, focus styles show keyboard position, link text explains destinations, and contrast keeps text legible. Accessibility is not a separate polish pass; it is another way the interface communicates priority and relationships.

```html
<main>
  <header>
    <h1>Project dashboard</h1>
    <p>Review the status of active work.</p>
  </header>
  <section aria-labelledby="attention-title">
    <h2 id="attention-title">Needs attention</h2>
    <ul>
      <li>
        <article class="status-item">
          <h3>Insurance comparison data is stale</h3>
          <p>Last updated 9 days ago. Refresh before sharing recommendations.</p>
          <a href="/data/refresh">Review data freshness</a>
        </article>
      </li>
    </ul>
  </section>
</main>
```

```css
.status-item {
  padding: 1rem;
  border-inline-start: 0.25rem solid #a0441b;
  background: #fff7f2;
}

.status-item h3 {
  margin: 0 0 0.5rem;
  color: #63240d;
}

.status-item p {
  margin: 0 0 0.75rem;
  color: #3d2a24;
  line-height: 1.55;
}

.status-item a {
  color: #63240d;
  font-weight: 750;
}

a:focus-visible,
button:focus-visible,
input:focus-visible {
  outline: 3px solid #174ea6;
  outline-offset: 3px;
}
```

**Naive approach:** Use only a red border to signal a problem and assume everyone will notice it.

**Correct approach:** Combine a meaningful heading, explicit status wording, sufficient contrast, and a clear action. Use semantic headings and keyboard-visible focus.

**Gotcha:** Heading levels are not chosen for their default font size. Use a logical heading structure and style the levels separately.

### 11. Hierarchy Under Dense or Changing Content

Dashboards, search results, and AI interfaces have content that varies in length and urgency. A design that looks balanced with sample data may collapse when a label wraps, a result is missing, or a warning appears. Establish roles for summary, detail, status, and action; then test long strings, empty states, and high-volume cases.

```html
<section class="insight-panel" aria-labelledby="insight-title">
  <header class="insight-header">
    <div>
      <p class="eyebrow">Recommendation summary</p>
      <h2 id="insight-title">Suggested plan</h2>
    </div>
    <span class="status-pill">Needs review</span>
  </header>
  <p class="insight-summary">
    This option fits the stated budget, but one exclusion needs confirmation.
  </p>
  <details class="insight-details">
    <summary>Why this option was ranked first</summary>
    <p>The ranking weighs premium, coverage needs, and known exclusions.</p>
  </details>
  <a class="insight-action" href="/plans/compare">Compare plan details</a>
</section>
```

```css
.insight-panel {
  min-width: 0;
  padding: clamp(1rem, 3vw, 1.75rem);
  border: 1px solid #d6dde6;
  border-radius: 1rem;
  background: white;
}

.insight-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem;
}

.insight-header h2 {
  margin: 0;
  overflow-wrap: anywhere;
}

.status-pill {
  flex: 0 0 auto;
  padding: 0.35rem 0.6rem;
  border-radius: 999px;
  background: #fff0c2;
  color: #543b00;
  font-size: 0.8rem;
  font-weight: 750;
}

.insight-summary {
  max-width: 62ch;
  line-height: 1.65;
}

.insight-details {
  margin-block: 1rem;
  padding-block: 1rem;
  border-block: 1px solid #e1e6ec;
}

.insight-details summary {
  cursor: pointer;
  font-weight: 700;
}

.insight-action {
  display: inline-flex;
  margin-top: 0.5rem;
  font-weight: 750;
}
```

**Naive approach:** Design around one ideal sentence and hide overflow when real content is longer.

**Correct approach:** Use flexible sizing, `min-width: 0`, deliberate wrapping, and explicit patterns for warnings, empty states, and expandable detail.

**Gotcha:** `overflow-wrap: anywhere` is useful for long identifiers but can make normal prose look ragged. Apply it where unpredictable tokens are expected, not indiscriminately to all text.

### 12. Validate Hierarchy With a Repeatable Audit

A design review should be more specific than “does this look good?” Audit the intended first read, the primary action, contrast, grouping, mobile behavior, and whether content remains understandable without color. Use screenshots at realistic sizes and inspect the live page in DevTools.

```js
const hierarchyAudit = {
  pageTitle: document.querySelector("main h1"),
  primaryAction: document.querySelector("main .primary-action"),
  mainLandmark: document.querySelector("main")
};

const auditResults = Object.entries(hierarchyAudit).map(([role, element]) => ({
  role,
  found: Boolean(element),
  text: element?.textContent.trim() ?? "Missing",
  visible: element
    ? element.getBoundingClientRect().width > 0 &&
      element.getBoundingClientRect().height > 0
    : false
}));

console.table(auditResults);
```

The script is a small structural check, not an automated judge of visual quality. Use it to catch missing landmarks or an absent primary action, then manually review screenshots, keyboard behavior, contrast, and content order.

**Naive approach:** Judge the page only on the developer's large monitor and from memory.

**Correct approach:** Capture desktop and mobile states, inspect computed styles, test keyboard navigation, and ask a person unfamiliar with the page what they noticed first and what they would do next.

**Gotcha:** A DOM audit cannot measure perceived prominence or guarantee WCAG contrast compliance. It helps find structural defects; it does not replace human review and accessibility testing.

### 13. Real-World Integration: A Portfolio Case-Study Landing Page

Combine message order, scale, contrast, grouping, and responsive composition. The page should communicate the project problem, show credible evidence, and provide a clear next step without making every element a hero.

```html
<main class="case-page">
  <header class="case-intro">
    <p class="eyebrow">Case study · AI / Health technology</p>
    <h1>Helping people compare health plans with more confidence.</h1>
    <p class="case-lede">
      A decision-support experience that brings ranked recommendations,
      coverage details, and trade-offs into one clear flow.
    </p>
    <a class="primary-action" href="#project-outcome">See the outcome</a>
  </header>

  <figure class="case-preview">
    <img src="/images/medpay-case-preview.webp"
         alt="Health plan comparison interface showing ranked options and coverage details">
    <figcaption>Ranked options remain visible while details are compared.</figcaption>
  </figure>

  <section class="case-facts" aria-label="Project facts">
    <article><h2>Role</h2><p>Product design and frontend implementation</p></article>
    <article><h2>Focus</h2><p>Comparison clarity and decision support</p></article>
    <article><h2>Constraint</h2><p>Dense policy details must remain scannable</p></article>
  </section>

  <section id="project-outcome" class="case-outcome">
    <p class="eyebrow">Outcome</p>
    <h2>Put the decision first. Keep the evidence close.</h2>
    <p>Users see the recommendation, its main trade-off, and a route to inspect details.</p>
  </section>
</main>
```

```css
.case-page {
  --ink: #142033;
  --muted: #526173;
  --accent: #173f70;
  --surface: #f4f6f8;
  max-width: 76rem;
  margin-inline: auto;
  padding: clamp(1.25rem, 4vw, 3rem);
  color: var(--ink);
}

.case-intro {
  max-width: 58rem;
  padding-block: clamp(3rem, 8vw, 7rem);
}

.eyebrow {
  margin: 0 0 1rem;
  color: var(--muted);
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.case-intro h1 {
  max-width: 14ch;
  margin: 0;
  font-size: clamp(2.7rem, 7vw, 6rem);
  line-height: 0.98;
  letter-spacing: -0.055em;
}

.case-lede {
  max-width: 44rem;
  margin-block: 1.5rem 2rem;
  color: var(--muted);
  font-size: clamp(1.05rem, 1.8vw, 1.3rem);
  line-height: 1.65;
}

.case-preview {
  margin: 0;
}

.case-preview img {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: 1.25rem;
  background: var(--surface);
}

.case-preview figcaption {
  margin-top: 0.75rem;
  color: var(--muted);
  font-size: 0.875rem;
}

.case-facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.5rem;
  margin-block: clamp(3rem, 7vw, 6rem);
}

.case-facts article {
  padding-top: 1rem;
  border-top: 2px solid #cbd4df;
}

.case-facts h2 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}

.case-facts p {
  margin: 0;
  color: var(--muted);
  line-height: 1.6;
}

.case-outcome {
  max-width: 48rem;
  padding: clamp(2rem, 5vw, 4rem);
  border-radius: 1.25rem;
  background: var(--surface);
}

.case-outcome h2 {
  margin: 0;
  font-size: clamp(1.8rem, 4vw, 3rem);
  line-height: 1.1;
}

.case-outcome p:last-child {
  max-width: 60ch;
  line-height: 1.7;
}

.primary-action {
  display: inline-flex;
  align-items: center;
  min-height: 3rem;
  padding: 0.85rem 1.2rem;
  border-radius: 999px;
  background: var(--accent);
  color: #fff;
  font-weight: 750;
  text-decoration: none;
}

.primary-action:focus-visible {
  outline: 3px solid #f2a900;
  outline-offset: 4px;
}

@media (max-width: 44rem) {
  .case-facts {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .case-page *,
  .case-page *::before,
  .case-page *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Naive approach:** Add animation, gradient, glass effects, and decorative cards before deciding what the case study should communicate.

**Correct approach:** Make the reading order work in plain HTML first. Then add motion and visual effects only when they reinforce the same hierarchy.

**Gotcha:** The sample image path is a project asset path and must exist in the actual site. If the asset is absent, replace it with a real image and preserve useful alternative text.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: One Primary Action Per Decision Area

**What it does:** Establishes a clear next step while leaving secondary routes available without equal visual weight.

**When to use it:** Use it in a landing-page hero, a project inquiry section, or a result panel where the user should take one main action.

```html
<section class="decision-panel" aria-labelledby="decision-title">
  <h2 id="decision-title">Ready to discuss your project?</h2>
  <p>Share the problem, timeline, and what success should look like.</p>
  <a class="decision-primary" href="/contact">Start a conversation</a>
  <a class="decision-secondary" href="/work">Review selected work first</a>
</section>
```

```css
.decision-panel {
  display: grid;
  justify-items: start;
  gap: 0.9rem;
  max-width: 42rem;
}

.decision-panel h2,
.decision-panel p {
  margin: 0;
}

.decision-primary {
  padding: 0.85rem 1.15rem;
  border-radius: 0.6rem;
  background: #173f70;
  color: white;
  font-weight: 750;
  text-decoration: none;
}

.decision-secondary {
  color: #173f70;
  text-underline-offset: 0.2em;
}

.decision-primary:focus-visible,
.decision-secondary:focus-visible {
  outline: 3px solid #f2a900;
  outline-offset: 4px;
}
```

Keep the secondary link easy to find, but do not style it like another primary button unless both actions are equally important. Avoid repeating the same primary CTA after every short paragraph; repetition can become noise.

### Pattern 2: Eyebrow → Headline → Supporting Copy

**What it does:** Creates a predictable reading sequence from category to main promise to explanation.

**When to use it:** Use it for portfolio project intros, product landing sections, service pages, and editorial feature blocks.

```html
<header class="story-heading">
  <p class="story-eyebrow">Product design · AI systems</p>
  <h2>Make complex information easier to act on.</h2>
  <p class="story-support">Turn model outputs into a clear answer, visible evidence, and a useful next step.</p>
</header>
```

```css
.story-heading {
  max-width: 50rem;
}

.story-eyebrow {
  margin: 0 0 0.8rem;
  color: #526173;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.story-heading h2 {
  max-width: 15ch;
  margin: 0;
  font-size: clamp(2rem, 4.5vw, 4rem);
  line-height: 1.03;
  letter-spacing: -0.04em;
}

.story-support {
  max-width: 42rem;
  margin: 1.25rem 0 0;
  color: #526173;
  font-size: 1.125rem;
  line-height: 1.65;
}
```

Use a concise eyebrow; it should orient, not become a second headline. If the category adds no useful context, remove it.

### Pattern 3: Summary First, Detail on Demand

**What it does:** Shows the decision-critical summary before secondary explanation.

**When to use it:** Use it in dashboards, AI recommendation panels, analytics cards, and dense case-study results.

```html
<article class="result-card">
  <p class="result-label">Top recommendation</p>
  <h3>Plan A</h3>
  <p class="result-summary">Best match for the stated monthly budget.</p>
  <details>
    <summary>Review trade-offs</summary>
    <p>One exclusion requires confirmation before the plan is selected.</p>
  </details>
</article>
```

```css
.result-card {
  padding: 1.5rem;
  border: 1px solid #d6dde6;
  border-radius: 1rem;
}

.result-label {
  margin: 0 0 0.5rem;
  color: #526173;
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
}

.result-card h3 {
  margin: 0;
  font-size: 1.75rem;
}

.result-summary {
  line-height: 1.6;
}

.result-card details {
  padding-top: 1rem;
  border-top: 1px solid #e1e6ec;
}

.result-card summary {
  cursor: pointer;
  font-weight: 750;
}
```

Do not hide information that users need to make a safe decision. Progressive disclosure is for secondary detail, not for concealing limitations, costs, uncertainty, or critical warnings.

### Pattern 4: Status With More Than Color

**What it does:** Communicates urgency through wording, shape, and color so the state remains understandable without color perception.

**When to use it:** Use it for data freshness, payment state, form errors, task status, or AI output that requires human review.

```html
<p class="status-message" role="status">
  <span class="status-dot" aria-hidden="true"></span>
  <strong>Needs review:</strong> one coverage exclusion is unresolved.
</p>
```

```css
.status-message {
  display: flex;
  align-items: start;
  gap: 0.65rem;
  padding: 0.9rem 1rem;
  border-radius: 0.65rem;
  background: #fff3d6;
  color: #4b3500;
  line-height: 1.5;
}

.status-dot {
  flex: 0 0 0.65rem;
  width: 0.65rem;
  height: 0.65rem;
  margin-top: 0.35rem;
  border-radius: 50%;
  background: #8b5e00;
}
```

A status should state what happened and what to do, not merely show a colored dot. Use an appropriate live-region role only when the message's timing and behavior justify it; don't make every static label announce itself.

### Pattern 5: Consistent Card Anatomy

**What it does:** Makes a repeated set of projects or features scannable through stable placement of category, title, description, and action.

**When to use it:** Use it when a portfolio or services page contains at least three comparable items.

```html
<article class="service-card">
  <p class="service-category">Frontend engineering</p>
  <h3>Interfaces that feel intentional.</h3>
  <p>Responsive UI, thoughtful states, and motion that supports the task.</p>
  <a href="/services/frontend">Explore frontend work</a>
</article>
```

```css
.service-card {
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  gap: 0.85rem;
  padding: 1.5rem;
  border: 1px solid #d6dde6;
  border-radius: 1rem;
  background: #fff;
}

.service-card p,
.service-card h3 {
  margin: 0;
}

.service-category {
  color: #526173;
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.service-card h3 {
  font-size: 1.4rem;
  line-height: 1.2;
}

.service-card p:not(.service-category) {
  color: #526173;
  line-height: 1.6;
}

.service-card a {
  justify-self: start;
  color: #173f70;
  font-weight: 750;
}
```

Use stable anatomy but allow card height and copy to adapt. Avoid fixed heights that clip longer descriptions or leave large dead areas when content varies substantially.

### Pattern 6: Mobile-First Priority Stack

**What it does:** Converts a desktop composition into a deliberate mobile reading order.

**When to use it:** Use it when a two-column hero or case study includes a main message and a secondary visual, metadata panel, or navigation rail.

```html
<section class="priority-layout">
  <div class="priority-copy">
    <p class="eyebrow">Selected project</p>
    <h2>Show the value before the detail.</h2>
    <p>Lead with the outcome, then let the interface preview support the claim.</p>
  </div>
  <figure class="priority-preview">
    <img src="/images/project-preview.webp" alt="Preview of the project interface">
  </figure>
</section>
```

```css
.priority-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: clamp(1.5rem, 5vw, 4rem);
  align-items: center;
}

.priority-copy,
.priority-preview {
  min-width: 0;
}

.priority-preview {
  margin: 0;
}

.priority-preview img {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 1rem;
}

@media (max-width: 46rem) {
  .priority-layout {
    grid-template-columns: 1fr;
  }
}
```

This works because the DOM order already puts the message first. If the visual should lead for a particular project, change the semantic order intentionally rather than relying on CSS ordering as a patch.

### Pattern 7: Hierarchy Audit in the Browser

**What it does:** Gives a repeatable review sequence for spotting missing or invisible primary elements before visual QA.

**When to use it:** Use it before a client review, after a redesign, or when a responsive breakpoint seems to hide the intended action.

```js
function inspectPrimaryHierarchy() {
  const selectors = [
    ["main landmark", "main"],
    ["page heading", "main h1"],
    ["primary action", "main .primary-action"]
  ];

  const report = selectors.map(([role, selector]) => {
    const element = document.querySelector(selector);

    if (!element) {
      return { role, selector, status: "missing", text: "" };
    }

    const bounds = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    const isVisible = bounds.width > 0 &&
      bounds.height > 0 &&
      style.visibility !== "hidden" &&
      style.display !== "none";

    return {
      role,
      selector,
      status: isVisible ? "present and visible" : "present but hidden",
      text: element.textContent.trim().replace(/\s+/g, " ").slice(0, 90)
    };
  });

  console.table(report);
  return report;
}

inspectPrimaryHierarchy();
```

Run this in DevTools on the page you are reviewing. Then inspect computed font size, color, spacing, and bounding boxes manually; code can check presence and visibility but cannot decide whether the page's message is actually the most prominent thing.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---------|----------------|-----|
| Making every heading huge | The designer confuses emphasis with importance | Assign `h1`, `h2`, and card-title roles from a type scale |
| Giving every CTA the accent fill | Each section is designed in isolation | Reserve filled treatment for the main action in each decision area |
| Using color as the only status signal | Color is fast to apply and looks clear in a screenshot | Add explicit status wording and a second visual cue |
| Adding decorative badges to every card | Labels feel like easy ways to make cards look designed | Keep badges only when they add useful classification or state |
| Placing a giant image before the page message | Visual impact is prioritized over context | Pair the image with a clear title or put the message first |
| Using arbitrary margin values everywhere | Local tweaks hide missing spacing rules | Define spacing tokens and map gaps to relationships |
| Making all cards visually identical in importance | Component reuse is mistaken for equal priority | Give the featured item a meaningful reason to lead, or keep all peers equal |
| Relying on a desktop scan pattern as a universal rule | Popular UX summaries are treated as laws | Test first-read comprehension with target users and real content |
| Shrinking the desktop layout instead of recomposing it | Responsive work is treated as scaling, not redesign | Change grid structure and content order at task-relevant breakpoints |
| Using CSS `order` to repair poor markup | Visual order is optimized without checking reading order | Make the DOM order meaningful, then use CSS for layout |
| Using heading tags only for their default size | Semantic structure and visual style are conflated | Keep heading levels logical and style each level with CSS |
| Hiding caveats in collapsed details | The summary is optimized to look clean | Keep decision-critical limitations visible before the action |
| Setting fixed card heights for alignment | Equal height is mistaken for a requirement | Use grid alignment and flexible content; test long copy |
| Ignoring focus states because the page is mouse-tested | Keyboard behavior is checked too late | Add and test `:focus-visible` styles on links and controls |
| Trusting a mockup with short placeholder copy | Idealized text hides wrapping and density problems | Test long names, multi-line titles, missing data, and errors |
| Using low-contrast muted text for all secondary information | “Subtle” is mistaken for “barely readable” | Check text contrast and raise color lightness contrast as needed |
| Treating animation as a substitute for priority | Motion attracts attention and masks unclear structure | Make the static hierarchy work before adding transitions |
| Allowing a decorative illustration to compete with the CTA | Both use the strongest color and scale | Reduce the illustration's contrast or move it away from the primary action |

**Before → After example**

Naive styling makes all controls equally loud:

```css
.hero a,
.hero button,
.hero .badge {
  padding: 1rem 1.25rem;
  background: #173f70;
  color: #fff;
  font-weight: 800;
}
```

Role-based styling separates actions from metadata:

```css
.hero .primary-action {
  padding: 0.9rem 1.2rem;
  border-radius: 999px;
  background: #173f70;
  color: #fff;
  font-weight: 750;
}

.hero .secondary-action {
  color: #173f70;
  font-weight: 700;
  text-underline-offset: 0.2em;
}

.hero .badge {
  padding: 0.3rem 0.55rem;
  border-radius: 0.35rem;
  background: #e9eef4;
  color: #344256;
  font-size: 0.8rem;
}
```

The fix is not “make fewer things pretty.” It is to give each element a visual role and keep the role consistent.

---

## Mental Models

1. **Attention is a budget** — every loud element spends some of the user's limited attention; spend it on meaning.
2. **Prominence creates a promise** — if an element is visually dominant, users assume it is the most important thing to understand or do.
3. **Group by relationship** — items that belong together should be closer or share a visual region; unrelated items need a clearer boundary.
4. **Structure before decoration** — the page should make sense in plain HTML before effects, gradients, or motion are added.
5. **Responsive means re-prioritize** — small screens require a new composition, not a compressed desktop screenshot.
6. **Consistency teaches the interface** — repeated patterns let people spend less effort learning and more effort completing the task.
7. **Test the first read** — ask someone unfamiliar with the page what they noticed first, what the page offers, and what they would do next.

---

## Quick Reference

| Property/Situation | Value/Answer | Notes |
|---|---|---|
| First viewport | One primary message and one main action | Supporting proof can follow |
| Page title | Usually the strongest text role | Keep a readable line length |
| Heading width | Often around 10–16 characters per line for display text | Tune to actual wording and font |
| Body copy line length | Roughly 45–75 characters | Longer lines can slow reading |
| Primary action | Strongest action treatment in its local decision area | Do not make every link primary |
| Secondary action | Text link, outline, or quieter treatment | Preserve visible affordance |
| Spacing within a component | Small token steps | Helps show internal relationships |
| Spacing between components | Medium token steps | Separates related blocks |
| Spacing between sections | Larger token steps | Creates a new chapter in the page |
| Similar repeated items | Shared anatomy and type roles | Helps rapid scanning |
| Featured item | Stronger only when it is genuinely more important | Do not fake priority |
| Status | Color plus wording or shape | Never color alone |
| Error state | Clear description plus actionable recovery | Place near the affected field or task |
| Mobile breakpoint | Trigger when the current composition becomes cramped | Do not choose breakpoints only by device labels |
| Focus indicator | Visible `:focus-visible` outline | Test keyboard navigation |
| Semantic headings | Logical nested levels | Do not skip levels for visual size |
| Long identifiers | `overflow-wrap: anywhere` where appropriate | Avoid applying blindly to prose |
| Flexible grid columns | `minmax(0, 1fr)` | Helps prevent grid children from forcing overflow |
| Images | Explicit aspect ratio and suitable `object-fit` | Match visual crop to content purpose |
| Dense detail | Summary first, secondary detail expandable | Keep critical caveats visible |
| Visual audit | Desktop, mobile, keyboard, grayscale, real copy | Screenshots alone are not enough |
| Contrast | Check text and interactive states against WCAG guidance | Small and thin text need special care |
| Animation | Add after static hierarchy works | Respect `prefers-reduced-motion` |
| Debugging | Inspect computed styles and element bounds in DevTools | Check what actually renders |
| Final QA | First-read test plus action test | Ask what people noticed and what they would do |

---

## Build Challenge

### Build: The 5-Second Portfolio Case Study

Create a responsive case-study intro for a fictional AI product that helps people compare complex options. The goal is not to decorate the page; it is to make the project purpose, strongest evidence, and next action understandable quickly.

1. Create a semantic `main` landmark with one clear `h1`.
2. Add an eyebrow that gives useful context without repeating the headline.
3. Write a headline that describes a user outcome rather than only naming a technology.
4. Add supporting copy that explains the product's value in no more than three sentences.
5. Include one primary action and one visually quieter secondary route.
6. Add a project preview using `figure`, `img`, and `figcaption`.
7. Provide useful `alt` text that describes the relevant interface content rather than saying “image.”
8. Add three project facts using semantic `article` elements and consistent visual anatomy.
9. Define a small type scale using CSS custom properties or `clamp()`.
10. Define a spacing scale and use it for component gaps and section spacing.
11. Use contrast, spacing, and grouping to establish hierarchy without giving every element an accent color.
12. Create a responsive layout that moves from two columns to one column when the content becomes cramped.
13. Ensure the DOM order remains logical when CSS is disabled and when keyboard navigation is used.
14. Add `:focus-visible` styles for every interactive element.
15. Check text contrast and make status information understandable without relying on color alone.
16. Test long project names, a missing preview image, and a paragraph that is twice as long as expected.
17. Open DevTools and inspect computed font sizes, line heights, margins, element bounds, and any horizontal overflow.
18. Capture desktop and mobile screenshots, then review each in grayscale to see whether hierarchy survives without color.
19. Ask someone who did not build the page to look at it for five seconds, then tell you what the project does and what action they would take.
20. Revise the page based on what they misunderstood rather than defending the design intent.

### Definition of done

- [ ] The project purpose is clear from the headline and supporting copy without reading the entire page.
- [ ] One action is visibly primary, and the secondary route does not compete with it.
- [ ] The visual hierarchy remains clear at desktop and mobile widths.
- [ ] The layout has no horizontal overflow with long content or narrow viewports.
- [ ] The semantic structure and keyboard order are logical.
- [ ] Focus indicators are visible and not clipped.
- [ ] Text and status cues remain understandable without color alone.
- [ ] The page still reads correctly in grayscale and with motion disabled.
- [ ] The preview has useful alternative text and a sensible fallback if the asset fails.
- [ ] A first-time viewer can identify the project's purpose and next action in five seconds.

The challenge is complete when the hierarchy works with realistic content and failure cases—not merely when the polished screenshot looks attractive.
