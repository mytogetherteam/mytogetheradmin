import { apiClient } from './apiClient';
import { config } from '@/config/config';

export interface MenuItemLightDTO {
  id: number;
  nameEn?: string;
  nameMm?: string;
  price?: number;
  imageUrl?: string;
}

export interface MenuApprovalDTO {
  id: number;
  shopId: number;
  menuItemId?: number;
  nameEn: string;
  nameMm: string;
  nameTh?: string;
  descriptionEn?: string;
  descriptionMm?: string;
  descriptionTh?: string;
  price: number;
  originalPrice?: number;
  discountAmount?: number;
  discountPercentage?: number;
  imageUrl?: string;
  isAvailable: boolean;
  isRecommended?: boolean;
  isHotDeal?: boolean;
  isCombo?: boolean;
  status: string; // "PENDING_APPROVAL", "APPROVED", "REJECTED"
  requestType: string; // "CREATE", "UPDATE", etc.
  masterCategoryId?: number;
  menuCategoryId: number;
  mealTypes?: string;
  tagIds?: string;
  variantsJson?: string;
  optionGroupsJson?: string;
  componentsJson?: string;
  submittedAt: string;
  approvedAt?: string;
  rejectedReason?: string;
  shopName?: string;
}

export interface PaymentApprovalDTO {
  id: number;
  shopId: number;
  status: string; // "PENDING_APPROVAL", "APPROVED", "REJECTED"
  submittedAt: string;
  approvedAt?: string;
  rejectedReason?: string;
  displayOrder?: number;
  // Specific fields based on typical payment approval
  paymentMethodId?: number;
  paymentMethodName?: string | null;
  accountName?: string;
  accountNumber?: string;
  qrImageUrl?: string;
  requestType?: string;
  shopName?: string;
}

export interface CategoryApprovalDTO {
  id: number;
  shopId: number;
  status: string; // "PENDING_APPROVAL", "APPROVED", "REJECTED"
  submittedAt: string;
  approvedAt?: string;
  rejectedReason?: string;
  // Specific fields based on typical category approval
  nameEn?: string;
  nameMm?: string;
  imageUrl?: string;
  requestType?: string;
  shopName?: string;
}

// Keep the array format as per standard MyTogether API patterns, or unwrap directly
// If you use standard pagination later, it might be wrapped in standard PaginatedResponse.
// We'll return just the array for now as specified by your JSON sample structure.
export interface PaginatedResponse<T> {
  content: T[];
  totalElements?: number;
  totalPages?: number;
}

export interface MenuApprovalResponse {
  success: boolean;
  message: string;
  details: string;
  data: MenuApprovalDTO[] | PaginatedResponse<MenuApprovalDTO>;
}

export const menuApprovalService = {
  /**
   * Get all pending menu item changes/approvals
   */
  getPendingApprovals: async (page = 0, size = 20, search = "", shopId?: number): Promise<MenuApprovalDTO[]> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (search) params.append('search', search);
    if (shopId) params.append('shopId', String(shopId));

    const response = await apiClient.get<MenuApprovalDTO[] | PaginatedResponse<MenuApprovalDTO> | { data: PaginatedResponse<MenuApprovalDTO> }>(
      `${config.endpoints.admin.menu.approvals.list}?${params.toString()}`
    );

    if (Array.isArray(response)) {
      return response;
    }

    if (response && typeof response === 'object') {
      if ('data' in response && response.data && 'content' in response.data) {
        return response.data.content;
      }
      if ('content' in response) {
        return response.content;
      }
    }

    return [];
  },

  /**
   * Get a specific menu item change request by ID
   */
  getApprovalById: async (id: number): Promise<MenuApprovalDTO> => {
    return apiClient.get<MenuApprovalDTO>(config.endpoints.admin.menu.approvals.detail(id));
  },

  /**
   * Approve a menu item change request
   */
  approveRequest: async (requestId: number): Promise<void> => {
    return apiClient.post(config.endpoints.admin.menu.approvals.approve(requestId));
  },

  /**
   * Reject a menu item change request
   */
  rejectRequest: async (requestId: number, reason: string): Promise<void> => {
    return apiClient.post(
      `${config.endpoints.admin.menu.approvals.reject(requestId)}?reason=${encodeURIComponent(reason)}`
    );
  },

  /**
   * Get all pending payment change requests
   */
  getPendingPaymentApprovals: async (page = 0, size = 20, search = "", shopId?: number): Promise<PaymentApprovalDTO[]> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (search) params.append('search', search);
    if (shopId) params.append('shopId', String(shopId));

    const response = await apiClient.get<PaymentApprovalDTO[] | PaginatedResponse<PaymentApprovalDTO> | { data: PaginatedResponse<PaymentApprovalDTO> }>(
      `${config.endpoints.admin.menu.approvals.payments.list}?${params.toString()}`
    );

    if (Array.isArray(response)) return response;
    if (response && typeof response === 'object') {
      if ('data' in response && response.data && 'content' in response.data) return response.data.content;
      if ('content' in response) return response.content;
    }
    return [];
  },

  /**
   * Get a specific payment change request by ID
   */
  getPaymentApprovalById: async (id: number): Promise<PaymentApprovalDTO> => {
    return apiClient.get<PaymentApprovalDTO>(config.endpoints.admin.menu.approvals.payments.detail(id));
  },

  /**
   * Approve a payment change request
   */
  approvePaymentRequest: async (requestId: number): Promise<void> => {
    return apiClient.post(config.endpoints.admin.menu.approvals.payments.approve(requestId));
  },

  /**
   * Reject a payment change request
   */
  rejectPaymentRequest: async (requestId: number, reason: string): Promise<void> => {
    return apiClient.post(
      `${config.endpoints.admin.menu.approvals.payments.reject(requestId)}?reason=${encodeURIComponent(reason)}`
    );
  },

  /**
   * Get all pending category change requests
   */
  getPendingCategoryApprovals: async (page = 0, size = 20, search = "", shopId?: number): Promise<CategoryApprovalDTO[]> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (search) params.append('search', search);
    if (shopId) params.append('shopId', String(shopId));

    const response = await apiClient.get<CategoryApprovalDTO[] | PaginatedResponse<CategoryApprovalDTO> | { data: PaginatedResponse<CategoryApprovalDTO> }>(
      `${config.endpoints.admin.menu.approvals.categories.list}?${params.toString()}`
    );

    if (Array.isArray(response)) return response;
    if (response && typeof response === 'object') {
      if ('data' in response && response.data && 'content' in response.data) return response.data.content;
      if ('content' in response) return response.content;
    }
    return [];
  },

  /**
   * Get a specific category change request by ID
   */
  getCategoryApprovalById: async (id: number): Promise<CategoryApprovalDTO> => {
    return apiClient.get<CategoryApprovalDTO>(config.endpoints.admin.menu.approvals.categories.detail(id));
  },

  /**
   * Approve a category change request
   */
  approveCategoryRequest: async (requestId: number): Promise<void> => {
    return apiClient.post(config.endpoints.admin.menu.approvals.categories.approve(requestId));
  },

  /**
   * Reject a category change request
   */
  rejectCategoryRequest: async (requestId: number, reason: string): Promise<void> => {
    return apiClient.post(
      `${config.endpoints.admin.menu.approvals.categories.reject(requestId)}?reason=${encodeURIComponent(reason)}`
    );
  }
};
