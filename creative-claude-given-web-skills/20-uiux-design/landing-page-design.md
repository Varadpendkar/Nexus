# SKILL: landing-page-design

**Layer:** 43 — UI/UX Design

**Goal:** Design landing pages that communicate a clear value proposition, build trust, guide attention, and convert the intended audience through a coherent hierarchy, credible evidence, accessible interactions, and deliberate visual storytelling.

---

## Why This Matters (Senior Perspective)

A landing page is a focused decision environment. It is not simply a homepage with a large headline and a button. Its job is to help a specific audience understand what is being offered, why it matters to them, whether they should trust the organization, and what action makes sense next. The design must support those questions in a useful order. A page can be visually polished and still underperform when the offer is vague, the headline describes the company rather than the customer’s outcome, the primary action is unclear, or the evidence appears too late to resolve doubt.

Senior landing-page design begins before the first frame in Figma. Clarify the audience, their situation, the promise being made, the action the page should encourage, and the evidence that makes the promise credible. A page for a developer tool may need a live product interface, technical proof, and documentation access. A page for a local service may need service area, availability, pricing expectations, reviews, and a straightforward contact action. A page for a complex B2B product may need to explain the problem, show the workflow, establish security or integration credibility, and make the next step feel proportionate to the visitor’s readiness.

The most important visual decision is the hierarchy of attention. The visitor should be able to identify the core offer, understand the primary action, and recognize the next useful piece of evidence without deciphering competing banners, navigation links, decorative graphics, and multiple equally weighted buttons. Strong pages use alignment, whitespace, contrast, typography, and imagery to make the path obvious. They do not make every section loud. The page should also work for visitors who scan rather than read every paragraph, so headings, captions, and section transitions need to carry meaning independently.

Conversion is not permission to manipulate. A reliable landing page states what happens after the action, avoids fabricated urgency, does not hide important conditions, and provides accessible labels and feedback. Trust signals should be genuine and relevant. Customer logos, testimonials, statistics, awards, and security claims must be accurate and approved. If there is no evidence for a claim, the design should not invent one to fill a layout gap.

Landing pages are also implementation systems. The designed page must adapt to narrow screens, load efficiently, support keyboard and assistive technology use, and preserve a meaningful reading order when responsive layouts change. Images need appropriate dimensions and alternatives, forms need labels and error messages, and motion must not block access to content. Use browser DevTools to inspect layout shifts, image loading, focus order, and responsive breakpoints. Measure performance and user behavior with defined events rather than treating the published screenshot as proof of success.

**Senior perspective:** design the page around a truthful promise and the visitor’s decision process. Visual polish matters, but it should make the message clearer, the evidence easier to evaluate, and the next action easier to understand.

---

## Core Concepts

### 1. Define the conversion goal before the layout

A landing page needs one primary action that aligns with the visitor’s intent and the business goal. Secondary actions may be useful, but they should not compete with the main action at every scroll position.

```text
Audience: operations leads at growing companies
Visitor problem: manual reporting takes too long
Promise: bring recurring reports into one workflow
Primary action: book a product walkthrough
Secondary action: explore product capabilities
Proof: real interface, verified customer evidence, security details
```

The goal must be observable. “Make the page feel premium” is a design aspiration, not a conversion goal. Decide what action counts as success and how it will be measured before optimizing button placement.

### 2. Write a customer-centered value proposition

The hero headline should communicate a meaningful outcome, not only a category or a slogan. A useful structure is audience or problem plus outcome, with supporting copy that explains how the offer delivers it.

```html
<section class="hero" aria-labelledby="hero-title">
  <p class="eyebrow">Reporting for growing teams</p>
  <h1 id="hero-title">Turn recurring reports into a clear weekly workflow.</h1>
  <p>
    Bring your key metrics and review steps into one shared place,
    so the team spends less time assembling updates.
  </p>
  <a class="button button-primary" href="#product-demo">
    Explore the workflow
  </a>
</section>
```

This copy is illustrative and should be adapted to a real product’s verified capabilities. Do not promise a quantified outcome unless it is supported by evidence.

