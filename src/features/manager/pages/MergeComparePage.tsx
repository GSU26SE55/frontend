import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  useManagerTicketDetail,
  useAdminTicketList,
  useMergeTicket,
} from "@/features/manager/hooks/ticket/useManagerTickets";
import MergeCompareView from "@/shared/components/ticket/MergeCompareView";

/**
 * Trang so sánh ticket nguồn với ticket đích trước khi gộp (Manager).
 * `suggestedTargetId` truyền qua router state từ panel "AI nghi trùng" ở trang chi tiết.
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
  const { data: list, isLoading: isLoadingTickets } = useAdminTicketList({
    pageSize: 100,
  });
  const merge = useMergeTicket(id);

  const handleMerge = async () => {
    if (!targetId) return;
    try {
      await merge.mutateAsync(targetId);
      // Điều hướng về ticket ĐƯỢC GIỮ LẠI — ticket nguồn đã bị đóng.
      navigate(`/manager/tickets/${targetId}`, { replace: true });
    } catch {
      // lỗi đã toast trong hook onError
    }
  };

  return (
    <MergeCompareView
      source={source}
      isLoadingSource={isLoadingSource}
      target={targetId ? target : undefined}
      isLoadingTarget={isLoadingTarget}
      tickets={list?.items}
      isLoadingTickets={isLoadingTickets}
      targetId={targetId}
      onTargetIdChange={setTargetId}
      onBack={() => navigate(`/manager/tickets/${id}`)}
      onMerge={handleMerge}
      isMerging={merge.isPending}
    />
  );
}
