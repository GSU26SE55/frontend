import { format } from "date-fns";

/**
 * The ONE date convention for the whole app: day before month.
 *
 * Before this the app shipped two conventions at once — date-fns `"MM/dd/yyyy"` in ~32 files
 * and `toLocaleString("vi-VN")` (which renders dd/MM) in ~24 — so the same system showed
 * `08/26/2026` on one screen and `26/8/2026` on the next. For any day ≤ 12 the two are
 * indistinguishable: a site with installDate 2026-01-15 read as "01/15/2026" on Sites and
 * would read as 1 March under the Alerts convention. Users cannot tell which screen lies.
 *
 * Pass ISO strings straight from the API; null/undefined render as an em dash rather than
 * "Invalid Date".
 */

export const DATE_FORMAT = "dd/MM/yyyy";
export const DATE_TIME_FORMAT = "dd/MM/yyyy HH:mm";
export const DATE_TIME_SECONDS_FORMAT = "dd/MM/yyyy HH:mm:ss";
export const DATE_TIME_SHORT_FORMAT = "dd/MM HH:mm";

/** Placeholder for a missing date — matches the em dash used across the tables. */
const EMPTY = "—";

const parse = (value: Date | string | null | undefined): Date | null => {
  if (value === null || value === undefined || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** `26/08/2026` */
export const formatDate = (value: Date | string | null | undefined): string => {
  const d = parse(value);
  return d ? format(d, DATE_FORMAT) : EMPTY;
};

/** `26/08/2026 13:46` */
export const formatDateTime = (
  value: Date | string | null | undefined,
): string => {
  const d = parse(value);
  return d ? format(d, DATE_TIME_FORMAT) : EMPTY;
};

/** `26/08/2026 13:46:31` — only where the second actually matters (audit, saga, logs). */
export const formatDateTimeWithSeconds = (
  value: Date | string | null | undefined,
): string => {
  const d = parse(value);
  return d ? format(d, DATE_TIME_SECONDS_FORMAT) : EMPTY;
};

/** `26/08 13:46` — no year, for compact SLA countdown labels where space is tight. */
export const formatDateTimeShort = (
  value: Date | string | null | undefined,
): string => {
  const d = parse(value);
  return d ? format(d, DATE_TIME_SHORT_FORMAT) : EMPTY;
};
