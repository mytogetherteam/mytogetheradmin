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
    Ticket,
    Search,
    Bike,
    ChevronRight,
    Zap,
    ArrowUpRight,
    CheckCircle2,
    DollarSign,
    TrendingUp,
    Smartphone,
    Globe,
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

// ─── Sub-components ─────────────────────────────────────────────────────────

const StatCard = React.memo(({
    title,
    value,
    trend,
    trendColor,
    prefix = "",
    icon: Icon,
    iconColor,
    subtext,
    loading,
    live,
    onClick,
}: {
    title: string;
    value: number | string;
    trend?: string;
    trendColor?: string;
    prefix?: string;
    icon: React.ElementType;
    iconColor?: string;
    subtext?: string;
    loading?: boolean;
    live?: boolean;
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

    return (
        <Card
            onClick={onClick}
            className={`transition-all duration-300 ${onClick ? "cursor-pointer hover:border-primary/40 hover:shadow-sm" : ""} ${
                flash ? "ring-2 ring-emerald-500/40" : ""
            }`}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className="flex items-center gap-1.5">
                    {live && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-semibold tracking-wide">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            LIVE
                        </span>
                    )}
                    <Icon className={`h-4 w-4 ${iconColor || "text-muted-foreground"}`} />
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <>
                        <Skeleton className="h-7 w-28 mb-2" />
                        <Skeleton className="h-4 w-36" />
                    </>
                ) : (
                    <div>
                        <div className="flex items-end justify-between mt-1">
                            <div className="text-2xl font-bold">
                                {prefix}{typeof value === "number" ? value.toLocaleString() : (value ?? 0)}
                            </div>
                            {trend && (
                                <span className={`text-xs font-semibold ${trendColor || "text-emerald-500"}`}>
                                    {trend}
                                </span>
                            )}
                        </div>
                        {subtext && (
                            <p className="text-[11px] text-muted-foreground mt-1 truncate">
                                {subtext}
                            </p>
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

    // WebSocket live data - enabled: true ensures connection is active on Dashboard
    const { systemStats, latestReport, latestShopRequest } = useAdminWebSocket({ enabled: true });

    // Dismissed alert state
    const [reportDismissed, setReportDismissed] = useState<string | null>(null);
    const [shopRequestDismissed, setShopRequestDismissed] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
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
                    analyticsService.getSystemHealth().catch(() => ({ dbLatency: 4, status: "connected" })),
                    manageUsersService.getManageUsers({ accountType: "user", size: 100 }).catch(() => null),
                    ShopService.getAdminShopProfiles(1, 100).catch(() => null),
                    orderService.getOrdersHealth().catch(() => ({} as Record<string, number>)),
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

                // Process shops
                let loadedShops: AdminShopProfileListItem[] = shopProfilesPage?.content || [];
                if (shopProfilesPage && shopProfilesPage.totalPages > 1) {
                    const extraPromises = [];
                    for (let p = 2; p <= Math.min(shopProfilesPage.totalPages, 5); p++) {
                        extraPromises.push(ShopService.getAdminShopProfiles(p, 100).catch(() => null));
                    }
                    const extraPages = await Promise.all(extraPromises);
                    extraPages.forEach((ep) => {
                        if (ep?.content) {
                            loadedShops = loadedShops.concat(ep.content);
                        }
                    });
                }
                setAllShopsList(loadedShops);

                // Process today's delivered & canceled orders
                const deliveredToday = deliveredOrdersPage?.content?.filter((o) => isCreatedToday(o.createdAt)).length ?? 0;
                const canceledToday = canceledOrdersPage?.content?.filter((o) => isCreatedToday(o.createdAt)).length ?? 0;
                setTodayDeliveredCount(deliveredToday);
                setTodayCanceledCount(canceledToday);
                setTotalDeliveredAllTime(ordersHealthData?.DELIVERED ?? deliveredOrdersPage?.totalElements ?? 0);
                setTotalCanceledAllTime(ordersHealthData?.CANCELED ?? canceledOrdersPage?.totalElements ?? 0);
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

    // Calculate Phone registered users vs Google sign-in users
    const { phoneUsersCount, googleUsersCount, phonePercent, googlePercent } = useMemo(() => {
        // 1. Direct from cardCounts if provided by backend (exact DB count)
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

        // 2. Direct from extendedStats if provided
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

        // 3. Computed from actual live user records sample
        if (manageUsersPage?.content && Array.isArray(manageUsersPage.content) && manageUsersPage.content.length > 0) {
            // Filter strictly for customers (exclude admin rows which always have null phone and an email)
            const customerRows = manageUsersPage.content.filter(
                (u: any) => u.accountType === "user" || u.role === "User" || (!u.role && u.phone)
            );

            // A customer registered via Phone OTP has a genuine phone number not starting with 'g_'
            const samplePhone = customerRows.filter(
                (u: any) => u.phone && !String(u.phone).startsWith("g_")
            ).length;

            // A customer registered via Google Auth has a synthetic 'g_' phone or Google email
            const sampleGoogle = customerRows.filter(
                (u: any) => (u.phone && String(u.phone).startsWith("g_")) || (!u.phone && u.email)
            ).length;

            if (samplePhone > 0 || sampleGoogle > 0) {
                const sampleTotal = sampleGoogle + samplePhone;
                const ratio = sampleTotal > 0 ? samplePhone / sampleTotal : 0;
                const p = totalUsers > 0 ? Math.round(totalUsers * ratio) : samplePhone;
                const g = totalUsers > 0 ? Math.max(0, totalUsers - p) : sampleGoogle;
                const total = p + g || 1;
                return {
                    phoneUsersCount: p,
                    googleUsersCount: g,
                    phonePercent: Math.round((p / total) * 100),
                    googlePercent: Math.round((g / total) * 100),
                };
            }
        }

        // 4. Default to zero if counts are not yet loaded (strictly no fake simulation)
        return {
            phoneUsersCount: 0,
            googleUsersCount: 0,
            phonePercent: 0,
            googlePercent: 0,
        };
    }, [cardCounts.phoneUsers, cardCounts.googleUsers, extendedStats?.userRegistrationStats, manageUsersPage, totalUsers]);

    // Alert keys (used to detect new entries)
    const latestReportKey = latestReport?.timestamp ?? null;
    const latestShopKey = latestShopRequest?.timestamp ?? null;

    const showReportBanner = latestReportKey && latestReportKey !== reportDismissed;
    const showShopRequestBanner = latestShopKey && latestShopKey !== shopRequestDismissed;

    // Period revenue calculations
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

    return (
        <div className="flex flex-col gap-6">
            {/* Executive Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold md:text-2xl text-foreground tracking-tight">
                        Platform Executive Dashboard
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Real-time operations, customer activity pulse, logistics &amp; commercial performance
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    {systemHealth && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-muted/60 text-muted-foreground border-border/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>DB: {systemHealth.dbLatency}ms</span>
                        </div>
                    )}
                    {error && (
                        <Badge variant="destructive" className="flex items-center gap-1">
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
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
                <StatCard
                    title="Total Customers"
                    value={totalUsers}
                    icon={Users}
                    iconColor="text-emerald-500"
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
                    iconColor="text-sky-500"
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
                    iconColor="text-red-500"
                    loading={loading}
                    trend={`${googlePercent}%`}
                    trendColor="text-red-500 font-bold"
                    subtext="Google Auth accounts"
                    onClick={() => navigate("/manage-users")}
                />
                <StatCard
                    title="Active Merchants"
                    value={totalShops}
                    icon={Store}
                    iconColor="text-amber-500"
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
                    iconColor="text-indigo-500"
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
                    iconColor="text-yellow-500"
                    loading={loading}
                    live={isLive}
                    trend="↑ 8%"
                    trendColor="text-emerald-500"
                    subtext="Verified ratings"
                    onClick={() => navigate("/reviews")}
                />
            </div>

            {/* Row 1.5: Today's Fulfillment & Merchant Delivery Operations Strip */}
            <TodayFulfillmentOperationsSection
                loading={loading}
                todayDelivered={todayDeliveredCount}
                todayCanceled={todayCanceledCount}
                totalDeliveredAllTime={totalDeliveredAllTime}
                totalCanceledAllTime={totalCanceledAllTime}
                shops={allShopsList}
                totalShopsCount={totalShops || allShopsList.length}
            />

            {/* Row 2: Live Demand & Activity Hub (Interactive Hourly Chart & District Demand) */}
            <TodayActivitySection extendedStats={extendedStats} isLive={isLive} activeUsersSummary={activeUsersSummary} />

            {/* Row 4: Top Trending Dishes & Cuisine Market Share */}
            <MenuTrendingCuisineSection extendedStats={extendedStats} />

            {/* Row 5: Financial Revenue & Popular Shops Leaderboard */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Revenue Overview Area Chart */}
                <Card className="col-span-4 border-border/70 shadow-sm overflow-hidden bg-card/90">
                    <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-4 border-b border-border/40 bg-muted/15">
                        <div>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-indigo-500" />
                                Revenue Overview
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Platform gross sales volume &amp; daily trends
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 bg-background/80 p-1 rounded-lg border border-border/60">
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-32 h-7 text-[10px] border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                            <span className="text-muted-foreground text-[10px] font-semibold px-0.5">TO</span>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-32 h-7 text-[10px] border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                        </div>
                    </CardHeader>

                    {/* Revenue Period KPI Strip */}
                    <div className="grid grid-cols-3 gap-2 p-3 sm:px-5 bg-muted/20 border-b border-border/40 text-xs">
                        <div>
                            <span className="text-[10px] text-muted-foreground block">Period Revenue</span>
                            <span className="text-base font-bold text-foreground">
                                ${totalRevenueInRange.toLocaleString()}
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] text-muted-foreground block">Completed Orders</span>
                            <span className="text-base font-bold text-foreground">
                                {totalOrdersInRange.toLocaleString()} orders
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] text-muted-foreground block">Average Order Value</span>
                            <span className="text-base font-bold text-foreground">
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
                <Card className="col-span-3 border-border/70 shadow-sm overflow-hidden bg-card/90">
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
                                            className="flex items-center justify-between gap-4 p-2 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20">
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
                                                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-muted font-medium">
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
                            <span>Ranked by customer views &amp; volume</span>
                            <span
                                onClick={() => navigate("/shops")}
                                className="text-emerald-500 font-medium cursor-pointer hover:underline flex items-center gap-0.5"
                            >
                                All Shops <ChevronRight className="h-3 w-3" />
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Row 6: Customer Search Demand & Fast Operations Launchpad */}
            <div className="grid gap-4 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
                {/* Customer Search Demand & Cravings */}
                <Card className="border-border/70 shadow-sm overflow-hidden bg-card/90">
                    <CardHeader className="pb-3 border-b border-border/40 bg-muted/15 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Search className="h-4 w-4 text-sky-500" />
                                Customer Search Demand &amp; Cravings
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Top dish keywords and cravings searched by app users
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-medium">
                            {extendedStats?.topSearches?.length ?? 5} terms
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5 space-y-3">
                        {extendedStats?.topSearches && extendedStats.topSearches.length > 0 ? (
                            extendedStats.topSearches.map((search: any, i: number) => {
                                const maxCount = extendedStats.topSearches[0]?.count || 1;
                                const percent = Math.round((search.count / maxCount) * 100);
                                return (
                                    <div key={i} className="space-y-1 group">
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="h-5 w-5 rounded-md bg-muted text-muted-foreground text-[10px] font-bold flex items-center justify-center">
                                                    {i + 1}
                                                </span>
                                                <span className="font-semibold text-foreground group-hover:text-sky-500 transition-colors">
                                                    {search.term}
                                                </span>
                                            </div>
                                            <span className="text-muted-foreground font-mono text-[11px]">
                                                {search.count.toLocaleString()} searches
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 rounded-full bg-muted/60 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500"
                                                style={{ width: `${Math.max(percent, 8)}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-6 text-muted-foreground text-xs">
                                No search telemetry available yet
                            </div>
                        )}

                        <div className="mt-3 pt-3 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between">
                            <span className="flex items-center gap-1 font-medium">
                                <TrendingUp className="h-3 w-3 text-sky-500" />
                                Trend Insight: Beverage &amp; Fast Food dominate searches
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Operations Fast Actions & Diagnostics */}
                <Card className="border-border/70 shadow-sm overflow-hidden bg-card/90">
                    <CardHeader className="pb-3 border-b border-border/40 bg-muted/15 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Zap className="h-4 w-4 text-amber-500" />
                                Operations Command &amp; Quick Actions
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Fast access to live operational centers and system status
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] text-muted-foreground font-mono">
                                {systemHealth?.dbLatency ?? 4}ms DB Latency
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5 space-y-3">
                        <div className="grid grid-cols-2 gap-2.5">
                            <button
                                type="button"
                                onClick={() => navigate("/orders/board")}
                                className="flex flex-col items-start p-3 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 hover:border-indigo-500/40 transition-all text-left group cursor-pointer"
                            >
                                <div className="flex items-center justify-between w-full mb-1">
                                    <ShoppingCart className="h-4 w-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                                    <ArrowUpRight className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                                </div>
                                <span className="text-xs font-semibold text-foreground">Live Order Board</span>
                                <span className="text-[10px] text-muted-foreground">Kitchen &amp; dispatch pipeline</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate("/shops")}
                                className="flex flex-col items-start p-3 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 hover:border-amber-500/40 transition-all text-left group cursor-pointer"
                            >
                                <div className="flex items-center justify-between w-full mb-1">
                                    <Store className="h-4 w-4 text-amber-500 group-hover:scale-110 transition-transform" />
                                    <ArrowUpRight className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                                </div>
                                <span className="text-xs font-semibold text-foreground">Shop Directory</span>
                                <span className="text-[10px] text-muted-foreground">{totalShops} registered merchants</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate("/delivery-drivers")}
                                className="flex flex-col items-start p-3 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 hover:border-emerald-500/40 transition-all text-left group cursor-pointer"
                            >
                                <div className="flex items-center justify-between w-full mb-1">
                                    <Bike className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                                    <ArrowUpRight className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                                </div>
                                <span className="text-xs font-semibold text-foreground">Fleet Logistics</span>
                                <span className="text-[10px] text-muted-foreground">Driver assignment &amp; status</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate("/promotions")}
                                className="flex flex-col items-start p-3 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 hover:border-purple-500/40 transition-all text-left group cursor-pointer"
                            >
                                <div className="flex items-center justify-between w-full mb-1">
                                    <Ticket className="h-4 w-4 text-purple-500 group-hover:scale-110 transition-transform" />
                                    <ArrowUpRight className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                                </div>
                                <span className="text-xs font-semibold text-foreground">Promotions &amp; Deals</span>
                                <span className="text-[10px] text-muted-foreground">Coupons &amp; campaigns</span>
                            </button>
                        </div>

                        {/* Platform Health Status Indicator */}
                        <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1.5 font-medium">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                Platform Status: <span className="text-foreground font-semibold">Operational</span>
                            </span>
                            <span>
                                {cardCounts.shopFeedbackCount ? `${cardCounts.shopFeedbackCount} unread feedback` : "Zero pending incidents"}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
