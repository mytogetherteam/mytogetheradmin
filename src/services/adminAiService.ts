import { apiClient } from './apiClient';
import { config } from '@/config/config';

export interface ChatHistoryItem {
  role: 'user' | 'model';
  text: string;
}

export interface TodayPlatformSnapshot {
  date: string;
  orders: {
    totalOrdersToday: number;
    deliveredCount: number;
    activeCount: number;
    canceledCount: number;
    statusBreakdown: Record<string, number>;
    totalRevenue: number;
    currency: string;
    cancelReasons: Array<{ reason: string; count: number }>;
  };
  shops: {
    totalShops: number;
    openShops: number;
    closedShops: number;
  };
  drivers: {
    totalDrivers: number;
    activeDrivers: number;
  };
  menuItems: {
    pendingApprovalCount: number;
  };
  notifications: {
    recentAlerts: Array<{
      title: string;
      message: string;
      createdAt: string;
    }>;
  };
}

export interface TodayRecapResponse {
  snapshot: TodayPlatformSnapshot;
  aiRecap: string;
}

export interface ChatResponse {
  reply: string;
  suggestions: string[];
}

export const adminAiService = {
  async getTodayRecap(): Promise<TodayRecapResponse> {
    const res = await apiClient.get<any>(config.endpoints.admin.ai.todayRecap);
    // Handle both unwrapped and wrapped response structures from apiClient
    return res?.data ?? res;
  },

  async sendChatMessage(message: string, history: ChatHistoryItem[] = []): Promise<ChatResponse> {
    const res = await apiClient.post<any>(config.endpoints.admin.ai.chat, {
      message,
      history,
    });
    // Handle both unwrapped and wrapped response structures from apiClient
    return res?.data ?? res;
  },
};
