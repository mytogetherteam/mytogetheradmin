import { config } from '@/config/config';
import { apiClient } from './apiClient';

export const exportService = {
    exportUsers: async () => {
        window.open(`${config.apiBaseUrl}${config.endpoints.admin.export.users}`, '_blank');
    },

    exportRevenue: async (startDate: string, endDate: string) => {
        const url = `${config.apiBaseUrl}${config.endpoints.admin.export.revenue}?startDate=${startDate}&endDate=${endDate}`;
        window.open(url, '_blank');
    },

    exportOrders: async (startDate: string, endDate: string, status?: string, shopId?: string) => {
        const params = new URLSearchParams({ startDate, endDate });
        if (status && status !== 'ALL') params.set('status', status);
        if (shopId) params.set('shopId', shopId);
        const blob = await apiClient.download(
            `${config.endpoints.admin.export.orders}?${params.toString()}`,
        );
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `orders-${startDate}-to-${endDate}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
    }
};
