import { apiClient } from './apiClient';
import { config } from '@/config/config';

export type ReportType = 'SHOP' | 'USER' | 'ORDER' | 'POST' | 'COMMENT' | 'BUG_TECHNICAL' | 'OTHER';
export type ReportCategory = 'SPAM' | 'FRAUD_SCAM' | 'HARASSMENT' | 'INAPPROPRIATE_CONTENT' | 'TECHNICAL_ISSUE' | 'MISINFORMATION' | 'POOR_SERVICE' | 'OTHER';
export type ReportStatus = 'OPEN' | 'PENDING' | 'REVIEWED' | 'DISMISSED' | 'ACTION_TAKEN' | 'RESOLVED';

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

export interface UserShopReport {
  id: number;
  targetType: ReportType;
  targetId: number | string;
  category: ReportCategory;
  reporterUserId: number;
  reporterUserName: string | null;
  reportedShopId?: number;
  reportedShopName?: string;
  reportedUserId?: number;
  reportedUserName?: string | null;
  orderId?: number;
  subject: string;
  description: string;
  contentSnippet?: string;
  status: string;
  resolutionNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserShopReportsPage {
  content: UserShopReport[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
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

export interface Comment {
  id: string;
  authorName: string;
  authorId: string;
  content: string;
  postId: string;
  postAuthorName?: string;
  createdAt: string;
  isHidden: boolean;
}

export interface CommentsPage {
  content: Comment[];
  totalElements: number;
  totalPages: number;
  number: number;
}

class ModerationService {
  async getReports(status?: ReportStatus, page = 0, size = 20): Promise<ReportsPage> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) params.append('status', status);
    return apiClient.get<ReportsPage>(`${config.endpoints.admin.moderation.reports}?${params.toString()}`);
  }

  async resolveReport(id: string, status: ReportStatus): Promise<void> {
    return apiClient.put<void>(`${config.endpoints.admin.moderation.resolveReport(id)}?status=${status}`, {});
  }

  async dismissReport(id: string): Promise<void> {
    return apiClient.put<void>(`${config.endpoints.admin.moderation.resolveReport(id)}?status=DISMISSED`, {});
  }

  // --- User/Shop/Unified Reports ---
  async getUserShopReports(
    status?: string, 
    page = 0, 
    size = 20, 
    targetType?: ReportType, 
    category?: ReportCategory,
    search?: string
  ): Promise<UserShopReportsPage> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) params.append('status', status);
    if (targetType) params.append('targetType', targetType);
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    return apiClient.get<UserShopReportsPage>(`${config.endpoints.admin.moderation.userShopReports.list}?${params.toString()}`);
  }

  async updateUserShopReportStatus(id: number, status: string, resolutionNotes?: string): Promise<void> {
    return apiClient.put<void>(config.endpoints.admin.moderation.userShopReports.status(id), { status, resolutionNotes });
  }

  async getPosts(page = 0, size = 20, postType?: string, search = ''): Promise<PostsPage> {
    const params = new URLSearchParams({ 
      page: String(page), 
      size: String(size),
      search: search
    });
    if (postType) params.append('postType', postType);
    return apiClient.get<PostsPage>(`${config.endpoints.admin.moderation.posts}?${params.toString()}`);
  }

  async getComments(page = 0, size = 20, postId?: string, search = ''): Promise<CommentsPage> {
    const params = new URLSearchParams({ 
      page: String(page), 
      size: String(size),
      search: search
    });
    if (postId) params.append('postId', postId);
    return apiClient.get<CommentsPage>(`${config.endpoints.admin.moderation.comments}?${params.toString()}`);
  }

  async deleteComment(id: string): Promise<void> {
    return apiClient.delete<void>(config.endpoints.admin.moderation.commentDetail(id));
  }

  async hidePost(id: string): Promise<Post> {
    return apiClient.put<Post>(config.endpoints.admin.moderation.hidePost(id), {});
  }

  async getPostDetail(id: string): Promise<Post> {
    return apiClient.get<Post>(config.endpoints.admin.moderation.postDetail(id));
  }

  async deletePost(id: string): Promise<void> {
    return apiClient.delete<void>(config.endpoints.admin.moderation.postDetail(id));
  }

  async banUser(userId: string, reason: string): Promise<void> {
    return apiClient.post<void>(config.endpoints.admin.moderation.banUser(userId), { reason });
  }
}

export const moderationService = new ModerationService();
