import { useState } from "react";
import { type Resolver, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  useCreatePlanFeatureMutation,
  useDeletePlanFeatureMutation,
  usePlanFeature,
  usePlanFeatureKeys,
  useUpdatePlanFeatureMutation,
} from "@/hooks/plans/usePlanFeature";
import {
  DISPLAY_ONLY_FEATURE_KEY,
  planFeatureSchema,
  type PlanFeatureFormValues,
} from "@/schemas/plan-feature.schema";
import type {
  PlanFeatureKey,
  PlanFeatureKeyOption,
  PlanFeatureListItem,
} from "@/services/planService";
import { FormValidationAlert } from "@/components/common/FormValidationAlert";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { PlanFeatureFormCard } from "@/components/plans/PlanFeatureFormCard";
import { PlanFormActions } from "@/components/plans/PlanFormActions";
import { Button } from "@/components/ui/button";

const BLANK_FEATURE: PlanFeatureFormValues = {
  nameEn: "",
  featureKey: DISPLAY_ONLY_FEATURE_KEY,
  nameMm: "",
  nameTh: "",
  descriptionEn: "",
  descriptionMm: "",
  descriptionTh: "",
  options: [],
  isActive: true,
};

function mapFeatureToFormValues(
  feature: PlanFeatureListItem,
): PlanFeatureFormValues {
  return {
    nameEn: feature.nameEn,
    featureKey: feature.featureKey ?? DISPLAY_ONLY_FEATURE_KEY,
    nameMm: feature.nameMm ?? "",
    nameTh: feature.nameTh ?? "",
    descriptionEn: feature.descriptionEn ?? "",
    descriptionMm: feature.descriptionMm ?? "",
    descriptionTh: feature.descriptionTh ?? "",
    options: (feature.options ?? []).map((option) => ({
      id: option.id,
      textEn: option.textEn,
      textMm: option.textMm ?? "",
      textTh: option.textTh ?? "",
      displayOrder: option.displayOrder,
      isActive: option.isActive,
    })),
    isActive: feature.isActive,
  };
}

/**
 * Loads the feature, then hands it to the form. The form is a separate component
 * mounted only once the data is in hand, so its defaultValues ARE the API
 * response — no reset(), no effect, nothing that can run in the wrong order.
 */
export default function CreatePlanFeature() {
  const [searchParams] = useSearchParams();
  const idParam = searchParams.get("id");
  const returnTo = searchParams.get("return");
  const id = idParam ? parseInt(idParam, 10) : 0;
  const isEditMode = !!id;

  const { data: feature, isPending: loadingFeature } = usePlanFeature(id);
  const { data: keyOptions, isPending: loadingKeys } = usePlanFeatureKeys();

  if ((isEditMode && loadingFeature) || loadingKeys) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <PlanFeatureForm
      // Remount if the route switches to another feature.
      key={isEditMode ? `feature-${id}` : "new-feature"}
      feature={isEditMode ? feature : undefined}
      featureId={id}
      returnTo={returnTo}
      keyOptions={keyOptions ?? []}
    />
  );
}

interface PlanFeatureFormProps {
  feature?: PlanFeatureListItem;
  featureId: number;
  returnTo: string | null;
  keyOptions: PlanFeatureKeyOption[];
}

function PlanFeatureForm({
  feature,
  featureId,
  returnTo,
  keyOptions,
}: PlanFeatureFormProps) {
  const navigate = useNavigate();
  const isEditMode = !!featureId;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showValidationAlert, setShowValidationAlert] = useState(false);

  const { mutateAsync: createFeature, isPending: isCreating } =
    useCreatePlanFeatureMutation(
      returnTo ? { redirectTo: returnTo } : undefined,
    );
  const { mutateAsync: updateFeature, isPending: isUpdating } =
    useUpdatePlanFeatureMutation();
  const { mutateAsync: deleteFeature, isPending: isDeleting } =
    useDeletePlanFeatureMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PlanFeatureFormValues>({
    resolver: zodResolver(planFeatureSchema) as Resolver<PlanFeatureFormValues>,
    defaultValues: feature ? mapFeatureToFormValues(feature) : BLANK_FEATURE,
  });

  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({ control, name: "options" });

  const onInvalid = () => {
    setShowValidationAlert(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = async (values: PlanFeatureFormValues) => {
    setShowValidationAlert(false);
    const payload = {
      nameEn: values.nameEn.trim(),
      // The sentinel (and an empty value) both mean "no capability" — the API
      // enum would reject "" outright.
      featureKey:
        !values.featureKey || values.featureKey === DISPLAY_ONLY_FEATURE_KEY
          ? null
          : (values.featureKey as PlanFeatureKey),
      nameMm: values.nameMm?.trim() || undefined,
      nameTh: values.nameTh?.trim() || undefined,
      descriptionEn: values.descriptionEn?.trim() || undefined,
      descriptionMm: values.descriptionMm?.trim() || undefined,
      descriptionTh: values.descriptionTh?.trim() || undefined,
      options: (values.options ?? []).map((option, index) => ({
        id: option.id,
        textEn: option.textEn.trim(),
        textMm: option.textMm?.trim() || undefined,
        textTh: option.textTh?.trim() || undefined,
        displayOrder: option.displayOrder ?? index,
        isActive: option.isActive ?? true,
      })),
      isActive: values.isActive,
    };

    if (isEditMode) {
      await updateFeature({ id: featureId, payload });
    } else {
      await createFeature(payload);
    }
  };

  const handleDelete = async () => {
    if (!featureId) return;
    await deleteFeature(featureId);
    navigate("/plan-features/manage");
  };

  const handleCopyCode = () => {
    if (!feature?.code) return;
    navigator.clipboard?.writeText(feature.code);
    toast.success("Feature code copied");
  };

  const submitting = isCreating || isUpdating;
  const exitPath = returnTo ?? "/plan-features/manage";
  const exitLabel = returnTo ? "Back to plan" : "Back to features";
  const errorMessages = Object.values(errors)
    .map((error) => error?.message)
    .filter((message): message is string => !!message);

  return (
    <div className="container mx-auto max-w-2xl py-10">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate(exitPath)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {exitLabel}
      </Button>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        <FormValidationAlert
          visible={showValidationAlert}
          messages={errorMessages}
        />

        <PlanFeatureFormCard
          control={control}
          errors={errors}
          isEditMode={isEditMode}
          featureCode={feature?.code}
          onCopyCode={handleCopyCode}
          keyOptions={keyOptions}
          currentFeatureId={featureId || undefined}
          currentFeatureKeyInfo={feature?.featureKeyInfo}
          optionFields={optionFields}
          onAddOption={() =>
            appendOption({ textEn: "", textMm: "", textTh: "", isActive: true })
          }
          onRemoveOption={removeOption}
        />

        <PlanFormActions
          isEditMode={isEditMode}
          submitting={submitting}
          isDeleting={isDeleting}
          submitLabel={isEditMode ? "Save changes" : "Create feature"}
          onDelete={() => setDeleteDialogOpen(true)}
          onCancel={() => navigate(exitPath)}
        />
      </form>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete plan feature"
        description="Plans using this feature must be updated first."
        confirmText="Delete"
        variant="destructive"
        loading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
