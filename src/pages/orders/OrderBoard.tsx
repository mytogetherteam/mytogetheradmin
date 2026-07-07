import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Order, OrderStatus, ORDER_STATUSES } from "@/services/orderService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, ClipboardList, Wifi, WifiOff, Eye, X, CheckCircle2, XCircle } from "lucide-react";
import { DataTablePagination } from "@/components/DataTablePagination";
import { ShopSelect } from "@/components/ShopSelect";
import { authService } from "@/services/authService";
import { AdminRole, hasAccess } from "@/utils/rbac";
import { useSuperAdminOrderSocket } from "@/hooks/notifications/useSuperAdminOrderSocket";
import { useActiveOrders, orderKeys } from "@/hooks/orders/useOrders";
import { STATUS_COLORS, orderAddressText } from "@/components/orders/order-format";
import { formatRelativeTime, formatAmount } from "@/lib/helpers";

const ALL = "ALL";

/** Pending orders older than 15 min get a visual SLA warning. */
function isPendingSLA(order: Order): boolean {
    if (order.status !== "PENDING" || !order.createdAt) return false;
    const elapsed = Date.now() - new Date(order.createdAt).getTime();
    return !isNaN(elapsed) && elapsed > 15 * 60 * 1000;
}

export default function OrderBoard() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isSuperAdmin = hasAccess(authService.getUserData()?.role, AdminRole.ADMIN);
    // OperationAdmin can also view the board and must receive WS events.
    const userRole = authService.getUserData()?.role;
    const wsEnabled = isSuperAdmin || userRole === 'OperationAdmin';

    // ── Filters + server-side pagination ──────────────────────────────────────
    const [shopId, setShopId] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>(ALL);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    // Bumping this remounts <ShopSelect>, resetting its internal selection on "Clear".
    const [shopSelectKey, setShopSelectKey] = useState(0);

    // Force re-render every 15 seconds to keep "time ago" texts and SLA warnings 
    // perfectly real-time without relying solely on data refetches.
    const [, setTick] = useState(0);
    useEffect(() => {
        const timer = setInterval(() => setTick((t) => t + 1), 15000);
        return () => clearInterval(timer);
    }, []);

    const { data, isFetching, refetch } = useActiveOrders({
        shopId: shopId ?? undefined,
        status: statusFilter === ALL ? undefined : (statusFilter as OrderStatus),
        page: currentPage,
        size: pageSize,
    });

    const orders = data?.content ?? [];
    const totalItems = data?.totalElements ?? 0;
    const totalPages = Math.max(1, data?.totalPages ?? 1);
    const showSkeleton = isFetching && orders.length === 0;

    // Immediately re-sync after a WebSocket reconnect to recover orders that
    // arrived during the disconnect window (reconnectDelay is 5 s).
    const handleWsReconnect = useCallback(() => {
        void queryClient.invalidateQueries({ queryKey: orderKeys.active() });
    }, [queryClient]);

    const [lastSynced, setLastSynced] = useState<Date | null>(null);

    // ── Live WebSocket: any order event → invalidate the board (debounced) ────
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const handleWsEvent = useCallback(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setLastSynced(new Date());
            void queryClient.invalidateQueries({ queryKey: orderKeys.active() });
        }, 400);
    }, [queryClient]);

    const { connected: wsConnected } = useSuperAdminOrderSocket(handleWsEvent, wsEnabled, handleWsReconnect);

    // Also set lastSynced when the periodic poll succeeds.
    useEffect(() => {
        if (!isFetching) setLastSynced(new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFetching]);

    const resetFilters = () => {
        setShopId(null);
        setStatusFilter(ALL);
        setCurrentPage(1);
        setShopSelectKey((k) => k + 1);
    };

    // Quick-filter buttons toggle a terminal status on/off (off → back to active).
    const toggleStatus = (s: string) => {
        setStatusFilter((cur) => (cur === s ? ALL : s));
        setCurrentPage(1);
    };

    const filtersActive = shopId !== null || statusFilter !== ALL;

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <ClipboardList className="h-6 w-6 text-primary" />
                    <div>
                        <h1 className="text-lg font-semibold md:text-2xl">Live Order Board</h1>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                            {wsConnected ? (
                                <>
                                    <Wifi className="h-3 w-3 text-green-500" />
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-green-600 font-medium">Live · connected</span>
                                </>
                            ) : (
                                <>
                                    <WifiOff className="h-3 w-3 text-amber-500" />
                                    <span className="text-amber-600 font-medium">Reconnecting…</span>
                                </>
                            )}
                            {lastSynced && (
                                <span className="text-muted-foreground/70 ml-1">
                                    · synced {lastSynced.toLocaleTimeString()}
                                </span>
                            )}
                        </p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="flex flex-wrap items-end gap-4 py-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Shop</label>
                        <ShopSelect
                            key={shopSelectKey}
                            className="w-[240px]"
                            placeholder="All shops"
                            onSelect={(id) => { setShopId(id); setCurrentPage(1); }}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Status</label>
                        <Select
                            value={statusFilter}
                            onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}
                        >
                            <SelectTrigger className="w-[220px] h-9 text-sm">
                                <SelectValue placeholder="Active (all in-flight)" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[320px]">
                                <SelectItem value={ALL}>Active (all in-flight)</SelectItem>
                                {ORDER_STATUSES.map((s) => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Quick terminal-status filters */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Quick filter</label>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant={statusFilter === "DELIVERED" ? "default" : "outline"}
                                className="h-9"
                                onClick={() => toggleStatus("DELIVERED")}
                            >
                                <CheckCircle2 className="h-4 w-4 mr-1" /> Delivered
                            </Button>
                            <Button
                                size="sm"
                                variant={statusFilter === "CANCELED" ? "default" : "outline"}
                                className="h-9"
                                onClick={() => toggleStatus("CANCELED")}
                            >
                                <XCircle className="h-4 w-4 mr-1" /> Cancelled
                            </Button>
                        </div>
                    </div>

                    {filtersActive && (
                        <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9">
                            <X className="h-4 w-4 mr-1" /> Clear
                        </Button>
                    )}

                    <div className="ml-auto text-xs text-muted-foreground self-center">
                        {showSkeleton ? "Loading…" : `${totalItems} order${totalItems === 1 ? "" : "s"}`}
                    </div>
                </CardContent>
            </Card>

            {/* Orders table */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                        {statusFilter === ALL ? "Active Orders" : `Orders · ${statusFilter}`}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead>Shop</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Placed</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead className="text-right">View</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {showSkeleton ? (
                                [...Array(6)].map((_, i) => (
                                    <TableRow key={i}>
                                        {[...Array(9)].map((__, j) => (
                                            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                                        <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                        No orders match the current filters
                                    </TableCell>
                                </TableRow>
                            ) : orders.map((order) => (
                                <TableRow
                                    key={order.id}
                                    className={isPendingSLA(order) ? "border-l-4 border-l-red-500 bg-red-500/5" : ""}
                                >
                                    <TableCell>
                                        <button
                                            className="text-primary underline-offset-4 hover:underline font-mono text-xs"
                                            onClick={() => navigate(`/orders/${order.id}`)}
                                        >
                                            {order.lastOrderNo || `#${order.id}`}
                                        </button>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        <div className="font-medium">{order.userFullName || "Guest"}</div>
                                        {order.userPhone && (
                                            <div className="text-[10px] text-muted-foreground">{order.userPhone}</div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground max-w-[200px]">
                                        <span className="line-clamp-2 break-words" title={orderAddressText(order) ?? undefined}>
                                            {orderAddressText(order) ?? "—"}
                                        </span>
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
                                            <span className="text-xs font-medium truncate max-w-[140px]">
                                                {order.shopName || `Shop #${order.shopId}`}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`text-xs px-2 py-1 rounded-full border font-medium ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-800 border-gray-200"}`}>
                                            {order.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {order.itemCount ?? "—"}
                                    </TableCell>
                                    <TableCell className={`text-xs ${isPendingSLA(order) ? "text-red-500 font-semibold" : "text-muted-foreground"}`}>
                                        {formatRelativeTime(order.createdAt)}
                                    </TableCell>
                                    <TableCell className="font-medium text-sm">
                                        {formatAmount(order.totalAmount, order.displayTotalAmount)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => navigate(`/orders/${order.id}`)}
                                            title="View order"
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                        </Button>
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
