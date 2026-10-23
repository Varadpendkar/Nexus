# SKILL: multilingual-typography
**Layer:** 23 — Web Typography Deep  
**Goal:** Design and implement robust multilingual typography for websites by handling script-specific fonts, shaping, language metadata, line breaking, bidirectional text, fallbacks, accessibility, and responsive layout without assuming that Latin typography rules work for every writing system.

---

## Why This Matters (Senior Perspective)

Multilingual typography is not a matter of translating English copy and keeping the same CSS. Different writing systems have different glyph inventories, shaping behavior, line-breaking conventions, punctuation, text direction, and expectations around spacing. A Latin headline may tolerate tight negative tracking and a narrow line measure; applying those same choices to Arabic, Devanagari, Thai, Japanese, or Chinese can damage readability or even interfere with the way text is shaped. A site can technically contain translated words yet still feel broken because the selected font lacks a needed glyph, a line breaks in the wrong place, mixed-direction content is reordered unexpectedly, or a fallback font changes the vertical rhythm.

A senior implementation begins with language and script requirements, not with a single global font declaration. They verify that the content has correct `lang` metadata, use `dir` where direction matters, choose fonts with suitable script coverage, allow browser shaping engines to do their work, and test actual copy rather than placeholder text. They keep layout resilient to different string lengths and avoid assumptions such as “one word equals one spacing unit” or “every language uses spaces between words.” They also plan for mixed-script content: a Latin product name inside an Arabic paragraph, a number inside a Hebrew interface, or a user-entered address that contains several scripts.

This is a production concern for international products, ecommerce, documentation, dashboards, and any interface with user-generated text. Font fallback, line-height, punctuation, and bidirectional isolation affect both visual quality and whether people can use the interface. The goal is not to manually reimplement every language’s typesetting rules in CSS. It is to provide correct metadata, appropriate fonts, semantic markup, flexible layout, and enough testing that the browser’s shaping and line-breaking behavior can operate as intended.

---

## Core Concepts

### 1. Language metadata is part of the typography system

The `lang` attribute identifies the language of a document or a specific text segment. It helps assistive technology choose pronunciation rules and can also support language-sensitive processing. It does not translate the text, select a guaranteed font, or automatically solve every line-breaking issue. Mark the page language at the root and mark embedded passages when their language changes.

```html
<html lang="en">
  <body>
    <main>
      <h1>Design systems for global products</h1>
      <p>
        The Japanese term <span lang="ja">組版</span> refers to typesetting.
      </p>
    </main>
  </body>
</html>
```

```css
:lang(ja) {
  line-break: strict;
  word-break: normal;
}

:lang(en) {
  hyphens: auto;
}
```

The selector applies styles based on language metadata; it does not replace testing in the target browser. `hyphens: auto` depends on language support and browser dictionaries, and should be checked with real copy. Use the language code appropriate to the content rather than setting every page to English because the interface chrome is English.

**Naive approach**

```html
<html>
  <body>
    <p>Welcome to our product. مرحباً بكم. 日本語のテキスト。</p>
  </body>
</html>
```

**Correct approach:** declare the primary language and annotate text runs whose language differs when the distinction is meaningful.

**Gotcha:** `lang` and `dir` are separate. Declaring `lang="ar"` does not, by itself, make an element right-to-left; direction must be handled independently where needed.

### 2. Choose fonts by script coverage and quality

A font family that looks excellent in Latin may have no Arabic, Devanagari, Thai, or CJK glyphs. The browser then falls back to another font, sometimes one with a visibly different x-height, weight, or baseline. A font stack should be designed for the scripts the product supports, and the chosen files should be checked for actual glyph coverage and license terms.

```css
body {
  font-family:
    "Inter",
    "Noto Sans Devanagari",
    "Noto Sans Arabic",
    "Noto Sans Thai",
    "Noto Sans CJK JP",
    system-ui,
    sans-serif;
}
```

This is an illustrative stack, not a recommendation to load every font file on every page. For a production site, use script-aware subsets or a tested family with suitable coverage. The order matters: the browser searches for glyphs and may use fallback faces for characters missing from the first family. Test mixed-script lines to catch changes in baseline, apparent weight, and line box height.

**Naive approach**

```css
body { font-family: "Brand Latin Font", sans-serif; }
```

