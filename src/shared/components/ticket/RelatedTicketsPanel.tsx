import { Link } from "react-router-dom";
import { Link2, Link2Off, Loader2, Network } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import TicketStatusBadge from "@/shared/components/ticket/TicketStatusBadge";
import TicketPriorityBadge from "@/shared/components/ticket/TicketPriorityBadge";
import type { TicketDTO } from "@/shared/types/ticket/ticket.types";

/**
 * Other open tickets at this ticket's site, and anything already linked to it.
 *
 * One cabinet fault produces several tickets at once: the system raises an environmental ticket
 * for the smoke, and the customer raises one per battery inside that cabinet. Same root cause,
 * but they were invisible to each other — the responder had no way to see the whole picture
 * without searching the ticket list by hand.
 *
 * Linking, not merging, is what this offers. Merge means "duplicate": it closes the source with
 * CloseReason = MergedDuplicate and stops its SLA. That is wrong here — once the smoke is dealt
 * with, each battery still has to be inspected, so those tickets must stay open with their own
 * SLA. A link records "same cause" without claiming "same work", and closing the parent leaves
 * the children untouched.
 */
export default function RelatedTicketsPanel({
  ticket,
  related: data,
  isLoading = false,
  basePath,
  onLinkParent,
  isLinking = false,
}: {
  ticket: TicketDTO;
  related: TicketDTO[] | undefined;
  isLoading?: boolean;
  /** Route prefix owning a `tickets/:id` page, e.g. "/manager/tickets". */
  basePath: string;
  /**
   * Manager only — omit and the panel is read-only, which is what Staff gets. Data and
   * mutation arrive as props because `shared/` must not import from `features/`.
   *
   * `ticketId` is the ticket being CHANGED, not always the one this panel is showing — a
   * candidate row on the parent's own panel adopts the parent by editing ITSELF (the candidate),
   * not by asking the parent to adopt a parent. Passing this ticket's id unconditionally was the
   * bug: linking a second candidate from the parent's page tried to make the parent a child of
   * its own child, which the BE correctly rejects (a ticket that already has children cannot
   * become one) — so only the very first link ever worked.
   */
  onLinkParent?: (ticketId: string, parentTicketId: string | null) => void;
  isLinking?: boolean;
}) {
  const related = data ?? [];
  const linked = related.filter(
    (t) => t.parentTicketId === ticket.id || t.id === ticket.parentTicketId,
  );
  const candidates = related.filter((t) => !linked.includes(t));

  if (!isLoading && related.length === 0) return null;

  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center gap-2">
        <Network className="size-4 text-muted-foreground" />
        <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          Related tickets
        </p>
        {linked.length > 0 && (
          <Badge variant="secondary" className="text-2xs">
            {linked.length} linked
          </Badge>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : (
        <div className="overflow-hidden rounded-md border border-border">
          {linked.map((t) => {
            // Which side `t` is on decides which ticket the unlink call must edit — the
            // relation lives on the CHILD, so unlinking always means clearing the child's
            // own ParentTicketId, whichever ticket that happens to be.
            const tIsParent = t.id === ticket.parentTicketId; // ticket is the child here
            const childId = tIsParent ? ticket.id : t.id;
            return (
              <Row
                key={t.id}
                ticket={t}
                basePath={basePath}
                isLinked
                role={tIsParent ? "parent" : "child"}
                onUnlink={
                  onLinkParent ? () => onLinkParent(childId, null) : undefined
                }
                canUnlinkHere
                pending={isLinking}
              />
            );
          })}

          {candidates.length > 0 && linked.length > 0 && (
            <p className="border-t border-border/50 bg-muted/30 px-2 py-1 text-2xs text-muted-foreground">
              Also open at this site
            </p>
          )}

          {candidates.map((t) => (
            <Row
              key={t.id}
              ticket={t}
              basePath={basePath}
              // Two directions, both edit the CANDIDATE (`t`), never the open ticket:
              //   - "Set as parent": THIS ticket adopts `t` as its parent — only offered when
              //     it has none yet, since a ticket can have at most one.
              //   - "Add as child": `t` adopts THIS ticket as its parent — only offered when
              //     `t` has none yet, for the same reason.
              onSetParent={
                onLinkParent && !ticket.parentTicketId
                  ? () => onLinkParent(ticket.id, t.id)
                  : undefined
              }
              onAddChild={
                onLinkParent && !t.parentTicketId
                  ? () => onLinkParent(t.id, ticket.id)
                  : undefined
              }
              pending={isLinking}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Row({
  ticket,
  basePath,
  isLinked = false,
  role,
  onSetParent,
  onAddChild,
  onUnlink,
  canUnlinkHere = false,
  pending = false,
}: {
  ticket: TicketDTO;
  basePath: string;
  isLinked?: boolean;
  /** Which side of an EXISTING link this row is — drives the "Parent"/"Child" badge. */
  role?: "parent" | "child";
  onSetParent?: () => void;
  onAddChild?: () => void;
  onUnlink?: () => void;
  canUnlinkHere?: boolean;
  pending?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 border-t border-border/50 px-2 py-1.5 text-xs first:border-t-0">
      {isLinked && (
        // Which side of the link this is — the one piece of information the row used to omit
        // entirely, leaving both ends of a parent/child pair looking identical.
        <span
          className={
            role === "parent"
              ? "shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-3xs font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-900/60 dark:text-amber-300"
              : "shrink-0 rounded bg-muted px-1.5 py-0.5 text-3xs font-semibold uppercase tracking-wide text-muted-foreground"
          }
        >
          {role === "parent" ? "Parent" : "Child"}
        </span>
      )}

      {/* text-primary is the emerald the app already uses for every ticket reference (the alert
          dialogs link the same way). Without it the code rendered as plain text, so the one
          clickable thing in the row did not look clickable. */}
      <Link
        to={`${basePath}/${ticket.id}`}
        className="shrink-0 font-mono font-medium text-primary hover:underline"
      >
        {ticket.code}
      </Link>

      {/* The title is the bigger click target and the part a reader actually aims at, so it
          navigates too — kept in the body colour so the row still reads as one line rather
          than two competing links. */}
      <Link
        to={`${basePath}/${ticket.id}`}
        title={ticket.title}
        className="min-w-0 flex-1 truncate text-muted-foreground hover:text-foreground hover:underline"
      >
        {ticket.title}
      </Link>

      <TicketPriorityBadge priority={ticket.priority} />
      <TicketStatusBadge status={ticket.status} />

      {/* ml-auto separates this action cluster from the priority/status badges above — without
          it the two groups sat flush against each other, reading as one crowded row. */}
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {/* Two buttons rather than one "Link" — the old single button linked in only one
            direction, so linking a second ticket from the parent's own page tried to make the
            parent adopt its own child as ITS parent, which the BE rejects. Naming the direction
            also answers what used to be silent: does this candidate become the parent, or a
            sibling child? */}
        {onSetParent && (
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={onSetParent}
            className="h-6 shrink-0 px-2 text-2xs"
          >
            {pending ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Link2 className="size-3" />
            )}
            Set as parent
          </Button>
        )}

        {onAddChild && (
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={onAddChild}
            className="h-6 shrink-0 px-2 text-2xs"
          >
            {pending ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Link2 className="size-3" />
            )}
            Add as child
          </Button>
        )}

        {onUnlink && canUnlinkHere && (
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={onUnlink}
            className="h-6 shrink-0 px-2 text-2xs"
          >
            {pending ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Link2Off className="size-3" />
            )}
            Unlink
          </Button>
        )}
      </div>
    </div>
  );
}
