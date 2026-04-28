import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { menuApprovalService, PaymentApprovalDTO } from "@/services/menuApprovalService";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Check,
    X,
    CreditCard,
    QrCode,
    Eye,
    Search,
    ListOrdered
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import { formatImageUrl } from "@/lib/utils";
import { DataTablePagination } from "@/components/DataTablePagination";
import { SortableTableHead } from "@/components/SortableTableHead";
import { SortConfig, toggleSort, sortData } from "@/lib/sort-utils";
import { ShopSelect } from "@/components/ShopSelect";

export function PaymentApprovalsTab() {
    const navigate = useNavigate();
    const [approvals, setApprovals] = useState<PaymentApprovalDTO[]>([]);
    const [loading, setLoading] = useState(true);

    const [rejectId, setRejectId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [shopIdFilter, setShopIdFilter] = useState<string>("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchApprovals = useCallback(async () => {
        setLoading(true);
        try {
            const shopId = shopIdFilter ? parseInt(shopIdFilter) : undefined;
            const data = await menuApprovalService.getPendingPaymentApprovals(0, 100, debouncedSearch, shopId);
            setApprovals(data);
            setCurrentPage(1);
        } catch (e) {
            handleApiError(e, "Failed to load pending payment approvals");
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, shopIdFilter]);

    useEffect(() => {
        fetchApprovals();
    }, [fetchApprovals]);

    const handleApprove = async (id: number) => {
        setIsSubmitting(true);
        try {
            await menuApprovalService.approvePaymentRequest(id);
            toast.success("Payment method approved successfully");
            setApprovals(prev => prev.filter(a => a.id !== id));
        } catch (e) {
            handleApiError(e, "Failed to approve payment method");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!rejectId || !rejectReason.trim()) {
            toast.error("Please provide a rejection reason");
            return;
        }

        setIsSubmitting(true);
        try {
            await menuApprovalService.rejectPaymentRequest(rejectId, rejectReason);
            toast.success("Payment method rejected successfully");
            setApprovals(prev => prev.filter(a => a.id !== rejectId));
            setRejectId(null);
            setRejectReason("");
        } catch (e) {
            handleApiError(e, "Failed to reject payment method");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        try {
            const d = new Date(dateString);
            return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
        } catch {
            return dateString;
        }
    };

    const handleSort = (key: string) => {
        setSortConfig(toggleSort(sortConfig, key));
    };

    const sortedApprovals = sortData(approvals, sortConfig);
    const paginatedApprovals = sortedApprovals.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <CardTitle className="text-lg font-medium flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-primary" />
                            Pending Payment Methods
                            <Badge variant="secondary" className="ml-2">
                                {approvals.length}
                            </Badge>
                        </CardTitle>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name..."
                                    className="pl-8 w-full sm:w-[200px]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="w-full sm:w-[220px]">
                                <ShopSelect 
                                    onSelect={(id) => setShopIdFilter(id ? String(id) : "")} 
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">QR Code</TableHead>
                                    <SortableTableHead label="Shop" sortKey="shopName" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead label="Method" sortKey="paymentMethodName" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead label="Account Name" sortKey="accountName" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead label="Account Number" sortKey="accountNumber" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead label="Order" sortKey="displayOrder" sortConfig={sortConfig} onSort={handleSort} />
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <SortableTableHead label="Submitted" sortKey="submittedAt" sortConfig={sortConfig} onSort={handleSort} />
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    [...Array(pageSize)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><div className="h-10 w-10 rounded bg-muted animate-pulse" /></TableCell>
                                            <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                                            <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                                            <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                                            <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                                            <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                                            <TableCell><div className="h-6 w-24 bg-muted animate-pulse rounded-full" /></TableCell>
                                            <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                                            <TableCell className="text-right"><div className="h-8 w-20 ml-auto bg-muted animate-pulse rounded" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : paginatedApprovals.length > 0 ? (
                                    paginatedApprovals.map((approval) => (
                                        <TableRow key={approval.id}>
                                            <TableCell>
                                                {formatImageUrl(approval.qrImageUrl) ? (
                                                    <img src={formatImageUrl(approval.qrImageUrl) || ""} alt="QR Code" className="h-10 w-10 rounded object-cover border" />
                                                ) : (
                                                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                                        <QrCode className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm whitespace-nowrap">
                                                        {approval.shopName || `Shop #${approval.shopId}`}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground font-mono">#{approval.shopId}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium text-primary">
                                                {approval.paymentMethodName || '-'}
                                            </TableCell>
                                            <TableCell>{approval.accountName || '-'}</TableCell>
                                            <TableCell className="font-mono text-sm">{approval.accountNumber || '-'}</TableCell>
                                            <TableCell>
                                                {approval.displayOrder !== undefined ? (
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                        <ListOrdered className="h-3 w-3" />
                                                        {approval.displayOrder}
                                                    </div>
                                                ) : (
                                                    "-"
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {approval.requestType ? (
                                                    <Badge variant="outline">{approval.requestType}</Badge>
                                                ) : (
                                                    "-"
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge 
                                                    variant="secondary" 
                                                    className={
                                                        approval.status === "PENDING_APPROVAL" || approval.status === "PENDING"
                                                            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200"
                                                            : approval.status === "APPROVED"
                                                                ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200"
                                                                : "bg-red-100 text-red-800 hover:bg-red-100 border-red-200"
                                                    }
                                                >
                                                    {approval.status?.replace("_", " ") || "Pending"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {formatDate(approval.submittedAt)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        title="View Details"
                                                        onClick={() => navigate(`/menus/approvals/payments/${approval.id}`)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                                                        disabled={isSubmitting}
                                                        onClick={() => handleApprove(approval.id)}
                                                    >
                                                        <Check className="h-4 w-4 mr-1" />
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                                        disabled={isSubmitting}
                                                        onClick={() => {
                                                            setRejectId(approval.id);
                                                            setRejectReason("");
                                                        }}
                                                    >
                                                        <X className="h-4 w-4 mr-1" />
                                                        Reject
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <CreditCard className="h-8 w-8 text-muted/50" />
                                                <p>No pending payment approvals found.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    {!loading && (
                        <div className="mt-4">
                            <DataTablePagination
                                currentPage={currentPage}
                                totalPages={Math.ceil(approvals.length / pageSize)}
                                totalItems={approvals.length}
                                pageSize={pageSize}
                                onPageChange={setCurrentPage}
                                onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={!!rejectId} onOpenChange={(open) => !open && !isSubmitting && setRejectId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Reject Payment Method</AlertDialogTitle>
                        <AlertDialogDescription>
                            Please provide a reason for rejecting this payment method. The shop owner will be notified.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="py-4">
                        <Input
                            placeholder="Reason for rejection (e.g., Invalid QR code, Name mismatch)..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            disabled={isSubmitting}
                            autoFocus
                        />
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={isSubmitting || !rejectReason.trim()}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isSubmitting ? "Rejecting..." : "Confirm Rejection"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
