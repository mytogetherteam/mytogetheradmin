import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Controller,
  type FieldErrors,
  type Resolver,
  useForm,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, AlertCircle, Copy, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  InfiniteSearchableSelect,
  type PageableResponse,
} from "@/components/ui/infinite-searchable-select";
import { AsyncSelectField } from "@/components/common/AsyncSelectField";
import { CouponValidityDateTimeField } from "./CouponValidityDateTimeField";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import {
  useCreateShopCouponMutation,
  useDeleteShopCouponMutation,
  useShopCoupon,
  useUpdateShopCouponMutation,
} from "@/hooks/shop-coupons/useShopCoupon";
import { useAdminShopProfilesBareInfiniteFetcher } from "@/hooks/shops";
import { menuService } from "@/services/menuService";
import {
  COUPON_LIMIT_TYPES,
  COUPON_TARGETS,
  DISCOUNT_TYPES,
  PROMOTION_TYPES,
  shopCouponSchema,
  normalizeCouponLimitType,
  normalizeCouponTarget,
  normalizeDiscountType,
  normalizePromotionType,
  type ShopCouponFormValues,
} from "@/schemas/shop-coupon.schema";
import type { CouponItemType } from "@/services/shopCouponService";
import {
  applyZodIssuesToForm,
  collectErrorMessages,
  discountTypeLabels,
  limitTypeLabels,
  mapCouponToFormValues,
  promotionTypeLabels,
  targetLabels,
} from "./create-shop-coupon.helpers";

type MenuItemOption = {
  label: string;
  value: string;
  imageUrl?: string;
  shopName?: string;
  price?: number;
};

type CouponLineItem = MenuItemOption & {
  type: CouponItemType;
  quantity: number;
};

