/**
 * Formatting helpers used across report sections.
 */

/** Format a numeric score to 1 decimal place, e.g. 21.6 → "21.6" */
export function fmtScore(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return '—';
  return Number(v).toFixed(1);
}

/** Format a fraction, e.g. (8, 20) → "8 / 20" */
export function fmtFraction(num: number | null | undefined, den: number): string {
  if (num == null) return '—';
  return `${Math.round(num)} / ${den}`;
}

/** Clamp a percentage value between 0 and 100 for CSS widths */
export function clampPct(v: number | null | undefined): number {
  if (v == null || Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(100, Number(v)));
}

/** Format an ISO date string to a readable date */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

/** Format a source type slug to a readable label */
export function fmtSourceType(slug: string): string {
  if (!slug) return '—';
  return slug
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
