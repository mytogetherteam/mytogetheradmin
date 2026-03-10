import { useState, useEffect } from "react";
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
import { ShopService, Shop, PaymentMethodDTO } from "@/services/shopService";
import { PaymentService } from "@/services/paymentService";
import { toast } from "sonner";

export default function CreateShopPaymentType() {
    const navigate = useNavigate();
    const { shopId: paramShopId, id } = useParams();
    const [searchParams] = useSearchParams();
    const isEdit = !!id;

    // Form State
    const [selectedShopId, setSelectedShopId] = useState<string>(paramShopId || searchParams.get("shopId") || "");
    const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>("");
    const [accountName, setAccountName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [displayOrder, setDisplayOrder] = useState<number | "">(1);
    const [isActive, setIsActive] = useState(true);
    const [qrImage, setQrImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [existingQrUrl, setExistingQrUrl] = useState<string | null>(null);

    // Data State
    const [shops, setShops] = useState<Shop[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethodDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [shopsRes, paymentMethodsRes] = await Promise.all([
                    ShopService.getAllShops(0, 500),
                    PaymentService.getPaymentMethods({ page: 0, size: 100 })
                ]);
                setShops(shopsRes.content);
                setPaymentMethods(paymentMethodsRes.content);

                if (isEdit && paramShopId && id) {
                    const existing = await ShopPaymentTypeService.getShopPaymentTypeById(
                        parseInt(paramShopId),
                        parseInt(id)
                    );
                    setSelectedShopId(existing.shopId.toString());
                    setSelectedPaymentMethodId(existing.paymentMethodId.toString());
                    setAccountName(existing.accountName || "");
                    setAccountNumber(existing.accountNumber || "");
                    setDisplayOrder(existing.displayOrder ?? 1);
                    setIsActive(existing.isActive);
                    if (existing.qrImageUrl) {
                        setExistingQrUrl(existing.qrImageUrl);
                    }
                }
            } catch (error) {
                console.error("Failed to load data", error);
                toast.error("Failed to load required data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [isEdit, paramShopId, id]);

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
            const requestData = isEdit ? {
                accountName,
                accountNumber,
                isActive,
                displayOrder
            } : {
                paymentMethodId: parseInt(selectedPaymentMethodId),
                accountNumber,
                accountName,
                isActive,
                displayOrder
            };

            const requestBlob = new Blob([JSON.stringify(requestData)], { type: 'application/json' });
            formData.append('request', requestBlob);

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
            console.error(error);
            toast.error(isEdit ? "Failed to update" : "Failed to create");
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
                                    <Select
                                        value={selectedShopId}
                                        onValueChange={setSelectedShopId}
                                        disabled={isEdit} // Usually shop shouldn't be changed after creation
                                    >
                                        <SelectTrigger id="shop">
                                            <SelectValue placeholder="Select a shop" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {shops.map(shop => (
                                                <SelectItem key={shop.id} value={shop.id.toString()}>
                                                    {shop.nameEn || shop.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                                            {paymentMethods.map(method => (
                                                <SelectItem key={method.id} value={method.id.toString()}>
                                                    {method.name} ({method.code})
                                                </SelectItem>
                                            ))}
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
                                            value={displayOrder}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === "" || /^\d+$/.test(val)) setDisplayOrder(val === "" ? 1 : parseInt(val));
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
                                                src={previewUrl || existingQrUrl!}
                                                alt="QR Preview"
                                                className="max-h-64 rounded-lg shadow-md border"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setQrImage(null);
                                                    setPreviewUrl(null);
                                                    if (!previewUrl) setExistingQrUrl(null);
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
