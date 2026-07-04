import type { MenuItem } from "@/services/menuService";
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

function mapOptionRow(option: OptionResponse): OptionRow {
  return {
    id: option.id,
    nameEn: option.nameEn || option.name_en || "",
    nameMm: option.nameMm || option.name_mm || "",
    nameTh: option.nameTh || option.name_th || "",
    price: option.price ?? 0,
    isAvailable: option.isAvailable ?? option.is_available ?? true,
    displayOrder: option.displayOrder ?? option.display_order ?? 1,
  };
}

export function optionGroupsFromMenuItem(item: MenuItem): OptionGroupRow[] {
  const groups = (item.optionGroups ?? []) as OptionGroupResponse[];
  return groups.map((group, index) => ({
    id: group.id,
    nameEn: group.nameEn || group.name_en || "",
    nameMm: group.nameMm || group.name_mm || "",
    nameTh: group.nameTh || group.name_th || "",
    displayOrder: group.displayOrder ?? group.display_order ?? index + 1,
    isAvailable: group.isAvailable ?? group.is_available ?? true,
    options: (group.options ?? []).map(mapOptionRow),
  }));
}

/** @deprecated Use optionGroupsFromMenuItem */
export function optionGroupsToAddonRows(
  ogList: ReadonlyArray<{ options?: OptionResponse[] }>,
): OptionGroupRow[] {
  return optionGroupsFromMenuItem({ optionGroups: ogList as OptionGroupResponse[] } as MenuItem);
}

function mapVariantRow(v: VariantResponse): VariantRow {
  return {
    id: v.id,
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

/** Groups API variants by variantGroupId for the admin form. */
export function variantGroupsFromApiResponse(
  rows: VariantResponse[],
  apiGroups: VariantGroupResponse[] = [],
): VariantGroupRow[] {
  const groupsById = new Map<number, VariantGroupRow>();

  for (const apiGroup of apiGroups) {
    if (apiGroup.id == null) continue;
    groupsById.set(apiGroup.id, {
      id: apiGroup.id,
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
          id: groupId,
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
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  if (ungrouped.length > 0) {
    grouped.push({
      nameEn: "",
      nameMm: "",
      nameTh: "",
      displayOrder: grouped.length + 1,
      variants: ungrouped,
    });
  }

  return grouped;
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
