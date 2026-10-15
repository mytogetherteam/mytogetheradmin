import { Order } from "@/services/orderService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bike, ExternalLink, Phone, UserRound } from "lucide-react";
import { TableImage } from "@/components/TableImage";
import { deliveryTrackingTarget, type DeliveryCourier } from "./order-format";

const COURIER_LABELS: Record<DeliveryCourier, string> = {
    bolt: "Bolt",
    grab: "Grab",
};

const COURIER_BADGE: Record<DeliveryCourier, string> = {
    bolt: "bg-[#32BB78]/15 text-[#0F6E42] dark:text-[#8EE0B5]",
    grab: "bg-[#00B14F]/15 text-[#067A38] dark:text-[#7DDBA4]",
};

function isPickupOrder(order: Order): boolean {
    return [order.orderType, order.deliveryType].some((value) => {
        const type = (value ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_");
        return type === "PICK_UP" || type === "PICKUP";
    });
}

/**
 * Who is carrying this order: a Bolt or Grab tracking link the shop pasted,
 * or the shop's own delivery driver.
 */
export function DeliveryManCard({ order }: { order: Order }) {
    if (isPickupOrder(order)) return null;

    const tracking = deliveryTrackingTarget(order.trackingUrl);
    const driver = order.driver;
    const name = driver?.name?.trim() || "";
    const phone = driver?.phone?.trim() || "";
    const vehicle = driver?.vehicleNo?.trim() || "";
    const photo = driver?.profileUrl?.trim() || "";
    const hasPerson = Boolean(name || phone || vehicle || photo);
    if (!tracking && !hasPerson) return null;

    const tel = phone.replace(/[^\d+]/g, "");

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                        <Bike className="h-4 w-4" />
                        Delivery man
                    </span>
                    {tracking && (
                        <span
                            className={`inline-flex shrink-0 items-center rounded-md px-2.5 py-1 text-sm font-semibold ${COURIER_BADGE[tracking.courier]}`}
                        >
                            {COURIER_LABELS[tracking.courier]}
                        </span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {hasPerson && (
                    <div className="flex items-center gap-3">
                        <TableImage
                            src={photo || null}
                            alt={name || "Delivery man"}
                            size="lg"
                            fallbackIcon={<UserRound className="h-5 w-5 text-muted-foreground" />}
                        />
                        {name && (
                            <p className="min-w-0 font-medium truncate" title={name}>
                                {name}
                            </p>
                        )}
                    </div>
                )}

                {phone && (
                    <div className="flex justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">Phone</span>
                        {tel.length >= 6 ? (
                            <a href={`tel:${tel}`} className="font-medium inline-flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {phone}
                            </a>
                        ) : (
                            <span className="font-medium inline-flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {phone}
                            </span>
                        )}
                    </div>
                )}

                {vehicle && (
                    <div className="flex justify-between gap-3 text-sm">
                        <span className="shrink-0 text-muted-foreground">Vehicle</span>
                        <span className="font-medium text-right break-words">{vehicle}</span>
                    </div>
                )}

                {tracking && (
                    <a
                        href={tracking.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open {COURIER_LABELS[tracking.courier]} tracking
                    </a>
                )}
            </CardContent>
        </Card>
    );
}
