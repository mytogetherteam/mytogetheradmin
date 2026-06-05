import { z } from "zod";

export const collectionSchema = z.object({
  name: z.string().min(1, "Name is required").max(150, "Name is too long"),
  description: z
    .string()
    .max(1000, "Description is too long")
    .optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export type CollectionFormValues = z.infer<typeof collectionSchema>;
