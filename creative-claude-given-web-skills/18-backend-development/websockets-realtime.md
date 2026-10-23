# SKILL: websockets-realtime
**Layer:** 18 — Backend Development
**Goal:** Design, implement, secure, test, and operate reliable bidirectional WebSocket features with clear delivery guarantees, lifecycle management, and recovery behavior.

---

## Why This Matters (Senior Perspective)

A realtime feature can look excellent in a local demo and still fail under ordinary production conditions. A user opens a project in two tabs, switches from Wi-Fi to mobile data, sleeps a laptop, or leaves a page open overnight. The server may keep a half-open socket, presence can show someone as online forever, a reconnect can duplicate a comment, or one slow browser can accumulate megabytes of queued messages. During a deploy, thousands of clients may reconnect at once. If the implementation treats a socket as a magic permanent pipe, these are not rare edge cases; they are predictable failure modes.

A senior developer separates transport from application guarantees. WebSocket gives a bidirectional channel over a TCP connection; it does not provide authorization for each action, durable storage, exactly-once business effects, replay after disconnect, or cross-instance broadcasting by itself. Seniors define message schemas, state transitions, authorization boundaries, queue limits, observability, and recovery before choosing libraries. They ask what a client should do when an acknowledgement is lost, whether a cursor update can be dropped, and how a client obtains canonical state after missing events. The design starts with failure behavior, not just the happy-path `send()` call.

For creative portfolio and freelance work, realtime capabilities can make a design-review workspace feel polished: shared cursors, reviewer presence, comments, collaborative editing, and live project status. But a client will judge the product on correctness as much as animation. A comment must not appear twice; private client projects must not leak across rooms; the page must communicate when collaboration is offline; and the interface should remain useful when the socket is unavailable. The practical target is not “always connected.” It is a system that degrades clearly, recovers predictably, protects private work, and keeps durable data correct.

---

## Core Concepts
### 1. Choose WebSockets Only for Bidirectional Needs

A WebSocket is a long-lived, full-duplex connection: either endpoint can send a message without waiting for a new HTTP request. It is not automatically better than HTTP; use the simplest transport that matches the interaction.

**Working pattern:**

```ts
// A portfolio editor needs both client commands and server-pushed presence updates.
const socket = new WebSocket("wss://api.studio.example/realtime");

// HTTP remains a better fit for one-off reads and writes.
const response = await fetch("/api/projects/portfolio-aurora", {
  headers: { Accept: "application/json" }
});
const project = await response.json();
```

The example is about the decision boundary: a socket transports events, while the application still validates inputs, checks permissions, and defines how state changes are committed. Keep those responsibilities explicit so a transport library can be replaced without rewriting business rules.

**Naive / wrong approach:**

```ts
// Naive: open a socket for a normal one-time fetch.
const socket = new WebSocket("wss://api.studio.example/get-project");
```

**Correct approach:**

```ts
// Correct: keep the policy explicit at the boundary and make failure behavior intentional.
use HTTP for request/response work and a socket for live collaboration.
const projectResponse = await fetch("/api/projects/portfolio-aurora");
const projectData = await projectResponse.json();
const collaborationSocket = new WebSocket("wss://api.studio.example/realtime");
```

**Gotcha:** A WebSocket connection has handshake and ongoing connection costs. For server-to-client-only updates, Server-Sent Events may be simpler; for ordinary CRUD, HTTP is usually clearer.

### 2. Understand the Upgrade Handshake

A WebSocket begins as an HTTP request that asks the server to upgrade protocols. The server must validate origin, authentication, requested subprotocol, and capacity before accepting the connection.

**Working pattern:**

```ts
// Browser code initiates the handshake; the browser sets Upgrade headers itself.
const socket = new WebSocket(
  "wss://api.studio.example/realtime",
  ["studio-events-v1"] // Negotiate a versioned application protocol.
);
socket.addEventListener("open", () => {
  console.info("Realtime transport established");
});
```

The example is about the decision boundary: a socket transports events, while the application still validates inputs, checks permissions, and defines how state changes are committed. Keep those responsibilities explicit so a transport library can be replaced without rewriting business rules.

**Naive / wrong approach:**

```ts
// Naive: accept every upgrade without checking the caller or route.
server.on("upgrade", (request, socket, head) => acceptAnyUpgrade(request, socket, head));
```

**Correct approach:**

```ts
// Correct: keep the policy explicit at the boundary and make failure behavior intentional.
validate the request before handing it to the WebSocket implementation.
server.on("upgrade", (request, networkSocket, head) => {
  if (!isAllowedOrigin(request.headers.origin)) {
    networkSocket.write("HTTP/1.1 403 Forbidden

");
    networkSocket.destroy();
    return;
  }
  if (request.url !== "/realtime") {
    networkSocket.write("HTTP/1.1 404 Not Found

");
    networkSocket.destroy();
    return;
  }
  webSocketServer.handleUpgrade(request, networkSocket, head, (client) => {
    webSocketServer.emit("connection", client, request);
  });
});
```

**Gotcha:** The browser controls handshake headers such as `Upgrade`; client JavaScript cannot freely set arbitrary headers. Subprotocols are useful for explicit protocol versions, not as a substitute for authentication.

### 3. Define a Versioned Message Envelope

Treat the socket as a transport, not a schema. Give every message a type, protocol version, message ID, and payload so clients can reject incompatible or malformed messages deliberately.

**Working pattern:**

