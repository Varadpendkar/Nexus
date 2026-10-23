# SKILL: nodejs-express-setup
**Layer:** 18 — Backend Development
**Goal:** Build and operate a secure, observable Express service with explicit configuration, predictable request handling, testable boundaries, and production-safe failure behavior.

---

## Why This Matters (Senior Perspective)

An Express server can appear finished while still being unsafe to deploy. A route may work on a laptop but fail in production because it assumes the current working directory, reads an absent environment variable as a valid value, accepts an unbounded request body, or leaves an asynchronous rejection unhandled. A process can report that it started even though the database connection is unusable. A client can retry a request after a timeout and accidentally create the same order twice. These are not abstract edge cases: they become broken checkout flows, leaked stack traces, lost telemetry, and late-night incidents.

A beginner often thinks of Express as a collection of `app.get()` callbacks. A senior engineer sees a request lifecycle with trust boundaries: transport parsing, validation, authentication, authorization, business logic, persistence, response serialization, and error handling. The order of middleware is executable policy. Configuration is a contract that must be validated before the server listens. Logging is an operational interface, not a stream of arbitrary `console.log` statements. Graceful shutdown is part of correctness because in-flight work must either finish or fail clearly when a deployment replaces a process.

This matters in creative, portfolio, and freelance work because attractive frontends depend on dependable APIs. A portfolio CMS, project marketplace, booking form, or client dashboard must handle malformed input, slow networks, missing records, and deploy-time restarts without surprising users. A production-minded setup also makes a project easier to hand off: another developer can find the entry point, understand environment requirements, run tests, inspect request IDs, and add a route without duplicating security logic. The goal is not maximal architecture. It is the smallest clear structure that makes unsafe states difficult to express and failures easy to diagnose.


## Core Concepts


### 1. Choose a supported runtime and module system

Treat the Node.js version and module format as part of the application contract. Modern Node supports both CommonJS and ECMAScript modules, but mixing their loading assumptions creates confusing startup failures. Pick one convention, pin the runtime range, and keep imports consistent. For a new service, ESM is a reasonable default; CommonJS remains valid when required by an existing ecosystem. The examples in this skill use ESM and Node’s built-in test runner.

**Working example:**

```javascript
// package.json
{
  "name": "studio-api",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22 <25" },
  "scripts": { "start": "node src/server.js", "dev": "node --watch src/server.js", "test": "node --test" },
  "dependencies": { "express": "^5.1.0", "helmet": "^8.1.0" }
}
```

**Why it works:** The example makes a boundary explicit and keeps failure behavior visible. It is intentionally small enough to copy into a real service and adapt without adding hidden global state.

**Naive / wrong approach:**

```javascript
// Naive: module syntax is used without declaring the project format.
import express from 'express';
// The result can depend on file extension and package metadata.
```

This is attractive because it reduces the number of lines at first. The cost appears later: the request path becomes hard to test, a failure is misclassified, or a deployment assumption remains invisible until production.

**Correct approach:**

```javascript
// Correct: declare ESM in package.json and use consistent imports.
import express from 'express';
import { createServer } from 'node:http';
const app = express();
createServer(app).listen(3000);
```

The correction puts the decision at the boundary where the relevant information is available. It also creates a stable place for tests and operational checks to assert behavior.

**Gotcha:** Express 5 requires a modern Node runtime; keep the deployed runtime inside the range you test. A local Node version that differs from CI can hide syntax and API incompatibilities.


### 2. Separate app construction from process startup

An application factory configures middleware and routes but does not bind a network port. The process entry point validates configuration, creates the HTTP server, and owns lifecycle hooks. This separation lets tests import the app without opening a real port and lets production startup fail before accepting traffic when required configuration is missing.

**Working example:**

```javascript
// src/app.js
import express from 'express';
import helmet from 'helmet';
export function createApp({ logger }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  app.get('/health/live', (_req, res) => res.status(200).json({ status: 'ok' }));
  app.locals.logger = logger;
  return app;
}
```

**Why it works:** The example makes a boundary explicit and keeps failure behavior visible. It is intentionally small enough to copy into a real service and adapt without adding hidden global state.

**Naive / wrong approach:**

```javascript
// Naive: importing the app starts a listener and occupies a port.
app.listen(3000);
// Tests now have hidden process-level side effects.
```

This is attractive because it reduces the number of lines at first. The cost appears later: the request path becomes hard to test, a failure is misclassified, or a deployment assumption remains invisible until production.

**Correct approach:**

```javascript
// Correct: only the entry point owns listening.
import { createApp } from './app.js';
const app = createApp({ logger });
app.listen(config.port);
```

The correction puts the decision at the boundary where the relevant information is available. It also creates a stable place for tests and operational checks to assert behavior.

**Gotcha:** Do not put database connection side effects in a module that tests import. Module evaluation should not unexpectedly bind sockets, start timers, or mutate external state.


### 3. Validate environment configuration once

Environment variables arrive as strings and can be missing, misspelled, or malformed. Parse them at startup into a typed configuration object; downstream code should not repeatedly read `process.env` and invent defaults. Fail fast for required secrets and invalid ports rather than allowing the service to run in a broken state.

