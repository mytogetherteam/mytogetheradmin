import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PriceInput } from "@/components/ui/PriceInput";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Loader2, Trash2, Plus } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { menuService, Variant, ItemTag, ComboComponent } from "@/services/menuService";
import { ShopService } from "@/services/shopService";
import { MasterMenuCategoryService } from "@/services/masterMenuCategoryService";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import { compressImage } from "@/utils/imageCompression";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { InfiniteSearchableSelect } from "@/components/ui/infinite-searchable-select";
import { CreateMenuItemSortableRow } from "@/pages/menus/components/CreateMenuItemSortableRow";
import type { AddonRow, CategoryResponse, TagResponse } from "@/pages/menus/create-menu-item.types";
import {
    optionGroupsToAddonRows,
    resolveMenuItemImageUrl,
    variantsFromApiResponse,
} from "@/pages/menus/create-menu-item-mappers";
import { buildAdminMenuItemDataJson, MEAL_TYPE_OPTIONS } from "@/pages/menus/create-menu-item-payload";
import {
    formatPercentageForInput,
    formatPriceForInput,
    isBlankPriceInput,
    parsePriceInput,
    percentageFromSellingPrice,
    sellingPriceFromOriginalAndAmount,
    sellingPriceFromOriginalAndPercentage,
} from "@/lib/menu-item-discount-form.util";
import { resolveSellingPrice } from "@/lib/menu-item-price-display";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';

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
    const [descriptionMm, setDescriptionMm] = useState("");
    const [descriptionTh, setDescriptionTh] = useState("");
    const [descriptionEn, setDescriptionEn] = useState("");
    const [originalPrice, setOriginalPrice] = useState("");
    const [discountPrice, setDiscountPrice] = useState("");
    const [discountPercentage, setDiscountPercentage] = useState("");
    /** Not shown in UI; kept from loaded item or schema default for API. */
    const [currency, setCurrency] = useState("฿");
    const [categoryId, setCategoryId] = useState("");
    const [shopId, setShopId] = useState("");
    const [selectedShopData, setSelectedShopData] = useState<{ label: string, value: string } | null>(null);
    const [isVegetarian, setIsVegetarian] = useState(false);
    const [isHalal, setIsHalal] = useState(false);

    const [isAvailable, setIsAvailable] = useState(true);
    const [isCombo, setIsCombo] = useState(false);
    const [isRecommended, setIsRecommended] = useState(false);
    const [publishPublished, setPublishPublished] = useState(false);

    const [mealTypes, setMealTypes] = useState<string[]>([]);

    // Tags
    const [availableTags, setAvailableTags] = useState<ItemTag[]>([]);
    const [tagIds, setTagIds] = useState<number[]>([]);

    // Master category linking (global taxonomy)
    const [masterCategoryId, setMasterCategoryId] = useState<string>("");
    const [selectedMasterCategoryData, setSelectedMasterCategoryData] = useState<{ label: string, value: string } | null>(null);

    // Combo Components
    const [comboComponents, setComboComponents] = useState<ComboComponent[]>([]);

    // Data for dropdowns
    // Add-ons (sent as one option group of extras)
    const [addons, setAddons] = useState<AddonRow[]>([]);
    const [variants, setVariants] = useState<Variant[]>([]);

    // Selected items full data for InfiniteSearchableSelect display
    const [selectedCategoryData, setSelectedCategoryData] = useState<{ label: string, value: string } | null>(null);


    // Main Image
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [existingImage, setExistingImage] = useState<string | null>(null);
    const [imageRemoved, setImageRemoved] = useState(false);

    // Gallery Photos removed

    // Refs for file inputs
    const mainImageRef = useRef<HTMLInputElement>(null);

    const syncDiscountFromPrice = useCallback((original: number, priceInput: string) => {
        if (isBlankPriceInput(priceInput) || original <= 0) {
            if (isBlankPriceInput(priceInput)) {
                setDiscountPercentage("");
            }
            return;
        }
        const selling = parsePriceInput(priceInput);
        setDiscountPercentage(
            formatPercentageForInput(percentageFromSellingPrice(original, selling)),
        );
    }, []);

    const syncDiscountFromPercentage = useCallback((original: number, percentageInput: string) => {
        if (isBlankPriceInput(percentageInput) || original <= 0) {
            if (isBlankPriceInput(percentageInput)) {
                setDiscountPrice("");
            }
            return;
        }
        const pct = parsePriceInput(percentageInput);
        setDiscountPrice(
            formatPriceForInput(sellingPriceFromOriginalAndPercentage(original, pct)),
        );
    }, []);

    const handleOriginalPriceChange = useCallback((value: string) => {
        setOriginalPrice(value);
        const original = parsePriceInput(value);
        if (original <= 0) return;

        if (!isBlankPriceInput(discountPercentage)) {
            syncDiscountFromPercentage(original, discountPercentage);
        } else if (!isBlankPriceInput(discountPrice)) {
            syncDiscountFromPrice(original, discountPrice);
        }
    }, [discountPrice, discountPercentage, syncDiscountFromPrice, syncDiscountFromPercentage]);

    const handleDiscountPriceChange = useCallback((value: string) => {
        setDiscountPrice(value);
        syncDiscountFromPrice(parsePriceInput(originalPrice), value);
    }, [originalPrice, syncDiscountFromPrice]);

    const handleDiscountPercentageChange = useCallback((value: string) => {
        if (value !== "" && !/^\d*\.?\d*$/.test(value)) {
            return;
        }
        const pct = parsePriceInput(value);
        if (pct > 100) {
            return;
        }
        setDiscountPercentage(value);
        syncDiscountFromPercentage(parsePriceInput(originalPrice), value);
    }, [originalPrice, syncDiscountFromPercentage]);

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const fetchShopData = useCallback(async (page: number, size: number, search: string) => {
        const res = await ShopService.getAllShops(page, size, search);
        return {
            content: res.content.map(shop => ({ label: shop.nameEn || shop.name, value: String(shop.id) })),
            last: res.last
        };
    }, []);

    const fetchCategoryData = useCallback(async (page: number, size: number, search: string) => {
        const res = await ShopService.getAdminCategories(page, size, search, shopId ? parseInt(shopId) : undefined);
        return {
            content: res.content.map((cat: CategoryResponse) => {
                const categoryId = cat.id || cat.menuCategoryId || cat.categoryId;
                return {
                    label: cat.nameEn || cat.name || cat.nameMm || cat.nameTh || "Unnamed Category",
                    value: String(categoryId)
                };
            }),
            last: res.last
        };
    }, [shopId]);

    // Fetch item tags on mount
    useEffect(() => {
        menuService.getAllItemTags().then(setAvailableTags).catch((e) => handleApiError(e, "Failed to load item tags"));
    }, []);

    const fetchMasterCategoryData = useCallback(async (page: number, size: number, search: string) => {
        const res = await menuService.getAllMasterMenuCategories(page, size);
        const filtered = search
            ? res.content.filter(c => (c.nameEn || c.name || "").toLowerCase().includes(search.toLowerCase()))
            : res.content;
        return {
            content: filtered.map(c => ({ label: c.nameEn || c.name, value: String(c.id) })),
            last: res.last
        };
    }, []);

    const fetchComboItemData = useCallback(async (page: number, size: number, search: string) => {
        const res = await menuService.getAllMenuItems(
            page,
            size,
            search,
            shopId ? parseInt(shopId) : undefined
        );
        return {
            content: res.content.map(item => ({ label: item.nameEn || item.name, value: String(item.id) })),
            last: res.last
        };
    }, [shopId]);

    const toggleTag = (tagId: number) => {
        setTagIds(prev =>
            prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
        );
    };

    const toggleMealType = (mealType: string) => {
        setMealTypes(prev =>
            prev.includes(mealType) ? prev.filter(t => t !== mealType) : [...prev, mealType]
        );
    };

    const addComboComponent = () => {
        setComboComponents(prev => [...prev, { includedItemId: 0, quantity: 1, displayOrder: prev.length + 1 }]);
    };

    const removeComboComponent = (index: number) => {
        setComboComponents(prev => prev.filter((_, i) => i !== index).map((c, i) => ({ ...c, displayOrder: i + 1 })));
    };

    const updateComboComponent = (index: number, updates: Partial<ComboComponent>) => {
        setComboComponents(prev => {
            const next = [...prev];
            next[index] = { ...next[index], ...updates };
            return next;
        });
    };


    const loadItem = useCallback(async (itemId: number) => {
        setLoading(true);
        try {
            const item = await menuService.getMenuItem(itemId);
            setNameMm(item.nameMm || "");
            setNameTh(item.nameTh || "");
            setNameEn(item.nameEn || "");
            setDescriptionMm(item.descriptionMm || "");
            setDescriptionTh(item.descriptionTh || "");
            setDescriptionEn(item.descriptionEn || "");
            const original = Number(item.originalPrice) || 0;
            const amountOff = item.discountAmount;
            const pctOff = item.discountPercentage;
            setOriginalPrice(original > 0 ? original.toLocaleString() : "");

            let selling = original > 0 ? resolveSellingPrice(item) : 0;
            if (selling <= 0 || selling >= original) {
                if (amountOff != null && amountOff > 0 && original > 0) {
                    selling = sellingPriceFromOriginalAndAmount(original, Number(amountOff));
                } else if (pctOff != null && pctOff > 0 && original > 0) {
                    selling = sellingPriceFromOriginalAndPercentage(original, Number(pctOff));
                } else {
                    selling = 0;
                }
            }

            if (selling > 0 && selling < original) {
                setDiscountPrice(selling.toLocaleString());
                setDiscountPercentage(
                    formatPercentageForInput(percentageFromSellingPrice(original, selling)),
                );
            } else {
                setDiscountPrice("");
                setDiscountPercentage("");
            }
            setCurrency(item.currency || "฿");
            if (item.shopId) {
                setShopId(item.shopId.toString());
                setSelectedShopData({ label: item.shopName || "Selected Shop", value: item.shopId.toString() });

                // Fetch real name if backend didn't provide it (Nest: use shop-profile, not legacy /admin/shops)
                if (!item.shopName || item.shopName === "Selected Shop") {
                    ShopService.getAdminShopProfileById(item.shopId).then((shop) => {
                        setSelectedShopData({
                            label: shop.nameEn || shop.nameMm || shop.nameTh || `Shop ${shop.id}`,
                            value: String(shop.id),
                        });
                    }).catch((e) => handleApiError(e, "Failed to load shop details"));
                }
            }

            if (item.menuCategoryId) {
                setCategoryId(item.menuCategoryId.toString());
                const label = item.categoryName || "Selected Category";
                setSelectedCategoryData({ label, value: item.menuCategoryId.toString() });

                // Fetch real name if backend didn't provide it
                if (!item.categoryName || item.categoryName === "Selected Category") {
                    ShopService.getCategoryById(item.menuCategoryId).then((cat: CategoryResponse) => {
                        const fetchedId = cat.id || cat.menuCategoryId || cat.categoryId || item.menuCategoryId;
                        setCategoryId(String(fetchedId));
                        setSelectedCategoryData({ label: cat.nameEn || cat.nameMm || cat.name || `Category ${fetchedId}`, value: String(fetchedId) });
                    }).catch((e) => handleApiError(e, "Failed to load item category"));
                }
            }

            setIsVegetarian(item.isVegetarian || false);
            setIsHalal((item as { isHalal?: boolean }).isHalal || false);
            setIsAvailable(item.isAvailable !== false);
            setIsCombo(item.isCombo || false);
            setIsRecommended(item.isRecommended || false);
            const pub = (item as { publishStatus?: string }).publishStatus;
            setPublishPublished(pub === "PUBLISHED");
            setMealTypes(item.mealTypes ?? []);
            setTagIds(item.tagIds?.map(Number) || (item.tags ? item.tags.map((t: TagResponse) => Number(t.id)) : []));
            if (item.masterCategoryId) {
                setMasterCategoryId(String(item.masterCategoryId));
                const label = item.masterCategoryName || `Master Category #${item.masterCategoryId}`;
                setSelectedMasterCategoryData({ label, value: String(item.masterCategoryId) });

                // Fetch real name if backend didn't provide it
                if (!item.masterCategoryName) {
                    MasterMenuCategoryService.getMasterMenuCategoryById(item.masterCategoryId).then((mc) => {
                        setMasterCategoryId(mc.id.toString());
                        setSelectedMasterCategoryData({ label: mc.nameEn || mc.nameMm || `Category ${mc.id}`, value: String(mc.id) });
                    }).catch((e) => handleApiError(e, "Failed to load master category details"));
                }
            }
            setComboComponents(item.components || []);
            setAddons(optionGroupsToAddonRows(item.optionGroups || []));
            setVariants(variantsFromApiResponse(item.variants || []));

            const resolvedImageUrl = resolveMenuItemImageUrl(item);
            if (resolvedImageUrl) {
                setExistingImage(resolvedImageUrl);
            } else {
                setExistingImage(null);
            }
            setImageRemoved(false);
        } catch (error) {
            handleApiError(error, "Failed to load item");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isEditMode && id) {
            loadItem(parseInt(id));
        } else {
            // Reset form for create mode
            setNameMm("");
            setNameTh("");
            setNameEn("");
            setDescriptionMm("");
            setDescriptionTh("");
            setDescriptionEn("");
            setOriginalPrice("");
            setDiscountPrice("");
            setDiscountPercentage("");
            setCurrency("฿");
            setCategoryId("");
            setShopId("");
            setSelectedShopData(null);
            setSelectedCategoryData(null);
            setIsVegetarian(false);
            setIsHalal(false);

            setIsAvailable(true);
            setIsCombo(false);
            setIsRecommended(false);
            setPublishPublished(false);
            setMealTypes([]);
            setTagIds([]);
            setMasterCategoryId("");
            setSelectedMasterCategoryData(null);
            setComboComponents([]);
            setImageFile(null);
            setImagePreview(null);
            setExistingImage(null);
            setImageRemoved(false);
            setAddons([]);
            setVariants([]);
        }
    }, [id, isEditMode, loadItem]);


    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const originalFile = e.target.files?.[0];
        if (originalFile) {
            const file = await compressImage(originalFile);
            setImageFile(file);
            setImageRemoved(false);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        if (imagePreview || existingImage) {
            setImageRemoved(true);
        }
        setImageFile(null);
        setImagePreview(null);
        setExistingImage(null);
    };


    // handlePriceChange removed in favor of PriceInput

    const addAddon = () => {
        setAddons((prev) => [...prev, { nameEn: "", nameMm: "", nameTh: "", price: 0, isAvailable: true }]);
    };

    const removeAddon = (index: number) => {
        setAddons((prev) => prev.filter((_, i) => i !== index));
    };

    const updateAddon = (index: number, updates: Partial<AddonRow>) => {
        setAddons((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], ...updates };
            return next;
        });
    };

    const handleAddonDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = addons.findIndex((_, i) => `addon-${i}` === active.id);
            const newIndex = addons.findIndex((_, i) => `addon-${i}` === over.id);
            setAddons(arrayMove(addons, oldIndex, newIndex));
        }
    };

    const addVariant = () => {
        setVariants([...variants, { nameEn: "", price: 0, isAvailable: true, displayOrder: variants.length + 1 }]);
    };

    const removeVariant = (index: number) => {
        const updated = variants.filter((_, i) => i !== index);
        // Re-calculate orders
        const reordered = updated.map((v, i) => ({ ...v, displayOrder: i + 1 }));
        setVariants(reordered);
    };

    const updateVariant = (index: number, updates: Partial<Variant>) => {
        const newVariants = [...variants];
        newVariants[index] = { ...newVariants[index], ...updates };
        setVariants(newVariants);
    };

    const handleVariantDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = variants.findIndex((_, i) => `var-${i}` === active.id);
            const newIndex = variants.findIndex((_, i) => `var-${i}` === over.id);
            const newArray = arrayMove(variants, oldIndex, newIndex);
            setVariants(newArray.map((v, i) => ({ ...v, displayOrder: i + 1 })));
        }
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setSubmitting(true);
        try {
            const dtoData = buildAdminMenuItemDataJson({
                nameEn,
                nameMm,
                nameTh,
                descriptionEn,
                descriptionMm,
                descriptionTh,
                originalPriceInput: originalPrice,
                discountPriceInput: discountPrice,
                discountPercentageInput: discountPercentage,
                currency,
                categoryId,
                shopId,
                isVegetarian,
                isHalal,
                isAvailable,
                isCombo,
                isRecommended,
                publishPublished,
                mealTypes,
                tagIds,
                masterCategoryId,
                comboComponents,
                addons,
                variants,
                editingExistingItem: isEditMode && !!id,
            });

            if (imageRemoved && !imageFile) {
                (dtoData as Record<string, unknown>).imageUrl = null;
                (dtoData as Record<string, unknown>).removeImage = true;
            }

            const formData = new FormData();
            formData.append("data", JSON.stringify(dtoData));

            if (imageFile) {
                formData.append("image", imageFile);
            }



            if (isEditMode && id) {
                if (!shopId || Number.isNaN(Number(shopId)) || Number(shopId) === 0) {
                    toast.error(`Shop ID is missing or invalid: "${shopId}"`);
                    setSubmitting(false);
                    return;
                }
                if (!categoryId || Number.isNaN(Number(categoryId)) || Number(categoryId) === 0) {
                    toast.error(`Please select a valid category. Current value: "${categoryId}"`);
                    setSubmitting(false);
                    return;
                }

                await menuService.updateMenuItem(parseInt(id), formData);
                toast.success("Item updated successfully");
            } else {
                if (!shopId || Number.isNaN(Number(shopId)) || Number(shopId) === 0) {
                    toast.error(`Please select a valid shop. Current value: "${shopId}"`);
                    setSubmitting(false);
                    return;
                }
                if (!categoryId || Number.isNaN(Number(categoryId)) || Number(categoryId) === 0) {
                    toast.error(`Please select a valid category. Current value: "${categoryId}"`);
                    setSubmitting(false);
                    return;
                }
                await menuService.createMenuItem(formData);
                toast.success("Item created successfully");
            }
            navigate("/menus/items/manage");
        } catch (error: unknown) {
            handleApiError(error, isEditMode ? "Failed to update item" : "Failed to create item");
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
            handleApiError(error, "Failed to delete item");
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
                                <Label>Shop / Restaurant</Label>
                                {isEditMode ? (
                                    <Input
                                        value={selectedShopData?.label ?? ""}
                                        readOnly
                                        className="bg-muted/50 cursor-not-allowed text-muted-foreground"
                                    />
                                ) : (
                                    <InfiniteSearchableSelect
                                        fetchData={fetchShopData}
                                        valueKey="value"
                                        labelKey="label"
                                        selectedValue={selectedShopData}
                                        onChange={(item) => {
                                            setShopId(item?.value || "");
                                            setSelectedShopData(item);
                                        }}
                                        placeholder="Select Shop"
                                    />
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Names & Descriptions</h3>

                                <div className="space-y-2">
                                    <Label>Name (English)</Label>
                                    <Input value={nameEn} onChange={e => setNameEn(e.target.value)} required placeholder="e.g. Cheese Burger" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Name (Myanmar)</Label>
                                    <Input value={nameMm} onChange={e => setNameMm(e.target.value)} placeholder="e.g. ချိစ်ဘာဂါ" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Name (Thai)</Label>
                                    <Input value={nameTh} onChange={e => setNameTh(e.target.value)} placeholder="e.g. ชีสเบอร์เกอร์" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description (English)</Label>
                                    <Textarea value={descriptionEn} onChange={e => setDescriptionEn(e.target.value)} placeholder="" rows={2} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description (Myanmar)</Label>
                                    <Textarea value={descriptionMm} onChange={e => setDescriptionMm(e.target.value)} placeholder="" rows={2} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description (Thai)</Label>
                                    <Textarea value={descriptionTh} onChange={e => setDescriptionTh(e.target.value)} placeholder="" rows={2} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Pricing & Details</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <Label className="min-h-10 flex items-end leading-tight">
                                            Original price
                                        </Label>
                                        <PriceInput
                                            className="h-10"
                                            value={originalPrice}
                                            onValueChange={handleOriginalPriceChange}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label className="min-h-10 flex items-end leading-tight">
                                            Discount price
                                        </Label>
                                        <PriceInput
                                            className="h-10"
                                            value={discountPrice}
                                            onValueChange={handleDiscountPriceChange}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label className="min-h-10 flex items-end leading-tight">
                                            Discount %
                                        </Label>
                                        <PriceInput
                                            className="h-10"
                                            value={discountPercentage}
                                            onValueChange={handleDiscountPercentageChange}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Discount amount is subtracted from original price for the customer price. Leave empty for no discount.
                                </p>

                                <h3 className="text-lg font-medium mt-6">Flags & Status</h3>
                                <p className="text-xs text-muted-foreground -mt-4 mb-2">Availability, visibility, dietary flags, recommendation, and combo.</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 p-4 bg-muted/30 rounded-lg">
                                    <div className="flex items-center justify-between gap-3 rounded-md border bg-background/80 px-3 py-2">
                                        <Label htmlFor="available" className="font-medium cursor-pointer">{isAvailable ? "Available" : "Unavailable"}</Label>
                                        <Switch checked={isAvailable} onCheckedChange={setIsAvailable} id="available" />
                                    </div>
                                    <div className="flex items-center justify-between gap-3 rounded-md border bg-background/80 px-3 py-2">
                                        <Label htmlFor="published" className="font-medium cursor-pointer">{publishPublished ? "Published" : "Unpublished"}</Label>
                                        <Switch checked={publishPublished} onCheckedChange={setPublishPublished} id="published" />
                                    </div>
                                    <div className="flex items-center justify-between gap-3 rounded-md border bg-background/80 px-3 py-2">
                                        <Label htmlFor="veg" className="font-medium cursor-pointer">Vegetarian</Label>
                                        <Switch checked={isVegetarian} onCheckedChange={setIsVegetarian} id="veg" />
                                    </div>
                                    <div className="flex items-center justify-between gap-3 rounded-md border bg-background/80 px-3 py-2">
                                        <Label htmlFor="halal" className="font-medium cursor-pointer">Halal</Label>
                                        <Switch checked={isHalal} onCheckedChange={setIsHalal} id="halal" />
                                    </div>
                                    <div className="flex items-center justify-between gap-3 rounded-md border bg-background/80 px-3 py-2">
                                        <Label htmlFor="recommended" className="font-medium cursor-pointer">Recommended</Label>
                                        <Switch checked={isRecommended} onCheckedChange={setIsRecommended} id="recommended" />
                                    </div>
                                    <div className="flex items-center justify-between gap-3 rounded-md border bg-background/80 px-3 py-2">
                                        <Label htmlFor="combo" className="font-medium cursor-pointer">Combo set</Label>
                                        <Switch checked={isCombo} onCheckedChange={(val) => { setIsCombo(val); if (!val) setComboComponents([]); }} id="combo" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 pt-6 border-t font-sans">
                            {/* Meal Types Section */}
                            <div className="space-y-3">
                                <h3 className="text-xl font-bold">Meal Types</h3>
                                <p className="text-sm text-muted-foreground">
                                    Select when this item is typically served. Used for search and trending filters.
                                </p>
                                <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/10">
                                    {MEAL_TYPE_OPTIONS.map((mealType) => {
                                        const selected = mealTypes.includes(mealType);
                                        return (
                                            <Badge
                                                key={mealType}
                                                variant={selected ? "default" : "outline"}
                                                className="cursor-pointer select-none transition-all"
                                                onClick={() => toggleMealType(mealType)}
                                            >
                                                {mealType}
                                            </Badge>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Tags Section */}
                            <div className="space-y-3">
                                <h3 className="text-xl font-bold">Item Tags</h3>
                                <p className="text-sm text-muted-foreground">Select discovery tags to help users find this item.</p>
                                {availableTags.length === 0 ? (
                                    <div className="text-sm text-muted-foreground italic">No tags available.</div>
                                ) : (
                                    <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/10">
                                        {availableTags.map(tag => {
                                            const selected = tagIds.some(id => String(id) === String(tag.id));
                                            return (
                                                <Badge
                                                    key={tag.id}
                                                    variant={selected ? "default" : "outline"}
                                                    className="cursor-pointer select-none transition-all"
                                                    onClick={() => toggleTag(tag.id)}
                                                >
                                                    {tag.nameEn || tag.name}
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Catalogue & Category Section */}
                            <div className="space-y-4 bg-muted/5 p-4 rounded-xl border border-dashed">
                                <div>
                                    <h3 className="text-xl font-bold">Catalogue & Category Links</h3>
                                    <p className="text-sm text-muted-foreground">Select a shop category for this item and optionally link it to a global master category.</p>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-primary font-bold">Category</Label>
                                        <InfiniteSearchableSelect
                                            fetchData={fetchCategoryData}
                                            valueKey="value"
                                            labelKey="label"
                                            selectedValue={selectedCategoryData}
                                            onChange={(item) => {
                                                setCategoryId(item?.value || "");
                                                setSelectedCategoryData(item);
                                            }}
                                            placeholder="Select Category"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Master Category</Label>
                                        <InfiniteSearchableSelect
                                            fetchData={fetchMasterCategoryData}
                                            valueKey="value"
                                            labelKey="label"
                                            selectedValue={selectedMasterCategoryData}
                                            onChange={(item) => {
                                                setMasterCategoryId(item?.value || "");
                                                setSelectedMasterCategoryData(item);
                                            }}
                                            placeholder="Search master categories..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Combo Components Section - only visible when isCombo is true */}
                            {isCombo && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xl font-bold">Combo Components</h3>
                                            <p className="text-sm text-muted-foreground">Define the items included in this combo meal.</p>
                                        </div>
                                        <Button type="button" variant="outline" size="sm" onClick={addComboComponent} className="gap-2">
                                            <Plus className="h-4 w-4" /> Add Item
                                        </Button>
                                    </div>
                                    <Card className="border-dashed bg-muted/5">
                                        <CardContent className="pt-4 space-y-3">
                                            {comboComponents.length === 0 ? (
                                                <div className="text-center py-6 border rounded-lg border-dashed text-muted-foreground text-sm">
                                                    No combo items added. Click "Add Item" to include items in this combo.
                                                </div>
                                            ) : (
                                                comboComponents.map((comp, cIdx) => (
                                                    <div key={cIdx} className="flex flex-wrap items-center gap-3 p-3 border rounded-xl bg-card shadow-sm">
                                                        <div className="flex-1 min-w-[200px]">
                                                            <InfiniteSearchableSelect
                                                                key={`combo-search-${cIdx}-${shopId}`}
                                                                fetchData={fetchComboItemData}
                                                                valueKey="value"
                                                                labelKey="label"
                                                                selectedValue={comp.includedItemId ? { label: comp.includedItemNameEn || comp.itemName || `Item #${comp.includedItemId}`, value: String(comp.includedItemId) } : null}
                                                                onChange={(item) => updateComboComponent(cIdx, { includedItemId: item ? Number(item.value) : 0, itemName: item?.label })}
                                                                placeholder="Search included item..."
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-1 w-20">
                                                            <Label className="text-xs whitespace-nowrap">Order:</Label>
                                                            <Input
                                                                type="text"
                                                                inputMode="numeric"
                                                                pattern="[0-9]*"
                                                                className="h-8 text-sm px-1 text-center"
                                                                value={comp.displayOrder}
                                                                onFocus={e => { const t = e.target; setTimeout(() => t.select(), 0); }}
                                                                onChange={e => {
                                                                    const val = e.target.value.replace(/^0+(?!$)/, "");
                                                                    if (val === "" || /^\d+$/.test(val)) {
                                                                        updateComboComponent(cIdx, { displayOrder: parseInt(val) || 1 });
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-2 w-32">
                                                            <Label className="text-xs whitespace-nowrap">Qty:</Label>
                                                            <Input
                                                                type="text"
                                                                inputMode="numeric"
                                                                pattern="[0-9]*"
                                                                min={1}
                                                                value={comp.quantity}
                                                                onFocus={e => { const t = e.target; setTimeout(() => t.select(), 0); }}
                                                                onChange={e => {
                                                                    const val = e.target.value.replace(/^0+(?!$)/, "");
                                                                    if (val === "" || /^\d+$/.test(val)) {
                                                                        updateComboComponent(cIdx, { quantity: parseInt(val) || 1 });
                                                                    }
                                                                }}
                                                                className="h-9 w-20 text-sm"
                                                            />
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-muted-foreground hover:text-destructive"
                                                            onClick={() => removeComboComponent(cIdx)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6 pt-6 border-t font-sans">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold">Advanced Customization</h3>
                            </div>

                            <Card className="border-dashed bg-muted/5">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <div>
                                        <CardTitle className="text-base">Add on</CardTitle>
                                        <CardDescription>Name (English, Myanmar, Thai), price, and availability.</CardDescription>
                                    </div>
                                    <Button type="button" variant="outline" size="sm" onClick={addAddon} className="gap-2">
                                        <Plus className="h-4 w-4" /> Add add-on
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleAddonDragEnd}
                                    >
                                        <SortableContext
                                            items={addons.map((_, i) => `addon-${i}`)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {addons.length === 0 ? (
                                                <div className="text-center py-6 border rounded-lg border-dashed text-muted-foreground text-sm">
                                                    No add-ons added.
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {addons.map((addon, idx) => (
                                                        <CreateMenuItemSortableRow key={`addon-${idx}`} id={`addon-${idx}`}>
                                                            <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4 shadow-sm">
                                                                <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3 min-w-0">
                                                                    <div className="space-y-1">
                                                                        <Label className="text-xs text-muted-foreground">Name (English)</Label>
                                                                        <Input value={addon.nameEn} onChange={e => updateAddon(idx, { nameEn: e.target.value })} placeholder="English" />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <Label className="text-xs text-muted-foreground">Name (Myanmar)</Label>
                                                                        <Input value={addon.nameMm} onChange={e => updateAddon(idx, { nameMm: e.target.value })} placeholder="Myanmar" />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <Label className="text-xs text-muted-foreground">Name (Thai)</Label>
                                                                        <Input value={addon.nameTh} onChange={e => updateAddon(idx, { nameTh: e.target.value })} placeholder="Thai" />
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-wrap items-center gap-3">
                                                                    <div className="space-y-1 w-32">
                                                                        <Label className="text-xs text-muted-foreground">Price</Label>
                                                                        <Input
                                                                            type="text"
                                                                            inputMode="decimal"
                                                                            value={addon.price === 0 ? "" : addon.price}
                                                                            onChange={e => {
                                                                                const val = e.target.value;
                                                                                if (val === "" || /^\d*\.?\d*$/.test(val)) {
                                                                                    updateAddon(idx, { price: parseFloat(val) || 0 });
                                                                                }
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <div className="flex items-center gap-2 pb-1">
                                                                        <Switch checked={addon.isAvailable} onCheckedChange={v => updateAddon(idx, { isAvailable: v })} id={`addon-avail-${idx}`} />
                                                                        <Label htmlFor={`addon-avail-${idx}`} className="text-sm cursor-pointer whitespace-nowrap">Available</Label>
                                                                    </div>
                                                                    <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeAddon(idx)}>
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </CreateMenuItemSortableRow>
                                                    ))}
                                                </div>
                                            )}
                                        </SortableContext>
                                    </DndContext>
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
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleVariantDragEnd}
                                    >
                                        <SortableContext
                                            items={variants.map((_, i) => `var-${i}`)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {variants.length === 0 ? (
                                                <div className="text-center py-6 border rounded-lg border-dashed text-muted-foreground text-sm">
                                                    No variants added.
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {variants.map((variant, vIdx) => (
                                                        <CreateMenuItemSortableRow key={`var-${vIdx}`} id={`var-${vIdx}`}>
                                                            <div className="flex flex-wrap items-center gap-2 bg-card border p-3 rounded-xl shadow-sm relative group/var">
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
                                                                <div className="flex items-center gap-1 w-20">
                                                                    <span className="text-sm font-medium">Order:</span>
                                                                    <Input
                                                                        type="text"
                                                                        inputMode="numeric"
                                                                        pattern="[0-9]*"
                                                                        className="h-9 text-sm px-1 text-center"
                                                                        value={variant.displayOrder}
                                                                        onFocus={e => { const t = e.target; setTimeout(() => t.select(), 0); }}
                                                                        onChange={e => {
                                                                            const val = e.target.value.replace(/^0+(?!$)/, "");
                                                                            if (val === "" || /^\d+$/.test(val)) {
                                                                                updateVariant(vIdx, { displayOrder: parseInt(val) || 1 });
                                                                            }
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="flex items-center gap-1 w-32">
                                                                    <span className="text-sm font-medium">Price:</span>
                                                                    <PriceInput
                                                                        placeholder="0"
                                                                        value={variant.price}
                                                                        onValueChange={val => updateVariant(vIdx, { price: parseFloat(val) || 0 })}
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
                                                        </CreateMenuItemSortableRow>
                                                    ))}
                                                </div>
                                            )}
                                        </SortableContext>
                                    </DndContext>
                                </CardContent>
                            </Card>
                        </div>



                        {/* Images Section */}
                        <div className="space-y-6 pt-6 border-t font-sans">
                            <h3 className="text-xl font-bold">Media</h3>

                            <div className="w-full">
                                {/* Main Image */}
                                <div className="space-y-4">
                                    <Label className="text-base">Main Thumbnail Photo</Label>
                                    <div
                                        onClick={() => mainImageRef.current?.click()}
                                        className="relative group w-full aspect-[21/9] border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center bg-muted/5 hover:bg-muted/10 transition-all overflow-hidden cursor-pointer border-muted-foreground/20 hover:border-primary/50"
                                    >
                                        {imagePreview || existingImage ? (
                                            <>
                                                <img src={imagePreview || existingImage || ""} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    <Button type="button" variant="destructive" size="icon" className="h-12 w-12 rounded-full shadow-xl hover:scale-110 transition-transform" onClick={(e) => { e.stopPropagation(); removeImage(); }}>
                                                        <Trash2 className="h-6 w-6" />
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center text-center p-6">
                                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                                    <Upload className="h-8 w-8 text-primary" />
                                                </div>
                                                <span className="text-lg font-semibold text-foreground/80">Click to upload main image</span>
                                                <p className="text-sm text-muted-foreground mt-1 text-balance max-w-xs">Drag and drop or click to browse files</p>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            ref={mainImageRef}
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageChange}
                                        />
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">This image will be used as the primary display photo in search results and menu listings.</p>
                                </div>
                            </div>

                            {/* Gallery section removed for Edit Mode per API instructions */}
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

            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Menu Item"
                description="Are you sure you want to delete this menu item? This action cannot be undone and will remove it from its shop's menu."
                confirmText="Yes, delete item"
                cancelText="No, keep it"
                variant="destructive"
                loading={deleting}
                onCancel={() => setDeleteDialogOpen(false)}
                onConfirm={handleDelete}
            />
        </div>
    );
}
