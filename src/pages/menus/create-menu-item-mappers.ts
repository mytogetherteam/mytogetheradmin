import type { MenuItem, Variant } from "@/services/menuService";
import type { AddonRow, OptionResponse, VariantResponse, ItemMediaResponse } from "./create-menu-item.types";

/** Accepts API shapes with camelCase and/or snake_case option fields. */
export function optionGroupsToAddonRows(
  ogList: ReadonlyArray<{ options?: OptionResponse[] }>,
): AddonRow[] {
  return ogList.flatMap((g) =>
    (g.options || []).map((o: OptionResponse) => ({
      id: o.id,
      nameEn: o.nameEn || o.name_en || "",
      nameMm: o.nameMm || o.name_mm || "",
      nameTh: o.nameTh || o.name_th || "",
      price: o.price ?? 0,
      isAvailable: o.isAvailable ?? o.is_available ?? true,
    })),
  );
}

export function variantsFromApiResponse(rows: VariantResponse[]): Variant[] {
  return rows.map((v) => ({
    id: v.id,
    nameEn: v.nameEn || v.name_en || "",
    nameMm: v.nameMm || v.name_mm || "",
    nameTh: v.nameTh || v.name_th || "",
    price: v.price ?? 0,
    isAvailable: v.isAvailable ?? v.is_available ?? true,
    displayOrder: v.displayOrder ?? v.display_order ?? 1,
  }));
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
