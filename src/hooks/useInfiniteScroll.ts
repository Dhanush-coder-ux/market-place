import { useState, useEffect, useCallback, useRef } from "react";

interface UseInfiniteScrollProps<T, F> {
  fetchPage: (limit: number, offset: number, filters: F) => Promise<{ items: T[], hasMore: boolean, total?: number, stats?: any }>;
  filters: F;
  limit?: number;
}

export function useInfiniteScroll<T, F>({ fetchPage, filters, limit = 50 }: UseInfiniteScrollProps<T, F>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [stats, setStats] = useState<any>(null);

  // Deep comparison of filters could be needed if filters is a complex object passed directly.
  // We recommend wrapping filters in useMemo at the consumer level.
  const filtersRef = useRef<F>(filters);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setOffset(1);
    filtersRef.current = filters;
    
    try {
      const res = await fetchPage(limit, 1, filters);
      setItems(res.items || []);
      setHasMore(res.hasMore);
      if (res.total !== undefined) setTotalCount(res.total);
      if (res.stats !== undefined) setStats(res.stats);
    } catch (e) {
      console.error("Infinite scroll initial load error:", e);
      setItems([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [fetchPage, limit, filters]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const nextOffset = offset + 1;
    
    try {
      const res = await fetchPage(limit, nextOffset, filtersRef.current);
      if (res.items && res.items.length > 0) {
        setItems(prev => [...prev, ...res.items]);
        setOffset(nextOffset);
        setHasMore(res.hasMore);
      } else {
        setHasMore(false);
      }
      if (res.total !== undefined) setTotalCount(res.total);
      if (res.stats !== undefined) setStats(res.stats);
    } catch (e) {
      console.error("Infinite scroll load more error:", e);
      setHasMore(false); // Stop trying if error
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, limit, offset, loading, loadingMore, hasMore]);

  // When fetchPage, limit, or filters change, reload from page 1
  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // The ref callback to attach to the last element in the list
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLElement | null) => {
    if (loading || loadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    }, {
      rootMargin: "200px" // Start loading slightly before reaching the bottom
    });

    if (node) observerRef.current.observe(node);
  }, [loading, loadingMore, hasMore, loadMore]);

  return {
    items,
    loading,
    loadingMore,
    hasMore,
    totalCount,
    stats,
    lastElementRef,
    reload: loadInitial
  };
}
