import { apiClient, ApiResponseData } from './apiClient';

export type ReviewType = 'SHOPS' | 'ITEMS';

export interface Review {
  id: string;
  reviewerName: string;
  targetName: string; // Shop or Item name
  targetId: string;
  rating: number;
  comment: string;
  isVisible: boolean;
  createdAt: string;
  photoUrls?: string[];
}

export interface ReviewPage {
  content: Review[];
  totalElements: number;
  totalPages: number;
  number: number;
}

class ReviewService {
  async getReviews(type: ReviewType, page = 0, size = 10): Promise<ReviewPage> {
    const endpoint = type === 'SHOPS' ? '/api/admin/reviews/shops' : '/api/admin/reviews/items';
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    const response = await apiClient.get<ApiResponseData<ReviewPage>>(`${endpoint}?${params.toString()}`);
    return response.data;
  }

  async toggleVisibility(type: ReviewType, id: string, visible: boolean): Promise<Review> {
    const endpoint = type === 'SHOPS' ? `/api/admin/reviews/shops/${id}/visibility` : `/api/admin/reviews/items/${id}/visibility`;
    const response = await apiClient.put<ApiResponseData<Review>>(`${endpoint}?visible=${visible}`, {});
    return response.data;
  }

  async deleteReview(type: ReviewType, id: string): Promise<void> {
    const endpoint = type === 'SHOPS' ? `/api/admin/reviews/shops/${id}` : `/api/admin/reviews/items/${id}`;
    return apiClient.delete<void>(endpoint);
  }

  async deleteReviewPhoto(type: ReviewType, photoId: string): Promise<void> {
    const endpoint = type === 'SHOPS' 
      ? `/api/admin/reviews/photos/shops/${photoId}` 
      : `/api/admin/reviews/photos/items/${photoId}`;
    return apiClient.delete<void>(endpoint);
  }
}

export const reviewService = new ReviewService();
