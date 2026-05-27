/**
 * API client for the AI Visibility Report frontend.
 * All routes proxy through the Express server (server.js).
 */

const BASE = '/api/report';

// ── Types ────────────────────────────────────────────────────────────────────

export interface RunSummary {
  run_id: string;
  brand: string;
  market: string;
  generated_at: string;
  status?: string;
  query_count?: number;
}

// ── Fetchers ─────────────────────────────────────────────────────────────────

export async function fetchLatestReport(): Promise<unknown> {
  const res = await fetch(`${BASE}/latest`);
  if (!res.ok) throw new Error(`Failed to fetch latest report (${res.status})`);
  return res.json();
}

export async function fetchReportByRunId(runId: string): Promise<unknown> {
  const res = await fetch(`${BASE}/${encodeURIComponent(runId)}`);
  if (!res.ok) throw new Error(`Failed to fetch report ${runId} (${res.status})`);
  return res.json();
}

export async function fetchRuns(): Promise<RunSummary[]> {
  const res = await fetch(`${BASE}/runs`);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : data?.runs ?? data?.history ?? [];
}

/**
 * FIX #1: PDF download route mismatch.
 * Server route is /api/report/:runId/pdf (path parameter),
 * NOT /api/report/pdf?runId=... (query parameter).
 */
export function getPdfUrl(runId: string): string {
  return `${BASE}/${encodeURIComponent(runId)}/pdf`;
}
