---

# SKILL: pwa-manifest-install
**Layer:** 18 — PWA & Web APIs  
**Goal:** Configure a trustworthy web app manifest and install experience so a website can be recognized, installed, launched, and presented as a coherent app across supported browsers and devices.

---

## Why This Matters (Senior Perspective)

A manifest is small, but it sits at the boundary between a website's identity and the operating system's app experience. If the manifest is missing, malformed, scoped incorrectly, or points at icons that do not exist, a carefully designed site can still install with the wrong name, a blank icon, an unexpected launch route, or browser chrome that undermines the intended experience. These defects are especially visible on a portfolio or client site because the install surface is effectively another brand touchpoint: the home-screen icon, splash treatment, app name, and standalone window all communicate polish before the visitor sees the page itself.

Senior developers treat installation as a progressive enhancement, not a guaranteed browser feature. Chromium-based browsers, Safari on iOS, desktop browsers, and embedded webviews have different install prompts and manifest support. A custom “Install app” button cannot force a browser to install anything; it can only surface a browser-provided prompt when that prompt is available. The correct experience explains the benefit, waits for the user's intent, handles acceptance and dismissal, and leaves the website fully usable if installation is unavailable. Never make installation a gate for core content.

The real-world consequence of getting this wrong is wasted user trust and support time: users tap an install button that does nothing, see duplicate home-screen icons, open a deep link outside the intended app window, or install an app whose identity changes unexpectedly. For a creative studio, agency, ecommerce brand, or interactive portfolio, the manifest should be a deliberate part of launch QA alongside responsive design, accessibility, metadata, and performance. It is configuration with product consequences, not decorative JSON.

---

## Core Concepts

### 1. The manifest describes app identity; it does not implement app behavior

A web app manifest is a JSON resource linked from an HTML document. It provides metadata such as the app's name, icons, preferred launch URL, display mode, theme color, and scope. It does not cache assets, make the app work offline, register a service worker, or guarantee an install prompt. Those are separate capabilities with their own requirements and failure modes.

Keep the manifest as a static, version-controlled file served with a JSON-compatible MIME type. Use descriptive, brand-specific values rather than leaving a starter template's “My App” label in production. A manifest can be shared by multiple pages, but its scope and start URL should match the site's intended app boundary.

```html
<!-- The link makes the manifest discoverable from the page document. -->
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#10111b">
```

```json
{
  "id": "/",
  "name": "Northstar Studio — Interactive Portfolio",
  "short_name": "Northstar",
  "description": "Selected work, experiments, and notes from Northstar Studio.",
  "start_url": "/?source=installed-app",
  "scope": "/",
  "display": "standalone",
  "background_color": "#10111b",
  "theme_color": "#10111b"
}
```

**Gotcha:** `theme_color` in the manifest and the HTML `theme-color` meta tag overlap but are not a universal substitute for each other. Browser UI support varies. Include the HTML meta tag when the browser should use a theme color before or without reading the manifest.

### 2. `name`, `short_name`, and `id` solve different problems

`name` is the full human-readable app name. `short_name` is a compact label used where space is limited, such as some launchers. `id` is a stable identifier for the installed web app when supported. Do not casually change `id` after users have installed the app: changing identity can make an app appear as a different install in some environments. If the app has a stable root identity, explicitly define it and keep it stable across releases.

A common mistake is to use a generic name or make `short_name` so long that it gets clipped. Test actual launcher behavior; desktop and mobile systems truncate labels differently. Avoid stuffing keywords into the name. The installed name is a user-facing label, not a place to repeat SEO metadata.

```json
{
  "id": "/portfolio/",
  "name": "Varad Pendkar — Creative Engineering Portfolio",
  "short_name": "Varad Portfolio",
  "description": "Creative web experiments and engineering case studies.",
  "start_url": "/portfolio/?source=pwa",
  "scope": "/portfolio/"
}
```

Use this subpath configuration only when the app truly lives under `/portfolio/`. If the app is deployed at the domain root, use root-relative paths consistently. **Wrong:** defining a scope that excludes the intended `start_url`, such as `scope: "/app/"` with `start_url: "/"`. **Right:** ensure the launch URL is within the declared scope and verify navigation behavior in the installed app.

### 3. `start_url` should be intentional and resilient

`start_url` is the URL used when the installed app launches from its app icon. It should land users on a useful, stable entry point and must be within the app's scope. Query parameters can be used for analytics attribution, but avoid putting secrets, user identifiers, or fragile campaign state into a persistent launch URL. An installed app may launch long after the install event, when a temporary campaign route is stale.

Prefer a route that can render without depending on a previous navigation state. If your site is a portfolio, the home page may be correct. If it is a task application, a dashboard route may be appropriate only if unauthenticated users have a clear sign-in path. A `start_url` is not a redirect mechanism and does not ensure that the page loads offline.

```json
{
  "start_url": "/?utm_source=installed-app",
  "scope": "/",
  "display": "standalone"
}
```

```js
// Keep analytics attribution harmless; never treat a query string as identity.
const launchUrl = new URL(window.location.href);
const launchSource = launchUrl.searchParams.get("utm_source");
if (launchSource === "installed-app") {
  // Record a coarse installation launch event only if analytics consent allows it.
  console.info("Opened from the installed-app entry point");
}
```

**Gotcha:** a launch query parameter can be retained in browser history or analytics systems. Do not include personally identifying or authentication data in it.

### 4. `scope` defines the app-like navigation boundary

