import { useEffect, useState, useCallback, useMemo } from "react";
import { orderService, Order, OrderStatus, OrderFilters } from "@/services/orderService";
import {
    Table, TableBody, TableCell, TableHeader, TableRow,
} from "@/components/ui/table";
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
    PENDING: "bg-yellow-100 text-yellow-800",
    ACCEPTED: "bg-blue-100 text-blue-800",
    PREPARING: "bg-orange-100 text-orange-800",
    READY: "bg-purple-100 text-purple-800",
    DELIVERING: "bg-indigo-100 text-indigo-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
};

type PeriodPreset = "today" | "yesterday" | "this_week" | "last_week" | "this_month" | "last_month" | "custom";

function formatDateLocal(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function formatDisplayDate(dateStr: string): string {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
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
                                {startDate && (
                                    <span className="absolute right-10 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                                        {formatDisplayDate(startDate)}
                                    </span>
                                )}
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
                                {endDate && (
                                    <span className="absolute right-10 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                                        {formatDisplayDate(endDate)}
                                    </span>
                                )}
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
                                <TableRow>
                                    <SortableTableHead label="Order ID" sortKey="id" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead label="Shop" sortKey="shopName" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead label="Customer" sortKey="customerName" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead label="Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead label="Total" sortKey="totalAmount" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead label="Date" sortKey="createdAt" sortConfig={sortConfig} onSort={handleSort} />
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
                                    <TableRow key={order.id}>
                                        <TableCell className="font-mono text-xs">#{String(order.id || '').slice(-8).toUpperCase()}</TableCell>
                                        <TableCell>{order.shopName}</TableCell>
                                        <TableCell>{order.customerName}</TableCell>
                                        <TableCell>
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>
                                                {order.status}
                                            </span>
                                        </TableCell>
                                        <TableCell>${order.totalAmount?.toFixed(2)}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {formatDisplayDate(order.createdAt?.split("T")[0] ?? "")}
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
