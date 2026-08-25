import { useAmbientHistory } from "./useAmbient";

/**
 * How wide to look around the incident's detection time when pulling ambient evidence.
 *
 * ±2 minutes, deliberately the SAME width as `EVIDENCE_WINDOW_MS` in
 * `useReadingEvidence` (battery tickets). A site-level ticket and a battery-level ticket are
 * read by the same Staff member in the same session; giving the two panels different windows
 * would make "the readings around detection" mean two different spans depending on which kind
 * of ticket happened to be open.
 *
 * Sensors publish roughly once a minute here (see the 22:27:52 / 22:26:52 / 22:25:52 cadence
 * in the history table), so ±2' yields ~5 rows — enough to read the incident as a trend rather
 * than a single stamp, which is the whole point of showing surrounding context.
 */
const AMBIENT_EVIDENCE_WINDOW_MS = 2 * 60 * 1_000; // ±2' — mirrors useReadingEvidence

/**
 * Ambient readings around an environmental incident's detection time — EVIDENCE for a
 * site-level ticket, not the live feed.
 *
 * The backend already filters server-side: `GetAmbientReadingHistoryQuery` applies
 * `Time >= From` / `Time <= To` (AmbientQueryHandlers.cs), and the endpoint authorizes Staff,
 * so no client-side trimming is needed and Staff can read it on their own ticket.
 *
 * pageSize 200 mirrors the battery evidence limit: the window can never realistically hold
 * that many rows, so one page always contains the whole window and the panel never has to
 * paginate to show a complete picture.
 */
export function useAmbientEvidence(
  siteId: string | null | undefined,
  anchorAt: string | null | undefined,
) {
  // Both sides of the anchor: the readings that led up to the incident sit before the stamp
  // and the aftermath sits after it.
  const anchor = anchorAt ? new Date(anchorAt).getTime() : null;
  const from = anchor
    ? new Date(anchor - AMBIENT_EVIDENCE_WINDOW_MS).toISOString()
    : undefined;
  const to = anchor
    ? new Date(anchor + AMBIENT_EVIDENCE_WINDOW_MS).toISOString()
    : undefined;

  const params = {
    siteId: siteId ?? "",
    from,
    to,
    pageNumber: 1,
    pageSize: 200,
  };

  // useAmbientHistory is already gated on a non-empty siteId; the `from`/`to` pair is only
  // meaningful alongside an anchor, so an incident with no timestamp yields no query.
  return useAmbientHistory(params);
}
