import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { marketingService } from "@/services/marketingService";
import type { BannerImage, BannerFormValues } from "@/schemas/banner-image.schema";
import {
    useBanners,
    useCreateBannerMutation,
    useUpdateBannerMutation,
    useDeleteBannerMutation,
} from "@/hooks/banner-images/useBannerImages";
import { BannerFormDialog } from "@/components/marketing/BannerFormDialog";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Modal } from "@/components/common/Modal";
import { ShopService, Shop } from "@/services/shopService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Megaphone, Plus, Trash2, Star, TrendingUp, ImageIcon, Search,
    ExternalLink, Phone, Mail, MapPin, CheckCircle2, XCircle, Store,
} from "lucide-react";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import { DataTablePagination } from "@/components/DataTablePagination";
import { SortableTableHead, SortConfig } from "@/components/SortableTableHead";
import { TableImage } from "@/components/TableImage";


/** At most two labels: EN + (MM or TH). MM is preferred when all three exist. */
function getBannerDisplayName(banner: BannerImage): string {
    const en = banner.nameEn?.trim();
    const mm = banner.nameMm?.trim();
    const th = banner.nameTh?.trim();

    if (en) {
        const secondary = mm || th;
        return secondary ? `${en} (${secondary})` : en;
    }
    if (mm && th) return `${mm} (${th})`;
    return mm || th || "Untitled Banner";
}

