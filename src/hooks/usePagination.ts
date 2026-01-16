import { useState, useMemo, useEffect, useRef, useCallback } from "react";

const DEFAULT_ITEMS_PER_PAGE = 10;

export function usePagination<T>(
  items: T[] | undefined,
  itemsPerPage: number = DEFAULT_ITEMS_PER_PAGE,
) {
  const [currentPage, setCurrentPage] = useState(1);
  const prevItemsLength = useRef<number | undefined>(undefined);

  const totalPages = useMemo(() => {
    if (!items) return 0;
    return Math.ceil(items.length / itemsPerPage);
  }, [items, itemsPerPage]);

  const paginatedItems = useMemo(() => {
    if (!items) return [];
    const start = (currentPage - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  }, [items, currentPage, itemsPerPage]);

  // Memoized so it can be safely used in dependency arrays (prevents page-reset loops).
  const goToPage = useCallback(
    (page: number) => {
      if (totalPages === 0) return;
      const validPage = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(validPage);
    },
    [totalPages],
  );

  // Only reset to page 1 when items array changes significantly
  useEffect(() => {
    const currentLength = items?.length;

    // Reset to page 1 only if items just became available or length changed significantly
    if (currentLength !== prevItemsLength.current) {
      // If current page is beyond new total pages, adjust it
      const newTotalPages = Math.ceil((currentLength || 0) / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      } else if (!prevItemsLength.current && currentLength) {
        // Only reset to 1 on initial load
        setCurrentPage(1);
      }
      prevItemsLength.current = currentLength;
    }
  }, [items?.length, itemsPerPage, currentPage]);

  return {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    totalItems: items?.length ?? 0,
  };
}

