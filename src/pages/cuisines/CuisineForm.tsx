import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, Controller, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  Loader2,
} from "lucide-react";
import { handleApiError } from "@/lib/error-utils";
import { useCreateCuisineMutation, useUpdateCuisineMutation, useCuisine } from "@/hooks/cuisine/useCuisine";

import { cuisineSchema, type CuisineFormValues } from "@/schemas/cuisine.schema";

export default function CuisineForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);

  const { data: cuisineData, isPending: fetchingCuisine } = useCuisine(
    isEditMode ? Number(id) : 0
  );
  const fetching = isEditMode ? fetchingCuisine : false;

  const { mutateAsync: createCuisine, isPending: isCreating } = useCreateCuisineMutation();
  const { mutateAsync: updateCuisine, isPending: isUpdating } = useUpdateCuisineMutation();
  const submitting = loading || isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CuisineFormValues>({
    resolver: zodResolver(cuisineSchema) as Resolver<CuisineFormValues>,
    defaultValues: {
      nameEn: "",
      nameMm: "",
      nameTh: "",
      isActive: true,
      displayOrder: 1,
    },
  });

  useEffect(() => {
    if (isEditMode && cuisineData) {
      reset({
        nameEn: cuisineData.nameEn ?? "",
        nameMm: cuisineData.nameMm ?? "",
        nameTh: cuisineData.nameTh ?? "",
        isActive: cuisineData.isActive ?? true,
        displayOrder: cuisineData.displayOrder || 1,
      });
      if (cuisineData.imageUrl) setImagePreview(cuisineData.imageUrl);
      setImageRemoved(false);
    }
  }, [isEditMode, cuisineData, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImageRemoved(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    if (imagePreview || cuisineData?.imageUrl) {
      setImageRemoved(true);
    }
    setImageFile(null);
    setImagePreview(null);
  };

  const onSubmit = async (values: CuisineFormValues) => {
    setLoading(true);
    try {
      const payload = new FormData();
      payload.append("nameEn", values.nameEn);
      payload.append("nameMm", values.nameMm || "");
      payload.append("nameTh", values.nameTh || "");
      payload.append("isActive", String(values.isActive));
      payload.append("displayOrder", String(values.displayOrder));

      if (imageFile) {
        payload.append("image", imageFile);
      }

      if (isEditMode && imageRemoved && !imageFile) {
        payload.append("removeImage", "true");
      }

      if (isEditMode) {
        await updateCuisine({ id: Number(id), data: payload });
      } else {
        await createCuisine(payload);
      }
    } catch (error) {
      handleApiError(
        error,
        isEditMode ? "Failed to update cuisine" : "Failed to create cuisine",
      );
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
            {isEditMode
              ? "Modify existing cuisine type details."
              : "Add a new cuisine category to the system."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5" />
              General Information
            </CardTitle>
            <CardDescription>
              Enter the cuisine names in different languages and set its status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-4">
              <Label>Cuisine Photo</Label>
              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 hover:bg-muted/50 transition-colors relative transition-all duration-200">
                {imagePreview ? (
                  <div className="relative group">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-32 w-32 object-cover rounded-lg border-2 border-primary/20"
                    />
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
                      <p className="text-sm font-medium">
                        Click to upload photo
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG or WebP (Max 2MB)
                      </p>
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
                  {...register("nameEn")}
                />
                {errors.nameEn && <p className="text-xs text-destructive">{errors.nameEn.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameMm">Name (Myanmar)</Label>
                <Input
                  id="nameMm"
                  placeholder="အီတလီ"
                  {...register("nameMm")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameTh">Name (Thai)</Label>
                <Input
                  id="nameTh"
                  placeholder="อาหารอิตาเลี่ยน"
                  {...register("nameTh")}
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
                  {...register("displayOrder")}
                  placeholder="1"
                />
                {errors.displayOrder && <p className="text-xs text-destructive">{errors.displayOrder.message}</p>}
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="isActive"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="isActive">Active Status</Label>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/cuisines/manage")}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="gap-2" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
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

