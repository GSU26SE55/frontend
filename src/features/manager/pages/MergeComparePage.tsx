import { useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  useManagerTicketDetail,
  useAdminTicketList,
  useMergeTicket,
} from "@/features/manager/hooks/ticket/useManagerTickets";
import { TicketStatusEnum } from "@/shared/types/ticket/ticket.types";
import MergeCompareView from "@/shared/components/ticket/MergeCompareView";

/**
 * Page comparing a source ticket with a target ticket before merging (Manager).
 * `suggestedTargetId` is passed via router state from the "AI suspected duplicate" panel on the detail page.
 */
export default function MergeComparePage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const suggestedTargetId = (location.state as { suggestedTargetId?: string })
    ?.suggestedTargetId;

  const [targetId, setTargetId] = useState(suggestedTargetId ?? "");

  const { data: source, isLoading: isLoadingSource } =
    useManagerTicketDetail(id);
  const { data: target, isLoading: isLoadingTarget } =
    useManagerTicketDetail(targetId);
  // TicketGetListQueryHandler hides Open tickets by default (that's the Queue's job), so a
  // second call with status=Open is required — otherwise Open targets (e.g. the AI-suggested
  // auto-origin ticket) never make it into `tickets`/`candidates` below.
  const { data: list, isLoading: isLoadingTickets } = useAdminTicketList({
    pageSize: 100,
  });
  const { data: openList, isLoading: isLoadingOpenTickets } =
    useAdminTicketList({ pageSize: 100, status: TicketStatusEnum.Open });
  const tickets = useMemo(
    () => [...(list?.items ?? []), ...(openList?.items ?? [])],
    [list?.items, openList?.items],
  );
  const merge = useMergeTicket(id);

  const handleMerge = async () => {
    if (!targetId) return;
    try {
      await merge.mutateAsync(targetId);
      // Navigate to the ticket that WAS KEPT — the source ticket has been closed.
      navigate(`/manager/tickets/${targetId}`, { replace: true });
    } catch {
      // error already toasted in the hook's onError
    }
  };

  return (
    <MergeCompareView
      source={source}
      isLoadingSource={isLoadingSource}
      target={targetId ? target : undefined}
      isLoadingTarget={isLoadingTarget}
      tickets={tickets}
      isLoadingTickets={isLoadingTickets || isLoadingOpenTickets}
      targetId={targetId}
      onTargetIdChange={setTargetId}
      onBack={() => navigate(`/manager/tickets/${id}`)}
      onMerge={handleMerge}
      isMerging={merge.isPending}
    />
  );
}
