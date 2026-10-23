# SKILL: background-jobs
**Layer:** 18 — Backend Development
**Goal:** Design, implement, operate, and debug reliable asynchronous background work that survives retries, worker restarts, traffic spikes, and partial failure without losing or duplicating business operations.

---

## Why This Matters (Senior Perspective)

A web request is a poor place to perform work whose duration or reliability is outside the request's control. Imagine a client commissioning a portfolio site with a contact form, a digital agency uploading hundreds of product images, or a marketplace sending invoices and order notifications. If the API sends email, resizes every image, calls three third-party services, and writes analytics before returning, a slow provider can make the user wait, cause a proxy timeout, or leave the client unsure whether the action succeeded. A browser retry may then create duplicate orders or send the same invoice twice. If a process crashes halfway through, the system may have saved the order but not sent the confirmation—or sent the confirmation before the database transaction rolled back.

A beginner often thinks “background job” means starting a thread, calling `setTimeout`, or returning a success response before a long function finishes. A senior developer first identifies the business operation, its source of truth, its delivery guarantees, and the failure boundaries. They ask what happens if the worker dies after performing the side effect but before acknowledging the message; whether retries are safe; whether a job can run twice; how poison messages are isolated; how queue depth and job age are monitored; and who can replay failed work. A queue does not magically provide exactly-once effects. Most practical systems provide at-least-once delivery and make handlers idempotent.

This matters in creative and freelance work because polished interfaces frequently conceal real operational complexity. A branded portfolio may need contact emails, image processing, PDF generation, webhook delivery, content publishing, or scheduled report generation. A client judges the result by whether it reliably arrives, not by whether the submit button looked impressive. A robust design acknowledges the request quickly, records durable intent, shows a truthful status, and lets operators inspect or retry failures. It also protects the client's budget: uncontrolled retries can burn paid API credits, duplicate invoices, overwhelm a database, or trigger provider rate limits. Background processing is therefore a product, data-consistency, security, and operations discipline—not merely a performance trick.

---

## Core Concepts

### 1. Request lifecycle versus job lifecycle

**Mental model:** an HTTP request is a short conversation; a job is a durable promise to finish work later. The request should validate and persist the intent, then return a response that accurately describes what has happened. The worker owns the long-running execution.

A queue message should normally contain an identifier or a small, versioned command—not a copy of an entire mutable database record. The worker loads current state and checks whether the requested transition is still valid. That avoids processing stale payloads and keeps messages small.

```ts
// TypeScript / Express: request persists intent before acknowledging it.
app.post('/api/reports', async (req, res, next) => {
  try {
    const input = reportRequestSchema.parse(req.body);
    const report = await reportRepository.create({
      ownerId: req.user.id,
      status: 'queued',
      format: input.format,
    });

    // enqueueReport should publish durably or use an outbox transaction.
    await enqueueReport({ reportId: report.id, schemaVersion: 1 });
    return res.status(202).json({ id: report.id, status: 'queued' });
  } catch (error) {
    next(error);
  }
});
```

`202 Accepted` means the server accepted the request for processing; it does not mean the report is complete. If the database write succeeds but publishing fails, the report can become stranded. The transactional outbox pattern later in this skill closes that gap.

**Naive approach — detached work inside the request:**

```ts
app.post('/api/reports', async (req, res) => {
  // Wrong: process memory is not a durable queue.
  void generateReport(req.body);
  res.status(200).json({ status: 'done' });
});
```

**Correct approach:** persist a job record and/or durable queue message, return a truthful queued state, and provide a status endpoint when the user needs progress. For tiny tasks in a controlled single-process script, direct execution can be acceptable; it is not a production queue substitute.

**Gotcha:** returning `202` before durable acceptance creates a silent-loss window. Never confuse “the function was started” with “the system has accepted responsibility.”

### 2. Queue, producer, broker, and consumer

**Mental model:** a producer creates work, a broker stores and distributes it, and a consumer performs it. These are distinct responsibilities even if a development implementation uses one process. A queue is not the business database; it is a mechanism for delivering commands to workers.

Common choices include Redis-backed queues, RabbitMQ, cloud-managed queues, and Kafka for event streams. Pick based on semantics and operations—not popularity alone. A task queue usually wants delayed delivery, acknowledgements, retries, and per-job status. A log/stream emphasizes ordered records, partitions, and consumer offsets. A database table can be a valid small-scale queue if claiming, locking, and cleanup are designed carefully.

```python
# Python producer/consumer contract; broker functions are adapter boundaries.
from dataclasses import dataclass

@dataclass(frozen=True)
class GenerateInvoice:
    invoice_id: str
    schema_version: int = 1

async def publish_invoice_job(command: GenerateInvoice) -> None:
    # The adapter serializes a validated command and publishes it durably.
    await broker.publish(
        topic="invoice.generate.v1",
        message={"invoice_id": command.invoice_id,
                 "schema_version": command.schema_version},
    )

async def consume_invoice_job(message: dict) -> None:
    command = GenerateInvoice(
        invoice_id=message["invoice_id"],
        schema_version=message["schema_version"],
    )
    await invoice_service.generate(command.invoice_id)
```

Keep the message contract explicit. Validate payloads at the consumer boundary because messages may be old, malformed, manually replayed, or produced by a newer deployment. Include a schema version when the shape can evolve.

**Wrong:** putting an ORM object, request object, open file handle, or secret token directly into a job payload. Those values are not portable across processes and may leak private information.

**Gotcha:** queue names and routing keys are part of your deployed architecture. Renaming them without a migration can strand old messages or cause old workers to stop receiving work.

### 3. Durable acceptance and the transactional outbox

**Mental model:** the database transaction and the broker publish are two separate systems; without distributed transactions, they can disagree. If an order row commits but queue publication fails, no worker sees it. If publication happens first but the database transaction rolls back, the worker sees a job for nonexistent state.

The outbox pattern writes business state and an event row in one database transaction. A separate publisher claims unsent outbox rows, publishes them, and marks them delivered. The publisher may publish twice if it crashes after sending but before marking the row; consumers must therefore be idempotent.

