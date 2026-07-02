import type { FieldErrors, UseFormSetError } from "react-hook-form";
import type { z } from "zod";

import {
  COUPON_LIMIT_TYPES,
  COUPON_TARGETS,
  DISCOUNT_TYPES,
  PROMOTION_TYPES,
  normalizeCouponLimitType,
  normalizeCouponTarget,
  normalizeDiscountType,
  normalizePromotionType,
  type ShopCouponFormValues,
} from "@/schemas/shop-coupon.schema";
import type { ShopCouponListItem } from "@/services/shopCouponService";

export const promotionTypeLabels: Record<
  (typeof PROMOTION_TYPES)[number],
  string
> = {
  BUY_X_GET_DISCOUNT: "Buy X — get discount",
  BUY_X_GET_FREE: "Buy X — get free item",
};

export const discountTypeLabels: Record<
  (typeof DISCOUNT_TYPES)[number],
  string
> = {
  PERCENTAGE: "Percentage",
  FIXED_AMOUNT: "Fixed amount",
};

export const targetLabels: Record<(typeof COUPON_TARGETS)[number], string> = {
  ALL: "All users",
  EARLY_BIRD: "Early bird (new users)",
};

export const limitTypeLabels: Record<
  (typeof COUPON_LIMIT_TYPES)[number],
  string
> = {
  ONE_TIME: "One-time per user",
  PERMANENT: "Reusable",
};

/** Whole-number discount input (no decimals); caps percentage at 100. */
export function parseWholeDiscountValue(
  raw: string,
  discountType?: (typeof DISCOUNT_TYPES)[number],
): number | undefined {
  const digits = raw.replace(/\D/g, "");
  if (digits === "") return undefined;

  let value = parseInt(digits, 10);
  if (discountType === "PERCENTAGE" && value > 100) {
    value = 100;
  }
  return value;
}

export function formatWholeDiscountValue(value: number | undefined): string {
  if (value === undefined || Number.isNaN(value)) return "";
  return String(Math.trunc(value));
}

export function collectErrorMessages(
  fieldErrors: FieldErrors<ShopCouponFormValues>,
): string[] {
  const messages: string[] = [];
  for (const value of Object.values(fieldErrors)) {
    if (!value) continue;
    if ("message" in value && typeof value.message === "string") {
      messages.push(value.message);
      continue;
    }
    if (typeof value === "object") {
      messages.push(
        ...collectErrorMessages(value as FieldErrors<ShopCouponFormValues>),
      );
    }
  }
  return messages;
}

export function mapCouponToFormValues(
  coupon: ShopCouponListItem,
): ShopCouponFormValues {
  return {
    shopId: coupon.shopId,
    name: coupon.name,
    description: coupon.description ?? "",
    promotionType: normalizePromotionType(coupon.promotionType),
    discountType: normalizeDiscountType(coupon.discountType),
    discountValue: Math.trunc(coupon.discountValue),
    target: normalizeCouponTarget(coupon.target),
    validFrom: new Date(coupon.validFrom),
    validUntil: new Date(coupon.validUntil),
    limitType: normalizeCouponLimitType(coupon.limitType),
    maxRedemptions: coupon.maxRedemptions ?? null,
    bogoAllItems: coupon.bogoAllItems ?? false,
    isActive: coupon.isActive,
    items: [],
  };
}

export function applyZodIssuesToForm(
  issues: z.ZodIssue[],
  setError: UseFormSetError<ShopCouponFormValues>,
) {
  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field === "string") {
      setError(field as keyof ShopCouponFormValues, {
        message: issue.message,
      });
    }
  }
}
