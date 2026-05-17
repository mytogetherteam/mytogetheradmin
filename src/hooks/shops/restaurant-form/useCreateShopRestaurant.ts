import { useCallback, useEffect, useState } from "react"
import type { SubmitHandler } from "react-hook-form"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import type { ShopFormValues } from "@/schemas/shop.schema"
import {
    ShopService,
    type ShopFormDataDTO,
    type DistrictDTO,
    type PaymentMethodDTO,
} from "@/services/shopService"
import { handleApiError } from "@/lib/error-utils"
import {
    useCreateShopMutation,
    useUpdateShopMutation,
    useShopRestaurantEditQuery,
} from "./mutations"
import { usePaymentMethods } from "@/hooks/payment-methods/usePaymentMethod"
import { buildShopRestaurantSubmitFormData } from "./buildShopFormData"
import { createModeShopFormValues, useShopRestaurantForm } from "./useShopRestaurantForm"
import { useShopRestaurantEditLabels } from "./useShopRestaurantEditLabels"
import { useShopRestaurantLocationPickers } from "./useShopRestaurantLocationPickers"
import { useShopRestaurantMedia } from "./useShopRestaurantMedia"

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
    initialAssignedAdminLabel: string | null
    isSubmitting: boolean
    /** Edit mode: TanStack Query is fetching shop + related data for the form */
    isLoadingShopEdit: boolean
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
    form: ReturnType<typeof useShopRestaurantForm>
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

    const form = useShopRestaurantForm()
    const media = useShopRestaurantMedia()
    const locationPickers = useShopRestaurantLocationPickers(form)
    const editLabels = useShopRestaurantEditLabels()

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)

    /** Reference data for labels (e.g. shop categories). Populate via `PaymentService.getShopFormData` when wired. */
    const setupData: ShopFormDataDTO | null = null
    const { data: paymentMethodsResponse } = usePaymentMethods({
        page: 0,
        size: 200,
        isActive: true,
    })
    const paymentMethods: PaymentMethodDTO[] = paymentMethodsResponse?.content ?? []

    const numericEditId =
        shopId && !Number.isNaN(parseInt(shopId, 10)) ? parseInt(shopId, 10) : null

    useEffect(() => {
        if (!isEditMode || !shopId) return
        if (numericEditId !== null) return
        toast.error("Invalid shop ID")
        navigate("/shops/manage")
    }, [isEditMode, shopId, numericEditId, navigate])

    const shopEditQuery = useShopRestaurantEditQuery(numericEditId)

    useEffect(() => {
        if (!shopEditQuery.data || numericEditId === null) return
        const { shop, formValues, forMedia, initialAssignedAdminLabel } = shopEditQuery.data
        form.reset(formValues)
        editLabels.hydrateEditLabelsFromShop(shop, {
            assignedAdminLabel: initialAssignedAdminLabel,
        })
        media.hydrateMediaFromShop(forMedia)
        if (shop.cityId) {
            locationPickers.hydrateCityAndDistricts(shop.cityId)
        }
    }, [
        shopEditQuery.data,
        numericEditId,
        form,
        editLabels.hydrateEditLabelsFromShop,
        media.hydrateMediaFromShop,
        locationPickers.hydrateCityAndDistricts,
    ])

    useEffect(() => {
        if (!shopEditQuery.isError || numericEditId === null) return
        handleApiError(shopEditQuery.error, "Failed to load shop data")
        navigate("/shops/manage")
    }, [shopEditQuery.isError, shopEditQuery.error, numericEditId, navigate])

    useEffect(() => {
        if (numericEditId !== null) return
        form.reset(createModeShopFormValues)
        editLabels.resetEditLabels()
        locationPickers.resetLocationPickers()
        media.resetMedia()
    }, [
        numericEditId,
        form,
        editLabels.resetEditLabels,
        locationPickers.resetLocationPickers,
        media.resetMedia,
    ])

    const onSubmit: SubmitHandler<ShopFormValues> = useCallback(
        async (data) => {
            const formData = buildShopRestaurantSubmitFormData(data, {
                cityId: locationPickers.selectedCityId,
                logoFile: media.logoFile,
                coverFile: media.coverFile,
                galleryFiles: media.galleryFiles,
            })

            if (isEditMode && shopId) {
                const numericId = parseInt(shopId, 10)
                await updateShop({ id: numericId, formData })
                navigate("/shops/manage", { replace: true })
                return
            }

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
            navigate,
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
        initialAssignedAdminLabel: editLabels.initialAssignedAdminLabel,
        isSubmitting,
        isLoadingShopEdit: isEditMode && (shopEditQuery.isPending || shopEditQuery.isFetching),
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
