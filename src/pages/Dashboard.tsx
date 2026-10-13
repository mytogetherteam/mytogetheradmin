import React, { useEffect, useState, useRef, useMemo } from "react";
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
    Bar,
    BarChart,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Input } from "@/components/ui/input";
import { analyticsService, RevenueData, PopularShop } from "@/services/analyticsService";
import { dashboardService, DashboardCardCounts } from "@/services/dashboardService";
import { orderService, OrderHealthData } from "@/services/orderService";
import { Users, ShoppingCart, Store, AlertTriangle, Flag, Wifi, WifiOff, X, Bell, Star, Clock, Ticket, Search, MapPin, Activity, Bike } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminWebSocket, SystemStatsDTO } from "@/hooks/useAdminWebSocket";
import { TodayActivitySection } from "@/components/dashboard/TodayActivitySection";
import { OperationalFulfillmentSection } from "@/components/dashboard/OperationalFulfillmentSection";
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



// ─── Dashboard ──────────────────────────────────────────────────────────────

export default function Dashboard() {
    const defaults = getDefaultDates();
    const [startDate, setStartDate] = useState(defaults.start);
    const [endDate, setEndDate] = useState(defaults.end);

    // REST baseline data
    const [cardCounts, setCardCounts] = useState<Partial<DashboardCardCounts>>({});
    const [revenue, setRevenue] = useState<RevenueData[]>([]);
    const [popularShops, setPopularShops] = useState<PopularShop[]>([]);
    const [orderHealth, setOrderHealth] = useState<OrderHealthData>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Extended Stats
    const [extendedStats, setExtendedStats] = useState<any>(null);

    // WebSocket live data - enabled: true ensures connection is active on Dashboard
    const { connected, systemStats, latestReport, latestShopRequest, latestOrder } = useAdminWebSocket({ enabled: true });

    // Dismissed alert state
    const [reportDismissed, setReportDismissed] = useState<string | null>(null);
    const [shopRequestDismissed, setShopRequestDismissed] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const [cardsData, revenueData, shopsData, healthData, extendedData] = await Promise.all([
                    dashboardService.getCardCounts().catch(() => ({})),
                    analyticsService.getRevenueAnalytics(startDate, endDate).catch(() => []),
                    analyticsService.getPopularShops().catch(() => []),
                    orderService.getOrdersHealth().catch(() => ({})),
                    analyticsService.getExtendedDashboardStats().catch(() => null),
                ]);
                setCardCounts(cardsData);
                setRevenue(revenueData);
                setPopularShops(shopsData);
                setOrderHealth(healthData);
                setExtendedStats(extendedData);
            } catch {
                setError("Failed to load dashboard data.");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [startDate, endDate]);

    // Derived: prefer live WS stats where available, fall back to REST baseline
    const liveStats: Partial<SystemStatsDTO> = useMemo(() => systemStats ?? {}, [systemStats]);
    const totalUsers = liveStats.totalUsers ?? cardCounts.totalUsers ?? 0;
    const isLive = !!systemStats;
    const totalShops = liveStats.activeShops ?? liveStats.totalShops ?? cardCounts.totalShops ?? 0;
    const totalReviews = liveStats.totalReviews ?? cardCounts.totalReviews ?? 0;
    const pendingOrders = liveStats.pendingOrders ?? cardCounts.pendingOrders ?? 0;
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

            {/* Row 2: Today's Live Demand & Activity Hub (Interactive Hourly Chart & District Demand) */}
            <TodayActivitySection extendedStats={extendedStats} isLive={isLive} />

            {/* Row 3: Operational Fulfillment Intelligence & Live Orders Stream */}
            <OperationalFulfillmentSection
                orderHealth={orderHealth}
                extendedStats={extendedStats}
                latestOrder={latestOrder}
                isLive={isLive}
                startDate={startDate}
                endDate={endDate}
            />

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
                                                    {views.toLocaleString()} delivered
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

            {/* Extended Analytics Row 1: Operations & Marketing */}
            {extendedStats && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
                    <StatCard title="Daily Active Users" value={extendedStats.dau} icon={Activity} trend={`MAU: ${extendedStats.mau}`} trendColor="text-blue-500" />
                    <StatCard title="Avg. Delivery Time" value={`${extendedStats.avgDeliveryTime}m`} icon={Clock} trend="Ideal: < 30m" trendColor="text-green-500" />
                    <StatCard title="Active Fleet" value={extendedStats.fleetStatus.active} icon={Bike} trend={`${extendedStats.fleetStatus.busy} Busy`} trendColor="text-orange-500" />
                    <StatCard title="Coupons Used" value={extendedStats.couponUsage.count} icon={Ticket} trend={`$${extendedStats.couponUsage.totalDiscount} saved`} trendColor="text-purple-500" />
                </div>
            )}

            {/* Extended Analytics Row 2: Charts */}
            {extendedStats && (
                <div className="grid gap-4 md:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 delay-150 duration-700 fill-mode-both">
                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle>Sales by Category</CardTitle>
                            <CardDescription>Top 5 categories (30 days)</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={extendedStats.categorySales}
                                        dataKey="total"
                                        nameKey="category"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                    >
                                        {extendedStats.categorySales.map((_: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"][index % 5]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="col-span-2">
                        <CardHeader>
                            <CardTitle>Peak Ordering Hours</CardTitle>
                            <CardDescription>Order volume by hour of day (30 days)</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={extendedStats.peakHours}>
                                    <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Extended Analytics Row 3: Lists */}
            {extendedStats && (
                <div className="grid gap-4 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 delay-300 duration-700 fill-mode-both">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Geographic Hotspots</CardTitle>
                            <CardDescription>Top districts by order volume</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {extendedStats.geoHotspots.map((geo: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">{i + 1}</div>
                                            <span className="text-sm font-medium">{geo.district}</span>
                                        </div>
                                        <Badge variant="secondary">{geo.count} orders</Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Search className="h-4 w-4" /> Top Searched Terms</CardTitle>
                            <CardDescription>What users are looking for</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {extendedStats.topSearches.map((search: any, i: number) => (
                                    <Badge key={i} variant="outline" className="px-3 py-1.5 text-sm">
                                        {search.term} <span className="ml-2 text-muted-foreground text-xs">{search.count}</span>
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
