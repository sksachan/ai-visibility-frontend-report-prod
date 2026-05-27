import type { ReportViewModel } from '../../lib/normaliseReport';

interface Props {
  report: ReportViewModel;
}

export function ActionPlanSection({ report }: Props) {
  if (!report.roadmap.length && !report.actionChecklist.length) {
    return (
      <section className="page">
        <h2>5. Recommended Action Plan</h2>
        <div className="not-available">Not available in this run</div>
      </section>
    );
  }

  return (
    <section className="page">
      <h2>5. Recommended Action Plan</h2>
      <p className="section-intro">
        The action plan should work as a 90-day roadmap: first stabilise the highest-impact owned
        and measurement gaps, then publish content improvements and activate external proof, then
        rerun the same query universe to measure movement.
      </p>

      {report.roadmap.length > 0 ? (
        <div className="roadmap">
          {report.roadmap.map((step, i) => (
            <div className="roadmap-step" key={i}>
              <div className="roadmap-kicker">{step.kicker}</div>
              <h3>{step.title}</h3>
              <ul>
                {step.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
              {step.owners ? (
                <div className="owner-line">
                  <strong>Primary owners:</strong> {step.owners}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
