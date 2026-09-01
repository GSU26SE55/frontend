import type { TicketDTO } from "@/shared/types/ticket/ticket.types";
import { TicketOriginEnum } from "@/shared/enums/ticket/ticket.enum";

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
  // `incidentId` KHÔNG bắt buộc: sự cố môi trường đến từ hai đường và chỉ một đường có bản ghi
  // incident. Đường ngưỡng ambient (nhiệt độ / độ ẩm / gas của tủ) chấm thẳng số đo rồi đẻ ticket,
  // không đi qua EnvironmentalIncident — nhưng vẫn là ticket CẤP SITE và vẫn cần đúng bộ chứng cứ
  // ambient đó. `siteId` là thứ luôn có ở cả hai đường, nên nó mới là field bắt buộc.
  | { kind: "site"; incidentId?: string; siteId?: string }
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
    | "batteryAssetId"
    | "batteryAssetIds"
    | "environmentalIncidentId"
    | "origin"
    | "siteId"
  >,
): TicketSubject {
  const batteryAssetIds = ticketBatteryIds(ticket);
  if (batteryAssetIds.length > 0) return { kind: "battery", batteryAssetIds };
  if (ticket.environmentalIncidentId)
    return {
      kind: "site",
      incidentId: ticket.environmentalIncidentId,
      siteId: ticket.siteId ?? undefined,
    };
  // Ticket môi trường từ ngưỡng ambient: không có incident record nên trước đây rơi xuống
  // "unknown" và màn chi tiết KHÔNG hiện bộ chứng cứ nào — trong khi ticket ngập nước (có
  // incident) thì hiện đầy đủ. Cùng một loại sự cố, hai màn hình khác hẳn nhau.
  if (ticket.origin === TicketOriginEnum.AutoFromEnvironment)
    return { kind: "site", siteId: ticket.siteId ?? undefined };
  return { kind: "unknown" };
}
