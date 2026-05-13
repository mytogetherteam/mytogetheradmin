import { useState, useEffect, useCallback } from "react";
import { ShopCategoryService } from "@/services/shopCategoryService";
import { handleApiError } from "@/lib/error-utils";
import { compressImage } from "@/utils/imageCompression";
import {
  useCreateShopCategoryMutation,
  useUpdateShopCategoryMutation,
  useDeleteShopCategoryMutation,
} from "@/hooks/shop-categories/useShopCategory";
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
  const [displayOrder, setDisplayOrder] = useState<number | "">(1);
  const [isActive, setIsActive] = useState<boolean>(true);

  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { mutateAsync: createCategory, isPending: isCreating } =
    useCreateShopCategoryMutation();
  const { mutateAsync: updateCategory, isPending: isUpdating } =
    useUpdateShopCategoryMutation();
  const { mutateAsync: deleteCategory, isPending: isDeleting } =
    useDeleteShopCategoryMutation();

  const submitting = isCreating || isUpdating;

  // Main Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);

  const handleNameEnChange = (value: string) => {
    setNameEn(value);
  };

  const loadCategory = useCallback(async (catId: number) => {
    setLoading(true);
    try {
      const cat = await ShopCategoryService.getShopCategoryById(catId);
      setNameMm(cat.nameMm || "");
      setNameTh(cat.nameTh || "");
      setNameEn(cat.nameEn || "");
      setDisplayOrder(cat.displayOrder || 1);
      setIsActive(cat.active !== false);
      if (cat.imageUrl) {
        setExistingImage(cat.imageUrl);
      }
    } catch (error) {
      handleApiError(error, "Failed to load shop category");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isEditMode && id) {
      loadCategory(parseInt(id));
    } else {
      setNameMm("");
      setNameTh("");
      setNameEn("");
      setDisplayOrder(1);
      setIsActive(true);
      setExistingImage(null);
      setImageFile(null);
      setImagePreview(null);
    }
  }, [id, isEditMode]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const originalFile = e.target.files?.[0];
    if (originalFile) {
      const file = await compressImage(originalFile);
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

    const formData = new FormData();
    formData.append("nameEn", nameEn || "");
    formData.append("nameMm", nameMm || "");
    formData.append("nameTh", nameTh || "");
    formData.append(
      "displayOrder",
      String(displayOrder === "" || displayOrder < 1 ? 1 : displayOrder)
    );
    formData.append("active", isActive as any);

    if (imageFile) {
      formData.append("image", imageFile);
    }

    if (isEditMode && id) {
      await updateCategory({ id: parseInt(id), data: formData });
    } else {
      await createCategory(formData);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteCategory(parseInt(id));
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
          {isEditMode ? "Edit Shop Category" : "Create Shop Category"}
        </h2>
        <p className="text-muted-foreground">
          {isEditMode
            ? "Update global shop category details."
            : "Add a new global shop category."}
        </p>
      </div>

      <Card className="border-solid">
        <CardHeader>
          <CardTitle>Shop Category Details</CardTitle>
          <CardDescription>
            Enter the category information and upload representative media.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoryNameEn">Name (English)</Label>
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
                    if (displayOrder === "" || displayOrder < 1)
                      setDisplayOrder(1);
                  }}
                  placeholder="1"
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
                    <div className="text-sm font-medium">
                      Upload Category Image
                    </div>
                    <div className="text-xs text-muted-foreground">
                      PNG, JPG or WebP
                    </div>
                  </div>
                ) : (
                  <div className="relative h-full aspect-square group">
                    <img
                      src={existingImage || imagePreview || ""}
                      className="h-full w-full object-contain rounded"
                      alt="Main"
                    />
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
                  onClick={() => navigate("/shop-categories/manage")}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!nameEn || submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : isEditMode ? (
                    "Update Category"
                  ) : (
                    "Create Category"
                  )}
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
              shop category
              <strong> {nameEn || nameMm || "this category"}</strong>.
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
              {isDeleting ? "Deleting..." : "Delete Shop Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
