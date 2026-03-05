import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";
import { analyticsService, RevenueData, SessionData, LocationData, PopularShop, CategoryStats } from "@/services/analyticsService";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Users, MapPin, BarChart2 } from "lucide-react";

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#3b82f6", "#ec4899", "#14b8a6"];

function LoadingSkeleton() {
    return <Skeleton className="w-full h-[300px]" />;
}

export default function AnalyticalDashboard() {
    const [revenue, setRevenue] = useState<RevenueData[]>([]);
    const [sessions, setSessions] = useState<SessionData[]>([]);
    const [locations, setLocations] = useState<LocationData[]>([]);
    const [popularShops, setPopularShops] = useState<PopularShop[]>([]);
    const [categories, setCategories] = useState<CategoryStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const [rev, sess, locs, shops, cats] = await Promise.all([
                analyticsService.getRevenueAnalytics().catch(() => []),
                analyticsService.getSessionAnalytics().catch(() => []),
                analyticsService.getLocationAnalytics().catch(() => []),
                analyticsService.getPopularShops().catch(() => []),
                analyticsService.getCategoryStats().catch(() => []),
            ]);
            setRevenue(rev);
            setSessions(sess);
            setLocations(locs);
            setPopularShops(shops);
            setCategories(cats);
            setLoading(false);
        }
        load();
    }, []);

    const revenueChartData = revenue.map((r) => ({
        date: new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        Revenue: r.revenue,
    }));

    const sessionChartData = sessions.map((s) => ({
        date: new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        DAU: s.dau,
        "Avg Session (min)": Math.round(s.avgSessionLength / 60),
    }));

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <BarChart2 className="h-6 w-6 text-primary" />
                <h1 className="text-lg font-semibold md:text-2xl">Analytics</h1>
            </div>

            <Tabs defaultValue="revenue">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="revenue" className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" /> Revenue
                    </TabsTrigger>
                    <TabsTrigger value="users" className="flex items-center gap-2">
                        <Users className="h-4 w-4" /> Users & Sessions
                    </TabsTrigger>
                    <TabsTrigger value="shops" className="flex items-center gap-2">
                        <BarChart2 className="h-4 w-4" /> Shops & Categories
                    </TabsTrigger>
                    <TabsTrigger value="locations" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Locations
                    </TabsTrigger>
                </TabsList>

                {/* Revenue Tab */}
                <TabsContent value="revenue" className="mt-6 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Platform Revenue</CardTitle>
                            <CardDescription>Revenue generated across the platform over time.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? <LoadingSkeleton /> : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={revenueChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="date" fontSize={12} tickLine={false} />
                                        <YAxis fontSize={12} tickLine={false} tickFormatter={(v) => `$${v}`} />
                                        <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
                                        <Area type="monotone" dataKey="Revenue" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Users & Sessions Tab */}
                <TabsContent value="users" className="mt-6 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Daily Active Users</CardTitle>
                                <CardDescription>DAU trend over time.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? <LoadingSkeleton /> : (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <LineChart data={sessionChartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="date" fontSize={12} tickLine={false} />
                                            <YAxis fontSize={12} tickLine={false} />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="DAU" stroke="#6366f1" strokeWidth={2} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Avg. Session Length</CardTitle>
                                <CardDescription>Average session duration in minutes.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? <LoadingSkeleton /> : (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart data={sessionChartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="date" fontSize={12} tickLine={false} />
                                            <YAxis fontSize={12} tickLine={false} />
                                            <Tooltip />
                                            <Bar dataKey="Avg Session (min)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Shops & Categories Tab */}
                <TabsContent value="shops" className="mt-6 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Top Shops by Revenue</CardTitle>
                                <CardDescription>Most revenue-generating shops.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? <LoadingSkeleton /> : (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart data={popularShops.slice(0, 8)} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis type="number" fontSize={12} tickLine={false} tickFormatter={(v) => `$${v}`} />
                                            <YAxis type="category" dataKey="name" fontSize={11} tickLine={false} width={100} />
                                            <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
                                            <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Category Performance</CardTitle>
                                <CardDescription>View counts by category.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? <LoadingSkeleton /> : (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <PieChart>
                                            <Pie
                                                data={categories.slice(0, 6)}
                                                dataKey="viewCount"
                                                nameKey="name"
                                                cx="50%" cy="50%"
                                                outerRadius={100}
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {categories.slice(0, 6).map((_, index) => (
                                                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Legend />
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Locations Tab */}
                <TabsContent value="locations" className="mt-6 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Activity by District</CardTitle>
                            <CardDescription>User activity distribution across districts.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? <LoadingSkeleton /> : (
                                <ResponsiveContainer width="100%" height={320}>
                                    <BarChart data={locations} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis type="number" fontSize={12} tickLine={false} />
                                        <YAxis type="category" dataKey="district" fontSize={11} tickLine={false} width={120} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
