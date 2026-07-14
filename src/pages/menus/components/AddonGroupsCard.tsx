import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CreateMenuItemSortableRow } from "@/pages/menus/components/CreateMenuItemSortableRow";
import { createClientKey, useMenuItemDragSensors } from "@/pages/menus/components/menu-item-dnd.util";
import { consolidateUngroupedGroups, shouldConfirmGroupDelete } from "@/pages/menus/components/menu-item-group.util";
import type { OptionGroupRow, OptionRow } from "@/pages/menus/create-menu-item.types";

interface AddonGroupsCardProps {
  optionGroups: OptionGroupRow[];
  onChange: (groups: OptionGroupRow[]) => void;
  isEditMode?: boolean;
}

let _oKeyCounter = 0;
function newOKey(prefix: string) {
  return `${prefix}-new-${++_oKeyCounter}`;
}

function createEmptyOption(displayOrder: number): OptionRow {
  return {
    clientKey: createClientKey("o"),
    _key: newOKey("opt"),
    nameEn: "",
    nameMm: "",
    nameTh: "",
    price: undefined,
    isAvailable: true,
    displayOrder,
  };
}

function createEmptyNamedGroup(displayOrder: number): OptionGroupRow {
  return {
    clientKey: createClientKey("og"),
    _key: newOKey("ogroup"),
    nameEn: "",
    nameMm: "",
    nameTh: "",
    displayOrder,
    isAvailable: true,
    isUngrouped: false,
    options: [createEmptyOption(1)],
  };
}

function createEmptyUngroupedGroup(displayOrder: number): OptionGroupRow {
  return {
    clientKey: createClientKey("og"),
    _key: newOKey("ogroup"),
    nameEn: "",
    nameMm: "",
    nameTh: "",
    displayOrder,
    isAvailable: true,
    isUngrouped: true,
    options: [],
  };
}

function visibleGroups(groups: OptionGroupRow[]) {
  return groups.filter((group) => !group.isDeleted);
}

function visibleOptions(group: OptionGroupRow) {
  return group.options.filter((option) => !option.isDeleted);
}

function isUngroupedGroup(group: OptionGroupRow) {
  return group.isUngrouped === true;
}

function consolidateOptionGroups(groups: OptionGroupRow[]): OptionGroupRow[] {
  return consolidateUngroupedGroups(
    groups,
    isUngroupedGroup,
    (group) => visibleOptions(group).length,
    (primary, others) => ({
      ...primary,
      isUngrouped: true,
      options: [
        ...primary.options,
        ...others.flatMap((group) => group.options),
      ],
    }),
  );
}

function renderableGroups(groups: OptionGroupRow[]) {
  return visibleGroups(groups).filter((group) => {
    if (isUngroupedGroup(group)) {
      return visibleOptions(group).length > 0;
    }
    return true;
  });
}

function findOrCreateUngroupedGroup(groups: OptionGroupRow[]): {
  groups: OptionGroupRow[];
  ungroupedIndex: number;
} {
  const ungroupedIndex = groups.findIndex((group) => !group.isDeleted && isUngroupedGroup(group));
  if (ungroupedIndex >= 0) {
    return { groups, ungroupedIndex };
  }

  const ungrouped = createEmptyUngroupedGroup(groups.length + 1);
  return { groups: [...groups, ungrouped], ungroupedIndex: groups.length };
}

