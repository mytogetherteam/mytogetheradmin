import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { userService } from "@/services/userService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ArrowLeft,
    User,
    ShoppingBag,
    Activity,
    Mail,
    Phone,
    Calendar,
    Shield,
    CheckCircle2,
    XCircle,
    Smartphone,
    Search,
    Clock,
    Store
} from "lucide-react";
import { toast } from "sonner";
import { DataTablePagination } from "@/components/DataTablePagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import type {
    UserDetail as UserDetailType,
    OrderHistoryItem,
    ActivityHistoryItem
} from "@/services/userService";

export default function UserDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<UserDetailType | null>(null);
    const [loading, setLoading] = useState(true);

    // Orders History State
    const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [ordersPage, setOrdersPage] = useState(1);
    const [ordersTotalPages, setOrdersTotalPages] = useState(1);
    const [ordersTotalItems, setOrdersTotalItems] = useState(0);

    // Activity Log State
    const [activities, setActivities] = useState<ActivityHistoryItem[]>([]);
    const [activitiesLoading, setActivitiesLoading] = useState(false);
    const [activitiesPage, setActivitiesPage] = useState(1);
    const [activitiesTotalPages, setActivitiesTotalPages] = useState(1);
    const [activitiesTotalItems, setActivitiesTotalItems] = useState(0);

    const pageSize = 10;

    const fetchUser = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const data = await userService.getUserById(id);
            setUser(data);
        } catch (error) {
            console.error("Failed to load user detail", error);
            toast.error("Failed to load user details");
        } finally {
            setLoading(false);
        }
    }, [id]);

    const fetchOrders = useCallback(async () => {
        if (!id) return;
        setOrdersLoading(true);
        try {
            const data = await userService.getUserOrders(id, ordersPage - 1, pageSize);
            setOrders(data.content || []);
            setOrdersTotalPages(data.totalPages || 1);
            setOrdersTotalItems(data.totalElements || 0);
        } catch (error) {
            console.error("Failed to load user orders", error);
            toast.error("Failed to load order history");
        } finally {
            setOrdersLoading(false);
        }
    }, [id, ordersPage]);

    const fetchActivity = useCallback(async () => {
        if (!id) return;
        setActivitiesLoading(true);
        try {
            const data = await userService.getUserActivity(id, activitiesPage - 1, pageSize);
            setActivities(data.content || []);
            setActivitiesTotalPages(data.totalPages || 1);
            setActivitiesTotalItems(data.totalElements || 0);
        } catch (error) {
            console.error("Failed to load user activity", error);
            toast.error("Failed to load activity log");
        } finally {
            setActivitiesLoading(false);
        }
    }, [id, activitiesPage]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    if (loading) {
        return (
            <div className="container mx-auto py-10 space-y-6 max-w-7xl">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-64 col-span-1" />
                    <Skeleton className="h-64 col-span-2" />
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="container mx-auto py-20 text-center">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                <h2 className="text-2xl font-bold">User Not Found</h2>
                <Button variant="outline" className="mt-4" onClick={() => navigate("/users/manage")}>
                    Back to Users
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 max-w-7xl space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/users/manage")} className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.fullName} className="h-12 w-12 rounded-full object-cover" />
                        ) : (
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                                {user.fullName?.[0] || user.username?.[0] || "U"}
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{user.fullName || user.username}</h1>
                            <div className="flex items-center gap-2">
                                <p className="text-sm text-muted-foreground">ID: {user.id}</p>
                                {user.username && (
                                    <p className="text-sm text-muted-foreground font-mono">@{user.username}</p>
                                )}
                                <Badge variant={user.active ? "default" : "secondary"} className="h-5 py-0">
                                    {user.active ? "Active" : "Inactive"}
                                </Badge>
                                <Badge variant="outline" className="h-5 py-0">{user.role}</Badge>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="profile" className="gap-2">
                        <User className="h-4 w-4" /> Profile
                    </TabsTrigger>
                    <TabsTrigger value="orders" className="gap-2" onClick={() => fetchOrders()}>
                        <ShoppingBag className="h-4 w-4" /> Order History
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="gap-2" onClick={() => fetchActivity()}>
                        <Activity className="h-4 w-4" /> Activity Log
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-6">
                    {/* Row 1: Contact + Preferences */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Contact Info */}
                        <Card className="shadow-sm border-muted/60">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    Contact Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Mail className="h-4 w-4 mt-0.5 text-primary" />
                                    <div>
                                        <p className="text-xs font-bold uppercase text-muted-foreground">Email</p>
                                        <p className="text-sm font-medium break-all">{user.email || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Phone className="h-4 w-4 mt-0.5 text-primary" />
                                    <div>
                                        <p className="text-xs font-bold uppercase text-muted-foreground">Phone</p>
                                        <p className="text-sm font-medium">{user.phone || user.userPhone || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Calendar className="h-4 w-4 mt-0.5 text-primary" />
                                    <div>
                                        <p className="text-xs font-bold uppercase text-muted-foreground">Created At</p>
                                        <p className="text-sm font-medium">
                                            {user.createdAt ? new Date(user.createdAt).toLocaleString() : "N/A"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Clock className="h-4 w-4 mt-0.5 text-primary" />
                                    <div>
                                        <p className="text-xs font-bold uppercase text-muted-foreground">Updated At</p>
                                        <p className="text-sm font-medium">
                                            {user.updatedAt ? new Date(user.updatedAt).toLocaleString() : "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Preferences */}
                        <Card className="md:col-span-2 shadow-sm border-muted/60">
                            <CardHeader>
                                <CardTitle className="text-base">User Preferences</CardTitle>
                                <CardDescription>Dietary and spicy level preferences</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="p-4 rounded-lg bg-muted/30 border border-muted/40">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Vegetarian</p>
                                        <div className="flex items-center gap-2">
                                            {user.isVegetarian ? (
                                                <Badge className="bg-green-500/10 text-green-600 border-green-500/20 gap-1.5 hover:bg-green-500/10">
                                                    <CheckCircle2 className="h-3.5 w-3.5" /> Yes
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-muted-foreground gap-1.5 hover:bg-transparent">
                                                    <XCircle className="h-3.5 w-3.5" /> No
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-lg bg-muted/30 border border-muted/40">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Halal</p>
                                        <div className="flex items-center gap-2">
                                            {user.isHalal ? (
                                                <Badge className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 gap-1.5 hover:bg-indigo-500/10">
                                                    <Shield className="h-3.5 w-3.5" /> Yes
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-muted-foreground gap-1.5 hover:bg-transparent">
                                                    <XCircle className="h-3.5 w-3.5" /> No
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-lg bg-muted/30 border border-muted/40 text-center sm:text-left">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Price Pref</p>
                                        {user.pricePreference
                                            ? <Badge variant="secondary" className="font-bold">{user.pricePreference}</Badge>
                                            : <span className="text-sm text-muted-foreground">N/A</span>
                                        }
                                    </div>
                                    <div className="p-4 rounded-lg bg-muted/30 border border-muted/40 text-center sm:text-left">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Spicy Pref</p>
                                        {user.spicinessPreference
                                            ? <Badge variant="secondary" className="font-bold bg-orange-100 text-orange-700 hover:bg-orange-100">{user.spicinessPreference}</Badge>
                                            : <span className="text-sm text-muted-foreground">N/A</span>
                                        }
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Row 2: Account Info + Connected Social Accounts */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Account Info */}
                        <Card className="shadow-sm border-muted/60">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <User className="h-4 w-4 text-primary" /> Account Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-xs font-bold uppercase text-muted-foreground">Username</p>
                                    <p className="text-sm font-medium font-mono">@{user.username || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase text-muted-foreground">Onboarding</p>
                                    <div className="mt-1">
                                        {user.hasCompletedOnboarding ? (
                                            <Badge className="bg-green-500/10 text-green-600 border-green-500/20 gap-1.5 hover:bg-green-500/10 text-xs">
                                                <CheckCircle2 className="h-3 w-3" /> Completed
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-muted-foreground gap-1.5 text-xs">
                                                <XCircle className="h-3 w-3" /> Incomplete
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase text-muted-foreground">Terms Agreed At</p>
                                    <p className="text-sm font-medium">
                                        {user.agreedToTermsAt ? new Date(user.agreedToTermsAt).toLocaleString() : "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase text-muted-foreground">Privacy Policy Version</p>
                                    <p className="text-sm font-medium">{user.privacyPolicyVersion || "N/A"}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Connected Social Accounts */}
                        <Card className="md:col-span-2 shadow-sm border-muted/60">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Smartphone className="h-4 w-4 text-primary" /> Connected Social Accounts
                                </CardTitle>
                                <CardDescription>OAuth providers linked to this account</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {[
                                        { label: "Google", key: "hasGoogle", color: "text-red-500", bg: "bg-red-50 border-red-100 dark:bg-red-950/30 dark:border-red-900/40" },
                                        { label: "Facebook", key: "hasFacebook", color: "text-blue-600", bg: "bg-blue-50 border-blue-100 dark:bg-blue-950/30 dark:border-blue-900/40" },
                                        { label: "Line", key: "hasLine", color: "text-green-600", bg: "bg-green-50 border-green-100 dark:bg-green-950/30 dark:border-green-900/40" },
                                        { label: "TikTok", key: "hasTiktok", color: "text-foreground", bg: "bg-muted/60 border-muted" },
                                    ].map(({ label, key, color, bg }) => {
                                        const isLinked = !!user[key as keyof UserDetailType];
                                        return (
                                            <div
                                                key={key}
                                                className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-opacity ${isLinked ? bg : "bg-muted/20 border-muted/30 opacity-40"}`}
                                            >
                                                <p className={`text-sm font-bold ${isLinked ? color : "text-muted-foreground"}`}>{label}</p>
                                                {isLinked ? (
                                                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20 gap-1 text-[10px] hover:bg-green-500/10">
                                                        <CheckCircle2 className="h-3 w-3" /> Linked
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-muted-foreground gap-1 text-[10px]">
                                                        <XCircle className="h-3 w-3" /> Not linked
                                                    </Badge>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="orders">
                    <Card className="shadow-sm border-muted/60">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-lg flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ShoppingBag className="h-5 w-5 text-primary" />
                                    Order History
                                </div>
                                <Badge variant="secondary" className="rounded-full px-3">{ordersTotalItems} Orders</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30">
                                            <TableHead className="py-4">Order ID</TableHead>
                                            <TableHead>Shop</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Items</TableHead>
                                            <TableHead>Total Amount</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {ordersLoading ? (
                                            [...Array(3)].map((_, i) => (
                                                <TableRow key={i}>
                                                    {[...Array(7)].map((__, j) => (
                                                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                                    ))}
                                                </TableRow>
                                            ))
                                        ) : orders.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                                    No orders found for this user.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            orders.map((order) => (
                                                <TableRow key={order.id} className="hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                                                    <TableCell className="font-mono text-xs font-bold">#{order.id}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Store className="h-3.5 w-3.5 text-muted-foreground" />
                                                            <span className="font-medium">{order.shopName}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="font-normal border-muted-foreground/20">
                                                            {order.statusLabel || order.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm">{order.itemCount} items</TableCell>
                                                    <TableCell className="font-bold text-primary italic">
                                                        {order.displayTotalAmount || `${order.totalAmount} MMK`}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—"}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                            View
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="p-4 border-t">
                                <DataTablePagination
                                    currentPage={ordersPage}
                                    totalPages={ordersTotalPages}
                                    totalItems={ordersTotalItems}
                                    pageSize={pageSize}
                                    onPageChange={setOrdersPage}
                                    onPageSizeChange={() => { }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="activity">
                    <Card className="shadow-sm border-muted/60">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-lg flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-primary" />
                                    Activity Log
                                </div>
                                <Badge variant="secondary" className="rounded-full px-3">{activitiesTotalItems} Activities</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30">
                                            <TableHead className="py-4">Type</TableHead>
                                            <TableHead>Activity Detail</TableHead>
                                            <TableHead>Device / OS</TableHead>
                                            <TableHead>Time</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {activitiesLoading ? (
                                            [...Array(3)].map((_, i) => (
                                                <TableRow key={i}>
                                                    {[...Array(4)].map((__, j) => (
                                                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                                    ))}
                                                </TableRow>
                                            ))
                                        ) : activities.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                                    No activity recorded for this user.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            activities.map((activity) => (
                                                <TableRow key={activity.id} className="hover:bg-muted/10 transition-colors">
                                                    <TableCell>
                                                        <Badge variant="outline" className="flex items-center gap-1.5 w-fit whitespace-nowrap bg-muted/40 font-mono text-[10px] uppercase font-bold">
                                                            {activity.activityType === "SEARCH_QUERY" && <Search className="h-3 w-3" />}
                                                            {activity.activityType === "VIEW_SHOP" && <Store className="h-3 w-3" />}
                                                            {activity.activityType.replace("_", " ")}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-0.5 max-w-[300px]">
                                                            {activity.searchQuery ? (
                                                                <p className="text-sm font-medium italic text-primary">"{activity.searchQuery}"</p>
                                                            ) : (
                                                                <p className="text-sm font-medium">{activity.targetName || `Target ID: ${activity.targetId}`}</p>
                                                            )}
                                                            {activity.metadata && <p className="text-[10px] text-muted-foreground truncate">{activity.metadata}</p>}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                                                            <span className="text-xs">{activity.osName || "Unknown"}</span>
                                                            {activity.deviceId && <span className="text-[10px] text-muted-foreground opacity-50 font-mono">({activity.deviceId.substring(0, 8)}...)</span>}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-foreground">{new Date(activity.createdAt).toLocaleDateString()}</span>
                                                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="p-4 border-t">
                                <DataTablePagination
                                    currentPage={activitiesPage}
                                    totalPages={activitiesTotalPages}
                                    totalItems={activitiesTotalItems}
                                    pageSize={pageSize}
                                    onPageChange={setActivitiesPage}
                                    onPageSizeChange={() => { }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
