import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 4173);
const distDir = path.join(__dirname, 'dist');

app.use(express.json({ limit: '30mb' }));

// ── Helpers ──────────────────────────────────────────────────────────────────

function env(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim()) return value.trim();
  }
  return '';
}

function evidenceBase() {
  return (env('EVIDENCE_SERVICE_URL') || '').replace(/\/+$/, '');
}

function defaultBrand() {
  return env('DEFAULT_BRAND') || 'Nissan';
}

function defaultMarket() {
  return env('DEFAULT_MARKET') || 'Japan';
}

// ── API Proxy Routes ─────────────────────────────────────────────────────────

/**
 * GET /api/report/latest?brand=Nissan&market=Japan
 * Proxies to evidence service latest successful report endpoint.
 */
app.get('/api/report/latest', async (req, res) => {
  const base = evidenceBase();
  if (!base) {
    return res.status(503).json({ error: 'EVIDENCE_SERVICE_URL is not configured.' });
  }

  const brand = String(req.query.brand || defaultBrand());
  const market = String(req.query.market || defaultMarket());
  const params = new URLSearchParams({ brand, market }).toString();

  // Try multiple endpoint patterns
  const urls = [
    `${base}/reports/latest-successful?${params}`,
    `${base}/runs/latest/report-bundle?${params}`,
    `${base}/runs/latest?${params}`,
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.text();
        res.type('application/json').send(data);
        return;
      }
    } catch (err) {
      // Try next URL
    }
  }

  res.status(502).json({
    error: 'Unable to fetch latest report from evidence service.',
    evidenceServiceUrl: base,
  });
});

/**
 * GET /api/report/runs?brand=Nissan&market=Japan
 * Returns previous successful runs.
 */
app.get('/api/report/runs', async (req, res) => {
  const base = evidenceBase();
  if (!base) {
    return res.status(503).json({ error: 'EVIDENCE_SERVICE_URL is not configured.' });
  }

  const brand = String(req.query.brand || defaultBrand());
  const market = String(req.query.market || defaultMarket());
  const params = new URLSearchParams({ brand, market, limit: '30' }).toString();

  try {
    const response = await fetch(`${base}/reports/history?${params}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    const text = await response.text();
    res.status(response.status).type('application/json').send(text);
  } catch (err) {
    res.status(502).json({
      error: err instanceof Error ? err.message : String(err),
      evidenceServiceUrl: base,
    });
  }
});

/**
 * GET /api/report/:runId
 * Returns a specific report bundle.
 */
app.get('/api/report/:runId/pdf', async (req, res) => {
  // PDF endpoint — must be before the generic :runId handler
  const runId = req.params.runId;
  const brand = String(req.query.brand || defaultBrand());
  const market = String(req.query.market || defaultMarket());

  let browser = null;
  try {
    const { chromium } = await import('playwright');
    browser = await chromium.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    // Navigate to the report page with the specific run ID
    const reportUrl = `http://localhost:${port}/?runId=${encodeURIComponent(runId)}`;
    await page.goto(reportUrl, { waitUntil: 'networkidle', timeout: 60000 });

    // Wait for the report to render
    await page.waitForSelector('#report-document', { timeout: 30000 });
    // Give extra time for any remaining renders
    await page.waitForTimeout(2000);

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
      preferCSSPageSize: false,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="AI_Visibility_Report_${brand}_${market}_${runId}.pdf"`
    );
    res.send(Buffer.from(pdfBuffer));
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({
      error: 'PDF generation failed.',
      details: err instanceof Error ? err.message : String(err),
    });
  } finally {
    if (browser) {
      await browser.close().catch((closeErr) => {
        console.error('Failed to close browser:', closeErr);
      });
    }
  }
});

app.get('/api/report/:runId', async (req, res) => {
  const base = evidenceBase();
  if (!base) {
    return res.status(503).json({ error: 'EVIDENCE_SERVICE_URL is not configured.' });
  }

  const runId = req.params.runId;

  try {
    const response = await fetch(
      `${base}/reports/${encodeURIComponent(runId)}`,
      {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      }
    );
    const text = await response.text();
    res.status(response.status).type('application/json').send(text);
  } catch (err) {
    res.status(502).json({
      error: err instanceof Error ? err.message : String(err),
      evidenceServiceUrl: base,
    });
  }
});

// ── Static files & SPA fallback ──────────────────────────────────────────────

app.use(express.static(distDir));
app.use((_req, res) => res.sendFile(path.join(distDir, 'index.html')));

app.listen(port, '0.0.0.0', () => {
  console.log(`AI Visibility Report frontend listening on port ${port}`);
  console.log(`Evidence service: ${evidenceBase() || '(not configured)'}`);
});
