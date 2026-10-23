---
# SKILL: portfolio-critique
**Layer:** 11 — Reverse Engineering
**Goal:** Evaluate a creative portfolio with evidence-based visual, interaction, accessibility, responsive, and implementation criteria, then turn the findings into a prioritized improvement plan.

---

## Why This Matters (Senior Perspective)

A portfolio is not merely a gallery of attractive screens. It is a product that must communicate a person's point of view, demonstrate craft, help visitors understand the work, and make the next step obvious. A reviewer may arrive from a recruiter link, a client referral, a social post, or a case-study page. Each visitor has limited attention and a different question: What does this person do? Is the work relevant to my problem? Can they explain their decisions? Is it easy to contact them? A visually ambitious portfolio can fail if these questions take too long to answer.

A senior critique separates taste from evidence. “The hero feels weak” is an impression, not a useful finding. “The hero contains three competing headlines, the primary action is below the first viewport, and the featured project has no outcome statement” is actionable. A good critique records the observed issue, its impact on a real visitor, the evidence that supports the claim, the severity, and a practical correction. It distinguishes a deliberate artistic choice from a usability defect and avoids treating every portfolio as if it should use the same aesthetic.

The purpose is not to make every portfolio look like an awards-site clone. It is to help the portfolio achieve its intended role. A job-seeking developer may need clear project ownership, technical decisions, and working demos. A freelance creative developer may need a distinctive visual concept, proof of execution, and a frictionless enquiry path. A studio may need positioning, selected case studies, team credibility, and a route to qualified leads. The critique should respect the intended audience while still testing clarity, accessibility, performance, responsiveness, and credibility. The output is a prioritized improvement plan, not a list of personal preferences.

---

## Core Concepts

### 1. Establish the portfolio's goal and audience before scoring it

A critique without a goal can reward the wrong things. First identify the primary audience, the action the site should encourage, and the evidence that audience needs. If the intended audience is recruiters, technical clarity and project ownership may matter more than an elaborate WebGL intro. If the audience is art direction teams, visual authorship and execution quality may deserve greater weight.

```js
const portfolioBrief = {
  primaryAudience: "creative development hiring teams",
  primaryGoal: "earn relevant interview conversations",
  primaryAction: "open a project case study or contact the owner",
  supportingGoals: ["demonstrate technical range", "show design judgment"],
  constraints: {
    mobileFirst: true,
    reducedMotionSupport: true,
    lowBandwidthSupport: true
  }
};

console.table(portfolioBrief);
```

Use this brief to interpret every later observation. A feature is not automatically good because it is impressive; it must help the audience make a decision.

**Naive approach:** Critique every portfolio against the same aesthetic checklist.

**Correct approach:** Define audience, intended outcome, and context first, then assess whether each design decision serves that goal.

**Gotcha:** A portfolio may have multiple audiences, but it still needs a clear primary path. Trying to satisfy every audience equally can make the landing page vague.

### 2. Separate observation, interpretation, and recommendation

These are three different layers. Observation is what can be directly seen or tested. Interpretation explains why it may matter. Recommendation proposes a change. Keeping them separate prevents subjective reactions from masquerading as facts.

```js
const finding = {
  observation: "The first screen shows a title but no work sample or clear next action.",
  interpretation: "A new visitor may not understand the owner's specialty or what to inspect next.",
  recommendation: "Add one concise positioning statement, one featured project, and a visible case-study link.",
  confidence: "high"
};

console.table(finding);
```

A strong finding can be challenged and improved because its reasoning is visible. “This looks boring” is hard to act on; “the hero uses generic copy and provides no evidence of the stated specialty” identifies the missing connection.

**Naive approach:** Write “make it pop,” “add more polish,” or “the layout is off.”

**Correct approach:** Name the visible condition, describe the likely user impact, and suggest a specific change.

**Gotcha:** Do not state user behavior as fact unless it was measured. Use “may cause,” “likely makes it harder,” or “test whether” when the impact is an inference.

### 3. Evaluate positioning and first-screen clarity

The first screen should establish who the creator is, what they do, and where a visitor can find proof. This does not require a conventional hero or a large block of text. It requires a legible point of view and an obvious next step.

