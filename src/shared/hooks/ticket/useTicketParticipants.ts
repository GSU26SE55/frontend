import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ticketParticipantService } from "@/shared/services/ticket/ticket-participant.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { useSessionStore } from "@/shared/stores/sessionStore";
import type { MentionCandidate } from "@/shared/components/chat/MentionTextarea";

// GET /api/tickets/{ticketId}/participants — participant active của ticket.
export const useTicketParticipants = (ticketId?: string) =>
  useQuery({
    queryKey: QUERY_KEY.ticketParticipants.list(ticketId ?? ""),
    queryFn: () =>
      ticketParticipantService
        .getParticipants(ticketId as string)
        .then((r) => r.data.data ?? []),
    enabled: !!ticketId,
    staleTime: 60_000,
  });

/**
 * Danh sách người có thể @-tag trong composer chat.
 *
 * Nguồn đúng là participants của ticket — KHÔNG phải tác giả đã chat: người mới
 * được add vào ticket nhưng chưa nhắn gì vẫn phải tag được.
 *
 * Lọc: CHỈ bỏ chính mình. Cố ý không lọc theo `canPost`/`canViewInternal` —
 * BE (ChatAddCommandHandler) validate mention duy nhất bằng "có phải participant
 * active không", nên lọc chặt hơn sẽ khiến dropdown ẩn mất người mà BE vẫn cho
 * mention. `canPost` là quyền GỬI chat, không liên quan tới việc được nhắc tên
 * (vd Watcher `canPost=false` vẫn cần tag được).
 *
 * ⚠️ Lưu ý internal: BE hiện KHÔNG chặn mention người có `canViewInternal=false`
 * trong chat nội bộ — họ sẽ nhận notification về chat không mở được. Hook trả
 * kèm `canViewInternal` để UI cảnh báo; đừng tự ẩn ở FE vì sẽ lệch với BE.
 */
export const useMentionCandidates = (ticketId?: string): MentionCandidate[] => {
  const { data } = useTicketParticipants(ticketId);
  const currentUserId = useSessionStore((s) => s.user?.accountId);

  return useMemo(() => {
    if (!data) return [];
    return data
      .filter((p) => p.userId !== currentUserId)
      .map((p) => ({
        userId: p.userId,
        displayName: p.displayName,
        role: p.userRole,
        canViewInternal: p.canViewInternal,
      }));
  }, [data, currentUserId]);
};