**Working example:**

```javascript
// src/config.js
function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}
const port = Number(process.env.PORT ?? '3000');
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer from 1 to 65535');
}
export const config = Object.freeze({
  port,
  nodeEnv: process.env.NODE_ENV ?? 'development',
  sessionSecret: required('SESSION_SECRET')
});
```

**Why it works:** The example makes a boundary explicit and keeps failure behavior visible. It is intentionally small enough to copy into a real service and adapt without adding hidden global state.

**Naive / wrong approach:**

```javascript
// Naive: invalid values silently turn into surprising runtime behavior.
const port = process.env.PORT || 3000;
const secret = process.env.SESSION_SECRET;
```

This is attractive because it reduces the number of lines at first. The cost appears later: the request path becomes hard to test, a failure is misclassified, or a deployment assumption remains invisible until production.

**Correct approach:**

```javascript
// Correct: parse and validate at the boundary, then pass config explicitly.
import { config } from './config.js';
startServer({ port: config.port, secret: config.sessionSecret });
```

The correction puts the decision at the boundary where the relevant information is available. It also creates a stable place for tests and operational checks to assert behavior.

**Gotcha:** A default is appropriate only when the default is safe for every environment. Never default a production signing secret to a known development string.


### 4. Make middleware order explicit

Express processes middleware in registration order. A request logger placed after a route misses that request; a router mounted before JSON parsing may see an undefined body; an error handler mounted before routes will not catch errors from later middleware. Treat the order as a readable pipeline and keep cross-cutting concerns near the top.

**Working example:**

```javascript
// src/app.js — intentional request pipeline
app.use(requestId());
app.use(accessLog(logger));
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use('/api/v1', apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);
```

**Why it works:** The example makes a boundary explicit and keeps failure behavior visible. It is intentionally small enough to copy into a real service and adapt without adding hidden global state.

**Naive / wrong approach:**

```javascript
// Naive: routes run before the parser and final error handler.
app.use('/api/v1', apiRouter);
app.use(express.json());
app.use(errorHandler);
```

This is attractive because it reduces the number of lines at first. The cost appears later: the request path becomes hard to test, a failure is misclassified, or a deployment assumption remains invisible until production.

**Correct approach:**

```javascript
// Correct: infrastructure middleware first, routes next, terminal handlers last.
app.use(express.json({ limit: '1mb' }));
app.use('/api/v1', apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);
```

The correction puts the decision at the boundary where the relevant information is available. It also creates a stable place for tests and operational checks to assert behavior.

**Gotcha:** A middleware that sends a response must not call `next()` afterward unless it deliberately hands control onward. Double response attempts often surface as “headers already sent.”


### 5. Parse and bound request bodies

Parsing JSON is not validation. The parser only turns bytes into JavaScript values; it does not prove the shape, type, or business meaning of those values. Configure a body-size limit to reduce memory abuse, then validate each route’s expected fields before business logic. Reject malformed data with a stable client error instead of letting it fail later as a database exception.

**Working example:**

```javascript
app.use(express.json({ limit: '256kb', strict: true }));

function validateCreateProject(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Body must be a JSON object' };
  }
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (title.length < 3 || title.length > 120) {
    return { error: 'title must contain 3–120 characters' };
  }
  return { value: { title } };
}
```

**Why it works:** The example makes a boundary explicit and keeps failure behavior visible. It is intentionally small enough to copy into a real service and adapt without adding hidden global state.

**Naive / wrong approach:**

```javascript
// Naive: blindly trust client-provided data.
const project = await projects.create(req.body);
```

This is attractive because it reduces the number of lines at first. The cost appears later: the request path becomes hard to test, a failure is misclassified, or a deployment assumption remains invisible until production.

**Correct approach:**

```javascript
// Correct: validate and pass a narrow, normalized object.
const parsed = validateCreateProject(req.body);
if (parsed.error) return res.status(400).json({ error: parsed.error });
const project = await projects.create(parsed.value);
```

The correction puts the decision at the boundary where the relevant information is available. It also creates a stable place for tests and operational checks to assert behavior.

**Gotcha:** A JSON body limit does not limit query-string length or uploaded multipart files. Apply separate limits at the proxy and upload layer when those inputs are supported.


### 6. Use routers and controllers for clear boundaries

A router defines HTTP paths and middleware; a controller translates HTTP inputs into application calls and outputs. Keep domain rules out of route registration and avoid one giant file containing parsing, SQL, email delivery, and response formatting. Small boundaries make behavior easier to unit-test and make later route versioning less painful.

**Working example:**

```javascript
// src/routes/projects.js
import { Router } from 'express';
import { listProjects, createProject } from '../controllers/projects.js';
export const projectsRouter = Router();
projectsRouter.get('/', listProjects);
projectsRouter.post('/', createProject);

// src/controllers/projects.js
export async function listProjects(req, res) {
  const items = await req.services.projects.list({ limit: req.query.limit });
  res.status(200).json({ data: items });
}
```

