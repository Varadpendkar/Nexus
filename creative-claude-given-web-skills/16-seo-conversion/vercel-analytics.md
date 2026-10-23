---
# SKILL: vercel-analytics
**Layer:** 16 — SEO / Conversion
**Goal:** Install and operate Vercel Analytics with privacy-aware event design, meaningful portfolio metrics, and reliable production verification.
---
## Why This Matters (Senior Perspective)
Analytics is useful only when it answers a decision. A portfolio owner may need to know which case studies attract relevant visitors, whether contact actions complete, and whether a redesign improves qualified inquiries. Installing a script without defining those questions creates dashboards full of page views that do not explain what to improve.

Measurement must also respect privacy and platform constraints. Do not send names, email addresses, message contents, or other personal information as event properties. Confirm the product's current consent, retention, and data-processing behavior for the deployment and jurisdiction instead of assuming every analytics tool has identical defaults. Keep analytics failure non-blocking so a tracking outage never prevents the portfolio from rendering or a form from submitting.
---
## Core Concepts
### 1. Questions before events
Define a small set of decisions: discovery, project interest, and contact completion. Every event should map to a decision or be removed.


```tsx
import { Analytics } from "@vercel/analytics/react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (<>
    {children}
    <Analytics /> {/* Mount once; analytics must not gate rendering. */}
  </>);
}
```

**Before / after.** Before: the implementation treats “questions before events” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Define a small set of decisions: discovery, project interest, and contact completion. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Questions before events is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 2. Installation and framework integration
Use the documented package and component for the actual framework. Place the analytics component at the application shell level so route transitions are measured consistently.


```tsx
import { Analytics } from "@vercel/analytics/react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (<>
    {children}
    <Analytics /> {/* Mount once; analytics must not gate rendering. */}
  </>);
}
```

**Before / after.** Before: the implementation treats “installation and framework integration” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Use the documented package and component for the actual framework. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Installation and framework integration is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 3. Page views and client navigation
Single-page applications may change routes without a full reload. Verify that route transitions are captured and avoid duplicate page-view events from overlapping automatic and manual tracking.


```tsx
import { Analytics } from "@vercel/analytics/react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (<>
    {children}
    <Analytics /> {/* Mount once; analytics must not gate rendering. */}
  </>);
}
```

**Before / after.** Before: the implementation treats “page views and client navigation” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Single-page applications may change routes without a full reload. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Page views and client navigation is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 4. Custom event schema
Use stable, lowercase event names and a small allowlist of non-sensitive properties such as project slug or CTA location. Do not include free-text form values.


```tsx
import { Analytics } from "@vercel/analytics/react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (<>
    {children}
    <Analytics /> {/* Mount once; analytics must not gate rendering. */}
  </>);
}
```

**Before / after.** Before: the implementation treats “custom event schema” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Use stable, lowercase event names and a small allowlist of non-sensitive properties such as project slug or CTA location. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Custom event schema is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 5. Privacy and consent
Understand the deployed configuration, consent obligations, and privacy notice. If consent is required, gate optional analytics until the applicable choice is recorded.


```tsx
import { Analytics } from "@vercel/analytics/react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (<>
    {children}
    <Analytics /> {/* Mount once; analytics must not gate rendering. */}
  </>);
}
```

**Before / after.** Before: the implementation treats “privacy and consent” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Understand the deployed configuration, consent obligations, and privacy notice. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Privacy and consent is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 6. Development versus production
Keep local preview traffic distinguishable from production and avoid treating test submissions as real leads. Verify the correct project and environment are connected.


```tsx
import { Analytics } from "@vercel/analytics/react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (<>
    {children}
    <Analytics /> {/* Mount once; analytics must not gate rendering. */}
  </>);
}
```

**Before / after.** Before: the implementation treats “development versus production” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Keep local preview traffic distinguishable from production and avoid treating test submissions as real leads. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Development versus production is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 7. Performance and failure isolation
Analytics must not block critical rendering or navigation. Avoid synchronous custom network calls and ensure event calls are not prerequisites for form success.


```tsx
import { Analytics } from "@vercel/analytics/react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (<>
    {children}
    <Analytics /> {/* Mount once; analytics must not gate rendering. */}
  </>);
}
```

**Before / after.** Before: the implementation treats “performance and failure isolation” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Analytics must not block critical rendering or navigation. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Performance and failure isolation is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 8. Dashboard interpretation
Segment by landing page, referrer, device, and event where available. Beware small samples, bots, and attribution gaps.


```tsx
import { Analytics } from "@vercel/analytics/react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (<>
    {children}
    <Analytics /> {/* Mount once; analytics must not gate rendering. */}
  </>);
}
```

**Before / after.** Before: the implementation treats “dashboard interpretation” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Segment by landing page, referrer, device, and event where available. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Dashboard interpretation is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 9. Conversion funnel design
Measure page visit, CTA click, form start, validation error, and successful submission as separate stages. Conversion rate needs a defined denominator and period.


