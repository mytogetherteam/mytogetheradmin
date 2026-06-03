/** Matches onboarding/API excel import price segments (digits, commas, dots). */
const PRICE_SEGMENT_RE = /^[\d,.]+$/;

export function parseSingleExcelPriceSegment(seg: string): number | null {
  const t = seg.trim();
  if (!t || !PRICE_SEGMENT_RE.test(t)) return null;
  const n = Number(t.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

/**
 * Parse a workbook price cell. Multiple values separated by `/` (e.g. `160/150/240/105`)
 * resolve to the lowest price — same rule as the Nest onboarding excel parser.
 */
export function parseExcelPriceToken(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  const t = String(raw).trim();
  if (!t) return null;

  const parts = t.split("/").map((p) => p.trim()).filter(Boolean);
  const prices: number[] = [];
  for (const part of parts) {
    const n = parseSingleExcelPriceSegment(part);
    if (n !== null) prices.push(n);
  }

  if (!prices.length) return null;
  return Math.min(...prices);
}

/** Headers that hold monetary amounts in onboarding / activity import sheets. */
export function isExcelPriceHeader(header: string): boolean {
  const h = header.trim().toLowerCase().replace(/\s+/g, "_");
  return h === "price" || h === "varient_price" || h === "topping_price";
}

/** Normalize a parsed row price field for preview (returns number or original value). */
export function normalizeExcelPriceValue(raw: unknown): unknown {
  const n = parseExcelPriceToken(raw);
  if (n === null) return raw;
  return n;
}

export function formatExcelPriceForPreview(raw: unknown): string {
  const n = parseExcelPriceToken(raw);
  if (n !== null) return String(n);
  if (raw === null || raw === undefined) return "";
  return String(raw);
}
