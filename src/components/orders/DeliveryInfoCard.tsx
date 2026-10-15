import { Order } from "@/services/orderService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Clock, Calendar, AlertTriangle } from "lucide-react";
import { FAR_SHOP_DISTANCE_KM, ORDER_DELIVERY_TYPE_LABELS, shopToCustomerDistance } from "./order-format";

export function DeliveryInfoCard({ order }: { order: Order }) {
    const distance = shopToCustomerDistance(order);
    return (
        <Card className={distance?.far ? "border-red-400 dark:border-red-400/70" : undefined}>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Delivery Information
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {distance?.far && (
                    <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2.5 text-red-700 dark:border-red-400/40 dark:bg-red-500/15 dark:text-red-300">
                        <div className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-1.5 text-sm font-semibold">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                Over {FAR_SHOP_DISTANCE_KM} km
                            </span>
                            <span className="text-lg font-bold tabular-nums">{distance.label}</span>
                        </div>
                    </div>
                )}
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <Badge variant="secondary">
                        {order.orderType
                            ? (order.orderType === "PICK_UP" ? "Pick Up" : "Delivery")
                            : (order.deliveryType || "N/A")}
                    </Badge>
                </div>
                {distance && !distance.far && (
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Distance</span>
                        <span className="font-medium">{distance.label}</span>
                    </div>
                )}
                {order.orderType !== "PICK_UP" && (
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Delivery Type</span>
                        {order.orderDeliveryType ? (
                            <Badge variant="secondary">
                                {ORDER_DELIVERY_TYPE_LABELS[order.orderDeliveryType] ?? order.orderDeliveryType}
                            </Badge>
                        ) : (
                            // Only set at the payment-slip step, so it is legitimately
                            // empty on earlier statuses rather than missing.
                            <span className="font-medium text-muted-foreground">Not set</span>
                        )}
                    </div>
                )}
                {order.deliveryTier && (
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tier</span>
                        <span className="font-medium">{order.deliveryTier}</span>
                    </div>
                )}
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Waiting Time</span>
                    <span className="flex items-center gap-1 font-medium">
                        <Clock className="h-3 w-3" />
                        {typeof order.waitingTimeMinutes === "number"
                            ? `${order.waitingTimeMinutes} min`
                            : "N/A"}
                    </span>
                </div>
                {order.isScheduled && (
                    <div className="pt-2 border-t">
                        <p className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Scheduled For</p>
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <Calendar className="h-4 w-4 text-primary" />
                            {order.scheduledDeliveryTime}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
