# SKILL: mood-board-creation
**Layer:** 20 — UI/UX Design
**Goal:** Curate and present a coherent, traceable visual direction that aligns stakeholders before detailed interface design and translates inspiration into implementable rules.

---

## Why This Matters (Senior Perspective)

A mood board is a decision-making tool for visual direction, not a collage of attractive images. Its job is to help a team agree on the emotional territory, visual principles, and practical constraints that should guide design before detailed screens are produced. A board can look polished and still fail if it mixes incompatible references, hides the reasoning behind each image, uses unlicensed assets, or leaves the client unable to distinguish an approved direction from an inspirational possibility. Those failures become expensive when a designer has already built a full Figma system around a direction that the client never actually approved.

In production, vague mood boards create familiar problems: the brand becomes a patchwork of trends, a developer receives conflicting references, the landing page looks premium but feels wrong for its audience, typography and imagery fight for attention, or the client interprets a mood image as a promise to reproduce the exact photograph or animation. A strong board narrows choices without pretending that visual inspiration is a finished design. It describes what should be borrowed as a principle—such as quiet editorial pacing, tactile materials, restrained contrast, or optimistic colour—and what must be adapted for the brand, content, accessibility, budget, and delivery channel.

A senior designer builds a narrative around references. Each item earns its place by explaining a specific quality; the designer groups references into a coherent direction, identifies contradictions, and translates mood words into decisions about type, colour, composition, imagery, texture, and motion. Beginners often collect more images to feel productive. Seniors curate fewer, stronger references, name the tension between them, and state how the team will decide whether the direction is working. They also plan for practical constraints: asset rights, responsive crops, readable text, colour contrast, and what can realistically be produced.

For freelance and agency projects, the mood board is a high-leverage alignment checkpoint. It gives stakeholders something concrete to approve before wireframes or high-fidelity screens, makes feedback more specific than “I like it” or “make it pop,” and creates a bridge between brand strategy and interface craft. A useful board is intentionally edited, clearly sourced, and paired with a short creative-direction statement. It is not a substitute for user research, a brand strategy, a component library, or a finished interface; it is the shared visual hypothesis from which those artefacts can be developed.

## Core Concepts


### 1. Start with a creative brief

**Working model.** A useful board begins with audience, context, goal, brand attributes, constraints, and deliverables. Without that frame, references are selected for personal appeal rather than project relevance.

In practice, treat this as a decision that needs evidence rather than a taste-based guess. Start by stating the user or business question, identify the observable signal that would answer it, and record the source and date. A design decision becomes more reliable when another person can reproduce the reasoning without having to agree with the designer's personal preferences.

**Applied example — For a boutique hospitality brand, a brief may emphasise warmth, local character, clear booking information, and practical photography budgets.:**

```html
<section class="research-panel" aria-labelledby="research-panel-title">
  <h2 id="research-panel-title">Start with a creative brief</h2>
  <p>Define audience, purpose, brand attributes, channel, constraints, and approval criteria before collecting images.</p>
  <button class="research-panel__action" type="button">Review evidence</button>
</section>
```

```css
.research-panel {
  max-inline-size: 72rem;
  margin-inline: auto;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  border: 1px solid var(--line, #d8dce3);
  border-radius: 1rem;
  background: var(--surface, #fff);
  color: var(--text, #202735);
}

.research-panel__action {
  min-block-size: 2.75rem;
  padding-inline: 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: var(--accent, #315ee8);
  color: white;
  font: inherit;
  cursor: pointer;
}

.research-panel__action:focus-visible {
  outline: 3px solid var(--focus, #f0a500);
  outline-offset: 3px;
}
```

The markup uses a named section and a real button rather than making a generic container behave like a control. The CSS gives the review surface a bounded reading width, responsive padding, and an explicit keyboard focus state. In a real project, replace the sample copy with the actual evidence or reference being reviewed; keep the underlying structure if it supports the task.

**Naive approach / wrong:** “This looks more modern to me, so it must be the better direction.” That statement has no observable criterion, no evidence trail, and no connection to the audience's task.

**Correct approach:** Write a compact brief and use it as a filter for every reference before it reaches the board.

**Decision check.** Can every reference be tied to the target audience and a stated project goal?

**Gotcha:** Gotcha: Mood words such as “premium” or “modern” are ambiguous until translated into observable design qualities.


### 2. Translate adjectives into visual attributes

**Working model.** Turn abstract words into visual decisions: warmth may mean amber light, human photography, soft edges, and conversational type—not necessarily a beige palette.

In practice, treat this as a decision that needs evidence rather than a taste-based guess. Start by stating the user or business question, identify the observable signal that would answer it, and record the source and date. A design decision becomes more reliable when another person can reproduce the reasoning without having to agree with the designer's personal preferences.

**Applied example — Map “confident but approachable” to strong type hierarchy, generous spacing, direct copy, and human-scale imagery.:**

```html
<section class="research-panel" aria-labelledby="research-panel-title">
  <h2 id="research-panel-title">Translate adjectives into visual attributes</h2>
  <p>For every mood word, list observable choices in typography, colour, imagery, composition, and motion.</p>
  <button class="research-panel__action" type="button">Review evidence</button>
</section>
```

```css
.research-panel {
  max-inline-size: 72rem;
  margin-inline: auto;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  border: 1px solid var(--line, #d8dce3);
  border-radius: 1rem;
  background: var(--surface, #fff);
  color: var(--text, #202735);
}

.research-panel__action {
  min-block-size: 2.75rem;
  padding-inline: 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: var(--accent, #315ee8);
  color: white;
  font: inherit;
  cursor: pointer;
}

.research-panel__action:focus-visible {
  outline: 3px solid var(--focus, #f0a500);
  outline-offset: 3px;
}
```

The markup uses a named section and a real button rather than making a generic container behave like a control. The CSS gives the review surface a bounded reading width, responsive padding, and an explicit keyboard focus state. In a real project, replace the sample copy with the actual evidence or reference being reviewed; keep the underlying structure if it supports the task.

**Naive approach / wrong:** “This looks more modern to me, so it must be the better direction.” That statement has no observable criterion, no evidence trail, and no connection to the audience's task.

