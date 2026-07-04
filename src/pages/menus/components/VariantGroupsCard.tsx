import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PriceInput } from "@/components/ui/PriceInput";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CreateMenuItemSortableRow } from "@/pages/menus/components/CreateMenuItemSortableRow";
import type { VariantGroupRow, VariantRow } from "@/pages/menus/create-menu-item.types";

interface VariantGroupsCardProps {
  variantGroups: VariantGroupRow[];
  onChange: (groups: VariantGroupRow[]) => void;
  isEditMode?: boolean;
}

function createEmptyVariant(displayOrder: number): VariantRow {
  return {
    nameEn: "",
    nameMm: "",
    nameTh: "",
    price: 0,
    isAvailable: true,
    displayOrder,
  };
}

function createEmptyGroup(displayOrder: number): VariantGroupRow {
  return {
    nameEn: "",
    nameMm: "",
    nameTh: "",
    displayOrder,
    variants: [createEmptyVariant(1)],
  };
}

function visibleGroups(groups: VariantGroupRow[]) {
  return groups.filter((group) => !group.isDeleted);
}

function visibleVariants(group: VariantGroupRow) {
  return group.variants.filter((variant) => !variant.isDeleted);
}

export function VariantGroupsCard({
  variantGroups,
  onChange,
  isEditMode = false,
}: VariantGroupsCardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const displayedGroups = visibleGroups(variantGroups);

  const addGroup = () => {
    onChange([...variantGroups, createEmptyGroup(variantGroups.length + 1)]);
  };

  const softDeleteGroup = (groupIndex: number) => {
    const group = variantGroups[groupIndex];
    if (isEditMode && group.id) {
      const next = [...variantGroups];
      next[groupIndex] = {
        ...group,
        isDeleted: true,
        variants: group.variants.map((variant) =>
          variant.id ? { ...variant, isDeleted: true } : variant,
        ),
      };
      onChange(next);
      toast.message("Variant group removed. Save the item to apply.");
      return;
    }

    onChange(
      variantGroups
        .filter((_, i) => i !== groupIndex)
        .map((item, i) => ({ ...item, displayOrder: i + 1 })),
    );
  };

  const updateGroup = (groupIndex: number, updates: Partial<VariantGroupRow>) => {
    const next = [...variantGroups];
    next[groupIndex] = { ...next[groupIndex], ...updates };
    onChange(next);
  };

  const addVariant = (groupIndex: number) => {
    const next = [...variantGroups];
    const group = next[groupIndex];
    group.variants = [
      ...group.variants,
      createEmptyVariant(visibleVariants(group).length + 1),
    ];
    onChange(next);
  };

  const softDeleteVariant = (groupIndex: number, variantIndex: number) => {
    const group = variantGroups[groupIndex];
    const variant = group.variants[variantIndex];

    if (isEditMode && variant.id) {
      const next = [...variantGroups];
      const variants = [...next[groupIndex].variants];
      variants[variantIndex] = { ...variants[variantIndex], isDeleted: true };
      next[groupIndex] = { ...next[groupIndex], variants };
      onChange(next);
      toast.message("Variant removed. Save the item to apply.");
      return;
    }

    const next = [...variantGroups];
    next[groupIndex] = {
      ...next[groupIndex],
      variants: next[groupIndex].variants
        .filter((_, i) => i !== variantIndex)
        .map((item, i) => ({ ...item, displayOrder: i + 1 })),
    };
    onChange(next);
  };

  const updateVariant = (
    groupIndex: number,
    variantIndex: number,
    updates: Partial<VariantRow>,
  ) => {
    const next = [...variantGroups];
    const variants = [...next[groupIndex].variants];
    variants[variantIndex] = { ...variants[variantIndex], ...updates };
    next[groupIndex] = { ...next[groupIndex], variants };
    onChange(next);
  };

  const handleGroupDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = variantGroups.findIndex((_, i) => `vgroup-${i}` === active.id);
    const newIndex = variantGroups.findIndex((_, i) => `vgroup-${i}` === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    if (variantGroups[oldIndex]?.isDeleted || variantGroups[newIndex]?.isDeleted) return;

    onChange(
      arrayMove(variantGroups, oldIndex, newIndex).map((group, i) => ({
        ...group,
        displayOrder: group.isDeleted ? group.displayOrder : i + 1,
      })),
    );
  };

  const handleVariantDragEnd = (groupIndex: number, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const group = variantGroups[groupIndex];
    const visible = group.variants
      .map((variant, index) => ({ variant, index }))
      .filter(({ variant }) => !variant.isDeleted);

    const oldVisibleIndex = visible.findIndex(
      ({ index }) => `vgroup-${groupIndex}-var-${index}` === active.id,
    );
    const newVisibleIndex = visible.findIndex(
      ({ index }) => `vgroup-${groupIndex}-var-${index}` === over.id,
    );
    if (oldVisibleIndex < 0 || newVisibleIndex < 0) return;

    const reordered = arrayMove(visible, oldVisibleIndex, newVisibleIndex);
    const nextVariants = [...group.variants];
    reordered.forEach(({ index }, order) => {
      nextVariants[index] = {
        ...nextVariants[index],
        displayOrder: order + 1,
      };
    });

    const next = [...variantGroups];
    next[groupIndex] = { ...group, variants: nextVariants };
    onChange(next);
  };

  return (
    <Card className="border-dashed bg-muted/5">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base">Variants</CardTitle>
          <CardDescription>
            Group related options such as Size or Temperature, then add choices inside each group.
          </CardDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addGroup} className="gap-2">
          <Plus className="h-4 w-4" /> Add Group
        </Button>
      </CardHeader>
      <CardContent>
        {displayedGroups.length === 0 ? (
          <div className="text-center py-6 border rounded-lg border-dashed text-muted-foreground text-sm">
            No variant groups added.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleGroupDragEnd}
          >
            <SortableContext
              items={variantGroups
                .map((group, index) => ({ group, index }))
                .filter(({ group }) => !group.isDeleted)
                .map(({ index }) => `vgroup-${index}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {variantGroups.map((group, groupIndex) => {
                  if (group.isDeleted) return null;
                  const variants = visibleVariants(group);

                  return (
                    <CreateMenuItemSortableRow
                      key={`vgroup-${groupIndex}`}
                      id={`vgroup-${groupIndex}`}
                      className="rounded-xl border bg-card p-4 shadow-sm"
                    >
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-start gap-2">
                          <Input
                            className="flex-1 min-w-[140px]"
                            placeholder="Group Name (EN) e.g. Size"
                            value={group.nameEn}
                            onChange={(e) =>
                              updateGroup(groupIndex, { nameEn: e.target.value })
                            }
                          />
                          <Input
                            className="flex-1 min-w-[140px]"
                            placeholder="Group Name (MM)"
                            value={group.nameMm}
                            onChange={(e) =>
                              updateGroup(groupIndex, { nameMm: e.target.value })
                            }
                          />
                          <Input
                            className="flex-1 min-w-[140px]"
                            placeholder="Group Name (TH)"
                            value={group.nameTh}
                            onChange={(e) =>
                              updateGroup(groupIndex, { nameTh: e.target.value })
                            }
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => softDeleteGroup(groupIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-3 border-t pt-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm text-muted-foreground">
                              Choices in this group
                            </Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addVariant(groupIndex)}
                              className="gap-2 h-8"
                            >
                              <Plus className="h-3.5 w-3.5" /> Add Variant
                            </Button>
                          </div>

                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={(event) => handleVariantDragEnd(groupIndex, event)}
                          >
                            <SortableContext
                              items={group.variants
                                .map((variant, index) => ({ variant, index }))
                                .filter(({ variant }) => !variant.isDeleted)
                                .map(({ index }) => `vgroup-${groupIndex}-var-${index}`)}
                              strategy={verticalListSortingStrategy}
                            >
                              {variants.length === 0 ? (
                                <div className="text-sm text-muted-foreground italic">
                                  No variants in this group yet.
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {group.variants.map((variant, variantIndex) => {
                                    if (variant.isDeleted) return null;

                                    return (
                                      <CreateMenuItemSortableRow
                                        key={`vgroup-${groupIndex}-var-${variantIndex}`}
                                        id={`vgroup-${groupIndex}-var-${variantIndex}`}
                                      >
                                        <div className="flex flex-wrap items-center gap-2 bg-muted/20 border p-3 rounded-xl">
                                          <Input
                                            className="flex-1 min-w-[140px]"
                                            placeholder="Variant Name (EN)"
                                            value={variant.nameEn}
                                            onChange={(e) =>
                                              updateVariant(groupIndex, variantIndex, {
                                                nameEn: e.target.value,
                                              })
                                            }
                                          />
                                          <Input
                                            className="flex-1 min-w-[140px]"
                                            placeholder="Variant Name (MM)"
                                            value={variant.nameMm}
                                            onChange={(e) =>
                                              updateVariant(groupIndex, variantIndex, {
                                                nameMm: e.target.value,
                                              })
                                            }
                                          />
                                          <Input
                                            className="flex-1 min-w-[140px]"
                                            placeholder="Variant Name (TH)"
                                            value={variant.nameTh}
                                            onChange={(e) =>
                                              updateVariant(groupIndex, variantIndex, {
                                                nameTh: e.target.value,
                                              })
                                            }
                                          />
                                          <div className="flex items-center gap-1 w-20">
                                            <span className="text-sm font-medium">Order:</span>
                                            <Input
                                              type="text"
                                              inputMode="numeric"
                                              pattern="[0-9]*"
                                              className="h-9 text-sm px-1 text-center"
                                              value={variant.displayOrder}
                                              onFocus={(e) => {
                                                const t = e.target;
                                                setTimeout(() => t.select(), 0);
                                              }}
                                              onChange={(e) => {
                                                const val = e.target.value.replace(/^0+(?!$)/, "");
                                                if (val === "" || /^\d+$/.test(val)) {
                                                  updateVariant(groupIndex, variantIndex, {
                                                    displayOrder: parseInt(val) || 1,
                                                  });
                                                }
                                              }}
                                            />
                                          </div>
                                          <div className="flex items-center gap-1 w-32">
                                            <span className="text-sm font-medium">Price:</span>
                                            <PriceInput
                                              placeholder="0"
                                              value={variant.price}
                                              onValueChange={(val) =>
                                                updateVariant(groupIndex, variantIndex, {
                                                  price: parseFloat(val) || 0,
                                                })
                                              }
                                            />
                                          </div>
                                          <div className="flex items-center gap-2 mx-2">
                                            <Switch
                                              checked={variant.isAvailable}
                                              onCheckedChange={(val) =>
                                                updateVariant(groupIndex, variantIndex, {
                                                  isAvailable: val,
                                                })
                                              }
                                              id={`var-avail-${groupIndex}-${variantIndex}`}
                                            />
                                            <Label
                                              htmlFor={`var-avail-${groupIndex}-${variantIndex}`}
                                              className="text-xs cursor-pointer"
                                            >
                                              Available
                                            </Label>
                                          </div>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive"
                                            onClick={() =>
                                              softDeleteVariant(groupIndex, variantIndex)
                                            }
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </CreateMenuItemSortableRow>
                                    );
                                  })}
                                </div>
                              )}
                            </SortableContext>
                          </DndContext>
                        </div>
                      </div>
                    </CreateMenuItemSortableRow>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}