```html
<header class="portfolio-hero">
  <p class="portfolio-hero__eyebrow">Independent creative developer</p>
  <h1>Digital experiences with character and purpose.</h1>
  <p class="portfolio-hero__summary">
    I build expressive websites, motion systems, and interactive product stories.
  </p>
  <a class="portfolio-hero__action" href="#selected-work">
    Explore selected work
  </a>
</header>
```

The example is a structural model, not copy to reuse blindly. Replace the generic positioning with a truthful specialty and concrete evidence. If the creator's work is intentionally enigmatic, test whether the visual mystery still leaves the next action understandable.

**Naive approach:** Use a broad statement such as “I create digital magic” without supporting detail.

**Correct approach:** Pair a distinct voice with a concrete description of the work and a clear path to examples.

**Gotcha:** A visually striking hero can still fail when the title has low contrast, overflows on mobile, or requires a long animation before the visitor can interact.

### 4. Assess project selection and hierarchy

The strongest portfolio projects should be easy to find and relevant to the stated positioning. A large grid of equally weighted thumbnails can make the work feel interchangeable. A smaller selection with clear roles often communicates judgment better: one flagship case study, a few supporting projects, and an optional archive.

```js
const selectedProjects = [
  {
    title: "Commerce experience",
    role: "Frontend engineering and motion",
    evidence: "Live demo, code sample, measured performance"
  },
  {
    title: "Interactive editorial",
    role: "Creative development",
    evidence: "Video walkthrough and responsive case study"
  },
  {
    title: "Data storytelling",
    role: "UI engineering and visualization",
    evidence: "Accessible chart interaction and implementation notes"
  }
];

console.table(selectedProjects);
```

For each project, ask what it proves. If three projects all prove the same skill, the portfolio may need a more varied selection or a deeper explanation of one project. Do not inflate the number of projects just to appear experienced.

**Naive approach:** Display every exercise, tutorial clone, and unfinished experiment at the same visual priority.

**Correct approach:** Curate projects by relevance, quality, distinctiveness, and the evidence each adds to the portfolio.

**Gotcha:** A personal concept project is valid, but label it honestly. Do not imply client ownership, team leadership, production usage, or business outcomes that did not happen.

### 5. Inspect case-study depth and project ownership

A thumbnail shows the final appearance; a case study shows how the work was done and what the creator contributed. Good case studies explain context, constraints, role, decisions, trade-offs, implementation, and outcome. A solo project should still make the owner's contribution clear, and a team project should distinguish individual work from team output.

```html
<article class="case-study">
  <header>
    <p class="case-study__eyebrow">Case study / 01</p>
    <h2>Rebuilding the product discovery flow</h2>
    <p>Role: UI engineering, interaction design, accessibility review</p>
  </header>
  <section aria-labelledby="case-context">
    <h3 id="case-context">Context and constraints</h3>
    <p>
      Describe the user problem, technical constraints, and what success needed to mean.
    </p>
  </section>
  <section aria-labelledby="case-decisions">
    <h3 id="case-decisions">Key decisions</h3>
    <p>
      Explain why the layout, data model, interaction pattern, and fallback were chosen.
    </p>
  </section>
  <section aria-labelledby="case-outcome">
    <h3 id="case-outcome">Outcome and reflection</h3>
    <p>
      Report measured results when available; otherwise state what was validated and what remains untested.
    </p>
  </section>
</article>
```

A case study should show reasoning, not just a sequence of screenshots. A real metric is valuable when its source and context are clear. If no analytics exist, use honest evidence such as a usability test, Lighthouse comparison, issue resolved, or a limitation discovered.

**Naive approach:** Write “I made the website faster and improved conversions” without data or context.

**Correct approach:** State the baseline, method, result, and measurement source—or describe the qualitative validation that actually occurred.

**Gotcha:** A polished mockup is not proof that the feature shipped. Distinguish prototype, personal concept, and production work.

### 6. Review visual hierarchy and composition

Hierarchy directs attention through scale, contrast, alignment, spacing, density, and repetition. A critique should ask whether the hierarchy supports the page's purpose, not whether every section uses a trendy layout. Look for competing focal points, inconsistent alignment, cramped text, excessive empty space without intent, and repeated components that drift in style.

```css
.portfolio-section {
  --section-gutter: clamp(1rem, 4vw, 4.5rem);
  padding-inline: var(--section-gutter);
  padding-block: clamp(3rem, 8vw, 8rem);
}

.portfolio-section__heading {
  max-width: 14ch;
  margin: 0;
  font-size: clamp(2.25rem, 6vw, 6.5rem);
  line-height: 0.98;
  letter-spacing: -0.045em;
}

.portfolio-section__body {
  max-width: 62ch;
  margin-block-start: 1.5rem;
  line-height: 1.65;
}
```