### 3. Make the first screen answer the essential questions

The hero should orient the visitor quickly: what is this, who is it for, why should I care, and what can I do next? The visual may be a product screenshot, a contextual image, an illustration, or a concise diagram, but it must support the offer rather than distract from it.

```text
Hero content hierarchy
1. Short audience or category cue
2. Outcome-focused headline
3. Concrete supporting explanation
4. Primary call to action
5. Optional lower-emphasis secondary action
6. Relevant visual evidence
```

The hero does not need to explain the entire business. It needs to earn the next scroll or the intended action.

**Gotcha:** a beautiful abstract graphic can occupy half the viewport without helping the visitor understand the offer. Tie the visual to the product, outcome, or workflow.

### 4. Match the action to visitor readiness

A request for a sales call may be appropriate for an enterprise service but too demanding for a visitor who is still learning what a product does. Consider the level of commitment implied by the action.

```text
Low commitment: view examples, read guide, explore features
Medium commitment: start a trial, use a calculator, download a relevant resource
High commitment: book a consultation, request a quote, begin purchase
```

The action should match the product and audience. Do not add a low-value lead magnet merely to collect email addresses if it does not help the visitor make a better decision.

### 5. Use a single visual hierarchy, not a collection of loud sections

A page can contain many sections while maintaining one clear reading path. Use typography, spacing, alignment, and contrast to establish the most important item in each region. Repeated oversized headlines, multiple bright CTA colors, and dense decoration compete for attention.

```css
.hero-title {
  max-width: 12ch;
  font-size: clamp(2.75rem, 7vw, 5.5rem);
  line-height: 0.98;
  letter-spacing: -0.045em;
}

.hero-copy {
  max-width: 58ch;
  line-height: 1.65;
}

.button:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}
```

Typography and spacing values are starting points. Check the actual font, language, and viewport rather than copying a scale without review.

### 6. Build a narrative from problem to proof

A strong page sequence reduces uncertainty step by step. A common structure is problem, outcome, how it works, evidence, objections, and next action. The exact sequence depends on the offer and the visitor’s knowledge.

```text
Hero: the outcome
Problem: why the current approach is difficult
Solution: what changes
How it works: concrete workflow
Proof: evidence that supports the claim
Objections: compatibility, pricing, security, support
CTA: a clear next step
```

This is a planning framework, not a rigid template. If visitors already know the problem, lead with the product. If trust is the main barrier, move credible evidence earlier.

### 7. Show the product or service concretely

A product screenshot, workflow diagram, service photo, sample output, or real artifact can make an abstract claim easier to understand. The visual should show the capability being discussed, with enough annotation to guide attention but not so much that it becomes a miniature user manual.

```html
<figure class="product-visual">
  <img
    src="/images/report-workflow.webp"
    alt="A reporting workspace showing metrics, review status, and the next scheduled update"
    width="1440"
    height="960"
  />
  <figcaption>
    Review the metric, owner, and next step in one shared workflow.
  </figcaption>
</figure>
```

The alt text should convey the information the image adds, not repeat the nearby heading. If the image is purely decorative, use an empty alt attribute. Never use a fabricated interface screenshot as if it were a real customer product.

### 8. Treat trust as evidence, not decoration

Trust signals work when they answer a specific concern. Customer quotes can demonstrate experience; security documentation can address risk; transparent pricing can reduce uncertainty; a real team or service-area detail can establish accountability. Generic badges and logo walls are weak when their relevance is unclear.

```text
Claim: integrates with a particular platform
Evidence: verified integration documentation and an actual working integration

Claim: reduces a manual task
Evidence: a documented workflow comparison or a properly qualified case study

Claim: serves a specific region
Evidence: explicit service-area information and contact details
```

Get approval for testimonials, logos, and metrics. State sample sizes, context, or limitations when they materially affect interpretation. If evidence is unavailable, omit the claim rather than manufacturing proof.

### 9. Design calls to action with explicit outcomes

A button label should explain the next step. “Submit” and “Click here” provide little context. “Request a quote,” “View the sample report,” or “Book a walkthrough” makes the action more predictable.

