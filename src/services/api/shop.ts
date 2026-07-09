import { apiClient } from './apiClient';
import { validateMandatory } from './validation';
import { SCHEMAS } from './schemas';
import { ENDPOINTS, SHOP_ID } from '../endpoints';

export const shopApi = {
  createShop: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.shop_create);
    console.log("Payload:", data);
    return await apiClient.post(ENDPOINTS.SHOPS, data);
  },
  
  updateShop: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.shop_update);
    console.log("Payload:", data);
    return await apiClient.put(`${ENDPOINTS.SHOPS}`, data);
  },
  
  getShops: async (params?: Record<string, string>) => {
    return await apiClient.get(ENDPOINTS.SHOPS, params);
  },
  
  getShopById: async (shop_id: string) => {
    return await apiClient.get(`${ENDPOINTS.SHOPS}/by/${shop_id}`);
  },
  
  getMyShops: async (session_id?: string) => {
    return await apiClient.get(ENDPOINTS.MY_SHOPS, session_id ? { session_id } : undefined);
  },
  
  getShopsByUser: async (user_id: string) => {
    return await apiClient.get(`${ENDPOINTS.SHOPS}/by/user/${user_id}`);
  },
  
  deleteShop: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.shop_delete);
    return await apiClient.delete(`${ENDPOINTS.SHOPS}/${data.id}`);
  },

  // ── Operating Hours ────────────────────────────────────────────────────────
  getOperatingHours: async (shop_id: string) => {
    return await apiClient.get(`${ENDPOINTS.SHOPS}/${shop_id}/operating-hours`);
  },
  createOperatingHours: async (shop_id: string, data: Record<string, any>) => {
    return await apiClient.post(`${ENDPOINTS.SHOPS}/${shop_id}/operating-hours`, data);
  },
  updateOperatingHours: async (hours_id: number, data: Record<string, any>) => {
    return await apiClient.put(`${ENDPOINTS.SHOPS}/operating-hours/${hours_id}?shop_id=${SHOP_ID}`, data);
  },
  deleteOperatingHours: async (hours_id: number) => {
    return await apiClient.delete(`${ENDPOINTS.SHOPS}/operating-hours/${hours_id}?shop_id=${SHOP_ID}`);
  },

  // ── Delivery Options ───────────────────────────────────────────────────────
  getDeliveryOptions: async (shop_id: string) => {
    return await apiClient.get(`${ENDPOINTS.SHOPS}/${shop_id}/delivery`);
  },
  createDeliveryOption: async (shop_id: string, data: Record<string, any>) => {
    return await apiClient.post(`${ENDPOINTS.SHOPS}/${shop_id}/delivery`, data);
  },
  updateDeliveryOption: async (delivery_id: number, data: Record<string, any>) => {
    return await apiClient.put(`${ENDPOINTS.SHOPS}/delivery/${delivery_id}?shop_id=${SHOP_ID}`, data);
  },
  deleteDeliveryOption: async (delivery_id: number) => {
    return await apiClient.delete(`${ENDPOINTS.SHOPS}/delivery/${delivery_id}?shop_id=${SHOP_ID}`);
  },

  // ── Announcements ──────────────────────────────────────────────────────────
  getAnnouncements: async (shop_id: string) => {
    return await apiClient.get(`${ENDPOINTS.SHOPS}/${shop_id}/announcements`);
  },
  createAnnouncement: async (shop_id: string, data: Record<string, any>) => {
    return await apiClient.post(`${ENDPOINTS.SHOPS}/${shop_id}/announcements`, data);
  },
  updateAnnouncement: async (announcement_id: number, data: Record<string, any>) => {
    return await apiClient.put(`${ENDPOINTS.SHOPS}/announcements/${announcement_id}?shop_id=${SHOP_ID}`, data);
  },
  deleteAnnouncement: async (announcement_id: number) => {
    return await apiClient.delete(`${ENDPOINTS.SHOPS}/announcements/${announcement_id}?shop_id=${SHOP_ID}`);
  }
};
