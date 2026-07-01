import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface PlanFormActionsProps {
  isEditMode: boolean;
  submitting: boolean;
  isDeleting: boolean;
  submitLabel: string;
  onDelete: () => void;
  onCancel: () => void;
}

export function PlanFormActions({
  isEditMode,
  submitting,
  isDeleting,
  submitLabel,
  onDelete,
  onCancel,
}: PlanFormActionsProps) {
  return (
    <div className="flex flex-wrap justify-between gap-3">
      <div>
        {isEditMode ? (
          <Button
            type="button"
            variant="destructive"
            onClick={onDelete}
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
