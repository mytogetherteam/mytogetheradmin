import { useState, useEffect, useCallback } from "react"
import { useForm, Resolver } from "react-hook-form"
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
import { Loader } from "@/components/ui/loader"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

// Schema based on API CreateShopRequest
const shopFormSchema = z.object({
    // Basic Info
    nameEn: z.string().min(2, "Name (English) is required."),
    nameMm: z.string().optional(),
    nameTh: z.string().optional(),
    slug: z.string().optional(),

    // Category
    shopCategoryId: z.number().min(1, "Please select a category."),
    shopSubCategoryId: z.number().nullable().optional(),

    // Location
    addressEn: z.string().min(5, "Address must be at least 5 characters."),
    addressMm: z.string().optional(),
    addressTh: z.string().optional(),
    districtId: z.coerce.number().min(1, "District is required."),
    latitude: z.coerce.number().min(-90).max(90, "Invalid latitude"),
    longitude: z.coerce.number().min(-180).max(180, "Invalid longitude"),

    // Contact
    phone: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),

    // Description
    descriptionEn: z.string().optional(),
    descriptionMm: z.string().optional(),
    descriptionTh: z.string().optional(),

    // Features
    hasDelivery: z.boolean().optional(),
    deliveryEnabled: z.boolean().optional(),
    hasParking: z.boolean().optional(),
    hasWifi: z.boolean().optional(),

    // Status
    isVerified: z.boolean().optional(),
    isActive: z.boolean().optional(),
    isHalal: z.boolean().optional(),
    isVegetarian: z.boolean().optional(),

    // Price & Delivery
    pricePreference: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    enableStockCheck: z.boolean().optional(),
    maxItemQuantityPerOrder: z.coerce.number().optional(),
    minOrderAmount: z.coerce.number().optional(),
    baseDeliveryFee: z.coerce.number().optional(),
    cuisineTypeIds: z.array(z.number()).optional().default([]),
    mealTypes: z.array(z.string()).optional().default([]),
    supportedDeliveryTypes: z.array(z.string()).optional().default([]),
    paymentMethodIds: z.array(z.number()).optional().default([]),
    operatingHours: z.array(z.object({
        dayOfWeek: z.number().min(1).max(7),
        openTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
        closeTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
        isClosed: z.boolean().default(false)
    })).optional().default([]),
})

type ShopFormValues = z.infer<typeof shopFormSchema>

