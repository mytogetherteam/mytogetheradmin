import {
  Controller,
  type Control,
  type FieldArrayWithId,
  type UseFormSetValue,
} from "react-hook-form";
import { ChevronDown, Plus, Trash2 } from "lucide-react";

import {
  formatChooseLabel,
  formatFeatureValueSummary,
  resolveOfferedOptions,
  resolvePlanFeatureName,
} from "@/lib/plans/plan-form.utils";
import {
  NO_PERIOD,
  PLAN_FEATURE_PERIODS,
  PLAN_FEATURE_PERIOD_LABELS,
  type PlanFeatureValueFormValues,
  type PlanFormValues,
} from "@/schemas/plan.schema";
import type { PlanFeatureListItem } from "@/services/planService";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

interface PlanFeatureValuesCardProps {
  control: Control<PlanFormValues>;
  setValue: UseFormSetValue<PlanFormValues>;
  catalogueFeatures: PlanFeatureListItem[];
  featureValueFields: FieldArrayWithId<PlanFormValues, "featureValues", "id">[];
  featureValues: PlanFeatureValueFormValues[];
  openFeatureValueIds: string[];
  onOpenFeatureValueIdsChange: (ids: string[]) => void;
  onAddFeatureValue: () => void;
  onRemoveFeatureValue: (index: number, fieldId: string) => void;
  /** Lets the page drop values that no longer apply to the newly picked feature. */
  onFeatureChanged: (index: number, featureId: number) => void;
}

