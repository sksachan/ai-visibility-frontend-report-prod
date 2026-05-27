import { useEffect, useState, useCallback } from 'react';
import { fetchLatestReport, fetchReportByRunId } from '../lib/api';
import { normaliseReport, type ReportViewModel } from '../lib/normaliseReport';
import { ReportDocument } from '../report/ReportDocument';
import { RunSelector } from '../components/RunSelector';

/**
 * Main report page.
 *
 * Loading behaviour:
 * 1. If URL has ?runId=<id>, fetch that specific run.
 * 2. Otherwise, auto-fetch the latest successful run.
 * 3. Show loading spinner while fetching.
 * 4. Show clear error if no report is available.
 * 5. Never show mock data.
 */
export function ReportPage() {
  const [report, setReport] = useState<ReportViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);

  // Load report by run ID or latest
  const loadReport = useCallback(async (runId?: string) => {
    setLoading(true);
    setError(null);
    try {
      let rawData: unknown;
      if (runId) {
        rawData = await fetchReportByRunId(runId);
      } else {
        rawData = await fetchLatestReport();
      }
      const normalised = normaliseReport(rawData);
      setReport(normalised);
      setCurrentRunId(normalised.runId || runId || null);

      // Update URL without reload
      const newUrl = normalised.runId
        ? `${window.location.pathname}?runId=${encodeURIComponent(normalised.runId)}`
        : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load: check URL for runId, otherwise fetch latest
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const runId = params.get('runId') || undefined;
    loadReport(runId);
  }, [loadReport]);

  const handleSelectRun = useCallback(
    (runId: string) => {
      loadReport(runId);
    },
    [loadReport]
  );

  if (loading) {
    return (
      <div className="report" style={{ maxWidth: 1180, margin: '32px auto' }}>
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading report…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="report" style={{ maxWidth: 1180, margin: '32px auto' }}>
        <div className="error-state">
          <p>⚠️ {error}</p>
          <button
            onClick={() => loadReport()}
            style={{
              padding: '8px 20px',
              border: '1px solid #2563eb',
              borderRadius: 10,
              background: '#2563eb',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="report" style={{ maxWidth: 1180, margin: '32px auto' }}>
        <div className="error-state">
          <p>No report data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1220, margin: '0 auto', padding: '20px' }}>
      <RunSelector currentRunId={currentRunId} onSelectRun={handleSelectRun} />
      <ReportDocument report={report} />
    </div>
  );
}
