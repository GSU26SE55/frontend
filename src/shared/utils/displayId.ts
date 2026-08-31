/**
 * Display helpers for records whose human-readable name is missing.
 *
 * Why this exists: a name arrives from a different service than the id that references it
 * (staff names are synced into TicketService, customer names come from the battery asset,
 * ticket codes are fetched separately). Whenever that sync lags or the source record is gone,
 * the name is absent while the id is not — and the historical fallback of rendering the raw
 * id meant users saw a bare GUID like `bdf46230-0549-49df-828c-46f5a8e771cc` in the UI.
 *
 * A GUID is never a name. But it is not always useless either, so there are two helpers:
 *
 * - `displayName` — the name or nothing. Use where the id carries no meaning for the reader
 *   (a customer column, a staff dropdown label). Showing a GUID there is strictly worse than
 *   showing a dash: it looks like data, so nobody reports it as a bug.
 * - `shortId` — a truncated, clearly-partial id. Use where the reader still needs to tell two
 *   rows apart or follow a link, and where a dash would destroy that (an assignment row, a
 *   linked ticket reference).
 *
 * Neither renders a full GUID, which is what made these placeholders unreadable.
 */

const EM_DASH = "—";

/**
 * The record's name, or a placeholder when it is missing.
 *
 * Deliberately does NOT fall back to the id: at these call sites the id tells the reader
 * nothing, and rendering it hides the missing-data problem instead of surfacing it.
 */
export function displayName(
  name: string | null | undefined,
  placeholder = EM_DASH,
): string {
  const trimmed = name?.trim();
  return trimmed ? trimmed : placeholder;
}

/** Canonical 8-4-4-4-12 hex GUID, the only shape the BE emits for entity ids. */
const GUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * First segment of a GUID (`bdf46230…`) — enough to distinguish rows and to recognise the
 * same record twice, without pretending to be a name.
 *
 * Anything that is not a full GUID is returned unchanged: a ticket code (`TKT-2608-0005`) or
 * a battery serial (`BMS-JK-24V`) is already readable, and truncating it would lose real
 * information. Matching the whole GUID shape rather than just "8 chars then a dash" is what
 * keeps a serial like `ABCDEFGH-1234` intact.
 */
export function shortId(id: string | null | undefined): string {
  const trimmed = id?.trim();
  if (!trimmed) return EM_DASH;
  return GUID_RE.test(trimmed) ? `${trimmed.slice(0, 8)}…` : trimmed;
}

/**
 * A name when there is one, otherwise a shortened id.
 * For rows that must stay identifiable even when the name has not synced.
 */
export function displayNameOrShortId(
  name: string | null | undefined,
  id: string | null | undefined,
): string {
  const trimmed = name?.trim();
  return trimmed ? trimmed : shortId(id);
}
