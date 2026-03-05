import { useEffect, useState } from "react";
import { marketingService, Banner, BannerPlacement, FeaturedShop, CreateBannerRequest } from "@/services/marketingService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Megaphone, Plus, Trash2, Star, TrendingUp, ImageIcon } from "lucide-react";
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
    displayOrder: 0,
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
                    {banner.placement.replace("_", " ")}
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

export default function BannerManagement() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [featuredShops, setFeaturedShops] = useState<FeaturedShop[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState<CreateBannerRequest>(emptyBanner);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const [b, f] = await Promise.all([
                marketingService.getBanners().catch(() => []),
                marketingService.getFeaturedShops().catch(() => []),
            ]);
            setBanners(b);
            setFeaturedShops(f);
            setLoading(false);
        }
        load();
    }, []);

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
            const newBanner = await marketingService.createBanner(form);
            setBanners((prev) => [...prev, newBanner]);
            setShowCreate(false);
            setForm(emptyBanner);
            toast.success("Banner created");
        } catch {
            toast.error("Failed to create banner");
        } finally {
            setSaving(false);
        }
    };

    const handleBoostToggleFeatured = async (shop: FeaturedShop) => {
        try {
            const newFeaturedStatus = !shop.isFeatured;
            await marketingService.setFeatured(shop.shopId, newFeaturedStatus);
            setFeaturedShops((prev) => prev.map((s) => s.shopId === shop.shopId ? { ...s, isFeatured: newFeaturedStatus } : s));
            toast.success(`Shop ${newFeaturedStatus ? "featured" : "unfeatured"}`);
        } catch {
            toast.error("Failed to update featured status");
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <Megaphone className="h-6 w-6 text-primary" />
                <h1 className="text-lg font-semibold md:text-2xl">Marketing</h1>
            </div>

            <Tabs defaultValue="banners">
                <TabsList>
                    <TabsTrigger value="banners" className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" /> Banners
                    </TabsTrigger>
                    <TabsTrigger value="featured" className="flex items-center gap-2">
                        <Star className="h-4 w-4" /> Featured Shops
                    </TabsTrigger>
                </TabsList>

                {/* Banners Tab */}
                <TabsContent value="banners" className="mt-4 space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={() => setShowCreate(true)}>
                            <Plus className="h-4 w-4 mr-2" /> New Banner
                        </Button>
                    </div>
                    {loading ? (
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

                {/* Featured Shops Tab */}
                <TabsContent value="featured" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Featured & Boosted Shops</CardTitle>
                            <CardDescription>Toggle featured status or manage boost score for shops.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Shop</TableHead>
                                        <TableHead>Trending Score</TableHead>
                                        <TableHead>Boost Expiry</TableHead>
                                        <TableHead>Featured</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        [...Array(5)].map((_, i) => (
                                            <TableRow key={i}>
                                                {[...Array(4)].map((__, j) => (
                                                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : featuredShops.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                No featured shops data.
                                            </TableCell>
                                        </TableRow>
                                    ) : featuredShops.map((shop) => (
                                        <TableRow key={shop.shopId}>
                                            <TableCell className="font-medium">{shop.shopName}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <TrendingUp className="h-3 w-3 text-green-500" />
                                                    {shop.trendingScore}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {shop.boostExpiry ? new Date(shop.boostExpiry).toLocaleDateString() : "—"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={shop.isFeatured}
                                                        onCheckedChange={() => handleBoostToggleFeatured(shop)}
                                                    />
                                                    {shop.isFeatured && (
                                                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Create Banner Dialog */}
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
                                <label className="text-sm font-medium">Image URL</label>
                                <Input
                                    placeholder="https://..."
                                    value={form.imageUrl}
                                    onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Display Order</label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={form.displayOrder}
                                    onChange={(e) => setForm((f) => ({ ...f, displayOrder: parseInt(e.target.value) || 0 }))}
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
                        <Button onClick={handleCreate} disabled={!form.title || !form.imageUrl || saving}>
                            <Plus className="h-4 w-4 mr-2" /> Create Banner
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
