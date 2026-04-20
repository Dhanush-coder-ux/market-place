import { useState, useRef, useEffect, useCallback } from "react";

export function useSearchSelect<T>(
  fetchOptions?: (query: string, signal: AbortSignal) => Promise<T[]>,
  initialOptions: T[] = [],
  debounceMs = 300
) {
  const [options, setOptions] = useState<T[]>(initialOptions);
  const [loading, setLoading] = useState(false);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync internal state if static options change
  useEffect(() => {
    if (!fetchOptions) {
      setOptions(initialOptions);
    }
  }, [initialOptions, fetchOptions]);

  const handleSearch = useCallback(
    (query: string) => {
      // If no fetch function is provided, let local filtering handle it
      if (!fetchOptions) return;

      // Clear previous timeout and abort previous pending requests
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();

      if (!query.trim()) {
        setOptions([]); // Or revert to initialOptions if preferred
        setLoading(false);
        return;
      }

      timeoutRef.current = setTimeout(async () => {
        abortControllerRef.current = new AbortController();
        setLoading(true);

        try {
          const results = await fetchOptions(
            query,
            abortControllerRef.current.signal
          );
          setOptions(results);
        } catch (error: unknown) {
          if (error instanceof Error && error.name === "AbortError") {
            // Ignore aborted requests; a new one is already in flight
            return;
          }
          console.error("Failed to fetch options:", error);
          setOptions([]);
        } finally {
          setLoading(false);
        }
      }, debounceMs);
    },
    [fetchOptions, debounceMs]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  return { options, loading, handleSearch };
}