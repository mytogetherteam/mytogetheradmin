import { config } from "@/config/config";
import { apiClient } from "./apiClient";

export interface AdminJobShop {
  id: number;
  nameEn?: string | null;
  nameMm?: string | null;
  nameTh?: string | null;
}

export interface AdminJobPost {
  id: number;
  shopId: number;
  title: string;
  description: string;
  jobType: "FULL_TIME" | "PART_TIME";
  salaryNegotiable: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  applyLink: string | null;
  contactPhone: string | null;
  status: "ACTIVE" | "INACTIVE";
  closingDate: string | null;
  createdAt: string;
  shop?: AdminJobShop;
}

export interface AdminJobPostPage {
  items: AdminJobPost[];
  total: number;
  page: number;
  pageSize: number;
}

class JobPostsService {
  list(params: {
    page: number;
    size: number;
    search?: string;
    status?: "ACTIVE" | "INACTIVE";
  }): Promise<AdminJobPostPage> {
    return apiClient.get<AdminJobPostPage>(config.endpoints.admin.jobPosts.list, {
      params: {
        page: params.page,
        size: params.size,
        search: params.search?.trim() || undefined,
        status: params.status,
      },
    });
  }

  setStatus(id: number, status: "ACTIVE" | "INACTIVE"): Promise<AdminJobPost> {
    return apiClient.patch<AdminJobPost>(config.endpoints.admin.jobPosts.status(id), {
      status,
    });
  }

  remove(id: number): Promise<null> {
    return apiClient.delete<null>(config.endpoints.admin.jobPosts.detail(id));
  }
}

export const jobPostsService = new JobPostsService();
