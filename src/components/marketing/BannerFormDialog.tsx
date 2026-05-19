import { useEffect, useState } from "react";
import { Controller, Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import {
  bannerFormSchema,
  type BannerFormValues,
  type BannerImage,
} from "@/schemas/banner-image.schema";

const defaultValues: BannerFormValues = {
  nameEn: "",
  nameMm: "",
  nameTh: "",
  linkUrl: "",
  position: "Promotions",
  isActive: true,
  startDate: new Date().toISOString().split("T")[0]!,
  endDate: "",
};

interface BannerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner?: BannerImage | null;
  submitting?: boolean;
  onSubmit: (values: BannerFormValues, imageFile?: File) => Promise<void>;
}

export function BannerFormDialog({
  open,
  onOpenChange,
  banner,
  submitting = false,
  onSubmit,
}: BannerFormDialogProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<BannerFormValues>({
    resolver: zodResolver(bannerFormSchema) as Resolver<BannerFormValues>,
    defaultValues,
  });

  useEffect(() => {
    if (!open) return;
    if (banner) {
      reset({
        nameEn: banner.nameEn,
        nameMm: banner.nameMm,
        nameTh: banner.nameTh ?? "",
        linkUrl: banner.linkUrl ?? "",
        position: banner.position,
        isActive: banner.isActive,
        startDate: banner.startDate,
        endDate: banner.endDate,
      });
      setImagePreview(banner.imageUrl);
      setImageFile(null);
      return;
    }
    reset(defaultValues);
    setImagePreview(null);
    setImageFile(null);
  }, [banner, open, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = handleSubmit(async (values) => {
    if (!banner && !imageFile) {
      toast.error("An image is required to create a new banner.");
      return;
    }
    await onSubmit(values, imageFile ?? undefined);
    onOpenChange(false);
  });

  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      onSubmit={() => void handleSave()}
      loading={submitting}
      title={banner ? "Edit Banner" : "Create New Banner"}
      description={
        banner
          ? "Update banner details, schedule, and image."
          : "Create a new promotional or ads banner."
      }
      submitText={banner ? "Update Banner" : "Create Banner"}
      width="sm:max-w-lg"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="nameEn">Title (English)</Label>
            <Input id="nameEn" {...register("nameEn")} />
            {errors.nameEn && (
              <p className="text-xs text-red-500">{errors.nameEn.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="nameMm">Title (Myanmar)</Label>
            <Input id="nameMm" {...register("nameMm")} />
            {errors.nameMm && (
              <p className="text-xs text-red-500">{errors.nameMm.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nameTh">Title (Thai)</Label>
          <Input id="nameTh" {...register("nameTh")} />
        </div>

        <div className="space-y-2">
          <Label>Position</Label>
          <Controller
            name="position"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Promotions">Promotions</SelectItem>
                  <SelectItem value="Ads">Ads</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.position && (
            <p className="text-xs text-red-500">{errors.position.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Image</Label>
          <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-32 w-full object-cover rounded mx-auto"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 h-6 w-6 p-0"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 cursor-pointer">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Click to upload</p>
                <p className="text-xs text-muted-foreground">PNG, JPG or WebP</p>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>
          {!banner && !imageFile && (
            <p className="text-xs text-muted-foreground">
              Image is required for new banners.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="linkUrl">Link URL (optional)</Label>
          <Input id="linkUrl" {...register("linkUrl")} placeholder="https://..." />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input id="startDate" type="date" {...register("startDate")} />
            {errors.startDate && (
              <p className="text-xs text-red-500">{errors.startDate.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input id="endDate" type="date" {...register("endDate")} />
            {errors.endDate && (
              <p className="text-xs text-red-500">{errors.endDate.message}</p>
            )}
          </div>
        </div>

        <Controller
          name="isActive"
          control={control}
          render={({ field }) => (
            <div className="flex items-center justify-between rounded-lg border p-4">
              <Label>Active</Label>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </div>
          )}
        />
      </div>
    </Modal>
  );
}