**Why it works:** The example makes a boundary explicit and keeps failure behavior visible. It is intentionally small enough to copy into a real service and adapt without adding hidden global state.

**Naive / wrong approach:**

```javascript
// Naive: all layers are coupled in one callback.
router.post('/projects', async (req, res) => {
  const row = await database.query('INSERT ...');
  await sendWelcomeEmail(row);
  res.json(row);
});
```

This is attractive because it reduces the number of lines at first. The cost appears later: the request path becomes hard to test, a failure is misclassified, or a deployment assumption remains invisible until production.

**Correct approach:**

```javascript
// Correct: controller coordinates an application service.
const project = await req.services.projects.create(input);
res.status(201).json({ data: project });
```

The correction puts the decision at the boundary where the relevant information is available. It also creates a stable place for tests and operational checks to assert behavior.

**Gotcha:** Avoid creating folders just to imitate an enterprise diagram. Split code when a boundary clarifies a responsibility, test seam, or change pattern.


### 7. Handle async errors consistently

Express 5 automatically forwards rejected promises returned by route handlers and middleware to error handling. Callback APIs and detached promises still need explicit handling. Centralize error-to-response mapping so controllers do not expose stack traces or invent inconsistent error envelopes. Use known application errors for expected failures and treat unknown exceptions as server faults.

**Working example:**

```javascript
export class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const status = Number.isInteger(err.status) ? err.status : 500;
  req.app.locals.logger.error({ err, requestId: req.id }, 'request failed');
  res.status(status).json({
    error: { code: status === 500 ? 'INTERNAL_ERROR' : err.code ?? 'REQUEST_ERROR',
      message: status === 500 ? 'An unexpected error occurred' : err.message,
      requestId: req.id }
  });
}
```

**Why it works:** The example makes a boundary explicit and keeps failure behavior visible. It is intentionally small enough to copy into a real service and adapt without adding hidden global state.

**Naive / wrong approach:**

```javascript
// Naive: catch and hide every failure as a successful response.
try { await saveProject(input); } catch (err) { console.log(err); }
res.json({ saved: true });
```

This is attractive because it reduces the number of lines at first. The cost appears later: the request path becomes hard to test, a failure is misclassified, or a deployment assumption remains invisible until production.

**Correct approach:**

```javascript
// Correct: let Express 5 forward the rejection to the final handler.
const project = await saveProject(input);
res.status(201).json({ data: project });
```

The correction puts the decision at the boundary where the relevant information is available. It also creates a stable place for tests and operational checks to assert behavior.

**Gotcha:** If a response has already started, the error handler cannot safely replace it. Delegate with `next(err)` so Express can close the connection when necessary.


### 8. Return deliberate HTTP status codes

Status codes are part of the API contract. A successful creation generally returns 201, an accepted asynchronous job can return 202, a missing resource returns 404, invalid input returns 400 or 422 according to the API convention, and unexpected failures return 500. Stable status and response shapes let frontends distinguish retryable errors from user-correctable ones.

**Working example:**

```javascript
router.post('/projects', async (req, res) => {
  const input = parseProject(req.body);
  const created = await projectService.create(input);
  res.location(`/api/v1/projects/${created.id}`)
    .status(201)
    .json({ data: created });
});

router.get('/projects/:id', async (req, res) => {
  const project = await projectService.findById(req.params.id);
  if (!project) throw new AppError(404, 'PROJECT_NOT_FOUND', 'Project not found');
  res.status(200).json({ data: project });
});
```

**Why it works:** The example makes a boundary explicit and keeps failure behavior visible. It is intentionally small enough to copy into a real service and adapt without adding hidden global state.

**Naive / wrong approach:**

```javascript
// Naive: every outcome looks like HTTP 200.
res.json({ error: 'Project not found' });
```

This is attractive because it reduces the number of lines at first. The cost appears later: the request path becomes hard to test, a failure is misclassified, or a deployment assumption remains invisible until production.

**Correct approach:**

```javascript
// Correct: status and body agree on the outcome.
res.status(404).json({ error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' } });
```

The correction puts the decision at the boundary where the relevant information is available. It also creates a stable place for tests and operational checks to assert behavior.

**Gotcha:** Do not use 404 to conceal authorization failures automatically without considering the threat model and consistency of the API. The choice should be deliberate and documented.


### 9. Secure the HTTP boundary

Security headers, origin policy, input validation, rate limiting, and authentication solve different problems. Helmet sets several useful headers; CORS controls which browser origins can read responses; neither authenticates callers. Trust proxy settings only when the service sits behind a known proxy, because forwarded IP and protocol headers can otherwise be forged.

**Working example:**

```javascript
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

app.use(helmet());
app.use(cors({
  origin: ['https://studio.example.com'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true
}));
app.use('/api/', rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-8', legacyHeaders: false }));
```

**Why it works:** The example makes a boundary explicit and keeps failure behavior visible. It is intentionally small enough to copy into a real service and adapt without adding hidden global state.

**Naive / wrong approach:**

```javascript
// Naive: allow every origin and assume CORS is authentication.
app.use(cors({ origin: '*', credentials: true }));
```

