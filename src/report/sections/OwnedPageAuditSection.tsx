import type { ReportViewModel } from '../../lib/normaliseReport';
import { fmtFraction, clampPct } from '../../lib/format';

interface Props {
  report: ReportViewModel;
}

export function OwnedPageAuditSection({ report }: Props) {
  const hasData = report.ownedPageCount != null || report.ownedPages.length > 0 || report.dimensionScores.length > 0;

  if (!hasData) {
    return (
      <section className="page">
        <h2>3. Owned Page AI Discovery Audit</h2>
        <div className="not-available">Not available in this run</div>
      </section>
    );
  }

  return (
    <section className="page">
      <h2>3. Owned Page AI Discovery Audit</h2>
      <p className="section-intro">
        The audit assessed <strong>{report.ownedPageCount ?? '—'}</strong> {report.brand} owned pages
        for AI discovery readiness.
        {report.averageGeoReadiness ? (
          <> Average Owned GEO Readiness is <strong>{report.averageGeoReadiness}</strong>.</>
        ) : null}
        {report.robotsTxtAvailable != null ? (
          <> Robots.txt is {report.robotsTxtAvailable ? 'available' : 'not found'}.
          </>
        ) : null}
        {report.llmsTxtFound != null ? (
          <> LLMs.txt {report.llmsTxtFound ? 'was found' : 'was not found'}.
          </>
        ) : null}
        {report.jsonLdCoverage ? (
          <> JSON-LD coverage is <strong>{report.jsonLdCoverage}</strong>.</>
        ) : null}
      </p>

      <h3>Owned page readiness snapshot</h3>
      <div className="cards">
        <div className="card">
          <div className="card-title">Owned coverage</div>
          <p><strong>{report.ownedPageCount ?? '—'}</strong> owned pages assessed in the latest baseline.</p>
        </div>
        <div className="card">
          <div className="card-title">AI hygiene</div>
          <p>
            Robots.txt {report.robotsTxtAvailable ? 'available' : 'not found'};
            LLMs.txt {report.llmsTxtFound ? 'found' : 'not found'};
            JSON-LD coverage at <strong>{report.jsonLdCoverage ?? '—'}</strong>.
          </p>
        </div>
        <div className="card">
          <div className="card-title">Mapping coverage</div>
          <p><strong>{report.pageLevelCmsCount ?? '—'}</strong> page-level CMS recommendations from the latest completed audit.</p>
        </div>
      </div>

      {report.dimensionScores.length > 0 ? (
        <>
          <h3>Average dimension scores</h3>
          <p className="section-intro">
            Average scores across the {report.ownedPageCount ?? ''} owned pages show where the main
            barriers to better AI discovery are.
          </p>
          <div className="dimension-grid">
            {report.dimensionScores.map((dim) => (
              <div className="dimension-card" key={dim.name}>
                <div className="dimension-score">
                  {dim.score != null ? fmtFraction(dim.score, dim.max) : '—'}
                </div>
                <div className="dimension-bar">
                  <span style={{ width: `${clampPct(dim.score != null ? (dim.score / dim.max) * 100 : 0)}%` }} />
                </div>
                <strong>{dim.name}</strong>
                <p>{dim.description}</p>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {report.ownedPages.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Page / page type</th>
              <th>URL</th>
              <th>GEO readiness</th>
              <th>Linked queries</th>
              <th>Main gaps / module focus</th>
              <th>Priority</th>
            </tr>
          </thead>
          <tbody>
            {report.ownedPages.map((page, i) => (
              <tr key={i}>
                <td>{page.pageName || '—'}</td>
                <td>
                  {page.url ? (
                    <a className="page-url" href={page.url} target="_blank" rel="noopener noreferrer">
                      {page.url}
                    </a>
                  ) : '—'}
                </td>
                <td>{page.geoReadiness || '—'}</td>
                <td>{page.linkedQueries}</td>
                <td>{page.mainGaps || '—'}</td>
                <td>
                  <span className={`tag ${page.priority.toLowerCase() === 'high' ? 'high' : 'medium'}`}>
                    {page.priority}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      {report.cmsRecommendationCards.length > 0 ? (
        <>
          <h3>Recommended content and structure improvements</h3>
          <div className="cards" style={{
            gridTemplateColumns: `repeat(${Math.min(report.cmsRecommendationCards.length, 5)}, 1fr)`
          }}>
            {report.cmsRecommendationCards.map((card, i) => (
              <div className="card" key={i}>
                <div className="card-title">{card.title}</div>
                <p>{card.description}</p>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
