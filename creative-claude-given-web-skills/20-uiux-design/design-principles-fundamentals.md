# SKILL: design-principles-fundamentals
**Layer:** 43 — UI/UX Design
**Goal:** Apply foundational design principles deliberately so interfaces communicate clearly, feel coherent, and support real user tasks instead of relying on decoration or personal taste.

---

## Why This Matters (Senior Perspective)

Design principles are not a list of visual rules to memorize. They are tools for making decisions when a page has competing needs: brand expression, content, usability, responsiveness, accessibility, and business goals. A beginner may ask whether a page looks modern; a senior designer asks whether the right information is noticed, whether relationships are clear, whether the interface behaves predictably, and whether visual choices support the user's task. A page can be fashionable and still be confusing. It can also be simple and feel intentional when alignment, contrast, spacing, rhythm, and interactions are coherent.

The common amateur failure is styling each element independently. A button gets a shadow because it looks clickable, a card gets a gradient because it feels empty, a heading gets a new font size because the previous one “doesn't look right,” and spacing is adjusted until a screenshot seems balanced. Each choice may seem harmless, but the combined result has no consistent logic. Users must repeatedly relearn the interface, important actions compete with decoration, and responsive layouts break because they were never built from a system. Senior designers work from relationships and priorities: define the goal, establish a small set of rules, apply those rules consistently, then make exceptions only when content or task justifies them.

For creative developers and freelancers, design principles are a practical multiplier. A portfolio is not award-caliber because it has a dramatic hero animation; it is strong when the message is clear, the work is easy to evaluate, and the path to contact is obvious. A client website should feel like one designed system, not a collage of isolated sections. An AI product needs especially clear relationships between output, evidence, uncertainty, and next steps. These principles help you explain decisions to clients, build reusable components, and make interfaces that remain understandable on small screens and with real content. The goal is not to make every interface look the same. The goal is to make every choice purposeful.

---

## Core Concepts

### 1. Start With Purpose, Not Decoration

Every screen should have a primary purpose: help a visitor understand an offer, compare choices, complete a form, monitor a metric, or recover from an error. Visual choices should make that purpose easier to achieve. Before choosing colors, shadows, or animation, write down the user, their immediate question, and the action they should be able to take.

```html
<header class="portfolio-hero">
  <p class="portfolio-eyebrow">Creative developer · AI interfaces</p>
  <h1>Useful AI, wrapped in thoughtful digital experiences.</h1>
  <p class="portfolio-intro">
    I design and build clear, responsive interfaces for complex products.
  </p>
  <a class="portfolio-primary-action" href="#selected-work">Explore selected work</a>
</header>
```

```css
.portfolio-hero {
  max-width: 72rem;
  margin-inline: auto;
  padding: clamp(4rem, 10vw, 9rem) 1.5rem;
}

.portfolio-eyebrow {
  margin: 0 0 1rem;
  color: #526173;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.portfolio-hero h1 {
  max-width: 13ch;
  margin: 0;
  color: #142033;
  font-size: clamp(2.8rem, 7vw, 6rem);
  line-height: 0.98;
  letter-spacing: -0.055em;
}

.portfolio-intro {
  max-width: 42rem;
  margin-block: 1.5rem 2rem;
  color: #526173;
  font-size: clamp(1.05rem, 1.8vw, 1.25rem);
  line-height: 1.65;
}

.portfolio-primary-action {
  display: inline-flex;
  align-items: center;
  min-height: 3rem;
  padding: 0.85rem 1.2rem;
  border-radius: 999px;
  background: #173f70;
  color: #fff;
  font-weight: 750;
  text-decoration: none;
}

.portfolio-primary-action:focus-visible {
  outline: 3px solid #e3a008;
  outline-offset: 4px;
}
```

**Naive approach:** Add a large heading, glowing button, animated particles, and gradient because those details look impressive.

**Better approach:** Make the value proposition, supporting explanation, and next action clear first. Add effects only if they reinforce that purpose.

**Gotcha:** A beautiful interface can still fail if the copy is vague. Visual design amplifies the message; it cannot replace one.

### 2. Contrast Establishes Difference and Priority

Contrast means a meaningful difference between elements. It can come from lightness, size, weight, shape, spacing, texture, or motion—not only color. Use contrast to make important information easy to find and distinguish controls from static content.

```html
<nav class="site-nav" aria-label="Main navigation">
  <a class="site-brand" href="/">Northstar Studio</a>
  <div class="site-nav-links">
    <a href="#work">Work</a>
    <a href="#services">Services</a>
    <a class="site-nav-primary" href="#contact">Start a project</a>
  </div>
</nav>
```

```css
.site-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}

.site-brand {
  color: #142033;
  font-weight: 850;
  text-decoration: none;
}

.site-nav-links {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.site-nav-links a {
  color: #344256;
  text-decoration: none;
}

.site-nav-links .site-nav-primary {
  padding: 0.75rem 1rem;
  border-radius: 0.55rem;
  background: #173f70;
  color: #fff;
  font-weight: 750;
}

.site-nav a:focus-visible {
  outline: 3px solid #e3a008;
  outline-offset: 4px;
}
```

**Naive approach:** Make every link bright and bold so every option appears important.

