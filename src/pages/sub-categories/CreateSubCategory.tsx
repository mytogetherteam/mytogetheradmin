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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
    const [fetchingCategories, setFetchingCategories] = useState(false);

    // Data State
    const [categories, setCategories] = useState<MenuCategory[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

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
        loadCategories();
    }, []);

    useEffect(() => {
        if (isEditMode && id) {
            loadSubCategory(parseInt(id));
        }
    }, [id, isEditMode]);

    const loadCategories = async () => {
        setFetchingCategories(true);
        try {
            // Fetching all categories for selection
            // Using ShopService as it seems to handle category fetching based on previous analysis
            const res = await ShopService.getAdminCategories(0, 100, "");
            if (res && res.content) {
                setCategories(res.content);
            } else if (Array.isArray(res)) {
                setCategories(res);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load categories");
        } finally {
            setFetchingCategories(false);
        }
    };

    const loadSubCategory = async (subId: number) => {
        setLoading(true);
        try {
            const subCat = await menuService.getMenuSubCategory(subId);
            setName(subCat.name || "");
            setNameMm(subCat.nameMm || "");
            setNameTh(subCat.nameTh || "");
            setNameEn(subCat.nameEn || "");
            setDisplayOrder(subCat.displayOrder ?? 1);
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
        if (!selectedCategoryId && !isEditMode) {
            toast.error("Please select a parent category");
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            const dataObj = {
                name, nameMm, nameTh, nameEn, displayOrder, isActive
            };

            // The API expects 'data' as a JSON string or object, and 'image' as file
            // Based on typical implementation in this project with multipart/form-data:
            formData.append("data", new Blob([JSON.stringify(dataObj)], { type: "application/json" }));

            if (galleryFile) {
                formData.append("image", galleryFile);
            }

            // However, the menuService currently defined takes FormData directly.
            // Let's adjust the menuService call to match what we likely need.
            // Actually, looking at Swagger analysis: 
            // data (required object): CreateMenuSubCategoryRequest
            // photos (optional array of files)
            // So we need to construct FormData correctly.

            if (isEditMode && id) {
                await menuService.updateMenuSubCategory(parseInt(id), formData);
                toast.success("Sub-Category updated successfully");
            } else {
                await menuService.createMenuSubCategory(parseInt(selectedCategoryId), formData);
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
                            <Label>Parent Category {!isEditMode && <span className="text-red-500">*</span>}</Label>
                            <Select
                                value={selectedCategoryId}
                                onValueChange={setSelectedCategoryId}
                                disabled={isEditMode} // Disable on edit if moving isn't supported easily
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {fetchingCategories ? (
                                        <div className="flex justify-center p-2">
                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : (
                                        categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id.toString()}>
                                                {cat.name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            {isEditMode && <p className="text-xs text-muted-foreground">Category cannot be changed during edit.</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name (Default) <span className="text-red-500">*</span></Label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="displayOrder">Display Order</Label>
                                <Input
                                    id="displayOrder"
                                    type="text"
                                    value={displayOrder}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === "" || /^\d+$/.test(val)) setDisplayOrder(val === "" ? 1 : parseInt(val));
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
                                    disabled={!name || submitting || (!selectedCategoryId && !isEditMode)}
                                    className={!name || submitting || (!selectedCategoryId && !isEditMode) ? "bg-gray-400 cursor-not-allowed" : ""}
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