This is attractive because it reduces the number of lines at first. The cost appears later: the request path becomes hard to test, a failure is misclassified, or a deployment assumption remains invisible until production.

**Correct approach:**

```javascript
// Correct: allow the known frontend origin; enforce identity and permissions separately.
app.use(cors({ origin: 'https://studio.example.com', credentials: true }));
app.use('/api/private', requireAuthentication, privateRouter);
```

The correction puts the decision at the boundary where the relevant information is available. It also creates a stable place for tests and operational checks to assert behavior.

**Gotcha:** Credentialed CORS responses cannot use `Access-Control-Allow-Origin: *`. Also, CORS is enforced by browsers, not by curl or server-to-server clients.


### 10. Create structured logs and request IDs

Logs should answer which request failed, how long it took, and which operation was involved without leaking credentials or personal data. A request ID ties the access log to downstream errors and support tickets. Prefer structured fields over string concatenation so log platforms can filter by status, route, and duration.

**Working example:**

```javascript
import { randomUUID } from 'node:crypto';
export function requestId() {
  return (req, res, next) => {
    req.id = randomUUID();
    res.setHeader('X-Request-Id', req.id);
    next();
  };
}
export function accessLog(logger) {
  return (req, res, next) => {
    const started = performance.now();
    res.on('finish', () => logger.info({
      requestId: req.id, method: req.method, path: req.path,
      status: res.statusCode, durationMs: Math.round(performance.now() - started)
    }, 'http request'));
    next();
  };
}
```

**Why it works:** The example makes a boundary explicit and keeps failure behavior visible. It is intentionally small enough to copy into a real service and adapt without adding hidden global state.

**Naive / wrong approach:**

```javascript
// Naive: log entire headers and body for easy debugging.
console.log(req.headers, req.body);
```

This is attractive because it reduces the number of lines at first. The cost appears later: the request path becomes hard to test, a failure is misclassified, or a deployment assumption remains invisible until production.

**Correct approach:**

```javascript
// Correct: log selected operational fields and redact sensitive values.
logger.info({ requestId: req.id, route: req.route?.path, status: res.statusCode });
```

The correction puts the decision at the boundary where the relevant information is available. It also creates a stable place for tests and operational checks to assert behavior.

**Gotcha:** Never log authorization headers, session cookies, passwords, payment details, or raw medical documents. A request ID is for correlation, not a secret or authentication token.


### 11. Test the app without opening a port

A testable app factory keeps HTTP behavior separate from process startup. Use unit tests for validation and services, plus HTTP-level tests for middleware order, status codes, and error envelopes. The built-in Node test runner is sufficient for many projects; Supertest is a common option for exercising an Express app without manually managing a listening port.

**Working example:**

```javascript
// test/health.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { once } from 'node:events';
import { createServer } from 'node:http';

test('live endpoint returns a healthy response', async (t) => {
  const server = createServer(createApp({ logger: { info() {}, error() {} } }));
  server.listen(0);
  await once(server, 'listening');
  t.after(() => server.close());
  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/health/live`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});
