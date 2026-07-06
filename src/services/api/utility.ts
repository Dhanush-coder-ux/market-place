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
    return await apiClient.delete(ENDPOINTS.SHOP_CATEGORIES, data);
  },

  getShopCategories: async (shopId: string, params?: { limit?: string; offset?: string }) => {
    return await apiClient.get(ENDPOINTS.SHOP_CATEGORIES, { shop_id: shopId, ...params });
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
    return await apiClient.delete(ENDPOINTS.SHOP_UNITS, data);
  },

  getShopUnits: async (shopId: string, params?: { limit?: string; offset?: string }) => {
    return await apiClient.get(ENDPOINTS.SHOP_UNITS, { shop_id: shopId, ...params });
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

  // ── Base Fields ──────────────────────────────────────────────────────────────

  createBaseField: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.base_field_create);
    return await apiClient.post(ENDPOINTS.BASE_FIELDS, data);
  },

  updateBaseField: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.base_field_update);
    return await apiClient.put(ENDPOINTS.BASE_FIELDS, data);
  },

  deleteBaseField: async (fieldId: string, fieldName: string) => {
    return await apiClient.delete(`${ENDPOINTS.BASE_FIELDS}/${fieldId}/${fieldName}`);
  },

  getBaseFields: async () => {
    return await apiClient.get(ENDPOINTS.BASE_FIELDS);
  },

  getBaseFieldById: async (fieldId: string) => {
    return await apiClient.get(`${ENDPOINTS.BASE_FIELDS}/by/id/${fieldId}`);
  },

  getBaseFieldsByServiceName: async (serviceName: string) => {
    return await apiClient.get(`${ENDPOINTS.BASE_FIELDS}/by/s-name/${serviceName}`);
  },

  // ── Custom Fields ────────────────────────────────────────────────────────────

  createCustomField: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.custom_field_create);
    return await apiClient.post(ENDPOINTS.CUSTOM_FIELDS, data);
  },

  updateCustomField: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.custom_field_update);
    return await apiClient.put(ENDPOINTS.CUSTOM_FIELDS, data);
  },

  deleteCustomField: async (fieldId: string, fieldName: string) => {
    return await apiClient.delete(`${ENDPOINTS.CUSTOM_FIELDS}/${fieldId}/${fieldName}`);
  },

  getCustomFields: async () => {
    return await apiClient.get(ENDPOINTS.CUSTOM_FIELDS);
  },

  getCustomFieldById: async (fieldId: string) => {
    return await apiClient.get(`${ENDPOINTS.CUSTOM_FIELDS}/by/id/${fieldId}`);
  },

  getCustomFieldsByServiceName: async (serviceName: string) => {
    return await apiClient.get(`${ENDPOINTS.CUSTOM_FIELDS}/by/s-name/${serviceName}`);
  },

  // ── Base Dropdowns ───────────────────────────────────────────────────────────

  createBaseDropdown: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.base_dropdown_create);
    return await apiClient.post(ENDPOINTS.BASE_DROPDOWNS, data);
  },

  updateBaseDropdown: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.base_dropdown_update);
    return await apiClient.put(ENDPOINTS.BASE_DROPDOWNS, data);
  },

  deleteBaseDropdown: async (ddId: string) => {
    return await apiClient.delete(`${ENDPOINTS.BASE_DROPDOWNS}/${ddId}`);
  },

  getBaseDropdowns: async () => {
    return await apiClient.get(ENDPOINTS.BASE_DROPDOWNS);
  },

  getBaseDropdownById: async (ddId: string) => {
    return await apiClient.get(`${ENDPOINTS.BASE_DROPDOWNS}/by/id/${ddId}`);
  },

  // ── Custom Dropdowns ─────────────────────────────────────────────────────────

  createCustomDropdown: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.custom_dropdown_create);
    return await apiClient.post(ENDPOINTS.CUSTOM_DROPDOWNS, data);
  },

  updateCustomDropdown: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.custom_dropdown_update);
    return await apiClient.put(ENDPOINTS.CUSTOM_DROPDOWNS, data);
  },

  deleteCustomDropdown: async (ddId: string, shopId: string) => {
    return await apiClient.delete(`${ENDPOINTS.CUSTOM_DROPDOWNS}/${ddId}/${shopId}`);
  },

  getCustomDropdowns: async () => {
    return await apiClient.get(ENDPOINTS.CUSTOM_DROPDOWNS);
  },

  getCustomDropdownsByShop: async (shopId: string) => {
    return await apiClient.get(`${ENDPOINTS.CUSTOM_DROPDOWNS}/by/shop/${shopId}`);
  },

  getCustomDropdownsByName: async (shopId: string, name: string) => {
    return await apiClient.get(`${ENDPOINTS.CUSTOM_DROPDOWNS}/by/name/${shopId}/${name}`);
  },

  getCustomDropdownById: async (ddId: string) => {
    return await apiClient.get(`${ENDPOINTS.CUSTOM_DROPDOWNS}/by/id/${ddId}`);
  },

  // ── Image Upload ─────────────────────────────────────────────────────────────

  /**
   * Upload up to 4 images (JPEG, PNG, WebP). Max 5MB each.
   * @param files Array of File objects to upload
   * @returns Array of uploaded image URLs
   */
  uploadImages: async (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return await apiClient.postFormData(ENDPOINTS.UPLOAD_IMAGES, formData);
  },

  /**
   * Delete an uploaded image by its URL.
   */
  deleteImage: async (url: string) => {
    return await apiClient.deleteWithParams(ENDPOINTS.UPLOAD_IMAGES, { url });
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
