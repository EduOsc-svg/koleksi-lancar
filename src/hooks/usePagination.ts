import { useState, useMemo, useEffect, useRef } from "react";

const DEFAULT_ITEMS_PER_PAGE = 10;

export function usePagination<T>(items: T[] | undefined, itemsPerPage: number = DEFAULT_ITEMS_PER_PAGE) {
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

  const goToPage = (page: number) => {
    if (totalPages === 0) return;
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  };

  // Only reset to page 1 when items array changes significantly
  useEffect(() => {
    const currentLength = items?.length;
    
    // Reset to page 1 only if:
    // 1. Items just became available (went from undefined/null to array)
    // 2. Items array length changed significantly (not just reordering)
    if (currentLength !== prevItemsLength.current) {
      if (prevItemsLength.current !== undefined && currentLength !== undefined) {
        // If current page is beyond new total pages, adjust it
        const newTotalPages = Math.ceil(currentLength / itemsPerPage);
        if (currentPage > newTotalPages) {
          setCurrentPage(Math.max(1, newTotalPages));
        }
      } else {
        // First load or items became undefined
        setCurrentPage(1);
      }
      prevItemsLength.current = currentLength;
    }
  }, [items, itemsPerPage, currentPage]);

  return {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    totalItems: items?.length ?? 0,
  };
}
