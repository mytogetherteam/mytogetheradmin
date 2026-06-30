import { useEffect, useState } from "react";
import {
  type FieldErrors,
  type Resolver,
  useForm,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  useCreatePlanFeatureMutation,
  useDeletePlanFeatureMutation,
  usePlanFeature,
  useUpdatePlanFeatureMutation,
} from "@/hooks/plans/usePlanFeature";
import {
  planFeatureSchema,
  type PlanFeatureFormValues,
} from "@/schemas/plan-feature.schema";
import { FormValidationAlert } from "@/components/common/FormValidationAlert";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { PlanFeatureFormCard } from "@/components/plans/PlanFeatureFormCard";
import { PlanFormActions } from "@/components/plans/PlanFormActions";
import { Button } from "@/components/ui/button";

function mapFeatureToFormValues(feature: {
  nameEn: string;
  nameMm: string | null;
  nameTh: string | null;
  isActive: boolean;
}): PlanFeatureFormValues {
  return {
    nameEn: feature.nameEn,
    nameMm: feature.nameMm ?? "",
    nameTh: feature.nameTh ?? "",
    isActive: feature.isActive,
  };
}

export default function CreatePlanFeature() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const idParam = searchParams.get("id");
  const returnTo = searchParams.get("return");
  const id = idParam ? parseInt(idParam, 10) : 0;
  const isEditMode = !!id;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showValidationAlert, setShowValidationAlert] = useState(false);

  const { data: feature, isPending: loadingFeature } = usePlanFeature(id);
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
    reset,
    formState: { errors },
  } = useForm<PlanFeatureFormValues>({
    resolver: zodResolver(planFeatureSchema) as Resolver<PlanFeatureFormValues>,
    defaultValues: {
      nameEn: "",
      nameMm: "",
      nameTh: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (!isEditMode || !feature) return;
    reset(mapFeatureToFormValues(feature));
    setShowValidationAlert(false);
  }, [feature, isEditMode, reset]);

  const onInvalid = (_fieldErrors: FieldErrors<PlanFeatureFormValues>) => {
    setShowValidationAlert(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = async (values: PlanFeatureFormValues) => {
    setShowValidationAlert(false);
    const payload = {
      nameEn: values.nameEn.trim(),
      nameMm: values.nameMm?.trim() || undefined,
      nameTh: values.nameTh?.trim() || undefined,
      isActive: values.isActive,
    };

    if (isEditMode) {
      await updateFeature({ id, payload });
    } else {
      await createFeature(payload);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteFeature(id);
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

  if (isEditMode && loadingFeature) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
