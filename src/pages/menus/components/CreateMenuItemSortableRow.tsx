import type { ReactNode } from "react";
import { GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface CreateMenuItemSortableRowProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export function CreateMenuItemSortableRow({ id, children, className }: CreateMenuItemSortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? ("relative" as const) : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className={className}>
      <div className="flex items-start gap-2">
        <button
          type="button"
          ref={setActivatorNodeRef}
          className="mt-3 shrink-0 cursor-grab touch-none rounded p-0.5 text-muted-foreground/50 hover:text-primary active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
