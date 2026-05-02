import { useState, useEffect } from "react";
import { MasterMenuCategoryService } from "@/services/masterMenuCategoryService";
import { cuisineService } from "@/services/cuisineService";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import  from "@/lib/utils";
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
import { SearchableSelect } from "@/components/ui/searchable-select";

export default function CreateMasterMenuCategory() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const id = searchParams.get("id");
    const isEditMode = !!id;

    const [nameMm, setNameMm] = useState("");
    const [nameTh, setNameTh] = useState("");
    const [nameEn, setNameEn] = useState("");
    const [displayOrder, setDisplayOrder] = useState<number | "">(1);
    const [isActive, setIsActive] = useState<boolean>(true);
    const [cuisineTypeId, setCuisineTypeId] = useState<number | "">(0);
    const [cuisines, setCuisines] = useState<{ id: number; nameEn: string }[]>([]);

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Main Image state
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [existingImage, setExistingImage] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const cusRes = await cuisineService.getCuisines(0, 500);
            setCuisines(cusRes.content?.map(c => ({ id: c.id, nameEn: c.nameEn || c.nameMm || `Cuisine ${c.id}` })) || []);

            // If edit mode, load Master Menu Category
            if (isEditMode && id) {
                const cat = await MasterMenuCategoryService.getMasterMenuCategoryById(parseInt(id));
                setNameMm(cat.nameMm || "");
                setNameTh(cat.nameTh || "");
                setNameEn(cat.nameEn || "");
                setDisplayOrder(cat.displayOrder || 1);
                setIsActive(cat.isActive !== false);
                if (cat.cuisineTypeId) {
                    setCuisineTypeId(cat.cuisineTypeId);
                }
                if (cat.imageUrl) {
                    setExistingImage(cat.imageUrl);
                }
            }
        } catch (error) {
            handleApiError(error, "Failed to load category details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        if (!isEditMode) {
            setNameMm("");
            setNameTh("");
            setNameEn("");
            setDisplayOrder(1);
            setIsActive(true);
            setCuisineTypeId(0);
            setExistingImage(null);
            setImageFile(null);
            setImagePreview(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                displayOrder: displayOrder === "" || displayOrder < 1 ? 1 : displayOrder,
                isActive: isActive,
                cuisineTypeId: cuisineTypeId || 0,
            };

            const formData = new FormData();
            formData.append("data", new Blob([JSON.stringify(dtoData)], { type: 'application/json' }));

            if (imageFile) {
                formData.append("image", imageFile);
            }

            if (isEditMode && id) {
                await MasterMenuCategoryService.updateMasterMenuCategory(parseInt(id), formData);
                toast.success("Master menu category updated successfully");
            } else {
                await MasterMenuCategoryService.createMasterMenuCategory(formData);
                toast.success("Master menu category created successfully");
            }
            navigate("/master-menu-categories/manage");
        } catch (error) {
            handleApiError(error, isEditMode ? "Failed to update category" : "Failed to create category");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        setDeleting(true);
        try {
            await MasterMenuCategoryService.deleteMasterMenuCategory(parseInt(id));
            toast.success("Master menu category deleted successfully");
            navigate("/master-menu-categories/manage");
        } catch (error) {
            handleApiError(error, "Failed to delete category");
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
                    {isEditMode ? "Edit Master Menu Category" : "Create Master Menu Category"}
                </h2>
                <p className="text-muted-foreground">
                    {isEditMode ? "Update global category details." : "Add a new global category linking items."}
                </p>
            </div>

            <Card className="border-solid">
                <CardHeader>
                    <CardTitle>Master Menu Category Details</CardTitle>
                    <CardDescription>Enter category name and an optional image.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-6" onSubmit={onSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nameEn">Name (English) <span className="text-destructive">*</span></Label>
                                <Input
                                    id="nameEn"
                                    value={nameEn}
                                    onChange={(e) => setNameEn(e.target.value)}
                                    placeholder="e.g. Curries"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nameMm">Name (Myanmar)</Label>
                                <Input
                                    id="nameMm"
                                    value={nameMm}
                                    onChange={(e) => setNameMm(e.target.value)}
                                    placeholder="e.g. ဟင်းများ"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nameTh">Name (Thai)</Label>
                                <Input
                                    id="nameTh"
                                    value={nameTh}
                                    onChange={(e) => setNameTh(e.target.value)}
                                    placeholder="e.g. แกง"
                                />
                            </div>
                            <div className="space-y-2 flex flex-col">
                                <Label htmlFor="cuisineTypeId" className="mb-0 block">Cuisine Type</Label>
                                <SearchableSelect
                                    data={cuisines}
                                    value="id"
                                    labelKey="nameEn"
                                    selectedValue={cuisines.find(c => c.id === cuisineTypeId)}
                                    onChange={(item: { id: number; nameEn: string } | null) => setCuisineTypeId(item ? item.id : (0 as number | ""))}
                                    placeholder="Select cuisine type..."
                                    className="font-normal text-left px-3"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="displayOrder">Display Order</Label>
                                <Input
                                    id="displayOrder"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={displayOrder}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/^0+(?!$)/, "");
                                        if (val === "" || /^\d+$/.test(val)) {
                                            setDisplayOrder(val === "" ? "" : parseInt(val, 10));
                                        }
                                    }}
                                    onBlur={() => {
                                        if (displayOrder === "" || displayOrder < 1) setDisplayOrder(1);
                                    }}
                                    placeholder="1"
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
                            <Label>Category Image</Label>
                            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg hover:bg-muted/50 cursor-pointer relative transition-colors h-64 md:w-2/3 mx-auto">
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
                                        <div className="text-xs text-muted-foreground">PNG, JPG or WEBP</div>
                                    </div>
                                ) : (
                                    <div className="relative h-full aspect-video group bg-muted rounded overflow-hidden">
                                        <img src={existingImage || imagePreview || ""} className="h-full w-full object-cover" alt="Category Preview" />
                                        <div className="absolute top-2 right-2 z-20">
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="h-8 w-8 rounded-full shadow-sm"
                                                onClick={removeImage}
                                            >
                                                <X className="h-4 w-4" />
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
                                    onClick={() => navigate("/master-menu-categories/manage")}
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
                            This action cannot be undone. This will permanently delete the category
                            <strong> {nameEn || nameMm || "this category"}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting ? "Deleting..." : "Delete Master Menu Category"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
