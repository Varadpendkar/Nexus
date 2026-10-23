# SKILL: push-notifications
**Layer:** 18 — PWA & Web APIs  
**Goal:** Design and implement web push notifications with explicit permission, service-worker integration, secure subscription handling, reliable delivery workflows, accessible in-page alternatives, and privacy-aware lifecycle management.

---

## Why This Matters (Senior Perspective)

Push notifications are easy to demonstrate and easy to misuse. A demo asks for permission as soon as the page loads, stores a subscription only in the browser, and assumes a successful `pushManager.subscribe()` means a message will always appear. A production implementation has to solve a different set of problems: permission may be denied or dismissed; a browser may support service workers but not the same notification behavior; a subscription can expire or become invalid; a server can send duplicate events; delivery can be delayed or suppressed by operating-system settings; and a notification click can open the wrong route or expose sensitive information on a lock screen. These are not edge cases to polish later. They define whether the feature is trustworthy.

The feature is also permission-sensitive. Notification prompts interrupt people and can reduce trust when they arrive before a clear reason exists. Browsers commonly restrict permission requests to secure contexts and user gestures, and the permission decision may be difficult or impossible for the site to reverse. Therefore, the user experience should explain the benefit before requesting permission, request only after an intentional action, and continue to work when the user says no. Never make notifications a prerequisite for reading content, completing checkout, using a dashboard, or accessing core functionality.

The architecture spans the page, service worker, application server, push service, and operating system. The page asks for permission and creates a `PushSubscription`; the server stores the subscription and associates it with an authenticated account or an anonymous installation record; a trusted server-side process sends a payload through a push service; the service worker receives a `push` event and displays a notification; and a `notificationclick` handler routes the user to relevant content. Each boundary can fail independently. The client must not contain VAPID private keys, the server must not trust arbitrary subscription records forever, and the service worker must not assume every payload contains valid JSON.

For portfolio and freelance projects, use push for meaningful, user-requested events: a report is ready, a booking changes, a monitored task completes, or a user explicitly subscribes to a small set of updates. Avoid using it as a growth hack. Build the feature as an opt-in communication channel with clear categories, frequency expectations, unsubscribe controls, duplicate protection, and an in-app inbox or other fallback where appropriate. The goal is not to maximize permission grants; it is to deliver useful updates that people understand and can control.

## Core Concepts

### 1. Separate notification display from web push delivery

The Notifications API can display a local notification from a page or service worker, while the Push API lets a push service wake a service worker for a server-originated message. They solve different jobs. A local notification can be useful for a foreground-only reminder but does not prove that remote delivery is configured. Web push requires a service worker, a subscription, server-side storage, and a sender that authenticates to the push service.

```js
// Local notification only: this does not configure remote web push.
async function showLocalNotification() {
  if (!('Notification' in window)) {
    throw new Error('Notifications are not supported in this browser.');
  }

  if (Notification.permission !== 'granted') {
    throw new Error('Notification permission has not been granted.');
  }

  new Notification('Preview ready', {
    body: 'This is a local notification preview.',
    tag: 'preview-ready'
  });
}
```

Use the distinction when designing architecture diagrams and debugging. If the local preview works but server events do not, investigate subscription registration, push service requests, server authentication, and the service worker's `push` handler rather than styling the notification UI.

**Naive approach:** Call `new Notification()` and assume a website now receives background messages.

**Correct approach:** Treat local display and remote push as separate capabilities, then test each layer independently.

**Gotcha:** `new Notification()` is not the cross-browser replacement for service-worker notifications and is not the right mechanism for remote background push. In a service worker, use `self.registration.showNotification()`.

### 2. Check secure-context and feature requirements

Service workers and push functionality require a secure context in normal production use. HTTPS is the deployment baseline; localhost is treated as trustworthy for development by modern browsers. Feature detection should check the exact APIs needed instead of inferring support from browser names or operating-system labels.

```js
function getPushCapabilities() {
  const secure = window.isSecureContext;
  const serviceWorker = 'serviceWorker' in navigator;
  const pushManager = 'PushManager' in window;
  const notifications = 'Notification' in window;

  return {
    secure,
    serviceWorker,
    pushManager,
    notifications,
    canAttemptWebPush: secure && serviceWorker && pushManager && notifications
  };
}

console.table(getPushCapabilities());
```

This check reports capability, not guaranteed success. Permissions policy, browser settings, platform restrictions, network failures, and subscription errors can still block setup. Use the result to decide whether to show setup instructions or a useful fallback, not to claim that delivery is guaranteed.

**Naive approach:** `if (navigator.userAgent.includes('Chrome'))`.

**Correct approach:** Feature-detect the required interfaces and handle the actual operation's rejection.

**Gotcha:** A browser may support notifications while a platform-specific installation mode or permission policy limits remote push. Verify the current target browsers and deployment mode.

### 3. Ask at the right moment, not on page load

The permission prompt should follow a clear explanation and a user action. The site should explain what types of messages will be sent, how often they are expected, and how the user can turn them off. A custom pre-permission panel is useful because it can explain the value before invoking the browser prompt, but it must not pretend to be the browser's permission dialog.

```html
<section aria-labelledby="updates-title" class="notification-opt-in">
  <h2 id="updates-title">Get important project updates</h2>
  <p>Receive a notification when a requested report is ready. You can turn this off later.</p>
  <button type="button" id="enable-updates">Enable notifications</button>
  <p id="notification-status" role="status" aria-live="polite"></p>
</section>
```

```js
const enableButton = document.querySelector('#enable-updates');
const status = document.querySelector('#notification-status');

enableButton.addEventListener('click', async () => {
  if (!('Notification' in window)) {
    status.textContent = 'This browser does not support notifications.';
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') status.textContent = 'Permission granted. Finish setup to receive updates.';
    else if (permission === 'denied') status.textContent = 'Notifications are blocked. You can still use the app normally.';
    else status.textContent = 'No decision was made. You can enable notifications later.';
  } catch {
    status.textContent = 'The permission request could not be completed.';
  }
});
```

The example only requests permission. A complete remote-push flow must continue by registering the service worker, subscribing with a public VAPID key, and sending the subscription to the application server. Keep those steps explicit rather than hiding all outcomes behind a single generic “enabled” state.

