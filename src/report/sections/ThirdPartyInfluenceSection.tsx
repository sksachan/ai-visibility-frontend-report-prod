import type { ReportViewModel } from '../../lib/normaliseReport';
import { fmtSourceType } from '../../lib/format';

interface Props {
  report: ReportViewModel;
}

export function ThirdPartyInfluenceSection({ report }: Props) {
  if (!report.sourceLandscape.length && !report.prOpportunities.length) {
    return (
      <section className="page">
        <h2>4. Third-Party and Non-Branded Media Influence</h2>
        <div className="not-available">Not available in this run</div>
      </section>
    );
  }

  return (
    <section className="page">
      <h2>4. Third-Party and Non-Branded Media Influence</h2>
      <p className="section-intro">
        AI answers are being shaped by a wider evidence ecosystem, not just {report.brand}-owned pages.
        External explainers, forums, video and review-style sources frequently influence how buyer
        questions are answered. {report.brand} should treat third-party proof as part of the AI
        visibility strategy, alongside owned-page improvements.
      </p>

      {report.sourceLandscape.length > 0 ? (
        <>
          <h3>Source landscape</h3>
          <table>
            <thead>
              <tr>
                <th>Source type</th>
                <th>Observed count</th>
                <th>Role in AI answers</th>
                <th>{report.brand} implication</th>
                <th>Recommended action</th>
              </tr>
            </thead>
            <tbody>
              {report.sourceLandscape.map((row, i) => (
                <tr key={i}>
                  <td>{fmtSourceType(row.sourceType)}</td>
                  <td>{row.observedCount}</td>
                  <td>{row.roleInAiAnswers || '—'}</td>
                  <td>{row.brandImplication || '—'}</td>
                  <td>{row.recommendedAction || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}

      {report.prOpportunities.length > 0 ? (
        <>
          <h3>PR and external proof opportunities</h3>
          <table>
            <thead>
              <tr>
                <th>Opportunity</th>
                <th>Source type</th>
                <th>Query coverage</th>
                <th>Priority</th>
                <th>Recommended action</th>
              </tr>
            </thead>
            <tbody>
              {report.prOpportunities.map((opp, i) => (
                <tr key={i}>
                  <td>{opp.opportunity}</td>
                  <td>{opp.sourceType}</td>
                  <td>{opp.queryCoverage}</td>
                  <td>
                    <span className={`tag ${opp.priority.toLowerCase() === 'high' ? 'high' : 'medium'}`}>
                      {opp.priority}
                    </span>
                  </td>
                  <td>{opp.recommendedAction || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}
    </section>
  );
}
