import * as z from "zod";

export interface OperatingHour {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
}

export const shopFormSchema = z.object({
    nameEn: z.string().optional(),
    nameMm: z.string().optional().or(z.literal("")),
    nameTh: z.string().optional().or(z.literal("")),
    shopCategoryId: z.number().optional().nullable(),
    shopSubCategoryId: z.number().optional().nullable(),
    addressEn: z.string().optional(),
    addressMm: z.string().optional().or(z.literal("")),
    addressTh: z.string().optional().or(z.literal("")),
    districtId: z.number().optional().nullable(),
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),
    phone: z.string().optional(),
    email: z.string().optional().or(z.literal("")),
    descriptionEn: z.string().optional(),
    descriptionMm: z.string().optional().or(z.literal("")),
    descriptionTh: z.string().optional().or(z.literal("")),
    hasDelivery: z.boolean().default(false),
    deliveryEnabled: z.boolean().default(false),
    hasParking: z.boolean().default(false),
    hasWifi: z.boolean().default(false),
    isVerified: z.boolean().default(false),
    isActive: z.boolean().default(true),
    isHalal: z.boolean().default(false),
    isVegetarian: z.boolean().default(false),
    pricePreference: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
    enableStockCheck: z.boolean().default(false),
    maxItemQuantityPerOrder: z.number().default(10),
    minOrderAmount: z.coerce.number().default(1),
    baseDeliveryFee: z.coerce.number().default(0),
    cuisineTypeIds: z.array(z.number()).default([]),
    mealTypes: z.array(z.string()).default([]),
    supportedDeliveryTypes: z.array(z.string()).default([]),
    paymentMethodIds: z.array(z.number()).default([]),
    operatingHours: z.array(z.object({
        dayOfWeek: z.number(),
        openTime: z.string(),
        closeTime: z.string(),
        isClosed: z.boolean()
    })).default([]),
    assignedAdminId: z.coerce.number().optional().nullable(),
});

export type ShopFormValues = z.infer<typeof shopFormSchema>;
