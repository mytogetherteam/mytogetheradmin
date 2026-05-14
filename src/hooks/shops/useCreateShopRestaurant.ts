import { useCallback, useEffect, useRef, useState } from "react"
import type { Resolver, SubmitHandler } from "react-hook-form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { shopFormSchema, type ShopFormValues } from "@/schemas/shop.schema"
import {
    ShopService,
    type ShopFormDataDTO,
    type DistrictDTO,
    type PaymentMethodDTO,
} from "@/services/shopService"
import { handleApiError } from "@/lib/error-utils"
import { useCreateShopMutation, useUpdateShopMutation } from "@/hooks/shops/useShopMutations"
import { useShopRestaurantEditLabels } from "@/hooks/shops/useShopRestaurantEditLabels"
import { useShopRestaurantLocationPickers } from "@/hooks/shops/useShopRestaurantLocationPickers"
import { useShopRestaurantMedia } from "@/hooks/shops/useShopRestaurantMedia"

/** Form fields for POST /api/admin/shop-profile — must match CreateAdminShopProfileDto (multipart). */
function appendCreateAdminShopProfileFields(
    fd: FormData,
    p: {
        nameEn: string
        nameMm: string
        nameTh: string
        shopCategoryId?: number | null
        shopSubCategoryId: number | null
        addressEn?: string
        addressMm: string
        addressTh: string
        districtId?: number
        latitude?: number
        longitude?: number
        phone: string
        email: string
        descriptionEn: string
        descriptionMm: string
        descriptionTh: string
        hasDelivery: boolean
        deliveryEnabled: boolean
        isPickUp: boolean
        hasParking: boolean
        hasWifi: boolean
        isVerified: boolean
        isActive: boolean
        cityId: number | null
        isHalal: boolean
        isVegetarian: boolean
        pricePreference: string
        enableStockCheck: boolean
        maxItemQuantityPerOrder: number
        minOrderAmount: number
        baseDeliveryFee: number
        cuisineTypeIds: number[]
        paymentMethodIds: number[]
        operatingHours: { dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean }[]
        assignedAdminId: number | null
    },
) {
    fd.append("nameEn", p.nameEn ?? "")
    fd.append("nameMm", p.nameMm)
    fd.append("nameTh", p.nameTh)
    if (p.shopCategoryId != null && p.shopCategoryId > 0) {
        fd.append("shopCategoryId", String(p.shopCategoryId))
    }
    if (p.shopSubCategoryId != null && p.shopSubCategoryId > 0) {
        fd.append("shopSubCategoryId", String(p.shopSubCategoryId))
    }
    if (p.addressEn) fd.append("addressEn", p.addressEn)
    fd.append("addressMm", p.addressMm)
    fd.append("addressTh", p.addressTh)
    if (p.districtId != null && p.districtId > 0) {
        fd.append("districtId", String(p.districtId))
    }
    if (p.latitude != null && p.latitude !== 0) {
        fd.append("latitude", String(p.latitude))
    }
    if (p.longitude != null && p.longitude !== 0) {
        fd.append("longitude", String(p.longitude))
    }
    fd.append("phone", p.phone)
    if (p.email) fd.append("email", p.email)
    fd.append("descriptionEn", p.descriptionEn)
    fd.append("descriptionMm", p.descriptionMm)
    fd.append("descriptionTh", p.descriptionTh)
    fd.append("hasDelivery", String(p.hasDelivery))
    fd.append("deliveryEnabled", String(p.deliveryEnabled))
    fd.append("isPickUp", String(p.isPickUp))
    fd.append("hasParking", String(p.hasParking))
    fd.append("hasWifi", String(p.hasWifi))
    fd.append("isVerified", String(p.isVerified))
    fd.append("isActive", String(p.isActive))
    if (p.cityId != null && p.cityId > 0) {
        fd.append("cityId", String(p.cityId))
    }
    fd.append("isHalal", String(p.isHalal))
    fd.append("isVegetarian", String(p.isVegetarian))
    fd.append("pricePreference", p.pricePreference || "MEDIUM")
    fd.append("enableStockCheck", String(p.enableStockCheck))
    fd.append("maxItemQuantityPerOrder", String(p.maxItemQuantityPerOrder))
    fd.append("minOrderAmount", String(p.minOrderAmount))
    fd.append("baseDeliveryFee", String(p.baseDeliveryFee))
    fd.append("cuisineTypeIds", JSON.stringify(p.cuisineTypeIds ?? []))
    fd.append("paymentMethodIds", JSON.stringify(p.paymentMethodIds ?? []))
    fd.append("operatingHours", JSON.stringify(p.operatingHours ?? []))
    if (p.assignedAdminId != null) {
        fd.append("assignedAdminId", String(p.assignedAdminId))
    }
}

