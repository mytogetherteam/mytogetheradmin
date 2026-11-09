import { config } from "@/config/config";
import { apiClient } from "./apiClient";

export interface TelegramRestaurant {
  id: number;
  name: string;
  username: string | null;
  connected: boolean;
  isActive: boolean;
  isOpen: boolean;
}

export interface TelegramDailyReportResult {
  date: string;
  sentTo: number;
  preview: string;
  skipped?: boolean;
  reason?: string;
}

class TelegramRestaurantsService {
  list(): Promise<TelegramRestaurant[]> {
    return apiClient.get<TelegramRestaurant[]>(config.endpoints.admin.telegram.shops);
  }

  sendDailyReport(): Promise<TelegramDailyReportResult> {
    return apiClient.post<TelegramDailyReportResult>(
      config.endpoints.admin.telegram.sendDailyReport,
    );
  }
}

export const telegramRestaurantsService = new TelegramRestaurantsService();
