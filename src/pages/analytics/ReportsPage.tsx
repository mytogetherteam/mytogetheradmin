import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Ban, Banknote, ClipboardList, Clock, Download, FileSpreadsheet, ScrollText, Star, Store, Ticket, TrendingDown, Users, Utensils,
    type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { SortableTableHead } from "@/components/SortableTableHead";
import { activeUsersService, ActiveActor } from "@/services/activeUsersService";
import { sortData, SortConfig } from "@/lib/sort-utils";
import {
    reportsService,
    OperationsReport,
    OrdersByHourReport,
    ShopScorecardRow,
    CancellationLedger,
    CancellationLossReport,
    ShopMoneyReport,
    ShopResult,
    MenuPerformanceReport,
    PromotionLedger,
    ReviewRecord,
    CustomerOrdersReport,
    CustomerOrderHistory,
} from "@/services/reportsService";
import { ApiError } from "@/services/apiClient";
import { bangkokPreset, BangkokPreset, formatBangkokDateTime, lastBangkokDays } from "@/utils/bangkokTime";

type ReportId =
    | "operations"
    | "hours"
    | "shops"
    | "cancellations"
    | "losses"
    | "money"
    | "menus"
    | "promotions"
    | "reviews"
    | "customers"
    | "staff";

const REPORTS: Array<{ id: ReportId; tab: string; title: string; hint: string; icon: LucideIcon }> = [
    {
        id: "operations",
        tab: "Operations",
        title: "What happened each day",
        icon: ClipboardList,
        hint: "Placed is orders created that day. Delivered, picked up, and canceled are counted on the day they happened.",
    },
    {
        id: "hours",
        tab: "By hour",
        title: "What happened each hour",
        icon: Clock,
        hint: "The same counts as Operations, added up by hour in Thailand.",
    },
    {
        id: "shops",
        tab: "Restaurants",
        title: "Restaurant scorecard",
        icon: Store,
        hint: "Orders placed in this period. Sales is the completed order value of those orders.",
    },
    {
        id: "cancellations",
        tab: "Cancellations",
        title: "Canceled orders",
        icon: Ban,
        hint: "Each order canceled in this period, on the day it was canceled.",
    },
    {
        id: "losses",
        tab: "Losses",
        title: "Canceled order value by reason",
        icon: TrendingDown,
        hint: "Canceled order value grouped by restaurant and reason. Shop did not respond covers a restaurant that never answered.",
    },
    {
        id: "money",
        tab: "Money",
        title: "Order value by restaurant",
        icon: Banknote,
        hint: "Orders placed in this period, split into completed, still open, and canceled. Item sales, fees, discounts, and free-delivery orders are from completed orders.",
    },
    {
        id: "menus",
        tab: "Menus",
        title: "Dishes on completed orders",
        icon: Utensils,
        hint: "Dishes on orders placed in this period that were delivered or picked up. Views and likes are all-time.",
    },
    {
        id: "promotions",
        tab: "Promotions",
        title: "Coupons used",
        icon: Ticket,
        hint: "Coupon redemptions in this period. The order count leaves out canceled orders.",
    },
    {
        id: "customers",
        tab: "Customers",
        title: "Customers",
        icon: Users,
        hint: "Customers with an order that was not canceled in this period. Gone quiet means the last completed order was more than 30 days ago.",
    },
    {
        id: "reviews",
        tab: "Reviews",
        title: "Reviews",
        icon: Star,
        hint: "Reviews on delivered orders placed in this period. The restaurant rating is its current rating.",
    },
    {
        id: "staff",
        tab: "People online",
        title: "People online",
        icon: ScrollText,
        hint: "Admins seen on the To date.",
    },
];

const GROUPS: Array<{ id: string; label: string; reports: ReportId[] }> = [
    { id: "sales", label: "Sales", reports: ["money", "menus", "promotions"] },
    { id: "service", label: "Service", reports: ["operations", "hours", "shops", "cancellations", "losses", "reviews"] },
    { id: "people", label: "People", reports: ["customers", "staff"] },
];

const ATTENTION_FILTERS = [
    { id: "noOrders", label: "No orders", match: "Open with no orders" },
    { id: "cancelRate", label: "Cancel rate 20% or more", match: "Cancel rate 20% or more" },
    { id: "lowRating", label: "Rating under 3", match: "Rating under 3" },
] as const;

const DATE_PRESETS: Array<{ id: BangkokPreset; label: string }> = [
    { id: "today", label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "week", label: "This week" },
    { id: "month", label: "This month" },
];

const ACTORS = [
    { id: "ALL", label: "Everyone" },
    { id: "USER", label: "Customer" },
    { id: "SHOP", label: "Restaurant" },
    { id: "ADMIN", label: "Admin" },
    { id: "SYSTEM", label: "System" },
    { id: "UNSPECIFIED", label: "Unspecified" },
];

function defaultRange() {
    return lastBangkokDays(30);
}

function rangeError(start: string, end: string) {
    if (!start || !end) return "Choose a from and to date.";
    if (start > end) return "From must be on or before To.";
    const days = Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000) + 1;
    if (days > 366) return "Date range cannot exceed 366 days.";
    return null;
}

