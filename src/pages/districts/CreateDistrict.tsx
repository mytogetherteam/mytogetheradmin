import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { CreateDistrictRequest } from "@/services/districtService";
import { useCities } from "@/hooks/city/useCity";
import { useDistrict, useCreateDistrictMutation, useUpdateDistrictMutation } from "@/hooks/district/useDistrict";

import { districtSchema, type DistrictFormValues } from "@/schemas/district.schema";

export default function CreateDistrict() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const { data: citiesData } = useCities({ page: 1, size: 500 });
    const cities = citiesData?.content || [];

    const { data: districtData, isPending: loadingDistrict } = useDistrict(isEdit ? parseInt(id!) : 0);
    const loading = isEdit ? loadingDistrict : false;

    const { mutateAsync: createDistrict, isPending: isCreating } = useCreateDistrictMutation();
    const { mutateAsync: updateDistrict, isPending: isUpdating } = useUpdateDistrictMutation();
    const submitting = isCreating || isUpdating;

    const { register, handleSubmit, control, reset, formState: { errors } } = useForm<DistrictFormValues>({
        resolver: zodResolver(districtSchema) as Resolver<DistrictFormValues>,
        defaultValues: {
            cityId: 0,
            nameEn: "",
            nameMm: "",
            nameTh: "",
            latitude: "",
            longitude: "",
            isActive: true,
        },
    });

    useEffect(() => {
        if (isEdit && districtData) {
            reset({
                cityId: districtData.cityId,
                nameEn: districtData.nameEn,
                nameMm: districtData.nameMm || "",
                nameTh: districtData.nameTh || "",
                latitude: districtData.latitude ? String(districtData.latitude) : "",
                longitude: districtData.longitude ? String(districtData.longitude) : "",
                isActive: districtData.isActive ?? true,
            });
        }
    }, [isEdit, districtData, reset]);

    const onSubmit = async (values: DistrictFormValues) => {
        const data: CreateDistrictRequest = {
            cityId: values.cityId,
            nameEn: values.nameEn,
            nameMm: values.nameMm,
            nameTh: values.nameTh || undefined,
            latitude: values.latitude ? parseFloat(values.latitude) : undefined,
            longitude: values.longitude ? parseFloat(values.longitude) : undefined,
            isActive: values.isActive,
        };
        if (isEdit) {
            await updateDistrict({ id: parseInt(id!), data });
        } else {
            await createDistrict(data);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground animate-pulse">Loading district data...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 max-w-2xl">
            <Button variant="ghost" className="mb-4 hover:bg-transparent p-0" onClick={() => navigate(-1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle>{isEdit ? "Edit District" : "Create District"}</CardTitle>
                    <CardDescription>{isEdit ? "Update district information." : "Add a new district to the platform."}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="city">City *</Label>
                            <Controller
                                name="cityId"
                                control={control}
                                render={({ field }) => (
                                    <Select 
                                        key={cities.length > 0 ? `cities-loaded-${field.value}` : 'cities-loading'}
                                        value={field.value ? String(field.value) : ""} 
                                        onValueChange={(val) => field.onChange(Number(val))}
                                    >
                                        <SelectTrigger className={errors.cityId ? "border-destructive" : ""}>
                                            <SelectValue placeholder="Select a city" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {cities.length > 0 ? (
                                                cities.map((c) => (
                                                    <SelectItem key={c.id} value={String(c.id)}>
                                                        {c.nameEn}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="loading" disabled>Loading cities...</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.cityId && <p className="text-xs text-destructive">{errors.cityId.message}</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nameEn">Name (English) *</Label>
                                <Input 
                                    id="nameEn" 
                                    placeholder="e.g. Kamayut" 
                                    {...register("nameEn")}
                                />
                                {errors.nameEn && <p className="text-xs text-destructive">{errors.nameEn.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nameMm">Name (Myanmar) *</Label>
                                <Input
                                    id="nameMm"
                                    placeholder="e.g. ကမာရွတ်"
                                    {...register("nameMm")}
                                />
                                {errors.nameMm && <p className="text-xs text-destructive">{errors.nameMm.message}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nameTh">Name (Thai)</Label>
                                <Input
                                    id="nameTh"
                                    placeholder="Optional"
                                    {...register("nameTh")}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="latitude">Latitude</Label>
                                <Input
                                    id="latitude"
                                    type="number"
                                    step="any"
                                    placeholder="e.g. 16.8409"
                                    {...register("latitude")}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="longitude">Longitude</Label>
                                <Input
                                    id="longitude"
                                    type="number"
                                    step="any"
                                    placeholder="e.g. 96.1735"
                                    {...register("longitude")}
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Controller
                                name="isActive"
                                control={control}
                                render={({ field }) => (
                                    <Switch
                                        id="isActive"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                )}
                            />
                            <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <Button type="submit" disabled={submitting} className="flex-1">
                                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isEdit ? "Updating..." : "Creating..."}</> : <><Save className="mr-2 h-4 w-4" />{isEdit ? "Update District" : "Create District"}</>}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={submitting}>Cancel</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

