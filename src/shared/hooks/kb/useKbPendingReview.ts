import { useQuery } from "@tanstack/react-query";
import { kbPendingService } from "@/shared/services/kb/kb-pending.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { KbArticleStatusEnum } from "@/shared/enums/kb/kb.enum";
import { checkRole } from "@/shared/lib/authz";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { UserRole } from "@/shared/types/account/session.types";

/**
 * The two Guide counts behind the sidebar badges:
 *
 * - `pendingReview` — an article whose new version is waiting to be approved or rejected.
 *   Editing an article writes a new KbArticleVersion (status Pending) and flips the
 *   article to PendingReview in the same transaction, and both approve-review and
 *   reject-review refuse anything not in that status. So "has a version awaiting
 *   confirmation" and "status is PendingReview" are the same set — one status filter is
 *   enough, with no need to query the versions table.
 *
 * - `draft` — an article nobody has submitted for approval yet. Unfinished work, not a
 *   queue someone is blocked on, which is why it renders in a muted tone.
 *
 * Manager/Admin only: approve-review and reject-review live on the admin controller
 * ([Authorize(Roles = "Manager,Admin")]), so a Staff badge would be a number they cannot
 * clear. Both queries stay disabled for other roles and the counts read 0.
 */
export const useKbReviewCounts = () => {
  const user = useSessionStore((s) => s.user);
  const canReview = checkRole(user, UserRole.MANAGER, UserRole.ADMIN);

  const countQuery = (status: KbArticleStatusEnum) => ({
    queryKey: QUERY_KEY.kb.list({ status, countOnly: true }),
    queryFn: () =>
      kbPendingService.countByStatus(status).then((r) => r.data.data),
    enabled: canReview,
    staleTime: 60_000,
  });

  const pending = useQuery(countQuery(KbArticleStatusEnum.PendingReview));
  const draft = useQuery(countQuery(KbArticleStatusEnum.Draft));

  return {
    pendingReview: canReview ? (pending.data?.totalItems ?? 0) : 0,
    draft: canReview ? (draft.data?.totalItems ?? 0) : 0,
  };
};
