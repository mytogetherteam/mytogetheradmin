/** Fixed amount off list price from percentage (rounded to 2 dp). */
export function amountFromPercentage(
  originalPrice: number,
  percentage: number,
): number {
  if (originalPrice <= 0 || percentage <= 0) return 0;
  return Math.round(((originalPrice * percentage) / 100) * 100) / 100;
}

/** Percentage off from list price and fixed amount off (rounded to 2 dp). */
export function percentageFromAmount(
  originalPrice: number,
  amount: number,
): number {
  if (originalPrice <= 0 || amount <= 0) return 0;
  return Math.round((amount / originalPrice) * 100 * 100) / 100;
}

/** Customer selling price after a fixed amount off. */
export function sellingPriceFromOriginalAndAmount(
  originalPrice: number,
  discountAmount: number,
): number {
  if (originalPrice <= 0) return 0;
  return Math.max(0, Math.round((originalPrice - discountAmount) * 100) / 100);
}

/** Customer selling price after a percentage off. */
export function sellingPriceFromOriginalAndPercentage(
  originalPrice: number,
  percentage: number,
): number {
  if (originalPrice <= 0 || percentage <= 0) return originalPrice;
  return Math.round(originalPrice * (1 - percentage / 100) * 100) / 100;
}

/** Fixed amount off from list price and customer selling price. */
export function discountAmountFromSellingPrice(
  originalPrice: number,
  sellingPrice: number,
): number {
  if (originalPrice <= 0 || sellingPrice <= 0 || sellingPrice >= originalPrice) {
    return 0;
  }
  return Math.round((originalPrice - sellingPrice) * 100) / 100;
}

/** Percentage off from list price and customer selling price. */
export function percentageFromSellingPrice(
  originalPrice: number,
  sellingPrice: number,
): number {
  return percentageFromAmount(
    originalPrice,
    discountAmountFromSellingPrice(originalPrice, sellingPrice),
  );
}

export function formatPercentageForInput(percentage: number): string {
  if (percentage <= 0) return "";
  return Number.isInteger(percentage)
    ? String(percentage)
    : String(percentage);
}

export function formatPriceForInput(price: number): string {
  if (price <= 0) return "";
  return String(price);
}

export function parsePriceInput(value: string): number {
  const n = Number(value.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function isBlankPriceInput(value: string): boolean {
  return value.replace(/,/g, "").trim() === "";
}

/** API stores amount off; form uses customer selling price. */
export function resolveMenuItemDiscountPayload(
  originalPrice: number,
  discountPriceInput: string,
  discountPercentageInput: string,
): { discountAmount: number | null; discountPercentage: number | null } {
  const priceBlank = isBlankPriceInput(discountPriceInput);
  const pctBlank = isBlankPriceInput(discountPercentageInput);

  if (priceBlank && pctBlank) {
    return { discountAmount: null, discountPercentage: null };
  }

  if (originalPrice <= 0) {
    return { discountAmount: null, discountPercentage: null };
  }

  const sellingPrice = priceBlank ? 0 : parsePriceInput(discountPriceInput);
  const pctNum = pctBlank ? 0 : parsePriceInput(discountPercentageInput);

  let discountAmount =
    sellingPrice > 0 && sellingPrice < originalPrice
      ? discountAmountFromSellingPrice(originalPrice, sellingPrice)
      : null;
  let discountPercentage = pctNum > 0 ? Math.min(pctNum, 100) : null;

  if (discountAmount == null && discountPercentage != null) {
    discountAmount = amountFromPercentage(originalPrice, discountPercentage);
  } else if (discountPercentage == null && discountAmount != null) {
    discountPercentage = percentageFromAmount(originalPrice, discountAmount);
  }

  if (discountAmount == null || discountAmount <= 0) {
    return { discountAmount: null, discountPercentage: null };
  }

  return { discountAmount, discountPercentage };
}
