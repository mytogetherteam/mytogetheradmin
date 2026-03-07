import { config } from '@/config/config';

export const exportService = {
    exportUsers: async () => {
        window.open(`${config.apiBaseUrl}${config.endpoints.admin.export.users}`, '_blank');
    },

    exportRevenue: async (startDate: string, endDate: string) => {
        const url = `${config.apiBaseUrl}${config.endpoints.admin.export.revenue}?startDate=${startDate}&endDate=${endDate}`;
        window.open(url, '_blank');
    },

    exportOrders: async (startDate: string, endDate: string, status?: string) => {
        let url = `${config.apiBaseUrl}${config.endpoints.admin.export.orders}?startDate=${startDate}&endDate=${endDate}`;
        if (status && status !== 'ALL') {
            url += `&status=${status}`;
        }
        window.open(url, '_blank');
    }
};
