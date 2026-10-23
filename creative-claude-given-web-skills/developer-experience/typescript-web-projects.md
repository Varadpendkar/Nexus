# SKILL: typescript-web-projects
**Layer:** 17 — Developer Experience
**Goal:** Design and maintain TypeScript web projects with trustworthy type boundaries, strict compiler settings, reusable domain types, and a build pipeline that catches errors before users encounter them.

---

## Why This Matters (Senior Perspective)

TypeScript is most valuable when it makes invalid states difficult to represent and risky assumptions visible at the boundaries of a web application. A project can compile while still being unsafe: developers may silence errors with `any`, cast unvalidated API responses into trusted domain objects, or configure the compiler so loosely that it behaves like JavaScript with extra syntax. Those shortcuts become production failures. A portfolio page may crash because an optional image URL was assumed to exist; a checkout form may submit a string where the API expects a number; a filter panel may behave incorrectly because a query parameter was never narrowed; and a deployment may fail because the local machine compiled files that CI never included.

A senior developer does not treat TypeScript as a badge or try to annotate every variable. They design the system around trust boundaries. Values created inside the application can often be represented with precise types; values arriving from a network, browser storage, URL parameters, or third-party SDK are untrusted until validated. They also understand that the compiler is only one layer: runtime validation, tests, accessibility checks, and build verification still matter. The aim is not to eliminate every possible bug through types, but to reduce the number of assumptions that can remain invisible during review.

This discipline matters especially in creative web work. Interactive portfolios often combine animation libraries, content management APIs, image metadata, route state, forms, and browser-specific features. Without clear types, a motion callback can accept stale or malformed data, a CMS entry can break a case-study page, or a shared component can become so permissive that every caller has to guess which props are required. With thoughtful types, components communicate their contracts, data transformations become explicit, and refactors can be performed confidently. A strong TypeScript project is not the one with the most annotations; it is the one where the important constraints are modeled accurately, runtime input is validated, and compiler feedback stays useful enough that developers act on it.

---

## Core Concepts

### 1. TypeScript's job is to describe contracts, not decorate variables

TypeScript checks relationships between values before the code runs. Type annotations are most useful at boundaries: function parameters, public component props, exported APIs, and data models. Local variables often infer their types correctly, so adding redundant annotations can make code noisier without making it safer.

```ts
type ProjectSummary = {
  id: string;
  title: string;
  href: string;
};

export function projectHref(project: ProjectSummary): string {
  return project.href;
}

const featuredProject = {
  id: 'orbit',
  title: 'Orbit Studio',
  href: '/work/orbit',
};

projectHref(featuredProject);
```

Here the `ProjectSummary` type communicates the input contract of the function. The local `featuredProject` object is inferred from its literal values and remains compatible with the contract. The function can be reused by a card, a navigation list, or a sitemap without repeating the same inline shape.

**Naive approach:**

```ts
const projectId: string = 'orbit';
const projectTitle: string = 'Orbit Studio';
const projectHrefValue: string = '/work/orbit';
```

**Correct approach:** Add named types where they express a stable domain concept or a public boundary. Let TypeScript infer simple local values, and avoid annotations that merely repeat obvious information.

**Gotcha:** TypeScript uses structural typing. Two objects with the same required shape can be compatible even if they have different conceptual meanings; use distinct domain types or branded types when confusing those values would be dangerous.

### 2. Turn on strict compiler settings early

The `strict` option enables a family of checks that expose uncertainty in the program. Adding strictness near project creation is cheaper than trying to retrofit it after hundreds of files have accumulated implicit assumptions. For a browser application, use a `tsconfig.json` that reflects the bundler and runtime actually in use.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["src", "vite.config.ts"]
}
```

This is a representative Vite-style configuration. A Node service, Next.js project, or library package may need different `module`, `moduleResolution`, `lib`, and `types` settings. `noUncheckedIndexedAccess` is particularly useful when reading arrays or dictionaries because a lookup may not produce a value.

**Naive approach:** Disable `strictNullChecks` to make red squiggles disappear, then add defensive checks inconsistently throughout the app.

**Correct approach:** Enable strictness and fix errors from the boundary inward. If migration must be incremental, scope the migration and track the remaining non-strict area rather than weakening the whole project.

**Gotcha:** Compiler options interact. A setting copied from a browser app may be wrong for a Node script or test runner. Verify the actual compiler command and included files instead of assuming the config is loaded.

### 3. Model optional values honestly

An optional property means the property may be absent; a union with `undefined` means the property exists in the type but its value can be undefined. With `exactOptionalPropertyTypes`, that distinction becomes more visible. Model the domain rather than making every field optional to avoid handling missing data.

```ts
type CaseStudy = {
  slug: string;
  title: string;
  summary: string;
  coverImage?: string;
};

