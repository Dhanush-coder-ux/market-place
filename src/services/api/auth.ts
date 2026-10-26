import { apiClient } from './apiClient';

const AUTH_BASE = '/auth';
const SERVICE_NAME = 'HYPERLOCAL-INVENTORY';
const KEY_VERSION = '1';

export const authApi = {
  /** Step 1: Get the OAuth login URL from the backend. Redirects user to Debugger Auth. */
  getLoginUrl: async (versionOrOptions?: string | { version?: string; redirect_url?: string; verify_url?: string }) => {
    const opts = typeof versionOrOptions === "object" ? versionOrOptions : { version: versionOrOptions || KEY_VERSION };
    return await apiClient.get(`${AUTH_BASE}/login-url`, {
      service: SERVICE_NAME,
      version: opts.version || KEY_VERSION,
      flow_type: 'signin',
      ...(opts.redirect_url ? { redirect_url: opts.redirect_url } : {}),
      ...(opts.verify_url ? { verify_url: opts.verify_url } : {}),
    });
  },

  /** Get dedicated OAuth signup URL from backend. */
  getSignupUrl: async (versionOrOptions?: string | { version?: string; redirect_url?: string; verify_url?: string }) => {
    const opts = typeof versionOrOptions === "object" ? versionOrOptions : { version: versionOrOptions || KEY_VERSION };
    return await apiClient.get(`${AUTH_BASE}/signup-url`, {
      service: SERVICE_NAME,
      version: opts.version || KEY_VERSION,
      ...(opts.redirect_url ? { redirect_url: opts.redirect_url } : {}),
      ...(opts.verify_url ? { verify_url: opts.verify_url } : {}),
    });
  },

  /** Direct signup: registers new user, auto-generates random password and emails it */
  signup: async (data: {
    email: string;
    name?: string;
    mobilenumber?: string;
    custom_fields?: Record<string, any>;
    additional_infos?: Record<string, any>;
    password?: string;
  }) => {
    return await apiClient.post(`${AUTH_BASE}/signup`, data);
  },

  /** Dedicated verification for Sign In (account MUST exist, password checked if provided) */
  verifySignin: async (data: { email?: string; mobilenumber?: string; password?: string }) => {
    return await apiClient.post(`${AUTH_BASE}/signin/verify`, data);
  },

  /** Dedicated verification for Sign Up (account MUST NOT exist) */
  verifySignup: async (data: { email?: string; mobilenumber?: string }) => {
    return await apiClient.post(`${AUTH_BASE}/signup/verify`, data);
  },

  /** Verify whether an account exists */
  verifyAccount: async (data: { email?: string; mobilenumber?: string }) => {
    return await apiClient.post(`${AUTH_BASE}/verify`, data);
  },

  /** Direct login with email/phone and password */
  loginWithPassword: async (data: {
    email?: string;
    mobilenumber?: string;
    password: string;
    service?: string;
    version?: string;
  }) => {
    return await apiClient.post(`${AUTH_BASE}/login`, {
      service: SERVICE_NAME,
      version: KEY_VERSION,
      ...data,
    });
  },

  /** Step 2 (callback): Exchange token_id for JWTs */
  callback: async (token_id: string, version: string = KEY_VERSION) => {
    return await apiClient.get(`${AUTH_BASE}/callback`, {
      token_id,
      service: SERVICE_NAME,
      version,
    });
  },

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

  /** Generate Keys */
  generateKeys: async (version: string = KEY_VERSION) => {
    return await apiClient.post(`${AUTH_BASE}/keys/generate`, { version });
  },

  /** Get public key for a specific version (used by gateway/middleware). */
  getPublicKey: async (version: string = KEY_VERSION) => {
    return await apiClient.get(`${AUTH_BASE}/keys/${version}`);
  },

  /** User Management */
  getAllUsers: async () => {
    return await apiClient.get(`${AUTH_BASE}/users`);
  },

  createUserManual: async (data: any) => {
    return await apiClient.post(`${AUTH_BASE}/users`, data);
  },

  getUserById: async (user_id: string) => {
    return await apiClient.get(`${AUTH_BASE}/users/by-id/${user_id}`);
  },

  getUserByEmail: async (email: string) => {
    return await apiClient.get(`${AUTH_BASE}/users/by-email/${email}`);
  },

  getUserByMobile: async (mobilenumber: string) => {
    return await apiClient.get(`${AUTH_BASE}/users/by-mobile/${mobilenumber}`);
  },

  deleteUser: async (user_id: string) => {
    return await apiClient.delete(`${AUTH_BASE}/users/${user_id}`);
  },
};
