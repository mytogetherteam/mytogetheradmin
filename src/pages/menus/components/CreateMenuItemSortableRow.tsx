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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className={className}>
      <div className="flex items-start gap-2">
        <div
          {...attributes}
          {...listeners}
          className="mt-3 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-primary transition-colors"
        >
          <GripVertical className="h-5 w-5" />
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
