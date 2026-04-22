import { apiClient } from './apiClient';
import { validateMandatory } from './validation';
import { SCHEMAS } from './schemas';
import { ENDPOINTS, SHOP_ID } from '../endpoints';

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

  createStockAdjustment: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.stock_adjustment_create);
    console.log("Payload:", { datas: data });
    return await apiClient.post(ENDPOINTS.S_ADJUSTMENTS, { datas: data });
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
      // Assuming GET /inventories/inventories/search is the standard route matching supplier conventions
      const response = await apiClient.get(`${ENDPOINTS.INVENTORIES}?q=${query}&shop_id=${SHOP_ID}`);
      const items = response.data || [];
      return items.map((i: any) => {
        const mapped = {
          ...i.datas,
          id: i.id,
          name: i.datas?.name || i.datas?.product_name || "Unknown Product",
          stocks: i.stocks ?? i.datas?.stocks ?? 0,
          buy_price: i.buy_price ?? i.datas?.buy_price ?? 0,
          sell_price: i.sell_price ?? i.datas?.sell_price ?? 0,
          barcode: i.barcode ?? i.datas?.barcode ?? ""
        };
        console.log("Mapped inventory item:", mapped);
        return mapped;
      });
    } catch {
      return [];
    }
  }
};
