import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Check, Sparkles, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { KbReferenceTypeEnum } from "@/shared/enums/kb/kb.enum";
import { useKbSuggestions } from "@/shared/hooks/useSuggestions";
import { handleErrorApi } from "@/shared/lib/errors";
import axiosInstance from "@/shared/lib/axios";
import type { CommonResponse } from "@/shared/types/api.types";
import type { KbSuggestionDTO } from "@/shared/types/suggestion.types";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import { QUERY_KEY } from "@/shared/utils/queryKeys";

interface Props {
  ticketId: string;
  /** Ids of KB articles already attached to the ticket — to hide the button and mark "attached". */
  attachedKbIds?: string[];
  /**
   * Whether attaching articles is allowed. Only the PrimaryHandler can attach (the BE blocks
   * the Supporter on the attach command), so pass `false` for the Supporter to avoid showing
   * a button that then errors out.
   */
  canAttach?: boolean;
  topN?: number;
}

/**
 * Panel suggesting KB articles while a technician does repairs.
 *
 * VIEW differs from ATTACH: the Supporter can view suggestions (they're also working the
 * ticket) but only the PrimaryHandler can attach an article to the ticket — matches the BE's
 * authorization.
 */
export function KbSuggestionPanel({
  ticketId,
  attachedKbIds = [],
  canAttach = true,
  // Top 3 best-matching articles — a quick suggestion to skim then decide; a longer list
  // dilutes focus, and the user can still look up other articles manually when needed.
  topN = 3,
}: Props) {
  const { data, isLoading, isError } = useKbSuggestions(ticketId, { topN });
  const queryClient = useQueryClient();

  const attach = useMutation({
    mutationFn: (kb: KbSuggestionDTO) =>
      axiosInstance.post<CommonResponse<object>>(ENDPOINTS.KB_REFERENCES.ADD, {
        ticketId,
        kbArticleId: kb.kbArticleId,
        referenceType: KbReferenceTypeEnum.ConsultedDuringResolve,
        note: "Applied from AI suggestion",
      }),
    onSuccess: () => {
      // The ticket's list of ALREADY attached articles — so the button switches to "Attached" right away.
      queryClient.invalidateQueries({
        queryKey: QUERY_KEY.ticketKbRefs.list(ticketId),
      });
      toast.success("Article attached to ticket");
    },
    onError: (error) => handleErrorApi({ error }),
  });

  const attachedSet = new Set(attachedKbIds);

  return (
    <section className="rounded-lg border bg-card p-4">
      <header className="mb-3 flex items-center gap-2">
        <Sparkles className="size-4 text-primary" aria-hidden />
        <h3 className="text-sm font-medium">
          Recommended articles (AI suggested)
        </h3>
      </header>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      )}

      {isError && (
        <p className="text-sm text-muted-foreground">
          Couldn't load suggestions. You can still look up articles manually.
        </p>
      )}

      {data && !data.aiAvailable && (
        <div className="flex items-start gap-2 rounded-md bg-muted p-3">
          <TriangleAlert
            className="mt-0.5 size-4 shrink-0 text-amber-600"
            aria-hidden
          />
          <p className="text-sm text-muted-foreground">
            {data.note ||
              "Couldn't get suggestions from AI yet. You can still look up articles manually."}
          </p>
        </div>
      )}

      {data?.aiAvailable && data.items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {data.note || "No matching articles yet."}
        </p>
      )}

      {data && data.items.length > 0 && (
        <ul className="space-y-2">
          {data.items.map((kb) => {
            const isAttached = attachedSet.has(kb.kbArticleId);
            return (
              <li
                key={kb.kbArticleId}
                className="rounded-md border p-3 transition-colors hover:bg-accent/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <BookOpen
                        className="size-3.5 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                      <span className="font-medium">{kb.title}</span>
                      <Badge variant="secondary" className="text-xs">
                        {kb.code}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(kb.score * 100)}%
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {kb.reason}
                    </p>
                  </div>

                  {canAttach &&
                    (isAttached ? (
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        <Check className="mr-1 size-3" aria-hidden />
                        Attached
                      </Badge>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={attach.isPending}
                        onClick={() => attach.mutate(kb)}
                      >
                        Apply
                      </Button>
                    ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {data?.note && data.items.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">{data.note}</p>
      )}
    </section>
  );
}
