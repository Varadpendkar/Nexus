# Real-Time Dashboard

## Skill Metadata

- **Skill name:** `realtime-dashboard`
- **Layer:** `layer-19-data-viz`
- **Primary focus:** Design and implement dashboards that update continuously or on a defined refresh schedule without losing clarity, correctness, or user control.
- **Use when:** A product needs current operational metrics, live status, near-real-time event feeds, streaming measurements, or automatically refreshed charts.
- **Core principle:** A dashboard is only as real-time as its data pipeline, and every update must preserve the meaning, freshness, and usability of the displayed information.

## Goal

Build dashboards that receive, validate, transform, and present changing data in a way that users can trust. The implementation must make update cadence and freshness understandable, handle connection loss and stale data, avoid unnecessary rendering work, and preserve interaction state while values change.

Real-time interfaces are not simply ordinary dashboards with a timer. They need a deliberate strategy for transport, backpressure, buffering, data ordering, reconnection, duplicate events, state reconciliation, and failure communication. The correct strategy depends on how quickly the data changes, how costly stale information is, and what the user needs to do with it.

## Why This Matters

A dashboard can look live while showing old data. A timestamp that says “updated just now” may describe when the browser received a response, not when the underlying event occurred. A rapidly updating chart can also become less useful if the entire page flashes on every event, the axis keeps rescaling, or the user's selected time range resets.

Reliable real-time dashboards answer four questions:

1. **What is the latest known state?**
2. **How fresh is that state, and what does freshness mean?**
3. **What happens when updates are delayed, duplicated, reordered, or unavailable?**
4. **Can the user still interpret and control the interface while data changes?**

## 1. Define “Real-Time” Before Choosing a Transport

“Real-time” is often used loosely. Clarify the expected latency and behavior before selecting polling, Server-Sent Events (SSE), WebSockets, or another mechanism.

- **Manual refresh:** the user requests a new snapshot.
- **Periodic refresh:** the browser fetches a snapshot at a defined interval.
- **Near-real-time:** updates arrive with a bounded or typical delay that is acceptable for the task.
- **Streaming:** the client receives a continuing sequence of events or measurements.
- **Hard real-time:** a deadline is part of system correctness. Ordinary browser dashboards generally cannot guarantee hard real-time deadlines.

The requirements should specify more than a refresh interval. Define the target latency, acceptable staleness, whether missed events must be recovered, and what the UI should do when the source is unavailable.

### Questions to answer

- How old can a value be before it is considered stale?
- Does every event matter, or is only the latest state needed?
- Can updates be coalesced?
- Must the browser reconstruct missed events after reconnecting?
- Does the data represent an immutable event log or a changing snapshot?
- How many concurrent clients are expected?
- Is the connection long-lived?
- What are the privacy and authorization requirements?
- Is the user expected to act immediately on the displayed state?

A monitoring console for a manufacturing process may have different freshness needs from a sales dashboard that refreshes every minute. Do not choose the transport before answering these questions.

## 2. Choose the Right Update Mechanism

### Polling

Polling periodically requests a fresh snapshot over HTTP. It is easy to reason about and works with ordinary request/response infrastructure.

Use it when:
- The update interval is measured in seconds or minutes.
- A complete snapshot is inexpensive.
- The backend does not provide streaming.
- Reconnection and retry behavior should remain simple.
- Missing individual intermediate events is acceptable.

Tradeoffs:
- Frequent polling creates repeated requests even when nothing changed.
- Polling can create synchronized traffic spikes if many clients use the same interval.
- The interval determines the expected delay between a change and its discovery.
- A slow request can overlap the next request unless the implementation prevents it.

### Server-Sent Events (SSE)

SSE provides a server-to-client event stream over HTTP. It is a good fit for one-way updates such as status messages, job progress, alert feeds, or server-pushed metrics.

Use it when:
- The browser primarily receives updates.
- The client does not need to send frequent messages over the same connection.
- Browser-managed reconnection is useful.
- Event IDs can support replay or resumption when the server implements it.

Tradeoffs:
- It is one-way from server to client.
- Proxy and server timeouts must be configured appropriately.
- The server must define event format, authorization, and recovery semantics.
- Browser support and deployment behavior should be checked for the application's target environment.

### WebSockets

WebSockets provide a persistent, bidirectional connection. They can support interactive monitoring, collaborative tools, and systems where the client and server both send frequent messages.

Use them when:
- The client needs bidirectional messages.
- A persistent connection is useful for the interaction model.
- The backend can manage connection lifecycle, authorization, backpressure, and scaling.

Tradeoffs:
- The application must define reconnection, message validation, ordering, and recovery.
- A connected socket does not prove that the data is current.
- Connection management and horizontal scaling can be more complex than polling.
- The protocol needs explicit message schemas and error behavior.

