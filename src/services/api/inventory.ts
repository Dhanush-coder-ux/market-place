import { apiClient } from './apiClient';
import { validateMandatory } from './validation';
import { SCHEMAS } from './schemas';
import { ENDPOINTS } from '../endpoints';

export const inventoryApi = {
  createInventory: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.inventory_create);
    console.log("Payload:", { datas: data });
    return await apiClient.post(ENDPOINTS.INVENTORIES, { datas: data });
  },
  
  updateInventory: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.inventory_update);
    console.log("Payload:", { datas: data });
    return await apiClient.put(`${ENDPOINTS.INVENTORIES}/${data.id}`, { datas: data });
  },

  adjustStock: async (data: Record<string, any>) => {
    // If it's a creation of stock adjustment
    if (!data.id) {
      validateMandatory(data, SCHEMAS.stock_adjustment_create);
      console.log("Payload:", { datas: data });
      return await apiClient.post(ENDPOINTS.S_ADJUSTMENTS, { datas: data });
    } else {
      validateMandatory(data, SCHEMAS.stock_adjustment_update);
      console.log("Payload:", { datas: data });
      return await apiClient.put(`${ENDPOINTS.S_ADJUSTMENTS}/${data.id}`, { datas: data });
    }
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
      // Assuming GET /inventories/inventories/search is the standard route matching supplier conventions
      const response = await apiClient.get(`${ENDPOINTS.INVENTORIES}/search`, { q: query, limit: "10" });
      return response.datas || [];
    } catch {
      return [];
    }
  }
};
