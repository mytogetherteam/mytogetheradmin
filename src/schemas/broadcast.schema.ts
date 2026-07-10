import { z } from "zod";

/** Mirrors `BroadcastAudience` from broadcastService. */
export const broadcastAudienceSchema = z.enum([
  "ALL",
  "USERS",
  "SHOP_ADMINS",
  "OPERATION_ADMINS",
  "SINGLE_USER",
  "SINGLE_SHOP",
  "USER_GROUP",
  "SHOP_GROUP",
]);

const optionalId = z.number().int().positive().optional();

/**
 * Compose-broadcast form. `maxLength` values match the Title (200) and Message
 * (2000) inputs on the Broadcast page. SINGLE_USER / SINGLE_SHOP require their
 * matching target id, enforced in `superRefine`.
 */
export const broadcastFormSchema = z
  .object({
    audience: broadcastAudienceSchema,
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(200, "Title must be 200 characters or fewer"),
    message: z
      .string()
      .trim()
      .min(1, "Message is required")
      .max(2000, "Message must be 2000 characters or fewer"),
    targetUserId: optionalId,
    targetShopId: optionalId,
    targetUserGroupId: optionalId,
    targetShopGroupId: optionalId,
  })
  .superRefine((values, ctx) => {
    if (values.audience === "SINGLE_USER" && values.targetUserId == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetUserId"],
        message: "Please select a user",
      });
    }
    if (values.audience === "SINGLE_SHOP" && values.targetShopId == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetShopId"],
        message: "Please select a shop",
      });
    }
    if (values.audience === "USER_GROUP" && values.targetUserGroupId == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetUserGroupId"],
        message: "Please select a user group",
      });
    }
    if (values.audience === "SHOP_GROUP" && values.targetShopGroupId == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetShopGroupId"],
        message: "Please select a shop group",
      });
    }
  });

export type BroadcastAudienceValue = z.infer<typeof broadcastAudienceSchema>;
export type BroadcastFormValues = z.infer<typeof broadcastFormSchema>;
