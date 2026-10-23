# SKILL: clipboard-share-api
**Layer:** 18 — PWA & Web APIs  
**Goal:** Implement secure, accessible copy-and-share interactions with Clipboard API and Web Share API while handling permissions, unsupported environments, and user feedback gracefully.

---

## Why This Matters (Senior Perspective)

Copy and share controls often look trivial: call `navigator.clipboard.writeText()` or `navigator.share()` and show a toast. In production, that assumption fails in ways users notice immediately. A portfolio visitor may try to copy a project URL from a mobile browser where clipboard access is unavailable; a user may press a share button after an asynchronous network request has consumed the transient user activation; a permission prompt may be denied; or a success message may appear even though the copy operation rejected. On desktop, the native share sheet may not exist at all. On a public-facing freelance site, these small failures make the interface feel unreliable and can interrupt a lead, customer, or recruiter who simply wanted to share a case study.

A senior developer treats clipboard and sharing as capability-based progressive enhancement, not guaranteed browser features. The implementation begins with the user intent, then checks whether the browser can perform that action, invokes the API directly from a deliberate user gesture, catches rejection, and provides a fallback that remains usable with a keyboard and assistive technology. Feature detection is more robust than browser-name checks because browser capabilities vary by version, operating system, embedded web view, permissions policy, and secure-context status. The UI must also distinguish “copied” from “could not copy,” and “opened the share sheet” from “the user actually sent it.” A resolved `share()` promise does not prove a message reached another person; it means the share operation completed according to the browser's contract.

For creative portfolio and freelance work, share actions can be part of the conversion path: a case study is forwarded to a hiring manager, a product page is sent to a client, or a booking link is copied into a message. Make the primary action obvious, preserve a normal selectable URL when enhancement fails, and never hijack the user's clipboard on page load. Share only intended information, avoid including private tokens or personal data in share payloads, and respect browser security requirements. The result is a small feature that behaves like a professional product feature rather than a demo that works only on the developer's machine.

## Core Concepts

### 1. Understand the two APIs and their different jobs

The Async Clipboard API reads and writes clipboard data; the Web Share API hands a payload to the operating system's share interface. They are related user actions, but they are not interchangeable. Copy is useful when a person wants to paste a value into a chosen destination. Share is useful when the browser can offer installed destinations such as messaging, mail, or nearby sharing.

```html
<article class="project-card" aria-labelledby="project-title">
  <h2 id="project-title">Field Notes — Product Design</h2>
  <p>Explore the research and interface decisions.</p>
  <div class="project-actions">
    <button type="button" class="copy-link" data-share-url="https://example.com/work/field-notes">Copy link</button>
    <button type="button" class="share-project" data-share-url="https://example.com/work/field-notes">Share project</button>
  </div>
</article>
```

```js
const canWriteClipboard = () => Boolean(navigator.clipboard?.writeText);
const canShare = () => typeof navigator.share === "function";

console.table({
  clipboard: canWriteClipboard(),
  webShare: canShare()
});
```

The first example gives the actions meaningful names and keeps them as real buttons. The second checks the capability the feature needs, rather than guessing based on the user agent.

**Naive approach:** Assume every browser supports both APIs because they work in one desktop browser.

**Correct approach:** Detect each capability independently and provide a useful alternative when either is unavailable.

**Gotcha:** `navigator.clipboard` may exist while a particular operation still rejects due to permission, policy, or context restrictions. Feature detection is not a guarantee of success.

### 2. Secure contexts are part of the feature contract

Clipboard operations are generally restricted to secure contexts. Production HTTPS is the expected baseline; `localhost` is treated as potentially trustworthy for development. An HTTP deployment on a public host may not expose the same capabilities as local development, creating the classic “works on my machine” bug.

```js
function clipboardEnvironment() {
  return {
    secureContext: window.isSecureContext,
    clipboardAvailable: Boolean(navigator.clipboard?.writeText),
    shareAvailable: typeof navigator.share === "function"
  };
}

console.table(clipboardEnvironment());
```

```js
function explainClipboardUnavailable() {
  if (!window.isSecureContext) {
    return "Copy is unavailable in this insecure connection. Select the link and copy it manually.";
  }
  if (!navigator.clipboard?.writeText) {
    return "This browser does not provide clipboard writing here. Select the link and copy it manually.";
  }
  return "Clipboard writing is available; the operation can still be denied.";
}
```

The diagnostic makes environment restrictions visible during testing and gives the interface a specific explanation instead of a generic error.

