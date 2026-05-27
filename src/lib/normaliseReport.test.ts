import { describe, it, expect } from 'vitest';
import { normaliseReport, parseBool } from './normaliseReport';
import { getPdfUrl } from './api';

// ── FIX #1: getPdfUrl returns /api/report/:runId/pdf ──────────────────────────

describe('getPdfUrl', () => {
  it('returns /api/report/:runId/pdf for a simple runId', () => {
    expect(getPdfUrl('abc')).toBe('/api/report/abc/pdf');
  });

  it('encodes special characters in runId', () => {
    expect(getPdfUrl('run/with/slashes')).toBe('/api/report/run%2Fwith%2Fslashes/pdf');
  });

  it('handles runId with underscores and numbers', () => {
    expect(getPdfUrl('evidence_nissan_japan_1779831449_573f03')).toBe(
      '/api/report/evidence_nissan_japan_1779831449_573f03/pdf'
    );
  });
});

// ── FIX #2: geo_dimensions object averaging across all owned pages ────────────

describe('geo_dimensions averaging', () => {
  it('averages object-shaped geo_dimensions across 3 pages', () => {
    const raw = {
      brand: 'Nissan',
      market: 'Japan',
      executive: {
        headline_metrics: { ai_visibility_score: 21.6 },
      },
      owned_url_readiness: [
        {
          url: 'https://example.com/page1',
          title: 'Page 1',
          current_geo_score_120: 78,
          geo_dimensions: {
            content_clarity: 8,
            semantic_depth: 14,
            structured_data: 20,
            eeat_signals: 20,
            freshness_index: 16,
            faq_readiness: 0,
          },
        },
        {
          url: 'https://example.com/page2',
          title: 'Page 2',
          current_geo_score_120: 81,
          geo_dimensions: {
            content_clarity: 8,
            semantic_depth: 14,
            structured_data: 20,
            eeat_signals: 20,
            freshness_index: 16,
            faq_readiness: 3,
          },
        },
        {
          url: 'https://example.com/page3',
          title: 'Page 3',
          current_geo_score_120: 58,
          geo_dimensions: {
            content_clarity: 8,
            semantic_depth: 8,
            structured_data: 20,
            eeat_signals: 6,
            freshness_index: 16,
            faq_readiness: 0,
          },
        },
      ],
    };

    const result = normaliseReport(raw);

    expect(result.dimensionScores.length).toBe(6);

    // Content Clarity: (8+8+8)/3 = 8
    const cc = result.dimensionScores.find((d) => d.name === 'Content Clarity');
    expect(cc).toBeDefined();
    expect(cc!.score).toBe(8);

    // Semantic Depth: (14+14+8)/3 = 12
    const sd = result.dimensionScores.find((d) => d.name === 'Semantic Depth');
    expect(sd).toBeDefined();
    expect(sd!.score).toBe(12);

    // Structured Data: (20+20+20)/3 = 20
    const st = result.dimensionScores.find((d) => d.name === 'Structured Data');
    expect(st).toBeDefined();
    expect(st!.score).toBe(20);

    // E-E-A-T Signals: (20+20+6)/3 = 15.3
    const eeat = result.dimensionScores.find((d) => d.name === 'E-E-A-T Signals');
    expect(eeat).toBeDefined();
    expect(eeat!.score).toBeCloseTo(15.3, 1);

    // Freshness Index: (16+16+16)/3 = 16
    const fi = result.dimensionScores.find((d) => d.name === 'Freshness Index');
    expect(fi).toBeDefined();
    expect(fi!.score).toBe(16);

    // FAQ Readiness: (0+3+0)/3 = 1
    const faq = result.dimensionScores.find((d) => d.name === 'FAQ Readiness');
    expect(faq).toBeDefined();
    expect(faq!.score).toBe(1);
  });

  it('returns empty dimension scores when no owned pages exist', () => {
    const result = normaliseReport({ brand: 'Test', owned_url_readiness: [] });
    expect(result.dimensionScores).toEqual([]);
  });
});

// ── FIX #3: current_geo_score_120 maps into owned page readiness ──────────────

