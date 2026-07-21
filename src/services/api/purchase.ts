import { apiClient } from "./apiClient";
import { ENDPOINTS } from "../endpoints";

/**
 * Validates mandatory fields based on a schema array
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

const SCHEMAS = {
  create: ["shop_id", "supplier_id", "type", "calculation_infos", "gst_infos", "charges_infos", "payment_infos", "purchase_date", "items", "invoice_no"],
  update: ["id", "shop_id"],
};

export const purchaseApi = {
  /**
   * Create a new purchase
   */
  createPurchase: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.create);
    return await apiClient.post(ENDPOINTS.PURCHASES, data);
  },

  /**
   * Update an existing purchase
   */
  updatePurchase: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.update);
    return await apiClient.put(ENDPOINTS.PURCHASES, data);
  },

  /**
   * Get paginated purchases for a specific shop
   * Optionally pass limit, offset, and search query 'q'
   */
  getPurchasesByShop: async (shopId: string, params?: Record<string, any>) => {
    if (!shopId) throw new Error("Shop ID is required to fetch purchases.");
    return await apiClient.get(`${ENDPOINTS.PURCHASES}/by/shop/${shopId}`, params);
  },

  /**
   * Get all purchases (admin view)
   */
  getAllPurchases: async (params?: Record<string, any>) => {
    return await apiClient.get(ENDPOINTS.PURCHASES, params);
  },

  /**
   * Get a specific purchase by ID
   */
  getPurchaseById: async (shopId: string, id: string) => {
    if (!shopId || !id) throw new Error("Shop ID and Purchase ID are required.");
    return await apiClient.get(`${ENDPOINTS.PURCHASES}/by/id/${shopId}/${id}`);
  },

  /**
   * Delete a purchase
   */
  deletePurchase: async (shopId: string, id: string) => {
    if (!shopId || !id) throw new Error("Shop ID and Purchase ID are required.");
    return await apiClient.delete(`${ENDPOINTS.PURCHASES}/${shopId}/${id}`);
  },

  /**
   * Get purchases for a specific product ID
   */
  getPurchasesByProduct: async (shopId: string, productId: string, params?: Record<string, any>) => {
    if (!shopId || !productId) throw new Error("Shop ID and Product ID are required.");
    return await apiClient.get(`${ENDPOINTS.PURCHASES}/by/product/${shopId}/${productId}`, params);
  },

  /**
   * Get purchases for a specific supplier ID
   */
  getPurchasesBySupplier: async (shopId: string, supplierId: string, params?: Record<string, any>) => {
    if (!shopId || !supplierId) throw new Error("Shop ID and Supplier ID are required.");
    return await apiClient.get(`${ENDPOINTS.PURCHASES}/by/supplier/${shopId}/${supplierId}`, params);
  },

  /**
   * Get version history for a specific purchase
   */
  getPurchaseHistory: async (shopId: string, purchaseId: string) => {
    if (!shopId || !purchaseId) throw new Error("Shop ID and Purchase ID are required.");
    return await apiClient.get(`${ENDPOINTS.PURCHASES}/history/${shopId}/${purchaseId}`);
  },
};