**Correct approach:** confirm that the chosen family supports every required script, or provide deliberate fallbacks and test the actual glyphs.

**Gotcha:** Font family names and font coverage are not the same thing. A family can include some glyphs from a script but lack less common characters, historic forms, or required symbols.

### 3. Understand shaping and combining marks

Some scripts require contextual shaping, ligatures, reordering, or combining marks that are positioned relative to a base character. The browser’s shaping engine normally handles these when the text, language, font, and direction are correctly represented. Avoid manipulating the string into separate visual glyphs or inserting arbitrary spaces to “fix” the appearance.

```html
<p lang="hi">नमस्ते, दुनिया!</p>
<p lang="ar" dir="rtl">مرحبًا بالعالم</p>
<p lang="th">สวัสดีชาวโลก</p>
```

```css
.multilingual-copy {
  font-kerning: normal;
  font-variant-ligatures: normal;
  text-rendering: optimizeLegibility;
}
```

These properties may influence typographic features, but they do not repair missing glyphs or incorrect Unicode text. Browser defaults and font capabilities vary; `text-rendering` is not a universal switch for perfect shaping. Keep text in logical Unicode order and use a font that supports the required shaping behavior.

**Naive approach**

```html
<!-- Do not insert spaces between characters to force a visual shape. -->
<p lang="ar">م ر ح ب ا</p>
```

**Correct approach:** preserve the original Unicode text, declare its language and direction, and let the shaping engine render the sequence.

**Gotcha:** Visually similar strings may contain different Unicode code points or normalization forms. If user-entered text renders incorrectly, inspect the underlying code points and font support before adding CSS hacks.

### 4. Direction is a layout property: use `dir` and logical CSS

Arabic and Hebrew are written right-to-left, but a page can contain left-to-right numbers, URLs, product identifiers, or English terms. Use semantic direction metadata and CSS logical properties instead of hard-coding left and right. `dir="auto"` can be useful for user-generated content whose direction is unknown, while known-language UI should use an explicit direction.

```html
<article class="message" dir="rtl" lang="ar">
  <h2>تفاصيل الطلب</h2>
  <p>رقم الطلب: <bdi dir="ltr">ORD-2026-1042</bdi></p>
</article>
```

```css
.message {
  text-align: start;
  padding-inline: 1.5rem;
  margin-inline: auto;
  border-inline-start: 3px solid currentColor;
}

.message h2 { margin-block: 0 0.75rem; }
```

Logical properties map to the writing mode and direction, so `padding-inline-start` is more robust than assuming “left” means the leading edge. `text-align: start` follows the direction. Use `bdi` to isolate a directionally unknown or mixed-direction inline fragment, especially identifiers and user content.

**Naive approach**

```css
.rtl-card {
  text-align: right;
  padding-left: 24px;
  border-left: 3px solid currentColor;
}
```

**Correct approach:** set the correct direction and use logical properties for spacing and borders so the component adapts in both LTR and RTL contexts.

**Gotcha:** Not every visual element should be mirrored. Logos, media controls, charts, and directional icons may need product-specific rules. RTL support is more than changing `text-align`.

### 5. Isolate mixed-direction content

Bidirectional text can reorder punctuation and inline fragments in ways that are surprising when a line mixes Arabic or Hebrew with Latin letters, numbers, punctuation, and URLs. Directional isolation helps a fragment behave independently from surrounding text. For inline content with known direction, use `bdi` or `dir`; for CSS-controlled isolation, `unicode-bidi: isolate` can help.

```html
<p lang="ar" dir="rtl">
  اسم المستخدم:
  <bdi dir="ltr">varad.pendkar@example.com</bdi>
</p>
<p lang="he" dir="rtl">
  رقم المرجع:
  <bdi dir="ltr">INV-583-2026</bdi>
</p>
```

```css
.user-value {
  unicode-bidi: isolate;
  direction: ltr;
}
```

Prefer semantic markup where possible. Avoid using invisible directional control characters as a routine styling tool in source content; they can be hard to inspect, copy, and debug. If content is user-generated, consider `dir="auto"` on the content container and isolate values with known direction.

**Naive approach**

```html
<p dir="rtl">Contact varad.pendkar@example.com for order ORD-2026-1042.</p>
```

**Correct approach:** isolate emails, order numbers, URLs, and other known-direction fragments from the surrounding bidirectional paragraph.