```ts
type ClientMessage =
  | { version: 1; type: "presence.join"; messageId: string; projectId: string }
  | { version: 1; type: "cursor.move"; messageId: string; x: number; y: number };

const joinMessage: ClientMessage = {
  version: 1,
  type: "presence.join",
  messageId: crypto.randomUUID(),
  projectId: "portfolio-aurora"
};
socket.send(JSON.stringify(joinMessage));
```

The example is about the decision boundary: a socket transports events, while the application still validates inputs, checks permissions, and defines how state changes are committed. Keep those responsibilities explicit so a transport library can be replaced without rewriting business rules.

**Naive / wrong approach:**

```ts
// Naive: every handler guesses the shape of raw JSON independently.
const message = JSON.parse(rawText);
if (message.type === "cursor.move") updateCursor(message.x, message.y);
```

**Correct approach:**

```ts
// Correct: keep the policy explicit at the boundary and make failure behavior intentional.
parse once, validate version and type, then dispatch typed messages.
function parseClientMessage(rawText: string): ClientMessage {
  const value: unknown = JSON.parse(rawText);
  if (!isClientMessage(value)) throw new Error("Unsupported message schema");
  return value;
}
const validatedMessage = parseClientMessage(rawText);
await dispatchClientMessage(validatedMessage);
```

**Gotcha:** JSON parsing proves only that the text is valid JSON. It does not prove that the payload has the expected shape or that the sender is allowed to perform the requested action.

### 4. Validate Payloads at the Boundary

Validate message size, shape, enum values, numeric ranges, and required identifiers before business logic runs. WebSocket messages are untrusted input just like HTTP request bodies.

**Working pattern:**

```ts
import { z } from "zod";

const cursorMoveSchema = z.object({
  version: z.literal(1),
  type: z.literal("cursor.move"),
  messageId: z.string().uuid(),
  x: z.number().finite().min(0).max(1),
  y: z.number().finite().min(0).max(1)
}).strict();

const result = cursorMoveSchema.safeParse(JSON.parse(rawText));
if (!result.success) {
  sendProtocolError(client, "INVALID_MESSAGE");
  return;
}
await updateNormalizedCursor(result.data);
```

The example is about the decision boundary: a socket transports events, while the application still validates inputs, checks permissions, and defines how state changes are committed. Keep those responsibilities explicit so a transport library can be replaced without rewriting business rules.

**Naive / wrong approach:**

```ts
// Naive: accept arbitrary coordinates and trust the payload's claimed type.
const cursor = JSON.parse(rawText);
broadcast({ type: "cursor", x: cursor.x, y: cursor.y });
```

**Correct approach:**

```ts
// Correct: keep the policy explicit at the boundary and make failure behavior intentional.
enforce size before parsing, then validate the exact schema.
if (Buffer.byteLength(rawText, "utf8") > MAX_MESSAGE_BYTES) {
  client.close(1009, "Message too large");
  return;
}
const parsedCursor = cursorMoveSchema.safeParse(JSON.parse(rawText));
if (!parsedCursor.success) return sendProtocolError(client, "INVALID_MESSAGE");
broadcastValidatedCursor(parsedCursor.data);
```

**Gotcha:** Do not echo raw validation details or attacker-controlled strings into logs or client error messages. Keep a hard byte limit before JSON parsing to reduce memory and CPU abuse.

### 5. Authenticate and Authorize Every Action

A successful connection authenticates a principal at most; it does not authorize every room, project, or operation. Authorization must be checked when the client joins a room and again for sensitive mutations.

**Working pattern:**

```ts
async function handleJoin(client: AuthenticatedSocket, projectId: string) {
  // A project ID supplied by the client is a lookup key, not proof of access.
  const canViewProject = await projectAccess.canRead(client.userId, projectId);
  if (!canViewProject) {
    sendProtocolError(client, "FORBIDDEN");
    return;
  }
  rooms.addMember(`project:${projectId}`, client.id);
}
```

The example is about the decision boundary: a socket transports events, while the application still validates inputs, checks permissions, and defines how state changes are committed. Keep those responsibilities explicit so a transport library can be replaced without rewriting business rules.

**Naive / wrong approach:**

```ts
// Naive: a client can subscribe to any project by changing an identifier.
rooms.addMember(`project:${message.projectId}`, client.id);
```

**Correct approach:**

```ts
// Correct: keep the policy explicit at the boundary and make failure behavior intentional.
verify ownership or membership before adding the connection to a room.
const membership = await database.projectMembers.findUnique({
  where: { projectId_userId: { projectId: message.projectId, userId: client.userId } }
});
if (!membership) return sendProtocolError(client, "FORBIDDEN");
rooms.addMember(`project:${message.projectId}`, client.id);
```

**Gotcha:** A room name is not an access-control boundary by itself. Recheck permissions after membership changes, and remove access promptly when a user is revoked.

### 6. Handle Cookies, Tokens, and Browser Origins Safely

Browser WebSocket APIs do not let client code attach arbitrary Authorization headers. Common options are secure same-site cookies validated during the handshake or short-lived, single-use tickets obtained through an authenticated HTTPS endpoint.

**Working pattern:**

