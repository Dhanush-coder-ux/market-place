import { createContext, useContext, useState, useRef, useCallback, ReactNode } from "react";

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
  getData: (endpoint: string, params?: Record<string, string>, cacheKey?: string) => Promise<any>;
  postData: (endpoint: string, body: unknown) => Promise<any>;
  putData: (endpoint: string, body: unknown) => Promise<any>;
  deleteData: (endpoint: string) => Promise<any>;
  patchData: (endpoint: string, body: unknown) => Promise<any>;
  clearError: () => void;
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
  // Coarse global loading (kept for backward compat with existing consumers)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Per-request loading map — avoids global re-render on every API call
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const inflightRef = useRef(0);

  const setKey = useCallback((key: string, val: boolean) => {
    setLoadingMap(prev => {
      if (prev[key] === val) return prev; // bail if unchanged
      const next = { ...prev };
      if (val) next[key] = true;
      else delete next[key];
      return next;
    });
  }, []);

  const isLoading = useCallback((key: string) => !!loadingMap[key], [loadingMap]);

  // ─── Core request ──────────────────────────────────────────────────────────
  const request = useCallback(async (
    method: string,
    endpoint: string,
    body?: unknown,
    params?: Record<string, string>,
    options?: { signal?: AbortSignal; cacheKey?: string }
  ): Promise<any> => {
    let url = `${BASE_URL}${endpoint}`;
    if (params && Object.keys(params).length > 0) {
      url += `?${new URLSearchParams(params).toString()}`;
    }

    // GET cache check
    if (method === "GET") {
      const cached = getCached(url);
      if (cached !== null) return cached;
    }

    const key = options?.cacheKey ?? `${method}:${url}`;
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

      // Cache successful GET responses
      if (method === "GET") {
        setCache(url, data);
      } else {
        // Invalidate cache for the affected resource on mutations
        invalidateCache(`${BASE_URL}${endpoint}`);
      }

      return data;
    } catch (err: any) {
      if (err?.name === "AbortError") return null; // navigation cancelled — silent
      setError(err?.message ?? "Network error");
      return null;
    } finally {
      setKey(key, false);
      inflightRef.current -= 1;
      if (inflightRef.current === 0) setLoading(false);
    }
  }, [setKey]);

  // ─── Public API ───────────────────────────────────────────────────────────
  const getData = useCallback(
    (endpoint: string, params?: Record<string, string>, cacheKey?: string) =>
      request("GET", endpoint, undefined, params, { cacheKey }),
    [request]
  );

  const postData = useCallback(
    (endpoint: string, body: unknown) => request("POST", endpoint, body),
    [request]
  );

  const putData = useCallback(
    (endpoint: string, body: unknown) => request("PUT", endpoint, body),
    [request]
  );

  const deleteData = useCallback(
    (endpoint: string) => request("DELETE", endpoint),
    [request]
  );

  const patchData = useCallback(
    (endpoint: string, body: unknown) => request("PATCH", endpoint, body),
    [request]
  );

  const clearError = useCallback(() => setError(null), []);

  return (
    <ApiContext.Provider
      value={{ loading, isLoading, error, getData, postData, putData, deleteData, patchData, clearError }}
    >
      {children}
    </ApiContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useApi = (): ApiContextType => {
  const ctx = useContext(ApiContext);
  if (!ctx) throw new Error("useApi must be used within ApiProvider");
  return ctx;
};
