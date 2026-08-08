import { Clock, History, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KbArticleStatusEnum } from "@/shared/enums/kb/kb.enum";
import type { KbArticleDTO } from "@/shared/types/kb/kb.types";

interface KbPendingReviewNoticeProps {
  article: KbArticleDTO;
  /** Opens the version history dialog to view the pending-review content. */
  onViewVersions?: () => void;
}

// Lets the viewer know the article has a new change pending approval —
// the content displayed below is still the most recently approved version.
export function KbPendingReviewNotice({
  article,
  onViewVersions,
}: KbPendingReviewNoticeProps) {
  const isPendingReview =
    article.status === KbArticleStatusEnum.PendingReview ||
    article.reviewRequired;

  if (!isPendingReview) {
    // The previous change was rejected — let the author know why so they can fix it.
    if (!article.managerRejectReason) return null;

    return (
      <div className="flex items-start gap-2.5 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2.5">
        <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
        <div className="space-y-0.5 text-sm">
          <p className="font-medium text-destructive">
            The latest change was rejected
          </p>
          <p className="text-muted-foreground">
            Reason: {article.managerRejectReason}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-2.5 rounded-md border border-amber-500/40 bg-amber-500/5 px-3 py-2.5">
      <Clock className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-500" />
      <div className="min-w-0 flex-1 space-y-0.5 text-sm">
        <p className="font-medium text-amber-700 dark:text-amber-500">
          There is a new change pending approval
        </p>
        <p className="text-muted-foreground">
          {article.version > 0
            ? `The content below is the approved version ${article.version}. The change will only show after it's approved.`
            : "This article has no approved version yet. The content will only show after it's approved."}
        </p>
      </div>
      {onViewVersions && (
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={onViewVersions}
        >
          <History className="size-3.5" />
          View pending version
        </Button>
      )}
    </div>
  );
}