```ts
// Preferred browser flow: obtain a short-lived ticket over authenticated HTTPS.
const ticketResponse = await fetch("/api/realtime-ticket", {
  method: "POST",
  credentials: "same-origin",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ purpose: "project-collaboration" })
});
if (!ticketResponse.ok) throw new Error("Could not establish realtime session");
const { ticket } = await ticketResponse.json();
const socket = new WebSocket(`wss://api.studio.example/realtime?ticket=${encodeURIComponent(ticket)}`);
```

The example is about the decision boundary: a socket transports events, while the application still validates inputs, checks permissions, and defines how state changes are committed. Keep those responsibilities explicit so a transport library can be replaced without rewriting business rules.

**Naive / wrong approach:**

```ts
// Naive: accept cookie-authenticated sockets from any Origin.
if (request.headers.cookie) acceptConnection();
```

**Correct approach:**

```ts
// Correct: keep the policy explicit at the boundary and make failure behavior intentional.
enforce an explicit origin allowlist and validate the session.
const origin = request.headers.origin;
if (!origin || !allowedOrigins.has(origin)) return rejectUpgrade(networkSocket, 403);
const session = await sessionStore.fromCookie(request.headers.cookie ?? "");
if (!session || session.expiresAt <= Date.now()) return rejectUpgrade(networkSocket, 401);
acceptAuthenticatedConnection(session.userId);
```

**Gotcha:** Never put long-lived bearer tokens in query strings: URLs are commonly logged. If a short-lived ticket must appear in the URL, make it single-use, scoped, brief-lived, and redact it from logs.

### 7. Model Connection and Room Lifecycle

Connections are temporary resources. Track identity, subscriptions, heartbeat state, and cleanup explicitly so disconnected users do not remain in presence lists or consume room capacity.

**Working pattern:**

```ts
type ConnectionState = {
  socket: WebSocket;
  userId: string;
  joinedRooms: Set<string>;
  lastSeenAt: number;
  isAlive: boolean;
};

function closeConnection(state: ConnectionState) {
  // Remove all secondary indexes, not only the primary socket registry.
  for (const roomName of state.joinedRooms) rooms.removeMember(roomName, state.socket);
  state.joinedRooms.clear();
  connections.delete(state.socket);
}
```

The example is about the decision boundary: a socket transports events, while the application still validates inputs, checks permissions, and defines how state changes are committed. Keep those responsibilities explicit so a transport library can be replaced without rewriting business rules.

**Naive / wrong approach:**

```ts
// Naive: delete the socket from one map and leave room membership behind.
connections.delete(socket);
```

**Correct approach:**

```ts
// Correct: keep the policy explicit at the boundary and make failure behavior intentional.
one idempotent cleanup path removes every reference to the connection.
function disposeConnection(socket: WebSocket) {
  const state = connections.get(socket);
  if (!state) return; // Makes duplicate close/error cleanup safe.
  for (const roomName of state.joinedRooms) rooms.removeMember(roomName, socket);
  connections.delete(socket);
  metrics.activeConnections.dec();
}
```

**Gotcha:** `close`, `error`, server shutdown, and heartbeat timeout may all trigger cleanup. Make cleanup idempotent because more than one path can run.

### 8. Use Heartbeats to Detect Half-Open Connections

A network can fail without immediately notifying either endpoint. Ping/pong heartbeats detect stale connections and keep presence state from silently accumulating dead clients.

**Working pattern:**

```ts
const heartbeatTimer = setInterval(() => {
  for (const state of connections.values()) {
    if (!state.isAlive) {
      // A missed pong means this connection is no longer trusted as live.
      state.socket.terminate();
      disposeConnection(state.socket);
      continue;
    }
    state.isAlive = false;
    state.socket.ping();
  }
}, 30_000);

socket.on("pong", () => {
  const state = connections.get(socket);
  if (state) state.isAlive = true;
});
```

The example is about the decision boundary: a socket transports events, while the application still validates inputs, checks permissions, and defines how state changes are committed. Keep those responsibilities explicit so a transport library can be replaced without rewriting business rules.

**Naive / wrong approach:**

```ts
// Naive: mark every socket connected forever after the initial open event.
socket.on("open", () => presence.setOnline(userId));
```

**Correct approach:**

```ts
// Correct: keep the policy explicit at the boundary and make failure behavior intentional.
expire presence using heartbeat state and disconnect cleanup.
socket.on("pong", () => presence.touch(userId, Date.now()));
socket.on("close", () => presence.markDisconnected(connectionId));
```

**Gotcha:** Heartbeat interval and timeout must account for expected mobile-network pauses and proxy idle timeouts. Avoid aggressive timeouts that repeatedly disconnect healthy users on slow networks.

### 9. Design Backpressure and Slow-Consumer Policy

A producer can send faster than a client can receive. If outgoing buffers grow without bounds, one slow browser can consume server memory and delay unrelated work. Choose explicit queue limits and a policy per message class.

**Working pattern:**

```ts
const MAX_BUFFERED_BYTES = 512 * 1024;

function sendEphemeralUpdate(client: WebSocket, payload: string) {
  if (client.readyState !== WebSocket.OPEN) return;
  if (client.bufferedAmount > MAX_BUFFERED_BYTES) {
    // Cursor movement is replaceable; dropping it is better than growing memory.
    metrics.droppedEphemeralMessages.inc();
    return;
  }
  client.send(payload);
}
```

The example is about the decision boundary: a socket transports events, while the application still validates inputs, checks permissions, and defines how state changes are committed. Keep those responsibilities explicit so a transport library can be replaced without rewriting business rules.

**Naive / wrong approach:**

```ts
// Naive: enqueue every cursor movement even when a client is already far behind.
client.send(serializedCursorUpdate);
```

**Correct approach:**

```ts
// Correct: keep the policy explicit at the boundary and make failure behavior intentional.
drop or coalesce ephemeral state; disconnect clients that cannot keep up with durable events.
if (client.bufferedAmount > MAX_BUFFERED_BYTES && event.kind === "cursor") return;
if (client.bufferedAmount > MAX_BUFFERED_BYTES * 4 && event.kind === "document.patch") {
  client.close(1013, "Client cannot keep up; reconnect to resync");
  return;
}
client.send(serializedEvent);
```

**Gotcha:** `bufferedAmount` is only a signal, not a full queue-management system. For durable changes, persist events and let clients resynchronize instead of silently dropping business-critical updates.

### 10. Reconnect with Backoff and State Resynchronization

A reconnect restores transport, not necessarily application state. Clients should reconnect with jittered backoff, re-authenticate, rejoin authorized rooms, and fetch a fresh snapshot or replay from a cursor.

**Working pattern:**

```ts
let retryAttempt = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

