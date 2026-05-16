import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { CreateCityRequest } from "@/services/cityService";
import { useCity, useCreateCityMutation, useUpdateCityMutation } from "@/hooks/city/useCity";

import { citySchema, type CityFormValues } from "@/schemas/city.schema";

export default function CreateCity() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const { data: cityData, isPending: loadingCity } = useCity(isEdit ? parseInt(id!) : 0);
    const loading = isEdit ? loadingCity : false;

    const { mutateAsync: createCity, isPending: isCreating } = useCreateCityMutation();
    const { mutateAsync: updateCity, isPending: isUpdating } = useUpdateCityMutation();
    const submitting = isCreating || isUpdating;

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<CityFormValues>({
        resolver: zodResolver(citySchema) as Resolver<CityFormValues>,
        defaultValues: {
            nameEn: "",
            nameMm: "",
            nameTh: "",
            isActive: true,
        },
    });

    useEffect(() => {
        if (isEdit && cityData) {
            reset({
                nameEn: cityData.nameEn,
                nameMm: cityData.nameMm,
                nameTh: cityData.nameTh || "",
                isActive: cityData.isActive ?? true,
            });
        }
    }, [isEdit, cityData, reset]);

    const onSubmit = async (values: CityFormValues) => {
        const data: CreateCityRequest = {
            ...values,
            nameTh: values.nameTh || undefined,
        };
        if (isEdit) {
            await updateCity({ id: parseInt(id!), data });
        } else {
            await createCity(data);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground animate-pulse">Loading city data...</p>
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
                    <CardTitle>{isEdit ? "Edit City" : "Create City"}</CardTitle>
                    <CardDescription>{isEdit ? "Update city information." : "Add a new city to the platform."}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nameEn">Name (English) *</Label>
                                <Input
                                    id="nameEn"
                                    placeholder="e.g. Yangon"
                                    {...register("nameEn")}
                                />
                                {errors.nameEn && <p className="text-xs text-destructive">{errors.nameEn.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nameMm">Name (Myanmar) *</Label>
                                <Input
                                    id="nameMm"
                                    placeholder="e.g. ရန်ကုန်"
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
                                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isEdit ? "Updating..." : "Creating..."}</> : <><Save className="mr-2 h-4 w-4" />{isEdit ? "Update City" : "Create City"}</>}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={submitting}>Cancel</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

