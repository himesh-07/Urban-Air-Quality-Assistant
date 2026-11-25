# Product Requirements Document (PRD)
## Project: [Challenge 6] Urban Air Quality Assistant — AeroPulse

### 1. Executive Summary
**AeroPulse** is a context-aware Urban Air Quality Assistant designed to translate raw atmospheric pollutant measurements into personalized, actionable health and activity decisions. Instead of showing static AQI numbers, AeroPulse evaluates **who the user is** (health sensitivity/persona), **what they plan to do** (activity intensity), **for how long** (duration), and **where** (outdoors vs. indoor filtered/unfiltered), alongside a 24-hour forecast to recommend the safest actions and cleanest time windows.

---

### 2. Problem Statement & Chosen Vertical
- **Challenge Vertical:** `[Challenge 6] Urban Air Quality Assistant`
- **Core Problem:** Urban residents frequently misjudge air quality risks because generic AQI badges ignore individual vulnerability (e.g., asthma, children, athletes), breathing rate during exercise, indoor filtration, and diurnal pollution swings.
- **Solution:** A lightweight, responsive web assistant that combines live Open-Meteo Air Quality & Geocoding APIs with a deterministic, transparent contextual risk engine and interactive Q&A.

---

### 3. Target Personas
1. **General Adult:** Baseline respiratory sensitivity; needs quick go/no-go guidance for walks and errands.
2. **Outdoor Athlete:** High minute ventilation during runs/workouts; needs intensity adjustments and optimal clean-air windows.
3. **Asthma / Respiratory Sensitive:** Elevated airway sensitivity to PM2.5, O₃, and NO₂; needs early warnings, N95 guidance, and indoor air alerts.
4. **Child / Elderly:** Vulnerable cardiopulmonary profile; needs conservative exposure thresholds.
5. **Daily Commuter:** Exposed to roadside traffic corridors (NO₂, PM2.5); needs mask and route/timing advice.

---

### 4. Functional Requirements
| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-1 | **Live City Search & Presets:** Search any global city via Open-Meteo Geocoding API + instant preset city pills. | P0 | Implemented |
| FR-2 | **Real-Time AQI & Pollutant Breakdown:** Display US AQI gauge, category badge, and 6 pollutants (PM2.5, PM10, O₃, NO₂, SO₂, CO) with dominant pollutant tagging. | P0 | Implemented |
| FR-3 | **Context-Aware Decision Engine:** Dynamically compute Personalized Exposure Risk (0–100), verdict, mask advice, ventilation advice, and tailored action plan from Persona + Activity + Duration + Environment. | P0 | Implemented |
| FR-4 | **24-Hour Forecast & Optimal Window Finder:** Visualize 24-hour AQI outlook and highlight the cleanest upcoming time window. | P0 | Implemented |
| FR-5 | **Interactive Assistant Q&A:** Conversational panel with quick-prompt chips and natural language query routing. | P1 | Implemented |
| FR-6 | **Dark / Light Mode:** Theme toggle persisted in `localStorage` with `prefers-color-scheme` detection. | P1 | Implemented |
| FR-7 | **Offline Resilience & Caching:** 15-minute `localStorage` TTL cache + automatic baseline fallback if offline. | P1 | Implemented |

---

### 5. Non-Functional Requirements
- **Performance & Efficiency:** Static SPA bundle under 300 KB gzipped; debounced search (280 ms); 15-minute API cache; repository size well under 10 MB.
- **Security:** Zero hardcoded secrets; strict input sanitization on city search; `AbortController` timeouts (6.5s) on external fetches; security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `CSP`) configured for deployment.
- **Accessibility (WCAG 2.1 AA):** Semantic landmarks, skip-to-content link, `aria-live="polite"` regions, keyboard-navigable dropdowns, `prefers-reduced-motion` support, and high-contrast light/dark palettes.
- **Responsiveness:** Mobile-first fluid grid supporting 320px mobile, tablet, and 1280px+ desktop viewports.

---

### 6. Success Metrics
- All unit and component tests pass (`vitest run`).
- Zero TypeScript errors (`tsc --noEmit`) and clean production build (`vite build`).
- Single-branch (`main`) public GitHub repository under 10 MB, ready for one-click deployment on Vercel, Netlify, or Docker.
