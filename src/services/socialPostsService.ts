import { apiClient } from './apiClient';
import { config } from '@/config/config';

export type SocialMediaType = 'IMAGE' | 'VIDEO';

export interface SocialPostMedia {
  id: number;
  type: SocialMediaType;
  url: string;
  thumbnailUrl?: string | null;
  duration?: number | null;
  position: number;
}

export interface SocialPostAuthor {
  type: 'USER' | 'SHOP' | 'ADMIN';
  id: number;
  name?: string | null;
  username?: string | null;
  email?: string;
  nameEn?: string;
  nameMm?: string | null;
  profileUrl?: string | null;
  logoUrl?: string | null;
}

export interface SocialPost {
  id: number;
  content: string | null;
  isActive: boolean;
  shopId: number | null;
  userId: number | null;
  createdByAdminId?: number | null;
  createdAt: string;
  updatedAt?: string;
  media: SocialPostMedia[];
  author: SocialPostAuthor | null;
  likeCount: number;
  commentCount: number;
}

/** UI list row shaped for existing Community tables. */
export interface CommunityPostRow {
  id: string;
  authorName: string;
  authorId: string;
  content: string;
  imageUrl?: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  isHidden: boolean;
  mediaCount: number;
}

export interface CommunityCommentRow {
  id: string;
  authorName: string;
  authorId: string;
  content: string;
  postId: string;
  postAuthorName?: string;
  createdAt: string;
  isHidden: boolean;
}

export interface SocialPostsPage {
  content: CommunityPostRow[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface SocialCommentsPage {
  content: CommunityCommentRow[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

function authorLabel(author: SocialPostAuthor | null | undefined): { name: string; id: string } {
  if (!author) return { name: 'Unknown', id: '-' };
  if (author.type === 'SHOP') {
    return {
      name: author.nameEn || author.nameMm || `Shop #${author.id}`,
      id: String(author.id),
    };
  }
  if (author.type === 'ADMIN') {
    return {
      name: author.name || author.username || author.email || `Admin #${author.id}`,
      id: String(author.id),
    };
  }
  return {
    name: author.name || author.username || `User #${author.id}`,
    id: String(author.id),
  };
}

function previewUrl(post: SocialPost): string | undefined {
  const first = post.media?.[0];
  if (!first) return undefined;
  if (first.type === 'VIDEO') return first.thumbnailUrl || first.url;
  return first.url;
}

export function mapSocialPostToRow(post: SocialPost): CommunityPostRow {
  const author = authorLabel(post.author);
  return {
    id: String(post.id),
    authorName: author.name,
    authorId: author.id,
    content: post.content || '',
    imageUrl: previewUrl(post),
    likeCount: post.likeCount ?? 0,
    commentCount: post.commentCount ?? 0,
    createdAt: post.createdAt,
    isHidden: post.isActive === false,
    mediaCount: post.media?.length ?? 0,
  };
}

function mapCommentRow(raw: Record<string, unknown>): CommunityCommentRow {
  const author = (raw.author as SocialPostAuthor | null | undefined) ?? null;
  const label = authorLabel(author);
  return {
    id: String(raw.id),
    authorName: label.name,
    authorId: label.id,
    content: String(raw.content ?? ''),
    postId: String(raw.postId ?? ''),
    postAuthorName: (raw.postAuthorName as string | undefined) || 'Unknown',
    createdAt: String(raw.createdAt ?? ''),
    isHidden: false,
  };
}

/** Capture a poster frame from a video file for Nest `thumbnails` field. */
export async function captureVideoThumbnail(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    let settled = false;
    const cleanup = () => URL.revokeObjectURL(objectUrl);
    const fail = (err: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err instanceof Error ? err : new Error(String(err)));
    };
    const succeed = (fileOut: File) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(fileOut);
    };

    const timer = window.setTimeout(() => {
      fail(new Error(`Timed out capturing thumbnail for "${file.name}"`));
    }, 8000);

    video.onloadeddata = () => {
      try {
        video.currentTime = Math.min(0.1, Number.isFinite(video.duration) ? video.duration : 0);
      } catch {
        // some browsers require seeking after loadedmetadata
      }
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 720;
        canvas.height = video.videoHeight || 1280;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          window.clearTimeout(timer);
          fail(new Error('Could not create canvas for video thumbnail'));
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            window.clearTimeout(timer);
            if (!blob) {
              fail(new Error('Failed to capture video thumbnail'));
              return;
            }
            succeed(
              new File([blob], `${file.name.replace(/\.[^.]+$/, '')}-thumb.jpg`, {
                type: 'image/jpeg',
              }),
            );
          },
          'image/jpeg',
          0.8,
        );
      } catch (err) {
        window.clearTimeout(timer);
        fail(err);
      }
    };

    video.onerror = () => {
      window.clearTimeout(timer);
      fail(new Error(`Failed to load video "${file.name}" for thumbnail`));
    };
  });
}

/**
 * Real JPEG via canvas so Nest/sharp always accepts it. Keeps video↔thumbnail
 * ordinals aligned when frame capture fails (codec/CORS/timeout).
 */
function placeholderThumbnail(name: string): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Could not create placeholder thumbnail canvas'));
      return;
    }
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, 2, 2);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to encode placeholder thumbnail'));
          return;
        }
        resolve(
          new File([blob], `${name}-thumb.jpg`, { type: 'image/jpeg' }),
        );
      },
      'image/jpeg',
      0.8,
    );
  });
}

