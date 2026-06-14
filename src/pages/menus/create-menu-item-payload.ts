import type { ComboComponent, Variant } from "@/services/menuService";
import type { AddonRow } from "./create-menu-item.types";
import {
  parsePriceInput,
  resolveMenuItemDiscountPayload,
} from "@/lib/menu-item-discount-form.util";

export const MEAL_TYPE_OPTIONS = ["Breakfast", "Lunch", "Dinner", "Other"] as const;
export type MealTypeOption = (typeof MEAL_TYPE_OPTIONS)[number];

function numericFromPriceInput(value: string): number {
  return parsePriceInput(value);
}

function buildAddonGroupsPayload(addons: AddonRow[], preserveOptionIds: boolean) {
  if (addons.length === 0) return [];

  return [
    {
      nameEn: "",
      nameMm: "",
      nameTh: "",
      displayOrder: 1,
      maxSelection: 99,
      minSelection: 0,
      isRequired: false,
      groupType: "MULTI_SELECT",
      name: "",
      name_en: "",
      name_mm: "",
      name_th: "",
      display_order: 1,
      max_selection: 99,
      min_selection: 0,
      is_required: false,
      group_type: "MULTI_SELECT",
      options: addons.map((opt, i) => ({
        id: preserveOptionIds ? opt.id : undefined,
        name: opt.nameEn,
        nameEn: opt.nameEn,
        nameMm: opt.nameMm,
        nameTh: opt.nameTh,
        price: opt.price || 0,
        displayOrder: i + 1,
        isAvailable: opt.isAvailable,
        name_en: opt.nameEn,
        name_mm: opt.nameMm,
        name_th: opt.nameTh,
        display_order: i + 1,
        is_available: opt.isAvailable,
      })),
    },
  ];
}

export interface MenuItemSubmitFormSnapshot {
  nameEn: string;
  nameMm: string;
  nameTh: string;
  descriptionEn: string;
  descriptionMm: string;
  descriptionTh: string;
  /** List/base price → `menu_item.originalPrice` */
  originalPriceInput: string;
  /** Customer selling price (after discount), not amount off */
  discountPriceInput: string;
  discountPercentageInput: string;
  currency: string;
  categoryId: string;
  shopId: string;
  isVegetarian: boolean;
  isHalal: boolean;
  isAvailable: boolean;
  isCombo: boolean;
  isRecommended: boolean;
  publishPublished: boolean;
  mealTypes: string[];
  tagIds: number[];
  masterCategoryId: string;
  comboComponents: ComboComponent[];
  addons: AddonRow[];
  variants: Variant[];
  editingExistingItem: boolean;
}

/** JSON body for multipart field `data` on POST/PUT /api/admin/items */
export function buildAdminMenuItemDataJson(snapshot: MenuItemSubmitFormSnapshot): Record<string, unknown> {
  const originalNum = numericFromPriceInput(snapshot.originalPriceInput);
  const { discountAmount, discountPercentage } = resolveMenuItemDiscountPayload(
    originalNum,
    snapshot.discountPriceInput,
    snapshot.discountPercentageInput,
  );

  const addonGroupsPayload = buildAddonGroupsPayload(
    snapshot.addons,
    snapshot.editingExistingItem,
  );

  const publish = snapshot.publishPublished ? "PUBLISHED" : "UNPUBLISHED";

  return {
    name: snapshot.nameEn,
    nameEn: snapshot.nameEn,
    name_en: snapshot.nameEn,
    nameMm: snapshot.nameMm || "",
    name_mm: snapshot.nameMm || "",
    nameTh: snapshot.nameTh || "",
    name_th: snapshot.nameTh || "",
    description: snapshot.descriptionEn || "",
    descriptionMm: snapshot.descriptionMm || "",
    description_mm: snapshot.descriptionMm || "",
    descriptionTh: snapshot.descriptionTh || "",
    description_th: snapshot.descriptionTh || "",
    descriptionEn: snapshot.descriptionEn || "",
    description_en: snapshot.descriptionEn || "",
    originalPrice: originalNum,
    original_price: originalNum,
    discountAmount,
    discount_amount: discountAmount,
    discountPercentage,
    discount_percentage: discountPercentage,
    currency: snapshot.currency || "฿",
    menuCategoryId: Number(snapshot.categoryId),
    menu_category_id: Number(snapshot.categoryId),
    categoryId: Number(snapshot.categoryId),
    category_id: Number(snapshot.categoryId),
    shopId: Number(snapshot.shopId),
    shop_id: Number(snapshot.shopId),
    isVegetarian: snapshot.isVegetarian,
    is_vegetarian: snapshot.isVegetarian,
    isHalal: snapshot.isHalal,
    is_halal: snapshot.isHalal,
    isSpicy: false,
    is_spicy: false,
    isAvailable: snapshot.isAvailable,
    is_available: snapshot.isAvailable,
    isCombo: snapshot.isCombo,
    is_combo: snapshot.isCombo,
    isPopular: false,
    is_popular: false,
    isHotDeal: false,
    is_hot_deal: false,
    isRecommended: snapshot.isRecommended,
    is_recommended: snapshot.isRecommended,
    publishStatus: publish,
    publish_status: publish,
    mealTypes: snapshot.mealTypes,
    meal_types: snapshot.mealTypes,
    tagIds: snapshot.tagIds,
    tag_ids: snapshot.tagIds,
    masterCategoryId: snapshot.masterCategoryId ? Number(snapshot.masterCategoryId) : undefined,
    master_category_id: snapshot.masterCategoryId ? Number(snapshot.masterCategoryId) : undefined,
    components: snapshot.isCombo
      ? snapshot.comboComponents.map((c, i) => {
        const row = { ...c, displayOrder: i + 1 };
        if (!snapshot.editingExistingItem) {
          delete (row as { id?: number }).id;
        }
        return row;
      })
      : [],
    optionGroups: addonGroupsPayload,
    option_groups: addonGroupsPayload.map((g) => ({
      name_en: g.name_en,
      name_mm: g.name_mm,
      name_th: g.name_th,
      display_order: g.display_order,
      max_selection: g.max_selection,
      min_selection: g.min_selection,
      is_required: g.is_required,
      group_type: g.group_type,
      options: g.options.map((opt) => ({
        id: opt.id,
        name_en: opt.name_en,
        name_mm: opt.name_mm,
        name_th: opt.name_th,
        price: opt.price,
        display_order: opt.display_order,
        is_available: opt.is_available,
      })),
    })),
    variants: snapshot.variants.map((v) => ({
      id: snapshot.editingExistingItem ? v.id : undefined,
      name: v.nameEn || v.name || "",
      nameEn: v.nameEn || v.name || "",
      nameMm: v.nameMm || "",
      nameTh: v.nameTh || "",
      price: v.price || 0,
      isAvailable: v.isAvailable !== false,
      displayOrder: v.displayOrder || 0,
      name_en: v.nameEn || v.name || "",
      name_mm: v.nameMm || "",
      name_th: v.nameTh || "",
      is_available: v.isAvailable !== false,
      display_order: v.displayOrder || 0,
    })),
  };
}