**Gotcha:** The Unicode Bidirectional Algorithm determines visual ordering. CSS isolation improves boundaries, but it does not make a badly structured sentence or incorrectly tagged language semantically correct.

### 6. Do not apply Latin tracking rules globally

Negative `letter-spacing` can make a large Latin headline feel tighter, but scripts differ in how spacing and shaping work. Some writing systems do not use inter-letter spacing as a normal typographic control, and adding it indiscriminately can separate connected or tightly composed forms. Keep tracking adjustments scoped to appropriate components and scripts.

```html
<h1 class="display-title" lang="en">Design without friction</h1>
<h1 class="display-title" lang="ja">心地よいデジタル体験</h1>
```

```css
.display-title {
  font-size: clamp(2.5rem, 7vw, 6rem);
  line-height: 1.08;
  max-width: 14ch;
}

.display-title:lang(en) {
  letter-spacing: -0.04em;
}

.display-title:lang(ja) {
  letter-spacing: normal;
  max-width: 16em;
}
```

These values are starting points, not universal rules. The Japanese heading uses a different measure and no negative tracking; actual line length should be judged by the selected font and content. Use script-specific design tokens rather than one global rule.

**Naive approach**

```css
* { letter-spacing: -0.03em; }
```

**Correct approach:** scope tracking to scripts and components where it has been intentionally tested.

**Gotcha:** `:lang()` matches language metadata inherited from ancestors. If a text run lacks the correct `lang`, the intended script-specific rule may never apply.

### 7. Line breaking varies by language and writing system

English often uses spaces between words and can use hyphenation; Japanese and Chinese can break at different character boundaries; Thai requires language-aware word segmentation; URLs and long identifiers need separate overflow strategies. Do not use `word-break: break-all` as a universal “prevent overflow” fix because it can split words or disrupt scripts unexpectedly.

```html
<article class="localized-article">
  <h1>Global product documentation</h1>
  <p lang="en">A carefully structured paragraph with natural word breaks.</p>
  <p lang="ja">日本語の文章では、行の折り返し規則を適切に扱うことが重要です。</p>
  <p lang="th">การจัดบรรทัดควรทดสอบด้วยข้อความจริงในภาษาที่รองรับ</p>
  <p class="reference">https://example.com/a/very/long/reference/path</p>
</article>
```

```css
.localized-article {
  max-width: 70ch;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.localized-article :lang(ja),
.localized-article :lang(zh) {
  line-break: strict;
  word-break: normal;
}

.localized-article .reference {
  overflow-wrap: anywhere;
  word-break: normal;
}
```

`overflow-wrap: anywhere` is helpful for long unbreakable sequences, but it can create awkward breaks if applied indiscriminately to editorial text. Apply it where overflow is a real risk and verify the browser’s language-sensitive behavior with actual content.

**Naive approach**

```css
p { word-break: break-all; }
```

**Correct approach:** use natural language-aware breaking for prose and a targeted overflow strategy for long URLs, codes, and identifiers.

**Gotcha:** CSS line-breaking support varies across browsers and fonts. Do not assume a setting tested in one browser produces identical results on every platform.

### 8. Use language-aware hyphenation carefully

Automatic hyphenation can improve line filling for languages where hyphenation rules are well supported, but it depends on the correct language tag and browser dictionaries. It is not a general solution for all scripts, product names, or interface labels.

```html
<p class="long-form-copy" lang="en">
  Internationalization requires careful planning for long explanatory
  paragraphs and responsive reading widths.
</p>
```

```css
.long-form-copy {
  max-width: 62ch;
  hyphens: auto;
  overflow-wrap: normal;
}
```

For another language, declare its correct `lang` and test the browser’s hyphenation behavior. Avoid manually inserting soft hyphens into every content string unless the editorial workflow requires them and they are maintained deliberately.

**Naive approach**

```css
* { hyphens: auto; }
```

**Correct approach:** apply hyphenation to suitable long-form text with correct language metadata, and leave short labels, names, codes, and URLs to their appropriate wrapping rules.

**Gotcha:** `hyphens: auto` does not guarantee that a browser will hyphenate the text. Language support, dictionaries, user agent, and available break opportunities all matter.

### 9. Manage fallback metrics and vertical rhythm

