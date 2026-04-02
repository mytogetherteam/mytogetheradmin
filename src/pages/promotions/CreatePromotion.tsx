import { useState, useEffect } from "react";
import { PromotionService } from "@/services/promotionService";
import { ShopService } from "@/services/shopService";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, Trash2, Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Checkbox } from "@/components/ui/checkbox";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export default function CreatePromotion() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const id = searchParams.get("id");
    const isEditMode = !!id;

    // String Texts
    const [titleEn, setTitleEn] = useState("");
    const [titleMm, setTitleMm] = useState("");
    const [titleTh, setTitleTh] = useState("");
    const [descriptionEn, setDescriptionEn] = useState("");
    const [descriptionMm, setDescriptionMm] = useState("");
    const [descriptionTh, setDescriptionTh] = useState("");
    const [badgeLabel, setBadgeLabel] = useState("");

    // Promo & Targeting
    const [targetType, setTargetType] = useState<string>("SHOP");
    const [targetId, setTargetId] = useState<number | "">(0);
    const [promotionType, setPromotionType] = useState<string>("PERCENTAGE_DISCOUNT");
    const [promotionValue, setPromotionValue] = useState<number>(0);
    const [maxDiscount, setMaxDiscount] = useState<number>(0);
    const [minSpend, setMinSpend] = useState<number>(0);

    // Timeline
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [startTimeStr, setStartTimeStr] = useState("");
    const [endTimeStr, setEndTimeStr] = useState("");
    const [selectedDays, setSelectedDays] = useState<string[]>([]);

    // Toggles & Settings
    const [displayOrder, setDisplayOrder] = useState<number | "">(1);
    const [showInCarousel, setShowInCarousel] = useState<boolean>(true);
    const [isActive, setIsActive] = useState<boolean>(true);

    // External Resources
    const [shops, setShops] = useState<{ id: number; nameEn: string }[]>([]);

    // System Status
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Image
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [existingImage, setExistingImage] = useState<string | null>(null);

    const parseTimeStr = (timeStr: string) => {
        if (!timeStr) return undefined;
        // The input type="time" normally provides HH:mm
        // Let's ensure it has seconds for proper ISO string mapping in Java LocalTime
        return timeStr.length === 5 ? `${timeStr}:00` : timeStr;
    };

    const formatTimeObj = (time: string | { hour: number; minute: number } | undefined | null) => {
        if (!time) return '';
        if (typeof time === 'string') {
            // Assumes "HH:mm:ss" from backend
            return time.substring(0, 5); 
        }
        return `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`;
    };

    const loadData = async () => {
        setLoading(true);
        try {
            // Load Shops for Target ID search dropdown
            const shopRes = await ShopService.getAllShops(0, 500);
            setShops(shopRes.content?.map((s) => ({ id: s.id, nameEn: s.nameEn || `Shop ${s.id}` })) || []);

            // Load Existing Promotion
            if (isEditMode && id) {
                const promo = await PromotionService.getPromotionById(parseInt(id));
                setTitleEn(promo.titleEn || "");
                setTitleMm(promo.titleMm || "");
                setTitleTh(promo.titleTh || "");
                setDescriptionEn(promo.descriptionEn || "");
                setDescriptionMm(promo.descriptionMm || "");
                setDescriptionTh(promo.descriptionTh || "");
                setBadgeLabel(promo.badgeLabel || "");

                setTargetType(promo.targetType || "SHOP");
                setTargetId(promo.targetId || "");
                setPromotionType(promo.promotionType || "PERCENTAGE_DISCOUNT");
                setPromotionValue(promo.promotionValue || 0);
                setMaxDiscount(promo.maxDiscount || 0);
                setMinSpend(promo.minSpend || 0);

                setStartDate(promo.startDate || "");
                setEndDate(promo.endDate || "");
                setStartTimeStr(formatTimeObj(promo.startTime));
                setEndTimeStr(formatTimeObj(promo.endTime));
                setSelectedDays(promo.daysOfWeek ? promo.daysOfWeek.split(',').filter(Boolean) : []);

                setDisplayOrder(promo.displayOrder || 1);
                setShowInCarousel(promo.showInCarousel !== false);
                setIsActive(promo.isActive !== false);

                if (promo.imageUrl) setExistingImage(promo.imageUrl);
            }
        } catch (error) {
            handleApiError(error, "Failed to load promotion data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, isEditMode]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setExistingImage(null);
    };

    const toggleDay = (day: string) => {
        setSelectedDays(prev => 
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const validateForm = () => {
        if (!titleEn) return "English Title is required.";
        if (!targetType) return "Target Type is required.";
        if (targetType === "SHOP" && !targetId) return "Target Shop ID is required.";
        return null;
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const err = validateForm();
        if (err) {
            toast.error(err);
            return;
        }

        setSubmitting(true);
        try {
            const dtoData = {
                titleEn: titleEn || undefined,
                titleMm: titleMm || undefined,
                titleTh: titleTh || undefined,
                descriptionEn: descriptionEn || undefined,
                descriptionMm: descriptionMm || undefined,
                descriptionTh: descriptionTh || undefined,
                badgeLabel: badgeLabel || undefined,
                targetType: targetType,
                targetId: targetId ? parseInt(targetId.toString()) : undefined,
                promotionType: promotionType,
                promotionValue: promotionValue,
                maxDiscount: maxDiscount,
                minSpend: minSpend,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                startTime: parseTimeStr(startTimeStr),
                endTime: parseTimeStr(endTimeStr),
                daysOfWeek: selectedDays.length > 0 ? selectedDays.join(',') : undefined,
                displayOrder: displayOrder === "" || displayOrder < 1 ? 1 : displayOrder,
                showInCarousel: showInCarousel,
                isActive: isActive,
            };

            const formData = new FormData();
            formData.append("data", new Blob([JSON.stringify(dtoData)], { type: 'application/json' }));
            if (imageFile) formData.append("image", imageFile);

            if (isEditMode && id) {
                await PromotionService.updatePromotion(parseInt(id), formData);
                toast.success("Promotion updated successfully");
            } else {
                await PromotionService.createPromotion(formData);
                toast.success("Promotion created successfully");
            }
            navigate("/promotions/manage");
        } catch (error) {
            handleApiError(error, isEditMode ? "Failed to update promotion" : "Failed to create promotion");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        setDeleting(true);
        try {
            await PromotionService.deletePromotion(parseInt(id));
            toast.success("Promotion deleted successfully");
            navigate("/promotions/manage");
        } catch (error) {
            handleApiError(error, "Failed to delete promotion");
        } finally {
            setDeleting(false);
            setDeleteDialogOpen(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const selectedShopTarget = shops.find(s => s.id === targetId);

    return (
        <div className="container mx-auto py-10 max-w-5xl">
            <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight">
                    {isEditMode ? "Edit Promotion" : "Create Promotion"}
                </h2>
                <p className="text-muted-foreground">
                    {isEditMode ? "Update an existing promotional offer config." : "Launch a new targeting promotion or offer."}
                </p>
            </div>

            <Card className="border-solid shadow-sm">
                <CardHeader>
                    <CardTitle>Promotion Canvas</CardTitle>
                    <CardDescription>Fill out the configuration blocks below to define your promotion constraints.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-8" onSubmit={onSubmit}>
                        {/* Section 1: Essentials */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold tracking-tight border-b pb-2">1. Identity</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="titleEn">Title (English) <span className="text-destructive">*</span></Label>
                                    <Input id="titleEn" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} required placeholder="e.g. Summer Sale" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="titleMm">Title (Myanmar)</Label>
                                    <Input id="titleMm" value={titleMm} onChange={(e) => setTitleMm(e.target.value)} placeholder="e.g. နွေရာသီအရောင်း" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="titleTh">Title (Thai)</Label>
                                    <Input id="titleTh" value={titleTh} onChange={(e) => setTitleTh(e.target.value)} placeholder="e.g. ลดร้อน" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="descriptionEn">Description (English)</Label>
                                    <Textarea id="descriptionEn" value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} rows={3} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="descriptionMm">Description (Myanmar)</Label>
                                    <Textarea id="descriptionMm" value={descriptionMm} onChange={(e) => setDescriptionMm(e.target.value)} rows={3} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="descriptionTh">Description (Thai)</Label>
                                    <Textarea id="descriptionTh" value={descriptionTh} onChange={(e) => setDescriptionTh(e.target.value)} rows={3} />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="badgeLabel">Badge Label</Label>
                                    <Input id="badgeLabel" value={badgeLabel} onChange={(e) => setBadgeLabel(e.target.value)} placeholder="e.g. 20% OFF" />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Targeting Constraints */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold tracking-tight border-b pb-2">2. Constraints & Targeting</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="targetType">Target Type <span className="text-destructive">*</span></Label>
                                    <Select value={targetType} onValueChange={setTargetType}>
                                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SHOP">SHOP</SelectItem>
                                            <SelectItem value="GLOBAL">GLOBAL</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="targetId">Target Shop</Label>
                                    <SearchableSelect
                                        data={shops}
                                        value="id"
                                        labelKey="nameEn"
                                        selectedValue={selectedShopTarget}
                                        onChange={(item: { id: number; nameEn: string } | null) => setTargetId(item ? item.id : ("" as number | ""))}
                                        placeholder="Select shop target..."
                                        disabled={targetType !== 'SHOP'}
                                    />
                                    <span className="text-xs text-muted-foreground p-1">Required if target is SHOP</span>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Values */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold tracking-tight border-b pb-2">3. Values</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="promotionType">Promotion Type</Label>
                                    <Select value={promotionType} onValueChange={setPromotionType}>
                                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PERCENTAGE_DISCOUNT">PERCENTAGE_DISCOUNT</SelectItem>
                                            <SelectItem value="FIXED_AMOUNT">FIXED_AMOUNT</SelectItem>
                                            <SelectItem value="FREE_DELIVERY">FREE_DELIVERY</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="promotionValue">Promo Value</Label>
                                    <Input id="promotionValue" type="number" value={promotionValue} onChange={(e) => setPromotionValue(parseFloat(e.target.value) || 0)} placeholder="e.g. 20" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="maxDiscount">Max Discount Limit</Label>
                                    <Input id="maxDiscount" type="number" value={maxDiscount} onChange={(e) => setMaxDiscount(parseFloat(e.target.value) || 0)} placeholder="e.g. 50" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="minSpend">Minimum Spend Required</Label>
                                    <Input id="minSpend" type="number" value={minSpend} onChange={(e) => setMinSpend(parseFloat(e.target.value) || 0)} placeholder="e.g. 10" />
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Timelines */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold tracking-tight border-b pb-2">4. Scheduling</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="startDate">Start Date</Label>
                                    <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endDate">End Date</Label>
                                    <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="startTime">Start Time</Label>
                                    <Input id="startTime" type="time" value={startTimeStr} onChange={(e) => setStartTimeStr(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endTime">End Time</Label>
                                    <Input id="endTime" type="time" value={endTimeStr} onChange={(e) => setEndTimeStr(e.target.value)} />
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <Label>Active Days of the Week</Label>
                                <div className="flex flex-wrap gap-4">
                                    {DAYS.map((day) => (
                                        <label key={day} className="flex items-center space-x-2 cursor-pointer border px-3 py-1.5 rounded-md hover:bg-muted/50 transition-colors">
                                            <Checkbox 
                                                checked={selectedDays.includes(day)}
                                                onCheckedChange={() => toggleDay(day)}
                                            />
                                            <span className="text-sm font-medium">{day.substring(0, 3)}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Section 5: Media & Visibility */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold tracking-tight border-b pb-2">5. Settings & Media</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 flex gap-4">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="displayOrder">Display Order</Label>
                                        <Input
                                            id="displayOrder"
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            value={displayOrder}
                                            onChange={(e) => {
                                                const val = e.target.value;
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
                                    <div className="flex items-center gap-3">
                                        <Switch id="showInCarousel" checked={showInCarousel} onCheckedChange={setShowInCarousel} />
                                        <Label htmlFor="showInCarousel">Show inside Homepage/Shop Carousel</Label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                                        <Label htmlFor="isActive">Globally Active Status</Label>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Promotion Image Cover</Label>
                                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg hover:bg-muted/50 cursor-pointer relative transition-colors h-48">
                                        <Input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleImageChange} />
                                        {!imagePreview && !existingImage ? (
                                            <div className="text-center space-y-2 pointer-events-none">
                                                <div className="flex justify-center"><Upload className="h-8 w-8 text-muted-foreground" /></div>
                                                <div className="text-sm font-medium">Upload Promotion Cover</div>
                                            </div>
                                        ) : (
                                            <div className="relative h-full aspect-video group bg-muted rounded overflow-hidden">
                                                <img src={imagePreview || existingImage!} className="h-full w-full object-cover" alt="Preview" />
                                                <div className="absolute top-2 right-2 z-20">
                                                    <Button type="button" variant="destructive" size="icon" className="h-7 w-7 rounded-full shadow-sm" onClick={removeImage}>
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-8 border-t">
                            {isEditMode ? (
                                <Button type="button" variant="destructive" onClick={() => setDeleteDialogOpen(true)} disabled={submitting || deleting}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </Button>
                            ) : <div></div>}
                            <div className="flex gap-3">
                                <Button type="button" variant="outline" onClick={() => navigate("/promotions/manage")} disabled={submitting}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={!titleEn || submitting}>
                                    {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : isEditMode ? "Update" : "Publish"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Promotion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to permanently delete this promotion block?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting ? "Deleting..." : "Confirm Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