**Correct approach:** Create a word-to-attribute map and verify that each visual choice supports the intended personality.

**Decision check.** Could another designer interpret the visual attributes without asking what “premium” means?

**Gotcha:** Gotcha: A single adjective can imply different visual choices in different cultures and product categories.


### 3. Choose reference sources deliberately

**Working model.** Gather references from interfaces, editorial design, photography, architecture, packaging, art, material, motion, and typography when each source contributes a clear principle.

In practice, treat this as a decision that needs evidence rather than a taste-based guess. Start by stating the user or business question, identify the observable signal that would answer it, and record the source and date. A design decision becomes more reliable when another person can reproduce the reasoning without having to agree with the designer's personal preferences.

**Applied example — Use an architectural material reference to communicate texture while using interface references to communicate information density and interaction.:**

```html
<section class="research-panel" aria-labelledby="research-panel-title">
  <h2 id="research-panel-title">Choose reference sources deliberately</h2>
  <p>Give each source a job and note the principle it contributes to the direction.</p>
  <button class="research-panel__action" type="button">Review evidence</button>
</section>
```

```css
.research-panel {
  max-inline-size: 72rem;
  margin-inline: auto;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  border: 1px solid var(--line, #d8dce3);
  border-radius: 1rem;
  background: var(--surface, #fff);
  color: var(--text, #202735);
}

.research-panel__action {
  min-block-size: 2.75rem;
  padding-inline: 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: var(--accent, #315ee8);
  color: white;
  font: inherit;
  cursor: pointer;
}

.research-panel__action:focus-visible {
  outline: 3px solid var(--focus, #f0a500);
  outline-offset: 3px;
}
```

The markup uses a named section and a real button rather than making a generic container behave like a control. The CSS gives the review surface a bounded reading width, responsive padding, and an explicit keyboard focus state. In a real project, replace the sample copy with the actual evidence or reference being reviewed; keep the underlying structure if it supports the task.

**Naive approach / wrong:** “This looks more modern to me, so it must be the better direction.” That statement has no observable criterion, no evidence trail, and no connection to the audience's task.

**Correct approach:** Select sources for a reason and keep source context attached to the asset.

**Decision check.** Is the reason for including each source visible to the person reviewing the board?

**Gotcha:** Gotcha: A reference outside the web can inspire a principle, but it does not prove the principle will work in a responsive UI.


### 4. Curate for coherence, not quantity

**Working model.** A board is a visual argument. A smaller set of related references makes the direction easier to understand and exposes contradictions early.

In practice, treat this as a decision that needs evidence rather than a taste-based guess. Start by stating the user or business question, identify the observable signal that would answer it, and record the source and date. A design decision becomes more reliable when another person can reproduce the reasoning without having to agree with the designer's personal preferences.

**Applied example — Choose six to twelve strong references grouped by role instead of adding every image that feels vaguely relevant.:**

```html
<section class="research-panel" aria-labelledby="research-panel-title">
  <h2 id="research-panel-title">Curate for coherence, not quantity</h2>
  <p>Remove references that do not strengthen the chosen story or clarify a real decision.</p>
  <button class="research-panel__action" type="button">Review evidence</button>
</section>
```

```css
.research-panel {
  max-inline-size: 72rem;
  margin-inline: auto;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  border: 1px solid var(--line, #d8dce3);
  border-radius: 1rem;
  background: var(--surface, #fff);
  color: var(--text, #202735);
}

.research-panel__action {
  min-block-size: 2.75rem;
  padding-inline: 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: var(--accent, #315ee8);
  color: white;
  font: inherit;
  cursor: pointer;
}

.research-panel__action:focus-visible {
  outline: 3px solid var(--focus, #f0a500);
  outline-offset: 3px;
}
```

The markup uses a named section and a real button rather than making a generic container behave like a control. The CSS gives the review surface a bounded reading width, responsive padding, and an explicit keyboard focus state. In a real project, replace the sample copy with the actual evidence or reference being reviewed; keep the underlying structure if it supports the task.

**Naive approach / wrong:** “This looks more modern to me, so it must be the better direction.” That statement has no observable criterion, no evidence trail, and no connection to the audience's task.

**Correct approach:** Remove anything that introduces an unexplained competing visual voice.

**Decision check.** Does every item strengthen the same direction or explicitly represent a purposeful contrast?

**Gotcha:** Gotcha: Similar colours alone do not make references coherent; composition, tone, energy, and audience assumptions matter too.


### 5. Build visual territories

**Working model.** When the direction is uncertain, create two or three genuinely different territories with clear names and rules rather than one board that attempts to satisfy every stakeholder.

In practice, treat this as a decision that needs evidence rather than a taste-based guess. Start by stating the user or business question, identify the observable signal that would answer it, and record the source and date. A design decision becomes more reliable when another person can reproduce the reasoning without having to agree with the designer's personal preferences.

**Applied example — Compare “editorial craft,” “technical precision,” and “playful community” using the same brand brief and evaluation criteria.:**

```html
<section class="research-panel" aria-labelledby="research-panel-title">
  <h2 id="research-panel-title">Build visual territories</h2>
  <p>Make each direction different in strategic personality, not just in colour or decorative treatment.</p>
  <button class="research-panel__action" type="button">Review evidence</button>
</section>
```

```css
.research-panel {
  max-inline-size: 72rem;
  margin-inline: auto;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  border: 1px solid var(--line, #d8dce3);
  border-radius: 1rem;
  background: var(--surface, #fff);
  color: var(--text, #202735);
}

.research-panel__action {
  min-block-size: 2.75rem;
  padding-inline: 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: var(--accent, #315ee8);
  color: white;
  font: inherit;
  cursor: pointer;
}

.research-panel__action:focus-visible {
  outline: 3px solid var(--focus, #f0a500);
  outline-offset: 3px;
}
```

The markup uses a named section and a real button rather than making a generic container behave like a control. The CSS gives the review surface a bounded reading width, responsive padding, and an explicit keyboard focus state. In a real project, replace the sample copy with the actual evidence or reference being reviewed; keep the underlying structure if it supports the task.

**Naive approach / wrong:** “This looks more modern to me, so it must be the better direction.” That statement has no observable criterion, no evidence trail, and no connection to the audience's task.

