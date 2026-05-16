import { z } from "zod";

export const citySchema = z.object({
    nameEn: z.string().min(1, "Name (English) is required"),
    nameMm: z.string().min(1, "Name (Myanmar) is required"),
    nameTh: z.string().optional(),
    isActive: z.boolean().default(true),
});

export type CityFormValues = z.infer<typeof citySchema>;
