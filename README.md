# [Challenge 6] Urban Air Quality Assistant — AeroPulse

**AeroPulse** is a context-aware, responsive Urban Air Quality Assistant built for **Challenge 6**. It transforms live atmospheric pollutant data into personalized, real-world health and activity decisions based on who you are, what you are doing, how long you will be exposed, and whether you are indoors or outdoors.

---

## Chosen Vertical
- **Vertical:** `[Challenge 6] Urban Air Quality Assistant`
- **Target Use Case:** Helping urban residents, commuters, athletes, and sensitive groups (asthma, children, elderly) make safe daily decisions about outdoor exercise, mask usage, indoor ventilation, and optimal activity timing.

---

## Approach & Logic

Unlike static AQI dashboards that only show a raw number, AeroPulse runs a **Context-Aware Decision Engine** (`src/engine/decisionEngine.ts`) that combines environmental telemetry with user context:

1. **Base AQI & Dominant Pollutant Normalization:**
   - Fetches live `us_aqi`, `pm2_5`, `pm10`, `o3`, `no2`, `so2`, and `co` from the Open-Meteo Air Quality API.
   - Normalizes each pollutant against WHO guideline thresholds to identify the primary respiratory driver.
2. **Personalized Exposure Risk Score (0–100):**
   - Adjusts base AQI risk using four contextual multipliers:
     - **Persona Sensitivity:** General Adult (`1.0x`), Commuter (`1.15x`), Outdoor Athlete (`1.25x`), Child/Elderly (`1.40x`), Asthma/Respiratory (`1.55x`).
     - **Activity Intensity:** Resting (`0.75x`), Light Walk (`1.0x`), Commute (`1.20x`), Moderate Exercise (`1.35x`), Vigorous Workout (`1.60x`).
     - **Environment:** Outdoors (`1.0x`), Indoors Natural Ventilation (`0.68x`), Indoors HEPA/AC Filtered (`0.28x`).
     - **Duration:** 15m (`0.80x`), 30m (`0.95x`), 1h (`1.10x`), 2h (`1.28x`).
3. **Optimal Clean Window Finder:**
   - Scans the next 24 hours of hourly AQI forecasts to locate the cleanest contiguous window matching the user's planned duration and calculates the percentage improvement over current conditions.
4. **Actionable Guidance & Assistant Q&A:**
   - Generates tailored recommendations for activity pacing, N95/KN95 mask selection, window ventilation vs. HEPA filtration, and sensitivity precautions, plus an interactive Q&A panel.

---

## How the Solution Works

```text
City Search / Preset ──▶ Open-Meteo Geocoding & Air Quality API (with 15m cache + offline fallback)
                                      │
                                      ▼
User Context (Persona, Activity, Duration, Environment) ──▶ Decision Engine ──▶ Verdict, Risk Score, Optimal Window, Action Plan & Chat Q&A
```

- **Frontend:** React 19 + TypeScript + Vite with custom CSS variables for **Dark / Light Mode** and responsive mobile-first layouts.
- **Resilience:** 15-minute `localStorage` caching and built-in offline baseline snapshots for 6 major global cities ensure zero downtime even without network access.
- **Documentation:** See [docs/PRD.md](docs/PRD.md) for the full Product Requirements Document and [docs/FLOWCHART.md](docs/FLOWCHART.md) for Mermaid architecture diagrams.

---

## Assumptions Made
1. **No API Keys Required:** Open-Meteo's public Air Quality & Geocoding APIs are used so the app runs out-of-the-box without exposing secrets.
2. **US EPA AQI Scale:** Air quality categories follow standard US EPA AQI breakpoints (0–50 Good, 51–100 Moderate, 101–150 USG, 151–200 Unhealthy, 201–300 Very Unhealthy, 301+ Hazardous).
3. **Educational / Advisory Scope:** Risk scores and health recommendations are heuristic decision-support tools and do not replace medical advice from a healthcare professional.

---

## Local Development & Testing

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run unit & component tests
npm test

# Type-check and build for production
npm run build
```

---

## Deployment

The project is pre-configured for zero-config static deployment or containerized hosting:
- **Vercel:** Includes `vercel.json` with SPA routing and security headers.
- **Netlify:** Includes `netlify.toml` with build command, publish directory (`dist`), and security headers.
- **Docker:** Includes multi-stage `Dockerfile` (Node 22 build + Nginx Alpine serve).
