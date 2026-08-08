import { useEffect, useRef, useState } from "react";
import { useDebounce } from "./useDebounce";

const SEARCH_DEBOUNCE_MS = 1000;
const MIN_SEARCH_CHARS = 2;

/**
 * Manages a server-side search box: types instantly in the UI but only pushes
 * the keyword up to the filter (→ API call) after typing pauses for
 * `SEARCH_DEBOUNCE_MS` and reaches at least `MIN_SEARCH_CHARS` characters.
 * Below the threshold → treated as empty (no filter).
 *
 * Two-way sync with the keyword in the URL (via useUrlFilters): when the
 * keyword changes externally (e.g. resetFilters), the input updates to match.
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

  // Avoid committing back the exact value that just arrived from outside
  const lastCommitted = useRef(externalValue);

  // Reverse sync: keyword changed externally (resetFilters, back/forward) → update input
  useEffect(() => {
    if (externalValue !== lastCommitted.current) {
      lastCommitted.current = externalValue;
      setValue(externalValue);
    }
  }, [externalValue]);

  // Push the debounced value up to the filter
  useEffect(() => {
    const trimmed = debounced.trim();
    const next = trimmed.length >= MIN_SEARCH_CHARS ? trimmed : undefined;
    const committed = lastCommitted.current || undefined;
    if (next === committed) return;
    lastCommitted.current = next ?? "";
    onCommit(next);
    // onCommit (setFilter) is stable via useCallback, so it doesn't need to be in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return {
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setValue(e.target.value),
  };
}
