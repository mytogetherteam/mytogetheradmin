import { useCallback, useState } from "react"
import type { ShopDetail } from "@/services/shopService"
import { resolveShopCityLabel, resolveShopDistrictLabel } from "@/services/shopService"

export function useShopRestaurantEditLabels() {
    const [initialCuisineOptions, setInitialCuisineOptions] = useState<{ label: string; value: string }[]>([])
    const [initialCategoryLabel, setInitialCategoryLabel] = useState<string | null>(null)
    const [initialSubCategoryLabel, setInitialSubCategoryLabel] = useState<string | null>(null)
    const [initialCityLabel, setInitialCityLabel] = useState<string | null>(null)
    const [initialDistrictLabel, setInitialDistrictLabel] = useState<string | null>(null)

    const resetEditLabels = useCallback(() => {
        setInitialCategoryLabel(null)
        setInitialSubCategoryLabel(null)
        setInitialCuisineOptions([])
        setInitialCityLabel(null)
        setInitialDistrictLabel(null)
    }, [])

    const hydrateEditLabelsFromShop = useCallback((shop: ShopDetail) => {
        setInitialCategoryLabel(shop.shopCategory?.nameEn || shop.category || null)
        setInitialSubCategoryLabel(
            (shop.shopCategory?.subCategories && shop.shopCategory.subCategories.length > 0
                ? shop.shopCategory.subCategories[0].nameEn
                : null) ||
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
    }, [])

    return {
        initialCuisineOptions,
        initialCategoryLabel,
        initialSubCategoryLabel,
        initialCityLabel,
        initialDistrictLabel,
        resetEditLabels,
        hydrateEditLabelsFromShop,
    }
}
