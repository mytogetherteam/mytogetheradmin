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
    Eye
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
import { DataTablePagination } from "@/components/DataTablePagination";
import { SortableTableHead } from "@/components/SortableTableHead";
import { SortConfig, toggleSort, sortData } from "@/lib/sort-utils";

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

    const fetchApprovals = useCallback(async () => {
        setLoading(true);
        try {
            const data = await menuApprovalService.getPendingPaymentApprovals();
            const pendingOnly = data.filter(item => item.status === "PENDING_APPROVAL" || item.status === "PENDING");
            setApprovals(pendingOnly.length ? pendingOnly : data);
        } catch (e) {
            handleApiError(e, "Failed to load pending payment approvals");
        } finally {
            setLoading(false);
        }
    }, []);

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
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        Pending Payment Methods
                        <Badge variant="secondary" className="ml-2">
                            {approvals.length}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">QR Code</TableHead>
                                    <SortableTableHead label="Shop ID" sortKey="shopId" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead label="Method" sortKey="paymentMethodName" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead label="Account Name" sortKey="accountName" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead label="Account Number" sortKey="accountNumber" sortConfig={sortConfig} onSort={handleSort} />
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
                                            <TableCell><div className="h-4 w-12 bg-muted animate-pulse rounded" /></TableCell>
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
                                                {approval.qrImageUrl ? (
                                                    <img src={approval.qrImageUrl} alt="QR Code" className="h-10 w-10 rounded object-cover border" />
                                                ) : (
                                                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                                        <QrCode className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono">#{approval.shopId}</Badge>
                                            </TableCell>
                                            <TableCell className="font-medium text-primary">
                                                {approval.paymentMethodName || '-'}
                                            </TableCell>
                                            <TableCell>{approval.accountName || '-'}</TableCell>
                                            <TableCell className="font-mono text-sm">{approval.accountNumber || '-'}</TableCell>
                                            <TableCell>
                                                {approval.requestType ? (
                                                    <Badge variant="outline">{approval.requestType}</Badge>
                                                ) : (
                                                    "-"
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">
                                                    Pending
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