### Decision table

| Requirement | Likely starting point | Important caveat |
|---|---|---|
| Data changes every few minutes | Polling | Avoid overlapping requests |
| Server pushes job progress | SSE | Resume semantics must be implemented server-side |
| Bidirectional live collaboration | WebSockets | Define message ordering and reconnect behavior |
| Latest snapshot only; occasional delay acceptable | Polling or snapshot API | Show source freshness |
| Every event must be recoverable | Event stream with IDs/replay | The backend must retain and replay events |
| Very high-rate measurements | Stream plus buffering/aggregation | Do not render every event individually |

These are starting points, not absolute rules. Infrastructure, security, browser support, and data semantics can change the best choice.

## 3. Model Freshness Explicitly

A timestamp should state what it measures. Common timestamps include:

- **Event time:** when the source event occurred.
- **Ingestion time:** when the backend received or stored the event.
- **Processing time:** when the backend computed the metric.
- **Delivery time:** when the browser received the update.
- **Render time:** when the UI displayed the update.

These timestamps are not interchangeable. A browser can receive a recent message that contains old source data. If the dashboard shows “Last updated,” explain whether that refers to source freshness or the latest successful fetch.

### Example status model

```ts
type FreshnessState =
  | { status: "current"; lastEventAt: number; receivedAt: number }
  | { status: "delayed"; lastEventAt: number; receivedAt: number }
  | { status: "stale"; lastEventAt: number | null; receivedAt: number | null }
  | { status: "unknown" };
```

The thresholds should come from product requirements, not arbitrary styling. For example, an operations team might classify data as delayed after a short threshold and stale after a longer threshold. The actual durations depend on the source's expected cadence.

### Freshness rules

- Show a useful timestamp when it changes the interpretation.
- Distinguish “connected” from “current.”
- Do not reset freshness just because a heartbeat arrived unless the heartbeat confirms data freshness.
- Keep the last known value visible when useful, but mark it stale.
- Avoid implying that stale values are live.
- Use a clock and timezone convention consistently.
- Account for clock skew if comparing client and server timestamps.
- Explain whether displayed age is calculated from event time or successful retrieval time.

## 4. Build a Transport Adapter, Not Transport Logic Everywhere

Do not make each chart independently open a socket or schedule its own polling loop. A shared data layer should own the transport and expose validated application state to the dashboard.

A useful architecture is:

1. **Transport:** polling, SSE, WebSocket, or a query client.
2. **Decoder:** parses the incoming payload and rejects malformed messages.
3. **Normalizer:** converts transport fields into stable application types.
4. **Reconciler:** applies snapshots and events in the correct order.
5. **Store/cache:** holds current data and relevant metadata.
6. **Selectors:** derive chart-ready series and KPI values.
7. **UI:** renders current data, stale state, errors, and interactions.

This architecture makes it easier to replace a transport without rewriting every chart. It also centralizes retry behavior, authorization handling, logging, and connection status.

### Keep the transport contract explicit

A message should have a type or schema version when different message shapes may appear. Include identifiers or sequence numbers when deduplication and ordering matter. Do not trust incoming JSON simply because it came from an internal server; network boundaries and version changes can still produce invalid payloads.

## 5. Polling Without Overlapping Requests

A common mistake is to use `setInterval` with an async fetch function. If a request takes longer than the interval, multiple requests can overlap and return out of order.

A recursive timeout schedules the next request after the current request finishes:

```ts
async function pollLoop(signal: AbortSignal): Promise<void> {
  while (!signal.aborted) {
    const startedAt = Date.now();

    try {
      await refreshSnapshot(signal);
    } catch (error) {
      if (signal.aborted) return;
      reportRefreshError(error);
    }

    const elapsed = Date.now() - startedAt;
    const delay = Math.max(0, 10_000 - elapsed);

    await sleep(delay, signal).catch(() => undefined);
  }
}
```

This example depends on `sleep`, `refreshSnapshot`, and `reportRefreshError` being implemented with the application's conventions. A production sleep helper must clear its timer and reject or resolve predictably when aborted. It should not swallow a genuine error from the data request; only the cancellation path should be treated as expected.

### Polling rules

- Prevent overlapping requests unless concurrent requests are explicitly designed.
- Cancel requests when the view unmounts or the query becomes irrelevant.
- Avoid retrying permanent authorization or validation errors as if they were transient network failures.
- Add jitter when many clients could synchronize their polling schedules.
- Respect rate limits and server retry guidance.
- Consider pausing or slowing refresh while the tab is hidden.
- Refresh immediately after a meaningful user action if the product requires it.
- Preserve the last successful snapshot if a later refresh fails, while marking it stale.
- Ensure a slower old response cannot overwrite a newer response.

