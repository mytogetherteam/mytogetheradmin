import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { menuApprovalService, PaymentApprovalDTO } from "@/services/menuApprovalService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Check, X, Store, Calendar as CalendarIcon, QrCode, ListOrdered } from "lucide-react";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import { formatImageUrl } from "@/lib/utils";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

export default function PaymentApprovalDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [approval, setApproval] = useState<PaymentApprovalDTO | null>(null);
    const [loading, setLoading] = useState(true);

    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const data = await menuApprovalService.getPaymentApprovalById(Number(id));
                setApproval(data);
            } catch (e) {
                handleApiError(e, "Failed to load payment approval details");
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [id]);

    const handleApprove = async () => {
        if (!approval) return;
        setIsSubmitting(true);
        try {
            await menuApprovalService.approvePaymentRequest(approval.id);
            toast.success("Payment method approved successfully");
            navigate("/menus/approvals?tab=payments"); // Assuming tab state can be managed or they just go to default
        } catch (e) {
            handleApiError(e, "Failed to approve payment method");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!approval || !rejectReason.trim()) {
            toast.error("Please provide a rejection reason");
            return;
        }

        setIsSubmitting(true);
        try {
            await menuApprovalService.rejectPaymentRequest(approval.id, rejectReason);
            toast.success("Payment method rejected successfully");
            setRejectOpen(false);
            navigate("/menus/approvals?tab=payments");
        } catch (e) {
            handleApiError(e, "Failed to reject payment method");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "N/A";
        try {
            return new Date(dateString).toLocaleString("en-US", {
                month: "short", day: "numeric", year: "numeric",
                hour: "2-digit", minute: "2-digit"
            });
        } catch {
            return dateString;
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-6 space-y-6">
                <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                <div className="h-64 w-full bg-muted animate-pulse rounded" />
            </div>
        );
    }

    if (!approval) {
        return (
            <div className="container mx-auto py-6 space-y-6 text-center">
                <h2 className="text-2xl font-bold">Approval Request Not Found</h2>
                <Button variant="outline" onClick={() => navigate("/menus/approvals")}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Approvals
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/menus/approvals")}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Payment Method Approval Details</h1>
                    <p className="text-muted-foreground">Request #{approval.id}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    {approval.status === "PENDING_APPROVAL" || approval.status === "PENDING" ? (
                        <>
                            <Button
                                variant="outline"
                                className="text-green-600 border-green-200 hover:bg-green-50"
                                onClick={handleApprove}
                                disabled={isSubmitting}
                            >
                                <Check className="mr-2 h-4 w-4" /> Approve
                            </Button>
                            <Button
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => setRejectOpen(true)}
                                disabled={isSubmitting}
                            >
                                <X className="mr-2 h-4 w-4" /> Reject
                            </Button>
                        </>
                    ) : (
                        <Badge variant="outline" className="text-sm px-3 py-1">
                            Status: {approval.status}
                        </Badge>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Requested Changes</CardTitle>
                            <CardDescription>Details of the payment method to be created or updated</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                {formatImageUrl(approval.qrImageUrl) ? (
                                    <div className="shrink-0 space-y-2 text-center">
                                        <p className="text-sm font-medium text-muted-foreground">QR Code</p>
                                        <img
                                            src={formatImageUrl(approval.qrImageUrl) || ""}
                                            alt="QR Code"
                                            className="h-48 w-48 rounded-lg object-contain border bg-white p-2"
                                        />
                                    </div>
                                ) : (
                                    <div className="shrink-0 space-y-2 text-center">
                                        <p className="text-sm font-medium text-muted-foreground">QR Code</p>
                                        <div className="h-48 w-48 rounded-lg bg-muted flex items-center justify-center">
                                            <QrCode className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-4 flex-1 w-full">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                                        <p className="text-lg font-semibold">{approval.paymentMethodName || "-"}</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Account Name</p>
                                            <p className="text-base">{approval.accountName || "-"}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Account Number</p>
                                            <p className="text-base font-mono bg-muted px-2 py-1 rounded inline-block">
                                                {approval.accountNumber || "-"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Metadata</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Store className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Shop</p>
                                    <p className="text-sm text-primary font-medium">{approval.shopName || `Shop #${approval.shopId}`}</p>
                                    <p className="text-xs text-muted-foreground font-mono">#{approval.shopId}</p>
                                </div>
                            </div>
                            <Separator />
                            <div className="flex items-center gap-3">
                                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Submitted At</p>
                                    <p className="text-sm text-muted-foreground">{formatDate(approval.submittedAt)}</p>
                                </div>
                            </div>
                            {approval.displayOrder !== undefined && (
                                <>
                                    <Separator />
                                    <div className="flex items-center gap-3">
                                        <ListOrdered className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">Display Order</p>
                                            <p className="text-sm text-muted-foreground">{approval.displayOrder}</p>
                                        </div>
                                    </div>
                                </>
                            )}
                            {approval.approvedAt && (
                                <>
                                    <Separator />
                                    <div className="flex items-center gap-3">
                                        <Check className="h-5 w-5 text-green-500" />
                                        <div>
                                            <p className="text-sm font-medium">Approved At</p>
                                            <p className="text-sm text-muted-foreground">{formatDate(approval.approvedAt)}</p>
                                        </div>
                                    </div>
                                </>
                            )}
                            {approval.rejectedReason && (
                                <>
                                    <Separator />
                                    <div className="flex items-start gap-3">
                                        <X className="h-5 w-5 text-red-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium">Rejected Reason</p>
                                            <p className="text-sm text-muted-foreground">{approval.rejectedReason}</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
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
                        >
                            {isSubmitting ? "Rejecting..." : "Confirm Rejection"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
