import { useState, useEffect, useMemo, useRef } from "react";
import { Controller, Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  Wallet,
} from "lucide-react";
import { ShopService } from "@/services/shopService";
import { compressImage } from "@/utils/imageCompression";
import { usePaymentMethods } from "@/hooks/payment-methods/usePaymentMethod";
import {
  useCreateShopPaymentTypeMutation,
  useShopPaymentType,
  useUpdateShopPaymentTypeMutation,
} from "@/hooks/shop-payment-types/useShopPaymentType";
import {
  useAdminShopProfilesBareInfiniteFetcher,
  type AdminShopProfileDropdownShop,
} from "@/hooks/shops";
import {
  createShopPaymentTypeSchema,
  updateShopPaymentTypeSchema,
  type CreateShopPaymentTypeFormValues,
} from "@/schemas/shop-payment-type.schema";

export default function CreateShopPaymentType() {
  const navigate = useNavigate();
  const { shopId: paramShopId, id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = !!id;
  const initialShopId = paramShopId || searchParams.get("shopId") || "";
  const numericShopId =
    initialShopId && !Number.isNaN(parseInt(initialShopId, 10))
      ? parseInt(initialShopId, 10)
      : undefined;
  const numericPaymentTypeId =
    id && !Number.isNaN(parseInt(id, 10)) ? parseInt(id, 10) : undefined;

  const [selectedShopData, setSelectedShopData] =
    useState<AdminShopProfileDropdownShop | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingQrUrl, setExistingQrUrl] = useState<string | null>(null);
  const [isDraggingQr, setIsDraggingQr] = useState(false);
  const qrInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateShopPaymentTypeFormValues>({
    resolver: zodResolver(
      isEdit ? updateShopPaymentTypeSchema : createShopPaymentTypeSchema,
    ) as unknown as Resolver<CreateShopPaymentTypeFormValues>,
    defaultValues: {
      shopId: numericShopId ?? 0,
      paymentMethodId: 0,
      accountName: "",
      accountNumber: "",
      displayOrder: 1,
      isActive: true,
      qrImage: null,
    },
  });

  const { fetchShops: fetchShopData } =
    useAdminShopProfilesBareInfiniteFetcher();

  const { data: paymentMethodsResponse, isLoading: paymentMethodsLoading } =
    usePaymentMethods({
      page: 0,
      size: 200,
      isActive: true,
    });
  const { data: existingPaymentType, isPending: loadingPaymentType } =
    useShopPaymentType(numericShopId, numericPaymentTypeId);
  const filteredMethods = useMemo(() => {
    const methods = paymentMethodsResponse?.content ?? [];
    if (
      !existingPaymentType ||
      methods.some((method) => method.id === existingPaymentType.paymentMethodId)
    ) {
      return methods;
    }

    return [
      ...methods,
      {
        id: existingPaymentType.paymentMethodId,
        name: existingPaymentType.paymentMethodName,
        code: existingPaymentType.paymentMethodCode,
        isActive: existingPaymentType.isActive,
      },
    ];
  }, [existingPaymentType, paymentMethodsResponse?.content]);
  const { mutateAsync: createPaymentType, isPending: isCreating } =
    useCreateShopPaymentTypeMutation();
  const { mutateAsync: updatePaymentType, isPending: isUpdating } =
    useUpdateShopPaymentTypeMutation();
  const loading = isEdit ? loadingPaymentType : false;
  const submitting = isCreating || isUpdating;
  const selectedPaymentMethodLabel =
    existingPaymentType?.paymentMethodName ||
    filteredMethods.find(
      (method) => method.id === existingPaymentType?.paymentMethodId,
    )?.name;

  useEffect(() => {
    if (initialShopId && !selectedShopData) {
      ShopService.getAdminShopProfileById(parseInt(initialShopId, 10))
        .then((shop) => {
          const shopName = shop.nameEn || shop.name || `Shop #${shop.id}`;
          const districtName =
            (typeof shop.district === "object"
              ? shop.district?.nameEn
              : undefined) ||
            shop.districtEn ||
            shop.districtMm ||
            shop.districtTh;

          setSelectedShopData({
            ...shop,
            dropdownLabel: districtName
              ? `${shopName} (${districtName})`
              : shopName,
          });
          setValue("shopId", shop.id);
        })
        .catch((e) => console.error("Failed to fetch initial shop details", e));
    }
  }, [initialShopId, selectedShopData, setValue]);

  useEffect(() => {
    if (!isEdit || !existingPaymentType) return;

    reset({
      shopId: existingPaymentType.shopId,
      paymentMethodId: existingPaymentType.paymentMethodId,
      accountName: existingPaymentType.accountName || "",
      accountNumber: existingPaymentType.accountNumber || "",
      displayOrder: existingPaymentType.displayOrder || 1,
      isActive: existingPaymentType.isActive,
      qrImage: null,
    });
    setExistingQrUrl(existingPaymentType.qrImageUrl || null);
    setPreviewUrl(null);
  }, [existingPaymentType, isEdit, reset]);

  const setQrFile = async (originalFile?: File) => {
    if (!originalFile || !originalFile.type.startsWith("image/")) return;

    const file = await compressImage(originalFile);
    setValue("qrImage", file, { shouldDirty: true, shouldValidate: true });
    setExistingQrUrl(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await setQrFile(e.target.files?.[0]);
    e.target.value = "";
  };

  const handleQrDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingQr(false);
    await setQrFile(e.dataTransfer.files?.[0]);
  };

  const onSubmit = async (values: CreateShopPaymentTypeFormValues) => {
    if (isEdit && numericPaymentTypeId) {
      const formData = new FormData();
      const requestData = {
        accountName: values.accountName,
        accountNumber: values.accountNumber,
        isActive: values.isActive,
        displayOrder: values.displayOrder,
      };
      const requestBlob = new Blob([JSON.stringify(requestData)], {
        type: "application/json",
      });
      formData.append("data", requestBlob);
      if (values.qrImage) {
        formData.append("qrImage", values.qrImage, values.qrImage.name);
      }

      await updatePaymentType({
        shopId: values.shopId,
        id: numericPaymentTypeId,
        data: formData,
      });
      return;
    }

    await createPaymentType({
      shopId: values.shopId,
      paymentMethodId: values.paymentMethodId,
      accountName: values.accountName,
      accountNumber: values.accountNumber,
      displayOrder: values.displayOrder,
      isActive: values.isActive,
      qrImage: values.qrImage,
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground animate-pulse">
          Loading form data...
        </p>
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

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-solid shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" /> Shop & Method
                </CardTitle>
                <CardDescription>
                  Select which shop and payment method this QR belongs to.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shop">Shop / Restaurant</Label>
                  <Controller
                    control={control}
                    name="shopId"
                    render={({ field }) => (
                      <InfiniteSearchableSelect
                        fetchData={fetchShopData}
                        valueKey="id"
                        labelKey="dropdownLabel"
                        selectedValue={selectedShopData}
                        onChange={(item) => {
                          setSelectedShopData(item);
                          field.onChange(item?.id ?? 0);
                        }}
                        placeholder="Search shop..."
                        disabled={isEdit} // Usually shop shouldn't be changed after creation
                      />
                    )}
                  />
                  {errors.shopId && (
                    <p className="text-xs text-destructive">
                      {errors.shopId.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Controller
                    control={control}
                    name="paymentMethodId"
                    render={({ field }) => (
                      <Select
                        value={field.value ? String(field.value) : ""}
                        onValueChange={(value) =>
                          field.onChange(parseInt(value, 10))
                        }
                        disabled={isEdit || paymentMethodsLoading} // Swagger says paymentMethodId is not in Update request
                      >
                        <SelectTrigger id="paymentMethod">
                          {isEdit && selectedPaymentMethodLabel ? (
                            <span className="truncate">
                              {selectedPaymentMethodLabel}
                            </span>
                          ) : (
                            <SelectValue
                              placeholder={
                                paymentMethodsLoading
                                  ? "Loading payment methods..."
                                  : "Select payment method (e.g. KPay)"
                              }
                            />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {filteredMethods
                            .filter((m) => m.id !== undefined)
                            .map((method) => (
                              <SelectItem
                                key={method.id}
                                value={method.id.toString()}
                              >
                                {method.name}
                              </SelectItem>
                            ))}
                          {filteredMethods.length === 0 && (
                            <div className="p-2 text-xs text-center text-muted-foreground">
                              No active payment methods found.
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {!isEdit && errors.paymentMethodId && (
                    <p className="text-xs text-destructive">
                      {errors.paymentMethodId.message}
                    </p>
                  )}
                  {isEdit && (
                    <p className="text-[10px] text-muted-foreground">
                      Payment method cannot be changed once created.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-solid shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" /> Account Details
                </CardTitle>
                <CardDescription>
                  Enter the bank account or wallet info.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="accountName">Account Name</Label>
                    <Input
                      id="accountName"
                      placeholder="e.g. John Doe"
                      {...register("accountName")}
                    />
                    {errors.accountName && (
                      <p className="text-xs text-destructive">
                        {errors.accountName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">
                      Account / Phone Number
                    </Label>
                    <Input
                      id="accountNumber"
                      placeholder="e.g. 09123456789"
                      {...register("accountNumber")}
                    />
                    {errors.accountNumber && (
                      <p className="text-xs text-destructive">
                        {errors.accountNumber.message}
                      </p>
                    )}
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
                      {...register("displayOrder")}
                      placeholder="1"
                    />
                    {errors.displayOrder && (
                      <p className="text-xs text-destructive">
                        {errors.displayOrder.message}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 pt-8">
                    <Controller
                      control={control}
                      name="isActive"
                      render={({ field }) => (
                        <Switch
                          id="isActive"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="isActive" className="cursor-pointer">
                      Active and Visible
                    </Label>
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
                <CardDescription>
                  Upload the shop's QR code image.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => qrInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      qrInputRef.current?.click();
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingQr(true);
                  }}
                  onDragLeave={() => setIsDraggingQr(false)}
                  onDrop={handleQrDrop}
                  className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg bg-muted/30 cursor-pointer transition-colors ${
                    isDraggingQr
                      ? "border-primary bg-primary/10"
                      : "hover:border-primary/60 hover:bg-muted/50"
                  }`}
                >
                  {previewUrl || existingQrUrl ? (
                    <div className="relative group">
                      <img
                        src={previewUrl || existingQrUrl || ""}
                        alt="QR Preview"
                        className="max-h-64 rounded-lg shadow-md border"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setValue("qrImage", null, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
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
                      <p className="text-sm text-muted-foreground">
                        Drag and drop or click to upload
                      </p>
                    </div>
                  )}
                  <Input
                    ref={qrInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </div>
                <div className="text-[11px] text-muted-foreground bg-primary/5 p-3 rounded-md border border-primary/10">
                  <p className="font-semibold text-primary mb-1">
                    Recommendation:
                  </p>
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