```sql
-- Business change and durable intent are committed together.
BEGIN;
INSERT INTO orders (id, customer_id, status)
VALUES ('ord_8f21', 'cus_91', 'paid');

INSERT INTO outbox_events (event_id, event_type, aggregate_id, payload, created_at)
VALUES (
  'evt_5a2c',
  'order.paid.v1',
  'ord_8f21',
  '{"orderId":"ord_8f21"}',
  CURRENT_TIMESTAMP
);
COMMIT;
```

A publisher can use `FOR UPDATE SKIP LOCKED` in databases that support it to claim rows without multiple publisher instances blocking each other. Keep claims bounded, use a lease or transaction, and record attempt counts and error information. Delete or archive old rows according to an explicit retention policy.

```python
async def publish_outbox_batch(limit: int = 100) -> int:
    events = await outbox.claim_pending(limit=limit)
    published = 0
    for event in events:
        try:
            await broker.publish(event.event_type, event.payload,
                                 message_id=event.event_id)
            await outbox.mark_published(event.event_id)
            published += 1
        except TransientBrokerError:
            # Leave it pending; the next poll will retry it.
            await outbox.record_attempt(event.event_id)
    return published
```

**Naive approach:** call `await broker.publish(...)` inside the request and assume that makes it atomic with the database commit. It does not.

**Gotcha:** the outbox guarantees durable publication intent, not exactly-once delivery. A message can be published and then published again after a crash. The consumer must tolerate duplicates.

### 4. At-least-once delivery and idempotent handlers

**Mental model:** a worker can perform the effect and crash before acknowledging the message. The broker redelivers, so the same handler runs again. Design for repeated execution rather than assuming a job is called exactly once.

An idempotent operation produces the same business result when repeated with the same logical identity. Use stable operation IDs, unique database constraints, compare-and-set transitions, and provider idempotency keys. Do not use a random key generated on each retry; that makes every attempt look new.

```python
async def capture_payment(job: dict) -> None:
    # The payment_operation_id remains stable across all retries.
    operation_id = job["payment_operation_id"]
    payment = await payments.get_operation(operation_id)
    if payment.status == "captured":
        return  # A previous attempt already completed the business effect.

    result = await payment_provider.capture(
        payment.provider_payment_id,
        idempotency_key=operation_id,
    )
    await payments.mark_captured(operation_id, provider_reference=result.id)
```

For a database-only effect, a unique constraint is stronger than “check then insert,” because two workers can pass the check concurrently.

```sql
CREATE TABLE processed_messages (
  consumer_name TEXT NOT NULL,
  message_id TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (consumer_name, message_id)
);
```

Insert the message marker and apply the business update in the same transaction. If the marker already exists, skip the duplicate. If processing includes an external side effect, the database marker alone cannot atomically cover that external provider; use the provider's idempotency feature or a state machine and reconciliation process.

**Gotcha:** “exactly once” usually describes a narrow broker or transaction boundary, not an end-to-end business effect spanning a database and a third-party API.

### 5. Acknowledgements, visibility timeouts, and leases

**Mental model:** acknowledgement tells the broker that a delivery is complete. A message should be acknowledged only after the required durable effects succeed. In visibility-timeout systems, a message becomes available again if the consumer does not acknowledge before the timeout.

If a task usually takes 30 seconds but visibility expires after 10 seconds, a second worker may start the same task while the first is still running. Set timeouts from measured execution distributions, extend visibility for legitimately long jobs, and make handlers idempotent regardless. A lease should have an owner token and expiry; never let a stale worker release another worker's lease.

```python
async def process_delivery(delivery) -> None:
    try:
        await asyncio.wait_for(
            handle_job(delivery.payload),
            timeout=delivery.processing_deadline_seconds,
        )
    except RetryableJobError:
        await delivery.nack(requeue=True)
        raise
    except PermanentJobError as error:
        await delivery.reject_to_dead_letter(reason=str(error))
        return
    else:
        # Acknowledge only after the durable work is complete.
        await delivery.ack()
```

A timeout does not prove the operation stopped. A remote service may complete a request after the client times out. Treat timeouts as uncertain outcomes and reconcile with stable operation IDs before repeating dangerous side effects.

**Gotcha:** ack-before-work can lose jobs permanently; work-before-ack can duplicate them. Durable state and idempotency make the second failure mode safe.

### 6. Retry policy, exponential backoff, and jitter

**Mental model:** retry when failure is likely transient, not merely because an exception occurred. Retry storms can turn a partial outage into a system-wide outage. A useful policy limits attempts, increases delay, adds randomness, and classifies errors.

Typical transient failures include temporary network errors, HTTP 429, selected 5xx responses, and database connection interruptions. Permanent failures include invalid payloads, missing required fields, unsupported schema versions, and authorization errors that will not change without intervention. Some errors are ambiguous and need provider-specific handling.

```ts
function retryDelayMs(attempt: number): number {
  const baseMs = 500;
  const capMs = 60_000;
  // Full jitter spreads workers across the allowed backoff window.
  const ceiling = Math.min(capMs, baseMs * 2 ** attempt);
  return Math.floor(Math.random() * ceiling);
}

function shouldRetry(error: unknown): boolean {
  if (error instanceof InvalidJobPayloadError) return false;
  if (error instanceof RateLimitError) return true;
  if (error instanceof TemporaryNetworkError) return true;
  return error instanceof RetryableProviderError;
}
```

Respect a provider's `Retry-After` header where applicable, within a reasonable operational cap. Record the attempt number and next scheduled time. Avoid retrying a job forever; after a maximum attempt count or age, move it to a dead-letter or failed state for investigation.

**Wrong:** immediately retry in a tight loop. It increases pressure on the failing dependency and wastes worker capacity.

**Gotcha:** the exponential formula can overflow or produce absurd delays if attempts are unbounded. Cap both delay and total retry horizon.

### 7. Dead-letter queues and poison messages

**Mental model:** a dead-letter queue (DLQ) is an isolation area for work that cannot proceed automatically. It is not a trash can and not a substitute for alerting. A poison message repeatedly crashes the worker, blocks a partition, or fails permanently because its payload or required data is invalid.

A useful dead-letter record preserves the original message ID, queue, payload or secure payload reference, error class, safe error summary, attempt count, timestamps, and deployment/version information. Never copy credentials or sensitive personal data into an unrestricted DLQ dashboard. Restrict access and define retention because dead letters can contain production customer information.

