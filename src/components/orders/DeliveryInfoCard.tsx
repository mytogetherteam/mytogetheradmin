import { Order } from "@/services/orderService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Clock, Calendar } from "lucide-react";
import { ORDER_DELIVERY_TYPE_LABELS } from "./order-format";

export function DeliveryInfoCard({ order }: { order: Order }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Delivery Information
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <Badge variant="secondary">
                        {order.orderType
                            ? (order.orderType === "PICK_UP" ? "Pick Up" : "Delivery")
                            : (order.deliveryType || "N/A")}
                    </Badge>
                </div>
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
