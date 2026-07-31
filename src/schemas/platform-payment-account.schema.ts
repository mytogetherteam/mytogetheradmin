import { z } from "zod";

export const platformPaymentAccountSchema = z.object({
  paymentMethodId: z.coerce
    .number()
    .int()
    .min(1, "Payment method is required"),
  accountName: z
    .string()
    .trim()
    .min(1, "Account name is required")
    .max(150),
  accountNumber: z
    .string()
    .trim()
    .min(1, "Account number is required")
    .max(50),
  note: z.string().max(1000).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export type PlatformPaymentAccountFormValues = z.infer<
  typeof platformPaymentAccountSchema
>;
