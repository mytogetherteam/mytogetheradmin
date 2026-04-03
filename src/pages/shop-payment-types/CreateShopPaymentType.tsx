import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { InfiniteSearchableSelect } from "@/components/ui/infinite-searchable-select";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ArrowLeft,
    Loader2,
    Save,
    Upload,
    X,
    QrCode,
    Store,
    Wallet
} from "lucide-react";
import { ShopPaymentTypeService } from "@/services/shopPaymentTypeService";
import { ShopService, PaymentMethodDTO } from "@/services/shopService";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import { formatImageUrl } from "@/lib/utils";

export default function CreateShopPaymentType() {
    const navigate = useNavigate();
    const { shopId: paramShopId, id } = useParams();
    const [searchParams] = useSearchParams();
    const isEdit = !!id;

    // Form State
    const [selectedShopData, setSelectedShopData] = useState<{ label: string; value: string } | null>(null);
    const selectedShopId = selectedShopData?.value || paramShopId || searchParams.get("shopId") || "";
    
    const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>("");
    const [accountName, setAccountName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [displayOrder, setDisplayOrder] = useState<number | "">(1);
    const [isActive, setIsActive] = useState(true);
    const [qrImage, setQrImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [existingQrUrl, setExistingQrUrl] = useState<string | null>(null);

    // Data State
    const [filteredMethods, setFilteredMethods] = useState<PaymentMethodDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const fetchShopData = useCallback(async (page: number, size: number, search: string) => {
        const res = await ShopService.getAllShops(page, size, search);
        return {
            content: (res?.content || []).map(s => ({
                label: s.nameEn || s.name || `Shop #${s.id}`,
                value: String(s.id),
            })),
            last: res ? page + 1 >= (res.totalPages ?? 1) : true,
        };
    }, []);

    useEffect(() => {
        // Init selected shop data from params
        const initShopId = paramShopId || searchParams.get("shopId");
        if (initShopId && !selectedShopData) {
            ShopService.getShopById(parseInt(initShopId)).then(shop => {
                setSelectedShopData({ label: shop.nameEn || shop.name, value: String(shop.id) });
            }).catch(e => console.error("Failed to fetch initial shop details", e));
        }

        const fetchData = async () => {
            // Only fetch if we are in edit mode and have the required IDs
            if (!isEdit || !paramShopId || !id) return;
            
            setLoading(true);
            try {
                const existing = await ShopPaymentTypeService.getShopPaymentTypeById(
                    parseInt(paramShopId),
                    parseInt(id)
                );
                
                setSelectedPaymentMethodId(existing.paymentMethodId.toString());
                setAccountName(existing.accountName || "");
                setAccountNumber(existing.accountNumber || "");
                setDisplayOrder(existing.displayOrder || 1);
                setIsActive(existing.isActive);
                if (existing.qrImageUrl) {
                    setExistingQrUrl(existing.qrImageUrl);
                }
            } catch (error) {
                handleApiError(error, "Failed to load required data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        // Removed selectedShopData from dependencies to prevent infinite loops/redundant fetches
    }, [isEdit, paramShopId, id, searchParams]);

    // Fetch payment methods based on selected shop
    useEffect(() => {
        if (!selectedShopId) {
            setFilteredMethods([]);
            return;
        }

        const fetchMethods = async () => {
            try {
                const results = await ShopService.getShopPaymentMethods(parseInt(selectedShopId));
                setFilteredMethods(results);

                // Clear selected payment method if it's not supported by the new shop
                // Only if not in edit mode (where it's disabled anyway)
                if (!isEdit && selectedPaymentMethodId && !results.some(m => m.id === parseInt(selectedPaymentMethodId))) {
                    setSelectedPaymentMethodId("");
                }
            } catch (error) {
                console.error("Failed to fetch shop payment methods", error);
            }
        };

        fetchMethods();
    }, [selectedShopId, isEdit, selectedPaymentMethodId]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setQrImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedShopId) return toast.error("Please select a shop");
        if (!selectedPaymentMethodId) return toast.error("Please select a payment method");

        setSubmitting(true);
        try {
            const formData = new FormData();

            // Build the JSON request blob
            const safeDisplayOrder = displayOrder === "" || displayOrder < 1 ? 1 : displayOrder;

            const requestData = isEdit
                ? {
                    accountName,
                    accountNumber,
                    isActive,
                    displayOrder: safeDisplayOrder,
                }
                : {
                    paymentMethodId: parseInt(selectedPaymentMethodId),
                    accountNumber,
                    accountName,
                    isActive,
                    displayOrder: safeDisplayOrder,
                };

            const requestBlob = new Blob([JSON.stringify(requestData)], { type: 'application/json' });
            formData.append('data', requestBlob);

            if (qrImage) {
                formData.append('qrImage', new Blob([qrImage], { type: "application/form-data" }), qrImage.name);
            }

            if (isEdit) {
                await ShopPaymentTypeService.updateShopPaymentType(
                    parseInt(selectedShopId),
                    parseInt(id!),
                    formData
                );
                toast.success("Shop payment type updated");
            } else {
                await ShopPaymentTypeService.createShopPaymentType(
                    parseInt(selectedShopId),
                    formData
                );
                toast.success("Shop payment type created");
            }
            navigate(`/shop-payment-types/manage?shopId=${selectedShopId}`);
        } catch (error) {
            handleApiError(error, isEdit ? "Failed to update" : "Failed to create");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground animate-pulse">Loading form data...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 max-w-4xl">
            <div className="mb-6">
                <Button
                    variant="ghost"
                    className="mb-4 hover:bg-transparent p-0"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to List
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">
                    {isEdit ? "Edit Shop Payment Type" : "Create Shop Payment Type"}
                </h1>
                <p className="text-muted-foreground mt-2">
                    {isEdit
                        ? "Update the QR code or account details for this shop's payment method."
                        : "Assign a payment method to a shop and upload its specific QR code."}
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Form Fields */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-solid shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Store className="h-5 w-5 text-primary" /> Shop & Method
                                </CardTitle>
                                <CardDescription>Select which shop and payment method this QR belongs to.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="shop">Shop / Restaurant</Label>
                                    <InfiniteSearchableSelect
                                        fetchData={fetchShopData}
                                        valueKey="value"
                                        labelKey="label"
                                        selectedValue={selectedShopData}
                                        onChange={(item) => setSelectedShopData(item as { label: string; value: string } | null)}
                                        placeholder="Search shop..."
                                        disabled={isEdit} // Usually shop shouldn't be changed after creation
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="paymentMethod">Payment Method</Label>
                                    <Select
                                        value={selectedPaymentMethodId}
                                        onValueChange={setSelectedPaymentMethodId}
                                        disabled={isEdit} // Swagger says paymentMethodId is not in Update request
                                    >
                                        <SelectTrigger id="paymentMethod">
                                            <SelectValue placeholder="Select payment method (e.g. KPay)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredMethods.filter(m => m.id !== undefined).map(method => (
                                                <SelectItem key={method.id} value={method.id.toString()}>
                                                    {method.name} ({method.code})
                                                </SelectItem>
                                            ))}
                                            {filteredMethods.length === 0 && selectedShopId && (
                                                <div className="p-2 text-xs text-center text-muted-foreground">
                                                    No supported payment methods found for this shop.
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {isEdit && <p className="text-[10px] text-muted-foreground">Payment method cannot be changed once created.</p>}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-solid shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Wallet className="h-5 w-5 text-primary" /> Account Details
                                </CardTitle>
                                <CardDescription>Enter the bank account or wallet info.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="accountName">Account Name</Label>
                                        <Input
                                            id="accountName"
                                            placeholder="e.g. John Doe"
                                            value={accountName}
                                            onChange={(e) => setAccountName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="accountNumber">Account / Phone Number</Label>
                                        <Input
                                            id="accountNumber"
                                            placeholder="e.g. 09123456789"
                                            value={accountNumber}
                                            onChange={(e) => setAccountNumber(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="displayOrder">Display Order</Label>
                                        <Input
                                            id="displayOrder"
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            value={displayOrder}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/^0+(?!$)/, "");
                                                if (val === "" || /^\d+$/.test(val)) {
                                                    setDisplayOrder(val === "" ? "" : parseInt(val, 10));
                                                }
                                            }}
                                            onBlur={() => {
                                                if (displayOrder === "" || displayOrder < 1) setDisplayOrder(1);
                                            }}
                                            placeholder="1"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2 pt-8">
                                        <Switch
                                            id="isActive"
                                            checked={isActive}
                                            onCheckedChange={setIsActive}
                                        />
                                        <Label htmlFor="isActive" className="cursor-pointer">Active and Visible</Label>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: QR Image */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="border-solid shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <QrCode className="h-5 w-5 text-primary" /> QR Code
                                </CardTitle>
                                <CardDescription>Upload the shop's QR code image.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg bg-muted/30">
                                    {(previewUrl || existingQrUrl) ? (
                                        <div className="relative group">
                                            <img
                                                src={previewUrl || formatImageUrl(existingQrUrl) || ""}
                                                alt="QR Preview"
                                                className="max-h-64 rounded-lg shadow-md border"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setQrImage(null);
                                                    setPreviewUrl(null);
                                                    setExistingQrUrl(null);
                                                }}
                                                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center py-10">
                                            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                                                <Upload className="h-6 w-6 text-primary" />
                                            </div>
                                            <p className="text-sm text-muted-foreground">Drag and drop or click to upload</p>
                                        </div>
                                    )}
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        className="mt-4"
                                        onChange={handleImageChange}
                                    />
                                </div>
                                <div className="text-[11px] text-muted-foreground bg-primary/5 p-3 rounded-md border border-primary/10">
                                    <p className="font-semibold text-primary mb-1">Recommendation:</p>
                                    Use a clear, square image. Supported formats: JPG, PNG, WEBP.
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-3 pt-6 border-t">
                            <Button
                                type="submit"
                                className="w-full h-12 text-lg shadow-md"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        {isEdit ? "Updating..." : "Creating..."}
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-5 w-5" />
                                        {isEdit ? "Update Payment Type" : "Save Payment Type"}
                                    </>
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => navigate(-1)}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