When the primary font lacks a glyph, a fallback font may render only that character or run. The fallback can have a different baseline, x-height, and line box, creating uneven text. This is common when a brand font covers Latin but not CJK or Indic scripts. Font fallback is expected; the task is to choose compatible coverage and test mixed-script rendering.

```css
@font-face {
  font-family: "Brand Latin";
  src: url("/fonts/brand-latin.woff2") format("woff2");
  font-weight: 400 700;
  font-display: swap;
}

body {
  font-family:
    "Brand Latin",
    "Noto Sans Devanagari",
    "Noto Sans Arabic",
    "Noto Sans CJK JP",
    system-ui,
    sans-serif;
  line-height: 1.65;
}
```

Where appropriate, use metric overrides such as `size-adjust`, `ascent-override`, `descent-override`, and `line-gap-override` to reduce layout shifts between a fallback and a web font. These are advanced tuning tools and must be measured against the actual font files; arbitrary percentages can make glyphs look distorted.

**Naive approach**

```css
body { font-family: "Brand Latin"; }
```

**Correct approach:** include a tested fallback stack and inspect lines containing multiple scripts, punctuation, and emoji.

**Gotcha:** A fallback stack does not guarantee that the browser will use the same fallback font on macOS, Windows, Android, and Linux. Platform font availability can differ, so test on representative systems.

### 10. Responsive layouts must survive translated string expansion

Translated strings can be much longer or shorter than the original. A button that fits “Save” may not fit a longer translation; a heading may wrap to three lines; a navigation row may overflow. Avoid fixed heights and widths around text unless the design explicitly supports truncation and provides a way to access the full content.

```html
<nav class="localized-nav" aria-label="Primary">
  <a href="/products">Products</a>
  <a href="/resources">Resources</a>
  <a href="/pricing">Pricing</a>
  <a class="localized-nav__action" href="/contact">Talk to our team</a>
</nav>
```

```css
.localized-nav {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem 1.25rem;
}

.localized-nav a {
  min-width: 0;
  max-width: 100%;
  overflow-wrap: anywhere;
}

.localized-nav__action {
  padding: 0.75rem 1rem;
  border: 1px solid currentColor;
  border-radius: 999px;
}
```

Test with longer translations and pseudo-localized strings that add length. Allow buttons to grow, navigation to wrap or collapse intentionally, and cards to expand vertically. Use ellipses only when truncation is a deliberate information design decision.

**Naive approach**

```css
.nav-link { width: 90px; height: 40px; white-space: nowrap; overflow: hidden; }
```

**Correct approach:** size components around content, permit wrapping where appropriate, and test long localized strings at narrow viewports and zoom.

**Gotcha:** `min-width: 0` is often necessary for flex or grid children to shrink below their min-content width. Without it, a long string can force the entire layout wider than the viewport.

### 11. Use logical properties and writing modes thoughtfully

Logical properties such as `margin-inline`, `padding-block`, and `border-inline-start` adapt to direction and writing mode. They are especially useful for RTL interfaces. Vertical writing modes are a separate design requirement and should not be introduced just because a language is CJK; many Japanese web interfaces use horizontal writing.

```html
<aside class="callout" dir="rtl" lang="ar">
  <h2>ملاحظة مهمة</h2>
  <p>تظهر المسافة والحد على جهة البداية وفق اتجاه الكتابة.</p>
</aside>
```

```css
.callout {
  padding-block: 1rem;
  padding-inline: 1.25rem;
  border-inline-start: 0.25rem solid #a9bdff;
  margin-block: 1.5rem;
}
```

This component adapts its leading border to the direction without requiring a second left/right rule. If the product truly needs vertical writing, test the entire composition—including controls, icons, punctuation, and scrolling—in that writing mode rather than changing only `writing-mode`.

**Naive approach**

```css
.callout { padding-left: 20px; border-left: 4px solid blue; }
```

**Correct approach:** use logical properties for directional layout and test LTR and RTL contexts.

**Gotcha:** Logical properties do not automatically mirror the meaning of icons or images. A “back” arrow, playback timeline, and brand mark each need a semantic decision.

### 12. Preserve typographic conventions instead of faking them

Do not use CSS to replace proper language content with visual approximations. Do not force punctuation, spacing, or capitalization patterns from English onto another script. Use localized content and language-appropriate fonts, then rely on the browser’s shaping and line-breaking support where possible.

