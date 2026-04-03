import { useState, useEffect, useCallback, useRef } from "react"
import { useForm, SubmitHandler, Resolver, Control } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useSearchParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { PriceInput } from "@/components/ui/PriceInput"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Upload, X, Truck, Car, Wifi, Utensils, Leaf, Trash2 } from "lucide-react"
import { ShopService, ShopFormDataDTO, DistrictDTO, ShopCategoryDTO, ShopSubCategoryDTO, PaymentMethodDTO, CuisineTypeDTO } from "@/services/shopService"
import { PaymentService } from "@/services/paymentService"
import { userService } from "@/services/userService"
import { Loader } from "@/components/ui/loader"
import { toast } from "sonner"
import { handleApiError } from "@/lib/error-utils"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { InfiniteSearchableSelect } from "@/components/ui/infinite-searchable-select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

// Schema based on API CreateShopRequest
interface OperatingHour {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
}

export interface ShopFormValues {
    nameEn: string;
    nameMm?: string;
    nameTh?: string;
    shopCategoryId: number;
    shopSubCategoryId?: number;
    addressEn: string;
    addressMm?: string;
    addressTh?: string;
    districtId: number;
    latitude: number;
    longitude: number;
    phone: string;
    email?: string;
    descriptionEn: string;
    descriptionMm?: string;
    descriptionTh?: string;
    hasDelivery: boolean;
    deliveryEnabled: boolean;
    hasParking: boolean;
    hasWifi: boolean;
    isVerified: boolean;
    isActive: boolean;
    isHalal: boolean;
    isVegetarian: boolean;
    pricePreference: "LOW" | "MEDIUM" | "HIGH";
    enableStockCheck: boolean;
    maxItemQuantityPerOrder: number;
    minOrderAmount: number;
    baseDeliveryFee: number;
    cuisineTypeIds: number[];
    mealTypes: string[];
    supportedDeliveryTypes: string[];
    paymentMethodIds: number[];
    operatingHours: OperatingHour[];
    ownerId?: number;
}

const shopFormSchema = z.object({
    nameEn: z.string().optional(),
    nameMm: z.string().optional().or(z.literal("")),
    nameTh: z.string().optional().or(z.literal("")),
    shopCategoryId: z.number().optional().nullable(),
    shopSubCategoryId: z.number().optional().nullable(),
    addressEn: z.string().optional(),
    addressMm: z.string().optional().or(z.literal("")),
    addressTh: z.string().optional().or(z.literal("")),
    districtId: z.number().optional().nullable(),
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),
    phone: z.string().optional(),
    email: z.string().optional().or(z.literal("")),
    descriptionEn: z.string().optional(),
    descriptionMm: z.string().optional().or(z.literal("")),
    descriptionTh: z.string().optional().or(z.literal("")),
    hasDelivery: z.boolean().default(false),
    deliveryEnabled: z.boolean().default(false),
    hasParking: z.boolean().default(false),
    hasWifi: z.boolean().default(false),
    isVerified: z.boolean().default(false),
    isActive: z.boolean().default(true),
    isHalal: z.boolean().default(false),
    isVegetarian: z.boolean().default(false),
    pricePreference: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
    enableStockCheck: z.boolean().default(false),
    maxItemQuantityPerOrder: z.number().default(10),
    minOrderAmount: z.coerce.number().default(1),
    baseDeliveryFee: z.coerce.number().default(0),
    cuisineTypeIds: z.array(z.number()).default([]),
    mealTypes: z.array(z.string()).default([]),
    supportedDeliveryTypes: z.array(z.string()).default([]),
    paymentMethodIds: z.array(z.number()).default([]),
    operatingHours: z.array(z.object({
        dayOfWeek: z.number(),
        openTime: z.string(),
        closeTime: z.string(),
        isClosed: z.boolean()
    })).default([]),
    ownerId: z.number().optional().nullable(),
})

