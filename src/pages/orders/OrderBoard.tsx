import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
    Skeleton
} from "@/components/ui/skeleton";
import { RefreshCw, ClipboardList, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { SortableTableHead } from "@/components/SortableTableHead";
import { SortConfig, toggleSort, sortData } from "@/lib/sort-utils";
import { DataTablePagination } from "@/components/DataTablePagination";
import { useOrderBoardWebSocket } from "@/hooks/useOrderBoardWebSocket";

const STATUS_COLORS: Record<OrderStatus, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
    ACCEPTED: "bg-cyan-100 text-cyan-800 border-cyan-200",
    AWAITING_APPROVAL: "bg-amber-100 text-amber-800 border-amber-200",
    PAYMENT_SLIP_REQUESTED: "bg-pink-100 text-pink-800 border-pink-200",
    PAYMENT_UPLOADED: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
    PAYMENT_VERIFIED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    PREPARING: "bg-orange-100 text-orange-800 border-orange-200",
    READY: "bg-purple-100 text-purple-800 border-purple-200",
    ON_THE_WAY: "bg-indigo-100 text-indigo-800 border-indigo-200",
    DELIVERING: "bg-indigo-100 text-indigo-800 border-indigo-200",
    DELIVERED: "bg-green-100 text-green-800 border-green-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
    INTERNAL_TRACKING: "bg-gray-100 text-gray-800 border-gray-200",
};

const ACTIVE_STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'AWAITING_APPROVAL', 'PAYMENT_SLIP_REQUESTED', 'PAYMENT_UPLOADED', 'PAYMENT_VERIFIED', 'PREPARING', 'ON_THE_WAY'];

/** Statuses that should be removed from the active board once reached */
const TERMINAL_STATUSES: OrderStatus[] = ['DELIVERED', 'CANCELLED'];

const POLL_INTERVAL_MS = 30_000;

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
    if (order.status !== 'PENDING' || !order.createdAt) return false;
    const elapsed = Date.now() - new Date(order.createdAt).getTime();
    return !isNaN(elapsed) && elapsed > 15 * 60 * 1000; // 15 minutes
}