**Naive approach:** Test only on `localhost` and assume deployment behaves identically.

**Correct approach:** Test the deployed HTTPS origin, embedded browsers, and the browsers your audience actually uses.

**Gotcha:** `window.isSecureContext` is a useful diagnostic, not a replacement for handling promise rejection.

### 3. Call clipboard writes from an intentional user action

Clipboard writes are sensitive because they alter a user's clipboard. Browsers apply security and user-activation rules to reduce silent clipboard manipulation. Start the operation in the click handler and make the requested content explicit.

```js
async function copyText(text) {
  if (!navigator.clipboard?.writeText) {
    throw new Error("Clipboard API is unavailable");
  }
  await navigator.clipboard.writeText(text);
}

const copyButton = document.querySelector(".copy-link");
copyButton?.addEventListener("click", async () => {
  try {
    await copyText(copyButton.dataset.shareUrl);
    console.info("Link copied");
  } catch (error) {
    console.error("Copy failed", error);
  }
});
```

```js
// Keep the user gesture connected to the API call.
shareButton?.addEventListener("click", () => {
  if (typeof navigator.share !== "function") return;
  navigator.share({ title: document.title, url: location.href })
    .catch((error) => {
      if (error.name !== "AbortError") console.error("Share failed", error);
    });
});
```

The code invokes the API from a real click and treats rejection as a normal possibility. Avoid placing unrelated asynchronous work before `writeText()` or `share()`; the user activation may no longer be valid by the time the sensitive API is called.

**Naive approach:** Fetch metadata, await a timer, then attempt to open the share sheet.

**Correct approach:** Prepare the payload before the click when practical, then invoke the API immediately from the gesture.

**Gotcha:** Framework event handlers still need to preserve the synchronous user-activation path. An `async` handler is fine, but awaits before the API call can be problematic.

### 4. Await the clipboard promise before reporting success

A copy interaction is not successful merely because the click handler ran. Only announce success after `writeText()` resolves. Keep errors separate from success so users can retry or use a manual fallback.

```js
async function copyProjectUrl(url, statusElement) {
  statusElement.textContent = "Copying link…";
  try {
    await navigator.clipboard.writeText(url);
    statusElement.textContent = "Link copied to clipboard.";
    return true;
  } catch {
    statusElement.textContent = "Could not copy automatically. Select the link below and copy it.";
    return false;
  }
}
```

```html
<p class="share-url-label">Project URL</p>
<input class="share-url" type="url" readonly value="https://example.com/work/field-notes" aria-label="Project URL">
<p class="copy-status" role="status" aria-live="polite"></p>
```

The live status region communicates state changes without requiring the user to locate a newly rendered element. The readonly URL remains selectable for manual copying.

**Naive approach:** Display “Copied!” immediately and ignore a later rejection.

**Correct approach:** Wait for resolution, then announce the outcome; if it fails, expose a real fallback.

**Gotcha:** Do not put the full URL only in a toast that disappears. The fallback should remain available long enough for the user to act.

### 5. Build a useful fallback without relying on deprecated APIs

The modern Clipboard API is the primary path. A robust interface can reveal a readonly input or link for manual selection when the API is absent or rejected. The historical `document.execCommand("copy")` technique is deprecated and should not be the only fallback.

```html
<section class="share-fallback" hidden aria-labelledby="share-fallback-title">
  <h3 id="share-fallback-title">Copy the project link</h3>
  <label for="project-url">Project URL</label>
  <input id="project-url" type="url" readonly value="https://example.com/work/field-notes">
  <p>Select the URL, then use your device's Copy command.</p>
</section>
```

```js
function revealManualCopy(input, fallback) {
  fallback.hidden = false;
  input.focus();
  input.select();
  input.setSelectionRange(0, input.value.length);
}
```

Selecting the value helps, but does not guarantee that it has been copied. The visible instruction must tell the user to use the platform's copy command.

**Naive approach:** Use `execCommand` as if it were a permanent, standards-based clipboard API.

**Correct approach:** Prefer `navigator.clipboard.writeText()` and provide a manual, keyboard-accessible selection fallback.

**Gotcha:** Some mobile browsers do not expose desktop-style text selection behavior. Keep the input visible and allow the user to interact with it manually.

### 6. Treat Web Share as a handoff, not a delivery receipt

`navigator.share()` opens the browser or operating system's share interface with a title, text, URL, and—where supported—files. The browser decides which destinations are available. The site cannot reliably know which destination the user selected or whether the recipient read the content.