**Gotcha:** If permission is already `denied`, repeatedly calling `requestPermission()` usually will not show a fresh prompt. Offer instructions for browser settings without pressuring the user.

### 4. Model permission as three states plus capability

`Notification.permission` commonly reports `default`, `granted`, or `denied`. `default` means the user has not granted permission; it does not mean permission was granted implicitly. A robust UI represents unsupported, not yet requested, granted, denied, and configured subscription states separately. Permission granted does not prove that the current device has a registered subscription on the server.

```js
function notificationUiState() {
  if (!('Notification' in window)) return 'unsupported';
  if (!window.isSecureContext) return 'requires-secure-context';
  switch (Notification.permission) {
    case 'granted': return 'permission-granted-check-subscription';
    case 'denied': return 'blocked-in-browser-settings';
    default: return 'not-yet-authorized';
  }
}

console.log(notificationUiState());
```

Do not reduce all of these states to a boolean such as `notificationsEnabled`. A boolean loses important distinctions: the browser may permit notifications while the server has no record of the endpoint, or the server may have a subscription that has become invalid.

**Naive approach:** Store `notificationsEnabled = true` in local storage after the user clicks a button.

**Correct approach:** Derive browser permission from the browser, subscription state from `PushManager`, and account association from the server.

**Gotcha:** Permission can change outside the app through browser settings. Re-check it when the user returns to the settings screen rather than trusting an old client-side flag.

### 5. Register and await the service worker

A service worker is the event-driven background context that receives push events and displays notifications. Registration is asynchronous, and the registration can be installed, waiting, active, or updated. Push subscription should use a registration with an active worker. Avoid assuming that a call to `register()` means the worker has finished activating.

```js
async function getActiveServiceWorkerRegistration() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported.');
  }

  const registration = await navigator.serviceWorker.register('/service-worker.js', {
    scope: '/'
  });

  await navigator.serviceWorker.ready;
  return registration;
}

getActiveServiceWorkerRegistration()
  .then(registration => console.log('Active registration:', registration.scope))
  .catch(error => console.error('Service worker setup failed:', error));
```

The service-worker URL and scope must align with the routes the worker is expected to control. A worker at `/app/service-worker.js` has a different default scope from one at `/service-worker.js`. Deployments under a subpath need deliberate scope and asset-path configuration.

**Naive approach:** Subscribe immediately after calling `navigator.serviceWorker.register()` without awaiting readiness.

**Correct approach:** Await registration and readiness, then use the returned registration's `pushManager`.

**Gotcha:** An old active worker may continue to control a page while an updated worker waits. Test updates and activation behavior; do not rely on a fresh install to represent every real user.

### 6. Understand VAPID public and private keys

Voluntary Application Server Identification (VAPID) lets the application server identify itself to push services. The browser receives the public key when creating a subscription; the private key remains on the trusted server. Generate and store keys using a vetted tool or library, keep the private key in a secret manager or server environment, and plan for rotation. Never commit a private key to a public repository or embed it in frontend JavaScript.

```js
// Frontend: convert the base64url public key into the Uint8Array
// expected by PushManager.subscribe().
function base64UrlToUint8Array(base64Url) {
  const padding = '='.repeat((4 - base64Url.length % 4) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from(raw, character => character.charCodeAt(0));
}

const applicationServerKey = base64UrlToUint8Array(window.PUBLIC_VAPID_KEY);
```

The public key is intentionally public, but it still needs to correspond to the private key used by the sender. If the keys are mismatched, subscription creation or delivery can fail. Treat key rotation as a deployment event and understand whether existing subscriptions must be recreated.

**Gotcha:** Base64url uses `-` and `_` and may omit padding. Passing a plain decoded string instead of the expected byte array is a common subscription setup bug.

### 7. Create a subscription only after consent

`PushManager.subscribe()` creates the endpoint and encryption keys that the server needs to send messages. Use `userVisibleOnly: true` where required by the browser contract. Do not silently subscribe people during page load or create a subscription before the user has knowingly enabled notifications.

```js
async function createPushSubscription(registration, publicVapidKey) {
  if (Notification.permission !== 'granted') {
    throw new Error('Notification permission is required before subscribing.');
  }

  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: base64UrlToUint8Array(publicVapidKey)
  });
}
```

The existing-subscription check makes setup idempotent. A user may click the enable button twice, return after refreshing, or revisit the settings page. The operation should not create unnecessary records or treat a repeat visit as a new device every time.

**Naive approach:** Always call `subscribe()` and assume it returns the same object on every attempt.

**Correct approach:** Check for an existing subscription, create one only when needed, and reconcile it with the server.

**Gotcha:** A subscription object contains an endpoint and cryptographic key material. Treat it as sensitive operational data; do not print it in production logs or expose it in analytics.

### 8. Send the subscription to your application server safely

The browser's subscription must be sent to an authenticated backend endpoint that validates and stores it. Use HTTPS, validate request structure, enforce request-size limits, associate the subscription with the current user or installation, and protect account-changing routes against CSRF where cookie-based authentication is used. A subscription endpoint is not a secret login token, but it can be abused to send unwanted notifications or overwrite another user's record if authorization is weak.

```js
async function saveSubscription(subscription) {
  const response = await fetch('/api/push-subscriptions', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription)
  });

  if (!response.ok) {
    throw new Error(`Subscription save failed (${response.status}).`);
  }

  return response.json();
}
```

On the server, validate that the payload contains the expected endpoint and keys, enforce endpoint uniqueness, and never accept a user ID from the body as proof of ownership. Derive account identity from the authenticated session. If anonymous subscriptions are supported, use an explicit installation identifier and a clear migration policy when the person signs in.

**Gotcha:** A valid JSON body is not proof that a subscription is genuine, current, or owned by the user named in the request. Apply authorization and server-side validation.

### 9. Design subscription storage for more than one device

One account may subscribe from a phone, tablet, laptop, and installed PWA. A database schema should support multiple endpoints per account, timestamps, status, and a last-successful-send marker where operationally useful. A single `push_endpoint` column on a user table silently overwrites other devices and makes cleanup difficult.

```sql
CREATE TABLE push_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  failure_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX push_subscriptions_active_user_idx
  ON push_subscriptions (user_id)
  WHERE revoked_at IS NULL;
```