```tsx
import { Analytics } from "@vercel/analytics/react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (<>
    {children}
    <Analytics /> {/* Mount once; analytics must not gate rendering. */}
  </>);
}
```

**Before / after.** Before: the implementation treats “conversion funnel design” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Measure page visit, CTA click, form start, validation error, and successful submission as separate stages. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Conversion funnel design is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 10. Data quality and validation
Test events in a staging or preview environment, inspect payloads, and confirm production events after deployment. A visible dashboard is not proof the event taxonomy is correct.


```tsx
import { Analytics } from "@vercel/analytics/react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (<>
    {children}
    <Analytics /> {/* Mount once; analytics must not gate rendering. */}
  </>);
}
```

**Before / after.** Before: the implementation treats “data quality and validation” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Test events in a staging or preview environment, inspect payloads, and confirm production events after deployment. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Data quality and validation is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 11. Retention and access
Limit who can access analytics and export only what is necessary. Review retention and deletion controls as part of ongoing site maintenance.


```tsx
import { Analytics } from "@vercel/analytics/react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (<>
    {children}
    <Analytics /> {/* Mount once; analytics must not gate rendering. */}
  </>);
}
```

**Before / after.** Before: the implementation treats “retention and access” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Limit who can access analytics and export only what is necessary. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Retention and access is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 12. Change management
Record changes to event names and definitions. If an event is renamed, update dashboards and comparisons so a change in instrumentation is not mistaken for a change in behavior.


```tsx
import { Analytics } from "@vercel/analytics/react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (<>
    {children}
    <Analytics /> {/* Mount once; analytics must not gate rendering. */}
  </>);
}
```

**Before / after.** Before: the implementation treats “change management” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Record changes to event names and definitions. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Change management is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

---
## Relevant Patterns
### Pattern 1: App-shell integration
Install the official analytics component once at the root layout and verify that nested routes do not mount duplicates.


```text
Trigger: a route or visitor reaches the app-shell integration workflow.
Action: validate required inputs, execute the smallest reliable implementation, and verify the observable output.
Failure path: log the route or variant and preserve a usable fallback.
```

### Pattern 2: CTA event wrapper
Wrap a meaningful user action with a stable event name and safe, enumerated properties.


```text
Trigger: a route or visitor reaches the cta event wrapper workflow.
Action: validate required inputs, execute the smallest reliable implementation, and verify the observable output.
Failure path: log the route or variant and preserve a usable fallback.
```

### Pattern 3: Contact success event
Emit success only after a server-confirmed submission; never attach the user's message or email.


```text
Trigger: a route or visitor reaches the contact success event workflow.
Action: validate required inputs, execute the smallest reliable implementation, and verify the observable output.
Failure path: log the route or variant and preserve a usable fallback.
```

### Pattern 4: Environment verification
Use preview deployments to validate events, then check the production project after release.


```text
Trigger: a route or visitor reaches the environment verification workflow.
Action: validate required inputs, execute the smallest reliable implementation, and verify the observable output.
Failure path: log the route or variant and preserve a usable fallback.
```

### Pattern 5: Privacy review
Audit properties, consent behavior, public privacy notice, access, and retention before enabling tracking.


```text
Trigger: a route or visitor reaches the privacy review workflow.
Action: validate required inputs, execute the smallest reliable implementation, and verify the observable output.
Failure path: log the route or variant and preserve a usable fallback.
```

### Pattern 6: Monthly insight review
Compare qualified conversion metrics with traffic and page-level engagement; document one action and one uncertainty.


```text
Trigger: a route or visitor reaches the monthly insight review workflow.
Action: validate required inputs, execute the smallest reliable implementation, and verify the observable output.
Failure path: log the route or variant and preserve a usable fallback.
```

---
## Common Mistakes
| Mistake | Why It Happens | Fix |
|---|---|---|
| Analytics component mounted on every page | Nested layouts create duplicate tracking | Place the component at one stable application root and verify route counts after navigation. |
| PII sent as event properties | Form values accidentally enter analytics payloads | Use an allowlist of non-sensitive enums and review network payloads before production. |
| Button click called a conversion | A click may not result in a completed inquiry | Track click and server-confirmed submission as separate events with separate names. |
| Preview traffic mixed with production | Testing inflates engagement and conversion rates | Separate project/environment configuration or filter preview domains using supported controls. |
| Manual and automatic page views overlap | Every route change may count twice | Choose one page-view strategy and test a multi-route browsing session. |
| Analytics outage blocks form submit | Tracking is incorrectly placed in the critical path | Make event emission best-effort and let server-confirmed form handling complete independently. |
| Event names change without migration | Historical charts become discontinuous | Maintain an event dictionary and annotate renames with effective dates. |
| No privacy notice update | Visitors are not told what measurement is used | Review the site's privacy disclosure against the deployed analytics configuration and applicable requirements. |
| Tiny sample declared a winner | Random variation looks like a meaningful trend | Set a minimum observation window and interpret uncertainty before changing design. |
| Every scroll is tracked | High-volume low-value events bury useful signals | Track only interactions that answer a stated product or portfolio question. |
| Dashboard viewed without action | Measurement becomes reporting theater | End each review with a documented decision, owner, and follow-up date. |
| Access is shared broadly | People see data without a work-related need | Grant least-privilege access and review collaborators periodically. |
| Form success fired before server response | Network failure produces false leads | Emit success only after a validated server response and stable submission identifier. |
| Bot traffic ignored | Automated requests distort audience patterns | Use available filtering and interpret suspicious spikes with server logs and context. |