`scope` identifies which URLs are considered inside the installed app experience. Navigation outside the scope may open in a browser, or be handled differently depending on the platform. It should generally be a URL path prefix, not a loose approximation of the intended content area. Keep it broad enough to include the app's routes and narrow enough not to accidentally claim unrelated site sections.

```json
{
  "start_url": "/studio/",
  "scope": "/studio/",
  "display": "standalone"
}
```

For a site deployed beneath a subpath, account for that deployment base. A site hosted at `https://example.com/client-a/` cannot assume `/` means `/client-a/`; root-relative URLs point to the origin root. Configure the build tool's base path and verify the final deployed manifest rather than only testing a local development server.

**Wrong:** `scope: "/studio"` when the intended route boundary and path normalization are unclear. **Right:** use a trailing slash for a directory-like scope where that matches the deployment, and test representative in-scope and out-of-scope routes. The browser's URL matching rules matter more than what the URL looks like to a human.

### 5. Display modes are a preference, not a universal guarantee

The `display` field asks the browser for a presentation mode. Common values include `standalone`, `minimal-ui`, `browser`, and `fullscreen`; actual support and fallback behavior vary. `standalone` usually removes the normal browser address bar while retaining platform-level controls. `fullscreen` is more aggressive and should not be used merely to make a portfolio feel immersive: it can remove familiar navigation affordances and create accessibility problems.

Use `standalone` as a sensible starting point for an app-like experience. Choose `browser` when a normal browser context is intentional. Some browsers may fall back to another supported mode. `display_override` can express a preference list where supported, but the basic `display` field should still provide a usable fallback.

```json
{
  "display": "standalone",
  "display_override": ["standalone", "minimal-ui", "browser"]
}
```

Do not assume that a specific mode will render identically on Android, iOS, Windows, macOS, and Linux. Validate the actual installed experience on the platforms your audience uses.

### 6. Icons need real files, correct sizes, and purpose metadata

The `icons` array should reference real, deployable image assets. Declare accurate dimensions and MIME types. Common raster sizes include 192×192 and 512×512 pixels for Chromium-oriented install surfaces, but requirements and use vary by platform. Use a square composition with enough safe padding that the mark remains legible when the operating system applies a mask or rounds the corners.

`purpose: "any"` is the ordinary icon purpose. `purpose: "maskable"` tells supporting platforms that the icon artwork is designed to tolerate masking; provide a maskable-specific asset with a safe zone instead of reusing a tightly cropped logo. A combined purpose such as `"any maskable"` is valid when the same image genuinely works for both, but separate files often produce better results.

```json
{
  "icons": [
    {
      "src": "/icons/app-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/app-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/app-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

**Gotcha:** A manifest can parse successfully while its icon URLs return 404s. Open each icon URL directly and inspect network requests in DevTools. Do not declare a size that does not match the file's real dimensions. Use the smallest set that covers the target platforms, not a large pile of redundant images.

### 7. `background_color` and `theme_color` are different hints

`background_color` describes a background color that can be used while an app launches or before its stylesheet is available. `theme_color` describes a preferred UI theme color for browser/platform surfaces where supported. These values should align with the app's visual identity, but they do not replace CSS backgrounds or guarantee a particular splash screen design.

```json
{
  "background_color": "#0b0c12",
  "theme_color": "#5b7cfa"
}
```

If the page begins with a near-black canvas but the launch background is white, users may see a flash or visual mismatch on supported surfaces. Set the launch background to the actual initial page background, and set theme color to the browser chrome color you want. Test light and dark themes separately if the app supports them; a single static manifest value cannot describe every dynamic theme state.

### 8. Link the manifest from the correct document and path

The manifest link belongs in the document's `<head>`. The URL must resolve from the deployed page, not merely from the source folder. A relative URL such as `manifest.webmanifest` resolves relative to the current document URL, which may be surprising on nested routes. A root-relative path such as `/manifest.webmanifest` is clear for root deployments but may break under a subpath deployment.

```html
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#10111b">
  <link rel="manifest" href="/manifest.webmanifest">
  <title>Northstar Studio</title>
</head>
```

For a project deployed under a base path, use the framework's public URL or base-path convention. Inspect the built HTML and the final manifest URL. Do not blindly hard-code `/` when the app can be deployed to a subdirectory, such as a project site or client preview environment.

### 9. Manifest JSON must be valid and served correctly

JSON does not allow comments, trailing commas, or unquoted property names. A manifest file may use `.webmanifest` or another supported JSON resource path, but the server should return a valid JSON MIME type, typically `application/manifest+json` for `.webmanifest`. Browsers can be forgiving in some circumstances, but production should not rely on recovery behavior.

```json
{
  "name": "Northstar Studio",
  "short_name": "Northstar",
  "start_url": "/",
  "display": "standalone"
}
```

**Wrong:** adding JavaScript-style comments inside the manifest or leaving a trailing comma after the last property. **Right:** validate JSON in the build/test pipeline and check the response headers in the deployed environment. If the manifest is generated by a framework, inspect the generated output too; source configuration does not guarantee correct built output.

### 10. Install prompts are browser-owned and conditional

On supporting Chromium browsers, the `beforeinstallprompt` event may be fired when installability and engagement conditions are met. The event is not a universal web standard supported by every browser, and a page cannot force it to occur. When the event is received, save it so a user-triggered button can call its `prompt()` method. Show the custom button only while a valid deferred prompt is available.

```js
let deferredInstallPrompt = null;
const installButton = document.querySelector("#install-app");
const installStatus = document.querySelector("#install-status");

if (installButton) {
  installButton.hidden = true;
  installButton.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;

    // Calling the browser-owned prompt from a deliberate click respects user intent.
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    installStatus.textContent =
      choice.outcome === "accepted" ? "Install accepted." : "Install dismissed.";
    deferredInstallPrompt = null;
    installButton.hidden = true;
  });
}