function BannerCard({
    banner,
    onToggle,
    onEdit,
    onDelete,
}: {
    banner: BannerImage;
    onToggle: (id: number, active: boolean) => void;
    onEdit: (banner: BannerImage) => void;
    onDelete: (id: number, name: string) => void;
}) {
    const displayName = getBannerDisplayName(banner);

    return (
        <Card className="overflow-hidden">
            <div className="h-36 bg-muted flex items-center justify-center relative">
                <TableImage src={banner.imageUrl} alt={displayName} className="w-full h-full object-cover rounded-none" />
            </div>
            <CardContent className="pt-3 space-y-2">
                <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate">{displayName}</p>
                    <Switch
                        checked={banner.isActive}
                        onCheckedChange={(checked) => onToggle(banner.id, checked)}
                    />
                </div>
                <p className="text-xs text-muted-foreground">
                    {banner.position} · {new Date(banner.startDate).toLocaleDateString()} – {new Date(banner.endDate).toLocaleDateString()}
                </p>
                <div className="flex justify-between items-center w-full gap-2">
                    <Button
                        size="sm" variant="outline" className="flex-1"
                        onClick={() => onEdit(banner)}
                    >
                        Edit
                    </Button>
                    <Button
                        size="sm" variant="destructive" className="flex-1"
                        onClick={() =>
                            onDelete(banner.id, displayName)
                        }
                    >
                        <Trash2 className="h-3 w-3 mr-1" /> Remove
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

// ── Shop Detail Sheet ─────────────────────────────────────────────────────────
const InfoRow = ({ label, value }: { label: string; value?: string | number | null }) => (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-muted/40 last:border-0">
        <span className="text-xs font-bold uppercase text-muted-foreground shrink-0">{label}</span>
        <span className="text-sm text-right">{value ?? "N/A"}</span>
    </div>
);

const BoolBadge = ({ value, label }: { value?: boolean; label: string }) => (
    <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/30 border border-muted/40">
        <span className="text-[10px] text-muted-foreground uppercase font-bold">{label}</span>
        {value
            ? <Badge className="bg-green-500/10 text-green-600 border-green-500/20 gap-1 text-[10px] hover:bg-green-500/10"><CheckCircle2 className="h-3 w-3" /> Yes</Badge>
            : <Badge variant="outline" className="text-muted-foreground gap-1 text-[10px]"><XCircle className="h-3 w-3" /> No</Badge>
        }
    </div>
);

function ShopDetailSheet({
    shop,
    open,
    onClose,
    onToggleFeatured,
    onBoost,
    featuringId,
}: {
    shop: Shop | null;
    open: boolean;
    onClose: () => void;
    onToggleFeatured: (shop: Shop) => void;
    onBoost: (shop: Shop) => void;
    featuringId: number | null;
}) {
    if (!shop) return null;

    return (
        <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader className="pb-4 border-b">
                    <div className="flex items-center gap-3">
                        {shop.logoUrl ? (
                            <img src={shop.logoUrl} alt={shop.nameEn} className="h-14 w-14 rounded-xl object-cover border" />
                        ) : (
                            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Store className="h-7 w-7 text-primary" />
                            </div>
                        )}
                        <div>
                            <SheetTitle className="text-lg">{shop.nameEn || shop.nameMm || "Shop"}</SheetTitle>
                            <SheetDescription className="flex items-center gap-2 mt-1">
                                <span>ID: {shop.id}</span>
                                {shop.isFeatured && (
                                    <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 gap-1 text-[10px] hover:bg-yellow-500/10">
                                        <Star className="h-3 w-3 fill-yellow-500" /> Featured
                                    </Badge>
                                )}
                                <Badge variant={shop.isActive ? "default" : "secondary"} className="text-[10px]">
                                    {shop.isActive ? "Active" : "Inactive"}
                                </Badge>
                            </SheetDescription>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-3">
                        <Button
                            className="flex-1"
                            variant={shop.isFeatured ? "outline" : "default"}
                            size="sm"
                            disabled={featuringId === shop.id}
                            onClick={() => onToggleFeatured(shop)}
                        >
                            <Star className={`h-4 w-4 mr-2 ${shop.isFeatured ? "fill-yellow-500 text-yellow-500" : ""}`} />
                            {shop.isFeatured ? "Unfeature Shop" : "Set as Featured"}
                        </Button>
                        <Button
                            className="flex-1"
                            variant="outline"
                            size="sm"
                            onClick={() => onBoost(shop)}
                        >
                            <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                            Boost Score
                        </Button>
                    </div>
                </SheetHeader>

                <div className="mt-4 space-y-4">
                    {/* Basic Info */}
                    <div>
                        <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">Basic Info</h3>
                        <InfoRow label="Name (EN)" value={shop.nameEn} />
                        <InfoRow label="Name (MM)" value={shop.nameMm} />
                        <InfoRow label="Name (TH)" value={shop.nameTh} />
                        <InfoRow label="Category" value={shop.shopCategory?.nameEn || shop.category} />

                        <InfoRow label="Price Preference" value={shop.pricePreference} />
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">Contact</h3>
                        <div className="space-y-1.5">
                            {shop.phone && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                    {shop.phone}
                                </div>
                            )}
                            {shop.email && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                    {shop.email}
                                </div>
                            )}
                            {(shop.addressEn || shop.address) && (
                                <div className="flex items-start gap-2 text-sm">
                                    <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                                    <span>{shop.addressEn || shop.address}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Features */}
                    <div>
                        <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">Features</h3>
                        <div className="grid grid-cols-3 gap-2">
                            <BoolBadge value={shop.deliveryEnabled} label="Delivery" />
                            <BoolBadge value={shop.hasWifi} label="WiFi" />
                            <BoolBadge value={shop.hasParking} label="Parking" />
                            <BoolBadge value={shop.isHalal} label="Halal" />
                            <BoolBadge value={shop.isVegetarian} label="Vegetarian" />
                            <BoolBadge value={shop.isVerified} label="Verified" />
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">Location</h3>
                        <InfoRow label="District" value={shop.districtId} />
                        <InfoRow label="Latitude" value={shop.latitude} />
                        <InfoRow label="Longitude" value={shop.longitude} />
                    </div>

                    {/* Timestamps */}
                    <div>
                        <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">Timestamps</h3>
                        <InfoRow label="Created At" value={shop.createdAt ? new Date(shop.createdAt).toLocaleString() : null} />
                        <InfoRow label="Updated At" value={shop.updatedAt ? new Date(shop.updatedAt).toLocaleString() : null} />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function BannerManagement() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get("tab") || "banners";

    // Banners state
    const [showBannerForm, setShowBannerForm] = useState(false);
    const [editingBanner, setEditingBanner] = useState<BannerImage | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; name: string }>({
        open: false,
        id: 0,
        name: "",
    });

    const {
        data: bannersPage,
        isPending: bannersLoading,
        isError: bannersError,
        error: bannersLoadError,
        refetch: refetchBanners,
    } = useBanners({
        page: 1,
        size: 100,
    });
    const banners = bannersPage?.content ?? [];
    const sortedBanners = useMemo(
        () =>
            [...banners].sort(
                (a, b) => Number(b.isActive) - Number(a.isActive),
            ),
        [banners],
    );

    const { mutateAsync: createBanner, isPending: creatingBanner } =
        useCreateBannerMutation();
    const { mutateAsync: updateBanner, isPending: updatingBanner } =
        useUpdateBannerMutation();
    const { mutateAsync: deleteBanner, isPending: deletingBanner } =
        useDeleteBannerMutation();

    // Featured Shops state
    const [shops, setShops] = useState<Shop[]>([]);
    const [shopsLoading, setShopsLoading] = useState(false);
    const [shopSearch, setShopSearch] = useState("");
    const [featuringId, setFeaturingId] = useState<number | null>(null);

    // Pagination & Sorting state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: "createdAt", direction: "desc" });

    // Detail Sheet
    const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);

    // Boost Dialog
    const [boostShop, setBoostShop] = useState<Shop | null>(null);
    const [boostScore, setBoostScore] = useState("10");
    const [boosting, setBoosting] = useState(false);

    const handleTabChange = (value: string) => {
        setSearchParams({ tab: value });
    };

    // Load all shops for featured tab
    const loadShops = useCallback(async () => {
        setShopsLoading(true);
        try {
            const sortStr = sortConfig ? `${sortConfig.key},${sortConfig.direction}` : "";
            const data = await ShopService.getAllShops(page - 1, pageSize, shopSearch, undefined, sortStr);
            setShops(data.content || []);
            setTotalElements(data.totalElements || 0);
            setTotalPages(data.totalPages || 0);
        } catch (error) {
            handleApiError(error, "Failed to load shops");
        } finally {
            setShopsLoading(false);
        }
    }, [page, pageSize, shopSearch, sortConfig]);

    const handleSort = (key: string) => {
        setSortConfig((prev) => {
            if (prev?.key === key) {
                return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
            }
            return { key, direction: "asc" };
        });
        setPage(1); // Reset to first page on sort
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (activeTab === "featured") {
                setPage(1); // Reset to first page on search
                loadShops();
            }
        }, 500); // Debounce search
        return () => clearTimeout(timeoutId);
    }, [shopSearch, activeTab, loadShops]);

    useEffect(() => {
        if (activeTab === "featured") {
            loadShops();
        }
    }, [page, pageSize, sortConfig, activeTab, loadShops]);

    const handleToggle = async (id: number, isActive: boolean) => {
        await updateBanner({ id, values: { isActive } });
    };

    const handleDeleteClick = (id: number, name: string) => {
        setDeleteDialog({ open: true, id, name });
    };

    const handleDeleteConfirm = async () => {
        await deleteBanner(deleteDialog.id);
        setDeleteDialog({ open: false, id: 0, name: "" });
    };

    const handleEditClick = (banner: BannerImage) => {
        setEditingBanner(banner);
        setShowBannerForm(true);
    };

    const handleOpenCreate = () => {
        setEditingBanner(null);
        setShowBannerForm(true);
    };

    const handleBannerFormSubmit = async (
        values: BannerFormValues,
        imageFile?: File,
    ) => {
        if (editingBanner) {
            await updateBanner({
                id: editingBanner.id,
                values,
                imageFile,
            });
            return;
        }
        if (!imageFile) return;
        await createBanner({ values, imageFile });
    };

    // Featured actions
    const handleToggleFeatured = async (shop: Shop) => {
        setFeaturingId(shop.id);
        try {
            const newVal = !shop.isFeatured;
            await marketingService.setFeatured(String(shop.id), newVal);
            setShops(prev => prev.map(s => s.id === shop.id ? { ...s, isFeatured: newVal } : s));
            if (selectedShop?.id === shop.id) setSelectedShop((s) => s ? ({ ...s, isFeatured: newVal }) : null);
            toast.success(`Shop ${newVal ? "featured ⭐" : "unfeatured"}`);
        } catch (error) {
            handleApiError(error, "Failed to update featured status");
        } finally {
            setFeaturingId(null);
        }
    };

    const handleOpenBoost = (shop: Shop) => {
        setBoostShop(shop);
        setBoostScore("10");
    };

    const handleBoostSubmit = async () => {
        if (!boostShop) return;
        const score = parseFloat(boostScore);
        if (isNaN(score) || score <= 0) {
            toast.error("Please enter a valid boost score");
            return;
        }
        setBoosting(true);
        try {
            await marketingService.boostShop(String(boostShop.id), score);
            toast.success(`Boost applied (+${score}) to ${boostShop.nameEn || boostShop.nameMm}`);
            setBoostShop(null);
        } catch (error) {
            handleApiError(error, "Failed to boost shop");
        } finally {
            setBoosting(false);
        }
    };


    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <Megaphone className="h-6 w-6 text-primary" />
                <h1 className="text-lg font-semibold md:text-2xl">Marketing</h1>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList>
                    <TabsTrigger value="banners" className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" /> Banners
                    </TabsTrigger>
                    <TabsTrigger value="featured" className="flex items-center gap-2">
                        <Star className="h-4 w-4" /> Featured Shops
                    </TabsTrigger>
                </TabsList>

                {/* ── Banners Tab ────────────────────────────────────────── */}
                <TabsContent value="banners" className="mt-4 space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={handleOpenCreate}>
                            <Plus className="h-4 w-4 mr-2" /> New Banner
                        </Button>
                    </div>
                    {bannersLoading ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64" />)}
                        </div>
                    ) : bannersError ? (
                        <div className="text-center py-16 space-y-3">
                            <p className="text-destructive font-medium">Failed to load banners</p>
                            <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                {bannersLoadError instanceof Error
                                    ? bannersLoadError.message
                                    : "Check that the API is running and the database migration for banner fields is applied."}
                            </p>
                            <Button variant="outline" onClick={() => void refetchBanners()}>
                                Retry
                            </Button>
                        </div>
                    ) : banners.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <ImageIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p>No banners yet. Create your first banner.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {sortedBanners.map((b) => (
                                <BannerCard key={b.id} banner={b} onToggle={handleToggle} onDelete={handleDeleteClick} onEdit={handleEditClick} />
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* ── Featured Shops Tab ─────────────────────────────────── */}
                <TabsContent value="featured" className="mt-4 space-y-4">
                    {/* Search */}
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search shops..."
                            className="pl-9"
                            value={shopSearch}
                            onChange={(e) => setShopSearch(e.target.value)}
                        />
                    </div>

                    <Card className="shadow-sm border-muted/60">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-base flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Star className="h-5 w-5 text-yellow-500" />
                                    All Shops
                                </div>
                                <Badge variant="secondary" className="rounded-full px-3">
                                    {totalElements} shops
                                </Badge>
                            </CardTitle>
                            <CardDescription>
                                Toggle featured status or boost a shop's trending score for visibility.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                                            <SortableTableHead
                                                label="Shop"
                                                sortKey="nameEn"
                                                sortConfig={sortConfig}
                                                onSort={handleSort}
                                                className="py-3"
                                            />
                                            <SortableTableHead
                                                label="Category"
                                                sortKey="category"
                                                sortConfig={sortConfig}
                                                onSort={handleSort}
                                            />
                                            <SortableTableHead
                                                label="Status"
                                                sortKey="isActive"
                                                sortConfig={sortConfig}
                                                onSort={handleSort}
                                            />
                                            <TableHead>Featured</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {shopsLoading ? (
                                            [...Array(5)].map((_, i) => (
                                                <TableRow key={i}>
                                                    {[...Array(5)].map((__, j) => (
                                                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                                    ))}
                                                </TableRow>
                                            ))
                                        ) : shops.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                                    {shopSearch ? "No shops matching your search." : "No shops found."}
                                                </TableCell>
                                            </TableRow>
                                        ) : shops.map((shop) => (
                                            <TableRow key={shop.id} className="hover:bg-muted/20 transition-colors">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <TableImage src={shop.logoUrl} alt={shop.nameEn || shop.nameMm || shop.name} size="sm" />
                                                        <div>
                                                           <p className="font-medium text-sm leading-tight">{shop.nameEn || shop.nameMm || shop.name}</p>
                                                            <p className="text-[10px] text-muted-foreground font-mono">ID: {shop.id}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {shop.shopCategory?.nameEn || shop.shopCategory?.nameMm || shop.category || "—"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={shop.isActive ? "default" : "secondary"} className="text-[10px]">
                                                        {shop.isActive ? "Active" : "Inactive"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={!!shop.isFeatured}
                                                            disabled={featuringId === shop.id}
                                                            onCheckedChange={() => handleToggleFeatured(shop)}
                                                        />
                                                        {shop.isFeatured && (
                                                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {/* Boost button */}
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="gap-1.5 text-green-700 border-green-200 hover:bg-green-50"
                                                            onClick={() => handleOpenBoost(shop)}
                                                        >
                                                            <TrendingUp className="h-3.5 w-3.5" />
                                                            Boost
                                                        </Button>
                                                        {/* Detail button */}
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => { setSelectedShop(shop); setSheetOpen(true); }}
                                                        >
                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                    <DataTablePagination
                        currentPage={page}
                        totalPages={totalPages}
                        totalItems={totalElements}
                        pageSize={pageSize}
                        onPageChange={setPage}
                        onPageSizeChange={setPageSize}
                    />
                </TabsContent>
            </Tabs>

            {/* ── Shop Detail Sheet ────────────────────────────────────── */}
            <ShopDetailSheet
                shop={selectedShop}
                open={sheetOpen}
                onClose={() => setSheetOpen(false)}
                onToggleFeatured={handleToggleFeatured}
                onBoost={handleOpenBoost}
                featuringId={featuringId}
            />

            <Modal
                open={!!boostShop}
                onClose={() => setBoostShop(null)}
                onSubmit={handleBoostSubmit}
                loading={boosting}
                title="Boost Shop Score"
                description={
                    <>
                        Manually increase the trending score for{" "}
                        <strong>{boostShop?.nameEn || boostShop?.nameMm}</strong>.
                    </>
                }
                submitText="Apply Boost"
                width="sm:max-w-sm"
            >
                <div className="space-y-3">
                    <label className="text-sm font-medium">Boost Score</label>
                    <Input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={boostScore}
                        onChange={(e) => setBoostScore(e.target.value)}
                        placeholder="e.g. 10"
                    />
                    <p className="text-xs text-muted-foreground">
                        This score will be added to the shop&apos;s current trending score to
                        increase visibility on the platform.
                    </p>
                </div>
            </Modal>

            <BannerFormDialog
                open={showBannerForm}
                onOpenChange={(open) => {
                    setShowBannerForm(open);
                    if (!open) setEditingBanner(null);
                }}
                banner={editingBanner}
                submitting={creatingBanner || updatingBanner}
                onSubmit={handleBannerFormSubmit}
            />

            <ConfirmDialog
                open={deleteDialog.open}
                onOpenChange={(open) =>
                    setDeleteDialog((prev) => ({ ...prev, open }))
                }
                title="Delete banner"
                description={`Remove "${deleteDialog.name}"? This cannot be undone.`}
                confirmText="Delete"
                variant="destructive"
                loading={deletingBanner}
                onCancel={() => setDeleteDialog({ open: false, id: 0, name: "" })}
                onConfirm={handleDeleteConfirm}
            />
        </div>
    );
}