```

**Why it works:** The example makes a boundary explicit and keeps failure behavior visible. It is intentionally small enough to copy into a real service and adapt without adding hidden global state.

**Naive / wrong approach:**

```javascript
// Naive: tests import server.js and accidentally keep a real port open.
import '../src/server.js';
```

This is attractive because it reduces the number of lines at first. The cost appears later: the request path becomes hard to test, a failure is misclassified, or a deployment assumption remains invisible until production.

**Correct approach:**

```javascript
// Correct: import the app factory, create a temporary server, and close it after assertions.
const app = createApp({ logger, services: fakeServices });
const server = createServer(app);
server.listen(0);
await once(server, 'listening');
t.after(() => server.close());
```

The correction puts the decision at the boundary where the relevant information is available. It also creates a stable place for tests and operational checks to assert behavior.

**Gotcha:** Tests that bind a port should use port `0` and clean up after themselves. Ensure asynchronous teardown is awaited so tests do not pass while handles remain open.


### 12. Distinguish liveness from readiness

Liveness asks whether the process is alive enough to continue running; readiness asks whether it can serve useful traffic now. A process may be alive while its database is disconnected or a required dependency is still starting. Container orchestration uses these signals differently, so do not make liveness depend on every downstream service or it can cause restart loops.

**Working example:**

```javascript
app.get('/health/live', (_req, res) => {
  res.status(200).json({ status: 'alive' });
});
app.get('/health/ready', async (_req, res) => {
  const ready = await dependenciesAreReady();
  if (!ready) return res.status(503).json({ status: 'not_ready' });
  res.status(200).json({ status: 'ready' });
});
```

**Why it works:** The example makes a boundary explicit and keeps failure behavior visible. It is intentionally small enough to copy into a real service and adapt without adding hidden global state.

**Naive / wrong approach:**

```javascript
// Naive: a transient database outage makes liveness fail and restarts every process.
app.get('/health/live', async (_req, res) => {
  res.sendStatus(await database.ping() ? 200 : 503);
});
```

This is attractive because it reduces the number of lines at first. The cost appears later: the request path becomes hard to test, a failure is misclassified, or a deployment assumption remains invisible until production.

**Correct approach:**

```javascript
// Correct: keep liveness process-focused and put dependency checks in readiness.
app.get('/health/live', (_req, res) => res.sendStatus(200));
app.get('/health/ready', readinessHandler);
```

The correction puts the decision at the boundary where the relevant information is available. It also creates a stable place for tests and operational checks to assert behavior.

**Gotcha:** Readiness checks need timeouts. A health endpoint that waits indefinitely for a dependency can consume resources and fail to report a clear status.


### 13. Shut down gracefully

Deployments routinely replace processes. A graceful shutdown stops accepting new connections, gives active requests a bounded interval to finish, and closes dependencies. Without it, a process may be killed midway through a write or leave work in an ambiguous state. Shutdown must be idempotent because multiple signals or platform hooks can occur close together.

**Working example:**

```javascript
export function installShutdown({ server, closeDependencies, logger, timeoutMs = 10_000 }) {
  let shuttingDown = false;
  return async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'shutdown started');
    const timeout = setTimeout(() => {
      logger.error('graceful shutdown timed out');
      process.exitCode = 1;
      server.closeAllConnections?.();
    }, timeoutMs);
    timeout.unref();
    try {
      await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
      await closeDependencies();
    } catch (err) {
      logger.error({ err }, 'shutdown failed');
      process.exitCode = 1;
    } finally {
      clearTimeout(timeout);
    }
  };
}
```

**Why it works:** The example makes a boundary explicit and keeps failure behavior visible. It is intentionally small enough to copy into a real service and adapt without adding hidden global state.

**Naive / wrong approach:**

```javascript
// Naive: terminate immediately and assume active requests do not matter.
process.on('SIGTERM', () => process.exit(0));
```

This is attractive because it reduces the number of lines at first. The cost appears later: the request path becomes hard to test, a failure is misclassified, or a deployment assumption remains invisible until production.

**Correct approach:**

```javascript
// Correct: stop accepting connections, drain, then close dependencies with a deadline.
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
```

The correction puts the decision at the boundary where the relevant information is available. It also creates a stable place for tests and operational checks to assert behavior.

**Gotcha:** Do not call `process.exit()` immediately after setting a log line; buffered output may be lost. Set `process.exitCode` and allow cleanup to finish unless a hard deadline is exceeded.


### 14. Integrate the pieces in a realistic service

The final architecture should remain small enough to understand while keeping each boundary testable. A project catalogue API needs validated configuration, middleware in the right order, route modules, consistent error handling, and a server lifecycle. The following example is intentionally compact; production persistence and authentication are injected dependencies rather than hidden global singletons.

**Working example:**

```javascript
// src/server.js — simplified integration entry point
import { createServer } from 'node:http';
import { createApp } from './app.js';
import { config } from './config.js';
import { logger } from './logger.js';
import { createServices } from './services/index.js';