window.addEventListener("beforeinstallprompt", (event) => {
  // Prevent an automatic mini-infobar where supported so the app can offer its own UI.
  event.preventDefault();
  deferredInstallPrompt = event;
  if (installButton) installButton.hidden = false;
});
```

The `beforeinstallprompt` event and its `prompt()` method are browser-specific and not supported in Safari on iOS. Never make a button that promises installation if no event has arrived. Provide a useful fallback such as concise manual instructions for the current platform, or hide the install CTA entirely when the experience cannot be meaningfully explained.

### 11. Handle successful installation and duplicate prompts

The `appinstalled` event is supported in some browsers and can be used to update UI after installation. It is not universal, so the application should not depend on it for core state. A deferred prompt should be treated as a one-time capability: once used, clear the reference and hide the button until a new valid event arrives.

```js
window.addEventListener("appinstalled", () => {
  // Keep the UI honest without making this event a prerequisite for app behavior.
  const installButton = document.querySelector("#install-app");
  const installStatus = document.querySelector("#install-status");
  if (installButton) installButton.hidden = true;
  if (installStatus) installStatus.textContent = "App installed.";
});
```

Do not repeatedly show a prompt immediately after the user dismisses it. Respect dismissal and browser heuristics; an install prompt is a user choice, not a conversion trick. Avoid building your own persistent “installed” boolean in local storage as the sole source of truth because users can uninstall the app, clear storage, use another browser, or install it through a different surface.

### 12. iOS installation requires a distinct, honest fallback

Safari on iOS does not expose the Chromium `beforeinstallprompt` flow. On supported iOS versions, users typically add a website to the Home Screen through Safari's Share menu. The UI should not pretend a custom button can invoke that native action. Instead, detect a reasonable platform hint only to tailor help text, then explain the manual path without blocking the page.

```js
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const installHelp = document.querySelector("#install-help");

if (isIOS && installHelp) {
  // This is guidance, not a reliable installation detector.
  installHelp.textContent = "To install, open Safari's Share menu and choose Add to Home Screen.";
  installHelp.hidden = false;
}
```

User-agent detection is imperfect, and iPadOS can present desktop-like user-agent strings. Treat this as a best-effort guidance branch, not a security decision or universal platform detector. You may instead offer generic help text for all unsupported browsers to avoid false positives.

### 13. The manifest does not replace iOS home-screen metadata

For some Apple-specific home-screen behavior, additional HTML metadata and icon links may still be relevant. The exact requirements depend on the targeted Safari/iOS versions and the desired appearance. Keep these tags intentional and test them on physical devices; do not assume every manifest field is honored identically on all platforms.

```html
<head>
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-title" content="Northstar">
  <meta name="theme-color" content="#10111b">
</head>
```

Only add Apple-specific tags when they match the product's supported behavior. Validate the icon dimensions, transparency, and crop on an actual iPhone or iPad. A browser can ignore metadata it does not recognize, so avoid assuming that one tag guarantees a particular launch experience.

### 14. Installability is not the same as offline capability

A valid manifest helps describe an app, but a manifest alone does not make a site installable in every browser or make it work offline. Browser install criteria vary and can change. In many Chromium install flows, HTTPS (or a trusted localhost development context), a valid manifest, suitable icons, and other quality signals matter; service-worker expectations have evolved over time. Verify current browser tooling and target-browser requirements rather than memorizing one timeless checklist.

If the product promises offline use, implement and test a service worker and cache strategy separately. If the product does not support offline use, do not imply that installing it means it works without a connection. A portfolio may only need its shell and selected assets cached; a data-driven dashboard may require explicit conflict, freshness, and authentication decisions.

### 15. Deployment path and HTTPS are production requirements to verify

Service workers and many PWA capabilities require a secure context. Localhost is treated as trustworthy for development, but a deployed site generally needs HTTPS. **Gotcha:** A manifest may load over a working local server while failing on a misconfigured production domain or preview deployment. Redirects, CDN rewrites, MIME types, content-security policies, and asset base paths can all affect the final experience.

```bash
# Check the deployed manifest response rather than relying on local source files.
curl -I https://portfolio.example/manifest.webmanifest
curl -sS https://portfolio.example/manifest.webmanifest | python -m json.tool
```

Use the actual deployed URL in QA. Verify that the response is successful, the body parses as JSON, and every icon URL resolves. Do not use an HTTP-only public deployment for production PWA capabilities. When a CDN is involved, confirm it serves the current manifest after deployment and does not cache a stale version indefinitely.

### 16. Accessibility applies to install controls and guidance

An install CTA is an ordinary interactive control and must be keyboard accessible, clearly named, visible in the correct state, and understandable to assistive technology. Do not use a clickable `<div>` when a `<button>` is the correct semantic element. Do not hide the only explanation in a tooltip. Announce meaningful result messages politely, and avoid shifting focus unexpectedly when the install prompt is dismissed.

```html
<button id="install-app" type="button" hidden>
  Install Northstar Studio
</button>
<p id="install-status" role="status" aria-live="polite"></p>
<p id="install-help" hidden>
  Installation instructions are available in your browser's menu.