```html
<article>
  <h2 lang="en">Frequently asked questions</h2>
  <p lang="ja">よくある質問</p>
  <p lang="ar" dir="rtl">الأسئلة الشائعة</p>
</article>
```

```css
article p {
  margin-block: 0.75em;
  line-height: 1.7;
}

article :lang(ja),
article :lang(zh) {
  line-height: 1.8;
}
```

Language-specific line-height values can be useful, but they should come from real-font testing and content review. Do not apply extra spacing to all non-Latin scripts without checking the actual typeface and glyph metrics.

**Naive approach**

```css
p { letter-spacing: 0.1em; text-transform: uppercase; }
```

**Correct approach:** keep text transformations and spacing scoped to suitable language/script contexts, and preserve editorial conventions in the source content.

**Gotcha:** CSS `text-transform` has language-dependent behavior in some cases, but it is not a localization system. Localized labels should normally be supplied as properly translated content.

### 13. Treat user-generated text as untrusted layout input

Names, comments, addresses, filenames, and messages can contain any script, long unbroken sequences, mixed direction, or unusual punctuation. A robust interface should not assume a particular character set or direction. Use safe text rendering, `dir="auto"` where direction is unknown, and overflow rules appropriate to the component.

```html
<article class="user-message" dir="auto">
  <p class="user-message__body">User-provided text appears here.</p>
  <code class="user-message__identifier" dir="ltr">USR-2026-000184</code>
</article>
```

```css
.user-message {
  min-width: 0;
  overflow-wrap: anywhere;
  text-align: start;
}

.user-message__identifier {
  display: inline-block;
  max-width: 100%;
  overflow-wrap: anywhere;
  unicode-bidi: isolate;
}
```

Render user text as text, not injected HTML. Direction and wrapping are layout concerns; they do not replace output encoding or content security. For identifiers, a known LTR direction can make copy and scan behavior more predictable even when the surrounding message is RTL.

**Naive approach**

```html
<div class="user-message">[insert raw user content as HTML]</div>
```

**Correct approach:** render user content safely as text, choose direction intentionally, and allow arbitrary strings to wrap without breaking the page.

**Gotcha:** `dir="auto"` determines direction from the first strong directional character. If the value starts with punctuation or neutral characters, the result may not match the user’s intended direction; test the actual data patterns.

### 14. Build a repeatable multilingual typography QA process

A visual check in one language is not enough. A QA matrix should include every supported script, mixed-direction strings, long and short translations, fallback font behavior, responsive wrapping, and assistive-technology metadata. Automated screenshot tests can reveal overflow, but they cannot fully judge shaping correctness or editorial conventions.

```js
const typographyCases = [
  { label: "English", lang: "en", dir: "ltr", text: "Readable global products" },
  { label: "Japanese", lang: "ja", dir: "ltr", text: "読みやすいデジタル製品" },
  { label: "Arabic", lang: "ar", dir: "rtl", text: "منتجات رقمية سهلة القراءة" },
  { label: "Hebrew", lang: "he", dir: "rtl", text: "מוצרים דיגיטליים קריאים" },
  { label: "Hindi", lang: "hi", dir: "ltr", text: "पढ़ने में आसान डिजिटल उत्पाद" },
  { label: "Thai", lang: "th", dir: "ltr", text: "ผลิตภัณฑ์ดิจิทัลที่อ่านง่าย" }
];

for (const testCase of typographyCases) {
  console.log(`${testCase.label}: ${testCase.lang}/${testCase.dir} — ${testCase.text}`);
}
```

Use a case matrix to drive browser tests and visual review. The snippet is sample test data, not a full automated QA framework. Pair it with real translations, native-speaker review where possible, accessibility checks, and tests on representative browsers and operating systems.

**Naive approach**

```js
// Only one English heading is used as the typography test fixture.
const cases = ["Hello world"];
```

**Correct approach:** maintain representative fixtures for each supported language and script, including mixed-direction and long-string edge cases.

**Gotcha:** A string can display without tofu boxes and still be typographically wrong. Validate language metadata, shaping, punctuation, line breaks, direction, and meaning—not just whether glyphs appear.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Script-aware font stack

**What it does:** Provides predictable fallback options for a defined set of supported scripts.

**When to use it:** Use it when the brand font is strong in Latin but the product needs additional scripts, or when you need a documented fallback plan across operating systems.

