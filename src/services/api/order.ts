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
   * Verify delivery using a 6-digit OTP code. Marks order as DELIVERED.
   */
  verifyDelivery: async (data: { shop_id: string; order_id: string; code: string }) => {
    return await apiClient.post(`${ENDPOINTS.ORDERS}/verify-delivery`, data);
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

  // ─── RETURN REQUESTS ─────────────────────────────────────────────────────

  /**
   * Customer / staff creates a return request for an order
   * POST /orders/returns/request
   */
  createReturnRequest: async (data: {
    order_id: string;
    shop_id?: string;
    payment_infos?: Record<string, any>;
    items: Array<{
      order_item_id?: string;
      product_id?: string;
      quantity?: number;
      unit?: string;
      reason?: string;
    }>;
    description: string;
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
    customer_id?: string;
  }) => {
    const payload = {
      ...data,
      payment_infos: data.payment_infos || {
        method: "ORIGINAL_PAYMENT",
        status: "PENDING_REFUND",
      },
    };
    try {
      return await apiClient.post(`${ENDPOINTS.RETURN}/request`, payload);
    } catch {
      try {
        return await apiClient.post(`${ENDPOINTS.ORDERS}/returns/request`, payload);
      } catch {
        return await apiClient.post(`${ENDPOINTS.ORDERS}/return-request`, payload);
      }
    }
  },

  /**
   * Get return requests for a specific shop
   * GET /orders/return-requests/{shop_id}
   */
  getReturnRequests: async (shopId: string, params?: Record<string, any>) => {
    if (!shopId) throw new Error("Shop ID is required.");
    try {
      return await apiClient.get(`${ENDPOINTS.ORDERS}/return-requests/${shopId}`, params);
    } catch {
      // Fallback to /returns/requests/{shop_id}
      return await apiClient.get(`${ENDPOINTS.RETURN}/requests/${shopId}`, params);
    }
  },

  /**
   * Get return requests for a specific order
   */
  getReturnRequestsByOrder: async (orderId: string, shopId?: string) => {
    if (!orderId) throw new Error("Order ID is required.");
    try {
      return await apiClient.get(`${ENDPOINTS.ORDERS}/return-requests/${shopId || 'ALL'}`, { order_id: orderId });
    } catch {
      return await apiClient.get(`${ENDPOINTS.RETURN}/requests/order/${orderId}`);
    }
  },

  /**
   * Get detail for a specific return request
   */
  getReturnRequestDetail: async (requestId: string, shopId?: string) => {
    if (!requestId) throw new Error("Request ID is required.");
    try {
      return await apiClient.get(`${ENDPOINTS.RETURN}/requests/detail/${requestId}`);
    } catch {
      const listRes: any = await apiClient.get(`${ENDPOINTS.ORDERS}/return-requests/${shopId || 'ALL'}`);
      const items = Array.isArray(listRes?.data) ? listRes.data : Array.isArray(listRes) ? listRes : [];
      const match = items.find((r: any) => r.id === requestId);
      if (match) return { data: match };
      throw new Error("Return request not found");
    }
  },

  /**
   * Update return request status (ACCEPTED or REJECTED)
   * PATCH /orders/return-requests/{request_id}/status
   */
  updateReturnRequestStatus: async (
    requestId: string,
    data: { status: "ACCEPTED" | "REJECTED" | string; admin_notes?: string }
  ) => {
    if (!requestId) throw new Error("Request ID is required.");
    try {
      return await apiClient.patch(`${ENDPOINTS.ORDERS}/return-requests/${requestId}/status`, data);
    } catch {
      // Fallback to PUT on /orders or /returns
      try {
        return await apiClient.put(`${ENDPOINTS.ORDERS}/return-requests/${requestId}/status`, data);
      } catch {
        return await apiClient.patch(`${ENDPOINTS.RETURN}/requests/${requestId}/status`, data);
      }
    }
  },
};
