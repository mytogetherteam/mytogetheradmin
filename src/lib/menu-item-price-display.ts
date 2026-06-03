/** Row shape from menu list / approval APIs */
export type MenuItemPriceRow = {
  price?: number | null;
  originalPrice?: number | null;
  discountAmount?: number | null;
  discountPercentage?: number | null;
};

/**
 * Customer-facing amount. Prefer API `price`; otherwise derive from original − discount.
 */
export function resolveSellingPrice(item: MenuItemPriceRow): number {
  const original = Number(item.originalPrice) || 0;
  const discountAmount = Number(item.discountAmount) || 0;
  if (discountAmount > 0 || discountAmount !== null) {
    return discountAmount;
  }
  return original;
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