```css
:root {
  --font-ui:
    "Brand Sans",
    "Noto Sans",
    "Noto Sans Arabic",
    "Noto Sans Devanagari",
    "Noto Sans Thai",
    "Noto Sans CJK JP",
    system-ui,
    sans-serif;
}

body { font-family: var(--font-ui); }
```

Treat this as a coverage plan, not a command to download every family. Verify the actual font files, subsets, and fallback behavior on representative devices.

### Pattern 2: Language-scoped typographic adjustments

**What it does:** Applies specific line-breaking or spacing decisions only where language metadata identifies the relevant content.

**When to use it:** Use it when some scripts need different line-height, hyphenation, or tracking behavior than the Latin default.

```css
.article-copy { line-height: 1.65; }
.article-copy:lang(en) { hyphens: auto; }
.article-copy:lang(ja),
.article-copy:lang(zh) {
  line-height: 1.8;
  letter-spacing: normal;
  line-break: strict;
}
```

Keep the rules conservative and test the target browser. Language selectors only work reliably when the document has correct `lang` metadata.

### Pattern 3: RTL-ready component geometry

**What it does:** Makes spacing and borders follow writing direction without duplicating every component’s CSS.

**When to use it:** Use it for cards, callouts, navigation groups, forms, and panels that must support LTR and RTL languages.

```css
.info-panel {
  padding-inline: 1.25rem;
  padding-block: 1rem;
  border-inline-start: 3px solid var(--accent);
  margin-inline: auto;
  text-align: start;
}
```

Do not mirror every icon automatically. Decide which visuals communicate direction and which are brand assets or universal symbols.

### Pattern 4: Isolated mixed-direction values

**What it does:** Keeps emails, URLs, identifiers, and other LTR fragments from disturbing surrounding RTL text.

**When to use it:** Use it in receipts, account screens, support messages, transaction tables, and user profile details.

```html
<p lang="ar" dir="rtl">
  رقم الفاتورة:
  <bdi dir="ltr">INV-2026-583</bdi>
</p>
```

Use `bdi` for a fragment whose direction needs isolation. Do not try to solve every bidi problem with manually inserted invisible control characters.

### Pattern 5: Translation-expansion resilient controls

**What it does:** Allows labels and buttons to grow naturally when translated strings are longer than the source language.

**When to use it:** Use it for navigation, action buttons, filter chips, cards, and form labels in a localized product.

```css
.action-button {
  max-width: 100%;
  min-width: 0;
  min-height: 2.75rem;
  padding: 0.75rem 1rem;
  white-space: normal;
  overflow-wrap: anywhere;
}
```

Test with long localized labels and actual narrow viewports. If the design truncates a label, provide a deliberate accessible name or an interaction that exposes the full text.

### Pattern 6: User-generated text with automatic direction

**What it does:** Adapts a message container to the direction of its first strong directional character while allowing long content to wrap.

**When to use it:** Use it for chat messages, comments, notes, and imported content where language and direction are not known in advance.

```html
<div class="comment" dir="auto">
  <p>Untrusted user-provided text is displayed here as text.</p>
</div>
```

```css
.comment {
  text-align: start;
  overflow-wrap: anywhere;
  min-width: 0;
}
```

Remember that `dir="auto"` does not detect every user intention perfectly, especially when content begins with punctuation or neutral symbols.

### Pattern 7: Multilingual typography test matrix

**What it does:** Creates a repeatable set of strings for visual and functional testing across languages and scripts.

**When to use it:** Use it before launching a locale, updating fonts, changing type tokens, or redesigning responsive navigation.

```js
const cases = [
  { lang: "en", dir: "ltr", text: "A short English heading" },
  { lang: "ar", dir: "rtl", text: "عنوان عربي قصير" },
  { lang: "he", dir: "rtl", text: "כותרת קצרה בעברית" },
  { lang: "hi", dir: "ltr", text: "एक छोटा हिंदी शीर्षक" },
  { lang: "ja", dir: "ltr", text: "短い日本語の見出し" },
  { lang: "th", dir: "ltr", text: "หัวข้อภาษาไทยแบบสั้น" }
];
```