Look at the page at both overview and detail scales. At overview scale, the rhythm and emphasis should read. At detail scale, text, controls, and image crops should feel deliberate. Avoid recommending a redesign when a small adjustment to line length, spacing, or contrast would solve the issue.

**Naive approach:** Treat every large heading or empty area as evidence of premium design.

**Correct approach:** Check whether visual emphasis matches content importance and whether the page remains readable when scanned quickly.

**Gotcha:** Typography and layout can look balanced on one monitor but fail with longer content, browser zoom, or a narrow viewport.

### 7. Inspect typography as a system

Typography is not just font choice. Evaluate scale, line length, line height, weight, contrast, hierarchy, and behavior under wrapping. A portfolio can use expressive display typography and still provide comfortable reading in case studies.

```css
:root {
  --font-display: "Space Grotesk", sans-serif;
  --font-reading: "Inter", sans-serif;
  --type-body: clamp(1rem, 0.35vw + 0.94rem, 1.125rem);
  --type-heading: clamp(2.5rem, 7vw, 7rem);
}

body {
  font-family: var(--font-reading);
  font-size: var(--type-body);
  line-height: 1.65;
}

h1,
h2,
h3 {
  font-family: var(--font-display);
  line-height: 1.05;
  text-wrap: balance;
}

.case-study p {
  max-width: 68ch;
}
```

Evaluate the real copy, not just placeholder text. A headline that looks excellent with four words may wrap awkwardly with the creator's actual name or a translated phrase. Test zoom and mobile widths before calling the type system complete.

**Naive approach:** Choose a display font and assume all typography problems are solved.

**Correct approach:** Review hierarchy, reading measure, wrapping, loading behavior, and the distinction between display and reading roles.

**Gotcha:** External font loading can cause layout shifts or invisible text. Review font-display behavior, fallback metrics, and whether the chosen fonts are licensed for the intended use.

### 8. Critique color, contrast, and image treatment

Color should create a coherent system and preserve legibility. Image treatment should support the project story: consistent crops, intentional art direction, and appropriate compression. Avoid recommending more color simply because a page feels quiet; first identify whether the issue is hierarchy, content, or contrast.

```css
:root {
  --color-ink: #181818;
  --color-paper: #f4f1ea;
  --color-accent: #b8ff5a;
  --color-muted: #66645f;
}

.portfolio-page {
  color: var(--color-ink);
  background: var(--color-paper);
}

.portfolio-link {
  color: inherit;
  text-decoration-thickness: 0.08em;
  text-underline-offset: 0.2em;
}

.portfolio-link:focus-visible {
  outline: 3px solid var(--color-ink);
  outline-offset: 4px;
}
```

Do not infer contrast compliance by eye alone. Check text and interactive states with a contrast tool, including hover, focus, disabled, and overlay states. For imagery, inspect compression artifacts, aspect ratio, loading behavior, and whether a crop removes important context.

**Naive approach:** Use an accent color for every button, heading, border, and icon until the page feels branded.

**Correct approach:** Define roles for background, text, muted content, accent, and focus; apply accent selectively and verify contrast.

**Gotcha:** Text over photography has variable contrast. A translucent overlay that works on one image may fail on another image in the same project grid.

### 9. Evaluate interaction clarity and feedback

Interactions should communicate affordance, respond predictably, and preserve access through keyboard and touch. A cursor effect may be delightful, but a link still needs to look and behave like a link. Every meaningful action should have an understandable response, and decorative motion should not delay navigation or obscure content.

```css
.project-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: inherit;
  text-decoration: none;
}

.project-link__icon {
  transition: transform 180ms ease-out;
}

.project-link:hover .project-link__icon,
.project-link:focus-visible .project-link__icon {
  transform: translateX(0.25rem);
}

.project-link:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 0.3rem;
}

@media (prefers-reduced-motion: reduce) {
  .project-link__icon {
    transition: none;
  }
}
```

Inspect hover, focus, active, loading, success, error, and disabled states when applicable. If a control changes the page, confirm that the change is discoverable and that the browser's expected behaviors—such as opening a link in a new tab when requested—are not unexpectedly blocked.

