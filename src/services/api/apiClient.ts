const BASE_URL = import.meta.env.VITE_GATEWAY_URL || "http://localhost:8000";

interface RequestOptions {
  method: string;
  endpoint: string;
  body?: unknown;
  params?: Record<string, string>;
}

const parseError = async (res: Response): Promise<string> => {
  // 1. 500+ Internal / Gateway Server Errors
  if (res.status >= 500) {
    return "System error, please try again sometime";
  }

  // 2. 401 Unauthorized / Session Expired
  if (res.status === 401) {
    try {
      const body = await res.clone().json();
      const desc = body?.detail?.description || body?.detail?.msg || (typeof body?.detail === "string" ? body.detail : null);
      if (desc && !desc.toLowerCase().includes("internal") && !desc.toLowerCase().includes("error")) {
        return desc;
      }
    } catch { /* ignore */ }
    return "Session expired. Please log in again to continue.";
  }

  // 3. 400, 422 and other client error details
  try {
    const body = await res.json();
    
    // Check nested detail object or array
    if (typeof body?.detail === "object" && body?.detail !== null) {
      // Pydantic validation errors list
      if (Array.isArray(body.detail)) {
        const errorMsgs = body.detail.map((item: any) => {
          if (typeof item === "string") return item;
          const field = Array.isArray(item?.loc) ? item.loc[item.loc.length - 1] : "";
          const msg = item?.msg || item?.description || JSON.stringify(item);
          return field && field !== "body" ? `${field}: ${msg}` : msg;
        }).filter(Boolean);
        if (errorMsgs.length > 0) return errorMsgs.join(", ");
      }

      // Backend custom HTTP exception dictionary: { title, msg, description, ... }
      const desc = body.detail.description;
      const msg = body.detail.msg;
      if (desc && typeof desc === "string" && desc.trim()) {
        return desc;
      }
      if (msg && typeof msg === "string" && msg.trim()) {
        return msg;
      }
      if (body.detail.error && typeof body.detail.error === "string") {
        return body.detail.error;
      }
      return JSON.stringify(body.detail);
    }
    
    // Direct detail string
    if (typeof body?.detail === "string" && body.detail.trim()) {
      return body.detail;
    }
    
    // Top-level description, msg, error, or message
    if (typeof body?.description === "string" && body.description.trim()) {
      return body.description;
    }
    if (typeof body?.msg === "string" && body.msg.trim()) {
      return body.msg;
    }
    if (typeof body?.message === "string" && body.message.trim()) {
      return body.message;
    }
    if (typeof body?.error === "string" && body.error.trim()) {
      return body.error;
    }

    if (res.status === 400) return "Invalid request. Please check the entered details.";
    if (res.status === 422) return "Validation error. Please verify the submitted data.";
    if (res.status === 403) return "You do not have permission to perform this action.";
    if (res.status === 404) return "Requested resource was not found.";

    return `Request failed (${res.status})`;
  } catch {
    if (res.status === 400) return "Invalid request. Please check the entered details.";
    if (res.status === 422) return "Validation error. Please verify the submitted data.";
    if (res.status === 401) return "Session expired. Please log in again to continue.";
    if (res.status === 403) return "You do not have permission to perform this action.";
    if (res.status === 404) return "Requested resource was not found.";
    return `Request failed (${res.status})`;
  }
};

const handleLogout = () => {
  if (window.location.pathname !== '/login') {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("shop_id");
    localStorage.removeItem("user_id");
    localStorage.removeItem("session_id");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_name");
    window.location.href = "/login";
  }
};

let isRefreshing = false;
let failedQueue: Array<(success: boolean) => void> = [];

async function handleTokenRefresh(): Promise<boolean> {
  if (isRefreshing) {
    return new Promise((resolve) => {
      failedQueue.push((success: boolean) => resolve(success));
    });
  }

  isRefreshing = true;
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) {
    isRefreshing = false;
    failedQueue.forEach(cb => cb(false));
    failedQueue = [];
    return false;
  }

  try {
    let tokenVersion = "1";
    try {
      const p = JSON.parse(atob(refreshToken.split(".")[1]));
      if (p.version) tokenVersion = p.version;
    } catch { /* ignore */ }

    const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken, version: tokenVersion })
    });

    if (refreshRes.ok) {
      const refreshData = await refreshRes.json();
      if (refreshData.access_token) {
        localStorage.setItem("auth_token", refreshData.access_token);
      }
      if (refreshData.refresh_token) {
        localStorage.setItem("refresh_token", refreshData.refresh_token);
      }
      
      isRefreshing = false;
      failedQueue.forEach(cb => cb(true));
      failedQueue = [];
      return true;
    } else {
      isRefreshing = false;
      failedQueue.forEach(cb => cb(false));
      failedQueue = [];
      return false;
    }
  } catch (err) {
    console.error("Token refresh failed:", err);
    isRefreshing = false;
    failedQueue.forEach(cb => cb(false));
    failedQueue = [];
    return false;
  }
}