This is an illustrative PostgreSQL schema; adapt the key names, deletion policy, and indexes to the application's identity model. A privacy-conscious design stores only fields required for delivery and management. Establish retention rules for inactive endpoints and document how sign-out or account deletion affects subscriptions.

**Naive approach:** Keep one subscription in local storage and assume the backend does not need a record.

**Correct approach:** Treat each subscription as a device/channel record with a lifecycle and an owner.

**Gotcha:** Endpoint uniqueness is useful for deduplication, but the same endpoint may be re-associated after account changes. Define the policy transactionally rather than allowing ambiguous ownership.

### 10. Handle push events defensively in the service worker

A push event may have no payload, invalid JSON, an unexpected schema, or content that is stale. The worker should parse safely, choose a conservative fallback, and always display only validated information. Do not assume the payload is trustworthy merely because it arrived through the push service; your own sender or queue may have bugs, and payloads may contain user-controlled text.

```js
// service-worker.js
self.addEventListener('push', event => {
  event.waitUntil((async () => {
    let payload = {};
    try {
      if (event.data) payload = event.data.json();
    } catch {
      payload = { title: 'New update', body: 'Open the app to see the latest information.' };
    }

    const title = typeof payload.title === 'string' && payload.title.trim()
      ? payload.title.slice(0, 120)
      : 'New update';
    const body = typeof payload.body === 'string'
      ? payload.body.slice(0, 240)
      : 'Open the app to see the latest information.';

    await self.registration.showNotification(title, {
      body,
      icon: '/icons/notification-192.png',
      badge: '/icons/badge-72.png',
      tag: typeof payload.tag === 'string' ? payload.tag.slice(0, 100) : 'general-update',
      data: { url: typeof payload.url === 'string' ? payload.url : '/' }
    });
  })());
});
```

`event.waitUntil()` tells the browser that asynchronous work belongs to the event's lifetime. Without it, the worker can be terminated before notification display finishes. Validate URLs separately before using them in a click handler; the snippet only demonstrates type checks and should be strengthened with same-origin URL validation.

**Gotcha:** `event.data.json()` throws when the payload is absent or is not valid JSON. Wrap parsing and provide a safe fallback instead of losing the entire event.

### 11. Use `showNotification()` with deliberate options

A notification is a system-level surface. Title, body, icon, badge, tag, actions, timestamp, vibration, and interaction options are not uniformly rendered on every platform. Keep the important meaning in the title and body, use icons that exist at the configured paths, and do not depend on optional actions for the only way to complete a task.

```js
await self.registration.showNotification('Your report is ready', {
  body: 'Open the dashboard to review the completed report.',
  icon: '/icons/notification-192.png',
  badge: '/icons/badge-72.png',
  tag: 'report-ready:report-482',
  renotify: false,
  timestamp: Date.now(),
  data: { url: '/reports/482' }
});
```

A `tag` can replace an existing notification with the same tag and help avoid stacking duplicates. Choose tags based on product semantics: a stable tag such as `daily-summary` updates one summary, while an event-specific tag allows distinct critical events to remain separate. `renotify` and action support vary, so verify behavior on target platforms.

**Naive approach:** Use the same generic tag for every notification and accidentally overwrite unrelated events.

**Correct approach:** Define a notification identity strategy and keep optional enhancements nonessential.

**Gotcha:** A notification may be suppressed, grouped, delayed, or rendered differently by the operating system. Never use a notification as the only durable record of an important event.

### 12. Route notification clicks safely

A click should focus an existing application client when possible or open a new window when needed. Parse and validate the destination, restrict navigation to same-origin paths unless an external destination is explicitly intended, and avoid using untrusted payload URLs directly. A click handler should close the notification and make the target meaningful even if the app is already open on another route.

```js
self.addEventListener('notificationclick', event => {
  event.notification.close();

  event.waitUntil((async () => {
    const rawUrl = event.notification.data?.url || '/';
    let target;
    try {
      target = new URL(rawUrl, self.location.origin);
    } catch {
      target = new URL('/', self.location.origin);
    }

    if (target.origin !== self.location.origin) {
      target = new URL('/', self.location.origin);
    }

    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if (new URL(client.url).origin === self.location.origin && 'focus' in client) {
        await client.focus();
        if ('navigate' in client) await client.navigate(target.href);
        return;
      }
    }

    await self.clients.openWindow(target.href);
  })());
});
```

Review the exact `WindowClient` behavior for the browser matrix you support. Keep navigation code defensive, and ensure the destination is authorized on the server after the page opens. A notification is not an authorization token.

**Gotcha:** A string that begins with `/` is a path, but an absolute URL may point off-origin. Normalize with `new URL()` and check `origin`; do not rely on prefix checks alone.

### 13. Build the server sender as a trusted backend service

The server sender uses a maintained Web Push library to encrypt the payload and authenticate requests to the push service. Do not hand-roll encryption, VAPID signing, or HTTP request formats. The server should load its private VAPID key from a secret store, send a small payload, set a sensible TTL where supported, and interpret the response status. A successful send request means the push service accepted the message; it does not mean the operating system displayed it or the user saw it.

```js
// Illustrative Node.js server using the `web-push` package.
// Install and configure the package on the server, never in browser code.
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:push-ops@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function sendPush(subscription, payload) {
  return webpush.sendNotification(subscription, JSON.stringify(payload), {
    TTL: 60 * 60,
    urgency: 'normal'
  });
}
```

The code is illustrative; pin and review the maintained package version, configure runtime secrets, and wrap it with application-specific retry and response handling. Keep payloads small and avoid sensitive details because notification content may appear on a lock screen. Prefer a generic message and authenticated deep link for private account data.

**Gotcha:** Do not put `VAPID_PRIVATE_KEY` in a `VITE_`, `NEXT_PUBLIC_`, or other frontend-exposed environment variable. Anything shipped to the browser is public.

### 14. Classify push-service errors and remove stale subscriptions

Push endpoints can become invalid, return authorization errors after key changes, throttle requests, or experience temporary failures. Use the push library's response status to distinguish permanent subscription failures from transient service/network errors. Common web-push implementations report gone or not-found endpoints with HTTP 404/410; those records should usually be marked revoked or deleted. For transient failures, use bounded retries with backoff and avoid a retry storm.

