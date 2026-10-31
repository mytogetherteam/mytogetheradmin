import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Ban, Banknote, ClipboardList, Clock, FileSpreadsheet, Hourglass, ScrollText, Star, Store, Ticket, TrendingDown, Users, Utensils,
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
    ShopsWaitingReport,
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
import { formatBangkokDateTime, getBangkokDateString } from "@/utils/bangkokTime";

type ReportId =
    | "operations"
    | "hours"
    | "shops"
    | "waiting"
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
        title: "Operations summary",
        icon: ClipboardList,
        hint: "One row per day. Placed is every order created that day. Delivered, picked up, and canceled are the current status. Escalated orders can also appear in those columns. Kitchen wait averages only completed orders that have a wait recorded.",
    },
    {
        id: "hours",
        tab: "By hour",
        title: "Orders by hour",
        icon: Clock,
        hint: "One row per hour in Thailand time, added up across the selected dates. Placed is every order created in that hour. Delivered, picked up, and canceled are the current status. The total row matches Operations for the same dates.",
    },
    {
        id: "shops",
        tab: "Shops",
        title: "Shop scorecard",
        icon: Store,
        hint: "Testing shops are omitted. Needs attention means open with no orders, a cancel rate of 20% or more on at least 3 orders, or a rating under 3 with at least 3 orders.",
    },
    {
        id: "waiting",
        tab: "Waiting",
        title: "Shops still waiting",
        icon: Hourglass,
        hint: "Orders sitting in Pending, payment slip, or awaiting approval right now. The dates above do not change this list. Pending cancels itself at 10 minutes, after a warning at 5. A payment slip cancels itself at 20 minutes, after a warning at 10. Close to timeout is after that warning and before the cancel. Past cancel time is still open after it. Awaiting approval warns the shop at 5 minutes and does not cancel itself. Pending wait is the order time. A payment slip uses the last update. An approval that was already escalated uses the order time, because that alert rewrites the last update. Testing shops are omitted.",
    },
    {
        id: "cancellations",
        tab: "Cancellations",
        title: "Cancellation ledger",
        icon: Ban,
        hint: "Each canceled order in the range. The newest 500 are listed when there are more. Click a column heading to sort those rows.",
    },
    {
        id: "losses",
        tab: "Losses",
        title: "Lost sales by reason",
        icon: TrendingDown,
        hint: "Canceled orders grouped by restaurant and reason. Shop did not respond combines the two automatic timeouts for a restaurant that never answered. Lost is the order total.",
    },
    {
        id: "money",
        tab: "Money",
        title: "Shop money",
        icon: Banknote,
        hint: "Customers paid is the stored order total on orders that were not canceled. Lost is the order total on canceled orders. Open a restaurant to see what it made, what it lost, and the reasons.",
    },
    {
        id: "menus",
        tab: "Menus",
        title: "Menu performance",
        icon: Utensils,
        hint: "Dishes ordered in this range. Orders means separate orders, and sales is the line total. Views and likes are all-time totals. Testing shops are omitted. The top 200 by orders are listed. Click a column heading to sort those rows.",
    },
    {
        id: "promotions",
        tab: "Promotions",
        title: "Promotion ledger",
        icon: Ticket,
        hint: "Coupons redeemed or used on a non-canceled order in this range. Testing shops are omitted.",
    },
    {
        id: "customers",
        tab: "Customers",
        title: "Customers",
        icon: Users,
        hint: "Everyone who placed an order in this range is listed. Click a column heading to sort. Numbers and the last-order date start with the largest or newest at the top, and a second click reverses them. Orders so far is completed orders, and History is that same count in words. Spent so far is what they paid on those orders. Favorite restaurant is the shop those orders came from most often. Gone quiet means the last completed order was more than 30 days ago. Click a name to open that person's orders. Canceled and rejected orders are left out of the counts, the spend, and the favorite shop. Testing shops are omitted.",
    },
    {
        id: "reviews",
        tab: "Reviews",
        title: "Review record",
        icon: Star,
        hint: "Reviews are order reviews on delivered orders created in this range. Shop ratings are the shop's current rating. The lowest 200 reviews and shops are listed when there are more. Click a column heading to sort those rows.",
    },
    {
        id: "staff",
        tab: "Staff",
        title: "Staff log",
        icon: ScrollText,
        hint: "Shop staff and admins active on the To date.",
    },
];

