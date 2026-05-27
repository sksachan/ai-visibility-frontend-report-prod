# AI Visibility Frontend Report (Production)

A production-ready executive report frontend that renders AI Visibility Intelligence Reports from the evidence service. Built with React + TypeScript + Vite, served by Express with same-origin API proxy routes.

## Overview

This frontend:
- Fetches the **latest successful evidence run** on page load
- Renders a **board-ready executive report** matching the reference HTML
- Supports **previous run selection** via dropdown
- Generates **server-side PDF** via Playwright/Chromium
- Proxies all API calls through same-origin routes (no CORS issues)

## Prerequisites

- Node.js 18+ (recommended: 20+)
- npm 9+

## Quick Start

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start the production server
npm start
```

The app will be available at `http://localhost:4173`.

## Development

```bash
# Start Vite dev server (port 5173)
# API calls are proxied to localhost:4173
npm run dev

# In a separate terminal, start the Express server
node server.js
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `EVIDENCE_SERVICE_URL` | Yes | — | Base URL of the evidence service |
| `DEFAULT_BRAND` | No | `Nissan` | Default brand for initial load |
| `DEFAULT_MARKET` | No | `Japan` | Default market for initial load |
| `PORT` | No | `4173` | Server port |
| `NODE_ENV` | No | — | Set to `production` for Railway |

### Example `.env`

```env
EVIDENCE_SERVICE_URL=https://ai-visibility-evidence-service-staging-staging.up.railway.app
DEFAULT_BRAND=Nissan
DEFAULT_MARKET=Japan
PORT=4173
```

## API Routes

All routes are served by the Express server and proxy to the evidence service:

| Route | Method | Description |
|---|---|---|
| `/api/report/latest?brand=&market=` | GET | Latest successful report |
| `/api/report/runs?brand=&market=` | GET | List of previous successful runs |
| `/api/report/:runId` | GET | Specific report by run ID |
| `/api/report/:runId/pdf` | GET | PDF download (server-side Chromium) |

## Report Sections

The report renders these sections in order:

1. **Cover** — Brand headline, visibility matrix, metadata
2. **Executive Summary** — Key findings with numbered cards
3. **Brand Topics and Citation Research** — Topic scorecard, priority themes, query examples
4. **Owned Page AI Discovery Audit** — Page readiness, dimension scores, CMS recommendations
5. **Third-Party and Non-Branded Media Influence** — Source landscape, PR opportunities
6. **Recommended Action Plan** — 90-day roadmap

## Project Structure

```
ai-visibility-frontend-report-prod/
├── server.js                    # Express server (proxy + PDF + static)
├── index.html                   # Vite entry HTML
├── package.json
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
├── tsconfig.app.json
└── src/
    ├── main.tsx                 # React entry
    ├── App.tsx                  # Root component
    ├── index.css                # All styles (matches reference HTML)
    ├── pages/
    │   └── ReportPage.tsx       # Main page: auto-fetch + run selector
    ├── components/
    │   └── RunSelector.tsx      # Run dropdown + PDF download button
    ├── report/
    │   ├── ReportDocument.tsx   # Assembles all sections
    │   └── sections/
    │       ├── CoverSection.tsx
    │       ├── ExecutiveSummarySection.tsx
    │       ├── BrandTopicsSection.tsx
    │       ├── OwnedPageAuditSection.tsx
    │       ├── ThirdPartyInfluenceSection.tsx
    │       └── ActionPlanSection.tsx
    └── lib/
        ├── api.ts               # API client (same-origin calls)
        ├── normaliseReport.ts   # Raw JSON → typed view model
        ├── normaliseReport.test.ts
        └── format.ts            # Formatting utilities
```

## PDF Generation

PDF is generated server-side using Playwright/Chromium:

1. The server launches a headless Chromium browser
2. Navigates to the report page with the specified run ID
3. Waits for the report to render
4. Generates an A4 PDF with print backgrounds and margins
5. Returns the PDF as a downloadable file

### Installing Playwright browsers

On first deploy or after Playwright version changes:

```bash
npx playwright install chromium
```

For Railway/Docker, ensure the Chromium dependencies are available in the container.

## Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch
```

Tests cover:
- Real evidence fixture normalisation
- Missing fields graceful handling
- Competitor matrix normalisation
- Empty input handling
- Wrapped bundle unwrapping

## Report Loading Behaviour

1. **Initial load**: Fetches latest successful run automatically
2. **URL with `?runId=`**: Fetches that specific run
3. **Run selector**: Switch between previous runs (URL updates)
4. **Missing data**: Shows "Not available in this run" per section
5. **No mock data**: Never fabricates metrics

## Deployment (Railway)

1. Set environment variables in Railway dashboard
2. Build command: `npm run build`
3. Start command: `npm start`
4. Ensure `EVIDENCE_SERVICE_URL` is set

## Validation Checklist

- [ ] `npm install` succeeds
- [ ] `npm run build` succeeds with no errors
- [ ] `npm start` serves the app
- [ ] Latest report loads on page load
- [ ] `/?runId=evidence_nissan_japan_1779831449_573f03` loads that specific run
- [ ] Run selector shows history and switches reports
- [ ] PDF download generates a readable multi-page PDF
- [ ] No runtime errors in browser console
- [ ] No `node_modules`, `dist`, `.env`, or `*.tsbuildinfo` committed
