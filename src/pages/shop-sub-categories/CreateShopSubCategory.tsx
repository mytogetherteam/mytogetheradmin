import { useState, useEffect, useCallback } from "react";
import {
  ShopCategoryService,
  ShopCategoryDTO,
} from "@/services/shopCategoryService";
import { handleApiError } from "@/lib/error-utils";
import { compressImage } from "@/utils/imageCompression";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { toast } from "sonner";
import {
  useCreateShopSubCategoryMutation,
  useUpdateShopSubCategoryMutation,
  useDeleteShopSubCategoryMutation,
  useShopSubCategory,
} from "@/hooks/shop-sub-categories/useShopSubCategory";

export default function CreateShopSubCategory() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const categoryIdFromUrl = searchParams.get("categoryId");
  const isEditMode = !!id;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: subCategoryData, isPending: loadingSubCategory } =
    useShopSubCategory(isEditMode && id ? parseInt(id) : 0);
  const loading = isEditMode ? loadingSubCategory : false;

  // Mutation hooks
  const { mutateAsync: createSubCategory, isPending: isCreating } =
    useCreateShopSubCategoryMutation();
  const { mutateAsync: updateSubCategory, isPending: isUpdating } =
    useUpdateShopSubCategoryMutation();
  const { mutateAsync: deleteSubCategory, isPending: isDeleting } =
    useDeleteShopSubCategoryMutation();

  const submitting = isCreating || isUpdating;

  // Data State
  type DropdownCategory = ShopCategoryDTO & {
    dropdownLabel: string;
    [key: string]: unknown;
  };
  const [categories, setCategories] = useState<DropdownCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    categoryIdFromUrl || "",
  );

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);

  // Form State
  const [nameMm, setNameMm] = useState("");
  const [nameTh, setNameTh] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState<number | "">(1);

  const loadCategories = useCallback(async () => {
    try {
      const res = await ShopCategoryService.getShopCategories({
        page: 0,
        size: 100,
      });
      if (res?.content) {
        setCategories(
          res.content.map((cat) => ({
            ...cat,
            dropdownLabel: cat.nameEn || cat.name || `Category ${cat.id}`,
          })),
        );
      }
    } catch (error) {
      handleApiError(error, "Failed to load shop categories");
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (isEditMode && subCategoryData) {
      setNameMm(subCategoryData.nameMm || "");
      setNameTh(subCategoryData.nameTh || "");
      setNameEn(subCategoryData.nameEn || subCategoryData.name || "");
      setIsActive(subCategoryData.active !== false);
      setDisplayOrder(subCategoryData.displayOrder || 1);
      setSelectedCategoryId(subCategoryData.categoryId?.toString() || "");
      if (subCategoryData.imageUrl) setExistingImage(subCategoryData.imageUrl);
    }
  }, [isEditMode, subCategoryData]);

  const fetchSearchCategories = async (
    page: number,
    size: number,
    search: string,
  ) => {
    const res = await ShopCategoryService.getShopCategories({
      page,
      size,
      search,
    });
    return {
      ...res,
      content: (res.content || []).map((cat) => ({
        ...cat,
        dropdownLabel: cat.nameEn || cat.name || `Category ${cat.id}`,
      })) as DropdownCategory[],
      last: res.totalPages ? page >= res.totalPages - 1 : true,
    };
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file);
      setImageFile(compressed);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(compressed);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setExistingImage(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const catId = parseInt(selectedCategoryId);
    if (!catId && !isEditMode) {
      toast.error("Please select a parent category");
      return;
    }

    const formData = new FormData();
    formData.append("nameEn", nameEn || "");
    formData.append("nameMm", nameMm || "");
    formData.append("nameTh", nameTh || "");
    formData.append(
      "displayOrder",
      String(displayOrder === "" || Number(displayOrder) < 1 ? 1 : Number(displayOrder))
    );
    formData.append("active", isActive as any);

    if (imageFile) {
      formData.append("image", imageFile);
    }

    if (isEditMode && id) {
      await updateSubCategory({ id: parseInt(id), data: formData });
    } else {
      await createSubCategory({ categoryId: catId, data: formData });
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteSubCategory(parseInt(id));
    setDeleteDialogOpen(false);
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
          {isEditMode
            ? "Update sub-category details."
            : "Add a new sub-category to a shop category."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sub-Category Details</CardTitle>
          <CardDescription>
            Fill in the details for the shop sub-category.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label>Parent Shop Category</Label>
              <InfiniteSearchableSelect
                fetchData={fetchSearchCategories}
                valueKey="id"
                labelKey="dropdownLabel"
                selectedValue={
                  categories.find((c) => String(c.id) === selectedCategoryId) ||
                  ((selectedCategoryId
                    ? { id: Number(selectedCategoryId) }
                    : null) as DropdownCategory | null)
                }
                onChange={(item) =>
                  setSelectedCategoryId(item ? String(item.id) : "")
                }
                placeholder="Select a Category"
                disabled={isEditMode}
              />
              {isEditMode && (
                <p className="text-xs text-muted-foreground">
                  Category cannot be changed during edit.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nameEn">Name (English)</Label>
              <Input
                id="nameEn"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nameMm">Name (Myanmar)</Label>
                <Input
                  id="nameMm"
                  value={nameMm}
                  onChange={(e) => setNameMm(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameTh">Name (Thai)</Label>
                <Input
                  id="nameTh"
                  value={nameTh}
                  onChange={(e) => setNameTh(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category Icon/Image</Label>
              {imagePreview || existingImage ? (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                  <img
                    src={imagePreview || `http://localhost:3000/${existingImage}`}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-1 right-1 bg-destructive text-white rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="imageUpload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-sm text-muted-foreground">Upload image</span>
                  <input
                    id="imageUpload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(checked === true)}
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Active Status
              </Label>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              {isEditMode && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={submitting || isDeleting}
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
                  disabled={
                    !nameEn ||
                    submitting ||
                    (!selectedCategoryId && !isEditMode)
                  }
                >
                  {submitting
                    ? "Saving..."
                    : isEditMode
                      ? "Update Sub-Category"
                      : "Create Sub-Category"}
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
              This action cannot be undone. This will permanently delete the
              sub-category
              <strong> {nameEn}</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
