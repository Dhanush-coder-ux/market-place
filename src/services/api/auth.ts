import { apiClient } from './apiClient';
import { ENDPOINTS } from '../endpoints';

export const authApi = {
  userCheck: async (email: string, name?: string, mobile_number?: string) => {
    const params: Record<string, string> = { email };
    if (name) params.name = name;
    if (mobile_number) params.mobile_number = mobile_number;
    return await apiClient.get(ENDPOINTS.AUTH_USER_CHECK, params);
  },

  shopCheck: async (user_id: string) => {
    return await apiClient.get(ENDPOINTS.AUTH_SHOP_CHECK, { user_id });
  },

  verifyEmployee: async (token: string) => {
    return await apiClient.get(ENDPOINTS.AUTH_VERIFY, { token });
  },

  getLoginUrl: async () => {
    return await apiClient.get(ENDPOINTS.AUTH_INIT);
  },

  createUser: async (token_id: string) => {
    return await apiClient.get(ENDPOINTS.AUTH_REDIRECT, { token_id });
  },

  createToken: async (session_id: string, shop_id: string) => {
    return await apiClient.post(ENDPOINTS.AUTH_TOKEN_CREATE, { session_id, shop_id });
  },

  shopCheckin: async (session_id: string, shop_id: string) => {
    return await apiClient.post(ENDPOINTS.AUTH_SHOP_CHECKIN, { session_id, shop_id });
  },

  refreshToken: async (refresh_token: string) => {
    return await apiClient.post(ENDPOINTS.AUTH_TOKEN_REFRESH, { refresh_token });
  }
};
