Got everything. 160+ skill files mapped. Now synthesizing the full build
plan using every relevant skill layer.

Full picture now. 160 skill files across 20+ layers all mapped. Building
the full plan now.

------------------------------------------------------------------------

# NEXUS --- Full Technical Build Plan

**Stack Decision:** React (Vite) + FastAPI backend + all skill layers
applied

------------------------------------------------------------------------

## ARCHITECTURE DECISION

    Frontend  → React 18 + Vite + TypeScript
    Styling   → Tailwind CSS + CSS custom properties
    3D        → React Three Fiber (R3F) + @react-three/drei
    Scroll    → Lenis (single instance, GSAP ticker integrated)
    Animation → GSAP + ScrollTrigger + SplitText + Framer Motion
    Routing   → React Router v6
    State     → Zustand (global) + URL state (nuqs)
    Backend   → FastAPI (Python) — contact form, email, CMS API
    DB        → Supabase (PostgreSQL) — case studies, contact leads
    Email     → Resend API via FastAPI
    Deploy    → Frontend → Vercel | Backend → Railway

**Why FastAPI over Node?** Team has Python/ML depth (Varad + Atharva).
FastAPI handles contact form, lead capture, future AI chatbot endpoint,
and Python data scripts natively. Frontend stays pure React/Vite --- no
Next.js overhead for a marketing site.

------------------------------------------------------------------------

## FOLDER STRUCTURE

    nexus/
    ├── frontend/                    ← React + Vite
    │   ├── src/
    │   │   ├── components/
    │   │   │   ├── ui/              ← Button, Card, Badge, Tag
    │   │   │   ├── layout/          ← Nav, Footer, PageTransition
    │   │   │   ├── three/           ← R3F scenes per section
    │   │   │   └── sections/        ← per-page section components
    │   │   ├── hooks/
    │   │   │   ├── useLenis.ts      ← single Lenis instance
    │   │   │   ├── useScrollTrigger.ts
    │   │   │   ├── useCursor.ts
    │   │   │   └── useReducedMotion.ts
    │   │   ├── lib/
    │   │   │   ├── gsap.ts          ← plugin registration
    │   │   │   └── lenis.ts         ← lenis + GSAP ticker bridge
    │   │   ├── pages/               ← Home Work About Process Contact
    │   │   ├── store/               ← Zustand: cursor, nav, theme
    │   │   ├── styles/              ← tokens.css + reset.css
    │   │   └── App.tsx
    │   └── vite.config.ts
    │
    └── backend/                     ← FastAPI
        ├── app/
        │   ├── main.py
        │   ├── routers/
        │   │   ├── contact.py       ← POST /api/contact
        │   │   └── leads.py         ← GET /api/leads (admin)
        │   ├── models/              ← Pydantic schemas
        │   ├── services/
        │   │   ├── email.py         ← Resend API
        │   │   └── supabase.py      ← DB writes
        │   └── config.py            ← env vars
        └── requirements.txt

------------------------------------------------------------------------

## DESIGN TOKENS --- CSS Variables System

*(from `css-variables-system-SKILL.md` + `dark-mode-system-SKILL.md`)*

``` css
/* styles/tokens.css */
:root {
  /* Colors */
  --c-bg:         #050505;
  --c-surface:    #0D0D0D;
  --c-card:       #111111;
  --c-border:     #1A1A1A;
  --c-accent:     #CAFF00;
  --c-accent-dim: rgba(202,255,0,0.15);
  --c-white:      #FFFFFF;
  --c-gray-1:     #888888;
  --c-gray-2:     #444444;

  /* Typography Scale — fluid via clamp() */
  --fs-display:   clamp(5rem,   11vw, 10rem);   /* NEXUS hero */
  --fs-h1:        clamp(2.5rem,  5vw,  4.5rem);
  --fs-h2:        clamp(1.75rem, 3vw,  2.5rem);
  --fs-h3:        clamp(1.25rem, 2vw,  1.75rem);
  --fs-body:      clamp(0.9rem,  1.2vw, 1.1rem);
  --fs-small:     clamp(0.7rem,  1vw,  0.85rem);
  --fs-mono:      clamp(0.7rem,  1vw,  0.8rem);

  /* Fonts */
  --font-display: 'Space Grotesk', sans-serif;
  --font-mono:    'JetBrains Mono', monospace;

  /* Spacing — 4px base */
  --sp-1: 0.25rem; --sp-2: 0.5rem; --sp-3: 0.75rem;
  --sp-4: 1rem;    --sp-6: 1.5rem; --sp-8: 2rem;
  --sp-12: 3rem;   --sp-16: 4rem;  --sp-24: 6rem;

  /* Motion */
  --ease-out:     cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out:  cubic-bezier(0.87, 0, 0.13, 1);
  --dur-fast:     0.2s;
  --dur-mid:      0.5s;
  --dur-slow:     0.9s;

  /* Layout */
  --max-w: 1400px;
  --gutter: clamp(1.5rem, 5vw, 5rem);
  --radius-card: 4px;         /* sharp — Neon Noir */
  --border-card: 1px solid var(--c-accent);
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --dur-fast: 0s;
    --dur-mid: 0s;
    --dur-slow: 0s;
  }
}
```

