import { apiClient } from './apiClient';
import { config } from '../config/config';

export interface LanguagePolicy {
  customer: boolean;
  shop: boolean;
  website: boolean;
  updatedAt?: string;
}

export type LanguageTarget = 'customer' | 'shop' | 'website';

export const languagePolicyService = {
  get: (): Promise<LanguagePolicy> => {
    return apiClient.get<LanguagePolicy>(config.endpoints.admin.system.languagePolicy);
  },

  update: (payload: Partial<Record<LanguageTarget, boolean>>): Promise<LanguagePolicy> => {
    return apiClient.put<LanguagePolicy>(config.endpoints.admin.system.languagePolicy, payload);
  },
};