**Correct approach:** Present distinct options with the same content and criteria so the choice is fair.

**Decision check.** Would the stakeholder describe the territories as meaningfully different without looking at their names?

**Gotcha:** Gotcha: Three territories that differ only in accent colour are not meaningful strategic alternatives.


### 6. Use a hierarchy of reference roles

**Working model.** Distinguish hero references, supporting details, typography, palette, imagery, material, motion, and interaction examples so viewers know what each image is teaching.

In practice, treat this as a decision that needs evidence rather than a taste-based guess. Start by stating the user or business question, identify the observable signal that would answer it, and record the source and date. A design decision becomes more reliable when another person can reproduce the reasoning without having to agree with the designer's personal preferences.

**Applied example — Label a large editorial layout as a composition reference and a small close-up as a texture or type-detail reference.:**

```html
<section class="research-panel" aria-labelledby="research-panel-title">
  <h2 id="research-panel-title">Use a hierarchy of reference roles</h2>
  <p>Label whether a reference teaches composition, type, palette, imagery, material, or interaction.</p>
  <button class="research-panel__action" type="button">Review evidence</button>
</section>
```

```css
.research-panel {
  max-inline-size: 72rem;
  margin-inline: auto;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  border: 1px solid var(--line, #d8dce3);
  border-radius: 1rem;
  background: var(--surface, #fff);
  color: var(--text, #202735);
}

.research-panel__action {
  min-block-size: 2.75rem;
  padding-inline: 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: var(--accent, #315ee8);
  color: white;
  font: inherit;
  cursor: pointer;
}

.research-panel__action:focus-visible {
  outline: 3px solid var(--focus, #f0a500);
  outline-offset: 3px;
}
```

The markup uses a named section and a real button rather than making a generic container behave like a control. The CSS gives the review surface a bounded reading width, responsive padding, and an explicit keyboard focus state. In a real project, replace the sample copy with the actual evidence or reference being reviewed; keep the underlying structure if it supports the task.

**Naive approach / wrong:** “This looks more modern to me, so it must be the better direction.” That statement has no observable criterion, no evidence trail, and no connection to the audience's task.

**Correct approach:** Assign each item a label and visual size according to its importance to the direction.

**Decision check.** Can the viewer tell which references define the direction and which are supporting details?

**Gotcha:** Gotcha: A visually dominant image can accidentally define the whole board even when it was intended as a minor detail.


### 7. Create a controlled colour direction

**Working model.** Extract colour roles and relationships rather than sampling every pixel. Define base, surface, text, accent, and status roles with contrast in mind.

In practice, treat this as a decision that needs evidence rather than a taste-based guess. Start by stating the user or business question, identify the observable signal that would answer it, and record the source and date. A design decision becomes more reliable when another person can reproduce the reasoning without having to agree with the designer's personal preferences.

**Applied example — Build a small palette with primary and supporting roles, then test text and controls against their actual backgrounds.:**

```html
<section class="research-panel" aria-labelledby="research-panel-title">
  <h2 id="research-panel-title">Create a controlled colour direction</h2>
  <p>Assign colours roles and test actual text and control combinations for contrast.</p>
  <button class="research-panel__action" type="button">Review evidence</button>
</section>
```

```css
.research-panel {
  max-inline-size: 72rem;
  margin-inline: auto;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  border: 1px solid var(--line, #d8dce3);
  border-radius: 1rem;
  background: var(--surface, #fff);
  color: var(--text, #202735);
}

.research-panel__action {
  min-block-size: 2.75rem;
  padding-inline: 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: var(--accent, #315ee8);
  color: white;
  font: inherit;
  cursor: pointer;
}

.research-panel__action:focus-visible {
  outline: 3px solid var(--focus, #f0a500);
  outline-offset: 3px;
}
```

The markup uses a named section and a real button rather than making a generic container behave like a control. The CSS gives the review surface a bounded reading width, responsive padding, and an explicit keyboard focus state. In a real project, replace the sample copy with the actual evidence or reference being reviewed; keep the underlying structure if it supports the task.

**Naive approach / wrong:** “This looks more modern to me, so it must be the better direction.” That statement has no observable criterion, no evidence trail, and no connection to the audience's task.

**Correct approach:** Build role-based swatches and run contrast checks on foreground/background pairs.

**Decision check.** Have the proposed colours been tested in actual UI combinations rather than only as swatches?

**Gotcha:** Gotcha: A beautiful colour combination in photography does not automatically provide accessible UI contrast.


### 8. Specify typography and type behaviour

**Working model.** Reference not only font personality but hierarchy, width, line length, density, case, spacing, and how type sits beside imagery.

In practice, treat this as a decision that needs evidence rather than a taste-based guess. Start by stating the user or business question, identify the observable signal that would answer it, and record the source and date. A design decision becomes more reliable when another person can reproduce the reasoning without having to agree with the designer's personal preferences.

**Applied example — Pair a display face with a readable text face and show a heading, paragraph, label, and numerical example.:**

```html
<section class="research-panel" aria-labelledby="research-panel-title">
  <h2 id="research-panel-title">Specify typography and type behaviour</h2>
  <p>Show realistic text lengths and hierarchy rather than relying on a type specimen alone.</p>
  <button class="research-panel__action" type="button">Review evidence</button>
</section>
```

```css
.research-panel {
  max-inline-size: 72rem;
  margin-inline: auto;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  border: 1px solid var(--line, #d8dce3);
  border-radius: 1rem;
  background: var(--surface, #fff);
  color: var(--text, #202735);
}

.research-panel__action {
  min-block-size: 2.75rem;
  padding-inline: 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: var(--accent, #315ee8);
  color: white;
  font: inherit;
  cursor: pointer;
}

.research-panel__action:focus-visible {
  outline: 3px solid var(--focus, #f0a500);
  outline-offset: 3px;
}
```

The markup uses a named section and a real button rather than making a generic container behave like a control. The CSS gives the review surface a bounded reading width, responsive padding, and an explicit keyboard focus state. In a real project, replace the sample copy with the actual evidence or reference being reviewed; keep the underlying structure if it supports the task.

