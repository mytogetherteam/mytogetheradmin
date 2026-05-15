import { useState, useEffect, useCallback } from "react";
import { useForm, Controller, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  useCreateShopSubCategoryMutation,
  useUpdateShopSubCategoryMutation,
  useDeleteShopSubCategoryMutation,
  useShopSubCategory,
} from "@/hooks/shop-sub-categories/useShopSubCategory";

import { shopSubCategorySchema, type ShopSubCategoryFormValues } from "@/schemas/shop-sub-category.schema";

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

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<ShopSubCategoryFormValues>({
    resolver: zodResolver(shopSubCategorySchema) as Resolver<ShopSubCategoryFormValues>,
    defaultValues: {
      categoryId: categoryIdFromUrl ? parseInt(categoryIdFromUrl) : 0,
      nameEn: "",
      nameMm: "",
      nameTh: "",
      displayOrder: 1,
      isActive: true,
    },
  });

  const nameEn = watch("nameEn");

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
      reset({
        categoryId: subCategoryData.categoryId || 0,
        nameEn: subCategoryData.nameEn || subCategoryData.name || "",
        nameMm: subCategoryData.nameMm || "",
        nameTh: subCategoryData.nameTh || "",
        displayOrder: subCategoryData.displayOrder || 1,
        isActive: subCategoryData.isActive !== false,
      });
      if (subCategoryData.imageUrl) setExistingImage(subCategoryData.imageUrl);
    }
  }, [isEditMode, subCategoryData, reset]);

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

  const onSubmit = async (values: ShopSubCategoryFormValues) => {
    const formData = new FormData();
    formData.append("nameEn", values.nameEn);
    formData.append("nameMm", values.nameMm || "");
    formData.append("nameTh", values.nameTh || "");
    formData.append("displayOrder", String(values.displayOrder));
    formData.append("isActive", String(values.isActive));

    if (imageFile) {
      formData.append("image", imageFile);
    }

    if (isEditMode && id) {
      await updateSubCategory({ id: parseInt(id), data: formData });
    } else {
      await createSubCategory({ categoryId: values.categoryId, data: formData });
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
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label>Parent Shop Category</Label>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <InfiniteSearchableSelect
                    fetchData={fetchSearchCategories}
                    valueKey="id"
                    labelKey="dropdownLabel"
                    selectedValue={
                      categories.find((c) => c.id === field.value) ||
                      ((field.value
                        ? { id: field.value }
                        : null) as DropdownCategory | null)
                    }
                    onChange={(item) =>
                      field.onChange(item ? item.id : 0)
                    }
                    placeholder="Select a Category"
                    disabled={isEditMode}
                  />
                )}
              />
              {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId.message}</p>}
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
                {...register("nameEn")}
              />
              {errors.nameEn && <p className="text-xs text-destructive">{errors.nameEn.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nameMm">Name (Myanmar)</Label>
                <Input
                  id="nameMm"
                  {...register("nameMm")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameTh">Name (Thai)</Label>
                <Input
                  id="nameTh"
                  {...register("nameTh")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input
                id="displayOrder"
                type="text"
                inputMode="numeric"
                {...register("displayOrder")}
                placeholder="1"
              />
              {errors.displayOrder && <p className="text-xs text-destructive">{errors.displayOrder.message}</p>}
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
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="isActive"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                )}
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
                  disabled={submitting}
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

