import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useShopDrivers, useCreateDriverMutation } from "@/hooks/orders/useOrders";
import { driverCreateSchema, DriverCreateValues } from "@/schemas/order-status-action.schema";

interface Props {
    shopId: number;
    value: string;
    onChange: (driverId: string) => void;
    error?: string;
}

/** Picks an existing shop driver or creates a new one for the shop. */
export function DriverPicker({ shopId, value, onChange, error }: Props) {
    const { data: drivers = [] } = useShopDrivers(shopId);
    const createDriver = useCreateDriverMutation(shopId);

    // Open the create form when the user asks, or when the shop has no drivers.
    const [manualCreate, setManualCreate] = useState(false);
    const showCreate = manualCreate || drivers.length === 0;

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<DriverCreateValues>({
        resolver: zodResolver(driverCreateSchema),
        defaultValues: { name: "", phone: "", vehicleNo: "" },
    });

    const onCreate = (values: DriverCreateValues) => {
        createDriver.mutate(
            { shopId, ...values },
            {
                onSuccess: (created) => {
                    toast.success(`Driver "${created.name}" created for this shop`);
                    onChange(String(created.id));
                    setManualCreate(false);
                    reset();
                },
            },
        );
    };

    return (
        <div className="space-y-2 rounded-md border bg-muted/30 p-2">
            <p className="text-[11px] font-medium text-muted-foreground">Assign driver</p>

            {drivers.length > 0 && !showCreate && (
                <Select value={value} onValueChange={onChange}>
                    <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select a driver…" />
                    </SelectTrigger>
                    <SelectContent>
                        {drivers.map((d) => (
                            <SelectItem key={d.id} value={String(d.id)}>
                                {d.name} · {d.vehicleNo}{d.isBusy ? " (busy)" : ""}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            {!showCreate ? (
                <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => setManualCreate(true)}>
                    + New driver for this shop
                </Button>
            ) : (
                <div className="space-y-2">
                    <div>
                        <Input placeholder="Driver name" className="h-8 text-sm" {...register("name")} />
                        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
                    </div>
                    <div>
                        <Input placeholder="Phone" className="h-8 text-sm" {...register("phone")} />
                        {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>}
                    </div>
                    <div>
                        <Input placeholder="Vehicle no." className="h-8 text-sm" {...register("vehicleNo")} />
                        {errors.vehicleNo && <p className="text-xs text-destructive mt-1">{errors.vehicleNo.message}</p>}
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" size="sm" className="flex-1" disabled={createDriver.isPending} onClick={handleSubmit(onCreate)}>
                            {createDriver.isPending ? "Creating…" : "Create driver"}
                        </Button>
                        {drivers.length > 0 && (
                            <Button type="button" size="sm" variant="ghost" onClick={() => setManualCreate(false)}>
                                Cancel
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}
