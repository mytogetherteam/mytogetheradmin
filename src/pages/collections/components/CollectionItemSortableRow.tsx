import { GripVertical, X } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { TableImage } from "@/components/TableImage";

export interface CollectionItemSortableRowProps {
  id: string;
  index: number;
  label: string;
  imageUrl?: string;
  shopName?: string;
  price?: number;
  onRemove: () => void;
}

export function CollectionItemSortableRow({
  id,
  index,
  label,
  imageUrl,
  shopName,
  price,
  onRemove,
}: CollectionItemSortableRowProps) {
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
      className="flex items-center gap-3 rounded-lg border bg-card p-2.5 shadow-sm"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-primary transition-colors"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <span className="w-6 text-center text-xs font-mono text-muted-foreground">
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

      {price !== undefined && (
        <span className="text-sm font-medium tabular-nums whitespace-nowrap">
          {price.toLocaleString()}
        </span>
      )}

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
  );
}