### Example: abortable snapshot fetch

```ts
async function fetchSnapshot(signal: AbortSignal) {
  const response = await fetch("/api/metrics/snapshot", { signal });

  if (!response.ok) {
    throw new Error(`Snapshot request failed: ${response.status}`);
  }

  const payload: unknown = await response.json();
  return parseSnapshot(payload);
}
```

`parseSnapshot` should validate the payload and return a typed result or a clear validation error. Avoid a TypeScript cast such as `payload as Snapshot` as a substitute for runtime validation.

## 6. SSE: Connection Lifecycle and Event Semantics

An SSE client commonly uses `EventSource`. The browser can reconnect automatically after a connection is interrupted, but automatic reconnect alone does not guarantee that no events were lost. Reliable recovery depends on server behavior, event IDs, retained history, and replay support.

```ts
const source = new EventSource("/api/events");

source.onmessage = (event) => {
  try {
    const payload: unknown = JSON.parse(event.data);
    handleValidatedEvent(parseEvent(payload));
  } catch (error) {
    reportInvalidEvent(error);
  }
};

source.onerror = () => {
  setConnectionState("reconnecting");
};
```

This is a simplified example. A complete implementation must close the source when no longer needed, handle named event types if used, reflect authorization failures appropriately, and distinguish retrying from permanently unavailable states. `EventSource` has constraints around request configuration; if the endpoint needs custom authorization headers, assess whether the chosen client and server design supports that requirement.

### Event IDs and resumption

If missing events matter, define how the server issues event IDs and how it resumes from the last received ID. A reconnect may otherwise continue from the current stream position and miss messages emitted during the outage. Event replay also needs retention limits and a fallback when the requested ID is too old.

### Heartbeats

A heartbeat can help detect a dead or idle connection, but it must be distinct from business data. Do not update a metric's event timestamp just because the connection remains open. A healthy transport can carry stale source values.

## 7. WebSockets: Message Protocol and Reconnection

A WebSocket application should define a small, versioned message protocol. For example:

```ts
type DashboardMessage =
  | { type: "snapshot"; sequence: number; data: Snapshot }
  | { type: "metric.updated"; sequence: number; data: MetricUpdate }
  | { type: "heartbeat"; sentAt: number }
  | { type: "error"; code: string; message?: string };
```

Validate each message at runtime. The TypeScript type documents what the application expects, but it does not validate bytes arriving over the network.

### Reconnection strategy

A robust client should:
- Track whether the socket is connecting, open, closing, or closed.
- Avoid opening duplicate sockets during repeated renders.
- Reconnect after transient failures.
- Use exponential backoff with jitter rather than retrying continuously.
- Reset the retry counter after a meaningful period of stable connection.
- Stop reconnecting when the user leaves the view or logs out.
- Reauthenticate or refresh credentials according to the application's security model.
- Request a fresh snapshot after reconnect when the event stream alone cannot guarantee recovery.
- Surface a stale state if updates stop arriving.
- Record useful diagnostics without logging sensitive payloads.

### Exponential backoff

A common conceptual formula is:

`delay = min(maxDelay, baseDelay × 2^attempt) + randomJitter`

Use a bounded delay and a jitter strategy appropriate to the client population. The exact values should be selected based on system behavior and server capacity, not copied blindly from an example.

## 8. Ordering, Duplicates, and Idempotency

Events may be duplicated or arrive out of order because of retries, reconnects, asynchronous processing, or distributed infrastructure. The client must not assume that arrival order always equals source order.

Possible strategies include:
- A monotonically increasing sequence number per stream.
- A version number for each entity.
- A stable event ID for deduplication.
- A server-issued cursor for replay.
- A timestamp plus a documented tie-breaking rule, when a stronger sequence is unavailable.

Timestamps alone can be insufficient because clocks can skew and multiple events can share the same timestamp. Prefer a server-controlled sequence or version when the system needs strict ordering.

### Snapshot and event reconciliation

A snapshot may arrive after newer events due to network delay. If the snapshot has a version or cursor, compare it with the current state before applying it. Do not overwrite a newer state with an older snapshot.

For latest-state dashboards, dropping outdated updates may be acceptable. For audit, financial, or event-counting views, dropping events may be unacceptable; the backend should provide replay and durable aggregation. The frontend cannot recover information the server never retained.

## 9. Backpressure and High-Frequency Data

If updates arrive faster than the browser can render them, a naïve implementation can build an unbounded queue and make the page increasingly delayed. The solution is not always to render faster. First decide what information must be preserved.

### Latest-state metrics

For a temperature, active user count, or current queue depth, intermediate values may be safely coalesced if the product only needs the latest state. Keep the latest valid value and render at a bounded cadence.

