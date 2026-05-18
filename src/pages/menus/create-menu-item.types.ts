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
}

export interface ItemMediaResponse {
  image_url?: string;
  mediaUrl?: string;
  media_url?: string;
}