export function PlanFeatureValuesCard({
  control,
  setValue,
  catalogueFeatures,
  featureValueFields,
  featureValues,
  openFeatureValueIds,
  onOpenFeatureValueIdsChange,
  onAddFeatureValue,
  onRemoveFeatureValue,
  onFeatureChanged,
}: PlanFeatureValuesCardProps) {
  const hasCatalogue = catalogueFeatures.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Feature values</CardTitle>
            <CardDescription>
              Quotas and tiers from the feature catalogue (Boosting, Flash Drop,
              …).
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onAddFeatureValue}>
            <Plus className="mr-2 h-4 w-4" />
            Add feature
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {featureValueFields.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {hasCatalogue
              ? 'No features yet. Use "Add feature" to pick from the catalogue — or create a new one right there.'
              : 'The catalogue is empty. "Add feature" lets you create your first one without leaving this plan.'}
          </p>
        ) : (
          <Accordion
            type="multiple"
            value={openFeatureValueIds}
            onValueChange={onOpenFeatureValueIdsChange}
            className="space-y-2"
          >
            {featureValueFields.map((field, index) => {
              const value = featureValues[index];
              const featureName = resolvePlanFeatureName(
                value?.featureId ?? 0,
                catalogueFeatures,
              );
              const summary = value
                ? formatFeatureValueSummary(value, catalogueFeatures)
                : "No quota set";
              const selectedFeature = catalogueFeatures.find(
                (feature) => feature.id === value?.featureId,
              );
              const catalogueOptions =
                selectedFeature?.options.filter((option) => option.isActive) ??
                [];
              const offeredOptions = resolveOfferedOptions(
                value,
                catalogueFeatures,
              );
              const chooseLabel = formatChooseLabel(
                value,
                offeredOptions.length,
              );
              // Only a COUNT capability has an amount to burn through. A LEVEL
              // (Analytic Report — Basic), a SELECTION package and a display-only
              // row have no number, so those inputs are hidden rather than left
              // to collect a value nothing would read.
              const valueType = selectedFeature?.featureKeyInfo?.valueType;
              const showsQuantity = valueType === "COUNT";

              return (
                <AccordionItem
                  key={field.id}
                  value={field.id}
                  className="rounded-lg border px-4"
                >
                  <AccordionTrigger className="group py-4 hover:no-underline [&>svg]:hidden">
                    <div className="flex w-full items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 flex-col gap-1 text-left sm:flex-row sm:items-center sm:gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{featureName}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {summary}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          {value?.isUnlimited ? (
                            <Badge variant="secondary">Unlimited</Badge>
                          ) : null}
                          {chooseLabel ? (
                            <Badge variant="secondary">{chooseLabel}</Badge>
                          ) : null}
                          <Badge variant="outline">#{index + 1}</Badge>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`Remove ${featureName}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveFeatureValue(index, field.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-3 pb-4 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <Label>Feature</Label>
                        <Controller
                          name={`featureValues.${index}.featureId`}
                          control={control}
                          render={({ field: featureField }) => (
                            <Select
                              value={String(featureField.value || "")}
                              onValueChange={(next) => {
                                const nextId = parseInt(next, 10);
                                featureField.onChange(nextId);
                                onFeatureChanged(index, nextId);
                              }}
                            >
                              <SelectTrigger hideClear>
                                <SelectValue placeholder="Select feature" />
                              </SelectTrigger>
                              <SelectContent>
                                {/* Features used by other rows are hidden — a plan
                                    can only hold one row per feature. */}
                                {catalogueFeatures
                                  .filter(
                                    (feature) =>
                                      feature.id === value?.featureId ||
                                      !featureValues.some(
                                        (other, otherIndex) =>
                                          otherIndex !== index &&
                                          other.featureId === feature.id,
                                      ),
                                  )
                                  .map((feature) => (
                                    <SelectItem
                                      key={feature.id}
                                      value={String(feature.id)}
                                    >
                                      {feature.nameEn} ({feature.code})
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        <p className="text-xs text-muted-foreground">
                          {selectedFeature?.featureKeyInfo
                            ? `Enforceable — linked to ${selectedFeature.featureKeyInfo.label}. ${selectedFeature.featureKeyInfo.description}`
                            : "Display only — this quota shows on the pricing page but the app does not check it. Link a capability on the feature to make it enforceable."}
                        </p>
                      </div>
                      {showsQuantity ? (
                        <>
                          <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Controller
                              name={`featureValues.${index}.quantity`}
                              control={control}
                              render={({ field: qtyField }) => {
                                const isUnlimited =
                                  !!featureValues[index]?.isUnlimited;
                                return (
                                  <Input
                                    type="number"
                                    min={0}
                                    disabled={isUnlimited}
                                    value={
                                      isUnlimited ? "" : (qtyField.value ?? "")
                                    }
                                    placeholder={
                                      isUnlimited ? "Unlimited" : undefined
                                    }
                                    onChange={(e) => {
                                      const next = e.target.value;
                                      qtyField.onChange(
                                        next === "" ? undefined : Number(next),
                                      );
                                    }}
                                  />
                                );
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Resets</Label>
                            <Controller
                              name={`featureValues.${index}.period`}
                              control={control}
                              render={({ field: periodField }) => (
                                <Select
                                  value={periodField.value || NO_PERIOD}
                                  onValueChange={(next) =>
                                    // The sentinel means "no window" — the
                                    // allowance covers the whole billing cycle.
                                    periodField.onChange(
                                      next === NO_PERIOD ? "" : next,
                                    )
                                  }
                                >
                                  <SelectTrigger hideClear>
                                    <SelectValue>
                                      {
                                        PLAN_FEATURE_PERIOD_LABELS[
                                          periodField.value || NO_PERIOD
                                        ]
                                      }
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={NO_PERIOD}>
                                      {PLAN_FEATURE_PERIOD_LABELS[NO_PERIOD]}
                                    </SelectItem>
                                    {PLAN_FEATURE_PERIODS.map((period) => (
                                      <SelectItem key={period} value={period}>
                                        {PLAN_FEATURE_PERIOD_LABELS[period]}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                            <p className="text-xs text-muted-foreground">
                              {featureValues[index]?.period
                                ? `Shows as "×${featureValues[index]?.quantity ?? "N"}/${featureValues[index]?.period}" and resets every ${featureValues[index]?.period}.`
                                : "The whole quantity is available for the billing cycle."}
                            </p>
                          </div>
                        </>
                      ) : null}
                      <div className="space-y-2">
                        <Label>Value label</Label>
                        <Controller
                          name={`featureValues.${index}.valueLabel`}
                          control={control}
                          render={({ field: labelField }) => (
                            <Input
                              placeholder="Basic / Mid / Super"
                              {...labelField}
                            />
                          )}
                        />
                        {valueType === "LEVEL" ? (
                          <p className="text-xs text-muted-foreground">
                            This is the grade shown on the pricing page — e.g.
                            &quot;Analytic Report - Basic&quot;.
                          </p>
                        ) : null}
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Note</Label>
                        <Controller
                          name={`featureValues.${index}.note`}
                          control={control}
                          render={({ field: noteField }) => (
                            <Input
                              placeholder="Note...."
                              {...noteField}
                            />
                          )}
                        />
                      </div>
                      {showsQuantity ? (
                        <div className="md:col-span-2">
                          <Controller
                            name={`featureValues.${index}.isUnlimited`}
                            control={control}
                            render={({ field: unlimitedField }) => (
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={!!unlimitedField.value}
                                  onCheckedChange={(checked) => {
                                    unlimitedField.onChange(checked);
                                    if (checked) {
                                      setValue(
                                        `featureValues.${index}.quantity`,
                                        undefined,
                                      );
                                    }
                                  }}
                                />
                                <Label>Unlimited</Label>
                              </div>
                            )}
                          />
                        </div>
                      ) : null}

                      {catalogueOptions.length > 0 ? (
                        <div className="space-y-3 rounded-lg border p-3 md:col-span-2">
                          <div>
                            <Label>Package options</Label>
                            <p className="text-xs text-muted-foreground">
                              Tick the options this plan offers — leave all
                              unticked to offer the full list. Qty is what
                              <em> this plan </em>gives; blank uses the option's
                              own amount.
                            </p>
                          </div>

                          <Controller
                            name={`featureValues.${index}.options`}
                            control={control}
                            render={({ field: optionsField }) => {
                              const selected = optionsField.value ?? [];
                              const selectedById = new Map(
                                selected.map((item) => [item.optionId, item]),
                              );
                              return (
                                <div className="space-y-2">
                                  {catalogueOptions.map((option) => {
                                    const picked = selectedById.get(option.id);
                                    const checked = !!picked;
                                    return (
                                      <div
                                        key={option.id}
                                        className="flex items-start gap-2"
                                      >
                                        <Checkbox
                                          id={`fv-${index}-opt-${option.id}`}
                                          checked={checked}
                                          onCheckedChange={(next) => {
                                            optionsField.onChange(
                                              next === true
                                                ? [
                                                    ...selected,
                                                    { optionId: option.id },
                                                  ]
                                                : selected.filter(
                                                    (item) =>
                                                      item.optionId !== option.id,
                                                  ),
                                            );
                                          }}
                                        />
                                        <Label
                                          htmlFor={`fv-${index}-opt-${option.id}`}
                                          className="flex-1 text-sm font-normal leading-snug"
                                        >
                                          {option.textEn}
                                        </Label>
                                        {/* Per-plan amount: Starter may give 1
                                            Facebook post where Pro gives 4. */}
                                        <Input
                                          type="number"
                                          min={1}
                                          className="h-8 w-20 shrink-0"
                                          disabled={!checked}
                                          placeholder={
                                            option.quantity != null
                                              ? `${option.quantity}`
                                              : "—"
                                          }
                                          value={picked?.quantity ?? ""}
                                          onChange={(e) => {
                                            const raw = e.target.value;
                                            const quantity =
                                              raw === "" ? undefined : Number(raw);
                                            optionsField.onChange(
                                              selected.map((item) =>
                                                item.optionId === option.id
                                                  ? { ...item, quantity }
                                                  : item,
                                              ),
                                            );
                                          }}
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            }}
                          />

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Choose how many</Label>
                              <Controller
                                name={`featureValues.${index}.chooseCount`}
                                control={control}
                                render={({ field: chooseField }) => {
                                  const isChooseAll =
                                    !!featureValues[index]?.isChooseAll;
                                  return (
                                    <Input
                                      type="number"
                                      min={1}
                                      max={offeredOptions.length}
                                      disabled={isChooseAll}
                                      placeholder={isChooseAll ? "All" : "2"}
                                      value={
                                        isChooseAll
                                          ? ""
                                          : (chooseField.value ?? "")
                                      }
                                      onChange={(e) => {
                                        const next = e.target.value;
                                        chooseField.onChange(
                                          next === "" ? undefined : Number(next),
                                        );
                                      }}
                                    />
                                  );
                                }}
                              />
                            </div>
                            <div className="flex items-end pb-2">
                              <Controller
                                name={`featureValues.${index}.isChooseAll`}
                                control={control}
                                render={({ field: allField }) => (
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={!!allField.value}
                                      onCheckedChange={(checked) => {
                                        allField.onChange(checked);
                                        if (checked) {
                                          setValue(
                                            `featureValues.${index}.chooseCount`,
                                            undefined,
                                          );
                                        }
                                      }}
                                    />
                                    <Label>All options included</Label>
                                  </div>
                                )}
                              />
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground">
                            {chooseLabel
                              ? `Pricing page shows: ${featureName.split(" (")[0]} ${chooseLabel} — ${offeredOptions.length} option(s) offered`
                              : `${offeredOptions.length} option(s) offered, no "Choose N" label`}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