### Event counts and audit feeds

For counters and event feeds, dropping intermediate events can change the result. Use server-side aggregation, a durable event log, or a queue with explicit limits and recovery. Do not coalesce events if each event is meaningful.

### Chart streams

For a chart receiving hundreds or thousands of samples per second, separate ingestion cadence from render cadence. Buffer points and update the visual at a controlled interval. Keep a bounded history window or aggregate older data. The retention window should be a product decision.

A simple strategy might retain the most recent N points, but truncation can hide long-term trends. Consider multi-resolution aggregation: preserve detailed recent samples and summarize older ranges. Clearly label the selected time window.

### Backpressure checklist

- Define whether every event or only the latest state matters.
- Bound queues and in-memory history.
- Decide how overflow is handled.
- Aggregate at the source when possible.
- Keep rendering frequency appropriate for human perception and device capability.
- Preserve important spikes and anomalies when downsampling.
- Monitor queue depth and dropped-event counts.
- Tell the user when the view is sampled or aggregated if that affects analysis.

## 10. React State and Rendering Strategy

Real-time data can trigger frequent state changes. Avoid making the entire page re-render for every incoming event if only one small metric has changed. Use clear component boundaries and derived selectors. Memoization can help, but it should follow evidence and a sound state design.

Useful practices:
- Keep transport lifecycle out of chart components.
- Store normalized data rather than repeatedly parsing raw messages during render.
- Update state immutably.
- Use stable keys for series and list items.
- Derive chart data from canonical state.
- Keep filter and selection state separate from incoming data state.
- Avoid resetting user selections when new data arrives.
- Batch related updates where the framework supports it.
- Use memoization for expensive transforms when profiling shows a benefit.
- Avoid storing derived values redundantly if they can be computed reliably from the canonical data.

A common bug occurs when a fresh snapshot replaces the entire dashboard state object, accidentally resetting a selected date range, open detail panel, or hidden series. Separate user-controlled view state from data state.

## 11. Keep the Chart Stable While Data Changes

A dashboard that constantly rescales, reorders, or animates can be harder to read than one that updates less dramatically.

Consider:
- Keeping a fixed or slowly adjusted axis domain for a short monitoring window.
- Using a visible “new data” indicator when users are inspecting historical points.
- Avoiding automatic scroll-to-latest when the user has intentionally scrolled backward.
- Updating the chart at a bounded rate.
- Showing the selected time range and current live edge clearly.
- Keeping category order stable unless ranking changes are the actual subject.
- Avoiding animation that makes the chart appear to lag behind the source.
- Preserving zoom and brush selections when possible.
- Distinguishing the newest value from historical values without overemphasis.

The right behavior depends on the task. A live incident console may prioritize the latest event, while an analyst inspecting a previous hour should not have their viewport forcibly reset every time a new point arrives.

## 12. Freshness and Connection UI

Connection status and data status should be separate concepts.

A socket can be connected while the backend's source is delayed. A polling request can fail while the dashboard still has a recent successful snapshot. A data pipeline can be healthy but legitimately produce no new events.

Useful UI states include:
- **Live/current:** data is within the defined freshness threshold.
- **Delayed:** data is older than expected but still usable with caution.
- **Stale:** data is too old for normal interpretation.
- **Reconnecting:** the transport is trying to recover.
- **Disconnected:** no active connection is available.
- **Partial:** some feeds or records are missing.
- **Unknown:** the system cannot determine freshness reliably.

Avoid using a green dot alone. Pair status indicators with text or an accessible label. Do not imply that the dashboard is current merely because the connection indicator is green.

## 13. Loading, Empty, Error, and Stale States

Real-time dashboards need state behavior that remains coherent through failures.

### Initial loading

Show a skeleton or loading message until the first useful snapshot arrives. Keep layout dimensions stable to reduce layout shift.

### No data yet

Explain whether the selected period contains no observations or the source has not emitted its first update. These are different conditions.

### Stale data

Retain the last known values if they remain useful, but label them stale and show the time of the last successful update. In safety-critical contexts, the interface may need to suppress values that could be acted upon dangerously; that decision must be made with domain owners.

### Partial failure

If one chart's feed fails while others continue, show the affected panel's status rather than marking the entire dashboard disconnected. At the same time, provide an overall status when users need to understand that the dashboard is only partially operational.

### Recovery

When updates resume, indicate recovery if it matters to the user's workflow. Do not erase the outage history if users need to know that a period of data may be missing.

## 14. Time Windows and Data Retention

