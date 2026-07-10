import { apiClient } from './apiClient';
import { validateMandatory } from './validation';
import { SCHEMAS } from './schemas';
import { ENDPOINTS } from '../endpoints';

// ═══════════════════════════════════════════════════════════════════════════════
// Hyperlocal StockAdjMov Service — Frontend API Integration
// Covers: Stock Movements/Adjustments CRUD + Cart (init, reserve, cancel, remove)
// ═══════════════════════════════════════════════════════════════════════════════

export const stockMovAdjApi = {

  // ── Stock Movements / Adjustments CRUD ───────────────────────────────────────

  /**
   * Create a new stock movement/adjustment.
   * Requires an active cart session_id from `initCart()`.
   */
  createStockMovAdj: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.stock_mov_adj_create);
    return await apiClient.post(ENDPOINTS.STOCK_MOV_ADJ, data);
  },

  deleteStockMovAdj: async (shopId: string, id: string) => {
    return await apiClient.delete(`${ENDPOINTS.STOCK_MOV_ADJ}/${shopId}/${id}`);
  },

  getStockMovements: async (params?: { limit?: string; offset?: string; q?: string }) => {
    return await apiClient.get(ENDPOINTS.STOCK_MOV_ADJ, params);
  },

  getStockMovementsByShop: async (shopId: string, params?: { limit?: string; offset?: string; q?: string }) => {
    return await apiClient.get(`${ENDPOINTS.STOCK_MOV_ADJ}/by/shop/${shopId}`, params);
  },

  getStockMovementById: async (shopId: string, id: string) => {
    return await apiClient.get(`${ENDPOINTS.STOCK_MOV_ADJ}/by/id/${shopId}/${id}`);
  },

  // ── Cart Operations ──────────────────────────────────────────────────────────
  // The cart workflow for stock adjustments:
  //   1. initCart()       → get a session_id
  //   2. reserveItem()    → add items (reserves inventory for DECREMENT)
  //   3. removeItem()     → remove an item from the cart
  //   4. createStockMovAdj() → finalize with session_id
  //   OR cancelCart()     → abandon the session and release all reservations

  /**
   * Initialize a new cart session. Returns `{ session_id: string }`.
   */
  initCart: async () => {
    return await apiClient.get(`${ENDPOINTS.STOCK_MOV_ADJ_CART}/init`);
  },

  /**
   * Reserve a product in the cart. For DECREMENT items, this creates an
   * inventory reservation to prevent overselling.
   */
  reserveItem: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.cart_reserve);
    return await apiClient.post(`${ENDPOINTS.STOCK_MOV_ADJ_CART}/reserve`, data);
  },

  /**
   * Cancel the entire cart session and release all inventory reservations.
   */
  cancelCart: async (data: { session_id: string }) => {
    validateMandatory(data, SCHEMAS.cart_cancel);
    return await apiClient.post(`${ENDPOINTS.STOCK_MOV_ADJ_CART}/cancel`, data);
  },

  /**
   * Remove a single item from the cart and release its inventory reservation.
   */
  removeItem: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.cart_remove);
    return await apiClient.post(`${ENDPOINTS.STOCK_MOV_ADJ_CART}/remove`, data);
  },

  /**
   * Get stock movements for a specific product ID
   */
  getStockMovementsByProduct: async (shopId: string, productId: string, params?: Record<string, any>) => {
    if (!shopId || !productId) throw new Error("Shop ID and Product ID are required.");
    return await apiClient.get(`${ENDPOINTS.STOCK_MOV_ADJ}/by/product/${shopId}/${productId}`, params);
  },
};
