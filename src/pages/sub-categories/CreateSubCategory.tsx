import { useState, useEffect } from "react";
import { menuService } from "@/services/menuService";
import { ShopService, MenuCategory } from "@/services/shopService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Trash2, Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { InfiniteSearchableSelect } from "@/components/ui/infinite-searchable-select";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function CreateSubCategory() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const id = searchParams.get("id");
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [selectedCategoryData, setSelectedCategoryData] = useState<{ label: string; value: string } | null>(null);

    // Form State
    const [name, setName] = useState("");
    const [nameMm, setNameMm] = useState("");
    const [nameTh, setNameTh] = useState("");
    const [nameEn, setNameEn] = useState("");
    const [displayOrder, setDisplayOrder] = useState<number | "">(1);
    const [isActive, setIsActive] = useState(true);

    // Gallery state
    const [existingImage, setExistingImage] = useState<string | null>(null);
    const [galleryPreview, setGalleryPreview] = useState<string | null>(null);
    const [galleryFile, setGalleryFile] = useState<File | null>(null);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        // Categories now handled by InfiniteSearchableSelect
    }, []);

    useEffect(() => {
        if (isEditMode && id) {
            loadSubCategory(parseInt(id));
        }
    }, [id, isEditMode]);


    const loadSubCategory = async (subId: number) => {
        setLoading(true);
        try {
            const subCat = await menuService.getMenuSubCategory(subId);
            setName(subCat.nameEn || subCat.name || "");
            setNameMm(subCat.nameMm || "");
            setNameTh(subCat.nameTh || "");
            setNameEn(subCat.nameEn || "");
            setDisplayOrder(subCat.displayOrder || 1);
            setIsActive(subCat.isActive !== false);

            // Note: The API might return the categoryId in the response, 
            // but if not, we might need a workaround or user re-selection.
            // Assuming api returns standard object, checking if we can get category ID.
            // If the API doesn't return parent category ID, the user might need to re-select 
            // or we accept it as is. For now, we leave it blank if not provided.
            // Ideally the backend response includes `categoryId`.
            // If not, we might need to fetch it differently.

            if (subCat.imageUrl || subCat.icon) {
                setExistingImage(subCat.imageUrl || subCat.icon || null);
            }
            
            const menuCategoryId = subCat.menuCategoryId;
            if (menuCategoryId) {
                let label = subCat.categoryName || `Category ${menuCategoryId}`;
                
                // If we don't have a proper name, try to fetch it
                if (!subCat.categoryName) {
                    try {
                        const cat = await ShopService.getCategoryById(menuCategoryId);
                        if (cat) {
                            label = cat.nameEn || cat.name || label;
                        }
                    } catch (e) {
                        console.error("Failed to fetch parent category details", e);
                    }
                }
                
                setSelectedCategoryData({ label, value: String(menuCategoryId) });
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load sub-category");
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        setGalleryFile(file);

        const reader = new FileReader();
        reader.onloadend = () => {
            setGalleryPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const removeImage = () => {
        setGalleryFile(null);
        setGalleryPreview(null);
        setExistingImage(null);
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCategoryData && !isEditMode) {
            toast.error("Please select a parent category");
            return;
        }

        setSubmitting(true);
        try {
            const effectiveName = nameEn || name || "";
            const dtoData: Record<string, unknown> = {
                name: effectiveName,
                nameEn: effectiveName,
                nameMm: nameMm || "",
                nameTh: nameTh || "",
                displayOrder: displayOrder === "" || displayOrder < 1 ? 1 : displayOrder,
                isActive: isActive
            };

            if (!isEditMode && selectedCategoryData?.value) {
                dtoData.menuCategoryId = parseInt(selectedCategoryData.value);
            }

            const formData = new FormData();
            formData.append("data", new Blob([JSON.stringify(dtoData)], { type: 'application/json' }));

            if (galleryFile) {
                formData.append("photo", galleryFile);
            }

            if (isEditMode && id) {
                await menuService.updateMenuSubCategory(parseInt(id), formData);
                toast.success("Sub-Category updated successfully");
            } else {
                await menuService.createMenuSubCategory(formData);
                toast.success("Sub-Category created successfully");
            }
            navigate("/menus/sub-categories/manage");
        } catch (error) {
            console.error(error);
            toast.error(isEditMode ? "Failed to update sub-category" : "Failed to create sub-category");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        setDeleting(true);
        try {
            await menuService.deleteMenuSubCategory(parseInt(id));
            toast.success("Sub-Category deleted successfully");
            navigate("/menus/sub-categories/manage");
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete sub-category");
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
                    {isEditMode ? "Edit Sub-Category" : "Create Sub-Category"}
                </h2>
                <p className="text-muted-foreground">
                    {isEditMode ? "Update sub-category details." : "Add a new sub-category to a menu category."}
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Sub-Category Details</CardTitle>
                    <CardDescription>Fill in the details for the sub-category.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-6" onSubmit={onSubmit}>

                        {/* Category Selection (Only show if creating or if we want to allow moving) */}
                        {/* For now keeping it simple: Required on create. */}
                        <div className="space-y-2">
                            <Label>Parent Category</Label>
                            <InfiniteSearchableSelect
                                placeholder="Select a Category"
                                selectedValue={selectedCategoryData}
                                onChange={(val: { label: string; value: string } | null) => setSelectedCategoryData(val)}
                                disabled={isEditMode}
                                fetchData={async (page, size, search) => {
                                    const res = await ShopService.getAdminCategories(page, size, search);
                                    return {
                                        content: (res?.content || []).map((cat: MenuCategory) => ({
                                            label: cat.nameEn || cat.name || `Category ${cat.id}`,
                                            value: cat.id.toString(),
                                        })),
                                        last: !!res?.last,
                                    };
                                }}
                                valueKey="value"
                                labelKey="label"
                            />
                            {isEditMode && <p className="text-xs text-muted-foreground">Category cannot be changed during edit.</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name (Default)</Label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
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
                                        const val = e.target.value;
                                        if (val === "" || /^\d+$/.test(val)) {
                                            setDisplayOrder(val === "" ? "" : parseInt(val, 10));
                                        }
                                    }}
                                    onBlur={() => {
                                        if (displayOrder === "" || displayOrder < 1) {
                                            setDisplayOrder(1);
                                        }
                                    }}
                                    placeholder="1"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nameMm">Name (Myanmar)</Label>
                                <Input id="nameMm" value={nameMm} onChange={(e) => setNameMm(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nameTh">Name (Thai)</Label>
                                <Input id="nameTh" value={nameTh} onChange={(e) => setNameTh(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nameEn">Name (English)</Label>
                                <Input id="nameEn" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="isActive"
                                checked={isActive}
                                onCheckedChange={(checked) => setIsActive(checked === true)}
                            />
                            <Label htmlFor="isActive" className="cursor-pointer">Active Status</Label>
                        </div>

                        <div className="space-y-2">
                            <Label>Sub-Category Image</Label>
                            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg hover:bg-muted/50 cursor-pointer relative transition-colors h-40">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={handleImageChange}
                                />
                                {!galleryPreview && !existingImage ? (
                                    <div className="text-center space-y-2 pointer-events-none">
                                        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                                        <div className="text-sm font-medium">Click to upload image</div>
                                    </div>
                                ) : (
                                    <div className="relative h-full aspect-square group">
                                        <img
                                            src={galleryPreview || existingImage || ""}
                                            alt="Preview"
                                            className="h-full w-full object-contain rounded"
                                        />
                                        <div className="absolute top-1 right-1">
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="destructive"
                                                className="h-6 w-6 rounded-full"
                                                onClick={(e) => {
                                                    e.stopPropagation(); // prevent triggering file input
                                                    e.preventDefault();
                                                    removeImage();
                                                }}
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
                                    onClick={() => navigate("/menus/sub-categories/manage")}
                                    disabled={submitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!name || submitting || (!selectedCategoryData && !isEditMode)}
                                    className={!name || submitting || (!selectedCategoryData && !isEditMode) ? "bg-gray-400 cursor-not-allowed" : ""}
                                >
                                    {submitting ? "Saving..." : isEditMode ? "Update Sub-Category" : "Create Sub-Category"}
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
                            This action cannot be undone. This will permanently delete the sub-category
                            <strong> {name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
