import { apiClient } from './apiClient';
import { config } from '@/config/config';

// Canonical statuses as emitted by the backend Prisma `OrderStatus` enum.
export const ORDER_STATUSES = [
  'PENDING',
  'PAYMENT_SLIP_REQUESTED',
  'AWAITING_APPROVAL',
  'PAYMENT_VERIFIED',
  'COOKING',
  'READY_FOR_PICKUP',
  'ON_THE_WAY',
  'DELIVERED',
  'PICKED_UP',
  'REVISED',
  'CANCELED',
] as const;

/** In-flight statuses shown on the live board by default (terminal ones drop). */
export const ACTIVE_ORDER_STATUSES = [
  'PENDING',
  'PAYMENT_SLIP_REQUESTED',
  'AWAITING_APPROVAL',
  'PAYMENT_VERIFIED',
  'COOKING',
  'READY_FOR_PICKUP',
  'ON_THE_WAY',
  'REVISED',
] as const;

export const TERMINAL_ORDER_STATUSES = ['DELIVERED', 'PICKED_UP', 'CANCELED'] as const;

// Union kept as a superset of the canonical backend statuses plus legacy values
// still referenced by older pages, so the whole app keeps type-checking.
export type OrderStatus =
  | (typeof ORDER_STATUSES)[number]
  | 'CONFIRMED' | 'ACCEPTED' | 'PAYMENT_UPLOADED' | 'PREPARING' | 'READY'
  | 'DELIVERING' | 'CANCELLED' | 'INTERNAL_TRACKING';

export interface OrderItem {
  id: string | number;
  menuItemId?: number;
  menuItemName?: string;
  menuItemNameMm?: string;
  menuItemNameTh?: string;
  menuItemNameEn?: string;
  menuItemImageUrl?: string;
  name?: string;
  nameMm?: string;
  quantity: number;
  price: number;
  displayPrice?: string;
  options?: string;
  specialInstructions?: string;
  totalPrice?: number;
}

export interface Order {
  id: number | string;
  shopId: number;
  shopName: string;
  shopNameMm?: string;
  shopImageUrl?: string;
  userId?: number | null;
  userFullName?: string | null;
  userPhone?: string | null;
  status: OrderStatus;
  statusLabel: string;
  statusLabelMm: string;
  deliveryType: string;
  deliveryTier?: string | null;
  estimatedDeliveryTime?: string | null;
  isScheduled: boolean;
  scheduledDeliveryTime?: string | null;
  deliveryAddress?: string | Record<string, unknown> | null;
  deliveryFee: number;
  displayDeliveryFee?: string | null;
  totalAmount: number;
  displayTotalAmount?: string | null;
  displayItemPrice?: string | null;
  displayTaxAmount?: string | null;
  itemCount?: number | null;
  items: OrderItem[] | null;
  paymentSlipUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  queueNo?: number;
  lastOrderNo?: string | null;
  orderType?: string | null;
  orderDeliveryType?: string | null;
  waitingTimeMinutes?: number | null;
  taxAmount?: number | null;
  itemPrice?: number | null;
  address?: string | null;
  note?: string | null;
  cancelReason?: string | null;
  
  // Backward compatibility fields if any
  customerName?: string;
  customerId?: string;
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
  search?: string;
  lastOrderNo?: string;
  status?: OrderStatus;
  page?: number;
  size?: number;
}

export interface OrderHealthData {
  [status: string]: number;
}

/** Body for the SuperAdmin status-override endpoint (subset of the backend DTO). */
export interface UpdateOrderStatusPayload {
  status: OrderStatus;
  cancelReason?: string;
  trackingUrl?: string;
  driverId?: number;
  // Required by the backend when status = PAYMENT_SLIP_REQUESTED
  orderDeliveryType?: 'FAST' | 'FLEXIBLE';
  deliveryFee?: number;
  waitingTimeMinutes?: number;
  // Required by the backend when status = REVISED
  reviseReason?: string;
  unavailableItems?: number[];
}

export interface OrderHistoryEntry {
  id: number;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  changedBy: string;
  changedByAdminId?: number;
  changedByAdminName?: string;
  note?: string;
  changedAt: string;
}

export interface ActiveOrderFilters {
  shopId?: string | number;
  status?: OrderStatus | OrderStatus[];
  page?: number;
  size?: number;
}

class OrderService {
  /**
   * Live order board feed (SuperAdmin only) — in-flight orders across every
   * shop. Optionally narrow by shop and/or status. Returns a paginated page.
   */
  async getActiveOrders(filters: ActiveOrderFilters = {}): Promise<OrdersPage> {
    const params = new URLSearchParams();
    if (filters.shopId !== undefined && filters.shopId !== '' && filters.shopId !== 'ALL') {
      params.append('shopId', String(filters.shopId));
    }
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      const cleaned = statuses.filter((s) => s && s !== ('ALL' as OrderStatus));
      if (cleaned.length > 0) params.append('status', cleaned.join(','));
    }
    params.append('page', String(filters.page ?? 1));
    params.append('size', String(filters.size ?? 50));
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<OrdersPage>(`${config.endpoints.admin.orders.active}${query}`);
  }

  async getOrdersHealth(): Promise<OrderHealthData> {
    return apiClient.get<OrderHealthData>(config.endpoints.admin.orders.health);
  }

  async getOrderDetail(orderId: string): Promise<Order> {
    return apiClient.get<Order>(config.endpoints.admin.orders.detail(orderId));
  }

  async getOrders(filters: OrderFilters = {}): Promise<OrdersPage> {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.shopId) params.append('shopId', filters.shopId);
    if (filters.search) params.append('search', filters.search);
    if (filters.lastOrderNo) params.append('lastOrderNo', filters.lastOrderNo);
    if (filters.status) params.append('status', filters.status);
    params.append('page', String(filters.page ?? 0));
    params.append('size', String(filters.size ?? 20));
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<OrdersPage>(`${config.endpoints.admin.orders.list}${query}`);
  }

  async getOrderHistory(orderId: string): Promise<OrderHistoryEntry[]> {
    return apiClient.get<OrderHistoryEntry[]>(config.endpoints.admin.orders.history(orderId));
  }

  /**
   * SuperAdmin override of an order status (PATCH /api/admin/orders/:id/status).
   * Body mirrors the backend UpdateShopOrderStatusDto — the backend runs the
   * exact same rules as the shop-admin action, so statuses that need extra
   * fields (REVISED, PAYMENT_SLIP_REQUESTED, ON_THE_WAY) are validated there.
   */
  async updateOrderStatus(id: string, payload: UpdateOrderStatusPayload): Promise<Order> {
    return apiClient.patch<Order>(config.endpoints.admin.orders.status(id), payload);
  }
}

export const orderService = new OrderService();
