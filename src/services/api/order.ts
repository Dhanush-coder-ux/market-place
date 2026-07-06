import { apiClient } from "./apiClient";
import { ENDPOINTS } from "../endpoints";

export const orderApi = {
  // ─── ORDERS ──────────────────────────────────────────────────────────────

  /**
   * Create a new order
   */
  createOrder: async (data: Record<string, any>) => {
    return await apiClient.post(ENDPOINTS.ORDERS, data);
  },

  /**
   * Get all orders (paginated, with search/filters)
   */
  getAllOrders: async (params?: Record<string, any>) => {
    return await apiClient.get(ENDPOINTS.ORDERS, params);
  },

  /**
   * Get orders for a specific shop (paginated, with search/filters)
   */
  getOrdersByShop: async (shopId: string, params?: Record<string, any>) => {
    if (!shopId) throw new Error("Shop ID is required.");
    return await apiClient.get(`${ENDPOINTS.ORDERS}/${shopId}`, params);
  },

  /**
   * Search orders for a specific shop
   */
  searchOrders: async (shopId: string, params?: Record<string, any>) => {
    if (!shopId) throw new Error("Shop ID is required.");
    return await apiClient.get(`${ENDPOINTS.ORDERS}/search/${shopId}`, params);
  },

  /**
   * Get a specific order by ID
   */
  getOrderById: async (shopId: string, id: string) => {
    if (!shopId || !id) throw new Error("Shop ID and Order ID are required.");
    return await apiClient.get(`${ENDPOINTS.ORDERS}/${shopId}/${id}`);
  },

  /**
   * Delete an order
   */
  deleteOrder: async (shopId: string, id: string) => {
    if (!shopId || !id) throw new Error("Shop ID and Order ID are required.");
    return await apiClient.delete(`${ENDPOINTS.ORDERS}/${shopId}/${id}`);
  },

  /**
   * Get orders for a specific customer
   */
  getOrdersByCustomer: async (shopId: string, customerId: string, params?: Record<string, any>) => {
    if (!shopId || !customerId) throw new Error("Shop ID and Customer ID are required.");
    return await apiClient.get(`${ENDPOINTS.ORDERS}/by/customer/${shopId}/${customerId}`, params);
  },

  /**
   * Update order status
   */
  updateOrderStatus: async (data: Record<string, any>) => {
    return await apiClient.put(`${ENDPOINTS.ORDERS}/status`, data);
  },

  /**
   * Get customer stats
   */
  getCustomerStats: async (shopId: string, customerId: string) => {
    if (!shopId || !customerId) throw new Error("Shop ID and Customer ID are required.");
    return await apiClient.get(`${ENDPOINTS.ORDERS}/stats/customer/${shopId}/${customerId}`);
  },

  /**
   * Get dashboard stats
   */
  getDashboardStats: async (shopId: string) => {
    if (!shopId) throw new Error("Shop ID is required.");
    return await apiClient.get(`${ENDPOINTS.ORDERS}/stats/dashboard/${shopId}`);
  },

  // ─── CART ────────────────────────────────────────────────────────────────

  /**
   * Initialize a cart session
   */
  initCart: async (data: Record<string, any>) => {
    return await apiClient.post("/cart/init", data);
  },

  /**
   * Add to cart
   */
  addToCart: async (data: Record<string, any>) => {
    return await apiClient.post("/cart/add", data);
  },

  /**
   * Remove from cart
   */
  removeFromCart: async (data: Record<string, any>) => {
    // Some delete calls might require body params or just query strings. 
    // Assuming apiClient.delete takes an optional body.
    return await apiClient.delete("/cart/remove", data);
  },

  /**
   * Cancel cart session
   */
  cancelCart: async (data: Record<string, any>) => {
    return await apiClient.delete("/cart/cancel", data);
  },

  // ─── RETURNS & EXCHANGES ─────────────────────────────────────────────────

  /**
   * Process an order return
   */
  processReturn: async (data: Record<string, any>) => {
    return await apiClient.post(ENDPOINTS.RETURN, data);
  },

  /**
   * Get returns (paginated/filters)
   */
  getReturns: async (params?: Record<string, any>) => {
    return await apiClient.get(ENDPOINTS.RETURN, params);
  },

  /**
   * Process an order exchange
   */
  processExchange: async (data: Record<string, any>) => {
    return await apiClient.post(ENDPOINTS.EXCHANGE, data);
  },

  /**
   * Get exchanges (paginated/filters)
   */
  getExchanges: async (params?: Record<string, any>) => {
    return await apiClient.get(ENDPOINTS.EXCHANGE, params);
  },
};
