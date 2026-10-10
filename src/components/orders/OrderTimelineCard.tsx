import { useEffect, useState } from "react";
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

/** "2 hrs", "3 hrs and 20 min", "1 day, 2 hrs and 5 min". Null when the gap is zero or invalid. */
function formatElapsed(from?: string | null, to?: string | null): string | null {
    if (!from || !to) return null;
    const start = new Date(from).getTime();
    const end = new Date(to).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
    const ms = end - start;
    if (ms <= 0) return null;
    if (ms < 30_000) return "< 1 min";

    const totalMinutes = Math.round(ms / 60_000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;
    const parts: string[] = [];
    if (days > 0) parts.push(days === 1 ? "1 day" : `${days} days`);
    if (hours > 0) parts.push(hours === 1 ? "1 hr" : `${hours} hrs`);
    if (minutes > 0) parts.push(`${minutes} min`);
    if (parts.length === 0) return "< 1 min";
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
    return `${parts[0]}, ${parts[1]} and ${parts[2]}`;
}

function TimestampRow({ label, at }: { label: string; at?: string | null }) {
    return (
        <div className="flex justify-between gap-3 text-xs">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium tabular-nums text-right">{formatTs(at)}</span>
        </div>
    );
}

/** Full span from placement. Same-minute orders read as under a minute. */
function orderLength(from?: string | null, to?: string | null): string | null {
    if (!from || !to) return null;
    const start = new Date(from).getTime();
    const end = new Date(to).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
    return formatElapsed(from, to) ?? "< 1 min";
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
    const rows: { label: string; at: string }[] = [
        { label: "Created", at: order.createdAt },
    ];
    if (confirmedAt) rows.push({ label: "Confirmed", at: confirmedAt });
    if (terminal && terminalAt) rows.push({ label: terminal, at: terminalAt });
    rows.push({ label: "Last Updated", at: order.updatedAt });
    const finished = Boolean(terminal && terminalAt);
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        if (finished) return;
        const timer = window.setInterval(() => setNow(Date.now()), 30_000);
        return () => window.clearInterval(timer);
    }, [finished]);
    const lengthEnd = finished ? terminalAt : new Date(now).toISOString();
    const length = orderLength(order.createdAt, lengthEnd);
    const lengthLabel =
        order.status === "CANCELED"
            ? "Canceled after"
            : finished
              ? "Completed in"
              : "Open for";

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
                    {rows.map((row) => (
                        <TimestampRow key={`${row.label}-${row.at}`} label={row.label} at={row.at} />
                    ))}
                    {length ? (
                        <div className="flex justify-between gap-3 border-t pt-1.5 text-xs">
                            <span className="text-muted-foreground">{lengthLabel}</span>
                            <span className="font-semibold text-primary">{length}</span>
                        </div>
                    ) : null}
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