const ACTORS = [
    { id: "ALL", label: "Everyone" },
    { id: "USER", label: "Customer" },
    { id: "SHOP", label: "Shop" },
    { id: "ADMIN", label: "Admin" },
    { id: "SYSTEM", label: "System" },
    { id: "UNSPECIFIED", label: "Unspecified" },
];

function defaultRange() {
    const end = new Date();
    const start = new Date(end.getTime() - 29 * 86_400_000);
    return { start: getBangkokDateString(start), end: getBangkokDateString(end) };
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

function waitedLabel(minutes: number) {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (hours < 48) return rest > 0 ? `${hours} hr ${rest} min` : `${hours} hr`;
    const days = Math.floor(hours / 24);
    const hourRest = hours % 24;
    return hourRest > 0 ? `${days} d ${hourRest} hr` : `${days} d`;
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
    waitingShops: { key: "oldestWaitMinutes", direction: "desc" },
    waitingOrders: { key: "waitedMinutes", direction: "desc" },
    shops: { key: "sales", direction: "desc" },
    cancellations: { key: "createdAt", direction: "desc" },
    lossReasons: { key: "lostAmount", direction: "desc" },
    lossShops: { key: "lostAmount", direction: "desc" },
    money: { key: "customersPaid", direction: "desc" },
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

function orderHistory(count: number) {
    if (count <= 0) return "No completed orders yet";
    if (count === 1) return "Ordered once";
    return `Ordered ${count.toLocaleString()} times already`;
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
            <TableCell colSpan={cols} className="h-24 text-center text-muted-foreground">{label}</TableCell>
        </TableRow>
    );
}

function ShownNote({ shown, total }: { shown: number; total: number }) {
    if (total <= shown) return null;
    return <p className="text-xs text-muted-foreground">Showing {shown.toLocaleString()} of {total.toLocaleString()}.</p>;
}

export default function ReportsPage() {
    const defaults = defaultRange();
    const [reportId, setReportId] = useState<ReportId>("operations");
    const [startDate, setStartDate] = useState(defaults.start);
    const [endDate, setEndDate] = useState(defaults.end);
    const [actor, setActor] = useState("ALL");
    const [maxRating, setMaxRating] = useState("3");
    const [sorts, setSorts] = useState<Record<string, SortConfig>>(INITIAL_SORTS);
    const [attentionOnly, setAttentionOnly] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [operations, setOperations] = useState<OperationsReport | null>(null);
    const [hours, setHours] = useState<OrdersByHourReport | null>(null);
    const [waiting, setWaiting] = useState<ShopsWaitingReport | null>(null);
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
            } else if (reportId === "waiting") {
                const result = await reportsService.shopsWaiting();
                if (current()) setWaiting(result);
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
        if (dateProblem && reportId !== "waiting") return;
        void loadReport();
    }, [dateProblem, reportId, loadReport]);

    const shopRows = attentionOnly ? shops.filter((row) => row.attention.length > 0) : shops;
    const onSort = useCallback((table: string, key: string) => {
        setSorts((current) => ({ ...current, [table]: nextReportSort(current[table], key) }));
    }, []);
    const column = (table: string, label: string, sortKey: string, align?: "left" | "right") => (
        <SortHead key={`${table}-${label}`} table={table} label={label} sortKey={sortKey} align={align} sorts={sorts} onSort={onSort} />
    );
    const sortedOperations = useMemo(() => sortData(operations?.rows ?? [], sorts.operations), [operations, sorts.operations]);
    const sortedHours = useMemo(() => sortData(hours?.rows ?? [], sorts.hours), [hours, sorts.hours]);
    const sortedWaitingShops = useMemo(() => sortData(waiting?.shops ?? [], sorts.waitingShops), [waiting, sorts.waitingShops]);
    const sortedWaitingOrders = useMemo(
        () => sortData((waiting?.orders ?? []).map((order) => ({ ...order, statusLabel: orderStatusLabel(order.status) })), sorts.waitingOrders),
        [waiting, sorts.waitingOrders],
    );
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
        () => sortData((money?.shops ?? []).map((row) => ({
            ...row,
            lostOrders: row.lostOrders ?? 0,
            lostAmount: row.lostAmount ?? 0,
        })), sorts.money),
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

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-6 w-6 text-primary" />
                    <h1 className="text-lg font-semibold md:text-2xl">Reports</h1>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="h-8 w-36 text-xs" />
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="h-8 w-36 text-xs" />
                </div>
            </div>

            <Tabs value={reportId} onValueChange={(value) => setReportId(value as ReportId)}>
                <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                    {REPORTS.map((item) => {
                        const Icon = item.icon;
                        return (
                            <TabsTrigger key={item.id} value={item.id} className="h-auto gap-2 whitespace-normal px-2 py-2">
                                <Icon className="h-4 w-4" />
                                {item.tab}
                            </TabsTrigger>
                        );
                    })}
                </TabsList>
            </Tabs>

            {(reportId === "shops" || reportId === "cancellations" || reportId === "losses" || reportId === "reviews") && (
            <div className="flex flex-wrap items-center gap-2">
                {reportId === "shops" && (
                    <Button size="sm" variant={attentionOnly ? "secondary" : "outline"} onClick={() => setAttentionOnly((value) => !value)}>
                        {attentionOnly ? "Showing needs attention" : "Needs attention"}
                    </Button>
                )}
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
                    <CardTitle>{selected.title}</CardTitle>
                    <CardDescription>{selected.hint}</CardDescription>
                </CardHeader>
                <CardContent>
                    {dateProblem && reportId !== "waiting" ? (
                        <p className="py-16 text-center text-sm text-muted-foreground">{dateProblem}</p>
                    ) : loading ? <Skeleton className="h-[280px] w-full" /> : error ? (
                        <p className="py-16 text-center text-sm text-muted-foreground">{error}</p>
                    ) : reportId === "operations" && operations ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {column("operations", "Date", "date")}
                                    {column("operations", "Placed", "placed", "right")}
                                    {column("operations", "Delivered", "delivered", "right")}
                                    {column("operations", "Picked up", "pickedUp", "right")}
                                    {column("operations", "Canceled", "canceled", "right")}
                                    {column("operations", "Escalated", "escalated", "right")}
                                    {column("operations", "Avg kitchen wait", "avgWaitMinutes", "right")}
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
                    ) : reportId === "hours" && hours ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {column("hours", "Hour", "hour")}
                                    {column("hours", "Placed", "placed", "right")}
                                    {column("hours", "Delivered", "delivered", "right")}
                                    {column("hours", "Picked up", "pickedUp", "right")}
                                    {column("hours", "Canceled", "canceled", "right")}
                                    {column("hours", "Escalated", "escalated", "right")}
                                    {column("hours", "Avg kitchen wait", "avgWaitMinutes", "right")}
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
                    ) : reportId === "waiting" && waiting ? (
                        <div className="space-y-6">
                            <div className="grid gap-3 md:grid-cols-4">
                                <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Restaurants</p><p className="text-2xl font-semibold tabular-nums">{waiting.totals.restaurants.toLocaleString()}</p></CardContent></Card>
                                <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Orders waiting</p><p className="text-2xl font-semibold tabular-nums">{waiting.totals.orders.toLocaleString()}</p></CardContent></Card>
                                <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Close to timeout</p><p className="text-2xl font-semibold tabular-nums">{waiting.totals.closeToTimeout.toLocaleString()}</p></CardContent></Card>
                                <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Past cancel time</p><p className={`text-2xl font-semibold tabular-nums ${waiting.totals.pastCancelTime > 0 ? "text-destructive" : ""}`}>{waiting.totals.pastCancelTime.toLocaleString()}</p></CardContent></Card>
                            </div>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {column("waitingShops", "Restaurant", "shopName")}
                                            {column("waitingShops", "Orders", "orders", "right")}
                                            {column("waitingShops", "Pending", "pending", "right")}
                                            {column("waitingShops", "Payment slip", "paymentSlip", "right")}
                                            {column("waitingShops", "Awaiting approval", "awaitingApproval", "right")}
                                            {column("waitingShops", "Oldest wait", "oldestWaitMinutes", "right")}
                                            {column("waitingShops", "Close to timeout", "closeToTimeout", "right")}
                                            {column("waitingShops", "Past cancel time", "pastCancelTime", "right")}
                                            {column("waitingShops", "Amount", "amount", "right")}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedWaitingShops.length === 0 ? <EmptyRow cols={9} label="No orders are waiting." /> : sortedWaitingShops.map((row) => (
                                            <TableRow key={row.shopId}>
                                                <TableCell className="font-medium">{row.shopName}</TableCell>
                                                <TableCell className="text-right tabular-nums">{row.orders.toLocaleString()}</TableCell>
                                                <TableCell className="text-right tabular-nums">{row.pending.toLocaleString()}</TableCell>
                                                <TableCell className="text-right tabular-nums">{row.paymentSlip.toLocaleString()}</TableCell>
                                                <TableCell className="text-right tabular-nums">{row.awaitingApproval.toLocaleString()}</TableCell>
                                                <TableCell className="text-right tabular-nums">{waitedLabel(row.oldestWaitMinutes)}</TableCell>
                                                <TableCell className="text-right tabular-nums">{row.closeToTimeout.toLocaleString()}</TableCell>
                                                <TableCell className={`text-right tabular-nums ${row.pastCancelTime > 0 ? "text-destructive" : ""}`}>{row.pastCancelTime.toLocaleString()}</TableCell>
                                                <TableCell className="text-right tabular-nums">{baht(row.amount)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="overflow-x-auto">
                                <h2 className="mb-2 text-sm font-medium">Orders</h2>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {column("waitingOrders", "Restaurant", "shopName")}
                                            {column("waitingOrders", "Order", "orderNo")}
                                            {column("waitingOrders", "Status", "statusLabel")}
                                            {column("waitingOrders", "Waiting", "waitedMinutes", "right")}
                                            {column("waitingOrders", "Amount", "amount", "right")}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedWaitingOrders.length === 0 ? <EmptyRow cols={5} label="No orders are waiting." /> : sortedWaitingOrders.map((order) => (
                                            <TableRow key={order.orderId}>
                                                <TableCell className="font-medium">{order.shopName}</TableCell>
                                                <TableCell>{order.orderNo}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col items-start gap-1">
                                                        <span>{orderStatusLabel(order.status)}</span>
                                                        {order.pastCancelTime ? (
                                                            <Badge variant="destructive">Past cancel time</Badge>
                                                        ) : order.closeToTimeout ? (
                                                            <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-400">Close to timeout</Badge>
                                                        ) : null}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">{waitedLabel(order.waitedMinutes)}</TableCell>
                                                <TableCell className="text-right tabular-nums">{baht(order.amount)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    ) : reportId === "shops" ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {column("shops", "Shop", "shopName")}
                                    {column("shops", "Orders", "orders", "right")}
                                    {column("shops", "Sales", "sales", "right")}
                                    {column("shops", "AOV", "averageOrderValue", "right")}
                                    {column("shops", "Cancel rate", "cancelRatePercent", "right")}
                                    {column("shops", "Rating", "ratingSort", "right")}
                                    {column("shops", "Reviews", "reviews", "right")}
                                    {column("shops", "Avg kitchen wait", "avgWaitMinutes", "right")}
                                    {column("shops", "Attention", "attentionText")}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedShopRows.length === 0 ? <EmptyRow cols={9} label="No shops in this view." /> : sortedShopRows.map((row) => (
                                    <TableRow key={row.shopId}>
                                        <TableCell className="font-medium">{row.shopName}</TableCell>
                                        <TableCell className="text-right tabular-nums">{row.orders.toLocaleString()}</TableCell>
                                        <TableCell className="text-right tabular-nums">{baht(row.sales)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{baht(row.averageOrderValue)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{row.cancelRatePercent.toFixed(1)}%</TableCell>
                                        <TableCell className="text-right tabular-nums">{row.ratingCount > 0 ? `${row.ratingAvg.toFixed(1)} (${row.ratingCount})` : "—"}</TableCell>
                                        <TableCell className="text-right tabular-nums">{row.reviews.toLocaleString()}</TableCell>
                                        <TableCell className="text-right tabular-nums">{waitLabel(row.avgWaitMinutes)}</TableCell>
                                        <TableCell className="text-muted-foreground">{row.attention.join(", ") || "—"}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : reportId === "cancellations" && cancellations ? (
                        <div className="space-y-3">
                            <ShownNote shown={cancellations.shown} total={cancellations.total} />
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {column("cancellations", "Order", "orderNo")}
                                        {column("cancellations", "Time", "createdAt")}
                                        {column("cancellations", "Shop", "shopName")}
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
                                <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Restaurants</p><p className="text-2xl font-semibold tabular-nums">{losses.totals.restaurants.toLocaleString()}</p></CardContent></Card>
                                <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Canceled orders</p><p className="text-2xl font-semibold tabular-nums">{losses.totals.orders.toLocaleString()}</p></CardContent></Card>
                                <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Lost</p><p className="text-2xl font-semibold tabular-nums text-destructive">{baht(losses.totals.lostAmount)}</p></CardContent></Card>
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-sm font-medium">By reason</h2>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {column("lossReasons", "Reason", "reason")}
                                            {column("lossReasons", "Restaurants", "restaurants", "right")}
                                            {column("lossReasons", "Orders", "orders", "right")}
                                            {column("lossReasons", "Lost", "lostAmount", "right")}
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
                                            {column("lossShops", "Lost", "lostAmount", "right")}
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
                                                    <TableCell className="text-muted-foreground">All reasons</TableCell>
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
                            <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {column("money", "Shop", "shopName")}
                                        {column("money", "Item sales", "itemSales", "right")}
                                        {column("money", "Delivery fees", "deliveryFees", "right")}
                                        {column("money", "Free delivery", "freeDeliveryOrders", "right")}
                                        {column("money", "Coupon discounts", "couponDiscounts", "right")}
                                        {column("money", "Shop discounts", "shopDiscounts", "right")}
                                        {column("money", "Customers paid", "customersPaid", "right")}
                                        {column("money", "Canceled", "lostOrders", "right")}
                                        {column("money", "Lost", "lostAmount", "right")}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedMoney.length === 0 ? <EmptyRow cols={9} label="No orders in this range." /> : sortedMoney.map((row) => (
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
                                            <TableCell className="text-right tabular-nums">{baht(row.customersPaid)}</TableCell>
                                            <TableCell className="text-right tabular-nums">{(row.lostOrders ?? 0).toLocaleString()}</TableCell>
                                            <TableCell className="text-right tabular-nums">{baht(row.lostAmount ?? 0)}</TableCell>
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
                                        <TableCell className="text-right tabular-nums">{baht(money.totals.customersPaid)}</TableCell>
                                        <TableCell className="text-right tabular-nums">{(money.totals.lostOrders ?? 0).toLocaleString()}</TableCell>
                                        <TableCell className="text-right tabular-nums">{baht(money.totals.lostAmount ?? 0)}</TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                            </div>
                            <div>
                                <h2 className="mb-2 text-sm font-medium">Payment methods</h2>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {column("payments", "Method", "method")}
                                            {column("payments", "Orders", "orders", "right")}
                                            {column("payments", "Amount", "amount", "right")}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedPayments.length === 0 ? <EmptyRow cols={3} label="No paid orders in this range." /> : sortedPayments.map((row) => (
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
                            <ShownNote shown={menus.shown} total={menus.total} />
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {column("menus", "Dish", "dishName")}
                                        {column("menus", "Shop", "shopName")}
                                        {column("menus", "Views", "views", "right")}
                                        {column("menus", "Likes", "likes", "right")}
                                        {column("menus", "Orders", "orders", "right")}
                                        {column("menus", "Sales", "sales", "right")}
                                        {column("menus", "Orders per view", "ordersPerView", "right")}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedMenus.length === 0 ? <EmptyRow cols={7} label="No dishes were ordered in this range." /> : sortedMenus.map((row) => (
                                        <TableRow key={row.menuId}>
                                            <TableCell className="font-medium">{row.dishName}</TableCell>
                                            <TableCell>{row.shopName}</TableCell>
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
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {column("promotions", "Coupon", "couponName")}
                                    {column("promotions", "Shop", "shopName")}
                                    {column("promotions", "Type", "typeLabel")}
                                    {column("promotions", "Who can use it", "targetLabel")}
                                    {column("promotions", "Redemptions", "redemptions", "right")}
                                    {column("promotions", "Discount given", "discountGiven", "right")}
                                    {column("promotions", "Orders", "orders", "right")}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedPromotions.length === 0 ? <EmptyRow cols={7} label="No coupon use in this range." /> : sortedPromotions.map((row) => (
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
                    ) : reportId === "reviews" && reviews ? (
                        <div className="space-y-6">
                            <div className="grid gap-3 md:grid-cols-4">
                                <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Delivered orders</p><p className="text-2xl font-semibold tabular-nums">{reviews.delivered.toLocaleString()}</p></CardContent></Card>
                                <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Reviewed</p><p className="text-2xl font-semibold tabular-nums">{reviews.reviewed.toLocaleString()}</p></CardContent></Card>
                                <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Review rate</p><p className="text-2xl font-semibold tabular-nums">{reviews.reviewRatePercent.toFixed(1)}%</p></CardContent></Card>
                                <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Average rating</p><p className="text-2xl font-semibold tabular-nums">{reviews.averageRating == null ? "—" : reviews.averageRating.toFixed(2)}</p></CardContent></Card>
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-sm font-medium">Low ratings</h2>
                                <ShownNote shown={reviews.comments.shown} total={reviews.comments.total} />
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {column("reviewComments", "Order", "orderNo")}
                                            {column("reviewComments", "Shop", "shopName")}
                                            {column("reviewComments", "Rating", "rating", "right")}
                                            {column("reviewComments", "Comment", "comment")}
                                            {column("reviewComments", "Time", "createdAt")}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedReviewComments.length === 0 ? <EmptyRow cols={5} label="No reviews at or under this rating." /> : sortedReviewComments.map((row) => (
                                            <TableRow key={`${row.orderNo}-${row.createdAt}`}>
                                                <TableCell className="font-medium">{row.orderNo}</TableCell>
                                                <TableCell>{row.shopName}</TableCell>
                                                <TableCell className="text-right tabular-nums">{row.rating.toFixed(1)}</TableCell>
                                                <TableCell className="max-w-[320px]">{row.comment || "—"}</TableCell>
                                                <TableCell>{formatBangkokDateTime(row.createdAt)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-sm font-medium">Shops at or under {reviews.threshold}</h2>
                                <ShownNote shown={reviews.shops.shown} total={reviews.shops.total} />
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {column("reviewShops", "Shop", "shopName")}
                                            {column("reviewShops", "Current rating", "ratingAvg", "right")}
                                            {column("reviewShops", "Rating count", "ratingCount", "right")}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedReviewShops.length === 0 ? <EmptyRow cols={3} label="No shops at or under this rating." /> : sortedReviewShops.map((row) => (
                                            <TableRow key={row.shopId}>
                                                <TableCell className="font-medium">{row.shopName}</TableCell>
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
                                <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Customers in this range</p><p className="text-2xl font-semibold tabular-nums">{customers.total.toLocaleString()}</p></CardContent></Card>
                                <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Ordered more than once</p><p className="text-2xl font-semibold tabular-nums">{customers.repeatCustomers.toLocaleString()}</p></CardContent></Card>
                                <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">First completed order</p><p className="text-2xl font-semibold tabular-nums">{customers.firstTimeCustomers.toLocaleString()}</p></CardContent></Card>
                            </div>
                            <ShownNote shown={customers.shown} total={customers.total} />
                            <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {column("customers", "Customer", "name")}
                                        {column("customers", "Phone", "phone")}
                                        {column("customers", "Orders in range", "ordersInRange", "right")}
                                        {column("customers", "Spent in range", "spentInRange", "right")}
                                        {column("customers", "Orders so far", "ordersSoFar", "right")}
                                        {column("customers", "Spent so far", "spentSoFar", "right")}
                                        {column("customers", "Favorite restaurant", "favoriteShop")}
                                        {column("customers", "History", "historyCount")}
                                        {column("customers", "Last order", "lastOrderAt")}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedCustomers.length === 0 ? <EmptyRow cols={9} label="No customers ordered in this range." /> : sortedCustomers.map((row) => (
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
                                                        <div className="text-xs text-muted-foreground">{row.favoriteOrders.toLocaleString()} orders</div>
                                                    </div>
                                                ) : "—"}
                                            </TableCell>
                                            <TableCell>{orderHistory(row.ordersSoFar)}</TableCell>
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
                                        {column("staff", "Shop", "shopText")}
                                        {column("staff", "Last seen", "lastSeenAt")}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedStaff.length === 0 ? <EmptyRow cols={4} label="No staff were active on that date." /> : sortedStaff.map((actorRow) => (
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
                <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{openedCustomer?.name}</DialogTitle>
                        <DialogDescription>
                            {openedCustomer ? `${openedCustomer.phone}. Includes canceled orders. Click a column heading to sort.` : ""}
                        </DialogDescription>
                    </DialogHeader>
                    {historyLoading ? <Skeleton className="h-40 w-full" /> : historyError ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">{historyError}</p>
                    ) : history ? (
                        <div className="space-y-2">
                            <ShownNote shown={history.shown} total={history.total} />
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {column("history", "Shop", "shopName")}
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
                <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{openedShop?.shopName}</DialogTitle>
                        <DialogDescription>
                            {shopResultActor === "ALL"
                                ? "Customers paid includes orders that are still open. Lost is the order total on every canceled order in this range."
                                : `Customers paid includes orders that are still open. Lost is limited to cancellations by ${actorLabel(shopResultActor).toLowerCase()}.`}
                        </DialogDescription>
                    </DialogHeader>
                    {shopResultLoading ? <Skeleton className="h-40 w-full" /> : shopResultError ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">{shopResultError}</p>
                    ) : shopResult ? (
                        <div className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Card>
                                    <CardContent className="p-4">
                                        <p className="text-xs uppercase text-muted-foreground">Customers paid</p>
                                        <p className="text-2xl font-semibold tabular-nums">{baht(shopResult.madeAmount)}</p>
                                        <p className="text-xs text-muted-foreground">{shopResult.madeOrders.toLocaleString()} orders</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4">
                                        <p className="text-xs uppercase text-muted-foreground">Lost</p>
                                        <p className="text-2xl font-semibold tabular-nums text-destructive">{baht(shopResult.lostAmount)}</p>
                                        <p className="text-xs text-muted-foreground">{shopResult.lostOrders.toLocaleString()} canceled orders</p>
                                    </CardContent>
                                </Card>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {column("shopReasons", "Reason", "reason")}
                                        {column("shopReasons", "Orders", "orders", "right")}
                                        {column("shopReasons", "Lost", "lostAmount", "right")}
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