function coverLabel(study: CaseStudy): string {
  return study.coverImage
    ? `Cover image: ${study.title}`
    : `No cover image available for ${study.title}`;
}
```

The UI explicitly handles the absence of a cover image. This is better than assuming every CMS record is complete and crashing when an older record has no image. Optional fields should reflect genuine optionality, not uncertainty caused by a missing validation step.

**Naive approach:** Mark every field optional: `title?: string; slug?: string; summary?: string;`.

**Correct approach:** Keep required fields required, represent known optional fields with `?`, and validate external records before treating them as `CaseStudy`.

**Gotcha:** Optional chaining prevents an access error but does not establish that the resulting value is valid for the next operation. A missing URL should trigger a fallback or validation path, not silently become an empty `src`.

### 4. Use unions to represent finite states

A union type is a way to enumerate the valid alternatives for a value. It is especially useful for UI state, loading flows, selected tabs, and request status. A single object with many unrelated optional fields often permits impossible combinations, such as an error state that also claims to contain successful data.

```ts
type LoadState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };

function renderStatus<T>(state: LoadState<T>): string {
  switch (state.status) {
    case 'idle':
      return 'Not started';
    case 'loading':
      return 'Loading projects…';
    case 'success':
      return 'Projects loaded';
    case 'error':
      return state.message;
  }
}
```

Each state carries only the data that makes sense for that state. The `switch` narrows the union so `data` is available only for success and `message` only for error.

**Naive approach:** Use `{ loading: boolean; data?: T; error?: string }`, then spend every render checking conflicting combinations.

**Correct approach:** Use a discriminant such as `status`, represent each valid state separately, and make transitions explicit in the code.

**Gotcha:** A union does not enforce that runtime input is valid. If a server sends `{ status: "success" }` without `data`, a cast can still bypass the intended guarantee.

### 5. Prefer `unknown` over `any` at untrusted boundaries

`any` disables type checking for a value and allows unsafe operations to spread through the code. `unknown` communicates that the value exists but must be narrowed before it can be used. Network responses, `JSON.parse`, browser storage, and third-party messages should be treated as untrusted input.

```ts
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readTitle(payload: unknown): string | null {
  if (!isRecord(payload)) return null;

  const title = payload.title;
  return typeof title === 'string' && title.trim().length > 0
    ? title
    : null;
}

const parsed: unknown = JSON.parse('{"title":"Selected work"}');
const title = readTitle(parsed);
```

The guard verifies only the `title` field, not a complete project schema. For production data, validate all required fields with a dedicated schema or domain-specific parser.

**Naive approach:** `const project = (await response.json()) as Project;`

**Correct approach:** Accept the response as `unknown`, validate it, and only then return a typed domain object. Keep unsafe casts at the smallest possible boundary and explain why they are justified.

**Gotcha:** A type assertion is erased during compilation. It does not check the value at runtime, transform it, or protect against malformed API responses.

### 6. Design function signatures around valid inputs and outputs

A function signature is an executable design statement. It should reveal which inputs are required, which outputs are possible, and whether the function can fail. Return types are often inferred correctly, but explicit return types help at exported module boundaries and in domain services.

```ts
type ProjectId = string;

type Project = {
  id: ProjectId;
  title: string;
  slug: string;
};

type ProjectLookup =
  | { ok: true; project: Project }
  | { ok: false; reason: 'not-found' | 'invalid-id' };