```js
async function deliver(subscriptionRecord, payload) {
  try {
    await sendPush(subscriptionRecord.subscription, payload);
    await markDeliveryAccepted(subscriptionRecord.id);
  } catch (error) {
    const status = error.statusCode;

    if (status === 404 || status === 410) {
      await revokeSubscription(subscriptionRecord.id, 'endpoint-expired');
      return { outcome: 'removed-stale-subscription' };
    }

    if (status === 429 || (status >= 500 && status <= 599)) {
      await scheduleRetry(subscriptionRecord.id, { attemptLimit: 5, backoff: 'exponential' });
      return { outcome: 'retry-scheduled' };
    }

    await recordPermanentDeliveryFailure(subscriptionRecord.id, status ?? 'unknown');
    return { outcome: 'permanent-failure' };
  }
}
```

The helper functions above represent application-specific persistence and queue operations. A real implementation should preserve enough error context to debug the failure while redacting endpoint URLs, key material, and user data from logs. Set retry limits and dead-letter handling deliberately.

**Gotcha:** Retrying every failure forever can create costs, duplicate notifications, and noisy logs. Permanent endpoint failures need cleanup; transient failures need bounded retries.

### 15. Make sends idempotent and prevent duplicate user-visible events

Queues and background jobs can deliver the same business event more than once. A worker may retry after a timeout even if the push service accepted the first request. Design the notification pipeline around an event ID and a deduplication record. Notification `tag` helps replace visible duplicates, but it does not replace server-side idempotency because multiple devices and operating systems may interpret tags differently.

```sql
CREATE TABLE notification_outbox (
  event_id UUID PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);
```

A transaction can create the outbox row alongside the business event, and a worker can claim rows safely, send to each active subscription, and record per-subscription outcomes. Use database constraints or queue deduplication rather than “check then insert” logic that can race under concurrency.

**Naive approach:** Trigger a push directly in several code paths that all run when an order changes.

**Correct approach:** Create one durable event, process it through one controlled sender, and track attempts per destination.

**Gotcha:** A push response timeout is ambiguous: the push service may have accepted the message even if the application did not receive the response. Design for at-least-once processing and user-visible deduplication.

### 16. Provide unsubscribe, sign-out, and account-deletion paths

Permission and subscription lifecycle are different. Users may revoke permission in browser settings, unsubscribe from one device, disable one category of notifications, sign out, or delete their account. Decide what each action means. For a device-level unsubscribe, call `subscription.unsubscribe()` and remove or revoke the server record. For category preferences, retain the subscription but filter events on the server. For account deletion, remove personal association and apply the documented retention policy.

```js
async function disablePush(registration) {
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return { unsubscribed: true, hadSubscription: false };

  const endpoint = subscription.endpoint;
  const localResult = await subscription.unsubscribe();

  // The backend should revoke by a securely matched endpoint or subscription ID.
  const response = await fetch('/api/push-subscriptions/revoke', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint })
  });

  if (!response.ok) throw new Error('Server subscription cleanup failed.');
  return { unsubscribed: localResult, hadSubscription: true };
}
```

For a robust implementation, ensure the server revocation operation is authenticated and ownership-checked, and consider what should happen if local unsubscribe succeeds but the server request fails. Do not claim full removal until both sides have reconciled; queue a retry or show a truthful status. Avoid logging the endpoint as plain text.

**Gotcha:** `subscription.unsubscribe()` only changes the browser-side subscription. Your backend can still hold a stale record unless you also revoke it server-side.

### 17. Respect privacy, data minimization, and lock-screen exposure

Notification payloads may be visible to people other than the account owner. Do not include diagnosis details, private messages, payment information, one-time passwords, access tokens, or other sensitive content in notification text. Use a generic notification and an authenticated link to the app for details. Collect only the subscription data required for delivery, define retention, restrict database access, and avoid analytics events that contain endpoint URLs or payload content.

```js
const safePayload = {
  title: 'An update is available',
  body: 'Open your account to view the details.',
  url: '/account/updates',
  eventId: 'evt_7f6d2'
};
```

This is especially important on shared devices, work laptops, and lock screens. A user who agreed to receive “report ready” alerts did not necessarily consent to seeing the report's name, customer, or contents on the lock screen. Make categories and previews explicit when the product needs more detail.

**Gotcha:** Permission to send notifications is not blanket consent to include any account data in the message. Keep notification copy separate from private page content.

### 18. Keep the feature accessible and useful when denied

Permission prompts and notifications are not accessible alternatives to the in-page interface. Keep the primary task available without push, announce setup results in an appropriate status region, make the opt-in control keyboard-operable, and provide an understandable disabled state. Avoid repeated prompts after denial and do not use color alone to show whether notifications are enabled.

```html
<section aria-labelledby="notification-preferences-title">
  <h2 id="notification-preferences-title">Notification preferences</h2>
  <p>Push is optional. Important updates also appear in your account inbox.</p>
  <button type="button" id="notification-toggle">Enable push notifications</button>
  <p id="notification-feedback" role="status" aria-live="polite"></p>
  <a href="/account/updates">View updates in the app</a>
</section>
```

Use button text that describes the action rather than a vague “OK.” On state changes, update the label and status text so screen-reader users receive feedback. If permission is denied, explain that browser settings control the permission and leave the in-app inbox available.

**Gotcha:** A toast that disappears quickly can hide an important failure from people using screen magnification or assistive technology. Keep persistent status where the outcome matters.

### 19. Test lifecycle, browser differences, and failure conditions

Push behavior varies across browsers, platforms, installation modes, power-saving settings, and operating-system notification preferences. A desktop test is not enough. Validate first-time opt-in, returning users, denied permission, permission revoked after setup, offline behavior, malformed payloads, stale endpoints, click routing, multiple subscriptions, and service-worker updates. Test on actual target devices where possible because simulator behavior may not match system notification settings.

```js
// A minimal diagnostics snapshot for development-only tooling.
async function pushDiagnostics() {
  const registration = await navigator.serviceWorker?.getRegistration();
  const subscription = await registration?.pushManager?.getSubscription();

  return {
    secureContext: window.isSecureContext,
    permission: 'Notification' in window ? Notification.permission : 'unsupported',
    serviceWorker: Boolean(registration),
    activeWorker: Boolean(registration?.active),
    subscriptionExists: Boolean(subscription),
    endpointPresent: Boolean(subscription?.endpoint)
  };
}
```

