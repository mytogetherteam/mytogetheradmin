import type { MenuItem } from "@/services/menuService";
import { createClientKey } from "@/pages/menus/components/menu-item-dnd.util";
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

// ---------------------------------------------------------------------------
// Option / OptionGroup mappers
// ---------------------------------------------------------------------------

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

export function optionGroupsFromMenuItem(item: MenuItem): OptionGroupRow[] {
  const groups = (item.optionGroups ?? []) as OptionGroupResponse[];
  return groups
    .map((group, index) => ({
      clientKey: createClientKey("og"),
      id: group.id,
      _key: genKey("ogroup", group.id),
      nameEn: group.nameEn || group.name_en || "",
      nameMm: group.nameMm || group.name_mm || "",
      nameTh: group.nameTh || group.name_th || "",
      displayOrder: group.displayOrder ?? group.display_order ?? index + 1,
      isAvailable: group.isAvailable ?? group.is_available ?? true,
      options: (group.options ?? []).map(mapOptionRow).sort(byDisplayOrder),
    }))
    .sort(byDisplayOrder);
}

/** @deprecated Use optionGroupsFromMenuItem */
export function optionGroupsToAddonRows(
  ogList: ReadonlyArray<{ options?: OptionResponse[] }>,
): OptionGroupRow[] {
  return optionGroupsFromMenuItem({ optionGroups: ogList as OptionGroupResponse[] } as MenuItem);
}

// ---------------------------------------------------------------------------
// Variant / VariantGroup mappers
// ---------------------------------------------------------------------------

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

/** Groups API variants by variantGroupId for the admin form. */
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

// ---------------------------------------------------------------------------
// Image helper
// ---------------------------------------------------------------------------

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
