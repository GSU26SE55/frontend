import { useMemo, useState } from "react";

export type SortDirection = "asc" | "desc";

interface UseSortableDataResult<T> {
  sorted: T[];
  sortKey: string | null;
  sortDirection: SortDirection;
  toggleSort: (key: string) => void;
}

/**
 * Sort client-side cho danh sách đang hiển thị (1 trang dữ liệu đã fetch) —
 * không cần đổi API/backend. `getValue` lấy giá trị so sánh theo key hiện tại.
 */
export function useSortableData<T>(
  data: T[],
  getValue: (item: T, key: string) => string | number | Date | null | undefined,
  initialKey: string | null = null,
  initialDirection: SortDirection = "asc",
): UseSortableDataResult<T> {
  const [sortKey, setSortKey] = useState<string | null>(initialKey);
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    initialDirection,
  );

  const toggleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection("asc");
    } else if (sortDirection === "asc") {
      setSortDirection("desc");
    } else {
      setSortKey(null);
    }
  };

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    const dir = sortDirection === "asc" ? 1 : -1;
    return [...data].sort((a, b) => {
      const va = getValue(a, sortKey);
      const vb = getValue(b, sortKey);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (va instanceof Date || vb instanceof Date) {
        return (new Date(va).getTime() - new Date(vb).getTime()) * dir;
      }
      if (typeof va === "number" && typeof vb === "number") {
        return (va - vb) * dir;
      }
      return String(va).localeCompare(String(vb), "vi") * dir;
    });
  }, [data, sortKey, sortDirection, getValue]);

  return { sorted, sortKey, sortDirection, toggleSort };
}