Keep diagnostics safe: show whether an endpoint exists, not the full endpoint or cryptographic keys. Diagnostics should be hidden from normal users or presented as a support tool that avoids leaking operational data. Include server-side delivery status because the browser cannot tell whether the backend has stored the subscription or accepted a send request.

**Gotcha:** “The API returned success” is not an end-to-end test. Verify server acceptance, service-worker receipt, notification display, and click destination as separate checkpoints.

### 20. Observe delivery without claiming the user saw it

Push services provide limited delivery signals. A successful sender response usually indicates acceptance by the push service, not a guaranteed display or human view. Track distinct events such as `subscription_created`, `send_accepted`, `send_failed`, `notification_clicked` when the app can observe it, and `subscription_revoked`. Avoid naming an accepted send `notification_seen`. Use aggregate metrics to understand reliability without collecting unnecessary user-level behavior.

```js
function recordPushMetric(name, properties = {}) {
  // Send only allow-listed, non-sensitive fields to your metrics pipeline.
  const allowed = new Set(['eventType', 'status', 'platformFamily']);
  const safe = Object.fromEntries(
    Object.entries(properties).filter(([key]) => allowed.has(key))
  );
  metrics.track(name, safe);
}

recordPushMetric('push_send_result', {
  eventType: 'report-ready',
  status: 'accepted',
  platformFamily: 'web'
});
```

Build dashboards around failure rates, stale-subscription cleanup, queue latency, and click-through where appropriate. Avoid treating click-through as the sole measure of value: a notification may successfully inform someone without requiring a click. Keep retention and opt-out rates visible so an apparently high delivery rate does not hide a poor user experience.

**Gotcha:** A notification can be displayed but never clicked, and a click event may not reach analytics if the user is offline or tracking is blocked. Label each metric according to what it actually measures.

## Integration Patterns

### Pattern 1: Permission-first, consent-led opt-in
**What it does:** Explains the benefit, requests permission only after an explicit click, and reports the resulting state without blocking the app.  
**When to use:** Any settings page or user-triggered workflow that enables optional push alerts.

```js
async function requestNotificationPermissionFromClick(statusElement) {
  if (!('Notification' in window)) {
    statusElement.textContent = 'Notifications are unavailable in this browser.';
    return 'unsupported';
  }
  if (!window.isSecureContext) {
    statusElement.textContent = 'Notifications require a secure connection.';
    return 'insecure-context';
  }

  try {
    const permission = await Notification.requestPermission();
    const messages = {
      granted: 'Permission granted. Connecting this device…',
      denied: 'Notifications are blocked in browser settings.',
      default: 'No permission decision was made. You can try again later.'
    };
    statusElement.textContent = messages[permission] || 'Permission state unavailable.';
    return permission;
  } catch (error) {
    statusElement.textContent = 'Could not request permission. Try again from settings.';
    return 'error';
  }
}
```

Call this function directly from a button handler. Continue with subscription setup only when the result is `granted`. Keep a separate status for “permission granted” and “device registered,” because those are different milestones.

### Pattern 2: Idempotent subscribe and server reconciliation
**What it does:** Reuses an existing browser subscription or creates one, then synchronizes the current subscription with the backend.  
**When to use:** A user enables push, returns to notification settings, or repairs a previously incomplete setup.

```js
async function enablePush(publicKey) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Web push is not supported here.');
  }
  if (Notification.permission !== 'granted') {
    throw new Error('Grant notification permission first.');
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToUint8Array(publicKey)
    });
  }
  await saveSubscription(subscription);
  return { registration, subscription };
}
```

Make the backend upsert idempotently and return a stable record identifier. If the browser subscription exists but the save request fails, show a repair action that retries synchronization instead of repeatedly creating subscriptions.

### Pattern 3: Safe, minimal payload with deep link
**What it does:** Sends a compact message with a validated same-origin destination instead of private record details.  
**When to use:** Account updates, report completion, booking changes, or other notifications that should open a protected page.

```js
function safeInternalPath(candidate) {
  try {
    const url = new URL(candidate || '/', self.location.origin);
    if (url.origin !== self.location.origin) return '/';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/';
  }
}

const notificationData = {
  title: 'Your requested update is ready',
  body: 'Open the app to view the details.',
  url: safeInternalPath('/account/updates')
};
```

Validate again in the service-worker click handler. Do not trust client-side validation as a security boundary; authorization remains the responsibility of the server route.

### Pattern 4: Notification tag and server idempotency
**What it does:** Combines a durable event ID with a semantic notification tag to limit duplicate visible alerts.  
**When to use:** Jobs, status changes, and background events that may be retried or emitted by multiple workers.

```js
const eventId = 'report-ready:482';
await self.registration.showNotification('Report ready', {
  body: 'Open the dashboard to review it.',
  tag: eventId,
  renotify: false,
  data: { url: '/reports/482', eventId }
});
```

Persist event IDs server-side so repeated queue processing does not trigger uncontrolled sends. Use tags to improve the user-facing result, not as the only duplicate-prevention mechanism.

### Pattern 5: Bounded retries and stale endpoint cleanup
**What it does:** Removes expired subscriptions, retries temporary failures with backoff, and records permanent failures.  
**When to use:** Production senders that deliver through a queue or scheduled worker.

```js
function classifyPushFailure(statusCode) {
  if (statusCode === 404 || statusCode === 410) return 'revoke-subscription';
  if (statusCode === 429 || statusCode >= 500) return 'retry-with-backoff';
  if (statusCode >= 400) return 'record-permanent-failure';
  return 'investigate';
}
```

Implement the returned actions in the server's queue worker with retry caps and observability. Do not retry invalid payloads or authorization errors indefinitely; fix the configuration or revoke the bad record.

### Pattern 6: Device-level unsubscribe with server cleanup
**What it does:** Unsubscribes locally and asks the authenticated backend to revoke the corresponding server record.  
**When to use:** A “Turn off push on this device” action in account or notification settings.

```js
async function unsubscribeThisDevice(registration) {
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  const response = await fetch('/api/push-subscriptions/revoke', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint })
  });
  if (!response.ok) throw new Error('Could not synchronize unsubscribe with server.');
}
```

