import { z } from "zod";

export const deliveryDriverShopSchema = z.object({
  id: z.coerce.number(),
  nameEn: z.string().nullable().optional(),
  nameMm: z.string().nullable().optional(),
  nameTh: z.string().nullable().optional(),
  slug: z.string().nullable().optional(),
});

export const deliveryDriverSchema = z.object({
  id: z.coerce.number(),
  shopId: z.coerce.number(),
  name: z.string(),
  phone: z.string(),
  vehicleNo: z.string(),
  profileUrl: z.string().nullable().optional(),
  isActive: z.coerce.boolean().default(true),
  isBusy: z.coerce.boolean().default(false),
  createdAt: z.coerce.string(),
  updatedAt: z.coerce.string(),
  deletedAt: z.coerce.string().nullable().optional(),
  shop: deliveryDriverShopSchema.optional(),
});

export const deliveryDriversPageSchema = z.object({
  content: z.array(deliveryDriverSchema),
  totalElements: z.coerce.number(),
  totalPages: z.coerce.number(),
  number: z.coerce.number().optional(),
  size: z.coerce.number().optional(),
});

export const deliveryDriverListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  shopId: z.coerce.number().int().positive().optional(),
  isActive: z.coerce.boolean().optional(),
  includeDeleted: z.coerce.boolean().optional(),
});

export type DeliveryDriverActiveFilter = "all" | "active" | "inactive";
export type DeliveryDriverDeletedFilter = "all" | "active-only";

export type DeliveryDriver = z.infer<typeof deliveryDriverSchema>;
export type DeliveryDriversPage = z.infer<typeof deliveryDriversPageSchema>;
export type DeliveryDriverListParams = z.infer<
  typeof deliveryDriverListParamsSchema
>;

export function getDeliveryDriverShopName(driver: DeliveryDriver): string {
  return (
    driver.shop?.nameEn?.trim() ||
    driver.shop?.nameMm?.trim() ||
    `Shop #${driver.shopId}`
  );
}

export function isDeliveryDriverDeleted(driver: DeliveryDriver): boolean {
  return Boolean(driver.deletedAt);
}
