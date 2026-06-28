import { z } from "zod";

export const PROMOTION_TYPES = ["BUY_X_GET_DISCOUNT", "BUY_X_GET_FREE"] as const;
export const DISCOUNT_TYPES = ["PERCENTAGE", "FIXED_AMOUNT"] as const;
export const COUPON_TARGETS = ["ALL", "EARLY_BIRD"] as const;
export const COUPON_LIMIT_TYPES = ["ONE_TIME", "PERMANENT"] as const;
export const COUPON_ITEM_TYPES = ["BUY", "GET"] as const;

const couponItemSchema = z.object({
  menuItemId: z.coerce.number().int().min(1, "Menu item is required"),
  type: z.enum(COUPON_ITEM_TYPES),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1").default(1),
});

export const shopCouponSchema = z
  .object({
    shopId: z.coerce.number().int().min(1, "Please select a shop"),
    name: z.string().trim().min(1, "Name is required").max(150, "Name is too long"),
    description: z
      .string()
      .max(1000, "Description is too long")
      .optional()
      .or(z.literal("")),
    promotionType: z.enum(PROMOTION_TYPES),
    discountType: z.enum(DISCOUNT_TYPES).optional(),
    discountValue: z.coerce.number().optional(),
    target: z.enum(COUPON_TARGETS, { message: "Target audience is required" }),
    validFrom: z.date({ message: "Start date is required" }),
    validUntil: z.date({ message: "End date is required" }),
    limitType: z.enum(COUPON_LIMIT_TYPES, { message: "Usage limit is required" }),
    isActive: z.boolean().default(true),
    items: z.array(couponItemSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.validUntil.getTime() <= data.validFrom.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date must be after start date",
        path: ["validUntil"],
      });
    }

    if (data.promotionType === "BUY_X_GET_DISCOUNT") {
      if (!data.discountType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Discount type is required",
          path: ["discountType"],
        });
      }
      if (data.discountValue === undefined || Number.isNaN(data.discountValue)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Discount value is required",
          path: ["discountValue"],
        });
      } else if (
        data.discountType === "PERCENTAGE" &&
        (data.discountValue <= 0 || data.discountValue > 100)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Percentage must be between 1 and 100",
          path: ["discountValue"],
        });
      } else if (
        data.discountType === "FIXED_AMOUNT" &&
        data.discountValue <= 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Fixed amount must be greater than 0",
          path: ["discountValue"],
        });
      }
    }

    if (data.promotionType === "BUY_X_GET_FREE") {
      const items = data.items ?? [];
      // A GET (free) item is always required. BUY items are optional — a coupon
      // may grant a free item with no purchase requirement.
      const hasGet = items.some((item) => item.type === "GET");
      if (!hasGet) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Add at least one free (GET) menu item",
          path: ["items"],
        });
      }
    }
  });

export type ShopCouponFormValues = z.infer<typeof shopCouponSchema>;

export function normalizeCouponTarget(
  value: unknown,
): (typeof COUPON_TARGETS)[number] {
  return value === "EARLY_BIRD" ? "EARLY_BIRD" : "ALL";
}

export function normalizeCouponLimitType(
  value: unknown,
): (typeof COUPON_LIMIT_TYPES)[number] {
  return value === "PERMANENT" ? "PERMANENT" : "ONE_TIME";
}

export function normalizePromotionType(
  value: unknown,
): (typeof PROMOTION_TYPES)[number] {
  return value === "BUY_X_GET_FREE" ? "BUY_X_GET_FREE" : "BUY_X_GET_DISCOUNT";
}

export function normalizeDiscountType(
  value: unknown,
): (typeof DISCOUNT_TYPES)[number] {
  return value === "FIXED_AMOUNT" ? "FIXED_AMOUNT" : "PERCENTAGE";
}
