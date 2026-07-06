export interface OptionGroupResponse {
  id?: number;
  nameEn?: string;
  name_en?: string;
  nameMm?: string;
  name_mm?: string;
  nameTh?: string;
  name_th?: string;
  isAvailable?: boolean;
  is_available?: boolean;
  minSelection?: number;
  min_selection?: number;
  maxSelection?: number;
  max_selection?: number;
  displayOrder?: number;
  display_order?: number;
  options?: OptionResponse[];
}

export interface OptionGroupRow {
  clientKey: string;
  id?: number;
  /** Stable key used as React key and DnD id – assigned at creation/load time, never changes. */
  _key: string;
  nameEn: string;
  nameMm: string;
  nameTh: string;
  displayOrder: number;
  isAvailable: boolean;
  isDeleted?: boolean;
  /** When true with isDeleted, only the group name is removed; options are kept ungrouped. */
  unlinkOptionsOnly?: boolean;
  /** Variants/options kept after removing only the group name. */
  isUngrouped?: boolean;
  options: OptionRow[];
}

export interface OptionRow {
  clientKey: string;
  id?: number;
  /** Stable key used as React key and DnD id – assigned at creation/load time, never changes. */
  _key: string;
  nameEn: string;
  nameMm: string;
  nameTh: string;
  price: number;
  isAvailable: boolean;
  displayOrder: number;
  isDeleted?: boolean;
}

/** @deprecated Use OptionRow */
export interface AddonRow {
  id?: number;
  nameEn: string;
  nameMm: string;
  nameTh: string;
  price: number;
  isAvailable: boolean;
}

export interface CategoryResponse {
  id?: number;
  menuCategoryId?: number;
  categoryId?: number;
  nameEn?: string;
  name?: string;
  nameMm?: string;
  nameTh?: string;
}

export interface TagResponse {
  id?: number;
}

export interface OptionResponse {
  id?: number;
  nameEn?: string;
  name_en?: string;
  nameMm?: string;
  name_mm?: string;
  nameTh?: string;
  name_th?: string;
  price?: number;
  isAvailable?: boolean;
  is_available?: boolean;
  displayOrder?: number;
  display_order?: number;
  linkedMenuItemId?: number;
  linked_menu_item_id?: number;
  optionGroupId?: number | null;
  option_group_id?: number | null;
  optionGroup?: OptionGroupResponse;
  option_group?: OptionGroupResponse;
}

export interface VariantGroupResponse {
  id?: number;
  nameEn?: string;
  name_en?: string;
  nameMm?: string;
  name_mm?: string;
  nameTh?: string;
  name_th?: string;
  displayOrder?: number;
  display_order?: number;
}

export interface VariantResponse {
  id?: number;
  nameEn?: string;
  name_en?: string;
  nameMm?: string;
  name_mm?: string;
  nameTh?: string;
  name_th?: string;
  price?: number;
  isAvailable?: boolean;
  is_available?: boolean;
  displayOrder?: number;
  display_order?: number;
  variantGroupId?: number;
  variant_group_id?: number;
  variantGroup?: VariantGroupResponse;
  variant_group?: VariantGroupResponse;
}

export interface VariantGroupRow {
  clientKey: string;
  id?: number;
  /** Stable key used as React key and DnD id – assigned at creation/load time, never changes. */
  _key: string;
  nameEn: string;
  nameMm: string;
  nameTh: string;
  displayOrder: number;
  isDeleted?: boolean;
  /** When true with isDeleted, only the group name is removed; variants are kept ungrouped. */
  unlinkVariantsOnly?: boolean;
  /** Variants kept after removing only the group name. */
  isUngrouped?: boolean;
  variants: VariantRow[];
}

export interface VariantRow {
  clientKey: string;
  id?: number;
  /** Stable key used as React key and DnD id – assigned at creation/load time, never changes. */
  _key: string;
  nameEn: string;
  nameMm: string;
  nameTh: string;
  price: number;
  isAvailable: boolean;
  displayOrder: number;
  isDeleted?: boolean;
}

export interface ItemMediaResponse {
  image_url?: string;
  mediaUrl?: string;
  media_url?: string;
}
