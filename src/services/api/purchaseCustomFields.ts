import { apiClient } from "./apiClient";
import { ENDPOINTS } from "../endpoints";

/**
 * Utility: validate required fields in the payload
 */
const validateMandatory = (data: Record<string, any>, requiredFields: string[]) => {
  const missing = requiredFields.filter((field) => {
    const val = data[field];
    return val === undefined || val === null || val === "";
  });
  if (missing.length > 0) {
    throw new Error(`Missing mandatory fields: ${missing.join(", ")}`);
  }
};

export const purchaseCustomFieldsApi = {
  // ─── CUSTOM FIELDS DEFINITIONS ─────────────────────────────────────────────

  /** Create a new custom field definition */
  createField: async (shopId: string, data: Record<string, any>, args: string = "", kwargs: string = "") => {
    validateMandatory(data, ["field_name", "label_name", "type"]);
    return await apiClient.post(ENDPOINTS.PURCHASE_CUSTOM_FIELDS, data, { shop_id: shopId, args, kwargs });
  },

  /** Get all custom field definitions */
  getFields: async (shopId: string, args: string = "", kwargs: string = "") => {
    return await apiClient.get(ENDPOINTS.PURCHASE_CUSTOM_FIELDS, {
      shop_id: shopId,
      args,
      kwargs,
    });
  },

  /** Get a specific custom field definition by ID */
  getField: async (shopId: string, fieldId: string, args: string = "", kwargs: string = "") => {
    if (!fieldId) throw new Error("Field ID is required");
    return await apiClient.get(`${ENDPOINTS.PURCHASE_CUSTOM_FIELDS}/${fieldId}`, {
      shop_id: shopId,
      args,
      kwargs,
    });
  },

  /** Update a custom field definition */
  updateField: async (shopId: string, fieldId: string, data: Record<string, any>, args: string = "", kwargs: string = "") => {
    if (!fieldId) throw new Error("Field ID is required");
    return await apiClient.put(`${ENDPOINTS.PURCHASE_CUSTOM_FIELDS}/${fieldId}`, data, { shop_id: shopId, args, kwargs });
  },

  /** Delete a custom field definition */
  deleteField: async (shopId: string, fieldId: string, args: string = "", kwargs: string = "") => {
    if (!fieldId) throw new Error("Field ID is required");
    return await apiClient.deleteWithParams(`${ENDPOINTS.PURCHASE_CUSTOM_FIELDS}/${fieldId}`, {
      shop_id: shopId,
      args,
      kwargs,
    });
  },

  // ─── CUSTOM FIELD VALUES ───────────────────────────────────────────────────

  /** Upsert a single custom field value */
  upsertValue: async (shopId: string, data: Record<string, any>, args: string = "", kwargs: string = "") => {
    validateMandatory(data, ["purchase_id", "field_id", "value"]);
    return await apiClient.post(`${ENDPOINTS.PURCHASE_CUSTOM_FIELDS}/values`, data, { shop_id: shopId, args, kwargs });
  },

  /** Bulk upsert custom field values */
  bulkUpsertValues: async (shopId: string, data: { purchase_id: string; values: Record<string, any>[] }, args: string = "", kwargs: string = "") => {
    validateMandatory(data, ["purchase_id", "values"]);
    return await apiClient.post(`${ENDPOINTS.PURCHASE_CUSTOM_FIELDS}/values/bulk`, data, { shop_id: shopId, args, kwargs });
  },

  /** Get all custom field values for a specific purchase */
  getValuesByPurchase: async (shopId: string, purchaseId: string, args: string = "", kwargs: string = "") => {
    if (!purchaseId) throw new Error("Purchase ID is required");
    return await apiClient.get(`${ENDPOINTS.PURCHASE_CUSTOM_FIELDS}/values/${purchaseId}`, {
      shop_id: shopId,
      args,
      kwargs,
    });
  },
};
