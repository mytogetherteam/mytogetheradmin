import { apiClient } from './apiClient';
import { config } from '@/config/config';

export interface OperationsReport {
  rows: Array<{
    date: string;
    placed: number;
    delivered: number;
    pickedUp: number;
    canceled: number;
    escalated: number;
    avgWaitMinutes: number | null;
  }>;
  totals: {
    placed: number;
    delivered: number;
    pickedUp: number;
    canceled: number;
    escalated: number;
    avgWaitMinutes: number | null;
  };
}

export interface ShopScorecardRow {
  shopId: number;
  shopName: string;
  isOpen: boolean;
  orders: number;
  sales: number;
  averageOrderValue: number;
  cancelRatePercent: number;
  ratingAvg: number;
  ratingCount: number;
  reviews: number;
  avgWaitMinutes: number | null;
  attention: string[];
}

export interface CancellationLedger {
  total: number;
  shown: number;
  rows: Array<{
    orderId: number;
    orderNo: string;
    createdAt: string;
    shopName: string;
    amount: number;
    canceledBy: string | null;
    cancelReason: string | null;
  }>;
}

export interface ShopMoneyReport {
  shops: Array<{
    shopId: number;
    shopName: string;
    itemSales: number;
    deliveryFees: number;
    freeDeliveryOrders: number;
    couponDiscounts: number;
    shopDiscounts: number;
    customersPaid: number;
  }>;
  totals: {
    itemSales: number;
    deliveryFees: number;
    freeDeliveryOrders: number;
    couponDiscounts: number;
    shopDiscounts: number;
    customersPaid: number;
  };
  paymentMethods: Array<{ method: string; orders: number; amount: number }>;
}

export interface MenuPerformanceReport {
  total: number;
  shown: number;
  rows: Array<{
    menuId: number;
    dishName: string;
    shopName: string;
    views: number;
    likes: number;
    orders: number;
    sales: number;
    ordersPerView: number | null;
  }>;
}

export interface PromotionLedger {
  rows: Array<{
    couponId: number;
    couponName: string;
    shopName: string;
    promotionType: string;
    target: string;
    redemptions: number;
    discountGiven: number;
    orders: number;
  }>;
}

export interface ReviewRecord {
  threshold: number;
  delivered: number;
  reviewed: number;
  reviewRatePercent: number;
  averageRating: number | null;
  comments: {
    total: number;
    shown: number;
    rows: Array<{
      rating: number;
      comment: string | null;
      createdAt: string;
      orderNo: string;
      shopName: string;
    }>;
  };
  shops: {
    total: number;
    shown: number;
    rows: Array<{ shopId: number; shopName: string; ratingAvg: number; ratingCount: number }>;
  };
}

function rangeQuery(start: string, end: string, extra?: Record<string, string>) {
  const params = new URLSearchParams({ start, end });
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value) params.set(key, value);
    }
  }
  return params.toString();
}

const reports = config.endpoints.admin.analytics.reports;

export const reportsService = {
  operations: (start: string, end: string) =>
    apiClient.get<OperationsReport>(`${reports.operations}?${rangeQuery(start, end)}`),
  shops: (start: string, end: string) =>
    apiClient.get<{ rows: ShopScorecardRow[] }>(`${reports.shops}?${rangeQuery(start, end)}`),
  cancellations: (start: string, end: string, actor?: string) =>
    apiClient.get<CancellationLedger>(`${reports.cancellations}?${rangeQuery(start, end, actor ? { actor } : undefined)}`),
  money: (start: string, end: string) =>
    apiClient.get<ShopMoneyReport>(`${reports.money}?${rangeQuery(start, end)}`),
  menus: (start: string, end: string) =>
    apiClient.get<MenuPerformanceReport>(`${reports.menus}?${rangeQuery(start, end)}`),
  promotions: (start: string, end: string) =>
    apiClient.get<PromotionLedger>(`${reports.promotions}?${rangeQuery(start, end)}`),
  reviews: (start: string, end: string, maxRating: string) =>
    apiClient.get<ReviewRecord>(`${reports.reviews}?${rangeQuery(start, end, { maxRating })}`),
};