function baht(value: number) {
    return `฿${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function waitLabel(value: number | null) {
    return value == null ? "—" : `${Math.round(value)} min`;
}

function hourLabel(hour: number) {
    return `${String(hour).padStart(2, "0")}:00`;
}

const ASC_FIRST = new Set([
    "name", "phone", "favoriteShop", "date", "hour", "shopName", "dishName", "couponName",
    "method", "reason", "orderNo", "comment", "whoLabel", "reasonText", "typeLabel", "targetLabel",
    "displayName", "roleText", "shopText", "statusLabel", "attentionText", "rating", "ratingAvg", "ratingSort",
]);

function nextReportSort(current: SortConfig | undefined, key: string): SortConfig {
    if (current?.key === key) {
        return { key, direction: current.direction === "desc" ? "asc" : "desc" };
    }
    return { key, direction: ASC_FIRST.has(key) ? "asc" : "desc" };
}

const INITIAL_SORTS: Record<string, SortConfig> = {
    operations: { key: "date", direction: "asc" },
    hours: { key: "hour", direction: "asc" },
    shops: { key: "sales", direction: "desc" },
    cancellations: { key: "createdAt", direction: "desc" },
    lossReasons: { key: "lostAmount", direction: "desc" },
    lossShops: { key: "lostAmount", direction: "desc" },
    money: { key: "completedAmount", direction: "desc" },
    payments: { key: "amount", direction: "desc" },
    menus: { key: "orders", direction: "desc" },
    promotions: { key: "discountGiven", direction: "desc" },
    reviewComments: { key: "rating", direction: "asc" },
    reviewShops: { key: "ratingAvg", direction: "asc" },
    customers: { key: "ordersSoFar", direction: "desc" },
    staff: { key: "lastSeenAt", direction: "desc" },
    history: { key: "createdAt", direction: "desc" },
    shopReasons: { key: "lostAmount", direction: "desc" },
};

function SortHead({
    table, label, sortKey, align = "left", sorts, onSort,
}: {
    table: string;
    label: string;
    sortKey: string;
    align?: "left" | "right";
    sorts: Record<string, SortConfig>;
    onSort: (table: string, key: string) => void;
}) {
    return (
        <SortableTableHead
            label={label}
            sortKey={sortKey}
            align={align}
            sortConfig={sorts[table]}
            onSort={(key) => onSort(table, key)}
        />
    );
}

function actorLabel(actor: string | null) {
    return ACTORS.find((item) => item.id === actor)?.label ?? (actor ? actor : "Unspecified");
}

function promoTypeLabel(value: string) {
    if (value === "BUY_X_GET_DISCOUNT") return "Buy X get discount";
    if (value === "BUY_X_GET_FREE") return "Buy X get free";
    return value;
}

function promoTargetLabel(value: string) {
    if (value === "ALL") return "All customers";
    if (value === "EARLY_BIRD") return "Early bird";
    if (value === "REFERRAL") return "Referral";
    return value;
}

function orderStatusLabel(status: string) {
    const labels: Record<string, string> = {
        PENDING: "Pending",
        CANCELED: "Canceled",
        REJECTED: "Rejected",
        PAYMENT_SLIP_REQUESTED: "Waiting for payment",
        AWAITING_APPROVAL: "Awaiting approval",
        PAYMENT_VERIFIED: "Payment verified",
        COOKING: "Cooking",
        READY_FOR_PICKUP: "Ready for pickup",
        ON_THE_WAY: "On the way",
        DELIVERED: "Delivered",
        PICKED_UP: "Picked up",
        REVISED: "Revised",
    };
    return labels[status] ?? status;
}

function roleLabel(role: string | null) {
    if (role === "SuperAdmin") return "Super admin";
    if (role === "ShopAdmin") return "Shop admin";
    if (role === "OperationAdmin") return "Operation admin";
    if (role === "MarketingAdmin") return "Marketing admin";
    return role ?? "—";
}

function errorMessage(error: unknown) {
    if (error instanceof ApiError) return error.message;
    if (error instanceof Error) return error.message;
    return "Could not load this report.";
}

function EmptyRow({ cols, label }: { cols: number; label: string }) {
    return (
        <TableRow>
            <TableCell colSpan={cols} className="h-24 text-center text-sm text-foreground">{label}</TableCell>
        </TableRow>
    );
}

function Figures({ items }: { items: Array<{ label: string; value: string; note?: string }> }) {
    return (
        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {items.map((item) => (
                <Card key={item.label}>
                    <CardContent className="p-4">
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-2xl font-semibold tabular-nums text-foreground">{item.value}</p>
                        {item.note ? <p className="text-sm text-foreground">{item.note}</p> : null}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function csvCell(value: string | number | null | undefined) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function saveCsv(filename: string, headers: string[], rows: Array<Array<string | number | null | undefined>>) {
    const body = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

function ShownNote({ shown, total }: { shown: number; total: number }) {
    if (total <= shown) return null;
    return <p className="text-sm text-foreground">Showing {shown.toLocaleString()} of {total.toLocaleString()}.</p>;
}

export default function ReportsPage() {
    const defaults = defaultRange();
    const [reportId, setReportId] = useState<ReportId>("operations");
    const [startDate, setStartDate] = useState(defaults.start);
    const [endDate, setEndDate] = useState(defaults.end);
    const [actor, setActor] = useState("ALL");
    const [maxRating, setMaxRating] = useState("3");
    const [sorts, setSorts] = useState<Record<string, SortConfig>>(INITIAL_SORTS);
    const [attentionReasons, setAttentionReasons] = useState<string[]>([]);
    const [downloading, setDownloading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [operations, setOperations] = useState<OperationsReport | null>(null);
    const [hours, setHours] = useState<OrdersByHourReport | null>(null);
    const [shops, setShops] = useState<ShopScorecardRow[]>([]);
    const [cancellations, setCancellations] = useState<CancellationLedger | null>(null);
    const [losses, setLosses] = useState<CancellationLossReport | null>(null);
    const [money, setMoney] = useState<ShopMoneyReport | null>(null);
    const [menus, setMenus] = useState<MenuPerformanceReport | null>(null);
    const [promotions, setPromotions] = useState<PromotionLedger | null>(null);
    const [reviews, setReviews] = useState<ReviewRecord | null>(null);
    const [customers, setCustomers] = useState<CustomerOrdersReport | null>(null);
    const [staff, setStaff] = useState<{ total: number; actors: ActiveActor[] } | null>(null);
    const [openedCustomer, setOpenedCustomer] = useState<CustomerOrdersReport["rows"][number] | null>(null);
    const [history, setHistory] = useState<CustomerOrderHistory | null>(null);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [openedShop, setOpenedShop] = useState<{ shopId: number; shopName: string } | null>(null);
    const [shopResult, setShopResult] = useState<ShopResult | null>(null);
    const [shopResultLoading, setShopResultLoading] = useState(false);
    const [shopResultError, setShopResultError] = useState<string | null>(null);
    const [shopResultActor, setShopResultActor] = useState("ALL");

    const selected = REPORTS.find((item) => item.id === reportId) ?? REPORTS[0];
    const dateProblem = rangeError(startDate, endDate);

    const requestId = useRef(0);
    const historyRequest = useRef(0);
    const shopResultRequest = useRef(0);

    const openCustomerOrders = useCallback(async (row: CustomerOrdersReport["rows"][number]) => {
        const id = ++historyRequest.current;
        setOpenedCustomer(row);
        setHistory(null);
        setHistoryError(null);
        setHistoryLoading(true);
        try {
            const result = await reportsService.customerOrders(row.userId);
            if (historyRequest.current !== id) return;
            setHistory(result);
        } catch (loadError: unknown) {
            if (historyRequest.current !== id) return;
            setHistoryError(errorMessage(loadError));
        } finally {
            if (historyRequest.current === id) setHistoryLoading(false);
        }
    }, []);

    const openShopResult = useCallback(async (row: { shopId: number; shopName: string }, who?: string) => {
        if (row.shopId <= 0) return;
        const id = ++shopResultRequest.current;
        setOpenedShop(row);
        setShopResult(null);
        setShopResultError(null);
        setShopResultActor(who && who !== "ALL" ? who : "ALL");
        setShopResultLoading(true);
        try {
            const result = await reportsService.shopResult(row.shopId, startDate, endDate, who && who !== "ALL" ? who : undefined);
            if (shopResultRequest.current !== id) return;
            setShopResult(result);
        } catch (loadError: unknown) {
            if (shopResultRequest.current !== id) return;
            setShopResultError(errorMessage(loadError));
        } finally {
            if (shopResultRequest.current === id) setShopResultLoading(false);
        }
    }, [startDate, endDate]);

    const loadReport = useCallback(async () => {
        const id = ++requestId.current;
        setLoading(true);
        setError(null);
        const current = () => requestId.current === id;
        try {
            if (reportId === "operations") {
                const result = await reportsService.operations(startDate, endDate);
                if (current()) setOperations(result);
            } else if (reportId === "hours") {
                const result = await reportsService.ordersByHour(startDate, endDate);
                if (current()) setHours(result);
            } else if (reportId === "shops") {
                const result = await reportsService.shops(startDate, endDate);
                if (current()) setShops(result.rows);
            } else if (reportId === "cancellations") {
                const result = await reportsService.cancellations(startDate, endDate, actor === "ALL" ? undefined : actor);
                if (current()) setCancellations(result);
            } else if (reportId === "losses") {
                const result = await reportsService.cancellationLosses(startDate, endDate, actor === "ALL" ? undefined : actor);
                if (current()) setLosses(result);
            } else if (reportId === "money") {
                const result = await reportsService.money(startDate, endDate);
                if (current()) setMoney(result);
            } else if (reportId === "menus") {
                const result = await reportsService.menus(startDate, endDate);
                if (current()) setMenus(result);
            } else if (reportId === "promotions") {
                const result = await reportsService.promotions(startDate, endDate);
                if (current()) setPromotions(result);
            } else if (reportId === "reviews") {
                const result = await reportsService.reviews(startDate, endDate, maxRating);
                if (current()) setReviews(result);
            } else if (reportId === "customers") {
                const result = await reportsService.customers(startDate, endDate);
                if (current()) setCustomers(result);
            } else {
                const actors: ActiveActor[] = [];
                let page = 1;
                let total = 0;
                while (page <= 20) {
                    if (!current()) return;
                    const day = await activeUsersService.day({ date: endDate, actorType: "ADMIN", page, size: 100 });
                    total = day.total;
                    actors.push(...day.actors);
                    if (!day.hasMore) break;
                    page += 1;
                }
                if (current()) setStaff({ total, actors });
            }
        } catch (loadError: unknown) {
            if (current()) setError(errorMessage(loadError));
        } finally {
            if (current()) setLoading(false);
        }
    }, [reportId, startDate, endDate, actor, maxRating]);

    useEffect(() => {
        if (dateProblem) return;
        void loadReport();
    }, [dateProblem, reportId, loadReport]);

    const shopRows = attentionReasons.length === 0
        ? shops
        : shops.filter((row) => attentionReasons.some((reason) => {
            const filter = ATTENTION_FILTERS.find((item) => item.id === reason);
            return filter ? row.attention.includes(filter.match) : false;
        }));
    const onSort = useCallback((table: string, key: string) => {
        setSorts((current) => ({ ...current, [table]: nextReportSort(current[table], key) }));
    }, []);
    const column = (table: string, label: string, sortKey: string, align?: "left" | "right") => (
        <SortHead key={`${table}-${label}`} table={table} label={label} sortKey={sortKey} align={align} sorts={sorts} onSort={onSort} />
    );
    const sortedOperations = useMemo(() => sortData(operations?.rows ?? [], sorts.operations), [operations, sorts.operations]);
    const sortedHours = useMemo(() => sortData(hours?.rows ?? [], sorts.hours), [hours, sorts.hours]);
    const sortedShopRows = useMemo(
        () => sortData(shopRows.map((row) => ({
            ...row,
            attentionText: row.attention.join(", "),
            ratingSort: row.ratingCount > 0 ? row.ratingAvg : null,
        })), sorts.shops),
        [shopRows, sorts.shops],
    );
    const sortedCancellations = useMemo(
        () => sortData((cancellations?.rows ?? []).map((row) => ({
            ...row,
            whoLabel: actorLabel(row.canceledBy),
            reasonText: row.cancelReason ?? "",
        })), sorts.cancellations),
        [cancellations, sorts.cancellations],
    );
    const sortedLossReasons = useMemo(() => sortData(losses?.reasons ?? [], sorts.lossReasons), [losses, sorts.lossReasons]);
    const sortedLossShops = useMemo(() => sortData(losses?.shops ?? [], sorts.lossShops), [losses, sorts.lossShops]);
    const sortedMoney = useMemo(
        () => sortData(money?.shops ?? [], sorts.money),
        [money, sorts.money],
    );
    const sortedPayments = useMemo(() => sortData(money?.paymentMethods ?? [], sorts.payments), [money, sorts.payments]);
    const sortedMenus = useMemo(() => sortData(menus?.rows ?? [], sorts.menus), [menus, sorts.menus]);
    const sortedPromotions = useMemo(
        () => sortData((promotions?.rows ?? []).map((row) => ({
            ...row,
            typeLabel: promoTypeLabel(row.promotionType),
            targetLabel: promoTargetLabel(row.target),
        })), sorts.promotions),
        [promotions, sorts.promotions],
    );
    const sortedReviewComments = useMemo(() => sortData(reviews?.comments.rows ?? [], sorts.reviewComments), [reviews, sorts.reviewComments]);
    const sortedReviewShops = useMemo(() => sortData(reviews?.shops.rows ?? [], sorts.reviewShops), [reviews, sorts.reviewShops]);
    const sortedCustomers = useMemo(
        () => sortData((customers?.rows ?? []).map((row) => ({ ...row, historyCount: row.ordersSoFar })), sorts.customers),
        [customers, sorts.customers],
    );
    const sortedStaff = useMemo(
        () => sortData((staff?.actors ?? []).map((row) => ({
            ...row,
            displayName: row.name ?? row.contact ?? `#${row.actorId}`,
            roleText: roleLabel(row.role),
            shopText: row.shopName ?? "",
        })), sorts.staff),
        [staff, sorts.staff],
    );
    const sortedHistory = useMemo(
        () => sortData((history?.rows ?? []).map((row) => ({ ...row, statusLabel: orderStatusLabel(row.status) })), sorts.history),
        [history, sorts.history],
    );
    const sortedShopReasons = useMemo(() => sortData(shopResult?.reasons ?? [], sorts.shopReasons), [shopResult, sorts.shopReasons]);
    const group = GROUPS.find((item) => item.reports.includes(reportId)) ?? GROUPS[0];
    const groupReports = REPORTS.filter((item) => group.reports.includes(item.id));

    const downloadReport = async () => {
        setDownloading(true);
        const file = `${reportId}-${startDate}-to-${endDate}.csv`;
        try {
            if (reportId === "operations" && operations) {
                saveCsv(file, ["Date", "Placed", "Delivered", "Picked up", "Canceled", "Sent to MyTogether", "Wait until ready"], [
                    ...operations.rows.map((row) => [row.date, row.placed, row.delivered, row.pickedUp, row.canceled, row.escalated, row.avgWaitMinutes]),
                ]);
            } else if (reportId === "hours" && hours) {
                saveCsv(file, ["Hour", "Placed", "Delivered", "Picked up", "Canceled", "Sent to MyTogether", "Wait until ready"], hours.rows.map((row) => [hourLabel(row.hour), row.placed, row.delivered, row.pickedUp, row.canceled, row.escalated, row.avgWaitMinutes]));
            } else if (reportId === "shops") {
                saveCsv(file, ["Restaurant", "Orders", "Completed order value", "Average order value", "Cancel rate", "Rating", "Reviews", "Wait until ready", "Attention"], sortedShopRows.map((row) => [row.shopName, row.orders, row.sales, row.averageOrderValue, row.cancelRatePercent, row.ratingAvg, row.reviews, row.avgWaitMinutes, row.attention.join("; ")]));
            } else if (reportId === "cancellations") {
                const full = await reportsService.cancellations(startDate, endDate, actor === "ALL" ? undefined : actor, true);
                saveCsv(file, ["Order", "Canceled", "Restaurant", "Amount", "Who", "Reason"], full.rows.map((row) => [row.orderNo, formatBangkokDateTime(row.createdAt), row.shopName, row.amount, actorLabel(row.canceledBy), row.cancelReason]));
            } else if (reportId === "losses" && losses) {
                saveCsv(file, ["Restaurant", "Reason", "Orders", "Canceled order value"], losses.shops.flatMap((shop) => shop.reasons.map((reason) => [shop.shopName, reason.reason, reason.orders, reason.lostAmount])));
            } else if (reportId === "money" && money) {
                saveCsv(file, ["Restaurant", "Item sales", "Delivery fees", "Free-delivery orders", "Coupon discounts", "Restaurant discounts", "Completed order value", "Still open", "Canceled orders", "Canceled order value"], money.shops.map((row) => [row.shopName, row.itemSales, row.deliveryFees, row.freeDeliveryOrders, row.couponDiscounts, row.shopDiscounts, row.completedAmount, row.openAmount, row.canceledOrders, row.canceledAmount]));
            } else if (reportId === "menus") {
                const full = await reportsService.menus(startDate, endDate, true);
                saveCsv(file, ["Dish", "Restaurant", "Views all time", "Likes all time", "Orders", "Sales"], full.rows.map((row) => [row.dishName, row.shopName, row.views, row.likes, row.orders, row.sales]));
            } else if (reportId === "promotions" && promotions) {
                saveCsv(file, ["Coupon", "Restaurant", "Type", "Who can use it", "Redemptions", "Discount given", "Orders"], promotions.rows.map((row) => [row.couponName, row.shopName, promoTypeLabel(row.promotionType), promoTargetLabel(row.target), row.redemptions, row.discountGiven, row.orders]));
            } else if (reportId === "customers" && customers) {
                saveCsv(file, ["Customer", "Phone", "Orders in period", "Spent in period", "Orders so far", "Spent so far", "Favorite restaurant", "Gone quiet", "Last order"], customers.rows.map((row) => [row.name, row.phone, row.ordersInRange, row.spentInRange, row.ordersSoFar, row.spentSoFar, row.favoriteShop, row.goneQuiet ? "Yes" : "No", formatBangkokDateTime(row.lastOrderAt)]));
            } else if (reportId === "reviews") {
                const full = await reportsService.reviews(startDate, endDate, maxRating, true);
                saveCsv(file, ["Section", "Restaurant", "Order", "Rating", "Detail", "Time"], [
                    ...full.comments.rows.map((row) => ["Review", row.shopName, row.orderNo, row.rating, row.comment ?? "", formatBangkokDateTime(row.createdAt)]),
                    ...full.shops.rows.map((row) => ["Restaurant rating", row.shopName, "", row.ratingAvg, row.ratingCount, ""]),
                ]);
            } else if (reportId === "staff" && staff) {
                saveCsv(file, ["Name", "Role", "Restaurant", "Last seen"], staff.actors.map((row) => [row.name ?? row.contact ?? "", roleLabel(row.role), row.shopName, formatBangkokDateTime(row.lastSeenAt)]));
            }
        } catch (loadError: unknown) {
            setError(errorMessage(loadError));
        } finally {
            setDownloading(false);
        }
    };

    const downloadCustomerHistory = async () => {
        if (!openedCustomer) return;
        setDownloading(true);
        try {
            const full = await reportsService.customerOrders(openedCustomer.userId, true);
            saveCsv(
                `customer-${openedCustomer.userId}-orders.csv`,
                ["Restaurant", "Time", "Amount", "Status"],
                full.rows.map((row) => [row.shopName, formatBangkokDateTime(row.createdAt), row.amount, orderStatusLabel(row.status)]),
            );
        } catch (loadError: unknown) {
            setHistoryError(errorMessage(loadError));
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 text-foreground [&_th]:font-semibold [&_th]:!text-foreground [&_td]:!text-foreground">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-6 w-6 text-primary" />
                    <h1 className="text-lg font-semibold md:text-2xl">Reports</h1>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {DATE_PRESETS.map((preset) => (
                        <Button key={preset.id} size="sm" variant="outline" onClick={() => {
                            const range = bangkokPreset(preset.id);
                            setStartDate(range.start);
                            setEndDate(range.end);
                        }}>{preset.label}</Button>
                    ))}
                    <Label className="text-sm font-medium text-foreground">From</Label>
                    <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="h-8 w-36 text-sm text-foreground [color-scheme:light] dark:[color-scheme:dark]" />
                    <Label className="text-sm font-medium text-foreground">To</Label>
                    <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="h-8 w-36 text-sm text-foreground [color-scheme:light] dark:[color-scheme:dark]" />
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {GROUPS.map((item) => (
                    <Button key={item.id} size="sm" variant={item.id === group.id ? "secondary" : "outline"} onClick={() => setReportId(item.reports[0])}>
                        {item.label}
                    </Button>
                ))}
            </div>

            <Tabs value={reportId} onValueChange={(value) => setReportId(value as ReportId)}>
                <TabsList className="grid h-auto w-full grid-cols-2 gap-1 text-foreground sm:grid-cols-3 lg:grid-cols-6">
                    {groupReports.map((item) => {
                        const Icon = item.icon;
                        return (
                            <TabsTrigger key={item.id} value={item.id} className="h-auto gap-2 whitespace-normal px-2 py-2 text-foreground data-[state=active]:text-foreground">
                                <Icon className="h-4 w-4" />
                                {item.tab}
                            </TabsTrigger>
                        );
                    })}
                </TabsList>
            </Tabs>

            {(reportId === "shops" || reportId === "cancellations" || reportId === "losses" || reportId === "reviews") && (
            <div className="flex flex-wrap items-center gap-2">
                {reportId === "shops" && ATTENTION_FILTERS.map((filter) => (
                    <Button
                        key={filter.id}
                        size="sm"
                        variant={attentionReasons.includes(filter.id) ? "secondary" : "outline"}
                        onClick={() => setAttentionReasons((current) => current.includes(filter.id)
                            ? current.filter((id) => id !== filter.id)
                            : [...current, filter.id])}
                    >
                        {filter.label}
                    </Button>
                ))}
                {(reportId === "cancellations" || reportId === "losses") && (
                    <Select value={actor} onValueChange={setActor}>
                        <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {ACTORS.map((item) => (
                                <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
                {reportId === "reviews" && (
                    <Select value={maxRating} onValueChange={setMaxRating}>
                        <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="2">Rating at or under 2</SelectItem>
                            <SelectItem value="3">Rating at or under 3</SelectItem>
                            <SelectItem value="4">Rating at or under 4</SelectItem>
                        </SelectContent>
                    </Select>
                )}
            </div>
            )}

            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <CardTitle>{selected.title}</CardTitle>
                            <CardDescription className="text-base text-foreground">{selected.hint}</CardDescription>
                        </div>
                        <Button size="sm" variant="outline" className="gap-2" disabled={downloading || loading || dateProblem != null} onClick={() => void downloadReport()}>
                            <Download className="h-4 w-4" />
                            {downloading ? "Preparing…" : "Download"}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {dateProblem ? (
                        <p className="py-16 text-center text-sm text-destructive">{dateProblem}</p>
                    ) : loading ? <Skeleton className="h-[280px] w-full" /> : error ? (
                        <p className="py-16 text-center text-sm text-destructive">{error}</p>
                    ) : reportId === "operations" && operations ? (
                        <>
                        <Figures items={[
                            { label: "Placed", value: operations.totals.placed.toLocaleString() },
                            { label: "Delivered", value: operations.totals.delivered.toLocaleString() },
                            { label: "Picked up", value: operations.totals.pickedUp.toLocaleString() },
                            { label: "Canceled", value: operations.totals.canceled.toLocaleString() },
                            { label: "Sent to MyTogether", value: operations.totals.escalated.toLocaleString() },
                            { label: "Wait until ready", value: waitLabel(operations.totals.avgWaitMinutes) },
                        ]} />
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {column("operations", "Date", "date")}
                                    {column("operations", "Placed", "placed", "right")}
                                    {column("operations", "Delivered", "delivered", "right")}
                                    {column("operations", "Picked up", "pickedUp", "right")}
                                    {column("operations", "Canceled", "canceled", "right")}
                                    {column("operations", "Sent to MyTogether", "escalated", "right")}
                                    {column("operations", "Wait until ready", "avgWaitMinutes", "right")}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedOperations.length === 0 ? <EmptyRow cols={7} label="No days in this range." /> : sortedOperations.map((row) => (
                                    <TableRow key={row.date}>
                                        <TableCell>{row.date}</TableCell>
                                        <TableCell className="text-right tabular-nums">{row.placed.toLocaleString()}</TableCell>
                                        <TableCell className="text-right tabular-nums">{row.delivered.toLocaleString()}</TableCell>
                                        <TableCell className="text-right tabular-nums">{row.pickedUp.toLocaleString()}</TableCell>
                                        <TableCell className="text-right tabular-nums">{row.canceled.toLocaleString()}</TableCell>
                                        <TableCell className="text-right tabular-nums">{row.escalated.toLocaleString()}</TableCell>
                                        <TableCell className="text-right tabular-nums">{waitLabel(row.avgWaitMinutes)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell className="font-medium">Total</TableCell>
                                    <TableCell className="text-right tabular-nums">{operations.totals.placed.toLocaleString()}</TableCell>
                                    <TableCell className="text-right tabular-nums">{operations.totals.delivered.toLocaleString()}</TableCell>
                                    <TableCell className="text-right tabular-nums">{operations.totals.pickedUp.toLocaleString()}</TableCell>
                                    <TableCell className="text-right tabular-nums">{operations.totals.canceled.toLocaleString()}</TableCell>
                                    <TableCell className="text-right tabular-nums">{operations.totals.escalated.toLocaleString()}</TableCell>
                                    <TableCell className="text-right tabular-nums">{waitLabel(operations.totals.avgWaitMinutes)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                        </>
                    ) : reportId === "hours" && hours ? (
                        <>
                        <Figures items={[
                            { label: "Placed", value: hours.totals.placed.toLocaleString() },
                            { label: "Delivered", value: hours.totals.delivered.toLocaleString() },
                            { label: "Picked up", value: hours.totals.pickedUp.toLocaleString() },
                            { label: "Canceled", value: hours.totals.canceled.toLocaleString() },
                            { label: "Sent to MyTogether", value: hours.totals.escalated.toLocaleString() },
                            { label: "Wait until ready", value: waitLabel(hours.totals.avgWaitMinutes) },
                        ]} />
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {column("hours", "Hour", "hour")}
                                    {column("hours", "Placed", "placed", "right")}
                                    {column("hours", "Delivered", "delivered", "right")}
                                    {column("hours", "Picked up", "pickedUp", "right")}
                                    {column("hours", "Canceled", "canceled", "right")}
                                    {column("hours", "Sent to MyTogether", "escalated", "right")}
                                    {column("hours", "Wait until ready", "avgWaitMinutes", "right")}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedHours.map((row) => (
                                    <TableRow key={row.hour}>
                                        <TableCell>{hourLabel(row.hour)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{row.placed.toLocaleString()}</TableCell>
                                        <TableCell className="text-right tabular-nums">{row.delivered.toLocaleString()}</TableCell>
                                        <TableCell className="text-right tabular-nums">{row.pickedUp.toLocaleString()}</TableCell>
                                        <TableCell className="text-right tabular-nums">{row.canceled.toLocaleString()}</TableCell>
                                        <TableCell className="text-right tabular-nums">{row.escalated.toLocaleString()}</TableCell>
                                        <TableCell className="text-right tabular-nums">{waitLabel(row.avgWaitMinutes)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell className="font-medium">Total</TableCell>
                                    <TableCell className="text-right tabular-nums">{hours.totals.placed.toLocaleString()}</TableCell>
                                    <TableCell className="text-right tabular-nums">{hours.totals.delivered.toLocaleString()}</TableCell>
                                    <TableCell className="text-right tabular-nums">{hours.totals.pickedUp.toLocaleString()}</TableCell>
                                    <TableCell className="text-right tabular-nums">{hours.totals.canceled.toLocaleString()}</TableCell>
                                    <TableCell className="text-right tabular-nums">{hours.totals.escalated.toLocaleString()}</TableCell>
                                    <TableCell className="text-right tabular-nums">{waitLabel(hours.totals.avgWaitMinutes)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                        </>
                    ) : reportId === "shops" ? (
                        <>
                        <Figures items={[
                            { label: "Restaurants", value: sortedShopRows.length.toLocaleString() },
                            { label: "Orders placed", value: sortedShopRows.reduce((sum, row) => sum + row.orders, 0).toLocaleString() },
                            { label: "Completed order value", value: baht(sortedShopRows.reduce((sum, row) => sum + row.sales, 0)) },
                            { label: "Need attention", value: sortedShopRows.filter((row) => row.attention.length > 0).length.toLocaleString() },
                        ]} />
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {column("shops", "Restaurant", "shopName")}
                                    {column("shops", "Orders", "orders", "right")}
                                    {column("shops", "Completed order value", "sales", "right")}
                                    {column("shops", "Average order value", "averageOrderValue", "right")}
                                    {column("shops", "Cancel rate", "cancelRatePercent", "right")}
                                    {column("shops", "Rating", "ratingSort", "right")}
                                    {column("shops", "Reviews", "reviews", "right")}
                                    {column("shops", "Wait until ready", "avgWaitMinutes", "right")}
                                    {column("shops", "Attention", "attentionText")}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedShopRows.length === 0 ? <EmptyRow cols={9} label="No restaurants in this view." /> : sortedShopRows.map((row) => (
                                    <TableRow key={row.shopId}>
                                        <TableCell className="font-medium">
                                            <button type="button" className="text-left text-primary underline-offset-4 hover:underline" onClick={() => void openShopResult(row)}>
                                                {row.shopName}
                                            </button>
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">{row.orders.toLocaleString()}</TableCell>
                                        <TableCell className="text-right tabular-nums">{baht(row.sales)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{baht(row.averageOrderValue)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{row.cancelRatePercent.toFixed(1)}%</TableCell>
                                        <TableCell className="text-right tabular-nums">{row.ratingCount > 0 ? `${row.ratingAvg.toFixed(1)} (${row.ratingCount})` : "—"}</TableCell>
                                        <TableCell className="text-right tabular-nums">{row.reviews.toLocaleString()}</TableCell>
                                        <TableCell className="text-right tabular-nums">{waitLabel(row.avgWaitMinutes)}</TableCell>
                                        <TableCell className="text-foreground">{row.attention.join(", ") || "—"}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </>
                    ) : reportId === "cancellations" && cancellations ? (
                        <div className="space-y-3">
                            <Figures items={[
                                { label: "Canceled orders", value: cancellations.total.toLocaleString() },
                                { label: "Canceled order value", value: baht(cancellations.amountTotal || 0) },
                            ]} />
                            <ShownNote shown={cancellations.shown} total={cancellations.total} />
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {column("cancellations", "Order", "orderNo")}
                                        {column("cancellations", "Canceled", "createdAt")}
                                        {column("cancellations", "Restaurant", "shopName")}
                                        {column("cancellations", "Amount", "amount", "right")}
                                        {column("cancellations", "Who", "whoLabel")}
                                        {column("cancellations", "Reason", "reasonText")}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedCancellations.length === 0 ? <EmptyRow cols={6} label="No canceled orders in this range." /> : sortedCancellations.map((row) => (
                                        <TableRow key={row.orderId}>
                                            <TableCell className="font-medium">{row.orderNo}</TableCell>
                                            <TableCell>{formatBangkokDateTime(row.createdAt)}</TableCell>
                                            <TableCell>{row.shopName}</TableCell>
                                            <TableCell className="text-right tabular-nums">{baht(row.amount)}</TableCell>
                                            <TableCell>{actorLabel(row.canceledBy)}</TableCell>
                                            <TableCell className="max-w-[280px] truncate">{row.cancelReason || "—"}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : reportId === "losses" && losses ? (
                        <div className="space-y-6">
                            <div className="grid gap-3 md:grid-cols-3">
                                <Card><CardContent className="p-4"><p className="text-sm font-medium text-foreground">Restaurants</p><p className="text-2xl font-semibold tabular-nums">{losses.totals.restaurants.toLocaleString()}</p></CardContent></Card>
                                <Card><CardContent className="p-4"><p className="text-sm font-medium text-foreground">Canceled orders</p><p className="text-2xl font-semibold tabular-nums">{losses.totals.orders.toLocaleString()}</p></CardContent></Card>
                                <Card><CardContent className="p-4"><p className="text-sm font-medium text-foreground">Canceled order value</p><p className="text-2xl font-semibold tabular-nums text-destructive">{baht(losses.totals.lostAmount)}</p></CardContent></Card>
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-sm font-medium">By reason</h2>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {column("lossReasons", "Reason", "reason")}
                                            {column("lossReasons", "Restaurants", "restaurants", "right")}
                                            {column("lossReasons", "Orders", "orders", "right")}
                                            {column("lossReasons", "Canceled order value", "lostAmount", "right")}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedLossReasons.length === 0 ? <EmptyRow cols={4} label="No canceled orders in this range." /> : sortedLossReasons.map((row) => (
                                            <TableRow key={row.reason}>
                                                <TableCell className="font-medium">{row.reason}</TableCell>
                                                <TableCell className="text-right tabular-nums">{row.restaurants.toLocaleString()}</TableCell>
                                                <TableCell className="text-right tabular-nums">{row.orders.toLocaleString()}</TableCell>
                                                <TableCell className="text-right tabular-nums">{baht(row.lostAmount)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow>
                                            <TableCell className="font-medium">Total</TableCell>
                                            <TableCell className="text-right tabular-nums">—</TableCell>
                                            <TableCell className="text-right tabular-nums">{losses.totals.orders.toLocaleString()}</TableCell>
                                            <TableCell className="text-right tabular-nums">{baht(losses.totals.lostAmount)}</TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-sm font-medium">By restaurant</h2>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {column("lossShops", "Restaurant", "shopName")}
                                            <TableHead>Reason</TableHead>
                                            {column("lossShops", "Orders", "orders", "right")}
                                            {column("lossShops", "Canceled order value", "lostAmount", "right")}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedLossShops.length === 0 ? <EmptyRow cols={4} label="No canceled orders in this range." /> : sortedLossShops.map((shop) => (
                                            <Fragment key={shop.shopId}>
                                                <TableRow className="bg-muted/40">
                                                    <TableCell className="font-medium">
                                                        {shop.shopId > 0 ? (
                                                            <button
                                                                type="button"
                                                                className="text-left text-primary underline-offset-4 hover:underline"
                                                                onClick={() => void openShopResult(shop, actor)}
                                                            >
                                                                {shop.shopName}
                                                            </button>
                                                        ) : shop.shopName}
                                                    </TableCell>
                                                    <TableCell className="text-foreground">All reasons</TableCell>
                                                    <TableCell className="text-right tabular-nums font-medium">{shop.orders.toLocaleString()}</TableCell>
                                                    <TableCell className="text-right tabular-nums font-medium">{baht(shop.lostAmount)}</TableCell>
                                                </TableRow>
                                                {shop.reasons.map((reason) => (
                                                    <TableRow key={`${shop.shopId}-${reason.reason}`}>
                                                        <TableCell />
                                                        <TableCell>{reason.reason}</TableCell>
                                                        <TableCell className="text-right tabular-nums">{reason.orders.toLocaleString()}</TableCell>
                                                        <TableCell className="text-right tabular-nums">{baht(reason.lostAmount)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </Fragment>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    ) : reportId === "money" && money ? (
                        <div className="space-y-6">
                            <Figures items={[
                                { label: "Completed order value", value: baht(money.totals.completedAmount), note: `${money.totals.completedOrders.toLocaleString()} orders` },
                                { label: "Still open", value: baht(money.totals.openAmount), note: `${money.totals.openOrders.toLocaleString()} orders` },
                                { label: "Canceled order value", value: baht(money.totals.canceledAmount), note: `${money.totals.canceledOrders.toLocaleString()} orders` },
                                { label: "Free-delivery orders", value: money.totals.freeDeliveryOrders.toLocaleString() },
                            ]} />
                            <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {column("money", "Restaurant", "shopName")}
                                        {column("money", "Item sales", "itemSales", "right")}
                                        {column("money", "Delivery fees", "deliveryFees", "right")}
                                        {column("money", "Free-delivery orders", "freeDeliveryOrders", "right")}
                                        {column("money", "Coupon discounts", "couponDiscounts", "right")}
                                        {column("money", "Restaurant discounts", "shopDiscounts", "right")}
                                        {column("money", "Completed order value", "completedAmount", "right")}
                                        {column("money", "Still open", "openAmount", "right")}
                                        {column("money", "Canceled orders", "canceledOrders", "right")}
                                        {column("money", "Canceled order value", "canceledAmount", "right")}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedMoney.length === 0 ? <EmptyRow cols={10} label="No orders in this period." /> : sortedMoney.map((row) => (
                                        <TableRow key={row.shopId}>
                                            <TableCell className="font-medium">
                                                {row.shopId > 0 ? (
                                                    <button
                                                        type="button"
                                                        className="text-left text-primary underline-offset-4 hover:underline"
                                                        onClick={() => void openShopResult(row)}
                                                    >
                                                        {row.shopName}
                                                    </button>
                                                ) : row.shopName}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">{baht(row.itemSales)}</TableCell>
                                            <TableCell className="text-right tabular-nums">{baht(row.deliveryFees)}</TableCell>
                                            <TableCell className="text-right tabular-nums">{row.freeDeliveryOrders.toLocaleString()}</TableCell>
                                            <TableCell className="text-right tabular-nums">{baht(row.couponDiscounts)}</TableCell>
                                            <TableCell className="text-right tabular-nums">{baht(row.shopDiscounts)}</TableCell>
                                            <TableCell className="text-right tabular-nums">{baht(row.completedAmount)}</TableCell>
                                            <TableCell className="text-right tabular-nums">{baht(row.openAmount)}</TableCell>
                                            <TableCell className="text-right tabular-nums">{row.canceledOrders.toLocaleString()}</TableCell>
                                            <TableCell className="text-right tabular-nums">{baht(row.canceledAmount)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell className="font-medium">Total</TableCell>
                                        <TableCell className="text-right tabular-nums">{baht(money.totals.itemSales)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{baht(money.totals.deliveryFees)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{money.totals.freeDeliveryOrders.toLocaleString()}</TableCell>
                                        <TableCell className="text-right tabular-nums">{baht(money.totals.couponDiscounts)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{baht(money.totals.shopDiscounts)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{baht(money.totals.completedAmount)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{baht(money.totals.openAmount)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{money.totals.canceledOrders.toLocaleString()}</TableCell>
                                        <TableCell className="text-right tabular-nums">{baht(money.totals.canceledAmount)}</TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                            </div>
                            <div>
                                <h2 className="mb-2 text-sm font-medium">Payment methods on completed orders</h2>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {column("payments", "Method", "method")}
                                            {column("payments", "Orders", "orders", "right")}
                                            {column("payments", "Amount", "amount", "right")}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedPayments.length === 0 ? <EmptyRow cols={3} label="No completed orders in this period." /> : sortedPayments.map((row) => (
                                            <TableRow key={row.method}>
                                                <TableCell>{row.method}</TableCell>
                                                <TableCell className="text-right tabular-nums">{row.orders.toLocaleString()}</TableCell>
                                                <TableCell className="text-right tabular-nums">{baht(row.amount)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    ) : reportId === "menus" && menus ? (
                        <div className="space-y-3">
                            <Figures items={[
                                { label: "Dishes", value: menus.total.toLocaleString() },
                                { label: "Times ordered", value: (menus.ordersTotal || 0).toLocaleString() },
                                { label: "Sales", value: baht(menus.salesTotal || 0) },
                            ]} />
                            <ShownNote shown={menus.shown} total={menus.total} />
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {column("menus", "Dish", "dishName")}
                                        {column("menus", "Restaurant", "shopName")}
                                        {column("menus", "Views, all time", "views", "right")}
                                        {column("menus", "Likes, all time", "likes", "right")}
                                        {column("menus", "Orders", "orders", "right")}
                                        {column("menus", "Sales", "sales", "right")}
                                        {column("menus", "Orders per all-time view", "ordersPerView", "right")}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedMenus.length === 0 ? <EmptyRow cols={7} label="No dishes on completed orders in this period." /> : sortedMenus.map((row) => (
                                        <TableRow key={row.menuId}>
                                            <TableCell className="font-medium">{row.dishName}</TableCell>
                                            <TableCell>
                                                {row.shopId > 0 ? (
                                                    <button type="button" className="text-left text-primary underline-offset-4 hover:underline" onClick={() => void openShopResult({ shopId: row.shopId, shopName: row.shopName })}>
                                                        {row.shopName}
                                                    </button>
                                                ) : row.shopName}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">{row.views.toLocaleString()}</TableCell>
                                            <TableCell className="text-right tabular-nums">{row.likes.toLocaleString()}</TableCell>
                                            <TableCell className="text-right tabular-nums">{row.orders.toLocaleString()}</TableCell>
                                            <TableCell className="text-right tabular-nums">{baht(row.sales)}</TableCell>
                                            <TableCell className="text-right tabular-nums">{row.ordersPerView == null ? "—" : row.ordersPerView.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : reportId === "promotions" && promotions ? (
                        <div className="space-y-4">
                        <Figures items={[
                            { label: "Coupons", value: promotions.rows.length.toLocaleString() },
                            { label: "Redemptions", value: promotions.rows.reduce((sum, row) => sum + row.redemptions, 0).toLocaleString() },
                            { label: "Discount given", value: baht(promotions.rows.reduce((sum, row) => sum + row.discountGiven, 0)) },
                        ]} />
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {column("promotions", "Coupon", "couponName")}
                                    {column("promotions", "Restaurant", "shopName")}
                                    {column("promotions", "Type", "typeLabel")}
                                    {column("promotions", "Who can use it", "targetLabel")}
                                    {column("promotions", "Redemptions", "redemptions", "right")}
                                    {column("promotions", "Discount given", "discountGiven", "right")}
                                    {column("promotions", "Orders", "orders", "right")}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedPromotions.length === 0 ? <EmptyRow cols={7} label="No coupon use in this period." /> : sortedPromotions.map((row) => (
                                    <TableRow key={row.couponId}>
                                        <TableCell className="font-medium">{row.couponName}</TableCell>
                                        <TableCell>{row.shopName}</TableCell>
                                        <TableCell>{promoTypeLabel(row.promotionType)}</TableCell>
                                        <TableCell>{promoTargetLabel(row.target)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{row.redemptions.toLocaleString()}</TableCell>
                                        <TableCell className="text-right tabular-nums">{baht(row.discountGiven)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{row.orders.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </div>
                    ) : reportId === "reviews" && reviews ? (
                        <div className="space-y-6">
                            <div className="grid gap-3 md:grid-cols-4">
                                <Card><CardContent className="p-4"><p className="text-sm font-medium text-foreground">Delivered orders</p><p className="text-2xl font-semibold tabular-nums">{reviews.delivered.toLocaleString()}</p></CardContent></Card>
                                <Card><CardContent className="p-4"><p className="text-sm font-medium text-foreground">Reviewed</p><p className="text-2xl font-semibold tabular-nums">{reviews.reviewed.toLocaleString()}</p></CardContent></Card>
                                <Card><CardContent className="p-4"><p className="text-sm font-medium text-foreground">Review rate</p><p className="text-2xl font-semibold tabular-nums">{reviews.reviewRatePercent.toFixed(1)}%</p></CardContent></Card>
                                <Card><CardContent className="p-4"><p className="text-sm font-medium text-foreground">Average rating</p><p className="text-2xl font-semibold tabular-nums">{reviews.averageRating == null ? "—" : reviews.averageRating.toFixed(2)}</p></CardContent></Card>
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-sm font-medium">Low ratings</h2>
                                <ShownNote shown={reviews.comments.shown} total={reviews.comments.total} />
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {column("reviewComments", "Order", "orderNo")}
                                            {column("reviewComments", "Restaurant", "shopName")}
                                            {column("reviewComments", "Rating", "rating", "right")}
                                            {column("reviewComments", "Comment", "comment")}
                                            {column("reviewComments", "Time", "createdAt")}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedReviewComments.length === 0 ? <EmptyRow cols={5} label="No reviews at or under this rating." /> : sortedReviewComments.map((row) => (
                                            <TableRow key={`${row.orderNo}-${row.createdAt}`}>
                                                <TableCell className="font-medium">{row.orderNo}</TableCell>
                                                <TableCell>
                                                    {row.shopId > 0 ? (
                                                        <button type="button" className="text-left text-primary underline-offset-4 hover:underline" onClick={() => void openShopResult({ shopId: row.shopId, shopName: row.shopName })}>
                                                            {row.shopName}
                                                        </button>
                                                    ) : row.shopName}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">{row.rating.toFixed(1)}</TableCell>
                                                <TableCell className="max-w-[320px]">{row.comment || "—"}</TableCell>
                                                <TableCell>{formatBangkokDateTime(row.createdAt)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-sm font-medium">Restaurants at or under {reviews.threshold}</h2>
                                <ShownNote shown={reviews.shops.shown} total={reviews.shops.total} />
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {column("reviewShops", "Restaurant", "shopName")}
                                            {column("reviewShops", "Current rating", "ratingAvg", "right")}
                                            {column("reviewShops", "Rating count", "ratingCount", "right")}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedReviewShops.length === 0 ? <EmptyRow cols={3} label="No restaurants at or under this rating." /> : sortedReviewShops.map((row) => (
                                            <TableRow key={row.shopId}>
                                                <TableCell className="font-medium">
                                                    <button type="button" className="text-left text-primary underline-offset-4 hover:underline" onClick={() => void openShopResult(row)}>
                                                        {row.shopName}
                                                    </button>
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">{row.ratingAvg.toFixed(2)}</TableCell>
                                                <TableCell className="text-right tabular-nums">{row.ratingCount.toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    ) : reportId === "customers" && customers ? (
                        <div className="space-y-4">
                            <div className="grid gap-3 md:grid-cols-3">
                                <Card><CardContent className="p-4"><p className="text-sm font-medium text-foreground">Customers in this period</p><p className="text-2xl font-semibold tabular-nums">{customers.total.toLocaleString()}</p></CardContent></Card>
                                <Card><CardContent className="p-4"><p className="text-sm font-medium text-foreground">Ordered more than once</p><p className="text-2xl font-semibold tabular-nums">{customers.repeatCustomers.toLocaleString()}</p></CardContent></Card>
                                <Card><CardContent className="p-4"><p className="text-sm font-medium text-foreground">Ordered once so far</p><p className="text-2xl font-semibold tabular-nums">{customers.firstTimeCustomers.toLocaleString()}</p></CardContent></Card>
                            </div>
                            <ShownNote shown={customers.shown} total={customers.total} />
                            <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {column("customers", "Customer", "name")}
                                        {column("customers", "Phone", "phone")}
                                        {column("customers", "Orders in period", "ordersInRange", "right")}
                                        {column("customers", "Spent in period", "spentInRange", "right")}
                                        {column("customers", "Orders so far", "ordersSoFar", "right")}
                                        {column("customers", "Spent so far", "spentSoFar", "right")}
                                        {column("customers", "Favorite restaurant", "favoriteShop")}
                                        {column("customers", "Last order", "lastOrderAt")}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedCustomers.length === 0 ? <EmptyRow cols={8} label="No customers in this period." /> : sortedCustomers.map((row) => (
                                        <TableRow key={row.userId}>
                                            <TableCell>
                                                <button
                                                    type="button"
                                                    className="text-left font-medium text-primary underline-offset-4 hover:underline"
                                                    onClick={() => void openCustomerOrders(row)}
                                                >
                                                    {row.name}
                                                </button>
                                            </TableCell>
                                            <TableCell>{row.phone}</TableCell>
                                            <TableCell className="text-right tabular-nums">{row.ordersInRange.toLocaleString()}</TableCell>
                                            <TableCell className="text-right tabular-nums">{baht(row.spentInRange)}</TableCell>
                                            <TableCell className="text-right tabular-nums">{row.ordersSoFar.toLocaleString()}</TableCell>
                                            <TableCell className="text-right tabular-nums">{baht(row.spentSoFar)}</TableCell>
                                            <TableCell>
                                                {row.favoriteShop ? (
                                                    <div>
                                                        <div>{row.favoriteShop}</div>
                                                        <div className="text-sm text-foreground">{row.favoriteOrders.toLocaleString()} orders</div>
                                                    </div>
                                                ) : "—"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col items-start gap-1">
                                                    <span>{formatBangkokDateTime(row.lastOrderAt)}</span>
                                                    {row.goneQuiet ? (
                                                        <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-400">Gone quiet</Badge>
                                                    ) : null}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            </div>
                        </div>
                    ) : reportId === "staff" && staff ? (
                        <div className="space-y-3">
                            <ShownNote shown={staff.actors.length} total={staff.total} />
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {column("staff", "Name", "displayName")}
                                        {column("staff", "Role", "roleText")}
                                        {column("staff", "Restaurant", "shopText")}
                                        {column("staff", "Last seen", "lastSeenAt")}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedStaff.length === 0 ? <EmptyRow cols={4} label="No admins were seen on that date." /> : sortedStaff.map((actorRow) => (
                                        <TableRow key={`${actorRow.actorId}-${actorRow.shopId ?? "none"}`}>
                                            <TableCell className="font-medium">{actorRow.displayName}</TableCell>
                                            <TableCell>{actorRow.roleText}</TableCell>
                                            <TableCell>{actorRow.shopText || "—"}</TableCell>
                                            <TableCell>{formatBangkokDateTime(actorRow.lastSeenAt)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : null}
                </CardContent>
            </Card>

            <Dialog
                open={openedCustomer != null}
                onOpenChange={(open) => {
                    if (!open) {
                        historyRequest.current += 1;
                        setOpenedCustomer(null);
                        setHistory(null);
                        setHistoryError(null);
                    }
                }}
            >
                <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto text-foreground [&_th]:font-semibold [&_th]:!text-foreground [&_td]:!text-foreground">
                    <DialogHeader>
                        <DialogTitle>{openedCustomer?.name}</DialogTitle>
                        <DialogDescription className="text-base text-foreground">
                            {openedCustomer ? `${openedCustomer.phone}. Includes canceled orders.` : ""}
                        </DialogDescription>
                    </DialogHeader>
                    {historyLoading ? <Skeleton className="h-40 w-full" /> : historyError ? (
                        <p className="py-8 text-center text-sm text-destructive">{historyError}</p>
                    ) : history ? (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <ShownNote shown={history.shown} total={history.total} />
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-2"
                                    disabled={downloading}
                                    onClick={() => void downloadCustomerHistory()}
                                >
                                    <Download className="h-4 w-4" />
                                    Download
                                </Button>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {column("history", "Restaurant", "shopName")}
                                        {column("history", "Time", "createdAt")}
                                        {column("history", "Amount", "amount", "right")}
                                        {column("history", "Status", "statusLabel")}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedHistory.length === 0 ? <EmptyRow cols={4} label="No orders to show." /> : sortedHistory.map((order) => (
                                        <TableRow key={order.orderId}>
                                            <TableCell className="font-medium">{order.shopName}</TableCell>
                                            <TableCell>{formatBangkokDateTime(order.createdAt)}</TableCell>
                                            <TableCell className="text-right tabular-nums">{baht(order.amount)}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={order.status === "CANCELED" || order.status === "REJECTED" ? "destructive" : "outline"}
                                                >
                                                    {orderStatusLabel(order.status)}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>

            <Dialog
                open={openedShop != null}
                onOpenChange={(open) => {
                    if (!open) {
                        shopResultRequest.current += 1;
                        setOpenedShop(null);
                        setShopResult(null);
                        setShopResultError(null);
                        setShopResultActor("ALL");
                    }
                }}
            >
                <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto text-foreground [&_th]:font-semibold [&_th]:!text-foreground [&_td]:!text-foreground">
                    <DialogHeader>
                        <DialogTitle>{openedShop?.shopName}</DialogTitle>
                        <DialogDescription className="text-base text-foreground">
                            {shopResultActor === "ALL"
                                ? "Orders placed in this period, split into completed, still open, and canceled."
                                : `Canceled orders here are only those canceled by ${actorLabel(shopResultActor).toLowerCase()}.`}
                        </DialogDescription>
                    </DialogHeader>
                    {shopResultLoading ? <Skeleton className="h-40 w-full" /> : shopResultError ? (
                        <p className="py-8 text-center text-sm text-destructive">{shopResultError}</p>
                    ) : shopResult ? (
                        <div className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-3">
                                <Card>
                                    <CardContent className="p-4">
                                        <p className="text-sm font-medium text-foreground">Completed order value</p>
                                        <p className="text-2xl font-semibold tabular-nums">{baht(shopResult.completedAmount)}</p>
                                        <p className="text-sm text-foreground">{shopResult.completedOrders.toLocaleString()} orders</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4">
                                        <p className="text-sm font-medium text-foreground">Still open</p>
                                        <p className="text-2xl font-semibold tabular-nums">{baht(shopResult.openAmount)}</p>
                                        <p className="text-sm text-foreground">{shopResult.openOrders.toLocaleString()} orders</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4">
                                        <p className="text-sm font-medium text-foreground">Canceled order value</p>
                                        <p className="text-2xl font-semibold tabular-nums text-destructive">{baht(shopResult.canceledAmount)}</p>
                                        <p className="text-sm text-foreground">{shopResult.canceledOrders.toLocaleString()} canceled orders</p>
                                    </CardContent>
                                </Card>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {column("shopReasons", "Reason", "reason")}
                                        {column("shopReasons", "Orders", "orders", "right")}
                                        {column("shopReasons", "Canceled order value", "lostAmount", "right")}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedShopReasons.length === 0 ? <EmptyRow cols={3} label="No canceled orders in this range." /> : sortedShopReasons.map((reason) => (
                                        <TableRow key={reason.reason}>
                                            <TableCell className="font-medium">{reason.reason}</TableCell>
                                            <TableCell className="text-right tabular-nums">{reason.orders.toLocaleString()}</TableCell>
                                            <TableCell className="text-right tabular-nums">{baht(reason.lostAmount)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </div>
    );
}
