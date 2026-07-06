import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

let clientKeyCounter = 0;

export function createClientKey(prefix = "row"): string {
  clientKeyCounter += 1;
  return `${prefix}-${clientKeyCounter}-${Date.now()}`;
}

/** Require a small move before drag starts so inputs/buttons stay clickable. */
export function useMenuItemDragSensors() {
  return useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
}

export function reindexDisplayOrder<T extends { isDeleted?: boolean; displayOrder: number }>(
  items: T[],
): T[] {
  let order = 1;
  return items.map((item) => {
    if (item.isDeleted) return item;
    return { ...item, displayOrder: order++ };
  });
}

export function variantGroupDragId(clientKey: string) {
  return `vg:${clientKey}`;
}

export function variantDragId(groupClientKey: string, variantClientKey: string) {
  return `v:${groupClientKey}:${variantClientKey}`;
}

export function optionGroupDragId(clientKey: string) {
  return `og:${clientKey}`;
}

export function optionDragId(groupClientKey: string, optionClientKey: string) {
  return `o:${groupClientKey}:${optionClientKey}`;
}