**Better approach:** Assign visual roles and use contrast in proportion to the importance of each role.

**Gotcha:** Do not communicate a status with color alone. Pair color with a label, icon, shape, or clear text so the meaning survives color-vision differences and grayscale viewing.

### 3. Visual Hierarchy Guides the First Read

Hierarchy is the order in which elements attract attention. Users often scan before reading closely, so the interface should establish a clear sequence: primary message, supporting explanation, evidence, and action. Hierarchy is created by combining scale, contrast, position, grouping, and whitespace.

```css
:root {
  --type-display: clamp(2.8rem, 7vw, 5.8rem);
  --type-heading: clamp(2rem, 4vw, 3.2rem);
  --type-subheading: 1.35rem;
  --type-body: 1rem;
  --type-caption: 0.8125rem;
}

.page-title {
  max-width: 13ch;
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

**Naive approach:** Make each heading a custom size and give multiple elements the strongest color.

**Better approach:** Define a small type scale and use it consistently. One element may lead, but others should remain readable.

**Gotcha:** A huge heading is not automatically a good hierarchy. Check the message, line breaks, and what competes with it at mobile widths.

### 4. Alignment Creates Order

Alignment gives the eye a consistent path and makes a layout feel intentional. Elements do not need to be centered to be balanced. A left-aligned heading, body copy, and action often form a strong reading edge. Center alignment can work for short messages, but long centered paragraphs are harder to scan.

```html
<section class="service-intro">
  <p class="service-kicker">Our approach</p>
  <h2>Make complex products feel straightforward.</h2>
  <p>Clear structure helps people understand options and choose their next step.</p>
</section>
```

```css
.service-intro {
  max-width: 48rem;
  margin-inline: auto;
  text-align: left;
}

.service-intro .service-kicker {
  margin: 0 0 0.75rem;
  color: #526173;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.service-intro h2 {
  max-width: 15ch;
  margin: 0;
  color: #142033;
  font-size: clamp(2rem, 4.5vw, 3.8rem);
  line-height: 1.05;
}

.service-intro p:last-child {
  max-width: 40rem;
  color: #526173;
  line-height: 1.7;
}
```

**Naive approach:** Center every section because centered content feels symmetrical.

**Better approach:** Choose alignment based on the reading task and maintain clear alignment edges across related elements.

**Gotcha:** A centered hero can work well, but do not automatically center long paragraphs, forms, tables, or complex dashboards.

### 5. Proximity Communicates Relationships

Items placed close together are perceived as related. A label should be closer to its input than to the next field. A price should be grouped with its billing interval. A heading should sit closer to its section content than to the previous section's final paragraph.

```html
<form class="inquiry-form" action="/contact" method="post">
  <label class="inquiry-field">
    <span>Email address</span>
    <input type="email" name="email" autocomplete="email" required>
  </label>
  <label class="inquiry-field">
    <span>Project summary</span>
    <textarea name="summary" rows="4" required></textarea>
  </label>
  <button type="submit">Send inquiry</button>
</form>
```

```css
.inquiry-form {
  display: grid;
  gap: 1.5rem;
  max-width: 38rem;
}

.inquiry-field {
  display: grid;
  gap: 0.5rem;
  color: #243247;
  font-weight: 700;
}

.inquiry-field input,
.inquiry-field textarea {
  box-sizing: border-box;
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #9aa8b8;
  border-radius: 0.5rem;
  color: #142033;
  font: inherit;
}

.inquiry-form button {
  justify-self: start;
  padding: 0.85rem 1.2rem;
  border: 0;
  border-radius: 0.5rem;
  background: #173f70;
  color: #fff;
  font: inherit;
  font-weight: 750;
  cursor: pointer;
}
```

The small gap within each label groups the text and control; the larger gap between labels separates fields.

**Naive approach:** Use one identical margin value between every element.

**Better approach:** Use smaller gaps within groups, wider gaps between groups, and the widest gaps between sections.

**Gotcha:** Proximity is not a substitute for semantic relationships. Use real labels, fieldsets, and headings so assistive technology can understand the same structure.

### 6. Repetition Builds Consistency

Repeated styles help people learn an interface. If every project card uses the same anatomy, users can compare them quickly. Repetition applies to typography, button roles, spacing, border treatment, icon style, and interaction states. It does not mean every section must look identical; similar things should behave and appear similarly.

```html
<section class="project-grid" aria-label="Selected projects">
  <article class="project-card">
    <p class="project-type">AI product</p>
    <h3><a href="/work/medpay">Health-plan comparison</a></h3>
    <p>Making complex options easier to compare and understand.</p>
  </article>
  <article class="project-card">
    <p class="project-type">Analytics</p>
    <h3><a href="/work/inventory">Inventory insights</a></h3>
    <p>Helping teams identify risk and prioritize action.</p>
  </article>
</section>
```

```css
.project-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem;
}

.project-card {
  display: grid;
  align-content: start;
  gap: 0.75rem;
  padding: 1.5rem;
  border: 1px solid #d6dde6;
  border-radius: 1rem;
  background: #fff;
}

.project-card p,
.project-card h3 {
  margin: 0;
}

.project-type {
  color: #526173;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.project-card h3 {
  font-size: 1.35rem;
  line-height: 1.25;
}

