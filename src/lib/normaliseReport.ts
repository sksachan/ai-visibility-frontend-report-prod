/**
 * normaliseReport.ts
 *
 * Normalises raw evidence-service JSON into a deterministic ReportViewModel
 * consumed by all report section components.
 *
 * FIXES APPLIED:
 * #2 - GEO dimension scoring averaged across ALL owned pages (object shape)
 * #3 - current_geo_score_120 fallback for owned page readiness
 * #4 - related_queries array fallback for linked query count
 * #5 - Brand baseline row in competitor visibility matrix
 * #6 - ownedTargetPageCitations + ownedDomainCitations headline metrics
 * #7 - parseBool helper for hardened boolean/status parsing
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface HeadlineMetrics {
  aiVisibility: number | null;
  queryCount: number | null;
  ownedPageCount: number | null;
  competitorLedQueries: number | null;
  externalLedQueries: number | null;
  externalSourceCount: number | null;
  averageGeoScore: number | null;
  pageLevelCmsRecommendations: number | null;
  groupedPrOpportunities: number | null;
  brandTopicCount: number | null;
  /** FIX #6: Restored headline citation metrics */
  ownedTargetPageCitations: number | null;
  ownedDomainCitations: number | null;
}

export interface CompetitorRow {
  brand: string;
  aiVisibility: number | null;
  citationShare: string;
  isHighlighted: boolean;
}

export interface TopicScore {
  topic: string;
  aiVisibilityScore: number | null;
  priority: string;
  queryCount: number;
  citationCount: number;
}

export interface PriorityTheme {
  title: string;
  issue: string;
  response: string;
}

export interface QueryExample {
  query: string;
  answerPattern: string;
  visibilityIssue: string;
  recommendedFix: string;
  aiVisibility: number | null;
  leadSource: string;
}

export interface OwnedPage {
  pageName: string;
  url: string;
  geoReadiness: string;
  linkedQueries: number;
  mainGaps: string;
  priority: string;
}

export interface DimensionScore {
  name: string;
  score: number | null;
  max: number;
  description: string;
}

export interface SourceLandscapeRow {
  sourceType: string;
  observedCount: number;
  roleInAiAnswers: string;
  brandImplication: string;
  recommendedAction: string;
}

export interface PrOpportunity {
  opportunity: string;
  sourceType: string;
  queryCoverage: string;
  priority: string;
  recommendedAction: string;
}

export interface RoadmapStep {
  kicker: string;
  title: string;
  items: string[];
  owners: string;
}

export interface CmsCard {
  title: string;
  description: string;
}

export interface ReportViewModel {
  // Identity
  runId: string;
  brand: string;
  market: string;
  generatedAt: string;

  // Cover
  headlineText: string;
  headlineBody: string;
  recommendedDecision: string;
  headlineMetrics: HeadlineMetrics;
  competitorMatrix: CompetitorRow[];
  matrixNote: string;

  // Executive Summary
  executiveSummaryIntro: string;
  executiveFindings: string[];

  // Brand Topics
  topicScorecard: TopicScore[];
  priorityThemes: PriorityTheme[];
  queryExamples: QueryExample[];

  // Owned Page Audit
  ownedPageCount: number | null;
  averageGeoReadiness: string;
  robotsTxtAvailable: boolean | null;
  llmsTxtFound: boolean | null;
  jsonLdCoverage: string;
  pageLevelCmsCount: number | null;
  ownedPages: OwnedPage[];
  dimensionScores: DimensionScore[];
  cmsRecommendationCards: CmsCard[];

  // Third-Party
  sourceLandscape: SourceLandscapeRow[];
  prOpportunities: PrOpportunity[];

