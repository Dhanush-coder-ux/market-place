import { apiClient } from './apiClient';
import { validateMandatory } from './validation';
import { SCHEMAS } from './schemas';
import { ENDPOINTS } from '../endpoints';

// ═══════════════════════════════════════════════════════════════════════════════
// Hyperlocal Utility Service — Frontend API Integration
// Covers: Shop Categories, Shop Units, Shop UI IDs, Shop ID Config,
//         Base Fields, Custom Fields, Base Dropdowns, Custom Dropdowns,
//         Image Upload, Activity Logs
// ═══════════════════════════════════════════════════════════════════════════════

export const utilityApi = {

  // ── Shop Categories ──────────────────────────────────────────────────────────

  createShopCategory: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.shop_category_create);
    return await apiClient.post(ENDPOINTS.SHOP_CATEGORIES, data);
  },

  updateShopCategory: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.shop_category_update);
    return await apiClient.put(ENDPOINTS.SHOP_CATEGORIES, data);
  },

  deleteShopCategory: async (data: { id: string; shop_id: string }) => {
    validateMandatory(data, SCHEMAS.shop_category_delete);
    return await apiClient.deleteWithParams(ENDPOINTS.SHOP_CATEGORIES, data);
  },

  getShopCategories: async (shopId: string, params?: { limit?: string; offset?: string; is_active?: boolean | null }) => {
    return await apiClient.get(ENDPOINTS.SHOP_CATEGORIES, { limit: "100", shop_id: shopId, ...(params as any) });
  },

  getShopCategoryById: async (shopId: string, id: string) => {
    return await apiClient.get(`${ENDPOINTS.SHOP_CATEGORIES}/by/id/${shopId}/${id}`);
  },

  initShopCategories: async (shopId: string) => {
    return await apiClient.post(`${ENDPOINTS.SHOP_CATEGORIES}/${shopId}`, {});
  },

  // ── Shop Units ───────────────────────────────────────────────────────────────

  createShopUnit: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.shop_unit_create);
    return await apiClient.post(ENDPOINTS.SHOP_UNITS, data);
  },

  updateShopUnit: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.shop_unit_update);
    return await apiClient.put(ENDPOINTS.SHOP_UNITS, data);
  },

  deleteShopUnit: async (data: { id: string; shop_id: string }) => {
    validateMandatory(data, SCHEMAS.shop_unit_delete);
    return await apiClient.deleteWithParams(ENDPOINTS.SHOP_UNITS, data);
  },

  getShopUnits: async (shopId: string, params?: { limit?: string; offset?: string; is_active?: boolean | null }) => {
    return await apiClient.get(ENDPOINTS.SHOP_UNITS, { limit: "100", ...(params as any), shop_id: shopId });
  },

  getShopUnitById: async (shopId: string, id: string) => {
    return await apiClient.get(`${ENDPOINTS.SHOP_UNITS}/by/id/${shopId}/${id}`);
  },

  initShopUnits: async (shopId: string) => {
    return await apiClient.post(`${ENDPOINTS.SHOP_UNITS}/${shopId}`, {});
  },

  // ── Shop UI IDs ──────────────────────────────────────────────────────────────

  createShopUiId: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.shop_ui_id_create);
    return await apiClient.post(ENDPOINTS.SHOP_UI_IDS, data);
  },

  updateShopUiId: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.shop_ui_id_update);
    return await apiClient.put(ENDPOINTS.SHOP_UI_IDS, data);
  },

  deleteShopUiId: async (data: { id: string; shop_id: string }) => {
    validateMandatory(data, SCHEMAS.shop_ui_id_delete);
    return await apiClient.delete(ENDPOINTS.SHOP_UI_IDS, data);
  },

  getShopUiIds: async (shopId: string, params?: { limit?: string; offset?: string }) => {
    return await apiClient.get(ENDPOINTS.SHOP_UI_IDS, { shop_id: shopId, ...params });
  },

  getShopUiIdById: async (shopId: string, id: string) => {
    return await apiClient.get(`${ENDPOINTS.SHOP_UI_IDS}/by/id/${shopId}/${id}`);
  },

  getShopUiIdsByEntityType: async (shopId: string, entityType: string) => {
    return await apiClient.get(`${ENDPOINTS.SHOP_UI_IDS}/by/entity/${shopId}/${entityType}`);
  },

  getNextUiIdNumber: async (shopId: string, entityType: string) => {
    return await apiClient.get(`${ENDPOINTS.SHOP_UI_IDS}/next/${shopId}/${entityType}`);
  },

  initShopUiIds: async (shopId: string) => {
    return await apiClient.post(`${ENDPOINTS.SHOP_UI_IDS}/${shopId}`, {});
  },

  // ── Shop ID Config ───────────────────────────────────────────────────────────

  getShopIdConfig: async (shopId: string) => {
    return await apiClient.get(`${ENDPOINTS.SHOP_ID_CONFIG}/${shopId}`);
  },

  upsertShopIdConfig: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.shop_id_config_upsert);
    return await apiClient.post(ENDPOINTS.SHOP_ID_CONFIG, data);
  },

  // ── Asset Upload ─────────────────────────────────────────────────────────────

  /**
   * Upload up to 4 assets. Max 5MB each.
   * @param files Array of File objects to upload
   * @returns Array of uploaded asset URLs
   */
  uploadAssets: async (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return await apiClient.postFormData(ENDPOINTS.UPLOAD_ASSETS, formData);
  },

  /**
   * Delete uploaded assets by their URLs.
   */
  deleteAssets: async (urls: string[]) => {
    return await apiClient.deleteWithParams(ENDPOINTS.UPLOAD_ASSETS, { urls } as any);
  },

  // ── Activity Logs ────────────────────────────────────────────────────────────

  createActivityLog: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.activity_log_create);
    return await apiClient.post(ENDPOINTS.ACTIVITY_LOGS, data);
  },

  getActivityLogs: async (shopId: string, params?: { limit?: string; offset?: string }) => {
    return await apiClient.get(`${ENDPOINTS.ACTIVITY_LOGS}/${shopId}`, params);
  },
};
