import { apiClient } from './apiClient';
import { validateMandatory } from './validation';
import { SCHEMAS } from './schemas';
import { ENDPOINTS } from '../endpoints';

export const supplierApi = {
  createSupplier: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.supplier_create);
    console.log("Payload:", { datas: data });
    return await apiClient.post(ENDPOINTS.SUPPLIERS, { datas: data });
  },
  
  updateSupplier: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.supplier_update);
    console.log("Payload:", { datas: data });
    return await apiClient.put(`${ENDPOINTS.SUPPLIERS}/${data.id}`, { datas: data });
  },

  searchSuppliers: async (query: string): Promise<any[]> => {
    try {
      const response = await apiClient.get(`${ENDPOINTS.SUPPLIERS}/search`, { q: query, limit: "10" });
      return response.datas || [];
    } catch {
      return [];
    }
  }
};
