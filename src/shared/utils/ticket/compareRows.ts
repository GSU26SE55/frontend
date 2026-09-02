import { formatDateTime } from "@/shared/utils/datetime";
import type { TicketDTO } from "@/shared/types/ticket/ticket.types";
import { TicketOriginEnum } from "@/shared/enums/ticket/ticket.enum";
import {
  TICKET_CATEGORY_LABEL,
  TICKET_PRIORITY_LABEL,
} from "@/shared/constants/ticketLabels";
import { displayName } from "@/shared/utils/displayId";

const ORIGIN_LABELS: Record<string, string> = {
  [TicketOriginEnum.ManualByCustomer]: "Created by customer",
  [TicketOriginEnum.AutoFromAlert]: "Automatic from alert",
  [TicketOriginEnum.System]: "Created by system",
};

const EMPTY = "—";

const fmtDate = (v?: string | null) => (v ? formatDateTime(v) : EMPTY);

export interface CompareRow {
  label: string;
  source: string;
  target: string;
  isDiff: boolean;
  /** Different battery / different customer → a sign of a wrong merge; red instead of amber. */
  isCritical?: boolean;
}

/**
 * Builds the comparison rows between the source ticket (merged away) and the target ticket
 * (kept).
 *
 * `customerId` is a GUID and therefore unreadable — pass the customer name taken from the
 * battery asset for display; the COMPARISON still uses `customerId` so it does not depend on
 * data having finished fetching.
 */
export function buildCompareRows(
  source: TicketDTO,
  target: TicketDTO,
  customerNames?: { source?: string | null; target?: string | null },
): CompareRow[] {
  const row = (
    label: string,
    a: string,
    b: string,
    isCritical = false,
  ): CompareRow => ({
    label,
    source: a || EMPTY,
    target: b || EMPTY,
    isDiff: a !== b,
    isCritical,
  });

  return [
    row("Ticket code", source.code, target.code),
    row(
      "Battery (serial)",
      // Serial or nothing — a ticket with no battery (BE sends an empty batteryAssetId for
      // "not tied to a specific battery") must read as "—", not as a GUID pretending to be
      // a serial number.
      displayName(source.batterySerialNumber, ""),
      displayName(target.batterySerialNumber, ""),
      (source.batteryAssetId ?? "") !== (target.batteryAssetId ?? ""),
    ),
    {
      label: "Customer",
      // Show the name (once it has loaded), but compare on customerId — the name may not
      // have finished fetching, and two different customers can share a name.
      //
      // A missing name shows the placeholder, NOT the raw customerId: the id is meaningless
      // to the Manager reviewing this merge, and rendering it made a data gap (an unresolved
      // name, e.g. a ticket with no battery to read the customer from) look like real content.
      source: displayName(customerNames?.source, EMPTY),
      target: displayName(customerNames?.target, EMPTY),
      isDiff: source.customerId !== target.customerId,
      isCritical: true,
    },
    row(
      "Category",
      TICKET_CATEGORY_LABEL[source.category] ?? source.category,
      TICKET_CATEGORY_LABEL[target.category] ?? target.category,
    ),
    // Status already shows as a badge on both header cards — do not repeat the raw enum here.
    row(
      "Priority",
      source.priority ? TICKET_PRIORITY_LABEL[source.priority] : "Not triaged",
      target.priority ? TICKET_PRIORITY_LABEL[target.priority] : "Not triaged",
    ),
    row(
      "Origin",
      ORIGIN_LABELS[source.origin] ?? source.origin,
      ORIGIN_LABELS[target.origin] ?? target.origin,
    ),
    row("Detected at", fmtDate(source.detectedAt), fmtDate(target.detectedAt)),
    row("Created at", fmtDate(source.createdAt), fmtDate(target.createdAt)),
  ];
}
