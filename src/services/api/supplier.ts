import { apiClient } from './apiClient';
import { validateMandatory } from './validation';
import { SCHEMAS } from './schemas';
import { ENDPOINTS, SHOP_ID } from '../endpoints';

export const supplierApi = {
  // POST /suppliers — Create supplier
  createSupplier: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.supplier_create);
    return await apiClient.post(ENDPOINTS.SUPPLIERS, data);
  },

  // PUT /suppliers — Update supplier (id + shop_id in body)
  updateSupplier: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.supplier_update);
    return await apiClient.put(`${ENDPOINTS.SUPPLIERS}`, data);
  },

  // DELETE /suppliers/{shop_id}/{id} — Delete supplier via path params
  deleteSupplier: async (shop_id: string, id: string) => {
    return await apiClient.delete(`${ENDPOINTS.SUPPLIERS}/${shop_id}/${id}`);
  },

  // PUT /suppliers/outstanding — Update outstanding amount
  updateOutstanding: async (data: {
    id: string;
    shop_id: string;
    outstanding_infos: { amount: number };
    type: 'INCREMENT' | 'DECREMENT' | 'DIRECT';
  }) => {
    return await apiClient.put(`${ENDPOINTS.SUPPLIERS}/outstanding`, data);
  },

  // GET /suppliers/by/shop/{shop_id} — Get all suppliers for a shop (with filters)
  getByShop: async (shop_id: string, params?: Record<string, string>) => {
    return await apiClient.get(`${ENDPOINTS.SUPPLIERS}/by/shop/${shop_id}`, params);
  },

  // GET /suppliers/by/{shop_id}/{id} — Get single supplier by id
  getById: async (shop_id: string, id: string) => {
    return await apiClient.get(`${ENDPOINTS.SUPPLIERS}/by/${shop_id}/${id}`);
  },

  // GET /suppliers — Get all suppliers (admin-level, paginated)
  getAll: async (params?: Record<string, string>) => {
    return await apiClient.get(ENDPOINTS.SUPPLIERS, params);
  },

  // ─── Convenience helper used by SearchSelect ────────────────────────────
  searchSuppliers: async (query: string): Promise<any[]> => {
    try {
      const response = await apiClient.get(
        `${ENDPOINTS.SUPPLIERS}/by/shop/${SHOP_ID}`,
        { q: query, limit: '10' }
      );
      const rawData = response?.data || [];
      const suppliers = Array.isArray(rawData) ? rawData : (rawData?.datas ?? []);
      return suppliers.map((s: any) => ({
        ...s,
        id: s.id,
        name: s.name || s.datas?.supplier_name || s.datas?.name || 'Unknown Supplier',
      }));
    } catch {
      return [];
    }
  },

  // ─── Purchase stats (used on SupplierDetail) ─────────────────────────────
  getSupplierPurchaseStats: async (supplierId: string): Promise<any> => {
    try {
      const response = await apiClient.get(
        `/purchases/stats/supplier/${SHOP_ID}/${supplierId}`
      );
      return response?.data;
    } catch {
      return null;
    }
  },
};
