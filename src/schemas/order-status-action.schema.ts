import { z } from "zod";

/**
 * SuperAdmin order status-change form. Fields are kept as strings (form inputs)
 * and coerced on submit. `superRefine` enforces the same per-status rules the
 * backend requires, so the user gets inline errors before the request is sent.
 */
export const orderStatusActionSchema = z
    .object({
        status: z.string().min(1, "Select a status"),
        cancelReason: z.string(),
        driverId: z.string(),
        orderDeliveryType: z.string(),
        deliveryFee: z.string(),
        waitingTimeMinutes: z.string(),
        reviseReason: z.string(),
        unavailableItems: z.array(z.number()),
    })
    .superRefine((v, ctx) => {
        if (v.status === "CANCELED" && !v.cancelReason.trim()) {
            ctx.addIssue({ code: "custom", path: ["cancelReason"], message: "Cancel reason is required" });
        }
        if (v.status === "ON_THE_WAY" && !v.driverId) {
            ctx.addIssue({ code: "custom", path: ["driverId"], message: "Select or create a driver" });
        }
        if (v.status === "PAYMENT_SLIP_REQUESTED") {
            if (!v.orderDeliveryType) {
                ctx.addIssue({ code: "custom", path: ["orderDeliveryType"], message: "Choose a delivery type" });
            }
            if (v.deliveryFee === "" || isNaN(Number(v.deliveryFee))) {
                ctx.addIssue({ code: "custom", path: ["deliveryFee"], message: "Enter a delivery fee" });
            }
            if (v.waitingTimeMinutes === "" || isNaN(Number(v.waitingTimeMinutes))) {
                ctx.addIssue({ code: "custom", path: ["waitingTimeMinutes"], message: "Enter waiting time (minutes)" });
            }
        }
        if (v.status === "REVISED") {
            if (!v.reviseReason.trim()) {
                ctx.addIssue({ code: "custom", path: ["reviseReason"], message: "Revise reason is required" });
            }
            if (v.unavailableItems.length === 0) {
                ctx.addIssue({ code: "custom", path: ["unavailableItems"], message: "Select at least one unavailable item" });
            }
        }
    });

export type OrderStatusActionValues = z.infer<typeof orderStatusActionSchema>;

export const orderStatusActionDefaults: OrderStatusActionValues = {
    status: "",
    cancelReason: "",
    driverId: "",
    orderDeliveryType: "",
    deliveryFee: "",
    waitingTimeMinutes: "",
    reviseReason: "",
    unavailableItems: [],
};

/** Driver quick-create form (inline, when a shop has no drivers). */
export const driverCreateSchema = z.object({
    name: z.string().min(1, "Name is required"),
    phone: z.string().min(1, "Phone is required"),
    vehicleNo: z.string().min(1, "Vehicle no. is required"),
});

export type DriverCreateValues = z.infer<typeof driverCreateSchema>;
