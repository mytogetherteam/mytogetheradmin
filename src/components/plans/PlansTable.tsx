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

import { formatPlanPrice } from "@/lib/plans/plan-form.utils";
import type { PlanListItem } from "@/services/planService";
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

interface PlansTableProps {
  plans: PlanListItem[];
  reordering: boolean;
  onDragEnd: (event: DragEndEvent) => void;
  onEdit: (id: number) => void;
  onDelete: (plan: Pick<PlanListItem, "id" | "nameEn">) => void;
}

export function PlansTable({
  plans,
  reordering,
  onDragEnd,
  onEdit,
  onDelete,
}: PlansTableProps) {
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
              <TableHead>Plan</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <SortableContext
            items={plans.map((plan) => plan.id)}
            strategy={verticalListSortingStrategy}
          >
            <TableBody>
              {plans.map((plan) => (
                <SortableTableRow key={plan.id} id={plan.id}>
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
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{plan.nameEn}</span>
                          {plan.isPopular ? (
                            <Badge variant="secondary">Most popular</Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{plan.code}</TableCell>
                      <TableCell>{formatPlanPrice(plan)}</TableCell>
                      <TableCell>{plan.displayOrder ?? 0}</TableCell>
                      <TableCell>
                        <Badge variant={plan.isActive ? "default" : "secondary"}>
                          {plan.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => onEdit(plan.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              onDelete({ id: plan.id, nameEn: plan.nameEn })
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
