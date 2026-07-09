import { apiClient } from './apiClient';
import { ENDPOINTS } from '../endpoints';

export const analyticsApi = {
  // Unified Dashboard
  getUnifiedDashboard: async (params?: Record<string, string>) => {
    return await apiClient.get(ENDPOINTS.ANALYTICS_DASHBOARD, params);
  },

  // Product Inventory Analytics
  logProductEvent: async (data: any) => {
    return await apiClient.post(`${ENDPOINTS.ANALYTICS_PRODINV}/event`, data);
  },
  getOverallProductAnalytics: async (params?: Record<string, string>) => {
    return await apiClient.get(`${ENDPOINTS.ANALYTICS_PRODINV}/overall`, params);
  },
  getProductAnalyticsList: async (params?: Record<string, string>) => {
    return await apiClient.get(`${ENDPOINTS.ANALYTICS_PRODINV}/`, params);
  },
  getProductAnalyticsById: async (productId: string, params?: Record<string, string>) => {
    return await apiClient.get(`${ENDPOINTS.ANALYTICS_PRODINV}/${productId}`, params);
  },
  getTopProducts: async (params?: Record<string, string>) => {
    return await apiClient.get(`${ENDPOINTS.ANALYTICS_PRODINV}/top`, params);
  },
  getLowStockProducts: async (params?: Record<string, string>) => {
    return await apiClient.get(`${ENDPOINTS.ANALYTICS_PRODINV}/low-stock`, params);
  },
  getOutOfStockProducts: async (params?: Record<string, string>) => {
    return await apiClient.get(`${ENDPOINTS.ANALYTICS_PRODINV}/out-of-stock`, params);
  },

  // Customer Analytics
  logCustomerEvent: async (data: any) => {
    return await apiClient.post(`${ENDPOINTS.ANALYTICS_CUSTOMER}/event`, data);
  },
  getOverallCustomerAnalytics: async (params?: Record<string, string>) => {
    return await apiClient.get(`${ENDPOINTS.ANALYTICS_CUSTOMER}/overall`, params);
  },
  getCustomerAnalyticsById: async (customerId: string, params?: Record<string, string>) => {
    return await apiClient.get(`${ENDPOINTS.ANALYTICS_CUSTOMER}/${customerId}`, params);
  },
};