------------------------------------------------------------------------

## LENIS + GSAP INTEGRATION

*(from `lenis-setup-SKILL.md` + `gsap-scrolltrigger-SKILL.md` --- single
owner pattern)*

``` ts
// src/lib/lenis.ts — ONE instance, GSAP ticker drives it
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let lenis: Lenis | null = null

export function initLenis() {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

  lenis = new Lenis({
    smoothWheel: !reduceMotion,
    lerp: reduceMotion ? 1 : 0.08,   // 0.08 = silky, not laggy
  })

  // GSAP ticker is the ONE driver — no separate RAF loop
  lenis.on('scroll', ScrollTrigger.update)
  const tick = (time: number) => lenis!.raf(time * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)

  return () => {
    gsap.ticker.remove(tick)
    lenis?.destroy()
    lenis = null
  }
}

export const getLenis = () => lenis
```

``` tsx
// src/hooks/useLenis.ts — React lifecycle wrapper
import { useEffect } from 'react'
import { initLenis } from '../lib/lenis'

export function useLenis() {
  useEffect(() => {
    const cleanup = initLenis()
    return cleanup
  }, [])
}
```

------------------------------------------------------------------------

## CUSTOM CURSOR SYSTEM

*(from `custom_cursor.md` + `cursor_trail_effects.md` +
`magnetic_button.md`)*

**Behavior:** - Small lime `#CAFF00` glowing dot, 8px - Outer ring 40px,
follows with lag (`lerp 0.12`) - On hover over links/cards → ring
expands to 60px + text label appears ("VIEW →") - On hover over CTA
buttons → magnetic pull effect (±8px max displacement) - Disappears on
touch devices (`pointer: coarse`) - Respects `prefers-reduced-motion` →
instant position, no lerp

``` tsx
// CursorStore (Zustand)
type CursorState = 'default' | 'hover' | 'drag' | 'text'
const useCursorStore = create<{
  state: CursorState
  label: string
  setState: (s: CursorState, label?: string) => void
}>(...)
```

------------------------------------------------------------------------

## PAGE TRANSITION SYSTEM

*(from `page-transition-kit-SKILL.md` + `exit-animation-patterns.md`)*

Between pages: **clip-path curtain wipe** in lime green `#CAFF00`

    Exit:  clip-path: inset(0 0 100% 0) → inset(0 0 0% 0)  [lime panel sweeps down]
    Enter: panel reverses + new page fades in from opacity 0
    Duration: 600ms total | ease: power3.inOut

Implementation: React Router `<Outlet>` wrapped in Framer Motion
`<AnimatePresence>` for route changes, GSAP for the curtain overlay.

------------------------------------------------------------------------

## SECTION-BY-SECTION BUILD PLAN

------------------------------------------------------------------------

### SECTION 0 --- LOADING SCREEN

*(from `loading_screen.md` + `gsap-text-animations-SKILL.md`)*

**What it does:** Appears for 2s on first load. Hides once fonts +
critical assets ready.

**UX:** - Black screen - `[ NEXUS ]` in monospace types out letter by
letter (GSAP SplitText + stagger 0.06s) - Slim lime progress bar beneath
fills 0→100% - Screen slides up (translateY -100%) to reveal hero

**Code pattern:**

``` tsx
// SplitText char stagger → progress bar fill → GSAP timeline exit
const tl = gsap.timeline({ onComplete: () => setLoaded(true) })
tl.to(chars, { opacity: 1, stagger: 0.06, duration: 0.3 })
  .to(progressBar, { scaleX: 1, duration: 1.2, ease: 'power2.inOut' })
  .to(loader, { yPercent: -100, duration: 0.7, ease: 'power3.inOut' })
```

