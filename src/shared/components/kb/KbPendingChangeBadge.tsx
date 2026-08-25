import { Clock } from "lucide-react";
import { KbArticleStatusEnum } from "@/shared/enums/kb/kb.enum";

/**
 * Marks a list card whose article has a change waiting for approval.
 *
 * The detail page already says this with KbPendingReviewNotice, but the list did not —
 * so from the outside every card just read "Published" and there was no way to tell which
 * article had something new to review without opening each one.
 *
 * Matches that notice's visual language (amber + Clock) so the two read as the same idea
 * at two levels of detail.
 *
 * Takes `status` and `reviewRequired` separately rather than the whole DTO because the
 * list and detail endpoints return different shapes (KbArticleSummaryDTO vs KbArticleDTO)
 * and both carry these two fields.
 */
export function KbPendingChangeBadge({
  status,
  reviewRequired,
}: {
  status: KbArticleStatusEnum;
  reviewRequired?: boolean;
}) {
  // Either signal is enough: the BE sets Status=PendingReview and ReviewRequired=true in
  // the same transaction, but older rows may carry only one of the two.
  const isPending =
    status === KbArticleStatusEnum.PendingReview || !!reviewRequired;

  if (!isPending) return null;

  return (
    <span
      title="A new version is waiting for approval"
      className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-500"
    >
      <Clock className="size-3" />
      Pending change
    </span>
  );
}