export function findProject(
  projects: readonly Project[],
  id: ProjectId,
): ProjectLookup {
  if (!id.trim()) return { ok: false, reason: 'invalid-id' };

  const project = projects.find((candidate) => candidate.id === id);
  return project
    ? { ok: true, project }
    : { ok: false, reason: 'not-found' };
}
```

The caller must handle both outcomes. This makes failure explicit rather than hiding it in `undefined` or relying on a later property-access crash.

**Naive approach:** Return `Project | null | undefined | false` depending on which branch failed.

**Correct approach:** Use a documented union for meaningful outcomes and keep one return contract across all branches.

**Gotcha:** An explicit return type can hide useful details if it is too broad. Avoid returning `object` or `Function`; prefer precise domain shapes and callable signatures.

### 7. Type React props as public component APIs

Component props define how other parts of the application are allowed to use a component. Good props make required content obvious, prevent conflicting options, and keep layout concerns separate from domain data. Avoid typing all props as `any` or using an unrestricted index signature to accept everything.

```tsx
type ProjectCardProps = {
  title: string;
  summary: string;
  href: string;
  imageUrl?: string;
  featured?: boolean;
};

export function ProjectCard({
  title,
  summary,
  href,
  imageUrl,
  featured = false,
}: ProjectCardProps) {
  return (
    <article className={featured ? 'project-card project-card--featured' : 'project-card'}>
      {imageUrl ? (
        <img className="project-card__image" src={imageUrl} alt="" loading="lazy" />
      ) : null}
      <div className="project-card__body">
        <h2>{title}</h2>
        <p>{summary}</p>
        <a href={href}>View project</a>
      </div>
    </article>
  );
}
```

This component exposes the domain values it needs and gives the optional `featured` prop a predictable default. The empty image `alt` is appropriate only if the image is decorative and the title already identifies the project; meaningful imagery should have meaningful alternative text.

**Naive approach:** `function ProjectCard(props: any) { ... }`.

**Correct approach:** Define a named prop type, use required fields for required content, and make optionality intentional. Prefer composition over a component with dozens of boolean props.

**Gotcha:** TypeScript does not automatically validate CMS content before it reaches a component. A component type protects typed callers, not arbitrary JSON or JavaScript consumers.

### 8. Use generics when the relationship between types matters

Generics allow a function or component to preserve the type relationship between its input and output. They are valuable for reusable utilities such as pagination, keyed lookup, and async state. They are not a reason to make every function generic; if a concrete domain type communicates the purpose better, use it.

```ts
type Page<T> = {
  items: T[];
  nextCursor: string | null;
};

function mapPage<T, U>(page: Page<T>, mapItem: (item: T) => U): Page<U> {
  return {
    items: page.items.map(mapItem),
    nextCursor: page.nextCursor,
  };
}

type ProjectRecord = { id: string; title: string; internalNotes: string };

const records: Page<ProjectRecord> = {
  items: [{ id: 'orbit', title: 'Orbit Studio', internalNotes: 'Draft copy' }],
  nextCursor: null,
};

const publicPage = mapPage(records, ({ id, title }) => ({ id, title }));
```

`mapPage` retains the cursor while transforming each item. The output item type is inferred from the mapping function, so callers do not have to repeat generic parameters.

**Naive approach:** Use `any[]` for a generic utility because the item type varies.

**Correct approach:** Introduce a type parameter only where the input/output relationship needs to be preserved, and constrain it when the function depends on specific fields.

**Gotcha:** Excessive generics can make errors harder to understand. Prefer a small number of meaningful type parameters and a readable API over clever conditional types.

### 9. Use utility types to derive, not duplicate, domain contracts

TypeScript provides utility types such as `Pick`, `Omit`, `Partial`, `Required`, `Readonly`, and `ReturnType`. They are useful for creating a view of an existing contract without repeating the same fields. However, a derived type should reflect a real relationship; it should not be used to hide a poorly designed base type.

```ts
type Project = {
  id: string;
  title: string;
  slug: string;
  description: string;
  published: boolean;
  createdAt: string;
};

type ProjectCardData = Pick<Project, 'id' | 'title' | 'slug'>;
type ProjectDraftInput = Pick<Project, 'title' | 'slug' | 'description'>;
type ProjectPatch = Partial<ProjectDraftInput>;

