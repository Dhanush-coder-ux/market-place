import { apiClient } from './apiClient';
import { validateMandatory } from './validation';
import { SCHEMAS } from './schemas';
import { ENDPOINTS } from '../endpoints';

export const supplierApi = {
  createSupplier: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.supplier_create);
    console.log("Payload:", data);
    return await apiClient.post(ENDPOINTS.SUPPLIERS, data);
  },
  
  updateSupplier: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.supplier_update);
    console.log("Payload:", data);
    return await apiClient.put(`${ENDPOINTS.SUPPLIERS}`, data);
  },

  searchSuppliers: async (query: string): Promise<any[]> => {
    try {
      const response = await apiClient.get(`${ENDPOINTS.SUPPLIERS}/search`, { q: query, limit: "10" });
      const suppliers = response.data || [];
      return suppliers.map((s: any) => ({
        ...s,
        id: s.id,
        name: s.name || s.datas?.supplier_name || s.datas?.name || "Unknown Supplier"
      }));
    } catch {
      return [];
    }
  }
};
