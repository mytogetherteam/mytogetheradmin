import { Order, OrderHistoryEntry } from "@/services/orderService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, User } from "lucide-react";

interface Props {
    order: Order;
    history: OrderHistoryEntry[];
}

export function OrderTimelineCard({ order, history }: Props) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Timeline
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
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
                    <div className="flex gap-3">
                        <div className="w-1 h-full bg-muted rounded" />
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-bold uppercase">Ordered On</p>
                                <p className="text-sm font-medium">
                                    {order.createdAt ? new Date(order.createdAt).toLocaleString() : "—"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase">Last Updated</p>
                                <p className="text-sm font-medium">
                                    {order.updatedAt ? new Date(order.updatedAt).toLocaleString() : "—"}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
