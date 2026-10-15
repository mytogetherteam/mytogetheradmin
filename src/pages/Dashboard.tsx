import React, { useEffect, useState, useMemo, useCallback } from "react";
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
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { analyticsService, RevenueData, PopularShop, UserRegistrationStatsResponse } from "@/services/analyticsService";
import { dashboardService, DashboardCardCounts } from "@/services/dashboardService";
import {
    Users,
    ShoppingCart,
    Store,
    AlertTriangle,
    Flag,
    X,
    Bell,
    Star,
    ChevronRight,
    DollarSign,
    Smartphone,
    Globe,
    Layers,
    Clock,
    BarChart3,
    Truck,
    UtensilsCrossed,
    RefreshCw,
    Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminWebSocket, SystemStatsDTO } from "@/hooks/useAdminWebSocket";
import { TodayActivitySection } from "@/components/dashboard/TodayActivitySection";
import { MenuTrendingCuisineSection } from "@/components/dashboard/MenuTrendingCuisineSection";
import { TodayFulfillmentOperationsSection } from "@/components/dashboard/TodayFulfillmentOperationsSection";
import { OrdersVelocityGraphCard } from "@/components/dashboard/OrdersVelocityGraphCard";
import { CustomerReviewsDetailModal } from "@/components/dashboard/CustomerReviewsDetailModal";
import { UserRegistrationChannelSection } from "@/components/dashboard/UserRegistrationChannelSection";
import {
    getBangkokDateString,
    formatBangkokDate,
    formatBangkokDateTime,
} from "@/utils/bangkokTime";

// ─── Helpers ───────────────────────────────────────────────────────────────

function getDefaultDates() {
    const todayBangkok = getBangkokDateString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);
    return {
        start: getBangkokDateString(thirtyDaysAgo),
        end: todayBangkok,
    };
}

// ─── Sub-components ─────────────────────────────────────────────────────────

interface StatCardProps {
    title: string;
    value: number | string;
    trend?: string;
    trendColor?: string;
    prefix?: string;
    icon: React.ElementType;
    iconColor?: string;
    iconBg?: string;
    accentGradient?: string;
    subtext?: string;
    loading?: boolean;
    live?: boolean;
    onClick?: () => void;
}

