import { apiClient } from './apiClient';
import { validateMandatory } from './validation';
import { SCHEMAS } from './schemas';
import { ENDPOINTS, SHOP_ID } from '../endpoints';

export const inventoryApi = {
  createInventory: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.inventory_create);
    console.log("Payload:", data);
    return await apiClient.post(ENDPOINTS.INVENTORIES, data);
  },

  updateInventory: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.inventory_update);
    console.log("Payload:", data);
    return await apiClient.put(`${ENDPOINTS.INVENTORIES}`, data);
  },

  deleteInventory: async (data: { id: string; shop_id: string }) => {
    validateMandatory(data, SCHEMAS.inventory_delete);
    return await apiClient.delete(ENDPOINTS.INVENTORIES, data);
  },

  createStockAdjustment: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.stock_adjustment_create);
    console.log("Payload:", data);
    return await apiClient.post(ENDPOINTS.S_ADJUSTMENTS, data);
  },

  updateStockAdjustment: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.stock_adjustment_update);
    console.log("Payload:", { datas: data });
    return await apiClient.put(`${ENDPOINTS.S_ADJUSTMENTS}/${data.id}`, { datas: data });
  },

  deleteStockAdjustment: async (id: string) => {
    return await apiClient.delete(`${ENDPOINTS.S_ADJUSTMENTS}/${id}`);
  },

  createPurchase: async (data: Record<string, any>) => {
    if (!data.id) {
      validateMandatory(data, SCHEMAS.purchase_create);
      console.log("Payload:", { datas: data });
      return await apiClient.post(ENDPOINTS.PURCHASES, { datas: data });
    } else {
      validateMandatory(data, SCHEMAS.purchase_update);
      console.log("Payload:", { datas: data });
      return await apiClient.put(`${ENDPOINTS.PURCHASES}/${data.id}`, { datas: data });
    }
  },

  searchInventories: async (query: string, isActive?: boolean): Promise<any[]> => {
    try {
      const activeParam = isActive ? `&is_active=True` : "";
      const response = await apiClient.get(`${ENDPOINTS.INVENTORIES}/search/${SHOP_ID}?q=${query}${activeParam}`);
      const items = response?.data || (Array.isArray(response) ? response : []);

      return items.map((i: any) => {
        const d = i.datas || {};
        return {
          ...i,
          name: i.name || d.name || "Unknown Product",
          stocks: i.stocks ?? d.stocks ?? 0,
          buy_price: i.buy_price ?? d.buy_price ?? 0,
          sell_price: i.sell_price ?? d.sell_price ?? 0,
          barcode: i.barcode ?? d.barcode ?? "",
          unit: i.unit || d.unit || "pc",
          gst: i.gst || d.gst || "18%",
          has_variants: i.has_variant ?? d.has_variant ?? false,
          batchTracking: i.has_batch ?? d.has_batch ?? false,
          requireSerial: i.has_serialno ?? d.has_serialno ?? false,
          combinations: i.variants || d.variants || []
        };
      });
    } catch {
      return [];
    }
  },

  getInventoryById: async (id: string) => {
    return await apiClient.get(`${ENDPOINTS.INVENTORIES}/by/${SHOP_ID}/${id}`);
  },

  exchangeOrder: async (data: any) => {
    console.log("Exchange Payload:", data);
    return await apiClient.post(ENDPOINTS.EXCHANGE, data);
  },

  bulkExchangeOrder: async (data: any) => {
    console.log("Bulk Exchange Payload:", data);
    return await apiClient.post(ENDPOINTS.EXCHANGE, data);
  },

  returnOrderItem: async (data: { order_id: string; item_id: string }) => {
    console.log("Return Payload:", data);
    return await apiClient.post(ENDPOINTS.RETURN, data);
  },

  bulkReturnOrder: async (data: any) => {
    console.log("Bulk Return Payload:", data);
    return await apiClient.post(ENDPOINTS.RETURN, data);
  }
};