```js
async function shareCurrentProject({ title, text, url }) {
  if (typeof navigator.share !== "function") {
    return { status: "unsupported" };
  }
  try {
    await navigator.share({ title, text, url });
    return { status: "completed" };
  } catch (error) {
    if (error.name === "AbortError") return { status: "cancelled" };
    return { status: "failed", error };
  }
}
```

```js
shareButton.addEventListener("click", async () => {
  const result = await shareCurrentProject({
    title: "Field Notes — Product Design",
    text: "A case study on research-led product design.",
    url: "https://example.com/work/field-notes"
  });
  if (result.status === "unsupported") showCopyAlternative();
  else if (result.status === "failed") showShareError();
});
```

The result distinguishes unsupported, cancelled, and failed states. A cancellation is usually a normal user choice, not an error that needs an alarming message.

**Naive approach:** Tell analytics that a link was “sent” whenever `share()` resolves.

**Correct approach:** Record only what the browser confirms, such as a share attempt or a completed share operation, and do not infer delivery.

**Gotcha:** `AbortError` commonly indicates the user dismissed the share sheet. Do not show a failure toast for ordinary cancellation unless the product has a specific reason.

### 7. Validate share payloads before invoking the API

Share payloads should be intentionally small, user-relevant, and free of secrets. Use canonical public URLs rather than internal URLs that contain session IDs, access tokens, or personal data.

```js
function buildProjectSharePayload(project) {
  const url = new URL(project.publicUrl, window.location.origin);
  if (url.origin !== window.location.origin) {
    throw new Error("Project share URL must use the expected origin");
  }
  return {
    title: String(project.title).slice(0, 120),
    text: `Take a look at ${project.title}.`,
    url: url.href
  };
}
```

```js
const payload = buildProjectSharePayload({
  title: "Field Notes",
  publicUrl: "/work/field-notes"
});
if (navigator.share && (!navigator.canShare || navigator.canShare(payload))) {
  navigator.share(payload).catch(handleShareError);
}
```

The URL validation is an application policy, not a universal requirement. If your product intentionally shares external URLs, use an explicit allowlist or a suitable validation rule instead of silently assuming same-origin content.

**Naive approach:** Share `location.href` without considering query parameters containing tracking or sensitive values.

**Correct approach:** Construct a canonical share URL and include only the information the user expects to disclose.

**Gotcha:** `navigator.canShare()` is useful for checking whether a payload can be shared, especially for files, but it may not exist in every implementation.

### 8. Feature-detect share support and provide a copy alternative

A share button should not disappear into a dead end on browsers without Web Share. The interface can show a native share action when supported and always keep a copy action available.

```js
function configureShareControls({ shareButton, copyButton }) {
  const supportsShare = typeof navigator.share === "function";
  shareButton.hidden = !supportsShare;
  copyButton.hidden = false;
}
```

```html
<nav class="article-actions" aria-label="Article actions">
  <button type="button" class="native-share">Share article</button>
  <button type="button" class="copy-article-link">Copy article link</button>
  <a href="https://example.com/journal/design-systems">Open article</a>
</nav>
```

Keep the ordinary link as a reliable navigation path. Whether to hide or disable unsupported controls depends on the product, but do not display a control that silently does nothing.

**Naive approach:** Show a share icon on every device and let unsupported browsers fail when clicked.

**Correct approach:** Feature-detect, make the fallback discoverable, and test with the capability disabled.

**Gotcha:** A desktop browser can support Web Share in one operating system/version and not another. Test capabilities, not just device categories.

### 9. Use `canShare()` for file payloads

Sharing files has stricter support requirements than sharing a URL. The app must prepare a `File`, check whether the browser can share the proposed payload, and then invoke `share()` from a user gesture.

```js
async function shareReportFile(file) {
  const payload = { files: [file], title: "Project report" };
  if (!navigator.share || !navigator.canShare?.(payload)) {
    throw new Error("File sharing is not supported here");
  }
  return navigator.share(payload);
}
```

```js
async function createAndShareReport() {
  const reportBlob = new Blob(["Project summary\nStatus: ready"], {
    type: "text/plain"
  });
  const reportFile = new File([reportBlob], "project-summary.txt", {
    type: "text/plain"
  });
  try {
    await shareReportFile(reportFile);
  } catch (error) {
    if (error.name !== "AbortError") showDownloadFallback(reportFile);
  }
}
```

A generated file can also be offered for download when file sharing is unavailable. Do not assume that every browser or destination accepts every file type or size.

**Naive approach:** Call `navigator.share({ files: [...] })` without checking support.

