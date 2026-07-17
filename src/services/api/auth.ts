import { apiClient } from './apiClient';

const AUTH_BASE = '/auth';
const SERVICE_NAME = 'HYPERLOCAL-INVENTORY';
const KEY_VERSION = '1';

export const authApi = {
  /** Step 1: Get the OAuth login URL from the backend. Redirects user to Debugger Auth. */
  getLoginUrl: async () => {
    return await apiClient.get(`${AUTH_BASE}/login-url`, {
      service: SERVICE_NAME,
      version: KEY_VERSION,
    });
  },

  // Step 2 (callback) is handled server-side:
  // Backend receives token_id from Debugger Auth, generates JWTs,
  // and redirects browser to {FRONTEND_URL}/auth/callback?access_token=...&refresh_token=...
  // AuthCallback.tsx reads those params directly — no API call needed.

  /** Refresh an expired access token using the stored refresh token. */
  refreshToken: async (refresh_token: string, version: string = KEY_VERSION) => {
    return await apiClient.post(`${AUTH_BASE}/refresh`, { refresh_token, version });
  },

  /** Create token (used in DigitalStoreForm) */
  createToken: async (session_id: string, shop_id: string) => {
    return await apiClient.post(`${AUTH_BASE}/token`, { session_id, shop_id });
  },


  /** Revoke a token (logout). */
  revokeToken: async (token: string) => {
    return await apiClient.post(`${AUTH_BASE}/revoke`, { token });
  },

  /** Get public key for a specific version (used by gateway/middleware). */
  getPublicKey: async (version: string = KEY_VERSION) => {
    return await apiClient.get(`${AUTH_BASE}/keys/${version}`);
  },
};
