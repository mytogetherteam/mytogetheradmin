import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PriceInput } from "@/components/ui/PriceInput";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Loader2, Trash2, Plus } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { menuService } from "@/services/menuService";
import { ShopService } from "@/services/shopService";
import { MasterItemService } from "@/services/masterItemService";
import { MasterMenuCategoryService } from "@/services/masterMenuCategoryService";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import { formatImageUrl } from "@/lib/utils";
import { compressImage } from "@/utils/imageCompression";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { InfiniteSearchableSelect } from "@/components/ui/infinite-searchable-select";
import { OptionGroup, Variant, Option, ItemTag, ComboComponent } from "@/services/menuService";
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
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from "lucide-react";

interface SortableItemProps {
    id: string;
    children: React.ReactNode;
    className?: string;
}

function SortableItem({ id, children, className }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
    };

    return (
        <div ref={setNodeRef} style={style} className={className}>
            <div className="flex items-start gap-2">
                <div
                    {...attributes}
                    {...listeners}
                    className="mt-3 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-primary transition-colors"
                >
                    <GripVertical className="h-5 w-5" />
                </div>
                <div className="flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
}


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
    const [price, setPrice] = useState("");
    const [originalPrice, setOriginalPrice] = useState("");
    const [discountAmount, setDiscountAmount] = useState("");
    const [discountPercentage, setDiscountPercentage] = useState("");
    const [currency, setCurrency] = useState("THB");
    const [categoryId, setCategoryId] = useState("");
    const [shopId, setShopId] = useState("");
    const [selectedShopData, setSelectedShopData] = useState<{ label: string, value: string } | null>(null);
    const [isVegetarian, setIsVegetarian] = useState(false);
    const [isSpicy, setIsSpicy] = useState(false);

    const [isAvailable, setIsAvailable] = useState(true);
    const [isCombo, setIsCombo] = useState(false);
    const [isPopular, setIsPopular] = useState(false);
    const [isHotDeal, setIsHotDeal] = useState(false);
    const [isRecommended, setIsRecommended] = useState(false);
    const [displayOrder, setDisplayOrder] = useState<string>("1");

    // Meal Types
    const [mealTypes, setMealTypes] = useState<string[]>([]);

    // Tags
    const [availableTags, setAvailableTags] = useState<ItemTag[]>([]);
    const [tagIds, setTagIds] = useState<number[]>([]);

    // Master Item / Category linking
    const [masterItemId, setMasterItemId] = useState<string>("");
    const [selectedMasterItemData, setSelectedMasterItemData] = useState<{ label: string, value: string } | null>(null);
    const [masterCategoryId, setMasterCategoryId] = useState<string>("");
    const [selectedMasterCategoryData, setSelectedMasterCategoryData] = useState<{ label: string, value: string } | null>(null);

    // Combo Components
    const [comboComponents, setComboComponents] = useState<ComboComponent[]>([]);

    // Data for dropdowns
    const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
    const [variants, setVariants] = useState<Variant[]>([]);

    // Selected items full data for InfiniteSearchableSelect display
    const [selectedCategoryData, setSelectedCategoryData] = useState<{ label: string, value: string } | null>(null);


    // Main Image
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [existingImage, setExistingImage] = useState<string | null>(null);

    // Gallery Photos removed

    // Refs for file inputs
    const mainImageRef = useRef<HTMLInputElement>(null);

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
        const res = await ShopService.getAdminCategories(page, size, search);
        return {
            content: res.content.map((cat: any) => {
                const categoryId = cat.id || cat.menuCategoryId || cat.categoryId;
                return { 
                    label: cat.nameEn || cat.name || cat.nameMm || cat.nameTh || "Unnamed Category", 
                    value: String(categoryId) 
                };
            }),
            last: res.last
        };
    }, []);

    // Fetch item tags on mount
    useEffect(() => {
        menuService.getAllItemTags().then(setAvailableTags).catch((e) => handleApiError(e, "Failed to load item tags"));
    }, []);

    const fetchMasterItemData = useCallback(async (page: number, size: number, search: string) => {
        const res = await menuService.searchMasterItems(search, page, size);
        return {
            content: res.content.map(item => ({ label: item.nameEn || item.name, value: String(item.id) })),
            last: res.last
        };
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
        console.log("Combo item fetching with shopId:", shopId, "parsed:", shopId ? parseInt(shopId) : "undefined");
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

    const toggleMealType = (type: string) => {
        setMealTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const toggleTag = (tagId: number) => {
        setTagIds(prev =>
            prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
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
            // Format price with commas safely
            setPrice(item.price != null ? Number(item.price).toLocaleString() : "0");
            setOriginalPrice(item.originalPrice != null ? Number(item.originalPrice).toLocaleString() : "");
            setDiscountAmount(item.discountAmount != null ? Number(item.discountAmount).toLocaleString() : "");
            setDiscountPercentage(item.discountPercentage != null ? Number(item.discountPercentage).toLocaleString() : "");
            setCurrency(item.currency || "THB");
            if (item.shopId) {
                setShopId(item.shopId.toString());
                setSelectedShopData({ label: item.shopName || "Selected Shop", value: item.shopId.toString() });

                // Fetch real name if backend didn't provide it
                if (!item.shopName || item.shopName === "Selected Shop") {
                    ShopService.getShopById(item.shopId).then((shop) => {
                        setSelectedShopData({ label: shop.nameEn || shop.nameMm || `Shop ${shop.id}`, value: String(shop.id) });
                    }).catch((e) => console.log("Failed to load shop name fallback", e));
                }
            }

            if (item.menuCategoryId) {
                setCategoryId(item.menuCategoryId.toString());
                const label = item.categoryName || "Selected Category";
                setSelectedCategoryData({ label, value: item.menuCategoryId.toString() });

                // Fetch real name if backend didn't provide it
                if (!item.categoryName || item.categoryName === "Selected Category") {
                    ShopService.getCategoryById(item.menuCategoryId).then((cat: any) => {
                        const fetchedId = cat.id || cat.menuCategoryId || cat.categoryId || item.menuCategoryId;
                        setCategoryId(String(fetchedId));
                        setSelectedCategoryData({ label: cat.nameEn || cat.nameMm || cat.name || `Category ${fetchedId}`, value: String(fetchedId) });
                    }).catch((e) => handleApiError(e, "Failed to load item category"));
                }
            }

            setIsVegetarian(item.isVegetarian || false);
            setIsSpicy(item.isSpicy || false);
            setIsAvailable(item.isAvailable !== false);
            setIsCombo(item.isCombo || false);
            setIsPopular(item.isPopular || false);
            setIsHotDeal(item.isHotDeal || false);
            setIsRecommended(item.isRecommended || false);
            setDisplayOrder(String(item.displayOrder || 1));
            setMealTypes(item.mealTypes || []);
            setTagIds(item.tagIds?.map(Number) || (item.tags ? item.tags.map((t: any) => Number(t.id)) : []));
            if (item.masterItemId) {
                setMasterItemId(String(item.masterItemId));
                const label = item.masterItemName || `Master Item #${item.masterItemId}`;
                setSelectedMasterItemData({ label, value: String(item.masterItemId) });

                // Fetch real name if backend didn't provide it
                if (!item.masterItemName) {
                    MasterItemService.getMasterItemById(item.masterItemId).then((m) => {
                        setMasterItemId(m.id.toString());
                        setSelectedMasterItemData({ label: m.nameEn || m.nameMm || `Item ${m.id}`, value: String(m.id) });
                    }).catch((e) => handleApiError(e, "Failed to load master item details"));
                }
            }
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
            const mappedOptionGroups = (item.optionGroups || []).map((og: any) => ({
                id: og.id,
                nameEn: og.nameEn || og.name_en || "",
                nameMm: og.nameMm || og.name_mm || "",
                nameTh: og.nameTh || og.name_th || "",
                isRequired: og.isRequired ?? og.is_required ?? false,
                minSelection: og.minSelection ?? og.min_selection ?? 0,
                maxSelection: og.maxSelection ?? og.max_selection ?? 1,
                displayOrder: og.displayOrder ?? og.display_order ?? 1,
                groupType: og.groupType || og.group_type || "SINGLE_SELECT",
                options: (og.options || []).map((opt: any) => ({
                    id: opt.id,
                    nameEn: opt.nameEn || opt.name_en || "",
                    nameMm: opt.nameMm || opt.name_mm || "",
                    nameTh: opt.nameTh || opt.name_th || "",
                    price: opt.price ?? 0,
                    isAvailable: opt.isAvailable ?? opt.is_available ?? true,
                    displayOrder: opt.displayOrder ?? opt.display_order ?? 1,
                    linkedMenuItemId: opt.linkedMenuItemId ?? opt.linked_menu_item_id,
                }))
            }));

            const mappedVariants = (item.variants || []).map((v: any) => ({
                id: v.id,
                nameEn: v.nameEn || v.name_en || "",
                nameMm: v.nameMm || v.name_mm || "",
                nameTh: v.nameTh || v.name_th || "",
                price: v.price ?? 0,
                isAvailable: v.isAvailable ?? v.is_available ?? true,
                displayOrder: v.displayOrder ?? v.display_order ?? 1,
            }));

            setOptionGroups(mappedOptionGroups);
            setVariants(mappedVariants);

            const resolvedImageUrl = item.imageUrl || (item as any).image_url || (item as any).mediaUrl || (item as any).media_url;
            if (resolvedImageUrl) {
                setExistingImage(resolvedImageUrl);
            }
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
            setPrice("");
            setOriginalPrice("");
            setDiscountAmount("");
            setDiscountPercentage("");
            setCurrency("THB");
            setCategoryId("");
            setShopId("");
            setSelectedShopData(null);
            setSelectedCategoryData(null);
            setIsVegetarian(false);
            setIsSpicy(false);

            setIsAvailable(true);
            setIsCombo(false);
            setIsPopular(false);
            setIsHotDeal(false);
            setIsRecommended(false);
            setDisplayOrder("1");
            setMealTypes([]);
            setTagIds([]);
            setMasterItemId("");
            setSelectedMasterItemData(null);
            setMasterCategoryId("");
            setSelectedMasterCategoryData(null);
            setComboComponents([]);
            setImageFile(null);
            setImagePreview(null);
            setExistingImage(null);
            setOptionGroups([]);
            setVariants([]);
            setSelectedCategoryData(null);
        }
    }, [id, isEditMode, loadItem]);


    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const originalFile = e.target.files?.[0];
        if (originalFile) {
            const file = await compressImage(originalFile);
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


    // handlePriceChange removed in favor of PriceInput

    const addOptionGroup = () => {
        setOptionGroups([...optionGroups, {
            nameEn: "",
            isRequired: false,
            minSelection: 0,
            maxSelection: 1,
            displayOrder: optionGroups.length + 1,
            groupType: "SINGLE_SELECT",
            options: [{ nameEn: "", price: 0, isAvailable: true, displayOrder: 1 }]
        }]);
    };

    const removeOptionGroup = (index: number) => {
        const updated = optionGroups.filter((_, i) => i !== index);
        // Re-calculate orders
        const reordered = updated.map((og, i) => ({ ...og, displayOrder: i + 1 }));
        setOptionGroups(reordered);
    };

    const updateOptionGroup = (index: number, updates: Partial<OptionGroup>) => {
        const newGroups = [...optionGroups];
        newGroups[index] = { ...newGroups[index], ...updates };
        setOptionGroups(newGroups);
    };

    const addOption = (groupIndex: number) => {
        const newGroups = [...optionGroups];
        const nextOrder = newGroups[groupIndex].options.length + 1;
        newGroups[groupIndex].options.push({ nameEn: "", price: 0, isAvailable: true, displayOrder: nextOrder });
        setOptionGroups(newGroups);
    };

    const removeOption = (groupIndex: number, optionIndex: number) => {
        const newGroups = [...optionGroups];
        const updatedOptions = newGroups[groupIndex].options.filter((_, i) => i !== optionIndex);
        // Re-calculate orders
        newGroups[groupIndex].options = updatedOptions.map((opt, i) => ({ ...opt, displayOrder: i + 1 }));
        setOptionGroups(newGroups);
    };

    const updateOption = (groupIndex: number, optionIndex: number, updates: Partial<Option>) => {
        const newGroups = [...optionGroups];
        newGroups[groupIndex].options[optionIndex] = { ...newGroups[groupIndex].options[optionIndex], ...updates };
        setOptionGroups(newGroups);
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

    const handleOptionGroupDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = optionGroups.findIndex((_, i) => `og-${i}` === active.id);
            const newIndex = optionGroups.findIndex((_, i) => `og-${i}` === over.id);
            const newArray = arrayMove(optionGroups, oldIndex, newIndex);
            setOptionGroups(newArray.map((og, i) => ({ ...og, displayOrder: i + 1 })));
        }
    };

    const handleOptionDragEnd = (groupIndex: number, event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const options = optionGroups[groupIndex].options;
            const oldIndex = options.findIndex((_, i) => `opt-${groupIndex}-${i}` === active.id);
            const newIndex = options.findIndex((_, i) => `opt-${groupIndex}-${i}` === over.id);
            const newArray = arrayMove(options, oldIndex, newIndex);

            const newGroups = [...optionGroups];
            newGroups[groupIndex].options = newArray.map((opt, i) => ({ ...opt, displayOrder: i + 1 }));
            setOptionGroups(newGroups);
        }
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
            const dtoData = {
                name: nameEn,
                nameEn: nameEn,
                name_en: nameEn, // snake_case backup
                nameMm: nameMm || "",
                name_mm: nameMm || "",
                nameTh: nameTh || "",
                name_th: nameTh || "",
                description: descriptionEn || "",
                descriptionMm: descriptionMm || "",
                description_mm: descriptionMm || "",
                descriptionTh: descriptionTh || "",
                description_th: descriptionTh || "",
                descriptionEn: descriptionEn || "",
                description_en: descriptionEn || "",
                price: Number(price.replace(/,/g, "")) || 0,
                originalPrice: originalPrice ? Number(originalPrice.replace(/,/g, "")) : 0,
                original_price: originalPrice ? Number(originalPrice.replace(/,/g, "")) : 0,
                discountPercentage: discountPercentage ? Number(discountPercentage.replace(/,/g, "")) : 0,
                discount_percentage: discountPercentage ? Number(discountPercentage.replace(/,/g, "")) : 0,
                currency: currency || "THB",
                menuCategoryId: Number(categoryId),
                menu_category_id: Number(categoryId),
                categoryId: Number(categoryId), // Fallback in case of categoryId
                category_id: Number(categoryId),
                shopId: Number(shopId),
                shop_id: Number(shopId),
                isVegetarian: isVegetarian,
                is_vegetarian: isVegetarian,
                isSpicy: isSpicy,
                is_spicy: isSpicy,
                isAvailable: isAvailable,
                is_available: isAvailable,
                isCombo: isCombo,
                is_combo: isCombo,
                isPopular: isPopular,
                is_popular: isPopular,
                isHotDeal: isHotDeal,
                is_hot_deal: isHotDeal,
                isRecommended: isRecommended,
                is_recommended: isRecommended,
                displayOrder: Number(displayOrder) >= 1 ? Number(displayOrder) : 1,
                display_order: Number(displayOrder) >= 1 ? Number(displayOrder) : 1,
                mealTypes: mealTypes,
                meal_types: mealTypes,
                tagIds: tagIds,
                tag_ids: tagIds,
                masterItemId: masterItemId ? Number(masterItemId) : undefined,
                master_item_id: masterItemId ? Number(masterItemId) : undefined,
                masterCategoryId: masterCategoryId ? Number(masterCategoryId) : undefined,
                master_category_id: masterCategoryId ? Number(masterCategoryId) : undefined,
                components: isCombo ? comboComponents.map((c, i) => {
                    const mappedComponent = { ...c, displayOrder: i + 1 };
                    if (!(isEditMode && id)) {
                        delete mappedComponent.id;
                    }
                    return mappedComponent;
                }) : [],
                optionGroups: optionGroups.map(og => ({
                    id: (isEditMode && id) ? og.id : undefined,
                    name: og.nameEn || og.name || "",
                    nameEn: og.nameEn || og.name || "",
                    nameMm: og.nameMm || "",
                    nameTh: og.nameTh || "",
                    displayOrder: og.displayOrder || 0,
                    maxSelection: og.maxSelection || 0,
                    minSelection: og.minSelection || 0,
                    isRequired: og.isRequired ?? false,
                    groupType: og.groupType || "SINGLE_SELECT",
                    // snake_case for backend compatibility
                    name_en: og.nameEn || og.name || "",
                    name_mm: og.nameMm || "",
                    name_th: og.nameTh || "",
                    display_order: og.displayOrder || 0,
                    max_selection: og.maxSelection || 0,
                    min_selection: og.minSelection || 0,
                    is_required: og.isRequired ?? false,
                    group_type: og.groupType || "SINGLE_SELECT",
                    options: og.options.map(opt => ({
                        id: (isEditMode && id) ? opt.id : undefined,
                        name: opt.nameEn || opt.name || "",
                        nameEn: opt.nameEn || opt.name || "",
                        nameMm: opt.nameMm || "",
                        nameTh: opt.nameTh || "",
                        price: opt.price || 0,
                        displayPrice: opt.displayPrice || "",
                        linkedMenuItemId: opt.linkedMenuItemId,
                        displayOrder: opt.displayOrder || 0,
                        isAvailable: opt.isAvailable ?? true,
                        // snake_case for backend compatibility
                        name_en: opt.nameEn || opt.name || "",
                        name_mm: opt.nameMm || "",
                        name_th: opt.nameTh || "",
                        display_price: opt.displayPrice || "",
                        linked_menu_item_id: opt.linkedMenuItemId,
                        display_order: opt.displayOrder || 0,
                        is_available: opt.isAvailable ?? true
                    }))
                })),
                variants: variants.map(v => ({
                    id: (isEditMode && id) ? v.id : undefined,
                    name: v.nameEn || v.name || "",
                    nameEn: v.nameEn || v.name || "",
                    nameMm: v.nameMm || "",
                    nameTh: v.nameTh || "",
                    price: v.price || 0,
                    isAvailable: v.isAvailable !== false,
                    displayOrder: v.displayOrder || 0,
                    // snake_case for backend compatibility
                    name_en: v.nameEn || v.name || "",
                    name_mm: v.nameMm || "",
                    name_th: v.nameTh || "",
                    is_available: v.isAvailable !== false,
                    display_order: v.displayOrder || 0
                }))
            };

            const formData = new FormData();
            formData.append("data", new Blob([JSON.stringify(dtoData)], { type: 'application/json' }));

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
                                    <Label>Name (Myanmar)</Label>
                                    <Input value={nameMm} onChange={e => setNameMm(e.target.value)} placeholder="e.g. ချိစ်ဘာဂါ" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Name (Thai)</Label>
                                    <Input value={nameTh} onChange={e => setNameTh(e.target.value)} placeholder="e.g. ชีสเบอร์เกอร์" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Name (English) / Default</Label>
                                    <Input value={nameEn} onChange={e => setNameEn(e.target.value)} required placeholder="e.g. Cheese Burger" />
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
                                    <Label>Description (English) / Default</Label>
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
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            value={displayOrder}
                                            onChange={e => {
                                                const val = e.target.value;
                                                if (val === "" || /^\d+$/.test(val)) {
                                                    setDisplayOrder(val);
                                                }
                                            }}
                                            onBlur={(e) => {
                                                const val = e.target.value;
                                                if (val === "" || val === "0") {
                                                    setDisplayOrder("1");
                                                }
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
                                        <Label>Base Price</Label>
                                        <PriceInput
                                            value={price}
                                            onValueChange={setPrice}
                                            required
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Original Price</Label>
                                        <PriceInput
                                            value={originalPrice}
                                            onValueChange={setOriginalPrice}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Discount Amount</Label>
                                        <PriceInput
                                            value={discountAmount}
                                            onValueChange={setDiscountAmount}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Discount (%)</Label>
                                        <PriceInput
                                            value={discountPercentage}
                                            onValueChange={setDiscountPercentage}
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
                                        <Switch checked={isCombo} onCheckedChange={(val) => { setIsCombo(val); if (!val) setComboComponents([]); }} id="combo" />
                                        <Label htmlFor="combo" className="font-medium cursor-pointer">Combo Meal</Label>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Switch checked={isPopular} onCheckedChange={setIsPopular} id="popular" />
                                        <Label htmlFor="popular" className="font-medium cursor-pointer">Popular Item</Label>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Switch checked={isHotDeal} onCheckedChange={setIsHotDeal} id="hotdeal" />
                                        <Label htmlFor="hotdeal" className="font-medium cursor-pointer">Hot Deal</Label>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Switch checked={isRecommended} onCheckedChange={setIsRecommended} id="recommended" />
                                        <Label htmlFor="recommended" className="font-medium cursor-pointer">Recommended</Label>
                                    </div>
                                </div>

                                {/* Meal Types */}
                                <div className="space-y-2 mt-4">
                                    <Label className="text-sm font-medium">Meal Types</Label>
                                    <div className="flex gap-6 p-3 bg-muted/20 rounded-lg">
                                        {[{ value: 'BREAKFAST', label: 'Breakfast' }, { value: 'LUNCH', label: 'Lunch' }, { value: 'DINNER', label: 'Dinner' }].map(mt => (
                                            <div key={mt.value} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`meal-${mt.value}`}
                                                    checked={mealTypes.includes(mt.value)}
                                                    onCheckedChange={() => toggleMealType(mt.value)}
                                                />
                                                <Label htmlFor={`meal-${mt.value}`} className="cursor-pointer text-sm font-medium">{mt.label}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 pt-6 border-t font-sans">
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
                                    <p className="text-sm text-muted-foreground">Select a category for this item and optionally link it to a global master item/category.</p>
                                </div>
                                <div className="grid grid-cols-1 gap-6">
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-dashed">
                                        <div className="space-y-2">
                                            <Label>Master Item</Label>
                                            <InfiniteSearchableSelect
                                                fetchData={fetchMasterItemData}
                                                valueKey="value"
                                                labelKey="label"
                                                selectedValue={selectedMasterItemData}
                                                onChange={(item) => {
                                                    setMasterItemId(item?.value || "");
                                                    setSelectedMasterItemData(item);
                                                }}
                                                placeholder="Search master items..."
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
                                                    <div key={cIdx} className="flex flex-wrap items-center gap-3 p-3 border rounded-xl bg-white shadow-sm">
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
                                                                type="number"
                                                                min={1}
                                                                value={comp.quantity}
                                                                onChange={e => updateComboComponent(cIdx, { quantity: parseInt(e.target.value) || 1 })}
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
                                        <CardTitle className="text-base">Option Groups</CardTitle>
                                        <CardDescription>Groups of extras like "Toppings", "Sizes", etc.</CardDescription>
                                    </div>
                                    <Button type="button" variant="outline" size="sm" onClick={addOptionGroup} className="gap-2">
                                        <Plus className="h-4 w-4" /> Add Group
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleOptionGroupDragEnd}
                                    >
                                        <SortableContext
                                            items={optionGroups.map((_, i) => `og-${i}`)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {optionGroups.length === 0 ? (
                                                <div className="text-center py-6 border rounded-lg border-dashed text-muted-foreground text-sm">
                                                    No option groups added.
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {optionGroups.map((group, gIdx) => (
                                                        <SortableItem key={`og-${gIdx}`} id={`og-${gIdx}`}>
                                                            <div className="p-4 border rounded-xl bg-white shadow-sm space-y-4 relative group/og">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="absolute top-2 right-2 text-muted-foreground hover:text-destructive h-8 w-8"
                                                                    onClick={() => removeOptionGroup(gIdx)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>

                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mr-8">
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
                                                                </div>
                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                    <div className="space-y-2">
                                                                        <Label className="text-xs font-bold uppercase text-muted-foreground">Group Type</Label>
                                                                        <Select
                                                                            value={group.groupType || "SINGLE_SELECT"}
                                                                            onValueChange={val => updateOptionGroup(gIdx, { groupType: val as "SINGLE_SELECT" | "MULTI_SELECT" })}
                                                                        >
                                                                            <SelectTrigger className="h-10">
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="SINGLE_SELECT">Single Select</SelectItem>
                                                                                <SelectItem value="MULTI_SELECT">Multi Select</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
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
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <div className="space-y-1">
                                                                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Min Selection</Label>
                                                                            <Input
                                                                                type="number"
                                                                                value={group.minSelection}
                                                                                onChange={e => updateOptionGroup(gIdx, { minSelection: parseInt(e.target.value) || 0 })}
                                                                                className="h-8"
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Max Selection</Label>
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
                                                                    <DndContext
                                                                        sensors={sensors}
                                                                        collisionDetection={closestCenter}
                                                                        onDragEnd={(e) => handleOptionDragEnd(gIdx, e)}
                                                                    >
                                                                        <SortableContext
                                                                            items={group.options.map((_, i) => `opt-${gIdx}-${i}`)}
                                                                            strategy={verticalListSortingStrategy}
                                                                        >
                                                                            <div className="space-y-2">
                                                                                {group.options.map((opt, oIdx) => (
                                                                                    <SortableItem key={`opt-${gIdx}-${oIdx}`} id={`opt-${gIdx}-${oIdx}`}>
                                                                                        <div className="flex flex-wrap items-center gap-2 bg-muted/20 p-2 rounded-lg relative group/opt">
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
                                                                                            <div className="flex items-center gap-1 w-20">
                                                                                                <span className="text-xs text-muted-foreground">Order:</span>
                                                                                                <Input
                                                                                                    type="text"
                                                                                                    inputMode="numeric"
                                                                                                    pattern="[0-9]*"
                                                                                                    className="h-8 text-sm px-1 text-center"
                                                                                                    value={opt.displayOrder}
                                                                                                    onChange={e => {
                                                                                                        const val = e.target.value.replace(/^0+(?!$)/, "");
                                                                                                        if (val === "" || /^\d+$/.test(val)) {
                                                                                                            updateOption(gIdx, oIdx, { displayOrder: parseInt(val) || 1 });
                                                                                                        }
                                                                                                    }}
                                                                                                />
                                                                                            </div>
                                                                                            <div className="flex items-center gap-1 w-28">
                                                                                                <span className="text-xs text-muted-foreground font-mono">+</span>
                                                                                                <Input
                                                                                                    type="text"
                                                                                                    inputMode="decimal"
                                                                                                    className="h-8 text-sm px-2"
                                                                                                    placeholder="Price"
                                                                                                    value={opt.price === 0 ? "" : opt.price}
                                                                                                    onChange={e => {
                                                                                                        const val = e.target.value;
                                                                                                        if (val === "" || /^\d*\.?\d*$/.test(val)) {
                                                                                                            updateOption(gIdx, oIdx, { price: parseFloat(val) || 0 });
                                                                                                        }
                                                                                                    }}
                                                                                                />
                                                                                            </div>
                                                                                            <Input
                                                                                                className="flex-1 min-w-[120px] h-8 text-sm"
                                                                                                placeholder="Display Price (e.g. 1,500 THB)"
                                                                                                value={opt.displayPrice || ""}
                                                                                                onChange={e => updateOption(gIdx, oIdx, { displayPrice: e.target.value })}
                                                                                            />
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
                                                                                    </SortableItem>
                                                                                ))}
                                                                            </div>
                                                                        </SortableContext>
                                                                    </DndContext>
                                                                </div>
                                                            </div>
                                                        </SortableItem>
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
                                                        <SortableItem key={`var-${vIdx}`} id={`var-${vIdx}`}>
                                                            <div className="flex flex-wrap items-center gap-2 bg-white border p-3 rounded-xl shadow-sm relative group/var">
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
                                                        </SortableItem>
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
                                                <img src={imagePreview || formatImageUrl(existingImage) || ""} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
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
