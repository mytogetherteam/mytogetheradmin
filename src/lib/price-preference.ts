export type PricePreferenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';

/** Map legacy DB values ($, $$, $$$, $$$$) and enum strings to form enum. */
export function normalizePricePreference(
  value: string | null | undefined,
): PricePreferenceLevel {
  if (!value) return 'MEDIUM';
  const trimmed = value.trim();
  const upper = trimmed.toUpperCase();
  if (upper === 'LOW' || upper === 'MEDIUM' || upper === 'HIGH') {
    return upper;
  }
  const dollarCount = (trimmed.match(/\$/g) ?? []).length;
  if (dollarCount === 1) return 'LOW';
  if (dollarCount === 2) return 'MEDIUM';
  if (dollarCount >= 3) return 'HIGH';
  return 'MEDIUM';
}