export default function CreateShopRestaurant() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const shopId = searchParams.get("id")
    const isEditMode = !!shopId

    const [coverPreview, setCoverPreview] = useState<string | null>(null)
    const [coverFile, setCoverFile] = useState<File | null>(null)
    const [logoPreview, setLogoPreview] = useState<string | null>(null)
    const [logoFile, setLogoFile] = useState<File | null>(null)

    // Gallery state
    const [existingGalleryImages, setExistingGalleryImages] = useState<string[]>([])
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([])
    const [galleryFiles, setGalleryFiles] = useState<File[]>([])

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
    const [shopSubCategories, setShopSubCategories] = useState<ShopSubCategoryDTO[]>([])
    const [categoriesLoading, setCategoriesLoading] = useState(false)

    const form = useForm<ShopFormValues>({
        resolver: zodResolver(shopFormSchema) as Resolver<ShopFormValues>,
        defaultValues: {
            nameEn: "",
            nameMm: "",
            nameTh: "",
            slug: "",
            shopCategoryId: 0,
            shopSubCategoryId: null,
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
            minOrderAmount: 0,
            baseDeliveryFee: 0,
            cuisineTypeIds: [],
            mealTypes: [],
            supportedDeliveryTypes: [],
            paymentMethodIds: [],
            operatingHours: [
                { dayOfWeek: 1, openTime: "09:00", closeTime: "21:00", isClosed: false },
                { dayOfWeek: 2, openTime: "09:00", closeTime: "21:00", isClosed: false },
                { dayOfWeek: 3, openTime: "09:00", closeTime: "21:00", isClosed: false },
                { dayOfWeek: 4, openTime: "09:00", closeTime: "21:00", isClosed: false },
                { dayOfWeek: 5, openTime: "09:00", closeTime: "21:00", isClosed: false },
                { dayOfWeek: 6, openTime: "09:00", closeTime: "21:00", isClosed: false },
                { dayOfWeek: 7, openTime: "09:00", closeTime: "21:00", isClosed: false },
            ],
        },
    })

    const loadSetupData = useCallback(async () => {
        setSetupLoading(true)
        setCategoriesLoading(true)
        try {
            const [data, categories, paymentData] = await Promise.all([
                PaymentService.getShopFormData(),
                ShopService.getCategories(),
                PaymentService.getPaymentMethods({ size: 100 })
            ])
            setSetupData(data)
            setShopCategories(categories)
            setPaymentMethods(paymentData.content || [])
        } catch (error) {
            console.error("Failed to load setup data:", error)
            toast.error("Failed to load necessary form data")
        } finally {
            setSetupLoading(false)
            setCategoriesLoading(false)
        }
    }, [])

    const loadShopData = useCallback(async (id: string) => {
        setLoading(true)
        try {
            const shopId = parseInt(id, 10)
            if (isNaN(shopId)) {
                toast.error("Invalid shop ID")
                navigate("/shops/manage")
                return
            }

            const shop = await ShopService.getShopById(shopId)

            // Map API response to form structure
            form.reset({
                nameEn: shop.nameEn || "",
                nameMm: shop.nameMm || "",
                nameTh: shop.nameTh || "",
                slug: shop.slug || "",
                shopCategoryId: shop.shopCategory?.id || 0,
                shopSubCategoryId: shop.shopSubCategory?.id ?? null,
                addressEn: shop.addressEn || "",
                addressMm: shop.addressMm || "",
                addressTh: shop.addressTh || "",
                districtId: shop.districtId || 0,
                latitude: shop.latitude || 0,
                longitude: shop.longitude || 0,
                phone: shop.phone || "",
                email: shop.email || "",
                descriptionEn: shop.descriptionEn || "",
                descriptionMm: shop.descriptionMm || "",
                descriptionTh: shop.descriptionTh || "",
                hasDelivery: shop.hasDelivery || false,
                deliveryEnabled: shop.deliveryEnabled || false,
                hasParking: shop.hasParking || false,
                hasWifi: shop.hasWifi || false,
                isVerified: shop.isVerified || false,
                isActive: shop.isActive ?? true,
                isHalal: shop.isHalal || false,
                isVegetarian: shop.isVegetarian || false,
                pricePreference: shop.pricePreference || "MEDIUM",
                enableStockCheck: shop.enableStockCheck || false,
                maxItemQuantityPerOrder: shop.maxItemQuantityPerOrder || 10,
                minOrderAmount: shop.minOrderAmount || 0,
                baseDeliveryFee: shop.baseDeliveryFee || 0,
                cuisineTypeIds: shop.cuisineTypes ? shop.cuisineTypes.map((c: CuisineTypeDTO) => c.id) : [],
                mealTypes: shop.mealTypes || [],
                supportedDeliveryTypes: shop.supportedDeliveryTypes || [],
                paymentMethodIds: shop.paymentMethodIds || [],
                operatingHours: shop.operatingHours && shop.operatingHours.length > 0
                    ? shop.operatingHours
                    : [
                        { dayOfWeek: 1, openTime: "09:00", closeTime: "21:00", isClosed: false },
                        { dayOfWeek: 2, openTime: "09:00", closeTime: "21:00", isClosed: false },
                        { dayOfWeek: 3, openTime: "09:00", closeTime: "21:00", isClosed: false },
                        { dayOfWeek: 4, openTime: "09:00", closeTime: "21:00", isClosed: false },
                        { dayOfWeek: 5, openTime: "09:00", closeTime: "21:00", isClosed: false },
                        { dayOfWeek: 6, openTime: "09:00", closeTime: "21:00", isClosed: false },
                        { dayOfWeek: 7, openTime: "09:00", closeTime: "21:00", isClosed: false },
                    ],
            })

            // Handle images
            if (shop.logoUrl) {
                setLogoPreview(shop.logoUrl);
            }
            if (shop.coverUrl) {
                setCoverPreview(shop.coverUrl);
            } else if (shop.primaryPhotoUrl) {
                setCoverPreview(shop.primaryPhotoUrl);
            }
            if (shop.photos) {
                setExistingGalleryImages(shop.photos.map(p => p.url));
            }

            // Set selectedCityId by finding which city contains the district
            if (shop.districtId && setupData?.cities) {
                const city = setupData.cities.find(c =>
                    c.districts?.some(d => d.id === shop.districtId)
                );
                if (city) {
                    setSelectedCityId(city.id);
                }
            }

        } catch (error) {
            console.error("Failed to load shop:", error)
            toast.error("Failed to load shop data", {
                description: "Unable to fetch shop details"
            })
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
        if (isEditMode && shopId) {
            loadShopData(shopId)
        } else {
            // Reset form for create mode
            form.reset({
                nameEn: "",
                nameMm: "",
                nameTh: "",
                shopCategoryId: 0,
                shopSubCategoryId: null,
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
                minOrderAmount: 0,
                baseDeliveryFee: 0,
                cuisineTypeIds: [],
                mealTypes: [],
                supportedDeliveryTypes: [],
                paymentMethodIds: [],
                operatingHours: [
                    { dayOfWeek: 1, openTime: "09:00", closeTime: "21:00", isClosed: false },
                    { dayOfWeek: 2, openTime: "09:00", closeTime: "21:00", isClosed: false },
                    { dayOfWeek: 3, openTime: "09:00", closeTime: "21:00", isClosed: false },
                    { dayOfWeek: 4, openTime: "09:00", closeTime: "21:00", isClosed: false },
                    { dayOfWeek: 5, openTime: "09:00", closeTime: "21:00", isClosed: false },
                    { dayOfWeek: 6, openTime: "09:00", closeTime: "21:00", isClosed: false },
                    { dayOfWeek: 7, openTime: "09:00", closeTime: "21:00", isClosed: false },
                ],
            })
            setCoverPreview(null)
            setCoverFile(null)
            setLogoPreview(null)
            setLogoFile(null)
            setExistingGalleryImages([])
            setGalleryPreviews([])
            setGalleryFiles([])
        }
    }, [shopId, isEditMode, loadShopData, form])

    // Effect to handle subcategory loading when category changes
    const selectedCategoryId = form.watch("shopCategoryId")
    useEffect(() => {
        const fetchSubCategories = async () => {
            if (!selectedCategoryId) {
                setShopSubCategories([])
                return
            }
            try {
                const subCats = await ShopService.getSubCategories(selectedCategoryId)
                setShopSubCategories(subCats)
            } catch (error) {
                console.error("Failed to load subcategories:", error)
                toast.error("Failed to load subcategories")
            }
        }
        fetchSubCategories()
    }, [selectedCategoryId])

    async function onSubmit(data: ShopFormValues) {
        setSubmitting(true)
        try {
            // Create FormData
            const formData = new FormData();

            // Prepare the data object (excluding file fields we send separately)
            const {
                nameEn, nameMm, nameTh, slug,
                shopCategoryId, shopSubCategoryId,
                addressEn, addressMm, addressTh,
                districtId, latitude, longitude,
                phone, email,
                descriptionEn, descriptionMm, descriptionTh,
                hasDelivery, deliveryEnabled, hasParking, hasWifi,
                isVerified, isActive, isHalal, isVegetarian,
                pricePreference, enableStockCheck, maxItemQuantityPerOrder, minOrderAmount, baseDeliveryFee,
                cuisineTypeIds, mealTypes, supportedDeliveryTypes, paymentMethodIds, operatingHours
            } = data;

            const dataWithoutFiles = {
                nameEn, nameMm, nameTh, slug,
                shopCategoryId,
                shopSubCategoryId,
                addressEn, addressMm, addressTh,
                districtId,
                latitude,
                longitude,
                phone,
                email,
                descriptionEn, descriptionMm, descriptionTh,
                hasDelivery,
                deliveryEnabled,
                hasParking,
                hasWifi,
                isVerified,
                isActive,
                isHalal,
                isVegetarian,
                pricePreference,
                enableStockCheck,
                maxItemQuantityPerOrder,
                minOrderAmount,
                baseDeliveryFee,
                cuisineTypeIds,
                mealTypes,
                supportedDeliveryTypes,
                paymentMethodIds,
                operatingHours
            };

            // Stringify the data object and send as 'data' field
            formData.append("data", new Blob([JSON.stringify(dataWithoutFiles)], { type: "application/json" }));

            // Append Logo Photo
            if (logoFile) {
                formData.append("logoPhoto", new Blob([logoFile], { type: "application/form-data" }), logoFile.name);
            }

            // Append Cover Photo
            if (coverFile) {
                formData.append("coverPhoto", new Blob([coverFile], { type: "application/form-data" }), coverFile.name);
            }

            // Append Gallery Photos (only for create)
            if (!isEditMode) {
                galleryFiles.forEach((file) => {
                    formData.append("galleryPhotos", new Blob([file], { type: "application/form-data" }), file.name);
                });
            }

            if (isEditMode && shopId) {
                const numericId = parseInt(shopId, 10)
                await ShopService.updateShop(numericId, formData)
                toast.success("Shop updated successfully!")
            } else {
                await ShopService.createShop(formData)
                toast.success("Shop created successfully!")
            }
            navigate("/shops/manage")
        } catch (error) {
            console.error("Failed to save shop:", error)
            toast.error(isEditMode ? "Failed to update shop" : "Failed to create shop", {
                description: "An error occurred"
            })
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
            console.error("Failed to delete shop:", error)
            toast.error("Failed to delete shop", {
                description: "An error occurred"
            })
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
        const files = e.target.files
        if (!files || files.length === 0) return

        const newFiles = Array.from(files)
        setGalleryFiles(prev => [...prev, ...newFiles])

        newFiles.forEach(file => {
            const reader = new FileReader()
            reader.onloadend = () => {
                setGalleryPreviews(prev => [...prev, reader.result as string])
            }
            reader.readAsDataURL(file)
        })
    }

    const handleCityChange = async (cityId: number) => {
        setSelectedCityId(cityId)
        // availableDistricts will be updated by the useEffect
        form.setValue("districtId", null as unknown as number)
    }

    const handleDistrictChange = (districtId: number) => {
        form.setValue("districtId", districtId)
    }

    const removeNewGalleryImage = (fileIndex: number) => {
        setGalleryFiles(prev => prev.filter((_, i) => i !== fileIndex));
        setGalleryPreviews(prev => prev.filter((_, i) => i !== fileIndex));
    }

    const removeExistingGalleryImage = (url: string) => {
        setExistingGalleryImages(prev => prev.filter(img => img !== url));
    }

    // For simplicity, we support adding multiple new gallery images.
    // Existing images from the backend are displayed separately.

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
                                        <div className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name="nameEn"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>* Shop Name (English)</FormLabel>
                                                        <FormControl>
                                                            <Input 
                                                                placeholder="e.g. My Together Cafe" 
                                                                {...field}
                                                                onChange={(e) => {
                                                                    field.onChange(e);
                                                                    if (!isEditMode) {
                                                                        const slug = e.target.value.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
                                                                        form.setValue("slug", slug);
                                                                    }
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="slug"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Slug</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="e.g. my_together_cafe"
                                                                {...field}
                                                                readOnly
                                                                className="bg-muted"
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
                                                            <FormLabel>* Shop Name (Myanmar)</FormLabel>
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
                                                            <FormLabel>* Shop Name (Thai)</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Enter name in Thai" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="shopCategoryId"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>* Category</FormLabel>
                                                            <FormControl>
                                                                <SearchableSelect
                                                                    data={shopCategories.map(cat => ({ label: cat.nameEn || `Category ${cat.id}`, value: cat.id }))}
                                                                    value="value"
                                                                    labelKey="label"
                                                                    selectedValue={field.value ? { label: shopCategories.find(c => c.id === field.value)?.nameEn || `Category ${field.value}`, value: field.value } : undefined}
                                                                    onChange={(item) => field.onChange(item?.value || 0)}
                                                                    placeholder={categoriesLoading ? "Loading categories..." : "Select a category"}
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
                                                            <FormLabel>* Subcategory</FormLabel>
                                                            <FormControl>
                                                                <SearchableSelect
                                                                    data={shopSubCategories.map(subCat => ({ label: subCat.nameEn || `Subcategory ${subCat.id}`, value: subCat.id }))}
                                                                    value="value"
                                                                    labelKey="label"
                                                                    selectedValue={field.value ? { label: shopSubCategories.find(c => c.id === field.value)?.nameEn || `Subcategory ${field.value}`, value: field.value } : undefined}
                                                                    onChange={(item) => field.onChange(item?.value ?? null)}
                                                                    placeholder={!form.watch("shopCategoryId") ? "Select Category first" : "Select a subcategory"}
                                                                    disabled={!form.watch("shopCategoryId")}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <Separator className="my-2" />

                                            <div className="space-y-4">
                                                <FormField
                                                    control={form.control}
                                                    name="descriptionEn"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>* Description (English)</FormLabel>
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
                                                                <FormLabel>* Description (Myanmar)</FormLabel>
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
                                                                <FormLabel>* Description (Thai)</FormLabel>
                                                                <FormControl>
                                                                    <Textarea rows={2} className="resize-none" placeholder="Description in Thai..." {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
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
                                                            <FormLabel>* Cuisine Types</FormLabel>
                                                            <div className="flex flex-wrap gap-2 mb-2">
                                                                {field.value?.map((id: number) => {
                                                                    const cuisine = setupData?.cuisineTypes?.find((c: CuisineTypeDTO) => c.id === id)
                                                                    const label = cuisine ? (cuisine.nameEn || cuisine.name || cuisine.slug || `Cuisine ${id}`) : null
                                                                    return cuisine ? (
                                                                        <Badge key={id} variant="secondary" className="gap-1">
                                                                            {label}
                                                                            <X
                                                                                className="h-3 w-3 cursor-pointer"
                                                                                onClick={() => field.onChange(field.value.filter((val: number) => val !== id))}
                                                                            />
                                                                        </Badge>
                                                                    ) : null
                                                                })}
                                                            </div>
                                                            <FormControl>
                                                                <SearchableSelect
                                                                    data={setupData?.cuisineTypes?.map((c: CuisineTypeDTO) => ({
                                                                        label: c.nameEn || c.name || c.slug || `Cuisine ${c.id}`,
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
                                                                    <FormLabel className="text-base">* Meal Types</FormLabel>
                                                                </div>
                                                                <div className="flex flex-wrap gap-4">
                                                                    {["BREAKFAST", "LUNCH", "DINNER"].map((type) => (
                                                                        <FormField
                                                                            key={type}
                                                                            control={form.control}
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
                                                                    <FormLabel className="text-base">* Delivery Types</FormLabel>
                                                                </div>
                                                                <div className="flex flex-wrap gap-4">
                                                                    {["PICKUP", "DELIVERY"].map((type) => (
                                                                        <FormField
                                                                            key={type}
                                                                            control={form.control}
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
                                                                    <FormLabel className="text-base">* Payment Methods</FormLabel>
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
                                                        <FormLabel>* Address (English)</FormLabel>
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
                                                            <FormLabel>* Address (Myanmar)</FormLabel>
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
                                                            <FormLabel>* Address (Thai)</FormLabel>
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
                                                    * City
                                                </label>
                                                <SearchableSelect
                                                    data={(setupData?.cities || []).map(c => ({ label: c.nameEn, value: c.id }))}
                                                    value="value"
                                                    labelKey="label"
                                                    selectedValue={selectedCityId ? { label: setupData?.cities.find(c => c.id === selectedCityId)?.nameEn || "", value: selectedCityId } : undefined}
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
                                                        <FormLabel>* District</FormLabel>
                                                        <FormControl>
                                                            <SearchableSelect
                                                                data={availableDistricts.map(d => ({ label: d.nameEn, value: d.id }))}
                                                                value="value"
                                                                labelKey="label"
                                                                selectedValue={field.value ? { label: availableDistricts.find(d => d.id === field.value)?.nameEn || "", value: field.value } : undefined}
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
                                                        <FormLabel>* Phone</FormLabel>
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
                                                        <FormLabel>* Email</FormLabel>
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
                                                        <FormLabel>* Latitude</FormLabel>
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
                                                        <FormLabel>* Longitude</FormLabel>
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
                                            * Operating Hours
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4">
                                            {[1, 2, 3, 4, 5, 6, 7].map((day, index) => {
                                                const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
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
                                                <div className="text-sm font-medium">* Logo Photo</div>
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
                                                <div className="text-sm font-medium">* Cover Photo (Single)</div>
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

                                            <div className="space-y-2">
                                                <div className="text-sm font-medium">* Gallery Photos (Multiple)</div>
                                                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:bg-muted/50 cursor-pointer relative transition-colors">
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
                                                        <div className="text-sm font-medium">Click to upload gallery photos</div>
                                                        <div className="text-xs text-muted-foreground">Multiple files allowed</div>
                                                    </div>
                                                </div>

                                                {/* Combined Gallery Previews */}
                                                {(existingGalleryImages.length > 0 || galleryPreviews.length > 0) && (
                                                    <div className="space-y-4 mt-4">
                                                        <div className="text-xs font-medium text-muted-foreground">Photos Preview:</div>
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                            {/* Existing Images */}
                                                            {existingGalleryImages.map((url, idx) => (
                                                                <div key={`existing-${idx}`} className="relative aspect-square rounded-md overflow-hidden border group">
                                                                    <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                                                                    <div className="absolute top-1 right-1 z-20">
                                                                        <Button
                                                                            type="button"
                                                                            variant="destructive"
                                                                            size="icon"
                                                                            className="h-6 w-6 rounded-full shadow-sm"
                                                                            onClick={() => removeExistingGalleryImage(url)}
                                                                        >
                                                                            <X className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {/* New Photos */}
                                                            {galleryPreviews.map((src, idx) => (
                                                                <div key={`new-${idx}`} className="relative aspect-square rounded-md overflow-hidden border group">
                                                                    <img src={src} alt={`New Preview ${idx}`} className="w-full h-full object-cover" />
                                                                    <div className="absolute top-1 right-1 z-20">
                                                                        <Button
                                                                            type="button"
                                                                            variant="destructive"
                                                                            size="icon"
                                                                            className="h-6 w-6 rounded-full shadow-sm"
                                                                            onClick={() => removeNewGalleryImage(idx)}
                                                                        >
                                                                            <X className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
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
                                                    <FormLabel>* Price Preference</FormLabel>
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
                                                        <FormLabel>* Min Order Amount</FormLabel>
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
                                                        <FormLabel>* Base Delivery Fee</FormLabel>
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
                                                        <FormLabel>* Max Qty Per Order</FormLabel>
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
                                                        <FormLabel>* Delivery Enabled</FormLabel>
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
                                                        <FormLabel>* Enable Stock Check</FormLabel>
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
                                            { name: "hasDelivery", label: "* Delivery Available", icon: Truck },
                                            { name: "hasParking", label: "* Parking Available", icon: Car },
                                            { name: "hasWifi", label: "* Free Wifi", icon: Wifi },
                                            { name: "isHalal", label: "* Halal Certified", icon: Utensils },
                                            { name: "isVegetarian", label: "* Vegetarian Friendly", icon: Leaf },
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
                                    disabled={!form.formState.isValid || submitting}
                                    className={(!form.formState.isValid || submitting) ? "bg-gray-400 cursor-not-allowed whitespace-nowrap" : "whitespace-nowrap"}
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