describe('current_geo_score_120 mapping', () => {
  it('uses current_geo_score_120 as geoReadiness', () => {
    const raw = {
      brand: 'Nissan',
      executive: { headline_metrics: {} },
      owned_url_readiness: [
        {
          url: 'https://example.com/page1',
          title: 'Test Page',
          current_geo_score_120: 78,
          geo_dimensions: { content_clarity: 8 },
        },
      ],
    };

    const result = normaliseReport(raw);
    expect(result.ownedPages[0].geoReadiness).toBe('78');
  });

  it('falls back to geo_readiness_score_120 when current_geo_score_120 is missing', () => {
    const raw = {
      brand: 'Nissan',
      executive: { headline_metrics: {} },
      owned_url_readiness: [
        {
          url: 'https://example.com/page1',
          title: 'Test Page',
          geo_readiness_score_120: 65,
        },
      ],
    };

    const result = normaliseReport(raw);
    expect(result.ownedPages[0].geoReadiness).toBe('65');
  });
});

// ── FIX #4: related_queries.length maps into linked query count ────────────────

describe('related_queries.length mapping', () => {
  it('uses related_queries array length as linkedQueries', () => {
    const raw = {
      brand: 'Nissan',
      executive: { headline_metrics: {} },
      owned_url_readiness: [
        {
          url: 'https://example.com/page1',
          title: 'Test Page',
          current_geo_score_120: 78,
          related_queries: [
            { query_id: 'q001', query: 'Query 1' },
            { query_id: 'q002', query: 'Query 2' },
            { query_id: 'q003', query: 'Query 3' },
          ],
        },
      ],
    };

    const result = normaliseReport(raw);
    expect(result.ownedPages[0].linkedQueries).toBe(3);
  });

  it('prefers linked_query_count over related_queries when both exist', () => {
    const raw = {
      brand: 'Nissan',
      executive: { headline_metrics: {} },
      owned_url_readiness: [
        {
          url: 'https://example.com/page1',
          title: 'Test Page',
          linked_query_count: 5,
          related_queries: [
            { query_id: 'q001', query: 'Query 1' },
            { query_id: 'q002', query: 'Query 2' },
          ],
        },
      ],
    };

    const result = normaliseReport(raw);
    expect(result.ownedPages[0].linkedQueries).toBe(5);
  });

  it('returns 0 when neither linked_query_count nor related_queries exist', () => {
    const raw = {
      brand: 'Nissan',
      executive: { headline_metrics: {} },
      owned_url_readiness: [
        {
          url: 'https://example.com/page1',
          title: 'Test Page',
        },
      ],
    };

    const result = normaliseReport(raw);
    expect(result.ownedPages[0].linkedQueries).toBe(0);
  });
});

// ── FIX #5: Competitor matrix includes highlighted brand row ──────────────────

