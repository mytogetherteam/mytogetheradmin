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
  menuCategoryId: number;
  shopId: number;
  nameEn: string;
  nameMm: string;
  descriptionEn?: string;
  descriptionMm?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  status: string; // "PENDING_APPROVAL", "APPROVED", "REJECTED"
  submittedAt: string;
  approvedAt?: string;
  rejectedReason?: string;
  menuItem?: MenuItemLightDTO;
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
  getPendingApprovals: async (page = 0, size = 20, search = ""): Promise<MenuApprovalDTO[]> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (search) params.append('search', search);

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
  }
};
