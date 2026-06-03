/** Row shape from menu list / approval APIs */
export type MenuItemPriceRow = {
  price?: number | null;
  originalPrice?: number | null;
  discountAmount?: number | null;
  discountPercentage?: number | null;
};

/**
 * Customer-facing amount. Prefer API `price`; otherwise derive from original − discount
 * (same rules as Nest `effectiveMenuItemPrice`).
 */
export function resolveSellingPrice(item: MenuItemPriceRow): number {
  const apiPrice = Number(item.price);
  if (Number.isFinite(apiPrice) && apiPrice > 0) {
    return apiPrice;
  }

  const base = Number(item.originalPrice) || 0;
  const discountAmount = Number(item.discountAmount) || 0;
  if (item.discountAmount != null && discountAmount > 0) {
    const discounted = Math.max(0, base - discountAmount);
    return discounted > 0 ? discounted : base;
  }

  const discountPct = Number(item.discountPercentage) || 0;
  if (item.discountPercentage != null && discountPct > 0) {
    return Math.max(0, base * (1 - discountPct / 100));
  }

  return base;
}

/** When discount price is 0 or equals list price, show list price only (no 0, no strikethrough). */
export function getMenuItemPriceDisplay(item: MenuItemPriceRow): {
  amount: number | null;
  showStrikethroughOriginal: boolean;
} {
  const original = Number(item.originalPrice) || 0;
  const selling = resolveSellingPrice(item);

  const hasDiscount = original > 0 && selling > 0 && selling < original;

  if (!hasDiscount) {
    const amount = original > 0 ? original : selling > 0 ? selling : null;
    return { amount, showStrikethroughOriginal: false };
  }

  return { amount: selling, showStrikethroughOriginal: true };
}
