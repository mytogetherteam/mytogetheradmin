import { Controller, type Control, type FieldArrayWithId } from "react-hook-form";
import { ChevronDown, Plus, Trash2 } from "lucide-react";

import {
  formatFeatureValueSummary,
  resolvePlanFeatureName,
} from "@/lib/plans/plan-form.utils";
import type {
  PlanFeatureValueFormValues,
  PlanFormValues,
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
  catalogueFeatures: PlanFeatureListItem[];
  featureValueFields: FieldArrayWithId<PlanFormValues, "featureValues", "id">[];
  featureValues: PlanFeatureValueFormValues[];
  openFeatureValueIds: string[];
  onOpenFeatureValueIdsChange: (ids: string[]) => void;
  onAddFeatureValue: () => void;
  onRemoveFeatureValue: (index: number, fieldId: string) => void;
}

export function PlanFeatureValuesCard({
  control,
  catalogueFeatures,
  featureValueFields,
  featureValues,
  openFeatureValueIds,
  onOpenFeatureValueIdsChange,
  onAddFeatureValue,
  onRemoveFeatureValue,
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
            {hasCatalogue ? "Add feature" : "Create feature"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasCatalogue ? (
          <p className="text-sm text-muted-foreground">
            No plan features in the catalogue yet. Click &quot;Create feature&quot;
            to add one, then come back here to assign quotas for this plan.
          </p>
        ) : featureValueFields.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No features added yet. Use &quot;Add feature&quot; to configure quotas
            for this plan.
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
                ? formatFeatureValueSummary(value)
                : "No quota set";

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
                              onValueChange={(next) =>
                                featureField.onChange(parseInt(next, 10))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select feature" />
                              </SelectTrigger>
                              <SelectContent>
                                {catalogueFeatures.map((feature) => (
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
                      </div>
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Controller
                          name={`featureValues.${index}.quantity`}
                          control={control}
                          render={({ field: qtyField }) => (
                            <Input
                              type="number"
                              min={0}
                              value={qtyField.value ?? ""}
                              onChange={(e) => {
                                const next = e.target.value;
                                qtyField.onChange(
                                  next === "" ? undefined : Number(next),
                                );
                              }}
                            />
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Period</Label>
                        <Controller
                          name={`featureValues.${index}.period`}
                          control={control}
                          render={({ field: periodField }) => (
                            <Input placeholder="day" {...periodField} />
                          )}
                        />
                      </div>
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
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Note</Label>
                        <Controller
                          name={`featureValues.${index}.note`}
                          control={control}
                          render={({ field: noteField }) => (
                            <Input
                              placeholder="Choose 3 districts"
                              {...noteField}
                            />
                          )}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Controller
                          name={`featureValues.${index}.isUnlimited`}
                          control={control}
                          render={({ field: unlimitedField }) => (
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={!!unlimitedField.value}
                                onCheckedChange={unlimitedField.onChange}
                              />
                              <Label>Unlimited</Label>
                            </div>
                          )}
                        />
                      </div>
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