const services = await createServices(config);
const app = createApp({ logger, services });
const server = createServer(app);
server.listen(config.port, () => logger.info({ port: config.port }, 'API listening'));
const shutdown = installShutdown({
  server,
  closeDependencies: () => services.close(),
  logger
});
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
```

**Why it works:** The example makes a boundary explicit and keeps failure behavior visible. It is intentionally small enough to copy into a real service and adapt without adding hidden global state.

**Naive / wrong approach:**

```javascript
// Naive: configure routes, connect dependencies, and listen in one tangled callback.
app.listen(process.env.PORT, async () => {
  await connectDatabase();
  console.log('ready');
});
```

This is attractive because it reduces the number of lines at first. The cost appears later: the request path becomes hard to test, a failure is misclassified, or a deployment assumption remains invisible until production.

**Correct approach:**

```javascript
// Correct: validate configuration and initialize dependencies before listening.
const services = await createServices(config);
const app = createApp({ logger, services });
const server = createServer(app);
server.listen(config.port);
```

The correction puts the decision at the boundary where the relevant information is available. It also creates a stable place for tests and operational checks to assert behavior.

**Gotcha:** If dependency initialization fails, exit startup with a non-zero status and a useful log. Do not accept traffic while required infrastructure is only partially initialized.


## Relevant Patterns / Integration Patterns / Advanced Patterns


### Pattern 1: Environment-specific configuration without branching everywhere

**What it does:** Load environment-specific values at startup, validate them once, and inject the resulting config. This prevents every module from making its own assumptions about `NODE_ENV`.

**When to use it:** Use this when local development, CI, staging, and production differ in ports, origins, or dependency URLs. Keep secrets in the deployment secret manager rather than committing `.env` files.

```javascript
// src/config.js
export function loadConfig(env = process.env) {
  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
  const allowedOrigins = (env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
    .split(',').map(value => value.trim()).filter(Boolean);
  return Object.freeze({ port, allowedOrigins, nodeEnv: env.NODE_ENV ?? 'development' });
}
```

**Nuance:** Do not make production security weaker just to make local setup convenient; use explicit local defaults only for non-secret settings.


### Pattern 2: Route-level validation middleware

**What it does:** Validation middleware parses one request shape and stores only normalized values for the controller. This reduces repeated checks and keeps malformed input from reaching the database.

**When to use it:** Use it when several routes accept user-controlled IDs, pagination parameters, or resource payloads.

```javascript
export function validateProjectBody(req, res, next) {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  if (title.length < 3 || title.length > 120) {
    return res.status(422).json({ error: { code: 'INVALID_TITLE', message: 'Title must be 3–120 characters' } });
  }
  req.validated = { title };
  next();
}
router.post('/projects', validateProjectBody, async (req, res) => {
  const project = await projectService.create(req.validated);
  res.status(201).json({ data: project });
});
```

**Nuance:** For complex schemas, use a schema-validation library and report field-level issues. Never mutate the raw body into a trusted object without defining exactly which fields survive.


### Pattern 3: Request-scoped dependency injection

**What it does:** Attach stable services to application locals or pass them to router factories, instead of importing mutable singletons throughout the codebase. This creates a clear dependency graph and lets tests replace an email sender or repository.

**When to use it:** Use it when a route needs a database repository, mail service, or external API client and you want deterministic tests.

```javascript
export function createProjectsRouter({ projectService, logger }) {
  const router = Router();
  router.get('/', async (req, res) => {
    const projects = await projectService.list({ ownerId: req.user.id });
    logger.info({ requestId: req.id, count: projects.length }, 'projects listed');
    res.json({ data: projects });
  });
  return router;
}
```

**Nuance:** Avoid building a custom dependency-injection framework for a small app. Plain function parameters are often enough.


### Pattern 4: Consistent error taxonomy

**What it does:** Define a small set of expected application errors and map them to status codes in one place. This stops database errors, validation failures, and permission denials from being serialized differently by every controller.

**When to use it:** Use it when a frontend needs stable error codes for inline form messages and support needs a request ID for unexpected failures.

```javascript
export class NotFoundError extends Error {
  constructor(resource) { super(`${resource} not found`); this.status = 404; this.code = 'NOT_FOUND'; }
}
export class ConflictError extends Error {
  constructor(message) { super(message); this.status = 409; this.code = 'CONFLICT'; }
}
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const known = err.status >= 400 && err.status < 500;
  req.app.locals.logger.error({ err, requestId: req.id }, 'request error');
  res.status(known ? err.status : 500).json({ error: {
    code: known ? err.code : 'INTERNAL_ERROR',
    message: known ? err.message : 'An unexpected error occurred', requestId: req.id
  }});
}
```

**Nuance:** Do not turn every database exception into a 400. Constraint violations may map to 409, while connectivity failures should remain server-side faults.


### Pattern 5: Idempotency for retryable writes

**What it does:** An idempotency key lets a client safely retry a write after a timeout without duplicating the side effect. Store the key with a request fingerprint and result under a unique constraint, and define how concurrent duplicate requests behave.

**When to use it:** Use it for payment initiation, booking creation, or any operation where a client may retry after losing the response.

```javascript
router.post('/bookings', requireAuthentication, async (req, res) => {
  const key = req.get('Idempotency-Key');
  if (!key || key.length > 128) {
    return res.status(400).json({ error: { code: 'IDEMPOTENCY_KEY_REQUIRED', message: 'Provide an Idempotency-Key' } });
  }
  const result = await bookingService.createIdempotently({
    userId: req.user.id, key, input: req.validated
  });
  res.status(result.replayed ? 200 : 201).json({ data: result.booking });
});
```

**Nuance:** The route alone does not provide idempotency. The service must enforce uniqueness atomically in persistent storage and reject reuse of the same key with a different payload.


### Pattern 6: Request timeout and slow dependency protection

**What it does:** Bound waiting time for downstream operations and make timeout behavior explicit. A timeout should not imply that a write definitely failed: the dependency may have committed before the response was lost.

**When to use it:** Use it when a route calls a third-party service or a database query can wait indefinitely.

```javascript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 2_500);
try {
  const response = await fetch('https://catalog.example.net/items', {
    signal: controller.signal,
    headers: { accept: 'application/json' }
  });
  if (!response.ok) throw new AppError(502, 'CATALOG_UPSTREAM_ERROR', 'Catalog service failed');
  const items = await response.json();
  res.json({ data: items });
} finally {
  clearTimeout(timeout);
}
```

**Nuance:** Set different budgets for connection establishment, query execution, and total request time when the client library supports it. Do not blindly retry non-idempotent operations.


### Pattern 7: Graceful deployment with readiness

**What it does:** Mark the service unready before draining traffic, stop accepting new connections, then close dependencies after active requests finish. This pattern aligns the app lifecycle with orchestrator lifecycle hooks.

**When to use it:** Use it for containerized deployments behind a load balancer where instances are rotated during releases.

```javascript
let acceptingTraffic = true;
app.get('/health/ready', (_req, res) => {
  res.sendStatus(acceptingTraffic && services.isReady() ? 200 : 503);
});
async function shutdown(signal) {
  if (!acceptingTraffic) return;
  acceptingTraffic = false;
  logger.info({ signal }, 'draining requests');
  await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  await services.close();
}
```

**Nuance:** The load balancer needs time to observe readiness changes. Coordinate its deregistration delay with the app’s drain timeout instead of assuming they happen instantaneously.


## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Reading `process.env.PORT` as a string and never validating it | Environment variables look like ordinary typed settings, but they are text and may be malformed | Parse with `Number`, check integer/range constraints, and export a validated config object |
| Starting the listener inside the imported app module | App setup and process lifecycle feel like one task during a tutorial | Export `createApp()` and call `listen()` only from `server.js` |
| Registering routes before `express.json()` | Middleware order is not visible in the route declaration itself | Put body parsing before routers and cover it with an HTTP test |
| Using an unlimited JSON parser | Small development payloads hide memory-exhaustion risk | Set `express.json({ limit: '256kb' })` or a measured endpoint-specific limit |
| Treating parsed JSON as validated input | Parsing proves syntax, not schema or business rules | Validate allowed keys, types, lengths, ranges, and relationships before service calls |
| Returning HTTP 200 for a missing resource | The developer focuses on response text instead of the HTTP contract | Return 404 with a stable error code and a consistent JSON envelope |
| Exposing `err.message` for every exception | Error messages are convenient during development | Serialize safe messages only for known client errors; return a generic 500 message otherwise |
| Catching an exception and then returning success | A catch block is mistaken for recovery | Re-throw or pass the error to Express unless a real fallback has completed successfully |
| Treating CORS as authentication | Browser cross-origin rules are confused with server access control | Authenticate and authorize requests independently; configure CORS only for browser access policy |
| Allowing `*` with credentialed CORS | Wildcard origins seem like a quick way to unblock a frontend | Enumerate trusted origins when `credentials: true` is needed |
| Trusting every forwarded IP header | Deployment behind a proxy encourages enabling proxy trust globally | Configure `trust proxy` for the actual proxy topology and test rate-limit IP behavior |
| Logging all headers and request bodies | Raw logs appear useful when debugging | Log request ID, method, route, status, and duration; redact secrets and personal data |
| Using liveness as a dependency health check | A single health endpoint appears simpler | Keep liveness process-focused and use readiness for dependencies required to serve traffic |
| Calling `process.exit()` immediately on SIGTERM | Immediate termination seems deterministic | Stop accepting traffic, drain requests, close dependencies, and use a bounded deadline |
| Retrying a write after timeout without idempotency | A timeout is interpreted as proof that the server did nothing | Use an idempotency key backed by an atomic persistent uniqueness constraint |
| Importing a server into tests | The server file is the easiest module to import | Test the app factory and use port `0` only for tests that need real sockets |
| Forgetting to clean up test servers and timers | Tests pass even though event-loop handles remain open | Register awaited teardown with the test framework and clear timers in `finally` blocks |
| Placing the error handler before the routers | Error middleware looks like ordinary middleware | Register the four-argument error handler after routes and the not-found handler |

**Before → After: async failure handling**

```javascript
// Before: logs the error but lies to the caller.
router.post('/projects', async (req, res) => {
  try { await projectService.create(req.body); }
  catch (error) { console.error(error); }
  res.status(201).json({ data: 'created' });
});
```

```javascript
// After: Express 5 forwards a rejected promise to the final error handler.
router.post('/projects', async (req, res) => {
  const input = parseProject(req.body);
  const project = await projectService.create(input);
  res.status(201).json({ data: project });
});
```

The corrected version does not claim that work succeeded unless the service completed. Validation errors and unexpected exceptions are then mapped centrally.


## Mental Models

1. **The listener is the process boundary** — constructing an Express app should not unexpectedly open a port or start external work.
2. **Middleware order is policy** — the sequence determines what every route can observe and which protections apply.
3. **Parsed is not trusted** — JSON parsing changes bytes into objects; validation turns a narrow subset into acceptable application input.
4. **Configuration is input too** — validate environment values at startup just as carefully as a request body.
5. **Errors are part of the API** — status codes, stable error codes, and safe messages are observable behavior that clients depend on.
6. **A timeout is uncertainty, not rollback** — the server or upstream may have committed a write before the response disappeared.
7. **Health signals answer different questions** — liveness asks whether to restart; readiness asks whether to send traffic.
8. **Logs are an interface** — structured, correlated, redacted fields help operators diagnose incidents without exposing secrets.


## Quick Reference

| Property/Situation | Value/Answer | Notes |
|---|---|---|
| Create an Express app | `const app = express()` | Keep construction separate from listening |
| Start a server | `createServer(app).listen(port)` | Entry point owns the listener |
| Parse JSON | `express.json({ limit: '256kb' })` | Parsing is not schema validation |
| Parse URL-encoded forms | `express.urlencoded({ extended: false, limit: '32kb' })` | Add only when form bodies are accepted |
| Read route parameter | `req.params.projectId` | Validate format before lookup |
| Read query parameter | `req.query.limit` | Values may be strings or arrays; normalize explicitly |
| Read request body | `req.body` | Treat as untrusted data |
| Send JSON | `res.status(200).json({ data })` | Choose status deliberately |
| Successful creation | `201 Created` | Consider a `Location` header for the new resource |
| Accepted background job | `202 Accepted` | Return job ID/status URL if available |
| Malformed request | `400 Bad Request` | Use for syntax or basic request-format failures |
| Semantically invalid input | `422 Unprocessable Content` | Follow one consistent API convention |
| Missing resource | `404 Not Found` | Do not leak sensitive existence information accidentally |
| State conflict | `409 Conflict` | Duplicate unique value or incompatible state transition |
| Unexpected server fault | `500 Internal Server Error` | Do not expose stack traces to clients |
| Upstream service failure | `502 Bad Gateway` | Use when acting as a gateway to a failed dependency |
| Service temporarily unavailable | `503 Service Unavailable` | Useful for readiness/draining state |
| Final error middleware signature | `(err, req, res, next)` | Four arguments are required by Express |
| Not-found handler | `app.use((req, res) => ...)` | Register after application routes |
| Secure response headers | `helmet()` | Tune policies for the actual app |
| Browser CORS policy | `cors({ origin: 'https://studio.example.com' })` | Not an authorization system |
| Correlate requests | `X-Request-Id` | Generate or safely validate at the edge |
| Request duration | `performance.now()` delta | Record status and route with duration |
| App factory | `createApp(dependencies)` | Improves tests and dependency boundaries |
| Test runner | `node --test` | Built into supported Node versions |
| Development restart | `node --watch src/server.js` | Avoid relying on it for production process supervision |
| Graceful stop signal | `SIGTERM` | Drain, close dependencies, enforce a deadline |
| Avoid duplicate writes | `Idempotency-Key` + persistent uniqueness | Route header alone is insufficient |
| Readiness endpoint | `/health/ready` | Check dependencies with bounded timeouts |
| Liveness endpoint | `/health/live` | Avoid coupling to transient downstream outages |
| Hide Express fingerprint | `app.disable('x-powered-by')` | Small hardening measure, not a full security strategy |
| Trust proxy | `app.set('trust proxy', <known topology>)` | Never blindly trust arbitrary forwarded headers |
| Install production dependencies | `npm ci --omit=dev` | Use lockfile reproducibly in deployment |
| Inspect runtime version | `node --version` | Match CI and production runtime ranges |
| Keep secrets out of Git | deployment secret store / ignored local `.env` | Rotate any credential accidentally committed |

## Build Challenge

### Build: Studio Projects API — Production-Ready Express Service

Build a small API for a design studio that lists portfolio projects, creates a project record, and reports service health. The point is not to build many endpoints; it is to prove that startup, middleware order, input boundaries, error behavior, tests, and shutdown are deliberate. Use an in-memory repository initially if necessary, but keep the service interface injectable so persistence can be added later without rewriting HTTP handlers.

**Requirements**

1. Create `src/app.js` with a `createApp({ logger, services })` factory and no listening side effect.
2. Create `src/server.js` that validates configuration, initializes services, binds the HTTP server, and logs the selected port.
3. Validate `PORT` and required secrets before opening the listener; document every required environment variable in a checked-in `.env.example` containing no real credentials.
4. Register request ID, access logging, Helmet, JSON parsing with a size limit, API router, not-found handler, and error handler in a deliberate order.
5. Implement `GET /api/v1/projects` with bounded pagination and a stable `{ data, meta }` response.
6. Implement `POST /api/v1/projects` with schema validation, normalized title/description fields, and `201 Created` on success.
7. Return a stable JSON error envelope with a request ID and never return a stack trace to clients.
8. Add separate `/health/live` and `/health/ready` endpoints; readiness must fail with 503 when a required service is unavailable.
9. Write automated tests for a valid create, invalid title, missing project, unknown route, request ID, and an unexpected service rejection.
10. Add a request-size test or documented manual test proving that oversized JSON is rejected instead of being passed to a controller.
11. Implement graceful shutdown for SIGTERM/SIGINT that stops accepting new traffic, closes the service layer, and has a bounded timeout.
12. Write a README with setup, test, environment, response-code, and shutdown instructions; include a short security note explaining why CORS is not authentication.

**Expected output / definition of success**

- `npm test` exits with status 0 and no leaked sockets, timers, or unhandled rejections.
- The app can be imported by tests without binding a fixed port or connecting to a real database.
- Invalid configuration causes startup to fail before the server begins accepting traffic.
- Valid creation returns 201 and a resource ID; invalid input returns a 4xx status with a stable error code.
- An unknown route returns 404, and an unexpected exception returns a generic 500 response with a request ID.
- `/health/live` remains successful during a simulated dependency outage while `/health/ready` returns 503.
- Logs include method, route/path, status, duration, and request ID without logging credentials or full bodies.
- SIGTERM drains active requests and closes dependencies within the configured deadline.
- `npm ci` and the documented start command work from a clean checkout using the declared Node version.

**Suggested focused-session plan:** 25 minutes for package/config/app factory; 35 minutes for middleware and routes; 25 minutes for validation and error mapping; 30 minutes for HTTP tests; 20 minutes for health checks and shutdown; 15 minutes for README and a final clean-install test.