```html
<a class="button button-primary" href="/book-demo">
  Book a product walkthrough
</a>
<a class="button button-secondary" href="/product">
  Explore product details
</a>
```

Make the primary action visually clear, but ensure it remains accessible and usable at all widths. If an action opens a new tab, triggers a download, or starts a billing process, communicate that behavior where users need to know it.

### 10. Keep navigation proportional to the page goal

A campaign landing page may benefit from simplified navigation, while a product page may need links to pricing, documentation, support, and company details. Removing navigation is not automatically a conversion improvement. Visitors need enough context and a way to resolve uncertainty.

```text
Keep navigation items that help visitors:
- Understand the offer
- Compare plans or capabilities
- Verify trust and company identity
- Reach support or required legal information
```

Avoid hiding critical pricing conditions, privacy information, or terms solely to keep visitors on the page. A clear exit to useful information can increase trust.

### 11. Design mobile-first content flow

Mobile visitors should receive the same essential promise, evidence, and action as desktop visitors. A two-column hero may become a single column, but the order must remain logical. Avoid shrinking desktop content until it fits.

```css
.hero-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(18rem, 0.95fr);
  align-items: center;
  gap: clamp(2rem, 5vw, 5rem);
}

@media (max-width: 760px) {
  .hero-layout {
    grid-template-columns: 1fr;
  }
}
```

Test the mobile order, CTA width, heading wraps, image crop, and navigation behavior. Ensure the main action is not pushed far below an oversized illustration.

### 12. Use responsive typography and spacing

Fixed desktop type sizes can cause awkward wrapping on narrow screens and weak hierarchy on wide screens. Fluid sizing can help, but it must be bounded to prevent extreme values.

```css
.section-title {
  font-size: clamp(2rem, 4vw, 3.75rem);
  line-height: 1.08;
  max-width: 16ch;
}

.section {
  padding-block: clamp(3.5rem, 8vw, 7rem);
  padding-inline: clamp(1.25rem, 5vw, 5rem);
}
```

Check text wrapping with the actual font and content. A `clamp()` expression does not guarantee a good result if the chosen `ch` limit or font metrics are inappropriate.

### 13. Make forms feel clear and low-friction

Only ask for information that is needed for the stated next step. Explain why sensitive or unusual fields are requested. Use labels, helpful descriptions, appropriate autocomplete attributes, and clear inline errors.

```html
<form action="/request-quote" method="post">
  <label for="work-email">Work email</label>
  <input
    id="work-email"
    name="email"
    type="email"
    autocomplete="email"
    required
    aria-describedby="email-help"
  />
  <p id="email-help">We will use this address to respond to your request.</p>
  <button type="submit">Request a quote</button>
</form>
```

Do not make placeholder text the only label. On validation failure, preserve the user's input, explain what needs to change, and move focus or announce errors appropriately.

### 14. Use motion to explain, not delay

Animation can show how a product works, connect sections, or provide feedback. It should not make the visitor wait for the message, hide content until a sequence finishes, or distract from the main action.

```css
.feature-card {
  transition: transform 160ms ease, border-color 160ms ease;
}

.feature-card:hover {
  transform: translateY(-2px);
}

.feature-card:focus-within {
  border-color: var(--color-accent);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Use motion sparingly and test reduced-motion preferences. Avoid scroll-jacking and long intro animations that delay access to the content.

### 15. Make performance part of the visual design

Large hero videos, oversized images, heavy fonts, and animation libraries can make a landing page feel slow. Performance affects whether visitors see the intended hierarchy at all. Prioritize the main content and reserve heavy assets for cases where they add meaningful value.

```html
<img
  src="/images/product-dashboard.webp"
  alt="Product dashboard showing the reporting workflow"
  width="1440"
  height="960"
  fetchpriority="high"
