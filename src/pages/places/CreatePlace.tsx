import { useState, useEffect } from "react";
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
  useCreatePlaceMutation,
  useDeletePlaceMutation,
  usePlace,
  useUpdatePlaceMutation,
} from "@/hooks/places/usePlaces";
import {
  placeFormSchema,
  placeToFormValues,
  type PlaceFormValues,
} from "@/schemas/place.schema";
import type { PlaceGalleryDTO } from "@/services/placeService";

export default function CreatePlace() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const idParam = searchParams.get("id");
  const placeId = idParam ? parseInt(idParam, 10) : undefined;
  const isEditMode = !!placeId && !Number.isNaN(placeId);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [existingGallery, setExistingGallery] = useState<PlaceGalleryDTO[]>([]);
  const [removedGalleryIds, setRemovedGalleryIds] = useState<number[]>([]);

  const { data: placeData, isPending: fetchingPlace } = usePlace(isEditMode ? placeId : undefined);
  const { mutate: createPlace, isPending: isCreating } = useCreatePlaceMutation();
  const { mutate: updatePlace, isPending: isUpdating } = useUpdatePlaceMutation();
  const { mutate: deletePlace, isPending: isDeleting } = useDeletePlaceMutation({
    navigateOnSuccess: true,
  });

  const submitting = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<PlaceFormValues>({
    resolver: zodResolver(placeFormSchema) as Resolver<PlaceFormValues>,
    defaultValues: {
      titleEn: "",
      titleMm: "",
      titleTh: "",
      locationName: "",
      descriptionEn: "",
      descriptionMm: "",
      descriptionTh: "",
      openingTime: "09:00",
      closingTime: "21:00",
      latitude: undefined,
      longitude: undefined,
      displayOrder: undefined,
      isActive: true,
      removeGalleryIds: [],
    },
  });

  useEffect(() => {
    if (!isEditMode || !placeData) return;

    reset(placeToFormValues(placeData));
    setCoverPreview(placeData.coverUrl);
    setCoverFile(null);
    setGalleryFiles([]);
    setGalleryPreviews([]);
    setExistingGallery(placeData.photoGallery ?? []);
    setRemovedGalleryIds([]);
  }, [isEditMode, placeData, reset]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverFile(file);
      setCoverPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setGalleryFiles((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGalleryPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const removeNewGalleryPhoto = (index: number) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingGalleryPhoto = (galleryId: number) => {
    setRemovedGalleryIds((prev) => [...prev, galleryId]);
    setExistingGallery((prev) => prev.filter((item) => item.id !== galleryId));
  };

  const onSubmit = (values: PlaceFormValues) => {
    const payload: PlaceFormValues = {
      ...values,
      removeGalleryIds: removedGalleryIds,
    };

    if (isEditMode && placeId) {
      updatePlace({
        id: placeId,
        values: payload,
        coverFile: coverFile ?? undefined,
        galleryFiles: galleryFiles.length > 0 ? galleryFiles : undefined,
      });
    } else {
      createPlace({
        values: payload,
        coverFile: coverFile ?? undefined,
        galleryFiles: galleryFiles.length > 0 ? galleryFiles : undefined,
      });
    }
  };

  const handleDelete = () => {
    if (!placeId) return;
    deletePlace(placeId, {
      onSuccess: () => setDeleteDialogOpen(false),
    });
  };

  if (isEditMode && (fetchingPlace || !placeData)) {
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
          <CardTitle>{isEditMode ? "Edit Place" : "Create Place"}</CardTitle>
          <CardDescription>
            Manage points of interest with cover image, photo gallery, location, and opening hours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="titleEn">Title (English) *</Label>
              <Input id="titleEn" {...register("titleEn")} />
              {errors.titleEn && (
                <p className="text-sm text-destructive">{errors.titleEn.message}</p>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="titleMm">Title (Myanmar) <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input id="titleMm" {...register("titleMm")} placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="titleTh">Title (Thai) <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input id="titleTh" {...register("titleTh")} placeholder="Optional" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="locationName">Location name *</Label>
              <Input
                id="locationName"
                {...register("locationName")}
                placeholder="e.g. Phra Nakhon, Bangkok"
              />
              {errors.locationName && (
                <p className="text-sm text-destructive">{errors.locationName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="descriptionEn">Description (English)</Label>
              <Textarea id="descriptionEn" rows={5} {...register("descriptionEn")} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="descriptionMm">
                  Description (Myanmar){" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Textarea id="descriptionMm" rows={4} {...register("descriptionMm")} placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descriptionTh">
                  Description (Thai){" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Textarea id="descriptionTh" rows={4} {...register("descriptionTh")} placeholder="Optional" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="openingTime">Opening time *</Label>
                <Input id="openingTime" type="time" {...register("openingTime")} />
                {errors.openingTime && (
                  <p className="text-sm text-destructive">{errors.openingTime.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="closingTime">Closing time *</Label>
                <Input id="closingTime" type="time" {...register("closingTime")} />
                {errors.closingTime && (
                  <p className="text-sm text-destructive">{errors.closingTime.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  {...register("latitude")}
                  placeholder="13.7563"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  {...register("longitude")}
                  placeholder="100.5018"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cover image</Label>
              {coverPreview ? (
                <div className="relative h-40 w-full overflow-hidden rounded-lg border">
                  <img src={coverPreview} alt="Cover" className="h-full w-full object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-2 top-2 h-7 w-7"
                    onClick={() => {
                      setCoverFile(null);
                      setCoverPreview(null);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <label className="flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed hover:bg-muted/50">
                  <Upload className="mb-1 h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Upload cover</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverChange}
                  />
                </label>
              )}
            </div>

            <div className="space-y-3">
              <Label>Photo gallery</Label>
              {existingGallery.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {existingGallery.map((item) => (
                    <div key={item.id} className="relative aspect-square overflow-hidden rounded-lg border">
                      <img
                        src={item.imageUrl}
                        alt={`Gallery ${item.id}`}
                        className="h-full w-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute right-1 top-1 h-6 w-6"
                        onClick={() => removeExistingGalleryPhoto(item.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {galleryPreviews.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {galleryPreviews.map((preview, index) => (
                    <div key={`new-${index}`} className="relative aspect-square overflow-hidden rounded-lg border">
                      <img
                        src={preview}
                        alt={`New gallery ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute right-1 top-1 h-6 w-6"
                        onClick={() => removeNewGalleryPhoto(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <label className="flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed hover:bg-muted/50">
                <Upload className="mb-1 h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Add gallery photos</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleGalleryChange}
                />
              </label>
            </div>

            <div className="grid items-end gap-4 md:grid-cols-2 border-t pt-4">
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
                {isEditMode ? "Update Place" : "Create Place"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/places/manage")}>
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
            <DialogTitle>Delete Place</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this place? This action cannot be undone.
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
