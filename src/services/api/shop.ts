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
  
  // ── Operating Hours (Dummy endpoints extracting from Shop) ───────────────
  getOperatingHours: async (shop_id: string) => {
    const shopRes = await apiClient.get(`${ENDPOINTS.SHOPS}/by/${shop_id}`);
    return { data: shopRes?.data?.operating_hours || [] };
  },

  // ── Delivery Options (Dummy endpoints extracting from Shop) ──────────────
  getDeliveryOptions: async (shop_id: string) => {
    const shopRes = await apiClient.get(`${ENDPOINTS.SHOPS}/by/${shop_id}`);
    return { data: shopRes?.data?.delivery_options || [] };
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
    return await apiClient.put(`${ENDPOINTS.SHOPS}/announcements/${announcement_id}?shop_id=${SHOP_ID}`, data);
  },
  deleteAnnouncement: async (announcement_id: number) => {
    return await apiClient.delete(`${ENDPOINTS.SHOPS}/announcements/${announcement_id}?shop_id=${SHOP_ID}`);
  },

  
  uploadShopImage: async (file: File, imageType: "logo" | "banner") => {
    const userId = localStorage.getItem("user_id") || "";
    const formData = new FormData();
    formData.append("files", file);
    formData.append("shop_id", SHOP_ID);
    formData.append("image_type", imageType);
    formData.append("user_id", userId);
    return await apiClient.postFormData(`${ENDPOINTS.SHOPS}/upload/images`, formData);
  }
};
