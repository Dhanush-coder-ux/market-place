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

  searchInventories: async (query: string): Promise<any[]> => {
    try {
      const response = await apiClient.get(`${ENDPOINTS.INVENTORIES}/by/shop/${SHOP_ID}?q=${query}`);
      const items = response?.data || (Array.isArray(response) ? response : []);

      return items.map((i: any) => ({
        ...i,
        name: i.name || "Unknown Product",
        stocks: i.stocks ?? 0,
        buy_price: i.buy_price ?? 0,
        sell_price: i.sell_price ?? 0,
        barcode: i.barcode ?? "",
        has_variants: i.has_variant || false,
        combinations: i.variants || []
      }));
    } catch {
      return [];
    }
  }
};