export default function CreateShopCoupon() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const idParam = searchParams.get("id");
  const id = idParam ? parseInt(idParam, 10) : 0;
  const isEditMode = !!id;

  const [couponItems, setCouponItems] = useState<CouponLineItem[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showValidationAlert, setShowValidationAlert] = useState(false);
  const [initialShopOption, setInitialShopOption] = useState<{
    value: string;
    label: string;
  } | null>(null);

  const { fetchShops: fetchShopData } =
    useAdminShopProfilesBareInfiniteFetcher();
  const { data: coupon, isPending: loadingCoupon } = useShopCoupon(id);
  const { mutateAsync: createShopCoupon, isPending: isCreating } =
    useCreateShopCouponMutation();
  const { mutateAsync: updateShopCoupon, isPending: isUpdating } =
    useUpdateShopCouponMutation();
  const { mutateAsync: deleteShopCoupon, isPending: isDeleting } =
    useDeleteShopCouponMutation();

  const submitting = isCreating || isUpdating;
  const loading = isEditMode && loadingCoupon;

  const promotionTypeLocked =
    isEditMode &&
    !!coupon &&
    ((coupon.redeemedCount ?? 0) > 0 || (coupon.redemptionCount ?? 0) > 0);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setError,
    setValue,
    formState: { errors },
  } = useForm<ShopCouponFormValues>({
    resolver: zodResolver(shopCouponSchema) as Resolver<ShopCouponFormValues>,
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: true,
    defaultValues: {
      shopId: 0,
      name: "",
      description: "",
      promotionType: "BUY_X_GET_DISCOUNT",
      discountType: "PERCENTAGE",
      discountValue: 10,
      target: "ALL",
      validFrom: undefined,
      validUntil: undefined,
      limitType: "ONE_TIME",
      isActive: true,
      items: [],
    },
  });

  const shopId = watch("shopId");
  const promotionType = watch("promotionType");
  const targetValue = watch("target");
  const limitTypeValue = watch("limitType");
  const numericShopId = shopId > 0 ? shopId : undefined;

  useEffect(() => {
    if (!isEditMode || !coupon) return;

    reset(mapCouponToFormValues(coupon));

    setInitialShopOption({
      value: String(coupon.shopId),
      label:
        coupon.shop.nameEn ||
        coupon.shop.nameMm ||
        coupon.shop.nameTh ||
        `Shop #${coupon.shopId}`,
    });

    setCouponItems(
      coupon.items.map((item) => ({
        label:
          item.menuItem.nameEn ||
          item.menuItem.nameMm ||
          item.menuItem.nameTh ||
          `Item #${item.menuItemId}`,
        value: String(item.menuItemId),
        imageUrl: item.menuItem.imageUrl ?? undefined,
        price: item.menuItem.originalPrice ?? undefined,
        type: item.type,
        quantity: item.quantity ?? 1,
      })),
    );
    setShowValidationAlert(false);
  }, [coupon, isEditMode, reset]);

  const fetchMenuItems = useCallback(
    async (
      page: number,
      size: number,
      search: string,
    ): Promise<PageableResponse<MenuItemOption>> => {
      if (!numericShopId) {
        return { content: [], last: true };
      }

      const res = await menuService.getAllMenuItems(
        page,
        size,
        search,
        numericShopId,
        undefined,
        undefined,
        {
          isAvailable: true,
          pendingStatus: "APPROVED",
          publishStatus: "PUBLISHED",
        },
      );

      return {
        content: res.content.map((item) => ({
          label: item.nameEn || item.name || `Item #${item.id}`,
          value: String(item.id),
          imageUrl: item.imageUrl,
          shopName: item.shopName,
          price: item.price,
        })),
        last: res.last,
      };
    },
    [numericShopId],
  );

  // Keep the react-hook-form `items` field in sync with the visible
  // couponItems state so Zod validation sees the BUY/GET items the user added.
  useEffect(() => {
    setValue(
      "items",
      couponItems.map((item) => ({
        menuItemId: Number(item.value),
        type: item.type,
        quantity: item.quantity,
      })),
      { shouldValidate: showValidationAlert },
    );
  }, [couponItems, setValue, showValidationAlert]);

  const handleAddMenuItem =
    (type: CouponItemType) => (item: MenuItemOption | null) => {
      if (!item) return;
      setCouponItems((prev) => {
        // Don't add the same menu item twice under the same role.
        if (prev.some((p) => p.value === item.value && p.type === type)) {
          return prev;
        }
        return [...prev, { ...item, type, quantity: 1 }];
      });
    };

  const handleQuantityChange = (
    value: string,
    type: CouponItemType,
    quantity: number,
  ) => {
    setCouponItems((prev) =>
      prev.map((item) =>
        item.value === value && item.type === type
          ? { ...item, quantity }
          : item,
      ),
    );
  };

  const handleCopyCode = () => {
    if (!coupon?.code) return;
    navigator.clipboard?.writeText(coupon.code);
    toast.success("Coupon code copied");
  };

  const handleRemoveItem = (value: string, type: CouponItemType) => {
    setCouponItems((prev) =>
      prev.filter((item) => !(item.value === value && item.type === type)),
    );
  };

  const renderRoleColumn = (
    type: CouponItemType,
    title: string,
    placeholder: string,
    emptyHint: string,
  ) => {
    const items = couponItems.filter((item) => item.type === type);
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <Label>{title}</Label>
          <InfiniteSearchableSelect<MenuItemOption>
            key={`menu-search-${type}`}
            fetchData={fetchMenuItems}
            valueKey="value"
            labelKey="label"
            selectedValue={null}
            onChange={handleAddMenuItem(type)}
            placeholder={placeholder}
            startPage={0}
          />
        </div>
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">
            {emptyHint}
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={`${item.value}-${item.type}`}
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
              >
                <div className="min-w-0">
                  <span className="block truncate font-medium">
                    {item.label}
                  </span>
                  {item.price != null && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      ฿{item.price}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-xs text-muted-foreground">
                      {type === "BUY" ? "Buy qty" : "Free qty"}
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      value={item.quantity}
                      onChange={(e) => {
                        const next = parseInt(e.target.value, 10);
                        handleQuantityChange(
                          item.value,
                          item.type,
                          Number.isNaN(next) || next < 1 ? 1 : next,
                        );
                      }}
                      className="h-8 w-16"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(item.value, item.type)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const onInvalid = (fieldErrors: FieldErrors<ShopCouponFormValues>) => {
    setShowValidationAlert(true);
    const messages = collectErrorMessages(fieldErrors);
    toast.error("Please fix the form errors", {
      description: messages[0] ?? "Check the highlighted fields and try again.",
      duration: 8000,
    });
  };

  const onSubmit = async (values: ShopCouponFormValues) => {
    const merged: ShopCouponFormValues = {
      ...values,
      target: normalizeCouponTarget(values.target),
      limitType: normalizeCouponLimitType(values.limitType),
      discountType: normalizeDiscountType(values.discountType),
      items:
        values.promotionType === "BUY_X_GET_FREE"
          ? couponItems.map((item) => ({
            menuItemId: Number(item.value),
            type: item.type,
            quantity: item.quantity,
          }))
          : values.items,
    };

    const parsed = shopCouponSchema.safeParse(merged);
    if (!parsed.success) {
      setShowValidationAlert(true);
      applyZodIssuesToForm(parsed.error.issues, setError);
      const firstMessage =
        parsed.error.issues[0]?.message ?? "Check the highlighted fields.";
      toast.error("Please fix the form errors", {
        description: firstMessage,
        duration: 8000,
      });
      return;
    }

    setShowValidationAlert(false);
    const data = parsed.data;
    const payload = {
      shopId: data.shopId,
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      promotionType: data.promotionType,
      target: data.target,
      validFrom: data.validFrom.toISOString(),
      validUntil: data.validUntil.toISOString(),
      limitType: data.limitType,
      isActive: data.isActive,
      ...(data.promotionType === "BUY_X_GET_DISCOUNT"
        ? {
          discountType: data.discountType,
          discountValue: data.discountValue,
        }
        : {
          items: data.items,
        }),
    };

    if (isEditMode) {
      await updateShopCoupon({ id, payload });
    } else {
      await createShopCoupon(payload);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteShopCoupon(id);
    setDeleteDialogOpen(false);
    navigate("/shop-coupons/manage");
  };

  const validationMessages = useMemo(
    () => collectErrorMessages(errors),
    [errors],
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditMode ? "Edit Shop Coupon" : "Create Shop Coupon"}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode
              ? "Update this per-shop promotion for QR scan discounts."
              : "Configure a per-shop promotion for QR scan discounts on pending orders."}
          </p>
        </div>
      </div>

      {showValidationAlert && validationMessages.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Fix these issues before saving</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              {validationMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <form
        className="space-y-6"
        onSubmit={handleSubmit(onSubmit, onInvalid)}
        noValidate
      >
        <Card>
          <CardHeader>
            <CardTitle>Shop & details</CardTitle>
            <CardDescription>
              Choose the shop and give this coupon an admin label.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Controller
              name="shopId"
              control={control}
              render={({ field }) => (
                <AsyncSelectField
                  label="Shop"
                  placeholder="Select shop..."
                  value={field.value > 0 ? String(field.value) : ""}
                  initialValue={
                    initialShopOption
                      ? {
                        value: initialShopOption.value,
                        label: initialShopOption.label,
                      }
                      : undefined
                  }
                  onValueChange={(value) => {
                    const parsed = parseInt(value, 10);
                    field.onChange(Number.isNaN(parsed) ? 0 : parsed);
                    setCouponItems([]);
                    setInitialShopOption(null);
                  }}
                  fetchFunction={async (
                    page: number,
                    pageSize: number,
                    searchTerm?: string,
                  ) => {
                    const res = await fetchShopData(
                      page - 1,
                      pageSize,
                      searchTerm || "",
                    );
                    return {
                      data: res.content.map((shop) => ({
                        value: shop.id.toString(),
                        label: shop.dropdownLabel,
                      })),
                      totalCount: res.totalElements ?? 0,
                    };
                  }}
                  error={errors.shopId?.message}
                />
              )}
            />

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g. Early Bird 10%"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                placeholder="Optional internal note about this promotion."
                {...register("description")}
              />
              {errors.description && (
                <p className="text-xs text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            {isEditMode && coupon?.code && (
              <div className="space-y-2">
                <Label>Coupon code</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={coupon.code}
                    readOnly
                    className="font-mono tracking-wider"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopyCode}
                    aria-label="Copy coupon code"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Auto-generated public reference. Used by the app and QR redeem
                  flow — not editable.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Promotion</CardTitle>
            <CardDescription>
              Set the reward type and eligibility rules.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Promotion type</Label>
                <Controller
                  name="promotionType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      key={`promotion-type-${id}-${field.value ?? "BUY_X_GET_DISCOUNT"}`}
                      value={normalizePromotionType(field.value)}
                      onValueChange={field.onChange}
                      disabled={promotionTypeLocked}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROMOTION_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {promotionTypeLabels[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {promotionTypeLocked && (
                  <p className="text-xs text-muted-foreground">
                    Promotion type is locked because this coupon has already been
                    redeemed.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Target audience</Label>
                <Controller
                  name="target"
                  control={control}
                  render={({ field }) => (
                    <Select
                      key={`target-${id}-${targetValue ?? "ALL"}`}
                      value={normalizeCouponTarget(field.value)}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select target" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUPON_TARGETS.map((target) => (
                          <SelectItem key={target} value={target}>
                            {targetLabels[target]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.target && (
                  <p className="text-xs text-destructive">
                    {errors.target.message}
                  </p>
                )}
              </div>
            </div>

            {promotionType === "BUY_X_GET_DISCOUNT" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Discount type</Label>
                  <Controller
                    name="discountType"
                    control={control}
                    render={({ field }) => (
                      <Select
                        key={`discount-type-${id}-${field.value ?? "PERCENTAGE"}`}
                        value={normalizeDiscountType(field.value)}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select discount type" />
                        </SelectTrigger>
                        <SelectContent>
                          {DISCOUNT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {discountTypeLabels[type]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.discountType && (
                    <p className="text-xs text-destructive">
                      {errors.discountType.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountValue">Discount value</Label>
                  <Controller
                    name="discountValue"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="discountValue"
                        type="number"
                        min={0}
                        step="0.01"
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const next = e.target.value;
                          field.onChange(
                            next === "" ? undefined : Number(next),
                          );
                        }}
                      />
                    )}
                  />
                  {errors.discountValue && (
                    <p className="text-xs text-destructive">
                      {errors.discountValue.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {promotionType === "BUY_X_GET_FREE" && (
              <div className="space-y-4">
                {!numericShopId ? (
                  <p className="text-sm text-muted-foreground">
                    Select a shop first to add menu items.
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {renderRoleColumn(
                      "BUY",
                      "Customer buys (optional)",
                      "Search items to buy...",
                      "Optional — leave empty for a free item with no purchase required.",
                    )}
                    {renderRoleColumn(
                      "GET",
                      "Customer gets free",
                      "Search free items...",
                      "Add at least one free item the customer receives.",
                    )}
                  </div>
                )}
                {errors.items && (
                  <p className="text-xs text-destructive">{errors.items.message}</p>
                )}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="validFrom"
                control={control}
                render={({ field }) => (
                  <CouponValidityDateTimeField
                    label="Valid from"
                    value={field.value ?? null}
                    onChange={field.onChange}
                    error={errors.validFrom?.message}
                  />
                )}
              />
              <Controller
                name="validUntil"
                control={control}
                render={({ field }) => (
                  <CouponValidityDateTimeField
                    label="Valid until"
                    value={field.value ?? null}
                    onChange={field.onChange}
                    error={errors.validUntil?.message}
                  />
                )}
              />
            </div>
            <p className="-mt-2 text-xs text-muted-foreground">
              Pick a date only (defaults to 12:00 AM) or tap &quot;Set custom time&quot; when needed.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Usage limit</Label>
                <Controller
                  name="limitType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      key={`limit-${id}-${limitTypeValue ?? "ONE_TIME"}`}
                      value={normalizeCouponLimitType(field.value)}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select limit" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUPON_LIMIT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {limitTypeLabels[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.limitType && (
                  <p className="text-xs text-destructive">
                    {errors.limitType.message}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-6">
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="isActive"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <div>
                  <Label htmlFor="isActive">Active</Label>
                  <p className="text-xs text-muted-foreground">
                    Inactive coupons are hidden from the shop scan flow.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center pt-2">
          {isEditMode ? (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={submitting || isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-3 ml-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/shop-coupons/manage")}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEditMode ? (
                "Update Coupon"
              ) : (
                "Create Coupon"
              )}
            </Button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete shop coupon?"
        description="This will soft-delete the coupon. Existing redemptions and orders are kept for history."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        loading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
