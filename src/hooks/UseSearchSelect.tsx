import { useState, useRef, useEffect, useCallback } from "react";

export function useSearchSelect<T>(
  fetchOptions?: (query: string, signal: AbortSignal) => Promise<T[]>,
  initialOptions: T[] = [],
  debounceMs = 300
) {
  const [asyncOptions, setAsyncOptions] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Derive final options: Use async results if fetcher exists, otherwise use static prop
  const options = fetchOptions ? [...initialOptions, ...asyncOptions] : initialOptions;

  const handleSearch = useCallback(
    (query: string) => {
      // If no fetch function is provided, let local filtering handle it
      if (!fetchOptions) return;

      // Clear previous timeout and abort previous pending requests
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();

      const runFetch = async () => {
        abortControllerRef.current = new AbortController();
        setLoading(true);

        try {
          const results = await fetchOptions(
            query,
            abortControllerRef.current.signal
          );
          setAsyncOptions(results);
        } catch (error: unknown) {
          if (error instanceof Error && error.name === "AbortError") {
            return;
          }
          console.error("Failed to fetch options:", error);
          setAsyncOptions([]);
        } finally {
          setLoading(false);
        }
      };

      if (!query.trim()) {
        // Fetch immediately for empty query to make clicking super fast and snappy
        runFetch();
      } else {
        // Debounce active searches to save backend resources
        timeoutRef.current = setTimeout(runFetch, debounceMs);
      }
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