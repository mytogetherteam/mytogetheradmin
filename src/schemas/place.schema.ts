import { z } from "zod";

const timeStringSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:mm format (e.g. 09:00)");

const optionalCoordinate = z.preprocess(
  (val) => (val === "" || val === undefined || val === null ? undefined : val),
  z.coerce.number().optional(),
);

const optionalText = z.preprocess(
  (val) => (val === "" || val === undefined || val === null ? undefined : val),
  z.string().trim().optional(),
);

export const placeFormSchema = z.object({
  titleEn: z.string().trim().min(1, "Title (English) is required"),
  titleMm: optionalText,
  titleTh: optionalText,
  locationName: z.string().trim().min(1, "Location name is required"),
  descriptionEn: z.string().trim().optional(),
  descriptionMm: optionalText,
  descriptionTh: optionalText,
  openingTime: timeStringSchema,
  closingTime: timeStringSchema,
  latitude: optionalCoordinate,
  longitude: optionalCoordinate,
  displayOrder: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : val),
    z.coerce.number().min(1, "Display order must be at least 1").optional(),
  ),
  isActive: z.boolean().default(true),
  removeGalleryIds: z.array(z.number()).optional(),
});

export type PlaceFormValues = z.infer<typeof placeFormSchema>;

export function parseTimeString(time: string): { hour: number; min: number } {
  const [hour, min] = time.split(":").map((part) => Number.parseInt(part, 10));
  return { hour, min };
}

export function formatTimeString(hour: number, min: number): string {
  return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export function buildPlaceFormData(
  values: PlaceFormValues,
  files?: { cover?: File; galleryPhotos?: File[] },
): FormData {
  const open = parseTimeString(values.openingTime);
  const close = parseTimeString(values.closingTime);

  const payload = {
    titleEn: values.titleEn,
    titleMm: values.titleMm || undefined,
    titleTh: values.titleTh || undefined,
    locationName: values.locationName,
    descriptionEn: values.descriptionEn || undefined,
    descriptionMm: values.descriptionMm || undefined,
    descriptionTh: values.descriptionTh || undefined,
    openTimeHour: open.hour,
    openTimeMin: open.min,
    closeTimeHour: close.hour,
    closeTimeMin: close.min,
    latitude: values.latitude,
    longitude: values.longitude,
    displayOrder: values.displayOrder,
    isActive: values.isActive,
    removeGalleryIds:
      values.removeGalleryIds && values.removeGalleryIds.length > 0
        ? values.removeGalleryIds
        : undefined,
  };

  const formData = new FormData();
  formData.append("data", JSON.stringify(payload));
  if (files?.cover) formData.append("cover", files.cover);
  files?.galleryPhotos?.forEach((file) => formData.append("galleryPhotos", file));
  return formData;
}

export function placeToFormValues(place: {
  titleEn: string;
  titleMm: string | null;
  titleTh: string | null;
  locationName: string;
  descriptionEn: string | null;
  descriptionMm: string | null;
  descriptionTh: string | null;
  openingTime: string;
  closingTime: string;
  latitude: number | null;
  longitude: number | null;
  displayOrder: number;
  isActive: boolean;
}): PlaceFormValues {
  return {
    titleEn: place.titleEn,
    titleMm: place.titleMm ?? "",
    titleTh: place.titleTh ?? "",
    locationName: place.locationName,
    descriptionEn: place.descriptionEn ?? "",
    descriptionMm: place.descriptionMm ?? "",
    descriptionTh: place.descriptionTh ?? "",
    openingTime: place.openingTime,
    closingTime: place.closingTime,
    latitude: place.latitude ?? undefined,
    longitude: place.longitude ?? undefined,
    displayOrder: place.displayOrder,
    isActive: place.isActive,
    removeGalleryIds: [],
  };
}
