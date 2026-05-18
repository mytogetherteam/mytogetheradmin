import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { menuApprovalService, MenuApprovalDTO } from "@/services/menuApprovalService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Check, X, Store, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";

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

export default function MenuApprovalDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [approval, setApproval] = useState<MenuApprovalDTO | null>(null);
    const [loading, setLoading] = useState(true);

    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const data = await menuApprovalService.getApprovalById(Number(id));
                setApproval(data);
            } catch (e) {
                handleApiError(e, "Failed to load approval details");
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
            await menuApprovalService.approveRequest(approval.id);
            toast.success("Menu item approved successfully");
            navigate("/menus/approvals");
        } catch (e) {
            handleApiError(e, "Failed to approve menu item");
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
            await menuApprovalService.rejectRequest(approval.id, rejectReason);
            toast.success("Menu item rejected successfully");
            setRejectOpen(false);
            navigate("/menus/approvals");
        } catch (e) {
            handleApiError(e, "Failed to reject menu item");
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

    const renderJsonData = (title: string, jsonString?: string) => {
        if (!jsonString) return null;
        try {
            const data = JSON.parse(jsonString);
            if (Array.isArray(data) && data.length === 0) return null;

            return (
                <Card className="mt-4">
                    <CardHeader className="py-3">
                        <CardTitle className="text-base">{title}</CardTitle>
                    </CardHeader>
                    <CardContent className="py-3">
                        <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-64">
                            {JSON.stringify(data, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
            );
        } catch (e) {
            return null;
        }
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/menus/approvals")}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold tracking-tight">Menu Item Approval Details</h1>
                        {approval.requestType && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 uppercase text-[10px]">
                                {approval.requestType}
                            </Badge>
                        )}
                    </div>
                    <p className="text-muted-foreground">Request #{approval.id} {approval.menuItemId ? `(MenuItem #${approval.menuItemId})` : ""}</p>
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
                        <Badge
                            variant="secondary"
                            className={
                                approval.status === "APPROVED"
                                    ? "bg-green-100 text-green-800 border-green-200"
                                    : "bg-red-100 text-red-800 border-red-200"
                            }
                        >
                            Status: {approval.status.replace("_", " ")}
                        </Badge>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Menu Item Details</CardTitle>
                                    <CardDescription>Multi-language names and descriptions</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    {approval.isRecommended && <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">Recommended</Badge>}
                                    {approval.isHotDeal && <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Hot Deal</Badge>}
                                    {approval.isCombo && <Badge className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100">Combo</Badge>}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col md:flex-row items-start gap-6">
                                {approval.imageUrl ? (
                                    <img
                                        src={approval.imageUrl || ""}
                                        alt={approval.nameEn}
                                        className="h-48 w-48 rounded-lg object-cover border shadow-sm"
                                    />
                                ) : (
                                    <div className="h-48 w-48 rounded-lg bg-muted flex items-center justify-center border border-dashed">
                                        <span className="text-muted-foreground">No Image</span>
                                    </div>
                                )}
                                <div className="space-y-4 flex-1 w-full">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">English Name</p>
                                            <p className="text-lg font-semibold">{approval.nameEn || "-"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Myanmar Name</p>
                                            <p className="text-lg font-semibold">{approval.nameMm || "-"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Thai Name</p>
                                            <p className="text-lg font-semibold">{approval.nameTh || "-"}</p>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">English Description</p>
                                            <p className="text-sm text-foreground/80">{approval.descriptionEn || "No description provided."}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Myanmar Description</p>
                                            <p className="text-sm text-foreground/80">{approval.descriptionMm || "No description provided."}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Thai Description</p>
                                            <p className="text-sm text-foreground/80">{approval.descriptionTh || "No description provided."}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Pricing & Offers</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Selling Price</p>
                                    <p className="text-2xl font-bold text-primary">
                                        {new Intl.NumberFormat('en-MM', { style: 'currency', currency: 'MMK' }).format(approval.price)}
                                    </p>
                                </div>
                                {approval.originalPrice && (
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Original Price</p>
                                        <p className="text-xl font-medium text-muted-foreground line-through">
                                            {new Intl.NumberFormat('en-MM', { style: 'currency', currency: 'MMK' }).format(approval.originalPrice)}
                                        </p>
                                    </div>
                                )}
                                {(approval.discountAmount || approval.discountPercentage) && (
                                    <>
                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Discount Amt</p>
                                            <p className="text-xl font-medium text-green-600">
                                                -{new Intl.NumberFormat('en-MM', { style: 'currency', currency: 'MMK' }).format(approval.discountAmount || 0)}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Discount %</p>
                                            <p className="text-xl font-medium text-green-600">
                                                {approval.discountPercentage || 0}% OFF
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Attributes</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-2">Meal Types</p>
                                    <div className="flex flex-wrap gap-2">
                                        {approval.mealTypes ? (
                                            approval.mealTypes.split(',').map(type => (
                                                <Badge key={type} variant="secondary">{type.trim()}</Badge>
                                            ))
                                        ) : (
                                            <span className="text-sm text-muted-foreground italic">None specified</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-2">Tags</p>
                                    <div className="flex flex-wrap gap-2">
                                        {approval.tagIds ? (
                                            approval.tagIds.split(',').map(tagId => (
                                                <Badge key={tagId} variant="outline" className="font-mono">#{tagId.trim()}</Badge>
                                            ))
                                        ) : (
                                            <span className="text-sm text-muted-foreground italic">None specified</span>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Inventory & Availability</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Current Availability</span>
                                    <Badge variant={approval.isAvailable ? "default" : "secondary"}>
                                        {approval.isAvailable ? "Available" : "Unavailable"}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Recommendation Status</span>
                                    <span className="text-sm font-medium">{approval.isRecommended ? "Enabled" : "Disabled"}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Hot Deal Status</span>
                                    <span className="text-sm font-medium">{approval.isHotDeal ? "Enabled" : "Disabled"}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold px-1">Structure & Components</h3>
                        {renderJsonData("Variants Configuration", approval.variantsJson)}
                        {renderJsonData("Option Groups Configuration", approval.optionGroupsJson)}
                        {renderJsonData("Combo Components Configuration", approval.componentsJson)}
                    </div>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Metadata</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Store className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Shop</p>
                                    <p className="text-sm text-primary font-semibold">{approval.shopName || `Shop #${approval.shopId}`}</p>
                                    <p className="text-xs text-muted-foreground font-mono">ID: {approval.shopId}</p>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">Request ID</p>
                                    <p className="text-sm font-mono">{approval.id}</p>
                                </div>
                                {approval.menuItemId && (
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">Menu Item ID</p>
                                        <p className="text-sm font-mono">{approval.menuItemId}</p>
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">Menu Category ID</p>
                                    <p className="text-sm font-mono">{approval.menuCategoryId}</p>
                                </div>
                                {approval.masterCategoryId && (
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">Master Category ID</p>
                                        <p className="text-sm font-mono">{approval.masterCategoryId}</p>
                                    </div>
                                )}
                            </div>

                            <Separator />

                            <div className="flex items-center gap-3">
                                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Submitted At</p>
                                    <p className="text-sm text-muted-foreground">{formatDate(approval.submittedAt)}</p>
                                </div>
                            </div>

                            {approval.approvedAt && (
                                <>
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
                                    <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                                        <X className="h-5 w-5 text-red-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-red-900">Rejected Reason</p>
                                            <p className="text-sm text-red-700">{approval.rejectedReason}</p>
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
                        <AlertDialogTitle>Reject Menu Change</AlertDialogTitle>
                        <AlertDialogDescription>
                            Please provide a reason for rejecting this menu item change. The shop owner will be notified.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="py-4">
                        <Input
                            placeholder="Reason for rejection (e.g., Inappropriate image, Price too low)..."
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
