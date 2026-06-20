import { useEffect, useRef, useState } from "react";
import { useDebounce } from "./useDebounce";

const SEARCH_DEBOUNCE_MS = 1000;
const MIN_SEARCH_CHARS = 2;

/**
 * Quản lý ô search server-side: gõ tức thì trên UI nhưng chỉ đẩy keyword lên
 * filter (→ call API) sau khi ngừng gõ `SEARCH_DEBOUNCE_MS` và đạt tối thiểu
 * `MIN_SEARCH_CHARS` ký tự. Dưới ngưỡng → coi như rỗng (không filter).
 *
 * Đồng bộ 2 chiều với keyword trong URL (qua useUrlFilters): khi keyword bị
 * đổi từ bên ngoài (vd resetFilters), ô input cập nhật theo.
 *
 * Usage:
 *   const search = useDebouncedSearch(filters.keyword ?? "", (kw) =>
 *     setFilter("keyword", kw),
 *   );
 *   <Input value={search.value} onChange={search.onChange} />
 */
export function useDebouncedSearch(
  externalValue: string,
  onCommit: (keyword: string | undefined) => void,
) {
  const [value, setValue] = useState(externalValue);
  const debounced = useDebounce(value, SEARCH_DEBOUNCE_MS);

  // Tránh commit ngược lại đúng giá trị vừa đến từ bên ngoài
  const lastCommitted = useRef(externalValue);

  // Đồng bộ ngược: keyword đổi từ ngoài (resetFilters, back/forward) → cập nhật input
  useEffect(() => {
    if (externalValue !== lastCommitted.current) {
      lastCommitted.current = externalValue;
      setValue(externalValue);
    }
  }, [externalValue]);

  // Đẩy giá trị đã debounce lên filter
  useEffect(() => {
    const trimmed = debounced.trim();
    const next = trimmed.length >= MIN_SEARCH_CHARS ? trimmed : undefined;
    const committed = lastCommitted.current || undefined;
    if (next === committed) return;
    lastCommitted.current = next ?? "";
    onCommit(next);
    // onCommit (setFilter) ổn định qua useCallback nên không cần đưa vào deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return {
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setValue(e.target.value),
  };
}
