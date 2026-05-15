import { z } from "zod";

export const districtSchema = z.object({
  cityId: z.coerce.number().min(1, "Please select a city"),
  nameEn: z.string().min(1, "Name (English) is required"),
  nameMm: z.string().min(1, "Name (Myanmar) is required"),
  nameTh: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type DistrictFormValues = z.infer<typeof districtSchema>;
