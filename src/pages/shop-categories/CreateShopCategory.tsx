import { useState, useEffect } from "react";
import { ShopCategoryService } from "@/services/shopCategoryService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Trash2, Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

export default function CreateShopCategory() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const id = searchParams.get("id");
    const isEditMode = !!id;

    const [nameMm, setNameMm] = useState("");
    const [nameTh, setNameTh] = useState("");
    const [nameEn, setNameEn] = useState("");
    const [slug, setSlug] = useState("");
    const [isActive, setIsActive] = useState<boolean>(true);

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Main Image state
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [existingImage, setExistingImage] = useState<string | null>(null);

    const generateSlug = (value: string) => {
        return value.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    };

    const handleNameEnChange = (value: string) => {
        setNameEn(value);
        if (!isEditMode) {
            setSlug(generateSlug(value));
        }
    };

    const loadCategory = async (catId: number) => {
        setLoading(true);
        try {
            const cat = await ShopCategoryService.getShopCategoryById(catId);
            setNameMm(cat.nameMm || "");
            setNameTh(cat.nameTh || "");
            setNameEn(cat.nameEn || "");
            setSlug(cat.slug || "");
            setIsActive(cat.isActive !== false);
            if (cat.imageUrl) {
                setExistingImage(cat.imageUrl);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load shop category");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isEditMode && id) {
            loadCategory(parseInt(id));
        } else {
            setNameMm("");
            setNameTh("");
            setNameEn("");
            setSlug("");
            setIsActive(true);
            setExistingImage(null);
            setImageFile(null);
            setImagePreview(null);
        }
    }, [id, isEditMode]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setExistingImage(null);
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setSubmitting(true);
        try {
        const dtoData = {
            nameMm: nameMm || "",
            nameTh: nameTh || "",
            nameEn: nameEn || "",
            slug: slug || "",
            active: isActive,
        };

        const formData = new FormData();
        formData.append("data", new Blob([JSON.stringify(dtoData)], { type: 'application/json' }));

        if (imageFile) {
            formData.append("image", imageFile);
        }

            if (isEditMode && id) {
                await ShopCategoryService.updateShopCategory(parseInt(id), formData);
                toast.success("Shop category updated successfully");
            } else {
                await ShopCategoryService.createShopCategory(formData);
                toast.success("Shop category created successfully");
            }
            navigate("/shop-categories/manage");
        } catch (error) {
            console.error(error);
            toast.error(isEditMode ? "Failed to update shop category" : "Failed to create shop category");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        setDeleting(true);
        try {
            await ShopCategoryService.deleteShopCategory(parseInt(id));
            toast.success("Shop category deleted successfully");
            navigate("/shop-categories/manage");
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete shop category");
        } finally {
            setDeleting(false);
            setDeleteDialogOpen(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 max-w-4xl">
            <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight">
                    {isEditMode ? "Edit Shop Category" : "Create Shop Category"}
                </h2>
                <p className="text-muted-foreground">
                    {isEditMode ? "Update global shop category details." : "Add a new global shop category."}
                </p>
            </div>

            <Card className="border-solid">
                <CardHeader>
                    <CardTitle>Shop Category Details</CardTitle>
                    <CardDescription>Enter the category information and upload representative media.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-6" onSubmit={onSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="categoryNameEn">Name (English) <span className="text-red-500">*</span></Label>
                                <Input
                                    id="categoryNameEn"
                                    value={nameEn}
                                    onChange={(e) => handleNameEnChange(e.target.value)}
                                    placeholder="e.g. Restaurant"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="categoryNameMm">Name (Myanmar)</Label>
                                <Input
                                    id="categoryNameMm"
                                    value={nameMm}
                                    onChange={(e) => setNameMm(e.target.value)}
                                    placeholder="e.g. စားသောက်ဆိုင်"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    value={slug}
                                    onChange={(e) => setSlug(generateSlug(e.target.value))}
                                    placeholder="e.g. restaurant"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="categoryNameTh">Name (Thai)</Label>
                                <Input
                                    id="categoryNameTh"
                                    value={nameTh}
                                    onChange={(e) => setNameTh(e.target.value)}
                                    placeholder="e.g. ร้านอาหาร"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Switch
                                id="isActive"
                                checked={isActive}
                                onCheckedChange={setIsActive}
                            />
                            <Label htmlFor="isActive">Active Status</Label>
                        </div>

                        <div className="space-y-2 pt-4 border-t">
                            <Label>Category Icon/Image</Label>
                            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg hover:bg-muted/50 cursor-pointer relative transition-colors h-48">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={handleImageChange}
                                />
                                {!imagePreview && !existingImage ? (
                                    <div className="text-center space-y-2 pointer-events-none">
                                        <div className="flex justify-center">
                                            <Upload className="h-10 w-10 text-muted-foreground" />
                                        </div>
                                        <div className="text-sm font-medium">Upload Category Image</div>
                                        <div className="text-xs text-muted-foreground">PNG, JPG or WebP</div>
                                    </div>
                                ) : (
                                    <div className="relative h-full aspect-square group">
                                        <img src={imagePreview || existingImage!} className="h-full w-full object-contain rounded" alt="Main" />
                                        <div className="absolute top-1 right-1 z-20">
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="h-6 w-6 rounded-full shadow-sm"
                                                onClick={removeImage}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t">
                            {isEditMode && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => setDeleteDialogOpen(true)}
                                    disabled={submitting || deleting}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </Button>
                            )}
                            <div className="flex gap-3 ml-auto">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate("/shop-categories/manage")}
                                    disabled={submitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!nameEn || submitting}
                                >
                                    {submitting ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                                    ) : isEditMode ? "Update Category" : "Create Category"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the shop category
                            <strong> {nameEn || nameMm || "this category"}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting ? "Deleting..." : "Delete Shop Category"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