---
## Mental Models
1. **Intent before implementation:** A page or event exists to answer a visitor question or a product decision.
2. **HTML is the source of meaning:** Visual effects should enhance content rather than hide the page's essential purpose.
3. **Evidence beats certainty:** Measurement supports a decision; it does not guarantee rankings or prove causation by itself.
4. **One URL, one canonical purpose:** Consistent URLs and links reduce ambiguity for users, crawlers, and analytics.
5. **Failures need a designed path:** Missing data, blocked scripts, and network errors must not erase the useful experience.
6. **Privacy is a product requirement:** Collect only the information needed to improve the experience and protect it deliberately.
7. **Ship a reversible change:** A launch is safer when verification and rollback are planned before release.

---
## Quick Reference
| Area | Check | Expected result |
|---|---|---|
| Question | Each metric supports a decision | Verified in the production-like route or documented as not applicable |
| Installation | Official framework integration used | Verified in the production-like route or documented as not applicable |
| Root mount | No duplicate components | Verified in the production-like route or documented as not applicable |
| Routes | Client-side navigation verified | Verified in the production-like route or documented as not applicable |
| Events | Stable naming convention | Verified in the production-like route or documented as not applicable |
| Properties | Allowlisted and non-sensitive | Verified in the production-like route or documented as not applicable |
| PII | No email, names, or message content | Verified in the production-like route or documented as not applicable |
| Consent | Configuration and obligations reviewed | Verified in the production-like route or documented as not applicable |
| Environments | Preview and production distinguished | Verified in the production-like route or documented as not applicable |
| Funnel | Click and success separated | Verified in the production-like route or documented as not applicable |
| Payload | Network data inspected | Verified in the production-like route or documented as not applicable |
| Performance | Tracking failure non-blocking | Verified in the production-like route or documented as not applicable |
| Access | Least privilege applied | Verified in the production-like route or documented as not applicable |
| Retention | Current policy checked | Verified in the production-like route or documented as not applicable |
| Review | Insights lead to documented action | Verified in the production-like route or documented as not applicable |

---
## Build Challenge
Build a production-ready implementation for a creative portfolio with a homepage, three case studies, a contact route, and responsive navigation. The challenge is complete only when the following requirements are satisfied:

- [ ] Create a clear route model with unique page data and a documented fallback.
- [ ] Keep essential text, headings, and navigation in semantic HTML.
- [ ] Use meaningful names and comments that explain why a non-obvious decision exists.
- [ ] Validate required inputs at build time or before a request is processed.
- [ ] Support narrow mobile viewports and keyboard-only interaction.
- [ ] Handle missing assets and optional data without breaking the page.
- [ ] Keep personal information out of analytics event payloads.
- [ ] Define a verification step for generated metadata, previews, events, or experiment assignment.
- [ ] Document the release checks and a practical rollback procedure.
- [ ] Record one primary success metric and at least one quality or accessibility guardrail.

### Implementation starter

```tsx
import { track } from "@vercel/analytics";

export function trackProjectOpen(projectSlug: string) {
  const allowedSlug = /^[a-z0-9-]+$/.test(projectSlug);
  if (allowedSlug) track("project_open", { project: projectSlug });
}
```


```ts
type ContactResult = { ok: boolean; submissionId?: string };
async function submitContact(formData: FormData): Promise<ContactResult> {
  // Server confirmation defines success; tracking is not the source of truth.
  return await postContact(formData);
}
```


```text
Event dictionary: project_open = visitor opens a project detail page.
Allowed properties: project slug, page category.
Forbidden properties: email, name, message body, phone number.
```

### Definition of done / Success criteria
- The implementation has no broken links, missing required fields, or console errors on the supported routes.
- The relevant output is verified: search metadata, generated image, CTA completion, analytics event, or experiment assignment.
- Keyboard interaction and narrow viewport behavior are checked, not assumed.
- No personal data is exposed through public metadata or analytics events.
- The fallback and rollback path are documented and tested.
- The owner can explain the metric, its denominator, and what evidence would change the next decision.

### Production review notes
Treat platform behavior as something to verify against current official documentation. Search engines and social networks may rewrite titles, cache previews, or change reporting interfaces. Do not promise ranking positions, guaranteed social preview refresh times, statistical certainty from inadequate samples, or a specific conversion lift. For legal/privacy questions, document the implementation and seek qualified advice where required; this skill is technical guidance, not a legal guarantee.