A robust UI should represent partial failure accurately. If local unsubscribe succeeds but the backend is unavailable, queue a safe retry or let the user retry cleanup; do not claim that the server record is already removed.

### Pattern 7: In-app fallback and preference categories
**What it does:** Keeps important updates available in the product even when push is unsupported, denied, muted, or delayed.  
**When to use:** Any product where the update itself matters more than the notification channel.

```js
const notificationPreferences = {
  reportReady: true,
  productNews: false,
  securityAlerts: true
};

function shouldSendPush(eventType, preferences) {
  const preferenceKey = {
    'report-ready': 'reportReady',
    'product-news': 'productNews',
    'security-alert': 'securityAlerts'
  }[eventType];
  return Boolean(preferenceKey && preferences[preferenceKey]);
}
```

Use the server-side preference record as the authority for delivery categories. The in-app inbox should show durable events independently from push status so that opting out does not mean missing essential account information.

## Common Mistakes

| Mistake | Why it fails | Unique fix |
|---|---|---|
| A. Requesting permission on first page load | It interrupts people before they understand the value and may lead to denial. | Introduce a concise benefit explanation and request permission from a deliberate user action. |
| B. Treating `default` as permission granted | No explicit approval exists, so subscription creation may fail. | Model `default`, `granted`, and `denied` as separate UI states and gate subscription setup. |
| C. Assuming permission means delivery is configured | A subscription may not exist or may not be stored on the server. | Reconcile browser subscription state with the authenticated backend after permission is granted. |
| D. Using local `new Notification()` as remote push | It does not configure a push endpoint or service-worker event handler. | Test the remote flow through `PushManager`, the sender, and the worker's `push` event. |
| E. Registering but not awaiting the worker | Subscription attempts can race worker activation. | Await `navigator.serviceWorker.ready` before accessing the active registration's push manager. |
| F. Shipping the VAPID private key to the browser | Anyone can extract the key and impersonate the application server. | Keep the private key in server-only secret storage and expose only the public key to clients. |
| G. Sending subscriptions without authentication | Attackers can associate endpoints with the wrong account or abuse the endpoint. | Derive ownership from the authenticated session and validate subscription payloads server-side. |
| H. Storing only one endpoint per user | New devices overwrite old ones and notifications become inconsistent. | Use a dedicated subscription table with unique endpoints and multiple records per account. |
| I. Trusting push payload JSON without parsing guards | Malformed or empty payloads can abort the worker event. | Catch parsing errors and fall back to a validated generic notification. |
| J. Omitting `event.waitUntil()` | The worker may terminate before asynchronous notification work finishes. | Attach the full asynchronous push-handler promise to the event lifetime. |
| K. Putting private data in notification text | Lock screens and shared devices can expose sensitive information. | Send generic copy and route to an authenticated page for private details. |
| L. Opening arbitrary payload URLs | An untrusted destination can redirect users off-origin. | Normalize with `new URL()` and enforce an explicit origin allow-list before navigation. |
| M. Retrying every failure forever | Invalid endpoints create waste, queue buildup, and noisy operational costs. | Classify status codes, revoke stale endpoints, and use bounded exponential backoff for transient errors. |
| N. Treating a sender 2xx as user-visible delivery | Acceptance by a push service is not proof of display or human attention. | Name metrics precisely and track sender acceptance, click events, and endpoint failures separately. |
| O. Unsubscribing only in the browser | The backend retains a stale endpoint and continues attempting sends. | Revoke the server record with an authenticated operation and handle partial cleanup failure. |
| P. Using notification tags as the only dedupe strategy | Tags do not prevent duplicate server jobs or guarantee identical platform behavior. | Add a durable event ID and idempotent server-side outbox processing. |
| Q. Assuming support from the browser name | Platform and installation-mode behavior can differ between versions. | Feature-detect APIs and run a target-device compatibility matrix. |
| R. Hiding all feedback in a transient toast | Users may miss errors and assistive technology may not announce the result. | Keep an accessible status region and persistent settings state for important outcomes. |
| S. Logging full endpoints and keys | Logs can expose operational identifiers and create unnecessary privacy risk. | Redact subscription fields and emit only allow-listed diagnostics to logs and analytics. |
| T. Making push mandatory for core tasks | Users who deny permission lose access and may feel coerced. | Keep an in-app inbox and allow all essential workflows without push permission. |

## Mental Models

1. **Permission is a user decision, not a conversion metric.** Optimize for informed choice and long-term trust rather than the percentage of visitors who click “Allow.”
2. **A subscription is a device channel, not an account.** One person can have many devices, and one device can change account association over time.
3. **The browser is a client, not the source of authorization.** The backend must derive identity from a trusted session and validate every subscription mutation.
4. **Push is a delivery pipeline, not a single API call.** Page, service worker, backend, queue, push service, operating system, and user attention are distinct stages.
5. **Acceptance is not display, and display is not attention.** Metrics should describe the exact observable event and never claim more than the system knows.
6. **At-least-once systems need idempotency.** Timeouts and queue retries make duplicate processing normal; design for it explicitly.
7. **Notifications are previews, not private application screens.** Assume that the title and body may be visible on a lock screen or shared device.
8. **Every opt-in needs an opt-out.** A trustworthy permission flow includes device-level unsubscribe, category preferences, and account-deletion behavior.
9. **Graceful degradation is part of the product.** A denied or unsupported notification API should not break the core task or erase important updates.
10. **A worker is short-lived and event-driven.** Persist important state outside the worker's in-memory variables and use `waitUntil()` for asynchronous event work.
11. **Browser capability is not delivery reliability.** Feature detection tells you whether an attempt is possible; only end-to-end tests and operational metrics reveal reliability.
12. **Security boundaries deserve explicit validation.** Treat payload fields, request bodies, URLs, and subscription records as untrusted until validated.

## Quick Reference

