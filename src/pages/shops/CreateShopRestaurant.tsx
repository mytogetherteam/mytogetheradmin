import { useState, useEffect } from "react"
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
import { ShopService } from "@/services/shopService"
import { Loader } from "@/components/ui/loader"
import { toast } from "sonner"
import { apiClient } from "@/services/apiClient"
import { config } from "@/config/config"
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
    name: z.string().min(2, "Name must be at least 2 characters."),
    nameMm: z.string().min(1, "Name (Myanmar) is required."),
    nameTh: z.string().optional(),
    nameEn: z.string().optional(),
    slug: z.string().optional(),

    // Category
    category: z.string().min(1, "Please select a category."),
    categoryMm: z.string().optional(),
    categoryTh: z.string().optional(),
    categoryEn: z.string().optional(),
    subCategory: z.string().optional(),
    subCategoryMm: z.string().optional(),
    subCategoryTh: z.string().optional(),
    subCategoryEn: z.string().optional(),

    // Location
    address: z.string().min(5, "Address must be at least 5 characters."),
    addressMm: z.string().optional(),
    addressTh: z.string().optional(),
    addressEn: z.string().optional(),
    districtId: z.coerce.number().min(1, "District is required."),
    district: z.string().optional(),
    districtMm: z.string().optional(),
    city: z.string().optional(),
    cityMm: z.string().optional(),
    latitude: z.coerce.number().min(-90).max(90, "Invalid latitude"),
    longitude: z.coerce.number().min(-180).max(180, "Invalid longitude"),

    // Contact
    phone: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),

    // Description
    description: z.string().optional(),
    descriptionMm: z.string().optional(),
    descriptionTh: z.string().optional(),
    descriptionEn: z.string().optional(),

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
    pricePreferenceMm: z.string().optional(),
    pricePreferenceTh: z.string().optional(),
    pricePreferenceEn: z.string().optional(),
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
    const [categories, setCategories] = useState<string[]>([])
    const [setupData, setSetupData] = useState<any>(null)
    const [setupLoading, setSetupLoading] = useState(true)

    const form = useForm<ShopFormValues>({
        resolver: zodResolver(shopFormSchema) as Resolver<ShopFormValues>,
        defaultValues: {
            name: "",
            nameMm: "",
            nameTh: "",
            nameEn: "",
            slug: "",
            description: "",
            descriptionMm: "",
            descriptionTh: "",
            descriptionEn: "",
            category: "",
            categoryMm: "",
            categoryTh: "",
            categoryEn: "",
            subCategory: "",
            subCategoryMm: "",
            subCategoryTh: "",
            subCategoryEn: "",
            address: "",
            addressMm: "",
            addressTh: "",
            addressEn: "",
            districtId: 0,
            district: "",
            districtMm: "",
            city: "",
            cityMm: "",
            latitude: 0,
            longitude: 0,
            phone: "",
            email: "",
            hasDelivery: false,
            deliveryEnabled: false,
            hasParking: false,
            hasWifi: false,
            isVerified: false,
            isActive: true,
            isHalal: false,
            isVegetarian: false,
            pricePreference: "MEDIUM",
            pricePreferenceMm: "",
            pricePreferenceTh: "",
            pricePreferenceEn: "",
            enableStockCheck: false,
            maxItemQuantityPerOrder: 10,
            minOrderAmount: 0,
            baseDeliveryFee: 0,
            cuisineTypeIds: [],
            mealTypes: [],
            supportedDeliveryTypes: [],
            paymentMethodIds: [],
        },
    })

    useEffect(() => {
        loadSetupData()
    }, [])

    useEffect(() => {
        if (isEditMode && shopId) {
            loadShopData(shopId)
        } else {
            // Reset form for create mode
            form.reset({
                name: "",
                nameMm: "",
                nameTh: "",
                nameEn: "",
                slug: "",
                description: "",
                descriptionMm: "",
                descriptionTh: "",
                descriptionEn: "",
                category: "",
                categoryMm: "",
                categoryTh: "",
                categoryEn: "",
                subCategory: "",
                subCategoryMm: "",
                subCategoryTh: "",
                subCategoryEn: "",
                address: "",
                addressMm: "",
                addressTh: "",
                addressEn: "",
                districtId: 0,
                district: "",
                districtMm: "",
                city: "",
                cityMm: "",
                latitude: 0,
                longitude: 0,
                phone: "",
                email: "",
                hasDelivery: false,
                deliveryEnabled: false,
                hasParking: false,
                hasWifi: false,
                isVerified: false,
                isActive: true,
                isHalal: false,
                isVegetarian: false,
                pricePreference: "MEDIUM",
                pricePreferenceMm: "",
                pricePreferenceTh: "",
                pricePreferenceEn: "",
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shopId, isEditMode])

    const loadSetupData = async () => {
        setSetupLoading(true)
        try {
            // This now calls the updated categories endpoint which points to setup data
            const response = await apiClient.get<any>(config.endpoints.shops.categories)
            const data = response.data
            setSetupData(data)

            // Extract categories if available, else use fallback
            if (data.categories) {
                setCategories(data.categories)
            } else {
                setCategories(["Restaurant", "Retail", "Service", "Other"])
            }
        } catch (error) {
            console.error("Failed to load setup data:", error)
            setCategories(["Restaurant", "Retail", "Service", "Other"])
        } finally {
            setSetupLoading(false)
        }
    }

    const loadShopData = async (id: string) => {
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
                name: shop.name || "",
                nameMm: shop.nameMm || "",
                nameTh: shop.nameTh || "",
                nameEn: shop.nameEn || "",
                slug: shop.slug || "",
                description: shop.description || "",
                descriptionMm: shop.descriptionMm || "",
                descriptionTh: shop.descriptionTh || "",
                descriptionEn: shop.descriptionEn || "",
                category: shop.category || "",
                categoryMm: shop.categoryMm || "",
                categoryTh: shop.categoryTh || "",
                categoryEn: shop.categoryEn || "",
                subCategory: shop.subCategory || "",
                subCategoryMm: shop.subCategoryMm || "",
                subCategoryTh: shop.subCategoryTh || "",
                subCategoryEn: shop.subCategoryEn || "",
                address: shop.address || "",
                addressMm: shop.addressMm || "",
                addressTh: shop.addressTh || "",
                addressEn: shop.addressEn || "",
                districtId: shop.districtId || 0,
                district: shop.district || "",
                districtMm: shop.districtMm || "",
                city: shop.city || "",
                cityMm: shop.cityMm || "",
                latitude: shop.latitude || 0,
                longitude: shop.longitude || 0,
                phone: shop.phone || "",
                email: shop.email || "",
                hasDelivery: shop.hasDelivery || false,
                deliveryEnabled: shop.deliveryEnabled || false,
                hasParking: shop.hasParking || false,
                hasWifi: shop.hasWifi || false,
                isVerified: shop.isVerified || false,
                isActive: shop.isActive ?? true,
                isHalal: shop.isHalal || false,
                isVegetarian: shop.isVegetarian || false,
                pricePreference: shop.pricePreference || "MEDIUM",
                pricePreferenceMm: shop.pricePreferenceMm || "",
                pricePreferenceTh: shop.pricePreferenceTh || "",
                pricePreferenceEn: shop.pricePreferenceEn || "",
                enableStockCheck: shop.enableStockCheck || false,
                maxItemQuantityPerOrder: shop.maxItemQuantityPerOrder || 10,
                minOrderAmount: shop.minOrderAmount || 0,
                baseDeliveryFee: shop.baseDeliveryFee || 0,
                cuisineTypeIds: shop.cuisineTypes ? shop.cuisineTypes.map((c: any) => c.id) : [],
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

        } catch (error) {
            console.error("Failed to load shop:", error)
            toast.error("Failed to load shop data", {
                description: "Unable to fetch shop details"
            })
            navigate("/shops/manage")
        } finally {
            setLoading(false)
        }
    }

    async function onSubmit(data: ShopFormValues) {
        setSubmitting(true)
        try {
            // Create FormData
            const formData = new FormData();

            // Prepare the data object (excluding file fields we send separately)
            const {
                name, nameMm, nameTh, nameEn, slug,
                category, categoryMm, categoryTh, categoryEn,
                subCategory, subCategoryMm, subCategoryTh, subCategoryEn,
                address, addressMm, addressTh, addressEn,
                districtId, district, districtMm, city, cityMm, latitude, longitude,
                phone, email,
                description, descriptionMm, descriptionTh, descriptionEn,
                hasDelivery, deliveryEnabled, hasParking, hasWifi,
                isVerified, isActive, isHalal, isVegetarian,
                pricePreference, pricePreferenceMm, pricePreferenceTh, pricePreferenceEn,
                enableStockCheck, maxItemQuantityPerOrder, minOrderAmount, baseDeliveryFee,
                cuisineTypeIds, mealTypes, supportedDeliveryTypes, paymentMethodIds, operatingHours
            } = data;

            const dataWithoutFiles = {
                name,
                nameMm,
                nameTh,
                nameEn,
                slug,
                category,
                categoryMm,
                categoryTh,
                categoryEn,
                subCategory,
                subCategoryMm,
                subCategoryTh,
                subCategoryEn,
                address,
                addressMm,
                addressTh,
                addressEn,
                districtId,
                district,
                districtMm,
                city,
                cityMm,
                latitude,
                longitude,
                phone,
                email,
                description,
                descriptionMm,
                descriptionTh,
                descriptionEn,
                hasDelivery,
                deliveryEnabled,
                hasParking,
                hasWifi,
                isVerified,
                isActive,
                isHalal,
                isVegetarian,
                pricePreference,
                pricePreferenceMm,
                pricePreferenceTh,
                pricePreferenceEn,
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
                formData.append("logoPhoto", logoFile);
            }

            // Append Cover Photo
            if (coverFile) {
                formData.append("coverPhoto", coverFile);
            }

            // Append Gallery Photos (only for create)
            if (!isEditMode) {
                galleryFiles.forEach((file) => {
                    formData.append("galleryPhotos", file);
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
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Name (Default)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. My Together Cafe" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="nameMm"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Name (Myanmar)</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="မြန်မာနာမည်" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="nameEn"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Name (English)</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Shop Name in English" {...field} />
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
                                                        <FormLabel>Name (Thai)</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="ชื่อร้านภาษาไทย" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="slug"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Slug</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="my-together-cafe" {...field} />
                                                        </FormControl>
                                                        <FormDescription>URL friendly name.</FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="category"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Category</FormLabel>
                                                        <FormControl>
                                                            <SearchableSelect
                                                                data={categories.map(cat => ({ label: cat, value: cat }))}
                                                                value="value"
                                                                labelKey="label"
                                                                selectedValue={field.value ? { label: field.value, value: field.value } : undefined}
                                                                onChange={(item) => field.onChange(item?.value || "")}
                                                                placeholder={setupLoading ? "Loading categories..." : "Select a category"}
                                                                disabled={setupLoading}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
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
                                                                    const cuisine = setupData?.cuisineTypes?.find((c: any) => c.id === id)
                                                                    return cuisine ? (
                                                                        <Badge key={id} variant="secondary" className="gap-1">
                                                                            {cuisine.name}
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
                                                                    data={setupData?.cuisineTypes?.map((c: any) => ({ label: c.name, value: c.id })) || []}
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
                                                                    <FormLabel className="text-base">Delivery Types</FormLabel>
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
                                                                    <FormLabel className="text-base">Payment Methods</FormLabel>
                                                                    <FormDescription>
                                                                        Select payment methods supported by this shop.
                                                                    </FormDescription>
                                                                </div>
                                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                                    {(setupData?.paymentMethods || []).map((method: any) => (
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
                                                                                        <FormLabel className="font-normal cursor-pointer">
                                                                                            {method.name}
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

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="description"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Description (Default)</FormLabel>
                                                        <FormControl>
                                                            <Textarea rows={3} className="resize-none" placeholder="Tell us about the shop..." {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="descriptionMm"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Description (Myanmar)</FormLabel>
                                                        <FormControl>
                                                            <Textarea rows={3} className="resize-none" placeholder="မြန်မာဘာသာဖော်ပါဖယ်ရှားပါး" {...field} />
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
                                                            <Textarea rows={3} className="resize-none" placeholder="รายละเอียดภาษาไทย" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Location */}
                                <Card className="border-solid">
                                    <CardHeader>
                                        <CardTitle>Location</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-6">
                                        {/* Address (English) */}
                                        <FormField
                                            control={form.control}
                                            name="address"
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

                                        {/* Address (Myanmar) */}
                                        <FormField
                                            control={form.control}
                                            name="addressMm"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Address (Myanmar)</FormLabel>
                                                    <FormControl>
                                                        <Textarea rows={3} className="resize-none" placeholder="မြန်မာဘာသာဖြင့်လိပ်စာ" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Address (Thai) */}
                                        <FormField
                                            control={form.control}
                                            name="addressTh"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Address (Thai)</FormLabel>
                                                    <FormControl>
                                                        <Textarea rows={3} className="resize-none" placeholder="ที่อยู่ภาษาไทย" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="districtId"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>District ID</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" placeholder="District ID" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="district"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>District (English)</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="e.g. Dagon" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="districtMm"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>District (Myanmar)</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="e.g. ဒဂုံ" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="city"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>City (English)</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="e.g. Yangon" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="cityMm"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>City (Myanmar)</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="e.g. ရန်ကုန်" {...field} />
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
                                                            <Input placeholder="Phone number" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* Email - Full Width */}
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

                                            <div className="space-y-2">
                                                <div className="text-sm font-medium">Gallery Photos (Multiple)</div>
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
                                                            <Input type="number" placeholder="0" {...field} />
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
                                                            <Input type="number" placeholder="0" {...field} />
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
                            Are you sure you want to delete <strong>{form.getValues("name")}</strong>?
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
