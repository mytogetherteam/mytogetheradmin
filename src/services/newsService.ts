import { config } from "@/config/config";
import { handleApiCall } from "@/lib/handleApiCall";
import { api } from "@/utils/axios";

export interface NewsPhotoDTO {
  id: number;
  newsId: number;
  url: string;
  position: number;
}

export interface NewsDTO {
  id: number;
  title: string;
  description: string;
  isActive: boolean;
  createdByAdminId: number;
  createdByAdmin?: {
    id: number;
    name?: string | null;
    username?: string | null;
    profileUrl?: string | null;
  };
  photos: NewsPhotoDTO[];
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedNews {
  content: NewsDTO[];
  totalElements: number;
  totalPages: number;
}

export const NewsService = {
  /** List all news articles (paginated). */
  getNews: async (params?: {
    page?: number;
    size?: number;
  }): Promise<PaginatedNews> => {
    let url = config.endpoints.admin.news.base;
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined)
      queryParams.append("page", params.page.toString());
    if (params?.size !== undefined)
      queryParams.append("size", params.size.toString());
    const queryString = queryParams.toString();
    if (queryString) url += `?${queryString}`;

    const response = await handleApiCall<PaginatedNews>(() => api.get(url));
    if (response && Array.isArray(response.content)) return response;
    return { content: [], totalElements: 0, totalPages: 0 };
  },

  /** Get a single news article by id. */
  getNewsById: async (id: number): Promise<NewsDTO> => {
    return handleApiCall(() => api.get(config.endpoints.admin.news.detail(id)));
  },

  /** Create a news article (multipart: text fields + `photos` files). */
  createNews: async (data: FormData): Promise<NewsDTO> => {
    return handleApiCall(() => api.post(config.endpoints.admin.news.base, data));
  },

  /** Update a news article (multipart: text fields, `photos` files, `removePhotoIds`). */
  updateNews: async (id: number, data: FormData): Promise<NewsDTO> => {
    return handleApiCall(() =>
      api.patch(config.endpoints.admin.news.detail(id), data),
    );
  },

  /** Delete a news article. */
  deleteNews: async (id: number): Promise<void> => {
    return handleApiCall(() =>
      api.delete(config.endpoints.admin.news.detail(id)),
    );
  },
};
