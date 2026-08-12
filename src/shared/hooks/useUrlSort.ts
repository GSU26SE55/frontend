import type { SortDirection } from "@/shared/hooks/useSortableData";
import type { ServerSortState } from "@/shared/hooks/useServerSort";

/**
 * Adapter: turns `sortBy`/`sortDir` (stored in the URL via useUrlFilters) into a
 * `ServerSortState` to pass into `DataTable serverSort` / `SortableTableHead`.
 *
 * The 3-state toggle (asc → desc → clear) writes straight to the URL — reload-safe,
 * pageNumber auto-resets to 1 (via useUrlFilters). The BE sorts the full dataset
 * before pagination.
 *
 * Usage:
 *   const { filters, setFilters } = useUrlFilters(DEFAULTS); // DEFAULTS has sortBy:"", sortDir:""
 *   const sort = useUrlSort(filters.sortBy, filters.sortDir, setFilters);
 *   ...
 *   <DataTable serverSort={sort} ... />
 *   // send to API: sortBy: filters.sortBy || undefined, sortDir: filters.sortDir || undefined
 *
 * ⚠️ MUST use `setFilters` (plural) — the toggle writes BOTH sortBy + sortDir in a
 * single URL update. If you call setFilter twice separately, the second call reads
 * the stale prev and overwrites the first (losing sortBy) → sort doesn't change &
 * the icon doesn't activate.
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

  const setSort = (key: string | null, dir: SortDirection) => {
    setFilters({ sortBy: key ?? undefined, sortDir: key ? dir : undefined });
  };

  return { sortBy, sortDir, toggleSort, setSort };
}
