import { useEffect, useState } from "react";
import { Controller, Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  type BannerPosition,
} from "@/schemas/banner-image.schema";

const defaultValues: BannerFormValues = {
  nameEn: "",
  nameMm: "",
  nameTh: "",
  descriptionEn: "",
  descriptionMm: "",
  descriptionTh: "",
  linkUrl: "",
  position: "Promotions",
  isActive: true,
  startDate: new Date().toISOString().split("T")[0]!,
  endDate: "",
};

const POSITION_LABELS: Record<BannerPosition, string> = {
  Ads: "Ads",
  Promotions: "Promotions",
  Order: "Order Waiting",
  Splash: "Splash",
};

const BANNER_TAB_POSITIONS: BannerPosition[] = ["Promotions", "Ads"];

interface BannerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner?: BannerImage | null;
  defaultPosition?: BannerFormValues["position"];
  /** Positions the user may pick in this dialog (scoped to the current tab). */
  allowedPositions?: BannerPosition[];
  submitting?: boolean;
  onSubmit: (values: BannerFormValues, imageFile?: File) => Promise<void>;
}

export function BannerFormDialog({
  open,
  onOpenChange,
  banner,
  defaultPosition = "Promotions",
  allowedPositions = BANNER_TAB_POSITIONS,
  submitting = false,
  onSubmit,
}: BannerFormDialogProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const positions = allowedPositions.length
    ? allowedPositions
    : BANNER_TAB_POSITIONS;
  const lockedPosition = positions.length === 1 ? positions[0] : null;
  const createPosition =
    lockedPosition ??
    (positions.includes(defaultPosition) ? defaultPosition : positions[0]!);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<BannerFormValues>({
    resolver: zodResolver(bannerFormSchema) as Resolver<BannerFormValues>,
    defaultValues: { ...defaultValues, position: createPosition },
  });

  useEffect(() => {
    if (!open) return;
    if (banner) {
      reset({
        nameEn: banner.nameEn,
        nameMm: banner.nameMm,
        nameTh: banner.nameTh ?? "",
        descriptionEn: banner.descriptionEn ?? "",
        descriptionMm: banner.descriptionMm ?? "",
        descriptionTh: banner.descriptionTh ?? "",
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
    reset({ ...defaultValues, position: createPosition });
    setImagePreview(null);
    setImageFile(null);
  }, [banner, createPosition, open, reset]);

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

  const entityLabel = lockedPosition
    ? POSITION_LABELS[lockedPosition]
    : banner
      ? POSITION_LABELS[banner.position]
      : "Banner";

  const modalTitle = banner
    ? `Edit ${entityLabel}`
    : `Create ${entityLabel}`;
  const modalDescription = banner
    ? `Update ${entityLabel.toLowerCase()} details, schedule, and image.`
    : lockedPosition
      ? `Create a new ${entityLabel.toLowerCase()} image.`
      : "Create a new promo or ads banner.";
  const submitText = banner ? `Update ${entityLabel}` : `Create ${entityLabel}`;

  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      onSubmit={() => void handleSave()}
      loading={submitting}
      title={modalTitle}
      description={modalDescription}
      submitText={submitText}
      width="sm:max-w-lg"
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
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

        <div className="space-y-3 rounded-lg border p-3">
          <p className="text-sm font-medium">Description (optional)</p>
          <div className="space-y-2">
            <Label htmlFor="descriptionEn">English</Label>
            <Textarea
              id="descriptionEn"
              rows={2}
              {...register("descriptionEn")}
              placeholder="Short description in English"
            />
            {errors.descriptionEn && (
              <p className="text-xs text-red-500">{errors.descriptionEn.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="descriptionMm">Myanmar</Label>
            <Textarea
              id="descriptionMm"
              rows={2}
              {...register("descriptionMm")}
              placeholder="Short description in Myanmar"
            />
            {errors.descriptionMm && (
              <p className="text-xs text-red-500">{errors.descriptionMm.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="descriptionTh">Thai</Label>
            <Textarea
              id="descriptionTh"
              rows={2}
              {...register("descriptionTh")}
              placeholder="Short description in Thai"
            />
            {errors.descriptionTh && (
              <p className="text-xs text-red-500">{errors.descriptionTh.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Position</Label>
          {lockedPosition && !banner ? (
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
              {POSITION_LABELS[lockedPosition]}
            </div>
          ) : (
            <Controller
              name="position"
              control={control}
              render={({ field }) => {
                const options = banner
                  ? Array.from(
                      new Set<BannerPosition>([...positions, banner.position]),
                    )
                  : positions;
                return (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((pos) => (
                        <SelectItem key={pos} value={pos}>
                          {POSITION_LABELS[pos]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              }}
            />
          )}
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
