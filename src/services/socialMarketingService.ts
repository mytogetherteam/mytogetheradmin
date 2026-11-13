import { apiClient } from './apiClient';

export interface SocialPost {
  id: number;
  scheduledDate: string;
  scheduledSlot: 'morning' | 'noon' | 'evening';
  scheduledTime: string;
  weekLabel: string;
  category: string;
  caption: string;
  hashtags?: string;
  status: 'draft' | 'published' | 'partial' | 'scheduled';
  publishedToFb: boolean;
  publishedToApp: boolean;
  facebookPostId?: string;
  facebookPostUrl?: string;
  appPostId?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyCalendarResponse {
  weekLabel: string;
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  days: Record<string, SocialPost[]>;
}

export interface PublishResult {
  success: boolean;
  facebook?: { posted: boolean; postId?: string; postUrl?: string; isScheduled?: boolean; error?: string };
  mytogether?: { posted: boolean; postId?: string | number; error?: string };
}

export const socialMarketingService = {
  /** Generate a 1-week AI content calendar (21 posts) */
  async generateCalendar(startDate?: string): Promise<{
    weekLabel: string;
    created: number;
    skipped: number;
    posts: SocialPost[];
  }> {
    return apiClient.post('/api/admin/social-marketing/calendar/generate', { startDate });
  },

  /** Get a week's content calendar grouped by day */
  async getCalendar(week?: string): Promise<WeeklyCalendarResponse> {
    const url = week
      ? `/api/admin/social-marketing/calendar?week=${encodeURIComponent(week)}`
      : '/api/admin/social-marketing/calendar';
    return apiClient.get(url);
  },

  /** List available week labels */
  async getWeeks(): Promise<string[]> {
    return apiClient.get('/api/admin/social-marketing/calendar/weeks');
  },

  /** Get single post details */
  async getPost(id: number): Promise<SocialPost> {
    return apiClient.get(`/api/admin/social-marketing/posts/${id}`);
  },

  /** Edit post caption, hashtags, time or category directly from form */
  async updatePost(
    id: number,
    data: {
      caption?: string;
      hashtags?: string;
      scheduledTime?: string;
      category?: string;
    },
  ): Promise<SocialPost> {
    return apiClient.patch(`/api/admin/social-marketing/posts/${id}`, data);
  },

  /** Regenerate caption with Gemini AI */
  async regenerateCaption(id: number): Promise<SocialPost> {
    return apiClient.post(`/api/admin/social-marketing/posts/${id}/regenerate-caption`);
  },

  /** Publish post directly from in-memory image buffer */
  async publishPost(id: number, formData: FormData): Promise<PublishResult> {
    return apiClient.post(`/api/admin/social-marketing/posts/${id}/publish`, formData);
  },

  /** Delete single post */
  async deletePost(id: number): Promise<void> {
    return apiClient.delete(`/api/admin/social-marketing/posts/${id}`);
  },

  /** Delete an entire week's schedule */
  async deleteWeek(week: string): Promise<{ deleted: number }> {
    return apiClient.delete(`/api/admin/social-marketing/calendar/${encodeURIComponent(week)}`);
  },
};

