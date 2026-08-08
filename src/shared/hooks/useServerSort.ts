import { useState } from "react";
import type { SortDirection } from "@/shared/hooks/useSortableData";

export interface ServerSortState {
  /** Column currently sorted (per-endpoint whitelist from the BE). null = use BE default. */
  sortBy: string | null;
  sortDir: SortDirection;
  /** Toggle on header click: asc → desc → clear (back to BE default). */
  toggleSort: (key: string) => void;
  /** Set key + direction directly — used for Select-style UI (no in-between "clear" state like toggleSort). */
  setSort: (key: string | null, dir: SortDirection) => void;
}

/**
 * Sort state for **server-side** sorted tables (BE receives `SortBy`/`SortDir`).
 * Unlike `useSortableData`: does NOT sort the array itself — only holds state to
 * send to the API; the BE returns `items` already sorted across the full dataset
 * before pagination.
 *
 * The 3-state toggle preserves the old UX: 1st click → asc, 2nd → desc, 3rd → clear.
 */
export function useServerSort(
  initialKey: string | null = null,
  initialDirection: SortDirection = "asc",
): ServerSortState {
  const [sortBy, setSortBy] = useState<string | null>(initialKey);
  const [sortDir, setSortDir] = useState<SortDirection>(initialDirection);

  const toggleSort = (key: string) => {
    if (sortBy !== key) {
      setSortBy(key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortBy(null);
      setSortDir("asc");
    }
  };

  const setSort = (key: string | null, dir: SortDirection) => {
    setSortBy(key);
    setSortDir(dir);
  };

  return { sortBy, sortDir, toggleSort, setSort };
}
