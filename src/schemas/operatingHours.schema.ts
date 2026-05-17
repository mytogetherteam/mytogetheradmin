import { z } from 'zod';

export const operatingHoursFormSchema = z.object({
  operatingHours: z
    .array(
      z.object({
        dayOfWeek: z.number(),
        openTime: z.string(),
        closeTime: z.string(),
        isClosed: z.boolean(),
      }),
    )
    .length(7),
});

export type OperatingHoursFormValues = z.infer<typeof operatingHoursFormSchema>;
