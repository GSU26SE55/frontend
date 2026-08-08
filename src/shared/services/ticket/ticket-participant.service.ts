import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type { TicketParticipantDto } from "@/shared/types/ticket/participant.types";

export const ticketParticipantService = {
  // GET /api/tickets/{ticketId}/participants — active participants of the ticket.
  // Auth: anyone who can access the ticket (BE checks this itself, returns 403 otherwise).
  getParticipants: (ticketId: string) =>
    axiosInstance.get<CommonResponse<TicketParticipantDto[]>>(
      ENDPOINTS.TICKETS.PARTICIPANTS(ticketId),
    ),
};
