import type { TicketDTO } from "@/shared/types/ticket/ticket.types";

/**
 * What a ticket is actually *about* — the thing a technician goes and looks at.
 *
 * Two ticket shapes reach the same detail screen and need opposite layouts:
 *
 *   `battery` — the fault is in one or more battery devices; evidence is the per-device sensor
 *   reading log, cross-checked against that battery type's thresholds.
 *
 *   `site`    — the fault is environmental (smoke, gas leak, flooding). It lives in the cabinet,
 *   so `batteryAssetId` is empty *by design* and the evidence is the site's ambient readings.
 *
 *   `unknown` — neither: no battery attached and no incident record. Genuinely missing data.
 *
 * This existed only as an inline `ids.length === 0 && ticket.environmentalIncidentId` test
 * duplicated in the Manager and Staff detail pages. Duplicated classification drifts: the two
 * copies must agree on the precedence rule (check the incident BEFORE the empty fallback, or a
 * site ticket renders the battery panel's "not linked to any battery" empty state, which reads
 * as broken data rather than *not applicable*). Naming the kind keeps that rule in one place.
 */
export type TicketSubjectKind = "battery" | "site" | "unknown";

export type TicketSubject =
  | { kind: "battery"; batteryAssetIds: string[] }
  | { kind: "site"; incidentId: string }
  | { kind: "unknown" };

/**
 * Normalizes the battery ids: `batteryAssetIds` is the full list, `batteryAssetId` the legacy
 * first-one field. Either may be the only one populated depending on the endpoint.
 */
export function ticketBatteryIds(
  ticket: Pick<TicketDTO, "batteryAssetId" | "batteryAssetIds">,
): string[] {
  if (ticket.batteryAssetIds && ticket.batteryAssetIds.length > 0)
    return ticket.batteryAssetIds;
  return ticket.batteryAssetId ? [ticket.batteryAssetId] : [];
}

/**
 * Classifies a ticket into the subject that decides which info panel and which evidence table
 * the detail page renders.
 *
 * Battery wins when both are present: a ticket carrying real battery ids has per-device
 * readings to show, which are more specific than site-wide ambient data.
 */
export function getTicketSubject(
  ticket: Pick<
    TicketDTO,
    "batteryAssetId" | "batteryAssetIds" | "environmentalIncidentId"
  >,
): TicketSubject {
  const batteryAssetIds = ticketBatteryIds(ticket);
  if (batteryAssetIds.length > 0) return { kind: "battery", batteryAssetIds };
  if (ticket.environmentalIncidentId)
    return { kind: "site", incidentId: ticket.environmentalIncidentId };
  return { kind: "unknown" };
}
