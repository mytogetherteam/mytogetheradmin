import { GripVertical, X } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableImage } from "@/components/TableImage";
import { cn } from "@/lib/utils";

export type FlashDiscountType = "AMOUNT" | "PERCENT";

export interface FlashEventItemSortableRowProps {
  id: string;
  index: number;
  label: string;
  imageUrl?: string;
  shopName?: string;
  originalPrice?: number;
  /** Edits the MENU ITEM's own discount (empty = no discount). */
  discountType: FlashDiscountType;
  discountValue: string;
  /** Computed selling price after the discount. */
  sellingPrice: number;
  hasDiscount: boolean;
  onTypeChange: (type: FlashDiscountType) => void;
  onValueChange: (value: string) => void;
  onRemove: () => void;
}

export function FlashEventItemSortableRow({
  id,
  index,
  label,
  imageUrl,
  shopName,
  originalPrice,
  discountType,
  discountValue,
  sellingPrice,
  hasDiscount,
  onTypeChange,
  onValueChange,
  onRemove,
}: FlashEventItemSortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border bg-card p-2.5 shadow-sm space-y-2.5"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-primary transition-colors"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <span className="w-5 text-center text-xs font-mono text-muted-foreground">
          {index + 1}
        </span>

        <TableImage src={imageUrl} alt={label} size="md" />

        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{label}</div>
          {shopName && (
            <div className="text-xs text-muted-foreground truncate">
              {shopName}
            </div>
          )}
        </div>

        <div className="text-right whitespace-nowrap">
          {hasDiscount && originalPrice !== undefined && (
            <div className="text-xs text-muted-foreground line-through tabular-nums">
              {originalPrice.toLocaleString()}
            </div>
          )}
          <div
            className={cn(
              "text-sm font-semibold tabular-nums",
              hasDiscount ? "text-emerald-600" : "text-foreground",
            )}
          >
            {sellingPrice.toLocaleString()}
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive shrink-0"
          onClick={onRemove}
          aria-label="Remove item"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Discount editor — writes to the menu item's own discount. */}
      <div className="flex items-center gap-2 flex-wrap pl-8">
        <div className="inline-flex items-center rounded-md border bg-muted/40 p-0.5">
          <button
            type="button"
            onClick={() => onTypeChange("AMOUNT")}
            className={cn(
              "px-2.5 py-1 text-xs rounded transition-colors",
              discountType === "AMOUNT"
                ? "bg-background shadow-sm font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            ฿ Amount
          </button>
          <button
            type="button"
            onClick={() => onTypeChange("PERCENT")}
            className={cn(
              "px-2.5 py-1 text-xs rounded transition-colors",
              discountType === "PERCENT"
                ? "bg-background shadow-sm font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            % Percent
          </button>
        </div>

        <div className="relative">
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            max={discountType === "PERCENT" ? 100 : undefined}
            step="any"
            value={discountValue}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder="No discount"
            className="h-8 w-28 pr-7 text-sm"
          />
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {discountType === "PERCENT" ? "%" : "฿"}
          </span>
        </div>

        <span className="text-xs text-muted-foreground">
          Updates this item's discount everywhere
        </span>
      </div>
    </div>
  );
}