Include long strings, mixed scripts, punctuation, digits, and identifiers as well as short headings. Have language reviewers validate actual production copy rather than treating this sample list as translation approval.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Setting only `lang="en"` on a multilingual page | The main UI language is mistaken for every content language | Mark the document language and annotate embedded language changes |
| Assuming `lang` automatically sets direction | Language and text direction are conflated | Set `dir` explicitly where direction is known or use `dir="auto"` for suitable unknown content |
| Using a Latin-only font for all scripts | The brand font looks consistent in the mockup | Verify script coverage and define deliberate fallbacks |
| Inserting spaces to repair shaping | Visual glyph separation looks like a quick fix | Preserve logical Unicode text and use suitable fonts and metadata |
| Applying negative tracking globally | A display headline’s adjustment is reused everywhere | Scope tracking to tested script/component combinations |
| Using `word-break: break-all` globally | It appears to prevent overflow | Use language-appropriate line breaking and target only unbreakable identifiers |
| Assuming `hyphens: auto` works in every locale | CSS support is mistaken for dictionary availability | Set correct language metadata and test each browser and language |
| Using physical left/right spacing in RTL components | The LTR design is treated as the only layout | Prefer logical properties such as `padding-inline` and `border-inline-start` |
| Leaving emails and IDs unisolated in RTL text | Mixed-direction reordering is discovered too late | Use `bdi` or a known direction on the inline value |
| Fixing font fallback only by changing line-height | One symptom is addressed without checking font metrics | Inspect glyph coverage, fallback family, baseline, and metric overrides |
| Giving buttons fixed widths for English labels | The source-language label fits the mockup | Allow labels to grow and test long translations |
| Using fixed heights around localized text | Component geometry assumes one line | Prefer content-driven height or a deliberate truncation pattern |
| Applying one line-height to every script | A global type token is assumed universal | Test real fonts and establish conservative script-specific adjustments where needed |
| Assuming `dir="auto"` always guesses correctly | Direction inference is treated as language understanding | Test leading punctuation, numbers, and neutral characters |
| Injecting user content as HTML | Dynamic text is handled as markup | Render untrusted input as text and apply direction/wrapping separately |
| Testing only glyph presence | No tofu boxes is taken as success | Check shaping, combining marks, punctuation, line breaks, direction, and semantics |
| Mirroring all icons in RTL | Direction support is reduced to a global flip | Mirror only visuals whose meaning is directional |
| Downloading every script font on every page | Coverage is mistaken for loading every asset | Use appropriate subsets, tested fallback families, and performance-aware loading |
| Applying `text-transform: uppercase` to all content | Latin UI styling is generalized to other scripts | Keep transforms limited to suitable labels and editorial contexts |
| Ignoring font licensing and source quality | A font is chosen only by appearance | Verify rights, script coverage, file quality, and production distribution requirements |

**Before → After**

```css
/* Before: global Latin assumptions and physical geometry. */
body { font-family: "Brand Latin", sans-serif; letter-spacing: -0.02em; }
.card { padding-left: 24px; text-align: left; }
p { word-break: break-all; }

/* After: script-aware fallbacks and direction-aware geometry. */
body {
  font-family: "Brand Latin", "Noto Sans", system-ui, sans-serif;
  letter-spacing: normal;
}
.card {
  padding-inline: 1.5rem;
  text-align: start;
}
p { overflow-wrap: normal; }
.long-identifier { overflow-wrap: anywhere; }
```

---

## Mental Models

1. **Language metadata is layout data** — Correct `lang` and `dir` values help the browser and assistive technology interpret the text appropriately.
2. **Font coverage is a contract** — Every supported script must have a deliberate rendering path, including fallback behavior.
3. **Shaping belongs to the text engine** — Preserve Unicode text and correct metadata instead of manually spacing or rearranging glyphs.
4. **Direction is not alignment** — `text-align: right` does not replace `dir="rtl"` or logical layout properties.
5. **Translated text is real content, not a test string** — Build components that tolerate longer labels, different word boundaries, and mixed scripts.
6. **Fallbacks are part of the design** — A fallback font is a normal production state that should be inspected, not an exceptional failure.
7. **Bidi isolation is a boundary** — A URL or order number should not inherit unintended visual ordering from the surrounding sentence.
8. **One CSS rule rarely fits every script** — Share semantic roles, but scope typographic adjustments to actual language and script needs.

---

## Quick Reference