```python
async def route_to_dead_letter(job, error: Exception) -> None:
    await dead_letters.insert({
        "job_id": job.id,
        "queue": job.queue_name,
        "payload_ref": await secure_payload_store.save(job.payload),
        "error_type": type(error).__name__,
        "error_summary": safe_error_message(error),
        "attempts": job.attempts,
        "failed_at": datetime.now(timezone.utc).isoformat(),
    })
    await job.acknowledge_original()
```

Replaying a DLQ item should be an explicit, auditable operation. Validate that the root cause is fixed, choose whether to replay one item or a bounded batch, preserve its logical idempotency key, and avoid replaying an obsolete command against changed business state.

**Gotcha:** automatically replaying every DLQ message in a loop can re-create the same incident. DLQ replay needs rate limits, authorization, and visibility into the effect of each attempt.

### 8. Concurrency, worker pools, and backpressure

**Mental model:** concurrency is how many tasks may be in flight; throughput is completed work per unit time. More concurrency can improve utilization until the database, API provider, CPU, memory, or connection pool becomes the bottleneck. Beyond that point, latency and failure rate rise.

Bound worker concurrency and align it with downstream capacity. If each job opens a database connection, running 500 jobs against a 30-connection pool simply creates a queue inside the database driver. Apply separate limits for different workloads: image transforms may be CPU-bound, while email delivery is network-bound.

```python
async def run_worker(queue, concurrency: int = 12) -> None:
    semaphore = asyncio.Semaphore(concurrency)

    async def run_one(job):
        async with semaphore:
            await process_with_metrics(job)

    while True:
        job = await queue.receive(timeout_seconds=2)
        if job is None:
            continue
        asyncio.create_task(run_one(job))
```

This simplified loop needs task tracking and graceful shutdown in production; otherwise untracked tasks can be abandoned. Prefer a structured worker pool that waits for active tasks and stops receiving new messages during shutdown. Backpressure can pause intake when memory, queue age, or downstream saturation crosses a threshold.

**Gotcha:** an unbounded `create_task` loop is not a concurrency limit. It can allocate thousands of pending tasks and exhaust memory even if each task is asynchronous.

### 9. Job state machines and progress reporting

**Mental model:** a long-running job is a business entity with legal state transitions, not just a boolean `done`. Typical states are `queued`, `running`, `succeeded`, `retrying`, `failed`, and `cancelled`; some workflows also need `waiting_for_input` or `compensating`.

Persist state transitions with timestamps and attempt counts. Define which transitions are legal and use conditional updates to prevent two workers from both claiming the same job. Store progress as meaningful milestones, not arbitrary percentages that cannot be measured accurately.

```sql
UPDATE jobs
SET status = 'running', started_at = NOW(), worker_id = 'worker-12'
WHERE id = 'job_7c9a' AND status IN ('queued', 'retrying');
```

Check the affected row count. If zero rows changed, another worker may have claimed the job or the job may no longer be eligible. For a polling UI, return a stable status shape and avoid exposing internal exception details. Use Server-Sent Events or WebSockets only when live updates justify the added infrastructure; ordinary polling with sensible intervals is often sufficient.

**Gotcha:** progress values can move backward or lie if they are guessed. Prefer explicit stages such as `downloading`, `rendering`, and `uploading`, with counts when those counts are real.

### 10. Scheduling, delayed jobs, and recurring work

**Mental model:** scheduled execution creates work at a future time; the queue executes that work. A scheduler should not be the only place where business intent exists. Record the schedule or next run in durable storage and make each occurrence identifiable.

Recurring jobs need a policy for missed schedules: skip, catch up, coalesce, or run every missed occurrence. A nightly report usually should not create 30 overlapping runs after a month of downtime. A billing reconciliation might need to catch up every period. Make the policy explicit, and account for time zones and daylight-saving changes.

```python
async def schedule_daily_digest(user_id: str, local_date: date) -> None:
    # The logical occurrence key prevents duplicate scheduling for one day.
    occurrence_key = f"digest:{user_id}:{local_date.isoformat()}"
    await scheduler.create_if_absent(
        key=occurrence_key,
        run_at=next_digest_time(user_id, local_date),
        command={"user_id": user_id, "local_date": local_date.isoformat()},
    )
```

For cron-like schedules, store an IANA timezone such as `Asia/Kolkata`, not only a fixed UTC offset, if the user's local clock time is the requirement. If multiple scheduler instances exist, use a distributed claim or a single-leader strategy; otherwise each instance may enqueue the same occurrence.

**Gotcha:** “run at 9 AM” is ambiguous without a time zone and daylight-saving policy. Persist the intended schedule semantics, not just a timestamp.

### 11. CPU-bound work, I/O-bound work, and worker isolation

**Mental model:** async I/O lets a process wait efficiently on network and database operations; it does not make CPU-heavy work parallel. Image rendering, video transcoding, PDF generation, and large data transforms can block an event loop or starve unrelated jobs.

Use separate worker pools or processes for CPU-heavy work. Set memory and CPU limits, use temporary storage with cleanup, and stream large files instead of loading them all into RAM. For Python, a process pool or external worker service is often more suitable than blocking the event loop. For Node.js, use worker threads or a separate process for CPU-intensive tasks.

```ts
import { Worker } from 'node:worker_threads';

function renderPreview(inputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./render-worker.js', import.meta.url), {
      workerData: { inputPath },
    });
    worker.once('message', (result) => resolve(result.outputPath));
    worker.once('error', reject);
    worker.once('exit', (code) => {
      if (code !== 0) reject(new Error(`Render worker exited: ${code}`));
    });
  });
}
```

The worker code must validate input paths and must not trust user-controlled paths. Production implementations should also terminate workers on deadlines and avoid resolving twice when both error and exit events occur. A dedicated queue allows resource-heavy work to be scaled independently of email or notification jobs.

**Gotcha:** async syntax is not a CPU isolation boundary. One large synchronous loop can block timers, health checks, and all other work in the same event loop.

### 12. Observability, tracing, and operational runbooks

**Mental model:** a job is not observable merely because it logs “started” and “finished.” Operators need to answer how many jobs are waiting, how old the oldest job is, how long processing takes, which failures are recurring, and whether retries are making progress.