function toCardData(project: Project): ProjectCardData {
  return {
    id: project.id,
    title: project.title,
    slug: project.slug,
  };
}
```

The card model intentionally excludes internal or irrelevant fields. `ProjectPatch` describes a partial update, but the server still needs validation and authorization before accepting it.

**Naive approach:** Copy the same field definitions into every card, API response, edit form, and test fixture.

**Correct approach:** Derive related shapes when they genuinely share a source contract; use distinct types when the meanings or trust levels differ.

**Gotcha:** `Partial<T>` makes every property optional but does not make the update semantically valid. An empty patch, a forbidden field, or an invalid slug can still pass the type check.

### 10. Keep API contracts separate from UI view models

A network response is shaped by the API; a view model is shaped by the interface. Those shapes often overlap but should not be conflated automatically. A service layer can parse and transform API data into a stable domain model so the UI does not depend on server-specific field names or transport details.

```ts
type ProjectApiResponse = {
  project_id: string;
  display_title: string;
  cover_url: string | null;
};

type ProjectViewModel = {
  id: string;
  title: string;
  coverImage?: string;
};

function toProjectViewModel(apiProject: ProjectApiResponse): ProjectViewModel {
  return {
    id: apiProject.project_id,
    title: apiProject.display_title,
    ...(apiProject.cover_url ? { coverImage: apiProject.cover_url } : {}),
  };
}
```

The transformation creates a deliberate boundary. If the API changes from `display_title` to `title`, the mapping function changes while most UI components remain stable.

**Naive approach:** Pass API response objects directly through every component and let the UI read server-specific property names.

**Correct approach:** Validate transport data, map it into a domain or view model, and expose only the fields the UI actually needs.

**Gotcha:** A mapper does not validate data by itself. This example assumes the API shape has already been checked; do not treat a raw `response.json()` result as `ProjectApiResponse` without runtime validation.

### 11. Narrow types with guards and exhaustive checks

Type guards turn a broad type into a more precise one after a runtime condition is verified. Exhaustive checks make future changes visible when a union gains a new member. These techniques are especially useful for route state, command menus, animation modes, and form submissions.

```ts
type MotionPreference = 'system' | 'reduce' | 'full';

function describeMotion(preference: MotionPreference): string {
  switch (preference) {
    case 'system':
      return 'Follow the operating system';
    case 'reduce':
      return 'Use reduced motion';
    case 'full':
      return 'Use full motion';
    default: {
      const impossible: never = preference;
      return impossible;
    }
  }
}
```

The `never` assignment signals that all union members should have been handled. If a new value such as `'custom'` is added, TypeScript flags the missing branch at compile time.

**Naive approach:** Use a default branch that returns an empty string for every unknown state, hiding a new state from the UI.

**Correct approach:** Handle every known union member and use an exhaustive check where an omitted branch would be a defect.

**Gotcha:** Exhaustiveness works only when the compiler knows the variable's union. If the value has been widened to `string` or asserted unsafely, the check loses its value.

### 12. Type asynchronous code and errors honestly

Async functions return promises. Their resolved value can be typed, but rejected promises can contain arbitrary thrown values; JavaScript does not guarantee that every rejection is an `Error`. Code should check response status, parse or validate data, and represent loading and failure in the UI rather than relying on a console message.

```ts
type Project = { id: string; title: string };

async function fetchProject(projectId: string): Promise<Project> {
  const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}`);

  if (!response.ok) {
    throw new Error(`Project request failed with status ${response.status}`);
  }

  const payload: unknown = await response.json();
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('id' in payload) ||
    !('title' in payload) ||
    typeof payload.id !== 'string' ||
    typeof payload.title !== 'string'
  ) {
    throw new Error('Project API returned an invalid payload');
  }

  return { id: payload.id, title: payload.title };
}
```

This parser checks the fields required by the consumer. A schema validator may be easier to maintain for complex objects. Callers should handle cancellation and display a meaningful error state.

**Naive approach:** `return fetch(url).then((response) => response.json() as Promise<Project>);`

**Correct approach:** Check HTTP status, validate runtime data, declare the resolved return type, and catch errors at the layer that can provide useful recovery or feedback.

**Gotcha:** `fetch` normally resolves for HTTP 404 and 500 responses; it rejects for network-level failures and certain request problems. Always inspect `response.ok` when non-2xx status codes should be treated as errors.

### 13. Understand module boundaries, aliases, and build environments

