import { useEffect, useState } from "react";

/**
 * Debounce một giá trị — chỉ trả về giá trị mới sau khi ngừng thay đổi `delay` ms.
 * Dùng cho search input để tránh call API mỗi keystroke.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