/>
```

Use high fetch priority only for the actual critical image, not every image. Provide intrinsic dimensions to reduce layout shifts, use responsive image sources where appropriate, and lazy-load below-the-fold media. Measure in DevTools and with realistic network throttling.

### 16. Make visual proof accessible

Screenshots and illustrations may contain important details. Give them useful alternative text, and avoid embedding essential instructions only inside an image. If a complex graphic communicates a process, summarize the key information in nearby text or a structured list.

```html
<figure>
  <img
    src="/images/approval-flow.webp"
    alt="Approval flow: a request is reviewed, approved, and added to the weekly report"
    width="1200"
    height="720"
  />
  <figcaption>
    Each request has an owner, review status, and recorded outcome.
  </figcaption>
</figure>
```

For a decorative background that adds no information, use CSS or empty alternative text. Avoid redundant alt text that simply repeats the surrounding heading.

### 17. Make the page accessible by default

Use semantic landmarks, a clear heading hierarchy, meaningful link text, sufficient contrast, visible keyboard focus, and forms with programmatic labels. Visual order and DOM order should tell the same story.

```html
<main>
  <section aria-labelledby="benefits-title">
    <h2 id="benefits-title">What changes for your team</h2>
    <p>Review the workflow, ownership, and next steps together.</p>
    <a href="/workflow">See how the workflow works</a>
  </section>
</main>
```

Every interactive element needs a visible focus state. Do not use a clickable `div` where a link or button is the correct semantic element. Test with keyboard-only navigation and an accessibility tree inspection.

### 18. Create a coherent visual system

Use a consistent type scale, spacing scale, color palette, border treatment, and button system. Landing pages can be expressive, but individual sections should still feel like parts of one product. Reuse patterns where they improve consistency and make exceptions intentional.

```css
:root {
  --space-section: clamp(4rem, 8vw, 7rem);
  --radius-card: 1rem;
  --radius-control: 0.65rem;
  --color-accent: #3868f5;
  --color-text: #17191d;
  --color-muted: #5b626e;
}

.section {
  padding-block: var(--space-section);
}
```

Tokens should reflect a system rather than a random collection of values. Review the full page at once to catch shifts in radii, button sizes, section spacing, and text treatment.

### 19. Address objections honestly

Visitors may need to understand pricing, setup effort, compatibility, support, cancellation, privacy, or limitations before acting. Put answers near the point where the concern arises or in a clearly labeled FAQ. Do not hide material terms behind vague copy.

```html
<section aria-labelledby="compatibility-title">
  <h2 id="compatibility-title">Will it work with our current tools?</h2>
  <p>
    Review the supported integrations before starting. If your setup is not
    listed, contact the team to confirm compatibility.
  </p>
</section>
```

Avoid unsupported promises such as “works with everything.” State known constraints plainly and give visitors a route to resolve remaining questions.

### 20. Use social proof with context

Testimonials, case studies, and usage statistics can reduce uncertainty when they are authentic and relevant. They should not be used as decorative filler or presented without context when the context changes their meaning.

```text
Useful case-study evidence includes:
- Who was involved and what situation they faced
- What changed in the workflow
- How the result was measured
- The period or scope of the comparison
- Important caveats that affect interpretation
```

Never fabricate customer names, quotes, logos, or performance figures. If evidence is anonymized, say so honestly and preserve enough context to make it meaningful.

### 21. Design section transitions as part of the story

A section should follow naturally from the previous one. A problem statement should lead into a solution; a feature should lead into its benefit or proof. Repeated generic sections can make a page feel long without advancing the decision.

```text
Problem -> New approach -> How it works -> Evidence -> Practical details -> Action
```

This sequence is a hypothesis. Test it against audience questions and real user behavior. Reorder content when research shows that visitors need different information earlier.

### 22. Optimize without destroying clarity

A/B testing can help evaluate headlines, calls to action, or section order, but only if the test has a clear hypothesis and a meaningful success metric. Do not optimize click-through rate while ignoring lead quality, task completion, or user confusion.

```text
Hypothesis:
Visitors hesitate because the CTA does not explain the next step.

Change:
Replace “Get started” with “Explore the sample workflow.”

Primary measure:
Qualified visits to the sample workflow.

