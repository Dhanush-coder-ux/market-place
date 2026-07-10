/**
 * Helper to fetch the current user's shops, handling both:
 * - Session ID (Redis session from OAuth redirect) → uses /my-shops
 * - JWT token (after shop check-in) → uses /by/user/{user_id}
 */

import { ENDPOINTS } from "@/services/endpoints";
import { apiClient } from "@/services/api/apiClient";

const isJwt = (token: string) => token.split(".").length === 3;

export const fetchMyShops = async (): Promise<any[]> => {
  const token = localStorage.getItem("auth_token");
  const sessionId = localStorage.getItem("session_id");
  if (!token && !sessionId) return [];

  try {
    if (token && isJwt(token)) {
      // JWT: extract user_id from payload and call /by/user/{user_id}
      const payload = JSON.parse(atob(token.split(".")[1]));
      const userId = payload.user_id || localStorage.getItem("user_id");
      if (!userId) return [];

      const res = await apiClient.get(`${ENDPOINTS.SHOPS}/by/user/${userId}`);
      const data = res?.data ?? res ?? [];
      return Array.isArray(data) ? data.filter(Boolean) : [data].filter(Boolean);
    } else if (sessionId) {
      // Session ID: use /my-shops (apiClient automatically sends X-Session-ID)
      const res = await apiClient.get(`${ENDPOINTS.SHOPS}/my-shops`);
      const data = res?.data ?? res ?? [];
      return Array.isArray(data) ? data.filter(Boolean) : [data].filter(Boolean);
    }
    return [];
  } catch (e) {
    console.error("fetchMyShops error:", e);
    return [];
  }
};