function connectRealtime() {
  const socket = new WebSocket(REALTIME_URL);
  socket.addEventListener("open", async () => {
    retryAttempt = 0;
    await joinProjectRoom(socket, activeProjectId);
    await resynchronizeDocument(activeProjectId, lastSeenSequence);
  });
  socket.addEventListener("close", () => {
    const cap = Math.min(30_000, 500 * 2 ** retryAttempt++);
    const jitteredDelay = cap * (0.5 + Math.random() * 0.5);
    reconnectTimer = setTimeout(connectRealtime, jitteredDelay);
  });
  return socket;
}
```

The example is about the decision boundary: a socket transports events, while the application still validates inputs, checks permissions, and defines how state changes are committed. Keep those responsibilities explicit so a transport library can be replaced without rewriting business rules.

**Naive / wrong approach:**

```ts
// Naive: reconnect in a tight loop and assume no messages were missed.
socket.onclose = () => connectRealtime();
```

**Correct approach:**

```ts
// Correct: keep the policy explicit at the boundary and make failure behavior intentional.
bounded exponential backoff with jitter, then rejoin and resync.
socket.addEventListener("close", () => scheduleReconnectWithJitter());
async function afterReconnect(socket: WebSocket) {
  await authenticateConnection(socket);
  await rejoinAuthorizedRooms(socket);
  await fetchSnapshotOrReplay(lastAcknowledgedSequence);
}
```

**Gotcha:** Do not reset retry count until the connection has remained healthy or completed resynchronization; otherwise a flapping network can create a rapid reconnect storm.

### 11. Separate Ephemeral Presence from Durable Events

Cursor positions and typing indicators are ephemeral; document edits, comments, and payment state are durable business events. Different classes need different delivery, storage, and recovery guarantees.

**Working pattern:**

```ts
type RealtimeEvent =
  | { kind: "presence.cursor"; userId: string; x: number; y: number }
  | { kind: "document.patch"; eventId: string; sequence: number; patch: DocumentPatch };

function publishEvent(event: RealtimeEvent) {
  if (event.kind === "presence.cursor") {
    // Ephemeral state is broadcast but need not be stored forever.
    return broadcastToRoom("project:portfolio-aurora", event);
  }
  // Durable events are committed before announcing them to connected clients.
  return eventOutbox.persistAndPublish(event);
}
```

The example is about the decision boundary: a socket transports events, while the application still validates inputs, checks permissions, and defines how state changes are committed. Keep those responsibilities explicit so a transport library can be replaced without rewriting business rules.

**Naive / wrong approach:**

```ts
// Naive: use one lossy broadcast path for every event type.
broadcastToRoom(roomName, event);
```

**Correct approach:**

```ts
// Correct: keep the policy explicit at the boundary and make failure behavior intentional.
persist durable changes and treat presence as replaceable transient state.
if (event.kind === "document.patch") await transactionallyPersistEvent(event);
await broadcastWithClassSpecificPolicy(event);
```

**Gotcha:** A socket send succeeding means bytes were queued, not that a recipient applied the event. For durable operations, use acknowledgements, sequence numbers, and server-side persistence.

### 12. Prevent Duplicate Commands with Idempotency

Clients may retry after a timeout even when the server already committed a command. A stable command ID plus a persisted result prevents duplicate effects such as creating two comments or applying a patch twice.

**Working pattern:**

```ts
async function applyCommentCommand(command: CreateCommentCommand, userId: string) {
  return database.transaction(async (transaction) => {
    const existing = await transaction.commandResults.findUnique({
      where: { userId_commandId: { userId, commandId: command.messageId } }
    });
    if (existing) return existing.result;

    const comment = await transaction.comments.create({ data: { ...command, userId } });
    const result = { commentId: comment.id, createdAt: comment.createdAt.toISOString() };
    await transaction.commandResults.create({ data: { userId, commandId: command.messageId, result } });
    return result;
  });
}
```

The example is about the decision boundary: a socket transports events, while the application still validates inputs, checks permissions, and defines how state changes are committed. Keep those responsibilities explicit so a transport library can be replaced without rewriting business rules.

**Naive / wrong approach:**

```ts
// Naive: a retry inserts a new comment each time the same command arrives.
await database.comments.create({ data: { body: command.body, userId } });
```

**Correct approach:**

```ts
// Correct: keep the policy explicit at the boundary and make failure behavior intentional.
deduplicate by a scoped command ID in the same transaction as the effect.
const result = await applyCommentCommand(command, authenticatedUser.id);
sendToClient({ type: "command.result", messageId: command.messageId, result });
```

**Gotcha:** The uniqueness constraint must be enforced by the database, not only by an in-memory map. Scope command IDs to a principal or tenant to prevent cross-user collisions.

### 13. Scale Across Multiple Server Instances

In-memory rooms work on one process only. In a multi-instance deployment, each instance knows only its local sockets, so cross-instance broadcasts require a shared pub/sub or broker and sticky routing may be needed depending on the platform.

**Working pattern:**

```ts
// Instance A and B each own local connections; the broker distributes room events.
await realtimeBroker.publish(`room:${roomName}`, JSON.stringify(event));

