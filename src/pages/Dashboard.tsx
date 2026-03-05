import { useEffect, useState } from "react";
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
import { analyticsService, DashboardStats, RevenueData, PopularShop } from "@/services/analyticsService";
import { DollarSign, Users, ShoppingCart, Activity, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function StatCard({
    title,
    value,
    change,
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
    const isPositive = (change ?? 0) >= 0;
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
                    <>
                        <div className="text-2xl font-bold">
                            {prefix}{typeof value === "number" ? value.toLocaleString() : value}
                        </div>
                        {change !== undefined && (
                            <p className={`text-xs flex items-center gap-1 mt-1 ${isPositive ? "text-green-500" : "text-red-500"}`}>
                                {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                {isPositive ? "+" : ""}{change}% from last month
                            </p>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [revenue, setRevenue] = useState<RevenueData[]>([]);
    const [popularShops, setPopularShops] = useState<PopularShop[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const [statsData, revenueData, shopsData] = await Promise.all([
                    analyticsService.getDashboardStats().catch(() => null),
                    analyticsService.getRevenueAnalytics().catch(() => []),
                    analyticsService.getPopularShops().catch(() => []),
                ]);
                setStats(statsData);
                setRevenue(revenueData);
                setPopularShops(shopsData);
            } catch (err) {
                setError("Failed to load dashboard data.");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const chartData = revenue.length > 0
        ? revenue.map((r) => ({ name: new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }), total: r.revenue }))
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

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <StatCard
                    title="Revenue Today"
                    value={stats?.totalRevenueToday ?? 0}
                    prefix="$"
                    icon={DollarSign}
                    loading={loading}
                />
                <StatCard
                    title="Orders Today"
                    value={stats?.totalOrdersToday ?? 0}
                    prefix="+"
                    icon={ShoppingCart}
                    loading={loading}
                />
                <StatCard
                    title="Total Users"
                    value={stats?.totalUsers ?? 0}
                    prefix="+"
                    icon={Users}
                    loading={loading}
                />
                <StatCard
                    title="Total Shops"
                    value={stats?.totalShops ?? 0}
                    prefix="+"
                    icon={Activity}
                    loading={loading}
                />
                <StatCard
                    title="Total Reviews"
                    value={stats?.totalReviews ?? 0}
                    prefix="+"
                    icon={TrendingUp}
                    loading={loading}
                />
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Revenue Overview</CardTitle>
                        <CardDescription>Platform revenue over time.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
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
                        <CardDescription>Top performing shops by revenue.</CardDescription>
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
                                {popularShops.slice(0, 5).map((shop, i) => (
                                    <div key={shop.id} className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{shop.name}</p>
                                            <p className="text-xs text-muted-foreground">{shop.orderCount} orders</p>
                                        </div>
                                        <div className="font-medium text-sm">${shop.revenue.toLocaleString()}</div>
                                    </div>
                                ))}
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