A live chart often has a rolling window such as the last 5 minutes, hour, or day. The window needs explicit semantics:
- Is it a duration ending at the current time?
- Is it aligned to calendar boundaries?
- Does the chart display event time or ingestion time?
- Are values raw, bucketed, averaged, or summed?
- What happens when the user pauses or selects a historical range?
- How does the system recover after the browser sleeps?

For a rolling window, remove points older than the cutoff based on the correct time field. Do not assume that array order equals time order. If late-arriving events are permitted, decide whether they are inserted into the historical window or ignored.

When older points are removed, avoid a sudden visual jump that could be misinterpreted as a data change. If the user is examining historical data, freeze the selected range or explicitly separate historical inspection from the live-follow mode.

## 15. Timezones and Clock Skew

Distributed systems can have different clocks. Client time, server time, event time, and ingestion time may not align exactly. For a monitoring dashboard, decide which clock determines the display and how discrepancies are handled.

- Prefer server-issued event timestamps or sequence IDs for ordering.
- Use a consistent timezone in labels.
- Distinguish local display time from UTC where needed.
- Do not assume browser clock accuracy.
- Avoid deriving source freshness solely from the client receipt time.
- Handle invalid and future timestamps.
- Test daylight-saving transitions for relevant regions.
- Keep the timezone visible when cross-region comparisons depend on it.

If the dashboard displays a “last event 3 seconds ago” label, consider whether that age is computed from the client's clock and whether clock skew can make it negative or inaccurate. Clamp display formatting defensively, but do not conceal the underlying timestamp-quality problem in telemetry.

## 16. Security and Privacy

Real-time connections are long-lived access paths and should follow the same security principles as ordinary API requests.

- Authenticate the connection using the application's approved mechanism.
- Authorize each subscription or channel on the server.
- Validate every incoming message.
- Do not trust a client-supplied tenant ID or account scope without server authorization.
- Avoid embedding long-lived secrets in URLs.
- Avoid logging tokens, personal information, or complete sensitive payloads.
- Close connections when users sign out or lose access.
- Enforce message-size and rate limits.
- Protect against cross-site connection abuse according to the transport and deployment model.
- Consider whether a user can infer private data through timing or aggregate metrics.
- Ensure cache keys and shared stores do not leak data across users.

The client can hide an unauthorized panel, but that is not authorization. The server must enforce access control for the snapshot endpoint and every streaming subscription.

## 17. Error Handling and Retry Policy

Not all errors should be retried identically. Temporary network failures, server overload, expired credentials, malformed messages, and authorization failures need different handling.

A reasonable policy:
- Retry transient network failures with bounded exponential backoff and jitter.
- Respect `Retry-After` or equivalent server guidance where applicable.
- Refresh credentials through the established authentication flow.
- Stop or pause on permanent authorization errors until the user reauthenticates.
- Record malformed payloads and surface a data-quality state.
- Avoid infinite rapid retry loops.
- Expose a manual retry action when it helps the user.
- Preserve the last known snapshot while indicating that refresh failed.
- Clear timers and close transports on unmount or logout.

Keep errors actionable but not overly technical. “Live updates are reconnecting; latest data received at 14:32” is more useful than exposing a raw socket exception. Detailed diagnostics can go to developer logs, with sensitive data removed.

## 18. Observability for the Dashboard Pipeline

Monitor the dashboard as a system, not only as a page.

Useful measurements include:
- Source event timestamp and ingestion timestamp.
- End-to-end delivery delay.
- Time since last valid update.
- Connection attempts and successful reconnects.
- Polling request duration and error rate.
- Invalid-message count.
- Duplicate or out-of-order event count.
- Queue depth and dropped/coalesced updates.
- Render duration and long tasks.
- Number of active subscriptions or clients.
- Partial-data and stale-state duration.

Instrument metrics without collecting unnecessary user-sensitive data. Define alerts around product-specific freshness thresholds, not just transport connectivity. If a dashboard is critical to operations, use a separate health path where possible; the dashboard should not be the only mechanism reporting that its own feed is broken.

## 19. Testing Real-Time Behavior

### Unit tests

Test message decoding, validation, ordering, deduplication, aggregation, rolling-window logic, and freshness calculations with deterministic timestamps.

### Fake timers

Use fake timers for polling cadence, stale thresholds, and reconnect backoff. Ensure tests clean up timers and abort controllers so test cases do not leak asynchronous work.

### Integration tests

Verify the client connects, receives updates, transitions to a stale or disconnected state, and recovers. Use a controlled mock server or transport abstraction rather than relying on a live external feed.

### Browser tests

Test tab visibility, resize, filter changes, navigation away and back, login expiry, and connection interruption. Check that no duplicate subscriptions are created after repeated mount/unmount cycles.

### Load tests

Simulate realistic event rates and bursts. Measure memory growth, queue behavior, UI responsiveness, and recovery after a temporary outage. Include slow devices and constrained network conditions.

