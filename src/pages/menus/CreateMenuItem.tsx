import { useState, useEffect, useCallback } from "react";
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
import { Upload, X, Loader2, Trash2, Plus } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { menuService } from "@/services/menuService";
import { ShopService, Shop } from "@/services/shopService";
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
import { OptionGroup, Variant, Option, MenuCategory, MenuSubCategory } from "@/services/menuService";


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
    const [isPopular, setIsPopular] = useState(false);
    const [displayOrder, setDisplayOrder] = useState<string>("1");

    // Data for dropdowns
    const [shops, setShops] = useState<Shop[]>([]);
    const [categories, setCategories] = useState<MenuCategory[]>([]);
    const [subCategories, setSubCategories] = useState<MenuSubCategory[]>([]);
    const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
    const [variants, setVariants] = useState<Variant[]>([]);


    // Main Image
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [existingImage, setExistingImage] = useState<string | null>(null);

    // Gallery Photos
    const [existingGalleryImages, setExistingGalleryImages] = useState<string[]>([]);
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

    const loadShops = useCallback(async () => {
        try {
            const res = await ShopService.getAllShops(0, 100);
            setShops(res.content || []);
        } catch (e) {
            console.error(e);
        }
    }, []);

    const loadCategories = useCallback(async () => {
        try {
            const res = await ShopService.getAdminCategories(0, 100);
            setCategories(res.content || []);
        } catch (e) {
            console.error(e);
        }
    }, []);

    const loadSubCategories = useCallback(async (catId: number) => {
        try {
            const res = await menuService.getMenuSubCategories(catId);
            setSubCategories(res || []);
        } catch (e) {
            console.error(e);
        }
    }, []);

    const loadItem = useCallback(async (itemId: number) => {
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
            setIsPopular(item.isPopular || false);
            setDisplayOrder(String(item.displayOrder ?? 1));
            setOptionGroups(item.optionGroups || []);
            setVariants(item.variants || []);

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
    }, []);

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
            setIsPopular(false);
            setDisplayOrder("1");
            setImageFile(null);
            setImagePreview(null);
            setExistingImage(null);
            setExistingGalleryImages([]);
            setGalleryFiles([]);
            setGalleryPreviews([]);
            setOptionGroups([]);
            setVariants([]);
        }
    }, [id, isEditMode, loadShops, loadCategories, loadItem]);

    useEffect(() => {
        if (categoryId) {
            loadSubCategories(parseInt(categoryId));
        } else {
            setSubCategories([]);
            setSubCategoryId("");
        }
    }, [categoryId, loadSubCategories]);

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
        const rawValue = e.target.value.replace(/,/g, "");
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

    const addOptionGroup = () => {
        setOptionGroups([...optionGroups, {
            nameEn: "",
            isRequired: false,
            minSelection: 0,
            maxSelection: 1,
            options: [{ nameEn: "", price: 0, isAvailable: true }]
        }]);
    };

    const removeOptionGroup = (index: number) => {
        setOptionGroups(optionGroups.filter((_, i) => i !== index));
    };

    const updateOptionGroup = (index: number, updates: Partial<OptionGroup>) => {
        const newGroups = [...optionGroups];
        newGroups[index] = { ...newGroups[index], ...updates };
        setOptionGroups(newGroups);
    };

    const addOption = (groupIndex: number) => {
        const newGroups = [...optionGroups];
        newGroups[groupIndex].options.push({ nameEn: "", price: 0, isAvailable: true });
        setOptionGroups(newGroups);
    };

    const removeOption = (groupIndex: number, optionIndex: number) => {
        const newGroups = [...optionGroups];
        newGroups[groupIndex].options = newGroups[groupIndex].options.filter((_, i) => i !== optionIndex);
        setOptionGroups(newGroups);
    };

    const updateOption = (groupIndex: number, optionIndex: number, updates: Partial<Option>) => {
        const newGroups = [...optionGroups];
        newGroups[groupIndex].options[optionIndex] = { ...newGroups[groupIndex].options[optionIndex], ...updates };
        setOptionGroups(newGroups);
    };

    const addVariant = () => {
        setVariants([...variants, { nameEn: "", price: 0, isAvailable: true }]);
    };

    const removeVariant = (index: number) => {
        setVariants(variants.filter((_, i) => i !== index));
    };

    const updateVariant = (index: number, updates: Partial<Variant>) => {
        const newVariants = [...variants];
        newVariants[index] = { ...newVariants[index], ...updates };
        setVariants(newVariants);
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
                isPopular,
                displayOrder: Number(displayOrder) || 1,
                optionGroups,
                variants
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
                        <div className="space-y-4">
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <SearchableSelect
                                        data={categories.map(cat => ({ label: cat.nameEn || cat.name, value: String(cat.id) }))}
                                        value="value"
                                        labelKey="label"
                                        selectedValue={categoryId ? { label: categories.find(c => String(c.id) === categoryId)?.nameEn || categories.find(c => String(c.id) === categoryId)?.name || "", value: categoryId } : undefined}
                                        onChange={(item) => setCategoryId(item?.value || "")}
                                        placeholder="Select Category"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Sub Category</Label>
                                    <SearchableSelect
                                        data={subCategories.map(sub => ({ label: sub.nameEn || sub.name, value: String(sub.id) }))}
                                        value="value"
                                        labelKey="label"
                                        selectedValue={subCategoryId ? { label: subCategories.find(s => String(s.id) === subCategoryId)?.nameEn || subCategories.find(s => String(s.id) === subCategoryId)?.name || "", value: subCategoryId } : undefined}
                                        onChange={(item) => setSubCategoryId(item?.value || "")}
                                        placeholder={categoryId ? "Select Sub Category" : "First select Category"}
                                        disabled={!categoryId}
                                    />
                                </div>
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
                                        <Label>Display Order</Label>
                                        <Input
                                            type="text"
                                            value={displayOrder}
                                            onChange={e => {
                                                const val = e.target.value;
                                                if (val === "" || /^\d+$/.test(val)) setDisplayOrder(val);
                                            }}
                                            placeholder="1"
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
                                    <div className="flex items-center space-x-3">
                                        <Switch checked={isPopular} onCheckedChange={setIsPopular} id="popular" />
                                        <Label htmlFor="popular" className="font-medium cursor-pointer">Popular Item</Label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 pt-6 border-t font-sans">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold">Advanced Customization</h3>
                            </div>

                            <Card className="border-dashed bg-muted/5">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <div>
                                        <CardTitle className="text-base">Option Groups</CardTitle>
                                        <CardDescription>Groups of extras like "Toppings", "Sizes", etc.</CardDescription>
                                    </div>
                                    <Button type="button" variant="outline" size="sm" onClick={addOptionGroup} className="gap-2">
                                        <Plus className="h-4 w-4" /> Add Group
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {optionGroups.length === 0 ? (
                                        <div className="text-center py-6 border rounded-lg border-dashed text-muted-foreground text-sm">
                                            No option groups added.
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {optionGroups.map((group, gIdx) => (
                                                <div key={gIdx} className="p-4 border rounded-xl bg-white shadow-sm space-y-4 relative group/og">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute top-2 right-2 text-muted-foreground hover:text-destructive h-8 w-8"
                                                        onClick={() => removeOptionGroup(gIdx)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>

                                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mr-8">
                                                        <div className="space-y-2">
                                                            <Label className="text-xs font-bold uppercase text-muted-foreground">Name (EN)</Label>
                                                            <Input
                                                                value={group.nameEn}
                                                                onChange={e => updateOptionGroup(gIdx, { nameEn: e.target.value })}
                                                                placeholder="e.g. Toppings"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs font-bold uppercase text-muted-foreground">Name (MM)</Label>
                                                            <Input
                                                                value={group.nameMm}
                                                                onChange={e => updateOptionGroup(gIdx, { nameMm: e.target.value })}
                                                                placeholder="အပိုဆောင်း"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs font-bold uppercase text-muted-foreground">Name (TH)</Label>
                                                            <Input
                                                                value={group.nameTh}
                                                                onChange={e => updateOptionGroup(gIdx, { nameTh: e.target.value })}
                                                                placeholder="ท็อปปิ้ง"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs font-bold uppercase text-muted-foreground">Selection Mode</Label>
                                                            <div className="flex items-center gap-4 h-10">
                                                                <div className="flex items-center gap-2">
                                                                    <Switch
                                                                        checked={group.isRequired}
                                                                        onCheckedChange={val => updateOptionGroup(gIdx, { isRequired: val })}
                                                                        id={`req-${gIdx}`}
                                                                    />
                                                                    <Label htmlFor={`req-${gIdx}`} className="text-sm cursor-pointer">Required</Label>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className="space-y-1">
                                                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Min</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={group.minSelection}
                                                                    onChange={e => updateOptionGroup(gIdx, { minSelection: parseInt(e.target.value) || 0 })}
                                                                    className="h-8"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Max</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={group.maxSelection}
                                                                    onChange={e => updateOptionGroup(gIdx, { maxSelection: parseInt(e.target.value) || 1 })}
                                                                    className="h-8"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-xs font-bold">Options</Label>
                                                            <Button type="button" variant="ghost" size="sm" onClick={() => addOption(gIdx)} className="h-7 text-xs gap-1 text-primary">
                                                                <Plus className="h-3 w-3" /> Add Option
                                                            </Button>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {group.options.map((opt, oIdx) => (
                                                                <div key={oIdx} className="flex flex-wrap items-center gap-2 bg-muted/20 p-2 rounded-lg relative group/opt">
                                                                    <Input
                                                                        className="flex-1 min-w-[120px] h-8 text-sm"
                                                                        placeholder="Name (EN)"
                                                                        value={opt.nameEn}
                                                                        onChange={e => updateOption(gIdx, oIdx, { nameEn: e.target.value })}
                                                                    />
                                                                    <Input
                                                                        className="flex-1 min-w-[120px] h-8 text-sm"
                                                                        placeholder="Name (MM)"
                                                                        value={opt.nameMm}
                                                                        onChange={e => updateOption(gIdx, oIdx, { nameMm: e.target.value })}
                                                                    />
                                                                    <Input
                                                                        className="flex-1 min-w-[120px] h-8 text-sm"
                                                                        placeholder="Name (TH)"
                                                                        value={opt.nameTh}
                                                                        onChange={e => updateOption(gIdx, oIdx, { nameTh: e.target.value })}
                                                                    />
                                                                    <div className="flex items-center gap-1 w-28">
                                                                        <span className="text-xs text-muted-foreground font-mono">+</span>
                                                                        <Input
                                                                            type="number"
                                                                            className="h-8 text-sm px-1"
                                                                            placeholder="Price"
                                                                            value={opt.price}
                                                                            onChange={e => updateOption(gIdx, oIdx, { price: parseFloat(e.target.value) || 0 })}
                                                                        />
                                                                    </div>
                                                                    <Switch
                                                                        checked={opt.isAvailable}
                                                                        onCheckedChange={val => updateOption(gIdx, oIdx, { isAvailable: val })}
                                                                    />
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                                        onClick={() => removeOption(gIdx, oIdx)}
                                                                        disabled={group.options.length <= 1}
                                                                    >
                                                                        <X className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="border-dashed bg-muted/5">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <div>
                                        <CardTitle className="text-base">Variants</CardTitle>
                                        <CardDescription>Different versions of the product (e.g. Red, Blue).</CardDescription>
                                    </div>
                                    <Button type="button" variant="outline" size="sm" onClick={addVariant} className="gap-2">
                                        <Plus className="h-4 w-4" /> Add Variant
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    {variants.length === 0 ? (
                                        <div className="text-center py-6 border rounded-lg border-dashed text-muted-foreground text-sm">
                                            No variants added.
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {variants.map((variant, vIdx) => (
                                                <div key={vIdx} className="flex flex-wrap items-center gap-2 bg-white border p-3 rounded-xl shadow-sm relative group/var">
                                                    <Input
                                                        className="flex-1 min-w-[140px]"
                                                        placeholder="Variant Name (EN)"
                                                        value={variant.nameEn}
                                                        onChange={e => updateVariant(vIdx, { nameEn: e.target.value })}
                                                    />
                                                    <Input
                                                        className="flex-1 min-w-[140px]"
                                                        placeholder="Variant Name (MM)"
                                                        value={variant.nameMm}
                                                        onChange={e => updateVariant(vIdx, { nameMm: e.target.value })}
                                                    />
                                                    <Input
                                                        className="flex-1 min-w-[140px]"
                                                        placeholder="Variant Name (TH)"
                                                        value={variant.nameTh}
                                                        onChange={e => updateVariant(vIdx, { nameTh: e.target.value })}
                                                    />
                                                    <div className="flex items-center gap-1 w-32">
                                                        <span className="text-sm font-medium">Price:</span>
                                                        <Input
                                                            type="number"
                                                            placeholder="0"
                                                            value={variant.price}
                                                            onChange={e => updateVariant(vIdx, { price: parseFloat(e.target.value) || 0 })}
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2 mx-2">
                                                        <Switch
                                                            checked={variant.isAvailable}
                                                            onCheckedChange={val => updateVariant(vIdx, { isAvailable: val })}
                                                            id={`var-avail-${vIdx}`}
                                                        />
                                                        <Label htmlFor={`var-avail-${vIdx}`} className="text-xs cursor-pointer">Available</Label>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-muted-foreground hover:text-destructive"
                                                        onClick={() => removeVariant(vIdx)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>



                        {/* Images Section */}
                        <div className="space-y-6 pt-6 border-t font-sans">
                            <h3 className="text-xl font-bold">Media & Gallery</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Main Image */}
                                <div className="space-y-4">
                                    <Label className="text-base">Main Thumbnail Photo</Label>
                                    <div className="relative group aspect-square max-w-[240px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center bg-muted/10 hover:bg-muted/20 transition-all overflow-hidden">
                                        {imagePreview || existingImage ? (
                                            <>
                                                <img src={imagePreview || existingImage || ""} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    <Button type="button" variant="destructive" size="icon" className="h-10 w-10 rounded-full" onClick={removeImage}>
                                                        <Trash2 className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="h-10 w-10 text-muted-foreground mb-3 group-hover:scale-110 transition-transform" />
                                                <span className="text-sm font-medium text-muted-foreground px-4 text-center">Click to upload main image</span>
                                                <Input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageChange} />
                                            </>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">This image will be used as the primary display photo in search results and menu listings.</p>
                                </div>

                                {/* Gallery Photos */}
                                <div className="space-y-4">
                                    <Label className="text-base">Gallery Photos (Optional)</Label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {existingGalleryImages.map((url, idx) => (
                                            <div key={`existing-${idx}`} className="relative group aspect-square border rounded-xl overflow-hidden bg-muted">
                                                <img src={url} alt="Gallery" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Button type="button" variant="destructive" size="icon" className="h-8 w-8 rounded-full shadow-lg" onClick={() => removeExistingGalleryImage(url)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}

                                        {galleryPreviews.map((url, idx) => (
                                            <div key={`new-${idx}`} className="relative group aspect-square border rounded-xl overflow-hidden bg-muted">
                                                <img src={url} alt="Gallery Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Button type="button" variant="destructive" size="icon" className="h-8 w-8 rounded-full shadow-lg" onClick={() => removeGalleryImage(idx)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="relative group aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center bg-muted/10 hover:bg-muted/20 transition-all cursor-pointer">
                                            <Plus className="h-6 w-6 text-muted-foreground" />
                                            <Input type="file" accept="image/*" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleGalleryChange} />
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">Add more photos to showcase the item from different angles or its preparation.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-4 pt-8 border-t px-2">
                            <div className="flex flex-col">
                                {isEditMode && (
                                    <Button type="button" variant="ghost" className="text-destructive hover:bg-destructive/10 gap-2 h-11 px-6 rounded-xl" onClick={() => setDeleteDialogOpen(true)} disabled={submitting}>
                                        <Trash2 className="h-4 w-4" /> Delete Item
                                    </Button>
                                )}
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <Button type="button" variant="outline" className="flex-1 sm:flex-initial h-11 px-8 rounded-xl font-medium" onClick={() => navigate("/menus/items/manage")} disabled={submitting}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1 sm:flex-initial h-11 px-10 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all" disabled={submitting}>
                                    {submitting ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" /> {isEditMode ? "Saving..." : "Creating..."}
                                        </div>
                                    ) : (
                                        isEditMode ? "Save Changes" : "Create Item"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-destructive">Delete Menu Item</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this menu item? This action cannot be undone and will remove it from its shop's menu.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
                            No, keep it
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Yes, delete item
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
