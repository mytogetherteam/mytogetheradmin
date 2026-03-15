import { apiClient } from './apiClient';
import { config } from '@/config/config';

export interface OnboardingScreen {
    id: number;
    titleEn: string;
    titleMm?: string;
    descriptionEn?: string;
    descriptionMm?: string;
    imageUrl?: string;
    displayOrder: number;
    isActive: boolean;
    platform: 'IOS' | 'ANDROID' | 'WEB' | 'ALL';
}

export interface FeatureFlag {
    id: number;
    flagKey: string;
    description?: string;
    isEnabled: boolean;
    targetApp: string;
    targetPlatform: string;
    minVersion?: string | null;
    maxVersion?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface SystemLatency {
    database: number;
    redis: number;
    externalApi: number;
    timestamp: string;
}

export const appManagementService = {
    // Onboarding Screens
    getOnboardingScreens: async (): Promise<OnboardingScreen[]> => {
        return apiClient.get<OnboardingScreen[]>(config.endpoints.admin.system.appManagement.onboarding);
    },

    createOnboardingScreen: async (data: FormData): Promise<OnboardingScreen> => {
        return apiClient.post<OnboardingScreen>(config.endpoints.admin.system.appManagement.onboarding, data);
    },

    updateOnboardingScreen: async (id: number, data: FormData): Promise<OnboardingScreen> => {
        return apiClient.put<OnboardingScreen>(config.endpoints.admin.system.appManagement.onboardingDetail(id), data);
    },

    deleteOnboardingScreen: async (id: number): Promise<void> => {
        await apiClient.delete(config.endpoints.admin.system.appManagement.onboardingDetail(id));
    },

    // Feature Flags
    getFeatureFlags: async (): Promise<FeatureFlag[]> => {
        return apiClient.get<FeatureFlag[]>(config.endpoints.admin.system.appManagement.featureFlags);
    },

    updateFeatureFlag: async (id: number, isEnabled: boolean): Promise<FeatureFlag> => {
        return apiClient.put<FeatureFlag>(config.endpoints.admin.system.appManagement.featureFlagDetail(id), { isEnabled });
    },

    deleteFeatureFlag: async (id: number): Promise<void> => {
        await apiClient.delete(config.endpoints.admin.system.appManagement.featureFlagDetail(id));
    },

    // System Health
    getSystemLatency: async (): Promise<SystemLatency> => {
        return apiClient.get<SystemLatency>(config.endpoints.admin.system.latency);
    }
};