**Naive approach / wrong:** “This looks more modern to me, so it must be the better direction.” That statement has no observable criterion, no evidence trail, and no connection to the audience's task.

**Correct approach:** Test a realistic heading, body paragraph, label, number, and long string before approval.

**Decision check.** Does the type direction work for realistic content, accessibility, and the required language set?

**Gotcha:** Gotcha: A font that looks expressive in a short heading may fail in long content or may have licensing and loading constraints.


### 9. Direct imagery and art direction

**Working model.** Define subject, lighting, crop, point of view, texture, diversity, environment, and emotional tone so imagery feels intentional rather than stock-selected.

In practice, treat this as a decision that needs evidence rather than a taste-based guess. Start by stating the user or business question, identify the observable signal that would answer it, and record the source and date. A design decision becomes more reliable when another person can reproduce the reasoning without having to agree with the designer's personal preferences.

**Applied example — Specify candid human moments and natural side light instead of saying only “use authentic photography.”:**

```html
<section class="research-panel" aria-labelledby="research-panel-title">
  <h2 id="research-panel-title">Direct imagery and art direction</h2>
  <p>Write an image brief that a photographer, image researcher, or generative tool could interpret consistently.</p>
  <button class="research-panel__action" type="button">Review evidence</button>
</section>
```

```css
.research-panel {
  max-inline-size: 72rem;
  margin-inline: auto;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  border: 1px solid var(--line, #d8dce3);
  border-radius: 1rem;
  background: var(--surface, #fff);
  color: var(--text, #202735);
}

.research-panel__action {
  min-block-size: 2.75rem;
  padding-inline: 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: var(--accent, #315ee8);
  color: white;
  font: inherit;
  cursor: pointer;
}

.research-panel__action:focus-visible {
  outline: 3px solid var(--focus, #f0a500);
  outline-offset: 3px;
}
```

The markup uses a named section and a real button rather than making a generic container behave like a control. The CSS gives the review surface a bounded reading width, responsive padding, and an explicit keyboard focus state. In a real project, replace the sample copy with the actual evidence or reference being reviewed; keep the underlying structure if it supports the task.

**Naive approach / wrong:** “This looks more modern to me, so it must be the better direction.” That statement has no observable criterion, no evidence trail, and no connection to the audience's task.

**Correct approach:** Use an art-direction brief that covers subject, crop, lighting, tone, and usage rights.

**Decision check.** Could a producer select or create a consistent image set from the brief?

**Gotcha:** Gotcha: Avoid references that imply demographic stereotypes or a production budget the client cannot support.


### 10. Represent layout and composition

**Working model.** Use references to communicate density, alignment, negative space, asymmetry, framing, and the relationship between content and imagery.

In practice, treat this as a decision that needs evidence rather than a taste-based guess. Start by stating the user or business question, identify the observable signal that would answer it, and record the source and date. A design decision becomes more reliable when another person can reproduce the reasoning without having to agree with the designer's personal preferences.

**Applied example — Mark the intended composition principle beside the reference rather than leaving viewers to infer it.:**

```html
<section class="research-panel" aria-labelledby="research-panel-title">
  <h2 id="research-panel-title">Represent layout and composition</h2>
  <p>Annotate the spatial principle and test how it adapts to narrow screens.</p>
  <button class="research-panel__action" type="button">Review evidence</button>
</section>
```

```css
.research-panel {
  max-inline-size: 72rem;
  margin-inline: auto;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  border: 1px solid var(--line, #d8dce3);
  border-radius: 1rem;
  background: var(--surface, #fff);
  color: var(--text, #202735);
}

.research-panel__action {
  min-block-size: 2.75rem;
  padding-inline: 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: var(--accent, #315ee8);
  color: white;
  font: inherit;
  cursor: pointer;
}

.research-panel__action:focus-visible {
  outline: 3px solid var(--focus, #f0a500);
  outline-offset: 3px;
}
```

The markup uses a named section and a real button rather than making a generic container behave like a control. The CSS gives the review surface a bounded reading width, responsive padding, and an explicit keyboard focus state. In a real project, replace the sample copy with the actual evidence or reference being reviewed; keep the underlying structure if it supports the task.

**Naive approach / wrong:** “This looks more modern to me, so it must be the better direction.” That statement has no observable criterion, no evidence trail, and no connection to the audience's task.

**Correct approach:** Add layout sketches or viewport notes that expose responsive trade-offs.

**Decision check.** Does the composition principle survive a narrow viewport and longer-than-expected copy?

**Gotcha:** Gotcha: A static collage can hide whether the composition depends on a wide desktop viewport.


### 11. Include motion and interaction mood

**Working model.** If motion matters, use a short labelled clip, sequence, or storyboard to show timing, easing, responsiveness, and purpose.

In practice, treat this as a decision that needs evidence rather than a taste-based guess. Start by stating the user or business question, identify the observable signal that would answer it, and record the source and date. A design decision becomes more reliable when another person can reproduce the reasoning without having to agree with the designer's personal preferences.

**Applied example — Describe motion as “slow reveal that supports reading” or “snappy state feedback” rather than “cool animation.”:**

```html
<section class="research-panel" aria-labelledby="research-panel-title">
  <h2 id="research-panel-title">Include motion and interaction mood</h2>
  <p>Show a sequence or storyboard and state what the motion communicates to the user.</p>
  <button class="research-panel__action" type="button">Review evidence</button>
</section>
```

```css
.research-panel {
  max-inline-size: 72rem;
  margin-inline: auto;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  border: 1px solid var(--line, #d8dce3);
  border-radius: 1rem;
  background: var(--surface, #fff);
  color: var(--text, #202735);
}

.research-panel__action {
  min-block-size: 2.75rem;
  padding-inline: 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: var(--accent, #315ee8);
  color: white;
  font: inherit;
  cursor: pointer;
}

.research-panel__action:focus-visible {
  outline: 3px solid var(--focus, #f0a500);
  outline-offset: 3px;
}
```

The markup uses a named section and a real button rather than making a generic container behave like a control. The CSS gives the review surface a bounded reading width, responsive padding, and an explicit keyboard focus state. In a real project, replace the sample copy with the actual evidence or reference being reviewed; keep the underlying structure if it supports the task.

