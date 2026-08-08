import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import type { CommonResponse } from "@/shared/types/api.types";
import type { TicketAttachmentDTO } from "@/shared/types/ticket/ticket-attachment.types";
import { isImageAttachment } from "@/shared/types/ticket/ticket-attachment.types";

/**
 * All files sent via chat for a SINGLE ticket.
 * BE already filters by permission: Customer only sees files from `IsInternal = false` chats.
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

/** Images only — used by the picker for inserting images into an article. */
export function useTicketChatImages(ticketId?: string) {
  const query = useTicketChatFiles(ticketId);
  return {
    ...query,
    data: query.data?.filter(isImageAttachment),
  };
}