**Correct approach:** Use `canShare()` where available and provide a download or link alternative.

**Gotcha:** File support varies by browser, platform, MIME type, and destination. A payload accepted by `canShare()` may still be rejected during the share operation.

### 10. Handle permissions policy and embedding constraints

Clipboard and Web Share capabilities can be restricted by the browser's security model or by embedding policies. A widget inside an iframe may behave differently from the same code at the top level.

```html
<!-- Parent page: allow only capabilities that the embedded app actually needs. -->
<iframe
  src="https://widgets.example.com/share-panel"
  title="Share panel"
  allow="clipboard-write; web-share">
</iframe>
```

```js
function reportShareContext() {
  return {
    framed: window.top !== window.self,
    secure: window.isSecureContext,
    clipboardWrite: Boolean(navigator.clipboard?.writeText),
    share: typeof navigator.share === "function"
  };
}
console.table(reportShareContext());
```

The iframe `allow` attribute is only one part of the policy and browser behavior; the parent response's Permissions Policy and browser implementation may also matter. Grant the minimum capabilities required.

**Naive approach:** Assume an API failure means the JavaScript is wrong.

**Correct approach:** Check the secure context, iframe policy, browser capability, and rejected promise before changing implementation code.

**Gotcha:** Do not broaden Permissions Policy for every origin as a debugging shortcut. Limit access to trusted embedded content.

### 11. Give feedback accessibly and avoid noisy announcements

Copy and share are asynchronous interactions, so users need feedback. Use a persistent status region with `role="status"` for nonurgent updates. Keep focus where the user expects it unless the fallback requires deliberate focus movement.

```html
<div class="action-feedback" role="status" aria-live="polite" aria-atomic="true"></div>
```

```js
function announceAction(message) {
  const status = document.querySelector(".action-feedback");
  if (status) status.textContent = message;
}

async function copyWithFeedback(text) {
  try {
    await navigator.clipboard.writeText(text);
    announceAction("Link copied to clipboard.");
  } catch {
    announceAction("Copy failed. Select the URL and copy it manually.");
  }
}
```

The message should be concise and specific. If a toast is visually temporary, the accessible status region should still communicate the result. Avoid announcing every internal state transition if it makes the experience noisy.

**Naive approach:** Change a button's icon to a checkmark with no accessible label or announcement.

**Correct approach:** Update visible feedback and a screen-reader status region after the operation outcome is known.

**Gotcha:** Repeated rapid clicks can produce confusing status ordering. Consider disabling the copy control while its operation is pending, or use a request token to ignore stale completions.

### 12. Prevent duplicate actions and stale asynchronous UI updates

Users can double-click, tap repeatedly, or activate a control while a previous attempt is still pending. Keep state explicit so a late promise does not overwrite a newer state or create misleading feedback.

```js
function attachCopyAction(button, status, getText) {
  let pending = false;
  button.addEventListener("click", async () => {
    if (pending) return;
    pending = true;
    button.disabled = true;
    status.textContent = "Copying…";
    try {
      await navigator.clipboard.writeText(getText());
      status.textContent = "Copied.";
    } catch {
      status.textContent = "Could not copy. Use the selectable URL instead.";
    } finally {
      pending = false;
      button.disabled = false;
    }
  });
}
```

```js
// For component frameworks, clear or invalidate pending work on unmount.
let generation = 0;
async function copyForCurrentView(text, renderStatus) {
  const current = ++generation;
  try {
    await navigator.clipboard.writeText(text);
    if (current === generation) renderStatus("Copied.");
  } catch {
    if (current === generation) renderStatus("Copy failed.");
  }
}
```

The guard prevents concurrent attempts and the generation token demonstrates how to avoid stale updates in a view that can change while work is pending.

**Naive approach:** Allow unlimited attempts and let any completed promise update the current component.

**Correct approach:** Define a pending state, prevent duplicate actions where appropriate, and invalidate stale work when the UI context changes.

**Gotcha:** Do not disable the only available action indefinitely if a promise never settles. Consider a timeout for UI recovery, but do not assume a timed-out operation definitely failed at the system level.

### 13. Make URLs canonical and avoid leaking query data

The current browser URL is not always the URL that should be shared. It may contain temporary campaign parameters, search state, preview tokens, or private identifiers. Build the share URL from the route's canonical public URL when possible.

```js
function canonicalShareUrl(pathname) {
  const url = new URL(pathname, window.location.origin);
  url.search = "";
  url.hash = "";
  return url.href;
}

const shareUrl = canonicalShareUrl("/work/field-notes?preview=secret");
console.log(shareUrl); // https://current-origin.example/work/field-notes
```

