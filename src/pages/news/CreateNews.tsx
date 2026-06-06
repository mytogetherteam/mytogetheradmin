import { useState, useEffect } from "react";
import { useForm, Controller, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { compressImage } from "@/utils/imageCompression";
import {
  useCreateNewsMutation,
  useUpdateNewsMutation,
  useDeleteNewsMutation,
  useNewsItem,
} from "@/hooks/news/useNews";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { newsSchema, type NewsFormValues } from "@/schemas/news.schema";
import type { NewsPhotoDTO } from "@/services/newsService";

const MAX_PHOTOS = 10;

export default function CreateNews() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const isEditMode = !!id;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: newsData, isPending: loadingNews } = useNewsItem(
    isEditMode && id ? parseInt(id) : 0,
  );
  const loading = isEditMode ? loadingNews : false;

  const { mutateAsync: createNews, isPending: isCreating } =
    useCreateNewsMutation();
  const { mutateAsync: updateNews, isPending: isUpdating } =
    useUpdateNewsMutation();
  const { mutateAsync: deleteNews, isPending: isDeleting } =
    useDeleteNewsMutation();

  const submitting = isCreating || isUpdating;

  // Photo state: existing (already saved), newly-added files, and which
  // existing ids to remove on save.
  const [existingPhotos, setExistingPhotos] = useState<NewsPhotoDTO[]>([]);
  const [removePhotoIds, setRemovePhotoIds] = useState<number[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<NewsFormValues>({
    resolver: zodResolver(newsSchema) as Resolver<NewsFormValues>,
    defaultValues: {
      title: "",
      description: "",
      isActive: true,
    },
  });

  const title = watch("title");

  useEffect(() => {
    if (isEditMode && newsData) {
      reset({
        title: newsData.title || "",
        description: newsData.description || "",
        isActive: newsData.isActive !== false,
      });
      setExistingPhotos(newsData.photos || []);
      setRemovePhotoIds([]);
      setNewFiles([]);
      setNewPreviews([]);
    } else if (!isEditMode) {
      reset({
        title: "",
        description: "",
        isActive: true,
      });
      setExistingPhotos([]);
      setRemovePhotoIds([]);
      setNewFiles([]);
      setNewPreviews([]);
    }
  }, [isEditMode, newsData, reset]);

  const currentCount = existingPhotos.length + newFiles.length;

  const handleAddPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow re-selecting the same file
    if (!files.length) return;

    const room = MAX_PHOTOS - currentCount;
    const accepted = files.slice(0, Math.max(0, room));

    for (const original of accepted) {
      const file = await compressImage(original);
      const preview = URL.createObjectURL(file);
      setNewFiles((prev) => [...prev, file]);
      setNewPreviews((prev) => [...prev, preview]);
    }
  };

  const removeExistingPhoto = (photoId: number) => {
    setExistingPhotos((prev) => prev.filter((p) => p.id !== photoId));
    setRemovePhotoIds((prev) => [...prev, photoId]);
  };

  const removeNewPhoto = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => {
      const url = prev[index];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const onSubmit = async (values: NewsFormValues) => {
    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("description", values.description);
    formData.append("isActive", String(values.isActive));

    newFiles.forEach((file) => formData.append("photos", file));

    if (isEditMode && id) {
      removePhotoIds.forEach((rid) =>
        formData.append("removePhotoIds", String(rid)),
      );
      await updateNews({ id: parseInt(id), data: formData });
    } else {
      await createNews(formData);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteNews(parseInt(id));
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
          {isEditMode ? "Edit News" : "Create News"}
        </h2>
        <p className="text-muted-foreground">
          {isEditMode
            ? "Update the news article shown to app users."
            : "Publish a new news article to app users."}
        </p>
      </div>

      <Card className="border-solid">
        <CardHeader>
          <CardTitle>News Details</CardTitle>
          <CardDescription>
            Enter the title and description in each language and attach photos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="e.g. New feature launched"
              />
              {errors.title && (
                <p className="text-xs text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={6}
                {...register("description")}
                placeholder="Write the article body..."
              />
              {errors.description && (
                <p className="text-xs text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-3">
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
              <Label htmlFor="isActive">Published (visible to users)</Label>
            </div>

            {/* Photos */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label>Photos</Label>
                <span className="text-xs text-muted-foreground">
                  {currentCount}/{MAX_PHOTOS}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {existingPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square rounded-lg border overflow-hidden group"
                  >
                    <img
                      src={photo.url}
                      alt="News"
                      className="h-full w-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 rounded-full shadow-sm"
                      onClick={() => removeExistingPhoto(photo.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}

                {newPreviews.map((preview, index) => (
                  <div
                    key={`new-${index}`}
                    className="relative aspect-square rounded-lg border overflow-hidden group"
                  >
                    <img
                      src={preview}
                      alt="New"
                      className="h-full w-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 rounded-full shadow-sm"
                      onClick={() => removeNewPhoto(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}

                {currentCount < MAX_PHOTOS && (
                  <label className="relative flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={handleAddPhotos}
                    />
                    <div className="text-center space-y-1 pointer-events-none">
                      <Upload className="h-7 w-7 mx-auto text-muted-foreground" />
                      <div className="text-xs text-muted-foreground">
                        Add photos
                      </div>
                    </div>
                  </label>
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
                  onClick={() => navigate("/news/manage")}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : isEditMode ? (
                    "Update News"
                  ) : (
                    "Create News"
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
              news article
              <strong> {title || "this article"}</strong>.
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
              {isDeleting ? "Deleting..." : "Delete News"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
