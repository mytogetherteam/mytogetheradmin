import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { OptionGroupRow, OptionRow } from "@/pages/menus/create-menu-item.types";

interface AddonGroupsCardProps {
  optionGroups: OptionGroupRow[];
  onChange: (groups: OptionGroupRow[]) => void;
  isEditMode?: boolean;
}

// Module-level counter for new items that don't yet have a DB id.
let _oKeyCounter = 0;
function newOKey(prefix: string) { return `${prefix}-new-${++_oKeyCounter}`; }

function createEmptyOption(displayOrder: number): OptionRow {
  return {
    _key: newOKey("opt"),
    nameEn: "",
    nameMm: "",
    nameTh: "",
    price: 0,
    isAvailable: true,
    displayOrder,
  };
}

function createEmptyGroup(displayOrder: number): OptionGroupRow {
  return {
    _key: newOKey("ogroup"),
    nameEn: "",
    nameMm: "",
    nameTh: "",
    displayOrder,
    isAvailable: true,
    options: [createEmptyOption(1)],
  };
}

export function AddonGroupsCard({
  optionGroups,
  onChange,
  isEditMode = false,
}: AddonGroupsCardProps) {
  // activationConstraint: require 8px movement before drag, so inputs are not disrupted
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const addGroup = () => {
    onChange([...optionGroups, createEmptyGroup(optionGroups.length + 1)]);
  };

  const softDeleteGroup = (groupIndex: number) => {
    const group = optionGroups[groupIndex];
    if (isEditMode && group.id) {
      const next = [...optionGroups];
      next[groupIndex] = {
        ...group,
        isDeleted: true,
        options: group.options.map((option) =>
          option.id ? { ...option, isDeleted: true } : option,
        ),
      };
      onChange(next);
      toast.message("Add-on group removed. Save the item to apply.");
      return;
    }

    onChange(
      optionGroups
        .filter((_, i) => i !== groupIndex)
        .map((item, i) => ({ ...item, displayOrder: i + 1 })),
    );
  };

  const updateGroup = (groupIndex: number, updates: Partial<OptionGroupRow>) => {
    const next = [...optionGroups];
    next[groupIndex] = { ...next[groupIndex], ...updates };
    onChange(next);
  };

  const addOption = (groupIndex: number) => {
    const next = [...optionGroups];
    const group = next[groupIndex];
    const visibleCount = group.options.filter((option) => !option.isDeleted).length;
    group.options = [...group.options, createEmptyOption(visibleCount + 1)];
    onChange(next);
  };

  const softDeleteOption = (groupIndex: number, optionIndex: number) => {
    const group = optionGroups[groupIndex];
    const option = group.options[optionIndex];

    if (isEditMode && option.id) {
      const next = [...optionGroups];
      const options = [...next[groupIndex].options];
      options[optionIndex] = { ...options[optionIndex], isDeleted: true };
      next[groupIndex] = { ...next[groupIndex], options };
      onChange(next);
      toast.message("Add-on removed. Save the item to apply.");
      return;
    }

    const next = [...optionGroups];
    next[groupIndex] = {
      ...next[groupIndex],
      options: next[groupIndex].options
        .filter((_, i) => i !== optionIndex)
        .map((item, i) => ({ ...item, displayOrder: i + 1 })),
    };
    onChange(next);
  };

  const updateOption = (
    groupIndex: number,
    optionIndex: number,
    updates: Partial<OptionRow>,
  ) => {
    const next = [...optionGroups];
    const options = [...next[groupIndex].options];
    options[optionIndex] = { ...options[optionIndex], ...updates };
    next[groupIndex] = { ...next[groupIndex], options };
    onChange(next);
  };

  const handleGroupDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = optionGroups.findIndex((g) => g._key === active.id);
    const newIndex = optionGroups.findIndex((g) => g._key === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    if (optionGroups[oldIndex]?.isDeleted || optionGroups[newIndex]?.isDeleted) return;

    const moved = arrayMove(optionGroups, oldIndex, newIndex);
    let visibleOrder = 1;
    const result = moved.map((group) => ({
      ...group,
      displayOrder: group.isDeleted ? group.displayOrder : visibleOrder++,
    }));
    onChange(result);
  };

  const handleOptionDragEnd = (groupIndex: number, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const group = optionGroups[groupIndex];
    const visible = group.options
      .map((option, index) => ({ option, index }))
      .filter(({ option }) => !option.isDeleted);

    const oldVisibleIndex = visible.findIndex(({ option }) => option._key === active.id);
    const newVisibleIndex = visible.findIndex(({ option }) => option._key === over.id);
    if (oldVisibleIndex < 0 || newVisibleIndex < 0) return;

    const reordered = arrayMove(visible, oldVisibleIndex, newVisibleIndex);
    const deletedItems = group.options.filter((o) => o.isDeleted);
    const reorderedOptions = reordered.map(({ option }, order) => ({
      ...option,
      displayOrder: order + 1,
    }));
    const nextOptions = [...reorderedOptions, ...deletedItems];

    const next = [...optionGroups];
    next[groupIndex] = { ...group, options: nextOptions };
    onChange(next);
  };

  const displayedGroups = optionGroups.filter((group) => !group.isDeleted);

  return (
    <Card className="border-dashed bg-muted/5">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base">Add-ons</CardTitle>
          <CardDescription>
            Group extras such as Toppings or Sauces, then add choices inside each group.
          </CardDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addGroup} className="gap-2">
          <Plus className="h-4 w-4" /> Add Group
        </Button>
      </CardHeader>
      <CardContent>
        {displayedGroups.length === 0 ? (
          <div className="text-center py-6 border rounded-lg border-dashed text-muted-foreground text-sm">
            No add-on groups added.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleGroupDragEnd}
          >
            <SortableContext
              items={optionGroups
                .filter((group) => !group.isDeleted)
                .map((group) => group._key)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {optionGroups.map((group, groupIndex) => {
                  if (group.isDeleted) return null;
                  const options = group.options.filter((option) => !option.isDeleted);

                  return (
                    <CreateMenuItemSortableRow
                      key={group._key}
                      id={group._key}
                      className="rounded-xl border bg-card p-4 shadow-sm"
                    >
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-start gap-2">
                          <Input
                            className="flex-1 min-w-[140px]"
                            placeholder="Group Name (EN) e.g. Toppings"
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
                              Add-ons in this group
                            </Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addOption(groupIndex)}
                              className="gap-2 h-8"
                            >
                              <Plus className="h-3.5 w-3.5" /> Add add-on
                            </Button>
                          </div>

                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={(event) => handleOptionDragEnd(groupIndex, event)}
                          >
                            <SortableContext
                              items={group.options
                                .filter((option) => !option.isDeleted)
                                .map((option) => option._key)}
                              strategy={verticalListSortingStrategy}
                            >
                              {options.length === 0 ? (
                                <div className="text-sm text-muted-foreground italic">
                                  No add-ons in this group yet.
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {group.options.map((option, optionIndex) => {
                                    if (option.isDeleted) return null;

                                    return (
                                      <CreateMenuItemSortableRow
                                        key={option._key}
                                        id={option._key}
                                      >
                                        <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-muted/20 p-4">
                                          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3 min-w-0">
                                            <div className="space-y-1">
                                              <Label className="text-xs text-muted-foreground">
                                                Name (English)
                                              </Label>
                                              <Input
                                                value={option.nameEn}
                                                onChange={(e) =>
                                                  updateOption(groupIndex, optionIndex, {
                                                    nameEn: e.target.value,
                                                  })
                                                }
                                                placeholder="English"
                                              />
                                            </div>
                                            <div className="space-y-1">
                                              <Label className="text-xs text-muted-foreground">
                                                Name (Myanmar)
                                              </Label>
                                              <Input
                                                value={option.nameMm}
                                                onChange={(e) =>
                                                  updateOption(groupIndex, optionIndex, {
                                                    nameMm: e.target.value,
                                                  })
                                                }
                                                placeholder="Myanmar"
                                              />
                                            </div>
                                            <div className="space-y-1">
                                              <Label className="text-xs text-muted-foreground">
                                                Name (Thai)
                                              </Label>
                                              <Input
                                                value={option.nameTh}
                                                onChange={(e) =>
                                                  updateOption(groupIndex, optionIndex, {
                                                    nameTh: e.target.value,
                                                  })
                                                }
                                                placeholder="Thai"
                                              />
                                            </div>
                                          </div>
                                          <div className="flex flex-wrap items-center gap-3">
                                            <div className="space-y-1 w-32">
                                              <Label className="text-xs text-muted-foreground">
                                                Price
                                              </Label>
                                              <Input
                                                type="text"
                                                inputMode="decimal"
                                                value={option.price === 0 ? "" : option.price}
                                                onChange={(e) => {
                                                  const val = e.target.value;
                                                  if (val === "" || /^\d*\.?\d*$/.test(val)) {
                                                    updateOption(groupIndex, optionIndex, {
                                                      price: parseFloat(val) || 0,
                                                    });
                                                  }
                                                }}
                                              />
                                            </div>
                                            <div className="flex items-center gap-2 pb-1">
                                              <Switch
                                                checked={option.isAvailable}
                                                onCheckedChange={(val) =>
                                                  updateOption(groupIndex, optionIndex, {
                                                    isAvailable: val,
                                                  })
                                                }
                                                id={`addon-avail-${groupIndex}-${optionIndex}`}
                                              />
                                              <Label
                                                htmlFor={`addon-avail-${groupIndex}-${optionIndex}`}
                                                className="text-sm cursor-pointer whitespace-nowrap"
                                              >
                                                Available
                                              </Label>
                                            </div>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon"
                                              className="text-muted-foreground hover:text-destructive shrink-0"
                                              onClick={() =>
                                                softDeleteOption(groupIndex, optionIndex)
                                              }
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
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