**Naive approach:** Make all interactive elements respond only to mouse hover.

**Correct approach:** Check keyboard focus, touch behavior, visible affordance, state feedback, and reduced-motion behavior.

**Gotcha:** A custom cursor can hide the native pointer or obscure targets. Keep it decorative and ensure it never replaces accessible control semantics.

### 10. Review motion as communication, not decoration alone

Motion can establish hierarchy, connect related elements, explain a state change, or create atmosphere. It can also make a portfolio slow, tiring, or difficult to navigate. Evaluate trigger, duration, easing, stagger, distance, reversibility, and whether motion blocks access to the content.

```css
.project-card__image {
  transform: scale(1.035);
  transition: transform 650ms cubic-bezier(.16, 1, .3, 1);
}

.project-card:hover .project-card__image,
.project-card:focus-within .project-card__image {
  transform: scale(1);
}

@media (prefers-reduced-motion: reduce) {
  .project-card__image {
    transform: none;
    transition: none;
  }
}
```

A critique should identify the role of the motion. “The entrance takes too long” is more useful when paired with the observed delay and consequence, such as the primary action being unavailable for a noticeable interval. Prefer removing unnecessary motion over merely making every animation shorter.

**Naive approach:** Recommend more GSAP or more transitions as a universal polish step.

**Correct approach:** Ask what the motion communicates, whether it is necessary, whether it can be interrupted, and whether the static state is still complete.

**Gotcha:** Reduced-motion support is not only about removing animation declarations. Restore any opacity, transform, or visibility values that otherwise leave content hidden.

### 11. Test responsive behavior with actual content

Responsive design is not a desktop composition scaled down. Navigation, typography, image crops, project-card order, motion distance, and content density may need different decisions on mobile. Test realistic text and imagery at several widths, then use browser zoom and keyboard navigation to find issues that fixed screenshots miss.

```css
.project-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: clamp(1rem, 2vw, 2rem);
}

.project-card {
  grid-column: span 6;
  min-width: 0;
}

.project-card--featured {
  grid-column: span 8;
}

@media (max-width: 48rem) {
  .project-card,
  .project-card--featured {
    grid-column: 1 / -1;
  }
}
```

Check for horizontal overflow, clipped text, small tap targets, awkward menu states, image crops that lose the subject, and layouts that depend on hover. The best responsive behavior may intentionally change composition instead of preserving desktop proportions.

**Naive approach:** Test only the browser's responsive preview at one mobile width.

**Correct approach:** Check at narrow, medium, and wide widths, use real content, test zoom, and inspect keyboard and touch behavior.

**Gotcha:** A breakpoint that works for one project title may fail for a longer title or translated string. Test content extremes, not just the most convenient sample.

### 12. Assess accessibility as part of craft

Accessibility is not a separate polish pass. Semantic structure, keyboard operation, focus visibility, text alternatives, contrast, reduced motion, and clear link names all affect whether the portfolio communicates its work. An interactive 3D scene should not make the rest of the page inaccessible.

```html
<nav aria-label="Primary navigation">
  <a href="#selected-work">Work</a>
  <a href="#about">About</a>
  <a href="#contact">Contact</a>
</nav>

<main>
  <section id="selected-work" aria-labelledby="work-heading">
    <h2 id="work-heading">Selected work</h2>
    <article>
      <h3><a href="/work/field-notes/">Field Notes</a></h3>
      <p>Editorial web experience with a responsive type system.</p>
    </article>
  </section>
</main>
```

Check document landmarks and heading order, meaningful alternative text, accessible names, focus order, contrast, reduced motion, and whether information is available without animation. Automated tools are useful for finding some defects but cannot judge whether the alt text is meaningful or whether a case study clearly communicates its purpose.

**Naive approach:** Add ARIA attributes to every element and assume the site is accessible.

**Correct approach:** Prefer semantic HTML, test with keyboard and assistive technology where possible, and add ARIA only when native semantics are insufficient.

**Gotcha:** An image used purely as decoration may need empty alt text, while an image that communicates project context needs a concise meaningful alternative. Do not use filenames as alt text.

### 13. Inspect performance and loading strategy

A portfolio can be visually excellent and still feel careless if it loads a large hero video before showing useful content, shifts layout as images arrive, or runs an expensive scene on every device. Measure the page rather than guessing. Inspect image sizes, font loading, JavaScript cost, long tasks, layout shifts, and the behavior of any Canvas or WebGL effect.

