import { Order, OrderHistoryEntry } from "@/services/orderService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, User } from "lucide-react";

interface Props {
    order: Order;
    history: OrderHistoryEntry[];
}

function formatTs(value?: string | null) {
    if (!value) return "—";
    return new Date(value).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

/** Terminal status label for the timestamps strip. */
function terminalLabel(status: string): string | null {
    if (status === "DELIVERED") return "Delivered";
    if (status === "PICKED_UP") return "Picked Up";
    if (status === "CANCELED") return "Canceled";
    return null;
}

/**
 * Prefer notification-backed history when present. Always keep a compact
 * timestamps strip (created / confirmed / terminal) so ops can see when things
 * happened even if history is sparse.
 */
export function OrderTimelineCard({ order, history }: Props) {
    const confirmedAt =
        history.find((e) => e.toStatus === "PAYMENT_SLIP_REQUESTED")?.changedAt ??
        history.find((e) => e.toStatus === "PAYMENT_VERIFIED")?.changedAt ??
        null;
    const terminalAt =
        history.find(
            (e) =>
                e.toStatus === "DELIVERED" ||
                e.toStatus === "PICKED_UP" ||
                e.toStatus === "CANCELED",
        )?.changedAt ??
        (terminalLabel(order.status) ? order.updatedAt : null);
    const terminal = terminalLabel(order.status);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Timeline
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
                {/* Key timestamps — always visible, additive only */}
                <div className="rounded-md border bg-muted/20 px-3 py-2 space-y-1.5">
                    <div className="flex justify-between gap-3 text-xs">
                        <span className="text-muted-foreground">Created</span>
                        <span className="font-medium tabular-nums text-right">{formatTs(order.createdAt)}</span>
                    </div>
                    {confirmedAt && (
                        <div className="flex justify-between gap-3 text-xs">
                            <span className="text-muted-foreground">Confirmed</span>
                            <span className="font-medium tabular-nums text-right">{formatTs(confirmedAt)}</span>
                        </div>
                    )}
                    {terminal && terminalAt && (
                        <div className="flex justify-between gap-3 text-xs">
                            <span className="text-muted-foreground">{terminal}</span>
                            <span className="font-medium tabular-nums text-right">{formatTs(terminalAt)}</span>
                        </div>
                    )}
                    <div className="flex justify-between gap-3 text-xs">
                        <span className="text-muted-foreground">Last Updated</span>
                        <span className="font-medium tabular-nums text-right">{formatTs(order.updatedAt)}</span>
                    </div>
                </div>

                {history.length > 0 ? (
                    <div className="space-y-4">
                        {history.map((event, idx) => (
                            <div key={event.id || idx} className="flex gap-4 relative">
                                {idx !== history.length - 1 && (
                                    <div className="absolute left-2.5 top-6 bottom-[-16px] w-[2px] bg-border rounded-full" />
                                )}
                                <div className="relative shrink-0 mt-1">
                                    <div className="h-5 w-5 rounded-full border-4 border-background bg-primary shadow-sm z-10 relative" />
                                </div>
                                <div className="pb-1 w-full">
                                    <div className="flex justify-between items-start mb-0.5">
                                        <p className="text-sm font-bold uppercase tracking-wide">
                                            {event.toStatus.replace(/_/g, " ")}
                                        </p>
                                        <p className="text-[10px] font-medium text-muted-foreground tabular-nums whitespace-nowrap">
                                            {new Date(event.changedAt).toLocaleString(undefined, {
                                                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                                            })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                                        <User className="h-3 w-3" />
                                        {event.changedByAdminName || event.changedBy || "System"}
                                    </div>
                                    {event.note && (
                                        <p className="text-xs bg-muted/50 text-muted-foreground p-2 mt-2 rounded border border-border/50">
                                            "{event.note}"
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground italic">
                        No status history events yet.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
