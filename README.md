# NEXUS — AI. Data. Web. Built to Scale.

High-performance digital engineering agency website built precisely to the specifications in [`build plan.md`](./build%20plan.md) and the cyberpunk / neon noir reference aesthetic.

![Hero Preview](file:///Users/varadpendkar/.gemini/antigravity-ide/brain/ebd21726-e4c9-4316-b7ec-66ef4fb75779/nexus_hero_top_1792761593977.png)

---

## ⚡ Architecture Overview

```
nexus/
├── frontend/                     # React 18 + Vite + TypeScript
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/           # Navbar, Footer
│   │   │   ├── sections/         # Hero, ServiceCards, StatsBar, SelectedWork,
│   │   │   │                     # ServicesDeepDive, WhyNexus, ProcessSection,
│   │   │   │                     # TeamSection, CtaSection, ContactModal, CaseStudyModal
│   │   │   ├── three/            # Interactive Particle Network (Canvas / WebGL)
│   │   │   └── ui/               # CustomCursor, LoadingScreen
│   │   ├── lib/                  # lenis.ts (GSAP ticker bridge), gsap.ts
│   │   ├── store/                # Zustand global state (cursor, modal, filter)
│   │   └── styles/               # tokens.css, index.css
│   └── vite.config.ts
│
└── backend/                      # FastAPI (Python 3)
    ├── app/
    │   ├── main.py               # FastAPI application with CORS
    │   ├── config.py             # Settings (Resend, Supabase)
    │   ├── models/               # Pydantic contact and lead schemas
    │   ├── routers/              # POST /api/contact, GET /api/leads
    │   └── services/             # email.py (Resend), supabase.py (Lead persistence)
    └── requirements.txt
```

---

## 🎨 Implemented Features & Design Tokens

1. **Exact Visual Match to Demo Reference**:
   - `[ NEXUS ]` monospace brackets logo
   - Navigation: `WORK`, `SERVICES`, `ABOUT`, `INSIGHTS`, `[ LET'S TALK ]`
   - Monospace label: `TECHNOLOGY × CREATIVITY × IMPACT`
   - Massive typography: `NEXUS` in bold Space Grotesk
   - Accent subheadline: `AI. Data. Web. Built to scale.` in `#caff00`
   - Glowing interactive pulse node near tagline
   - Right copy: *"We build digital products powered by AI and data to help businesses scale faster."* with `[ 01 ]`
   - Bottom anchors: `[ SCROLL TO EXPLORE ]` with animated arrow + `IDEAS → PRODUCTS → GROWTH`
   - Luminous edge-to-edge horizontal lime divider line

2. **Bento Service Cards `[ 01 ]` & `[ 02 ]`**:
   - Chamfered tech-cut corners with lime border
   - Top index + diagonal arrow `↗` with magnetic hover state
   - `[ 01 ] AI & DATA SOLUTIONS`
   - `[ 02 ] WEB & DIGITAL PRODUCTS`
   - Technical tags: `MACHINE LEARNING / ANALYTICS / AUTOMATION`, etc.

3. **Motion & Interaction Systems**:
   - **Lenis Smooth Scroll**: Driven directly by the GSAP ticker (zero jank).
   - **Interactive Particle Network**: Canvas mesh with distance-based connective lines and cursor repulsion.
   - **Custom Cyber Cursor**: Glowing `#caff00` dot with spring-lagging aura ring that expands and displays contextual text labels.
   - **Monospace Loading Screen**: Types `[ NEXUS ]`, fills lime progress bar, and sweeps upward.

4. **Inner Capabilities & Case Studies**:
   - **Stats Bar**: Tabular-nums count-up (`14+ PROJECTS DELIVERED / 4 SPECIALIZED EXPERTS / 3 CORE INDUSTRIES / ₹0 WASTED EFFORT`).
   - **Selected Work**: Interactive portfolio with filter pills (`ALL`, `WEB`, `AI`, `DATA`, `CREATOR`) and modal inspector.
   - **Services Accordion**: 7 deep-dive engineering capabilities with deliverables and tech stacks.
   - **Why Nexus**: 3 core technical pillars (Velocity, AI Depth, Zero Bloat).
   - **Team Section**: Leadership profiles for Varad Pendkar, Atharva, Creative Tech, and Product Architect.
   - **Process Section**: 4-phase execution pipeline (Discovery, Working Prototype, Production Hardening, Deploy & Scale).
   - **Multi-Step Contact Modal**: 2-stage project inquiry form connected to the FastAPI `/api/contact` endpoint.

---

## 🚀 Running the Project

### Frontend
```bash
cd frontend
npm install
npm run dev
# Live on http://localhost:5173
```

### Backend (FastAPI)
```bash
cd backend
python3 -m pip install -r requirements.txt
python3 -m uvicorn app.main:app --reload --port 8000
# Live on http://localhost:8000 (Docs at http://localhost:8000/docs)
```

Or run both simultaneously:
```bash
./start.sh
```
