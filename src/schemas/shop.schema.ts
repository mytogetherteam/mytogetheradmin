import * as z from "zod";

export interface OperatingHour {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
}

const shopPaymentMethodSchema = z.object({
    paymentMethodId: z.number(),
    accountName: z.string().trim().min(1, "Account name is required"),
    accountNumber: z.string().trim().min(1, "Account / phone number is required"),
    displayOrder: z.coerce.number().default(0),
    isActive: z.boolean().default(true),
    qr: z.string().optional().nullable(),
    qrFile: z.any().optional(),
});

const requiredPositiveNumber = (message: string) =>
    z.preprocess(
        (value) => {
            if (value === "" || value === undefined || value === null) return undefined
            const n = Number(value)
            return Number.isFinite(n) ? n : value
        },
        z.number({ error: message }).min(1, message).optional(),
    ).refine((value) => value !== undefined, { message })

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
    deliveryEnabled: z.boolean().default(false),
    isPickUp: z.boolean().default(false),
    hasParking: z.boolean().default(false),
    hasWifi: z.boolean().default(false),
    isVerified: z.boolean().default(false),
    isActive: z.boolean().default(true),
    isHalal: z.boolean().default(false),
    isVegetarian: z.boolean().default(false),
    pricePreference: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
    enableStockCheck: z.boolean().default(false),
    cuisineTypeIds: z.array(z.number()).default([]),
    paymentMethodIds: z.array(z.number()).default([]),
    shopPaymentMethods: z.array(shopPaymentMethodSchema).default([]),
    operatingHours: z.array(z.object({
        dayOfWeek: z.number(),
        openTime: z.string(),
        closeTime: z.string(),
        isClosed: z.boolean()
    })).default([]),
    adminEmail: z.string().optional(),
    adminUsername: z.string().optional(),
    adminPassword: z.string().min(6, "Password must be at least 6 characters long").optional().or(z.literal("")),
    adminConfirmPassword: z.string().min(6, "Confirm password must be at least 6 characters long").optional().or(z.literal("")),
}).refine((data) => {
    if (data.adminPassword || data.adminConfirmPassword) {
        return data.adminPassword === data.adminConfirmPassword;
    }
    return true;
}, {
    message: "Passwords do not match",
    path: ["adminConfirmPassword"],
});

export type ShopFormValues = z.infer<typeof shopFormSchema>;
