import type { SortDirection } from "@/shared/hooks/useSortableData";
import type { ServerSortState } from "@/shared/hooks/useServerSort";

/**
 * Adapter: biến `sortBy`/`sortDir` (đã lưu trong URL qua useUrlFilters) thành
 * `ServerSortState` để truyền vào `DataTable serverSort` / `SortableTableHead`.
 *
 * Toggle 3 trạng thái (asc → desc → clear) ghi thẳng vào URL — reload-safe,
 * pageNumber tự reset về 1 (do useUrlFilters). BE sort toàn dataset trước phân trang.
 *
 * Usage:
 *   const { filters, setFilters } = useUrlFilters(DEFAULTS); // DEFAULTS có sortBy:"", sortDir:""
 *   const sort = useUrlSort(filters.sortBy, filters.sortDir, setFilters);
 *   ...
 *   <DataTable serverSort={sort} ... />
 *   // gửi API: sortBy: filters.sortBy || undefined, sortDir: filters.sortDir || undefined
 *
 * ⚠️ PHẢI dùng `setFilters` (số nhiều) — toggle ghi CẢ sortBy + sortDir trong 1 lần
 * cập nhật URL. Nếu gọi 2 lần setFilter riêng, lần sau đọc prev cũ → ghi đè lần trước
 * (mất sortBy) → sort không đổi & icon không active.
 */
export function useUrlSort(
  sortByRaw: string | undefined,
  sortDirRaw: string | undefined,
  setFilters: (updates: {
    sortBy?: string | undefined;
    sortDir?: string | undefined;
  }) => void,
): ServerSortState {
  const sortBy = sortByRaw || null;
  const sortDir: SortDirection = sortDirRaw === "desc" ? "desc" : "asc";

  const toggleSort = (key: string) => {
    if (sortBy !== key) {
      setFilters({ sortBy: key, sortDir: "asc" });
    } else if (sortDir === "asc") {
      setFilters({ sortDir: "desc" });
    } else {
      setFilters({ sortBy: undefined, sortDir: undefined });
    }
  };

  return { sortBy, sortDir, toggleSort };
}
