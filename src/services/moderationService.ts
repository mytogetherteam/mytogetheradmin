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

  async getPosts(page = 0, size = 20, _postType?: string, search = ''): Promise<PostsPage> {
    // Prefer socialPostsService — Nest /api/admin/posts uses 1-based pages.
    const { socialPostsService } = await import('./socialPostsService');
    const data = await socialPostsService.getPosts(page, size, search);
    return {
      content: data.content.map((p) => ({
        id: p.id,
        authorName: p.authorName,
        authorId: p.authorId,
        content: p.content,
        imageUrl: p.imageUrl,
        likeCount: p.likeCount,
        commentCount: p.commentCount,
        createdAt: p.createdAt,
        isHidden: p.isHidden,
      })),
      totalElements: data.totalElements,
      totalPages: data.totalPages,
      number: data.number,
    };
  }

  async getComments(page = 0, size = 20, postId?: string, search = ''): Promise<CommentsPage> {
    const { socialPostsService } = await import('./socialPostsService');
    const data = await socialPostsService.getComments(page, size, postId, search);
    return {
      content: data.content.map((c) => ({
        id: c.id,
        authorName: c.authorName,
        authorId: c.authorId,
        content: c.content,
        postId: c.postId,
        postAuthorName: c.postAuthorName,
        createdAt: c.createdAt,
        isHidden: c.isHidden,
      })),
      totalElements: data.totalElements,
      totalPages: data.totalPages,
      number: data.number,
    };
  }

  async deleteComment(id: string): Promise<void> {
    const { socialPostsService } = await import('./socialPostsService');
    await socialPostsService.deleteComment(id);
  }

  async hidePost(id: string): Promise<Post> {
    const { socialPostsService } = await import('./socialPostsService');
    const updated = await socialPostsService.hidePost(id);
    const { mapSocialPostToRow } = await import('./socialPostsService');
    const row = mapSocialPostToRow(updated);
    return {
      id: row.id,
      authorName: row.authorName,
      authorId: row.authorId,
      content: row.content,
      imageUrl: row.imageUrl,
      likeCount: row.likeCount,
      commentCount: row.commentCount,
      createdAt: row.createdAt,
      isHidden: row.isHidden,
    };
  }

  async getPostDetail(id: string): Promise<Post> {
    const { socialPostsService, mapSocialPostToRow } = await import('./socialPostsService');
    const post = await socialPostsService.getPostDetail(id);
    const row = mapSocialPostToRow(post);
    return {
      id: row.id,
      authorName: row.authorName,
      authorId: row.authorId,
      content: row.content,
      imageUrl: row.imageUrl,
      likeCount: row.likeCount,
      commentCount: row.commentCount,
      createdAt: row.createdAt,
      isHidden: row.isHidden,
    };
  }

  async deletePost(id: string): Promise<void> {
    const { socialPostsService } = await import('./socialPostsService');
    await socialPostsService.deletePost(id);
  }

  async banUser(userId: string, reason: string): Promise<void> {
    return apiClient.post<void>(config.endpoints.admin.moderation.banUser(userId), { reason });
  }
}

export const moderationService = new ModerationService();
