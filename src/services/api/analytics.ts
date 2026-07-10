import { apiClient } from './apiClient';
import { ENDPOINTS } from '../endpoints';

type QueryParams = Record<string, string>;

export const analyticsApi = {
  // Unified Dashboard
  getUnifiedDashboard: async (params?: QueryParams) => {
    return await apiClient.get(ENDPOINTS.ANALYTICS_DASHBOARD, params);
  },

  // Product Inventory Analytics
  logProductEvent: async (data: unknown) => {
    return await apiClient.post(`${ENDPOINTS.ANALYTICS_PRODINV}/event`, data);
  },
  getOverallProductAnalytics: async (params?: QueryParams) => {
    return await apiClient.get(ENDPOINTS.ANALYTICS_PRODINV_OVERALL, params);
  },
  getProductAnalyticsList: async (params?: QueryParams) => {
    return await apiClient.get(`${ENDPOINTS.ANALYTICS_PRODINV}/`, params);
  },
  getProductAnalyticsById: async (productId: string, params?: QueryParams) => {
    return await apiClient.get(`${ENDPOINTS.ANALYTICS_PRODINV}/${productId}`, params);
  },
  getProductVariantAnalytics: async (productId: string, variantId: string, params?: QueryParams) => {
    return await apiClient.get(`${ENDPOINTS.ANALYTICS_PRODINV}/${productId}/variants/${variantId}`, params);
  },
  getProductBatchAnalytics: async (productId: string, variantId: string, batchId: string, params?: QueryParams) => {
    return await apiClient.get(`${ENDPOINTS.ANALYTICS_PRODINV}/${productId}/variants/${variantId}/batches/${batchId}`, params);
  },
  getTopProducts: async (params?: QueryParams) => {
    return await apiClient.get(ENDPOINTS.ANALYTICS_PRODINV_TOP, params);
  },
  getLowStockProducts: async (params?: QueryParams) => {
    return await apiClient.get(ENDPOINTS.ANALYTICS_PRODINV_LOW_STOCK, params);
  },
  getOutOfStockProducts: async (params?: QueryParams) => {
    return await apiClient.get(ENDPOINTS.ANALYTICS_PRODINV_OUT_OF_STOCK, params);
  },
  getProductInventoryDashboard: async (params?: QueryParams) => {
    return await apiClient.get(ENDPOINTS.ANALYTICS_PRODINV_DASHBOARD, params);
  },

  // Customer Analytics
  logCustomerEvent: async (data: unknown) => {
    return await apiClient.post(`${ENDPOINTS.ANALYTICS_CUSTOMER}/event`, data);
  },
  getOverallCustomerAnalytics: async (params?: QueryParams) => {
    return await apiClient.get(ENDPOINTS.ANALYTICS_CUSTOMER_OVERALL, params);
  },
  getCustomerAnalyticsList: async (params?: QueryParams) => {
    return await apiClient.get(`${ENDPOINTS.ANALYTICS_CUSTOMER}/`, params);
  },
  getCustomerAnalyticsById: async (customerId: string, params?: QueryParams) => {
    return await apiClient.get(`${ENDPOINTS.ANALYTICS_CUSTOMER}/${customerId}`, params);
  },
  getTopCustomers: async (params?: QueryParams) => {
    return await apiClient.get(ENDPOINTS.ANALYTICS_CUSTOMER_TOP, params);
  },
  getCustomerTrend: async (params?: QueryParams) => {
    return await apiClient.get(ENDPOINTS.ANALYTICS_CUSTOMER_TREND, params);
  },
  getCustomerDashboard: async (params?: QueryParams) => {
    return await apiClient.get(ENDPOINTS.ANALYTICS_CUSTOMER_DASHBOARD, params);
  },

  // Supplier Analytics
  logSupplierEvent: async (data: unknown) => {
    return await apiClient.post(`${ENDPOINTS.ANALYTICS_SUPPLIER}/event`, data);
  },
  getOverallSupplierAnalytics: async (params?: QueryParams) => {
    return await apiClient.get(ENDPOINTS.ANALYTICS_SUPPLIER_OVERALL, params);
  },
  getSupplierAnalyticsList: async (params?: QueryParams) => {
    return await apiClient.get(`${ENDPOINTS.ANALYTICS_SUPPLIER}/`, params);
  },
  getSupplierAnalyticsById: async (supplierId: string, params?: QueryParams) => {
    return await apiClient.get(`${ENDPOINTS.ANALYTICS_SUPPLIER}/${supplierId}`, params);
  },
  getTopSuppliers: async (params?: QueryParams) => {
    return await apiClient.get(ENDPOINTS.ANALYTICS_SUPPLIER_TOP, params);
  },
  getSupplierTrend: async (params?: QueryParams) => {
    return await apiClient.get(ENDPOINTS.ANALYTICS_SUPPLIER_TREND, params);
  },
  getSupplierDashboard: async (params?: QueryParams) => {
    return await apiClient.get(ENDPOINTS.ANALYTICS_SUPPLIER_DASHBOARD, params);
  },

  // Stock Movement / Adjustment Analytics
  logStockMovAdjEvent: async (data: unknown) => {
    return await apiClient.post(`${ENDPOINTS.ANALYTICS_STOCKMOVADJ}/event`, data);
  },
  getOverallStockMovAdjAnalytics: async (params?: QueryParams) => {
    return await apiClient.get(ENDPOINTS.ANALYTICS_STOCKMOVADJ_OVERALL, params);
  },
  getStockMovAdjDaily: async (params?: QueryParams) => {
    return await apiClient.get(ENDPOINTS.ANALYTICS_STOCKMOVADJ_DAILY, params);
  },
  getStockMovAdjTrend: async (params?: QueryParams) => {
    return await apiClient.get(ENDPOINTS.ANALYTICS_STOCKMOVADJ_TREND, params);
  },
  getStockMovAdjDashboard: async (params?: QueryParams) => {
    return await apiClient.get(ENDPOINTS.ANALYTICS_STOCKMOVADJ_DASHBOARD, params);
  },

  // Purchase Analytics
  logPurchaseEvent: async (data: unknown) => {
    return await apiClient.post(`${ENDPOINTS.ANALYTICS_PURCHASE}/event`, data);
  },
  getOverallPurchaseAnalytics: async (params?: QueryParams) => {
    return await apiClient.get(ENDPOINTS.ANALYTICS_PURCHASE_OVERALL, params);
  },
  getPurchaseDaily: async (params?: QueryParams) => {
    return await apiClient.get(ENDPOINTS.ANALYTICS_PURCHASE_DAILY, params);
  },
  getPurchaseTrend: async (params?: QueryParams) => {
    return await apiClient.get(ENDPOINTS.ANALYTICS_PURCHASE_TREND, params);
  },
  getPurchaseDashboard: async (params?: QueryParams) => {
    return await apiClient.get(ENDPOINTS.ANALYTICS_PURCHASE_DASHBOARD, params);
  },

  // Sales Analytics
  logSalesEvent: async (data: unknown) => {
    return await apiClient.post(`${ENDPOINTS.ANALYTICS_SALES}/event`, data);
  },
  getOverallSalesAnalytics: async (params?: QueryParams) => {
    return await apiClient.get(ENDPOINTS.ANALYTICS_SALES_OVERALL, params);
  },
  getSalesDaily: async (params?: QueryParams) => {
    return await apiClient.get(ENDPOINTS.ANALYTICS_SALES_DAILY, params);
  },
  getSalesTrend: async (params?: QueryParams) => {
    return await apiClient.get(ENDPOINTS.ANALYTICS_SALES_TREND, params);
  },
  getSalesDashboard: async (params?: QueryParams) => {
    return await apiClient.get(ENDPOINTS.ANALYTICS_SALES_DASHBOARD, params);
  },
};
