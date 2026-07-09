const BASE_URL = import.meta.env.VITE_GATEWAY_URL || "http://localhost:8000";

interface RequestOptions {
  method: string;
  endpoint: string;
  body?: unknown;
  params?: Record<string, string>;
}

const parseError = async (res: Response): Promise<string> => {
  try {
    const body = await res.json();
    return body?.detail?.msg ?? body?.detail ?? `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
};

async function request(options: RequestOptions): Promise<any> {
  const { method, endpoint, body, params } = options;
  
  let url = `${BASE_URL}${endpoint}`;
  if (params && Object.keys(params).length > 0) {
    url += `?${new URLSearchParams(params).toString()}`;
  }

  const getHeaders = () => {
    const token = localStorage.getItem("auth_token");
    let shopId = localStorage.getItem("shop_id");
    let userId = localStorage.getItem("user_id");
    
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
    if (shopId) headers["X-Shop-Id"] = shopId;
    if (userId) headers["X-User-Id"] = userId;
    
    return headers;
  };

  let res = await fetch(url, {
    method,
    headers: getHeaders(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (res.status === 401) {
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken && !endpoint.includes("/auth/token/refresh")) {
      try {
        const refreshRes = await fetch(`${BASE_URL}/auth/token/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken })
        });
        
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          localStorage.setItem("auth_token", refreshData.access_token);
          if (refreshData.refresh_token) {
            localStorage.setItem("refresh_token", refreshData.refresh_token);
          }
          
          // Retry the original request
          res = await fetch(url, {
            method,
            headers: getHeaders(),
            ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
          });
        }
      } catch (err) {
        console.error("Token refresh failed:", err);
      }
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
  const url = `${BASE_URL}${endpoint}`;

  const getHeaders = () => {
    const token = localStorage.getItem("auth_token");
    let shopId = localStorage.getItem("shop_id");
    let userId = localStorage.getItem("user_id");
    
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
    if (shopId) headers["X-Shop-Id"] = shopId;
    if (userId) headers["X-User-Id"] = userId;
    
    return headers;
  };

  let res = await fetch(url, {
    method: "POST",
    headers: getHeaders(),
    body: formData,
  });

  if (res.status === 401) {
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${BASE_URL}/auth/token/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken })
        });
        
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          localStorage.setItem("auth_token", refreshData.access_token);
          if (refreshData.refresh_token) {
            localStorage.setItem("refresh_token", refreshData.refresh_token);
          }
          
          res = await fetch(url, {
            method: "POST",
            headers: getHeaders(),
            body: formData,
          });
        }
      } catch (err) {
        console.error("Token refresh failed:", err);
      }
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
  delete: (endpoint: string, body?: unknown) => request({ method: "DELETE", endpoint, body }),
  /** DELETE with query params instead of body (e.g. image delete by URL) */
  deleteWithParams: (endpoint: string, params?: Record<string, string>) => request({ method: "DELETE", endpoint, params }),
  /** POST multipart form-data for file uploads */
  postFormData: (endpoint: string, formData: FormData) => requestFormData(endpoint, formData),
};