Measure queue depth, oldest-message age, enqueue-to-start latency, execution duration, success/failure rate, retry count, DLQ count, worker saturation, and downstream dependency latency. Use structured logs with `job_id`, `message_id`, `attempt`, `queue`, and trace context. Do not log full payloads by default; redact secrets and personal information.

```python
logger.info(
    "job_finished",
    extra={
        "job_id": job.id,
        "message_id": job.message_id,
        "attempt": job.attempt,
        "queue_name": job.queue_name,
        "duration_ms": elapsed_ms,
        "outcome": "succeeded",
    },
)
```

Set alerts on user impact and sustained trends, not every isolated retry. A queue with 10,000 messages may be healthy if throughput is high and oldest age is low; a queue with 20 messages may be broken if the oldest has waited six hours. Define an operator runbook: inspect, pause, replay, cancel, or drain a queue with explicit permissions and audit history.

**Gotcha:** high-cardinality metric labels such as raw job IDs create expensive metrics. Put per-job identifiers in logs and traces, not metric labels.

### 13. Cancellation, deadlines, and graceful shutdown

**Mental model:** cancellation is a request to stop, not proof that the work stopped or its side effects were rolled back. A worker must stop accepting new jobs during shutdown, finish or safely release in-flight jobs, and avoid acknowledging incomplete work.

Use a deadline budget across all steps instead of giving every dependency the full timeout. For example, a 60-second job may allocate 10 seconds to fetch data, 35 seconds to render, and 10 seconds to upload, leaving a small margin for cleanup. Cancellation should be checked at safe boundaries, especially before irreversible side effects.

```python
async def worker_main(stop_event: asyncio.Event) -> None:
    active: set[asyncio.Task] = set()
    while not stop_event.is_set():
        job = await queue.receive(timeout_seconds=1)
        if job is None:
            continue
        task = asyncio.create_task(process_job(job))
        active.add(task)
        task.add_done_callback(active.discard)

    # Stop intake first, then allow active work a bounded grace period.
    if active:
        done, pending = await asyncio.wait(active, timeout=25)
        for task in pending:
            task.cancel()
```

The simplified example should be completed with exception collection and broker-specific release behavior. If the platform kills the process after a grace period, the visibility timeout or lease must allow safe redelivery. Do not catch cancellation and then continue doing expensive work as if nothing happened.

**Gotcha:** process shutdown hooks are best-effort. Correctness must still survive abrupt termination, machine loss, and forced deployment restarts.

### 14. Security, tenant isolation, and payload evolution

**Mental model:** queued work can outlive the request, user session, deployment, and permission state that created it. Treat the queue and its payloads as an internal API with authentication, authorization, validation, versioning, and retention rules.

Never trust a `tenant_id` from a message without validating it against the referenced resource. Do not put session cookies, bearer tokens, passwords, or full payment details into queue payloads. Store a resource identifier and retrieve sensitive data through authorized service code. Restrict who can enqueue privileged jobs and who can replay dead-letter messages.

```python
async def export_customer_data(job: dict) -> None:
    customer_id = validate_identifier(job.get("customer_id"))
    requested_tenant = validate_identifier(job.get("tenant_id"))

    customer = await customers.get(customer_id)
    if customer.tenant_id != requested_tenant:
        raise PermanentJobError("Resource is outside the requested tenant")

    # Use a service identity with narrowly scoped export permissions.
    await export_service.create_archive(customer_id, tenant_id=requested_tenant)
```

For schema changes, use compatible rollout phases: deploy consumers that can read old and new payloads, begin producing the new version, wait for old messages to drain, then remove old support. Include message expiry or migration policy for long-delayed jobs.

**Gotcha:** queue ACLs do not replace resource-level authorization. A trusted internal message can still reference the wrong tenant or an object that the initiating user no longer has permission to access.

### 15. Workflow orchestration, sagas, and compensation

**Mental model:** one job is appropriate for a bounded unit of work; a multi-step business process needs a workflow model. If a digital order requires payment, inventory reservation, image processing, and email, each step can succeed or fail independently.

A saga represents a sequence of local transactions with compensating actions where possible. Compensation is not always a literal rollback: refunding a payment is a new business transaction, and an email cannot be unsent. Persist workflow state and each step's outcome so a restart can resume or compensate deliberately.

```ts
type OrderWorkflowState =
  | 'created'
  | 'payment_captured'
  | 'inventory_reserved'
  | 'completed'
  | 'compensating'
  | 'failed';

async function advanceOrder(orderId: string): Promise<void> {
  const order = await orders.get(orderId);
  if (order.state === 'created') {
    await paymentJobs.enqueue({ orderId, operation: 'capture' });
    return;
  }
  if (order.state === 'payment_captured') {
    await inventoryJobs.enqueue({ orderId, operation: 'reserve' });
    return;
  }
  if (order.state === 'inventory_reserved') {
    await orders.markCompleted(orderId);
  }
}
```

Real workflows need transition guards, idempotent step handlers, deadlines, compensation rules, and reconciliation for uncertain provider responses. For complex long-lived processes, use a workflow engine rather than building an unbounded state machine from ad hoc queue messages.

**Gotcha:** compensation can fail too. Record compensation attempts and provide a manual resolution path for business states that cannot be repaired automatically.

### 16. Job deduplication at the API boundary

**Mental model:** transport retries and double-clicks can create two job requests before a worker ever sees either message. Deduplication at the request boundary complements—not replaces—consumer idempotency. Scope a client idempotency key to the authenticated actor and operation, and persist the response identity long enough to cover the retry window.

```sql
CREATE TABLE request_idempotency (
  actor_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  operation TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (actor_id, idempotency_key, operation)
);
```

```ts
async function findPriorRequest(actorId: string, key: string, operation: string) {
  // Scope keys by actor and operation to prevent cross-user collisions.
  return idempotencyStore.find({ actorId, key, operation });
}
```

```ts
async function createReportOnce(actorId: string, key: string, input: ReportInput) {
  const prior = await findPriorRequest(actorId, key, 'create-report');
  if (prior) return reports.get(prior.resourceId);
  return reportService.createWithIdempotency(actorId, key, input);
}
```

```http
POST /api/reports HTTP/1.1
Content-Type: application/json
Idempotency-Key: report-request-2026-10-21-a81d

{"format":"pdf","projectIds":["project_17","project_29"]}
```