</p>
```

A native browser prompt may take focus or open browser UI; your app should remain stable when focus returns. Ensure hidden buttons are genuinely unavailable until the event is present. Use visible focus styles and maintain sufficient contrast. If you use motion to draw attention to the install CTA, respect reduced-motion preferences and do not animate it continuously.

### 17. Install experience should not degrade the website

The installed experience is a layer on top of a regular website. Users who do not install, cannot install, or do not want to install must still be able to access all core content. Do not block the hero, hide navigation, or show a full-screen nag solely because installation has not happened. A small contextual CTA after the visitor understands the product is usually more respectful than an immediate modal.

For a creative portfolio, consider a subtle “Install portfolio” option in the menu or footer, and explain the benefit: quick access to selected work or a more focused viewing window. Do not claim push notifications, offline access, or native-app speed unless those capabilities are actually implemented and tested.

### 18. Cache and versioning can make manifest changes appear not to work

Browsers and CDNs can cache the manifest, icons, and generated HTML independently. **Gotcha:** If the app name or icon does not update after a release, inspect the actual network response and cache headers before changing random settings. Use stable asset paths when practical, and use content-hashed filenames or versioned assets when your build pipeline supports them. Avoid long-lived immutable caching on a manifest URL whose content changes without its URL changing.

A useful strategy is to keep `/manifest.webmanifest` stable but give icon assets versioned filenames, while configuring the manifest with appropriate revalidation. If a service worker controls the page, its caches may be another independent source of stale assets. Updating the manifest does not automatically clear all app caches or force the user to reinstall.

### 19. Use feature detection, not assumptions about browser names

Do not infer support solely from a browser name or a user-agent string. Feature detection tells you whether the relevant event or API is available at runtime. Platform detection may still be useful for help instructions, but should remain a fallback presentation decision rather than a capability guarantee.

```js
const supportsDeferredInstall = "onbeforeinstallprompt" in window;
const installButton = document.querySelector("#install-app");

if (!supportsDeferredInstall && installButton) {
  // Do not display a dead action when this browser has no deferred prompt API.
  installButton.hidden = true;
}
```

The presence check is not proof that the browser will fire the event; the event may depend on install criteria and engagement. Therefore, the safest rule is to reveal the action only after the event actually arrives. If you offer manual instructions, make those instructions the fallback action rather than a fake native install button.

### 20. Debug the installed app as a distinct runtime surface

A page opened in a normal browser tab may behave differently when launched from a home-screen icon: it can use a different display mode, storage context, navigation handling, or cached response. Test the actual installed application, not only the URL in DevTools. Include first launch, subsequent launch, offline launch if promised, deep-link navigation, and update behavior in your QA plan.

```js
// Useful for diagnostics; not every browser exposes every display-mode query.
const displayModes = ["standalone", "minimal-ui", "fullscreen", "browser"];
const activeDisplayMode = displayModes.find((mode) =>
  window.matchMedia(`(display-mode: ${mode})`).matches
) || "unknown";

