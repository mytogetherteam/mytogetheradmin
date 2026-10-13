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

/** Who cancelled an order — mirrors the backend OrderCanceledBy enum. */
export type OrderCanceledBy = 'USER' | 'SHOP' | 'ADMIN' | 'SYSTEM';

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
  discountAmount?: number | null;
  displayDiscountAmount?: string | null;
  transactionDiscount?: number | null;
  displayTransactionDiscount?: string | null;
  isFreeDelivery?: boolean;
  totalAmount: number;
  displayTotalAmount?: string | null;
  displayItemPrice?: string | null;
  displayTaxAmount?: string | null;
  itemCount?: number | null;
  items: OrderItem[] | null;
  paymentSlipUrl?: string | null;
  proofPhotoUrl?: string | null;
  trackingUrl?: string | null;
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
  addressMm?: string | null;
  buildingName?: string | null;
  floor?: string | null;
  lat?: number | null;
  lon?: number | null;
  note?: string | null;
  cancelReason?: string | null;
  canceledBy?: OrderCanceledBy | null;

  /** Distance-based fee hint for shop/admin when entering deliveryFee. */
  estimatedDeliveryDistanceKm?: number | null;
  estimatedDeliveryFeeMin?: number | null;
  estimatedDeliveryFeeMax?: number | null;
  estimatedDeliveryFeeMid?: number | null;
  estimatedDeliveryFeeLabel?: string | null;
  
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
  fromStatus: OrderStatus | null;
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

export type ChatSenderType = 'USER' | 'SHOP' | 'ADMIN' | 'SYSTEM';
export type ChatMessageType = 'TEXT' | 'IMAGE' | 'VOICE' | 'MIXED' | 'SYSTEM';
export type ChatAttachmentType = 'IMAGE' | 'AUDIO' | 'VOICE' | 'VIDEO' | 'FILE';

export interface ChatAttachment {
  id: number;
  messageId?: number;
  type: ChatAttachmentType;
  url: string;
  thumbnailUrl?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  sortOrder?: number;
  createdAt?: string;
}

export interface ChatMessageSender {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  profileUrl?: string | null;
}

export interface ChatMessage {
  id: number;
  conversationId?: number;
  senderType: ChatSenderType;
  senderUserId?: number | null;
  senderAdminId?: number | null;
  type: ChatMessageType;
  content?: string | null;
  isRead?: boolean;
  readAt?: string | null;
  createdAt: string;
  senderUser?: ChatMessageSender | null;
  senderAdmin?: ChatMessageSender | null;
  attachments?: ChatAttachment[];
}

export interface OrderChatConversation {
  id: number | null;
  orderId: number | string;
  userId?: number | null;
  shopId?: number | null;
  userUnreadCount?: number;
  shopUnreadCount?: number;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: number;
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    profileUrl?: string | null;
  } | null;
  shop?: {
    id: number;
    nameEn?: string | null;
    nameMm?: string | null;
    nameTh?: string | null;
    logoUrl?: string | null;
  } | null;
  messages: ChatMessage[];
}

export interface SendChatMessagePayload {
  content?: string;
  attachments?: File[];
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

  /**
   * Retrieves chat conversation & messages for an order.
   * Uses shop-chat endpoint directly when shopId is available to avoid 404s,
   * falls back to admin endpoint if needed.
   */
  async getOrderChat(orderId: string | number, shopId?: number | string): Promise<OrderChatConversation> {
    if (shopId) {
      try {
        return await apiClient.get<OrderChatConversation>(`/api/shop/chat/orders/${orderId}`, {
          headers: { 'x-shop-id': String(shopId) },
        });
      } catch (err) {
        console.warn('Shop chat endpoint failed, falling back to admin endpoint:', err);
      }
    }
    return apiClient.get<OrderChatConversation>(config.endpoints.admin.orders.chat(orderId));
  }

  /**
   * Send a chat message on an order as Admin / Shop.
   */
  async sendOrderChatMessage(
    orderId: string | number,
    payload: SendChatMessagePayload,
    shopId?: number | string
  ): Promise<ChatMessage> {
    const hasFiles = payload.attachments && payload.attachments.length > 0;
    let body: FormData | { content?: string };
    if (hasFiles) {
      const fd = new FormData();
      if (payload.content) fd.append('content', payload.content);
      payload.attachments!.forEach((f) => fd.append('attachments', f));
      body = fd;
    } else {
      body = { content: payload.content };
    }

    if (shopId) {
      try {
        return await apiClient.post<ChatMessage>(
          `/api/shop/chat/orders/${orderId}/messages`,
          body,
          { headers: { 'x-shop-id': String(shopId) } }
        );
      } catch (err) {
        console.warn('Shop chat send failed, falling back to admin endpoint:', err);
      }
    }

    return apiClient.post<ChatMessage>(
      config.endpoints.admin.orders.chatMessages(orderId),
      body
    );
  }
}

export const orderService = new OrderService();

