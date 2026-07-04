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
  id?: number;
  nameEn: string;
  nameMm: string;
  nameTh: string;
  displayOrder: number;
  isAvailable: boolean;
  isDeleted?: boolean;
  options: OptionRow[];
}

export interface OptionRow {
  id?: number;
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
  id?: number;
  nameEn: string;
  nameMm: string;
  nameTh: string;
  displayOrder: number;
  isDeleted?: boolean;
  variants: VariantRow[];
}

export interface VariantRow {
  id?: number;
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
