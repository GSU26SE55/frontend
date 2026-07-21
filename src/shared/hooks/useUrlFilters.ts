import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

type Primitive = string | number | boolean | undefined | null;
type FilterRecord = Record<string, Primitive>;

/**
 * Sync filter state with URL search params.
 * - On mount, initializes from URL (falls back to defaults).
 * - On change, writes to URL and resets pageNumber to 1 (unless changing pageNumber itself).
 * - Reload-safe: refresh restores exact filter state from URL.
 * - hasActiveFilter: true when any non-pagination filter differs from default.
 *
 * Usage:
 *   const { filters, setFilter, resetFilters, hasActiveFilter } = useUrlFilters(defaults);
 */
export function useUrlFilters<T extends FilterRecord>(defaults: T) {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<T>(() => {
    const result = { ...defaults } as T;
    for (const key of Object.keys(defaults) as (keyof T)[]) {
      const raw = searchParams.get(key as string);
      if (raw === null) continue;
      const def = defaults[key];
      if (typeof def === "number") {
        const n = Number(raw);
        if (!Number.isNaN(n)) (result as FilterRecord)[key as string] = n;
      } else if (typeof def === "boolean") {
        (result as FilterRecord)[key as string] = raw === "true";
      } else {
        (result as FilterRecord)[key as string] = raw || undefined;
      }
    }
    return result;
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const setFilter = useCallback(
    <K extends keyof T>(key: K, value: T[K] | undefined) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value === undefined || value === null || value === "") {
            next.delete(key as string);
          } else {
            next.set(key as string, String(value));
          }
          // Reset to page 1 on any filter change (except paging itself)
          if (key !== "pageNumber") {
            next.set("pageNumber", "1");
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // Set nhiều key trong MỘT lần cập nhật URL — tránh race khi gọi setFilter
  // liên tiếp (mỗi setFilter là 1 setSearchParams riêng, lần sau đọc prev cũ
  // nên ghi đè lần trước). Dùng cho toggle sort (sortBy + sortDir cùng lúc).
  const setFilters = useCallback(
    (updates: Partial<Record<keyof T, T[keyof T] | undefined>>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          let touchedNonPage = false;
          for (const [key, value] of Object.entries(updates)) {
            if (value === undefined || value === null || value === "") {
              next.delete(key);
            } else {
              next.set(key, String(value));
            }
            if (key !== "pageNumber") touchedNonPage = true;
          }
          if (touchedNonPage) next.set("pageNumber", "1");
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const resetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  // True when any non-pagination key differs from its default value
  const hasActiveFilter = useMemo(() => {
    const pagingKeys = new Set(["pageNumber", "pageSize"]);
    return Object.keys(defaults).some((key) => {
      if (pagingKeys.has(key)) return false;
      const current = filters[key];
      const def = defaults[key];
      return current !== def && !!current;
    });
  }, [filters, defaults]);

  return { filters, setFilter, setFilters, resetFilters, hasActiveFilter };
}
