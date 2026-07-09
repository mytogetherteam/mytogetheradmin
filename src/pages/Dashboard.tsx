import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Input } from "@/components/ui/input";
import { analyticsService, RevenueData, PopularShop } from "@/services/analyticsService";
import { dashboardService, DashboardCardCounts } from "@/services/dashboardService";
import { orderService, OrderHealthData } from "@/services/orderService";
import { authService } from "@/services/authService";
import { Users, ShoppingCart, Store, AlertTriangle, Building2, Flag, Database, Wifi, WifiOff, X, Bell, ShoppingBag, Star, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminWebSocket, SystemStatsDTO } from "@/hooks/useAdminWebSocket";
// ─── Helpers ───────────────────────────────────────────────────────────────

function getDefaultDates() {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
    };
}

const ORDER_HEALTH_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
    PENDING: { bg: "bg-yellow-500/10", text: "text-yellow-500", dot: "bg-yellow-500" },
    CONFIRMED: { bg: "bg-blue-500/10", text: "text-blue-500", dot: "bg-blue-500" },
    ACCEPTED: { bg: "bg-blue-500/10", text: "text-blue-500", dot: "bg-blue-500" },
    PREPARING: { bg: "bg-orange-500/10", text: "text-orange-500", dot: "bg-orange-500" },
    READY: { bg: "bg-purple-500/10", text: "text-purple-500", dot: "bg-purple-500" },
    ON_THE_WAY: { bg: "bg-green-500/10", text: "text-green-500", dot: "bg-green-500" },
    DELIVERING: { bg: "bg-green-500/10", text: "text-green-500", dot: "bg-green-500" },
};

// ─── Sub-components ─────────────────────────────────────────────────────────

const StatCard = React.memo(({
    title,
    value,
    trend,
    trendColor,
    prefix = "",
    icon: Icon,
    loading,
    live,
}: {
    title: string;
    value: number | string;
    trend?: string;
    trendColor?: string;
    prefix?: string;
    icon: React.ElementType;
    loading?: boolean;
    live?: boolean;
}) => {
    const [flash, setFlash] = useState(false);
    const prevVal = useRef(value);

    useEffect(() => {
        if (live && prevVal.current !== value) {
            const timer = setTimeout(() => setFlash(true), 0);
            const t = setTimeout(() => setFlash(false), 1200);
            prevVal.current = value;
            return () => {
                clearTimeout(timer);
                clearTimeout(t);
            };
        }
    }, [value, live]);

    return (
        <Card className={flash ? "ring-2 ring-green-500/40 transition-all duration-300" : "transition-all duration-300"}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className="flex items-center gap-1.5">
                    {live && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[9px] font-semibold tracking-wide">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            LIVE
                        </span>
                    )}
                    <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <>
                        <Skeleton className="h-7 w-28 mb-2" />
                        <Skeleton className="h-4 w-36" />
                    </>
                ) : (
                    <div className="flex items-end justify-between mt-2">
                        <div className="text-2xl font-bold">
                            {prefix}{typeof value === "number" ? value.toLocaleString() : (value ?? 0)}
                        </div>
                        {trend && (
                            <span className={`text-xs font-semibold ${trendColor || "text-green-500"}`}>
                                {trend}
                            </span>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
});

StatCard.displayName = "StatCard";

/** Dismissable alert banner shown when a new WS alert arrives */
function AlertBanner({
    icon: Icon,
    color,
    title,
    subtitle,
    onDismiss,
}: {
    icon: React.ElementType;
    color: string;
    title: string;
    subtitle?: string;
    onDismiss: () => void;
}) {
    return (
        <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${color} animate-in slide-in-from-top-2 duration-300`}
        >
            <Icon className="h-4 w-4 shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight">{title}</p>
                {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
            </div>
            <button
                onClick={onDismiss}
                className="ml-auto shrink-0 h-5 w-5 rounded-sm opacity-60 hover:opacity-100 transition-opacity flex items-center justify-center"
            >
                <X className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}

/** Small live-order ticker shown inside the Order Health card */
function NewOrderTicker({ order }: { order: { message?: string; id?: string | number } | null }) {
    const [visible, setVisible] = useState(false);
    const [text, setText] = useState("");

    useEffect(() => {
        if (!order) return;
        // Use timeout to avoid synchronous setState in effect warning
        const timer = setTimeout(() => {
            setText(order.message || (order.id ? `New order #${order.id} arrived` : "New order received"));
            setVisible(true);
        }, 0);

        const t = setTimeout(() => setVisible(false), 6000);
        return () => {
            clearTimeout(timer);
            clearTimeout(t);
        };
    }, [order]);

    if (!visible) return null;

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 mb-3 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-xs font-medium animate-in slide-in-from-left-2 duration-300">
            <ShoppingBag className="h-3.5 w-3.5 shrink-0 animate-bounce" />
            <span className="truncate">{text}</span>
            <span className="ml-auto shrink-0 text-[10px] opacity-60">live</span>
        </div>
    );
}