export function AddonGroupsCard({
  optionGroups,
  onChange,
  isEditMode = false,
}: AddonGroupsCardProps) {
  const sensors = useMenuItemDragSensors();
  const displayedGroups = renderableGroups(optionGroups);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteGroupIndex, setPendingDeleteGroupIndex] = useState<number | null>(null);

  const commitGroups = (groups: OptionGroupRow[]) => {
    onChange(consolidateOptionGroups(groups));
  };

  const addGroup = () => {
    commitGroups([...optionGroups, createEmptyNamedGroup(optionGroups.length + 1)]);
  };

  const removeGroupFromState = (groupIndex: number) => {
    commitGroups(
      optionGroups
        .filter((_, i) => i !== groupIndex)
        .map((item, i) => ({ ...item, displayOrder: i + 1 })),
    );
  };

  const softDeleteEntireGroup = (groupIndex: number) => {
    const group = optionGroups[groupIndex];
    if (isEditMode && shouldConfirmGroupDelete(isEditMode, group, group.options)) {
      const next = [...optionGroups];
      next[groupIndex] = {
        ...group,
        isDeleted: true,
        unlinkOptionsOnly: false,
        options: group.options.map((option) =>
          option.id ? { ...option, isDeleted: true } : option,
        ),
      };
      commitGroups(next);
      toast.message("Add-on group removed. Save the item to apply.");
      return;
    }

    removeGroupFromState(groupIndex);
  };

  const unlinkGroupNameOnly = (groupIndex: number) => {
    const group = optionGroups[groupIndex];
    const optionsToMove = visibleOptions(group);

    if (isEditMode && group.id) {
      let next = [...optionGroups];
      const movedKeys = new Set(optionsToMove.map((option) => option._key));

      if (optionsToMove.length > 0) {
        const { groups, ungroupedIndex } = findOrCreateUngroupedGroup(next);
        next = groups;
        const ungrouped = next[ungroupedIndex];
        const baseOrder = visibleOptions(ungrouped).length;
        const movedOptions = optionsToMove.map((option, index) => ({
          ...option,
          displayOrder: baseOrder + index + 1,
        }));
        next[ungroupedIndex] = {
          ...ungrouped,
          options: [...ungrouped.options, ...movedOptions],
        };
      }

      next[groupIndex] = {
        ...group,
        isDeleted: true,
        unlinkOptionsOnly: true,
        options: group.options.filter((option) => !movedKeys.has(option._key)),
      };

      commitGroups(next);
      toast.message("Group name removed. Add-ons kept. Save the item to apply.");
      return;
    }

    if (isEditMode && shouldConfirmGroupDelete(isEditMode, group, group.options)) {
      let next = optionGroups.filter((_, index) => index !== groupIndex);
      if (optionsToMove.length > 0) {
        const { groups, ungroupedIndex } = findOrCreateUngroupedGroup(next);
        next = groups;
        const ungrouped = next[ungroupedIndex];
        const baseOrder = visibleOptions(ungrouped).length;
        const movedOptions = optionsToMove.map((option, index) => ({
          ...option,
          displayOrder: baseOrder + index + 1,
        }));
        next[ungroupedIndex] = {
          ...ungrouped,
          options: [...ungrouped.options, ...movedOptions],
        };
      }
      commitGroups(next);
      toast.message("Group name removed. Add-ons kept. Save the item to apply.");
      return;
    }

    if (optionsToMove.length === 0) {
      removeGroupFromState(groupIndex);
      return;
    }

    const next = [...optionGroups];
    next[groupIndex] = {
      ...group,
      nameEn: "",
      nameMm: "",
      nameTh: "",
    };
    commitGroups(next);
  };

  const promoteToNamedGroup = (groupIndex: number) => {
    const next = [...optionGroups];
    next[groupIndex] = {
      ...next[groupIndex],
      isUngrouped: false,
    };
    commitGroups(next);
  };

  const requestDeleteGroup = (groupIndex: number) => {
    const group = optionGroups[groupIndex];
    if (shouldConfirmGroupDelete(isEditMode, group, group.options)) {
      setPendingDeleteGroupIndex(groupIndex);
      setDeleteDialogOpen(true);
      return;
    }

    softDeleteEntireGroup(groupIndex);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setPendingDeleteGroupIndex(null);
  };

  const handleDeleteEntireGroup = () => {
    if (pendingDeleteGroupIndex == null) return;
    softDeleteEntireGroup(pendingDeleteGroupIndex);
    closeDeleteDialog();
  };

  const handleDeleteGroupNameOnly = () => {
    if (pendingDeleteGroupIndex == null) return;
    unlinkGroupNameOnly(pendingDeleteGroupIndex);
    closeDeleteDialog();
  };

  const updateGroup = (groupIndex: number, updates: Partial<OptionGroupRow>) => {
    const next = [...optionGroups];
    next[groupIndex] = { ...next[groupIndex], ...updates };
    commitGroups(next);
  };

  const addOption = (groupIndex: number) => {
    const next = [...optionGroups];
    const group = next[groupIndex];
    const visibleCount = group.options.filter((option) => !option.isDeleted).length;
    group.options = [...group.options, createEmptyOption(visibleCount + 1)];
    commitGroups(next);
  };

  const softDeleteOption = (groupIndex: number, optionIndex: number) => {
    const group = optionGroups[groupIndex];
    const option = group.options[optionIndex];

    if (isEditMode && option.id) {
      const next = [...optionGroups];
      const options = [...next[groupIndex].options];
      options[optionIndex] = { ...options[optionIndex], isDeleted: true };
      next[groupIndex] = { ...next[groupIndex], options };
      commitGroups(next);
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
    commitGroups(next);
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
    commitGroups(next);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const oldGroupIndex = optionGroups.findIndex((g) => g._key === activeId);
    const newGroupIndex = optionGroups.findIndex((g) => g._key === overId);
    if (oldGroupIndex >= 0 && newGroupIndex >= 0) {
      if (optionGroups[oldGroupIndex]?.isDeleted || optionGroups[newGroupIndex]?.isDeleted) return;
      const moved = arrayMove(optionGroups, oldGroupIndex, newGroupIndex);
      let visibleOrder = 1;
      commitGroups(
        moved.map((group) => ({
          ...group,
          displayOrder: group.isDeleted ? group.displayOrder : visibleOrder++,
        })),
      );
      return;
    }

    for (let groupIndex = 0; groupIndex < optionGroups.length; groupIndex++) {
      const group = optionGroups[groupIndex];
      const visible = group.options
        .map((option, index) => ({ option, index }))
        .filter(({ option }) => !option.isDeleted);

      const oldVisibleIndex = visible.findIndex(({ option }) => option._key === activeId);
      const newVisibleIndex = visible.findIndex(({ option }) => option._key === overId);
      if (oldVisibleIndex < 0 || newVisibleIndex < 0) continue;

      const reordered = arrayMove(visible, oldVisibleIndex, newVisibleIndex);
      const deletedItems = group.options.filter((o) => o.isDeleted);
      const reorderedOptions = reordered.map(({ option }, order) => ({
        ...option,
        displayOrder: order + 1,
      }));

      const next = [...optionGroups];
      next[groupIndex] = { ...group, options: [...reorderedOptions, ...deletedItems] };
      commitGroups(next);
      return;
    }
  };

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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={displayedGroups.map((group) => group._key)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {optionGroups.map((group, groupIndex) => {
                  if (group.isDeleted) return null;
                  if (isUngroupedGroup(group) && visibleOptions(group).length === 0) return null;
                  const options = visibleOptions(group);

                  return (
                    <CreateMenuItemSortableRow
                      key={group._key}
                      id={group._key}
                      className="rounded-xl border bg-card p-4 shadow-sm"
                    >
                      <div className="space-y-4">
                        {!isUngroupedGroup(group) ? (
                          <div className="flex flex-wrap items-start gap-2">
                            <Input
                              className="flex-1 min-w-[140px]"
                              placeholder="Group Name (EN) e.g. Toppings"
                              value={group.nameEn}
                              onChange={(e) => updateGroup(groupIndex, { nameEn: e.target.value })}
                            />
                            <Input
                              className="flex-1 min-w-[140px]"
                              placeholder="Group Name (MM)"
                              value={group.nameMm}
                              onChange={(e) => updateGroup(groupIndex, { nameMm: e.target.value })}
                            />
                            <Input
                              className="flex-1 min-w-[140px]"
                              placeholder="Group Name (TH)"
                              value={group.nameTh}
                              onChange={(e) => updateGroup(groupIndex, { nameTh: e.target.value })}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive shrink-0"
                              onClick={() => requestDeleteGroup(groupIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <div className="flex w-full items-center gap-2">
                              <Label
                                htmlFor={`addon-max-${group._key}`}
                                className="text-xs text-muted-foreground whitespace-nowrap"
                              >
                                Customers can choose up to
                              </Label>
                              <Input
                                id={`addon-max-${group._key}`}
                                type="text"
                                inputMode="numeric"
                                className="w-20"
                                placeholder="∞"
                                value={
                                  group.maxSelection === undefined || group.maxSelection === null
                                    ? ""
                                    : group.maxSelection
                                }
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === "" || /^\d+$/.test(val)) {
                                    updateGroup(groupIndex, {
                                      maxSelection: val === "" ? null : parseInt(val, 10),
                                    });
                                  }
                                }}
                              />
                              <span className="text-xs text-muted-foreground">
                                add-on(s) — leave empty for no limit.
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <Label className="text-sm text-muted-foreground">
                              Add-ons without a group
                            </Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => promoteToNamedGroup(groupIndex)}
                              className="gap-2 h-8"
                            >
                              <Plus className="h-3.5 w-3.5" /> Add group name
                            </Button>
                          </div>
                        )}

                        <div className={`space-y-3 ${isUngroupedGroup(group) ? "" : "border-t pt-3"}`}>
                          <div className="flex items-center justify-between">
                            <Label className="text-sm text-muted-foreground">
                              {isUngroupedGroup(group)
                                ? "Ungrouped add-ons"
                                : "Add-ons in this group"}
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

                          <SortableContext
                            items={options.map((option) => option._key)}
                            strategy={verticalListSortingStrategy}
                          >
                            {options.length === 0 && !isUngroupedGroup(group) ? (
                              <div className="text-sm text-muted-foreground italic">
                                No add-ons in this group yet.
                              </div>
                            ) : options.length > 0 ? (
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
                                              value={
                                                option.price === undefined ||
                                                option.price === null ||
                                                Number.isNaN(option.price)
                                                  ? ""
                                                  : option.price
                                              }
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === "" || /^\d*\.?\d*$/.test(val)) {
                                                  updateOption(groupIndex, optionIndex, {
                                                    price:
                                                      val.trim() === ""
                                                        ? undefined
                                                        : parseFloat(val),
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
                                              id={`addon-avail-${group._key}-${option._key}`}
                                            />
                                            <Label
                                              htmlFor={`addon-avail-${group._key}-${option._key}`}
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
                                            onClick={() => softDeleteOption(groupIndex, optionIndex)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </CreateMenuItemSortableRow>
                                  );
                                })}
                              </div>
                            ) : null}
                          </SortableContext>
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

      <Dialog open={deleteDialogOpen} onOpenChange={(open) => !open && closeDeleteDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete add-on group?</DialogTitle>
            <DialogDescription>
              Choose whether to remove the entire group with all add-ons, or only remove the
              group name and keep the add-ons.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={closeDeleteDialog}>
              Cancel
            </Button>
            <Button type="button" variant="outline" onClick={handleDeleteGroupNameOnly}>
              Only delete group name
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteEntireGroup}>
              Entire group
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