Guardrails:
Page performance, form completion quality, and support questions.
```

Change one meaningful variable at a time when possible, and do not treat a short-term metric movement as proof of a durable improvement.

### 23. Support privacy and consent honestly

Tracking, cookies, lead forms, and analytics should follow applicable privacy requirements and the product's actual practices. The page must not promise privacy protections that the implementation does not provide.

```text
Before launch:
- Confirm what data each form collects
- Explain the intended use
- Link to the current privacy notice
- Check consent behavior where required
- Verify that analytics events do not contain unnecessary personal data
```

Use clear language and avoid dark patterns such as preselected optional consent or hiding rejection controls. Ask the legal or privacy owner to review requirements that depend on jurisdiction.

### 24. Make error and success feedback part of the page

A form submission is not complete from the visitor’s perspective until the outcome is clear. Provide an explicit success state, a useful error state, and a retry path when appropriate.

```html
<div role="status" aria-live="polite">
  Your request has been received. We will respond using the email you provided.
</div>
```

Use live regions carefully and avoid announcing the same message repeatedly. For errors, associate the message with the affected field and preserve entered values whenever safe.

### 25. Validate the published page in real conditions

Review the page in supported browsers, at different viewport widths, with keyboard navigation, and with realistic network conditions. Design tools cannot reveal every font fallback, image loading issue, browser rendering difference, or layout shift.

```text
Browser QA checklist
1. Check heading order and DOM reading order.
2. Navigate the page using only the keyboard.
3. Verify visible :focus-visible styles.
4. Inspect computed layout and color values in DevTools.
5. Test forms with valid, invalid, and missing values.
6. Test narrow viewports and browser zoom.
7. Review image loading and layout shifts.
8. Check reduced-motion preference.
9. Confirm CTA destinations and form success states.
10. Inspect console errors and network failures.
```

Record issues with browser, viewport, reproduction steps, and expected behavior so that fixes can be verified rather than guessed.

### 26. Measure the visitor journey, not just the button

A page can get clicks without helping visitors complete their goal. Define events that reflect the actual journey, such as starting a form, successfully submitting it, viewing a relevant example, or completing a trial setup. Respect consent and data-minimization requirements.

```text
Useful funnel events may include:
landing_view
primary_cta_activate
form_start
form_validation_error
form_success
demo_booked
```

Event names and definitions should be documented. Avoid collecting sensitive field values in analytics. Use qualitative feedback and support questions alongside metrics to understand why a journey succeeds or fails.

### 27. Design for localization and content changes

A headline that fits in English may wrap very differently in another language. Numbers, dates, currencies, and punctuation can change the width and meaning of content. Components should tolerate longer labels and translated CTA text.

```css
.hero-title {
  max-width: 14ch;
  text-wrap: balance;
}

.button {
  max-width: 100%;
  white-space: normal;
}
```

Do not force every button to stay on one line if doing so causes overflow. Test actual translated content and ensure the layout does not rely on text being a particular length.

### 28. Treat the page as a maintained product surface

A landing page changes as features, pricing, evidence, and positioning change. Outdated screenshots or expired offers can undermine trust. Assign ownership for claims, links, analytics, legal copy, and periodic review.

```text
Release checklist
- Claims have an accountable owner and evidence
- Screenshots match the current product
- Links and forms work
- Privacy and legal information is current
- Analytics events are verified
- Accessibility and responsive checks pass
- Old campaign copy is removed or clearly archived
```

A strong page is not finished when it ships. It is finished for a release when its claims are accurate, its journey works, and the team can maintain it safely.

---

## Relevant Patterns

### Pattern 1: Outcome-first hero

**What it does:** leads with the visitor's desired outcome, then explains the mechanism and provides a clear next step.

**When to use it:** products and services where the audience knows the problem but needs to understand the offer.

```html
<section class="hero" aria-labelledby="hero-heading">
  <p class="eyebrow">For growing operations teams</p>
  <h1 id="hero-heading">Make weekly reporting easier to review.</h1>
  <p>Bring metrics, ownership, and follow-up into one shared workflow.</p>
  <a class="button-primary" href="/workflow">Explore the workflow</a>