### Test matrix

| Condition | Expected behavior |
|---|---|
| Initial request pending | Loading state |
| Empty successful snapshot | Explicit empty state |
| Temporary network failure | Retry and retain last good data with stale metadata |
| Invalid payload | Reject payload and report data-quality issue |
| Duplicate event | Deduplicate or apply idempotently |
| Out-of-order update | Reconcile by version/sequence |
| Burst of events | Apply bounded buffering/coalescing policy |
| Connection lost | Show reconnecting/disconnected state |
| Reconnection succeeds | Resume safely and reconcile missed data |
| User leaves view | Close or release resources |
| User signs out | Stop subscriptions and clear protected state |
| Browser tab hidden | Follow the documented refresh policy |
| All filters remove data | Show filtered empty state |
| Old snapshot arrives late | Do not overwrite newer state |
| Stale threshold passes | Mark data stale even if the page remains open |

## 20. Common Mistakes

| Mistake | Why it fails | Better pattern |
|---|---|---|
| Calling the dashboard “live” because a socket is open | Transport health is not source freshness | Track data timestamps and freshness thresholds |
| Using a fixed interval without overlap control | Requests can stack up and arrive out of order | Schedule the next poll after the current request or use a query client with deduplication |
| Reconnecting immediately forever | Can overload the service | Use bounded exponential backoff and jitter |
| Assuming SSE reconnect means no events were lost | Recovery requires event IDs and server replay | Define resume and snapshot reconciliation |
| Trusting message arrival order | Networks and workers can reorder events | Use sequences, versions, or cursors |
| Rendering every incoming event | Can overwhelm the UI | Buffer, aggregate, or coalesce according to data semantics |
| Dropping events without documenting it | Totals and audit feeds become incorrect | Distinguish latest-state metrics from event-complete data |
| Replacing all state on each snapshot | Resets filters and selection | Separate data state from view state |
| Treating heartbeat as a new measurement | Makes stale source data look fresh | Track transport health separately |
| Showing stale values with no warning | Users may act on old information | Display freshness and outage state |
| Retrying authentication failures forever | Wastes resources and obscures the cause | Use the established reauthentication flow |
| Leaving sockets open after unmount | Leaks connections and duplicate updates | Clean up subscriptions and transports |
| Ignoring hidden tabs | Wastes resources or causes stale UI surprises | Define visibility and resume behavior |
| Testing only a stable connection | Misses the most important failure modes | Test drops, delays, bursts, duplicates, and recovery |

## 21. Build Challenge: Live Operations Dashboard

Create a dashboard that displays:
- A current queue-depth KPI.
- A time-series chart of queue depth.
- A table of recent operational events.
- A connection and freshness indicator.
- A filter for a time window.
- A manual refresh or reconnect action where appropriate.

### Requirements

1. Define a typed snapshot schema.
2. Define a typed event schema.
3. Validate incoming payloads at runtime.
4. Choose polling, SSE, or WebSockets and document why.
5. Show the source timestamp.
6. Show the last successful receipt time.
7. Distinguish transport state from data freshness.
8. Prevent overlapping polling requests if polling is used.
9. Close connections and clear timers when the view is removed.
10. Implement a retry policy.
11. Use event IDs or sequence numbers if event ordering matters.
12. Reconcile snapshots and events without overwriting newer data.
13. Bound the in-memory event history.
14. Decide whether high-frequency updates can be coalesced.
15. Preserve user-selected filters during refresh.
16. Handle an empty snapshot.
17. Handle a malformed message.
18. Handle a temporary network outage.
19. Handle a stale feed.
20. Handle reconnection.
21. Keep the last known values clearly marked when stale.
22. Ensure the chart remains readable during updates.
23. Avoid forced scroll-to-latest while the user inspects history.
24. Provide a textual alternative for chart values.
25. Ensure essential controls are keyboard operable.
26. Test on a narrow viewport.
27. Test a burst of events.
28. Test duplicate events.
29. Test an out-of-order event.
30. Test a delayed old snapshot.
31. Test browser tab hide/show behavior.
32. Test sign-out and permission changes.
33. Track delivery delay and invalid-message counts.
34. Document freshness thresholds.
35. Document which events may be dropped or aggregated.
36. Verify that no sensitive payload is written to logs.
37. Measure performance with realistic update rates.
38. Confirm recovery does not duplicate subscriptions.
39. Include a runbook for stale or disconnected states.
40. Record known limitations.

## 22. Failure-Injection Exercises

Deliberately introduce these conditions and verify the documented behavior:

