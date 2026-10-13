import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
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
import { analyticsService, RevenueData, PopularShop } from "@/services/analyticsService";
import { dashboardService, DashboardCardCounts } from "@/services/dashboardService";
import { manageUsersService } from "@/services/manageUsersService";
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
    ArrowUpRight,
    DollarSign,
    Smartphone,
    Globe,
    Activity,
    RefreshCw,
    Calendar,
    Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminWebSocket, SystemStatsDTO } from "@/hooks/useAdminWebSocket";
import { activeUsersService, ActiveUsersSummary } from "@/services/activeUsersService";
import { TodayActivitySection } from "@/components/dashboard/TodayActivitySection";
import { MenuTrendingCuisineSection } from "@/components/dashboard/MenuTrendingCuisineSection";
import { TodayFulfillmentOperationsSection } from "@/components/dashboard/TodayFulfillmentOperationsSection";
import { ShopService, AdminShopProfileListItem } from "@/services/shopService";
import { orderService } from "@/services/orderService";
import { CustomerReviewsDetailModal } from "@/components/dashboard/CustomerReviewsDetailModal";

// ─── Helpers ───────────────────────────────────────────────────────────────

function isCreatedToday(isoString?: string | null): boolean {
    if (!isoString) return false;
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
    );
}

function getDefaultDates() {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
    };
}

// ─── StatCard Accent Config ───────────────────────────────────────────────

const ACCENT_STYLES = {
    emerald: {
        borderGlow: "hover:border-emerald-500/50 hover:shadow-emerald-500/10",
        topGradient: "from-emerald-500/60 via-emerald-500/20 to-transparent",
        iconBox: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    },
    sky: {
        borderGlow: "hover:border-sky-500/50 hover:shadow-sky-500/10",
        topGradient: "from-sky-500/60 via-sky-500/20 to-transparent",
        iconBox: "bg-sky-500/10 text-sky-500 border-sky-500/20",
    },
    rose: {
        borderGlow: "hover:border-rose-500/50 hover:shadow-rose-500/10",
        topGradient: "from-rose-500/60 via-rose-500/20 to-transparent",
        iconBox: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    },
    amber: {
        borderGlow: "hover:border-amber-500/50 hover:shadow-amber-500/10",
        topGradient: "from-amber-500/60 via-amber-500/20 to-transparent",
        iconBox: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    },
    indigo: {
        borderGlow: "hover:border-indigo-500/50 hover:shadow-indigo-500/10",
        topGradient: "from-indigo-500/60 via-indigo-500/20 to-transparent",
        iconBox: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    },
    yellow: {
        borderGlow: "hover:border-yellow-500/50 hover:shadow-yellow-500/10",
        topGradient: "from-yellow-500/60 via-yellow-500/20 to-transparent",
        iconBox: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    },
};

// ─── Sub-components ─────────────────────────────────────────────────────────