describe('competitor matrix brand row', () => {
  it('adds highlighted Nissan row when only competitors are present', () => {
    const raw = {
      brand: 'Nissan',
      market: 'Japan',
      executive: {
        headline_metrics: {
          ai_visibility_score: 21.6,
          owned_target_page_citations: 0,
          owned_domain_citations: 5,
        },
      },
      source_landscape: {
        competitors: [
          { name: 'Toyota', count: 5 },
          { name: 'Honda', count: 5 },
        ],
      },
    };

    const result = normaliseReport(raw);

    // Nissan should be first (unshifted) and highlighted
    const nissanRow = result.competitorMatrix.find((r) => r.brand === 'Nissan');
    expect(nissanRow).toBeDefined();
    expect(nissanRow!.isHighlighted).toBe(true);
    expect(nissanRow!.aiVisibility).toBe(21.6);

    // Toyota and Honda should not be highlighted
    const toyotaRow = result.competitorMatrix.find((r) => r.brand === 'Toyota');
    expect(toyotaRow).toBeDefined();
    expect(toyotaRow!.isHighlighted).toBe(false);
  });

  it('highlights existing brand row when brand is already in matrix', () => {
    const raw = {
      brand: 'Nissan',
      executive: {
        headline_metrics: { ai_visibility_score: 21.6 },
      },
      competitor_visibility_matrix: [
        { brand: 'Nissan', ai_visibility_score: 21.6, citation_share_pct: 2.1 },
        { brand: 'Toyota', ai_visibility_score: 39.6, citation_share_pct: 6.8 },
      ],
    };

    const result = normaliseReport(raw);

    // Should NOT duplicate Nissan
    const nissanRows = result.competitorMatrix.filter((r) => r.brand === 'Nissan');
    expect(nissanRows.length).toBe(1);
    expect(nissanRows[0].isHighlighted).toBe(true);
  });

  it('handles production-shaped competitor matrix with competitor field', () => {
    const raw = {
      brand: 'Nissan',
      executive: {
        headline_metrics: { ai_visibility_score: 21.6 },
      },
      competitor_visibility_matrix: [
        {
          competitor: 'Toyota',
          ai_visibility_score: 39.6,
          query_presence_pct: 15,
          citation_share_pct: 6.8,
          source_type_influence_pct: 12,
        },
        {
          competitor: 'Honda',
          ai_visibility_score: 28.4,
          query_presence_pct: 10,
          citation_share_pct: 4.2,
          source_type_influence_pct: 8,
        },
      ],
    };

    const result = normaliseReport(raw);

    // Toyota should be mapped correctly
    const toyota = result.competitorMatrix.find((r) => r.brand === 'Toyota');
    expect(toyota).toBeDefined();
    expect(toyota!.aiVisibility).toBe(39.6);
    expect(toyota!.citationShare).toBe('6.8%');

    // Nissan should be added as highlighted brand row
    const nissan = result.competitorMatrix.find((r) => r.brand === 'Nissan');
    expect(nissan).toBeDefined();
    expect(nissan!.isHighlighted).toBe(true);
  });
});

// ── FIX #6: Headline metrics include owned citations ──────────────────────────

describe('headline metrics owned citations', () => {
  it('includes ownedTargetPageCitations and ownedDomainCitations', () => {
    const raw = {
      brand: 'Nissan',
      executive: {
        headline_metrics: {
          ai_visibility_score: 21.6,
          owned_target_page_citations: 0,
          owned_domain_citations: 5,
          query_count: 24,
        },
      },
    };

    const result = normaliseReport(raw);

    expect(result.headlineMetrics.ownedTargetPageCitations).toBe(0);
    expect(result.headlineMetrics.ownedDomainCitations).toBe(5);
  });

  it('returns null when citation fields are missing', () => {
    const raw = {
      brand: 'Nissan',
      executive: {
        headline_metrics: {
          ai_visibility_score: 21.6,
        },
      },
    };

    const result = normaliseReport(raw);

    expect(result.headlineMetrics.ownedTargetPageCitations).toBeNull();
    expect(result.headlineMetrics.ownedDomainCitations).toBeNull();
  });
});

// ── FIX #7: parseBool hardened boolean/status parsing ─────────────────────────

describe('parseBool', () => {
  it('maps "available" to true', () => {
    expect(parseBool('available')).toBe(true);
  });

  it('maps "found" to true', () => {
    expect(parseBool('found')).toBe(true);
  });

  it('maps "true" to true', () => {
    expect(parseBool('true')).toBe(true);
  });

  it('maps "yes" to true', () => {
    expect(parseBool('yes')).toBe(true);
  });

  it('maps "not_found" to false', () => {
    expect(parseBool('not_found')).toBe(false);
  });

  it('maps "missing" to false', () => {
    expect(parseBool('missing')).toBe(false);
  });

  it('maps "false" to false (not truthy like Boolean("false"))', () => {
    expect(parseBool('false')).toBe(false);
  });

  it('maps "no" to false', () => {
    expect(parseBool('no')).toBe(false);
  });

  it('returns null for null/undefined', () => {
    expect(parseBool(null)).toBeNull();
    expect(parseBool(undefined)).toBeNull();
  });

  it('passes through boolean values unchanged', () => {
    expect(parseBool(true)).toBe(true);
    expect(parseBool(false)).toBe(false);
  });

  it('returns null for unrecognised strings', () => {
    expect(parseBool('maybe')).toBeNull();
    expect(parseBool('unknown')).toBeNull();
  });
});