/** Known-good 1×1 JPEG — last resort so FormData build never aborts upload. */
function staticPlaceholderThumbnail(name: string): File {
  const bytes = Uint8Array.from([
    0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06,
    0x05, 0x08, 0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d,
    0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12, 0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f,
    0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c,
    0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34,
    0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff,
    0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00,
    0xff, 0xc4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xff, 0xc4,
    0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xda, 0x00, 0x08,
    0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x7f, 0xff, 0xd9,
  ]);
  const base = name.replace(/\.[^.]+$/, '') || 'video';
  return new File([bytes], `${base}-thumb.jpg`, { type: 'image/jpeg' });
}

async function readVideoDurationSeconds(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;
    video.onloadedmetadata = () => {
      const duration = Math.max(0, Math.round(video.duration || 0));
      URL.revokeObjectURL(objectUrl);
      resolve(duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(0);
    };
  });
}

export type CreateSocialPostInput = {
  content?: string;
  shopId?: number | null;
  isActive?: boolean;
  mediaFiles: File[];
};

export type UpdateSocialPostInput = {
  content?: string;
  shopId?: number | null;
  clearShop?: boolean;
  isActive?: boolean;
  mediaFiles?: File[];
  removeMediaIds?: number[];
};

class SocialPostsService {
  async getPosts(page = 0, size = 20, search = ''): Promise<SocialPostsPage> {
    const params = new URLSearchParams({
      page: String(page + 1),
      size: String(size),
    });
    if (search.trim()) params.append('search', search.trim());

    const data = await apiClient.get<{
      content: SocialPost[];
      totalElements: number;
      totalPages: number;
      page: number;
      size: number;
    }>(`${config.endpoints.admin.posts.list}?${params.toString()}`);

    return {
      content: (data.content || []).map(mapSocialPostToRow),
      totalElements: data.totalElements ?? 0,
      totalPages: data.totalPages ?? 0,
      number: Math.max(0, (data.page ?? 1) - 1),
      size: data.size ?? size,
    };
  }

  async getPostDetail(id: string | number): Promise<SocialPost> {
    return apiClient.get<SocialPost>(config.endpoints.admin.posts.detail(id));
  }

  async getComments(
    page = 0,
    size = 20,
    postId?: string,
    search = '',
  ): Promise<SocialCommentsPage> {
    const params = new URLSearchParams({
      page: String(page + 1),
      size: String(size),
    });
    if (search.trim()) params.append('search', search.trim());
    if (postId) params.append('postId', postId);

    const data = await apiClient.get<{
      content: Record<string, unknown>[];
      totalElements: number;
      totalPages: number;
      page: number;
      size: number;
    }>(`${config.endpoints.admin.posts.comments}?${params.toString()}`);

    return {
      content: (data.content || []).map(mapCommentRow),
      totalElements: data.totalElements ?? 0,
      totalPages: data.totalPages ?? 0,
      number: Math.max(0, (data.page ?? 1) - 1),
      size: data.size ?? size,
    };
  }

  private async buildMediaFormData(
    form: FormData,
    mediaFiles: File[],
  ): Promise<void> {
    const durations: number[] = [];
    for (const file of mediaFiles) {
      form.append('media', file);
      if (file.type.startsWith('video/')) {
        const duration = await readVideoDurationSeconds(file);
        durations.push(duration);
        try {
          const thumb = await captureVideoThumbnail(file);
          form.append('thumbnails', thumb);
        } catch (err) {
          console.warn('Video thumbnail capture failed; using placeholder', err);
          try {
            form.append(
              'thumbnails',
              await placeholderThumbnail(file.name.replace(/\.[^.]+$/, '')),
            );
          } catch (placeholderErr) {
            // Keep video↔thumb ordinals: Nest soft-fails a bad thumb, but a
            // missing slot would shift later videos onto the wrong poster.
            console.warn('Placeholder thumbnail failed; using static JPEG', placeholderErr);
            form.append('thumbnails', staticPlaceholderThumbnail(file.name));
          }
        }
      }
    }
    for (const d of durations) {
      form.append('durations', String(d));
    }
  }

  async createPost(input: CreateSocialPostInput): Promise<SocialPost> {
    const form = new FormData();
    if (input.content?.trim()) form.append('content', input.content.trim());
    if (input.shopId != null) form.append('shopId', String(input.shopId));
    if (input.isActive !== undefined) form.append('isActive', String(input.isActive));
    await this.buildMediaFormData(form, input.mediaFiles);
    return apiClient.post<SocialPost>(config.endpoints.admin.posts.list, form);
  }

  async updatePost(id: number | string, input: UpdateSocialPostInput): Promise<SocialPost> {
    const form = new FormData();
    if (input.content !== undefined) form.append('content', input.content.trim());
    if (input.clearShop) form.append('clearShop', 'true');
    else if (input.shopId != null) form.append('shopId', String(input.shopId));
    if (input.isActive !== undefined) form.append('isActive', String(input.isActive));
    for (const mediaId of input.removeMediaIds ?? []) {
      form.append('removeMediaIds', String(mediaId));
    }
    if (input.mediaFiles?.length) {
      await this.buildMediaFormData(form, input.mediaFiles);
    }
    return apiClient.patch<SocialPost>(config.endpoints.admin.posts.detail(id), form);
  }

  async hidePost(id: string | number): Promise<SocialPost> {
    return apiClient.put<SocialPost>(config.endpoints.admin.posts.hide(id), {});
  }

  async deletePost(id: string | number): Promise<void> {
    await apiClient.delete<void>(config.endpoints.admin.posts.detail(id));
  }

  async deleteComment(id: string | number): Promise<void> {
    await apiClient.delete<void>(config.endpoints.admin.posts.commentDetail(id));
  }
}

export const socialPostsService = new SocialPostsService();
