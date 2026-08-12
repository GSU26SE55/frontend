import { Link } from "react-router-dom";
import { format } from "date-fns";
import { BatteryCharging, MessageSquare, Repeat2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { TicketDTO } from "@/shared/types/ticket/ticket.types";
import TicketStatusBadge from "@/shared/components/ticket/TicketStatusBadge";
import TicketPriorityBadge from "@/shared/components/ticket/TicketPriorityBadge";
// Label map for TicketCategoryEnum — kept in kb.enum since KB shares the exact
// same category set as ticket.
import { KbCategoryLabel } from "@/shared/enums/kb/kb.enum";
import { SlaCountdown } from "./SlaCountdown";

interface Props {
  ticket: TicketDTO;
}

export function TicketCard({ ticket }: Props) {
  return (
    <Link to={`/staff/tickets/${ticket.id}`} className="block h-full">
      {/* h-full + flex: cards in the same row have equal height. Without it, a card
          with an SLA is noticeably taller than one without, and the grid looks uneven. */}
      {/* Incident ticket: red border + faint red background across the whole card. This
          is the most severe level, and it must be recognizable from a distance while
          scanning the grid, not only after reading down to the inner chip. */}
      {/* Incident ticket: the CARD BORDER pulses red continuously — an "needs attention"
          signal following monitoring-system convention. Used instead of a static badge
          because motion catches peripheral vision, visible even before looking straight
          at the card. */}
      <Card
        className={`flex h-full flex-col transition-shadow cursor-pointer hover:shadow-md ${
          // Background at only 2% — just enough to stand out from a regular card, but
          // must stay LIGHT so the pulsing red border still shows through. A darker
          // background would blend the two together and the border's motion would
          // nearly disappear.
          ticket.isIncident ? "incident-pulse bg-destructive/2" : ""
        }`}
      >
        <CardHeader className="pb-2">
          {/* Row 1: ticket code + 2 badges. Row 2: title takes up the FULL width.
              Previously the title shared a column with the badges, so it got squeezed
              and wrapped to 2 lines even when the card had room to spare on the right. */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground font-mono truncate">
              {ticket.code}
            </p>
            <div className="flex shrink-0 items-center gap-1.5">
              <TicketPriorityBadge priority={ticket.priority} />
              <TicketStatusBadge status={ticket.status} />
            </div>
          </div>
          {/* The title is the card's main focal point — noticeably larger and bolder
              than the rest; sized the same as secondary info, nothing would draw the eye. */}
          <p
            className="mt-1.5 text-base font-semibold leading-snug line-clamp-2"
            title={ticket.title}
          >
            {ticket.title}
          </p>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col justify-between gap-3 pt-0">
          <div className="space-y-2">
            {/* Fault type + battery serial — the two things Staff need first (what,
                where). Uses filled chips instead of plain gray text: at 11-12px with
                no color or background, they'd sink below the title and become nearly
                invisible during a quick scan. */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground">
                {KbCategoryLabel[ticket.category] ?? ticket.category}
              </span>
              {ticket.batterySerialNumber && (
                <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 font-mono text-xs font-medium text-foreground">
                  <BatteryCharging
                    className="size-3.5 text-muted-foreground"
                    aria-hidden
                  />
                  {ticket.batterySerialNumber}
                </span>
              )}
            </div>

            {/* Signals that need attention — filled chips so they stand out from
                the white background. Only shown when actually present, so a normal
                card stays compact.
                NO "Incident" chip here: that severity level is shown by the pulsing
                card border. */}
            {(ticket.reopenCount > 0 || ticket.hasUnreadChat) && (
              <div className="flex flex-wrap items-center gap-1.5">
                {ticket.reopenCount > 0 && (
                  <span
                    className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
                    title="This ticket was reopened before — the previous attempt likely didn't fully resolve it"
                  >
                    <Repeat2 className="size-3.5" aria-hidden />
                    Reopened {ticket.reopenCount}×
                  </span>
                )}
                {ticket.hasUnreadChat && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                    <MessageSquare className="size-3.5" aria-hidden />
                    New message
                  </span>
                )}
              </div>
            )}
          </div>

          {/* SLA always sits at the card's bottom thanks to justify-between — every
              clock lines up when scanning down a column. Separated with a border so
              it doesn't blend into the block above. */}
          <div className="border-t pt-2">
            {ticket.slaTimer ? (
              <div className="space-y-1">
                <SlaCountdown slaTimer={ticket.slaTimer} />
                <p className="text-xs text-muted-foreground">
                  Due{" "}
                  <span className="font-medium text-foreground tabular-nums">
                    {format(new Date(ticket.slaTimer.dueAt), "MM/dd HH:mm")}
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No SLA yet — in queue
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
