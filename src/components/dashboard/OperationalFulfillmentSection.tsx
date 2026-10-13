import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    CheckCircle2,
    XCircle,
    Clock,
    Bike,
    ChefHat,
    ShoppingBag,
    ArrowUpRight,
    Store,
    ShieldCheck,
    Timer,
    AlertCircle,
    Layers,
} from "lucide-react";
import { orderService, Order, OrderHealthData } from "@/services/orderService";
import { analyticsService, CancellationRateData } from "@/services/analyticsService";
import { STATUS_COLORS } from "@/components/orders/order-format";

interface Props {
    orderHealth: OrderHealthData;
    extendedStats?: {
        avgDeliveryTime?: number;
        fleetStatus?: {
            active: number;
            busy: number;
            total: number;
        };
    } | null;
    latestOrder?: { message?: string; id?: string | number } | null;
    isLive?: boolean;
    startDate?: string;
    endDate?: string;
}

function formatRelativeTime(dateString?: string) {
    if (!dateString) return "just now";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "just now";

    const diffMs = Date.now() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 45) return "just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function OperationalFulfillmentSection({
    orderHealth,
    extendedStats,
    latestOrder,
    isLive,
    startDate,
    endDate,
}: Props) {
    const navigate = useNavigate();

    // Cancellation & Fulfillment stats
    const [cancellationData, setCancellationData] = useState<CancellationRateData | null>(null);
    const [cancellationLoading, setCancellationLoading] = useState(true);

    // Live recent real orders stream
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(true);

    // Fetch cancellation stats
    useEffect(() => {
        let isMounted = true;
        async function fetchCancellation() {
            try {
                setCancellationLoading(true);
                const data = await analyticsService.getCancellationRate(startDate, endDate);
                if (isMounted) setCancellationData(data);
            } catch {
                // Graceful fallback
            } finally {
                if (isMounted) setCancellationLoading(false);
            }
        }
        fetchCancellation();
        return () => {
            isMounted = false;
        };
    }, [startDate, endDate]);

    // Fetch real recent orders
    useEffect(() => {
        let isMounted = true;
        async function fetchRecentOrders() {
            try {
                setOrdersLoading(true);
                const page = await orderService.getOrders({ size: 8 });
                if (isMounted && page?.content) {
                    setRecentOrders(page.content);
                }
            } catch {
                // If error, active orders fallback
                try {
                    const activePage = await orderService.getActiveOrders({ size: 8 });
                    if (isMounted && activePage?.content) {
                        setRecentOrders(activePage.content);
                    }
                } catch {
                    // Ignore
                }
            } finally {
                if (isMounted) setOrdersLoading(false);
            }
        }
        fetchRecentOrders();
        return () => {
            isMounted = false;
        };
    }, []);

    // Listen to latestOrder from WebSocket and prepend smoothly
    useEffect(() => {
        if (!latestOrder) return;
        const newOrderId = latestOrder.id;
        if (!newOrderId) return;

        // Fetch new order detail or construct teaser
        orderService
            .getOrderDetail(String(newOrderId))
            .then((order) => {
                if (order && order.id) {
                    setRecentOrders((prev) => {
                        const exists = prev.some((o) => o.id === order.id);
                        if (exists) return prev;
                        return [order, ...prev.slice(0, 9)];
                    });
                }
            })
            .catch(() => {
                // Fallback teaser item
                setRecentOrders((prev) => [
                    {
                        id: Number(newOrderId) || 0,
                        orderId: String(newOrderId),
                        status: "PENDING",
                        statusLabel: "Pending",
                        statusLabelMm: "စတင်မှာယူထားသည်",
                        deliveryType: "DELIVERY",
                        isScheduled: false,
                        deliveryFee: 0,
                        totalAmount: 0,
                        items: [],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        userFullName: "Customer",
                        shopName: "Restaurant",
                    } as unknown as Order,
                    ...prev.slice(0, 9),
                ]);
            });
    }, [latestOrder]);

    // Derived Fulfillment Calculations
    const {
        totalOrdersCount,
        cancelledOrdersCount,
        fulfillmentRatePercent,
        cancellationRatePercent,
    } = useMemo(() => {
        if (cancellationData && cancellationData.totalOrders > 0) {
            const total = cancellationData.totalOrders;
            const cancelled = cancellationData.cancelledOrders;
            const rate = Math.max(0, 100 - cancellationData.cancellationRatePercent);
            return {
                totalOrdersCount: total,
                cancelledOrdersCount: cancelled,
                fulfillmentRatePercent: Number(rate.toFixed(1)),
                cancellationRatePercent: Number(cancellationData.cancellationRatePercent.toFixed(1)),
            };
        }

        // Fallback calculation from orderHealth
        const pending = orderHealth["PENDING"] || 0;
        const cooking = (orderHealth["COOKING"] || 0) + (orderHealth["PREPARING"] || 0);
        const onTheWay = (orderHealth["ON_THE_WAY"] || 0) + (orderHealth["DELIVERING"] || 0);
        const delivered = (orderHealth["DELIVERED"] || 0) + (orderHealth["PICKED_UP"] || 0);
        const cancelled = (orderHealth["CANCELED"] || 0) + (orderHealth["CANCELLED"] || 0);
        const total = pending + cooking + onTheWay + delivered + cancelled;

        if (total === 0) {
            return {
                totalOrdersCount: 0,
                cancelledOrdersCount: 0,
                fulfillmentRatePercent: 100,
                cancellationRatePercent: 0,
            };
        }

        const successRate = Math.max(0, 100 - (cancelled / total) * 100);
        return {
            totalOrdersCount: total,
            cancelledOrdersCount: cancelled,
            fulfillmentRatePercent: Number(successRate.toFixed(1)),
            cancellationRatePercent: Number(((cancelled / total) * 100).toFixed(1)),
        };
    }, [cancellationData, orderHealth]);

    // Active pipeline counts
    const inFlightPipeline = useMemo(() => {
        const pendingCount =
            (orderHealth["PENDING"] || 0) +
            (orderHealth["PAYMENT_SLIP_REQUESTED"] || 0) +
            (orderHealth["AWAITING_APPROVAL"] || 0);
        const kitchenCount =
            (orderHealth["COOKING"] || 0) +
            (orderHealth["PREPARING"] || 0) +
            (orderHealth["PAYMENT_VERIFIED"] || 0);
        const deliveryCount =
            (orderHealth["ON_THE_WAY"] || 0) +
            (orderHealth["READY_FOR_PICKUP"] || 0) +
            (orderHealth["DELIVERING"] || 0);

        const totalInFlight = pendingCount + kitchenCount + deliveryCount;
        return {
            pendingCount,
            kitchenCount,
            deliveryCount,
            totalInFlight,
        };
    }, [orderHealth]);

    const fleetStatus = extendedStats?.fleetStatus || { active: 0, busy: 0, total: 0 };
    const avgDeliveryTime = extendedStats?.avgDeliveryTime || 25;

    return (
        <div className="grid gap-4 md:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
            {/* Left 2 Columns: Operational Fulfillment & Health Intelligence */}
            <Card className="md:col-span-2 border-border/70 shadow-sm overflow-hidden bg-card/90">
                <CardHeader className="pb-3 border-b border-border/40 bg-muted/15 flex flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle className="text-base flex items-center gap-2">
                            <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                            Fulfillment &amp; Operational Health
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Order fulfillment success rate, pipeline velocity, and rider dispatch
                        </CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                        {fulfillmentRatePercent >= 95 ? (
                            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 text-xs">
                                <CheckCircle2 className="h-3 w-3" />
                                High Performance
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-xs text-amber-600 border-amber-500/30 gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Review Cancellations
                            </Badge>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 space-y-5">
                    {/* Top Row: Fulfillment Score & Key Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        {/* Fulfillment Radial Score Card */}
                        <div className="p-4 rounded-xl border border-border/70 bg-gradient-to-br from-emerald-500/10 via-background to-background flex items-center gap-3.5 shadow-xs">
                            <div className="relative flex items-center justify-center h-14 w-14 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0 ring-4 ring-emerald-500/10">
                                {cancellationLoading && !cancellationData ? (
                                    <Skeleton className="h-6 w-10 rounded" />
                                ) : (
                                    <span className="text-sm font-bold">{fulfillmentRatePercent}%</span>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                    Fulfillment Rate
                                </p>
                                <p className="text-sm font-bold text-foreground truncate mt-0.5">
                                    {fulfillmentRatePercent >= 95 ? "Excellent Target" : "Under Target"}
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    {cancellationRatePercent}% cancellation rate
                                </p>
                            </div>
                        </div>

                        {/* Average Delivery Transit Time */}
                        <div className="p-4 rounded-xl border border-border/70 bg-card/60 flex items-center gap-3.5 shadow-xs">
                            <div className="h-12 w-12 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0 border border-pink-500/20">
                                <Timer className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                    Avg. Delivery Time
                                </p>
                                <p className="text-lg font-bold text-foreground mt-0.5">
                                    {avgDeliveryTime} mins
                                </p>
                                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                    Target: &lt; 30 mins
                                </p>
                            </div>
                        </div>

                        {/* Active Rider Fleet Utilization */}
                        <div className="p-4 rounded-xl border border-border/70 bg-card/60 flex items-center gap-3.5 shadow-xs">
                            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                                <Bike className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                    Rider Fleet
                                </p>
                                <p className="text-lg font-bold text-foreground mt-0.5">
                                    {fleetStatus.active + fleetStatus.busy} Total
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                    <span className="text-emerald-600 font-semibold">{fleetStatus.active} free</span> ·{" "}
                                    <span className="text-orange-500 font-semibold">{fleetStatus.busy} busy</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Middle: Live Order Pipeline Stages Track */}
                    <div className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-foreground flex items-center gap-1.5">
                                <Layers className="h-3.5 w-3.5 text-pink-500" />
                                In-Flight Order Stages
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                                {inFlightPipeline.totalInFlight} orders currently progressing
                            </span>
                        </div>

                        {/* Visual Progress Segments */}
                        <div className="w-full h-3 rounded-full bg-muted overflow-hidden flex shadow-inner">
                            {inFlightPipeline.totalInFlight === 0 ? (
                                <div className="w-full h-full bg-muted-foreground/15" />
                            ) : (
                                <>
                                    <div
                                        className="h-full bg-amber-400 transition-all duration-500"
                                        style={{
                                            width: `${(inFlightPipeline.pendingCount / inFlightPipeline.totalInFlight) * 100}%`,
                                        }}
                                        title={`Pending: ${inFlightPipeline.pendingCount}`}
                                    />
                                    <div
                                        className="h-full bg-orange-500 transition-all duration-500"
                                        style={{
                                            width: `${(inFlightPipeline.kitchenCount / inFlightPipeline.totalInFlight) * 100}%`,
                                        }}
                                        title={`Kitchen: ${inFlightPipeline.kitchenCount}`}
                                    />
                                    <div
                                        className="h-full bg-indigo-500 transition-all duration-500"
                                        style={{
                                            width: `${(inFlightPipeline.deliveryCount / inFlightPipeline.totalInFlight) * 100}%`,
                                        }}
                                        title={`Delivering: ${inFlightPipeline.deliveryCount}`}
                                    />
                                </>
                            )}
                        </div>

                        {/* Pipeline Stage Badges */}
                        <div className="grid grid-cols-3 gap-2 text-center pt-1 text-xs">
                            <div className="p-2 rounded-lg bg-background border border-border/60">
                                <div className="flex items-center justify-center gap-1 text-amber-600 font-bold text-sm">
                                    <Clock className="h-3.5 w-3.5" />
                                    {inFlightPipeline.pendingCount}
                                </div>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                                    Pending Slip
                                </span>
                            </div>

                            <div className="p-2 rounded-lg bg-background border border-border/60">
                                <div className="flex items-center justify-center gap-1 text-orange-600 font-bold text-sm">
                                    <ChefHat className="h-3.5 w-3.5" />
                                    {inFlightPipeline.kitchenCount}
                                </div>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                                    Kitchen Prep
                                </span>
                            </div>

                            <div className="p-2 rounded-lg bg-background border border-border/60">
                                <div className="flex items-center justify-center gap-1 text-indigo-600 font-bold text-sm">
                                    <Bike className="h-3.5 w-3.5" />
                                    {inFlightPipeline.deliveryCount}
                                </div>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                                    On The Way
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Status Summary Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-muted-foreground border-t border-border/40">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                {totalOrdersCount > 0 ? totalOrdersCount - cancelledOrdersCount : 0} Orders Fulfilled
                            </span>
                            <span className="flex items-center gap-1">
                                <XCircle className="h-3.5 w-3.5 text-red-500" />
                                {cancelledOrdersCount} Cancelled
                            </span>
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
                            onClick={() => navigate("/orders")}
                        >
                            <span>Open Live Orders Board</span>
                            <ArrowUpRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Right 1 Column: Real-Time Live Orders Stream */}
            <Card className="border-border/70 shadow-sm overflow-hidden bg-card/90 flex flex-col">
                <CardHeader className="pb-3 border-b border-border/40 bg-muted/15 flex flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle className="text-base flex items-center gap-2">
                            <ShoppingBag className="h-4.5 w-4.5 text-pink-600 dark:text-pink-400" />
                            Live Orders Stream
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Real-time orders from customers
                        </CardDescription>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            isLive
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-muted text-muted-foreground"
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`} />
                            {isLive ? "Live Stream" : "Recent Orders"}
                        </span>
                    </div>
                </CardHeader>

                <CardContent className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                    {/* Orders List Container */}
                    <div className="space-y-2.5 overflow-y-auto max-h-[350px] pr-1 scrollbar-thin">
                        {ordersLoading && recentOrders.length === 0 ? (
                            <div className="space-y-2.5">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="p-2.5 rounded-xl border border-border/40 space-y-2">
                                        <Skeleton className="h-4 w-28" />
                                        <Skeleton className="h-3 w-40" />
                                    </div>
                                ))}
                            </div>
                        ) : recentOrders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[260px] text-muted-foreground text-xs text-center p-4">
                                <ShoppingBag className="h-8 w-8 mb-2 opacity-30" />
                                <p className="font-semibold text-foreground">No recent orders yet</p>
                                <p className="text-[11px] opacity-70 mt-1">
                                    When customers place orders, they will appear here in real-time.
                                </p>
                            </div>
                        ) : (
                            recentOrders.slice(0, 6).map((order) => {
                                const statusClass = STATUS_COLORS[order.status] || "bg-muted text-foreground";
                                const formattedPrice =
                                    order.displayTotalAmount ||
                                    (order.totalAmount != null ? `฿${order.totalAmount}` : "฿0");

                                return (
                                    <div
                                        key={order.id}
                                        onClick={() => navigate(`/orders/${order.id}`)}
                                        className="group p-2.5 rounded-xl border border-border/60 hover:border-pink-500/50 bg-background/60 hover:bg-muted/40 transition-all duration-200 cursor-pointer shadow-xs"
                                    >
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-foreground group-hover:text-pink-600 transition-colors">
                                                    #{order.lastOrderNo || order.id}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground font-mono">
                                                    · {formatRelativeTime(order.createdAt)}
                                                </span>
                                            </div>
                                            <span className="font-bold text-foreground text-xs font-mono">
                                                {formattedPrice}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-xs mt-1">
                                            <div className="flex items-center gap-1.5 min-w-0 pr-2">
                                                <Store className="h-3 w-3 text-muted-foreground shrink-0" />
                                                <span className="text-[11px] text-muted-foreground truncate">
                                                    {order.shopName || "Shop"}
                                                </span>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={`text-[9px] px-1.5 py-0 h-4 font-semibold uppercase tracking-wider shrink-0 ${statusClass}`}
                                            >
                                                {order.statusLabel || order.status}
                                            </Badge>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Bottom Action Button */}
                    <div className="pt-3 border-t border-border/40 mt-3">
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-8 text-xs font-medium justify-between hover:border-pink-500/50 hover:text-pink-600"
                            onClick={() => navigate("/orders/history")}
                        >
                            <span>View All Order History</span>
                            <ArrowUpRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
