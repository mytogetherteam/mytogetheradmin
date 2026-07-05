import type { ComboComponent } from "@/services/menuService";
import type { OptionGroupRow, VariantGroupRow } from "./create-menu-item.types";
import {
  parsePriceInput,
  resolveMenuItemDiscountPayload,
} from "@/lib/menu-item-discount-form.util";

export const MEAL_TYPE_OPTIONS = ["Breakfast", "Lunch", "Dinner", "Other"] as const;
export type MealTypeOption = (typeof MEAL_TYPE_OPTIONS)[number];

function numericFromPriceInput(value: string): number {
  return parsePriceInput(value);
}

function buildOptionRowPayload(
  snapshot: MenuItemSubmitFormSnapshot,
  option: OptionGroupRow["options"][number],
  optionIndex: number,
) {
  return {
    id: snapshot.editingExistingItem ? option.id : undefined,
    name: option.nameEn || "",
    nameEn: option.nameEn || "",
    nameMm: option.nameMm || "",
    nameTh: option.nameTh || "",
    price: option.price || 0,
    displayOrder: option.displayOrder ?? optionIndex + 1,
    isAvailable: option.isAvailable !== false,
    name_en: option.nameEn || "",
    name_mm: option.nameMm || "",
    name_th: option.nameTh || "",
    display_order: option.displayOrder ?? optionIndex + 1,
    is_available: option.isAvailable !== false,
  };
}

function buildOptionGroupRowPayload(
  snapshot: MenuItemSubmitFormSnapshot,
  group: OptionGroupRow,
  groupIndex: number,
) {
  const activeOptions = group.options
    .filter((option) => !option.isDeleted)
    .map((option, optionIndex) => buildOptionRowPayload(snapshot, option, optionIndex));

  const deletedOptions = snapshot.editingExistingItem
    ? group.options
      .filter((option) => option.isDeleted && option.id)
      .map((option) => ({
        id: option.id,
        deleted: true,
        is_deleted: true,
      }))
    : [];

  return {
    id: snapshot.editingExistingItem ? group.id : undefined,
    nameEn: group.nameEn || "",
    nameMm: group.nameMm || "",
    nameTh: group.nameTh || "",
    name_en: group.nameEn || "",
    name_mm: group.nameMm || "",
    name_th: group.nameTh || "",
    displayOrder: group.displayOrder ?? groupIndex + 1,
    display_order: group.displayOrder ?? groupIndex + 1,
    minSelection: 0,
    min_selection: 0,
    maxSelection: 99,
    max_selection: 99,
    isAvailable: group.isAvailable !== false,
    is_available: group.isAvailable !== false,
    options: [...activeOptions, ...deletedOptions],
  };
}

function buildOptionGroupsPayload(snapshot: MenuItemSubmitFormSnapshot) {
  const activeGroups = snapshot.optionGroups.filter((group) => !group.isDeleted);

  return {
    optionGroups: activeGroups.map((group, groupIndex) =>
      buildOptionGroupRowPayload(snapshot, group, groupIndex),
    ),
    deletedOptionGroupIds: snapshot.editingExistingItem
      ? snapshot.optionGroups
        .filter((group) => group.isDeleted && group.id)
        .map((group) => group.id!)
      : [],
  };
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
  optionGroups: OptionGroupRow[];
  variantGroups: VariantGroupRow[];
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

  const optionPayload = buildOptionGroupsPayload(snapshot);
  const variantPayload = buildVariantsPayload(snapshot);
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
    optionGroups: optionPayload.optionGroups,
    option_groups: optionPayload.optionGroups,
    variants: variantPayload.variants,
    ...(variantPayload.deletedVariantGroupIds.length
      ? {
        deletedVariantGroupIds: variantPayload.deletedVariantGroupIds,
        deleted_variant_group_ids: variantPayload.deletedVariantGroupIds,
      }
      : {}),
    ...(optionPayload.deletedOptionGroupIds.length
      ? {
        deletedOptionGroupIds: optionPayload.deletedOptionGroupIds,
        deleted_option_group_ids: optionPayload.deletedOptionGroupIds,
      }
      : {}),
  };
}

function buildVariantRowPayload(
  snapshot: MenuItemSubmitFormSnapshot,
  group: VariantGroupRow,
  variant: VariantGroupRow["variants"][number],
  variantIndex: number,
) {
  return {
    id: snapshot.editingExistingItem ? variant.id : undefined,
    name: variant.nameEn || "",
    nameEn: variant.nameEn || "",
    nameMm: variant.nameMm || "",
    nameTh: variant.nameTh || "",
    price: variant.price || 0,
    isAvailable: variant.isAvailable !== false,
    displayOrder: variant.displayOrder ?? variantIndex,
    name_en: variant.nameEn || "",
    name_mm: variant.nameMm || "",
    name_th: variant.nameTh || "",
    is_available: variant.isAvailable !== false,
    display_order: variant.displayOrder ?? variantIndex,
    ...(snapshot.editingExistingItem && group.id
      ? { variantGroupId: group.id }
      : {}),
    ...(group.nameEn
      ? {
        variantGroupName: group.nameEn,
        variantGroupNameEn: group.nameEn,
      }
      : {}),
    ...(group.nameMm ? { variantGroupNameMm: group.nameMm } : {}),
    ...(group.nameTh ? { variantGroupNameTh: group.nameTh } : {}),
    variant_group_name: group.nameEn || undefined,
    variant_group_name_en: group.nameEn || undefined,
    variant_group_name_mm: group.nameMm || undefined,
    variant_group_name_th: group.nameTh || undefined,
    variant_group_id:
      snapshot.editingExistingItem && group.id ? group.id : undefined,
  };
}

function buildVariantsPayload(snapshot: MenuItemSubmitFormSnapshot) {
  const activeGroups = snapshot.variantGroups.filter((group) => !group.isDeleted);

  if (!snapshot.editingExistingItem) {
    return {
      variants: activeGroups.flatMap((group) =>
        group.variants
          .filter((variant) => !variant.isDeleted)
          .map((variant, variantIndex) =>
            buildVariantRowPayload(snapshot, group, variant, variantIndex),
          ),
      ),
      deletedVariantGroupIds: [] as number[],
    };
  }

  const deletedVariantGroupIds = snapshot.variantGroups
    .filter((group) => group.isDeleted && group.id)
    .map((group) => group.id!);

  const activeVariants = activeGroups.flatMap((group) =>
    group.variants
      .filter((variant) => !variant.isDeleted)
      .map((variant, variantIndex) =>
        buildVariantRowPayload(snapshot, group, variant, variantIndex),
      ),
  );

  const deletedVariants = snapshot.variantGroups.flatMap((group) => {
    if (group.isDeleted && group.id) {
      return [];
    }

    return group.variants
      .filter((variant) => variant.isDeleted && variant.id)
      .map((variant) => ({
        id: variant.id,
        deleted: true,
        is_deleted: true,
      }));
  });

  return {
    variants: [...activeVariants, ...deletedVariants],
    deletedVariantGroupIds,
  };
}