**Naive approach / wrong:** “This looks more modern to me, so it must be the better direction.” That statement has no observable criterion, no evidence trail, and no connection to the audience's task.

**Correct approach:** Document trigger, duration character, user purpose, reduced-motion alternative, and performance risk.

**Decision check.** Does the motion serve a user purpose and have an accessible reduced-motion alternative?

**Gotcha:** Gotcha: Motion references must be checked against reduced-motion needs and performance budgets.


### 12. Annotate why each reference belongs

**Working model.** A note connects the image to the design decision it informs and prevents the client from assuming that every detail should be copied.

In practice, treat this as a decision that needs evidence rather than a taste-based guess. Start by stating the user or business question, identify the observable signal that would answer it, and record the source and date. A design decision becomes more reliable when another person can reproduce the reasoning without having to agree with the designer's personal preferences.

**Applied example — Write “use the large type-to-image ratio, not this exact brand colour or photograph.”:**

```html
<section class="research-panel" aria-labelledby="research-panel-title">
  <h2 id="research-panel-title">Annotate why each reference belongs</h2>
  <p>Write a specific note describing what to borrow and what not to copy.</p>
  <button class="research-panel__action" type="button">Review evidence</button>
</section>
```

```css
.research-panel {
  max-inline-size: 72rem;
  margin-inline: auto;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  border: 1px solid var(--line, #d8dce3);
  border-radius: 1rem;
  background: var(--surface, #fff);
  color: var(--text, #202735);
}

.research-panel__action {
  min-block-size: 2.75rem;
  padding-inline: 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: var(--accent, #315ee8);
  color: white;
  font: inherit;
  cursor: pointer;
}

.research-panel__action:focus-visible {
  outline: 3px solid var(--focus, #f0a500);
  outline-offset: 3px;
}
```

The markup uses a named section and a real button rather than making a generic container behave like a control. The CSS gives the review surface a bounded reading width, responsive padding, and an explicit keyboard focus state. In a real project, replace the sample copy with the actual evidence or reference being reviewed; keep the underlying structure if it supports the task.

**Naive approach / wrong:** “This looks more modern to me, so it must be the better direction.” That statement has no observable criterion, no evidence trail, and no connection to the audience's task.

**Correct approach:** Attach a “borrow / adapt / avoid” note to every important reference.

**Decision check.** Does every major image explain what to borrow and what should remain unique?

**Gotcha:** Gotcha: Unannotated images often trigger feedback about surface details instead of the intended principle.


### 13. Respect source, rights, and representation

**Working model.** Track creator, source URL, usage rights, date accessed, and whether an image is for internal inspiration or approved production use.

In practice, treat this as a decision that needs evidence rather than a taste-based guess. Start by stating the user or business question, identify the observable signal that would answer it, and record the source and date. A design decision becomes more reliable when another person can reproduce the reasoning without having to agree with the designer's personal preferences.

**Applied example — Use licensed or permissioned assets for final delivery and clearly label placeholders that are inspiration-only.:**

```html
<section class="research-panel" aria-labelledby="research-panel-title">
  <h2 id="research-panel-title">Respect source, rights, and representation</h2>
  <p>Record attribution and rights status beside each image or in a linked source ledger.</p>
  <button class="research-panel__action" type="button">Review evidence</button>
</section>
```

```css
.research-panel {
  max-inline-size: 72rem;
  margin-inline: auto;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  border: 1px solid var(--line, #d8dce3);
  border-radius: 1rem;
  background: var(--surface, #fff);
  color: var(--text, #202735);
}

.research-panel__action {
  min-block-size: 2.75rem;
  padding-inline: 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: var(--accent, #315ee8);
  color: white;
  font: inherit;
  cursor: pointer;
}

.research-panel__action:focus-visible {
  outline: 3px solid var(--focus, #f0a500);
  outline-offset: 3px;
}
```

The markup uses a named section and a real button rather than making a generic container behave like a control. The CSS gives the review surface a bounded reading width, responsive padding, and an explicit keyboard focus state. In a real project, replace the sample copy with the actual evidence or reference being reviewed; keep the underlying structure if it supports the task.

**Naive approach / wrong:** “This looks more modern to me, so it must be the better direction.” That statement has no observable criterion, no evidence trail, and no connection to the audience's task.

**Correct approach:** Separate internal inspiration from cleared production assets and verify inclusive representation.

**Decision check.** Are creator/source details and production-use permissions traceable?

**Gotcha:** Gotcha: Publicly viewable does not mean free to reuse; mood-board approval is not an asset licence.


### 14. Present and validate the direction

**Working model.** Explain the brief, show the visual territories, state the chosen principles, and invite feedback against goals rather than personal preference.

In practice, treat this as a decision that needs evidence rather than a taste-based guess. Start by stating the user or business question, identify the observable signal that would answer it, and record the source and date. A design decision becomes more reliable when another person can reproduce the reasoning without having to agree with the designer's personal preferences.

**Applied example — Ask stakeholders which direction best supports the target audience and why, then capture the decision and open questions.:**

```html
<section class="research-panel" aria-labelledby="research-panel-title">
  <h2 id="research-panel-title">Present and validate the direction</h2>
  <p>Ask for feedback against the brief and document the decision, dissent, and unresolved questions.</p>
  <button class="research-panel__action" type="button">Review evidence</button>
</section>
```

```css
.research-panel {
  max-inline-size: 72rem;
  margin-inline: auto;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  border: 1px solid var(--line, #d8dce3);
  border-radius: 1rem;
  background: var(--surface, #fff);
  color: var(--text, #202735);
}

.research-panel__action {
  min-block-size: 2.75rem;
  padding-inline: 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: var(--accent, #315ee8);
  color: white;
  font: inherit;
  cursor: pointer;
}

.research-panel__action:focus-visible {
  outline: 3px solid var(--focus, #f0a500);
  outline-offset: 3px;
}
```

The markup uses a named section and a real button rather than making a generic container behave like a control. The CSS gives the review surface a bounded reading width, responsive padding, and an explicit keyboard focus state. In a real project, replace the sample copy with the actual evidence or reference being reviewed; keep the underlying structure if it supports the task.