// ── Integration: Full production-shaped fixture ───────────────────────────────

describe('normaliseReport with production-shaped data', () => {
  it('normalises a production-shaped evidence bundle correctly', () => {
    const raw = {
      brand: 'Nissan',
      market: 'Japan',
      run_id: 'evidence_nissan_japan_1779346620_573d74',
      generated_at: '2026-05-21T07:01:18Z',
      executive: {
        summary: 'Nissan has 21.6/100 average AI visibility across 24 audited queries.',
        what_is_happening: ['AI answers are compressing discovery.'],
        why_now: ['Generative engines cite passages.'],
        priority_actions: ['Implement top page-level CMS modules.'],
        headline_metrics: {
          ai_visibility_score: 21.6,
          query_count: 24,
          owned_page_count: 190,
          owned_target_page_citations: 0,
          owned_domain_citations: 5,
          competitor_led_query_count: 5,
          external_led_query_count: 14,
          external_source_count: 72,
          average_owned_geo_score_120: 40.3,
          page_level_cms_recommendations: 81,
          grouped_pr_opportunities: 4,
          brand_topic_scorecard_topics: 7,
        },
        brandTopicScorecard: [
          {
            topic: 'Hybrid / e-POWER running costs',
            aiVisibilityScore: 17.3,
            queryCount: 6,
            citationCount: 18,
          },
        ],
      },
      source_landscape: {
        source_type_counts: [
          { source_type: 'external_citation', count: 41 },
          { source_type: 'forum_social_video', count: 14 },
        ],
        competitors: [
          { name: 'Toyota', count: 5 },
          { name: 'Honda', count: 5 },
        ],
      },
      ai_discoverability_hygiene: {
        robots_txt: { status: 'available' },
        llms_txt: { status: 'available' },
        structured_data: { coverage_pct: 17.0 },
      },
      owned_url_readiness: [
        {
          url: 'https://www3.nissan.co.jp/vehicles/new/leaf/range_and_charging.html',
          title: 'Leaf Range & Charging',
          current_geo_score_120: 78,
          geo_dimensions: {
            content_clarity: 8,
            semantic_depth: 14,
            structured_data: 20,
            eeat_signals: 20,
            freshness_index: 16,
            faq_readiness: 0,
          },
          related_queries: [
            { query_id: 'q001', query: 'EV range' },
            { query_id: 'q003', query: 'Quick chargers' },
          ],
        },
      ],
    };

    const result = normaliseReport(raw);

    // Identity
    expect(result.brand).toBe('Nissan');
    expect(result.market).toBe('Japan');
    expect(result.runId).toBe('evidence_nissan_japan_1779346620_573d74');

    // Headline metrics with citation fields
    expect(result.headlineMetrics.aiVisibility).toBe(21.6);
    expect(result.headlineMetrics.ownedTargetPageCitations).toBe(0);
    expect(result.headlineMetrics.ownedDomainCitations).toBe(5);

    // Competitor matrix includes Nissan highlighted row
    const nissan = result.competitorMatrix.find((r) => r.brand === 'Nissan');
    expect(nissan).toBeDefined();
    expect(nissan!.isHighlighted).toBe(true);

    // Hygiene uses parseBool
    expect(result.robotsTxtAvailable).toBe(true);
    expect(result.llmsTxtFound).toBe(true);
    expect(result.jsonLdCoverage).toBe('17%');

    // Owned page uses current_geo_score_120
    expect(result.ownedPages[0].geoReadiness).toBe('78');

    // Owned page uses related_queries.length
    expect(result.ownedPages[0].linkedQueries).toBe(2);

    // Dimension scores averaged from geo_dimensions
    expect(result.dimensionScores.length).toBe(6);

    // Source landscape from object shape
    expect(result.sourceLandscape.length).toBe(2);
    expect(result.sourceLandscape[0].sourceType).toBe('external_citation');
    expect(result.sourceLandscape[0].observedCount).toBe(41);
  });
});
