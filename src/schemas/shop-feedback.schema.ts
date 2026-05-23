import { z } from "zod";

export const shopFeedbackShopSchema = z.object({
  id: z.coerce.number(),
  nameEn: z.string(),
  nameMm: z.string().nullable().optional(),
  slug: z.string().nullable().optional(),
});

export const shopFeedbackAdminSchema = z.object({
  id: z.coerce.number(),
  email: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
});

export const shopFeedbackSchema = z.object({
  id: z.coerce.number(),
  shopId: z.coerce.number(),
  adminId: z.coerce.number().nullable().optional(),
  message: z.string(),
  isRead: z.coerce.boolean().default(false),
  createdAt: z.coerce.string(),
  updatedAt: z.coerce.string(),
  shop: shopFeedbackShopSchema.optional(),
  admin: shopFeedbackAdminSchema.nullable().optional(),
});

export const shopFeedbackPageSchema = z.object({
  content: z.array(shopFeedbackSchema),
  totalElements: z.coerce.number(),
  totalPages: z.coerce.number(),
  page: z.coerce.number().optional(),
  size: z.coerce.number().optional(),
});

export const shopFeedbackListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  shopId: z.coerce.number().int().positive().optional(),
  isRead: z.coerce.boolean().optional(),
});

export type ShopFeedbackReadFilter = "all" | "unread" | "read";

export type ShopFeedback = z.infer<typeof shopFeedbackSchema>;
export type ShopFeedbackPage = z.infer<typeof shopFeedbackPageSchema>;
export type ShopFeedbackListParams = z.infer<
  typeof shopFeedbackListParamsSchema
>;

export type ShopFeedbackGroup = {
  shopId: number;
  shopName: string;
  shopNameMm?: string | null;
  messages: ShopFeedback[];
  unreadCount: number;
};

export function getShopDisplayName(feedback: ShopFeedback): string {
  return (
    feedback.shop?.nameEn?.trim() ||
    `Shop #${feedback.shopId}`
  );
}

export function groupShopFeedbackByShop(
  items: ShopFeedback[],
): ShopFeedbackGroup[] {
  const map = new Map<number, ShopFeedbackGroup>();

  for (const item of items) {
    const existing = map.get(item.shopId);
    if (existing) {
      existing.messages.push(item);
      continue;
    }
    map.set(item.shopId, {
      shopId: item.shopId,
      shopName: getShopDisplayName(item),
      shopNameMm: item.shop?.nameMm ?? null,
      messages: [item],
      unreadCount: item.isRead ? 0 : 1,
    });
  }

  for (const group of map.values()) {
    group.unreadCount = group.messages.filter((m) => !m.isRead).length;
  }

  return Array.from(map.values()).sort((a, b) =>
    a.shopName.localeCompare(b.shopName),
  );
}