**Naive approach / wrong:** “This looks more modern to me, so it must be the better direction.” That statement has no observable criterion, no evidence trail, and no connection to the audience's task.

**Correct approach:** Use structured questions and capture the chosen territory plus the reason for choosing it.

**Decision check.** Is the approval decision tied to the brief rather than a popularity vote alone?

**Gotcha:** Gotcha: A stakeholder vote can reveal preference, but it does not prove usability or market effectiveness.


### 15. Translate the board into design rules

**Working model.** Convert approved direction into type roles, colour tokens, image rules, layout principles, motion guidance, and explicit exclusions.

In practice, treat this as a decision that needs evidence rather than a taste-based guess. Start by stating the user or business question, identify the observable signal that would answer it, and record the source and date. A design decision becomes more reliable when another person can reproduce the reasoning without having to agree with the designer's personal preferences.

**Applied example — Create a one-page direction spec before moving into high-fidelity screens or a component system.:**

```html
<section class="research-panel" aria-labelledby="research-panel-title">
  <h2 id="research-panel-title">Translate the board into design rules</h2>
  <p>Convert approved inspiration into explicit tokens, rules, exclusions, and next design tasks.</p>
  <button class="research-panel__action" type="button">Review evidence</button>
</section>
```

```css
.research-panel {
  max-inline-size: 72rem;
  margin-inline: auto;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  border: 1px solid var(--line, #d8dce3);
  border-radius: 1rem;
  background: var(--surface, #fff);
  color: var(--text, #202735);
}

.research-panel__action {
  min-block-size: 2.75rem;
  padding-inline: 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: var(--accent, #315ee8);
  color: white;
  font: inherit;
  cursor: pointer;
}

.research-panel__action:focus-visible {
  outline: 3px solid var(--focus, #f0a500);
  outline-offset: 3px;
}
```

The markup uses a named section and a real button rather than making a generic container behave like a control. The CSS gives the review surface a bounded reading width, responsive padding, and an explicit keyboard focus state. In a real project, replace the sample copy with the actual evidence or reference being reviewed; keep the underlying structure if it supports the task.

**Naive approach / wrong:** “This looks more modern to me, so it must be the better direction.” That statement has no observable criterion, no evidence trail, and no connection to the audience's task.

**Correct approach:** Publish a small direction spec that designers and developers can implement consistently.

**Decision check.** Can a designer start a wireframe or component spec without guessing the approved principles?

**Gotcha:** Gotcha: A mood board is not a substitute for testing actual interface contrast, responsive behaviour, or content fit.


## Relevant Patterns / Integration Patterns / Advanced Patterns


### Pattern 1: Brief-first curation

**What it does:** Use the brief as a gate for all references and remove anything that cannot be tied to an audience or goal.

**When to use it:** When a board starts to feel like a Pinterest feed rather than a clear direction.

```text
Pattern: Brief-first curation
1. State the question this pattern must answer.
2. Gather comparable evidence from the same audience/task context.
3. Separate observation from interpretation.
4. Record the implication and the next validation step.
```

**Operational note:** Keep the brief visible during review so new stakeholder requests can be assessed consistently.


### Pattern 2: Three-territory exploration

**What it does:** Create a small set of strategically distinct directions and compare them against the same criteria.

**When to use it:** When the client has not yet agreed on personality or visual positioning.

```text
Pattern: Three-territory exploration
1. State the question this pattern must answer.
2. Gather comparable evidence from the same audience/task context.
3. Separate observation from interpretation.
4. Record the implication and the next validation step.
```

**Operational note:** Do not make all territories equally bland to avoid a decision; each should express a clear point of view.


### Pattern 3: Borrow / adapt / avoid annotation

**What it does:** Explain which principle is inspirational, what must change for the project, and what should not be reproduced.

**When to use it:** When stakeholders reference existing brands or when an image is visually strong but contextually unsuitable.

```text
Pattern: Borrow / adapt / avoid annotation
1. State the question this pattern must answer.
2. Gather comparable evidence from the same audience/task context.
3. Separate observation from interpretation.
4. Record the implication and the next validation step.
```

**Operational note:** This pattern reduces accidental imitation and keeps the project recognisable as its own brand.


### Pattern 4: Role-based reference grid

**What it does:** Group assets by typography, colour, imagery, layout, material, iconography, and motion instead of arranging them randomly.

**When to use it:** When the board must guide a team across multiple pages or deliverables.

```text
Pattern: Role-based reference grid
1. State the question this pattern must answer.
2. Gather comparable evidence from the same audience/task context.
3. Separate observation from interpretation.
4. Record the implication and the next validation step.
```

**Operational note:** A grid is only an organisational device; the narrative must still explain how the roles work together.


### Pattern 5: Mood-to-token bridge

**What it does:** Translate the approved visual direction into a small first-pass token and rule sheet.

**When to use it:** When moving from creative direction into Figma, CSS, or a component library.

```text
Pattern: Mood-to-token bridge
1. State the question this pattern must answer.
2. Gather comparable evidence from the same audience/task context.
3. Separate observation from interpretation.
4. Record the implication and the next validation step.
```

**Operational note:** Treat the token sheet as a starting point and test it in actual content and interaction states.


### Pattern 6: Client review protocol

**What it does:** Guide stakeholders through a short, evidence-oriented review rather than an unstructured taste vote.

**When to use it:** When the board is a milestone in a freelance or agency approval process.

```text
Pattern: Client review protocol
1. State the question this pattern must answer.
2. Gather comparable evidence from the same audience/task context.
3. Separate observation from interpretation.
4. Record the implication and the next validation step.
```

**Operational note:** Record disagreement and open questions; do not hide dissent behind a single thumbs-up.


## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|

| Starting without a brief | Personal taste replaces project fit | Write audience, goal, personality, channel, constraints, and approval criteria first. |

| Collecting too many references | Quantity creates noise and makes the direction hard to explain | Set a reference limit and remove items that do not teach a distinct principle. |

| Mixing incompatible aesthetics | Each image represents a different brand personality | Name the intended territory and remove contradictions or label them as alternatives. |

| Using vague mood words alone | Terms such as modern or premium have many interpretations | Translate each adjective into visible choices and concrete examples. |

