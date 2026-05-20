import { z } from "zod";

export const bannerPositionSchema = z.enum(["Ads", "Promotions"]);
export const bannerStatusSchema = z.enum(["Active", "Hide"]);

const toDateInput = (value: string) =>
  value.includes("T") ? value.split("T")[0]! : value;

const bannerImageRawSchema = z.object({
  id: z.coerce.number(),
  nameEn: z.string().optional().nullable(),
  nameMm: z.string().optional().nullable(),
  nameTh: z.string().nullable().optional(),
  image: z.string(),
  link: z.string().nullable().optional(),
  position: bannerPositionSchema,
  status: bannerStatusSchema,
  startDate: z.coerce.string().optional().nullable(),
  endDate: z.coerce.string().optional().nullable(),
  EndDate: z.coerce.string().optional().nullable(),
  createdAt: z.coerce.string().optional(),
  updatedAt: z.coerce.string().optional(),
});

export const bannerImageSchema = bannerImageRawSchema.transform((banner) => ({
  id: banner.id,
  nameEn: banner.nameEn?.trim() || `Banner ${banner.id}`,
  nameMm: banner.nameMm?.trim() || `Banner ${banner.id}`,
  nameTh: banner.nameTh ?? undefined,
  imageUrl: banner.image,
  linkUrl: banner.link ?? undefined,
  position: banner.position,
  isActive: banner.status === "Active",
  startDate: toDateInput(
    banner.startDate ?? banner.createdAt ?? new Date().toISOString(),
  ),
  endDate: toDateInput(
    banner.endDate ?? banner.EndDate ?? banner.updatedAt ?? new Date().toISOString(),
  ),
  createdAt: banner.createdAt,
  updatedAt: banner.updatedAt,
}));

export const bannersPageSchema = z.object({
  content: z.array(bannerImageSchema),
  totalElements: z.number(),
  totalPages: z.number(),
  number: z.number().optional(),
  size: z.number().optional(),
});

const bannerFormBaseSchema = z.object({
  nameEn: z.string().trim().min(1, "English title is required"),
  nameMm: z.string().trim().min(1, "Myanmar title is required"),
  nameTh: z.string().trim().optional(),
  linkUrl: z.string().trim().optional(),
  position: bannerPositionSchema,
  isActive: z.boolean(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

export const bannerFormSchema = bannerFormBaseSchema.refine(
  (data) => data.endDate >= data.startDate,
  {
    message: "End date must be on or after start date",
    path: ["endDate"],
  },
);

/** Partial banner updates (used for inline edits like toggling active). */
export const bannerPartialUpdateSchema = bannerFormBaseSchema.partial();

/** Active/inactive toggle only. */
export const bannerToggleSchema = z.object({
  isActive: z.boolean(),
});

export type BannerImage = z.infer<typeof bannerImageSchema>;
export type BannerPosition = z.infer<typeof bannerPositionSchema>;
export type BannersPage = z.infer<typeof bannersPageSchema>;
export type BannerFormValues = z.infer<typeof bannerFormSchema>;
export type BannerPartialUpdate = z.infer<typeof bannerPartialUpdateSchema>;