```html
<article class="case-study">
  <h2>Field Notes</h2>
  <p>Research-led product design for a complex workflow.</p>
  <a class="canonical-project-link" href="https://example.com/work/field-notes">View case study</a>
</article>
```

Only remove query and fragment parameters if your application knows they are unnecessary. Some sites encode meaningful filters or content identifiers in the query string; use an explicit allowlist rather than blindly stripping every parameter.

**Naive approach:** Share the full current URL, including a temporary signed token.

**Correct approach:** Share a canonical, public URL and explicitly decide which parameters are safe and useful.

**Gotcha:** A canonical URL should not be fabricated from an untrusted host header on the server. Use configured public-origin values where server-side URL generation is involved.

### 14. Respect privacy and consent in analytics

Clipboard content can include private information. Never read clipboard contents just to support a write-only copy feature, and do not send copied text to analytics. Track only the minimum event data needed to understand whether the feature is used.

```js
function trackCopyAction({ featureName, outcome }) {
  analytics?.track?.("share_action", {
    feature: featureName,
    action: "copy",
    outcome
  });
}
```

```js
async function copyPublicLink(url) {
  try {
    await navigator.clipboard.writeText(url);
    trackCopyAction({ featureName: "case-study", outcome: "success" });
  } catch {
    trackCopyAction({ featureName: "case-study", outcome: "failure" });
    throw new Error("Copy operation failed");
  }
}
```

The example records a coarse outcome without recording the copied value. Make analytics calls resilient so a missing analytics library cannot break the core action.

**Naive approach:** Log the full clipboard payload to debug why sharing failed.

**Correct approach:** Log action type, feature context, and coarse outcome only; never capture sensitive payloads.

**Gotcha:** `analytics?.track?.()` assumes an `analytics` binding exists. In production code, guard the actual integration according to how your analytics module is imported or injected.

### 15. Integrate copy/share into a real portfolio case study

A production-ready case study needs canonical metadata, a clear primary action, a copy fallback, meaningful status feedback, and resilient behavior across supported browsers. The following integration brings together the concepts above without assuming every API is available.

```html
<article class="case-study" data-project-url="https://example.com/work/field-notes">
  <header>
    <h1>Field Notes — Product Design</h1>
    <p>A research-led redesign of a complex workflow.</p>
  </header>
  <nav class="case-study-actions" aria-label="Case study actions">
    <button type="button" class="share-action">Share case study</button>
    <button type="button" class="copy-action">Copy link</button>
  </nav>
  <div class="manual-copy" hidden>
    <label for="case-study-url">Copy this URL manually</label>
    <input id="case-study-url" type="url" readonly value="https://example.com/work/field-notes">
  </div>
  <p class="action-status" role="status" aria-live="polite"></p>
</article>
```

```js
const caseStudy = document.querySelector(".case-study");
const shareAction = caseStudy.querySelector(".share-action");
const copyAction = caseStudy.querySelector(".copy-action");
const manualCopy = caseStudy.querySelector(".manual-copy");
const urlInput = caseStudy.querySelector("#case-study-url");
const status = caseStudy.querySelector(".action-status");
const projectUrl = caseStudy.dataset.projectUrl;
const projectTitle = caseStudy.querySelector("h1").textContent.trim();

if (typeof navigator.share !== "function") shareAction.hidden = true;

shareAction.addEventListener("click", async () => {
  if (!navigator.share) return;
  try {
    await navigator.share({
      title: projectTitle,
      text: `Explore ${projectTitle}`,
      url: projectUrl
    });
    status.textContent = "Share action completed.";
  } catch (error) {
    if (error.name !== "AbortError") status.textContent = "Sharing was unavailable. You can copy the link instead.";
  }
});

copyAction.addEventListener("click", async () => {
  try {
    if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
    await navigator.clipboard.writeText(projectUrl);
    status.textContent = "Case study link copied.";
    manualCopy.hidden = true;
  } catch {
    manualCopy.hidden = false;
    urlInput.focus();
    urlInput.select();
    status.textContent = "Automatic copy failed. Select the URL and use your device's Copy command.";
  }
});
```

This integration uses a stable public URL, real buttons, accessible feedback, capability detection, and manual recovery. In a framework, bind events through the framework and clean up listeners according to its lifecycle; do not combine imperative DOM code with framework-owned state without a clear boundary.

