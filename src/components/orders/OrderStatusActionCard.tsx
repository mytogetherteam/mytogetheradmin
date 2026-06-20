import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Order, OrderStatus, ORDER_STATUSES, UpdateOrderStatusPayload,
} from "@/services/orderService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ShieldCheck } from "lucide-react";
import { useUpdateOrderStatusMutation } from "@/hooks/orders/useOrders";
import {
    orderStatusActionSchema,
    orderStatusActionDefaults,
    OrderStatusActionValues,
} from "@/schemas/order-status-action.schema";
import { DriverPicker } from "./DriverPicker";

interface Props {
    order: Order;
}

/** SuperAdmin order status-change form (validated with zod / react-hook-form). */
export function OrderStatusActionCard({ order }: Props) {
    const updateStatus = useUpdateOrderStatusMutation(String(order.id));

    const {
        control,
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<OrderStatusActionValues>({
        resolver: zodResolver(orderStatusActionSchema),
        defaultValues: orderStatusActionDefaults,
    });

    const status = useWatch({ control, name: "status" });

    const onSubmit = (v: OrderStatusActionValues) => {
        const payload: UpdateOrderStatusPayload = { status: v.status as OrderStatus };

        if (v.status === "CANCELED") payload.cancelReason = v.cancelReason.trim();
        if (v.status === "ON_THE_WAY") payload.driverId = Number(v.driverId);
        if (v.status === "PAYMENT_SLIP_REQUESTED") {
            payload.orderDeliveryType = v.orderDeliveryType as "FAST" | "FLEXIBLE";
            payload.deliveryFee = Number(v.deliveryFee);
            payload.waitingTimeMinutes = Number(v.waitingTimeMinutes);
        }
        if (v.status === "REVISED") {
            payload.reviseReason = v.reviseReason.trim();
            payload.unavailableItems = v.unavailableItems;
        }

        // The mutation handles success/error toasts and invalidates the
        // order/history/board queries — see useUpdateOrderStatusMutation.
        updateStatus.mutate(payload, {
            onSuccess: () => reset(orderStatusActionDefaults),
        });
    };

    return (
        <Card className="border-primary/30">
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    SuperAdmin Action
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                        Override the order status. Runs the same rules as the shop — driver
                        assignment, delivery details and item-revise are all handled below.
                    </p>

                    {/* Status */}
                    <Controller
                        control={control}
                        name="status"
                        render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder="Select new status…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ORDER_STATUSES.filter((s) => s !== order.status).map((s) => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}

                    {/* CANCELED */}
                    {status === "CANCELED" && (
                        <div>
                            <Textarea placeholder="Cancel reason (required)" className="text-sm min-h-[64px]" {...register("cancelReason")} />
                            {errors.cancelReason && <p className="text-xs text-destructive mt-1">{errors.cancelReason.message}</p>}
                        </div>
                    )}

                    {/* ON_THE_WAY → driver */}
                    {status === "ON_THE_WAY" && (
                        <Controller
                            control={control}
                            name="driverId"
                            render={({ field }) => (
                                <DriverPicker
                                    shopId={order.shopId}
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={errors.driverId?.message}
                                />
                            )}
                        />
                    )}

                    {/* PAYMENT_SLIP_REQUESTED → delivery details */}
                    {status === "PAYMENT_SLIP_REQUESTED" && (
                        <div className="space-y-2 rounded-md border bg-muted/30 p-2">
                            <p className="text-[11px] font-medium text-muted-foreground">Delivery details</p>
                            <Controller
                                control={control}
                                name="orderDeliveryType"
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className="h-9 text-sm">
                                            <SelectValue placeholder="Delivery type…" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="FAST">FAST</SelectItem>
                                            <SelectItem value="FLEXIBLE">FLEXIBLE</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.orderDeliveryType && <p className="text-xs text-destructive">{errors.orderDeliveryType.message}</p>}
                            <Input type="number" placeholder="Delivery fee" className="h-8 text-sm" {...register("deliveryFee")} />
                            {errors.deliveryFee && <p className="text-xs text-destructive">{errors.deliveryFee.message}</p>}
                            <Input type="number" placeholder="Waiting time (minutes)" className="h-8 text-sm" {...register("waitingTimeMinutes")} />
                            {errors.waitingTimeMinutes && <p className="text-xs text-destructive">{errors.waitingTimeMinutes.message}</p>}
                        </div>
                    )}

                    {/* REVISED → unavailable items + reason */}
                    {status === "REVISED" && (
                        <div className="space-y-2 rounded-md border bg-muted/30 p-2">
                            <p className="text-[11px] font-medium text-muted-foreground">Mark unavailable items</p>
                            <Controller
                                control={control}
                                name="unavailableItems"
                                render={({ field }) => (
                                    <>
                                        {order.items && order.items.length > 0 ? (
                                            <div className="space-y-1 max-h-[200px] overflow-y-auto">
                                                {order.items.map((item) => {
                                                    const itemId = Number(item.id);
                                                    const checked = field.value.includes(itemId);
                                                    return (
                                                        <label key={itemId} className="flex items-center gap-2 text-sm cursor-pointer rounded px-1 py-1 hover:bg-muted">
                                                            <input
                                                                type="checkbox"
                                                                className="h-4 w-4 accent-primary"
                                                                checked={checked}
                                                                onChange={() =>
                                                                    field.onChange(
                                                                        checked
                                                                            ? field.value.filter((i) => i !== itemId)
                                                                            : [...field.value, itemId],
                                                                    )
                                                                }
                                                            />
                                                            <span className="flex-1 truncate">
                                                                {item.quantity}× {item.menuItemName || item.name || `Item #${itemId}`}
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-xs italic text-muted-foreground">No items on this order.</p>
                                        )}
                                    </>
                                )}
                            />
                            {errors.unavailableItems && <p className="text-xs text-destructive">{errors.unavailableItems.message}</p>}
                            <Textarea placeholder="Revise reason (required)" className="text-sm min-h-[56px]" {...register("reviseReason")} />
                            {errors.reviseReason && <p className="text-xs text-destructive">{errors.reviseReason.message}</p>}
                        </div>
                    )}

                    <Button type="submit" className="w-full" size="sm" disabled={!status || updateStatus.isPending}>
                        {updateStatus.isPending ? "Applying…" : "Apply Status Change"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