```python
async def require_idempotency_key(value: str | None) -> str:
    if value is None or not 12 <= len(value) <= 200:
        raise RequestValidationError("A valid Idempotency-Key is required")
    # Restrict characters so the key is safe in logs and operational tools.
    if not value.replace("-", "").replace("_", "").isalnum():
        raise RequestValidationError("Idempotency-Key contains unsupported characters")
    return value
```

**Gotcha:** if the same key is reused with a different request body, silently returning the old resource can hide client bugs. Store a normalized request hash and reject a key/body mismatch.

### 17. Rate limits and tenant fairness for background work

**Mental model:** API rate limiting controls how quickly work enters the system; worker quotas control how much capacity each tenant consumes. A single customer uploading thousands of large files should not starve everyone else's small jobs.

```python
async def enforce_tenant_job_quota(tenant_id: str, job_kind: str) -> None:
    limits = {"thumbnail": 100, "report": 20, "export": 5}
    active = await jobs.count_active(tenant_id=tenant_id, job_kind=job_kind)
    if active >= limits[job_kind]:
        raise TenantQuotaExceeded(retry_after_seconds=30)
```

```ts
const tenantLimits = new Map<string, number>();

function allowEnqueue(tenantId: string, currentActive: number): boolean {
  const limit = tenantLimits.get(tenantId) ?? 10;
  // Admission control prevents queue growth from one tenant dominating capacity.
  return currentActive < limit;
}
```

```sql
SELECT tenant_id, COUNT(*) AS active_jobs
FROM jobs
WHERE status IN ('queued', 'running', 'retrying')
GROUP BY tenant_id
ORDER BY active_jobs DESC;
```

```python
async def wait_for_capacity(tenant_id: str, timeout_seconds: int = 15) -> None:
    deadline = time.monotonic() + timeout_seconds
    while time.monotonic() < deadline:
        if await quotas.has_capacity(tenant_id):
            return
        await asyncio.sleep(0.25)
    raise CapacityUnavailable("Tenant job quota remained full")
```

```json
{
  "error": "job_capacity_exceeded",
  "message": "Too many active exports for this workspace.",
  "retryAfterSeconds": 30
}
```

**Gotcha:** a per-process in-memory quota does not coordinate across multiple API instances. Enforce global quotas with atomic shared storage or a queue platform that provides the needed fairness guarantees.

### 18. Job payload schema evolution and safe deployments

**Mental model:** messages can remain queued longer than a deployment takes. A new worker must handle messages produced by the previous release, and a rollback must not make newly published payloads unreadable.

```ts
type ReportCommandV1 = {
  schemaVersion: 1;
  reportId: string;
  ownerId: string;
};

type ReportCommandV2 = {
  schemaVersion: 2;
  reportId: string;
  tenantId: string;
  requestedBy: string;
};
```

```ts
function normalizeReportCommand(payload: unknown) {
  const parsed = reportCommandSchema.parse(payload);
  if (parsed.schemaVersion === 1) {
    // Keep old messages readable during the queue-drain window.
    return { reportId: parsed.reportId, tenantId: parsed.ownerId,
      requestedBy: parsed.ownerId };
  }
  return { reportId: parsed.reportId, tenantId: parsed.tenantId,
    requestedBy: parsed.requestedBy };
}
```

```python
async def consume_versioned(payload: dict) -> None:
    version = payload.get("schema_version")
    if version not in {1, 2}:
        raise PermanentJobError(f"Unsupported schema version: {version!r}")
    command = normalize_command(payload)
    await report_service.generate(command)
```

```yaml
# Deployment order: consumers become backward-compatible before producers change.
steps:
  - deploy_consumer_supporting_v1_and_v2
  - verify_all_workers_are_updated
  - enable_v2_producers
  - wait_for_v1_queue_and_retry_backlog_to_drain
  - remove_v1_support_in_a_later_release
```

```sql
SELECT schema_version, COUNT(*) AS pending_messages
FROM job_message_audit
WHERE status IN ('queued', 'retrying')
GROUP BY schema_version;
```

**Gotcha:** a rollback can reintroduce an old consumer that cannot parse new messages. Treat producer and consumer compatibility as a deployment contract, not just a type definition.

### 19. Safe file handling for background media jobs

**Mental model:** a queued file-processing task must not assume the upload is safe, still available, or small enough to fit in memory. Validate the file at ingress and again at the worker boundary, store it in controlled object storage, and pass a storage key rather than a local path or signed URL with a long lifetime.

```python
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_UPLOAD_BYTES = 20 * 1024 * 1024

async def validate_uploaded_asset(upload) -> None:
    if upload.size > MAX_UPLOAD_BYTES:
        raise PermanentJobError("Asset exceeds the 20 MB limit")
    if upload.detected_mime_type not in ALLOWED_MIME_TYPES:
        raise PermanentJobError("Unsupported image format")
```

```ts
type ThumbnailJob = {
  assetId: string;
  objectKey: string;
  tenantId: string;
  schemaVersion: 1;
};

async function processThumbnail(job: ThumbnailJob) {
  const asset = await assets.getForTenant(job.assetId, job.tenantId);
  // Use the canonical storage key from trusted metadata, not a user path.
  if (asset.objectKey !== job.objectKey) throw new PermanentJobError('Asset mismatch');
  return imageProcessor.createThumbnail(await objectStore.openReadStream(asset.objectKey));
}
```

```python
async def stream_to_temporary_file(source, destination: Path) -> int:
    total_bytes = 0
    with destination.open("wb") as output:
        async for chunk in source.iter_chunks(1024 * 256):
            total_bytes += len(chunk)
            if total_bytes > MAX_UPLOAD_BYTES:
                raise PermanentJobError("Stream exceeded the permitted size")
            output.write(chunk)
    return total_bytes
```

```python
async def cleanup_temporary_asset(path: Path) -> None:
    try:
        await asyncio.to_thread(path.unlink, missing_ok=True)
    except OSError:
        logger.warning("temporary_asset_cleanup_failed", extra={"path_name": path.name})
```

```json
{
  "assetId": "asset_42c8",
  "objectKey": "tenant_17/uploads/asset_42c8/original",
  "tenantId": "tenant_17",
  "schemaVersion": 1
}
```