**Naive approach:** Implement one `share()` call and assume it covers copy, unsupported browsers, cancellation, accessibility, and privacy.

**Correct approach:** Treat copy and share as separate actions with independent failure paths, then test the complete interaction in the deployed environment.

**Gotcha:** The example assumes the project URL is already canonical and trusted. A production CMS should validate that value when content is authored, not rely only on client-side checks.

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Copy with accessible feedback

**What it does:** Copies a known public value and announces the real outcome.

**When to use it:** A case-study card, invitation page, referral flow, or account screen offers a “Copy link” action.

```js
async function copyWithStatus(text, statusElement) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
    await navigator.clipboard.writeText(text);
    statusElement.textContent = "Copied to clipboard.";
    return true;
  } catch {
    statusElement.textContent = "Copy failed. Select the URL and copy it manually.";
    return false;
  }
}
```

Keep a selectable fallback URL in the interface; a live status message alone does not give users a way to recover. Never show success before the promise resolves.

### Pattern 2: Progressive enhancement for share sheets

**What it does:** Offers native sharing when supported and always leaves a copy path available.

**When to use it:** A mobile-first article, portfolio project, product detail, or event page has a “Share” action.

```js
function setShareAvailability(shareButton, copyButton) {
  shareButton.hidden = typeof navigator.share !== "function";
  copyButton.hidden = false;
}
```

Do not use user-agent sniffing to decide whether to render the button. Capability support can vary across browser versions and embedded web views.

### Pattern 3: Safe canonical share URL

**What it does:** Builds the share payload from a public route rather than a potentially sensitive current URL.

**When to use it:** The page can contain preview parameters, tracking query strings, or temporary authentication data.

```js
function publicShareUrl(path) {
  const url = new URL(path, window.location.origin);
  url.searchParams.delete("preview");
  url.searchParams.delete("access_token");
  return url.href;
}
```

An allowlist of known public parameters is safer than maintaining an ever-growing denylist. Do not strip parameters that identify the actual content.

### Pattern 4: Share files with a download fallback

**What it does:** Shares a generated file when supported and falls back to a normal download when sharing is not available.

**When to use it:** A report builder produces a PDF, text export, or image summary that users may send to another app.

```js
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function shareOrDownloadFile(file) {
  const payload = { files: [file], title: file.name };
  if (navigator.share && navigator.canShare?.(payload)) {
    return navigator.share(payload);
  }
  downloadBlob(file, file.name);
}
```

This fallback assumes a browser that supports object URLs and the `download` attribute. For sensitive reports, confirm the user intentionally requested the export and avoid retaining unnecessary copies.

### Pattern 5: Treat user cancellation as a normal state

**What it does:** Avoids displaying an alarming error when the user dismisses the system share sheet.

**When to use it:** The native share UI can be dismissed without choosing a destination.

```js
async function tryNativeShare(payload, status) {
  try {
    await navigator.share(payload);
    status.textContent = "Share action completed.";
  } catch (error) {
    if (error.name === "AbortError") return;
    status.textContent = "Sharing failed. You can copy the link instead.";
  }
}
```

Do not interpret completion as proof of message delivery or recipient engagement. Keep analytics language aligned with the API's actual guarantee.

### Pattern 6: Prevent duplicate copy operations

**What it does:** Blocks accidental repeat attempts and keeps the button's pending state consistent.

**When to use it:** A slow browser permission prompt or embedded environment makes repeated taps likely.

```js
function bindCopyButton(button, status, value) {
  let busy = false;
  button.addEventListener("click", async () => {
    if (busy) return;
    busy = true;
    button.disabled = true;
    try {
      await navigator.clipboard.writeText(value);
      status.textContent = "Copied.";
    } catch {
      status.textContent = "Could not copy automatically.";
    } finally {
      busy = false;
      button.disabled = false;
    }
  });
}
```

Do not disable the only copy route without providing an alternative. In a component framework, use framework state and lifecycle cleanup instead of unmanaged global listeners.

### Pattern 7: Capability diagnostics for embedded experiences

**What it does:** Captures the context needed to diagnose why an API is unavailable without logging private content.

**When to use it:** A share widget works on the main site but fails in an iframe or in-app browser.

```js
function getShareDiagnostics() {
  return {
    secureContext: window.isSecureContext,
    framed: window.top !== window.self,
    clipboardWriteAvailable: Boolean(navigator.clipboard?.writeText),
    webShareAvailable: typeof navigator.share === "function",
    canShareAvailable: typeof navigator.canShare === "function"
  };
}
```

