import { useCallback, useState } from "react"
import type { UseFormReturn } from "react-hook-form"
import type { ShopFormValues } from "@/schemas/shop.schema"
import { districtService } from "@/services/districtService"
import type { DistrictDTO } from "@/services/shopService"

export function useShopRestaurantLocationPickers(form: UseFormReturn<ShopFormValues>) {
    const [selectedCityId, setSelectedCityId] = useState<number | null>(null)
    const [availableDistricts, setAvailableDistricts] = useState<DistrictDTO[]>([])

    const resetLocationPickers = useCallback(() => {
        setSelectedCityId(null)
        setAvailableDistricts([])
    }, [])

    const hydrateCityAndDistricts = useCallback((cityId: number) => {
        setSelectedCityId(cityId)
        districtService
            .getDistricts({ page: 1, size: 100, cityId })
            .then((results) => {
                setAvailableDistricts(results.content as DistrictDTO[])
            })
            .catch((err) => console.error("Failed to fetch initial districts", err))
    }, [])

    const handleCityChange = useCallback(
        async (cityId: number) => {
            setSelectedCityId(cityId)
            form.setValue("districtId", 0)
            try {
                const results = await districtService.getDistricts({ page: 1, size: 100, cityId })
                setAvailableDistricts(results.content as DistrictDTO[])
            } catch (error) {
                console.error("Failed to fetch districts", error)
            }
        },
        [form],
    )

    const handleDistrictChange = useCallback(
        (districtId: number) => {
            form.setValue("districtId", districtId)
        },
        [form],
    )

    return {
        selectedCityId,
        availableDistricts,
        resetLocationPickers,
        hydrateCityAndDistricts,
        handleCityChange,
        handleDistrictChange,
    }
}