**Gotcha:** the filename extension and browser-provided MIME type are not trustworthy proof of file content. Use content inspection, resource limits, malware scanning where appropriate, and isolated processing for untrusted media.

### 20. User-facing status and accessible progress UI

**Mental model:** a background job is part of the product experience. Users need to understand what was accepted, what is happening, whether they can leave the page, and what to do if it fails. Status UI should reflect durable server state and remain accessible to assistive technology.

```html
<main aria-labelledby="report-page-title">
  <header>
    <h1 id="report-page-title">Your report</h1>
    <p>The report is generated in the background. You can leave this page.</p>
  </header>
  <section aria-labelledby="job-status-title">
    <h2 id="job-status-title">Generation status</h2>
    <p role="status" aria-live="polite">Rendering project thumbnails</p>
    <progress value="2" max="4" aria-label="Report generation stages">2 of 4</progress>
    <ol>
      <li>Collect project data — complete</li>
      <li>Render thumbnails — in progress</li>
      <li>Build PDF — waiting</li>
      <li>Prepare download — waiting</li>
    </ol>
    <button type="button">Refresh status</button>
  </section>
  <aside aria-labelledby="help-title">
    <h2 id="help-title">Need help?</h2>
    <p>Keep the report ID when contacting support.</p>
  </aside>
</main>
```

```ts
async function refreshJobStatus(jobId: string) {
  const response = await fetch(`/api/jobs/${encodeURIComponent(jobId)}`, {
    credentials: 'same-origin',
    cache: 'no-store', // Job status is private and changes as work progresses.
  });
  if (!response.ok) throw new Error('Could not load job status');
  return jobStatusSchema.parse(await response.json());
}
```

```ts
function nextPollDelay(status: JobStatus, previousDelayMs: number): number {
  if (status.status === 'succeeded' || status.status === 'failed') return 0;
  // Back off while queued so a large customer cohort does not hammer the API.
  return Math.min(15_000, Math.max(2_000, previousDelayMs * 1.5));
}
```

```html
<article aria-labelledby="failed-job-title">
  <h2 id="failed-job-title">Report generation failed</h2>
  <p>The report could not be completed. Your request is saved.</p>
  <p>Reference: <code>job_7c9a</code></p>
  <button type="button">Try again</button>
  <nav aria-label="Report actions">
    <a href="/reports">Return to reports</a>
    <a href="/support">Contact support</a>
  </nav>
</article>
```

```json
{
  "id": "job_7c9a",
  "status": "running",
  "stage": "rendering_thumbnails",
  "progress": {"completed": 2, "total": 4},
  "updatedAt": "2026-10-21T04:40:00Z"
}
```

**Gotcha:** progress is not necessarily a linear percentage. If stages have very different durations, label the current stage and report measured counts instead of promising that “50%” means half the time remains.

---

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Durable enqueue with transactional outbox

**What it does:** couples a database business change with durable intent to publish a job, preventing the “database committed but queue publish failed” gap.

**When to use it:** orders, payment state changes, report requests, or any operation where losing the job after telling the client it was accepted would be unacceptable.

```python
async def create_report_request(db, owner_id: str, report_type: str) -> str:
    report_id = new_id()
    event_id = new_id()
    async with db.transaction():
        await db.execute(
            "INSERT INTO reports(id, owner_id, status) VALUES($1, $2, 'queued')",
            report_id, owner_id,
        )
        await db.execute(
            "INSERT INTO outbox_events(id, event_type, payload) VALUES($1, $2, $3)",
            event_id, "report.generate.v1", {"report_id": report_id},
        )
    return report_id
```

The publisher should claim outbox rows, publish with a stable event ID, and mark them delivered. Because a crash can occur after publishing and before marking delivered, consumers still need idempotency. Monitor the age of the oldest pending outbox row; a growing outbox can mean the publisher or broker is unhealthy.

### Pattern 2: Idempotent consumer with an inbox table

**What it does:** records a message as processed in the same transaction as the database effect, so redelivery cannot apply that effect twice.

**When to use it:** any consumer that updates business records based on at-least-once queue delivery, especially when broker acknowledgements happen outside the database transaction.

```python
async def apply_inventory_reservation(db, message: dict) -> None:
    async with db.transaction():
        inserted = await db.fetchval(
            """INSERT INTO consumer_inbox(consumer, message_id)
               VALUES($1, $2) ON CONFLICT DO NOTHING RETURNING message_id""",
            "inventory-reserver", message["message_id"],
        )
        if inserted is None:
            return  # This consumer has already committed this message.

        await db.execute(
            "UPDATE inventory SET reserved = reserved + $1 WHERE sku = $2",
            message["quantity"], message["sku"],
        )
```

Validate quantity and SKU before the transaction. The unique constraint on `(consumer, message_id)` is essential. If the business update fails, the transaction rolls back the inbox row too, allowing a later retry. External side effects require an additional provider idempotency or reconciliation strategy.

### Pattern 3: Bounded retry with backoff and a terminal failure path

**What it does:** retries transient failures while preventing infinite loops and retry storms.

**When to use it:** unreliable third-party APIs, temporary storage outages, and network-dependent jobs where retrying may succeed later.

```ts
async function executeWithRetry<T>(
  operation: () => Promise<T>,
  options: { maxAttempts: number; baseDelayMs: number; maxDelayMs: number },
): Promise<T> {
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (!isRetryable(error) || attempt === options.maxAttempts) throw error;
      const ceiling = Math.min(options.maxDelayMs,
        options.baseDelayMs * 2 ** (attempt - 1));
      // Randomized delay prevents synchronized workers retrying together.
      await sleep(Math.random() * ceiling);
    }
  }
  throw new Error('Unreachable retry state');
}
```

In a queue worker, prefer broker-managed delayed retries or scheduled retry messages rather than sleeping for minutes while occupying a worker slot. The caller must classify errors and move terminal failures to an inspectable failed state.

### Pattern 4: Queue partitioning by workload and priority

**What it does:** separates jobs with different resource profiles or business urgency so one slow class cannot starve all others.

**When to use it:** an agency platform that sends emails, generates large PDFs, and renders image thumbnails; these tasks have different CPU, memory, latency, and priority requirements.