Use this as a local development diagnostic or log only a minimal, privacy-reviewed subset. Avoid collecting the current URL or clipboard contents merely to troubleshoot API availability.

## Common Mistakes

| Mistake | Why it fails | Better approach |
|---|---|---|
| Checking only `navigator.clipboard` | The write operation can still reject | Check `writeText` and catch rejection |
| Testing only on localhost | Secure-context behavior differs from public HTTP deployments | Test on the deployed HTTPS origin |
| Showing “Copied!” before awaiting | Users receive false confirmation on failure | Announce success only after resolution |
| Treating `share()` as message delivery | The API does not confirm recipient delivery or reading | Record only the outcome the browser exposes |
| Treating `AbortError` as a critical failure | Dismissing the share sheet is normal user behavior | Handle cancellation quietly |
| Using user-agent sniffing | Capabilities vary by version and embedded context | Feature-detect the required API |
| Relying only on `execCommand("copy")` | It is deprecated and inconsistent | Use Clipboard API plus manual selection fallback |
| Sharing `location.href` blindly | URL may contain tokens or private query values | Use a canonical public URL |
| Logging the copied value | May leak private information to analytics or logs | Track only feature and outcome metadata |
| Providing icon-only feedback | Status may be invisible to assistive technology | Use a visible label and polite status region |
| Assuming file share works everywhere | File types and platform support differ | Check `canShare()` and offer download |
| Calling the API after unrelated awaits | User activation may no longer be valid | Invoke directly from the click handler |
| Showing a dead share button | Unsupported browsers have no working action | Hide/disable it accessibly and preserve copy |
| Assuming iframe behavior matches top-level pages | Policies can restrict access | Check secure context and embedding policy |
| Failing to test cancellation | UI can report false errors after dismissal | Test cancel, deny, unsupported, and success paths |

## Mental Models

### Capability, not identity

Ask “Can this environment perform this action?” rather than “Is this an iPhone?” or “Is this Chrome?” Browser families, versions, web views, and policies differ. Feature detection should decide which enhancement is available; rejection handling should decide what happened during the attempt.

### A user gesture is a short-lived authorization

Clipboard writes and share sheets are sensitive capabilities. Treat a deliberate click as the start of the operation and avoid inserting unrelated asynchronous work before the API call. Prepare data early, then use the gesture to perform the action.

### Success is an observed outcome

A click is an intent. A resolved clipboard promise is evidence that the browser completed the write operation. A resolved share promise is not evidence that a person received or read a message. Keep UI messages, analytics events, and product claims aligned with the strongest fact actually known.

### Fallbacks are part of the design, not emergency code

A selectable URL, download link, or normal page link is a real product path. It should be styled, keyboard accessible, and understandable. A fallback that is hidden behind an unhelpful error message is not a useful fallback.

### Share payloads are disclosures

Every title, text string, URL, and file in a share payload may leave the current application. Build payloads from public content, remove temporary secrets intentionally, and never read or log clipboard contents without a clearly justified product need and appropriate consent.

### APIs are asynchronous state machines

Represent the interaction as idle → pending → succeeded, cancelled, or failed. Do not infer state from the click itself. Guard repeated activations where necessary and ensure stale asynchronous completions cannot overwrite a newer UI state.

## Quick Reference

| Need | API or technique | Production note |
|---|---|---|
| Copy text | `navigator.clipboard.writeText(text)` | Await it and catch rejection |
| Check clipboard write support | `Boolean(navigator.clipboard?.writeText)` | Not a guarantee of permission |
| Open native share sheet | `navigator.share(payload)` | Invoke from a user gesture |
| Check basic share support | `typeof navigator.share === "function"` | Capability varies by platform |
| Check file payload support | `navigator.canShare?.({ files })` | Provide download fallback |
| Diagnose secure context | `window.isSecureContext` | Public production should use HTTPS |
| Manual copy fallback | Readonly input plus selection | User still performs platform copy command |
| Accessible result | `role="status" aria-live="polite"` | Announce the real outcome |
| Detect cancellation | `error.name === "AbortError"` | Usually a quiet no-op |
| Avoid secret URL sharing | Canonical URL builder | Keep only approved public parameters |
| Embedded feature troubleshooting | `window.top !== window.self` and capability checks | Review iframe and Permissions Policy |
| File fallback | Download via object URL | Revoke object URL after use |

## Build Challenge

### Build: Portfolio Share Kit