| Showing no rationale | Stakeholders react to incidental image details | Add a sentence explaining what each key reference contributes. |

| Making territories differ only by colour | The options do not represent meaningful strategic alternatives | Vary composition, typography, imagery, density, tone, and interaction principles. |

| Treating inspiration as a final spec | A collage cannot answer responsive or component-level questions | Create a direction spec and validate it in actual screens. |

| Ignoring content realism | Short sample text hides type and layout problems | Test realistic headings, paragraphs, labels, and long strings. |

| Skipping contrast checks | Palette harmony is prioritised over readable interfaces | Check foreground/background combinations for text, controls, and focus indicators. |

| Using unlicensed imagery | Public availability is confused with reuse permission | Track creator and rights, and replace inspiration-only assets before production. |

| Overfitting to one hero image | A single dramatic image dictates every design choice | Use several references for different roles and test the system across content types. |

| Ignoring motion accessibility | Motion is treated as decoration without user control | Document purpose, reduced-motion behaviour, and a non-motion equivalent. |

| Copying a competitor's signature | Inspiration becomes imitation and weakens differentiation | Extract the principle and create original copy, assets, composition, and brand treatment. |

| Failing to record the decision | Teams revisit the same debate after handoff | Record the selected territory, rationale, approver, date, and unresolved issues. |

| Not considering production constraints | The chosen direction depends on costly photography or unsupported effects | List budget, asset availability, technical limits, and maintenance needs early. |

| Using board approval as usability proof | Stakeholder preference is mistaken for user success | Test the resulting interface with target users and check accessibility independently. |


## Mental Models


1. **A mood board is a hypothesis** — It expresses a visual direction that must be tested in real layouts, not a finished design.

2. **Every reference must teach something** — If an image adds no principle, constraint, or useful contrast, it is decoration.

3. **Words need visual translations** — A mood adjective becomes useful only when it leads to observable choices.

4. **Coherence is a relationship** — References work together through hierarchy, tone, material, composition, and purpose—not just matching colours.

5. **Approval is a decision record** — The goal is not universal enthusiasm; it is a documented direction and known trade-offs.

6. **Inspiration is not permission** — Reference use and production use have different rights and attribution requirements.

7. **The board should reduce uncertainty** — A good board narrows the next design decisions rather than generating endless options.

8. **Visual direction must survive implementation** — Responsive content, accessible contrast, and production constraints are part of the direction—not afterthoughts.


## Quick Reference

| Situation | Recommended move | Evidence to capture |
|---|---|---|

| Starting a new brand site | Write the brief and visual attributes before searching | Audience, goals, constraints, approval criteria |

| Client says “make it premium” | Translate the word into type, spacing, colour, imagery, and motion | Word-to-attribute map |

| References feel random | Group by role and remove contradictory items | Curated grid with rationale |

| Stakeholders disagree | Create distinct territories and compare against shared criteria | Territory comparison |

| A reference is from a competitor | Annotate borrow, adapt, and avoid principles | Source and adaptation note |

| Choosing a palette | Assign semantic roles and test contrast | Role-based swatches and contrast checks |

| Choosing typography | Show realistic headings, paragraphs, labels, and data | Type specimen in context |

| Imagery direction is vague | Specify subject, lighting, crop, point of view, and tone | Art-direction brief |

| Motion is part of the brand | Show sequence, trigger, timing character, and reduced-motion option | Storyboard or labelled clip |

| Preparing for client review | Ask questions tied to audience and goals | Decision log |

| Handing direction to developers | Translate mood into tokens and implementation rules | Direction spec |

| Preparing production assets | Verify rights, creator, resolution, and format | Asset/source ledger |


## Build Challenge

### Build: Visual Direction Approval Board

Create a client-ready mood-board package for a fictional independent travel studio launching a responsive website. The studio wants to feel curious, grounded, and locally knowledgeable without looking like a generic luxury travel brand. The budget is moderate, the site must work on mobile, and production imagery may be limited. Your package must help the client approve a direction before detailed UI design begins.

Deliver a review-ready artifact, not a pile of screenshots. The work should make the reasoning legible to a client, developer, or another designer who did not participate in the research. Use clear headings, meaningful labels, accessible semantic structure, and visible source notes. When presenting the result, distinguish facts from hypotheses and recommendations.

**Requirements**


1. Write a concise creative brief covering audience, goal, brand attributes, channel, budget, and constraints.

2. Translate the three brand attributes into at least four observable design decisions each.

3. Create three genuinely distinct visual territories and explain their strategic differences.

4. Curate a focused set of references for typography, colour, imagery, composition, materials, and motion.

5. Label the role and rationale of every major reference; include source URL, creator where known, and capture date.

6. Mark each reference as inspiration-only, licensed for production, or rights status unknown.

7. Include a role-based colour direction and demonstrate text contrast checks for key combinations.

8. Show realistic typography samples with a heading, body paragraph, button label, and long content case.

9. Write an art-direction brief for at least three image types, including subject, crop, lighting, tone, and representation considerations.

10. Include one mobile composition note and one reduced-motion note for any animated reference.

11. Annotate key references with borrow, adapt, and avoid guidance so the board cannot be mistaken for a copying brief.

12. Choose one territory using the brief-based criteria and record the rationale plus remaining risks.

13. Translate the selected territory into a first-pass design rule sheet for type, colour, spacing, imagery, and motion.

14. Run the failure drill by challenging one reference or design decision and revising or downgrading it if the evidence is weak.

15. Present the package with semantic headings, accessible labels, readable contrast, and keyboard-visible focus states.


### Definition of Done / Success Criteria


- [ ] The board communicates one coherent direction while preserving meaningful distinctions between the explored territories.

- [ ] Every major reference has a role, rationale, and traceable source.

- [ ] Abstract mood words are translated into visible design decisions.

- [ ] Rights status distinguishes inspiration-only material from approved production assets.

- [ ] Colour and typography are tested in realistic interface contexts rather than only as decorative swatches.

- [ ] Mobile behaviour, motion accessibility, budget, and asset production constraints are documented.

- [ ] The chosen direction includes explicit borrow/adapt/avoid guidance and a next-step rule sheet.

