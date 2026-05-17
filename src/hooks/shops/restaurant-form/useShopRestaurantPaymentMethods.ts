import { useCallback, useMemo, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import type { FieldErrors } from "react-hook-form"
import { useWatch } from "react-hook-form"
import type { ShopFormValues } from "@/schemas/shop.schema"
import type { useShopRestaurantForm } from "./useShopRestaurantForm"

type ShopPaymentMethodFormValue = ShopFormValues["shopPaymentMethods"][number]

interface UseShopRestaurantPaymentMethodsResult {
    selectedShopPaymentMethods: ShopPaymentMethodFormValue[]
    sortedShopPaymentMethods: ShopPaymentMethodFormValue[]
    activePaymentMethodId: number | null
    activeShopPaymentMethod: ShopPaymentMethodFormValue | undefined
    setActivePaymentMethodId: Dispatch<SetStateAction<number | null>>
    setShopPaymentMethods: (next: ShopPaymentMethodFormValue[]) => void
    updateShopPaymentMethod: (
        paymentMethodId: number,
        patch: Partial<ShopPaymentMethodFormValue>,
    ) => void
    handleInvalidSubmit: (errors: FieldErrors<ShopFormValues>) => void
}

export function useShopRestaurantPaymentMethods(
    form: ReturnType<typeof useShopRestaurantForm>,
): UseShopRestaurantPaymentMethodsResult {
    const watchedShopPaymentMethods = useWatch({
        control: form.control,
        name: "shopPaymentMethods",
    })
    const selectedShopPaymentMethods = useMemo(
        () => watchedShopPaymentMethods ?? [],
        [watchedShopPaymentMethods],
    )
    const [activePaymentMethodId, setActivePaymentMethodId] = useState<number | null>(null)
    const isSubmitted = form.formState.isSubmitted

    const sortedShopPaymentMethods = useMemo(
        () =>
            [...selectedShopPaymentMethods].sort(
                (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
            ),
        [selectedShopPaymentMethods],
    )

    const activeShopPaymentMethod =
        sortedShopPaymentMethods.find((detail) => detail.paymentMethodId === activePaymentMethodId) ??
        sortedShopPaymentMethods[0]

    const setShopPaymentMethods = useCallback(
        (next: ShopPaymentMethodFormValue[]) => {
            form.setValue("shopPaymentMethods", next, {
                shouldDirty: true,
                shouldValidate: isSubmitted,
            })
        },
        [form, isSubmitted],
    )

    const updateShopPaymentMethod = useCallback(
        (paymentMethodId: number, patch: Partial<ShopPaymentMethodFormValue>) => {
            setShopPaymentMethods(
                selectedShopPaymentMethods.map((detail) =>
                    detail.paymentMethodId === paymentMethodId
                        ? { ...detail, ...patch }
                        : detail,
                ),
            )
        },
        [selectedShopPaymentMethods, setShopPaymentMethods],
    )

    const handleInvalidSubmit = useCallback(
        (errors: FieldErrors<ShopFormValues>) => {
            const paymentErrors = errors.shopPaymentMethods
            if (!Array.isArray(paymentErrors)) return

            const firstInvalidIndex = paymentErrors.findIndex(
                (error) => error?.accountName || error?.accountNumber,
            )
            const firstInvalidPaymentMethod = selectedShopPaymentMethods[firstInvalidIndex]
            if (firstInvalidPaymentMethod) {
                setActivePaymentMethodId(firstInvalidPaymentMethod.paymentMethodId)
            }
        },
        [selectedShopPaymentMethods],
    )

    return {
        selectedShopPaymentMethods,
        sortedShopPaymentMethods,
        activePaymentMethodId,
        activeShopPaymentMethod,
        setActivePaymentMethodId,
        setShopPaymentMethods,
        updateShopPaymentMethod,
        handleInvalidSubmit,
    }
}
