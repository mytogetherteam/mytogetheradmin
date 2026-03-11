import { useState, useEffect, useCallback } from "react";
import { ShopCategoryService, ShopCategoryDTO } from "@/services/shopCategoryService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Loader2 } from "lucide-react";
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

export default function CreateShopSubCategory() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const id = searchParams.get("id");
    const categoryIdFromUrl = searchParams.get("categoryId");
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [fetchingCategories, setFetchingCategories] = useState(false);

    // Data State
    const [categories, setCategories] = useState<ShopCategoryDTO[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categoryIdFromUrl || "");

    // Form State
    const [name, setName] = useState("");
    const [nameMm, setNameMm] = useState("");
    const [nameTh, setNameTh] = useState("");
    const [nameEn, setNameEn] = useState("");
    const [slug, setSlug] = useState("");
    const [isActive, setIsActive] = useState(true);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const generateSlug = (value: string) => {
        return value
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "_")
            .replace(/[^a-z0-9_]/g, "");
    };

    const updateSlugFromNames = (nextName: string, nextNameEn: string) => {
        if (isEditMode) return;
        const source = nextNameEn || nextName;
        setSlug(source ? generateSlug(source) : "");
    };

    const loadSubCategory = useCallback(async (subId: number) => {
        setLoading(true);
        try {
            const subCat = await ShopCategoryService.getShopSubCategoryById(subId);
            const nextName = subCat.name || "";
            const nextNameEn = subCat.nameEn || "";
            setName(nextName);
            setNameMm(subCat.nameMm || "");
            setNameTh(subCat.nameTh || "");
            setNameEn(nextNameEn);
            setSlug(subCat.slug || (nextNameEn || nextName ? generateSlug(nextNameEn || nextName) : ""));
            setIsActive(subCat.isActive !== false);
            if ('active' in subCat && (subCat as Record<string, unknown>).active !== undefined) {
                setIsActive(Boolean((subCat as Record<string, unknown>).active));
            }
            setSelectedCategoryId(subCat.categoryId?.toString() || "");
        } catch (error) {
            console.error(error);
            toast.error("Failed to load sub-category");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        if (isEditMode && id) {
            loadSubCategory(parseInt(id));
        }
    }, [id, isEditMode, loadSubCategory]);

    const loadCategories = async () => {
        setFetchingCategories(true);
        try {
            const res = await ShopCategoryService.getShopCategories({ page: 0, size: 100 });
            if (res && res.content) {
                setCategories(res.content);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load shop categories");
        } finally {
            setFetchingCategories(false);
        }
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCategoryId && !isEditMode) {
            toast.error("Please select a parent category");
            return;
        }

        setSubmitting(true);
        try {
            const dataObj = {
                name,
                nameMm,
                nameTh,
                nameEn,
                slug: slug || generateSlug(nameEn || name),
                active: isActive,
            };

            if (isEditMode && id) {
                await ShopCategoryService.updateShopSubCategory(parseInt(id), dataObj);
                toast.success("Sub-Category updated successfully");
            } else {
                await ShopCategoryService.createShopSubCategory(parseInt(selectedCategoryId), dataObj);
                toast.success("Sub-Category created successfully");
            }
            navigate("/shop-sub-categories/manage");
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
            await ShopCategoryService.deleteShopSubCategory(parseInt(id));
            toast.success("Sub-Category deleted successfully");
            navigate("/shop-sub-categories/manage");
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
                    {isEditMode ? "Edit Shop Sub-Category" : "Create Shop Sub-Category"}
                </h2>
                <p className="text-muted-foreground">
                    {isEditMode ? "Update sub-category details." : "Add a new sub-category to a shop category."}
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Sub-Category Details</CardTitle>
                    <CardDescription>Fill in the details for the shop sub-category.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-6" onSubmit={onSubmit}>

                        <div className="space-y-2">
                            <Label>Parent Shop Category {!isEditMode && <span className="text-red-500">*</span>}</Label>
                            <Select
                                value={selectedCategoryId}
                                onValueChange={setSelectedCategoryId}
                                disabled={isEditMode}
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
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setName(value);
                                        updateSlugFromNames(value, nameEn);
                                    }}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    value={slug}
                                    disabled={!isEditMode}
                                    placeholder="e.g. fast_food"
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
                                <Input
                                    id="nameEn"
                                    value={nameEn}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setNameEn(value);
                                        updateSlugFromNames(name, value);
                                    }}
                                />
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
                                    onClick={() => navigate("/shop-sub-categories/manage")}
                                    disabled={submitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!name || submitting || (!selectedCategoryId && !isEditMode)}
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