```html
<img
  src="/images/project-editorial-960.webp"
  srcset="
    /images/project-editorial-480.webp 480w,
    /images/project-editorial-960.webp 960w,
    /images/project-editorial-1440.webp 1440w
  "
  sizes="(max-width: 48rem) 100vw, 50vw"
  width="1440"
  height="1080"
  loading="lazy"
  decoding="async"
  alt="Editorial website showing a bold typographic spread"
/>
```

Do not lazy-load the most important above-the-fold image by default; that may delay the visual content the visitor sees first. Use appropriate dimensions to reserve layout space, responsive image sources to avoid over-downloading, and performance traces to identify the real bottleneck.

**Naive approach:** Add `loading="lazy"` to every image and call performance optimization complete.

**Correct approach:** Prioritize the main content, reserve image space, select appropriately sized assets, and measure the actual load and interaction experience.

**Gotcha:** A Lighthouse score is a useful signal, not the entire user experience. Compare repeatable runs, field data when available, and the actual behavior of the portfolio's core interactions.

### 14. Verify credibility, details, and contact path

A portfolio is also a trust interface. Check that names, dates, project roles, external links, repository links, demo URLs, and claims are accurate. A broken demo or vague contact path can undermine otherwise excellent visual work. Avoid interpreting missing information as proof that the creator lacks the skill; instead report what the visitor can and cannot verify.

```html
<section id="contact" aria-labelledby="contact-heading">
  <h2 id="contact-heading">Have a project in mind?</h2>
  <p>
    For creative development, frontend engineering, or collaboration enquiries,
    email me directly.
  </p>
  <a href="mailto:hello@example.com">hello@example.com</a>
</section>
```

The email address above is an illustrative placeholder and must be replaced with the portfolio owner's real contact method before use. Check that the contact path works without requiring an account, that social links point to the correct profiles, and that external links communicate their destination.

**Naive approach:** Treat a beautiful contact section as sufficient even when the link is broken or the offer is unclear.

**Correct approach:** Test every high-value link and make the next step specific, truthful, and easy to complete.

**Gotcha:** Do not publish private client material, confidential metrics, or personal information without permission. A portfolio should demonstrate judgment as well as output.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Weighted critique rubric

**What it does:** Converts observations into a consistent review without pretending that every criterion matters equally.

**When to use it:** Use this for a self-review, peer critique, or portfolio review session where several people need to compare findings.

```js
const reviewCriteria = [
  { category: "Positioning", weight: 5, score: 0, evidence: "" },
  { category: "Project quality", weight: 5, score: 0, evidence: "" },
  { category: "Case-study depth", weight: 4, score: 0, evidence: "" },
  { category: "Responsive behavior", weight: 4, score: 0, evidence: "" },
  { category: "Accessibility", weight: 5, score: 0, evidence: "" },
  { category: "Performance", weight: 4, score: 0, evidence: "" },
  { category: "Visual identity", weight: 3, score: 0, evidence: "" },
  { category: "Contact path", weight: 4, score: 0, evidence: "" }
];

function calculateWeightedScore(criteria) {
  const completed = criteria.filter((item) => item.score >= 1 && item.score <= 5);
  const totalWeight = completed.reduce((sum, item) => sum + item.weight, 0);

  if (totalWeight === 0) return null;

  const weightedTotal = completed.reduce(
    (sum, item) => sum + item.score * item.weight,
    0
  );

  return Number((weightedTotal / totalWeight).toFixed(2));
}

console.log("Weighted score:", calculateWeightedScore(reviewCriteria));
```

Use a 1–5 scale with written anchors, and score only criteria for which you have evidence. A number summarizes the review; it does not replace the findings or determine whether a portfolio is “good.”

### Pattern 2: Finding schema with severity and confidence

**What it does:** Makes each issue traceable and prioritizable.

**When to use it:** Use this when a critique will be handed to a developer, designer, or client and must become a work list.

```js
const critiqueFindings = [
  {
    id: "NAV-01",
    title: "Primary navigation is difficult to discover on mobile",
    observation: "The menu icon has no visible label and its focus state is not apparent.",
    impact: "Visitors may miss the work and contact sections.",
    severity: "high",
    confidence: "high",
    effort: "medium",
    recommendation: "Add an accessible name, visible focus state, and test the open-menu flow.",
    validation: "Complete the navigation using keyboard and touch at 390px width."
  }
];

const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };

critiqueFindings.sort((a, b) =>
  (priorityOrder[b.severity] || 0) - (priorityOrder[a.severity] || 0)
);

console.table(critiqueFindings);
```

