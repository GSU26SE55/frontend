import { Link } from "react-router-dom";
import { format } from "date-fns";
import { BatteryCharging, Repeat2, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TicketDTO } from "@/shared/types/ticket/ticket.types";
import {
  SlaTimerStatusEnum,
  TicketAssignmentRoleEnum,
  TicketAssignmentRoleLabel,
} from "@/shared/enums/ticket/ticket.enum";
import { useSessionStore } from "@/shared/stores/sessionStore";
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
  // Which role the CURRENT staff member holds on this ticket. Primary owns it; Supporter only
  // assists, so the two demand very different attention when scanning the dashboard.
  const accountId = useSessionStore((s) => s.user?.accountId);
  const myRole = accountId
    ? ticket.assignments?.find((a) => a.staffId === accountId)?.role
    : undefined;

  // The two states that mean "this one, now": a site incident, or a clock that has
  // already run out. Both get the same treatment, because to the person scanning the
  // board they mean the same thing.
  const breached = ticket.slaTimer?.status === SlaTimerStatusEnum.Breached;
  const alert = ticket.isIncident || breached;

  return (
    <Link to={`/staff/tickets/${ticket.id}`} className="block h-full">
      {/* Flat tile, not a rounded card: square corners and one hairline, so the board
          reads as a table of work rather than a row of product cards. h-full + flex keeps
          tiles in a row the same height — without it a tile with an SLA is taller than
          one without and the grid looks ragged. */}
      <article
        className={cn(
          "flex h-full cursor-pointer flex-col gap-3 border border-border bg-card p-4 transition-colors",
          alert
            ? // An alert tile carries the accent on its leading edge plus a wash, no
              // outline: a ring around the whole tile reads as the CONTAINER being in an
              // error state, the edge reads as a property of the ticket.
              "border-l-4 border-l-p1 bg-p1-soft hover:bg-p1/15"
            : "hover:bg-muted/40",
        )}
      >
        <div>
          {/* Row 1: ticket code + badges. Row 2: title takes the FULL width — sharing a
              column with the badges squeezed it into two lines with room to spare. */}
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-mono text-xs text-muted-foreground">
              {ticket.code}
            </p>
            {/* The role badge joins the EXISTING badge row rather than adding a new one:
                an extra row would change the tile's height and shift the SLA line. */}
            <div className="flex shrink-0 items-center gap-1.5">
              {/* Says WHY the tile is red. The edge accent alone is easy to read as
                  decoration; a word is not. */}
              {alert && (
                <span className="inline-flex items-center gap-1 rounded-md bg-p1 px-1.5 py-0.5 text-xs font-semibold text-white">
                  <TriangleAlert className="size-3" aria-hidden />
                  {ticket.isIncident ? "Incident" : "Overdue"}
                </span>
              )}
              {myRole && (
                <span
                  className={
                    myRole === TicketAssignmentRoleEnum.PrimaryHandler
                      ? "rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
                      : "rounded-md bg-purple-100 px-1.5 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-500/15 dark:text-purple-400"
                  }
                  title={TicketAssignmentRoleLabel[myRole]}
                >
                  {myRole === TicketAssignmentRoleEnum.PrimaryHandler
                    ? "Primary"
                    : "Supporter"}
                </span>
              )}
              <TicketPriorityBadge priority={ticket.priority} />
              <TicketStatusBadge status={ticket.status} />
            </div>
          </div>
          {/* The title is the tile's focal point — noticeably larger and bolder than the
              rest; sized like the secondary info, nothing would draw the eye. */}
          <p
            className="mt-1.5 line-clamp-2 text-base font-semibold leading-snug"
            title={ticket.title}
          >
            {ticket.title}
          </p>
        </div>

        <div className="flex flex-1 flex-col justify-between gap-3">
          <div className="space-y-2">
            {/* Fault type + battery serial — the two things Staff need first (what,
                where). Filled chips instead of plain grey text: at 11-12px with no colour
                behind them they sink below the title and vanish in a quick scan. */}
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

            {/* Signals that need attention. The row is ALWAYS rendered with a reserved
                height: it fills in as data arrives, and if it appeared only then the tile
                would grow a line taller and the SLA clock at the bottom would jump. */}
            <div className="flex min-h-6 flex-wrap items-center gap-1.5">
              {ticket.reopenCount > 0 && (
                <span
                  className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
                  title="This ticket was reopened before — the previous attempt likely didn't fully resolve it"
                >
                  <Repeat2 className="size-3.5" aria-hidden />
                  Reopened {ticket.reopenCount}×
                </span>
              )}
            </div>
          </div>

          {/* SLA always sits at the bottom thanks to justify-between — every clock lines
              up when scanning down a column. */}
          <div className="border-t border-border pt-2">
            {ticket.slaTimer ? (
              <div className="space-y-1">
                <SlaCountdown slaTimer={ticket.slaTimer} />
                <p className="text-xs text-muted-foreground">
                  Due{" "}
                  <span className="font-medium tabular-nums text-foreground">
                    {format(new Date(ticket.slaTimer.dueAt), "MM/dd HH:mm")}
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No SLA yet - in queue
              </p>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
