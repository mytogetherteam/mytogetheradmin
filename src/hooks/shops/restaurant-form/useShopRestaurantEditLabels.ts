import { useCallback, useState } from "react"
import type { ShopDetail } from "@/services/shopService"
import { resolveShopCityLabel, resolveShopDistrictLabel } from "@/services/shopService"

export function useShopRestaurantEditLabels() {
    const [initialCuisineOptions, setInitialCuisineOptions] = useState<{ label: string; value: string }[]>([])
    const [initialCategoryLabel, setInitialCategoryLabel] = useState<string | null>(null)
    const [initialSubCategoryLabel, setInitialSubCategoryLabel] = useState<string | null>(null)
    const [initialCityLabel, setInitialCityLabel] = useState<string | null>(null)
    const [initialDistrictLabel, setInitialDistrictLabel] = useState<string | null>(null)
    const [initialAssignedAdminLabel, setInitialAssignedAdminLabel] = useState<string | null>(null)

    const resetEditLabels = useCallback(() => {
        setInitialCategoryLabel(null)
        setInitialSubCategoryLabel(null)
        setInitialCuisineOptions([])
        setInitialCityLabel(null)
        setInitialDistrictLabel(null)
        setInitialAssignedAdminLabel(null)
    }, [])

    const hydrateEditLabelsFromShop = useCallback(
        (shop: ShopDetail, extras?: { assignedAdminLabel?: string | null }) => {
        setInitialCategoryLabel(shop.shopCategory?.nameEn || shop.category || null)
        const subs = shop.shopCategory?.subCategories
        const preferredSub =
            shop.shopSubCategoryId != null && subs?.length
                ? subs.find((s) => s.id === shop.shopSubCategoryId) ?? subs[0]
                : subs?.[0]
        setInitialSubCategoryLabel(
            preferredSub?.nameEn ||
                preferredSub?.nameMm ||
                preferredSub?.name ||
                shop.subCategory ||
                null,
        )
        setInitialCityLabel(resolveShopCityLabel(shop) || null)
        setInitialDistrictLabel(resolveShopDistrictLabel(shop) || null)

        if (shop.cuisineTypes) {
            setInitialCuisineOptions(
                shop.cuisineTypes.map((c) => ({
                    label: c.nameEn || c.name || `Cuisine ${c.id}`,
                    value: String(c.id),
                })),
            )
        }
        setInitialAssignedAdminLabel(extras?.assignedAdminLabel ?? null)
    },
    [],
    )

    return {
        initialCuisineOptions,
        initialCategoryLabel,
        initialSubCategoryLabel,
        initialCityLabel,
        initialDistrictLabel,
        initialAssignedAdminLabel,
        resetEditLabels,
        hydrateEditLabelsFromShop,
    }
}
