import { useEffect, useState, useCallback } from "react";
import { orderService, Order, OrderStatus, OrderFilters } from "@/services/orderService";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { History, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";


const STATUS_COLORS: Record<OrderStatus, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    ACCEPTED: "bg-blue-100 text-blue-800",
    PREPARING: "bg-orange-100 text-orange-800",
    READY: "bg-purple-100 text-purple-800",
    DELIVERING: "bg-indigo-100 text-indigo-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
};

export default function OrderHistory() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState<OrderFilters>({ page: 0, size: 20 });

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const data = await orderService.getOrders(filters);
            setOrders(data.content);
            setTotalPages(data.totalPages);
        } catch {
            toast.error("Failed to load order history");
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const currentPage = filters.page ?? 0;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <History className="h-6 w-6 text-primary" />
                <h1 className="text-lg font-semibold md:text-2xl">Order History</h1>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-4">
                    <div className="grid gap-3 md:grid-cols-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Start Date</label>
                            <Input
                                type="date"
                                value={filters.startDate ?? ""}
                                onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value, page: 0 }))}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">End Date</label>
                            <Input
                                type="date"
                                value={filters.endDate ?? ""}
                                onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value, page: 0 }))}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
                            <Select
                                value={filters.status ?? "ALL"}
                                onValueChange={(v) => setFilters((f) => ({ ...f, status: v === "ALL" ? undefined : v as OrderStatus, page: 0 }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Statuses</SelectItem>
                                    {(['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'DELIVERING', 'DELIVERED', 'CANCELLED'] as OrderStatus[]).map((s) => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end">
                            <Button className="w-full" onClick={fetchOrders}>
                                <Search className="h-4 w-4 mr-2" /> Search
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Orders</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Shop</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [...Array(8)].map((_, i) => (
                                    <TableRow key={i}>
                                        {[...Array(6)].map((__, j) => (
                                            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                        No orders found for the selected filters.
                                    </TableCell>
                                </TableRow>
                            ) : orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-mono text-xs">#{order.id.slice(-8).toUpperCase()}</TableCell>
                                    <TableCell>{order.shopName}</TableCell>
                                    <TableCell>{order.customerName}</TableCell>
                                    <TableCell>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>
                                            {order.status}
                                        </span>
                                    </TableCell>
                                    <TableCell>${order.totalAmount?.toFixed(2)}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {new Date(order.createdAt).toLocaleDateString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Page {currentPage + 1} of {totalPages}</p>
                <div className="flex gap-2">
                    <Button
                        variant="outline" size="sm"
                        disabled={currentPage === 0 || loading}
                        onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 0) - 1 }))}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline" size="sm"
                        disabled={currentPage >= totalPages - 1 || loading}
                        onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 0) + 1 }))}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
