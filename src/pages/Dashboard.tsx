import { useEffect, useState } from "react";
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
import { analyticsService, DashboardStats, RevenueData, PopularShop } from "@/services/analyticsService";
import { orderService, OrderHealthData } from "@/services/orderService";
import { ShopService } from "@/services/shopService";
import { moderationService } from "@/services/moderationService";
import { DollarSign, Users, ShoppingCart, Store, AlertTriangle, Building2, Flag, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function StatCard({
    title,
    value,
    prefix = "",
    icon: Icon,
    loading,
}: {
    title: string;
    value: number | string;
    change?: number;
    prefix?: string;
    icon: React.ElementType;
    loading?: boolean;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {loading ? (
                    <>
                        <Skeleton className="h-7 w-28 mb-2" />
                        <Skeleton className="h-4 w-36" />
                    </>
                ) : (
                    <div className="text-2xl font-bold">
                        {prefix}{typeof value === "number" ? value.toLocaleString() : (value ?? 0)}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function getDefaultDates() {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30); // Default to 30 days ago
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

export default function Dashboard() {
    const navigate = useNavigate();
    const defaults = getDefaultDates();
    const [startDate, setStartDate] = useState(defaults.start);
    const [endDate, setEndDate] = useState(defaults.end);

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [revenue, setRevenue] = useState<RevenueData[]>([]);
    const [popularShops, setPopularShops] = useState<PopularShop[]>([]);
    const [orderHealth, setOrderHealth] = useState<OrderHealthData>({});
    const [pendingShopsCount, setPendingShopsCount] = useState(0);
    const [openReportsCount, setOpenReportsCount] = useState(0);
    const [systemHealth, setSystemHealth] = useState<{ dbLatency: number; status: string; performance?: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const [statsData, revenueData, shopsData, healthData, pendingData, reportsData, sysHealth] = await Promise.all([
                    analyticsService.getDashboardStats().catch(() => null),
                    analyticsService.getRevenueAnalytics(startDate, endDate).catch(() => []),
                    analyticsService.getPopularShops().catch(() => []),
                    orderService.getOrdersHealth().catch(() => ({})),
                    ShopService.getPendingVettingShops(0, 1).catch(() => ({ totalElements: 0 })),
                    moderationService.getUserShopReports('PENDING', 0, 1).catch(() => ({ totalElements: 0 })),
                    analyticsService.getSystemHealth().catch(() => null),
                ]);
                setStats(statsData);
                setRevenue(revenueData);
                setPopularShops(shopsData);
                setOrderHealth(healthData);
                setPendingShopsCount(pendingData?.totalElements ?? 0);
                setOpenReportsCount(reportsData?.totalElements ?? 0);
                setSystemHealth(sysHealth);
            } catch (err) {
                setError("Failed to load dashboard data.");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [startDate, endDate]);

    const chartData = revenue.length > 0
        ? revenue.map((r) => ({ name: new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }), total: r.amount ?? 0 }))
        : [];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
                {error && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {error}
                    </Badge>
                )}
            </div>

            {/* Row 1: KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Users"
                    value={stats?.totalUsers ?? 0}
                    icon={Users}
                    loading={loading}
                />
                <StatCard
                    title="Total Shops"
                    value={stats?.totalShops ?? 0}
                    icon={Store}
                    loading={loading}
                />
                <StatCard
                    title="Orders Today"
                    value={stats?.totalOrdersToday ?? 0}
                    icon={ShoppingCart}
                    loading={loading}
                />
                <StatCard
                    title="Revenue Today"
                    value={stats?.totalRevenueToday ?? 0}
                    prefix="$"
                    icon={DollarSign}
                    loading={loading}
                />
            </div>

            {/* Row 2: Alert Banners */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card
                    className="cursor-pointer border-yellow-500/30 hover:border-yellow-500/60 transition-colors"
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
                            <span className="text-2xl font-bold text-yellow-500">{pendingShopsCount}</span>
                        )}
                    </CardContent>
                </Card>

                <Card
                    className="cursor-pointer border-red-500/30 hover:border-red-500/60 transition-colors"
                    onClick={() => navigate("/moderation/user-shop")}
                >
                    <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-red-500/10">
                            <Flag className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium">Open Reports</p>
                            <p className="text-xs text-muted-foreground">Needs attention</p>
                        </div>
                        {loading ? (
                            <Skeleton className="h-8 w-12" />
                        ) : (
                            <span className="text-2xl font-bold text-red-500">{openReportsCount}</span>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Row 3: Order Health */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Order Health</CardTitle>
                    <CardDescription>Live order counts by status</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex gap-3">
                            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-9 w-32" />)}
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-3">
                            {Object.entries(orderHealth).map(([status, count]) => {
                                const colors = ORDER_HEALTH_COLORS[status] ?? { bg: "bg-gray-500/10", text: "text-gray-500", dot: "bg-gray-500" };
                                return (
                                    <div
                                        key={status}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text}`}
                                        style={{ borderColor: 'currentColor', borderWidth: '1px', opacity: 0.9 }}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                                        {status}: {count}
                                    </div>
                                );
                            })}
                            {Object.keys(orderHealth).length === 0 && (
                                <p className="text-sm text-muted-foreground">No active order data</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Row 4: System Status */}
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
                </CardContent>
            </Card>

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
                                                    <div className="flex items-center gap-1.5 ">
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
                                    )
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