const StatCard = React.memo(({
    title,
    value,
    trend,
    trendColor,
    prefix = "",
    icon: Icon,
    subtext,
    loading,
    live,
    accentColor = "emerald",
    onClick,
}: {
    title: string;
    value: number | string;
    trend?: string;
    trendColor?: string;
    prefix?: string;
    icon: React.ElementType;
    subtext?: string;
    loading?: boolean;
    live?: boolean;
    accentColor?: "emerald" | "sky" | "rose" | "amber" | "indigo" | "yellow";
    onClick?: () => void;
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

    const accent = ACCENT_STYLES[accentColor];

    return (
        <Card
            onClick={onClick}
            className={`relative overflow-hidden border-border/70 bg-card/85 backdrop-blur-md transition-all duration-300 group ${
                onClick ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md" : ""
            } ${accent.borderGlow} ${flash ? "ring-2 ring-emerald-500/40" : ""}`}
        >
            {/* Top ambient color highlight accent line */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accent.topGradient}`} />

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-3.5 px-4">
                <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
                    {title}
                </CardTitle>
                <div className="flex items-center gap-1.5 shrink-0">
                    {live && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-semibold tracking-wide">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            LIVE
                        </span>
                    )}
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center border ${accent.iconBox} group-hover:scale-105 transition-transform`}>
                        <Icon className="h-3.5 w-3.5" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-4 pb-3.5">
                {loading ? (
                    <>
                        <Skeleton className="h-7 w-28 mb-1.5" />
                        <Skeleton className="h-3.5 w-32" />
                    </>
                ) : (
                    <div>
                        <div className="flex items-baseline justify-between gap-1">
                            <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
                                {prefix}{typeof value === "number" ? value.toLocaleString() : (value ?? 0)}
                            </div>
                            {onClick && (
                                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                            )}
                        </div>
                        <div className="flex items-center justify-between text-xs mt-1.5 pt-1.5 border-t border-border/40">
                            {subtext && (
                                <span className="text-[11px] text-muted-foreground truncate">
                                    {subtext}
                                </span>
                            )}
                            {trend && (
                                <span className={`text-[11px] font-semibold shrink-0 ${trendColor || "text-emerald-500"}`}>
                                    {trend}
                                </span>
                            )}
                        </div>
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
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${color} animate-in slide-in-from-top-2 duration-300 shadow-sm`}
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

    // REST baseline data
    const [cardCounts, setCardCounts] = useState<Partial<DashboardCardCounts>>({});
    const [revenue, setRevenue] = useState<RevenueData[]>([]);
    const [popularShops, setPopularShops] = useState<PopularShop[]>([]);
    const [systemHealth, setSystemHealth] = useState<{ dbLatency: number; status: string } | null>(null);
    const [manageUsersPage, setManageUsersPage] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Extended Stats
    const [extendedStats, setExtendedStats] = useState<any>(null);
    const [activeUsersSummary, setActiveUsersSummary] = useState<ActiveUsersSummary | null>(null);

    // Delivery Options & Today's Orders
    const [allShopsList, setAllShopsList] = useState<AdminShopProfileListItem[]>([]);
    const [todayDeliveredCount, setTodayDeliveredCount] = useState<number>(0);
    const [todayCanceledCount, setTodayCanceledCount] = useState<number>(0);
    const [totalDeliveredAllTime, setTotalDeliveredAllTime] = useState<number>(0);
    const [totalCanceledAllTime, setTotalCanceledAllTime] = useState<number>(0);

    // WebSocket live data
    const { systemStats, latestReport, latestShopRequest } = useAdminWebSocket({ enabled: true });

    // Dismissed alert state
    const [reportDismissed, setReportDismissed] = useState<string | null>(null);
    const [shopRequestDismissed, setShopRequestDismissed] = useState<string | null>(null);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);

    const loadDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            const [
                cardsData,
                revenueData,
                shopsData,
                extendedData,
                activeSummary,
                healthData,
                usersData,
                shopProfilesPage,
                ordersHealthData,
                deliveredOrdersPage,
                canceledOrdersPage,
            ] = await Promise.all([
                dashboardService.getCardCounts().catch(() => ({})),
                analyticsService.getRevenueAnalytics(startDate, endDate).catch(() => []),
                analyticsService.getPopularShops().catch(() => []),
                analyticsService.getExtendedDashboardStats().catch(() => null),
                activeUsersService.summary().catch(() => null),
                analyticsService.getSystemHealth().catch(() => null),
                manageUsersService.getManageUsers({ page: 1, size: 100 }).catch(() => null),
                ShopService.getAdminShopProfiles(1, 100).catch(() => null),
                orderService.getOrdersHealth().catch(() => null),
                orderService.getOrders({ status: "DELIVERED", size: 100 }).catch(() => null),
                orderService.getOrders({ status: "CANCELED", size: 100 }).catch(() => null),
            ]);

            setCardCounts(cardsData);
            setRevenue(revenueData);
            setPopularShops(shopsData);
            setExtendedStats(extendedData);
            setActiveUsersSummary(activeSummary);
            setSystemHealth(healthData);
            setManageUsersPage(usersData);

            if (shopProfilesPage && Array.isArray(shopProfilesPage.content)) {
                setAllShopsList(shopProfilesPage.content);
            }

            if (ordersHealthData) {
                setTodayDeliveredCount(ordersHealthData.deliveredToday || 0);
                setTodayCanceledCount(ordersHealthData.cancelledToday || 0);
            } else {
                const todayDelivered = (deliveredOrdersPage?.content || []).filter((o: any) =>
                    isCreatedToday(o.createdAt)
                ).length;
                const todayCanceled = (canceledOrdersPage?.content || []).filter((o: any) =>
                    isCreatedToday(o.createdAt)
                ).length;
                setTodayDeliveredCount(todayDelivered);
                setTodayCanceledCount(todayCanceled);
            }

            setTotalDeliveredAllTime(deliveredOrdersPage?.totalElements || deliveredOrdersPage?.content?.length || 0);
            setTotalCanceledAllTime(canceledOrdersPage?.totalElements || canceledOrdersPage?.content?.length || 0);
        } catch {
            setError("Failed to load dashboard data.");
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    // Derived: prefer live WS stats where available, fall back to REST baseline
    const liveStats: Partial<SystemStatsDTO> = useMemo(() => systemStats ?? {}, [systemStats]);
    const totalUsers = liveStats.totalUsers ?? cardCounts.totalUsers ?? 0;
    const isLive = !!systemStats;
    const totalShops = liveStats.activeShops ?? liveStats.totalShops ?? cardCounts.totalShops ?? 0;
    const totalReviews = liveStats.totalReviews ?? cardCounts.totalReviews ?? 0;
    const pendingOrders = liveStats.pendingOrders ?? cardCounts.pendingOrders ?? 0;

    // Calculate Phone registered users vs Google sign-in users
    const { phoneUsersCount, googleUsersCount, phonePercent, googlePercent } = useMemo(() => {
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

        if (manageUsersPage?.content && Array.isArray(manageUsersPage.content) && manageUsersPage.content.length > 0) {
            const customerRows = manageUsersPage.content.filter(
                (u: any) => u.accountType === "user" || u.role === "User" || (!u.role && u.phone)
            );

            const samplePhone = customerRows.filter(
                (u: any) => u.phone && !String(u.phone).startsWith("g_")
            ).length;
            const sampleGoogle = customerRows.filter(
                (u: any) => (u.phone && String(u.phone).startsWith("g_")) || u.email
            ).length;

            const sampleTotal = samplePhone + sampleGoogle || 1;
            const pRatio = samplePhone / sampleTotal;
            const gRatio = sampleGoogle / sampleTotal;

            const computedPhone = Math.round(totalUsers * pRatio);
            const computedGoogle = Math.max(0, totalUsers - computedPhone);

            return {
                phoneUsersCount: computedPhone,
                googleUsersCount: computedGoogle,
                phonePercent: Math.round(pRatio * 100),
                googlePercent: Math.round(gRatio * 100),
            };
        }

        return {
            phoneUsersCount: 0,
            googleUsersCount: 0,
            phonePercent: 0,
            googlePercent: 0,
        };
    }, [cardCounts.phoneUsers, cardCounts.googleUsers, extendedStats?.userRegistrationStats, manageUsersPage, totalUsers]);

    // WebSocket Alert banners
    const latestReportKey = latestReport
        ? `${latestReport.id ?? ""}-${latestReport.createdAt ?? ""}`
        : null;
    const latestShopKey = latestShopRequest
        ? `${latestShopRequest.id ?? ""}-${latestShopRequest.createdAt ?? ""}`
        : null;

    const showReportBanner =
        latestReport &&
        isCreatedToday(latestReport.createdAt as string | undefined) &&
        reportDismissed !== latestReportKey;

    const showShopRequestBanner =
        latestShopRequest &&
        isCreatedToday(latestShopRequest.createdAt as string | undefined) &&
        shopRequestDismissed !== latestShopKey;

    // Revenue Overview calculation
    const chartData = useMemo(() => {
        if (!revenue || revenue.length === 0) return [];
        return revenue.map((r) => ({
            name: new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
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

    // Preset Date Range Helpers
    const setPresetRange = (type: "7d" | "30d" | "month") => {
        const end = new Date();
        const start = new Date();
        if (type === "7d") {
            start.setDate(start.getDate() - 7);
        } else if (type === "30d") {
            start.setDate(start.getDate() - 30);
        } else if (type === "month") {
            start.setDate(1);
        }
        setStartDate(start.toISOString().split("T")[0]);
        setEndDate(end.toISOString().split("T")[0]);
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-8">
            {/* ─── Executive Header Bar ────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-2xl border border-border/70 bg-gradient-to-r from-card/90 via-card/75 to-card/90 backdrop-blur-md shadow-xs">
                <div className="flex items-center gap-3.5 min-w-0">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-indigo-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-xs shrink-0">
                        <Activity className="h-5 w-5 animate-pulse" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight">
                                Platform Executive Dashboard
                            </h1>
                            <Badge variant="outline" className="text-[10px] h-5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold hidden sm:inline-flex">
                                <Sparkles className="h-2.5 w-2.5 mr-1" />
                                Realtime Pulse
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                            Real-time merchant operations, live spatial telemetry, dish popularity &amp; commercial velocity
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {/* Live WebSocket Status Pill */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-muted/50 border-border/70 shadow-2xs">
                        <span className={`w-2 h-2 rounded-full ${isLive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`} />
                        <span className="text-[11px] text-muted-foreground font-mono">
                            {isLive ? "Live WS Stream" : "REST Synced"}
                        </span>
                    </div>

                    {/* DB Latency Pill */}
                    {systemHealth && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-muted/50 text-muted-foreground border-border/70 font-mono text-[11px]">
                            <span>DB: {systemHealth.dbLatency}ms</span>
                        </div>
                    )}

                    {/* Refresh Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={loadDashboardData}
                        disabled={loading}
                        className="h-8 px-2.5 text-xs gap-1.5 border-border/70 hover:border-emerald-500/40 hover:bg-emerald-500/5 cursor-pointer"
                        title="Reload Dashboard Data"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${loading ? "animate-spin text-emerald-500" : ""}`} />
                        <span className="hidden md:inline">Refresh</span>
                    </Button>

                    {error && (
                        <Badge variant="destructive" className="flex items-center gap-1 text-xs">
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

            {/* Row 1: Core Platform Volume Metrics & User Authentication Breakdown */}
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                <StatCard
                    title="Total Customers"
                    value={totalUsers}
                    icon={Users}
                    accentColor="emerald"
                    loading={loading}
                    live={isLive}
                    trend="↑ 12%"
                    trendColor="text-emerald-500"
                    subtext="All customer accounts"
                    onClick={() => navigate("/manage-users")}
                />
                <StatCard
                    title="Phone Registered"
                    value={phoneUsersCount}
                    icon={Smartphone}
                    accentColor="sky"
                    loading={loading}
                    trend={`${phonePercent}%`}
                    trendColor="text-sky-500 font-bold"
                    subtext="Mobile OTP signups"
                    onClick={() => navigate("/manage-users")}
                />
                <StatCard
                    title="Google Sign-In"
                    value={googleUsersCount}
                    icon={Globe}
                    accentColor="rose"
                    loading={loading}
                    trend={`${googlePercent}%`}
                    trendColor="text-rose-500 font-bold"
                    subtext="Google Auth accounts"
                    onClick={() => navigate("/manage-users")}
                />
                <StatCard
                    title="Active Merchants"
                    value={totalShops}
                    icon={Store}
                    accentColor="amber"
                    loading={loading}
                    live={isLive}
                    trend="↑ 5%"
                    trendColor="text-emerald-500"
                    subtext="Approved shops"
                    onClick={() => navigate("/shops")}
                />
                <StatCard
                    title="Pending Orders"
                    value={pendingOrders}
                    icon={ShoppingCart}
                    accentColor="indigo"
                    loading={loading}
                    live={isLive}
                    trend={pendingOrders > 0 ? "Fulfillment pending" : "All dispatched"}
                    trendColor={pendingOrders > 0 ? "text-amber-500 font-bold" : "text-emerald-500"}
                    subtext="Live kitchen board"
                    onClick={() => navigate("/orders/board")}
                />
                <StatCard
                    title="Customer Reviews"
                    value={totalReviews}
                    icon={Star}
                    accentColor="yellow"
                    loading={loading}
                    live={isLive}
                    trend="↑ 8%"
                    trendColor="text-emerald-500"
                    subtext="Verified ratings"
                    onClick={() => setReviewModalOpen(true)}
                />
            </div>

            {/* Row 2: Today's Fulfillment & Merchant Delivery Operations Strip */}
            <TodayFulfillmentOperationsSection
                loading={loading}
                todayDelivered={todayDeliveredCount}
                todayCanceled={todayCanceledCount}
                totalDeliveredAllTime={totalDeliveredAllTime}
                totalCanceledAllTime={totalCanceledAllTime}
                shops={allShopsList}
                totalShopsCount={totalShops || allShopsList.length}
            />

            {/* Row 3: Live Demand & Activity Hub (Orders Velocity Graph & Real User Locations Map) */}
            <TodayActivitySection
                extendedStats={extendedStats}
                isLive={isLive}
                activeUsersSummary={activeUsersSummary}
            />

            {/* Row 4: Top Trending Dishes & Cuisine Market Share */}
            <MenuTrendingCuisineSection extendedStats={extendedStats} />

            {/* Row 5: Financial Revenue & Top Performing Shops Leaderboard */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Revenue Overview Area Chart */}
                <Card className="col-span-4 border-border/70 shadow-sm overflow-hidden bg-card/90 flex flex-col">
                    <CardHeader className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-3 border-b border-border/40 bg-muted/15">
                        <div>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-indigo-500" />
                                Revenue Overview
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Platform gross sales volume &amp; daily transactional trends
                            </CardDescription>
                        </div>

                        {/* Date Range Presets & Inputs */}
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center bg-muted/80 p-0.5 rounded-lg border border-border/60 text-xs">
                                <button
                                    type="button"
                                    onClick={() => setPresetRange("7d")}
                                    className="px-2 py-0.5 rounded-md hover:bg-background text-muted-foreground hover:text-foreground font-medium cursor-pointer transition-all"
                                >
                                    7D
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPresetRange("30d")}
                                    className="px-2 py-0.5 rounded-md hover:bg-background text-muted-foreground hover:text-foreground font-medium cursor-pointer transition-all"
                                >
                                    30D
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPresetRange("month")}
                                    className="px-2 py-0.5 rounded-md hover:bg-background text-muted-foreground hover:text-foreground font-medium cursor-pointer transition-all"
                                >
                                    Month
                                </button>
                            </div>

                            <div className="flex items-center gap-1.5 bg-background/90 px-2 py-1 rounded-lg border border-border/60 shadow-xs">
                                <Calendar className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-28 h-5 text-[10.5px] p-0 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                                />
                                <span className="text-muted-foreground text-[10px] font-semibold">TO</span>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-28 h-5 text-[10.5px] p-0 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                                />
                            </div>
                        </div>
                    </CardHeader>

                    {/* Revenue Period KPI Strip */}
                    <div className="grid grid-cols-3 gap-2 p-3 sm:px-5 bg-muted/20 border-b border-border/40 text-xs">
                        <div>
                            <span className="text-[10px] text-muted-foreground block">Period Revenue</span>
                            <span className="text-base font-bold text-foreground font-mono">
                                ${totalRevenueInRange.toLocaleString()}
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] text-muted-foreground block">Completed Orders</span>
                            <span className="text-base font-bold text-foreground font-mono">
                                {totalOrdersInRange.toLocaleString()} orders
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] text-muted-foreground block">Average Order Value</span>
                            <span className="text-base font-bold text-foreground font-mono">
                                ${avgOrderValue.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    <CardContent className="p-4 sm:p-5 pt-4 flex-1">
                        {loading ? (
                            <Skeleton className="w-full h-[280px]" />
                        ) : chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45} />
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
                <Card className="col-span-3 border-border/70 shadow-sm overflow-hidden bg-card/90 flex flex-col">
                    <CardHeader className="pb-3 border-b border-border/40 bg-muted/15 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Store className="h-4 w-4 text-emerald-500" />
                                Top Performing Shops
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Highest customer reach &amp; order fulfillment
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                            {popularShops.length} shops
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
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
                            <div className="space-y-3">
                                {popularShops.slice(0, 5).map((shop, i) => {
                                    const shopId = shop.shopId || `shop_${i}`;
                                    const shopName = shop.shopName || "Unknown Shop";
                                    const views = shop.viewCount || 0;
                                    const unique = shop.uniqueViewers || 0;

                                    // Rank badge colors
                                    const rankBadgeColor =
                                        i === 0
                                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                            : i === 1
                                            ? "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30"
                                            : i === 2
                                            ? "bg-amber-700/15 text-amber-700 dark:text-amber-500 border-amber-700/30"
                                            : "bg-muted text-muted-foreground border-border/60";

                                    return (
                                        <div
                                            key={shopId}
                                            onClick={() => navigate("/shops")}
                                            className="flex items-center justify-between gap-4 p-2 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/60 hover:border-emerald-500/40 transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-bold text-xs border ${rankBadgeColor}`}>
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
                                                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-muted/80 font-mono font-medium">
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

                        <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>Ranked by customer discovery &amp; order volume</span>
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

            {/* Customer Reviews Detail Popup with Load More Pagination */}
            <CustomerReviewsDetailModal
                open={reviewModalOpen}
                onOpenChange={setReviewModalOpen}
                totalReviewsCount={totalReviews}
            />
        </div>
    );
}
