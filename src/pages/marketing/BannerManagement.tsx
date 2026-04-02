import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { marketingService, Banner, BannerPlacement, CreateBannerRequest } from "@/services/marketingService";
import { ShopService, Shop } from "@/services/shopService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Megaphone, Plus, Trash2, Star, TrendingUp, ImageIcon, Search,
    ExternalLink, Phone, Mail, MapPin, CheckCircle2, XCircle, Zap, Store, Upload, X,
} from "lucide-react";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import { DataTablePagination } from "@/components/DataTablePagination";
import { SortableTableHead, SortConfig } from "@/components/SortableTableHead";
import { TableImage } from "@/components/TableImage";

const PLACEMENTS: BannerPlacement[] = ['HOME_TOP', 'FEED_MIDDLE', 'SHOP_DETAIL', 'SEARCH_TOP'];

interface BannerFormState extends Omit<CreateBannerRequest, "displayOrder"> {
    displayOrder: number | "";
}

const emptyBanner: BannerFormState = {
    titleMm: "",
    titleTh: "",
    titleEn: "",
    imageUrl: "",
    linkUrl: "",
    placement: "HOME_TOP",
    displayOrder: 1,
    isActive: true,
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
};

function BannerCard({ banner, onToggle, onEdit, onDelete }: { banner: Banner; onToggle: (id: string, active: boolean) => void; onEdit: (banner: Banner) => void; onDelete: (id: string) => void }) {
    return (
        <Card className="overflow-hidden">
            <div className="h-36 bg-muted flex items-center justify-center relative">
                <TableImage src={banner.imageUrl} alt={banner.titleEn || banner.titleMm || "Banner"} className="w-full h-full object-cover rounded-none" />
                <Badge className="absolute top-2 right-2" variant={banner.isActive ? "default" : "secondary"}>
                    {banner.placement?.replace("_", " ")}
                </Badge>
            </div>
            <CardContent className="pt-3 space-y-2">
                <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate">{banner.titleEn || banner.titleMm || "Untitled Banner"}</p>
                    <Switch
                        checked={banner.isActive}
                        onCheckedChange={(checked) => onToggle(banner.id, checked)}
                    />
                </div>
                <p className="text-xs text-muted-foreground">
                    {new Date(banner.startDate).toLocaleDateString()} – {new Date(banner.endDate).toLocaleDateString()}
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
                        onClick={() => onDelete(banner.id)}
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
                            <BoolBadge value={shop.hasDelivery} label="Delivery" />
                            <BoolBadge value={shop.hasWifi} label="WiFi" />
                            <BoolBadge value={shop.hasParking} label="Parking" />
                            <BoolBadge value={shop.isHalal} label="Halal" />
                            <BoolBadge value={shop.isVegetarian} label="Vegetarian" />
                            <BoolBadge value={shop.isVerified} label="Verified" />
                        </div>
                    </div>

                    {/* Delivery Info */}
                    <div>
                        <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">Delivery Info</h3>
                        <InfoRow label="Base Delivery Fee" value={shop.baseDeliveryFee != null ? `${shop.baseDeliveryFee} MMK` : null} />
                        <InfoRow label="Min Order Amount" value={shop.minOrderAmount != null ? `${shop.minOrderAmount} MMK` : null} />
                        <InfoRow label="Max Qty / Order" value={shop.maxItemQuantityPerOrder} />
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
    const [banners, setBanners] = useState<Banner[]>([]);
    const [bannersLoading, setBannersLoading] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState<BannerFormState>(emptyBanner);
    const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

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

    // Load banners
    const loadBanners = useCallback(async () => {
        setBannersLoading(true);
        try {
            const b = await marketingService.getBanners();
            setBanners(b);
        } catch (error) {
            handleApiError(error, "Failed to load banners");
            setBanners([]);
        } finally {
            setBannersLoading(false);
        }
    }, []);

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

    useEffect(() => {
        if (activeTab === "banners") loadBanners();
    }, [activeTab, loadBanners]);

    // Banner actions
    const handleToggle = async (id: string, isActive: boolean) => {
        try {
            const bannerToUpdate = banners.find(b => b.id === id);
            if (!bannerToUpdate) return;

            const requestObj = {
                titleMm: bannerToUpdate.titleMm,
                titleTh: bannerToUpdate.titleTh,
                titleEn: bannerToUpdate.titleEn,
                linkUrl: bannerToUpdate.linkUrl,
                placement: bannerToUpdate.placement,
                displayOrder: bannerToUpdate.displayOrder,
                isActive: isActive,
                startDate: bannerToUpdate.startDate,
                endDate: bannerToUpdate.endDate,
            };

            const updated = await marketingService.updateBanner(id, requestObj);
            setBanners((prev) => prev.map((b) => b.id === id ? updated : b));
            toast.success(`Banner ${isActive ? "activated" : "deactivated"}`);
        } catch (error) {
            handleApiError(error, "Failed to update banner");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await marketingService.deleteBanner(id);
            setBanners((prev) => prev.filter((b) => b.id !== id));
            toast.success("Banner removed");
        } catch (error) {
            handleApiError(error, "Failed to remove banner");
        }
    };

    const handleEditClick = (banner: Banner) => {
        setForm({
            titleMm: banner.titleMm || "",
            titleTh: banner.titleTh || "",
            titleEn: banner.titleEn || "",
            imageUrl: banner.imageUrl || "",
            linkUrl: banner.linkUrl || "",
            placement: banner.placement,
            displayOrder: banner.displayOrder || 1,
            isActive: banner.isActive,
            startDate: banner.startDate,
            endDate: banner.endDate,
        });
        setEditingBannerId(banner.id);
        setImagePreview(banner.imageUrl || null);
        setImageFile(null);
        setShowCreate(true);
    };

    const handleCreate = async () => {
        setSaving(true);
        try {
            // Data variable removed

            const safeDisplayOrder = form.displayOrder === "" || (typeof form.displayOrder === "number" && form.displayOrder < 1)
                ? 1
                : form.displayOrder;

            const requestObj = {
                titleMm: form.titleMm,
                titleTh: form.titleTh,
                titleEn: form.titleEn,
                linkUrl: form.linkUrl,
                placement: form.placement,
                displayOrder: safeDisplayOrder as number,
                isActive: form.isActive,
                startDate: form.startDate,
                endDate: form.endDate,
            };

            if (editingBannerId) {
                const updatedBanner = await marketingService.updateBanner(editingBannerId, requestObj, imageFile || undefined);
                setBanners((prev) => prev.map((b) => b.id === editingBannerId ? updatedBanner : b));
                toast.success("Banner updated");
            } else {
                if (!imageFile) {
                    toast.error("An image is required to create a new banner.");
                    setSaving(false);
                    return;
                }
                const newBanner = await marketingService.createBanner(requestObj, imageFile);
                setBanners((prev) => [...prev, newBanner]);
                toast.success("Banner created");
            }

            setShowCreate(false);
            setForm(emptyBanner);
            setImageFile(null);
            setImagePreview(null);
            setEditingBannerId(null);
        } catch (error) {
            handleApiError(error, "An error occurred while saving the banner");
        } finally {
            setSaving(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
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
                        <Button onClick={() => {
                            setForm(emptyBanner);
                            setEditingBannerId(null);
                            setImagePreview(null);
                            setImageFile(null);
                            setShowCreate(true);
                        }}>
                            <Plus className="h-4 w-4 mr-2" /> New Banner
                        </Button>
                    </div>
                    {bannersLoading ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64" />)}
                        </div>
                    ) : banners.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <ImageIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p>No banners yet. Create your first banner.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {banners.map((b) => (
                                <BannerCard key={b.id} banner={b} onToggle={handleToggle} onDelete={handleDelete} onEdit={handleEditClick} />
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

            {/* ── Boost Dialog ─────────────────────────────────────────── */}
            <Dialog open={!!boostShop} onOpenChange={(o) => !o && setBoostShop(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-green-600" /> Boost Shop Score
                        </DialogTitle>
                        <DialogDescription>
                            Manually increase the trending score for{" "}
                            <strong>{boostShop?.nameEn || boostShop?.nameMm}</strong>.
                        </DialogDescription>
                    </DialogHeader>
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
                            This score will be added to the shop's current trending score to increase visibility on the platform.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBoostShop(null)}>Cancel</Button>
                        <Button
                            onClick={handleBoostSubmit}
                            disabled={boosting || !boostScore}
                            className="gap-2"
                        >
                            <Zap className="h-4 w-4" />
                            {boosting ? "Boosting..." : "Apply Boost"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Create Banner Dialog ─────────────────────────────────── */}
            <Dialog open={showCreate} onOpenChange={(o) => {
                setShowCreate(o);
                if (!o) {
                    setEditingBannerId(null);
                    setForm(emptyBanner);
                    setImageFile(null);
                    setImagePreview(null);
                }
            }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingBannerId ? "Edit Banner" : "Create New Banner"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium">Title (English)</label>
                                <Input
                                    placeholder="English Title"
                                    value={form.titleEn}
                                    onChange={(e) => setForm((f) => ({ ...f, titleEn: e.target.value }))}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Title (Myanmar)</label>
                                <Input
                                    placeholder="မြန်မာခေါင်းစဉ်"
                                    value={form.titleMm}
                                    onChange={(e) => setForm((f) => ({ ...f, titleMm: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium">Title (Thai)</label>
                                <Input
                                    placeholder="ชื่อหัวข้อภาษาไทย"
                                    value={form.titleTh}
                                    onChange={(e) => setForm((f) => ({ ...f, titleTh: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium">Image</label>
                                <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                                    {imagePreview ? (
                                        <div className="relative">
                                            <img src={imagePreview} alt="Preview" className="h-32 w-full object-cover rounded mx-auto" />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                className="absolute top-1 right-1 h-6 w-6 p-0"
                                                onClick={() => { setImageFile(null); setImagePreview(null); }}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center gap-2 cursor-pointer">
                                            <Upload className="h-8 w-8 text-muted-foreground" />
                                            <p className="text-sm font-medium">Click to upload</p>
                                            <p className="text-xs text-muted-foreground">PNG, JPG or WebP</p>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Display Order</label>
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    placeholder="1"
                                    value={form.displayOrder}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === "" || /^\d+$/.test(val)) {
                                            setForm((f) => ({
                                                ...f,
                                                displayOrder: val === "" ? "" : parseInt(val, 10),
                                            } as typeof f));
                                        }
                                    }}
                                    onBlur={() => {
                                        if (form.displayOrder === "" || (typeof form.displayOrder === "number" && form.displayOrder < 1)) {
                                            setForm((f) => ({ ...f, displayOrder: 1 } as typeof f));
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Link URL (optional)</label>
                            <Input
                                placeholder="https://..."
                                value={form.linkUrl ?? ""}
                                onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Placement</label>
                            <Select
                                value={form.placement}
                                onValueChange={(v) => setForm((f) => ({ ...f, placement: v as BannerPlacement }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PLACEMENTS.map((p) => (
                                        <SelectItem key={p} value={p}>{p.replace("_", " ")}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium">Start Date</label>
                                <Input
                                    type="date"
                                    value={form.startDate}
                                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">End Date</label>
                                <Input
                                    type="date"
                                    value={form.endDate}
                                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setShowCreate(false);
                            setEditingBannerId(null);
                            setForm(emptyBanner);
                            setImageFile(null);
                            setImagePreview(null);
                        }}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={!form.titleEn || (!imagePreview && !imageFile) || saving}>
                            {editingBannerId ? null : <Plus className="h-4 w-4 mr-2" />}
                            {editingBannerId ? "Update Banner" : "Create Banner"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
