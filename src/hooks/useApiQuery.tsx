import { useState, useEffect, useRef, useCallback } from "react";
import { useApi } from "@/context/ApiContext";

interface UseApiQueryOptions {
  /** Re-fetch automatically when this value changes (e.g. search query) */
  deps?: any[];
  /** Skip the fetch entirely (e.g. while a required param is not yet set) */
  skip?: boolean;
  /** Override the default 60s cache TTL */
  ttl?: number;
}

interface UseApiQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * useSWR-like hook that wraps ApiContext.getData with:
 * - Per-request loading state (no global context re-renders)
 * - Automatic AbortController cleanup on unmount or dep change
 * - Deduplication via the built-in ApiContext GET cache
 *
 * @example
 * const { data, loading } = useApiQuery<Product[]>("/products", { deps: [shopId] });
 */
export function useApiQuery<T = unknown>(
  endpoint: string,
  params?: Record<string, string>,
  options: UseApiQueryOptions = {}
): UseApiQueryResult<T> {
  const { getData } = useApi();
  const { deps = [], skip = false } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  // AbortController ref — cancelled on unmount or dep change
  const abortRef = useRef<AbortController | null>(null);

  const fetch = useCallback(async () => {
    if (skip) return;

    // Cancel any in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const result = await getData(endpoint, params);
      if (abortRef.current?.signal.aborted) return;
      setData(result);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setError(e?.message ?? "Failed to fetch");
    } finally {
      if (!abortRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, skip, trigger, JSON.stringify(params), ...deps]);

  useEffect(() => {
    fetch();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetch]);

  const refetch = useCallback(() => setTrigger(t => t + 1), []);

  return { data, loading, error, refetch };
}