</section>
```

Verify that the headline reflects a real capability and that the CTA destination fulfills its promise.

### Pattern 2: Proof beside the promise

**What it does:** places concrete evidence near the claim it supports, reducing the distance between promise and proof.

**When to use it:** unfamiliar products, high-consideration services, or claims that require demonstration.

```text
Claim: “Review every request in one workflow”
Adjacent proof: real product view with owner, status, and next action
Supporting detail: concise caption explaining the visible workflow
```

Do not fabricate product screens or imply that a prototype is a live feature.

### Pattern 3: Progressive objection handling

**What it does:** answers common concerns in the order they are likely to arise.

**When to use it:** products with setup, pricing, privacy, compatibility, or purchasing questions.

```text
Hero: what it is
Workflow: how it works
Proof: why it is credible
Practical details: price, setup, integrations, support
FAQ: remaining objections
CTA: explicit next step
```

Use research and support feedback to choose the order; do not mechanically append a large FAQ to every page.

### Pattern 4: Low-friction form

**What it does:** asks only for necessary information, explains the request, and provides clear validation and success feedback.

**When to use it:** lead requests, consultations, quote forms, and signup flows.

```html
<label for="contact-email">Email address</label>
<input id="contact-email" name="email" type="email"
       autocomplete="email" required />
<button type="submit">Request a consultation</button>
```

Keep labels visible, preserve input after recoverable errors, and tell the visitor what happens next.

### Pattern 5: Mobile content reflow

**What it does:** preserves the meaning and priority of content when a desktop composition becomes a narrow single-column layout.

**When to use it:** every responsive landing page, especially image-heavy hero sections.

```css
.hero-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
}

@media (max-width: 48rem) {
  .hero-grid {
    grid-template-columns: 1fr;
  }
}
```

Verify DOM order and reading order. Do not use visual reordering that makes keyboard navigation confusing.

### Pattern 6: Evidence-led testimonial

**What it does:** connects a real customer experience to a specific problem and outcome.

**When to use it:** when authentic, approved customer evidence is available and relevant to the audience.

```text
Customer context -> Previous problem -> What changed -> Measured result -> Caveat
```

Get permission and verify the quote. Avoid unattributed superlatives and metrics without context.

### Pattern 7: Accessible sticky action

**What it does:** keeps a relevant action available during a long page without covering content or disrupting keyboard access.

**When to use it:** long product pages or mobile flows where the next action remains meaningful throughout the journey.

```css
.sticky-action {
  position: sticky;
  bottom: 0;
  padding: 1rem;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
}