```python
QUEUE_CONFIG = {
    "notifications": {"concurrency": 20, "max_attempts": 5},
    "image-rendering": {"concurrency": 3, "max_attempts": 3},
    "billing": {"concurrency": 5, "max_attempts": 8},
}

async def route_job(job: dict) -> None:
    # Route from a validated command type, never an arbitrary user queue name.
    queue_name = {
        "send_notification": "notifications",
        "render_image": "image-rendering",
        "create_invoice": "billing",
    }[job["kind"]]
    await queues[queue_name].publish(job)
```

Keep billing or security-critical work from sharing a saturated pool with large media transformations. Queue separation introduces operational overhead, so create pools around actual resource or service-level differences rather than making a queue for every tiny task.

### Pattern 5: Scheduled occurrence with a stable idempotency key

**What it does:** represents each scheduled run as a unique occurrence, preventing duplicate scheduler instances from enqueueing the same logical job.

**When to use it:** daily digests, recurring invoices, nightly analytics, cleanup, or report generation tied to a business date.

```python
async def enqueue_monthly_invoice(customer_id: str, billing_month: str) -> None:
    occurrence_key = f"invoice:{customer_id}:{billing_month}"
    await scheduled_occurrences.insert_if_absent(
        occurrence_key=occurrence_key,
        job_type="invoice.generate.v1",
        payload={"customer_id": customer_id, "billing_month": billing_month},
    )
```

Use a database unique constraint for the occurrence key. Define catch-up behavior for missed runs and use a real time-zone identifier when local calendar boundaries matter. The stable key should remain the same across scheduler retries.

### Pattern 6: Progress endpoint for long-running jobs

**What it does:** exposes durable job state to a user interface without keeping an HTTP request open for the entire task.

**When to use it:** exports, uploads, video processing, report generation, or other tasks that may take longer than normal request timeouts.

```ts
app.get('/api/jobs/:jobId', async (req, res) => {
  const job = await jobs.findById(req.params.jobId);
  if (!job || job.ownerId !== req.user.id) {
    return res.status(404).json({ error: 'Job not found' });
  }
  return res.json({
    id: job.id,
    status: job.status,
    stage: job.stage,
    progress: job.progress,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  });
});
```

Returning 404 for another user's job avoids confirming that the identifier exists. Do not expose stack traces, internal payloads, or provider credentials. Use polling with backoff for simple interfaces; add push updates only when the user experience needs them.

### Pattern 7: Dead-letter replay with guardrails

**What it does:** gives operators a controlled way to recover terminally failed jobs after fixing the root cause.

**When to use it:** a provider outage, a bug in an old consumer version, or a malformed payload that can be corrected through a reviewed migration.

```python
async def replay_dead_letter(dead_letter_id: str, operator_id: str) -> None:
    record = await dead_letters.get_for_update(dead_letter_id)
    if record is None or record.status != "pending_review":
        raise InvalidReplayState()
    if not await replay_policy.root_cause_resolved(record.error_type):
        raise ReplayBlocked("Resolve the root cause before replaying")

    await audit_log.write(
        actor_id=operator_id,
        action="dead_letter.replay",
        target_id=dead_letter_id,
    )
    await broker.publish(
        record.original_topic,
        record.payload,
        message_id=record.original_message_id,
    )
    await dead_letters.mark_replayed(dead_letter_id)
```

Require authorization, rate limits, a dry-run or sample mode for bulk replay, and a preserved idempotency identity. A replay operation should be visible in audit logs and should not automatically clear the historical failure record.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Acknowledge before completing work | The developer optimizes for fewer redeliveries | Acknowledge only after required durable effects commit; rely on idempotency if the acknowledgement is lost |
| Assume a job runs once | A local test rarely simulates a crash between effect and ack | Give every logical operation a stable ID and add unique constraints or provider idempotency keys |
| Publish after database commit without an outbox | Database and broker calls look sequential in code | Insert an outbox event in the same database transaction as the business change |
| Retry every exception | Exception handling is written without error classification | Separate transient, permanent, and uncertain outcomes; cap attempts and send terminal failures to a DLQ |
| Retry immediately in a loop | Backoff is omitted to make failures appear to recover faster | Use capped exponential backoff with jitter and honor safe provider retry hints |
| Let a worker consume unbounded jobs | Async tasks are mistaken for free concurrency | Use a bounded worker pool and downstream-aware concurrency limits |
| Put secrets in message payloads | Payloads are treated as private implementation details | Pass identifiers and retrieve secrets through scoped service credentials at execution time |
| Use a random idempotency key per attempt | The key is generated inside retry logic | Derive the key from the logical business operation and persist it before the first attempt |
| Store all progress only in process memory | A single worker test appears to work | Persist status and progress in durable storage when clients or operators depend on it |
| Treat DLQ as a trash folder | Failed messages disappear from the main queue | Add access controls, retention, alerts, failure context, and an audited replay procedure |
| Run CPU-heavy work on the API event loop | Async is assumed to mean parallel CPU execution | Move CPU-intensive processing to a process, worker thread, or dedicated worker pool |
| Schedule recurring jobs without occurrence IDs | The scheduler is assumed to run once | Enforce a unique stable key for each scheduled occurrence |
| Ignore shutdown behavior | Development processes usually stop cleanly | Stop intake, wait for bounded in-flight work, and allow incomplete deliveries to be safely redelivered |
| Log the entire payload on failure | Full payloads make debugging convenient | Log job/message IDs and redacted summaries; protect sensitive payload references with access controls |
| Expose another user's job status | Job IDs are assumed to be hard to guess | Verify ownership or tenant scope before returning job details; use a non-disclosing not-found response |
| Call a timed-out provider operation blindly again | Timeout is mistaken for proof of failure | Query provider state or retry with the same idempotency key to resolve uncertain outcomes |
| Let old message formats fail after deployment | Producer and consumer releases are not coordinated | Version message contracts and roll out backward-compatible consumers before new producers |
| Alert only on total queue length | Queue depth alone is easy to chart | Alert on oldest message age, enqueue-to-start latency, failure rate, and sustained backlog growth |

---

## Mental Models

