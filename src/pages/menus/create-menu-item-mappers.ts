import type { MenuItem } from "@/services/menuService";
import { createClientKey } from "@/pages/menus/components/menu-item-dnd.util";
import { consolidateUngroupedGroups } from "@/pages/menus/components/menu-item-group.util";
import type {
  OptionGroupResponse,
  OptionGroupRow,
  OptionResponse,
  OptionRow,
  VariantGroupResponse,
  VariantGroupRow,
  VariantResponse,
  VariantRow,
  ItemMediaResponse,
} from "./create-menu-item.types";

/** Module-level counter — generates unique stable keys.
 *  Using the DB id when available means the key survives page-level re-mounts. */
let _keyCounter = 0;
function genKey(prefix: string, id?: number): string {
  if (id != null) return `${prefix}-db-${id}`;
  return `${prefix}-new-${++_keyCounter}`;
}

function mapOptionRow(option: OptionResponse): OptionRow {
  return {
    clientKey: createClientKey("o"),
    id: option.id,
    _key: genKey("opt", option.id),
    nameEn: option.nameEn || option.name_en || "",
    nameMm: option.nameMm || option.name_mm || "",
    nameTh: option.nameTh || option.name_th || "",
    price: option.price ?? 0,
    isAvailable: option.isAvailable ?? option.is_available ?? true,
    displayOrder: option.displayOrder ?? option.display_order ?? 1,
  };
}

const byDisplayOrder = <T extends { displayOrder?: number | null }>(
  a: T,
  b: T,
) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0);

function inferVariantGroupUngrouped(group: VariantGroupRow): boolean {
  if (group.isUngrouped != null) return group.isUngrouped;
  if (group.id) return false;
  if (group.nameEn || group.nameMm || group.nameTh) return false;
  return group.variants.some((variant) => variant.id != null);
}

function inferOptionGroupUngrouped(group: OptionGroupRow): boolean {
  if (group.isUngrouped != null) return group.isUngrouped;
  if (group.id) return false;
  if (group.nameEn || group.nameMm || group.nameTh) return false;
  return group.options.some((option) => option.id != null);
}

function consolidateVariantGroupRows(groups: VariantGroupRow[]): VariantGroupRow[] {
  const normalized = groups.map((group) => ({
    ...group,
    isUngrouped: inferVariantGroupUngrouped(group),
  }));

  return consolidateUngroupedGroups(
    normalized,
    (group) => group.isUngrouped === true,
    (group) => group.variants.filter((variant) => !variant.isDeleted).length,
    (primary, others) => ({
      ...primary,
      isUngrouped: true,
      variants: [
        ...primary.variants,
        ...others.flatMap((group) => group.variants),
      ],
    }),
  );
}

