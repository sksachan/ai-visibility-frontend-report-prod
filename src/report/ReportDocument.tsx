import type { ReportViewModel } from '../lib/normaliseReport';
import { CoverSection } from './sections/CoverSection';
import { ExecutiveSummarySection } from './sections/ExecutiveSummarySection';
import { BrandTopicsSection } from './sections/BrandTopicsSection';
import { OwnedPageAuditSection } from './sections/OwnedPageAuditSection';
import { ThirdPartyInfluenceSection } from './sections/ThirdPartyInfluenceSection';
import { ActionPlanSection } from './sections/ActionPlanSection';

interface Props {
  report: ReportViewModel;
}

/**
 * The full executive report document.
 * Section order matches the reference HTML exactly.
 */
export function ReportDocument({ report }: Props) {
  return (
    <main className="report" id="report-document">
      <CoverSection report={report} />
      <ExecutiveSummarySection report={report} />
      <BrandTopicsSection report={report} />
      <OwnedPageAuditSection report={report} />
      <ThirdPartyInfluenceSection report={report} />
      <ActionPlanSection report={report} />
    </main>
  );
}
