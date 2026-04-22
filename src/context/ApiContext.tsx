import { createContext, useContext, useState, ReactNode, useCallback } from "react";

const BASE_URL = import.meta.env.VITE_GATEWAY_URL as string;

type ApiContextType = {
  loading: boolean;
  error: string | null;
  getData: (endpoint: string, params?: Record<string, string>) => Promise<any>;
  postData: (endpoint: string, body: unknown) => Promise<any>;
  putData: (endpoint: string, body: unknown) => Promise<any>;
  deleteData: (endpoint: string) => Promise<any>;
  patchData: (endpoint: string, body: unknown) => Promise<any>;
  clearError: () => void;
};

const ApiContext = createContext<ApiContextType | null>(null);

const parseError = async (res: Response): Promise<string> => {
  try {
    const body = await res.json();
    return body?.detail?.msg ?? body?.detail ?? `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
};

export const ApiProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async (
    method: string,
    endpoint: string,
    body?: unknown,
    params?: Record<string, string>
  ): Promise<any> => {
    setLoading(true);
    setError(null);
    try {
      let url = `${BASE_URL}${endpoint}`;
      if (params && Object.keys(params).length > 0) {
        url += `?${new URLSearchParams(params).toString()}`;
      }
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
      if (!res.ok) {
        const msg = await parseError(res);
        setError(msg);
        return null;
      }
      return await res.json();
    } catch (err: any) {
      setError(err?.message ?? "Network error");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getData = useCallback((endpoint: string, params?: Record<string, string>) =>
    request("GET", endpoint, undefined, params), [request]);

  const postData = useCallback((endpoint: string, body: unknown) =>
    request("POST", endpoint, body), [request]);

  const putData = useCallback((endpoint: string, body: unknown) =>
    request("PUT", endpoint, body), [request]);

  const deleteData = useCallback((endpoint: string) =>
    request("DELETE", endpoint), [request]);

  const patchData = useCallback((endpoint: string, body: unknown) =>
    request("PATCH", endpoint, body), [request]);

  const clearError = useCallback(() => setError(null), []);

  return (
    <ApiContext.Provider
      value={{ loading, error, getData, postData, putData, deleteData, patchData, clearError }}
    >
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = (): ApiContextType => {
  const ctx = useContext(ApiContext);
  if (!ctx) throw new Error("useApi must be used within ApiProvider");
  return ctx;
};
