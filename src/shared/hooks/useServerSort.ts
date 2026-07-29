import { useState } from "react";
import type { SortDirection } from "@/shared/hooks/useSortableData";

export interface ServerSortState {
  /** Cột đang sort (whitelist per-endpoint của BE). null = dùng default của BE. */
  sortBy: string | null;
  sortDir: SortDirection;
  /** Toggle theo header click: asc → desc → clear (về default BE). */
  toggleSort: (key: string) => void;
  /** Set trực tiếp key + direction — dùng cho UI dạng Select (không có state "clear" giữa chừng như toggleSort). */
  setSort: (key: string | null, dir: SortDirection) => void;
}

/**
 * State sort cho bảng sort **server-side** (BE nhận `SortBy`/`SortDir`).
 * Khác `useSortableData`: KHÔNG tự sort mảng — chỉ giữ state để gửi lên API,
 * BE trả về `items` đã sort toàn dataset trước khi phân trang.
 *
 * Toggle 3 trạng thái giữ đúng UX cũ: lần 1 → asc, lần 2 → desc, lần 3 → clear.
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