Build a reusable copy-and-share component for a portfolio case study. It must work in modern browsers with the APIs available, remain useful where those APIs are unavailable, and provide truthful feedback for success, cancellation, and failure.

#### Functional requirements

1. Use semantic markup with real `<button>` elements for copy and share actions.
2. Give the case study a canonical public URL independent of preview tokens.
3. Render a copy action even when Web Share is unavailable.
4. Feature-detect `navigator.clipboard.writeText` before attempting a write.
5. Await the write promise before announcing success.
6. Catch rejected clipboard writes.
7. Reveal a readonly, selectable URL when automatic copy fails.
8. Tell the user to use their device's Copy command in the manual fallback.
9. Use a persistent `role="status"` region with polite announcements.
10. Feature-detect `navigator.share` independently of clipboard support.
11. Invoke `navigator.share()` directly from a user action.
12. Share only the canonical public URL, title, and a short useful description.
13. Handle `AbortError` as normal cancellation.
14. Show a fallback message for other share errors.
15. Do not claim that a share was delivered to a recipient.
16. Avoid including session IDs, tokens, or private data in the payload.
17. Disable repeated copy attempts while one is pending.
18. Restore the button state in a `finally` block.
19. Ensure focus remains predictable after the action.
20. Make all controls usable by keyboard.
21. Give icon-only controls accessible names if icons are used.
22. Maintain adequate contrast for success and error feedback.
23. Test the feature on a deployed HTTPS origin.
24. Test in a browser without Web Share support.
25. Test a clipboard API rejection.
26. Test user cancellation of the native share sheet.
27. Test a share API failure unrelated to cancellation.
28. Test the component inside an iframe if embedding is supported.
29. Ensure analytics never records the copied text or share payload.
30. Document the supported browsers and fallback behavior.

#### Suggested file structure

```text
portfolio-share-kit/
├── index.html
├── styles.css
├── share.js
└── README.md
```

#### Acceptance test matrix

| Scenario | Expected result |
|---|---|
| Clipboard write resolves | Status announces that the link was copied |
| Clipboard API is missing | Manual URL fallback is available |
| Clipboard write rejects | No false success; fallback is revealed |
| Web Share is unsupported | Share control is hidden or otherwise explained; copy still works |
| User dismisses share sheet | No alarming error message |
| Share fails for another reason | A concise error and copy alternative are available |
| URL contains a preview token | Shared payload uses the canonical public URL |
| User double-clicks Copy | Only one operation runs at a time |
| Keyboard-only navigation | Both actions and fallback remain operable |
| Screen reader announces status | Outcome is understandable without visual feedback |
| Analytics is unavailable | Copy and share actions still work |
| Page is embedded with restricted policy | Failure is handled and diagnostics identify the context |

#### Definition of Done

- [ ] All 30 functional requirements are satisfied or explicitly documented as out of scope.
- [ ] All acceptance scenarios have been tested on target browsers and devices.
- [ ] Clipboard success is never announced before the operation resolves.
- [ ] Share cancellation is not reported as delivery failure.
- [ ] A manual copy fallback remains available after unsupported or rejected clipboard operations.
- [ ] The shared URL contains no unintended secrets or private query parameters.
- [ ] Keyboard and screen-reader interaction has been checked.
- [ ] Errors are handled without leaking payload content to logs.
- [ ] README documents secure-context requirements, support limitations, and fallbacks.

#### Debugging sequence

1. Reproduce the failure in the actual target browser and origin.
2. Check `window.isSecureContext` and whether the page is embedded.
3. Inspect whether the relevant method exists, not merely whether the parent object exists.
4. Capture the error name and coarse context without recording private payloads.
5. Check whether asynchronous work occurred before the sensitive API call.
6. Confirm the status message follows the promise outcome rather than the click event.
7. Test the fallback independently of the modern API.
8. Repeat the test using keyboard activation and assistive technology.

#### Production checklist

- [ ] HTTPS is configured on the deployed site.
- [ ] Share URLs are canonical and intentionally public.
- [ ] Clipboard and share capabilities are detected independently.
- [ ] API calls are triggered by deliberate user actions.
- [ ] Every asynchronous operation has rejection handling.
- [ ] Cancellation is treated as a valid user choice.
- [ ] The interface does not promise delivery or reading of shared content.
- [ ] Fallback controls are visible, selectable, and accessible.
- [ ] Iframe and Permissions Policy constraints are documented where relevant.
- [ ] Analytics records only minimal action metadata.
- [ ] Tests include unsupported browsers and failed permissions.
- [ ] No clipboard content is read or logged unnecessarily.