Severity describes the likely impact; confidence describes the strength of the evidence. A high-impact but low-confidence finding should usually be verified before a large redesign is proposed.

### Pattern 3: Impact-versus-effort prioritization

**What it does:** Separates high-value fixes from attractive but low-impact polish.

**When to use it:** Use this when the portfolio owner has limited time and needs a realistic first sprint.

```js
const improvements = [
  { task: "Fix broken project demo", impact: 5, effort: 1 },
  { task: "Clarify hero positioning", impact: 5, effort: 2 },
  { task: "Add keyboard focus states", impact: 4, effort: 2 },
  { task: "Replace a minor decorative icon", impact: 1, effort: 1 },
  { task: "Rebuild the entire intro in WebGL", impact: 2, effort: 5 }
];

const prioritizedImprovements = improvements
  .map((item) => ({
    ...item,
    valueRatio: Number((item.impact / item.effort).toFixed(2))
  }))
  .sort((a, b) => b.valueRatio - a.valueRatio);

console.table(prioritizedImprovements);
```

The ratio is a planning aid, not a universal formula. A critical accessibility defect or broken contact link may need to be fixed regardless of its ratio.

### Pattern 4: Evidence-first screenshot review

**What it does:** Uses screenshots as structured evidence instead of a gallery of opinions.

**When to use it:** Use this for asynchronous review when the reviewer cannot inspect the site live.

```js
const screenshotReview = {
  viewport: { width: 390, height: 844 },
  state: "mobile navigation open",
  evidence: [
    "menu panel covers the page heading",
    "close control is near the top edge",
    "focus indicator is not visible in the capture"
  ],
  limits: [
    "a screenshot cannot confirm keyboard order",
    "a screenshot cannot confirm animation timing",
    "a screenshot cannot confirm link destinations"
  ],
  followUpTests: [
    "tab through the open menu",
    "activate the close control",
    "inspect at 768px width",
    "verify every navigation destination"
  ]
};

console.log(JSON.stringify(screenshotReview, null, 2));
```

Always record the viewport and interaction state. A screenshot of the open menu should not be compared with another screenshot of the closed menu as if they were the same state.

### Pattern 5: Responsive review matrix

**What it does:** Prevents the common mistake of declaring a layout responsive after checking only one phone size.

**When to use it:** Use this for every portfolio with a grid, navigation, long headings, image masks, or pointer-driven behavior.

```js
const responsiveChecks = [
  { width: 390, input: "touch", checks: ["navigation", "tap targets", "image crop", "overflow"] },
  { width: 768, input: "touch or keyboard", checks: ["grid transition", "heading wrap", "focus order"] },
  { width: 1440, input: "mouse and keyboard", checks: ["hierarchy", "hover states", "content width"] }
];

for (const viewport of responsiveChecks) {
  console.log(`${viewport.width}px — ${viewport.input}`);
  viewport.checks.forEach((check) => console.log(`  [ ] ${check}`));
}
```

The listed widths are test points, not a complete device matrix. Include browser zoom and content extremes when the design relies on precise text wrapping.

### Pattern 6: Motion and accessibility review

**What it does:** Makes the reviewer check both the animated and static experience.

**When to use it:** Use this for portfolios that rely on page transitions, scroll animation, custom cursors, parallax, or shader effects.

```js
const motionAudit = [
  "Does content remain visible when JavaScript is disabled?",
  "Does prefers-reduced-motion remove nonessential movement?",
  "Can every interactive element be reached by keyboard?",
  "Does focus remain visible during transitions?",
  "Is any information conveyed only by motion or color?",
  "Can visitors skip or interrupt a long intro?",
  "Does the page remain usable on touch devices?"
];

motionAudit.forEach((question, index) => {
  console.log(`${index + 1}. [ ] ${question}`);
});
```

If the intro is a long cinematic sequence, assess whether it supports the goal or delays it. A skip link or a shorter default path may be better than adding more effects.

### Pattern 7: Review report with explicit evidence boundaries

**What it does:** Produces a useful report while distinguishing confirmed defects from hypotheses.