export default function CreateShopRestaurant() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const shopId = searchParams.get("id")
    const isEditMode = !!shopId

    const [coverPreview, setCoverPreview] = useState<string | null>(null)
    const [coverFile, setCoverFile] = useState<File | null>(null)
    const [logoPreview, setLogoPreview] = useState<string | null>(null)
    const [logoFile, setLogoFile] = useState<File | null>(null)

    // Gallery Photos
    const [galleryFiles, setGalleryFiles] = useState<File[]>([])
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([])
    const [existingGalleryUrls, setExistingGalleryUrls] = useState<string[]>([])

    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [setupData, setSetupData] = useState<ShopFormDataDTO | null>(null)
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethodDTO[]>([])
    const [setupLoading, setSetupLoading] = useState(true)
    const [selectedCityId, setSelectedCityId] = useState<number | null>(null)
    const [availableDistricts, setAvailableDistricts] = useState<DistrictDTO[]>([])

    // Categories
    const [shopCategories, setShopCategories] = useState<ShopCategoryDTO[]>([])
    const [categoriesLoading, setCategoriesLoading] = useState(false)
    const [shopSubCategories, setShopSubCategories] = useState<ShopSubCategoryDTO[]>([])

    const [selectedOwnerName, setSelectedOwnerName] = useState<string | null>(null)

    // Ref to prevent double API calls
    const shopDataLoadedRef = useRef(false)



    const form = useForm<ShopFormValues>({
        resolver: zodResolver(shopFormSchema) as Resolver<ShopFormValues>,
        mode: "onChange",
        defaultValues: {
            nameEn: "",
            nameMm: "",
            nameTh: "",
            shopCategoryId: undefined,
            shopSubCategoryId: undefined,
            addressEn: "",
            addressMm: "",
            addressTh: "",
            districtId: undefined,
            latitude: undefined,
            longitude: undefined,
            phone: "",
            email: "",
            descriptionEn: "",
            descriptionMm: "",
            descriptionTh: "",
            hasDelivery: false,
            deliveryEnabled: false,
            hasParking: false,
            hasWifi: false,
            isVerified: false,
            isActive: true,
            isHalal: false,
            isVegetarian: false,
            pricePreference: "MEDIUM",
            enableStockCheck: false,
            maxItemQuantityPerOrder: 10,
            minOrderAmount: 1,
            baseDeliveryFee: 0,
            cuisineTypeIds: [],
            mealTypes: [],
            supportedDeliveryTypes: [],
            paymentMethodIds: [],
            operatingHours: [
                { dayOfWeek: 0, openTime: "09:00", closeTime: "21:00", isClosed: false },
                { dayOfWeek: 1, openTime: "09:00", closeTime: "21:00", isClosed: false },
                { dayOfWeek: 2, openTime: "09:00", closeTime: "21:00", isClosed: false },
                { dayOfWeek: 3, openTime: "09:00", closeTime: "21:00", isClosed: false },
                { dayOfWeek: 4, openTime: "09:00", closeTime: "21:00", isClosed: false },
                { dayOfWeek: 5, openTime: "09:00", closeTime: "21:00", isClosed: false },
                { dayOfWeek: 6, openTime: "09:00", closeTime: "21:00", isClosed: false },
            ],
            ownerId: undefined,
        },
    })

    const loadSetupData = useCallback(async () => {
        setSetupLoading(true)
        setCategoriesLoading(true)
        try {
            const [setupData, categories, subCategories] = await Promise.all([
                PaymentService.getShopFormData(),
                ShopService.getCategories(),
                ShopService.getSubCategories()
            ])
            setSetupData(setupData)
            setShopCategories(categories)
            setShopSubCategories(subCategories)
            setPaymentMethods(setupData.paymentMethods || [])
        } catch (error) {
            handleApiError(error, "Failed to load necessary form data")
        } finally {
            setSetupLoading(false)
            setCategoriesLoading(false)
        }
    }, [])

    const fetchCategoryData = useCallback(async (page: number, size: number, search: string) => {
        // If there's a search term, we should hit the API
        if (search) {
            const results = await ShopService.getCategories({ page, size, search });
            return {
                content: results.map(c => ({ label: c.nameEn || `Category ${c.id}`, value: c.id })),
                last: results.length < size,
            };
        }

        // Use existing shopCategories if available for initial load to avoid extra API calls
        let categories = shopCategories;
        if (categories.length === 0) {
            categories = await ShopService.getCategories();
            setShopCategories(categories);
        }

        const start = page * size;
        const slice = categories.slice(start, start + size);
        return {
            content: slice.map(c => ({ label: c.nameEn || `Category ${c.id}`, value: c.id })),
            last: start + size >= categories.length,
        };
    }, [shopCategories]);

    const fetchSubCategoryData = useCallback(async (page: number, size: number, search: string) => {
        if (search) {
            const results = await ShopService.getSubCategories({ page, size, search });
            return {
                content: results.map(s => ({ label: s.nameEn || `SubCategory ${s.id}`, value: s.id })),
                last: results.length < size,
            };
        }

        let subCategories = shopSubCategories;
        if (subCategories.length === 0) {
            subCategories = await ShopService.getSubCategories();
            setShopSubCategories(subCategories);
        }

        const start = page * size;
        const slice = subCategories.slice(start, start + size);
        return {
            content: slice.map(s => ({ label: s.nameEn || `SubCategory ${s.id}`, value: s.id })),
            last: start + size >= subCategories.length,
        };
    }, [shopSubCategories]);

    const fetchOwnerData = useCallback(async (page: number, size: number, search: string) => {
        const results = await userService.getShopOwners(page, size, search);
        return {
            content: results.content.map(u => ({ label: u.fullName || u.username || `User ${u.id}`, value: Number(u.id) })),
            last: results.number + 1 >= results.totalPages,
        };
    }, []);

    const loadShopData = useCallback(async (id: string) => {
        if (shopDataLoadedRef.current) return;
        shopDataLoadedRef.current = true;
        
        setLoading(true)
        try {
            const shopId = parseInt(id, 10)
            if (isNaN(shopId)) {
                toast.error("Invalid shop ID")
                navigate("/shops/manage")
                return
            }

            const [shop, shopPaymentMethods, shopOperatingHours] = await Promise.all([
                ShopService.getShopById(shopId),
                ShopService.getShopPaymentMethods(shopId),
                ShopService.getShopOperatingHours(shopId)
            ])

            // Map API response to form structure
            form.reset({
                nameEn: shop.nameEn || shop.nameMm || "",
                nameMm: shop.nameMm || shop.nameEn || "",
                nameTh: shop.nameTh || "",
                shopCategoryId: shop.shopCategoryId || undefined,
                shopSubCategoryId: shop.shopSubCategoryId || undefined,
                addressEn: shop.address || shop.addressEn || shop.addressMm || "",
                addressMm: shop.addressMm || shop.address || "",
                addressTh: shop.addressTh || "",
                districtId: shop.districtId || undefined,
                latitude: shop.latitude || undefined,
                longitude: shop.longitude || undefined,
                phone: shop.phone || "",
                email: shop.email || "",
                descriptionEn: shop.descriptionEn || shop.description || "",
                descriptionMm: shop.descriptionMm || "",
                descriptionTh: shop.descriptionTh || "",
                hasDelivery: shop.hasDelivery ?? false,
                deliveryEnabled: shop.deliveryEnabled ?? false,
                hasParking: shop.hasParking ?? false,
                hasWifi: shop.hasWifi ?? false,
                isVerified: shop.isVerified ?? false,
                isActive: shop.isActive ?? true,
                isHalal: shop.isHalal ?? false,
                isVegetarian: shop.isVegetarian ?? false,
                pricePreference: shop.pricePreference || "MEDIUM",
                enableStockCheck: shop.enableStockCheck ?? false,
                maxItemQuantityPerOrder: shop.maxItemQuantityPerOrder ?? 10,
                minOrderAmount: (shop.minOrderAmount === undefined || shop.minOrderAmount === null || shop.minOrderAmount === 0) ? 1 : shop.minOrderAmount,
                baseDeliveryFee: shop.baseDeliveryFee ?? 0,
                cuisineTypeIds: shop.cuisineTypeIds || (shop.cuisineTypes ? shop.cuisineTypes.map((c: CuisineTypeDTO) => c.id) : []),
                mealTypes: shop.mealTypes || [],
                supportedDeliveryTypes: shop.supportedDeliveryTypes || [],
                paymentMethodIds: shopPaymentMethods.map(pm => pm.id),
                operatingHours: shopOperatingHours && shopOperatingHours.length > 0
                    ? shopOperatingHours.map((oh) => ({
                        dayOfWeek: oh.dayOfWeek,
                        openTime: typeof oh.openingTime === 'string' ? oh.openingTime.substring(0, 5) : (oh.openTime || "09:00"),
                        closeTime: typeof oh.closingTime === 'string' ? oh.closingTime.substring(0, 5) : (oh.closeTime || "21:00"),
                        isClosed: oh.isClosed ?? false
                    }))
                    : [
                        { dayOfWeek: 0, openTime: "09:00", closeTime: "21:00", isClosed: false },
                        { dayOfWeek: 1, openTime: "09:00", closeTime: "21:00", isClosed: false },
                        { dayOfWeek: 2, openTime: "09:00", closeTime: "21:00", isClosed: false },
                        { dayOfWeek: 3, openTime: "09:00", closeTime: "21:00", isClosed: false },
                        { dayOfWeek: 4, openTime: "09:00", closeTime: "21:00", isClosed: false },
                        { dayOfWeek: 5, openTime: "09:00", closeTime: "21:00", isClosed: false },
                        { dayOfWeek: 6, openTime: "09:00", closeTime: "21:00", isClosed: false },
                    ],
                ownerId: shop.ownerId || undefined,
            })

            setSelectedOwnerName(shop.ownerName || null);

            // Handle images
            if (shop.logoUrl) {
                setLogoPreview(shop.logoUrl);
            }
            if (shop.coverUrl) {
                setCoverPreview(shop.coverUrl);
            } else if (shop.primaryPhotoUrl) {
                setCoverPreview(shop.primaryPhotoUrl);
            }

            // Handle gallery photos
            if (shop.photos && shop.photos.length > 0) {
                setExistingGalleryUrls(shop.photos.map((p: { url?: string; thumbnailUrl?: string }) => p.url || p.thumbnailUrl || "").filter(Boolean));
            } else {
                setExistingGalleryUrls([]);
            }

            // 1. First priority: Set directly from IDs if available in the response
            if (shop.cityId) {
                setSelectedCityId(shop.cityId);
            }

            // 2. Second priority: If IDs are missing but names are present, derivation logic
            if (setupData?.cities) {
                let city = null;
                
                // If cityId was missing, try to find it by matching other fields
                if (!shop.cityId) {
                    // Try by districtId
                    if (shop.districtId) {
                        city = setupData.cities.find(c =>
                            c.districts?.some(d => d.id === shop.districtId)
                        );
                    }
                    
                    // Try matching by district name
                    if (!city && shop.district) {
                        const districtName = shop.district;
                        city = setupData.cities.find(c =>
                            c.districts?.some(d => 
                                d.nameEn === districtName || 
                                d.nameMm === districtName
                            )
                        );
                    }
                    
                    // Try by city name
                    if (!city && shop.city) {
                        const cityName = shop.city;
                        city = setupData.cities.find(c =>
                            c.nameEn === cityName || c.nameMm === cityName
                        );
                    }
                    
                    if (city) {
                        setSelectedCityId(city.id);
                    }
                } else {
                    city = setupData.cities.find(c => c.id === shop.cityId);
                }

                // Fallback for districtId if ID was missing but name exists
                if (city && !shop.districtId && shop.district) {
                    const district = city.districts?.find(d => 
                        d.nameEn === shop.district || d.nameMm === shop.district
                    );
                    if (district) {
                        form.setValue("districtId", district.id);
                    }
                }
            }

        } catch (error) {
            handleApiError(error, "Failed to load shop data")
            navigate("/shops/manage")
        } finally {
            setLoading(false)
        }
    }, [form, navigate, setupData])

    useEffect(() => {
        // Sync districts when city or setupData changes
        if (selectedCityId && setupData?.cities) {
            const city = setupData.cities.find(c => c.id === selectedCityId);
            if (city) {
                setAvailableDistricts(city.districts || []);
            }
        }
    }, [selectedCityId, setupData])

    useEffect(() => {
        loadSetupData()
    }, [loadSetupData])

    useEffect(() => {
        shopDataLoadedRef.current = false;
    }, [shopId])

    useEffect(() => {
        if (isEditMode && shopId) {
            loadShopData(shopId)
        } else {
            // Reset form for create mode
            form.reset({
                nameEn: "",
                nameMm: "",
                nameTh: "",
                shopCategoryId: undefined,
                shopSubCategoryId: undefined,
                addressEn: "",
                addressMm: "",
                addressTh: "",
                districtId: 0,
                latitude: 0,
                longitude: 0,
                phone: "",
                email: "",
                descriptionEn: "",
                descriptionMm: "",
                descriptionTh: "",
                hasDelivery: false,
                deliveryEnabled: false,
                hasParking: false,
                hasWifi: false,
                isVerified: false,
                isActive: true,
                isHalal: false,
                isVegetarian: false,
                pricePreference: "MEDIUM",
                enableStockCheck: false,
                maxItemQuantityPerOrder: 10,
                minOrderAmount: 1,
                baseDeliveryFee: 0,
                cuisineTypeIds: [],
                mealTypes: [],
                supportedDeliveryTypes: [],
                operatingHours: [
                    { dayOfWeek: 0, openTime: "09:00", closeTime: "21:00", isClosed: false },
                    { dayOfWeek: 1, openTime: "09:00", closeTime: "21:00", isClosed: false },
                    { dayOfWeek: 2, openTime: "09:00", closeTime: "21:00", isClosed: false },
                    { dayOfWeek: 3, openTime: "09:00", closeTime: "21:00", isClosed: false },
                    { dayOfWeek: 4, openTime: "09:00", closeTime: "21:00", isClosed: false },
                    { dayOfWeek: 5, openTime: "09:00", closeTime: "21:00", isClosed: false },
                    { dayOfWeek: 6, openTime: "09:00", closeTime: "21:00", isClosed: false },
                ],
                ownerId: undefined,
            })
            setSelectedOwnerName(null)
            setCoverPreview(null)
            setCoverFile(null)
            setLogoPreview(null)
            setLogoFile(null)
            setGalleryFiles([])
            setGalleryPreviews([])
            setExistingGalleryUrls([])
        }
    }, [shopId, isEditMode, loadShopData, form])


    const onSubmit: SubmitHandler<ShopFormValues> = async (data) => {
        setSubmitting(true)
        try {
            // Create FormData
            const formData = new FormData();

            const payloadData = {
                nameEn: data.nameEn,
                nameMm: data.nameMm || "",
                nameTh: data.nameTh || "",
                shopCategoryId: data.shopCategoryId,
                shopSubCategoryId: data.shopSubCategoryId || null,
                addressEn: data.addressEn,
                addressMm: data.addressMm || "",
                addressTh: data.addressTh || "",
                districtId: data.districtId,
                latitude: data.latitude,
                longitude: data.longitude,
                phone: data.phone || "",
                email: data.email || "",
                descriptionEn: data.descriptionEn || "",
                descriptionMm: data.descriptionMm || "",
                descriptionTh: data.descriptionTh || "",
                hasDelivery: data.hasDelivery ?? false,
                deliveryEnabled: data.deliveryEnabled ?? false,
                hasParking: data.hasParking ?? false,
                hasWifi: data.hasWifi ?? false,
                isVerified: data.isVerified ?? false,
                isActive: data.isActive ?? true,
                isHalal: data.isHalal ?? false,
                isVegetarian: data.isVegetarian ?? false,
                pricePreference: data.pricePreference || "MEDIUM",
                enableStockCheck: data.enableStockCheck ?? false,
                maxItemQuantityPerOrder: data.maxItemQuantityPerOrder || 10,
                minOrderAmount: data.minOrderAmount || 1,
                baseDeliveryFee: data.baseDeliveryFee || 0,
                cuisineTypeIds: data.cuisineTypeIds,
                mealTypes: data.mealTypes,
                supportedDeliveryTypes: data.supportedDeliveryTypes,
                paymentMethodIds: data.paymentMethodIds,
                operatingHours: data.operatingHours,
                ownerId: data.ownerId || null,
            };

            formData.append("data", new Blob([JSON.stringify(payloadData)], {
                type: "application/json"
            }));

            // Append Logo Photo
            if (logoFile) {
                formData.append("logoPhoto", logoFile);
            }

            // Append Cover Photo
            if (coverFile) {
                formData.append("coverPhoto", coverFile);
            }

            // Append Gallery Photos
            galleryFiles.forEach((file) => {
                formData.append("galleryPhotos", file);
            });

            if (isEditMode && shopId) {
                const numericId = parseInt(shopId, 10)
                await ShopService.updateShop(numericId, formData)
                toast.success("Shop updated successfully!")
            } else {
                await ShopService.createShop(formData)
                toast.success("Shop created successfully!")
            }
            navigate("/shops/manage")
        } catch (error: unknown) {
            handleApiError(error, isEditMode ? "Failed to update shop" : "Failed to create shop")
        } finally {
            setSubmitting(false)
        }
    }

    const handleCancel = () => {
        navigate("/shops/manage")
    }

    const handleDelete = async () => {
        if (!shopId) return

        setDeleting(true)
        try {
            const numericId = parseInt(shopId, 10)
            await ShopService.deleteShop(numericId)
            toast.success("Shop deleted successfully!")
            navigate("/shops/manage")
        } catch (error) {
            handleApiError(error, "Failed to delete shop")
        } finally {
            setDeleting(false)
            setDeleteDialogOpen(false)
        }
    }

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null
        setCoverFile(file);
        if (!file) {
            // Keep preview if it was from existing data? 
            // Better to clear if user explicitly cleared input, but input file doesn't allow 'clear' easily without reset.
            // If they pick nothing, we keep current file or clear it.
            if (!coverPreview?.startsWith('http')) setCoverPreview(null);
            return
        }
        const reader = new FileReader()
        reader.onloadend = () => setCoverPreview(reader.result as string)
        reader.readAsDataURL(file)
    }

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null
        setLogoFile(file);
        if (!file) {
            if (!logoPreview?.startsWith('http')) setLogoPreview(null);
            return
        }
        const reader = new FileReader()
        reader.onloadend = () => setLogoPreview(reader.result as string)
        reader.readAsDataURL(file)
    }

    const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        setGalleryFiles(prev => [...prev, ...files]);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setGalleryPreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
        // Reset input so same files can be re-added after removal
        e.target.value = "";
    };

    const removeGalleryPhoto = (index: number) => {
        setGalleryFiles(prev => prev.filter((_, i) => i !== index));
        setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingGalleryPhoto = (index: number) => {
        setExistingGalleryUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleCityChange = (cityId: number) => {
        setSelectedCityId(cityId);
        form.setValue("districtId", 0);
    };

    const handleDistrictChange = (districtId: number) => {
        form.setValue("districtId", districtId);
    };

    return (
        <div className="container mx-auto py-10 max-w-5xl">
            <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight truncate sm:overflow-visible sm:whitespace-normal">
                    {isEditMode ? "Edit Shop / Restaurant" : "Create Shop / Restaurant"}
                </h2>
                <p className="text-muted-foreground line-clamp-2 sm:line-clamp-none">
                    {isEditMode ? "Update establishment details." : "Add a new establishment to the platform."}
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-24">
                    <Loader />
                </div>
            ) : (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column - Main Info */}
                            <div className="lg:col-span-2 space-y-8">
                                {/* Basic Information */}
                                <Card className="border-solid">
                                    <CardHeader>
                                        <CardTitle>Basic Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-6">
                                        <FormField
                                            control={form.control}
                                            name="nameEn"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Shop Name (English)</FormLabel>
                                                    <FormControl>
                                                        <Input 
                                                            placeholder="e.g. My Together Cafe" 
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="nameMm"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Shop Name (Myanmar)</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Enter name in Myanmar" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="nameTh"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Shop Name (Thai)</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Enter name in Thai" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="shopCategoryId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Category</FormLabel>
                                                    <FormControl>
                                                        <InfiniteSearchableSelect
                                                            fetchData={fetchCategoryData}
                                                            valueKey="value"
                                                            labelKey="label"
                                                            selectedValue={field.value ? { 
                                                                label: shopCategories.find(c => Number(c.id) === Number(field.value))?.nameEn || 
                                                                       setupData?.shopCategories?.find(c => Number(c.id) === Number(field.value))?.nameEn ||
                                                                       "Selected", 
                                                                value: field.value 
                                                            } : null}
                                                            onChange={(item) => item && field.onChange((item as { label: string; value: number }).value)}
                                                            placeholder="Select Category"
                                                            disabled={categoriesLoading}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="shopSubCategoryId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Sub Category</FormLabel>
                                                    <FormControl>
                                                        <InfiniteSearchableSelect
                                                            fetchData={fetchSubCategoryData}
                                                            valueKey="value"
                                                            labelKey="label"
                                                            selectedValue={field.value ? { 
                                                                label: shopSubCategories.find(s => Number(s.id) === Number(field.value))?.nameEn || "Selected", 
                                                                value: field.value 
                                                            } : null}
                                                            onChange={(item) => field.onChange(item ? (item as { label: string; value: number }).value : undefined)}
                                                            placeholder="Select Sub Category (Optional)"
                                                            disabled={false}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="ownerId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Shop Owner</FormLabel>
                                                    <FormControl>
                                                        <InfiniteSearchableSelect
                                                            fetchData={fetchOwnerData}
                                                            valueKey="value"
                                                            labelKey="label"
                                                            selectedValue={field.value ? { 
                                                                label: selectedOwnerName || "Selected Owner", 
                                                                value: field.value 
                                                            } : null}
                                                            onChange={(item) => {
                                                                if (item) {
                                                                    field.onChange((item as { label: string; value: number }).value);
                                                                    setSelectedOwnerName((item as { label: string; value: number }).label);
                                                                } else {
                                                                    field.onChange(null);
                                                                    setSelectedOwnerName(null);
                                                                }
                                                            }}
                                                            placeholder="Select Shop Owner"
                                                            disabled={false}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Assign a registered shop owner to this establishment.
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <Separator className="my-2" />

                                        <div className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name="descriptionEn"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Description (English)</FormLabel>
                                                        <FormControl>
                                                            <Textarea rows={3} className="resize-none" placeholder="Tell us about the shop in English..." {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="descriptionMm"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Description (Myanmar)</FormLabel>
                                                            <FormControl>
                                                                <Textarea rows={2} className="resize-none" placeholder="Description in Myanmar..." {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="descriptionTh"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Description (Thai)</FormLabel>
                                                            <FormControl>
                                                                <Textarea rows={2} className="resize-none" placeholder="Description in Thai..." {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        {/* Advanced Types: Cuisine, Meal, Delivery */}
                                        <div className="space-y-4 pt-4 border-t">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <FormField
                                                    control={form.control}
                                                    name="cuisineTypeIds"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Cuisine Types</FormLabel>
                                                            <div className="flex flex-wrap gap-2 mb-2">
                                                                {field.value?.map((id: number) => {
                                                                    const cuisine = setupData?.cuisineTypes?.find((c: CuisineTypeDTO) => c.id === id)
                                                                    const label = cuisine ? (cuisine.nameEn || cuisine.name) : `Cuisine ${id}`
                                                                    return (
                                                                        <Badge key={id} variant="secondary" className="gap-1">
                                                                            {label}
                                                                            <X
                                                                                className="h-3 w-3 cursor-pointer"
                                                                                onClick={() => field.onChange(field.value.filter((val: number) => val !== id))}
                                                                            />
                                                                        </Badge>
                                                                    )
                                                                })}
                                                            </div>
                                                            <FormControl>
                                                                <SearchableSelect
                                                                    data={setupData?.cuisineTypes?.map((c: CuisineTypeDTO) => ({
                                                                        label: c.nameEn || c.name || `Cuisine ${c.id}`,
                                                                        value: c.id
                                                                    })) || []}
                                                                    value="value"
                                                                    labelKey="label"
                                                                    onChange={(item) => {
                                                                        if (item && !field.value?.includes(item.value)) {
                                                                            field.onChange([...(field.value || []), item.value])
                                                                        }
                                                                    }}
                                                                    placeholder={setupLoading ? "Loading cuisine types..." : "Add cuisine type"}
                                                                    disabled={setupLoading}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <div className="space-y-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="mealTypes"
                                                        render={() => (
                                                            <FormItem>
                                                                <div className="mb-4">
                                                                    <FormLabel className="text-base">Meal Types</FormLabel>
                                                                </div>
                                                                <div className="flex flex-wrap gap-4">
                                                                    {["BREAKFAST", "LUNCH", "DINNER"].map((type) => (
                                                                        <FormField
                                                                            key={type}
                                                                            control={form.control as Control<ShopFormValues>}
                                                                            name="mealTypes"
                                                                            render={({ field }) => (
                                                                                <FormItem key={type} className="flex flex-row items-start space-x-3 space-y-0">
                                                                                    <FormControl>
                                                                                        <Checkbox
                                                                                            checked={(field.value as string[])?.includes(type)}
                                                                                            onCheckedChange={(checked) => {
                                                                                                return checked
                                                                                                    ? field.onChange([...((field.value as string[]) || []), type])
                                                                                                    : field.onChange((field.value as string[])?.filter((value: string) => value !== type))
                                                                                            }}
                                                                                        />
                                                                                    </FormControl>
                                                                                    <FormLabel className="font-normal capitalize cursor-pointer">
                                                                                        {type.toLowerCase()}
                                                                                    </FormLabel>
                                                                                </FormItem>
                                                                            )}
                                                                        />
                                                                    ))}
                                                                </div>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="supportedDeliveryTypes"
                                                        render={() => (
                                                            <FormItem>
                                                                <div className="mb-4">
                                                                    <FormLabel className="text-base">Delivery Types</FormLabel>
                                                                </div>
                                                                <div className="flex flex-wrap gap-4">
                                                                    {["PICKUP", "DELIVERY"].map((type) => (
                                                                        <FormField
                                                                            key={type}
                                                                            control={form.control as Control<ShopFormValues>}
                                                                            name="supportedDeliveryTypes"
                                                                            render={({ field }) => (
                                                                                <FormItem key={type} className="flex flex-row items-start space-x-3 space-y-0">
                                                                                    <FormControl>
                                                                                        <Checkbox
                                                                                            checked={(field.value as string[])?.includes(type)}
                                                                                            onCheckedChange={(checked) => {
                                                                                                const current = (field.value as string[]) || [];
                                                                                                return checked
                                                                                                    ? field.onChange([...current, type])
                                                                                                    : field.onChange(current.filter((value: string) => value !== type))
                                                                                            }}
                                                                                        />
                                                                                    </FormControl>
                                                                                    <FormLabel className="font-normal capitalize cursor-pointer">
                                                                                        {type.toLowerCase()}
                                                                                    </FormLabel>
                                                                                </FormItem>
                                                                            )}
                                                                        />
                                                                    ))}
                                                                </div>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                <div className="space-y-4 pt-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="paymentMethodIds"
                                                        render={() => (
                                                            <FormItem>
                                                                <div className="mb-4">
                                                                    <FormLabel className="text-base">Payment Methods</FormLabel>
                                                                    <FormDescription>
                                                                        Select payment methods supported by this shop.
                                                                    </FormDescription>
                                                                </div>
                                                                <div className="flex flex-wrap gap-4 pt-2">
                                                                    {(paymentMethods || []).map((method: PaymentMethodDTO) => (
                                                                        <FormField
                                                                            key={method.id}
                                                                            control={form.control}
                                                                            name="paymentMethodIds"
                                                                            render={({ field }) => {
                                                                                return (
                                                                                    <FormItem
                                                                                        key={method.id}
                                                                                        className="flex flex-row items-start space-x-3 space-y-0"
                                                                                    >
                                                                                        <FormControl>
                                                                                            <Checkbox
                                                                                                checked={(field.value as number[])?.includes(method.id)}
                                                                                                onCheckedChange={(checked) => {
                                                                                                    const current = (field.value as number[]) || [];
                                                                                                    return checked
                                                                                                        ? field.onChange([...current, method.id])
                                                                                                        : field.onChange(
                                                                                                            current.filter(
                                                                                                                (value: number) => value !== method.id
                                                                                                            )
                                                                                                        );
                                                                                                }}
                                                                                            />
                                                                                        </FormControl>
                                                                                        <FormLabel className="font-normal cursor-pointer flex items-center gap-2 pr-2">
                                                                                            {method.iconUrl && (
                                                                                                <img
                                                                                                    src={method.iconUrl}
                                                                                                    alt={method.code || method.name}
                                                                                                    className="h-5 w-5 object-contain flex-shrink-0"
                                                                                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                                                                                />
                                                                                            )}
                                                                                            <span className="truncate">{method.code || method.name}</span>
                                                                                        </FormLabel>
                                                                                    </FormItem>
                                                                                );
                                                                            }}
                                                                        />
                                                                    ))}
                                                                </div>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                    </CardContent>
                                </Card>

                                {/* Location */}
                                <Card className="border-solid">
                                    <CardHeader>
                                        <CardTitle>Location</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-6">
                                        <div className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name="addressEn"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Address (English)</FormLabel>
                                                        <FormControl>
                                                            <Textarea rows={3} className="resize-none" placeholder="Full address in English" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="addressMm"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Address (Myanmar)</FormLabel>
                                                            <FormControl>
                                                                <Textarea rows={2} className="resize-none" placeholder="Full address in Myanmar" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="addressTh"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Address (Thai)</FormLabel>
                                                            <FormControl>
                                                                <Textarea rows={2} className="resize-none" placeholder="Full address in Thai" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                    City
                                                </label>
                                                <SearchableSelect
                                                    data={(setupData?.cities || []).map(c => ({ label: c.nameEn, value: c.id }))}
                                                    value="value"
                                                    labelKey="label"
                                                    selectedValue={selectedCityId ? { label: setupData?.cities.find(c => c.id === selectedCityId)?.nameEn || "Selected City", value: selectedCityId } : undefined}
                                                    onChange={(item) => item && handleCityChange(item.value)}
                                                    placeholder="Select City"
                                                    disabled={setupLoading}
                                                />
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name="districtId"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>District</FormLabel>
                                                        <FormControl>
                                                            <SearchableSelect
                                                                data={availableDistricts.map(d => ({ label: d.nameEn || d.nameMm || d.name || `District ${d.id}`, value: d.id }))}
                                                                value="value"
                                                                labelKey="label"
                                                                selectedValue={field.value ? { label: availableDistricts.find(d => d.id === field.value)?.nameEn || availableDistricts.find(d => d.id === field.value)?.nameMm || "Selected District", value: field.value } : undefined}
                                                                onChange={(item) => item && handleDistrictChange(item.value)}
                                                                placeholder="Select District"
                                                                disabled={!selectedCityId}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>



                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="phone"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Phone</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Use commas to add multi phone numbers" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Email</FormLabel>
                                                        <FormControl>
                                                            <Input type="email" placeholder="contact@shop.com" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="latitude"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Latitude</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" step="any" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="longitude"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Longitude</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" step="any" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Operating Hours */}
                                <Card className="border-solid">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Utensils className="h-5 w-5 text-primary" />
                                            Operating Hours
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4">
                                            {[0, 1, 2, 3, 4, 5, 6].map((day, index) => {
                                                const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                                                return (
                                                    <div key={day} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg gap-4 bg-muted/5 group transition-colors hover:bg-muted/10">
                                                        <div className="flex items-center gap-3 w-full sm:w-1/3">
                                                            <div className="font-semibold text-sm w-24 text-foreground/80">{dayNames[index]}</div>
                                                            <FormField
                                                                control={form.control}
                                                                name={`operatingHours.${index}.isClosed`}
                                                                render={({ field }) => (
                                                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                                                        <FormControl>
                                                                            <Switch
                                                                                checked={field.value}
                                                                                onCheckedChange={field.onChange}
                                                                            />
                                                                        </FormControl>
                                                                        <FormLabel className="text-xs text-muted-foreground font-medium">Closed</FormLabel>
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </div>

                                                        <div className="flex items-center gap-3 w-full sm:w-2/3">
                                                            <FormField
                                                                control={form.control}
                                                                name={`operatingHours.${index}.openTime`}
                                                                render={({ field }) => (
                                                                    <FormItem className="flex-1 space-y-1">
                                                                        <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Open</FormLabel>
                                                                        <FormControl>
                                                                            <Input
                                                                                type="time"
                                                                                {...field}
                                                                                disabled={form.watch(`operatingHours.${index}.isClosed`)}
                                                                                className="h-9 text-xs font-medium shadow-sm border-muted-foreground/20"
                                                                            />
                                                                        </FormControl>
                                                                    </FormItem>
                                                                )}
                                                            />
                                                            <FormField
                                                                control={form.control}
                                                                name={`operatingHours.${index}.closeTime`}
                                                                render={({ field }) => (
                                                                    <FormItem className="flex-1 space-y-1">
                                                                        <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Close</FormLabel>
                                                                        <FormControl>
                                                                            <Input
                                                                                type="time"
                                                                                {...field}
                                                                                disabled={form.watch(`operatingHours.${index}.isClosed`)}
                                                                                className="h-9 text-xs font-medium shadow-sm border-muted-foreground/20"
                                                                            />
                                                                        </FormControl>
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right Column - Status, Features, Price, Image */}
                            <div className="space-y-8">
                                {/* Media */}
                                <Card className="border-solid">
                                    <CardHeader>
                                        <CardTitle>Media</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-6">
                                            {/* Logo Photo */}
                                            <div className="space-y-2">
                                                <div className="text-sm font-medium">Logo Photo</div>
                                                <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg hover:bg-muted/50 cursor-pointer relative transition-colors">
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                        onChange={handleLogoChange}
                                                    />
                                                    <div className="text-center space-y-2 pointer-events-none">
                                                        <div className="flex justify-center">
                                                            <Upload className="h-8 w-8 text-muted-foreground" />
                                                        </div>
                                                        <div className="text-sm font-medium">Click to upload logo</div>
                                                    </div>
                                                </div>

                                                {logoPreview && (
                                                    <div className="relative w-24 h-24 rounded-md overflow-hidden border mx-auto">
                                                        <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="icon"
                                                            className="absolute top-1 right-1 h-6 w-6 z-20 rounded-full"
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                setLogoPreview(null)
                                                            }}
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <div className="text-sm font-medium">Cover Photo (Single)</div>
                                                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:bg-muted/50 cursor-pointer relative transition-colors">
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                        onChange={handleCoverChange}
                                                    />
                                                    <div className="text-center space-y-2 pointer-events-none">
                                                        <div className="flex justify-center">
                                                            <Upload className="h-10 w-10 text-muted-foreground" />
                                                        </div>
                                                        <div className="text-sm font-medium">Click to upload cover photo</div>
                                                        <div className="text-xs text-muted-foreground">Single file only</div>
                                                    </div>
                                                </div>

                                                {coverPreview && (
                                                    <div className="relative aspect-video rounded-md overflow-hidden border mt-3">
                                                        <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="icon"
                                                            className="absolute top-1 right-1 h-6 w-6 z-20 rounded-full"
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                setCoverPreview(null)
                                                            }}
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Gallery Photos */}
                                            <div className="space-y-2">
                                                <div className="text-sm font-medium">Gallery Photos</div>

                                                {/* Existing gallery photos */}
                                                {existingGalleryUrls.length > 0 && (
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {existingGalleryUrls.map((url, index) => (
                                                            <div key={`existing-${index}`} className="relative aspect-square rounded-md overflow-hidden border">
                                                                <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                                                                <Button
                                                                    type="button"
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    className="absolute top-1 right-1 h-5 w-5 z-20 rounded-full"
                                                                    onClick={() => removeExistingGalleryPhoto(index)}
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* New gallery photos previews */}
                                                {galleryPreviews.length > 0 && (
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {galleryPreviews.map((preview, index) => (
                                                            <div key={`new-${index}`} className="relative aspect-square rounded-md overflow-hidden border">
                                                                <img src={preview} alt={`New gallery ${index + 1}`} className="w-full h-full object-cover" />
                                                                <Button
                                                                    type="button"
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    className="absolute top-1 right-1 h-5 w-5 z-20 rounded-full"
                                                                    onClick={() => removeGalleryPhoto(index)}
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Upload button */}
                                                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        multiple
                                                        className="hidden"
                                                        onChange={handleGalleryChange}
                                                    />
                                                    <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                                                    <div className="text-sm font-medium">Add gallery photos</div>
                                                    <div className="text-xs text-muted-foreground">Multiple files supported</div>
                                                </label>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Status & Price */}
                                <Card className="border-solid">
                                    <CardHeader>
                                        <CardTitle>Settings</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-6">
                                        <FormField
                                            control={form.control}
                                            name="isVerified"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                    <div className="space-y-0.5">
                                                        <FormLabel>Verified Shop</FormLabel>
                                                    </div>
                                                    <FormControl>
                                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                        <Separator />

                                        <FormField
                                            control={form.control}
                                            name="pricePreference"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Price Preference</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select price level" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="LOW">Low ($)</SelectItem>
                                                            <SelectItem value="MEDIUM">Medium ($$)</SelectItem>
                                                            <SelectItem value="HIGH">High ($$$)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <Separator />

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="minOrderAmount"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Min Order Amount</FormLabel>
                                                        <FormControl>
                                                            <PriceInput 
                                                                placeholder="0" 
                                                                value={field.value || ""} 
                                                                onValueChange={(val) => field.onChange(val === "" ? undefined : parseFloat(val))} 
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="baseDeliveryFee"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Base Delivery Fee</FormLabel>
                                                        <FormControl>
                                                            <PriceInput 
                                                                placeholder="0" 
                                                                value={field.value || ""} 
                                                                onValueChange={(val) => field.onChange(val === "" ? undefined : parseFloat(val))} 
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="maxItemQuantityPerOrder"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Max Qty Per Order</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" placeholder="10" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <Separator />

                                        <FormField
                                            control={form.control}
                                            name="deliveryEnabled"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/20">
                                                    <div className="space-y-0.5">
                                                        <FormLabel>Delivery Enabled</FormLabel>
                                                    </div>
                                                    <FormControl>
                                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="enableStockCheck"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/20">
                                                    <div className="space-y-0.5">
                                                        <FormLabel>Enable Stock Check</FormLabel>
                                                    </div>
                                                    <FormControl>
                                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>

                                {/* Features */}
                                <Card className="border-solid">
                                    <CardHeader>
                                        <CardTitle>Features</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-4">
                                        {([
                                            { name: "hasDelivery", label: "Delivery Available", icon: Truck },
                                            { name: "hasParking", label: "Parking Available", icon: Car },
                                            { name: "hasWifi", label: "Free Wifi", icon: Wifi },
                                            { name: "isHalal", label: "Halal Certified", icon: Utensils },
                                            { name: "isVegetarian", label: "Vegetarian Friendly", icon: Leaf },
                                        ] as const).map((feature) => (
                                            <FormField
                                                key={feature.name}
                                                control={form.control}
                                                name={feature.name}
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                        <FormControl>
                                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                        </FormControl>
                                                        <div className="space-y-1 leading-none flex items-center gap-2">
                                                            <feature.icon className="h-4 w-4 text-muted-foreground" />
                                                            <FormLabel>{feature.label}</FormLabel>
                                                        </div>
                                                    </FormItem>
                                                )}
                                            />
                                        ))}
                                    </CardContent>
                                </Card>
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
                                    Delete Shop
                                </Button>
                            )}
                            <div className="flex gap-3 ml-auto">
                                <Button type="button" variant="outline" onClick={handleCancel} disabled={submitting}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={submitting}
                                    className={submitting ? "bg-gray-400 cursor-not-allowed whitespace-nowrap" : "whitespace-nowrap"}
                                >
                                    {submitting ? "Saving..." : isEditMode ? "Update Shop" : "Create Shop"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </Form>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Shop</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{form.getValues("nameEn")}</strong>?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={deleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    )
}
