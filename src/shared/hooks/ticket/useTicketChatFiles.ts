import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import type { CommonResponse } from "@/shared/types/api.types";
import type { TicketAttachmentDTO } from "@/shared/types/ticket/ticket-attachment.types";
import { isImageAttachment } from "@/shared/types/ticket/ticket-attachment.types";

/**
 * Toàn bộ file đã gửi qua chat của MỘT ticket.
 * BE lọc sẵn theo quyền: Customer chỉ thấy file từ chat `IsInternal = false`.
 */
export function useTicketChatFiles(ticketId?: string) {
  return useQuery({
    queryKey: QUERY_KEY.ticketChatFiles.list(ticketId),
    queryFn: () =>
      axiosInstance
        .get<
          CommonResponse<TicketAttachmentDTO[]>
        >(ENDPOINTS.TICKETS.CHAT_FILES(ticketId!))
        .then((r) => r.data.data ?? []),
    enabled: !!ticketId,
  });
}

/** Chỉ lấy ảnh — dùng cho picker chèn ảnh vào bài viết. */
export function useTicketChatImages(ticketId?: string) {
  const query = useTicketChatFiles(ticketId);
  return {
    ...query,
    data: query.data?.filter(isImageAttachment),
  };
}