| Need | Recommended starting point | Notes |
|---|---|---|
| Document language | `<html lang="en">` | Use the actual primary language |
| Embedded language change | `<span lang="ja">...</span>` | Annotate meaningful language changes |
| RTL document or component | `dir="rtl"` | `lang` does not automatically set direction |
| Unknown user-generated direction | `dir="auto"` | Test values beginning with neutral punctuation |
| Mixed-direction inline fragment | `<bdi dir="ltr">...</bdi>` | Useful for IDs, emails, and URLs inside RTL copy |
| Direction-aware spacing | `padding-inline`, `margin-inline` | Prefer logical over physical properties |
| Leading border | `border-inline-start` | Adapts to direction |
| Script fallback | Explicit stack plus `system-ui, sans-serif` | Verify coverage on representative platforms |
| Latin display tracking | Scope to the display component | Do not apply globally |
| Japanese/Chinese line breaking | Test `line-break` behavior with real copy | Browser support and typography conventions vary |
| English long-form hyphenation | `lang="en"` with `hyphens: auto` | Depends on browser support and dictionaries |
| Long URL or identifier | `overflow-wrap: anywhere` | Apply to targeted elements |
| Translation expansion | Content-driven height and wrapping | Avoid fixed widths/heights around labels |
| Mixed font metrics | Inspect fallback faces and line boxes | Metric overrides need measured tuning |
| Vertical rhythm | Test actual font and script | Avoid universal line-height assumptions |
| Font loading | `font-display` plus robust fallback | Test blocked and slow network conditions |
| Multilingual QA | Representative language/script matrix | Include long strings and mixed direction |
| Accessibility | Correct language metadata and semantic DOM | Visual appearance alone is insufficient |
| Icon direction | Decide by semantic meaning | Do not mirror every graphic in RTL |
| User content | Safe text rendering, direction, and overflow handling | Typography rules do not replace security controls |

---

## Build Challenge

### Build: Multilingual Product Landing Page and Localized Account Panel

Create a responsive landing page and account-detail panel that can display English, Arabic, Hebrew, Hindi, Japanese, and Thai content. The task is to prove that the layout works with actual script behavior and longer localized strings—not merely to switch the heading text.

**Requirements**

1. Declare the document’s primary language with `lang` and mark each embedded language change.
2. Add an explicit RTL example with `dir="rtl"` and an LTR identifier isolated using `bdi`.
3. Create a font stack with deliberate fallbacks for every supported script; document which font files are actually loaded and why.
4. Use logical CSS properties for spacing, alignment, and borders in reusable components.
5. Scope any tracking, line-height, hyphenation, or line-break adjustment to a tested language/script context.
6. Add a long URL or identifier case and prevent overflow without breaking ordinary prose into arbitrary character fragments.
7. Create a navigation and primary action whose dimensions can adapt to long translations.
8. Test short and long translated labels, including a string that expands substantially beyond the English original.
9. Include mixed-script paragraphs containing Latin text, numbers, punctuation, and one RTL language.
10. Render user-generated content as text and demonstrate a suitable direction strategy for unknown language input.
11. Check font fallback by blocking the preferred font and inspect baseline, glyph shape, line-height, and wrapping.
12. Test at narrow mobile width, desktop width, and 200% zoom.
13. Verify keyboard focus, screen-reader language metadata, and correct semantic headings and landmarks.
14. Review each supported language for shaping, punctuation, line breaks, and clipping with native or fluent-language review where possible.
15. Document browser and operating-system differences that affect font availability or line breaking.

**Expected output**

- A working responsive page with language-aware metadata and direction.
- A reusable component system that uses logical properties and content-driven sizing.
- A QA matrix covering each supported script, mixed-direction text, long translations, font fallback, and zoom.
- No manual spacing hacks, arbitrary glyph reordering, or global Latin tracking rules.

**Failure scenarios to deliberately test**

- The brand font loads for Latin but lacks a glyph needed in a localized name.
- An Arabic paragraph includes an email address and a Latin order number.
- A translated CTA becomes twice as long as the English version.
- A Thai paragraph wraps in a browser with different word-segmentation behavior.
- A long URL appears inside a narrow card.
- A user-generated comment begins with punctuation before RTL characters.
- A fallback font changes the baseline and increases the line box height.
- The page is viewed in an RTL locale with a logo and directional arrow that should not both be mirrored.

The build is complete when each supported language remains understandable, correctly shaped, directionally coherent, and layout-safe under those failure conditions. A single screenshot of the English desktop page is not evidence of multilingual readiness.