const StatCard = React.memo(({
    title,
    value,
    trend,
    trendColor,
    prefix = "",
    icon: Icon,
    iconColor,
    iconBg,
    accentGradient = "from-indigo-500 to-purple-500",
    subtext,
    loading,
    live,
    onClick,
}: StatCardProps) => {
    return (
        <Card
            onClick={onClick}
            className={`relative overflow-hidden transition-all duration-300 bg-card/85 backdrop-blur-sm border-border/70 hover:border-border hover:shadow-lg hover:-translate-y-0.5 group ${
                onClick ? "cursor-pointer" : ""
            }`}
        >
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accentGradient} opacity-90`} />

            <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-xs font-semibold text-muted-foreground truncate">{title}</p>
                    <div
                        className={`h-9 w-9 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-xs ${
                            iconBg || "bg-primary/10"
                        } ${iconColor || "text-primary"}`}
                    >
                        <Icon className="h-4 w-4" />
                    </div>
                </div>

                <div className="space-y-1">
                    {loading ? (
                        <Skeleton className="h-8 w-24" />
                    ) : (
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-extrabold tracking-tight text-foreground">
                                {prefix}
                                {typeof value === "number" ? value.toLocaleString() : value}
                            </span>
                            {live && (
                                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-500 dark:text-emerald-400">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    LIVE
                                </span>
                            )}
                        </div>
                    )}

                    <div className="flex items-center justify-between text-xs pt-1">
                        {trend ? (
                            <span className={`font-semibold ${trendColor || "text-emerald-500"}`}>{trend}</span>
                        ) : subtext ? (
                            <span className="text-muted-foreground text-[11px] font-medium">{subtext}</span>
                        ) : null}

                        {onClick && (
                            <span className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                <ChevronRight className="h-3.5 w-3.5" />
                            </span>
                        )}
                    </div>
                </div>
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
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${color} backdrop-blur-sm animate-in slide-in-from-top-2 duration-300 shadow-xs`}
        >
            <Icon className="h-4 w-4 shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight">{title}</p>
                {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
            </div>
            <button
                onClick={onDismiss}
                className="ml-auto shrink-0 h-5 w-5 rounded-sm opacity-60 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            >
                <X className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export default function Dashboard() {
    const navigate = useNavigate();
    const defaults = getDefaultDates();
    const [startDate, setStartDate] = useState(defaults.start);
    const [endDate, setEndDate] = useState(defaults.end);
    const [activeTab, setActiveTab] = useState<string>("overview");

    // Unified baseline data
    const [cardCounts, setCardCounts] = useState<Partial<DashboardCardCounts>>({});
    const [revenue, setRevenue] = useState<RevenueData[]>([]);
    const [popularShops, setPopularShops] = useState<PopularShop[]>([]);
    const [systemHealth, setSystemHealth] = useState<{ dbLatency: number; status: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Extended Stats & Telemetry
    const [extendedStats, setExtendedStats] = useState<any>(null);
    const [userRegStats, setUserRegStats] = useState<UserRegistrationStatsResponse | null>(null);
    const [todayOrderVelocity, setTodayOrderVelocity] = useState<any[]>([]);

    // Fulfillment counts
    const [fulfillment, setFulfillment] = useState<{
        todayDelivered: number;
        todayCanceled: number;
        totalDeliveredAllTime: number;
        totalCanceledAllTime: number;
        deliveryOptionOn: number;
        deliveryOptionOff: number;
        totalShops: number;
    }>({
        todayDelivered: 0,
        todayCanceled: 0,
        totalDeliveredAllTime: 0,
        totalCanceledAllTime: 0,
        deliveryOptionOn: 0,
        deliveryOptionOff: 0,
        totalShops: 0,
    });
    const [todayDeliveredCount, setTodayDeliveredCount] = useState<number>(0);
    const [todayCanceledCount, setTodayCanceledCount] = useState<number>(0);
    const [totalDeliveredAllTime, setTotalDeliveredAllTime] = useState<number>(0);
    const [totalCanceledAllTime, setTotalCanceledAllTime] = useState<number>(0);

    // WebSocket live data - enabled: true ensures connection is active on Dashboard
    const { systemStats, latestReport, latestShopRequest } = useAdminWebSocket({ enabled: true });

    // Dismissed alert state
    const [reportDismissed, setReportDismissed] = useState<string | null>(null);
    const [shopRequestDismissed, setShopRequestDismissed] = useState<string | null>(null);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [channelFilterStats, setChannelFilterStats] = useState<{
        phoneCount: number;
        googleCount: number;
        allTimePhone?: number;
        allTimeGoogle?: number;
        allTimeTotal?: number;
        filterLabel: string;
    } | null>(null);

    // Live Bangkok time display
    const [bangkokTimeStr, setBangkokTimeStr] = useState<string>(() => formatBangkokDateTime(new Date()));
    useEffect(() => {
        const timer = setInterval(() => {
            setBangkokTimeStr(formatBangkokDateTime(new Date()));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // ── Single Aggregated Call for entire Dashboard ──
    const loadDashboardData = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);
            setError(null);

            const summary = await analyticsService.getDashboardSummary(startDate, endDate);
            if (summary) {
                if (summary.cardCounts) setCardCounts(summary.cardCounts);
                if (summary.revenue) setRevenue(summary.revenue);
                if (summary.popularShops) setPopularShops(summary.popularShops);
                if (summary.extendedStats) setExtendedStats(summary.extendedStats);
                if (summary.systemHealth) setSystemHealth(summary.systemHealth);
                if (summary.userRegistrationStats) setUserRegStats(summary.userRegistrationStats);
                if (summary.fulfillment) {
                    setFulfillment(summary.fulfillment);
                    setTodayDeliveredCount(summary.fulfillment.todayDelivered || 0);
                    setTodayCanceledCount(summary.fulfillment.todayCanceled || 0);
                    setTotalDeliveredAllTime(summary.fulfillment.totalDeliveredAllTime || 0);
                    setTotalCanceledAllTime(summary.fulfillment.totalCanceledAllTime || 0);
                }
                if (summary.todayOrderVelocity) setTodayOrderVelocity(summary.todayOrderVelocity);
            }
        } catch (err) {
            console.error("Dashboard unified summary fetch failed, fallback to baseline:", err);
            const [cardsData, healthData] = await Promise.all([
                dashboardService.getCardCounts().catch(() => ({})),
                analyticsService.getSystemHealth().catch(() => ({ dbLatency: 4, status: "connected" })),
            ]);
            setCardCounts(cardsData);
            setSystemHealth(healthData);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    // Derived: prefer live WS stats where available, fall back to baseline
    const liveStats: Partial<SystemStatsDTO> = useMemo(() => systemStats ?? {}, [systemStats]);
    const totalUsers = liveStats.totalUsers ?? cardCounts.totalUsers ?? 0;
    const isLive = !!systemStats;
    const totalShops = liveStats.activeShops ?? liveStats.totalShops ?? cardCounts.totalShops ?? fulfillment.totalShops ?? 0;
    const totalReviews = liveStats.totalReviews ?? cardCounts.totalReviews ?? 0;
    const pendingOrders = liveStats.pendingOrders ?? cardCounts.pendingOrders ?? 0;

    // Calculate Phone registered users vs Google sign-in users strictly from real DB records
    const { phoneUsersCount, googleUsersCount, phonePercent, googlePercent } = useMemo(() => {
        const allPhone = userRegStats?.allTimePhone ?? channelFilterStats?.allTimePhone ?? cardCounts.phoneUsers;
        const allGoogle = userRegStats?.allTimeGoogle ?? channelFilterStats?.allTimeGoogle ?? cardCounts.googleUsers;

        if (allPhone !== undefined && allGoogle !== undefined && (allPhone + allGoogle > 0)) {
            const total = (allPhone + allGoogle) || totalUsers || 1;
            return {
                phoneUsersCount: allPhone,
                googleUsersCount: allGoogle,
                phonePercent: Math.round((allPhone / total) * 100),
                googlePercent: Math.round((allGoogle / total) * 100),
            };
        }

        if (
            cardCounts.phoneUsers !== undefined &&
            cardCounts.googleUsers !== undefined &&
            cardCounts.phoneUsers + cardCounts.googleUsers > 0
        ) {
            const p = cardCounts.phoneUsers;
            const g = cardCounts.googleUsers;
            const total = p + g || totalUsers || 1;
            return {
                phoneUsersCount: p,
                googleUsersCount: g,
                phonePercent: Math.round((p / total) * 100),
                googlePercent: Math.round((g / total) * 100),
            };
        }

        if (extendedStats?.userRegistrationStats) {
            const p = extendedStats.userRegistrationStats.phoneCount;
            const g = extendedStats.userRegistrationStats.googleCount;
            if (p + g > 0) {
                const total = p + g || totalUsers || 1;
                return {
                    phoneUsersCount: p,
                    googleUsersCount: g,
                    phonePercent: Math.round((p / total) * 100),
                    googlePercent: Math.round((g / total) * 100),
                };
            }
        }

        return {
            phoneUsersCount: 0,
            googleUsersCount: 0,
            phonePercent: 0,
            googlePercent: 0,
        };
    }, [userRegStats, channelFilterStats, cardCounts.phoneUsers, cardCounts.googleUsers, extendedStats?.userRegistrationStats, totalUsers]);

    // Alert keys
    const latestReportKey = latestReport?.timestamp ?? null;
    const latestShopKey = latestShopRequest?.timestamp ?? null;
    const showReportBanner = latestReportKey && latestReportKey !== reportDismissed;
    const showShopRequestBanner = latestShopKey && latestShopKey !== shopRequestDismissed;

    // Period revenue calculations
    const chartData = useMemo(() => {
        if (!revenue || revenue.length === 0) return [];
        return revenue.map((r) => ({
            name: formatBangkokDate(r.date, { month: "short", day: "numeric" }),
            total: r.amount ?? 0,
            count: r.count ?? 0,
        }));
    }, [revenue]);

    const totalRevenueInRange = useMemo(
        () => revenue.reduce((sum, r) => sum + (r.amount || 0), 0),
        [revenue]
    );
    const totalOrdersInRange = useMemo(
        () => revenue.reduce((sum, r) => sum + (r.count || 0), 0),
        [revenue]
    );
    const avgOrderValue = useMemo(
        () => (totalOrdersInRange > 0 ? Math.round(totalRevenueInRange / totalOrdersInRange) : 0),
        [totalRevenueInRange, totalOrdersInRange]
    );

    // Reusable Revenue & Popular Shops Grid
    const renderRevenueAndShops = () => (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
            {/* Revenue Overview Area Chart */}
            <Card className="col-span-4 border-border/70 shadow-sm overflow-hidden bg-card/85 backdrop-blur-sm">
                <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-4 border-b border-border/40 bg-muted/20">
                    <div>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <span className="p-1 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                                <DollarSign className="h-4 w-4" />
                            </span>
                            Revenue Overview
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Platform gross sales volume &amp; daily trends from confirmed orders
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 bg-background/90 p-1.5 rounded-xl border border-border/70 shadow-2xs">
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-32 h-7 text-[11px] border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 font-medium"
                        />
                        <span className="text-muted-foreground text-[10px] font-bold px-0.5">TO</span>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-32 h-7 text-[11px] border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 font-medium"
                        />
                    </div>
                </CardHeader>

                {/* Revenue Period KPI Strip */}
                <div className="grid grid-cols-3 gap-2 p-3 sm:px-5 bg-muted/10 border-b border-border/40 text-xs">
                    <div>
                        <span className="text-[10px] text-muted-foreground block font-medium">Period Revenue</span>
                        <span className="text-base font-extrabold text-foreground">
                            ${totalRevenueInRange.toLocaleString()}
                        </span>
                    </div>
                    <div>
                        <span className="text-[10px] text-muted-foreground block font-medium">Completed Orders</span>
                        <span className="text-base font-extrabold text-foreground">
                            {totalOrdersInRange.toLocaleString()} orders
                        </span>
                    </div>
                    <div>
                        <span className="text-[10px] text-muted-foreground block font-medium">Average Order Value</span>
                        <span className="text-base font-extrabold text-foreground">
                            ${avgOrderValue.toLocaleString()}
                        </span>
                    </div>
                </div>

                <CardContent className="p-4 sm:p-5 pt-4">
                    {loading ? (
                        <Skeleton className="w-full h-[280px]" />
                    ) : chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                                <Tooltip
                                    formatter={(v: number, name: string) => [
                                        name === "total" ? `$${v.toLocaleString()}` : v.toLocaleString(),
                                        name === "total" ? "Gross Sales" : "Orders",
                                    ]}
                                />
                                <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                            No revenue recorded for the selected period
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Popular Shops Leaderboard */}
            <Card className="col-span-3 border-border/70 shadow-sm overflow-hidden bg-card/85 backdrop-blur-sm">
                <CardHeader className="pb-3 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                <Store className="h-4 w-4" />
                            </span>
                            Top Performing Shops
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Highest customer reach &amp; order fulfillment volume
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-semibold border-border/70">
                        {popularShops.length} shops
                    </Badge>
                </CardHeader>
                <CardContent className="p-4 sm:p-5">
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
                        <div className="space-y-3.5">
                            {popularShops.slice(0, 5).map((shop, i) => {
                                const shopId = shop.shopId || `shop_${i}`;
                                const shopName = shop.shopName || "Unknown Shop";
                                const views = shop.viewCount || 0;
                                const unique = shop.uniqueViewers || 0;
                                return (
                                    <div
                                        key={shopId}
                                        onClick={() => navigate("/shops")}
                                        className="flex items-center justify-between gap-4 p-2.5 rounded-xl hover:bg-muted/40 transition-colors cursor-pointer group border border-transparent hover:border-border/60"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20 group-hover:scale-105 transition-transform">
                                                {i + 1}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold truncate text-foreground group-hover:text-emerald-500 transition-colors">
                                                    {shopName}
                                                </p>
                                                <div className="flex items-center gap-1.5">
                                                    <Users className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-[11px] text-muted-foreground font-medium">
                                                        {unique.toLocaleString()} unique customers
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <Badge variant="secondary" className="text-[10px] px-2.5 py-0.5 bg-muted/80 font-semibold border border-border/50">
                                                {views.toLocaleString()} orders
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

                    <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Ranked by real customer transactions &amp; volume</span>
                        <span
                            onClick={() => navigate("/shops")}
                            className="text-emerald-500 font-semibold cursor-pointer hover:underline flex items-center gap-0.5"
                        >
                            All Shops <ChevronRight className="h-3 w-3" />
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    return (
        <div className="flex flex-col gap-5">
            {/* Executive Header with Modern Primary Gradient Accent */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-border/50">
                <div>
                    <h1 className="text-xl font-extrabold md:text-2xl text-foreground tracking-tight flex items-center gap-2.5">
                        <span className="p-1.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-xs">
                            <Layers className="h-5 w-5" />
                        </span>
                        Platform Executive Dashboard
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">
                        Real-time operations, customer activity telemetry, logistics pipeline &amp; financial analytics
                    </p>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Live Bangkok Time Indicator */}
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-card/90 text-foreground border-border/80 shadow-xs">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-muted-foreground text-[11px]">Bangkok Time (ICT):</span>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{bangkokTimeStr}</span>
                    </div>

                    {systemHealth && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-card/90 text-foreground border-border/80 shadow-xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-muted-foreground text-[11px]">DB Latency:</span>
                            <span className="font-mono font-bold text-emerald-500">{systemHealth.dbLatency}ms</span>
                        </div>
                    )}

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadDashboardData(true)}
                        disabled={loading || refreshing}
                        className="h-7 px-3 text-xs gap-1.5 rounded-full border-border/80 shadow-xs cursor-pointer hover:bg-muted/80"
                    >
                        <RefreshCw className={`h-3 w-3 text-muted-foreground ${refreshing ? "animate-spin" : ""}`} />
                        <span className="hidden sm:inline">{refreshing ? "Updating..." : "Refresh"}</span>
                    </Button>

                    {error && (
                        <Badge variant="destructive" className="flex items-center gap-1 shadow-xs">
                            <AlertTriangle className="h-3 w-3" />
                            {error}
                        </Badge>
                    )}
                </div>
            </div>

            {/* WebSocket Realtime Alert Banners */}
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
                            color="border-amber-500/30 bg-amber-500/5 text-amber-500"
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

            {/* Row 1: Core Platform Volume Metrics & User Authentication Breakdown (Persistent Header HUD) */}
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
                <StatCard
                    title="Total Customers"
                    value={totalUsers}
                    icon={Users}
                    iconColor="text-indigo-400"
                    iconBg="bg-indigo-500/10"
                    accentGradient="from-indigo-500 to-indigo-600"
                    loading={loading}
                    live={isLive}
                    subtext="All customer accounts"
                    onClick={() => navigate("/manage-users")}
                />
                <StatCard
                    title="Phone Registered"
                    value={phoneUsersCount}
                    icon={Smartphone}
                    iconColor="text-sky-400"
                    iconBg="bg-sky-500/10"
                    accentGradient="from-sky-500 to-indigo-500"
                    loading={loading}
                    trend={`${phonePercent}%`}
                    trendColor="text-sky-500 font-bold"
                    subtext="All-Time Mobile OTP"
                    onClick={() => navigate("/manage-users")}
                />
                <StatCard
                    title="Google Sign-In"
                    value={googleUsersCount}
                    icon={Globe}
                    iconColor="text-violet-400"
                    iconBg="bg-violet-500/10"
                    accentGradient="from-violet-500 to-pink-500"
                    loading={loading}
                    trend={`${googlePercent}%`}
                    trendColor="text-violet-500 font-bold"
                    subtext="All-Time Google Auth"
                    onClick={() => navigate("/manage-users")}
                />
                <StatCard
                    title="Active Merchants"
                    value={totalShops}
                    icon={Store}
                    iconColor="text-amber-400"
                    iconBg="bg-amber-500/10"
                    accentGradient="from-amber-500 to-orange-500"
                    loading={loading}
                    live={isLive}
                    subtext="Approved shops"
                    onClick={() => navigate("/shops")}
                />
                <StatCard
                    title="Pending Orders"
                    value={pendingOrders}
                    icon={ShoppingCart}
                    iconColor="text-rose-400"
                    iconBg="bg-rose-500/10"
                    accentGradient="from-rose-500 to-indigo-500"
                    loading={loading}
                    live={isLive}
                    trend={pendingOrders > 0 ? "Fulfillment pending" : "All dispatched"}
                    trendColor={pendingOrders > 0 ? "text-amber-500" : "text-emerald-500"}
                    subtext="Live kitchen board"
                    onClick={() => navigate("/orders/board")}
                />
                <StatCard
                    title="Customer Reviews"
                    value={totalReviews}
                    icon={Star}
                    iconColor="text-yellow-400"
                    iconBg="bg-yellow-500/10"
                    accentGradient="from-yellow-400 to-amber-500"
                    loading={loading}
                    live={isLive}
                    subtext="Verified ratings"
                    onClick={() => setReviewModalOpen(true)}
                />
            </div>

            {/* Dashboard Tabs Organization */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/50 pb-2.5">
                    <TabsList className="bg-muted/40 p-1 border border-border/60 rounded-xl h-auto flex flex-wrap gap-1 shadow-2xs">
                        <TabsTrigger
                            value="overview"
                            className="gap-2 px-3.5 py-1.5 text-xs font-semibold data-[state=active]:bg-indigo-500/15 data-[state=active]:text-indigo-400 data-[state=active]:border-indigo-500/30 border border-transparent rounded-lg transition-all"
                        >
                            <BarChart3 className="h-3.5 w-3.5" />
                            Executive Overview
                        </TabsTrigger>
                        <TabsTrigger
                            value="operations"
                            className="gap-2 px-3.5 py-1.5 text-xs font-semibold data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 data-[state=active]:border-emerald-500/30 border border-transparent rounded-lg transition-all"
                        >
                            <Truck className="h-3.5 w-3.5" />
                            Fulfillment &amp; Orders
                        </TabsTrigger>
                        <TabsTrigger
                            value="telemetry"
                            className="gap-2 px-3.5 py-1.5 text-xs font-semibold data-[state=active]:bg-sky-500/15 data-[state=active]:text-sky-400 data-[state=active]:border-sky-500/30 border border-transparent rounded-lg transition-all"
                        >
                            <Activity className="h-3.5 w-3.5" />
                            Customers &amp; Telemetry
                        </TabsTrigger>
                        <TabsTrigger
                            value="trending"
                            className="gap-2 px-3.5 py-1.5 text-xs font-semibold data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-400 data-[state=active]:border-amber-500/30 border border-transparent rounded-lg transition-all"
                        >
                            <UtensilsCrossed className="h-3.5 w-3.5" />
                            Trending &amp; Market
                        </TabsTrigger>
                        <TabsTrigger
                            value="all"
                            className="gap-2 px-3.5 py-1.5 text-xs font-semibold data-[state=active]:bg-purple-500/15 data-[state=active]:text-purple-400 data-[state=active]:border-purple-500/30 border border-transparent rounded-lg transition-all"
                        >
                            <Layers className="h-3.5 w-3.5" />
                            All Views
                        </TabsTrigger>
                    </TabsList>

                    <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
                        <span>Live Telemetry</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping" />
                    </div>
                </div>

                {/* TAB 1: EXECUTIVE OVERVIEW */}
                <TabsContent value="overview" className="space-y-4 focus-visible:outline-none animate-in fade-in duration-300">
                    <TodayFulfillmentOperationsSection
                        loading={loading}
                        todayDelivered={todayDeliveredCount}
                        todayCanceled={todayCanceledCount}
                        totalDeliveredAllTime={totalDeliveredAllTime}
                        totalCanceledAllTime={totalCanceledAllTime}
                        deliveryOptionOn={fulfillment.deliveryOptionOn}
                        deliveryOptionOff={fulfillment.deliveryOptionOff}
                        totalShopsCount={totalShops}
                    />
                    {renderRevenueAndShops()}
                </TabsContent>

                {/* TAB 2: FULFILLMENT & ORDERS */}
                <TabsContent value="operations" className="space-y-4 focus-visible:outline-none animate-in fade-in duration-300">
                    <TodayFulfillmentOperationsSection
                        loading={loading}
                        todayDelivered={todayDeliveredCount}
                        todayCanceled={todayCanceledCount}
                        totalDeliveredAllTime={totalDeliveredAllTime}
                        totalCanceledAllTime={totalCanceledAllTime}
                        deliveryOptionOn={fulfillment.deliveryOptionOn}
                        deliveryOptionOff={fulfillment.deliveryOptionOff}
                        totalShopsCount={totalShops}
                    />
                    <OrdersVelocityGraphCard initialVelocity={todayOrderVelocity} />
                </TabsContent>

                {/* TAB 3: CUSTOMERS & TELEMETRY */}
                <TabsContent value="telemetry" className="space-y-4 focus-visible:outline-none animate-in fade-in duration-300">
                    <UserRegistrationChannelSection
                        initialStats={userRegStats}
                        onStatsUpdate={setChannelFilterStats}
                    />
                    <TodayActivitySection
                        extendedStats={extendedStats}
                        isLive={isLive}
                        initialOrderVelocity={todayOrderVelocity}
                    />
                </TabsContent>

                {/* TAB 4: TRENDING & MARKET */}
                <TabsContent value="trending" className="space-y-4 focus-visible:outline-none animate-in fade-in duration-300">
                    <MenuTrendingCuisineSection extendedStats={extendedStats} />
                </TabsContent>

                {/* TAB 5: ALL VIEWS */}
                <TabsContent value="all" className="space-y-4 focus-visible:outline-none animate-in fade-in duration-300">
                    <UserRegistrationChannelSection
                        initialStats={userRegStats}
                        onStatsUpdate={setChannelFilterStats}
                    />
                    <TodayFulfillmentOperationsSection
                        loading={loading}
                        todayDelivered={todayDeliveredCount}
                        todayCanceled={todayCanceledCount}
                        totalDeliveredAllTime={totalDeliveredAllTime}
                        totalCanceledAllTime={totalCanceledAllTime}
                        deliveryOptionOn={fulfillment.deliveryOptionOn}
                        deliveryOptionOff={fulfillment.deliveryOptionOff}
                        totalShopsCount={totalShops}
                    />
                    <TodayActivitySection
                        extendedStats={extendedStats}
                        isLive={isLive}
                        initialOrderVelocity={todayOrderVelocity}
                    />
                    <MenuTrendingCuisineSection extendedStats={extendedStats} />
                    {renderRevenueAndShops()}
                </TabsContent>
            </Tabs>

            {/* Customer Reviews Detail Popup */}
            <CustomerReviewsDetailModal
                open={reviewModalOpen}
                onOpenChange={setReviewModalOpen}
                totalReviewsCount={totalReviews}
            />
        </div>
    );
}