| Need | API / mechanism | Important behavior | Production check |
|---|---|---|---|
| Check notification support | `'Notification' in window` | Does not guarantee remote push support | Show a usable fallback if unsupported |
| Check secure context | `window.isSecureContext` | HTTPS is the production baseline | Validate staging and production URLs |
| Read permission | `Notification.permission` | `default` is not consent | Render explicit permission states |
| Request permission | `Notification.requestPermission()` | Invoke after a user gesture and explanation | Handle all outcomes and rejection |
| Register worker | `navigator.serviceWorker.register()` | Registration is asynchronous | Await worker readiness before subscribing |
| Access registration | `navigator.serviceWorker.ready` | Resolves when an active registration is ready | Confirm correct scope and script URL |
| Read existing subscription | `registration.pushManager.getSubscription()` | May return `null` | Reconcile existing endpoint with server |
| Create subscription | `registration.pushManager.subscribe()` | Requires permission and application server key | Use `userVisibleOnly: true` and public VAPID key |
| Convert VAPID key | Base64url-to-`Uint8Array` helper | URL-safe encoding and padding matter | Test the exact configured public key |
| Persist subscription | Authenticated `POST` endpoint | Browser object is not server ownership proof | Validate, authorize, and upsert idempotently |
| Receive remote push | `self.addEventListener('push', ...)` | Payload can be missing or malformed | Parse defensively and call `waitUntil()` |
| Display notification | `self.registration.showNotification()` | Options vary by platform | Keep key information in title and body |
| Route click | `notificationclick` event | Payload URLs need validation | Restrict to same-origin or explicit allow-list |
| Send push | Server-side Web Push library | 2xx means accepted by push service | Track acceptance separately from display |
| Remove stale endpoint | HTTP 404/410 handling | Often indicates expired subscription | Revoke or delete the server record |
| Retry temporary errors | Queue with bounded backoff | Unbounded retries create storms | Limit attempts and track dead-letter cases |
| Unsubscribe device | `subscription.unsubscribe()` | Local unsubscribe is not server cleanup | Revoke the authenticated backend record too |
| Prevent duplicates | Event ID, outbox, semantic `tag` | Tags alone are insufficient | Enforce server-side idempotency |
| Respect preferences | Server-side category settings | Client flags are not authoritative | Filter sends before contacting push service |
| Protect privacy | Minimal payload and redacted logs | Lock-screen content may be exposed | Keep sensitive details behind authenticated routes |
| Measure reliability | Delivery state machine and metrics | A click is not proof of all delivery stages | Name metrics according to what was observed |

## Build Challenge — Production-Ready Push Notification System

Build a notification feature for a portfolio project dashboard. A signed-in user can opt into a “report ready” alert, receive a push notification when a report completes, open the report from the notification, and disable push for the current device. The app must continue to work when push is unavailable or denied.

### Functional requirements

1. Create a dedicated notification settings page with an explanation of the exact event types and expected frequency.
2. Do not request permission automatically on first page load, route change, or after a timer.
3. Implement a deliberate enable button and handle `granted`, `denied`, `default`, unsupported, and error outcomes separately.
4. Check secure-context status and the APIs required for service workers and push before beginning setup.
5. Register a service worker at the correct path and scope for the deployed application.
6. Wait for an active service-worker registration before calling `pushManager` methods.
7. Configure a public VAPID key in the client without exposing the private key in any frontend bundle.
8. Convert the public VAPID key from base64url to a `Uint8Array` and verify subscription creation on supported browsers.
9. Reuse an existing subscription rather than blindly creating a new one on every settings-page visit.
10. Send subscription data to an authenticated backend endpoint over HTTPS.
11. Validate the subscription schema and enforce request-size limits on the server.
12. Associate the subscription with the authenticated user, not a user ID supplied by the request body.
13. Support multiple device subscriptions per account with unique endpoint records.
14. Store creation, last-seen, and revocation metadata for subscription lifecycle management.
15. Add a server-side sender using a maintained Web Push library and server-only VAPID secrets.
16. Trigger a push from a real report-completion event rather than from an arbitrary client request.
17. Use a durable event ID or outbox record to make background processing idempotent.
18. Keep the payload compact and avoid report content, private identifiers, access tokens, or sensitive personal information.
19. Handle an empty payload and malformed JSON without crashing the service worker.
20. Use `event.waitUntil()` for asynchronous push-handler and click-handler work.
21. Display a notification with a valid icon, a concise title, a useful body, a semantic tag, and a destination path.
22. Validate notification destinations and reject off-origin payload URLs unless a specific allow-list permits them.
23. On click, close the notification and focus or open the relevant application route.
24. Handle push-sender 404/410 responses by revoking stale subscriptions.
25. Handle 429 and transient 5xx/network errors using bounded retry with backoff.
26. Prevent the same business event from generating unlimited duplicate notifications after queue retries.
27. Add a device-level unsubscribe button that attempts local unsubscribe and server-side revocation.
28. Represent partial unsubscribe failure honestly and provide a retry or support path.
29. Keep an in-app updates list available when push is unsupported, denied, muted, or temporarily unavailable.
30. Store category preferences on the server and enforce them before sending.
31. Re-check browser permission when the user revisits settings, rather than trusting a stale local-storage boolean.
32. Provide keyboard-accessible controls, clear focus states, and a live status message for setup results.
33. Avoid repeatedly prompting a user whose permission is denied; explain browser settings without coercion.
34. Redact endpoints, cryptographic keys, sensitive payloads, and personal data from logs and analytics.
35. Add development-only diagnostics that show permission, worker readiness, and subscription presence without printing secrets.
36. Record sender acceptance, permanent failure, retry scheduling, click events, and revocation as distinct event types.
37. Label analytics precisely; never record sender acceptance as “notification seen.”
38. Test multiple subscriptions on the same account and ensure disabling one device does not disable all devices accidentally.
39. Test account sign-out and deletion behavior against the documented subscription lifecycle policy.
40. Document supported browser/platform combinations and a fallback path for each unsupported combination.

### Required failure drill

After the normal flow works, deliberately break the VAPID public key and verify that subscription setup reports an actionable failure without displaying a false success state. Restore the key, then remove one subscription endpoint from the test push service or simulate an HTTP 410 response. Confirm that the sender marks the endpoint stale and stops retrying it. Next, send a malformed payload and a payload containing an off-origin URL; confirm that the service worker displays safe fallback text and click handling navigates only to the allowed application origin. Finally, deny notification permission and prove that the report list and in-app updates remain usable. Capture the observed result for each test rather than relying on a code review alone.

### Acceptance test matrix

