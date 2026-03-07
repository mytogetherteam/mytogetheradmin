import { useEffect, useState, useCallback, useMemo } from "react";
import { orderService, Order, OrderStatus, OrderFilters } from "@/services/orderService";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { History, Search } from "lucide-react";
import { toast } from "sonner";
import { DataTablePagination } from "@/components/DataTablePagination";
import { SortableTableHead, SortConfig, toggleSort, sortData } from "@/components/SortableTableHead";
import { exportService } from "@/services/exportService";
import { FileSpreadsheet } from "lucide-react";

const STATUS_COLORS: Record<OrderStatus, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
    ACCEPTED: "bg-cyan-100 text-cyan-800 border-cyan-200",
    PREPARING: "bg-orange-100 text-orange-800 border-orange-200",
    READY: "bg-purple-100 text-purple-800 border-purple-200",
    DELIVERING: "bg-indigo-100 text-indigo-800 border-indigo-200",
    DELIVERED: "bg-green-100 text-green-800 border-green-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
};

type PeriodPreset = "today" | "yesterday" | "this_week" | "last_week" | "this_month" | "last_month" | "custom";

function formatDateLocal(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}


function getPresetDates(preset: PeriodPreset): { start: string; end: string } {
    const today = new Date();
    const todayStr = formatDateLocal(today);

    switch (preset) {
        case "today":
            return { start: todayStr, end: todayStr };
        case "yesterday": {
            const d = new Date(today);
            d.setDate(d.getDate() - 1);
            const s = formatDateLocal(d);
            return { start: s, end: s };
        }
        case "this_week": {
            const day = today.getDay();
            const start = new Date(today);
            start.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
            return { start: formatDateLocal(start), end: todayStr };
        }
        case "last_week": {
            const day = today.getDay();
            const thisMonday = new Date(today);
            thisMonday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
            const lastMonday = new Date(thisMonday);
            lastMonday.setDate(thisMonday.getDate() - 7);
            const lastSunday = new Date(thisMonday);
            lastSunday.setDate(thisMonday.getDate() - 1);
            return { start: formatDateLocal(lastMonday), end: formatDateLocal(lastSunday) };
        }
        case "this_month": {
            const start = new Date(today.getFullYear(), today.getMonth(), 1);
            return { start: formatDateLocal(start), end: todayStr };
        }
        case "last_month": {
            const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const end = new Date(today.getFullYear(), today.getMonth(), 0);
            return { start: formatDateLocal(start), end: formatDateLocal(end) };
        }
        default:
            return { start: todayStr, end: todayStr };
    }
}

const PERIOD_OPTIONS: { value: PeriodPreset; label: string }[] = [
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "this_week", label: "This Week" },
    { value: "last_week", label: "Last Week" },
    { value: "this_month", label: "This Month" },
    { value: "last_month", label: "Last Month" },
    { value: "custom", label: "Custom" },
];

export default function OrderHistory() {
    const navigate = useNavigate();
    const todayStr = formatDateLocal(new Date());
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalElements, setTotalElements] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

    const [period, setPeriod] = useState<PeriodPreset>("today");
    const [startDate, setStartDate] = useState(todayStr);
    const [endDate, setEndDate] = useState(todayStr);
    const [statusFilter, setStatusFilter] = useState<string>("ALL");

    const isCustom = period === "custom";

    const handlePeriodChange = (preset: PeriodPreset) => {
        setPeriod(preset);
        if (preset !== "custom") {
            const { start, end } = getPresetDates(preset);
            setStartDate(start);
            setEndDate(end);
        }
        setCurrentPage(1);
    };

    const filters: OrderFilters = useMemo(() => ({
        page: currentPage - 1,
        size: pageSize,
        startDate,
        endDate,
        status: statusFilter === "ALL" ? undefined : statusFilter as OrderStatus,
    }), [currentPage, pageSize, startDate, endDate, statusFilter]);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const data = await orderService.getOrders(filters);
            setOrders(data.content);
            setTotalElements(data.totalElements ?? data.content.length);
        } catch {
            toast.error("Failed to load order history");
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const handleSort = (key: string) => {
        setSortConfig(toggleSort(sortConfig, key));
    };

    const sortedOrders = sortData(orders, sortConfig);
    const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <History className="h-6 w-6 text-primary" />
                <h1 className="text-lg font-semibold md:text-2xl">Order History</h1>
                <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto gap-2"
                    onClick={() => {
                        exportService.exportOrders(startDate, endDate, statusFilter);
                        toast.info("Exporting orders...");
                    }}
                >
                    <FileSpreadsheet className="h-4 w-4" />
                    Export to Excel
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-4 space-y-4">
                    {/* Period Buttons */}
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-2 block">Period</label>
                        <div className="flex flex-wrap gap-2">
                            {PERIOD_OPTIONS.map((opt) => (
                                <Button
                                    key={opt.value}
                                    variant={period === opt.value ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handlePeriodChange(opt.value)}
                                >
                                    {opt.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Start Date</label>
                            <div className="relative">
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                                    disabled={!isCustom}
                                    className={!isCustom ? "opacity-50" : ""}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">End Date</label>
                            <div className="relative">
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                                    disabled={!isCustom}
                                    className={!isCustom ? "opacity-50" : ""}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
                            <Select
                                value={statusFilter}
                                onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}
                            >
                                <SelectTrigger className="w-full">
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
                            <Button className="w-full" onClick={() => { setCurrentPage(1); fetchOrders(); }}>
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
                    <div className="rounded-md border-t overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <SortableTableHead label="ID" sortKey="id" sortConfig={sortConfig} onSort={handleSort} className="w-[80px]" />
                                    <TableHead>Shop</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <SortableTableHead label="Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} />
                                    <TableHead>Delivery</TableHead>
                                    <SortableTableHead label="Total" sortKey="totalAmount" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead label="Date" sortKey="createdAt" sortConfig={sortConfig} onSort={handleSort} />
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    [...Array(pageSize > 10 ? 8 : 5)].map((_, i) => (
                                        <TableRow key={i}>
                                            {[...Array(6)].map((__, j) => (
                                                <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : sortedOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                            No orders found for the selected filters.
                                        </TableCell>
                                    </TableRow>
                                ) : sortedOrders.map((order) => (
                                    <TableRow key={order.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => navigate(`/orders/${order.id}`)}>
                                        <TableCell className="font-mono text-[10px] text-muted-foreground">#{order.id}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded border overflow-hidden shrink-0 bg-white">
                                                    {order.shopImageUrl ? (
                                                        <img src={order.shopImageUrl} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center bg-muted text-[10px]">No Img</div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-medium truncate text-sm">{order.shopName}</div>
                                                    {order.shopNameMm && <div className="text-[10px] text-muted-foreground truncate">{order.shopNameMm}</div>}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm font-medium">{order.userFullName || "Guest"}</div>
                                            {order.userPhone && <div className="text-xs text-muted-foreground">{order.userPhone}</div>}
                                        </TableCell>
                                        <TableCell>
                                            <div className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-800"}`}>
                                                {order.statusLabel || order.status}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs">
                                                <div className="font-medium">{order.deliveryType}</div>
                                                {order.deliveryTier && <div className="text-muted-foreground">{order.deliveryTier}</div>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{order.displayTotalAmount || (typeof order.totalAmount === 'number' ? order.totalAmount.toFixed(2) : order.totalAmount || "—")}</div>
                                            {order.deliveryFee > 0 && <div className="text-[10px] text-muted-foreground">Fee: {order.deliveryFee}</div>}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order.id}`); }}>
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Pagination */}
            <DataTablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalElements}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            />
        </div>
    );
}