  // Action Plan
  roadmap: RoadmapStep[];
  actionChecklist: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Safe number extraction */
function num(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

/** Safe string extraction */
function str(v: unknown): string {
  if (v == null) return '';
  return String(v);
}

/** Safe array extraction */
function arr(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  return [];
}

/**
 * FIX #7: Hardened boolean/status parsing.
 * Maps string statuses to boolean correctly.
 * Boolean('false') === true is a JS gotcha; this helper avoids it.
 */
export function parseBool(v: unknown): boolean | null {
  if (v == null) return null;
  if (typeof v === 'boolean') return v;
  const s = String(v).toLowerCase().trim();
  if (['available', 'found', 'true', 'yes', '1'].includes(s)) return true;
  if (['not_found', 'missing', 'false', 'no', '0', 'unavailable', 'not found'].includes(s)) return false;
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type R = Record<string, any>;

function dig(obj: R, ...paths: string[]): unknown {
  for (const path of paths) {
    const keys = path.split('.');
    let cur: unknown = obj;
    for (const k of keys) {
      if (cur == null || typeof cur !== 'object') { cur = undefined; break; }
      cur = (cur as R)[k];
    }
    if (cur !== undefined && cur !== null) return cur;
  }
  return undefined;
}

// ── Normaliser ───────────────────────────────────────────────────────────────

export function normaliseReport(raw: unknown): ReportViewModel {
  const d = (raw ?? {}) as R;

  // ── Identity ─────────────────────────────────────────────────────────────
  const brand = str(d.brand ?? d.metadata?.brand ?? 'Unknown');
  const market = str(d.market ?? d.metadata?.market ?? '');
  const runId = str(d.run_id ?? d.runId ?? d.metadata?.run_id ?? '');
  const generatedAt = str(d.generated_at ?? d.generatedAt ?? d.metadata?.generated_at ?? '');

  // ── Executive ────────────────────────────────────────────────────────────
  const exec: R = d.executive ?? d.executive_summary ?? {};
  const hm: R = exec.headline_metrics ?? d.headline_metrics ?? {};

  const headlineMetrics: HeadlineMetrics = {
    aiVisibility: num(hm.ai_visibility_score ?? hm.aiVisibility ?? hm.ai_visibility),
    queryCount: num(hm.query_count ?? hm.queryCount),
    ownedPageCount: num(hm.owned_page_count ?? hm.ownedPageCount),
    competitorLedQueries: num(hm.competitor_led_query_count ?? hm.competitorLedQueries),
    externalLedQueries: num(hm.external_led_query_count ?? hm.externalLedQueries),
    externalSourceCount: num(hm.external_source_count ?? hm.externalSourceCount),
    averageGeoScore: num(hm.average_owned_geo_score_120 ?? hm.averageGeoScore),
    pageLevelCmsRecommendations: num(hm.page_level_cms_recommendations ?? hm.pageLevelCmsRecommendations),
    groupedPrOpportunities: num(hm.grouped_pr_opportunities ?? hm.groupedPrOpportunities),
    brandTopicCount: num(hm.brand_topic_scorecard_topics ?? hm.brandTopicCount),
    /** FIX #6: Restore owned citation metrics from headline_metrics */
    ownedTargetPageCitations: num(hm.owned_target_page_citations ?? hm.ownedTargetPageCitations),
    ownedDomainCitations: num(hm.owned_domain_citations ?? hm.ownedDomainCitations),
  };

  // ── Headline text ────────────────────────────────────────────────────────
  const headlineText = str(exec.summary ?? exec.headline ?? exec.headline_text ?? '');
  const headlineBody = str(exec.headline_body ?? '');
  const recommendedDecision = str(exec.recommended_decision ?? exec.recommendedDecision ?? '');

  // ── Executive findings ───────────────────────────────────────────────────
  const findings: string[] = [];
  for (const key of ['what_is_happening', 'why_now', 'priority_actions']) {
    const items = arr(exec[key]);
    for (const item of items) {
      if (typeof item === 'string' && item.trim()) findings.push(item.trim());
    }
  }
  const executiveSummaryIntro = str(exec.summary ?? exec.executive_summary_intro ?? '');

  // ── Competitor visibility matrix ─────────────────────────────────────────
  // FIX #5: Ensure brand baseline row appears in competitor matrix
  const rawMatrix = dig(d, 'competitor_visibility_matrix', 'source_landscape.competitors', 'executive.competitor_visibility_matrix');
  let competitorRows: CompetitorRow[] = [];

  if (rawMatrix && typeof rawMatrix === 'object' && !Array.isArray(rawMatrix)) {
    // Object shape: { competitors: [...] }
    const compArr = arr((rawMatrix as R).competitors);
    competitorRows = compArr.map((r: unknown) => {
      const row = r as R;
      return {
        brand: str(row.brand ?? row.name ?? row.competitor),
        aiVisibility: num(row.ai_visibility_score ?? row.ai_visibility ?? row.aiVisibility ?? row.visibility_score ?? row.score ?? row.count),
        citationShare: str(row.citation_share_pct != null ? `${row.citation_share_pct}%` : (row.citation_share ?? row.citationShare ?? '')),
        isHighlighted: false,
      };
    });
  } else if (Array.isArray(rawMatrix)) {
    competitorRows = (rawMatrix as R[]).map((row) => ({
      brand: str(row.brand ?? row.name ?? row.competitor),
      aiVisibility: num(row.ai_visibility_score ?? row.ai_visibility ?? row.aiVisibility ?? row.visibility_score ?? row.score ?? row.count),
      citationShare: str(row.citation_share_pct != null ? `${row.citation_share_pct}%` : (row.citation_share ?? row.citationShare ?? '')),
      isHighlighted: false,
    }));
  }

  // FIX #5: Add highlighted brand baseline row if not already present
  const brandAlreadyInMatrix = competitorRows.some(
    (r) => r.brand.toLowerCase() === brand.toLowerCase()
  );
  if (!brandAlreadyInMatrix && brand) {
    const brandRow: CompetitorRow = {
      brand,
      aiVisibility: headlineMetrics.aiVisibility,
      citationShare: headlineMetrics.ownedTargetPageCitations != null || headlineMetrics.ownedDomainCitations != null
        ? `${headlineMetrics.ownedTargetPageCitations ?? 0} target / ${headlineMetrics.ownedDomainCitations ?? 0} domain`
        : '',
      isHighlighted: true,
    };
    competitorRows.unshift(brandRow);
  } else {
    // Mark existing brand row as highlighted
    competitorRows = competitorRows.map((r) => ({
      ...r,
      isHighlighted: r.brand.toLowerCase() === brand.toLowerCase(),
    }));
  }

  const matrixNote = str(
    dig(d, 'competitor_visibility_matrix.note', 'competitor_visibility_matrix.methodology') ?? ''
  );

  // ── Brand topic scorecard ────────────────────────────────────────────────
  const rawScorecard = arr(
    exec.brandTopicScorecard ?? exec.brand_topic_scorecard ??
    d.executive_summary?.brand_topic_scorecard ?? d.brandTopicScorecard ?? []
  );
  const topicScorecard: TopicScore[] = rawScorecard.map((t: unknown) => {
    const topic = t as R;
    return {
      topic: str(topic.topic),
      aiVisibilityScore: num(topic.aiVisibilityScore ?? topic.ai_visibility_score),
      priority: str(topic.priority ?? (num(topic.aiVisibilityScore ?? topic.ai_visibility_score) != null && (num(topic.aiVisibilityScore ?? topic.ai_visibility_score) ?? 0) < 25 ? 'P1' : 'P2')),
      queryCount: num(topic.queryCount ?? topic.query_count) ?? 0,
      citationCount: num(topic.citationCount ?? topic.citation_count) ?? 0,
    };
  });

  // ── Priority themes ──────────────────────────────────────────────────────
  const rawThemes = arr(d.priority_themes ?? exec.priority_themes ?? []);
  const priorityThemes: PriorityTheme[] = rawThemes.map((t: unknown) => {
    const theme = t as R;
    return {
      title: str(theme.title ?? theme.theme),
      issue: str(theme.issue ?? theme.current_issue ?? theme.description ?? ''),
      response: str(theme.response ?? theme.recommended_response ?? theme.recommendation ?? ''),
    };
  });

  // ── Query examples ───────────────────────────────────────────────────────
  const rawQueries = arr(d.query_examples ?? d.query_workbench ?? exec.query_examples ?? []);
  const queryExamples: QueryExample[] = rawQueries.slice(0, 20).map((q: unknown) => {
    const query = q as R;
    return {
      query: str(query.query ?? query.buyer_question ?? query.question),
      answerPattern: str(query.answer_pattern ?? query.answerPattern ?? query.ai_answer_pattern ?? ''),
      visibilityIssue: str(query.visibility_issue ?? query.visibilityIssue ?? query.gap ?? ''),
      recommendedFix: str(query.recommended_fix ?? query.recommendedFix ?? query.recommendation ?? ''),
      aiVisibility: num(query.ai_visibility_score ?? query.aiVisibility ?? query.ai_visibility),
      leadSource: str(query.lead_source ?? query.leadSource ?? query.top_source ?? ''),
    };
  });

  // ── Owned pages ──────────────────────────────────────────────────────────
  const rawOwned = arr(
    d.owned_url_readiness ??
    (d.owned_url_readiness_chunks ?? []).flatMap((c: R) => arr(c.owned_url_readiness)) ??
    []
  );

  const ownedPages: OwnedPage[] = rawOwned.slice(0, 50).map((o: unknown) => {
    const page = o as R;
    return {
      pageName: str(page.title ?? page.page_name ?? page.pageName ?? ''),
      url: str(page.url ?? ''),
      /** FIX #3: current_geo_score_120 fallback for GEO readiness */
      geoReadiness: str(
        page.current_geo_score_120 ?? page.geo_readiness_score_120 ??
        page.geo_readiness ?? page.geoReadiness ?? page.geo_score ?? ''
      ),
      /** FIX #4: related_queries array fallback for linked query count */
      linkedQueries:
        num(page.linked_query_count ?? page.linkedQueries ?? page.query_count) ??
        (Array.isArray(page.related_queries) ? page.related_queries.length : 0),
      mainGaps: str(page.main_gaps ?? page.mainGaps ?? page.gap_summary ?? page.module_focus ?? ''),
      priority: str(page.priority ?? 'Medium'),
    };
  });

  const ownedPageCount = num(
    hm.owned_page_count ?? hm.ownedPageCount ?? d.owned_pages_scoreable ?? (rawOwned.length || null)
  );
  const averageGeoReadiness = str(
    hm.average_owned_geo_score_120 ?? hm.averageGeoScore ?? ''
  );

  // ── AI Hygiene ───────────────────────────────────────────────────────────
  // FIX #7: Use parseBool for hardened boolean/status parsing
  const hygiene: R = d.ai_discoverability_hygiene ?? d.site_ai_hygiene ?? d.hygiene ?? {};

  const robotsTxtAvailable = parseBool(
    hygiene.robots_txt?.status ?? hygiene.robots_txt_status ??
    dig(d, 'hygiene.robots_txt_status') ?? null
  );
  const llmsTxtFound = parseBool(
    hygiene.llms_txt?.status ?? hygiene.llms_txt_status ??
    dig(d, 'hygiene.llms_txt_status') ?? null
  );

  const structuredData: R = hygiene.structured_data ?? {};
  const jsonLdCoveragePct = num(
    structuredData.coverage_pct ?? hygiene.json_ld_coverage_pct ??
    dig(d, 'hygiene.json_ld_coverage_pct') ?? null
  );
  const jsonLdCoverage = jsonLdCoveragePct != null ? `${jsonLdCoveragePct}%` : '';

  const pageLevelCmsCount = num(
    hm.page_level_cms_recommendations ?? hm.pageLevelCmsRecommendations ?? null
  );

  // ── Dimension scores ─────────────────────────────────────────────────────
  // FIX #2: Average geo_dimensions objects across ALL owned pages
  const dimensionScores: DimensionScore[] = buildDimensionScores(rawOwned);

  // ── CMS recommendation cards ─────────────────────────────────────────────
  const rawCmsCards = arr(d.cms_recommendation_cards ?? d.cms_recommendations ?? []);
  const cmsRecommendationCards: CmsCard[] = rawCmsCards.slice(0, 10).map((c: unknown) => {
    const card = c as R;
    return {
      title: str(card.title ?? card.module_type ?? ''),
      description: str(card.description ?? card.recommendation ?? card.summary ?? ''),
    };
  });

  // ── Source landscape ─────────────────────────────────────────────────────
  const rawLandscape = d.source_landscape ?? {};
  let sourceLandscapeRows: SourceLandscapeRow[] = [];

  if (Array.isArray(rawLandscape)) {
    sourceLandscapeRows = rawLandscape.map((row: R) => ({
      sourceType: str(row.source_type ?? row.sourceType ?? ''),
      observedCount: num(row.observed_count ?? row.count ?? row.observedCount) ?? 0,
      roleInAiAnswers: str(row.role_in_ai_answers ?? row.roleInAiAnswers ?? ''),
      brandImplication: str(row.brand_implication ?? row.brandImplication ?? ''),
      recommendedAction: str(row.recommended_action ?? row.recommendedAction ?? ''),
    }));
  } else if (typeof rawLandscape === 'object' && rawLandscape !== null) {
    // Object shape with source_type_counts array
    const counts = arr((rawLandscape as R).source_type_counts);
    sourceLandscapeRows = counts.map((row: unknown) => {
      const r = row as R;
      return {
        sourceType: str(r.source_type ?? r.sourceType ?? ''),
        observedCount: num(r.count ?? r.observed_count ?? r.observedCount) ?? 0,
        roleInAiAnswers: str(r.role_in_ai_answers ?? r.roleInAiAnswers ?? ''),
        brandImplication: str(r.brand_implication ?? r.brandImplication ?? ''),
        recommendedAction: str(r.recommended_action ?? r.recommendedAction ?? ''),
      };
    });
  }

  // ── PR opportunities ─────────────────────────────────────────────────────
  const rawPr = arr(d.pr_opportunities ?? d.grouped_pr_opportunities ?? []);
  const prOpportunities: PrOpportunity[] = rawPr.map((p: unknown) => {
    const opp = p as R;
    return {
      opportunity: str(opp.opportunity ?? opp.action ?? opp.title ?? ''),
      sourceType: str(opp.source_type ?? opp.sourceType ?? ''),
      queryCoverage: str(opp.query_coverage ?? opp.queryCoverage ?? (opp.query_coverage_count != null ? `${opp.query_coverage_count} queries` : '')),
      priority: str(opp.priority ?? 'Medium'),
      recommendedAction: str(opp.recommended_action ?? opp.recommendedAction ?? opp.action ?? ''),
    };
  });

  // ── Roadmap ──────────────────────────────────────────────────────────────
  const rawRoadmap = arr(d.roadmap ?? d.action_plan?.roadmap ?? []);
  const roadmap: RoadmapStep[] = rawRoadmap.map((s: unknown) => {
    const step = s as R;
    return {
      kicker: str(step.kicker ?? step.phase ?? step.timeframe ?? ''),
      title: str(step.title ?? step.heading ?? ''),
      items: arr(step.items ?? step.actions ?? step.tasks).map((i) => str(i)),
      owners: str(step.owners ?? step.owner ?? ''),
    };
  });

  // ── Action checklist ─────────────────────────────────────────────────────
  const rawChecklist = arr(d.action_checklist ?? []);
  const actionChecklist: string[] = rawChecklist
    .map((a: unknown) => str((a as R).action ?? a))
    .filter((s: string) => s.length > 0);

  return {
    runId,
    brand,
    market,
    generatedAt,
    headlineText,
    headlineBody,
    recommendedDecision,
    headlineMetrics,
    competitorMatrix: competitorRows,
    matrixNote,
    executiveSummaryIntro,
    executiveFindings: findings,
    topicScorecard,
    priorityThemes,
    queryExamples,
    ownedPageCount,
    averageGeoReadiness,
    robotsTxtAvailable,
    llmsTxtFound,
    jsonLdCoverage,
    pageLevelCmsCount,
    ownedPages,
    dimensionScores,
    cmsRecommendationCards,
    sourceLandscape: sourceLandscapeRows,
    prOpportunities,
    roadmap,
    actionChecklist,
  };
}

// ── FIX #2: GEO Dimension Scoring ───────────────────────────────────────────

/**
 * GEO dimension names and their max scores (out of 120 total).
 */
const GEO_DIMENSIONS: { key: string; label: string; max: number; description: string }[] = [
  { key: 'content_clarity', label: 'Content Clarity', max: 20, description: 'How clearly the page answers buyer questions with extractable passages.' },
  { key: 'semantic_depth', label: 'Semantic Depth', max: 20, description: 'Depth of topical coverage, entity relationships and contextual evidence.' },
  { key: 'structured_data', label: 'Structured Data', max: 20, description: 'JSON-LD, schema markup and machine-readable signals.' },
  { key: 'eeat_signals', label: 'E-E-A-T Signals', max: 20, description: 'Experience, expertise, authoritativeness and trust indicators.' },
  { key: 'freshness_index', label: 'Freshness Index', max: 20, description: 'Recency of content updates, dates and temporal relevance.' },
  { key: 'faq_readiness', label: 'FAQ Readiness', max: 20, description: 'Presence and quality of FAQ blocks, Q&A patterns and answer snippets.' },
];

/**
 * Averages geo_dimensions objects across all owned pages.
 * Handles both object-shaped geo_dimensions (production) and array-shaped (legacy).
 */
function buildDimensionScores(ownedPages: unknown[]): DimensionScore[] {
  if (!ownedPages.length) return [];

  // Collect all pages that have geo_dimensions
  const pagesWithDims = ownedPages.filter((p: unknown) => {
    const page = p as R;
    return page.geo_dimensions != null && typeof page.geo_dimensions === 'object' && !Array.isArray(page.geo_dimensions);
  });

  if (pagesWithDims.length === 0) {
    // Fallback: try array-shaped dimension_scores on first page
    const firstPage = ownedPages[0] as R;
    if (Array.isArray(firstPage?.dimension_scores)) {
      return firstPage.dimension_scores.map((ds: R) => ({
        name: str(ds.name ?? ds.dimension ?? ''),
        score: num(ds.score ?? ds.value),
        max: num(ds.max) ?? 20,
        description: str(ds.description ?? ''),
      }));
    }
    return [];
  }

  // Average each dimension across all pages with geo_dimensions
  return GEO_DIMENSIONS.map(({ key, label, max, description }) => {
    let total = 0;
    let count = 0;
    for (const p of pagesWithDims) {
      const dims = (p as R).geo_dimensions as R;
      const val = num(dims[key]);
      if (val != null) {
        total += val;
        count++;
      }
    }
    return {
      name: label,
      score: count > 0 ? Math.round((total / count) * 10) / 10 : null,
      max,
      description,
    };
  });
}