1. **A queue is a durable promise, not a detached function call** — the system must be able to recover the work after a process disappears.
2. **Assume at-least-once execution** — repeated delivery is normal; repeated business effects must not be.
3. **Commit intent with state** — an outbox closes the database/broker dual-write gap.
4. **Retry selectively, not emotionally** — classify the failure, bound the attempts, add jitter, and define a terminal path.
5. **Concurrency spends downstream capacity** — tune worker limits against real database, CPU, memory, and provider limits.
6. **Progress is durable product state** — if a customer can see it, an operator should be able to inspect it after a restart.
7. **A dead letter is an incident artifact** — retain enough safe context to diagnose it and control how it is replayed.
8. **Cancellation is not rollback** — an external effect may already have happened even when the client or worker timed out.

---

## Quick Reference

| Need | Recommended approach | Watch out for |
|---|---|---|
| Return quickly from long work | Persist job intent and return `202 Accepted` | Acceptance must be durable before responding |
| Avoid losing a job after DB commit | Transactional outbox | Publisher may deliver duplicates |
| Avoid duplicate database effects | Inbox table plus unique constraint | Marker and business effect must share a transaction |
| Avoid duplicate provider operations | Stable provider idempotency key | Key must survive retries and replays |
| Retry transient errors | Capped exponential backoff with jitter | Do not retry validation errors forever |
| Handle poison messages | Dead-letter queue | DLQ needs monitoring and access control |
| Protect downstream systems | Bounded concurrency and backpressure | Async tasks are not an unlimited resource |
| Schedule a recurring job | Stable occurrence key and durable scheduler state | Define time zone and catch-up policy |
| Show progress to a user | Durable job status endpoint | Enforce owner/tenant authorization |
| Process CPU-heavy tasks | Separate process or worker pool | Keep resource limits and deadlines |
| Shut down safely | Stop intake, drain or release active jobs | Forced termination still must be safe |
| Observe queue health | Queue age, latency, retries, DLQ, saturation | Queue length alone is insufficient |
| Evolve payload schemas | Versioned commands and compatible rollout | Old delayed messages may survive deployments |
| Handle uncertain provider timeout | Reconcile state or retry with same key | Timeout does not prove no side effect occurred |
| Protect sensitive data | Payload references and least-privilege service identity | Queue storage and DLQ are data stores too |
| Prevent duplicate scheduled runs | Unique logical occurrence key | Multiple scheduler instances may fire together |
| Pause a failing dependency | Circuit breaker and bounded intake | A breaker must not silently discard accepted jobs |
| Bulk replay failed jobs | Authorized, rate-limited, audited replay | Replaying stale commands can corrupt current state |
| Distinguish user cancellation | Persist cancellation request and check safe boundaries | Some effects cannot be undone |
| Keep job ownership private | Verify tenant/owner on every status request | Random IDs are not authorization |

---

## Build Challenge

### Build: Reliable Media-and-Report Job Platform

Build a backend feature for a creative portfolio or marketplace where a user submits a request to generate a report containing selected project data and image thumbnails. The HTTP endpoint must acknowledge the request quickly while a worker performs the work durably. The challenge is complete only when failure and recovery behavior are demonstrated, not merely when the happy path works.

#### Required implementation

1. Create a `jobs` table with a stable ID, owner/tenant ID, job type, status, stage, progress, attempt count, created/started/finished timestamps, and safe error code.
2. Create an `outbox_events` table and write the job plus an enqueue event in one transaction.
3. Implement a publisher that claims pending outbox rows, publishes them with stable event IDs, and retries failed publication.
4. Implement a worker that validates a versioned payload, checks tenant/resource ownership, and transitions the job using guarded updates.
5. Make the worker idempotent: redelivering the same message must not create duplicate report records or repeat a non-idempotent external effect.
6. Implement retry classification, capped exponential backoff with jitter, a maximum attempt count, and a dead-letter record for terminal failure.
7. Separate CPU-heavy thumbnail generation from normal API request handling and set a memory/time budget for each task.
8. Expose `POST /api/reports`, `GET /api/jobs/:id`, and an operator-only retry endpoint for eligible failed jobs.
9. Enforce job ownership or tenant access in status endpoints; test that another tenant cannot inspect or replay a job.
10. Add structured logs and metrics for queue age, processing duration, retry count, failures, and DLQ size without logging raw private payloads.
11. Handle graceful shutdown: stop accepting new work, wait for active work within a deadline, and allow unfinished jobs to be redelivered safely.
12. Write automated tests for duplicate delivery, worker crash after side effect but before acknowledgement, transient provider failure, permanent invalid payload, outbox publication failure, and unauthorized status access.
13. Document the scheduler's timezone/catch-up behavior if scheduled jobs are included, and document the replay procedure for dead-letter items.
14. Add a runbook explaining how to pause intake, inspect an old job, diagnose a growing queue, replay one failed job, and verify that replay did not duplicate the business effect.

#### Definition of Done

- A successful request returns a truthful queued response only after durable intent has been committed.
- Killing the publisher or worker at any point does not silently lose accepted work.
- Replaying the same message does not duplicate the report or any protected external operation.
- Permanent failures become visible and actionable rather than retrying forever.
- Queue growth triggers useful signals based on age and latency, not only raw message count.
- A user can view only their own job state, and operators can replay failures only with explicit authorization and an audit record.
- The project README includes architecture, state transitions, retry policy, idempotency strategy, failure scenarios tested, and operational runbook steps.

#### Suggested test matrix

| Scenario | Expected result |
|---|---|
| API process dies after transaction commit | Outbox publisher eventually emits the job |
| Publisher dies after publish before marking event | Event may publish again; consumer effect remains idempotent |
| Worker dies before doing any work | Message is redelivered after visibility/lease expiry |
| Worker completes effect then dies before ack | Redelivery does not duplicate the effect |
| Provider returns rate limit | Retry is delayed and bounded |
| Payload schema is invalid | Job goes to terminal failure/DLQ with safe context |
| Worker pool is saturated | Intake is bounded; queue age is observable |
| User requests another tenant's job | Endpoint returns a non-disclosing not-found response |
| Operator replays a DLQ record | Replay is authorized, rate-limited, and audited |
| Deployment interrupts a long job | Work completes or is safely redelivered; state remains inspectable |

**Stretch goals:** add a per-tenant concurrency quota, cancellation at safe checkpoints, a reconciliation job for uncertain provider outcomes, and a dashboard showing queue age, success rate, retry rate, and dead-letter counts.