console.info("Current display mode:", activeDisplayMode);
```

Use DevTools' Application panel (or its browser equivalent) to inspect the manifest, icons, service worker, and storage. A manifest parser warning is different from an icon 404, a scope mismatch, or an unavailable install event. Diagnose each category independently.

---

## Manifest and Install Patterns

### Pattern 1 — Production-ready baseline manifest

**What it does:** Declares stable identity, a launch route, scope, display preference, colors, and icons without overfitting to a single browser.  
**When to use it:** A client website or portfolio that has a real reason to support installation and a stable deployment URL.

Create `public/manifest.webmanifest` (or the equivalent public asset path in your framework):

```json
{
  "id": "/",
  "name": "Northstar Studio — Creative Engineering",
  "short_name": "Northstar",
  "description": "Interactive case studies and experiments from Northstar Studio.",
  "start_url": "/?utm_source=installed-app",
  "scope": "/",
  "display": "standalone",
  "display_override": ["standalone", "minimal-ui", "browser"],
  "background_color": "#10111b",
  "theme_color": "#10111b",
  "icons": [
    { "src": "/icons/northstar-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/northstar-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icons/northstar-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

**Why this works:** It gives the app a stable identity and fallback presentation preference, while keeping the URL boundary explicit. The analytics query is non-sensitive and should only be recorded under the site's consent rules. For a subpath deployment, change every root-relative route and icon URL to match the actual base path.

### Pattern 2 — Accessible install CTA that only appears when usable

**What it does:** Stores the browser's deferred install event, displays a real button only when that capability is offered, and handles user choice.  
**When to use it:** A supported browser experience where a contextual install action improves repeat visits.

HTML:

```html
<button id="install-app" type="button" hidden>Install Northstar Studio</button>
<p id="install-status" role="status" aria-live="polite"></p>
```

JavaScript:

```js
let pendingInstallPrompt = null;
const installAppButton = document.querySelector("#install-app");
const installStatusMessage = document.querySelector("#install-status");

window.addEventListener("beforeinstallprompt", (event) => {
  // Suppress the browser's automatic prompt only where this event is supported.
  event.preventDefault();
  pendingInstallPrompt = event;
  installAppButton.hidden = false;
});

installAppButton.addEventListener("click", async () => {
  if (!pendingInstallPrompt) return;

  try {
    pendingInstallPrompt.prompt();
    const installChoice = await pendingInstallPrompt.userChoice;
    installStatusMessage.textContent = installChoice.outcome === "accepted"
      ? "Installation accepted."
      : "Installation was not completed.";
  } catch (error) {
    // Browser prompt APIs can fail or be unavailable; keep the page usable.
    console.error("Unable to open the install prompt:", error);
    installStatusMessage.textContent = "Use your browser menu to install this site, if supported.";
  } finally {
    // The deferred event is consumed after a prompt attempt and should not be reused.
    pendingInstallPrompt = null;
    installAppButton.hidden = true;
  }
});

window.addEventListener("appinstalled", () => {
  installAppButton.hidden = true;
  installStatusMessage.textContent = "Northstar Studio is installed.";
});
```

**Why this works:** The CTA does not advertise an action until the browser gives the page a prompt capability. It is triggered by a deliberate user action and includes a failure path. In a production app, guard against missing elements if this script is shared across pages and make sure error reporting does not expose sensitive information.

### Pattern 3 — Platform-neutral fallback guidance

**What it does:** Gives users a useful explanation when no deferred install prompt exists, without pretending the page can call a platform-native install sheet.  
**When to use it:** A site serving iOS Safari, desktop browsers, and Chromium browsers from the same codebase.

```html
<section aria-labelledby="install-help-title">
  <h2 id="install-help-title">Keep Northstar close</h2>
  <p id="install-help-copy">Use your browser's menu to add this site to your device, if supported.</p>
</section>
```

```js
const installHelpCopy = document.querySelector("#install-help-copy");
const hasDeferredPromptApi = "onbeforeinstallprompt" in window;
const isIOSDevice = /iphone|ipad|ipod/i.test(navigator.userAgent);

if (installHelpCopy && isIOSDevice) {
  // This hint is instructional only; iPadOS and browser shells can vary.
  installHelpCopy.textContent =
    "In Safari, open Share and choose Add to Home Screen to create a home-screen shortcut.";
} else if (installHelpCopy && !hasDeferredPromptApi) {
  installHelpCopy.textContent =
    "If your browser supports installation, look for Add to Home Screen or Install in its menu.";
}
```

**Why this works:** It separates browser-owned actions from app-owned UI. User-agent matching is only a convenience, so the generic instructions remain useful when detection is wrong. Keep the instructions short, accurate, and updated as target platforms change.

### Pattern 4 — Base-path-safe manifest generation

**What it does:** Prevents the common failure where a project works at the origin root but breaks when deployed beneath a repository or client subdirectory.  
**When to use it:** Static hosting, project previews, or any deployment where the app base path is not guaranteed to be `/`.

For a simple root deployment, root-relative paths are clear. For a base-path deployment, use the build system's public base URL and generate or configure the manifest accordingly. Example configuration for a build step that writes a manifest from a known base path:

```js
// Keep one canonical deployment base so HTML, icons, and manifest paths agree.
const deploymentBase = process.env.PUBLIC_BASE_PATH || "/";
const normalizedBase = deploymentBase.endsWith("/")
  ? deploymentBase
  : `${deploymentBase}/`;

const appManifest = {
  id: normalizedBase,
  name: "Northstar Studio",
  short_name: "Northstar",
  start_url: `${normalizedBase}?utm_source=installed-app`,
  scope: normalizedBase,
  display: "standalone",
  background_color: "#10111b",
  theme_color: "#10111b",
  icons: [
    {
      src: `${normalizedBase}icons/northstar-192.png`,
      sizes: "192x192",
      type: "image/png",
      purpose: "any"
    }
  ]
};

// The build pipeline should serialize this object to valid JSON and test the output.
console.log(JSON.stringify(appManifest, null, 2));
```

**Why this works:** It makes the deployment base an explicit input and keeps scope, launch URL, and icons aligned. Integrate this pattern into the build system rather than generating the manifest dynamically on every request without a clear need. Verify how the host maps the configured base path to real files.

### Pattern 5 — Runtime diagnostic panel for QA

**What it does:** Exposes useful install-related signals during development without treating them as authoritative install state.  
**When to use it:** QA builds, browser compatibility investigations, and client handoff checks.

```js
function getInstallDiagnostics() {
  const supportedDisplayModes = ["standalone", "minimal-ui", "fullscreen", "browser"];
  const currentDisplayMode = supportedDisplayModes.find((mode) =>
    window.matchMedia(`(display-mode: ${mode})`).matches
  ) || "unknown";

  return {
    secureContext: window.isSecureContext,
    manifestLinkPresent: Boolean(document.querySelector('link[rel="manifest"]')),
    deferredPromptApiPresent: "onbeforeinstallprompt" in window,
    currentDisplayMode,
    serviceWorkerApiPresent: "serviceWorker" in navigator
  };
}

console.table(getInstallDiagnostics());
```

**Why this works:** It distinguishes a missing manifest link, insecure context, unavailable prompt API, and display-mode state. It does not prove installability: only browser tooling and real-device testing can confirm the complete flow. Do not expose detailed diagnostic information to end users in a production interface.

### Pattern 6 — Manifest and icon validation in a release check

**What it does:** Validates the deployed manifest as a real HTTP resource and confirms referenced icons can be fetched.  
**When to use it:** A release pipeline or a manual pre-launch checklist for a static site.

```bash
#!/usr/bin/env bash
set -euo pipefail

SITE_ORIGIN="https://portfolio.example"
MANIFEST_PATH="/manifest.webmanifest"

# Fail early if the production manifest cannot be fetched or parsed.
curl --fail --silent --show-error "$SITE_ORIGIN$MANIFEST_PATH" \
  | python -m json.tool >/dev/null

# Inspect headers separately because a successful body alone does not prove correct hosting.
curl --fail --silent --show-error --head "$SITE_ORIGIN$MANIFEST_PATH"

# Add explicit icon URL checks here for every icon declared in the manifest.
```

**Why this works:** It checks the deployed artifact rather than assuming source configuration matches production. For a more complete CI script, parse the manifest, resolve each icon URL relative to the manifest URL, and verify successful responses and image dimensions. Avoid hard-coding an example domain in the actual project pipeline.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Using a generic `name` such as “App” | Starter manifests are shipped without product review | Use the real product name and test launcher truncation |
| Omitting `short_name` | Developer assumes only the full name is used | Provide a concise label suitable for a home-screen icon |
| Changing `id` casually between releases | Identity is treated as disposable configuration | Define a stable ID and review identity changes as migrations |
| `start_url` points to a temporary campaign route | Install analytics are mixed with the canonical entry point | Use a stable route and only harmless attribution parameters |
| `start_url` sits outside `scope` | Paths are configured independently | Ensure the launch URL falls inside the intended scope |
| Manifest URL breaks on nested routes | A relative URL resolves against the current document | Use the correct public/base path and test a deep route |
| Root-relative icons fail on subpath hosting | `/icons/...` is assumed to mean the project folder | Generate paths from the deployment base |
| Declared icon dimensions do not match the files | Manifest values are typed manually | Inspect actual dimensions and validate each asset |
| Maskable icon crops the logo | Ordinary icon artwork is reused without safe-zone design | Create and test a maskable-specific asset with padding |
| JSON contains comments or trailing commas | JSON is mistaken for JavaScript object syntax | Parse the built manifest in CI and remove invalid syntax |
| Manifest returns 404 or HTML | SPA fallback rewrites the manifest request | Configure static-file routing and inspect the network response |
| Incorrect MIME type is ignored during local testing | Development server is more permissive than production | Check deployed response headers and use a JSON manifest MIME type |
| Install button is always visible | UI is built before browser support is checked | Reveal it only after a valid `beforeinstallprompt` event arrives |
| Button is expected to trigger iOS native installation | Chromium-specific APIs are assumed universal | Offer accurate Safari Share-menu instructions instead |
| Deferred event is reused after prompting | The event is treated as a reusable service | Clear the stored event after the prompt attempt |
| Install is described as offline-ready | Manifest and service-worker features are conflated | Document and test offline behavior separately |
| App name or icon appears stale after deployment | CDN/browser caching is overlooked | Inspect network responses and configure appropriate cache revalidation |
| App works in a tab but not when installed | Only browser-tab behavior was tested | Test launch, navigation, storage, and deep links in installed mode |
| Installation is forced with a modal | Conversion is prioritized over user intent | Use a contextual CTA and keep the website fully usable without install |
| Platform detection is treated as proof | User-agent strings are brittle | Use feature detection for capabilities and platform hints only for guidance |

---

## Mental Models

1. **Manifest = app identity card.** It describes how a browser should present the website; it does not build the site's runtime behavior.
2. **Install is a capability, not a command.** The page can offer an install flow when the browser allows it, but cannot force native UI to appear.
3. **Scope is a fence.** A launch URL inside the fence can receive the app-like navigation treatment; URLs outside it may be handled differently.
4. **An icon is a production asset.** A valid JSON reference is not proof that the image exists, has the correct dimensions, or survives platform masking.
5. **Progressive enhancement means no dead ends.** Unsupported browsers still get a complete website and honest installation guidance.
6. **A local pass is not a release pass.** HTTPS, redirects, base paths, CDN caching, and MIME types must be checked at the deployed URL.
7. **Installation and offline support are separate promises.** A manifest describes the app; caching and offline UX must be designed and tested independently.
8. **Browser UI is not your component.** The app can request a presentation mode or show a button, but platform surfaces remain under browser/OS control.

---

## Quick Reference

| Property / Situation | Value / Answer | Notes |
|---|---|---|
| Manifest link | `<link rel="manifest" href="...">` | Put in the document head |
| Typical filename | `manifest.webmanifest` | Ensure server returns valid JSON |
| Full display name | `name` | Use real brand/product name |
| Compact launcher label | `short_name` | Keep it concise |
| Stable app identity | `id` | Avoid casual changes after release |
| Launch route | `start_url` | Should be useful and inside scope |
| Navigation boundary | `scope` | Align with deployment path |
| App-like window | `display: "standalone"` | Browser/platform behavior varies |
| Full-screen mode | `display: "fullscreen"` | Use only when the UX truly requires it |
| Launch background hint | `background_color` | Match the initial page surface |
| Browser UI color hint | `theme_color` | Also consider HTML theme-color meta tag |
| Common icon declarations | `192x192`, `512x512` | Confirm real file dimensions and target support |
| Maskable artwork | `purpose: "maskable"` | Keep critical logo inside safe zone |
| Deferred install prompt | `beforeinstallprompt` | Browser-specific; not universal |
| Native install event | `appinstalled` | Optional signal, not universal |
| iOS fallback | Safari Share → Add to Home Screen | Do not promise a programmatic prompt |
| Secure context | HTTPS in production | Localhost is usually trusted for development |
| Offline behavior | Service worker + caching strategy | Not provided by manifest alone |
| Debug panel | Browser DevTools Application/Manifest area | Inspect parse, icons, scope, and SW separately |
| Deployment path | Build's public/base path | Root-relative URLs can break subpath deploys |
| Stale metadata | Inspect network/cache headers | Manifest and icons may cache separately |
| Accessibility | Native button, visible focus, live status | Do not use clickable generic containers |

---

## Build Challenge

### Project: Installable Creative Portfolio Shell

Build a small, production-minded PWA installation layer for a creative portfolio. The portfolio must remain a normal, accessible website in every browser, while supported browsers can install it and launch it in a focused app-like window. Complete the challenge in one focused session using a local HTTPS-capable development setup or localhost and validate the deployed output before calling it done.

### Requirements

1. Create a valid `manifest.webmanifest` containing `id`, `name`, `short_name`, `description`, `start_url`, `scope`, `display`, `background_color`, `theme_color`, and an `icons` array.
2. Choose a stable `id` that matches the intended app identity. Explain in a short README note why it should not be changed casually after launch.
3. Ensure `start_url` is useful on a fresh visit, works without a previous navigation state, and remains inside the declared `scope`.
4. Use a real public deployment path. If the portfolio is hosted under a subpath, configure the base path and ensure all manifest paths resolve correctly.
5. Provide at least one ordinary app icon and one maskable icon. Verify the image dimensions and check the maskable icon's safe zone visually.
6. Add the manifest link and HTML theme-color metadata to the page head.
7. Make `background_color` match the initial page background closely enough to avoid a jarring launch mismatch.
8. Use a `display` mode appropriate to the content and document the fallback expectation for browsers that do not support it.
9. Add a semantic install button that is hidden until a deferred install prompt is available.
10. Store the `beforeinstallprompt` event only when it is received; do not assume it fires in every browser or on every visit.
11. Trigger the browser prompt only in response to the user's explicit button activation.
12. Handle both accepted and dismissed outcomes with clear, non-manipulative status text.
13. Clear the deferred prompt reference after a prompt attempt so the same event is not reused.
14. Add error handling for prompt failures and keep the rest of the page functional if the flow fails.
15. Listen for `appinstalled` where available, but do not make the event necessary for the website to work.
16. Provide a non-Chromium fallback explanation, including iOS Safari's Share → Add to Home Screen route where relevant.
17. Ensure the install control is keyboard operable, has an accessible name, has a visible focus indicator, and exposes status updates politely.
18. Respect reduced-motion preferences if the design includes an animated install callout.
19. Keep the install CTA contextual and non-blocking; visitors must be able to use the entire portfolio without installing it.
20. Do not claim offline access, push notifications, or native capabilities unless separately implemented and tested.
21. Validate the manifest as JSON in a repeatable check and confirm the deployed manifest response is successful.
22. Open every declared icon URL directly and confirm that no icon request returns 404 or an HTML fallback page.
23. Inspect response headers for the manifest and verify an appropriate JSON MIME type.
24. Use DevTools to inspect manifest parsing, icons, start URL, scope, and any installability warnings.
25. Test the app in a regular browser tab and as an installed app on at least one supported platform.
26. Test an in-scope route and an out-of-scope route, noting how navigation is handled in the target browser.
27. Test a deep route and refresh it to confirm the hosting configuration does not break manifest discovery or route loading.
28. Test a deployment where the app base path is not `/`, or document a reproducible test that proves the base-path configuration is correct.
29. Test a browser without the deferred install API and verify that no dead install button is shown.
30. Test the manual fallback text and ensure it does not claim that the app has been installed.
31. Test a failed manifest request and an invalid JSON response in a development environment; record how you diagnose each one.
32. Simulate an icon 404 and a stale cached manifest so you can distinguish those failures from install prompt unavailability.
33. Check that the app still works when the install CTA is hidden and when installation is dismissed.
34. Confirm that the launch route contains no credentials, private identifiers, or sensitive values in query parameters.
35. Document the difference between installability, standalone display, and offline functionality in a short project note.

### Expected Output

- A valid, deployable manifest and matching icon assets.
- A normal website with a progressive install CTA and platform-appropriate fallback guidance.
- A short README containing deployment path assumptions, tested browsers/devices, known limitations, and a release checklist.
- Evidence of the manifest response, icon requests, and installed launch behavior from DevTools or screenshots.

### Test Matrix

| Scenario | Expected result | Failure to watch for |
|---|---|---|
| Regular browser tab | Full site works; install CTA reflects capability | Site is blocked behind install UI |
| Supported Chromium browser, event received | Install button becomes available | Button appears before event or remains dead |
| User accepts prompt | Browser handles install; app status is accurate | App claims success before browser outcome |
| User dismisses prompt | Page remains usable; no repeated nag | Prompt is immediately shown again |
| Safari on iOS | Manual install guidance is accurate | Chromium-only API is assumed to exist |
| Invalid manifest JSON | DevTools or validation check reports failure | Error is missed because local server is permissive |
| Icon URL 404 | Network panel identifies exact missing asset | Broken icon is blamed on unrelated install logic |
| App deployed under a subpath | Manifest, icons, start URL, and scope resolve | Root-relative URLs escape the app base path |
| Installed launch | Correct identity and app-like presentation appear | Wrong start URL, stale icon, or unexpected browser UI |
| Out-of-scope navigation | Target browser handles it according to its rules | Assumption that every URL remains in the app window |
| Offline launch (only if promised) | Defined offline shell/content behaves as documented | Manifest is mistaken for offline caching |
| Keyboard-only use | Install button and status are accessible | Focus is invisible or the CTA is unreachable |

### Definition of Done

- [ ] Manifest JSON parses and is served from the final deployed URL.
- [ ] App identity is intentional and stable; name and short name are tested in real launcher surfaces.
- [ ] Start URL and scope are aligned and have been checked against representative routes.
- [ ] All icon URLs resolve, dimensions are accurate, and maskable artwork has safe padding.
- [ ] Theme and launch colors match the initial app surface.
- [ ] Install UI only appears when a usable browser prompt exists, or clear manual instructions are provided.
- [ ] Prompt outcomes, prompt errors, and installation events are handled without blocking the website.
- [ ] Unsupported browsers have no dead controls and receive honest fallback guidance.
- [ ] Keyboard, focus, status announcement, and reduced-motion behavior are checked.
- [ ] Production HTTPS, MIME type, base path, redirects, and caching behavior are verified.
- [ ] Browser-tab behavior and installed behavior are both tested on target platforms.
- [ ] Offline support is either separately implemented and tested or explicitly not promised.
- [ ] README records tested environments, limitations, and the deployment assumptions.

---

## Browser Support and Production Notes

Manifest support is broad but not uniform. Chromium browsers support many manifest fields and may expose a deferred install prompt in eligible conditions. Safari on iOS has its own Home Screen installation flow and does not provide the same `beforeinstallprompt` event. Desktop Safari, Firefox, embedded webviews, and managed browser environments can differ in manifest interpretation and install affordances. Treat the browser's current DevTools diagnostics and official platform documentation as the final word for the browsers you target.

Use feature detection for APIs, but remember that an API's existence does not guarantee the browser will emit a prompt event. Keep a no-install fallback. Do not make support promises based on a single browser version or a screenshot from a development machine. If your client contract lists specific devices, test those devices explicitly.

Production checks that matter:

- Serve the site over HTTPS, with redirects to one canonical origin.
- Serve the manifest as valid JSON and ensure CDN rewrites do not return the SPA's HTML document instead.
- Verify every manifest asset against the final deployment base path.
- Revalidate the manifest when its contents change; version icon files when appropriate.
- Check the installed experience after a release that changes app identity, start URL, scope, or icons.
- Treat the service worker's caches as separate state; stale cached HTML can keep an old manifest link alive.
- Keep the manifest free of secrets, private customer data, and unnecessary tracking values.
- Never make the site unusable because installability checks fail.

---

## Debugging Workflow

1. **Confirm the document link.** Inspect the live page's `<head>` and verify the manifest URL is the URL the browser actually requests.
2. **Open the manifest URL directly.** Confirm status code, response body, redirects, and MIME type. A `200` response containing the site's HTML is still a failure.
3. **Parse the JSON.** Run a JSON validator and inspect console/DevTools warnings. Remove comments and trailing commas.
4. **Check paths.** Resolve `start_url`, `scope`, and every icon URL against the real deployment location. Test a nested route and subpath deployment if relevant.
5. **Check assets.** Open icon files directly, inspect dimensions, transparency, and maskable safe zones. Verify that the server is not serving a fallback document as an image.
6. **Check secure context.** Confirm HTTPS on the production origin. Localhost success does not prove public deployment correctness.
7. **Inspect browser diagnostics.** Use the browser's manifest/application tools to distinguish manifest parse errors, icon problems, scope problems, and installability warnings.
8. **Check prompt state.** Determine whether `beforeinstallprompt` actually fires. Do not diagnose a missing event as a button bug until you know the browser and its criteria support that flow.
9. **Test actual installation.** Install on a target device, launch from the icon, and verify the app name, icon, display mode, start route, and navigation.
10. **Investigate caching last, but deliberately.** Compare the network response with the file deployed at the origin; inspect CDN and service-worker caches if old metadata persists.

### Debug helper

```js
function logManifestInstallState() {
  const manifestElement = document.querySelector('link[rel="manifest"]');
  const activeModes = ["standalone", "minimal-ui", "fullscreen", "browser"]
    .filter((mode) => window.matchMedia(`(display-mode: ${mode})`).matches);

  console.table({
    pageUrl: window.location.href,
    secureContext: window.isSecureContext,
    manifestHref: manifestElement?.href || "missing",
    deferredPromptApiPresent: "onbeforeinstallprompt" in window,
    serviceWorkerApiPresent: "serviceWorker" in navigator,
    displayMode: activeModes.join(", ") || "unknown"
  });
}

// Run manually during QA; remove or restrict verbose diagnostics in production.
logManifestInstallState();
```

This helper reports browser state; it does not test the manifest response, validate icon files, or prove installability. Use Network and Application/Manifest panels for those checks.

---

## Security and Privacy Considerations

The manifest is public metadata. Never put API keys, access tokens, session identifiers, email addresses, or private customer data in `start_url`, `id`, `name`, descriptions, or query parameters. Anything in the manifest can be downloaded by any visitor. Keep install analytics privacy-aware and respect the site's consent policy.

Do not use platform detection to gate sensitive features. User-agent strings can be spoofed and should never be a security boundary. Installation state is also not authentication: a website must authorize every protected request on the server regardless of whether it is launched in standalone mode. A PWA icon on a home screen does not grant trust or permissions beyond what the browser actually provides.

When the manifest is served through a CDN, use correct cache controls and integrity-minded release processes. If an icon is replaced under the same URL, a browser may keep an old copy; versioned icon paths can make rollout more predictable. Avoid broad service-worker caching rules that accidentally cache account-specific or sensitive responses as public app assets.

---

## Final Checklist for a Senior Review

- Is this manifest describing the product accurately, or is it leftover boilerplate?
- Is app identity stable across deployments and consistent with the actual product name?
- Are the start URL and scope correct for root and subpath hosting?
- Do all icon URLs resolve in production, and does the maskable icon survive real platform masking?
- Are the launch and theme colors intentional and consistent with the first rendered screen?
- Is the install CTA honest about whether the browser has offered a prompt?
- Is the iOS/unsupported-browser fallback useful rather than misleading?
- Can users complete the entire website journey without installing the app?
- Have install, dismissal, installed launch, stale cache, invalid manifest, and missing icon cases been tested?
- Are privacy-sensitive values absent from public metadata and launch URLs?
- Are browser support assumptions written down and tied to the project's actual target devices?

A good manifest is not measured by how many fields it contains. It is measured by whether the installed experience feels intentional, launches predictably, respects the user's choice, and fails without breaking the website when a browser does not support the same install flow.
