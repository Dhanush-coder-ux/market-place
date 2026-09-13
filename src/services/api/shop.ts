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
  
  // ── Operating Hours ───────────────────────────────────────────────────────
  getOperatingHours: async (shop_id: string) => {
    return await apiClient.get(`${ENDPOINTS.SHOPS}/${shop_id}/operating-hours`);
  },
  createOperatingHours: async (shop_id: string, data: any) => {
    return await apiClient.post(`${ENDPOINTS.SHOPS}/${shop_id}/operating-hours`, data);
  },
  updateOperatingHours: async (id: string | number, data: any) => {
    return await apiClient.put(`${ENDPOINTS.SHOPS}/operating-hours/${id}`, data);
  },
  deleteOperatingHours: async (id: string | number) => {
    return await apiClient.delete(`${ENDPOINTS.SHOPS}/operating-hours/${id}`);
  },

  // ── Delivery Options ───────────────────────────────────────────────────────
  getDeliveryOptions: async (shop_id: string) => {
    return await apiClient.get(`${ENDPOINTS.SHOPS}/${shop_id}/delivery`);
  },
  createDeliveryOption: async (shop_id: string, data: any) => {
    return await apiClient.post(`${ENDPOINTS.SHOPS}/${shop_id}/delivery`, data);
  },
  updateDeliveryOption: async (id: string | number, data: any) => {
    return await apiClient.put(`${ENDPOINTS.SHOPS}/delivery/${id}`, data);
  },
  deleteDeliveryOption: async (id: string | number) => {
    return await apiClient.delete(`${ENDPOINTS.SHOPS}/delivery/${id}`);
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

  // ── Announcements ──────────────────────────────────────────────────────────
  getAnnouncements: async (shop_id: string) => {
    return await apiClient.get(`${ENDPOINTS.SHOPS}/${shop_id}/announcements`);
  },
  createAnnouncement: async (shop_id: string, data: Record<string, any>) => {
    return await apiClient.post(`${ENDPOINTS.SHOPS}/${shop_id}/announcements`, data);
  },
  updateAnnouncement: async (announcement_id: number, data: Record<string, any>) => {
    return await apiClient.put(`${ENDPOINTS.SHOPS}/${SHOP_ID}/announcements`, { ...data, id: announcement_id });
  },
  deleteAnnouncement: async (announcement_id: number) => {
    return await apiClient.delete(`${ENDPOINTS.SHOPS}/${SHOP_ID}/announcements/${announcement_id}`);
  },

  
  uploadShopImage: async (file: File, imageType: "logo" | "banner", customShopId?: string) => {
    const userId = localStorage.getItem("user_id") || "";
    const formData = new FormData();
    formData.append("files", file);
    formData.append("shop_id", customShopId || SHOP_ID);
    formData.append("image_type", imageType);
    formData.append("user_id", userId);
    return await apiClient.postFormData(`${ENDPOINTS.SHOPS}/upload/images`, formData);
  }
};