realtimeBroker.subscribe(`room:${roomName}`, (serializedEvent) => {
  const event = parseServerEvent(serializedEvent);
  // Each instance delivers to its own local subscribers only.
  for (const localSocket of localRooms.members(roomName)) sendValidated(localSocket, event);
});
```

The example is about the decision boundary: a socket transports events, while the application still validates inputs, checks permissions, and defines how state changes are committed. Keep those responsibilities explicit so a transport library can be replaced without rewriting business rules.

**Naive / wrong approach:**

```ts
// Naive: broadcast only to sockets in this process.
for (const socket of localRooms.members(roomName)) socket.send(payload);
```

**Correct approach:**

```ts
// Correct: keep the policy explicit at the boundary and make failure behavior intentional.
publish cross-instance events through a broker, then fan out locally.
await broker.publish(`room:${roomName}`, payload);
// Each process subscribes to the broker and forwards to its own local room members.
```

**Gotcha:** Pub/sub is often at-most-once and can lose events during subscriber outages. It is suitable for transient presence; durable collaboration changes need persistence and replay or snapshot recovery.

### 14. Observe, Test, and Shut Down Deliberately

Realtime bugs are often temporal: races, reconnect loops, queue growth, and missed cleanup. Instrument connection counts and message outcomes, test disconnect scenarios, and drain connections gracefully during deploys.

**Working pattern:**

```ts
const realtimeMetrics = {
  activeConnections: new Gauge({ name: "realtime_active_connections" }),
  rejectedHandshakes: new Counter({ name: "realtime_rejected_handshakes_total" }),
  protocolErrors: new Counter({ name: "realtime_protocol_errors_total" }),
  messageLatency: new Histogram({ name: "realtime_message_latency_seconds" })
};

async function gracefulShutdown() {
  clearInterval(heartbeatTimer);
  // Stop accepting new work before asking clients to reconnect elsewhere.
  webSocketServer.close();
  for (const state of connections.values()) state.socket.close(1012, "Service restart");
  await waitForConnectionsToDrain({ timeoutMs: 10_000 });
}
```

The example is about the decision boundary: a socket transports events, while the application still validates inputs, checks permissions, and defines how state changes are committed. Keep those responsibilities explicit so a transport library can be replaced without rewriting business rules.

**Naive / wrong approach:**

```ts
// Naive: terminate every socket immediately when deployment begins.
process.on("SIGTERM", () => process.exit(0));
```

**Correct approach:**

```ts
// Correct: keep the policy explicit at the boundary and make failure behavior intentional.
stop new connections, notify clients, allow a bounded drain, then force-close leftovers.
process.on("SIGTERM", async () => {
  await stopAcceptingConnections();
  await notifyClientsOfRestart();
  await drainConnections(10_000);
  process.exit(0);
});
```

**Gotcha:** Do not use user IDs, tokens, full message bodies, or session cookies as metric labels. High-cardinality labels and sensitive logs create operational and privacy problems.

### 15. Integrate Realtime Collaboration into a Client Workspace

A complete collaboration flow combines transport, authorization, validation, presence, durable commands, optimistic UI, and recovery. The UI must remain usable if the socket is unavailable and should reconcile server-confirmed state.

**Working pattern:**

```ts
// Semantic UI keeps the live status available to assistive technology.
const liveStatus = document.querySelector("[data-realtime-status]");
function setConnectionStatus(status: "connecting" | "connected" | "offline") {
  if (!liveStatus) return;
  liveStatus.textContent = status === "connected" ? "Live collaboration connected" :
    status === "offline" ? "Offline — changes will sync when reconnected" : "Connecting to collaboration…";
}

async function submitComment(body: string) {
  const command = { version: 1, type: "comment.create", messageId: crypto.randomUUID(), body };
  // UI can show pending state, but only server acknowledgement confirms persistence.
  addPendingComment(command.messageId, body);
  socket.send(JSON.stringify(command));
}
```

The example is about the decision boundary: a socket transports events, while the application still validates inputs, checks permissions, and defines how state changes are committed. Keep those responsibilities explicit so a transport library can be replaced without rewriting business rules.

**Naive / wrong approach:**

```ts
// Naive: mark a comment as saved as soon as socket.send returns.
socket.send(JSON.stringify(commentCommand));
markCommentSaved(commentCommand.messageId);
```

**Correct approach:**

```ts
// Correct: keep the policy explicit at the boundary and make failure behavior intentional.
distinguish pending, confirmed, rejected, and unknown outcomes.
socket.send(JSON.stringify(commentCommand));
markCommentPending(commentCommand.messageId);
// On command.result, reconcile with the canonical server result; on timeout, query status by command ID.
```

**Gotcha:** `send()` only queues data locally. A connection can fail before the server receives it, or after the server commits it but before the acknowledgement arrives; idempotency plus status recovery resolves this ambiguity.

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Authenticated Upgrade Gate

**What it does:** Reject unauthorized or cross-origin handshakes before allocating application state.

**When to use it:** Use this when browser clients authenticate with a session cookie and your endpoint is exposed to arbitrary websites. Keep the origin allowlist explicit and avoid reflecting the request origin.

```ts
import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";

