import { useEffect, useState, useCallback } from "react";
import { orderService, Order, OrderStatus } from "@/services/orderService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { SortableTableHead, SortConfig, toggleSort, sortData } from "@/components/SortableTableHead";

const STATUS_COLORS: Record<OrderStatus, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    ACCEPTED: "bg-blue-100 text-blue-800 border-blue-200",
    PREPARING: "bg-orange-100 text-orange-800 border-orange-200",
    READY: "bg-purple-100 text-purple-800 border-purple-200",
    DELIVERING: "bg-indigo-100 text-indigo-800 border-indigo-200",
    DELIVERED: "bg-green-100 text-green-800 border-green-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
};

const ACTIVE_STATUSES: OrderStatus[] = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'DELIVERING'];

function getElapsedTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

function isPendingSLA(order: Order): boolean {
    if (order.status !== 'PENDING') return false;
    const elapsed = Date.now() - new Date(order.createdAt).getTime();
    return elapsed > 15 * 60 * 1000; // 15 minutes
}

export default function OrderBoard() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

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
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
        try {
            await orderService.updateOrderStatus(orderId, newStatus);
            setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
            toast.success(`Order status updated to ${newStatus}`);
        } catch {
            toast.error("Failed to update order status");
        }
    };

    const byStatus = (status: OrderStatus) => orders.filter((o) => o.status === status);
    const handleSort = (key: string) => setSortConfig(toggleSort(sortConfig, key));
    const sortedOrders = sortData(orders, sortConfig);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ClipboardList className="h-6 w-6 text-primary" />
                    <div>
                        <h1 className="text-lg font-semibold md:text-2xl">Order Board — Live Monitor</h1>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Auto-refresh every 30s · Last: {lastRefresh.toLocaleTimeString()}
                        </p>
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

            {/* Active Orders Table */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Active Orders</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <SortableTableHead label="Order ID" sortKey="id" sortConfig={sortConfig} onSort={handleSort} />
                                <SortableTableHead label="Customer" sortKey="customerName" sortConfig={sortConfig} onSort={handleSort} />
                                <SortableTableHead label="Shop" sortKey="shopName" sortConfig={sortConfig} onSort={handleSort} />
                                <SortableTableHead label="Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} />
                                <SortableTableHead label="Time" sortKey="createdAt" sortConfig={sortConfig} onSort={handleSort} />
                                <SortableTableHead label="Total" sortKey="totalAmount" sortConfig={sortConfig} onSort={handleSort} />
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        {[...Array(7)].map((__, j) => (
                                            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : sortedOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                        <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                        No active orders
                                    </TableCell>
                                </TableRow>
                            ) : sortedOrders.map((order) => (
                                <TableRow
                                    key={order.id}
                                    className={isPendingSLA(order) ? "border-l-4 border-l-red-500 bg-red-500/5" : ""}
                                >
                                    <TableCell>
                                        <button
                                            className="text-primary underline-offset-4 hover:underline font-mono text-xs"
                                            onClick={() => setSelectedOrder(order)}
                                        >
                                            #{order.id.slice(-8).toUpperCase()}
                                        </button>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {order.customerName} <span className="text-muted-foreground text-xs">(ID: {order.customerId.slice(-6)})</span>
                                    </TableCell>
                                    <TableCell className="text-sm">{order.shopName}</TableCell>
                                    <TableCell>
                                        <span className={`text-xs px-2 py-1 rounded-full border font-medium ${STATUS_COLORS[order.status]}`}>
                                            {order.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className={`text-xs ${isPendingSLA(order) ? "text-red-500 font-semibold" : "text-muted-foreground"}`}>
                                        {getElapsedTime(order.createdAt)}
                                    </TableCell>
                                    <TableCell className="font-medium text-sm">${order.totalAmount?.toFixed(2)}</TableCell>
                                    <TableCell>
                                        {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                                            <Select
                                                value={order.status}
                                                onValueChange={(val) => handleStatusChange(order.id, val as OrderStatus)}
                                            >
                                                <SelectTrigger className="w-full h-7 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {ACTIVE_STATUSES.map((s) => (
                                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                                    ))}
                                                    <SelectItem value="DELIVERED">DELIVERED</SelectItem>
                                                    <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Order Detail Drawer */}
            <Sheet open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
                <SheetContent>
                    {selectedOrder && (
                        <>
                            <SheetHeader>
                                <SheetTitle>Order #{selectedOrder.id.slice(-8).toUpperCase()}</SheetTitle>
                            </SheetHeader>
                            <div className="mt-6 space-y-4">
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-muted-foreground text-xs">Customer</p>
                                        <p className="font-medium">{selectedOrder.customerName}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">Shop</p>
                                        <p className="font-medium">{selectedOrder.shopName}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">Status</p>
                                        <span className={`text-xs px-2 py-1 rounded-full border font-medium ${STATUS_COLORS[selectedOrder.status]}`}>
                                            {selectedOrder.status}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">Time</p>
                                        <p className="font-medium">{getElapsedTime(selectedOrder.createdAt)}</p>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <p className="text-xs text-muted-foreground mb-2 font-medium">Items</p>
                                    {selectedOrder.items?.map((item, i) => (
                                        <div key={i} className="flex justify-between text-sm py-1">
                                            <span>{item.name} × {item.quantity}</span>
                                            <span>${item.price.toFixed(2)}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between font-semibold text-sm border-t pt-2 mt-2">
                                        <span>Total</span>
                                        <span>${selectedOrder.totalAmount?.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
