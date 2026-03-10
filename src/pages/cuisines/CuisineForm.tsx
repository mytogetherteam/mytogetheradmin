import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { cuisineService, CuisineDTO } from "@/services/cuisineService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    ArrowLeft,
    Upload,
    Save,
    UtensilsCrossed,
    X,
    Loader2
} from "lucide-react";
import { toast } from "sonner";

export default function CuisineForm() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEditMode);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);

    const [formData, setFormData] = useState<Partial<CuisineDTO>>({
        nameEn: "",
        nameMm: "",
        nameTh: "",
        slug: "",
        isActive: true,
        displayOrder: 1,
    });

    useEffect(() => {
        if (isEditMode) {
            const fetchCuisine = async () => {
                try {
                    const data = await cuisineService.getCuisineById(Number(id));
                    setFormData(data);
                    if (data.imageUrl) setImagePreview(data.imageUrl);
                } catch (error) {
                    console.error(error);
                    toast.error("Failed to load cuisine details");
                    navigate("/cuisines/manage");
                } finally {
                    setFetching(false);
                }
            };
            fetchCuisine();
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
            const data = new FormData();
            data.append("nameEn", formData.nameEn || "");
            data.append("nameMm", formData.nameMm || "");
            data.append("nameTh", formData.nameTh || "");
            data.append("slug", formData.slug || "");
            data.append("isActive", String(formData.isActive));
            data.append("displayOrder", String(formData.displayOrder));

            if (imageFile) {
                data.append("image", imageFile);
            }

            if (isEditMode) {
                await cuisineService.updateCuisine(Number(id), data);
                toast.success("Cuisine updated successfully");
            } else {
                await cuisineService.createCuisine(data);
                toast.success("Cuisine created successfully");
            }
            navigate("/cuisines/manage");
        } catch (error) {
            console.error(error);
            toast.error(isEditMode ? "Failed to update cuisine" : "Failed to create cuisine");
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
                        {isEditMode ? "Edit Cuisine" : "Create New Cuisine"}
                    </h1>
                    <p className="text-muted-foreground">
                        {isEditMode ? "Modify existing cuisine type details." : "Add a new cuisine category to the system."}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card className="border-t-4 border-t-primary">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UtensilsCrossed className="h-5 w-5" />
                            General Information
                        </CardTitle>
                        <CardDescription>Enter the cuisine names in different languages and set its status.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Image Upload */}
                        <div className="space-y-4">
                            <Label>Cuisine Photo</Label>
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
                                    placeholder="e.g. Italian"
                                    value={formData.nameEn}
                                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nameMm">Name (Myanmar)</Label>
                                <Input
                                    id="nameMm"
                                    placeholder="အီတလီ"
                                    value={formData.nameMm}
                                    onChange={(e) => setFormData({ ...formData, nameMm: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nameTh">Name (Thai)</Label>
                                <Input
                                    id="nameTh"
                                    placeholder="อาหารอิตาเลี่ยน"
                                    value={formData.nameTh}
                                    onChange={(e) => setFormData({ ...formData, nameTh: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    placeholder="e.g. italian"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="displayOrder">Display Order</Label>
                                <Input
                                    id="displayOrder"
                                    type="text"
                                    value={formData.displayOrder}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === "" || /^\d+$/.test(val)) setFormData({ ...formData, displayOrder: val === "" ? 1 : parseInt(val) });
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
                                onClick={() => navigate("/cuisines/manage")}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" className="gap-2" disabled={loading}>
                                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                <Save className="h-4 w-4" />
                                {isEditMode ? "Update Cuisine" : "Create Cuisine"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