export default function OrderBoard() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // ── Ref to track known IDs for O(1) duplicate-guard during WS inserts ──
    const knownIdsRef = useRef<Set<string | number>>(new Set());

    // ── Initial REST fetch (also used as manual refresh / fallback) ──────────
    const fetchOrders = useCallback(async () => {
        try {
            const data = await orderService.getActiveOrders();
            setOrders(data);
            setLastRefresh(new Date());
            // Rebuild the known-IDs set from the fresh snapshot
            knownIdsRef.current = new Set(data.map((o) => o.id));
        } catch {
            toast.error("Failed to fetch active orders");
        } finally {
            setLoading(false);
        }
    }, []);

    // ── WebSocket callbacks (stable → refs prevent hook re-activation) ───────
    const handleNewOrder = useCallback((payload: Partial<Order> & { id: string | number; status: OrderStatus }) => {
        if (knownIdsRef.current.has(payload.id)) return; // duplicate guard
        knownIdsRef.current.add(payload.id);

        setOrders((prev) => {
            // Only add if the status is still active (defensive)
            if (TERMINAL_STATUSES.includes(payload.status)) return prev;
            return [payload as Order, ...prev];
        });

        toast.info(`New order #${String(payload.id).slice(-8).toUpperCase()} received!`, {
            description: payload.shopName ?? undefined,
        });
    }, []);

    const handleOrderUpdate = useCallback((payload: { id: string | number; status: OrderStatus; updatedAt?: string; [key: string]: unknown }) => {
        setOrders((prev) => {
            const idx = prev.findIndex((o) => String(o.id) === String(payload.id));
            if (idx === -1) {
                // Unknown order — trigger a full refresh to pick it up
                fetchOrders();
                return prev;
            }

            // Terminal status: remove from active board
            if (TERMINAL_STATUSES.includes(payload.status)) {
                knownIdsRef.current.delete(payload.id);
                return prev.filter((_, i) => i !== idx);
            }

            // In-place status patch — only re-create the changed element
            const updated = { ...prev[idx], status: payload.status };
            if (payload.updatedAt) updated.updatedAt = payload.updatedAt;
            const next = [...prev];
            next[idx] = updated;
            return next;
        });
    }, [fetchOrders]);

    // ── Page-scoped WebSocket (connects on mount, disconnects on unmount) ────
    const { wsConnected } = useOrderBoardWebSocket({
        onNewOrder: handleNewOrder,
        onOrderUpdate: handleOrderUpdate,
    });

    // ── Polling fallback: only active when WS is not connected ───────────────
    // Track wsConnected in a ref so the interval closure always reads the
    // latest value without needing to be torn down and re-created.
    const wsConnectedRef = useRef(wsConnected);
    useEffect(() => { wsConnectedRef.current = wsConnected; }, [wsConnected]);

    useEffect(() => {
        // Initial REST fetch regardless of WS state
        fetchOrders();

        const interval = setInterval(() => {
            // Skip polling if WebSocket is healthy
            if (wsConnectedRef.current) return;
            fetchOrders();
        }, POLL_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [fetchOrders]);

    const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
        try {
            await orderService.updateOrderStatus(orderId, newStatus);
            // Optimistic update — WS echo will confirm; terminal statuses drop row
            setOrders((prev) => {
                if (TERMINAL_STATUSES.includes(newStatus)) {
                    knownIdsRef.current.delete(orderId);
                    return prev.filter((o) => String(o.id) !== orderId);
                }
                return prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o);
            });
            toast.success(`Order status updated to ${newStatus}`);
        } catch {
            toast.error("Failed to update order status");
        }
    };

    const byStatus = (status: OrderStatus) => orders.filter((o) => o.status === status);
    const handleSort = (key: string) => setSortConfig(toggleSort(sortConfig, key));
    const sortedOrders = sortData(orders, sortConfig);

    // Pagination
    const totalItems = sortedOrders.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const paginatedOrders = sortedOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ClipboardList className="h-6 w-6 text-primary" />
                    <div>
                        <h1 className="text-lg font-semibold md:text-2xl">Order Board — Live Monitor</h1>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                            {wsConnected ? (
                                <>
                                    <Wifi className="h-3 w-3 text-green-500" />
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-green-600 font-medium">Live · WebSocket connected</span>
                                </>
                            ) : (
                                <>
                                    <WifiOff className="h-3 w-3 text-amber-500" />
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
                                    Auto-refresh every 30s · Last: {lastRefresh.toLocaleTimeString()}
                                </>
                            )}
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
                            ) : paginatedOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                        <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                        No active orders
                                    </TableCell>
                                </TableRow>
                            ) : paginatedOrders.map((order) => (
                                <TableRow
                                    key={order.id}
                                    className={isPendingSLA(order) ? "border-l-4 border-l-red-500 bg-red-500/5" : ""}
                                >
                                    <TableCell>
                                        <button
                                            className="text-primary underline-offset-4 hover:underline font-mono text-xs"
                                            onClick={() => navigate(`/orders/${order.id}`)}
                                        >
                                            #{String(order.id).slice(-8).toUpperCase()}
                                        </button>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        <div className="font-medium text-sm">{order.userFullName || "Guest"}</div>
                                        {order.userPhone && <div className="text-[10px] text-muted-foreground">{order.userPhone}</div>}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded border overflow-hidden shrink-0 bg-white">
                                                {order.shopImageUrl ? (
                                                    <img src={order.shopImageUrl} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center bg-muted text-[8px]">?</div>
                                                )}
                                            </div>
                                            <span className="text-xs font-medium truncate max-w-[120px]">{order.shopName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`text-xs px-2 py-1 rounded-full border font-medium ${STATUS_COLORS[order.status] || "bg-gray-100"}`}>
                                            {order.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className={`text-xs ${isPendingSLA(order) ? "text-red-500 font-semibold" : "text-muted-foreground"}`}>
                                        {order.createdAt ? getElapsedTime(order.createdAt) : "—"}
                                    </TableCell>
                                    <TableCell className="font-medium text-sm">
                                        {order.displayTotalAmount || (typeof order.totalAmount === 'number' ? `$${order.totalAmount.toFixed(2)}` : order.totalAmount || "—")}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Select
                                                value={order.status}
                                                onValueChange={(val) => handleStatusChange(String(order.id), val as OrderStatus)}
                                            >
                                                <SelectTrigger className="w-full h-8 text-xs font-bold">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {['PENDING', 'CONFIRMED', 'AWAITING_APPROVAL', 'PAYMENT_SLIP_REQUESTED', 'PAYMENT_UPLOADED', 'PAYMENT_VERIFIED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED', 'INTERNAL_TRACKING'].map((s) => (
                                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate(`/orders/${order.id}`)}>
                                                <RefreshCw className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <DataTablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            />

        </div>
    );
}