**When to use it:** Use this when a critique will be shared with a client or when the reviewer has only partial access to the implementation.

```md
# Portfolio review

## Scope
- URL and date reviewed:
- Viewports and browsers:
- States tested:
- States not tested:

## Highest-priority findings
For each finding, include:
- Observation:
- User or business impact:
- Evidence:
- Severity:
- Confidence:
- Recommendation:
- Validation step:

## Strengths to preserve
- What works:
- Why it works:
- Evidence:

## Assumptions and limits
- What could not be verified:
- What needs a live test:
- What depends on project goals:

## First implementation sprint
1. Critical defects
2. High-impact clarity improvements
3. Responsive and accessibility fixes
4. Visual polish
```

A critique should identify strengths worth preserving. If the report only lists flaws, it may cause the owner to remove the very elements that make the portfolio distinctive.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Critiquing without knowing the goal | The reviewer applies personal taste as a universal standard | Identify the audience, intended action, and role of the portfolio before scoring |
| Saying “make it pop” | The observation is emotional but not specific | Name the competing hierarchy, missing evidence, contrast issue, or unclear action |
| Treating an inference as measured user behavior | A reviewer assumes they know what visitors will do | Label the impact as a hypothesis and propose a test |
| Recommending a full redesign for a small defect | Large changes feel more valuable than precise fixes | Start with the smallest change that addresses the observed problem |
| Scoring every criterion equally | Aesthetic polish is easy to notice, while accessibility and credibility take more work | Use goal-aligned weights and explicit evidence |
| Treating a personal project as client work | The presentation omits the project's context | Label concept, self-initiated, prototype, and production work honestly |
| Listing tools without explaining decisions | Tool names are easier to write than engineering rationale | Explain the constraint, alternatives, chosen approach, and trade-off |
| Showing outcomes without measurement | Marketing language makes claims sound stronger | Include baseline and source, or report qualitative validation honestly |
| Displaying every project at the same priority | The owner fears that fewer projects look inexperienced | Curate by relevance and give each project a clear purpose |
| Using motion to hide weak content | Animation creates novelty but does not fix unclear positioning | Improve the content hierarchy before adding movement |
| Ignoring mobile input | The design was tested only with a mouse | Test touch, keyboard, focus, tap targets, and non-hover states |
| Assuming a screenshot proves accessibility | Visual inspection cannot confirm keyboard or assistive-technology behavior | Perform keyboard checks and semantic inspection in the live page |
| Using a Lighthouse score as the whole performance review | A single score feels objective and easy to share | Inspect field or repeatable lab data plus the actual interaction trace |
| Lazy-loading every image | One rule is applied without considering loading priority | Prioritize above-the-fold content and reserve image dimensions |
| Hiding content until an animation completes | The intended entrance is treated as required for visibility | Keep the static state complete and make motion progressive enhancement |
| Leaving contact details untested | The contact section is treated as visual decoration | Activate each link and verify destination and ownership |
| Rewriting the whole visual identity to match a trend | Award-site references are copied without understanding the creator's intent | Preserve distinctive choices that support the goal and improve specific defects |
| Giving a long, unranked list of findings | The reviewer confuses quantity with usefulness | Group by severity and provide a first sprint with measurable completion criteria |

**Before → after: replace a vague critique with an actionable finding.**

```text
Before:
"The hero is boring and needs more animation."

After:
"Observation: The hero contains a broad tagline, but no specialty, featured work,
or clear next action appears in the first screen.
Impact: A first-time visitor may not understand what kind of work to inspect.
Recommendation: Add a truthful specialty statement and one prominent case-study link.
Validation: Ask three people from the intended audience what the portfolio owner does
and what they would click next after a five-second glance."
```

The revised finding separates evidence from interpretation and includes a way to check whether the change helped.

---

## Mental Models

1. **Goal before taste** — judge a portfolio by the audience and action it is designed to serve.
2. **Observation is not interpretation** — record what is visible before explaining why it matters.
3. **Every project should prove something** — curation is about evidence, not item count.
4. **A case study shows decisions** — final screenshots show what was made; reasoning shows how the creator works.
5. **Prioritize impact, not spectacle** — broken links and unclear positioning usually matter more than another shader.
6. **Preserve what works** — critique should protect distinctive strengths as well as expose defects.
7. **Unverified means unverified** — clearly label assumptions and propose a test instead of inventing certainty.

---

## Quick Reference

