import { useEffect, useState, useCallback } from "react";
import { orderService, Order, OrderStatus } from "@/services/orderService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, ClipboardList, Clock, CheckCircle, Truck } from "lucide-react";
import { toast } from "sonner";


const STATUS_COLORS: Record<OrderStatus, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    ACCEPTED: "bg-blue-100 text-blue-800 border-blue-200",
    PREPARING: "bg-orange-100 text-orange-800 border-orange-200",
    READY: "bg-purple-100 text-purple-800 border-purple-200",
    DELIVERING: "bg-indigo-100 text-indigo-800 border-indigo-200",
    DELIVERED: "bg-green-100 text-green-800 border-green-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_FLOW: OrderStatus[] = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'DELIVERING', 'DELIVERED'];

function OrderCard({ order, onStatusChange }: { order: Order; onStatusChange: (id: string, status: OrderStatus) => void }) {
    const currentIndex = STATUS_FLOW.indexOf(order.status);
    const nextStatus = STATUS_FLOW[currentIndex + 1] as OrderStatus | undefined;
    const [updating, setUpdating] = useState(false);

    const handleAdvance = async () => {
        if (!nextStatus) return;
        setUpdating(true);
        try {
            await orderService.updateOrderStatus(order.id, nextStatus);
            onStatusChange(order.id, nextStatus);
            toast.success(`Order #${order.id.slice(-6)} moved to ${nextStatus}`);
        } catch {
            toast.error("Failed to update order status");
        } finally {
            setUpdating(false);
        }
    };

    return (
        <Card className="border-l-4" style={{ borderLeftColor: order.status === 'CANCELLED' ? '#ef4444' : '#6366f1' }}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">Order #{order.id.slice(-8).toUpperCase()}</CardTitle>
                    <span className={`text-xs px-2 py-1 rounded-full border font-medium ${STATUS_COLORS[order.status]}`}>
                        {order.status}
                    </span>
                </div>
                <CardDescription className="text-xs">
                    {order.shopName} · {order.customerName}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="text-xs text-muted-foreground space-y-1">
                    {order.items?.slice(0, 3).map((item, i) => (
                        <div key={i} className="flex justify-between">
                            <span>{item.name} x{item.quantity}</span>
                            <span>${item.price.toFixed(2)}</span>
                        </div>
                    ))}
                    {order.items?.length > 3 && <p className="text-muted-foreground">+{order.items.length - 3} more items</p>}
                </div>
                <div className="flex items-center justify-between pt-1 border-t">
                    <span className="font-semibold text-sm">${order.totalAmount?.toFixed(2)}</span>
                    {nextStatus && order.status !== 'CANCELLED' && (
                        <Button size="sm" variant="outline" onClick={handleAdvance} disabled={updating}>
                            {updating ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : null}
                            → {nextStatus}
                        </Button>
                    )}
                </div>
                <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleTimeString()}</p>
            </CardContent>
        </Card>
    );
}

const ACTIVE_STATUSES: OrderStatus[] = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'DELIVERING'];

export default function OrderBoard() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const fetchOrders = useCallback(async () => {
        try {
            const data = await orderService.getActiveOrders();
            setOrders(data);
            setLastRefresh(new Date());
        } catch {
            toast.error("Failed to fetch active orders");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 30000); // auto-refresh every 30s
        return () => clearInterval(interval);
    }, [fetchOrders]);

    const handleStatusChange = (id: string, status: OrderStatus) => {
        setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
    };

    const byStatus = (status: OrderStatus) => orders.filter((o) => o.status === status);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ClipboardList className="h-6 w-6 text-primary" />
                    <div>
                        <h1 className="text-lg font-semibold md:text-2xl">Order Board</h1>
                        <p className="text-xs text-muted-foreground">Last refreshed: {lastRefresh.toLocaleTimeString()}</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Summary badges */}
            <div className="flex flex-wrap gap-2">
                {ACTIVE_STATUSES.map((s) => (
                    <Badge key={s} variant="secondary" className="gap-1">
                        {s}: {loading ? '…' : byStatus(s).length}
                    </Badge>
                ))}
            </div>

            <Tabs defaultValue="PENDING">
                <TabsList>
                    {ACTIVE_STATUSES.map((s) => (
                        <TabsTrigger key={s} value={s} className="gap-1 text-xs">
                            {s === 'PENDING' && <Clock className="h-3 w-3" />}
                            {s === 'DELIVERING' && <Truck className="h-3 w-3" />}
                            {s === 'DELIVERED' && <CheckCircle className="h-3 w-3" />}
                            {s}
                        </TabsTrigger>
                    ))}
                </TabsList>
                {ACTIVE_STATUSES.map((tabStatus) => (
                    <TabsContent key={tabStatus} value={tabStatus} className="mt-4">
                        {loading ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48" />)}
                            </div>
                        ) : byStatus(tabStatus).length === 0 ? (
                            <div className="text-center py-16 text-muted-foreground">
                                <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                <p>No {tabStatus.toLowerCase()} orders</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {byStatus(tabStatus).map((order) => (
                                    <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
