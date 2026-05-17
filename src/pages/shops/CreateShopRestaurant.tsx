import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Upload, X, Car, Wifi, Utensils, Leaf, Trash2 } from "lucide-react"
import type { PaymentMethodDTO } from "@/services/shopService"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { AsyncSelectField } from "@/components/common/AsyncSelectField"
import { Checkbox } from "@/components/ui/checkbox"
import { ShopCategoryService } from "@/services/shopCategoryService"
import { cuisineService } from "@/services/cuisineService"
import { cityService } from "@/services/cityService"
import { AdminsService } from "@/services/adminsService"
import { useCreateShopRestaurant, useShopRestaurantPaymentMethods } from "@/hooks/shops"
import { OPERATING_DAY_LABELS, ShopOperationRow } from "@/components/shop/ShopOperationRow"
import { ShopPaymentQrPreview } from "@/components/shop/ShopPaymentQrPreview"
import { Loader } from "@/components/ui/loader"

export default function CreateShopRestaurant() {
    const { form, ui, actions } = useCreateShopRestaurant()
    const watchedShopCategoryId = form.watch("shopCategoryId")
    const {
        isEditMode,
        coverPreview,
        logoPreview,
        galleryPreviews,
        existingGalleryUrls,
        deleteDialogOpen,
        deleting,
        setupData,
        paymentMethods,
        selectedCityId,
        availableDistricts,
        initialCuisineOptions,
        initialCategoryLabel,
        initialSubCategoryLabel,
        initialCityLabel,
        initialDistrictLabel,
        initialAssignedAdminLabel,
        isSubmitting,
        isLoadingShopEdit,
    } = ui

    const {
        onSubmit,
        handleCancel,
        handleDelete,
        handleCoverChange,
        handleLogoChange,
        handleGalleryChange,
        removeGalleryPhoto,
        removeExistingGalleryPhoto,
        handleCityChange,
        handleDistrictChange,
        setDeleteDialogOpen,
        clearLogoMedia,
        clearCoverMedia,
    } = actions;

    const {
        selectedShopPaymentMethods,
        sortedShopPaymentMethods,
        activeShopPaymentMethod,
        setActivePaymentMethodId,
        setShopPaymentMethods,
        updateShopPaymentMethod,
        handleInvalidSubmit,
    } = useShopRestaurantPaymentMethods(form)

    return (
        <div className="container mx-auto py-10 max-w-5xl">
            <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight truncate sm:overflow-visible sm:whitespace-normal">
                    {isEditMode ? "Edit Shop / Restaurant" : "Create Shop / Restaurant"}
                </h2>
                <p className="text-muted-foreground line-clamp-2 sm:line-clamp-none">
                    {isEditMode ? "Update establishment details." : "Add a new establishment to the platform."}
                </p>
            </div>

            {isLoadingShopEdit ? (
                <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
                    <Loader size="lg" />
                    <p className="text-sm">Loading shop…</p>
                </div>
            ) : (
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit, handleInvalidSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Main Info */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Basic Information */}
                            <Card className="border-solid">
                                <CardHeader>
                                    <CardTitle>Basic Information</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-6">
                                    <FormField
                                        control={form.control}
                                        name="nameEn"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Shop Name (English)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="e.g. My Together Cafe"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="nameMm"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Shop Name (Myanmar)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter name in Myanmar" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="nameTh"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Shop Name (Thai)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter name in Thai" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="shopCategoryId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Category</FormLabel>
                                                <FormControl>
                                                    <AsyncSelectField
                                                        label="Category"
                                                        hideLabel
                                                        fetchFunction={async (page, size, search) => {
                                                            const results = await ShopCategoryService.getShopCategories({
                                                                page,
                                                                size,
                                                                search: search || ""
                                                            });
                                                            return {
                                                                data: results.content.map(c => ({ label: c.nameEn || `Category ${c.id}`, value: String(c.id) })),
                                                                totalCount: results.totalElements,
                                                            };
                                                        }}
                                                        value={field.value ? String(field.value) : ""}
                                                        onValueChange={(val) => {
                                                            const next = val ? Number(val) : undefined
                                                            field.onChange(next)
                                                            form.setValue("shopSubCategoryId", undefined)
                                                        }}
                                                        initialValue={field.value ? {
                                                            label: setupData?.shopCategories?.find(c => Number(c.id) === Number(field.value))?.nameEn ||
                                                                initialCategoryLabel ||
                                                                "Selected",
                                                            value: String(field.value)
                                                        } : undefined}
                                                        placeholder="Select Category"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="shopSubCategoryId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Sub Category</FormLabel>
                                                <FormControl>
                                                    <AsyncSelectField
                                                        key={`shop-subcat-${watchedShopCategoryId ?? "none"}`}
                                                        label="Sub Category"
                                                        hideLabel
                                                        disabled={!watchedShopCategoryId}
                                                        fetchFunction={async (page, size, search) => {
                                                            if (!watchedShopCategoryId) {
                                                                return { data: [], totalCount: 0 }
                                                            }
                                                            const list =
                                                                await ShopCategoryService.getShopSubCategoriesByCategory(
                                                                    watchedShopCategoryId,
                                                                )
                                                            const term = (search ?? "").trim().toLowerCase()
                                                            const filtered = !term
                                                                ? list
                                                                : list.filter(
                                                                      (s) =>
                                                                          (s.nameEn ?? "")
                                                                              .toLowerCase()
                                                                              .includes(term) ||
                                                                          (s.nameMm ?? "")
                                                                              .toLowerCase()
                                                                              .includes(term) ||
                                                                          (s.nameTh ?? "")
                                                                              .toLowerCase()
                                                                              .includes(term) ||
                                                                          String(s.id).includes(term),
                                                                  )
                                                            const start = (page - 1) * size
                                                            const slice = filtered.slice(start, start + size)
                                                            return {
                                                                data: slice.map((s) => ({
                                                                    label:
                                                                        s.nameEn ||
                                                                        s.nameMm ||
                                                                        `SubCategory ${s.id}`,
                                                                    value: String(s.id),
                                                                })),
                                                                totalCount: filtered.length,
                                                            }
                                                        }}
                                                        value={field.value ? String(field.value) : ""}
                                                        onValueChange={(val) =>
                                                            field.onChange(val ? Number(val) : undefined)
                                                        }
                                                        initialValue={field.value ? {
                                                            label: initialSubCategoryLabel ||
                                                                "Selected",
                                                            value: String(field.value)
                                                        } : undefined}
                                                        placeholder={
                                                            watchedShopCategoryId
                                                                ? "Select Sub Category (Optional)"
                                                                : "Select a category first"
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="assignedAdminId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Shop admin</FormLabel>
                                                <FormControl>
                                                        <AsyncSelectField
                                                            label="Shop admin"
                                                            hideLabel
                                                            showAllOption
                                                            allOptionLabel="Select admin"
                                                            fetchFunction={async (page, size, search) => {
                                                                const results = await AdminsService.getAdminsPaginated({
                                                                    page,
                                                                    size,
                                                                    search: search || undefined,
                                                                });
                                                                return {
                                                                    data: results.content.map((a) => ({
                                                                        label: AdminsService.adminSelectLabel(a),
                                                                        value: String(a.id),
                                                                    })),
                                                                    totalCount: results.totalElements,
                                                                };
                                                            }}
                                                            value={field.value != null ? String(field.value) : ""}
                                                            onValueChange={(val) =>
                                                                field.onChange(val ? Number(val) : undefined)
                                                            }
                                                            initialValue={
                                                                field.value != null
                                                                    ? {
                                                                            label:
                                                                                initialAssignedAdminLabel ||
                                                                                `Admin #${field.value}`,
                                                                            value: String(field.value),
                                                                        }
                                                                    : undefined
                                                            }
                                                            placeholder="Search by name, email, or username…"
                                                        />
                                                    
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Separator className="my-2" />

                                    <div className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="descriptionEn"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Description (English)</FormLabel>
                                                    <FormControl>
                                                        <Textarea rows={3} className="resize-none" placeholder="Tell us about the shop in English..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="descriptionMm"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Description (Myanmar)</FormLabel>
                                                        <FormControl>
                                                            <Textarea rows={2} className="resize-none" placeholder="Description in Myanmar..." {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="descriptionTh"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Description (Thai)</FormLabel>
                                                        <FormControl>
                                                            <Textarea rows={2} className="resize-none" placeholder="Description in Thai..." {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    {/* Advanced Types: Cuisine, Meal, Delivery */}
                                    <div className="space-y-4 pt-4 border-t">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormField
                                                control={form.control}
                                                name="cuisineTypeIds"
                                                render={({ field, fieldState }) => (
                                                    <FormItem>
                                                        <FormLabel>Cuisine Types</FormLabel>
                                                        <FormControl>
                                                            <AsyncSelectField
                                                                multiple
                                                                label="Cuisine Types"
                                                                hideLabel
                                                                fetchFunction={async (page, size, search) => {
                                                                    const results = await cuisineService.getCuisines({
                                                                        page,
                                                                        size,
                                                                        search: search || ""
                                                                    });
                                                                    return {
                                                                        data: results.content.map(c => ({ label: c.nameEn || c.name || `Cuisine ${c.id}`, value: String(c.id) })),
                                                                        totalCount: results.totalElements,
                                                                    };
                                                                }}
                                                                value={field.value ? field.value.map(String) : []}
                                                                onValueChange={(vals) => field.onChange(vals.map(Number))}
                                                                initialValues={field.value?.map(id => {
                                                                    const cuisine = initialCuisineOptions?.find((c) => Number(c.value) === id);
                                                                    return {
                                                                        label: cuisine ? cuisine.label : `Cuisine ${id}`,
                                                                        value: String(id)
                                                                    };
                                                                })}
                                                                placeholder="Select Cuisines"
                                                                error={fieldState.error?.message}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="contents">
                                                <FormField
                                                    control={form.control}
                                                    name="paymentMethodIds"
                                                    render={() => (
                                                        <>
                                                        <FormItem className="pt-4">
                                                            <div className="mb-4">
                                                                <FormLabel className="text-base">Payment Methods</FormLabel>
                                                                <FormDescription>
                                                                    Select payment methods supported by this shop.
                                                                </FormDescription>
                                                            </div>
                                                            <div className="space-y-4 pt-2">
                                                                <FormField
                                                                    control={form.control}
                                                                    name="paymentMethodIds"
                                                                    render={({ field }) => (
                                                                        <div className="flex flex-wrap gap-4">
                                                                            {(paymentMethods || []).map((method: PaymentMethodDTO) => (
                                                                                <FormItem
                                                                                    key={method.id}
                                                                                    className="flex flex-row items-start space-x-3 space-y-0"
                                                                                >
                                                                                    <FormControl>
                                                                                        <Checkbox
                                                                                            checked={(field.value as number[])?.includes(method.id)}
                                                                                            onCheckedChange={(checked) => {
                                                                                                const current = (field.value as number[]) || []
                                                                                                const isChecked = checked === true
                                                                                                const nextIds = isChecked
                                                                                                    ? [...current, method.id]
                                                                                                    : current.filter((value: number) => value !== method.id)

                                                                                                field.onChange(nextIds)

                                                                                                if (isChecked) {
                                                                                                    const exists = selectedShopPaymentMethods.some(
                                                                                                        (detail) => detail.paymentMethodId === method.id,
                                                                                                    )
                                                                                                    if (!exists) {
                                                                                                        setShopPaymentMethods([
                                                                                                            ...selectedShopPaymentMethods,
                                                                                                            {
                                                                                                                paymentMethodId: method.id,
                                                                                                                accountName: "",
                                                                                                                accountNumber: "",
                                                                                                                displayOrder: selectedShopPaymentMethods.length,
                                                                                                                isActive: true,
                                                                                                                qr: null,
                                                                                                            },
                                                                                                        ])
                                                                                                    }
                                                                                                    setActivePaymentMethodId(method.id)
                                                                                                    return
                                                                                                }

                                                                                                setShopPaymentMethods(
                                                                                                    selectedShopPaymentMethods.filter(
                                                                                                        (detail) => detail.paymentMethodId !== method.id,
                                                                                                    ),
                                                                                                )
                                                                                            }}
                                                                                        />
                                                                                    </FormControl>
                                                                                    <FormLabel className="font-normal cursor-pointer flex items-center gap-2 pr-2">
                                                                                        {method.iconUrl && (
                                                                                            <img
                                                                                                src={method.iconUrl}
                                                                                                alt={method.code || method.name}
                                                                                                className="h-5 w-5 object-contain flex-shrink-0"
                                                                                                onError={(e) => (e.currentTarget.style.display = 'none')}
                                                                                            />
                                                                                        )}
                                                                                        <span className="truncate">{method.code || method.name}</span>
                                                                                    </FormLabel>
                                                                                </FormItem>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                />
                                                            </div>
                                                            <FormMessage />
                                                        </FormItem>
                                                        {activeShopPaymentMethod && (
                                                                    <div className="space-y-3 rounded-lg border bg-muted/20 p-3 md:col-span-2">
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {sortedShopPaymentMethods.map((detail) => {
                                                                                const method = paymentMethods.find(
                                                                                    (item) => item.id === detail.paymentMethodId,
                                                                                )
                                                                                const label =
                                                                                    method?.code || method?.name || `Payment ${detail.paymentMethodId}`
                                                                                const isActive = detail.paymentMethodId === activeShopPaymentMethod.paymentMethodId

                                                                                return (
                                                                                    <Button
                                                                                        key={detail.paymentMethodId}
                                                                                        type="button"
                                                                                        variant={isActive ? "default" : "outline"}
                                                                                        size="sm"
                                                                                        className="h-8 gap-1.5 px-2"
                                                                                        onClick={() => setActivePaymentMethodId(detail.paymentMethodId)}
                                                                                    >
                                                                                        {method?.iconUrl && (
                                                                                            <img
                                                                                                src={method.iconUrl}
                                                                                                alt={label}
                                                                                                className="h-4 w-4 object-contain"
                                                                                                onError={(e) => (e.currentTarget.style.display = 'none')}
                                                                                            />
                                                                                        )}
                                                                                        <span className="max-w-[110px] truncate">{label}</span>
                                                                                    </Button>
                                                                                )
                                                                            })}
                                                                        </div>

                                                                        {(() => {
                                                                            const detail = activeShopPaymentMethod
                                                                            const method = paymentMethods.find(
                                                                                (item) => item.id === detail.paymentMethodId,
                                                                            )
                                                                            const label =
                                                                                method?.code || method?.name || `Payment ${detail.paymentMethodId}`
                                                                            const detailIndex = selectedShopPaymentMethods.findIndex(
                                                                                (item) => item.paymentMethodId === detail.paymentMethodId,
                                                                            )
                                                                            const detailErrors =
                                                                                detailIndex >= 0
                                                                                    ? form.formState.errors.shopPaymentMethods?.[detailIndex]
                                                                                    : undefined

                                                                            return (
                                                                                <Card className="border-solid shadow-none">
                                                                                    <CardHeader className="p-4 pb-2">
                                                                                        <CardTitle className="flex items-center gap-2 text-base">
                                                                                            {method?.iconUrl && (
                                                                                                <img
                                                                                                    src={method.iconUrl}
                                                                                                    alt={label}
                                                                                                    className="h-5 w-5 object-contain"
                                                                                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                                                                                />
                                                                                            )}
                                                                                            {label} Info
                                                                                        </CardTitle>
                                                                                        <CardDescription>
                                                                                            Add details for the selected payment method only.
                                                                                        </CardDescription>
                                                                                    </CardHeader>
                                                                                    <CardContent className="grid gap-3 p-4 pt-2">
                                                                                        <div className="grid gap-3 sm:grid-cols-2">
                                                                                            <FormItem>
                                                                                                <FormLabel>Account Name</FormLabel>
                                                                                                <FormControl>
                                                                                                    <Input
                                                                                                        value={detail.accountName ?? ""}
                                                                                                        placeholder="e.g. My Together Cafe"
                                                                                                        onChange={(event) =>
                                                                                                            updateShopPaymentMethod(detail.paymentMethodId, {
                                                                                                                accountName: event.target.value,
                                                                                                            })
                                                                                                        }
                                                                                                    />
                                                                                                </FormControl>
                                                                                                {detailErrors?.accountName?.message && (
                                                                                                    <p className="text-sm font-medium text-destructive">
                                                                                                        {detailErrors.accountName.message}
                                                                                                    </p>
                                                                                                )}
                                                                                            </FormItem>
                                                                                            <FormItem>
                                                                                                <FormLabel>Account / Phone Number</FormLabel>
                                                                                                <FormControl>
                                                                                                    <Input
                                                                                                        value={detail.accountNumber ?? ""}
                                                                                                        placeholder="e.g. 09123456789"
                                                                                                        onChange={(event) =>
                                                                                                            updateShopPaymentMethod(detail.paymentMethodId, {
                                                                                                                accountNumber: event.target.value,
                                                                                                            })
                                                                                                        }
                                                                                                    />
                                                                                                </FormControl>
                                                                                                {detailErrors?.accountNumber?.message && (
                                                                                                    <p className="text-sm font-medium text-destructive">
                                                                                                        {detailErrors.accountNumber.message}
                                                                                                    </p>
                                                                                                )}
                                                                                            </FormItem>
                                                                                        </div>
                                                                                        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                                                                                            <FormItem>
                                                                                                <FormLabel>Display Order</FormLabel>
                                                                                                <FormControl>
                                                                                                    <Input
                                                                                                        type="number"
                                                                                                        min={0}
                                                                                                        value={detail.displayOrder ?? 0}
                                                                                                        onFocus={(event) => event.currentTarget.select()}
                                                                                                        onChange={(event) => {
                                                                                                            const displayOrder = Number(event.target.value) || 0
                                                                                                            event.currentTarget.value = String(displayOrder)
                                                                                                            updateShopPaymentMethod(detail.paymentMethodId, {
                                                                                                                displayOrder,
                                                                                                            })
                                                                                                        }}
                                                                                                    />
                                                                                                </FormControl>
                                                                                            </FormItem>
                                                                                            <FormItem className="flex items-center gap-3 pb-2">
                                                                                                <FormControl>
                                                                                                    <Switch
                                                                                                        checked={detail.isActive ?? true}
                                                                                                        onCheckedChange={(isActive) =>
                                                                                                            updateShopPaymentMethod(detail.paymentMethodId, {
                                                                                                                isActive,
                                                                                                            })
                                                                                                        }
                                                                                                    />
                                                                                                </FormControl>
                                                                                                <FormLabel className="cursor-pointer whitespace-nowrap">
                                                                                                    Active for shop
                                                                                                </FormLabel>
                                                                                            </FormItem>
                                                                                        </div>
                                                                                        <FormItem>
                                                                                            <FormLabel>QR Image</FormLabel>
                                                                                            <FormControl>
                                                                                                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-5 transition-colors hover:bg-muted/50 cursor-pointer relative">
                                                                                                    <Input
                                                                                                        type="file"
                                                                                                        accept="image/*"
                                                                                                        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                                                                                                        onChange={(event) =>
                                                                                                            updateShopPaymentMethod(detail.paymentMethodId, {
                                                                                                                qrFile: event.target.files?.[0],
                                                                                                            })
                                                                                                        }
                                                                                                    />
                                                                                                    <div className="pointer-events-none space-y-2 text-center">
                                                                                                        <div className="flex justify-center">
                                                                                                            <Upload className="h-8 w-8 text-muted-foreground" />
                                                                                                        </div>
                                                                                                        <div className="text-sm font-medium">
                                                                                                            Click to upload QR image
                                                                                                        </div>
                                                                                                        <div className="text-xs text-muted-foreground">
                                                                                                            Image file only
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </FormControl>
                                                                                            {(detail.qr || detail.qrFile) && (
                                                                                                <FormDescription>
                                                                                                    {detail.qrFile instanceof File
                                                                                                        ? `Selected: ${detail.qrFile.name}`
                                                                                                        : "Existing QR image will be kept unless you upload a new one."}
                                                                                                </FormDescription>
                                                                                            )}
                                                                                            <ShopPaymentQrPreview
                                                                                                file={detail.qrFile instanceof File ? detail.qrFile : undefined}
                                                                                                existingUrl={detail.qr}
                                                                                                label={label}
                                                                                                onRemove={() =>
                                                                                                    updateShopPaymentMethod(detail.paymentMethodId, {
                                                                                                        qr: null,
                                                                                                        qrFile: undefined,
                                                                                                    })
                                                                                                }
                                                                                            />
                                                                                        </FormItem>
                                                                                    </CardContent>
                                                                                </Card>
                                                                            )
                                                                        })()}
                                                                    </div>
                                                                )}
                                                        </>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                </CardContent>
                            </Card>

                            {/* Location */}
                            <Card className="border-solid">
                                <CardHeader>
                                    <CardTitle>Location</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-6">
                                    <div className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="addressEn"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Address (English)</FormLabel>
                                                    <FormControl>
                                                        <Textarea rows={3} className="resize-none" placeholder="Full address in English" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="addressMm"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Address (Myanmar)</FormLabel>
                                                        <FormControl>
                                                            <Textarea rows={2} className="resize-none" placeholder="Full address in Myanmar" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="addressTh"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Address (Thai)</FormLabel>
                                                        <FormControl>
                                                            <Textarea rows={2} className="resize-none" placeholder="Full address in Thai" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                City
                                            </label>
                                            <AsyncSelectField
                                                label="City"
                                                hideLabel
                                                fetchFunction={async (page, size, search) => {
                                                    const results = await cityService.getCities({
                                                        page,
                                                        size,
                                                        search: search || ""
                                                    });
                                                    return {
                                                        data: results.content.map((c: any) => ({ label: c.nameEn, value: String(c.id) })),
                                                        totalCount: results.totalElements,
                                                    };
                                                }}
                                                value={selectedCityId ? String(selectedCityId) : ""}
                                                onValueChange={(val) => val && handleCityChange(Number(val))}
                                                initialValue={selectedCityId ? {
                                                    label: initialCityLabel || "Selected City",
                                                    value: String(selectedCityId)
                                                } : undefined}
                                                placeholder="Select City"
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="districtId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>District</FormLabel>
                                                    <FormControl>
                                                        <SearchableSelect
                                                            data={availableDistricts.map(d => ({ label: d.nameEn || d.nameMm || d.name || `District ${d.id}`, value: d.id }))}
                                                            value="value"
                                                            labelKey="label"
                                                            selectedValue={field.value ? {
                                                                label: availableDistricts.find(d => d.id === field.value)?.nameEn ||
                                                                    availableDistricts.find(d => d.id === field.value)?.nameMm ||
                                                                    initialDistrictLabel ||
                                                                    "Selected District",
                                                                value: field.value
                                                            } : undefined}
                                                            onChange={(item) => item && handleDistrictChange(item.value)}
                                                            placeholder="Select District"
                                                            disabled={!selectedCityId}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>



                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Phone</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Use commas to add multi phone numbers" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email</FormLabel>
                                                    <FormControl>
                                                        <Input type="email" placeholder="contact@shop.com" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="latitude"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Latitude</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="any" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="longitude"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Longitude</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="any" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Operating Hours */}
                            <Card className="border-solid">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Utensils className="h-5 w-5 text-primary" />
                                        Operating Hours
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4">
                                        {OPERATING_DAY_LABELS.map((_, index) => (
                                            <ShopOperationRow key={index} dayIndex={index} />
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column - Status, Features, Price, Image */}
                        <div className="space-y-8">
                            {/* Media */}
                            <Card className="border-solid">
                                <CardHeader>
                                    <CardTitle>Media</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        {/* Logo Photo */}
                                        <div className="space-y-2">
                                            <div className="text-sm font-medium">Logo Photo</div>
                                            <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg hover:bg-muted/50 cursor-pointer relative transition-colors">
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                    onChange={handleLogoChange}
                                                />
                                                <div className="text-center space-y-2 pointer-events-none">
                                                    <div className="flex justify-center">
                                                        <Upload className="h-8 w-8 text-muted-foreground" />
                                                    </div>
                                                    <div className="text-sm font-medium">Click to upload logo</div>
                                                </div>
                                            </div>

                                            {logoPreview && (
                                                <div className="relative w-24 h-24 rounded-md overflow-hidden border mx-auto">
                                                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        className="absolute top-1 right-1 h-6 w-6 z-20 rounded-full"
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            clearLogoMedia()
                                                        }}
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <div className="text-sm font-medium">Cover Photo (Single)</div>
                                            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:bg-muted/50 cursor-pointer relative transition-colors">
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                    onChange={handleCoverChange}
                                                />
                                                <div className="text-center space-y-2 pointer-events-none">
                                                    <div className="flex justify-center">
                                                        <Upload className="h-10 w-10 text-muted-foreground" />
                                                    </div>
                                                    <div className="text-sm font-medium">Click to upload cover photo</div>
                                                    <div className="text-xs text-muted-foreground">Single file only</div>
                                                </div>
                                            </div>

                                            {coverPreview && (
                                                <div className="relative aspect-video rounded-md overflow-hidden border mt-3">
                                                    <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        className="absolute top-1 right-1 h-6 w-6 z-20 rounded-full"
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            clearCoverMedia()
                                                        }}
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Gallery Photos */}
                                        <div className="space-y-2">
                                            <div className="text-sm font-medium">Gallery Photos</div>

                                            {/* Existing gallery photos */}
                                            {existingGalleryUrls.length > 0 && (
                                                <div className="grid grid-cols-3 gap-2">
                                                    {existingGalleryUrls.map((url, index) => (
                                                        <div key={`existing-${index}`} className="relative aspect-square rounded-md overflow-hidden border">
                                                            <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="icon"
                                                                className="absolute top-1 right-1 h-5 w-5 z-20 rounded-full"
                                                                onClick={() => removeExistingGalleryPhoto(index)}
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* New gallery photos previews */}
                                            {galleryPreviews.length > 0 && (
                                                <div className="grid grid-cols-3 gap-2">
                                                    {galleryPreviews.map((preview, index) => (
                                                        <div key={`new-${index}`} className="relative aspect-square rounded-md overflow-hidden border">
                                                            <img src={preview} alt={`New gallery ${index + 1}`} className="w-full h-full object-cover" />
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="icon"
                                                                className="absolute top-1 right-1 h-5 w-5 z-20 rounded-full"
                                                                onClick={() => removeGalleryPhoto(index)}
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Upload button */}
                                            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    className="hidden"
                                                    onChange={handleGalleryChange}
                                                />
                                                <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                                                <div className="text-sm font-medium">Add gallery photos</div>
                                                <div className="text-xs text-muted-foreground">Multiple files supported</div>
                                            </label>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Status & Price */}
                            <Card className="border-solid">
                                <CardHeader>
                                    <CardTitle>Settings</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-6">
                                    <FormField
                                        control={form.control}
                                        name="isVerified"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Verified Shop</FormLabel>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <Separator />

                                    <FormField
                                        control={form.control}
                                        name="pricePreference"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Price Preference</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select price level" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="LOW">Low ($)</SelectItem>
                                                        <SelectItem value="MEDIUM">Medium ($$)</SelectItem>
                                                        <SelectItem value="HIGH">High ($$$)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Separator />

                                    <FormField
                                        control={form.control}
                                        name="deliveryEnabled"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/20">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Delivery Enabled</FormLabel>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="isPickUp"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/20">
                                                <div className="space-y-0.5">
                                                    <FormLabel>PickUp enabled</FormLabel>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            {/* Features */}
                            <Card className="border-solid">
                                <CardHeader>
                                    <CardTitle>Features</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-4">
                                    {([
                                        { name: "hasParking", label: "Parking Available", icon: Car },
                                        { name: "hasWifi", label: "Free Wifi", icon: Wifi },
                                        { name: "isHalal", label: "Halal Certified", icon: Utensils },
                                        { name: "isVegetarian", label: "Vegetarian Friendly", icon: Leaf },
                                    ] as const).map((feature) => (
                                        <FormField
                                            key={feature.name}
                                            control={form.control}
                                            name={feature.name}
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                    <div className="space-y-1 leading-none flex items-center gap-2">
                                                        <feature.icon className="h-4 w-4 text-muted-foreground" />
                                                        <FormLabel>{feature.label}</FormLabel>
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-6 border-t">
                        {isEditMode && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => setDeleteDialogOpen(true)}
                                disabled={isSubmitting || deleting}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Shop
                            </Button>
                        )}
                        <div className="flex gap-3 ml-auto">
                            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="lg"
                                disabled={isSubmitting}
                                className={isSubmitting ? "bg-gray-400 cursor-not-allowed whitespace-nowrap" : "whitespace-nowrap"}
                            >
                                {isSubmitting ? "Saving..." : isEditMode ? "Update Shop" : "Create Shop"}
                            </Button>
                        </div>
                    </div>
                </form>
            </Form>
            )}
            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Shop</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{form.getValues("nameEn")}</strong>?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={deleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    )
}
