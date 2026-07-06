/** Merge duplicate ungrouped buckets and drop empty ungrouped sections. */
export function consolidateUngroupedGroups<T extends {
  isDeleted?: boolean;
  isUngrouped?: boolean;
  displayOrder: number;
}>(
  groups: T[],
  isUngrouped: (group: T) => boolean,
  getVisibleCount: (group: T) => number,
  mergeUngrouped: (primary: T, others: T[]) => T,
): T[] {
  const deleted = groups.filter((group) => group.isDeleted);
  const active = groups.filter((group) => !group.isDeleted);
  const ungrouped = active.filter(isUngrouped);
  const named = active.filter((group) => !isUngrouped(group));

  let mergedUngrouped: T | null = null;
  if (ungrouped.length > 0) {
    mergedUngrouped = mergeUngrouped(ungrouped[0], ungrouped.slice(1));
    if (getVisibleCount(mergedUngrouped) === 0) {
      mergedUngrouped = null;
    }
  }

  let visibleOrder = 1;
  const normalized = [...named, ...(mergedUngrouped ? [mergedUngrouped] : [])].map((group) => ({
    ...group,
    displayOrder: visibleOrder++,
  }));

  return [...normalized, ...deleted];
}

export function hasSavedChildItems<T extends { id?: number; isDeleted?: boolean }>(
  items: T[],
): boolean {
  return items.some((item) => !item.isDeleted && item.id != null);
}

export function shouldConfirmGroupDelete(
  isEditMode: boolean,
  group: { id?: number },
  items: Array<{ id?: number; isDeleted?: boolean }>,
): boolean {
  if (!isEditMode) return false;
  if (group.id != null) return true;
  return hasSavedChildItems(items);
}
