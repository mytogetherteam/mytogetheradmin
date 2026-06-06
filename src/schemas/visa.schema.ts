import { z } from "zod";

export const visaSectionSchema = z.enum(["VISA_TYPES", "IMMIGRATION_SERVICES"]);

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .refine((val) => !val || /^https?:\/\/.+/i.test(val), {
    message: "Must be a valid URL starting with http:// or https://",
  });

export const visaFormSchema = z.object({
  visaCategoryId: z.coerce.number().min(1, "Category is required"),
  titleEn: z.string().trim().min(1, "Title (English) is required"),
  titleMm: z.string().trim().optional(),
  titleTh: z.string().trim().optional(),
  subtitleEn: z.string().trim().optional(),
  subtitleMm: z.string().trim().optional(),
  subtitleTh: z.string().trim().optional(),
  descriptionEn: z.string().trim().optional(),
  descriptionMm: z.string().trim().optional(),
  descriptionTh: z.string().trim().optional(),
  linkUrl: optionalUrl,
  displayOrder: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : val),
    z.coerce.number().min(1, "Display order must be at least 1").optional(),
  ),
  isActive: z.boolean().default(true),
});

export type VisaFormValues = z.infer<typeof visaFormSchema>;
export type VisaSection = z.infer<typeof visaSectionSchema>;

export const SECTION_LABELS: Record<VisaSection, string> = {
  VISA_TYPES: "Visa Types",
  IMMIGRATION_SERVICES: "Immigration Services",
};

export function buildVisaFormData(
  values: VisaFormValues,
  files?: { icon?: File; banner?: File },
): FormData {
  const payload = {
    visaCategoryId: values.visaCategoryId,
    titleEn: values.titleEn,
    titleMm: values.titleMm || undefined,
    titleTh: values.titleTh || undefined,
    subtitleEn: values.subtitleEn || undefined,
    subtitleMm: values.subtitleMm || undefined,
    subtitleTh: values.subtitleTh || undefined,
    descriptionEn: values.descriptionEn || undefined,
    descriptionMm: values.descriptionMm || undefined,
    descriptionTh: values.descriptionTh || undefined,
    linkUrl: values.linkUrl || undefined,
    displayOrder: values.displayOrder,
    isActive: values.isActive,
  };

  const formData = new FormData();
  formData.append("data", JSON.stringify(payload));
  if (files?.icon) formData.append("icon", files.icon);
  if (files?.banner) formData.append("banner", files.banner);
  return formData;
}

export function visaToFormValues(visa: {
  visaCategoryId?: number;
  visaCategory?: { id: number };
  titleEn: string;
  titleMm: string | null;
  titleTh: string | null;
  subtitleEn: string | null;
  subtitleMm: string | null;
  subtitleTh: string | null;
  descriptionEn: string | null;
  descriptionMm: string | null;
  descriptionTh: string | null;
  linkUrl: string | null;
  displayOrder: number;
  isActive: boolean;
}): VisaFormValues {
  return {
    visaCategoryId: visa.visaCategoryId ?? visa.visaCategory?.id ?? 0,
    titleEn: visa.titleEn,
    titleMm: visa.titleMm ?? "",
    titleTh: visa.titleTh ?? "",
    subtitleEn: visa.subtitleEn ?? "",
    subtitleMm: visa.subtitleMm ?? "",
    subtitleTh: visa.subtitleTh ?? "",
    descriptionEn: visa.descriptionEn ?? "",
    descriptionMm: visa.descriptionMm ?? "",
    descriptionTh: visa.descriptionTh ?? "",
    linkUrl: visa.linkUrl ?? "",
    displayOrder: visa.displayOrder,
    isActive: visa.isActive,
  };
}
