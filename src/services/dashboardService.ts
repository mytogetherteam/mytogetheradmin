import { apiClient } from './apiClient';
import { config } from '@/config/config';

export type DashboardCardKey =
  | 'totalUsers'
  | 'totalShops'
  | 'totalReviews'
  | 'pendingOrders'
  | 'shopPendingCount'
  | 'shopFeedbackCount';

export interface DashboardCard {
  key: DashboardCardKey;
  title: string;
  count: number;
}

export type DashboardCardCounts = Record<DashboardCardKey, number>;

function toCounts(cards: DashboardCard[]): DashboardCardCounts {
  return Object.fromEntries(cards.map((card) => [card.key, card.count])) as DashboardCardCounts;
}

class DashboardService {
  async getCards(): Promise<DashboardCard[]> {
    return apiClient.get<DashboardCard[]>(config.endpoints.admin.dashboard.cards);
  }

  async getCardCounts(): Promise<DashboardCardCounts> {
    const cards = await this.getCards();
    return toCounts(cards);
  }
}

export const dashboardService = new DashboardService();
