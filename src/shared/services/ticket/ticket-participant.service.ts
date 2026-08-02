import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type { TicketParticipantDto } from "@/shared/types/ticket/participant.types";

export const ticketParticipantService = {
  // GET /api/tickets/{ticketId}/participants — participant active của ticket.
  // Auth: bất kỳ ai access được ticket (BE tự check, trả 403 nếu không).
  getParticipants: (ticketId: string) =>
    axiosInstance.get<CommonResponse<TicketParticipantDto[]>>(
      ENDPOINTS.TICKETS.PARTICIPANTS(ticketId),
    ),
};
