import { z } from "zod";

const requiredPositiveInt = (message: string) =>
  z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().int().min(1, message),
  );

const optionalQrImageSchema = z
  .custom<File>(
    (value) =>
      value == null ||
      (typeof File !== "undefined" && value instanceof File),
    "QR image must be a valid file",
  )
  .optional()
  .nullable();

const shopPaymentTypeBaseSchema = z.object({
  accountName: z.string().trim().min(1, "Account name is required"),
  accountNumber: z.string().trim().min(1, "Account number is required"),
  displayOrder: requiredPositiveInt("Display order must be at least 1"),
  isActive: z.boolean(),
  qrImage: optionalQrImageSchema,
});

export const createShopPaymentTypeSchema = shopPaymentTypeBaseSchema.extend({
  shopId: requiredPositiveInt("Please select a shop"),
  paymentMethodId: requiredPositiveInt("Please select a payment method"),
});

export const updateShopPaymentTypeSchema = shopPaymentTypeBaseSchema.extend({
  shopId: requiredPositiveInt("Please select a shop"),
});

export type CreateShopPaymentTypeFormValues = z.infer<
  typeof createShopPaymentTypeSchema
>;

export type UpdateShopPaymentTypeFormValues = z.infer<
  typeof updateShopPaymentTypeSchema
>;