.sticky-action a:focus-visible {
  outline: 3px solid var(--color-accent);
  outline-offset: 3px;
}
```

Check that it does not obscure form fields, captions, browser controls, or focused content. Consider whether a sticky action is actually needed.

### Pattern 8: Conversion experiment with guardrails

**What it does:** tests a specific hypothesis while protecting quality, accessibility, and visitor trust.

**When to use it:** when there is enough traffic or qualitative evidence to justify a structured experiment.

```text
Hypothesis -> Single meaningful change -> Primary metric
-> Guardrail metrics -> Adequate observation window -> Decision
```

Do not optimize clicks at the expense of qualified outcomes, page speed, or truthful communication.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Writing a vague hero headline | Internal product language replaces customer language | State the audience outcome in concrete terms and validate it with target users |
| Putting several primary CTAs in the hero | Teams try to serve every stakeholder at once | Choose one primary action and make secondary actions visually quieter |
| Using an abstract hero image without context | Visual spectacle is mistaken for communication | Show the product, workflow, service, or outcome the headline describes |
| Making unsupported performance claims | Strong metrics seem persuasive | Publish only verified claims with context and a traceable evidence source |
| Using fabricated testimonials or logos | Social proof is treated as decoration | Obtain approved, authentic evidence or omit the section |
| Hiding pricing or material conditions | Conversion is prioritized over informed choice | Explain relevant costs, terms, and limitations near the decision point |
| Asking for unnecessary form fields | Lead volume is valued over user effort | Remove fields that are not needed for the immediate next step |
| Using placeholder text as the only label | Minimal visual styling seems cleaner | Provide a persistent programmatic label and useful hint text |
| Treating the landing page as a static poster | Design review focuses on a screenshot | Test links, keyboard access, forms, responsive states, and error feedback |
| Shrinking desktop layout to fit mobile | Mobile is treated as an afterthought | Recompose content and verify priority, order, and CTA visibility |
| Overusing animation | Motion is used to make the page feel premium | Keep motion short, purposeful, and compatible with reduced-motion preferences |
| Loading oversized hero media | Visual quality is judged without performance cost | Compress media, provide dimensions, and measure actual loading behavior |
| Hiding important content behind hover | Pointer interaction is assumed | Make essential content available in the normal reading and keyboard flow |
| Using low-contrast secondary copy | Secondary information is confused with unimportant information | Check contrast and retain legibility for supporting content |
| Removing navigation without considering intent | Fewer links are assumed to always convert better | Keep links that resolve trust, pricing, product, or support questions |
| Repeating generic sections | A long page is assumed to be persuasive | Give each section a distinct question to answer in the visitor journey |
| Using a testimonial without context | A quote looks compelling in isolation | Include relevant context and verify that the quote supports the claim |
| Measuring only CTA clicks | Clicks are easy to count | Track qualified outcomes and guardrails such as form success and page performance |
| Ignoring localization | Copy is designed only for the original language | Test longer translations, number formats, and responsive text wrapping |
| Forgetting error and success states | Only the happy path is designed | Specify validation, failure, retry, and confirmation behavior before handoff |
| Using a fake product screenshot | A polished mockup seems more attractive | Label prototypes clearly or use an accurate representation of the current product |
| Making a sticky CTA cover content | The action is prioritized over usability | Test small viewports, keyboard focus, and safe-area behavior |
| Ignoring privacy expectations | Form collection is treated as a design-only concern | Explain data use, link current privacy information, and review consent requirements |
| Optimizing without a hypothesis | A/B testing is treated as random experimentation | Write the expected behavior change and define success before testing |
| Relying on a contrast scan alone | Automated passes appear conclusive | Test rendered components, keyboard focus, zoom, and real content |
| Shipping outdated claims or screenshots | No one owns page maintenance | Assign owners and schedule content, link, and product-accuracy reviews |

---

## Mental Models

1. **A landing page is a decision path** — Each section should answer a visitor question or make the next decision easier.
2. **The headline makes a promise** — Supporting copy and evidence must explain and substantiate that promise.
3. **Attention is a limited budget** — Every equally loud button, badge, animation, or headline spends attention that could support the main action.
4. **Proof belongs near the claim** — The visitor should not have to search far to evaluate an important assertion.
5. **Conversion and trust are coupled** — A short-term click gained through confusion can damage long-term confidence.
6. **One page can have many sections but one hierarchy** — Each section may have a local focus while preserving the overall reading path.
7. **Responsive design preserves intent, not pixels** — The mobile page should retain the same priorities even when the composition changes.
8. **Accessibility improves communication** — Semantic markup, labels, focus, and readable contrast make the journey clearer for more people.
9. **Performance is part of perceived quality** — A beautiful page that loads late or shifts unexpectedly fails to deliver its design.
10. **Metrics need guardrails** — Conversion data should be interpreted alongside quality, trust, accessibility, and performance.
11. **Evidence has an owner** — Claims, testimonials, and screenshots need provenance and maintenance.
12. **The published page is a product surface** — It needs monitoring, content updates, regression checks, and a clear release process.

---

## Quick Reference

| Area | Check | Evidence |
|---|---|---|
| Audience | Is the intended visitor clearly defined? | Brief with audience, need, and context |
| Value proposition | Does the headline state a relevant outcome? | User comprehension check |
| CTA | Is the next step explicit and proportionate? | Clear label and working destination |
| Hero | Does the visual support the offer? | Product or outcome evidence |
| Narrative | Does each section advance the decision? | Section-by-section question map |
| Trust | Are claims and testimonials verifiable? | Approved source and context |
| Navigation | Can visitors resolve important questions? | Useful product, pricing, support, and legal links |
| Forms | Are fields necessary and accessible? | Labels, validation, success, and error behavior |
| Mobile | Does priority survive reflow? | Narrow viewport and keyboard review |
| Typography | Are wrapping and hierarchy robust? | Actual font and real content |
| Motion | Does motion support rather than delay? | Reduced-motion review |
| Performance | Are media and fonts appropriately sized? | Network and layout-shift checks |
| Accessibility | Are semantics, contrast, and focus correct? | Keyboard and accessibility-tree review |
| Analytics | Are events tied to real outcomes? | Documented event plan |
| Privacy | Is data use transparent and appropriate? | Current notice and consent review |
| Maintenance | Are page claims and links current? | Named owner and release checklist |

---

## Build Challenge

Design and implement a landing page for a fictional but clearly described analytics product that helps operations teams prepare recurring reports. The page must communicate a truthful value proposition, demonstrate the workflow, establish trust without fabricated evidence, and guide the visitor toward one primary next step.

### Requirements

1. **Define the audience and intent.** Write a one-paragraph brief naming the visitor, their problem, the page goal, and the action that counts as success.
2. **Write an outcome-focused hero.** Include an eyebrow or category cue, a clear headline, supporting copy, and one primary CTA with an explicit destination.
3. **Create a secondary action.** Make it useful but visually subordinate to the primary action.
4. **Show the product concretely.** Use a genuine implementation screenshot, a clearly labeled prototype, or a workflow diagram with accessible text.
5. **Build a section narrative.** Include problem, approach, how it works, evidence or transparent limitations, practical details, and a final CTA.
6. **Add credible proof.** Use real approved evidence if available; otherwise describe the workflow and limitations without inventing customer quotes, logos, or metrics.
7. **Design responsive layouts.** Verify desktop, intermediate, and narrow layouts, including the order of the hero image and CTA.
8. **Build an accessible form or action destination.** Provide semantic labels, validation, keyboard focus, and clear success/error feedback.
9. **Specify a visual system.** Define typography, spacing, colors, buttons, cards, image treatment, and focus styles using reusable tokens.
10. **Respect motion preferences.** Keep motion purposeful and provide a reduced-motion experience.
11. **Check performance.** Optimize images, set intrinsic dimensions, avoid unnecessary animation dependencies, and inspect layout shifts.
12. **Define measurement.** Specify primary conversion and guardrail events without collecting unnecessary personal information.
13. **Test actual interactions.** Verify all links, CTA destinations, form states, navigation, and keyboard behavior.
14. **Document limitations.** State which claims are verified, which capabilities are illustrative, and what evidence would be needed before publishing stronger claims.
15. **Prepare a maintenance checklist.** Include content ownership, claim review, link checks, privacy review, and regression testing.

### Failure and edge conditions

The challenge fails if the headline does not explain the offer, the primary action is unclear, or the visual story depends on fabricated proof. It also fails if the mobile layout hides the main action, form errors are inaccessible, keyboard focus is invisible, reduced-motion preferences are ignored, or analytics measure clicks while ignoring meaningful completion. A page that looks polished but contains broken destinations, outdated claims, or unexplained data collection is not complete.

### Definition of Done

- The intended audience and conversion goal are documented.
- The headline and supporting copy communicate a specific, truthful outcome.
- The primary action has an explicit label and working destination.
- Secondary actions do not overwhelm the main hierarchy.
- Product visuals accurately represent the offer and have appropriate text alternatives.
- Each section answers a distinct visitor question.
- Trust evidence is genuine, approved, and appropriately contextualized.
- Important costs, limitations, and privacy information are not deliberately obscured.
- Forms have labels, accessible errors, and clear confirmation.
- Responsive layouts preserve reading order and action priority.
- Keyboard navigation and visible `:focus-visible` states work throughout.
- Reduced-motion preferences are respected.
- Images and fonts are optimized and layout shifts are checked.
- Analytics measure meaningful outcomes with privacy guardrails.
- The page is tested in supported browsers and realistic viewport sizes.
- A maintenance owner and regression checklist are documented.
