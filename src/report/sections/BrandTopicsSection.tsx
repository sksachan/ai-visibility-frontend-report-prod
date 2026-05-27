import type { ReportViewModel } from '../../lib/normaliseReport';
import { fmtScore, clampPct } from '../../lib/format';

interface Props {
  report: ReportViewModel;
}

export function BrandTopicsSection({ report }: Props) {
  if (!report.topicScorecard.length && !report.queryExamples.length) {
    return (
      <section className="page">
        <h2>2. Brand Topics and Citation Research</h2>
        <div className="not-available">Not available in this run</div>
      </section>
    );
  }

  return (
    <section className="page">
      <h2>2. Brand Topics and Citation Research</h2>
      <p className="section-intro">
        The topic scorecard shows where {report.brand} needs stronger extractable evidence,
        comparison-ready explanations and third-party validation across buyer-topic clusters.
        Lower scores indicate where AI answers are more likely to be shaped by competitors,
        publishers, forums or generic external explainers.
      </p>

      {report.topicScorecard.length > 0 ? (
        <div className="topic-grid" style={{
          gridTemplateColumns: `repeat(${Math.min(report.topicScorecard.length, 7)}, 1fr)`
        }}>
          {report.topicScorecard.map((topic) => (
            <div className="topic-card" key={topic.topic}>
              <div className="score">{fmtScore(topic.aiVisibilityScore)}</div>
              <div className="bar">
                <span style={{ width: `${clampPct(topic.aiVisibilityScore)}%` }} />
              </div>
              <strong>{topic.topic}</strong>
              <p>
                <span className={`tag ${topic.priority === 'P1' ? 'high' : 'medium'}`}>
                  {topic.priority}
                </span>
                {' '}· {topic.queryCount} queries · {topic.citationCount} citations
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {report.priorityThemes.length > 0 ? (
        <>
          <h3>Priority improvement themes</h3>
          <div className="cards">
            {report.priorityThemes.map((theme, i) => (
              <div className="card" key={i}>
                <div className="card-title">{theme.title}</div>
                {theme.issue ? <p><strong>Current issue:</strong> {theme.issue}</p> : null}
                {theme.response ? <p><strong>Recommended response:</strong> {theme.response}</p> : null}
              </div>
            ))}
          </div>
        </>
      ) : null}

      {report.queryExamples.length > 0 ? (
        <>
          <h3>Query-level examples</h3>
          <table>
            <thead>
              <tr>
                <th>Buyer question</th>
                <th>Current AI answer pattern</th>
                <th>Visibility issue</th>
                <th>Recommended fix</th>
              </tr>
            </thead>
            <tbody>
              {report.queryExamples.map((q, i) => (
                <tr key={i}>
                  <td>{q.query}</td>
                  <td>
                    <div className="answer-pattern">{q.answerPattern || '—'}</div>
                    <div className="query-meta">
                      {q.aiVisibility != null ? (
                        <span className="query-chip">AI visibility: {fmtScore(q.aiVisibility)}</span>
                      ) : null}
                      {q.leadSource ? (
                        <span className="query-chip domain">Lead source: {q.leadSource}</span>
                      ) : null}
                    </div>
                  </td>
                  <td>{q.visibilityIssue || '—'}</td>
                  <td>{q.recommendedFix || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}
    </section>
  );
}