export interface CreateShopRestaurantUiState {
    isEditMode: boolean
    shopId: string | null
    coverPreview: string | null
    logoPreview: string | null
    galleryPreviews: string[]
    existingGalleryUrls: string[]
    deleteDialogOpen: boolean
    deleting: boolean
    setupData: ShopFormDataDTO | null
    paymentMethods: PaymentMethodDTO[]
    selectedCityId: number | null
    availableDistricts: DistrictDTO[]
    initialCuisineOptions: { label: string; value: string }[]
    initialCategoryLabel: string | null
    initialSubCategoryLabel: string | null
    initialCityLabel: string | null
    initialDistrictLabel: string | null
    isSubmitting: boolean
}

export interface CreateShopRestaurantActions {
    onSubmit: SubmitHandler<ShopFormValues>
    handleCancel: () => void
    handleDelete: () => Promise<void>
    handleCoverChange: ReturnType<typeof useShopRestaurantMedia>["handleCoverChange"]
    handleLogoChange: ReturnType<typeof useShopRestaurantMedia>["handleLogoChange"]
    handleGalleryChange: ReturnType<typeof useShopRestaurantMedia>["handleGalleryChange"]
    removeGalleryPhoto: ReturnType<typeof useShopRestaurantMedia>["removeGalleryPhoto"]
    removeExistingGalleryPhoto: ReturnType<typeof useShopRestaurantMedia>["removeExistingGalleryPhoto"]
    handleCityChange: ReturnType<typeof useShopRestaurantLocationPickers>["handleCityChange"]
    handleDistrictChange: ReturnType<typeof useShopRestaurantLocationPickers>["handleDistrictChange"]
    setDeleteDialogOpen: (open: boolean) => void
    clearLogoMedia: ReturnType<typeof useShopRestaurantMedia>["clearLogoMedia"]
    clearCoverMedia: ReturnType<typeof useShopRestaurantMedia>["clearCoverMedia"]
}

export interface UseCreateShopRestaurantResult {
    form: ReturnType<typeof useForm<ShopFormValues>>
    ui: CreateShopRestaurantUiState
    actions: CreateShopRestaurantActions
}

