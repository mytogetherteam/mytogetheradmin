import { useEffect, useRef, useState } from "react";
import {
  type FieldErrors,
  type Resolver,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  useCreatePlanMutation,
  useDeletePlanMutation,
  usePlan,
  useUpdatePlanMutation,
} from "@/hooks/plans/usePlan";
import {
  usePlanFeatureKeys,
  usePlanFeatures,
} from "@/hooks/plans/usePlanFeature";
import { planSchema, type PlanFormValues } from "@/schemas/plan.schema";
import {
  collectErrorMessages,
  mapPlanToFormValues,
  toPlanPayload,
} from "@/lib/plans/plan-form.utils";
import { FormValidationAlert } from "@/components/common/FormValidationAlert";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { AddPlanFeatureDialog } from "@/components/plans/AddPlanFeatureDialog";
import { PlanFeatureValuesCard } from "@/components/plans/PlanFeatureValuesCard";
import { PlanFormActions } from "@/components/plans/PlanFormActions";
import { PlanFormDetailsCard } from "@/components/plans/PlanFormDetailsCard";
import { PlanHighlightsCard } from "@/components/plans/PlanHighlightsCard";
import { Button } from "@/components/ui/button";

export default function CreatePlan() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const idParam = searchParams.get("id");
  const id = idParam ? parseInt(idParam, 10) : 0;
  const isEditMode = !!id;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addFeatureOpen, setAddFeatureOpen] = useState(false);
  const [showValidationAlert, setShowValidationAlert] = useState(false);
  const [openFeatureValueIds, setOpenFeatureValueIds] = useState<string[]>([]);
  const prevFeatureValueCountRef = useRef(0);

  const { data: plan, isPending: loadingPlan } = usePlan(id);
  const { data: featuresData, isPending: loadingFeatures } = usePlanFeatures({
    page: 1,
    size: 500,
    isActive: true,
  });
  const { mutateAsync: createPlan, isPending: isCreating } =
    useCreatePlanMutation();
  const { mutateAsync: updatePlan, isPending: isUpdating } =
    useUpdatePlanMutation();
  const { mutateAsync: deletePlan, isPending: isDeleting } =
    useDeletePlanMutation();

  const { data: keyOptions } = usePlanFeatureKeys();

  const features = featuresData?.content ?? [];

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema) as Resolver<PlanFormValues>,
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      nameEn: "",
      nameMm: "",
      nameTh: "",
      descriptionEn: "",
      descriptionMm: "",
      descriptionTh: "",
      billingPeriod: "MONTHLY",
      isCustomPricing: false,
      isPopular: false,
      ctaLabel: "GET STARTED",
      isActive: true,
      featureValues: [],
      highlights: [],
    },
  });

  const isCustomPricing = watch("isCustomPricing");
  const featureValues = watch("featureValues") ?? [];

  const {
    fields: highlightFields,
    append: appendHighlight,
    remove: removeHighlight,
  } = useFieldArray({ control, name: "highlights" });

  const {
    fields: featureValueFields,
    append: appendFeatureValue,
    remove: removeFeatureValue,
  } = useFieldArray({ control, name: "featureValues" });

  useEffect(() => {
    if (!isEditMode || !plan) return;
    reset(mapPlanToFormValues(plan));
    setShowValidationAlert(false);
    setOpenFeatureValueIds([]);
    prevFeatureValueCountRef.current = plan.featureValues.length;
  }, [isEditMode, plan, reset]);

  // The dialog's async "create & add" resolves a render behind, so read the
  // catalogue through a ref to get the just-created feature's value type.
  const featuresRef = useRef(features);
  featuresRef.current = features;

  // Rows the admin just added should expand; rows that arrive from the loaded
  // plan must stay collapsed. Counting alone cannot tell them apart, so the
  // click records how many rows it is about to add.
  const pendingOpenCountRef = useRef(0);

  const handleAddFeatures = (featureIds: number[]) => {
    pendingOpenCountRef.current += featureIds.length;
    for (const featureId of featureIds) {
      const feature = featuresRef.current.find((item) => item.id === featureId);
      // A tier label or a "pick N" package has no quantity — starting it at 1
      // would print "Analytic Report 1 · Basic" on the pricing page.
      const isCountBased =
        feature?.featureKeyInfo?.valueType !== "LEVEL" &&
        feature?.featureKeyInfo?.valueType !== "SELECTION";

      appendFeatureValue({
        featureId,
        quantity: isCountBased ? 1 : undefined,
        isUnlimited: false,
        period: "",
        valueLabel: "",
        note: "",
        isChooseAll: false,
        optionIds: [],
        isActive: true,
      });
    }
  };

  /** Wipe the inputs the newly picked feature does not use, so nothing stale saves. */
  const handleFeatureChanged = (index: number, featureId: number) => {
    const feature = featuresRef.current.find((item) => item.id === featureId);
    const valueType = feature?.featureKeyInfo?.valueType;

    if (valueType !== "COUNT") {
      setValue(`featureValues.${index}.quantity`, undefined);
      setValue(`featureValues.${index}.period`, "");
      setValue(`featureValues.${index}.isUnlimited`, false);
    }
    if (valueType !== "SELECTION") {
      setValue(`featureValues.${index}.chooseCount`, undefined);
      setValue(`featureValues.${index}.isChooseAll`, false);
      setValue(`featureValues.${index}.optionIds`, []);
    }
  };

  useEffect(() => {
    const count = featureValueFields.length;
    const previousCount = prevFeatureValueCountRef.current;

    if (count === 0) {
      setOpenFeatureValueIds([]);
      prevFeatureValueCountRef.current = 0;
      return;
    }

    const justAdded = pendingOpenCountRef.current;
    if (justAdded > 0 && count > previousCount) {
      // Expand only the rows this click added, whether one or a batch.
      pendingOpenCountRef.current = 0;
      const addedIds = featureValueFields
        .slice(Math.max(0, count - justAdded))
        .map((field) => field.id);
      setOpenFeatureValueIds((current) => [
        ...current,
        ...addedIds.filter((fieldId) => !current.includes(fieldId)),
      ]);
    } else if (count < previousCount) {
      const validIds = new Set(featureValueFields.map((field) => field.id));
      setOpenFeatureValueIds((current) => current.filter((id) => validIds.has(id)));
    }

    prevFeatureValueCountRef.current = count;
  }, [featureValueFields]);

  const handleRemoveFeatureValue = (index: number, fieldId: string) => {
    removeFeatureValue(index);
    setOpenFeatureValueIds((current) => current.filter((id) => id !== fieldId));
  };

  const handleCopyCode = () => {
    if (!plan?.code) return;
    navigator.clipboard?.writeText(plan.code);
    toast.success("Plan code copied");
  };

  const onInvalid = (fieldErrors: FieldErrors<PlanFormValues>) => {
    setShowValidationAlert(true);
    const messages = collectErrorMessages(fieldErrors);
    if (messages.length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const onSubmit = async (values: PlanFormValues) => {
    setShowValidationAlert(false);
    const payload = toPlanPayload(values, featuresRef.current);
    if (isEditMode) {
      await updatePlan({ id, payload });
    } else {
      await createPlan(payload);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    await deletePlan(id);
    navigate("/plans/manage");
  };

  const submitting = isCreating || isUpdating;
  const errorMessages = collectErrorMessages(errors);

  // Wait for the catalogue too: a row's Feature select renders blank if its
  // value lands before the matching option has mounted.
  if ((isEditMode && loadingPlan) || loadingFeatures) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-10">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate("/plans/manage")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to plans
      </Button>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        <FormValidationAlert
          visible={showValidationAlert}
          messages={errorMessages}
        />

        <PlanFormDetailsCard
          control={control}
          errors={errors}
          isEditMode={isEditMode}
          planCode={plan?.code}
          onCopyCode={handleCopyCode}
          isCustomPricing={isCustomPricing}
        />

        <PlanFeatureValuesCard
          control={control}
          setValue={setValue}
          catalogueFeatures={features}
          featureValueFields={featureValueFields}
          featureValues={featureValues}
          openFeatureValueIds={openFeatureValueIds}
          onOpenFeatureValueIdsChange={setOpenFeatureValueIds}
          onAddFeatureValue={() => setAddFeatureOpen(true)}
          onRemoveFeatureValue={handleRemoveFeatureValue}
          onFeatureChanged={handleFeatureChanged}
        />

        <AddPlanFeatureDialog
          open={addFeatureOpen}
          onOpenChange={setAddFeatureOpen}
          catalogueFeatures={features}
          usedFeatureIds={featureValues.map((item) => item.featureId)}
          keyOptions={keyOptions ?? []}
          onAdd={handleAddFeatures}
        />

        <PlanHighlightsCard
          control={control}
          highlightFields={highlightFields}
          onAddHighlight={() =>
            appendHighlight({ textEn: "", textMm: "", textTh: "" })
          }
          onRemoveHighlight={removeHighlight}
        />

        <PlanFormActions
          isEditMode={isEditMode}
          submitting={submitting}
          isDeleting={isDeleting}
          submitLabel={isEditMode ? "Save changes" : "Create plan"}
          onDelete={() => setDeleteDialogOpen(true)}
          onCancel={() => navigate("/plans/manage")}
        />
      </form>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete plan"
        description="This plan will be soft-deleted."
        confirmText="Delete"
        variant="destructive"
        loading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