------------------------------------------------------------------------

### SECTION 1 --- NAV

*(from `react-accessible-components.md` +
`mobile-navigation-patterns.md` + `focus-management-patterns.md`)*

**Desktop:** Fixed top. `[ NEXUS ]` left (monospace), center links (WORK
· SERVICES · ABOUT · INSIGHTS), `[ LET'S TALK ]` right with lime
border + magnetic hover.

**Scroll behavior:** On scroll past 80px → nav background gets
`backdrop-filter: blur(12px)` + border-bottom lime `1px`.

**Mobile:** Hamburger → fullscreen overlay. Menu items stagger in from
right. Closes on route change. Focus trapped in overlay. `aria-expanded`
toggled.

**Animation:** Nav items each have `overflow: hidden` wrapper → text
slides up on mount (GSAP from `y: 100%`). Stagger `0.05s`.

``` tsx
// Scroll-aware nav
lenis.on('scroll', ({ scroll }) => {
  nav.classList.toggle('scrolled', scroll > 80)
})
```

------------------------------------------------------------------------

### SECTION 2 --- HERO (Homepage)

*(from `type-as-design.md` + `gsap-text-animations-SKILL.md` +
`r3f-setup.md` + `gsap-scrolltrigger-SKILL.md` +
`canvas-particle-system.md`)*

**Layout:** Full viewport. Black bg.

**Left column (60%):** - `TECHNOLOGY × CREATIVITY × IMPACT` ---
monospace, small, `#888` --- fades in first - `NEXUS` --- display font,
`clamp(5rem, 11vw, 10rem)`, white --- GSAP SplitText, lines reveal from
bottom (clipPath `inset(0 0 100% 0)` → `inset(0 0 0% 0)`) - Lime tagline
`AI. Data. Web. Built to scale.` --- word-by-word stagger -
`[ SCROLL TO EXPLORE ]` + animated arrow bouncing

