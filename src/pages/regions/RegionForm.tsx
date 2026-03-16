import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { regionService } from "@/services/regionService";
import { RegionDTO } from "@/services/shopService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    ArrowLeft,
    Upload,
    Save,
    MapPin,
    X,
    Loader2
} from "lucide-react";
import { toast } from "sonner";

export default function RegionForm() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEditMode);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);

    type FormDataType = Omit<RegionDTO, 'id' | 'displayOrder'> & { displayOrder: number | "" };

    const [formData, setFormData] = useState<FormDataType>({
        nameEn: "",
        nameMm: "",
        nameTh: "",
        slug: "",
        isActive: true,
        displayOrder: 1,
    });

    const generateSlug = (value: string) => {
        return value
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "_")
            .replace(/[^a-z0-9_]/g, "");
    };

    useEffect(() => {
        if (isEditMode) {
            const fetchRegion = async () => {
                try {
                    const data = await regionService.getRegionById(Number(id));
                    setFormData({
                        nameEn: data.nameEn ?? "",
                        nameMm: data.nameMm ?? "",
                        nameTh: data.nameTh ?? "",
                        slug: data.slug ?? "",
                        isActive: data.isActive ?? true,
                        displayOrder: data.displayOrder || 1,
                    });
                    if (data.imageUrl) setImagePreview(data.imageUrl);
                } catch (error) {
                    console.error(error);
                    toast.error("Failed to load region details");
                    navigate("/regions/manage");
                } finally {
                    setFetching(false);
                }
            };
            fetchRegion();
        }
    }, [id, isEditMode, navigate]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const dtoData = {
                id: isEditMode ? Number(id) : 0,
                nameEn: formData.nameEn || "",
                nameMm: formData.nameMm || "",
                nameTh: formData.nameTh || "",
                slug: formData.slug || "",
                isActive: formData.isActive,
                displayOrder: typeof formData.displayOrder === "number" ? formData.displayOrder : 1,
            };

            const payload = new FormData();
            // Use 'data' as the key for JSON part, matching Swagger/Cuisine pattern
            payload.append("data", new Blob([JSON.stringify(dtoData)], { type: 'application/json' }));

            // If a new image was uploaded
            if (imageFile) {
                payload.append("image", imageFile);
            }

            if (isEditMode) {
                await regionService.updateRegion(Number(id), payload);
                toast.success("Region updated successfully");
            } else {
                await regionService.createRegion(payload);
                toast.success("Region created successfully");
            }
            navigate("/regions/manage");
        } catch (error) {
            console.error(error);
            toast.error(isEditMode ? "Failed to update region" : "Failed to create region");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="container mx-auto py-20 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 max-w-2xl space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {isEditMode ? "Edit Region" : "Create New Region"}
                    </h1>
                    <p className="text-muted-foreground">
                        {isEditMode ? "Modify existing geographical region details." : "Add a new region to the system."}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card className="border-t-4 border-t-primary">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            General Information
                        </CardTitle>
                        <CardDescription>Enter the region names in different languages and set its status.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Image Upload */}
                        <div className="space-y-4">
                            <Label>Region Photo</Label>
                            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 hover:bg-muted/50 transition-colors relative transition-all duration-200">
                                {imagePreview ? (
                                    <div className="relative group">
                                        <img src={imagePreview} alt="Preview" className="h-32 w-32 object-cover rounded-lg border-2 border-primary/20" />
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center gap-2 cursor-pointer w-full h-full py-4">
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <Upload className="h-6 w-6" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-medium">Click to upload photo</p>
                                            <p className="text-xs text-muted-foreground mt-1">PNG, JPG or WebP (Max 2MB)</p>
                                        </div>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nameEn">Name (English)</Label>
                                <Input
                                    id="nameEn"
                                    placeholder="e.g. Yangon"
                                    value={formData.nameEn}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setFormData((prev) => ({
                                            ...prev,
                                            nameEn: value,
                                            slug: !isEditMode ? generateSlug(value) : prev.slug,
                                        }));
                                    }}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nameMm">Name (Myanmar)</Label>
                                <Input
                                    id="nameMm"
                                    placeholder="ရန်ကုန်"
                                    value={formData.nameMm}
                                    onChange={(e) => setFormData({ ...formData, nameMm: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nameTh">Name (Thai)</Label>
                                <Input
                                    id="nameTh"
                                    placeholder="ย่างกุ้ง"
                                    value={formData.nameTh}
                                    onChange={(e) => setFormData({ ...formData, nameTh: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    placeholder="e.g. yangon"
                                    value={formData.slug}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setFormData((prev) => ({
                                            ...prev,
                                            slug: generateSlug(value),
                                        }));
                                    }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="displayOrder">Display Order</Label>
                                <Input
                                    id="displayOrder"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={formData.displayOrder}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === "" || /^\d+$/.test(val)) {
                                            const numeric = val === "" ? "" : parseInt(val, 10);
                                            setFormData((prev) => ({
                                                ...prev,
                                                displayOrder: numeric,
                                            }));
                                        }
                                    }}
                                    onBlur={() => {
                                        if (formData.displayOrder === "" || (typeof formData.displayOrder === "number" && formData.displayOrder < 1)) {
                                            setFormData({ ...formData, displayOrder: 1 });
                                        }
                                    }}
                                    placeholder="1"
                                />
                            </div>
                            <div className="flex items-center space-x-2 pt-8">
                                <Switch
                                    id="isActive"
                                    checked={formData.isActive}
                                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                                />
                                <Label htmlFor="isActive">Active Status</Label>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate("/regions/manage")}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" className="gap-2" disabled={loading}>
                                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                <Save className="h-4 w-4" />
                                {isEditMode ? "Update Region" : "Create Region"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
