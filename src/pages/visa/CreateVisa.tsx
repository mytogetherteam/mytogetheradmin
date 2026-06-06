import { useState, useEffect, useMemo } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateVisaMutation,
  useDeleteVisaMutation,
  useUpdateVisaMutation,
  useVisa,
} from "@/hooks/visa/useVisa";
import { useVisaCategories } from "@/hooks/visa/useVisaCategory";
import {
  visaFormSchema,
  visaToFormValues,
  SECTION_LABELS,
  type VisaFormValues,
} from "@/schemas/visa.schema";

export default function CreateVisa() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const idParam = searchParams.get("id");
  const visaId = idParam ? parseInt(idParam, 10) : undefined;
  const isEditMode = !!visaId && !Number.isNaN(visaId);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const { data: visaData, isPending: fetchingVisa } = useVisa(isEditMode ? visaId : undefined);
  const { data: categoriesData, isPending: fetchingCategories } = useVisaCategories({
    page: 1,
    size: 500,
  });
  const { mutate: createVisa, isPending: isCreating } = useCreateVisaMutation();
  const { mutate: updateVisa, isPending: isUpdating } = useUpdateVisaMutation();
  const { mutate: deleteVisa, isPending: isDeleting } = useDeleteVisaMutation({
    navigateOnSuccess: true,
  });

  const submitting = isCreating || isUpdating;
  const categories = useMemo(() => {
    const list = categoriesData?.content ?? [];
    if (!isEditMode || !visaData?.visaCategory) return list;

    const categoryId = visaData.visaCategoryId ?? visaData.visaCategory.id;
    if (list.some((cat) => cat.id === categoryId)) return list;

    return [visaData.visaCategory, ...list];
  }, [categoriesData?.content, isEditMode, visaData]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<VisaFormValues>({
    resolver: zodResolver(visaFormSchema) as Resolver<VisaFormValues>,
    defaultValues: {
      visaCategoryId: undefined,
      titleEn: "",
      titleMm: "",
      titleTh: "",
      subtitleEn: "",
      subtitleMm: "",
      subtitleTh: "",
      descriptionEn: "",
      descriptionMm: "",
      descriptionTh: "",
      linkUrl: "",
      displayOrder: undefined,
      isActive: true,
    },
  });

  useEffect(() => {
    if (!isEditMode || !visaData || categories.length === 0) return;

    reset(visaToFormValues(visaData));
    setIconPreview(visaData.iconUrl);
    setBannerPreview(visaData.bannerUrl);
    setIconFile(null);
    setBannerFile(null);
  }, [isEditMode, visaData, categories.length, reset]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "icon" | "banner",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === "icon") {
        setIconFile(file);
        setIconPreview(reader.result as string);
      } else {
        setBannerFile(file);
        setBannerPreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = (values: VisaFormValues) => {
    const files = {
      iconFile: iconFile ?? undefined,
      bannerFile: bannerFile ?? undefined,
    };

    if (isEditMode && visaId) {
      updateVisa({ id: visaId, values, ...files });
    } else {
      createVisa({ values, ...files });
    }
  };

  const handleDelete = () => {
    if (!visaId) return;
    deleteVisa(visaId, {
      onSuccess: () => setDeleteDialogOpen(false),
    });
  };

  if ((isEditMode && (fetchingVisa || !visaData)) || fetchingCategories) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? "Edit Visa" : "Create Visa"}</CardTitle>
          <CardDescription>
            Manage visa type or immigration service content for the mobile app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Controller
                name="visaCategoryId"
                control={control}
                render={({ field }) => (
                  <Select
                    key={
                      categories.length > 0
                        ? `categories-loaded-${field.value ?? "none"}`
                        : "categories-loading"
                    }
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.length === 0 ? (
                        <SelectItem value="0" disabled>
                          No categories — create one first
                        </SelectItem>
                      ) : (
                        categories.map((cat) => (
                          <SelectItem key={cat.id} value={String(cat.id)}>
                            {cat.title} ({SECTION_LABELS[cat.section]})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.visaCategoryId && (
                <p className="text-sm text-destructive">{errors.visaCategoryId.message}</p>
              )}
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-xs"
                onClick={() => navigate("/visa/categories/create")}
              >
                + Create new category
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="titleEn">Title (English) *</Label>
              <Input id="titleEn" {...register("titleEn")} />
              {errors.titleEn && (
                <p className="text-sm text-destructive">{errors.titleEn.message}</p>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="titleMm">Title (Myanmar)</Label>
                <Input id="titleMm" {...register("titleMm")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="titleTh">Title (Thai)</Label>
                <Input id="titleTh" {...register("titleTh")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitleEn">Subtitle (English)</Label>
              <Input
                id="subtitleEn"
                {...register("subtitleEn")}
                placeholder="Short list description"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="subtitleMm">Subtitle (Myanmar)</Label>
                <Input id="subtitleMm" {...register("subtitleMm")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitleTh">Subtitle (Thai)</Label>
                <Input id="subtitleTh" {...register("subtitleTh")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descriptionEn">Description (English)</Label>
              <Textarea id="descriptionEn" rows={5} {...register("descriptionEn")} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="descriptionMm">Description (Myanmar)</Label>
                <Textarea id="descriptionMm" rows={4} {...register("descriptionMm")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descriptionTh">Description (Thai)</Label>
                <Textarea id="descriptionTh" rows={4} {...register("descriptionTh")} />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Icon image</Label>
                {iconPreview ? (
                  <div className="relative h-24 w-24 overflow-hidden rounded-lg border">
                    <img src={iconPreview} alt="Icon" className="h-full w-full object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-1 top-1 h-6 w-6"
                      onClick={() => {
                        setIconFile(null);
                        setIconPreview(null);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed hover:bg-muted/50">
                    <Upload className="mb-1 h-6 w-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Upload icon</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, "icon")}
                    />
                  </label>
                )}
              </div>
              <div className="space-y-2">
                <Label>Banner image</Label>
                {bannerPreview ? (
                  <div className="relative h-24 w-full overflow-hidden rounded-lg border">
                    <img src={bannerPreview} alt="Banner" className="h-full w-full object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-1 top-1 h-6 w-6"
                      onClick={() => {
                        setBannerFile(null);
                        setBannerPreview(null);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed hover:bg-muted/50">
                    <Upload className="mb-1 h-6 w-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Upload banner</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, "banner")}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="space-y-2 border-t pt-4">
              <Label htmlFor="linkUrl">Link URL</Label>
              <Input id="linkUrl" {...register("linkUrl")} placeholder="https://..." />
              {errors.linkUrl && (
                <p className="text-sm text-destructive">{errors.linkUrl.message}</p>
              )}
            </div>

            <div className="grid items-end gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="displayOrder">Display order</Label>
                <Input id="displayOrder" type="number" min={1} {...register("displayOrder")} />
                {errors.displayOrder && (
                  <p className="text-sm text-destructive">{errors.displayOrder.message}</p>
                )}
              </div>
              <div className="flex items-center gap-3 pb-2">
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <Switch id="isActive" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-4">
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? "Update Visa" : "Create Visa"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/visa/manage")}>
                Cancel
              </Button>
              {isEditMode && (
                <Button
                  type="button"
                  variant="destructive"
                  className="ml-auto"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Visa</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this visa? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