| Scenario | Setup | Expected result |
|---|---|---|
| First visit | Permission is `default` | No automatic prompt; explanation and enable action are visible |
| User grants permission | Click enable and accept prompt | Subscription is created or reused, then synchronized to backend |
| User denies permission | Click enable and deny prompt | Honest blocked state; core app remains usable |
| Unsupported browser | Missing required API | Clear fallback and no uncaught exception |
| Insecure staging URL | `isSecureContext` is false | Setup is blocked with a secure-connection explanation |
| Worker not active | Registration is still activating | Subscription waits for readiness or displays a recoverable error |
| Existing subscription | Browser returns a subscription | Backend record is reconciled without duplicate rows |
| Backend save failure | Subscription succeeds but API returns 500 | UI does not claim full setup; retry can synchronize the existing subscription |
| Malformed payload | Push data is invalid JSON | Safe fallback notification appears without worker crash |
| Missing payload | Push event has no data | Generic notification is shown or the event is handled safely |
| Off-origin click URL | Payload points to an external host | Click falls back to an allowed same-origin route |
| Expired endpoint | Sender receives 404/410 | Subscription is revoked and not retried indefinitely |
| Rate limited | Sender receives 429 | Retry is scheduled with bounded backoff |
| Duplicate event | Same event ID is processed twice | Server idempotency and notification tagging reduce duplicates |
| Local unsubscribe | User disables this device | Local subscription and server record are reconciled |
| Server unavailable during unsubscribe | Backend revocation fails | UI reports partial failure and offers a recovery path |
| Private event details | Event contains sensitive fields | Payload remains generic and does not expose the private fields |
| Multiple devices | Account has two active endpoints | Both receive eligible updates; one-device unsubscribe affects only one |
| Permission revoked externally | User changes browser settings | Settings page detects the new state and explains the mismatch |
| Keyboard-only navigation | No pointer is used | Enable, status, and unsubscribe controls are operable and perceivable |

## Definition of Done

- [ ] Permission is requested only after an informed user action and never blocks the core product workflow.
- [ ] Unsupported APIs, insecure contexts, denied permission, and setup failures have explicit, accessible states.
- [ ] Service-worker registration, activation, subscription creation, and server synchronization are separate observable steps.
- [ ] The VAPID private key exists only in trusted server-side configuration and is never included in a client bundle.
- [ ] Subscription records are authenticated, validated, idempotent, and capable of representing multiple devices per account.
- [ ] Push payload parsing, notification display, and click routing handle malformed and untrusted input safely.
- [ ] Notification content avoids sensitive data and uses a validated same-origin destination by default.
- [ ] Sender errors are classified; stale endpoints are revoked and transient failures use bounded retry.
- [ ] Server-side event idempotency prevents uncontrolled duplicate sends when jobs retry.
- [ ] Device-level unsubscribe and server-side cleanup are both implemented, with partial failures represented honestly.
- [ ] An in-app fallback preserves access to important updates when push is unavailable or denied.
- [ ] Logs and metrics do not expose full endpoints, cryptographic keys, or sensitive payload content.
- [ ] A target-browser/device test matrix covers permission, worker, delivery, click, unsubscribe, and failure scenarios.
- [ ] The required failure drill passes and results are documented.
- [ ] Support limitations, retention policy, category preferences, and account-deletion behavior are documented.

## Debugging Sequence

1. **Start with the environment.** Confirm HTTPS or a trusted local development context, API presence, browser version, and the target platform's push support.
2. **Inspect permission state.** Confirm whether permission is `default`, `granted`, or `denied`; do not infer it from a local flag or the appearance of a settings control.
3. **Inspect service-worker registration.** Confirm script URL, scope, active worker, console errors, and whether an old worker is controlling the page.
4. **Inspect subscription state safely.** Check whether `getSubscription()` returns a value and whether the backend has a corresponding active record. Do not paste the full endpoint or keys into tickets.
5. **Check public/private VAPID pairing.** Verify the public key used by the browser matches the server configuration, and confirm the private key is available only to the sender.
6. **Check backend persistence.** Verify authentication, validation, endpoint uniqueness, ownership association, and server response codes.
7. **Check the sender result.** Inspect status codes, retry counts, queue age, and whether a stale endpoint has been revoked.
8. **Check the service-worker event.** Confirm the push event fires, payload parsing succeeds or falls back safely, and `waitUntil()` wraps the async work.
9. **Check notification options.** Verify asset paths, title/body, tag, and target-platform rendering. Do not assume an option is supported everywhere.
10. **Check click routing.** Confirm the destination is same-origin, the app client is focused or opened, and the route itself enforces authentication.
11. **Check the operating system.** Verify system-level notification settings, focus/do-not-disturb modes, battery-saving restrictions, and installed-PWA behavior where applicable.
12. **Check the claim.** Distinguish sender acceptance from display, click, and actual task completion; report only what the telemetry can support.

## Production Checklist

- **Consent:** The value proposition is specific, the prompt is user-initiated, and denied permission does not degrade essential functionality.
- **Security:** VAPID private key is server-only; subscription endpoints require authentication and ownership validation; click URLs are constrained.
- **Data:** Subscription records are unique, multi-device capable, revocable, and covered by retention and deletion rules.
- **Reliability:** Push processing uses a durable queue or outbox, bounded retries, stale-endpoint cleanup, and idempotent event IDs.
- **Worker:** Push and click handlers use `waitUntil()`, parse defensively, and do not depend on in-memory state surviving between events.
- **Privacy:** Payloads are minimal, lock-screen exposure is considered, and telemetry redacts endpoint and key material.
- **Accessibility:** Setup results are announced, controls are keyboard-operable, and in-app updates remain available.
- **Compatibility:** Real devices and supported browser versions are tested, including permission changes and installed-mode differences.
- **Operations:** Dashboards distinguish accepted sends, permanent failures, retries, revocations, and clicks; alerts are actionable rather than noisy.
- **Documentation:** Deployment keys, browser support, subscription lifecycle, unsubscribe behavior, and incident debugging are documented.

## Final Principle

Push notifications are a user-controlled channel for timely information, not a guarantee that a message was seen. Build the entire lifecycle—from explanation and permission through subscription, delivery, click handling, and revocation—as a secure, observable, recoverable system. If a person declines push, the product should still work well; if a push fails, the system should diagnose it honestly; and if the person changes their mind, the application should respect that decision across the browser and backend.
