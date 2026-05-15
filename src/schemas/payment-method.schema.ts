import { z } from "zod";

export const paymentMethodSchema = z.object({
  name: z.string().min(1, "Name is required"),
  isActive: z.boolean().default(true),
});

export type PaymentMethodFormValues = z.infer<typeof paymentMethodSchema>;
