import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  useDeleteShopCouponMutation,
  useShopCoupons,
} from "@/hooks/shop-coupons/useShopCoupon";
import { useAdminShopProfilesBareInfiniteFetcher } from "@/hooks/shops";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { DataTablePagination } from "@/components/DataTablePagination";
import { AsyncSelectField } from "@/components/common/AsyncSelectField";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ShopCouponListItem } from "@/services/shopCouponService";

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function shopLabel(coupon: ShopCouponListItem) {
  return (
    coupon.shop.nameEn ||
    coupon.shop.nameMm ||
    coupon.shop.nameTh ||
    `Shop #${coupon.shopId}`
  );
}

function promotionSummary(coupon: ShopCouponListItem) {
  if (coupon.promotionType === "BUY_X_GET_FREE") {
    return `Buy X Get Free (${coupon.itemCount} items)`;
  }
  if (coupon.discountType === "PERCENTAGE") {
    return `${coupon.discountValue}% off`;
  }
  if (coupon.discountType === "FIXED_AMOUNT") {
    return `฿${coupon.discountValue} off`;
  }
  return "Discount";
}

function targetLabel(target: ShopCouponListItem["target"]) {
  return target === "EARLY_BIRD" ? "Early bird" : "All users";
}

function limitLabel(limitType: ShopCouponListItem["limitType"]) {
  return limitType === "PERMANENT" ? "Reusable" : "One-time";
}

function couponStatusBadge(coupon: ShopCouponListItem): {
  label: "Active" | "Inactive";
  variant: "default" | "secondary";
} {
  const now = Date.now();
  const from = new Date(coupon.validFrom).getTime();
  const until = new Date(coupon.validUntil).getTime();

  const isActive =
    coupon.isCurrentlyValid ??
    (coupon.isActive && now >= from && now <= until);

  return isActive
    ? { label: "Active", variant: "default" }
    : { label: "Inactive", variant: "secondary" };
}

export default function ManageShopCoupons() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [shopFilter, setShopFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: number;
    name: string;
  }>({ open: false, id: 0, name: "" });

  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const isFirstSearchDebounce = useRef(true);
  const [, setStatusTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setStatusTick((t) => t + 1), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const delayMs = isFirstSearchDebounce.current ? 0 : 500;
    isFirstSearchDebounce.current = false;
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), delayMs);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { fetchShops: fetchShopData } =
    useAdminShopProfilesBareInfiniteFetcher();

  const shopIdFilter =
    shopFilter && !Number.isNaN(parseInt(shopFilter, 10))
      ? parseInt(shopFilter, 10)
      : undefined;

  const { data, isPending: loading } = useShopCoupons({
    page: currentPage,
    size: pageSize,
    search: debouncedSearch.trim() || undefined,
    shopId: shopIdFilter,
    isActive:
      activeFilter === "all"
        ? undefined
        : activeFilter === "active",
  });
  const { mutateAsync: deleteShopCoupon, isPending: deleting } =
    useDeleteShopCouponMutation();

  const coupons = data?.content || [];
  const totalItems = data?.totalElements ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);

  if (!loading && currentPage > totalPages) {
    setCurrentPage(totalPages);
  }

  const handleDeleteConfirm = async () => {
    await deleteShopCoupon(deleteDialog.id);
    setDeleteDialog({ open: false, id: 0, name: "" });
  };

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <Card className="flex flex-col h-full">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="leading-tight">Shop Coupons</CardTitle>
              <CardDescription className="line-clamp-2 md:line-clamp-none">
                Per-shop promotions applied when a shop admin scans a user&apos;s
                QR on a pending order.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search coupons..."
                  className="pl-8 w-full sm:w-[200px] lg:w-[260px]"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <Button onClick={() => navigate("/shop-coupons/create")}>
                <Plus className="mr-2 h-4 w-4" />
                Create Coupon
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="w-full sm:max-w-xs">
              <AsyncSelectField
                label="Filter by shop"
                hideLabel
                placeholder="All shops"
                showAllOption
                allOptionLabel="All shops"
                value={shopFilter}
                onValueChange={(value) => {
                  setShopFilter(value);
                  setCurrentPage(1);
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
                triggerClassName="w-full sm:w-[240px]"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(["all", "active", "inactive"] as const).map((value) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={activeFilter === value ? "default" : "outline"}
                  onClick={() => {
                    setActiveFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  {value === "all"
                    ? "All"
                    : value === "active"
                      ? "Active"
                      : "Inactive"}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[70px]">ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Shop</TableHead>
                      <TableHead>Promotion</TableHead>
                      <TableHead>Valid window</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Limit</TableHead>
                      <TableHead className="w-[90px]">Used</TableHead>
                      <TableHead className="w-[90px]">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coupons.length > 0 ? (
                      coupons.map((coupon) => (
                        <TableRow
                          key={coupon.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() =>
                            navigate(`/shop-coupons/create?id=${coupon.id}`)
                          }
                        >
                          <TableCell className="font-mono text-xs">
                            {coupon.id}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{coupon.name}</div>
                            {coupon.description && (
                              <div className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                                {coupon.description}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{shopLabel(coupon)}</TableCell>
                          <TableCell>{promotionSummary(coupon)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            <div>{formatDateTime(coupon.validFrom)}</div>
                            <div>{formatDateTime(coupon.validUntil)}</div>
                          </TableCell>
                          <TableCell>{targetLabel(coupon.target)}</TableCell>
                          <TableCell>{limitLabel(coupon.limitType)}</TableCell>
                          <TableCell>{coupon.redeemedCount}</TableCell>
                          <TableCell>
                            {(() => {
                              const status = couponStatusBadge(coupon);
                              return (
                                <Badge variant={status.variant}>
                                  {status.label}
                                </Badge>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="text-right">
                            <TooltipProvider>
                              <div className="flex justify-end gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(
                                          `/shop-coupons/create?id=${coupon.id}`,
                                        );
                                      }}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit coupon</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteDialog({
                                          open: true,
                                          id: coupon.id,
                                          name: coupon.name,
                                        });
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Delete coupon</TooltipContent>
                                </Tooltip>
                              </div>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={10}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No shop coupons found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <DataTablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
              />
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          !deleting && setDeleteDialog((d) => ({ ...d, open }))
        }
        title="Delete shop coupon?"
        description={`This will soft-delete "${deleteDialog.name}". Existing redemptions and orders are kept for history.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        loading={deleting}
        onCancel={() => setDeleteDialog({ open: false, id: 0, name: "" })}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
