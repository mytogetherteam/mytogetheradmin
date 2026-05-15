import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
    resolveShopCityLabel,
    resolveShopDistrictLabel,
} from "@/services/shopService"
import {
    useAdminShopProfilesBareInfiniteFetcher,
    useShopOperatingHoursQuery,
    useUpdateShopOperatingHoursMutation,
    defaultOperatingWeek,
    mapApiOperatingHoursToForm,
    type AdminShopProfileDropdownShop,
} from "@/hooks/shops"
import {
    operatingHoursFormSchema,
    type OperatingHoursFormValues,
} from "@/schemas/operatingHours.schema"
import {
    OPERATING_DAY_LABELS,
    ShopOperationRow,
} from "@/components/shop/ShopOperationRow"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader } from "@/components/ui/loader"
import { InfiniteSearchableSelect } from "@/components/ui/infinite-searchable-select"
import { MapPin, Clock, Store, Save, RotateCcw } from "lucide-react"

export default function ShopOperatingHours() {
    const { fetchShops } = useAdminShopProfilesBareInfiniteFetcher()
    const [selectedShop, setSelectedShop] = useState<AdminShopProfileDropdownShop | null>(null)

    const selectedShopId = selectedShop?.id ?? null

    const {
        data: operatingHoursData,
        isPending: loadingHours,
        isError: operatingHoursError,
    } = useShopOperatingHoursQuery(selectedShopId)

    const updateMutation = useUpdateShopOperatingHoursMutation()

    const form = useForm<OperatingHoursFormValues>({
        resolver: zodResolver(operatingHoursFormSchema),
        defaultValues: { operatingHours: defaultOperatingWeek() },
    })

    const { reset } = form

    useEffect(() => {
        if (!selectedShopId) {
            reset({ operatingHours: defaultOperatingWeek() })
            return
        }
        if (loadingHours || operatingHoursData === undefined) return
        reset({
            operatingHours: mapApiOperatingHoursToForm(operatingHoursData),
        })
    }, [selectedShopId, loadingHours, operatingHoursData, reset])

    const handleReset = () => {
        reset({
            operatingHours: mapApiOperatingHoursToForm(operatingHoursData ?? []),
        })
    }

    const onSubmit = form.handleSubmit((values) => {
        if (!selectedShop) return
        updateMutation.mutate({
            shopId: selectedShop.id,
            operatingHours: values.operatingHours,
        })
    })

    const isSaving = updateMutation.isPending
    const isDirty = form.formState.isDirty

    return (
        <div className="container mx-auto py-10 max-w-5xl">
            <Card className="flex flex-col h-full shadow-sm">
                <CardHeader className="bg-muted/30 border-b pb-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <CardTitle className="leading-tight text-2xl flex items-center gap-2">
                                <Clock className="h-6 w-6 text-primary" />
                                Shop Operating Hours
                            </CardTitle>
                            <CardDescription className="text-sm mt-1">
                                View and update operating hours for shops and restaurants.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="mb-8">
                        <label className="text-sm font-medium mb-2 block">Select a Shop/Restaurant</label>
                        <InfiniteSearchableSelect
                            fetchData={fetchShops}
                            valueKey="id"
                            labelKey="dropdownLabel"
                            selectedValue={selectedShop}
                            onChange={(item) => setSelectedShop(item as AdminShopProfileDropdownShop)}
                            placeholder="-- Select a Shop --"
                            className="w-full md:w-[400px]"
                        />

                        {selectedShop && (
                            <div className="mt-4 p-4 bg-muted/20 rounded-lg flex items-start gap-4 border">
                                <div className="w-16 h-16 rounded-md overflow-hidden bg-muted shrink-0 border">
                                    {selectedShop.logoUrl ? (
                                        <img src={selectedShop.logoUrl} alt={selectedShop.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-medium bg-secondary/50">N/A</div>
                                    )}
                                </div>
                                <div className="flex flex-col justify-center">
                                    <h3 className="font-semibold text-lg leading-none mb-1">{selectedShop.nameEn || selectedShop.nameMm || selectedShop.name}</h3>
                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                                        <MapPin className="h-3.5 w-3.5" />
                                        {[resolveShopDistrictLabel(selectedShop), resolveShopCityLabel(selectedShop)].filter(Boolean).join(", ") || "No location provided"}
                                    </div>
                                    <div className="mt-2 flex gap-2">
                                        {selectedShop.category ? (
                                            <Badge variant="outline" className="capitalize text-[10px] py-0">{selectedShop.category}</Badge>
                                        ) : null}
                                        <Badge className={`text-[10px] py-0 ${selectedShop.isActive !== false ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-red-100 text-red-800 hover:bg-red-100"}`} variant="secondary">
                                            {selectedShop.isActive !== false ? "Active" : "Inactive"}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {selectedShop ? (
                        operatingHoursError ? (
                            <div className="text-center py-12 border rounded-md bg-destructive/5">
                                <p className="text-sm text-destructive">
                                    Failed to load operating hours for this shop.
                                </p>
                            </div>
                        ) : loadingHours ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <Loader size="lg" className="mb-4" />
                                <p>Loading business hours...</p>
                            </div>
                        ) : (
                            <Form {...form}>
                                <form onSubmit={onSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 gap-4">
                                        {OPERATING_DAY_LABELS.map((_, index) => (
                                            <ShopOperationRow key={index} dayIndex={index} />
                                        ))}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t">
                                        <Button type="submit" disabled={isSaving || !isDirty}>
                                            {isSaving ? (
                                                <>
                                                    <Loader size="sm" className="mr-2" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-4 w-4 mr-2" />
                                                    Save hours
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={isSaving || !isDirty}
                                            onClick={handleReset}
                                        >
                                            <RotateCcw className="h-4 w-4 mr-2" />
                                            Reset
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        )
                    ) : (
                        <div className="text-center py-16 border rounded-md border-dashed">
                            <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-10" />
                            <p className="text-muted-foreground">Please select a shop from the dropdown above to view and edit its operating hours.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
