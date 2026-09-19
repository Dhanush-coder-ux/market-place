import { createContext, useContext, useState, useRef, useCallback, ReactNode, useEffect } from "react";
import {
  getGatewayBaseUrl,
  ensureFreshToken,
  refreshTokens,
  clearAuthAndRedirect
} from "@/services/api/tokenManager";

// ─── Simple in-memory GET cache ───────────────────────────────────────────────
// TTL = 60 seconds. Prevents duplicate fetches on fast navigation.
const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { data: unknown; ts: number }>();

const getCached = (url: string): unknown | null => {
  const entry = cache.get(url);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(url);
    return null;
  }
  return entry.data;
};

const setCache = (url: string, data: unknown) => {
  cache.set(url, { data, ts: Date.now() });
};

/** Manually invalidate cache for a given URL prefix (call after POST/PUT/DELETE) */
export const invalidateCache = (prefix: string) => {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
};

// ─── Types ────────────────────────────────────────────────────────────────────

type ApiContextType = {
  /** True if ANY request is in-flight (coarse gate for global spinner) */
  loading: boolean;
  /** Per-request loading state — use this to avoid full-app re-renders */
  isLoading: (key: string) => boolean;
  error: string | null;
  getData: (endpoint: string, params?: Record<string, string>, options?: { signal?: AbortSignal; cacheKey?: string }) => Promise<any>;
  postData: (endpoint: string, body: unknown) => Promise<any>;
  putData: (endpoint: string, body: unknown) => Promise<any>;
  deleteData: (endpoint: string, body?: unknown) => Promise<any>;
  patchData: (endpoint: string, body: unknown) => Promise<any>;
  clearError: () => void;
  _subscribe: (fn: () => void) => () => void;
};

const ApiContext = createContext<ApiContextType | null>(null);

// ─── Error parser ─────────────────────────────────────────────────────────────

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

// ─── Provider ─────────────────────────────────────────────────────────────────

export const ApiProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleClearCache = () => {
      cache.clear();
    };
    window.addEventListener('clear-api-cache', handleClearCache);
    return () => window.removeEventListener('clear-api-cache', handleClearCache);
  }, []);

  const loadingMapRef = useRef<Record<string, boolean>>({});
  const subscribersRef = useRef<Set<() => void>>(new Set());
  const inflightRef = useRef(0);
  const inflightPromises = useRef<Map<string, Promise<any>>>(new Map());

  const notify = useCallback(() => {
    subscribersRef.current.forEach(fn => fn());
  }, []);

  const setKey = useCallback((key: string, val: boolean) => {
    const current = loadingMapRef.current[key] || false;
    if (current === val) return;

    if (val) loadingMapRef.current[key] = true;
    else delete loadingMapRef.current[key];

    notify();
  }, [notify]);

  const isLoading = useCallback((key: string) => {
    return !!loadingMapRef.current[key];
  }, []);

  // --- Core request ---
  const request = useCallback(async (
    method: string,
    endpoint: string,
    body?: unknown,
    params?: Record<string, string>,
    options?: { signal?: AbortSignal; cacheKey?: string }
  ): Promise<any> => {
    const isAuthRoute = endpoint.includes("/auth/");

    // Proactive token refresh if expired
    if (!isAuthRoute) {
      await ensureFreshToken();
    }

    const gatewayUrl = getGatewayBaseUrl();
    let cleanEndpoint = endpoint;
    if (cleanEndpoint.startsWith("/api/")) {
      cleanEndpoint = cleanEndpoint.slice(4);
    } else if (!cleanEndpoint.startsWith("/")) {
      cleanEndpoint = "/" + cleanEndpoint;
    }

    let url = endpoint.startsWith("http") ? endpoint : `${gatewayUrl}${cleanEndpoint}`;

    if (params && Object.keys(params).length > 0) {
      url += `?${new URLSearchParams(params).toString()}`;
    }

    const key = options?.cacheKey ?? `${method}:${url}`;

    if (method === "GET") {
      const cached = getCached(url);
      if (cached !== null) return cached;
    }

    if (inflightPromises.current.has(key)) {
      return inflightPromises.current.get(key);
    }

    const executeRequest = async () => {
      setKey(key, true);
      inflightRef.current += 1;
      if (inflightRef.current === 1) setLoading(true);
      setError(null);

      try {
        const getHeaders = (customToken?: string | null) => {
          const token = customToken !== undefined ? customToken : localStorage.getItem("auth_token");
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
            } catch {
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
          signal: options?.signal,
        });

        // Reactive token refresh on 401
        if (res.status === 401 && !isAuthRoute) {
          const refreshedToken = await refreshTokens();
          if (refreshedToken) {
            res = await fetch(url, {
              method,
              headers: getHeaders(refreshedToken),
              ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
              signal: options?.signal,
            });
          } else {
            clearAuthAndRedirect();
          }
        }

        if (!res.ok) {
          const msg = await parseError(res);
          setError(msg);
          return null;
        }

        const data = await res.json();

        if (method === "GET") {
          setCache(url, data);
        } else {
          cache.clear();
        }

        return data;
      } catch (err: any) {
        if (err?.name === "AbortError") return null;
        setError(err?.message ?? "Network error");
        return null;
      } finally {
        setKey(key, false);
        inflightRef.current -= 1;
        if (inflightRef.current === 0) setLoading(false);
        inflightPromises.current.delete(key);
      }
    };

    const promise = executeRequest();
    inflightPromises.current.set(key, promise);
    return promise;
  }, [setKey]);

  const getData = useCallback((e: string, p?: any, o?: { signal?: AbortSignal; cacheKey?: string }) => request("GET", e, undefined, p, o), [request]);
  const postData = useCallback((e: string, b: any) => request("POST", e, b), [request]);
  const putData = useCallback((e: string, b: any) => request("PUT", e, b), [request]);
  const deleteData = useCallback((e: string, b?: any) => request("DELETE", e, b), [request]);
  const patchData = useCallback((e: string, b: any) => request("PATCH", e, b), [request]);
  const clearError = useCallback(() => setError(null), []);

  const subscribe = useCallback((fn: () => void) => {
    subscribersRef.current.add(fn);
    return () => subscribersRef.current.delete(fn);
  }, []);

  return (
    <ApiContext.Provider
      value={{
        loading,
        isLoading,
        error,
        getData,
        postData,
        putData,
        deleteData,
        patchData,
        clearError,
        _subscribe: subscribe
      }}
    >
      {children}
    </ApiContext.Provider>
  );
};

// --- Hooks ---

export const useApi = (): ApiContextType => {
  const ctx = useContext(ApiContext);
  if (!ctx) throw new Error("useApi must be used within ApiProvider");
  return ctx;
};

/** Specialized hook for tracking a specific request's loading state without re-rendering the whole app */
export const useApiLoading = (key: string): boolean => {
  const api = useApi();
  const [val, setVal] = useState(() => api.isLoading(key));

  useEffect(() => {
    return (api as any)._subscribe(() => {
      const next = api.isLoading(key);
      setVal(next);
    });
  }, [api, key]);

  return val;
};
