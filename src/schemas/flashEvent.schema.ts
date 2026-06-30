import { z } from "zod";

export const flashEventSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(150, "Name is too long"),
    description: z.string().max(1000, "Description is too long").optional(),
    type: z.enum(["DROP", "DEAL"]),
    // datetime-local values (e.g. "2026-06-30T16:00"); converted to ISO on submit.
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
    // 0 / undefined = no shop scope (cross-shop).
    shopId: z.number().int().optional(),
  })
  .refine(
    (data) =>
      new Date(data.endTime).getTime() > new Date(data.startTime).getTime(),
    { path: ["endTime"], message: "End time must be after start time" },
  );

export type FlashEventFormValues = z.infer<typeof flashEventSchema>;
