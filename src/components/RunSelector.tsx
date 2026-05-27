import { useEffect, useState, useCallback } from 'react';
import { fetchRuns, getPdfUrl, type RunSummary } from '../lib/api';
import { fmtDate } from '../lib/format';

interface Props {
  currentRunId: string | null;
  onSelectRun: (runId: string) => void;
}

export function RunSelector({ currentRunId, onSelectRun }: Props) {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchRuns()
      .then(setRuns)
      .catch((err) => console.error('Failed to fetch runs:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const runId = e.target.value;
      if (runId) onSelectRun(runId);
    },
    [onSelectRun]
  );

  const handlePdfDownload = useCallback(async () => {
    if (!currentRunId) return;
    setPdfLoading(true);
    try {
      const url = getPdfUrl(currentRunId);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`PDF generation failed: ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `AI_Visibility_Report_${currentRunId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('PDF download error:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  }, [currentRunId]);

  return (
    <div className="report-controls">
      <select
        value={currentRunId || ''}
        onChange={handleChange}
        disabled={loading}
        aria-label="Select report run"
      >
        {loading ? (
          <option value="">Loading runs…</option>
        ) : runs.length === 0 ? (
          <option value="">No previous runs available</option>
        ) : (
          <>
            <option value="" disabled>Select a previous run…</option>
            {runs.map((run) => (
              <option key={run.run_id} value={run.run_id}>
                {run.run_id} — {fmtDate(run.generated_at)} — {run.brand}/{run.market}
                {run.query_count ? ` (${run.query_count} queries)` : ''}
              </option>
            ))}
          </>
        )}
      </select>

      <button
        onClick={handlePdfDownload}
        disabled={!currentRunId || pdfLoading}
        aria-label="Download report as PDF"
      >
        {pdfLoading ? 'Generating PDF…' : '↓ Download PDF'}
      </button>
    </div>
  );
}
