import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { GripVertical, Pencil, Trash2 } from "lucide-react";

import type { PlanFeatureListItem } from "@/services/planService";
import { SortableTableRow } from "@/components/common/SortableTableRow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PlanFeaturesTableProps {
  features: PlanFeatureListItem[];
  reordering: boolean;
  onDragEnd: (event: DragEndEvent) => void;
  onEdit: (id: number) => void;
  onDelete: (feature: Pick<PlanFeatureListItem, "id" | "nameEn">) => void;
}

export function PlanFeaturesTable({
  features,
  reordering,
  onDragEnd,
  onEdit,
  onDelete,
}: PlanFeaturesTableProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  return (
    <div className="overflow-x-auto rounded-md border">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Name</TableHead>
              <TableHead>Capability</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Options</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <SortableContext
            items={features.map((feature) => feature.id)}
            strategy={verticalListSortingStrategy}
          >
            <TableBody>
              {features.map((feature) => (
                <SortableTableRow key={feature.id} id={feature.id}>
                  {({ setActivatorNodeRef, attributes, listeners }) => (
                    <>
                      <TableCell className="w-10">
                        <button
                          type="button"
                          ref={setActivatorNodeRef}
                          className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
                          disabled={reordering}
                          aria-label="Drag to reorder"
                          {...attributes}
                          {...listeners}
                        >
                          <GripVertical className="h-4 w-4" />
                        </button>
                      </TableCell>
                      <TableCell className="font-medium">{feature.nameEn}</TableCell>
                      <TableCell>
                        {feature.featureKeyInfo ? (
                          <Badge variant="secondary">
                            {feature.featureKeyInfo.label}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Display only
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{feature.code}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {feature.options?.length
                          ? `${feature.options.length} option${feature.options.length > 1 ? "s" : ""}`
                          : "—"}
                      </TableCell>
                      <TableCell>{feature.displayOrder ?? 0}</TableCell>
                      <TableCell>
                        <Badge
                          variant={feature.isActive ? "default" : "secondary"}
                        >
                          {feature.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => onEdit(feature.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              onDelete({ id: feature.id, nameEn: feature.nameEn })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  )}
                </SortableTableRow>
              ))}
            </TableBody>
          </SortableContext>
        </Table>
      </DndContext>
    </div>
  );
}
