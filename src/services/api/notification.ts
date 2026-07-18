import { apiClient } from './apiClient';
import { validateMandatory } from './validation';
import { SCHEMAS } from './schemas';
import { ENDPOINTS } from '../endpoints';

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
   * Get stored offline notifications for a specific user
   * Maps to GET /api/v1/notifications/?user_id=...
   */
  getNotifications: async (userId: string) => {
    return await apiClient.get(`${ENDPOINTS.NOTIFICATIONS}/`, { user_id: userId });
  },

  /**
   * Delete a specific notification by its ID
   * Maps to DELETE /api/v1/notifications/{notification_id}
   */
  deleteNotification: async (notificationId: string) => {
    return await apiClient.delete(`${ENDPOINTS.NOTIFICATIONS}/${notificationId}`);
  }
};
