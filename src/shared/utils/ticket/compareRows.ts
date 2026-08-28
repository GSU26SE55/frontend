import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import type { TicketDTO } from "@/shared/types/ticket/ticket.types";
import { TicketOriginEnum } from "@/shared/enums/ticket/ticket.enum";
import { TICKET_CATEGORY_LABEL } from "@/shared/constants/ticketLabels";

const ORIGIN_LABELS: Record<string, string> = {
  [TicketOriginEnum.ManualByCustomer]: "Created by customer",
  [TicketOriginEnum.AutoFromAlert]: "Automatic from alert",
  [TicketOriginEnum.CreatedByStaff]: "Created by staff",
  [TicketOriginEnum.System]: "Created by system",
};

const EMPTY = "—";

const fmtDate = (v?: string | null) =>
  v ? format(new Date(v), "dd/MM/yyyy HH:mm", { locale: enUS }) : EMPTY;

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
      source.batterySerialNumber ?? source.batteryAssetId ?? "",
      target.batterySerialNumber ?? target.batteryAssetId ?? "",
      (source.batteryAssetId ?? "") !== (target.batteryAssetId ?? ""),
    ),
    {
      label: "Customer",
      // Show the name (once it has loaded), but compare on customerId — the name may not
      // have finished fetching, and two different customers can share a name.
      source: customerNames?.source || source.customerId || EMPTY,
      target: customerNames?.target || target.customerId || EMPTY,
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
      source.priority ?? "Not triaged",
      target.priority ?? "Not triaged",
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
