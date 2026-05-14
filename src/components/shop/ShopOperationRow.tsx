import type { ShopFormValues } from "@/schemas/shop.schema"
import { useFormContext, useWatch } from "react-hook-form"
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

export const OPERATING_DAY_LABELS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
] as const

export function ShopOperationRow({ dayIndex }: { dayIndex: number }) {
    const { control } = useFormContext<ShopFormValues>()
    const isClosed = !!useWatch({
        control,
        name: `operatingHours.${dayIndex}.isClosed`,
    })

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg gap-4 bg-muted/5 group transition-colors hover:bg-muted/10">
            <div className="flex items-center gap-3 w-full sm:w-1/3">
                <div className="font-semibold text-sm w-24 text-foreground/80">
                    {OPERATING_DAY_LABELS[dayIndex]}
                </div>
                <FormField
                    control={control}
                    name={`operatingHours.${dayIndex}.isClosed`}
                    render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="text-xs text-muted-foreground font-medium">Closed</FormLabel>
                        </FormItem>
                    )}
                />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-2/3">
                <FormField
                    control={control}
                    name={`operatingHours.${dayIndex}.openTime`}
                    render={({ field }) => (
                        <FormItem className="flex-1 space-y-1">
                            <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Open</FormLabel>
                            <FormControl>
                                <Input
                                    type="time"
                                    {...field}
                                    disabled={isClosed}
                                    className="h-9 text-xs font-medium shadow-sm border-muted-foreground/20"
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name={`operatingHours.${dayIndex}.closeTime`}
                    render={({ field }) => (
                        <FormItem className="flex-1 space-y-1">
                            <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Close</FormLabel>
                            <FormControl>
                                <Input
                                    type="time"
                                    {...field}
                                    disabled={isClosed}
                                    className="h-9 text-xs font-medium shadow-sm border-muted-foreground/20"
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
            </div>
        </div>
    )
}
