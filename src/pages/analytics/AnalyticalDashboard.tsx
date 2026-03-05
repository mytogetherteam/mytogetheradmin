import React, { useEffect, useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";
import { analyticsService, RevenueData, SessionData, SessionSummary, LocationData, PopularShop, CategoryStats, FeedSectionStats, DeviceStats } from "@/services/analyticsService";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { TrendingUp, Users, MapPin, BarChart2, Smartphone, Activity } from "lucide-react";

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#3b82f6", "#ec4899", "#14b8a6"];
const FEED_TYPES = ["FOR_YOU", "TRENDING_NEARBY", "HOT_DEALS", "NEW_SHOPS", "POPULAR_DISHES"];

function LoadingSkeleton() {
    return <Skeleton className="w-full h-[300px]" />;
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

export default function AnalyticalDashboard() {
    const defaults = getDefaultDates();
    const [startDate, setStartDate] = useState(defaults.start);
    const [endDate, setEndDate] = useState(defaults.end);

    const [revenue, setRevenue] = useState<RevenueData[]>([]);
    const [sessions, setSessions] = useState<SessionData[]>([]);
    const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
    const [locations, setLocations] = useState<LocationData[]>([]);
    const [popularShops, setPopularShops] = useState<PopularShop[]>([]);
    const [categories, setCategories] = useState<CategoryStats[]>([]);
    const [feedSections, setFeedSections] = useState<FeedSectionStats[]>([]);
    const [deviceStats, setDeviceStats] = useState<DeviceStats[]>([]);
    const [overallCtr, setOverallCtr] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        const [rev, sess, locs, shops, cats, devices, feedPerf] = await Promise.all([
            analyticsService.getRevenueAnalytics(startDate, endDate).catch(() => []),
            analyticsService.getSessionAnalytics().catch(() => []),
            analyticsService.getLocationAnalytics().catch(() => []),
            analyticsService.getPopularShops().catch(() => []),
            analyticsService.getCategoryStats().catch(() => []),
            analyticsService.getDeviceStats().catch(() => []),
            analyticsService.getFeedPerformance().catch(() => null),
        ]);

        // Load feed section stats
        const sections = await Promise.all(
            FEED_TYPES.map((t) => analyticsService.getFeedSectionStats(t).catch(() => ({ type: t, impressions: 0, clicks: 0, ctr: 0 })))
        );

        setRevenue(Array.isArray(rev) ? rev : []);
        if (Array.isArray(sess)) {
            setSessions(sess);
            setSessionSummary(null);
        } else if (sess && typeof sess === 'object') {
            setSessions([]);
            setSessionSummary(sess as SessionSummary);
        } else {
            setSessions([]);
            setSessionSummary(null);
        }
        setLocations(Array.isArray(locs) ? locs : []);
        setPopularShops(Array.isArray(shops) ? shops : []);
        setCategories(Array.isArray(cats) ? cats : []);
        setDeviceStats(Array.isArray(devices) ? devices : []);
        setOverallCtr(feedPerf?.overallCtr ?? null);
        setFeedSections(Array.isArray(sections) ? sections : []);
        setLoading(false);
    }, [startDate, endDate]);

    useEffect(() => { load(); }, [load]);

    const revenueChartData = Array.isArray(revenue) ? revenue.map((r) => ({
        date: r.date ? new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "N/A",
        Revenue: r.amount ?? r.revenue ?? 0,
    })) : [];

    const sessionChartData = Array.isArray(sessions) ? sessions.map((s) => ({
        date: s.date ? new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "N/A",
        DAU: s.dau ?? 0,
        "Avg Session (min)": Math.round((s.avgSessionLength ?? 0) / 60),
    })) : [];

    const popularShopsChartData = Array.isArray(popularShops) ? popularShops.map((shop) => ({
        ...shop,
        name: shop.name || shop.shopName || "Unknown",
        revenue: shop.revenue ?? shop.totalRevenue ?? 0,
    })) : [];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <BarChart2 className="h-6 w-6 text-primary" />
                    <h1 className="text-lg font-semibold md:text-2xl">Analytics</h1>
                </div>

                {/* Global Date Range Picker */}
                <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-36 h-8 text-xs"
                    />
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-36 h-8 text-xs"
                    />
                    <Button size="sm" variant="outline" onClick={load}>Apply</Button>
                </div>
            </div>

            <Tabs defaultValue="revenue">
                <TabsList className="grid w-full grid-cols-5">
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
                    <TabsTrigger value="feed" className="flex items-center gap-2">
                        <Activity className="h-4 w-4" /> Feed Performance
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
                    {sessionSummary && (
                        <div className="grid gap-4 md:grid-cols-4">
                            <Card>
                                <CardContent className="p-4">
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Total Sessions</p>
                                    <p className="text-xl font-bold">{sessionSummary.totalSessions.toLocaleString()}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4">
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Active Now</p>
                                    <p className="text-xl font-bold text-primary">{sessionSummary.activeSessions.toLocaleString()}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4">
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Avg. Duration</p>
                                    <p className="text-xl font-bold">{Math.round(sessionSummary.averageDurationSeconds / 60)} min</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4">
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Actions/Session</p>
                                    <p className="text-xl font-bold">{sessionSummary.averageActivitiesPerSession.toFixed(1)}</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}
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

                    {/* Device Chart - iOS vs Android */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Smartphone className="h-4 w-4" /> iOS vs Android
                            </CardTitle>
                            <CardDescription>Device platform distribution.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? <LoadingSkeleton /> : deviceStats.length > 0 ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={deviceStats}
                                            dataKey="count"
                                            nameKey="platform"
                                            cx="50%" cy="50%"
                                            outerRadius={100}
                                            label={({ platform, percent }) => `${platform} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {Array.isArray(deviceStats) && deviceStats.map((_, index) => (
                                                <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Legend />
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                                    No device data available
                                </div>
                            )}
                        </CardContent>
                    </Card>
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
                                        <BarChart data={popularShopsChartData.slice(0, 8)} layout="vertical">
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
                                                {Array.isArray(categories) && categories.slice(0, 6).map((_, index) => (
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

                {/* Feed Performance Tab */}
                <TabsContent value="feed" className="mt-6 space-y-4">
                    {overallCtr !== null && (
                        <Card>
                            <CardContent className="flex items-center gap-4 p-4">
                                <Activity className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="text-sm font-medium">Overall Feed CTR</p>
                                    <p className="text-2xl font-bold">{(overallCtr * 100).toFixed(2)}%</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Per-Section Stats</CardTitle>
                            <CardDescription>Performance breakdown by feed algorithm type.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Section</TableHead>
                                        <TableHead>Impressions</TableHead>
                                        <TableHead>Clicks</TableHead>
                                        <TableHead>CTR</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        [...Array(5)].map((_, i) => (
                                            <TableRow key={i}>
                                                {[...Array(4)].map((__, j) => (
                                                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : React.Children.toArray(feedSections.map((section, index) => {
                                        const typeStr = section.type || section.sectionType || `UNKNOWN_${index}`;
                                        const impressions = section.impressions ?? section.totalViews ?? 0;
                                        const clicks = section.clicks ?? section.totalClicks ?? 0;
                                        const ctr = section.ctr ?? section.clickThroughRate ?? 0;

                                        return (
                                            <TableRow key={typeStr + '_' + index}>
                                                <TableCell className="font-medium text-sm">{typeof typeStr === 'string' ? typeStr.replace(/_/g, " ") : typeStr}</TableCell>
                                                <TableCell className="text-sm">{impressions.toLocaleString()}</TableCell>
                                                <TableCell className="text-sm">{clicks.toLocaleString()}</TableCell>
                                                <TableCell className="text-sm font-medium">{typeof ctr === 'number' ? (ctr * 100).toFixed(2) : '0.00'}%</TableCell>
                                            </TableRow>
                                        )
                                    }))
                                    }
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
