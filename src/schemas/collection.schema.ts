import { z } from "zod";

export const collectionSchema = z.object({
  name: z.string().min(1, "Name is required").max(150, "Name is too long"),
  nameEn: z.string().max(150).optional(),
  nameMm: z.string().max(150).optional(),
  nameTh: z.string().max(150).optional(),
  description: z
    .string()
    .max(1000, "Description is too long")
    .optional(),
  descriptionEn: z.string().max(1000).optional(),
  descriptionMm: z.string().max(1000).optional(),
  descriptionTh: z.string().max(1000).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export type CollectionFormValues = z.infer<typeof collectionSchema>;
