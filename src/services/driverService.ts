import { apiClient } from './apiClient';
import { config } from '@/config/config';

export interface DeliveryDriver {
  id: number;
  shopId: number;
  name: string;
  phone: string;
  vehicleNo: string;
  profileUrl?: string | null;
  isActive: boolean;
  isBusy: boolean;
}

interface DriversPage {
  content: DeliveryDriver[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface CreateDriverPayload {
  shopId: number;
  name: string;
  phone: string;
  vehicleNo: string;
}

class DriverService {
  /** Drivers belonging to one shop (SuperAdmin). */
  async listByShop(shopId: number, size = 100): Promise<DeliveryDriver[]> {
    const page = await apiClient.get<DriversPage>(
      `${config.endpoints.admin.deliveryDrivers.base}?shopId=${shopId}&page=1&size=${size}&isActive=true&includeDeleted=false`,
    );
    return page.content ?? [];
  }

  /** Create a driver for a shop (SuperAdmin). */
  async create(payload: CreateDriverPayload): Promise<DeliveryDriver> {
    return apiClient.post<DeliveryDriver>(
      config.endpoints.admin.deliveryDrivers.base,
      payload,
    );
  }
}

export const driverService = new DriverService();
