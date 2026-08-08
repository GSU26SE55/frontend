import { useEffect, useState } from "react";

/**
 * Debounces a value — only returns the new value after it stops changing for `delay` ms.
 * Used for search inputs to avoid calling the API on every keystroke.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
