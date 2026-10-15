import { apiClient } from './apiClient';
import { config } from '@/config/config';

export interface TwilioConfigData {
  orderCallEnabled: boolean;
  isConfigured: boolean;
  fromNumber: string | null;
  hasStudioFlow: boolean;
  hasAlertAudio: boolean;
  updatedAt?: string;
}

export const twilioService = {
  getConfig: async (): Promise<TwilioConfigData> => {
    return apiClient.get<TwilioConfigData>(config.endpoints.admin.system.twilio.config);
  },

  updateConfig: async (orderCallEnabled: boolean): Promise<TwilioConfigData> => {
    return apiClient.put<TwilioConfigData>(config.endpoints.admin.system.twilio.config, {
      orderCallEnabled,
    });
  },
};
