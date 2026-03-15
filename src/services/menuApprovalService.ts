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
  categoryId: number;
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
export interface MenuApprovalResponse {
    success: boolean;
    message: string;
    details: string;
    data: MenuApprovalDTO[];
}

export const menuApprovalService = {
  /**
   * Get all pending menu item changes/approvals
   */
  getPendingApprovals: async (): Promise<MenuApprovalDTO[]> => {
    // Some endpoints wrap in data layer, checking generic apiClient behavior
    // If it requires extraction from data, apiClient usually does it if type matches
    const response = await apiClient.get<MenuApprovalDTO[] | { data: MenuApprovalDTO[] }>(config.endpoints.admin.menu.approvals.list);
    
    // Handle both direct array and nested { data: [...] } formats based on apiClient config
    if (Array.isArray(response)) {
        return response;
    } else if (response && 'data' in response && Array.isArray(response.data)) {
        return response.data;
    }
    
    // Fallback if data is returned raw inside a response object (our sample provided)
    return (response as { data?: MenuApprovalDTO[] }).data || [];
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
