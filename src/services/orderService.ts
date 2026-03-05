import { apiClient } from './apiClient';
import { config } from '@/config/config';

export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  shopName: string;
  shopId: string;
  customerName: string;
  customerId: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersPage {
  content: Order[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface OrderFilters {
  startDate?: string;
  endDate?: string;
  shopId?: string;
  status?: OrderStatus;
  page?: number;
  size?: number;
}

export interface OrderHealthData {
  [status: string]: number;
}

export interface OrderHistoryEntry {
  id: string;
  status: OrderStatus;
  changedByAdmin?: string;
  changedAt: string;
  reason?: string;
}

class OrderService {
  async getActiveOrders(): Promise<Order[]> {
    return apiClient.get<Order[]>(config.endpoints.admin.orders.active);
  }

  async getOrdersHealth(): Promise<OrderHealthData> {
    return apiClient.get<OrderHealthData>(config.endpoints.admin.orders.health);
  }

  async getOrders(filters: OrderFilters = {}): Promise<OrdersPage> {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.shopId) params.append('shopId', filters.shopId);
    if (filters.status) params.append('status', filters.status);
    params.append('page', String(filters.page ?? 0));
    params.append('size', String(filters.size ?? 20));
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<OrdersPage>(`${config.endpoints.admin.orders.list}${query}`);
  }

  async getOrderHistory(orderId: string): Promise<OrderHistoryEntry[]> {
    return apiClient.get<OrderHistoryEntry[]>(config.endpoints.admin.orders.history(orderId));
  }

  async updateOrderStatus(id: string, status: OrderStatus, reason?: string): Promise<Order> {
    const params = new URLSearchParams({ status });
    if (reason) params.append('reason', reason);
    return apiClient.put<Order>(`${config.endpoints.admin.orders.status(id)}?${params.toString()}`, {});
  }
}

export const orderService = new OrderService();
