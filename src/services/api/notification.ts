import { apiClient } from './apiClient';
import { validateMandatory } from './validation';
import { SCHEMAS } from './schemas';
import { ENDPOINTS } from '../endpoints';

export interface NotificationItem {
  id: string;
  user_id?: string | null;
  title: string;
  message: string;
  type?: string; // info, warning, error, success, announcement
  target_type?: string;
  is_read?: boolean;
  read_at?: string | null;
  created_at?: string;
  additional_metadata?: Record<string, any> | null;
}

export interface NotificationCreate {
  title: string;
  message: string;
  user_id?: string | null;
  type?: string;
  target_type?: string;
  user_ids?: string[] | null;
  additional_metadata?: Record<string, any> | null;
}

export const notificationApi = {
  /**
   * Send a new notification
   * Maps to POST /api/v1/notifications/send
   */
  sendNotification: async (data: NotificationCreate) => {
    validateMandatory(data, SCHEMAS.notification_send);
    return await apiClient.post(`${ENDPOINTS.NOTIFICATIONS}/send`, data);
  },

  /**
   * Get stored notifications for a specific user and/or shop (non-destructive)
   * Maps to GET /api/v1/notifications/?user_id=...&shop_id=...
   */
  getNotifications: async (userId: string, shopId?: string, unreadOnly: boolean = false, limit: number = 100): Promise<NotificationItem[]> => {
    const params: Record<string, string> = {
      user_id: userId,
      limit: String(limit),
    };
    if (shopId) {
      params.shop_id = shopId;
    }
    if (unreadOnly) {
      params.unread_only = "true";
    }
    return await apiClient.get(`${ENDPOINTS.NOTIFICATIONS}/`, params);
  },

  /**
   * Mark a single notification as read
   * Maps to PATCH /api/v1/notifications/{notification_id}/read
   */
  markAsRead: async (notificationId: string) => {
    return await apiClient.patch(`${ENDPOINTS.NOTIFICATIONS}/${notificationId}/read`);
  },

  /**
   * Mark all notifications as read for a user / shop
   * Maps to PATCH /api/v1/notifications/read-all
   */
  markAllAsRead: async (userId: string, shopId?: string) => {
    const params: Record<string, string> = { user_id: userId };
    if (shopId) params.shop_id = shopId;
    return await apiClient.patch(`${ENDPOINTS.NOTIFICATIONS}/read-all`, { user_id: userId, shop_id: shopId }, params);
  },

  /**
   * Delete a specific notification by its ID
   * Maps to DELETE /api/v1/notifications/{notification_id}
   */
  deleteNotification: async (notificationId: string) => {
    return await apiClient.delete(`${ENDPOINTS.NOTIFICATIONS}/${notificationId}`);
  },

  /**
   * Clear all notifications for a specific user / shop
   * Maps to DELETE /api/v1/notifications/clear-all?user_id=...&shop_id=...
   */
  clearAllNotifications: async (userId: string, shopId?: string) => {
    const params: Record<string, string> = { user_id: userId };
    if (shopId) params.shop_id = shopId;
    return await apiClient.deleteWithParams(`${ENDPOINTS.NOTIFICATIONS}/clear-all`, params);
  }
};