async function authorizeUpgrade(request: IncomingMessage, networkSocket: Duplex) {
  const origin = request.headers.origin;
  if (!origin || !allowedOrigins.has(origin)) {
    networkSocket.write("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
    networkSocket.destroy();
    return null;
  }
  const session = await sessionStore.fromCookie(request.headers.cookie ?? "");
  if (!session || session.expiresAt <= Date.now()) {
    networkSocket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
    networkSocket.destroy();
    return null;
  }
  return { userId: session.userId, sessionId: session.id };
}
```

For non-browser clients, define a separate explicit authentication policy rather than silently allowing a missing Origin. Origin is a browser security signal, not user identity.

### Pattern 2: Schema-First Message Dispatcher

**What it does:** Parse and validate each message once, then route it to handlers whose inputs are trusted typed values.

**When to use it:** Use this when a collaboration endpoint supports multiple event types and versions; it prevents ad-hoc JSON parsing from spreading across the codebase.

```ts
import { z } from "zod";

const inboundMessageSchema = z.discriminatedUnion("type", [
  z.object({ version: z.literal(1), type: z.literal("presence.join"), messageId: z.string().uuid(), projectId: z.string().min(1).max(100) }).strict(),
  z.object({ version: z.literal(1), type: z.literal("presence.leave"), messageId: z.string().uuid() }).strict()
]);

async function dispatchInboundMessage(userId: string, rawText: string) {
  if (Buffer.byteLength(rawText, "utf8") > 16_384) throw new ProtocolError("MESSAGE_TOO_LARGE");
  const parsed = inboundMessageSchema.safeParse(JSON.parse(rawText));
  if (!parsed.success) throw new ProtocolError("INVALID_MESSAGE");
  switch (parsed.data.type) {
    case "presence.join": return joinAuthorizedProject(userId, parsed.data.projectId);
    case "presence.leave": return leaveCurrentProject(userId);
  }
}
```

Keep schema validation separate from authorization: a structurally valid request can still be forbidden.

### Pattern 3: Room Membership with Server-Side Authorization

**What it does:** Manage room membership only after verifying the principal’s current access to the underlying resource.

**When to use it:** Use this for private client review rooms, team dashboards, and project channels where IDs are guessable or shareable.

```ts
async function joinAuthorizedProjectRoom(connection: ConnectionState, projectId: string) {
  const membership = await database.projectMembers.findFirst({
    where: { projectId, userId: connection.userId, revokedAt: null }
  });
  if (!membership) throw new AuthorizationError("Project access denied");
  const roomName = `project:${projectId}`;
  rooms.addMember(roomName, connection.socket);
  connection.joinedRooms.add(roomName);
}
```

Room names should be derived on the server after access checks. Never trust a client-supplied room name as authorization.

### Pattern 4: Acknowledged Command with Idempotency

**What it does:** Return a command result tied to a stable ID so retries do not repeat business effects.

**When to use it:** Use this for comment creation, collaborative edits, approvals, or any event whose duplicate execution would be harmful.

```ts
async function handleCreateReviewComment(userId: string, command: CreateCommentCommand) {
  const result = await commentService.createOnce({
    actorId: userId,
    idempotencyKey: command.messageId,
    projectId: command.projectId,
    body: command.body
  });
  return {
    version: 1,
    type: "command.result" as const,
    messageId: command.messageId,
    result
  };
}
```

Persist the idempotency key and result atomically with the comment. An in-memory dedupe cache is insufficient across restarts and multiple instances.

### Pattern 5: Ephemeral Presence with Expiring State

**What it does:** Represent online status and cursor state as leases that expire when refresh messages stop arriving.

**When to use it:** Use this when users can leave browsers suspended or networks disappear without a clean close event.

```ts
const PRESENCE_TTL_MS = 75_000;

async function refreshPresence(userId: string, connectionId: string) {
  await presenceStore.set(`presence:${userId}:${connectionId}`, {
    userId,
    connectionId,
    expiresAt: Date.now() + PRESENCE_TTL_MS
  }, { ttlMs: PRESENCE_TTL_MS });
}

async function isUserOnline(userId: string) {
  return (await presenceStore.countActiveConnections(userId)) > 0;
}
```

A user may have several tabs or devices. Presence should generally count active connections and become offline only when all valid leases expire or close.

### Pattern 6: Broker Fan-Out with Durable Recovery

**What it does:** Use a broker for cross-instance delivery while storing durable events separately for replay or snapshot recovery.

**When to use it:** Use this when multiple app instances host sockets for the same project and clients need correct state after reconnecting.

```ts
async function commitAndPublishDocumentPatch(patch: DocumentPatch, actorId: string) {
  const committed = await database.transaction(async (transaction) => {
    const event = await transaction.documentEvents.create({ data: { patch, actorId } });
    await transaction.outbox.create({ data: { eventId: event.id, topic: `project:${patch.projectId}` } });
    return event;
  });
  // A background publisher retries outbox rows until broker acknowledgement.
  return committed;
}

async function recoverClient(projectId: string, afterSequence: number) {
  return database.documentEvents.findMany({
    where: { projectId, sequence: { gt: afterSequence } }, orderBy: { sequence: "asc" }
  });
}
```

The outbox publisher can publish twice after an ambiguous broker response. Consumers should deduplicate by event ID; durable delivery is usually at-least-once, not magical exactly-once.

### Pattern 7: Graceful Deploy Drain

**What it does:** Stop new connections, announce a restart, allow clients to reconnect, and close remaining sockets after a bounded deadline.

**When to use it:** Use this for rolling deploys or process restarts so deploys do not look like random data loss to users.

```ts
async function drainRealtimeServer() {
  serverState.acceptingConnections = false;
  webSocketServer.close();
  for (const connection of connections.values()) {
    safeSend(connection.socket, { version: 1, type: "server.restart", retryAfterMs: 1_000 });
    connection.socket.close(1012, "Service restart");
  }
  await waitUntil(() => connections.size === 0, 8_000);
  for (const connection of connections.values()) connection.socket.terminate();
}
```

Clients should jitter reconnect delays. Without jitter, a deployment can turn one planned restart into a synchronized thundering herd.

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Using WebSockets for every API call | The technology feels more advanced than HTTP. | Use HTTP for request/response CRUD; reserve sockets for live bidirectional interactions. |
| Trusting the client-supplied room ID | Developers confuse routing with authorization. | Resolve the resource and check membership on the server before joining. |
| Accepting every Origin | Non-browser testing can make Origin checks seem optional. | Use an explicit allowlist for browser clients and a deliberate policy for non-browser clients. |
| Sending long-lived tokens in query strings | Browser WebSocket APIs cannot attach arbitrary Authorization headers. | Use secure cookies or short-lived single-use connection tickets; redact URLs from logs. |
| Parsing JSON without schema validation | Valid JSON is mistaken for valid application data. | Validate message type, version, size, ranges, and strict object shape before dispatch. |
| Broadcasting raw user input | The happy path skips output constraints. | Normalize and validate before broadcasting; render text as text, not trusted HTML. |
| Treating `send()` as persistence confirmation | Local queueing is confused with server acknowledgement. | Show pending state and wait for an application-level result. |
| Assuming exactly-once delivery | TCP reliability is confused with business-operation guarantees. | Use idempotency keys, durable storage, and duplicate-safe handlers. |
| Forgetting half-open connections | The close event is assumed to arrive promptly. | Add ping/pong heartbeat checks and expire stale presence leases. |
| Never limiting outgoing buffers | Fast producers overwhelm slow clients. | Bound buffered bytes; drop ephemeral updates and force resync for lagging durable consumers. |
| Reconnecting immediately forever | Simple retry code ignores correlated failures. | Use bounded exponential backoff with jitter and a cap. |
| Resetting retry state on every open | A short-lived connection is mistaken for a stable one. | Reset only after a healthy interval or successful resynchronization. |
| Keeping room membership after close | Cleanup is spread across event handlers. | Use one idempotent disposal path that clears all indexes and counters. |
| Using process-local rooms in a cluster | Local tests run on one instance. | Add a broker for cross-instance fan-out and durable replay for important events. |
| Storing every cursor movement forever | Ephemeral presence is modeled like business data. | Keep cursor state transient and coalesce frequent updates. |
| Publishing durable events before committing | A client can observe state that later rolls back. | Commit first and publish through an outbox or another reliable integration boundary. |
| Logging complete messages and tokens | Debugging convenience overrides privacy. | Log event type, size, IDs, and outcome; redact secrets and personal content. |
| Ignoring connection limits | Each socket consumes memory, file descriptors, and CPU. | Set per-user/IP and global limits; measure capacity and reject overload intentionally. |
| Assuming browser tabs share one socket | Connection ownership is not considered. | Design per-tab or shared-worker behavior intentionally and handle multiple devices. |
| Using one delivery policy for all events | Presence and durable commands look alike at first. | Classify events as ephemeral, durable, or command/result and specify guarantees per class. |
| Shutting down by exiting immediately | Deployment code ignores active sessions. | Stop accepting, notify clients, drain within a deadline, then force-close remaining sockets. |
| Exposing detailed protocol errors | Internal validation messages are sent directly to clients. | Return stable public error codes and retain safe diagnostic context in structured logs. |
| Omitting rate limits | Message volume seems small in manual testing. | Apply per-connection and per-principal quotas, plus payload and connection caps. |
| Failing to test disconnect races | Tests focus on one uninterrupted connection. | Test reconnect, lost acknowledgement, duplicate command, revoked membership, and server restart scenarios. |
| Treating origin validation as authentication | Origin is mistaken for a user identity. | Authenticate a session or ticket and separately authorize each operation. |

### Before / after: connection message handling

**Before — unsafe and unbounded:**

```ts
socket.on("message", async (raw) => {
  const message = JSON.parse(raw.toString());
  await rooms.join(message.room, socket);
  broadcast(message.room, message);
});
```

**After — bounded, validated, and authorized:**

```ts
socket.on("message", async (raw) => {
  try {
    if (raw.byteLength > MAX_MESSAGE_BYTES) throw new ProtocolError("MESSAGE_TOO_LARGE");
    const message = parseInboundMessage(raw.toString("utf8"));
    await authorizeMessage(connectionState.userId, message);
    await dispatchValidatedMessage(connectionState, message);
  } catch (error) {
    logProtocolFailure({ connectionId: connectionState.id, category: classifySafeError(error) });
    sendProtocolError(socket, publicErrorCode(error));
  }
});
```

---

## Mental Models

1. **A socket is a pipe, not a database** — transport success does not mean a business operation is committed.
2. **Connection is not permission** — authenticate the principal, authorize each room and action.
3. **Reconnect means resynchronize** — transport restoration does not recover missed application state.
4. **Every queue needs a limit** — bounded memory is a correctness and availability requirement.
5. **Ephemeral can be dropped; durable must recover** — define delivery policy by event meaning.
6. **Retries create duplicates** — idempotency is part of command design, not an optional optimization.
7. **One connection, many cleanup paths** — cleanup must be idempotent and remove every secondary reference.
8. **A cluster is not one process** — local room maps do not broadcast to sockets on other instances.

---

## Quick Reference

| Property / Situation | Value / Answer | Notes |
|---|---|---|
| Browser constructor | `new WebSocket(url, protocols?)` | Browser controls handshake headers. |
| Secure production scheme | `wss://` | Encrypts transport with TLS. |
| Typical ready state | `CONNECTING`, `OPEN`, `CLOSING`, `CLOSED` | Check `readyState` before sending. |
| Message serialization | JSON envelope or a documented binary schema | Include version and type. |
| Protocol versioning | `version: 1` plus versioned subprotocol if needed | Reject unknown versions deliberately. |
| Max inbound size | Set an explicit byte limit | Apply before expensive parsing. |
| Authentication | Session cookie or short-lived connection ticket | Browser API does not support arbitrary custom headers. |
| Origin policy | Explicit allowlist | Origin is not authentication. |
| Authorization | Per room and per action | Resource IDs are not capabilities. |
| Idempotency | Stable command/message ID with database uniqueness | Store result with effect. |
| Heartbeat | Ping/pong or application heartbeat | Account for proxies and mobile sleep. |
| Reconnect | Exponential backoff with jitter | Rejoin and resync after reconnect. |
| Presence | Expiring leases and connection counts | One user may have multiple tabs/devices. |
| Backpressure | Check buffered bytes and enforce limits | Drop ephemeral; resync durable state. |
| Cross-instance fan-out | Pub/sub broker | Pub/sub alone may not be durable. |
| Durable event recovery | Sequence number, replay, or fresh snapshot | Detect gaps and reconcile. |
| Outbox | Commit event and outbox row in one DB transaction | Publisher may send duplicates. |
| Close code `1000` | Normal closure | Use only for normal completion. |
| Close code `1008` | Policy violation | Avoid exposing sensitive details in reason. |
| Close code `1009` | Message too large | Useful for payload-size rejection. |
| Close code `1012` | Service restart | Common signal during graceful deploy. |
| Close code `1013` | Try again later | Can indicate overload or slow consumer. |
| Metrics | Active sockets, rejects, errors, queue size, latency | Avoid high-cardinality labels. |
| Logging | Connection ID, message type, result category | Redact cookies, tickets, and message bodies. |
| Test focus | reconnects, duplicate commands, authorization revocation | Exercise races, not only happy paths. |
| Shutdown | Stop accept → notify → drain → force close | Use a bounded drain deadline. |
| Browser fallback | HTTP endpoints and visible offline state | Realtime should not make core content unusable. |

---

## Build Challenge

### Build: Live Creative Review Workspace

Build a small review workspace for a portfolio project where a creator and client can see presence, send review comments, and receive live status changes. It should behave predictably across refreshes, network loss, and two server instances.

**Requirements**

1. Define a versioned message envelope with explicit types for `presence.join`, `presence.leave`, `cursor.move`, `comment.create`, `command.result`, and `protocol.error`.
2. Implement an authenticated handshake with an explicit browser-origin allowlist and a session or short-lived ticket validation path.
3. Enforce server-side project membership before joining `project:<id>` rooms; add a test proving a user cannot subscribe to another client's project.
4. Validate message schemas and payload byte size before invoking handlers. Return stable public error codes rather than raw exceptions.
5. Track connections, joined rooms, last heartbeat, and last-seen presence. Make cleanup idempotent for `close`, `error`, heartbeat timeout, and shutdown.
6. Show connection state in semantic HTML using a live status region. The interface must distinguish connecting, connected, offline, pending comment, and confirmed comment states.
7. Persist comments with a unique idempotency key so retrying the same `messageId` returns the original result without creating a duplicate.
8. Add bounded outgoing buffers. Coalesce or drop cursor updates when a client is slow, and force a reconnect/resync path when durable events cannot be delivered safely.
9. Add exponential backoff with jitter. After reconnect, re-authenticate, rejoin authorized rooms, and fetch a snapshot or replay events after the last acknowledged sequence.
10. Add a cross-instance broker path and document which events are ephemeral versus durable. Use an outbox or equivalent for durable database changes that must be published.
11. Record metrics for active connections, handshake rejections, protocol errors, dropped cursor updates, and command latency without logging tokens or private message bodies.
12. Add automated tests for invalid JSON, oversized messages, forbidden room joins, duplicate commands, missed heartbeat, slow consumers, lost acknowledgements, reconnect resynchronization, and graceful shutdown.

**Definition of done**

- A permitted client sees another permitted reviewer join and leave in near real time.
- A user who lacks project membership cannot join the room even if they know the project ID.
- Retrying a comment command with the same ID creates exactly one stored comment and returns a stable result.
- Disconnecting and reconnecting does not leave stale presence or duplicate comments.
- A slow client cannot cause unbounded per-connection memory growth.
- Durable updates can be recovered from a sequence cursor or snapshot after missed messages.
- The UI clearly communicates offline status and still displays previously loaded project data.
- Tests and logs make failures diagnosable without leaking session secrets or client content.

Keep the first implementation small: one project room, one durable command, one ephemeral event, one reconnect strategy, and a clear recovery contract. Expand event types only after these guarantees are tested.