async function request(options: RequestOptions): Promise<any> {
  const { method, endpoint, body, params } = options;

  let url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;
  if (params && Object.keys(params).length > 0) {
    url += (url.includes("?") ? "&" : "?") + new URLSearchParams(params).toString();
  }

  const getHeaders = () => {
    const token = localStorage.getItem("auth_token");
    let shopId = localStorage.getItem("shop_id");
    let userId = localStorage.getItem("user_id");
    const sessionId = localStorage.getItem("session_id");

    if (token && (!shopId || !userId)) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.user_id && !userId) {
          userId = payload.user_id;
          if (userId) localStorage.setItem("user_id", userId);
        }
        if (payload.shop_id && !shopId) {
          shopId = payload.shop_id;
          if (shopId) localStorage.setItem("shop_id", shopId);
        }
      } catch (e) {
        // ignore
      }
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (shopId) {
      headers["x-shop-id"] = shopId;
    }
    if (userId) {
      headers["x-user-id"] = userId;
    }
    if (sessionId) {
      headers["x-session-id"] = sessionId;
    }

    return headers;
  };

  let res = await fetch(url, {
    method,
    headers: getHeaders(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (res.status === 401) {
    if (!endpoint.includes("/auth/refresh")) {
      const refreshSuccess = await handleTokenRefresh();
      if (refreshSuccess) {
        // Retry the original request
        res = await fetch(url, {
          method,
          headers: getHeaders(),
          ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        });
      } else {
        handleLogout();
      }
    } else {
      handleLogout();
    }
  }

  if (!res.ok) {
    const msg = await parseError(res);
    throw new Error(msg);
  }

  return await res.json();
}

/**
 * Send a multipart/form-data request (used for file uploads).
 * Does NOT set Content-Type — the browser auto-sets it with the boundary.
 */
async function requestFormData(endpoint: string, formData: FormData): Promise<any> {
  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;

  const getHeaders = () => {
    const token = localStorage.getItem("auth_token");
    let shopId = localStorage.getItem("shop_id");
    let userId = localStorage.getItem("user_id");
    const sessionId = localStorage.getItem("session_id");

    if (token && (!shopId || !userId)) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.user_id && !userId) {
          userId = payload.user_id;
          if (userId) localStorage.setItem("user_id", userId);
        }
        if (payload.shop_id && !shopId) {
          shopId = payload.shop_id;
          if (shopId) localStorage.setItem("shop_id", shopId);
        }
      } catch (e) {
        // ignore
      }
    }

    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (shopId) {
      headers["x-shop-id"] = shopId;
    }
    if (userId) {
      headers["x-user-id"] = userId;
    }
    if (sessionId) {
      headers["x-session-id"] = sessionId;
    }

    return headers;
  };

  let res = await fetch(url, {
    method: "POST",
    headers: getHeaders(),
    body: formData,
  });

  if (res.status === 401) {
    if (!endpoint.includes("/auth/refresh")) {
      const refreshSuccess = await handleTokenRefresh();
      if (refreshSuccess) {
        // Retry the original request
        res = await fetch(url, {
          method: "POST",
          headers: getHeaders(),
          body: formData,
        });
      } else {
        handleLogout();
      }
    } else {
      handleLogout();
    }
  }

  if (!res.ok) {
    const msg = await parseError(res);
    throw new Error(msg);
  }

  return await res.json();
}

export const apiClient = {
  get: (endpoint: string, params?: Record<string, string>) => request({ method: "GET", endpoint, params }),
  post: (endpoint: string, body: unknown, params?: Record<string, string>) => request({ method: "POST", endpoint, body, params }),
  put: (endpoint: string, body: unknown, params?: Record<string, string>) => request({ method: "PUT", endpoint, body, params }),
  patch: (endpoint: string, body?: unknown, params?: Record<string, string>) => request({ method: "PATCH", endpoint, body, params }),
  delete: (endpoint: string, body?: unknown) => request({ method: "DELETE", endpoint, body }),
  /** DELETE with query params instead of body (e.g. image delete by URL) */
  deleteWithParams: (endpoint: string, params?: Record<string, string>) => request({ method: "DELETE", endpoint, params }),
  /** POST multipart form-data for file uploads */
  postFormData: (endpoint: string, formData: FormData) => requestFormData(endpoint, formData),
};

