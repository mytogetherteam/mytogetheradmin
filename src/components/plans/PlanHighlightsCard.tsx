import { Controller, type Control, type FieldArrayWithId } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import type { PlanFormValues } from "@/schemas/plan.schema";
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

interface PlanHighlightsCardProps {
  control: Control<PlanFormValues>;
  highlightFields: FieldArrayWithId<PlanFormValues, "highlights", "id">[];
  onAddHighlight: () => void;
  onRemoveHighlight: (index: number) => void;
}

export function PlanHighlightsCard({
  control,
  highlightFields,
  onAddHighlight,
  onRemoveHighlight,
}: PlanHighlightsCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Highlights</CardTitle>
            <CardDescription>
              Marketing bullets such as &quot;Website (QR) for shop menu&quot;.
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onAddHighlight}>
            <Plus className="mr-2 h-4 w-4" />
            Add highlight
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {highlightFields.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No highlights added yet. Use &quot;Add highlight&quot; for pricing
            page bullets.
          </p>
        ) : null}
        {highlightFields.map((field, index) => (
          <div
            key={field.id}
            className="grid gap-3 rounded-lg border p-4 md:grid-cols-3"
          >
            <div className="space-y-2">
              <Label>Text (EN)</Label>
              <Controller
                name={`highlights.${index}.textEn`}
                control={control}
                render={({ field: textField }) => (
                  <Input
                    placeholder="Website (QR) for shop menu"
                    {...textField}
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Text (MM)</Label>
              <Controller
                name={`highlights.${index}.textMm`}
                control={control}
                render={({ field: textField }) => <Input {...textField} />}
              />
            </div>
            <div className="space-y-2">
              <Label>Text (TH)</Label>
              <Controller
                name={`highlights.${index}.textTh`}
                control={control}
                render={({ field: textField }) => <Input {...textField} />}
              />
            </div>
            <div className="flex justify-end md:col-span-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onRemoveHighlight(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
