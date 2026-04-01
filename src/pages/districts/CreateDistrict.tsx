import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { districtService, CreateDistrictRequest } from "@/services/districtService";
import { cityService, CityDTO } from "@/services/cityService";
import { toast } from "sonner";

export type CreateDistrictFormData = CreateDistrictRequest;

export default function CreateDistrict() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [cities, setCities] = useState<CityDTO[]>([]);
    const [cityId, setCityId] = useState<number | undefined>(undefined);
    const [nameEn, setNameEn] = useState("");
    const [nameMm, setNameMm] = useState("");
    const [nameTh, setNameTh] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [active, setActive] = useState(true);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        cityService.getCities(0, 500).then((res) => setCities(res.content || [])).catch(() => { });
    }, []);

    useEffect(() => {
        if (isEdit) {
            setLoading(true);
            districtService.getDistrictById(parseInt(id!))
                .then((d) => {
                    setCityId(d.cityId);
                    setNameEn(d.nameEn);
                    setNameMm(d.nameMm);
                    setNameTh(d.nameTh || "");
                    setLatitude(d.latitude ? String(d.latitude) : "");
                    setLongitude(d.longitude ? String(d.longitude) : "");
                    setActive(d.active);
                })
                .catch(() => toast.error("Failed to load district"))
                .finally(() => setLoading(false));
        }
    }, [id, isEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cityId) return toast.error("Please select a city");
        if (!nameEn.trim() || !nameMm.trim()) return toast.error("Name (EN) and Name (MM) are required");

        setSubmitting(true);
        try {
            const data: CreateDistrictFormData = {
                cityId,
                nameEn: nameEn.trim(),
                nameMm: nameMm.trim(),
                nameTh: nameTh.trim() || undefined,
                latitude: latitude ? parseFloat(latitude) : undefined,
                longitude: longitude ? parseFloat(longitude) : undefined,
                active,
            };
            if (isEdit) {
                await districtService.updateDistrict(parseInt(id!), data);
                toast.success("District updated successfully");
            } else {
                await districtService.createDistrict(data);
                toast.success("District created successfully");
            }
            navigate("/districts/manage");
        } catch (e) {
            console.error(e);
            toast.error(isEdit ? "Failed to update district" : "Failed to create district");
        } finally { setSubmitting(false); }
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
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="city">City *</Label>
                            <Select value={cityId ? String(cityId) : ""} onValueChange={(v) => setCityId(Number(v))}>
                                <SelectTrigger><SelectValue placeholder="Select a city" /></SelectTrigger>
                                <SelectContent>
                                    {cities.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.nameEn}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nameEn">Name (English) *</Label>
                                <Input 
                                    id="nameEn" 
                                    placeholder="e.g. Kamayut" 
                                    value={nameEn} 
                                    onChange={(e) => {
                                        setNameEn(e.target.value);
                                    }} 
                                    required 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nameMm">Name (Myanmar) *</Label>
                                <Input id="nameMm" placeholder="e.g. ကမာရွတ်" value={nameMm} onChange={(e) => setNameMm(e.target.value)} required />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nameTh">Name (Thai)</Label>
                                <Input id="nameTh" placeholder="Optional" value={nameTh} onChange={(e) => setNameTh(e.target.value)} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="latitude">Latitude</Label>
                                <Input id="latitude" type="number" step="any" placeholder="e.g. 16.8409" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="longitude">Longitude</Label>
                                <Input id="longitude" type="number" step="any" placeholder="e.g. 96.1735" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="active" checked={active} onCheckedChange={setActive} />
                            <Label htmlFor="active" className="cursor-pointer">Active</Label>
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
