import { Clock, History } from "lucide-react";
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
//
// Nothing is shown once a change has been rejected: rejecting rolls the article back to
// its current approved version, so the page is already showing the correct content. A red
// "the latest change was rejected" banner on an article that is in perfectly good shape
// reads as an error state that the reader has to act on, when there is nothing to fix.
// The rejection and its reason still live in the version history.
export function KbPendingReviewNotice({
  article,
  onViewVersions,
}: KbPendingReviewNoticeProps) {
  const isPendingReview =
    article.status === KbArticleStatusEnum.PendingReview ||
    article.reviewRequired;

  if (!isPendingReview) return null;

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
