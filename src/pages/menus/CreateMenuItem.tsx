import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Upload, X, Loader2, Trash2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { menuService } from "@/services/menuService";
import { ShopService } from "@/services/shopService";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";

export default function CreateMenuItem() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const id = searchParams.get("id");
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Form Data
    const [nameMm, setNameMm] = useState("");
    const [nameTh, setNameTh] = useState("");
    const [nameEn, setNameEn] = useState("");
    const [slug, setSlug] = useState("");
    const [description, setDescription] = useState("");
    const [descriptionMm, setDescriptionMm] = useState("");
    const [descriptionTh, setDescriptionTh] = useState("");
    const [descriptionEn, setDescriptionEn] = useState("");
    const [price, setPrice] = useState("");
    const [originalPrice, setOriginalPrice] = useState("");
    const [discountAmount, setDiscountAmount] = useState("");
    const [discountPercentage, setDiscountPercentage] = useState("");
    const [currency, setCurrency] = useState("MMK");
    const [shopId, setShopId] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [subCategoryId, setSubCategoryId] = useState("");
    const [isVegetarian, setIsVegetarian] = useState(false);
    const [isSpicy, setIsSpicy] = useState(false);

    const [isAvailable, setIsAvailable] = useState(true);
    const [isCombo, setIsCombo] = useState(false);
    const [displayOrder, setDisplayOrder] = useState(0);

    // Data for dropdowns
    const [shops, setShops] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [subCategories, setSubCategories] = useState<any[]>([]);

    // Main Image
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [existingImage, setExistingImage] = useState<string | null>(null);

    // Gallery Photos
    const [existingGalleryImages, setExistingGalleryImages] = useState<string[]>([]);
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

    useEffect(() => {
        if (!isEditMode) {
            const generatedSlug = (nameEn || "")
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-');
            setSlug(generatedSlug);
        }
    }, [nameEn, isEditMode]);

    useEffect(() => {
        loadShops();
        loadCategories();
        if (isEditMode && id) {
            loadItem(parseInt(id));
        } else {
            // Reset form for create mode
            setNameMm("");
            setNameTh("");
            setNameEn("");
            setSlug("");
            setDescription("");
            setDescriptionMm("");
            setDescriptionTh("");
            setDescriptionEn("");
            setPrice("");
            setOriginalPrice("");
            setDiscountAmount("");
            setDiscountPercentage("");
            setCurrency("MMK");
            setShopId("");
            setCategoryId("");
            setSubCategoryId("");
            setIsVegetarian(false);
            setIsSpicy(false);

            setIsAvailable(true);
            setIsCombo(false);
            setDisplayOrder(0);
            setImageFile(null);
            setImagePreview(null);
            setExistingImage(null);
            setExistingGalleryImages([]);
            setGalleryFiles([]);
            setGalleryPreviews([]);
        }
    }, [id, isEditMode]);

    useEffect(() => {
        if (categoryId) {
            loadSubCategories(parseInt(categoryId));
        } else {
            setSubCategories([]);
            setSubCategoryId("");
        }
    }, [categoryId]);

    const loadShops = async () => {
        try {
            const res = await ShopService.getAllShops(0, 100);
            setShops(res.content || []);
        } catch (e) {
            console.error(e);
        }
    };

    const loadCategories = async () => {
        try {
            const res = await ShopService.getAdminCategories(0, 100);
            setCategories(res.content || res || []);
        } catch (e) {
            console.error(e);
        }
    };

    const loadSubCategories = async (catId: number) => {
        try {
            const res = await menuService.getMenuSubCategories(catId);
            setSubCategories(res || []);
        } catch (e) {
            console.error(e);
        }
    };

    const loadItem = async (itemId: number) => {
        setLoading(true);
        try {
            const item = await menuService.getMenuItem(itemId);
            setNameMm(item.nameMm || "");
            setNameTh(item.nameTh || "");
            setNameEn(item.nameEn || "");
            setSlug(item.slug || "");
            setDescription(item.description || "");
            setDescriptionMm(item.descriptionMm || "");
            setDescriptionTh(item.descriptionTh || "");
            setDescriptionEn(item.descriptionEn || "");
            // Format price with commas
            setPrice(item.price ? item.price.toLocaleString() : "0");
            setOriginalPrice(item.originalPrice ? item.originalPrice.toLocaleString() : "");
            setDiscountAmount(item.discountAmount ? item.discountAmount.toLocaleString() : "");
            setDiscountPercentage(item.discountPercentage ? item.discountPercentage.toLocaleString() : "");
            setCurrency(item.currency || "MMK");
            setShopId(item.shopId?.toString() || "");
            setCategoryId(item.categoryId?.toString() || "");
            setSubCategoryId(item.subCategoryId?.toString() || "");
            setIsVegetarian(item.isVegetarian || false);
            setIsSpicy(item.isSpicy || false);

            setIsAvailable(item.isAvailable !== false);
            setIsCombo(item.isCombo || false);
            setDisplayOrder(item.displayOrder || 0);

            if (item.imageUrl) {
                setExistingImage(item.imageUrl);
            }
            if (item.imageUrls && Array.isArray(item.imageUrls)) {
                setExistingGalleryImages(item.imageUrls);
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to load item");
        } finally {
            setLoading(false);
        }
    };

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

    const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const newFiles = Array.from(files);
        setGalleryFiles(prev => [...prev, ...newFiles]);

        newFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setGalleryPreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeGalleryImage = (index: number) => {
        setGalleryFiles(prev => prev.filter((_, i) => i !== index));
        setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingGalleryImage = (url: string) => {
        setExistingGalleryImages(prev => prev.filter(img => img !== url));
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
        let rawValue = e.target.value.replace(/,/g, "");
        if (rawValue === "") {
            setter("");
            return;
        }
        if (/^[0-9]*\.?[0-9]*$/.test(rawValue)) {
            const parts = rawValue.split('.');
            if (parts[0] !== "") {
                parts[0] = Number(parts[0]).toLocaleString();
            }
            setter(parts.join('.'));
        }
    };


    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!shopId) {
            toast.error("Please select a shop");
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();

            const payload = {
                nameMm,
                nameTh,
                nameEn,
                slug,
                description,
                descriptionMm,
                descriptionTh,
                descriptionEn,
                price: Number(price.replace(/,/g, "")) || 0,
                originalPrice: originalPrice ? Number(originalPrice.replace(/,/g, "")) : 0,
                discountAmount: discountAmount ? Number(discountAmount.replace(/,/g, "")) : 0,
                discountPercentage: discountPercentage ? Number(discountPercentage.replace(/,/g, "")) : 0,
                currency,
                shopId: Number(shopId),
                categoryId: Number(categoryId),
                subCategoryId: subCategoryId ? Number(subCategoryId) : 0,
                isVegetarian,
                isSpicy,

                isAvailable,
                isCombo,
                displayOrder: Number(displayOrder) || 0
            };

            formData.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));

            if (imageFile) {
                formData.append("photo", imageFile);
            }

            galleryFiles.forEach((file) => {
                formData.append("galleryPhotos", file);
            });

            if (isEditMode && id) {
                await menuService.updateMenuItem(parseInt(id), formData);
                toast.success("Item updated successfully");
            } else {
                if (!categoryId) {
                    toast.error("Please select a category");
                    return;
                }
                await menuService.createMenuItem(parseInt(categoryId), formData);
                toast.success("Item created successfully");
            }
            navigate("/menus/items/manage");
        } catch (error) {
            console.error(error);
            toast.error(isEditMode ? "Failed to update item" : "Failed to create item");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        setDeleting(true);
        try {
            await menuService.deleteMenuItem(parseInt(id));
            toast.success("Item deleted successfully");
            navigate("/menus/items/manage");
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete item");
        } finally {
            setDeleting(false);
            setDeleteDialogOpen(false);
        }
    };

    if (loading) return <div className="flex justify-center p-24 text-muted-foreground"><Loader2 className="animate-spin h-8 w-8" /></div>;

    return (
        <div className="container mx-auto py-10 max-w-4xl">
            <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight truncate sm:overflow-visible sm:whitespace-normal">
                    {isEditMode ? "Edit Menu Item" : "Create Menu Item"}
                </h2>
                <p className="text-muted-foreground line-clamp-2 sm:line-clamp-none">
                    {isEditMode ? "Update item details and availability." : "Add a new menu item to a shop's menu."}
                </p>
            </div>

            <Card className="border-solid">
                <CardHeader>
                    <CardTitle>Item Details</CardTitle>
                    <CardDescription>Fill in the basic information about the menu item.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-6" onSubmit={onSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Shop</Label>
                                <SearchableSelect
                                    data={shops.map(shop => ({ label: shop.nameEn || shop.name, value: String(shop.id) }))}
                                    value="value"
                                    labelKey="label"
                                    selectedValue={shopId ? { label: shops.find(s => String(s.id) === shopId)?.nameEn || shops.find(s => String(s.id) === shopId)?.name || "", value: shopId } : undefined}
                                    onChange={(item) => setShopId(item?.value || "")}
                                    placeholder="Select Shop"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Category</Label>
                                <SearchableSelect
                                    data={categories.map(cat => ({ label: cat.name, value: String(cat.id) }))}
                                    value="value"
                                    labelKey="label"
                                    selectedValue={categoryId ? { label: categories.find(c => String(c.id) === categoryId)?.name || "", value: categoryId } : undefined}
                                    onChange={(item) => setCategoryId(item?.value || "")}
                                    placeholder="Select Category"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Names & Descriptions</h3>

                                <div className="space-y-2">
                                    <Label>Name (Myanmar)</Label>
                                    <Input value={nameMm} onChange={e => setNameMm(e.target.value)} placeholder="e.g. ချိစ်ဘာဂါ" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Name (Thai)</Label>
                                    <Input value={nameTh} onChange={e => setNameTh(e.target.value)} placeholder="e.g. ชีสเบอร์เกอร์" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Name (English) / Default*</Label>
                                    <Input value={nameEn} onChange={e => setNameEn(e.target.value)} required placeholder="e.g. Cheese Burger" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Slug</Label>
                                    <Input value={slug} onChange={e => setSlug(e.target.value)} readOnly className="bg-muted" />
                                </div>

                                <div className="space-y-2 mt-4">
                                    <Label>Description (Default)</Label>
                                    <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Ingredients, taste, etc." rows={2} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description (Myanmar)</Label>
                                    <Textarea value={descriptionMm} onChange={e => setDescriptionMm(e.target.value)} placeholder="" rows={2} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description (Thai)</Label>
                                    <Textarea value={descriptionTh} onChange={e => setDescriptionTh(e.target.value)} placeholder="" rows={2} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description (English)</Label>
                                    <Textarea value={descriptionEn} onChange={e => setDescriptionEn(e.target.value)} placeholder="" rows={2} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Pricing & Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Sub Category</Label>
                                        <SearchableSelect
                                            data={subCategories.map(sub => ({ label: sub.name, value: String(sub.id) }))}
                                            value="value"
                                            labelKey="label"
                                            selectedValue={subCategoryId ? { label: subCategories.find(s => String(s.id) === subCategoryId)?.name || "", value: subCategoryId } : undefined}
                                            onChange={(item) => setSubCategoryId(item?.value || "")}
                                            placeholder="Select Sub Category"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Display Order</Label>
                                        <Input
                                            type="number"
                                            value={displayOrder}
                                            onChange={e => setDisplayOrder(parseInt(e.target.value) || 0)}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label>Currency</Label>
                                        <Select value={currency} onValueChange={setCurrency}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Currency" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="MMK">MMK (K)</SelectItem>
                                                <SelectItem value="USD">USD ($)</SelectItem>
                                                <SelectItem value="THB">THB (฿)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div className="space-y-2">
                                        <Label>Base Price*</Label>
                                        <Input
                                            type="text"
                                            value={price}
                                            onChange={(e) => handlePriceChange(e, setPrice)}
                                            required
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Original Price</Label>
                                        <Input
                                            type="text"
                                            value={originalPrice}
                                            onChange={(e) => handlePriceChange(e, setOriginalPrice)}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Discount Amount</Label>
                                        <Input
                                            type="text"
                                            value={discountAmount}
                                            onChange={(e) => handlePriceChange(e, setDiscountAmount)}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Discount (%)</Label>
                                        <Input
                                            type="text"
                                            value={discountPercentage}
                                            onChange={(e) => handlePriceChange(e, setDiscountPercentage)}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <h3 className="text-lg font-medium mt-6">Flags & Status</h3>
                                <div className="grid grid-cols-2 gap-y-4 gap-x-8 p-4 bg-muted/30 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <Switch checked={isAvailable} onCheckedChange={setIsAvailable} id="available" />
                                        <Label htmlFor="available" className="font-medium cursor-pointer">Available</Label>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Switch checked={isVegetarian} onCheckedChange={setIsVegetarian} id="veg" />
                                        <Label htmlFor="veg" className="font-medium cursor-pointer">Vegetarian</Label>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Switch checked={isSpicy} onCheckedChange={setIsSpicy} id="spicy" />
                                        <Label htmlFor="spicy" className="font-medium cursor-pointer">Spicy / Hot</Label>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Switch checked={isCombo} onCheckedChange={setIsCombo} id="combo" />
                                        <Label htmlFor="combo" className="font-medium cursor-pointer">Combo Meal</Label>
                                    </div>


                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                            {/* Main Image */}
                            <div className="space-y-2">
                                <Label>Main Image</Label>
                                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg hover:bg-muted/50 cursor-pointer relative transition-colors">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        onChange={handleImageChange}
                                    />
                                    <div className="text-center space-y-2 pointer-events-none">
                                        <div className="flex justify-center">
                                            <Upload className="h-10 w-10 text-muted-foreground" />
                                        </div>
                                        <div className="text-sm font-medium">Upload Main Image</div>
                                        <div className="text-xs text-muted-foreground">PNG, JPG or WebP</div>
                                    </div>
                                </div>
                                {(imagePreview || existingImage) && (
                                    <div className="relative mt-4 aspect-video rounded-md overflow-hidden border group w-full max-w-xs">
                                        <img src={imagePreview || existingImage!} className="w-full h-full object-cover" alt="Main" />
                                        <div className="absolute top-2 right-2 z-20">
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="h-8 w-8 shadow-sm"
                                                onClick={removeImage}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Gallery Photos */}
                            <div className="space-y-2">
                                <Label>Gallery Photos</Label>
                                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg hover:bg-muted/50 cursor-pointer relative transition-colors">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        onChange={handleGalleryChange}
                                    />
                                    <div className="text-center space-y-2 pointer-events-none">
                                        <div className="flex justify-center">
                                            <Upload className="h-10 w-10 text-muted-foreground" />
                                        </div>
                                        <div className="text-sm font-medium">Upload Gallery Photos</div>
                                        <div className="text-xs text-muted-foreground">Multiple allowed</div>
                                    </div>
                                </div>

                                {(existingGalleryImages.length > 0 || galleryPreviews.length > 0) && (
                                    <div className="grid grid-cols-3 gap-2 mt-4">
                                        {existingGalleryImages.map((src, idx) => (
                                            <div key={`existing-${idx}`} className="relative aspect-square rounded-md overflow-hidden border">
                                                <img src={src} className="w-full h-full object-cover" alt="Gallery Existing" />
                                                <div className="absolute top-1 right-1 z-20">
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        className="h-6 w-6 rounded-full shadow-sm"
                                                        onClick={() => removeExistingGalleryImage(src)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                        {galleryPreviews.map((src, idx) => (
                                            <div key={`new-${idx}`} className="relative aspect-square rounded-md overflow-hidden border">
                                                <img src={src} className="w-full h-full object-cover" alt="Gallery Preview" />
                                                <div className="absolute top-1 right-1 z-20">
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        className="h-6 w-6 rounded-full shadow-sm"
                                                        onClick={() => removeGalleryImage(idx)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-6 border-t">
                            {isEditMode && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => setDeleteDialogOpen(true)}
                                    disabled={submitting || deleting}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Item
                                </Button>
                            )}
                            <div className="flex gap-3 ml-auto">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate("/menus/items/manage")}
                                    disabled={submitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={!nameEn || !price || !shopId || !categoryId || submitting}
                                    className={(!nameEn || !price || !shopId || !categoryId || submitting) ? "bg-gray-400 cursor-not-allowed" : ""}
                                >
                                    {submitting ? "Saving..." : isEditMode ? "Update Item" : "Create Item"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Menu Item</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{nameEn}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting ? "Deleting..." : "Delete Item"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
