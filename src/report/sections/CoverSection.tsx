import type { ReportViewModel } from '../../lib/normaliseReport';
import { fmtScore, fmtDate, clampPct } from '../../lib/format';

interface Props {
  report: ReportViewModel;
}

export function CoverSection({ report }: Props) {
  const hm = report.headlineMetrics;

  return (
    <section className="page cover">
      <div>
        <div className="eyebrow">AI Visibility Intelligence</div>
        <h1>{report.brand} {report.market} AI Visibility Intelligence Report</h1>
        <div className="meta">
          <span className="pill"><strong>Market:</strong> {report.market}</span>
          <span className="pill"><strong>Run date:</strong> {fmtDate(report.generatedAt)}</span>
          <span className="pill"><strong>Audience:</strong> Executive, Marketing, SEO, PR and Content</span>
        </div>
      </div>

      <div className="cover-grid">
        <div className="headline-card">
          <div className="eyebrow">Executive headline</div>
          {report.headlineText ? (
            <p style={{ fontSize: '22px', lineHeight: 1.35, color: '#111827' }}>
              <strong>{report.headlineText}</strong>
            </p>
          ) : null}
          {report.headlineBody ? <p>{report.headlineBody}</p> : null}
          {report.recommendedDecision ? (
            <div className="callout">
              <strong>Recommended decision:</strong> {report.recommendedDecision}
            </div>
          ) : null}
        </div>

        <div className="brand-matrix">
          <div className="eyebrow">Brand visibility matrix</div>
          {report.competitorMatrix.length > 0 ? (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Brand</th>
                    <th>AI visibility</th>
                    <th>Citation share</th>
                  </tr>
                </thead>
                <tbody>
                  {report.competitorMatrix.map((row) => (
                    <tr key={row.brand} className={row.isHighlighted ? 'nissan-row' : ''}>
                      <td className="brand-cell">{row.brand}</td>
                      <td>
                        <div className="source-mix">
                          <span className="visibility-score">{fmtScore(row.aiVisibility)}</span>
                          <div className="mini-bar">
                            <span style={{ width: `${clampPct(row.aiVisibility)}%` }} />
                          </div>
                        </div>
                      </td>
                      <td>{row.citationShare || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {report.matrixNote ? <p className="matrix-note">{report.matrixNote}</p> : null}
            </>
          ) : (
            <div className="not-available">Competitor matrix not available in this run</div>
          )}
        </div>
      </div>

      <div className="brand-lockup">
        <span>Powered by</span>
        <img
          src="https://sapientaiproducts.com/images/bodhi_flat_business_studio_black.svg"
          alt="Bodhi Business Studio"
        />
      </div>
    </section>
  );
}