function consolidateOptionGroupRows(groups: OptionGroupRow[]): OptionGroupRow[] {
  const normalized = groups.map((group) => ({
    ...group,
    isUngrouped: inferOptionGroupUngrouped(group),
  }));

  return consolidateUngroupedGroups(
    normalized,
    (group) => group.isUngrouped === true,
    (group) => group.options.filter((option) => !option.isDeleted).length,
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

export function optionGroupsFromApiResponse(
  rows: OptionResponse[],
  apiGroups: OptionGroupResponse[] = [],
): OptionGroupRow[] {
  const groupsById = new Map<number, OptionGroupRow>();

  for (const apiGroup of apiGroups) {
    if (apiGroup.id == null) continue;
    groupsById.set(apiGroup.id, {
      clientKey: createClientKey("og"),
      id: apiGroup.id,
      _key: genKey("ogroup", apiGroup.id),
      nameEn: apiGroup.nameEn || apiGroup.name_en || "",
      nameMm: apiGroup.nameMm || apiGroup.name_mm || "",
      nameTh: apiGroup.nameTh || apiGroup.name_th || "",
      displayOrder: apiGroup.displayOrder ?? apiGroup.display_order ?? 1,
      isAvailable: apiGroup.isAvailable ?? apiGroup.is_available ?? true,
      maxSelection: apiGroup.maxSelection ?? apiGroup.max_selection ?? null,
      options: [],
    });
  }

  const ungrouped: OptionRow[] = [];

  for (const row of rows) {
    const option = mapOptionRow(row);
    const groupId = row.optionGroupId ?? row.option_group_id;
    const embeddedGroup = row.optionGroup ?? row.option_group;

    if (groupId != null) {
      if (!groupsById.has(groupId)) {
        groupsById.set(groupId, {
          clientKey: createClientKey("og"),
          id: groupId,
          _key: genKey("ogroup", groupId),
          nameEn: embeddedGroup?.nameEn || embeddedGroup?.name_en || "",
          nameMm: embeddedGroup?.nameMm || embeddedGroup?.name_mm || "",
          nameTh: embeddedGroup?.nameTh || embeddedGroup?.name_th || "",
          displayOrder: embeddedGroup?.displayOrder ?? embeddedGroup?.display_order ?? 1,
          isAvailable: embeddedGroup?.isAvailable ?? embeddedGroup?.is_available ?? true,
          maxSelection: embeddedGroup?.maxSelection ?? embeddedGroup?.max_selection ?? null,
          options: [],
        });
      }
      groupsById.get(groupId)!.options.push(option);
      continue;
    }

    ungrouped.push(option);
  }

  const grouped = Array.from(groupsById.values())
    .filter((g) => g.options.length > 0 || g.nameEn || g.nameMm || g.nameTh)
    .map((g) => ({ ...g, options: [...g.options].sort(byDisplayOrder) }))
    .sort(byDisplayOrder);

  if (ungrouped.length > 0) {
    grouped.push({
      clientKey: createClientKey("og"),
      _key: genKey("ogroup"),
      nameEn: "",
      nameMm: "",
      nameTh: "",
      displayOrder: grouped.length + 1,
      isAvailable: true,
      isUngrouped: true,
      options: ungrouped.sort(byDisplayOrder),
    });
  }

  return consolidateOptionGroupRows(grouped);
}

export function optionGroupsFromMenuItem(item: MenuItem): OptionGroupRow[] {
  const apiGroups = (item.optionGroups ?? []) as OptionGroupResponse[];
  const flatOptions = (item.options ??
    (item.optionGroups ?? []).flatMap((group) => group.options ?? [])) as OptionResponse[];
  return optionGroupsFromApiResponse(flatOptions, apiGroups);
}

/** @deprecated Use optionGroupsFromMenuItem */
export function optionGroupsToAddonRows(
  ogList: ReadonlyArray<{ options?: OptionResponse[] }>,
): OptionGroupRow[] {
  return optionGroupsFromMenuItem({ optionGroups: ogList as OptionGroupResponse[] } as MenuItem);
}

function mapVariantRow(v: VariantResponse): VariantRow {
  return {
    clientKey: createClientKey("v"),
    id: v.id,
    _key: genKey("var", v.id),
    nameEn: v.nameEn || v.name_en || "",
    nameMm: v.nameMm || v.name_mm || "",
    nameTh: v.nameTh || v.name_th || "",
    price: v.price ?? 0,
    isAvailable: v.isAvailable ?? v.is_available ?? true,
    displayOrder: v.displayOrder ?? v.display_order ?? 1,
  };
}

function mapVariantGroupMeta(
  group?: VariantGroupResponse,
): Pick<VariantGroupRow, "nameEn" | "nameMm" | "nameTh" | "displayOrder"> {
  return {
    nameEn: group?.nameEn || group?.name_en || "",
    nameMm: group?.nameMm || group?.name_mm || "",
    nameTh: group?.nameTh || group?.name_th || "",
    displayOrder: group?.displayOrder ?? group?.display_order ?? 1,
  };
}

export function variantGroupsFromApiResponse(
  rows: VariantResponse[],
  apiGroups: VariantGroupResponse[] = [],
): VariantGroupRow[] {
  const groupsById = new Map<number, VariantGroupRow>();

  for (const apiGroup of apiGroups) {
    if (apiGroup.id == null) continue;
    groupsById.set(apiGroup.id, {
      clientKey: createClientKey("vg"),
      id: apiGroup.id,
      _key: genKey("vgroup", apiGroup.id),
      ...mapVariantGroupMeta(apiGroup),
      variants: [],
    });
  }

  const ungrouped: VariantRow[] = [];

  for (const row of rows) {
    const variant = mapVariantRow(row);
    const groupId = row.variantGroupId ?? row.variant_group_id;
    const embeddedGroup = row.variantGroup ?? row.variant_group;

    if (groupId != null) {
      if (!groupsById.has(groupId)) {
        groupsById.set(groupId, {
          clientKey: createClientKey("vg"),
          id: groupId,
          _key: genKey("vgroup", groupId),
          ...mapVariantGroupMeta(embeddedGroup),
          variants: [],
        });
      }
      groupsById.get(groupId)!.variants.push(variant);
      continue;
    }

    ungrouped.push(variant);
  }

  const grouped = Array.from(groupsById.values())
    .filter((g) => g.variants.length > 0 || g.nameEn || g.nameMm || g.nameTh)
    .map((g) => ({ ...g, variants: [...g.variants].sort(byDisplayOrder) }))
    .sort(byDisplayOrder);

  if (ungrouped.length > 0) {
    grouped.push({
      clientKey: createClientKey("vg"),
      _key: genKey("vgroup"),
      nameEn: "",
      nameMm: "",
      nameTh: "",
      displayOrder: grouped.length + 1,
      isUngrouped: true,
      variants: ungrouped.sort(byDisplayOrder),
    });
  }

  return consolidateVariantGroupRows(grouped);
}

export function variantGroupsFromMenuItem(item: MenuItem): VariantGroupRow[] {
  const apiGroups = (item.variantGroups ?? []) as VariantGroupResponse[];
  return variantGroupsFromApiResponse(item.variants ?? [], apiGroups);
}

export function resolveMenuItemImageUrl(item: MenuItem): string | null {
  const extended = item as MenuItem & ItemMediaResponse;
  return (
    item.imageUrl ||
    extended.image_url ||
    extended.mediaUrl ||
    extended.media_url ||
    null
  );
}