export function useCreateShopRestaurant(): UseCreateShopRestaurantResult {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const shopId = searchParams.get("id")
    const isEditMode = !!shopId

    const { mutateAsync: createShop, isPending: isCreatingShop } = useCreateShopMutation()
    const { mutateAsync: updateShop, isPending: isUpdatingShop } = useUpdateShopMutation()
    const isSubmitting = isCreatingShop || isUpdatingShop

    const form = useForm<ShopFormValues>({
        resolver: zodResolver(shopFormSchema) as Resolver<ShopFormValues>,
        /** Full-schema Zod runs on every validation; avoid doing that on each keystroke (use onTouched). */
        mode: "onTouched",
        reValidateMode: "onChange",
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
            isPickUp: false,
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
            assignedAdminId: undefined,
        },
    })

    const media = useShopRestaurantMedia()
    const locationPickers = useShopRestaurantLocationPickers(form)
    const editLabels = useShopRestaurantEditLabels()

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)

    /** Reference data for labels (e.g. shop categories). Populate via `PaymentService.getShopFormData` when wired. */
    const setupData: ShopFormDataDTO | null = null
    const paymentMethods: PaymentMethodDTO[] = []

    const shopDataLoadedRef = useRef(false)

    const loadShopData = useCallback(
        async (id: string) => {
            if (shopDataLoadedRef.current) return
            shopDataLoadedRef.current = true

            try {
                const numericShopId = parseInt(id, 10)
                if (isNaN(numericShopId)) {
                    toast.error("Invalid shop ID")
                    navigate("/shops/manage")
                    return
                }

                const [shop, shopPaymentMethods, shopOperatingHours] = await Promise.all([
                    ShopService.getShopById(numericShopId),
                    ShopService.getShopPaymentMethods(numericShopId),
                    ShopService.getShopOperatingHours(numericShopId),
                ])

                const shopCategoryId = shop.shopCategoryId || shop.shopCategory?.id || undefined

                const shopSubCategoryId =
                    shop.shopSubCategoryId ||
                    (shop.shopCategory?.subCategories && shop.shopCategory.subCategories.length > 0
                        ? shop.shopCategory.subCategories[0].id
                        : undefined) ||
                    undefined

                form.reset({
                    nameEn: shop.nameEn || shop.nameMm || "",
                    nameMm: shop.nameMm || shop.nameEn || "",
                    nameTh: shop.nameTh || "",
                    shopCategoryId,
                    shopSubCategoryId,
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
                    isPickUp: shop.isPickUp ?? false,
                    hasParking: shop.hasParking ?? false,
                    hasWifi: shop.hasWifi ?? false,
                    isVerified: shop.isVerified ?? false,
                    isActive: shop.isActive ?? true,
                    isHalal: shop.isHalal ?? false,
                    isVegetarian: shop.isVegetarian ?? false,
                    pricePreference: shop.pricePreference || "MEDIUM",
                    enableStockCheck: shop.enableStockCheck ?? false,
                    maxItemQuantityPerOrder: shop.maxItemQuantityPerOrder ?? 10,
                    minOrderAmount:
                        shop.minOrderAmount === undefined || shop.minOrderAmount === null || shop.minOrderAmount === 0
                            ? 1
                            : shop.minOrderAmount,
                    baseDeliveryFee: shop.baseDeliveryFee ?? 0,
                    cuisineTypeIds:
                        shop.cuisineTypeIds || (shop.cuisineTypes ? shop.cuisineTypes.map((c) => c.id) : []),
                    paymentMethodIds: shopPaymentMethods.map((pm) => pm.id),
                    operatingHours:
                        shopOperatingHours && shopOperatingHours.length > 0
                            ? shopOperatingHours.map((oh) => ({
                                  dayOfWeek: oh.dayOfWeek,
                                  openTime:
                                      typeof oh.openingTime === "string"
                                          ? oh.openingTime.substring(0, 5)
                                          : oh.openTime || "09:00",
                                  closeTime:
                                      typeof oh.closingTime === "string"
                                          ? oh.closingTime.substring(0, 5)
                                          : oh.closeTime || "21:00",
                                  isClosed: oh.isClosed ?? false,
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
                    assignedAdminId: shop.assignedAdminId ?? undefined,
                })

                editLabels.hydrateEditLabelsFromShop(shop)
                media.hydrateMediaFromShop(shop)

                if (shop.cityId) {
                    locationPickers.hydrateCityAndDistricts(shop.cityId)
                }
            } catch (error) {
                handleApiError(error, "Failed to load shop data")
                navigate("/shops/manage")
            }
        },
        [
            form,
            navigate,
            editLabels.hydrateEditLabelsFromShop,
            media.hydrateMediaFromShop,
            locationPickers.hydrateCityAndDistricts,
        ],
    )

    useEffect(() => {
        shopDataLoadedRef.current = false
    }, [shopId])

    useEffect(() => {
        if (isEditMode && shopId) {
            loadShopData(shopId)
        } else {
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
                isPickUp: false,
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
                operatingHours: [
                    { dayOfWeek: 0, openTime: "09:00", closeTime: "21:00", isClosed: false },
                    { dayOfWeek: 1, openTime: "09:00", closeTime: "21:00", isClosed: false },
                    { dayOfWeek: 2, openTime: "09:00", closeTime: "21:00", isClosed: false },
                    { dayOfWeek: 3, openTime: "09:00", closeTime: "21:00", isClosed: false },
                    { dayOfWeek: 4, openTime: "09:00", closeTime: "21:00", isClosed: false },
                    { dayOfWeek: 5, openTime: "09:00", closeTime: "21:00", isClosed: false },
                    { dayOfWeek: 6, openTime: "09:00", closeTime: "21:00", isClosed: false },
                ],
                assignedAdminId: undefined,
            })
            editLabels.resetEditLabels()
            locationPickers.resetLocationPickers()
            media.resetMedia()
        }
    }, [
        shopId,
        isEditMode,
        loadShopData,
        form,
        editLabels.resetEditLabels,
        locationPickers.resetLocationPickers,
        media.resetMedia,
    ])

    const onSubmit: SubmitHandler<ShopFormValues> = useCallback(
        async (data) => {
            if (isEditMode && shopId) {
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
                    isPickUp: data.isPickUp ?? false,
                    hasParking: data.hasParking ?? false,
                    hasWifi: data.hasWifi ?? false,
                    isVerified: data.isVerified ?? false,
                    isActive: data.isActive ?? true,
                    cityId: locationPickers.selectedCityId,
                    isHalal: data.isHalal ?? false,
                    isVegetarian: data.isVegetarian ?? false,
                    pricePreference: data.pricePreference || "MEDIUM",
                    enableStockCheck: data.enableStockCheck ?? false,
                    maxItemQuantityPerOrder: data.maxItemQuantityPerOrder || 10,
                    minOrderAmount: data.minOrderAmount || 1,
                    baseDeliveryFee: data.baseDeliveryFee || 0,
                    cuisineTypeIds: data.cuisineTypeIds,
                    paymentMethodIds: data.paymentMethodIds,
                    operatingHours: data.operatingHours,
                    assignedAdminId: data.assignedAdminId ?? null,
                }
                const formData = new FormData()
                formData.append(
                    "data",
                    new Blob([JSON.stringify(payloadData)], {
                        type: "application/json",
                    }),
                )
                if (media.logoFile) {
                    formData.append("logoPhoto", media.logoFile)
                }
                if (media.coverFile) {
                    formData.append("coverPhoto", media.coverFile)
                }
                media.galleryFiles.forEach((file) => {
                    formData.append("galleryPhotos", file)
                })
                const numericId = parseInt(shopId, 10)
                await updateShop({ id: numericId, formData })
                return
            }

            const formData = new FormData()
            appendCreateAdminShopProfileFields(formData, {
                nameEn: data.nameEn ?? "",
                nameMm: data.nameMm || "",
                nameTh: data.nameTh || "",
                shopCategoryId: data.shopCategoryId,
                shopSubCategoryId: data.shopSubCategoryId ?? null,
                addressEn: data.addressEn,
                addressMm: data.addressMm || "",
                addressTh: data.addressTh || "",
                districtId: data.districtId ?? undefined,
                latitude: data.latitude,
                longitude: data.longitude,
                phone: data.phone || "",
                email: data.email || "",
                descriptionEn: data.descriptionEn || "",
                descriptionMm: data.descriptionMm || "",
                descriptionTh: data.descriptionTh || "",
                hasDelivery: data.hasDelivery ?? false,
                deliveryEnabled: data.deliveryEnabled ?? false,
                isPickUp: data.isPickUp ?? false,
                hasParking: data.hasParking ?? false,
                hasWifi: data.hasWifi ?? false,
                isVerified: data.isVerified ?? false,
                isActive: data.isActive ?? true,
                cityId: locationPickers.selectedCityId,
                isHalal: data.isHalal ?? false,
                isVegetarian: data.isVegetarian ?? false,
                pricePreference: data.pricePreference || "MEDIUM",
                enableStockCheck: data.enableStockCheck ?? false,
                maxItemQuantityPerOrder: data.maxItemQuantityPerOrder || 10,
                minOrderAmount: data.minOrderAmount || 1,
                baseDeliveryFee: data.baseDeliveryFee || 0,
                cuisineTypeIds: data.cuisineTypeIds,
                paymentMethodIds: data.paymentMethodIds,
                operatingHours: data.operatingHours,
                assignedAdminId: data.assignedAdminId ?? null,
            })
            if (media.logoFile) {
                formData.append("logoPhoto", media.logoFile)
            }
            if (media.coverFile) {
                formData.append("coverPhoto", media.coverFile)
            }
            media.galleryFiles.forEach((file) => {
                formData.append("galleryPhotos", file)
            })
            await createShop(formData)
        },
        [
            isEditMode,
            shopId,
            locationPickers.selectedCityId,
            media.logoFile,
            media.coverFile,
            media.galleryFiles,
            updateShop,
            createShop,
        ],
    )

    const handleCancel = useCallback(() => {
        navigate("/shops/manage")
    }, [navigate])

    const handleDelete = useCallback(async () => {
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
    }, [shopId, navigate])

    const ui: CreateShopRestaurantUiState = {
        isEditMode,
        shopId,
        coverPreview: media.coverPreview,
        logoPreview: media.logoPreview,
        galleryPreviews: media.galleryPreviews,
        existingGalleryUrls: media.existingGalleryUrls,
        deleteDialogOpen,
        deleting,
        setupData,
        paymentMethods,
        selectedCityId: locationPickers.selectedCityId,
        availableDistricts: locationPickers.availableDistricts,
        initialCuisineOptions: editLabels.initialCuisineOptions,
        initialCategoryLabel: editLabels.initialCategoryLabel,
        initialSubCategoryLabel: editLabels.initialSubCategoryLabel,
        initialCityLabel: editLabels.initialCityLabel,
        initialDistrictLabel: editLabels.initialDistrictLabel,
        isSubmitting,
    }

    const actions: CreateShopRestaurantActions = {
        onSubmit,
        handleCancel,
        handleDelete,
        handleCoverChange: media.handleCoverChange,
        handleLogoChange: media.handleLogoChange,
        handleGalleryChange: media.handleGalleryChange,
        removeGalleryPhoto: media.removeGalleryPhoto,
        removeExistingGalleryPhoto: media.removeExistingGalleryPhoto,
        handleCityChange: locationPickers.handleCityChange,
        handleDistrictChange: locationPickers.handleDistrictChange,
        setDeleteDialogOpen,
        clearLogoMedia: media.clearLogoMedia,
        clearCoverMedia: media.clearCoverMedia,
    }

    return { form, ui, actions }
}
