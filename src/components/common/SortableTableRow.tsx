import type React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { TableRow } from "@/components/ui/table";

export interface SortableRowRenderProps {
  setActivatorNodeRef: (el: HTMLElement | null) => void;
  attributes: ReturnType<typeof useSortable>["attributes"];
  listeners: ReturnType<typeof useSortable>["listeners"];
}

interface SortableTableRowProps {
  id: number | string;
  children: (props: SortableRowRenderProps) => React.ReactNode;
}

export function SortableTableRow({ id, children }: SortableTableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    position: "relative",
    background: isDragging ? "hsl(var(--muted) / 0.5)" : undefined,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      {children({ setActivatorNodeRef, attributes, listeners })}
    </TableRow>
  );
}