// ─── Connection Status Indicator ────────────────────────────────────────────

function WsStatusBadge({ connected }: { connected: boolean }) {
    return (
        <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors duration-500 ${connected
                ? "bg-green-500/10 text-green-500 border-green-500/20"
                : "bg-muted text-muted-foreground border-border"
                }`}
        >
            {connected ? (
                <>
                    <Wifi className="h-3 w-3" />
                    <span>Live</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                </>
            ) : (
                <>
                    <WifiOff className="h-3 w-3" />
                    <span>Offline</span>
                </>
            )}
        </div>
    );
}

// ─── Order Pipeline Visualization ───────────────────────────────────────────

function OrderPipeline({ orderHealth }: { orderHealth: Record<string, number> }) {
    const pipeline = [
        { label: "Pending", keys: ["PENDING"], color: "bg-yellow-500", text: "text-yellow-500" },
        { label: "Preparing", keys: ["CONFIRMED", "ACCEPTED", "PREPARING"], color: "bg-orange-500", text: "text-orange-500" },
        { label: "Delivering", keys: ["READY", "ON_THE_WAY", "DELIVERING"], color: "bg-blue-500", text: "text-blue-500" },
    ];

    const total = Object.values(orderHealth).reduce((a, b) => a + b, 0);

    return (
        <div className="w-full mt-4 space-y-4">
            <div className="w-full h-2 rounded-full bg-muted flex overflow-hidden">
                {total === 0 ? (
                    <div className="w-full h-full bg-muted" />
                ) : (
                    pipeline.map((stage, i) => {
                        const count = stage.keys.reduce((sum, key) => sum + (orderHealth[key] || 0), 0);
                        const percent = (count / total) * 100;
                        return <div key={i} style={{ width: `${percent}%` }} className={`${stage.color} transition-all duration-500`} />;
                    })
                )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center divide-x">
                {pipeline.map((stage, i) => {
                    const count = stage.keys.reduce((sum, key) => sum + (orderHealth[key] || 0), 0);
                    return (
                        <div key={i} className="flex flex-col">
                            <span className={`text-xl font-bold ${stage.text}`}>{count}</span>
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{stage.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Live Activity Feed ─────────────────────────────────────────────────────

function LiveActivityFeed({ activities }: { activities: any[] }) {
    if (activities.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                <Database className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">No recent activity</p>
            </div>
        );
    }
    return (
        <div className="space-y-4 pr-2 max-h-[250px] overflow-y-auto overflow-x-hidden">
            {activities.map((act) => (
                <div key={act.id} className="flex gap-3 animate-in fade-in slide-in-from-right-2 duration-300">
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${act.bgColor} ${act.textColor}`}>
                        <act.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0 pb-3 border-b border-border/40 last:border-0">
                        <p className="text-sm font-medium text-foreground/90">{act.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{act.message}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">{act.time}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export default function Dashboard() {
    const navigate = useNavigate();
    const userData = authService.getUserData();
    const isMasterAdmin = userData?.role === "MASTER_ADMIN" || userData?.authorities?.includes("MASTER_ADMIN");

    const defaults = getDefaultDates();
    const [startDate, setStartDate] = useState(defaults.start);
    const [endDate, setEndDate] = useState(defaults.end);

    // REST baseline data
    const [cardCounts, setCardCounts] = useState<Partial<DashboardCardCounts>>({});
    const [revenue, setRevenue] = useState<RevenueData[]>([]);
    const [popularShops, setPopularShops] = useState<PopularShop[]>([]);
    const [orderHealth, setOrderHealth] = useState<OrderHealthData>({});
    const [systemHealth, setSystemHealth] = useState<{ dbLatency: number; status: string; performance?: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // WebSocket live data - enabled: true ensures connection is active on Dashboard
    const { connected, systemStats, latestReport, latestShopRequest, latestOrder } = useAdminWebSocket({ enabled: true });

    // Dismissed alert state
    const [reportDismissed, setReportDismissed] = useState<string | null>(null);
    const [shopRequestDismissed, setShopRequestDismissed] = useState<string | null>(null);

    // Live Activity Feed State
    const [activities, setActivities] = useState<any[]>([]);

    useEffect(() => {
        if (latestOrder) {
            setActivities(prev => [{
                id: `order-${latestOrder.id || Date.now()}`,
                title: "New Order",
                message: latestOrder.message || `Order #${latestOrder.id} received`,
                time: new Date().toLocaleTimeString(),
                icon: ShoppingBag,
                bgColor: "bg-indigo-500/10",
                textColor: "text-indigo-500"
            }, ...prev].slice(0, 50));
        }
    }, [latestOrder]);

    useEffect(() => {
        if (latestReport) {
            setActivities(prev => [{
                id: `report-${latestReport.id || Date.now()}`,
                title: "New Report",
                message: (latestReport.message as string) || "Content reported",
                time: new Date().toLocaleTimeString(),
                icon: Flag,
                bgColor: "bg-red-500/10",
                textColor: "text-red-500"
            }, ...prev].slice(0, 50));
        }
    }, [latestReport]);

    useEffect(() => {
        if (latestShopRequest) {
            setActivities(prev => [{
                id: `shop-${latestShopRequest.id || Date.now()}`,
                title: "Shop Approval",
                message: (latestShopRequest.message as string) || "New shop pending",
                time: new Date().toLocaleTimeString(),
                icon: Bell,
                bgColor: "bg-yellow-500/10",
                textColor: "text-yellow-500"
            }, ...prev].slice(0, 50));
        }
    }, [latestShopRequest]);

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const [cardsData, revenueData, shopsData, healthData, sysHealth] = await Promise.all([
                    dashboardService.getCardCounts().catch(() => ({})),
                    analyticsService.getRevenueAnalytics(startDate, endDate).catch(() => []),
                    analyticsService.getPopularShops().catch(() => []),
                    orderService.getOrdersHealth().catch(() => ({})),
                    isMasterAdmin ? analyticsService.getSystemHealth().catch(() => null) : Promise.resolve(null),
                ]);
                setCardCounts(cardsData);
                setRevenue(revenueData);
                setPopularShops(shopsData);
                setOrderHealth(healthData);
                setSystemHealth(sysHealth);
            } catch {
                setError("Failed to load dashboard data.");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [startDate, endDate, isMasterAdmin]);

    // Derived: prefer live WS stats where available, fall back to REST baseline
    const liveStats: Partial<SystemStatsDTO> = useMemo(() => systemStats ?? {}, [systemStats]);
    const totalUsers = liveStats.totalUsers ?? cardCounts.totalUsers ?? 0;
    const isLive = !!systemStats;
    const totalShops = liveStats.activeShops ?? liveStats.totalShops ?? cardCounts.totalShops ?? 0;
    const totalReviews = liveStats.totalReviews ?? cardCounts.totalReviews ?? 0;
    const pendingOrders = liveStats.pendingOrders ?? cardCounts.pendingOrders ?? 0;
    const shopPendingCount = cardCounts.shopPendingCount ?? 0;
    const shopFeedbackCount = cardCounts.shopFeedbackCount ?? 0;
    // Alert keys (used to detect new entries)
    const latestReportKey = latestReport?.timestamp ?? null;
    const latestShopKey = latestShopRequest?.timestamp ?? null;

    const showReportBanner = latestReportKey && latestReportKey !== reportDismissed;
    const showShopRequestBanner = latestShopKey && latestShopKey !== shopRequestDismissed;

    const chartData = revenue.length > 0
        ? revenue.map((r) => ({ name: new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }), total: r.amount ?? 0 }))
        : [];

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
                <div className="flex items-center gap-3">
                    {error && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {error}
                        </Badge>
                    )}
                    <WsStatusBadge connected={connected} />
                </div>
            </div>

            {/* WebSocket Alert Banners */}
            {(showReportBanner || showShopRequestBanner) && (
                <div className="flex flex-col gap-2">
                    {showReportBanner && (
                        <AlertBanner
                            icon={Flag}
                            color="border-red-500/30 bg-red-500/5 text-red-500"
                            title="New Report Received"
                            subtitle={
                                (latestReport?.message as string | undefined) ||
                                (latestReport?.id ? `Report #${latestReport.id}` : "A user or content has been reported")
                            }
                            onDismiss={() => setReportDismissed(latestReportKey!)}
                        />
                    )}
                    {showShopRequestBanner && (
                        <AlertBanner
                            icon={Bell}
                            color="border-yellow-500/30 bg-yellow-500/5 text-yellow-500"
                            title="New Shop Approval Request"
                            subtitle={
                                (latestShopRequest?.message as string | undefined) ||
                                (latestShopRequest?.id ? `Shop #${latestShopRequest.id} pending review` : "A shop is awaiting vetting")
                            }
                            onDismiss={() => setShopRequestDismissed(latestShopKey!)}
                        />
                    )}
                </div>
            )}

            {/* Row 1: KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
                <StatCard title="Total Users" value={totalUsers} icon={Users} loading={loading} live={isLive} trend="↑ 12%" trendColor="text-green-500" />
                <StatCard title="Total Shops" value={totalShops} icon={Store} loading={loading} live={isLive} trend="↑ 5%" trendColor="text-green-500" />
                <StatCard title="Total Reviews" value={totalReviews} icon={Star} loading={loading} live={isLive} trend="↑ 8%" trendColor="text-green-500" />
                <StatCard title="Pending Orders" value={pendingOrders} icon={ShoppingCart} loading={loading} live={isLive} trend="↓ 2%" trendColor="text-red-500" />
            </div>

            {/* Row 2: Action Cards */}
            <div className="grid gap-4 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 delay-150 duration-700 fill-mode-both">
                <Card
                    className="cursor-pointer border-yellow-500/30 hover:border-yellow-500/60 transition-all hover:shadow-md hover:-translate-y-0.5"
                    onClick={() => navigate("/shops/manage?tab=pending")}
                >
                    <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-yellow-500/10">
                            <Building2 className="h-5 w-5 text-yellow-500" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium">Shops Pending Approval</p>
                            <p className="text-xs text-muted-foreground">Requires your review</p>
                        </div>
                        {loading ? (
                            <Skeleton className="h-8 w-12" />
                        ) : (
                            <span className="text-2xl font-bold text-yellow-500">{shopPendingCount}</span>
                        )}
                    </CardContent>
                </Card>

                <Card
                    className="cursor-pointer border-red-500/30 hover:border-red-500/60 transition-all hover:shadow-md hover:-translate-y-0.5"
                    onClick={() => navigate("/shop-feedback/manage")}
                >
                    <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-red-500/10">
                            <MessageSquare className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium">Shop Feedback</p>
                            <p className="text-xs text-muted-foreground">Needs attention</p>
                        </div>
                        {loading ? (
                            <Skeleton className="h-8 w-12" />
                        ) : (
                            <span className="text-2xl font-bold text-red-500">{shopFeedbackCount}</span>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Row 3: Order Pipeline & Activity Feed */}
            <div className="grid gap-4 md:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 delay-300 duration-700 fill-mode-both">
                <div className="col-span-2 space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base">Order Pipeline</CardTitle>
                                    <CardDescription>Live order fulfillment stages</CardDescription>
                                </div>
                                {isLive && (
                                    <span className="text-[10px] text-green-500 font-semibold flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        Real-time
                                    </span>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <NewOrderTicker order={latestOrder} />
                            {loading ? <Skeleton className="h-20 w-full" /> : <OrderPipeline orderHealth={orderHealth} />}
                        </CardContent>
                    </Card>

                    {/* System Status under Pipeline */}
                    <Card>
                        <CardContent className="flex items-center gap-3 p-4">
                            <Database className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Database</span>
                            {loading ? (
                                <Skeleton className="h-4 w-40" />
                            ) : systemHealth ? (
                                <>
                                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${systemHealth.status === 'connected' || systemHealth.status === 'UP' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                    <span className="text-xs text-muted-foreground">
                                        {systemHealth.status === 'connected' || systemHealth.status === 'UP' ? 'Connected' : 'Issue'} · {systemHealth.dbLatency}ms
                                        {systemHealth.performance && ` · ${systemHealth.performance}`}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-400" />
                                    <span className="text-xs text-muted-foreground">Unable to fetch status</span>
                                </>
                            )}
                            {isLive && liveStats.systemHealth && (
                                <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${liveStats.systemHealth === 'HEALTHY'
                                    ? 'bg-green-500/10 text-green-500'
                                    : 'bg-red-500/10 text-red-500'
                                    }`}>
                                    {liveStats.systemHealth}
                                </span>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card className="col-span-1">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Live Activity Feed</CardTitle>
                        <CardDescription>Real-time system events</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <LiveActivityFeed activities={activities} />
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-6">
                        <div>
                            <CardTitle className="text-base font-semibold">Revenue Overview</CardTitle>
                            <CardDescription className="text-xs">Platform revenue trends and volume.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-md border">
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-36 h-7 text-[10px] border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                            <span className="text-muted-foreground text-[10px] font-medium px-1">TO</span>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-36 h-7 text-[10px] border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="pl-2 pt-0">
                        {loading ? (
                            <Skeleton className="w-full h-[350px]" />
                        ) : chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <AreaChart data={chartData}>
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                                    <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
                                    <Area type="monotone" dataKey="total" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[350px] text-muted-foreground text-sm">
                                No revenue data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Popular Shops</CardTitle>
                        <CardDescription>Top performing shops by viewers.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <Skeleton className="h-8 w-8 rounded-full" />
                                        <div className="flex-1 space-y-1">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-20" />
                                        </div>
                                        <Skeleton className="h-4 w-16" />
                                    </div>
                                ))}
                            </div>
                        ) : popularShops.length > 0 ? (
                            <div className="space-y-4">
                                {popularShops.slice(0, 5).map((shop, i) => {
                                    const shopId = shop.shopId || `shop_${i}`;
                                    const shopName = shop.shopName || "Unknown Shop";
                                    const views = shop.viewCount || 0;
                                    const unique = shop.uniqueViewers || 0;
                                    return (
                                        <div key={shopId} className="flex items-baseline justify-between gap-4 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                                                    {i + 1}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold truncate text-foreground/90">{shopName}</p>
                                                    <div className="flex items-center gap-1.5">
                                                        <Users className="h-3 w-3 text-muted-foreground" />
                                                        <span className="text-[11px] text-muted-foreground font-medium">{unique.toLocaleString()} unique</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-primary/5 text-primary border-primary/20">
                                                    {views.toLocaleString()} views
                                                </Badge>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                                No shop data available
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
