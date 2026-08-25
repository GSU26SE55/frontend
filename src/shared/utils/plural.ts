/**
 * "3 batteries" / "1 battery". Used by the dashboard status lines, where a count of one
 * would otherwise read "1 batteries offline".
 */
export const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;

/**
 * Joins the problems worth naming into one sentence, or falls back to the all-clear line
 * when there are none.
 */
export const statusLine = (problems: string[], allClear: string) =>
  problems.length > 0 ? `${problems.join(", ")}.` : allClear;