- [ ] Client feedback can be captured as decisions and open questions rather than unstructured taste comments.


### Failure drill

Ask a teammate to challenge one of the strongest recommendations. Remove the visual polish from the presentation and check whether the evidence still supports the conclusion. If the recommendation collapses when the style is stripped away, label it as a hypothesis, collect the missing evidence, and revise the artifact rather than defending a weak claim.

### Debug checklist

- Can every important conclusion be traced to a source, observation, or explicit hypothesis?
- Are comparisons made on equivalent tasks, devices, content types, and audience needs?
- Have you checked the actual interface in browser DevTools at desktop and narrow viewport widths where a website is part of the review?
- Are links, buttons, headings, and form controls semantic and keyboard reachable, with visible `:focus-visible` states?
- Does the artifact explain what should be done next, who should do it, and what evidence would confirm success?
- Are image rights, source credits, dates, and assumptions visible enough for a client handoff?

### Browser and tooling notes

Use browser DevTools to inspect responsive behaviour, typography, image crops, interaction states, and contrast when reviewing live sites. Browser support varies for newer CSS features; test the actual target browsers rather than assuming that a reference screenshot proves compatibility. Figma, a spreadsheet, a shared document, and a simple screenshot archive can all work, provided the method is consistent and evidence is traceable.

## Production Protocol: From Inspiration to a Usable Design Direction

### Practice Note 1: Preparing the canvas

Use a clear grid and consistent reference sizing, but allow one or two dominant images when they carry the central idea. Keep labels, captions, and source notes readable. On a digital board, make sure the zoomed-out view communicates the whole story and the zoomed-in view supports inspection.

**Apply it:** Write down the decision, the evidence that supports it, the assumption that remains, and the smallest next action that could resolve the uncertainty. For this skill, a complete note should be usable by someone who was not in the original meeting.

### Practice Note 2: Building a narrative

Organise the board in a sequence: project intent, audience, territories, selected direction, visual evidence, and implementation implications. A board should answer “why this direction?” before asking stakeholders to approve details. Avoid placing every source at the same visual weight.

**Apply it:** Write down the decision, the evidence that supports it, the assumption that remains, and the smallest next action that could resolve the uncertainty. For this skill, a complete note should be usable by someone who was not in the original meeting.

### Practice Note 3: Managing stakeholder feedback

Ask reviewers to respond to the brief and the intended audience. Useful prompts include: what feels credible, what feels inconsistent, what is missing for the audience, and what constraint might make this direction difficult to implement? Capture exact decisions, unresolved questions, and the person responsible for resolving each one.

**Apply it:** Write down the decision, the evidence that supports it, the assumption that remains, and the smallest next action that could resolve the uncertainty. For this skill, a complete note should be usable by someone who was not in the original meeting.

### Practice Note 4: Handling disagreement

When stakeholders prefer different references, identify the underlying need behind each preference. One person may be reacting to warmth, another to clarity, and another to familiarity. These qualities may be combined without merging incompatible visual styles. If they cannot be reconciled, present a deliberate trade-off rather than an incoherent compromise.

**Apply it:** Write down the decision, the evidence that supports it, the assumption that remains, and the smallest next action that could resolve the uncertainty. For this skill, a complete note should be usable by someone who was not in the original meeting.

### Practice Note 5: Using generative image tools responsibly

If generated images are used as exploratory references, label them as generated and do not imply that they depict a real customer, place, or production asset. Check for visual artefacts, stereotypes, impossible details, and accidental imitation. Replace generated placeholders with properly licensed or commissioned assets before launch.

**Apply it:** Write down the decision, the evidence that supports it, the assumption that remains, and the smallest next action that could resolve the uncertainty. For this skill, a complete note should be usable by someone who was not in the original meeting.

### Practice Note 6: Accessibility in visual direction

Accessible design is not a separate aesthetic applied after approval. Contrast, focus visibility, text size, motion sensitivity, and non-colour cues should be considered while the visual system is being chosen. A beautiful palette that cannot support readable text is not a viable interface direction.

**Apply it:** Write down the decision, the evidence that supports it, the assumption that remains, and the smallest next action that could resolve the uncertainty. For this skill, a complete note should be usable by someone who was not in the original meeting.

### Practice Note 7: Responsive interpretation

A reference may depend on a wide canvas, a large image, or a carefully art-directed crop. State how the principle should adapt at narrow widths: reorder content, crop differently, reduce decoration, or switch to a simpler composition. Do not promise pixel-identical reproduction across all viewports.

**Apply it:** Write down the decision, the evidence that supports it, the assumption that remains, and the smallest next action that could resolve the uncertainty. For this skill, a complete note should be usable by someone who was not in the original meeting.

### Practice Note 8: Asset production planning

Identify whether imagery can be sourced, licensed, photographed, illustrated, or generated. Note aspect ratios, likely crop needs, file formats, and who owns production. A visual direction that depends on a custom shoot should not be approved without discussing its cost and schedule.

**Apply it:** Write down the decision, the evidence that supports it, the assumption that remains, and the smallest next action that could resolve the uncertainty. For this skill, a complete note should be usable by someone who was not in the original meeting.

### Practice Note 9: Handoff to the design system

The board should produce a small number of reusable rules, not a large set of arbitrary values. Define initial roles for type, colour, spacing, imagery, borders, iconography, and motion, then validate those roles in real screens before locking them as tokens.

**Apply it:** Write down the decision, the evidence that supports it, the assumption that remains, and the smallest next action that could resolve the uncertainty. For this skill, a complete note should be usable by someone who was not in the original meeting.

### Review meeting agenda

1. Restate the project question and the audience affected.
2. Review evidence and its limitations before discussing recommendations.
3. Identify the two most important opportunities or direction principles.
4. Name risks, constraints, and unresolved questions.
5. Agree on an owner, next step, and validation signal for each decision.

### Documentation standard

Every exported report or board should include a title, project context, author or owner, version, date, source notes, and a short decision summary. Avoid relying on colour alone to communicate status. Use meaningful headings, descriptive links, semantic lists, and visible keyboard focus where the artifact is interactive. If the document is a static PDF, preserve readable contrast and ensure labels remain legible when viewed on a laptop screen or printed at ordinary size.