**Right column (40%):** - R3F Canvas --- floating particle network
(React Three Fiber) - Custom GLSL shader: lime green nodes (#CAFF00),
dark bg nodes, connecting lines, pulsing - `useFrame` rotates slowly,
`useSpring` reacts to cursor position - Mobile: Canvas hidden, replaced
with CSS dot-grid pattern

**Scroll animation (GSAP ScrollTrigger):** - On scroll: NEXUS text
scales up slightly + gets `opacity: 0.1` → feels like scrolling past
it - Particle scene translates upward

**R3F scene:**

``` tsx
// ParticleNetwork.tsx
function ParticleNetwork() {
  const count = 120
  // BufferGeometry with random positions
  // LineSegments connecting nearby particles
  // Shader: color #CAFF00 for nodes, dim for lines
  // useFrame: slow rotation + cursor lerp
}
```

------------------------------------------------------------------------

### SECTION 3 --- VALUE STRIP (Scroll-triggered divider)

*(from `gsap-scrolltrigger-SKILL.md` + `scroll-reveal-patterns.md`)*

**Layout:** Full-width lime border-top. Dark panel.

**Content:** `IDEAS → PRODUCTS → GROWTH` spaced across width. Right:
small descriptor text.

**Animation:** As it enters viewport → each word slides in
left-to-right, 0.15s stagger. Arrow between words draws (SVG path stroke
animation).

------------------------------------------------------------------------

### SECTION 4 --- SERVICE CARDS (Homepage preview)

*(from `accordion-tabs-patterns.md` + `hover_reveal_patterns.md` +
`framer-motion-patterns-SKILL.md`)*

**Layout:** 2-column grid. Two large cards with `1px solid #CAFF00`
border.

**Card anatomy:**

    [ 01 ]        ↗
    AI & DATA SOLUTIONS
    Turn complex data into real business value.

    MACHINE LEARNING / ANALYTICS / AUTOMATION

**Hover state:** Card background shifts from `#111` → `#CAFF00` (lime).
Text inverts to black. Arrow rotates 45°. Duration:
`0.3s cubic-bezier(0.87, 0, 0.13, 1)`.

**Animation on scroll:** Cards slide in from bottom, stagger 0.2s.
`ScrollTrigger` with `scrub: false`,
`toggleActions: 'play none none reverse'`.

------------------------------------------------------------------------

### SECTION 5 --- STATS BAR

*(from `number_countup.md` + `stagger-choreography-SKILL.md`)*

**Content:** `14 PROJECTS / 4 EXPERTS / 3 INDUSTRIES / ₹0 WASTED`

**Animation:** On IntersectionObserver trigger → numbers count up from 0
using GSAP `countUp` pattern. `font-variant-numeric: tabular-nums` keeps
widths stable.

``` tsx
// GSAP countUp
gsap.to(counter, {
  innerText: targetVal,
  snap: { innerText: 1 },
  duration: 2,
  ease: 'power2.out',
  scrollTrigger: { trigger: section, start: 'top 80%' }
})
```

------------------------------------------------------------------------

### SECTION 6 --- SELECTED WORK (Portfolio grid)

*(from `hover_reveal_patterns.md` + `clip-path-animation.md` +
`gsap-scrolltrigger-SKILL.md`)*

**Layout:** 3 project tiles. Alternating sizes --- 1 large (60%) + 2
small (40%).

**Each tile:** - Dark placeholder (real screenshot later) - Project name
in white bold - Service tag in lime pill - Hover → clip-path reveal:
lime overlay slides in from left, shows "VIEW CASE STUDY ↗" in black
text - Cursor changes to `hover` state (ring expands, shows "VIEW")

**Scroll animation:** Tiles stagger in from `y: 60px, opacity: 0`. Scrub
off --- plays once.

------------------------------------------------------------------------

### SECTION 7 --- WHY NEXUS

*(from `visual-hierarchy.md` + `scroll-reveal-patterns.md`)*

**Layout:** 3-column grid. Each column: number in large dim lime (`01`),
title bold white, 2-sentence body gray.

**Animation:** Columns revealed with stagger. Number fades in large then
dims. Text slides up beneath it.

------------------------------------------------------------------------

### SECTION 8 --- TEAM TEASER

*(from `stagger-choreography-SKILL.md` +
`framer-motion-patterns-SKILL.md`)*

**Layout:** 4 cards in a row (Image 1 style from earlier session). Dark
glassmorphic, `1px` lime border, rounded `4px`.

**Each card:** Circular photo, name bold, role dim gray, 2 skill pills.

**Animation:** Cards scale from `0.85 → 1`, opacity `0 → 1`, stagger
`0.12s`. Spring physics via `react-use-spring`.

**Hover:** Card lifts slightly (`translateY: -4px`), border glows
brighter.

------------------------------------------------------------------------

### SECTION 9 --- CTA

*(from `cta-placement.md` + `magnetic_button.md` + `liquid_button.md`)*

**Layout:** Full-width dark panel. Large centered text:
`[ LET'S BUILD SOMETHING ]`. Two buttons below.

**Primary button:** `[ BOOK A CALL ]` --- lime fill, black text.
Magnetic hover (±8px pull). On click → Calendly opens.

**Secondary:** `[ SEE OUR WORK ]` --- ghost, lime border.

**Background:** Subtle GLSL noise shader shifting slowly (from
`noise-based-design.md`) --- gives life without distraction.

------------------------------------------------------------------------

### SECTION 10 --- FOOTER

*(from `seo-conversion/portfolio-seo.md`)*

**Layout:** Logo left. Nav links center. Socials right. Bottom row:
`© 2025 NEXUS · Crafted in Pune` + `↑ Back to top`.

**Back to top:**
`lenis.scrollTo(0, { duration: 1.5, easing: (t) => 1 - Math.pow(1 - t, 5) })`

------------------------------------------------------------------------

## SERVICES PAGE `/services`

*(from `accordion-tabs-patterns.md` + `hover_reveal_patterns.md`)*

**Layout:** Full accordion list. Each row: `→` arrow icon + service name
large. Divider lines between.

**Expand behavior (one open at a time):** - Arrow rotates `90°` (→
becomes ↓) - Row height animates `0 → auto` via GSAP `height` tween (not
CSS transition --- more reliable) - Content panel reveals: left =
description + tech tags, right = illustrative visual (mock screenshot or
R3F mini-scene) - Framer Motion `AnimatePresence` for unmount animation

**7 services → each with:** - Service name (large white, 40px) - 2-line
description (gray) - Tech tag pills (monospace, dim border) - "Start
this project →" link (lime, small)

------------------------------------------------------------------------

## WORK PAGE `/work`

*(from `case-study-writer.md` + `search-ux-patterns.md`)*

**Filter bar:** Tags --- ALL · WEB · AI · DATA · CREATOR. Click →
filters grid. URL state sync (`?filter=ai`).

**Grid:** Masonry-style. Cards = dark, real screenshots, hover clip-path
reveal.

**Case study page `/work/[slug]`:**

    Hero image full-bleed
    ↓
    Problem (short paragraph)
    ↓
    Our role (badges: who did what)
    ↓
    Process (4-step horizontal timeline, animated with ScrollTrigger)
    ↓
    Visuals (real screenshots carousel)
    ↓
    Outcome (qualified stats, no fake %)
    ↓
    Next project → (link to next case study)

------------------------------------------------------------------------

## ABOUT PAGE `/about`

**Team section:** 4 cards, photo + role + bio + LinkedIn link. Cards
stagger in on scroll.

**Origin section:** 1 short paragraph. Animated background: slow-moving
canvas particle field.

**Values:** 3 columns, icon + title + text. Reveal on scroll.

------------------------------------------------------------------------

## PROCESS PAGE `/process`

*(from `onboarding-ux-patterns.md` + `scroll-driven-css-SKILL.md`)*

**Horizontal scroll section:** User scrolls down → section scrolls
horizontally through 4 steps. Implemented via GSAP `ScrollTrigger` +
`pin: true` + horizontal tween.

``` tsx
gsap.to(stepsTrack, {
  xPercent: -75,  // 4 steps × 25% each
  ease: 'none',
  scrollTrigger: {
    trigger: processSection,
    pin: true,
    scrub: 1,
    start: 'top top',
    end: '+=300%',
  }
})
```

Each step card: number (large dim), title, 3 bullets, owner badge.

------------------------------------------------------------------------

## CONTACT PAGE `/contact`

*(from `form-design-validation.md` + `feedback-response-patterns.md` +
`fastapi-python-backend.md`)*

**Multi-step form (2 steps):**

Step 1: Name + Email + Company Step 2: Service (checkboxes) + Budget
range (select) + Brief textarea

**Validation:** Zod schema client-side. Errors inline next to fields.
First error focused on submit.

**Submit → FastAPI:** `POST /api/contact` - FastAPI validates with
Pydantic - Writes to Supabase `leads` table - Sends email via Resend API
to team - Returns `{ message: "We'll be in touch within 24 hours" }`

**Success state:** Form fades out → success message animates in.
Calendly embed appears below.

**Form rules (Vercel guidelines applied):** - `autocomplete` on all
fields - `spellCheck={false}` on email - Never `preventDefault` on
paste - Submit button spinner during request - `aria-live="polite"` on
success/error

------------------------------------------------------------------------

## BACKEND --- FastAPI

*(from `fastapi-python-backend.md` + `restful-api-design.md` +
`supabase-setup.md`)*

``` python
# app/routers/contact.py
from fastapi import APIRouter, BackgroundTasks, HTTPException
from app.models.contact import ContactForm
from app.services.email import send_notification
from app.services.supabase import save_lead

router = APIRouter()

@router.post("/contact", status_code=201)
async def submit_contact(
  form: ContactForm,
  background_tasks: BackgroundTasks
):
  await save_lead(form)
  background_tasks.add_task(send_notification, form)
  return {"message": "Received. We'll respond within 24 hours."}
```

``` python
# app/models/contact.py
from pydantic import BaseModel, EmailStr
from typing import list

class ContactForm(BaseModel):
  name: str
  email: EmailStr
  company: str | None = None
  services: list[str]
  budget: str
  brief: str
```

------------------------------------------------------------------------

## ANIMATION MASTER TIMELINE

    PAGE LOAD
      t=0.0s  → Loader: NEXUS types out
      t=1.2s  → Progress bar fills
      t=2.0s  → Loader wipes up
      t=2.1s  → Nav slides down
      t=2.2s  → Hero label fades in
      t=2.4s  → NEXUS lines clip-reveal (0.4s each line, stagger 0.15s)
      t=2.9s  → Tagline words stagger in
      t=3.2s  → "SCROLL TO EXPLORE" fades in
      t=3.3s  → R3F particle network fades in (opacity 0→1, 0.5s)

    SCROLL: Section entries (all ScrollTrigger, start: 'top 80%')
      Value strip  → words slide in left-to-right
      Service cards → slide up from y:60, stagger 0.2s
      Stats        → numbers count up simultaneously
      Work tiles   → stagger scale 0.9→1 + opacity
      Team cards   → spring scale + stagger
      CTA          → text scramble (from text_scramble.md) then settles

    PAGE TRANSITIONS (between routes)
      Exit  → lime curtain sweeps DOWN (0.35s)
      Enter → curtain sweeps DOWN-OUT (0.25s) + new content fades in (0.2s)
      Total → 600ms feels premium, not slow

------------------------------------------------------------------------

## PERFORMANCE BUDGET

*(from `performance-budget.md` + `lighthouse-checklist.md` +
`mobile-performance.md`)*

  Metric       Target
  ------------ -----------------------------------------------------
  LCP          \< 1.8s
  FID          \< 100ms
  CLS          \< 0.05
  JS bundle    \< 250KB gzipped
  Fonts        2 families, `font-display: swap`
  R3F canvas   `dpr={[1, 1.5]}`, mobile fallback to canvas
  Images       WebP, `loading="lazy"` below fold, `priority` above
  Lenis        1 instance, 1 RAF driver (GSAP ticker)

**Critical font preload:**

``` html
<link rel="preload" as="font" href="/fonts/SpaceGrotesk-Bold.woff2" crossorigin>
<link rel="preload" as="font" href="/fonts/JetBrainsMono-Regular.woff2" crossorigin>
```

------------------------------------------------------------------------

## BUILD ORDER (Weeks)

    WEEK 1 — Foundation
      ✓ Vite + React + TS + Tailwind + folder structure
      ✓ Design tokens (CSS variables)
      ✓ Lenis + GSAP setup (lib/lenis.ts)
      ✓ Custom cursor system
      ✓ Nav component (desktop + mobile)
      ✓ Page transition curtain

    WEEK 2 — Hero + Home
      ✓ Loading screen
      ✓ Hero section (R3F particles + GSAP text reveal)
      ✓ Value strip + Service cards
      ✓ Stats + Work tiles
      ✓ Team teaser + CTA + Footer

    WEEK 3 — Inner Pages
      ✓ Services accordion page
      ✓ Work grid + filter
      ✓ About page
      ✓ Process horizontal scroll
      ✓ Contact form (client-side)

    WEEK 4 — Backend + Polish
      ✓ FastAPI setup + Supabase
      ✓ Contact form → API integration
      ✓ Mobile QA (all sections)
      ✓ Vercel UI guidelines audit
      ✓ Lighthouse pass
      ✓ Deploy (Vercel + Railway)

------------------------------------------------------------------------

## SKILLS MAPPED TO SECTIONS

  -----------------------------------------------------------------------
  Section                       Skills Used
  ----------------------------- -----------------------------------------
  Loader                        `loading_screen` · `gsap-text-animations`
                                · `stagger-choreography`

  Nav                           `react-accessible-components` ·
                                `mobile-navigation-patterns` ·
                                `focus-management`

  Hero                          `type-as-design` · `fluid-typography` ·
                                `r3f-setup` · `glsl-fundamentals` ·
                                `gsap-text-animations`

  Scroll system                 `lenis-setup` · `gsap-scrolltrigger` ·
                                `scroll-reveal-patterns`

  Cursor                        `custom_cursor` · `cursor_trail_effects`
                                · `magnetic_button`

  Cards                         `hover_reveal_patterns` ·
                                `framer-motion-patterns` ·
                                `clip-path-animation`

  Stats                         `number_countup` ·
                                `intersection-observer`

  Services accordion            `accordion-tabs-patterns` ·
                                `animation-state-machine`

  Process page                  `gsap-scrolltrigger` (pin+scrub) ·
                                `scroll-driven-css`

  Work grid                     `css-grid-layouts` · `search-ux-patterns`
                                · `url-state-management`

  Contact form                  `form-design-validation` ·
                                `feedback-response-patterns`

  Backend                       `fastapi-python-backend` ·
                                `supabase-setup` · `restful-api-design`

  Performance                   `performance-budget` ·
                                `lighthouse-checklist` ·
                                `mobile-performance`

  Transitions                   `page-transition-kit` ·
                                `exit-animation-patterns`

  Typography                    `type-as-design` · `fluid-typography` ·
                                `variable-fonts` ·
                                `type-on-dark-backgrounds`

  Accessibility                 `accessible-animation` ·
                                `keyboard-navigation-coding` ·
                                `focus-management-patterns` ·
                                `reduced-motion`
  -----------------------------------------------------------------------

------------------------------------------------------------------------