| Review area | What to inspect | Evidence to collect | Typical high-value fix |
|---|---|---|---|
| Goal and audience | Positioning and intended visitor | Brief, first-screen scan | Clarify specialty and primary action |
| Hero clarity | Role, value, next step | First viewport screenshot and five-second test | Add concrete positioning and a case-study path |
| Project curation | Relevance and distinctiveness | Project inventory and stated skills | Feature strongest, most relevant work |
| Case studies | Context, role, decisions, outcome | Written case study and demo | Explain constraints and individual contribution |
| Visual hierarchy | Scale, alignment, spacing, contrast | Full-page and viewport captures | Remove competing focal points |
| Typography | Scale, measure, line height, wrapping | Desktop/mobile text states | Improve reading measure and responsive scale |
| Color and imagery | Contrast, crop, consistency | Contrast checks and image loading | Fix contrast and image treatment |
| Interaction | Affordance, feedback, focus | Keyboard and touch tests | Add clear states and usable controls |
| Motion | Trigger, timing, purpose, fallback | Recording and reduced-motion test | Remove blocking or unnecessary motion |
| Responsive layout | Navigation, grid, overflow, crop | 390px, 768px, 1440px checks | Correct breakpoint behavior |
| Accessibility | Semantics, names, focus, alt text | Keyboard and automated checks | Fix navigation, labels, contrast, and motion |
| Performance | Images, fonts, JS, layout shifts | Performance trace and load metrics | Optimize critical assets and expensive work |
| Credibility | Role, outcomes, links, project status | Verified links and claim sources | Correct claims and repair broken demos |
| Contact path | Clear invitation and working destination | Link activation test | Make contact direct and easy |
| Prioritization | Impact, effort, severity, confidence | Ranked findings list | Deliver a focused first sprint |

---

## Build Challenge

### Build: Evidence-Based Portfolio Review

Review a real portfolio or a personal project portfolio and produce a report that a developer can act on without a follow-up meeting. You may use a live site, a local build, or screenshots, but clearly state what you could and could not test.

**Requirements**

1. Define the portfolio's primary audience, goal, and intended action in three concise sentences.
2. Inspect the first screen at desktop and mobile widths. Record what a visitor can understand about the creator in five seconds.
3. Select at least three projects and explain what each one proves about the creator's skills.
4. Review one full case study for context, role, constraints, decisions, implementation, and outcome evidence.
5. Record at least eight findings. Each must include observation, likely impact, evidence, severity, confidence, recommendation, and validation step.
6. Include at least two strengths that should be preserved, supported by evidence.
7. Test the navigation and contact path with keyboard and touch where possible.
8. Test responsive behavior at approximately 390px, 768px, and 1440px widths, and note any overflow, crop, or hierarchy changes.
9. Inspect reduced-motion behavior and determine whether any content depends on animation to become visible.
10. Inspect performance using repeatable browser measurements. Identify one real bottleneck or explicitly state that no bottleneck was established.
11. Verify project links, demos, repositories, role claims, and outcome claims. Mark anything that could not be verified.
12. Prioritize findings using severity, confidence, impact, and effort; do not let a low-impact cosmetic preference outrank a broken primary path.
13. Create a first-sprint plan with no more than five tasks and a clear definition of done for each.
14. Write a short executive summary that distinguishes verified defects from hypotheses and avoids ungrounded claims about visitor behavior.
15. Revisit the page after implementing at least two recommendations and record what changed.

**Expected output**

- A portfolio critique report in Markdown.
- A findings table with evidence, severity, confidence, and validation steps.
- A responsive/accessibility/performance test checklist.
- A prioritized first-sprint plan.
- Before-and-after captures or notes for two implemented improvements.

**Definition of done / Success criteria**

- [ ] The critique is aligned with a clearly stated audience and goal.
- [ ] Each finding describes an observable condition rather than a personal preference alone.
- [ ] High-priority recommendations are specific and testable.
- [ ] Strengths worth preserving are included.
- [ ] At least one mobile, keyboard, and reduced-motion check is documented.
- [ ] Project claims and links are verified or explicitly marked unverified.
- [ ] The report distinguishes measurement from inference.
- [ ] The first sprint is small enough to execute and has clear completion criteria.
- [ ] Two recommendations are implemented and reviewed against the original finding.
- [ ] Another developer can understand the rationale and next steps without needing the reviewer's memory.