.project-card h3 a {
  color: #142033;
  text-underline-offset: 0.18em;
}

.project-card p:last-child {
  color: #526173;
  line-height: 1.6;
}

@media (max-width: 44rem) {
  .project-grid {
    grid-template-columns: 1fr;
  }
}
```

**Naive approach:** Redesign each card independently to make it feel unique.

**Better approach:** Keep the structure and interaction patterns consistent, and use project-specific content and imagery to create variety.

**Gotcha:** Repetition can reinforce a wrong pattern. If two actions have different consequences, do not make them indistinguishable merely to keep the UI consistent.

### 7. Balance Is About Visual Weight, Not Symmetry

Balance is how visual weight is distributed across a composition. Symmetrical layouts feel stable and formal; asymmetrical layouts can feel energetic while remaining balanced. A large image on one side can be balanced by a strong headline and whitespace on the other. The goal is not to make both sides identical, but to make the composition feel intentional.

```css
.split-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  align-items: center;
  gap: clamp(2rem, 6vw, 5rem);
  max-width: 76rem;
  margin-inline: auto;
  padding: clamp(3rem, 7vw, 6rem) 1.5rem;
}

.split-hero__copy {
  max-width: 40rem;
}

.split-hero__visual {
  min-width: 0;
  aspect-ratio: 4 / 5;
  border-radius: 1.25rem;
  background: linear-gradient(145deg, #dbeafe, #f2e8ff);
}

@media (max-width: 48rem) {
  .split-hero {
    grid-template-columns: 1fr;
  }

  .split-hero__visual {
    aspect-ratio: 16 / 10;
  }
}
```

**Naive approach:** Force both columns to be exactly equal even when the headline needs more room.

**Better approach:** Adjust column proportions and whitespace according to content and visual weight, then recompose for mobile.

**Gotcha:** A visually balanced desktop layout can become lopsided when stacked. Recheck sequence and spacing at each breakpoint.

### 8. Rhythm Makes a Page Feel Cohesive

Rhythm comes from repeating patterns of spacing, type sizes, component heights, and section transitions. A spacing scale makes a page feel like a system instead of unrelated decisions.

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

.section {
  padding-block: var(--space-16);
}

.section__heading {
  margin-bottom: var(--space-8);
}

.card {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-6);
}

.card h3,
.card p {
  margin: 0;
}
```

**Naive approach:** Use unrelated margin values because each value looks acceptable in isolation.

**Better approach:** Use spacing tokens for repeated relationships and introduce exceptions only when content needs them.

**Gotcha:** Do not force every margin to a token if it creates an awkward composition. A system is a decision aid, not a reason to ignore content.

### 9. Whitespace Is a Design Element

Whitespace helps isolate a message, separate sections, and reduce cognitive load. It is not wasted space. Dense layouts can be appropriate for expert tools, but whitespace should still distinguish related from unrelated content and make important information findable.

```css
.feature-section {
  padding: clamp(3rem, 8vw, 7rem) 1.5rem;
}

.feature-section__inner {
  max-width: 72rem;
  margin-inline: auto;
}

.feature-section__heading {
  max-width: 44rem;
  margin-bottom: clamp(2rem, 5vw, 4rem);
}

.feature-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.5rem;
}

.feature-list article {
  padding-top: 1rem;
  border-top: 2px solid #d6dde6;
}

@media (max-width: 44rem) {
  .feature-list {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}
```

**Naive approach:** Fill every open area with another badge, icon, statistic, or decorative shape.

**Better approach:** Keep empty space when it helps the user understand grouping or gives the primary message room to breathe.

**Gotcha:** Excessive whitespace can separate related content or push a necessary action too far away. Space should communicate relationships, not merely make a page look minimal.

### 10. Typography Is Both Voice and Structure

Typography carries brand personality, but it also controls legibility, hierarchy, and scanning. A display face may work for a short headline but be tiring for long paragraphs. Body text needs comfortable line length, sufficient size, and line height.

```css
:root {
  --font-display: "Inter", "Helvetica Neue", sans-serif;
  --font-body: "Inter", "Helvetica Neue", sans-serif;
}

body {
  font-family: var(--font-body);
  color: #142033;
  font-size: 1rem;
  line-height: 1.65;
}

h1,
h2,
h3 {
  font-family: var(--font-display);
  font-weight: 750;
  line-height: 1.1;
}

h1 {
  max-width: 13ch;
  font-size: clamp(2.75rem, 7vw, 5.75rem);
  letter-spacing: -0.05em;
}

h2 {
  max-width: 18ch;
  font-size: clamp(2rem, 4vw, 3.25rem);
  letter-spacing: -0.035em;
}

p {
  max-width: 70ch;
}
```

**Naive approach:** Pick a typeface because it looks stylish and apply it everywhere at arbitrary sizes.

**Better approach:** Choose typefaces for tone and legibility, then define roles for headings, body text, captions, and metadata.

**Gotcha:** A font can render differently on a real device. Check actual font loading, fallback behavior, line breaks, and localization.

### 11. Color Should Have Roles

A coherent palette assigns colors to jobs: text, muted text, surface, border, primary action, success, warning, and error. Randomly choosing colors per component makes the interface inconsistent and hard to maintain.

```css
:root {
  --color-text: #142033;
  --color-muted: #526173;
  --color-surface: #ffffff;
  --color-surface-subtle: #f4f6f8;
  --color-border: #d6dde6;
  --color-primary: #173f70;
  --color-primary-text: #ffffff;
  --color-warning-surface: #fff3d6;
  --color-warning-text: #4b3500;
}

body {
  background: var(--color-surface);
  color: var(--color-text);
}

.surface-muted {
  background: var(--color-surface-subtle);
}

.subtle-text {
  color: var(--color-muted);
}

.primary-button {
  background: var(--color-primary);
  color: var(--color-primary-text);
}

.warning-message {
  background: var(--color-warning-surface);
  color: var(--color-warning-text);
}
```

**Naive approach:** Use a new hex code every time a component needs a slightly different shade.

**Better approach:** Create semantic color tokens and verify contrast for text, controls, hover, focus, disabled, and error states.

**Gotcha:** “Muted” is not the same as “low contrast.” Secondary information still needs to be readable, and color meanings should remain consistent.

### 12. Affordance and Feedback Make Controls Understandable

An affordance is a cue that suggests how an element can be used. Buttons should look actionable, links should look navigable, and interactive elements should provide feedback when focused, hovered, pressed, or completed.

```html
<button class="save-button" type="button" aria-pressed="false">
  Save project
</button>
```

```css
.save-button {
  min-height: 2.9rem;
  padding: 0.8rem 1.1rem;
  border: 0;
  border-radius: 0.6rem;
  background: #173f70;
  color: #fff;
  font: inherit;
  font-weight: 750;
  cursor: pointer;
  transition: background-color 160ms ease, transform 160ms ease;
}

.save-button:hover {
  background: #102f56;
}

.save-button:active {
  transform: translateY(1px);
}

.save-button:focus-visible {
  outline: 3px solid #e3a008;
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .save-button {
    transition: none;
  }
}
```

This demonstrates styling states; production behavior must also update the label and `aria-pressed` value when the save state changes.

**Naive approach:** Make a clickable `div` and provide no focus or pressed state.

**Better approach:** Use semantic buttons and links, preserve keyboard access, and provide clear interaction feedback.

**Gotcha:** Hover is not enough. Touch users may never hover, and keyboard users need a visible focus indicator.

### 13. Accessibility Is a Design Principle

Accessibility improves the interface for people using different devices, input methods, and sensory abilities. Semantic HTML, readable contrast, visible focus, logical order, and meaningful labels are part of a well-designed interface—not optional cleanup.

```html
<main>
  <h1>Project status</h1>
  <section aria-labelledby="attention-heading">
    <h2 id="attention-heading">Needs attention</h2>
    <article class="attention-card">
      <h3>Data refresh is overdue</h3>
      <p>The recommendations may use outdated information.</p>
      <a href="/data/refresh">Review data freshness</a>
    </article>
  </section>
</main>
```

```css
.attention-card {
  padding: 1.25rem;
  border-inline-start: 0.25rem solid #a0441b;
  background: #fff7f2;
}

.attention-card h3 {
  margin-top: 0;
  color: #63240d;
}

.attention-card a {
  color: #63240d;
  font-weight: 750;
  text-underline-offset: 0.18em;
}

a:focus-visible,
button:focus-visible,
input:focus-visible,
textarea:focus-visible {
  outline: 3px solid #174ea6;
  outline-offset: 3px;
}
```

**Naive approach:** Rely on a red border to communicate a problem or remove focus outlines because they do not match the brand.

**Better approach:** State the problem in text, use sufficient contrast, preserve semantic structure, and provide a clear focus indicator.

**Gotcha:** Do not use heading tags only to obtain a particular font size. Keep heading levels logical and control appearance with CSS.

### 14. Responsive Design Preserves Meaning

Responsive design is not simply shrinking a desktop layout. It adapts structure, order, and emphasis to the available space. A desktop sidebar may become a section below the main content; a row of cards may become a single column.

```css
.case-study-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(15rem, 0.8fr);
  gap: clamp(1.5rem, 4vw, 4rem);
  align-items: start;
}

.case-study-main,
.case-study-aside {
  min-width: 0;
}

.case-study-aside {
  padding: 1.25rem;
  border-radius: 0.9rem;
  background: #f4f6f8;
}

@media (max-width: 48rem) {
  .case-study-layout {
    grid-template-columns: 1fr;
  }
}
```

**Naive approach:** Force desktop columns to remain side by side until they become too narrow to read.

**Better approach:** Choose breakpoints when content no longer fits the current composition, then reorganize the layout.

**Gotcha:** CSS visual ordering can diverge from DOM and keyboard order. Keep the underlying document sequence logical.

### 15. Real Content Is a Design Constraint

Placeholder content hides layout problems. Real names, long titles, missing images, error messages, empty states, and translated text all affect visual balance. A robust design accommodates variation without clipping information.

```css
.project-card {
  min-width: 0;
  display: grid;
  align-content: start;
  gap: 0.75rem;
}

.project-card h3 {
  margin: 0;
  overflow-wrap: anywhere;
}

.project-card p {
  margin: 0;
  line-height: 1.6;
}

.project-card img {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: 0.75rem;
  background: #e8edf2;
}
```

**Naive approach:** Use fixed heights and `overflow: hidden` so every card lines up perfectly in a screenshot.

**Better approach:** Use flexible sizing, deliberate aspect ratios, and real content tests. Truncate only when the user can still access the full information and truncation is appropriate.

**Gotcha:** `overflow-wrap: anywhere` helps long identifiers but can create awkward breaks in normal prose. Apply it where unpredictable tokens can occur.

### 16. Motion Should Support, Not Distract

Motion can clarify cause and effect, guide attention, and make a state change feel connected. It becomes harmful when it delays a task or competes with content. Make the static interface understandable first, then add motion with a clear purpose.

```css
.project-card {
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.project-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 0.75rem 2rem rgb(20 32 51 / 12%);
}

.project-card:focus-within {
  outline: 2px solid #173f70;
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .project-card {
    transition: none;
  }

  .project-card:hover {
    transform: none;
  }
}
```

**Naive approach:** Animate every element because movement makes a website feel premium.

**Better approach:** Use motion to explain a state change or reinforce the reading path, and respect reduced-motion preferences.

**Gotcha:** Avoid making content appear only after a long animation. Users should not wait for decoration before they can read or interact.

### 17. Design Systems Make Principles Repeatable

A design system translates principles into reusable tokens and components. Tokens define recurring decisions—spacing, type roles, colors, borders, and radii. Components apply those decisions consistently.

```css
:root {
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;

  --radius-control: 0.5rem;
  --radius-card: 1rem;

  --color-text: #142033;
  --color-muted: #526173;
  --color-border: #d6dde6;
  --color-primary: #173f70;
  --color-on-primary: #ffffff;
}

.button-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 2.9rem;
  padding: var(--space-3) var(--space-6);
  border: 0;
  border-radius: var(--radius-control);
  background: var(--color-primary);
  color: var(--color-on-primary);
  font: inherit;
  font-weight: 750;
  text-decoration: none;
}
```

**Naive approach:** Copy CSS between pages and change values whenever a component feels slightly different.

**Better approach:** Centralize repeated decisions as tokens and components, then document intentional exceptions.

**Gotcha:** A token system cannot decide the right hierarchy for you. Consistent components can still be used in the wrong place or with the wrong priority.

### 18. Review With Criteria, Not Taste Alone

Taste matters, but a useful review explains what is working and why. Evaluate whether the message is clear, whether hierarchy matches the task, whether spacing and alignment communicate relationships, whether the interface behaves consistently, and whether it works at realistic sizes.

```js
const designReview = [
  { criterion: "Purpose", question: "Can a first-time visitor explain what this page is for?" },
  { criterion: "Hierarchy", question: "Is the most important message the easiest to notice?" },
  { criterion: "Consistency", question: "Do equivalent controls share visual and interaction rules?" },
  { criterion: "Accessibility", question: "Can the interface be understood without color or hover alone?" },
  { criterion: "Responsive behavior", question: "Does content order remain clear at narrow widths?" },
  { criterion: "Real content", question: "Do long labels, empty states, and errors remain usable?" }
];

console.table(designReview);
```

This checklist makes reviews repeatable; it does not automatically score the quality of a design.

**Naive approach:** Accept feedback like “make it pop” without clarifying which element needs attention or why.

**Better approach:** Ask what the viewer should notice, what is competing with it, and which change would support the intended task.

**Gotcha:** Do not turn design principles into rigid laws. A deliberate exception is valid when it improves the user experience and can be explained.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Purpose-First Hero

**Purpose:** Establish what the product or creator offers, why it matters, and what the visitor can do next.

**When to use it:** Portfolio homepages, agency sites, product landing pages, and service pages.

```html
<section class="purpose-hero" aria-labelledby="purpose-hero-title">
  <p class="purpose-hero__eyebrow">Design · Engineering · AI</p>
  <h1 id="purpose-hero-title">Turn complex ideas into clear digital products.</h1>
  <p class="purpose-hero__summary">
    Thoughtful interfaces and reliable frontend systems for ambitious teams.
  </p>
  <div class="purpose-hero__actions">
    <a class="button-primary" href="#work">View selected work</a>
    <a class="button-secondary" href="#contact">Discuss a project</a>
  </div>
</section>
```

```css
.purpose-hero {
  max-width: 72rem;
  margin-inline: auto;
  padding: clamp(4rem, 10vw, 9rem) 1.5rem;
}

.purpose-hero__eyebrow {
  margin: 0 0 1rem;
  color: #526173;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.purpose-hero h1 {
  max-width: 13ch;
  margin: 0;
  font-size: clamp(2.8rem, 7vw, 5.8rem);
  line-height: 0.98;
  letter-spacing: -0.05em;
}

.purpose-hero__summary {
  max-width: 42rem;
  margin-block: 1.5rem 2rem;
  color: #526173;
  font-size: 1.15rem;
  line-height: 1.65;
}

.purpose-hero__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
}

.button-primary,
.button-secondary {
  display: inline-flex;
  align-items: center;
  min-height: 3rem;
  font-weight: 750;
}

.button-primary {
  padding: 0.85rem 1.2rem;
  border-radius: 0.6rem;
  background: #173f70;
  color: #fff;
  text-decoration: none;
}

.button-secondary {
  color: #173f70;
  text-underline-offset: 0.2em;
}

.button-primary:focus-visible,
.button-secondary:focus-visible {
  outline: 3px solid #e3a008;
  outline-offset: 4px;
}
```

Keep the hero focused. If the visitor must choose among five equally prominent actions, the section has not made a clear decision about the user's next step.

### Pattern 2: Consistent Card Anatomy

**Purpose:** Make comparable projects or services easy to scan and compare.

**When to use it:** Portfolio grids, feature lists, service menus, and resource collections.

```html
<article class="service-tile">
  <p class="service-tile__category">AI interface</p>
  <h3>Make model outputs useful.</h3>
  <p>Present recommendations with context, limitations, and a clear next action.</p>
  <a href="/services/ai-interface">Explore this service</a>
</article>
```

```css
.service-tile {
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  align-content: start;
  gap: 0.85rem;
  min-width: 0;
  padding: 1.5rem;
  border: 1px solid #d6dde6;
  border-radius: 1rem;
  background: #fff;
}

.service-tile__category,
.service-tile h3,
.service-tile p {
  margin: 0;
}

.service-tile__category {
  color: #526173;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.service-tile h3 {
  font-size: 1.4rem;
  line-height: 1.2;
}

.service-tile p:not(.service-tile__category) {
  color: #526173;
  line-height: 1.6;
}

.service-tile a {
  justify-self: start;
  color: #173f70;
  font-weight: 750;
}
```

Use consistent anatomy, not rigid fixed heights. Real project names and descriptions vary; the component should adapt rather than clip them.

### Pattern 3: Token-Based Visual System

**Purpose:** Make the interface coherent and allow global refinement without hunting through unrelated values.

**When to use it:** Multi-page sites, reusable UI libraries, and client projects likely to change after review.

```css
:root {
  --color-ink: #142033;
  --color-muted: #526173;
  --color-surface: #ffffff;
  --color-surface-subtle: #f4f6f8;
  --color-border: #d6dde6;
  --color-brand: #173f70;
  --color-on-brand: #ffffff;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;

  --radius-control: 0.5rem;
  --radius-card: 1rem;
}

.card {
  padding: var(--space-6);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-surface);
}

.card__title {
  margin: 0 0 var(--space-2);
  color: var(--color-ink);
}

.card__description {
  margin: 0;
  color: var(--color-muted);
  line-height: 1.65;
}
```

Tokens should represent meaningful roles. Avoid tokens named only after their current appearance when the value has a clear semantic purpose.

### Pattern 4: Clear Status Message

**Purpose:** Make a warning or state understandable through text and visual treatment together.

**When to use it:** AI recommendations, dashboards, data freshness, form feedback, and asynchronous tasks.

```html
<p class="status-warning" role="status">
  <span class="status-warning__marker" aria-hidden="true">!</span>
  <span><strong>Needs review.</strong> One source has not been refreshed.</span>
</p>
```

```css
.status-warning {
  display: flex;
  align-items: start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.75rem;
  background: #fff3d6;
  color: #4b3500;
  line-height: 1.55;
}

.status-warning__marker {
  display: inline-grid;
  place-items: center;
  flex: 0 0 1.4rem;
  width: 1.4rem;
  height: 1.4rem;
  border: 2px solid currentColor;
  border-radius: 50%;
  font-size: 0.85rem;
  font-weight: 900;
}
```

The words explain the state even if color is not perceived. Use live-region semantics thoughtfully; a static message does not always need to announce itself.

### Pattern 5: Responsive Split Layout

**Purpose:** Balance a main message with a visual or supporting panel on large screens, then stack cleanly on small screens.

**When to use it:** Case studies, service pages, product features, and editorial storytelling.

```html
<section class="split-section">
  <div class="split-section__copy">
    <p class="split-section__eyebrow">How it works</p>
    <h2>Make the next step easier to understand.</h2>
    <p>Show the recommendation first, then keep supporting evidence close by.</p>
  </div>
  <figure class="split-section__visual">
    <img src="/images/product-interface.webp"
         alt="Product interface showing a recommendation and its supporting details">
  </figure>
</section>
```

```css
.split-section {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  align-items: center;
  gap: clamp(2rem, 6vw, 5rem);
}

.split-section__copy,
.split-section__visual {
  min-width: 0;
}

.split-section__visual {
  margin: 0;
}

.split-section__visual img {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 1rem;
  background: #e8edf2;
}

@media (max-width: 48rem) {
  .split-section {
    grid-template-columns: 1fr;
  }
}
```

The image path is an example asset path; replace it with an asset that exists in your project. Keep DOM order meaningful so mobile and keyboard reading order remain coherent.

### Pattern 6: Interaction States That Match the Control

**Purpose:** Make interactive elements recognizable and provide consistent feedback for hover, focus, and activation.

**When to use it:** Buttons, links, interactive cards, and form controls.

```css
.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.9rem;
  padding: 0.8rem 1.1rem;
  border: 0;
  border-radius: 0.55rem;
  background: #173f70;
  color: #fff;
  font: inherit;
  font-weight: 750;
  cursor: pointer;
  transition: background-color 160ms ease, transform 160ms ease;
}

.action-button:hover {
  background: #102f56;
}

.action-button:active {
  transform: translateY(1px);
}

.action-button:focus-visible {
  outline: 3px solid #e3a008;
  outline-offset: 3px;
}

.action-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

@media (prefers-reduced-motion: reduce) {
  .action-button {
    transition: none;
  }

  .action-button:active {
    transform: none;
  }
}
```

A disabled-looking button must actually have the correct disabled behavior in markup or application logic. Visual state and functional state should agree.

### Pattern 7: Structured Design Critique

**Purpose:** Turn vague aesthetic feedback into actionable decisions.

**When to use it:** Self-review, design reviews, client presentations, and portfolio refinement.

```js
const designCritiqueChecklist = [
  { area: "Purpose", check: "Can a first-time visitor explain the page's purpose quickly?" },
  { area: "Hierarchy", check: "Does the most important information attract the most attention?" },
  { area: "Consistency", check: "Do equivalent elements share the same visual and interaction rules?" },
  { area: "Accessibility", check: "Are labels, focus states, contrast, and semantic structure clear?" },
  { area: "Responsive behavior", check: "Does the layout preserve a sensible reading order on mobile?" },
  { area: "Content resilience", check: "Do long titles, missing data, and error messages still work?" }
];

console.table(designCritiqueChecklist);
```

Use this as a discussion guide rather than an automated score. Ask reviewers to point to the element that caused confusion and describe the task they were trying to complete.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Styling before defining the page goal | Visual exploration feels more exciting than deciding what the page must communicate | Write a one-sentence purpose and identify the main user action first |
| Making every element high contrast | The designer wants every section to feel important | Reserve the strongest contrast for the message or action that deserves priority |
| Using color as the only signal | Color is an easy visual shortcut | Pair color with text, shape, icon, or explicit state wording |
| Centering all content by default | Symmetry feels safe and easy | Choose alignment based on reading length and task |
| Using the same gap everywhere | A single spacing value seems consistent | Use smaller gaps within groups and larger gaps between groups |
| Adding decoration to fill whitespace | Empty space is mistaken for unfinished design | Keep whitespace when it clarifies grouping and focus |
| Giving every card a unique layout | Uniqueness is confused with quality | Reuse card anatomy and let content provide variety |
| Treating consistency as identical appearance | Reuse is applied without considering different roles | Keep equivalent elements consistent while distinguishing different actions and states |
| Picking typography only for style | Font personality is considered but readability is not | Test real text, line length, fallback fonts, and mobile rendering |
| Choosing palette colors independently | Each component is styled in isolation | Create semantic color tokens and verify contrast |
| Making primary and secondary actions look equal | Both actions seem valuable during implementation | Rank actions according to the user's likely next step |
| Building only for perfect sample content | Short placeholder text hides layout limits | Test long labels, empty states, errors, and missing assets |
| Fixing desktop balance only | The design is reviewed at one viewport | Recheck proportions and order at mobile widths |
| Using `div` elements for controls | Custom styling is mistaken for a complete interaction | Use semantic buttons, links, and form controls |
| Removing focus outlines | Default browser focus does not match the brand | Design a visible `:focus-visible` treatment |
| Using headings for their default size | Semantics and styling are conflated | Keep heading levels logical and style them with CSS |
| Adding motion before the static layout works | Animation creates an immediate sense of polish | Make the static hierarchy clear, then add purposeful motion |
| Treating design principles as absolute laws | Rules are easier to follow than context | Make exceptions deliberately and explain the user benefit |
| Reviewing only screenshots | A screenshot hides focus, scrolling, content variation, and interaction | Test the live page with keyboard, real content, and multiple viewport widths |
| Accepting “make it pop” as a complete direction | Feedback is not translated into an observable problem | Ask what should stand out, to whom, and for what reason |

### Before and after: arbitrary values versus a system

**Naive:**

```css
.hero-title {
  font-size: 61px;
  margin-bottom: 27px;
}

.feature-title {
  font-size: 34px;
  margin-bottom: 19px;
}

.project-title {
  font-size: 23px;
  margin-bottom: 13px;
}
```

**Better:**

```css
:root {
  --type-display: clamp(2.8rem, 7vw, 5.8rem);
  --type-section: clamp(2rem, 4vw, 3.2rem);
  --type-card: 1.35rem;
  --space-3: 0.75rem;
  --space-6: 1.5rem;
}

.hero-title {
  font-size: var(--type-display);
  margin-bottom: var(--space-6);
}

.feature-title {
  font-size: var(--type-section);
  margin-bottom: var(--space-6);
}

.project-title {
  font-size: var(--type-card);
  margin-bottom: var(--space-3);
}
```

The second approach makes relationships explicit and easier to adjust globally. It does not mean every element must use a token; repeated decisions should be deliberate.

---

## Mental Models

1. **Purpose before polish** — decide what the page must help the user understand or do before choosing effects.
2. **Contrast creates priority** — the strongest visual difference should support the most important message or action.
3. **Proximity tells a story** — distance communicates whether elements belong together or should be understood separately.
4. **Consistency reduces relearning** — repeated patterns help users predict how the interface works.
5. **Whitespace is structure** — empty space can separate ideas and give important content room to breathe.
6. **Responsive design is recomposition** — preserve meaning and reading order instead of shrinking the desktop layout.
7. **Principles are tools, not laws** — use them to reason about context, not to avoid making a judgment.
8. **A beautiful interface must still work** — visual craft includes semantics, accessibility, content resilience, and interaction feedback.

---

## Quick Reference

| Property/Situation | Value/Answer | Notes |
|---|---|---|
| First design question | What should the user understand or do? | Establish purpose before styling |
| Visual hierarchy | Message → explanation → evidence → action | Adjust sequence to the task |
| Primary action | Strongest treatment in the relevant decision area | Avoid competing primary actions |
| Secondary action | Quieter but still discoverable | Text link or outline can work |
| Contrast | Scale, color, weight, spacing, shape, and position | Not color alone |
| Alignment | Choose a consistent reading edge | Centering is not always clearest |
| Proximity | Tight within a group, wider between groups | Use spacing to communicate relationships |
| Repetition | Same visual logic for equivalent elements | Vary content, not every structural rule |
| Balance | Distribute visual weight intentionally | Symmetry is one option |
| Spacing system | Small set of reusable spacing tokens | Express relationships |
| Body text | Comfortable size and line height | Test real devices and copy |
| Display heading | Short line length and responsive size | Check narrow-width line breaks |
| Color palette | Semantic tokens for text, surface, border, action, and states | Validate contrast |
| Interactive controls | Semantic button, link, or form element | Avoid clickable `div` elements |
| Keyboard focus | Visible `:focus-visible` treatment | Check clipping and contrast |
| Status message | Text plus visual cue | Never rely on color alone |
| Responsive layout | Reorganize when content no longer fits | Breakpoints follow content needs |
| Content variation | Test long titles, empty states, and errors | Avoid brittle fixed heights |
| Motion | Explain change or support orientation | Respect reduced-motion preferences |
| Design tokens | Reusable values for recurring decisions | Tokens support consistency |
| Accessibility | Semantics, contrast, labels, focus, logical order | Part of design quality |
| Review method | Purpose, hierarchy, consistency, accessibility, responsiveness, content | Use observable criteria |
| Portfolio hero | Specialty + value + supporting copy + next step | Help clients evaluate fit |
| AI product UI | Answer + evidence + limitations + next action | Make uncertainty visible |
| Final validation | Live interaction plus realistic content at multiple sizes | Screenshots alone are insufficient |

---

## Build Challenge

### Build: A Design-Principles Portfolio Landing Page

Create a responsive homepage for a creative developer who builds polished interfaces for AI products and digital businesses. The design must be visually intentional, understandable, and robust with realistic content.

1. Write a one-sentence purpose statement before writing CSS.
2. Define the primary audience and the first question that audience needs answered.
3. Build a semantic `main` landmark and include one clear page-level `h1`.
4. Add a short eyebrow that gives context without repeating the headline.
5. Write a headline that communicates an outcome rather than only listing technologies.
6. Add supporting copy that explains the value in two or three sentences.
7. Include one primary action and one visually quieter secondary action.
8. Create a selected-work section with at least three comparable project cards.
9. Use the same card anatomy for category, title, description, and action.
10. Define CSS custom properties for colors, spacing, type roles, and border radii.
11. Apply contrast and whitespace to establish hierarchy without giving every element an accent color.
12. Align related content consistently and use proximity to show component relationships.
13. Choose typography for brand voice and readability; check actual line breaks.
14. Make the layout responsive, changing composition rather than merely shrinking columns.
15. Preserve a logical DOM order and use semantic headings and links.
16. Add visible focus styles to all interactive controls.
17. Ensure status or category is not communicated by color alone.
18. Test long project titles, a missing image, and a description twice as long as the placeholder.
19. Inspect the page in grayscale to see whether hierarchy survives without color.
20. Review the live page at desktop, tablet, and narrow mobile widths.
21. Navigate the page with a keyboard only and confirm focus order matches visual and semantic order.
22. Ask someone unfamiliar with the project to view the first screen for five seconds and explain what the developer offers.
23. Ask that person what they would click next; revise the page if their answer conflicts with the intended primary action.
24. Remove one decorative element and check whether the design becomes clearer; keep decoration only when it serves a purpose.

### Definition of Done

- [ ] A first-time visitor can explain the site's purpose without reading every section.
- [ ] The headline, supporting copy, and actions form a clear hierarchy.
- [ ] Primary and secondary actions are visually distinct and both usable.
- [ ] Similar project cards use consistent visual and interaction patterns.
- [ ] Color, typography, spacing, and radii come from a coherent set of design decisions.
- [ ] The layout works at desktop, tablet, and mobile widths.
- [ ] Long content does not clip or force horizontal scrolling.
- [ ] DOM structure and keyboard order remain logical.
- [ ] Focus indicators are visible and accessible.
- [ ] Status and meaning are not communicated through color alone.
- [ ] The page remains understandable in grayscale.
- [ ] Motion is purposeful and respects reduced-motion preferences.
- [ ] The design has been reviewed using observable criteria, not only personal taste.
- [ ] A first-time viewer can identify the offer and next step within five seconds.

The challenge is complete when the interface communicates clearly and remains usable with realistic content—not merely when the screenshot looks polished.
