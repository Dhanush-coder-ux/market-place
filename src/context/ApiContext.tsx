import { createContext, useContext, useState, useRef, useCallback, ReactNode, useEffect } from "react";

const BASE_URL = import.meta.env.VITE_GATEWAY_URL as string;

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
  try {
    const body = await res.json();
    const detail = body?.detail;
    if (Array.isArray(detail)) {
      return detail.map((d: any) => d?.msg || d?.description || JSON.stringify(d)).join(", ");
    }
    if (typeof detail === "object" && detail !== null) {
      return detail.description || detail.msg || JSON.stringify(detail);
    }
    return detail ?? body?.message ?? body?.description ?? `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const ApiProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    // This will be called by the useApiLoading hook which subscribes to updates
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
    let url = `${BASE_URL}${endpoint}`;
    if (params && Object.keys(params).length > 0) {
      url += `?${new URLSearchParams(params).toString()}`
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
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
          signal: options?.signal,
        });

        if (!res.ok) {
          const msg = await parseError(res);
          setError(msg);
          return null;
        }

        const data = await res.json();

        if (method === "GET") {
          setCache(url, data);
        } else {
          invalidateCache(`${BASE_URL}${endpoint}`);
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
        _subscribe: subscribe // Internal use for the hook
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