- Delay the initial snapshot.
- Make the snapshot request take longer than the polling interval.
- Return a server error for one refresh.
- Return an authorization error.
- Send malformed JSON.
- Send a valid JSON payload with the wrong schema.
- Duplicate a message ID.
- Send sequence numbers in reverse order.
- Disconnect the transport for 30 seconds.
- Reconnect after the server has discarded old events.
- Send a burst much faster than the render cadence.
- Stop source events while leaving heartbeats active.
- Send a timestamp in the future.
- Send an event older than the rolling time window.
- Hide the browser tab for several minutes.
- Resize the chart while updates continue.
- Change filters during a reconnect.
- Navigate away and return repeatedly.
- Sign out while a connection is open.
- Remove access to one feed while other feeds remain active.

For each exercise, verify both the visible behavior and the internal state transition. A dashboard should not merely avoid crashing; it should make uncertainty and recovery understandable.

## 23. Definition of Done

A real-time dashboard is ready for review when:
- “Real-time” has a measurable product definition.
- The transport choice is documented.
- Message schemas are explicit and validated.
- Event time and receipt time are not confused.
- Freshness is distinct from connection state.
- Retry and reconnect behavior are bounded and observable.
- Duplicate and out-of-order messages have defined handling.
- Snapshot/event reconciliation is safe.
- Buffers and history are bounded.
- Data loss and coalescing semantics are documented.
- UI filters and selection survive updates.
- Loading, empty, partial, stale, disconnected, and error states are implemented.
- Important values remain accessible without hover.
- High-frequency rendering is controlled.
- Sensitive data is not logged unnecessarily.
- Tests cover failures and recovery.
- Monitoring covers freshness and delivery delay, not only socket health.
- The team can explain what the dashboard does when updates stop.

## 24. Final Mental Model

A reliable real-time dashboard is a pipeline, not a timer:

**Source → Transport → Validation → Ordering/Reconciliation → State → Bounded Rendering → Freshness Communication → Recovery**

Each stage has its own failure modes. A connected transport can carry stale data; a correct event stream can overwhelm the renderer; a fast chart can display a misleading value if units or ordering are wrong. Design the data semantics and failure behavior before optimizing the visuals. The objective is a dashboard that remains honest and useful when the network is slow, the source is delayed, events arrive out of order, and users continue working while updates occur.


## 25. Recipe: A React Hook for Polling

A polling hook should have a clear contract: what data it returns, how loading and errors are represented, whether it preserves the last successful result, and how the caller can request an immediate refresh. It should not silently create a new polling loop every time a parent renders.

A robust implementation uses an effect with deliberate dependencies, an `AbortController` for the active request, and cleanup that cancels pending work. Be careful with recursive timeout helpers: the helper must stop scheduling after abort, and every rejected promise must have a defined path. If the application already uses a data-fetching library, prefer its established refresh and deduplication behavior instead of building a parallel cache.

Test the hook with a fake clock and a deferred request. Start a request, advance the clock past the expected interval, and verify that no second request starts while the first remains pending. Then resolve the request and verify that the next refresh is scheduled. Finally, unmount the component and prove that no future request occurs. These tests catch lifecycle bugs that a simple “renders data” test will miss.

## 26. Recipe: A Shared Live Data Store

When several widgets consume the same feed, a shared store can prevent each component from opening its own connection. The store should own connection lifecycle, validated state, subscription registration, and cleanup. Components should subscribe to the pieces they need rather than copying the entire stream into local state.

Keep the store's public API small. A consumer might request the latest queue-depth value, the last update time, and the current connection state. It should not need to know the underlying WebSocket URL, reconnect timer, or message framing. Make subscription ownership explicit so that the connection closes when no consumers remain if that is the intended product behavior.

Avoid a global mutable singleton that mixes data across user sessions or tenant scopes. Recreate or reset the store when the authenticated identity changes, and clear protected data on logout. If the app supports server-side rendering, ensure user-specific state is not accidentally shared across requests.

## 27. Recipe: Pause, Resume, and Inspect History

A useful live chart often needs two modes: follow the latest data and inspect a historical range. In follow mode, the viewport advances as new samples arrive. In inspection mode, incoming data may continue to be buffered while the visible range remains stable.

Represent this mode explicitly in UI state. A “Resume live” control should return the user to the current edge and make the transition clear. Do not silently switch back to live mode when a new event arrives, because that can destroy the user's current investigation.

Decide how much history is retained, how older samples are aggregated, and what happens if the requested historical range is no longer available. The UI should not imply that the complete event history is present if the browser holds only a bounded buffer. For long investigations, query the backend for historical data rather than relying on an in-memory live window.

## 28. Recipe: Multi-Feed Dashboards

Dashboards often combine feeds with different cadences: one metric may update every second, another every minute, and a third only when a job completes. Do not define the whole dashboard's freshness based on whichever feed updated most recently.