TypeScript's module resolution must agree with the bundler, test runner, and runtime. Path aliases can improve readability, but they must be configured consistently in the compiler and any tool that resolves imports. A project can pass type checking and still fail at runtime if the bundler does not recognize an alias.

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@lib/*": ["src/lib/*"]
    }
  }
}
```

For Vite, configure matching aliases in `vite.config.ts` or use a supported tsconfig-paths integration. For Jest, Vitest, Next.js, or Node, follow the corresponding tool's module resolution behavior. Keep aliases purposeful rather than replacing every relative import with a new alias.

**Naive approach:** Add `@/components/Button` to TypeScript and assume every runtime tool will resolve it automatically.

**Correct approach:** Treat aliases as a cross-tool contract. Verify the compiler, bundler, tests, editor, and deployment build all resolve the same import.

**Gotcha:** A path alias does not change JavaScript emitted by TypeScript when `noEmit` is enabled; the runtime tool still needs to understand the mapping.

### 14. Build a real type boundary for a portfolio project

A robust TypeScript web project validates external project content, maps it into a domain model, and exposes precise props to the UI. This final use case combines strict compiler settings, `unknown`, type guards, model transformation, unions, and component contracts.

```ts
type ProjectCardModel = {
  id: string;
  title: string;
  href: string;
  imageUrl?: string;
};

type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: string };

function parseProjectCard(input: unknown): ParseResult<ProjectCardModel> {
  if (typeof input !== 'object' || input === null) {
    return { ok: false, reason: 'Project record must be an object' };
  }

  const record = input as Record<string, unknown>;
  const id = record.id;
  const title = record.title;
  const slug = record.slug;
  const imageUrl = record.imageUrl;

  if (typeof id !== 'string' || id.trim() === '') {
    return { ok: false, reason: 'Project id is required' };
  }
  if (typeof title !== 'string' || title.trim() === '') {
    return { ok: false, reason: 'Project title is required' };
  }
  if (typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) {
    return { ok: false, reason: 'Project slug is invalid' };
  }
  if (imageUrl !== undefined && typeof imageUrl !== 'string') {
    return { ok: false, reason: 'Image URL must be a string when supplied' };
  }

  return {
    ok: true,
    value: {
      id,
      title,
      href: `/work/${slug}`,
      ...(typeof imageUrl === 'string' && imageUrl.length > 0 ? { imageUrl } : {}),
    },
  };
}
```

```tsx
type ProjectCardProps = ProjectCardModel;

export function ProjectCard({ id, title, href, imageUrl }: ProjectCardProps) {
  return (
    <article className="project-card" data-project-id={id}>
      <a className="project-card__link" href={href}>
        {imageUrl ? (
          <img className="project-card__image" src={imageUrl} alt="" loading="lazy" />
        ) : (
          <span className="project-card__image-fallback" aria-hidden="true" />
        )}
        <h2>{title}</h2>
      </a>
    </article>
  );
}
```

The parser gives the UI a narrower, stable model. In a production implementation, validate URL protocols and image-host policy as appropriate, and consider a schema library for richer nested records. Keep the UI component focused on rendering rather than repeating validation logic.

**Naive approach:** Cast every CMS item to `ProjectCardModel` and discover malformed records only after the page renders.

**Correct approach:** Parse external input once at the boundary, represent parse failure explicitly, and pass only validated models into typed components.

**Gotcha:** A type guard that checks only primitive fields may not be enough for security-sensitive URLs or nested objects. Runtime validation must match the risks of the data, not just the compiler's needs.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Strict starter configuration

**What it does:** Establishes a strict compiler baseline for a browser application so nullability, implicit types, and unsafe indexed access are visible during development.

**When to use it:** A new Vite + React project before the first feature branch is merged.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noEmit": true
  },
  "include": ["src", "vite.config.ts"]
}
```

Do not copy this config into a Node package without reviewing its `lib`, `types`, and module settings. Compiler configuration is part of the runtime contract, not a generic checklist.

### Pattern 2: Parse untrusted API responses at the service boundary

**What it does:** Converts unknown network data into a typed domain object only after required fields have been checked.

**When to use it:** A case-study page loads project records from a CMS or API whose schema can change independently of the frontend deployment.

```ts
type Project = { id: string; title: string };

function parseProject(value: unknown): Project {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('id' in value) ||
    !('title' in value) ||
    typeof value.id !== 'string' ||
    typeof value.title !== 'string'
  ) {
    throw new Error('Invalid project response');
  }
  return { id: value.id, title: value.title };
}
```

Use a schema validation library when the payload has nested arrays, dates, unions, or complex refinements. Do not cast a response into the type merely because the API documentation claims it should match.

### Pattern 3: Discriminated union for async UI

**What it does:** Models loading, success, and error as separate valid states so the UI cannot accidentally treat an error as successful data.

**When to use it:** A page that fetches projects and must show a spinner, a result list, an empty state, or a recoverable error.

```ts
type Resource<T> =
  | { status: 'loading' }
  | { status: 'ready'; value: T }
  | { status: 'error'; message: string };

function resourceMessage<T>(resource: Resource<T>): string {
  switch (resource.status) {
    case 'loading': return 'Loading…';
    case 'ready': return 'Content ready';
    case 'error': return resource.message;
  }
}
```

Use this instead of several independent booleans when their combinations are mutually exclusive. Keep a separate explicit empty result if “loaded but no items” differs from “not loaded.”

### Pattern 4: Derive form types from a stable domain model

**What it does:** Reuses the field contract for an edit form without allowing server-owned or read-only properties to leak into the form payload.

**When to use it:** An admin page edits a project title, slug, and description while the server owns its ID and creation timestamp.

```ts
type Project = {
  id: string;
  title: string;
  slug: string;
  description: string;
  createdAt: string;
};

type ProjectEditInput = Pick<Project, 'title' | 'slug' | 'description'>;

function buildEditInput(project: Project): ProjectEditInput {
  return {
    title: project.title,
    slug: project.slug,
    description: project.description,
  };
}
```

The server must still validate and authorize updates. A TypeScript type prevents accidental misuse in typed frontend code; it is not a substitute for server-side validation.

### Pattern 5: Exhaustive handling of interaction states

**What it does:** Forces every interaction mode to be handled when a finite union changes, reducing silent fallbacks that hide missing UI behavior.

**When to use it:** A motion setting or project-card state has named variants that must all map to distinct behavior.

```ts
type MotionMode = 'reduced' | 'standard' | 'expressive';

function durationFor(mode: MotionMode): number {
  switch (mode) {
    case 'reduced': return 0;
    case 'standard': return 180;
    case 'expressive': return 420;
    default: {
      const neverMode: never = mode;
      return neverMode;
    }
  }
}
```

The value `0` does not by itself guarantee an accessible reduced-motion experience; remove nonessential movement and verify the behavior with real assistive settings.

### Pattern 6: Align aliases across compiler and bundler

**What it does:** Keeps import paths consistent between TypeScript diagnostics and the tool that actually bundles or runs the application.

**When to use it:** A repository is large enough that repeated `../../../../` imports make refactors error-prone.

```ts
// vite.config.ts
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
```

Pair this with the matching `paths` mapping in `tsconfig.json` and configure test tools if they resolve imports independently. Avoid aliases that shadow package names or create ambiguous paths.

### Pattern 7: Compile, test, and build as separate checks

**What it does:** Makes type errors, test failures, and bundler errors independently visible instead of assuming one successful command proves the project is healthy.

**When to use it:** A pull-request workflow for a TypeScript web app that uses a bundler and a test runner.

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "build": "vite build",
    "check": "npm run typecheck && npm run test && npm run build"
  }
}
```

Keep `typecheck`, `test`, and `build` independently runnable for diagnosis. `vitest run` is only correct when Vitest is the project's test runner; use the actual runner configured in the repository.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Casting raw JSON directly to a domain type | The developer confuses a compile-time assertion with runtime validation | Receive the payload as `unknown` and validate required fields before returning a domain object |
| Disabling `strictNullChecks` to quiet errors | Nullability problems feel noisy during migration | Keep strict mode on and narrow nullable values at the boundary where absence is handled |
| Using `any` for every API response | It makes the first implementation appear faster | Use `unknown` for untrusted input and a parser or schema validator to establish the trusted shape |
| Making every component prop optional | The developer wants one component to accept every caller shape | Keep essential props required and split materially different component variants into separate APIs |
| Modeling async state with unrelated booleans | Each boolean seems simple in isolation | Replace conflicting flags with a discriminated union such as `loading`, `ready`, and `error` |
| Duplicating API and UI field definitions | The same values look identical at first | Map transport DTOs to view models in a service or adapter layer |
| Adding annotations to every local variable | TypeScript is mistaken for a requirement to write types everywhere | Rely on inference for obvious local values and annotate exported boundaries and domain contracts |
| Using `Partial<T>` as complete validation | A utility type looks like a safe update schema | Validate allowed fields, value constraints, and authorization on the server before applying a patch |
| Ignoring `fetch` HTTP status codes | Developers assume every non-2xx response rejects the promise | Check `response.ok` before parsing the response body |
| Assuming `catch` receives an `Error` | Most local throws use `new Error()` | Treat caught values as `unknown` and narrow with `instanceof Error` or a dedicated formatter |
| Adding path aliases only to `tsconfig` | The editor resolves imports, so the runtime is assumed to do the same | Configure the bundler and test runner with the same alias mapping |
| Using an over-broad `string` for finite modes | A simple string seems easier than maintaining a union | Use string-literal unions and exhaustive switches for known states |
| Reusing one giant type for API, form, and UI | Sharing every field appears to avoid duplication | Derive `Pick`/`Omit` shapes where appropriate and keep different trust boundaries separate |
| Treating `skipLibCheck` as a fix for application errors | Third-party declaration diagnostics are distracting | Use it only for dependency declaration checking policy; fix errors in application source directly |
| Using non-null assertions to satisfy the compiler | `!` removes the error without changing runtime behavior | Add a guard, establish an invariant in the owning function, or return a typed failure result |
| Letting a type assertion hide a wrong enum value | Assertions are mistaken for conversions | Validate the raw string against an allowed set before narrowing it to a union |
| Assuming a successful typecheck means the app builds | Compiler and bundler resolve modules differently | Run the actual production build in CI after type checking |
| Defining `any` in a shared utility | One unsafe choice propagates to many callers | Parameterize the utility with a generic type or use `unknown` until the value is narrowed |

Before → After:

```ts
// Before: the assertion suppresses all checks on the payload.
const project = (await response.json()) as Project;
return project.title.toUpperCase();
```

```ts
// After: parse the response before using the domain value.
const payload: unknown = await response.json();
const project = parseProject(payload);
return project.title.toUpperCase();
```

The second version makes the trust transition explicit. The parser should reject malformed data with an actionable error, and the calling UI should show a recovery state instead of exposing a blank or broken page.

---

## Mental Models

1. **Types are contracts, not runtime armor** — compiler checks guide typed code, but external values still need runtime validation.
2. **Trust narrows as data crosses a boundary** — JSON, URL parameters, storage, and SDK messages begin as unknown until verified.
3. **Model valid states, not convenient flags** — a discriminated union prevents contradictory states that booleans allow.
4. **Types should reveal intent** — a named domain model is valuable when it communicates meaning, not just because it adds syntax.
5. **Compile-time and runtime checks are different gates** — type checking cannot prove the bundler works or the server validates requests.
6. **One source contract, multiple deliberate views** — derive related types when they share meaning, and map them when their responsibilities differ.
7. **Make the boundary boring** — parse and validate data once, then keep UI components focused on rendering trusted models.

---

## Quick Reference

| Situation | Recommended approach | Why |
|---|---|---|
| Starting a new web project | Enable `strict` in `tsconfig.json` | Exposes unsafe assumptions before they spread |
| Reading a response body | Store it as `unknown` and validate | Prevents an unchecked cast from becoming trusted data |
| Modeling loading states | Use a discriminated union | Prevents impossible combinations of loading, data, and error |
| Defining reusable component props | Create a named props type | Makes the component's public API discoverable |
| Avoiding duplicate field definitions | Use `Pick`, `Omit`, or a mapper | Reuses contracts without coupling unrelated layers |
| Writing generic utilities | Use type parameters that preserve input/output relationships | Avoids falling back to `any` while staying reusable |
| Handling a union switch | Add an exhaustive `never` check | New union members cause compile-time feedback |
| Fetching a resource | Check `response.ok` | HTTP errors do not automatically reject `fetch` |
| Handling a caught value | Narrow `unknown` before reading `.message` | JavaScript can throw non-Error values |
| Adding import aliases | Configure TypeScript and bundler/test tools | Type checking alone does not make runtime resolution work |
| Editing a record | Derive a form input type that excludes server-owned fields | Avoids accidentally sending IDs or timestamps as editable data |
| Using `Partial<T>` | Add runtime validation and allowed-field checks | Partial types do not guarantee a valid update |
| Fixing a missing property | Narrow the value or model optionality honestly | Non-null assertions can hide a runtime crash |
| Migrating a JavaScript codebase | Turn strictness on incrementally with a tracked plan | Keeps progress measurable without weakening the entire project |
| Validating complex nested data | Use a schema parser or dedicated validation functions | Manual shallow checks can miss malformed nested fields |
| Testing types | Run `tsc --noEmit` in CI | Keeps compiler diagnostics independent from test execution |
| Testing the production path | Run the real bundler build | Catches module-resolution and bundler-specific failures |
| Supporting reduced motion | Use a finite motion preference type and verify actual behavior | A typed value alone does not guarantee accessible animation |
| Sharing a domain model | Keep API DTOs, view models, and edit inputs distinct where needed | Prevents transport and UI concerns from leaking into each other |
| Avoiding `any` spread | Enable an appropriate lint rule and review assertions | Keeps one unsafe boundary from contaminating the codebase |

---

## Build Challenge

### Build: Typed Project Gallery With a Validated API Boundary

Build a production-minded project gallery for a creative portfolio. The gallery loads project records, validates the response, displays loading and error states, supports a featured project, and routes users to individual case studies. The exercise is intended to demonstrate how TypeScript can shape architecture rather than simply annotate variables.

#### Requirements

1. Create a React + TypeScript application using a single documented package manager and a committed lockfile.
2. Enable `strict` mode and document any additional compiler options that the project uses.
3. Define a `ProjectApiResponse` transport type and a separate `ProjectCardModel` view model.
4. Implement a parser that accepts `unknown`, rejects malformed records, and returns a typed success/failure result.
5. Validate required `id`, `title`, and `slug` values; validate optional image data without silently trusting it.
6. Add URL construction for project detail routes and prevent malformed slugs from producing invalid paths.
7. Define typed `ProjectCard` props with explicit required and optional fields.
8. Implement a discriminated union for loading, success, empty, and error states.
9. Ensure the success state contains validated data rather than a cast response.
10. Add an async service that checks `response.ok`, handles invalid payloads, and reports errors with useful context.
11. Handle rejected promises without assuming every thrown value is an `Error`.
12. Add at least one exhaustive switch and demonstrate how the compiler responds when a new state is added.
13. Configure path aliases in TypeScript and the actual bundler; verify imports in the test environment as well.
14. Write unit tests for valid records, missing required fields, invalid slugs, missing optional images, and unexpected payload types.
15. Add a test where the server returns a non-2xx status and confirm the service does not treat it as success.
16. Add a deliberate compile-time failure in a temporary branch, capture the compiler diagnostic, then correct the type mismatch.
17. Run type checking, tests, and a production build as separate commands in CI.
18. Document how to add a new field safely across API response, parser, view model, component props, and tests.

#### Failure exercise

After the gallery initially works, deliberately introduce two failures in a temporary branch: return an API record with a numeric `title`, and change the loading union to include a new `'refreshing'` state without handling it in the UI. Confirm that runtime validation rejects the malformed record and that TypeScript flags the missing state branch. Then fix the parser and exhaustive switch without adding `as ProjectCardModel`, disabling strict mode, or returning a silent fallback.

#### Expected output

- A gallery whose components consume validated, typed view models.
- A parser and service boundary that reject malformed server data.
- Clear loading, empty, and error states.
- Tests for normal cases and malformed inputs.
- A build pipeline that checks types, runs tests, and builds the application.
- Documentation that explains the difference between a type assertion, a runtime parser, and a domain model.

#### Definition of Done

- [ ] A clean dependency install succeeds with the documented runtime version.
- [ ] `tsc --noEmit` passes without weakening strict mode to hide application errors.
- [ ] Raw API data is represented as `unknown` until validated.
- [ ] Invalid records produce an explicit parse failure or a deliberate error path.
- [ ] UI components receive the view model and do not repeat transport validation.
- [ ] Loading, empty, success, and error states are represented and rendered intentionally.
- [ ] The service checks HTTP status and handles malformed JSON or invalid data.
- [ ] Tests cover valid and invalid records, missing fields, and non-2xx responses.
- [ ] The bundler resolves aliases in the production build and the test runner.
- [ ] The deliberate failure exercise is reproduced, diagnosed, fixed, and retested.
- [ ] The README explains how types, runtime validation, and CI checks work together.
