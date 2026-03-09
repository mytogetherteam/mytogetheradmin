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

const PLACEMENTS: BannerPlacement[] = ['HOME_TOP', 'FEED_MIDDLE', 'SHOP_DETAIL', 'SEARCH_TOP'];

const emptyBanner: CreateBannerRequest = {
    title: "",
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

function BannerCard({ banner, onToggle, onDelete }: { banner: Banner; onToggle: (id: string, active: boolean) => void; onDelete: (id: string) => void }) {
    return (
        <Card className="overflow-hidden">
            <div className="h-36 bg-muted flex items-center justify-center relative">
                {banner.imageUrl ? (
                    <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                ) : (
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                )}
                <Badge className="absolute top-2 right-2" variant={banner.isActive ? "default" : "secondary"}>
                    {banner.placement?.replace("_", " ")}
                </Badge>
            </div>
            <CardContent className="pt-3 space-y-2">
                <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate">{banner.title}</p>
                    <Switch
                        checked={banner.isActive}
                        onCheckedChange={(checked) => onToggle(banner.id, checked)}
                    />
                </div>
                <p className="text-xs text-muted-foreground">
                    {new Date(banner.startDate).toLocaleDateString()} – {new Date(banner.endDate).toLocaleDateString()}
                </p>
                <Button
                    size="sm" variant="destructive" className="w-full"
                    onClick={() => onDelete(banner.id)}
                >
                    <Trash2 className="h-3 w-3 mr-1" /> Remove
                </Button>
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
                        <InfoRow label="Sub-Category" value={shop.shopSubCategory?.nameEn || shop.subCategory} />
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
    const [form, setForm] = useState<CreateBannerRequest>(emptyBanner);
    const [saving, setSaving] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Featured Shops state
    const [shops, setShops] = useState<Shop[]>([]);
    const [shopsLoading, setShopsLoading] = useState(false);
    const [shopSearch, setShopSearch] = useState("");
    const [featuringId, setFeaturingId] = useState<number | null>(null);

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
            const b = await marketingService.getBanners().catch(() => []);
            setBanners(b);
        } finally {
            setBannersLoading(false);
        }
    }, []);

    // Load all shops for featured tab
    const loadShops = useCallback(async () => {
        setShopsLoading(true);
        try {
            const data = await ShopService.getAllShops(0, 200);
            setShops(data.content || []);
        } catch {
            toast.error("Failed to load shops");
        } finally {
            setShopsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === "banners") loadBanners();
        else if (activeTab === "featured") loadShops();
    }, [activeTab, loadBanners, loadShops]);

    // Banner actions
    const handleToggle = async (id: string, isActive: boolean) => {
        try {
            const updated = await marketingService.toggleBanner(id, isActive);
            setBanners((prev) => prev.map((b) => b.id === id ? updated : b));
            toast.success(`Banner ${isActive ? "activated" : "deactivated"}`);
        } catch {
            toast.error("Failed to update banner");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await marketingService.deleteBanner(id);
            setBanners((prev) => prev.filter((b) => b.id !== id));
            toast.success("Banner removed");
        } catch {
            toast.error("Failed to remove banner");
        }
    };

    const handleCreate = async () => {
        setSaving(true);
        try {
            let data: CreateBannerRequest | FormData;

            if (imageFile) {
                const formData = new FormData();
                formData.append("title", form.title);
                if (form.titleMm) formData.append("titleMm", form.titleMm);
                if (form.titleTh) formData.append("titleTh", form.titleTh);
                if (form.titleEn) formData.append("titleEn", form.titleEn);
                if (form.linkUrl) formData.append("linkUrl", form.linkUrl);
                formData.append("placement", form.placement);
                formData.append("displayOrder", String(form.displayOrder));
                formData.append("isActive", String(form.isActive));
                formData.append("startDate", form.startDate);
                formData.append("endDate", form.endDate);
                formData.append("image", imageFile);
                data = formData;
            } else {
                data = form;
            }

            const newBanner = await marketingService.createBanner(data);
            setBanners((prev) => [...prev, newBanner]);
            setShowCreate(false);
            setForm(emptyBanner);
            setImageFile(null);
            setImagePreview(null);
            toast.success("Banner created");
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
        } catch {
            toast.error("Failed to update featured status");
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
        } catch {
            toast.error("Failed to boost shop");
        } finally {
            setBoosting(false);
        }
    };

    const filteredShops = shops.filter(s => {
        const q = shopSearch.toLowerCase();
        return (
            (s.nameEn || "").toLowerCase().includes(q) ||
            (s.nameMm || "").toLowerCase().includes(q) ||
            (s.phone || "").toLowerCase().includes(q) ||
            (s.category || s.shopCategory?.nameEn || "").toLowerCase().includes(q)
        );
    });

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
                        <Button onClick={() => setShowCreate(true)}>
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
                                <BannerCard key={b.id} banner={b} onToggle={handleToggle} onDelete={handleDelete} />
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
                                    {filteredShops.length} shops
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
                                        <TableRow className="bg-muted/30">
                                            <TableHead className="py-3">Shop</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Status</TableHead>
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
                                        ) : filteredShops.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                                    {shopSearch ? "No shops matching your search." : "No shops found."}
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredShops.map((shop) => (
                                            <TableRow key={shop.id} className="hover:bg-muted/20 transition-colors">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        {shop.logoUrl ? (
                                                            <img src={shop.logoUrl} className="h-9 w-9 rounded-lg object-cover border" alt="" />
                                                        ) : (
                                                            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                                                <Store className="h-4 w-4 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-medium text-sm leading-tight">{shop.nameEn || shop.nameMm}</p>
                                                            <p className="text-[10px] text-muted-foreground font-mono">ID: {shop.id}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {shop.shopCategory?.nameEn || shop.category || "—"}
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
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Create New Banner</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium">Title (Default)</label>
                                <Input
                                    placeholder="Banner title"
                                    value={form.title}
                                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
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
                            <div>
                                <label className="text-sm font-medium">Title (English)</label>
                                <Input
                                    placeholder="English Title"
                                    value={form.titleEn}
                                    onChange={(e) => setForm((f) => ({ ...f, titleEn: e.target.value }))}
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
                                    placeholder="1"
                                    value={form.displayOrder}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === "" || /^\d+$/.test(val)) setForm((f) => ({ ...f, displayOrder: val === "" ? 1 : parseInt(val) }));
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
                        <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={!form.title || !imageFile || saving}>
                            <Plus className="h-4 w-4 mr-2" /> Create Banner
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
