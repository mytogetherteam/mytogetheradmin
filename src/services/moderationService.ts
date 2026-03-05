import { apiClient, ApiResponseData } from './apiClient';

export type ReportType = 'POST' | 'COMMENT' | 'USER' | 'SHOP';
export type ReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';

export interface Report {
  id: string;
  reportType: ReportType;
  targetId: string;
  targetContent?: string;
  reporterName: string;
  reporterId: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
  resolvedAt?: string;
}

export interface ReportsPage {
  content: Report[];
  totalElements: number;
  totalPages: number;
  number: number;
}

export interface Post {
  id: string;
  authorName: string;
  authorId: string;
  content: string;
  imageUrl?: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  isHidden: boolean;
}

export interface PostsPage {
  content: Post[];
  totalElements: number;
  totalPages: number;
  number: number;
}

class ModerationService {
  async getReports(status?: ReportStatus, page = 0, size = 20): Promise<ReportsPage> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) params.append('status', status);
    const response = await apiClient.get<ApiResponseData<ReportsPage>>(`/api/admin/moderation/reports?${params.toString()}`);
    return response.data;
  }

  async resolveReport(id: string, status: ReportStatus): Promise<void> {
    return apiClient.put<void>(`/api/admin/moderation/reports/${id}/resolve?status=${status}`, {});
  }

  async dismissReport(id: string): Promise<void> {
    return apiClient.put<void>(`/api/admin/moderation/reports/${id}/resolve?status=DISMISSED`, {});
  }

  // --- User/Shop Reports ---
  async getUserShopReports(status?: ReportStatus, page = 0, size = 20): Promise<ReportsPage> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) params.append('status', status);
    const response = await apiClient.get<ApiResponseData<ReportsPage>>(`/api/admin/reports?${params.toString()}`);
    return response.data;
  }

  async updateUserShopReportStatus(id: string, status: ReportStatus): Promise<void> {
    return apiClient.put<void>(`/api/admin/reports/${id}/status?status=${status}`, {});
  }

  async getPosts(page = 0, size = 20, postType?: string, search = ''): Promise<PostsPage> {
    const params = new URLSearchParams({ 
      page: String(page), 
      size: String(size),
      search: search
    });
    if (postType) params.append('postType', postType);
    const response = await apiClient.get<ApiResponseData<PostsPage>>(`/api/admin/community/posts?${params.toString()}`);
    return response.data;
  }

  async getComments(page = 0, size = 20, postId?: string, search = ''): Promise<any> {
    const params = new URLSearchParams({ 
      page: String(page), 
      size: String(size),
      search: search
    });
    if (postId) params.append('postId', postId);
    const response = await apiClient.get<ApiResponseData<any>>(`/api/admin/community/comments?${params.toString()}`);
    return response.data;
  }

  async deleteComment(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/admin/community/comments/${id}`);
  }

  async hidePost(id: string): Promise<Post> {
    const response = await apiClient.put<ApiResponseData<Post>>(`/api/admin/community/posts/${id}/hide`, {});
    return response.data;
  }

  async deletePost(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/admin/community/posts/${id}`);
  }

  async banUser(userId: string, reason: string): Promise<void> {
    return apiClient.post<void>(`/api/admin/users/${userId}/ban`, { reason });
  }
}

export const moderationService = new ModerationService();
