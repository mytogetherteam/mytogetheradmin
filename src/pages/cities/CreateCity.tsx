import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { cityService, CreateCityRequest } from "@/services/cityService";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";

export default function CreateCity() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [nameEn, setNameEn] = useState("");
    const [nameMm, setNameMm] = useState("");
    const [nameTh, setNameTh] = useState("");
    const [active, setActive] = useState(true);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isEdit) {
            setLoading(true);
            cityService.getCityById(parseInt(id!))
                .then((city) => {
                    setNameEn(city.nameEn);
                    setNameMm(city.nameMm);
                    setNameTh(city.nameTh || "");
                    setActive(city.active);
                })
                .catch((e) => handleApiError(e, "Failed to load city"))
                .finally(() => setLoading(false));
        }
    }, [id, isEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nameEn.trim() || !nameMm.trim()) return toast.error("Name (EN) and Name (MM) are required");

        setSubmitting(true);
        try {
            const data: CreateCityRequest = { nameEn: nameEn.trim(), nameMm: nameMm.trim(), nameTh: nameTh.trim() || undefined, active };
            if (isEdit) {
                await cityService.updateCity(parseInt(id!), data);
                toast.success("City updated successfully");
            } else {
                await cityService.createCity(data);
                toast.success("City created successfully");
            }
            navigate("/cities/manage");
        } catch (e) {
            handleApiError(e, isEdit ? "Failed to update city" : "Failed to create city");
        } finally { setSubmitting(false); }
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
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nameEn">Name (English) *</Label>
                                <Input id="nameEn" placeholder="e.g. Yangon" value={nameEn} onChange={(e) => {
                                    setNameEn(e.target.value);
                                }} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nameMm">Name (Myanmar) *</Label>
                                <Input id="nameMm" placeholder="e.g. ရန်ကုန်" value={nameMm} onChange={(e) => setNameMm(e.target.value)} required />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nameTh">Name (Thai)</Label>
                                <Input id="nameTh" placeholder="Optional" value={nameTh} onChange={(e) => setNameTh(e.target.value)} />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="active" checked={active} onCheckedChange={setActive} />
                            <Label htmlFor="active" className="cursor-pointer">Active</Label>
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
