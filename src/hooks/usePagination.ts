import { useState, useMemo } from "react";

const ITEMS_PER_PAGE = 10;

export function usePagination<T>(items: T[] | undefined) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(() => {
    if (!items) return 0;
    return Math.ceil(items.length / ITEMS_PER_PAGE);
  }, [items]);

  const paginatedItems = useMemo(() => {
    if (!items) return [];
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  }, [items, currentPage]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    totalItems: items?.length ?? 0,
  };
}
