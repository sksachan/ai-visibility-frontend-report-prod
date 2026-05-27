import type { ReportViewModel } from '../../lib/normaliseReport';

interface Props {
  report: ReportViewModel;
}

export function ExecutiveSummarySection({ report }: Props) {
  if (!report.executiveFindings.length && !report.executiveSummaryIntro) {
    return (
      <section className="page">
        <h2>1. Executive Summary</h2>
        <div className="not-available">Not available in this run</div>
      </section>
    );
  }

  return (
    <section className="page">
      <h2>1. Executive Summary</h2>
      {report.executiveSummaryIntro ? (
        <p className="section-intro">{report.executiveSummaryIntro}</p>
      ) : null}

      {report.executiveFindings.length > 0 ? (
        <>
          <h3>Executive findings</h3>
          <div className="finding-list">
            {report.executiveFindings.map((finding, i) => (
              <div className="finding" key={i}>
                <div className="num">{i + 1}</div>
                <p>{finding}</p>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
