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
 *   const { filters, setFilter } = useUrlFilters(DEFAULTS); // DEFAULTS có sortBy:"", sortDir:""
 *   const sort = useUrlSort(filters.sortBy, filters.sortDir, setFilter);
 *   ...
 *   <DataTable serverSort={sort} ... />
 *   // gửi API: sortBy: filters.sortBy || undefined, sortDir: filters.sortDir || undefined
 */
export function useUrlSort(
  sortByRaw: string | undefined,
  sortDirRaw: string | undefined,
  setFilter: (key: "sortBy" | "sortDir", value: string | undefined) => void,
): ServerSortState {
  const sortBy = sortByRaw || null;
  const sortDir: SortDirection = sortDirRaw === "desc" ? "desc" : "asc";

  const toggleSort = (key: string) => {
    if (sortBy !== key) {
      setFilter("sortBy", key);
      setFilter("sortDir", "asc");
    } else if (sortDir === "asc") {
      setFilter("sortDir", "desc");
    } else {
      setFilter("sortBy", undefined);
      setFilter("sortDir", undefined);
    }
  };

  return { sortBy, sortDir, toggleSort };
}
