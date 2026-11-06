import { config } from "@/config/config";
import { apiClient } from "./apiClient";

export interface AdminMyDay {
  id: number;
  shopId: number;
  shopName: string;
  imageUrl: string;
  createdAt: string;
  expiresAt: string;
}

export interface AdminMyDayPage {
  items: AdminMyDay[];
  total: number;
  page: number;
  pageSize: number;
}

class MyDaysService {
  list(page: number, size = 24): Promise<AdminMyDayPage> {
    return apiClient.get<AdminMyDayPage>(config.endpoints.admin.mydays.list, {
      params: { page, size },
    });
  }

  remove(id: number): Promise<null> {
    return apiClient.delete<null>(config.endpoints.admin.mydays.detail(id));
  }
}

export const myDaysService = new MyDaysService();