Track freshness per feed or panel, then derive an overall state using a documented rule. For example, the page might say “2 of 3 feeds current” while one panel is stale. If the product needs a single status, explain whether it represents the worst feed, the critical feeds only, or a weighted health assessment.

Avoid forcing all feeds into a single polling loop if their latency and resource requirements differ. Conversely, avoid opening duplicate connections to the same source from every panel. A shared transport layer can multiplex updates while preserving separate feed metadata and authorization boundaries.

## 29. Recipe: Alerts and Thresholds

A dashboard may highlight a metric when it crosses a threshold. Define whether the threshold is applied to each raw sample, an aggregated window, or a smoothed value. Document how long the condition must persist, whether hysteresis is used to avoid flickering, and whether missing data should clear or preserve an alert.

Do not infer a serious operational alert from a transient display artifact. The alerting logic should normally live in a dependable backend or monitoring system when missed notifications matter. The dashboard can visualize alert state, acknowledge actions where authorized, and show the source timestamp, but a browser tab should not be the sole safety mechanism.

Use text and an icon or other visual cue in addition to color. Distinguish “threshold exceeded,” “data stale,” and “source unavailable”; these states may all look alarming but require different responses.

## 30. Runbook: Investigating a Stale Dashboard

When a dashboard becomes stale, investigate in layers rather than immediately refreshing the page.

1. Confirm the displayed source timestamp and receipt timestamp.
2. Check whether the transport is connected or retrying.
3. Determine whether the backend is still receiving source events.
4. Check ingestion and processing delay.
5. Inspect invalid-message and schema-version errors.
6. Check whether sequence numbers or cursors indicate a gap.
7. Confirm whether authorization or subscription scope changed.
8. Review queue depth and dropped/coalesced update counts.
9. Verify that the browser is not paused, suspended, or holding a historical view.
10. Recover from a known snapshot or replay cursor and verify that state reconciles.

The runbook should specify who owns each layer and what evidence to capture. Avoid asking operators to copy sensitive event payloads into tickets. Prefer correlation IDs, timestamps, status codes, and redacted diagnostics.

## 31. Review Rubric: Reliability

Reliability review should examine the system while it is failing, not only while it is connected. Can the client distinguish a dead transport from a quiet source? Does it show stale data honestly? Are retries bounded? Can the client recover without duplicate subscriptions? Are missed events replayed when required? Can an old snapshot overwrite newer state? Does a partial outage remain localized to the affected panel?

A strong review includes at least one network interruption, one malformed message, one ordering problem, one burst, and one lifecycle cleanup test. If the product requires event completeness, prove how the system detects and recovers from a gap. If the product only needs latest state, document why coalescing is safe. Do not leave these semantics implicit.

## 32. Review Rubric: User Experience

UX review should ask whether the user can tell what is current, what is delayed, and what action is possible. Status labels should be understandable without decoding a colored dot. A refresh or reconnect action should not imply that the underlying source has recovered until a valid update arrives.

Check whether incoming values distract from the task. Rapidly flashing cards, constantly changing sort order, and moving charts can make a dashboard difficult to use. Preserve user intent when they inspect history or open details. Provide a clear route back to live mode, and keep the selected filters visible.

The interface should also explain the difference between “no events,” “no data returned,” “feed unavailable,” and “data is stale.” These states may all result in an empty-looking chart, but they mean different things and call for different user actions.

## 33. Review Rubric: Resource Management

Inspect the number of active timers, requests, sockets, and subscriptions after the user navigates through the application. Mount/unmount cycles should not multiply connections. Hidden tabs should follow the documented resource policy. On logout, protected feeds should stop and cached user-specific data should be cleared.

Test a long-running session rather than only a short demo. Monitor memory growth and queue length during sustained updates. If the chart stores a rolling window, prove that old points are removed or aggregated. If the server broadcasts to many clients, review connection scaling and fan-out costs; the browser implementation is only one part of the system's resource profile.

## 34. Additional Acceptance Checklist

Before release, confirm:
- The latency target and stale thresholds are written down.
- Each timestamp's meaning is documented.
- Snapshot and event schemas are versioned where needed.
- Every network payload is validated at runtime.
- Connection state and data freshness are separate.
- Retry logic respects authorization and server guidance.
- Event ordering and duplicate handling are deterministic.
- Buffer size and retention windows are bounded.
- Coalescing rules match the data's meaning.
- Filters and historical inspection survive live updates.
- The UI announces meaningful state changes without excessive noise.
- The dashboard remains usable on touch devices and with keyboard navigation.
- Logs and telemetry avoid unnecessary sensitive payloads.
- Recovery procedures are documented and tested.
- A named owner understands the stale-data runbook.