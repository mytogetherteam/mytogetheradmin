import { apiClient, ApiResponseData } from './apiClient';

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

class OrderService {
  async getActiveOrders(): Promise<Order[]> {
    const response = await apiClient.get<ApiResponseData<Order[]>>('/api/admin/orders/active');
    return response.data;
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
    const response = await apiClient.get<ApiResponseData<OrdersPage>>(`/api/admin/orders${query}`);
    return response.data;
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const response = await apiClient.put<ApiResponseData<Order>>(`/api/admin/orders/${id}/status`, { status });
    return response.data;
  }
}

export const orderService = new OrderService();
