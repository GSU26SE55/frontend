import { Sparkles, TriangleAlert, UserCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useStaffSuggestions } from "@/shared/hooks/useSuggestions";
import { SKILL_TIER_LABELS } from "@/shared/types/suggestion.types";
import type { StaffSuggestionDTO } from "@/shared/types/suggestion.types";

interface Props {
  ticketId: string;
  /** Called when the Manager picks someone — opens the assignment form pre-filled with them. */
  onPick?: (staff: StaffSuggestionDTO) => void;
  /** Id currently selected in the assignment form, to mark it in the list. */
  selectedStaffId?: string;
  topN?: number;
}

/**
 * Panel suggesting staff to handle a ticket (Manager triage).
 *
 * AI only ranks — the Manager still chooses, and can still pick someone OUTSIDE this list.
 * So this panel is a supplementary piece placed next to the assignment form, not a replacement.
 */
export function StaffSuggestionPanel({
  ticketId,
  onPick,
  selectedStaffId,
  // Only the 3 best matches. `topN` reaches the BE as a query param, so this also keeps the
  // AI from ranking candidates nobody reads. Matches KbSuggestionPanel next to it: the panel
  // sits directly above the assignment form for a quick read-then-decide, and a longer list
  // dilutes the ranking instead of helping — the Manager can still pick anyone from the
  // dropdown below.
  topN = 3,
}: Props) {
  const { data, isLoading, isError } = useStaffSuggestions(ticketId, { topN });

  return (
    <section className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
      <header className="mb-2 flex items-center gap-1.5">
        <Sparkles className="size-3.5 text-primary" aria-hidden />
        <h3 className="text-2xs font-semibold uppercase tracking-wider text-primary">
          AI-suggested staff
        </h3>
      </header>

      {isLoading && (
        <div className="space-y-1.5">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {/* Network/permission error — different from "AI not responding" (BE returns 200 + aiAvailable=false). */}
      {isError && (
        <p className="text-2xs text-muted-foreground">
          Couldn't load suggestions. You can still assign manually below.
        </p>
      )}

      {data && !data.aiAvailable && (
        <div className="flex items-start gap-1.5">
          <TriangleAlert
            className="mt-0.5 size-3.5 shrink-0 text-amber-600"
            aria-hidden
          />
          <p className="text-2xs text-muted-foreground">
            {data.note ||
              "Couldn't get suggestions from AI yet. You can still assign manually."}
          </p>
        </div>
      )}

      {/* Empty list but AI did run — `note` explains why (missing tier, over capacity…).
          This is NOT an error, so it isn't displayed as one. */}
      {data?.aiAvailable && data.items.length === 0 && (
        <p className="text-2xs text-muted-foreground">
          {data.note || "No staff match this ticket."}
        </p>
      )}

      {data && data.items.length > 0 && (
        <>
          <ul className="space-y-1.5">
            {data.items.map((s) => {
              const isSelected = s.staffId === selectedStaffId;
              const loadPercent =
                s.maxConcurrentTickets > 0
                  ? Math.round((s.activeTickets / s.maxConcurrentTickets) * 100)
                  : 0;

              return (
                <li
                  key={s.staffId}
                  className={`rounded-md px-2.5 py-2 transition-colors ${
                    isSelected
                      ? "bg-primary/10 ring-1 ring-primary"
                      : "bg-background"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                        <span className="text-xs font-medium">
                          {s.fullName}
                        </span>
                        <Badge
                          variant="secondary"
                          className="px-1 py-0 text-3xs"
                        >
                          {SKILL_TIER_LABELS[s.skillTier] ??
                            `Tier ${s.skillTier}`}
                        </Badge>
                        <Badge variant="outline" className="px-1 py-0 text-3xs">
                          {Math.round(s.score * 100)}% match
                        </Badge>
                      </div>

                      {/* The reason matters most — without it the Manager has no
                          basis to trust the ranking order. */}
                      <p className="mt-0.5 text-2xs leading-snug text-muted-foreground">
                        {s.reason}
                      </p>

                      {s.maxConcurrentTickets > 0 && (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <Progress value={loadPercent} className="h-1 w-16" />
                          <span className="text-3xs text-muted-foreground">
                            {s.activeTickets}/{s.maxConcurrentTickets}
                          </span>
                        </div>
                      )}
                    </div>

                    {onPick && (
                      <Button
                        type="button"
                        size="sm"
                        variant={isSelected ? "default" : "outline"}
                        className="h-6 shrink-0 gap-1 px-2 text-2xs"
                        onClick={() => onPick(s)}
                      >
                        <UserCheck className="size-3" aria-hidden />
                        {isSelected ? "Selected" : "Select"}
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {data.note && (
            <p className="mt-2 text-2xs text-muted-foreground">{data.note}</p>
          )}
        </>
      )}

      <p className="mt-2 text-2xs text-muted-foreground">
        Just a suggestion — you can still pick any staff member below.
      </p>
    </section>
  );
}
