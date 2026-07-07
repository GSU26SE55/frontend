import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type {
  TicketParticipantDto,
  AddParticipantPayload,
  BulkAddParticipantsPayload,
  UpdateParticipantPayload,
  RemoveParticipantPayload,
} from "@/shared/types/ticket-participant.types";

export const ticketParticipantService = {
  getList: (ticketId: string) =>
    axiosInstance.get<CommonResponse<TicketParticipantDto[]>>(
      ENDPOINTS.TICKETS.PARTICIPANTS(ticketId),
    ),

  add: (ticketId: string, payload: AddParticipantPayload) =>
    axiosInstance.post<CommonResponse<TicketParticipantDto>>(
      ENDPOINTS.TICKETS.PARTICIPANTS(ticketId),
      payload,
    ),

  update: (
    ticketId: string,
    userId: string,
    payload: UpdateParticipantPayload,
  ) =>
    axiosInstance.patch<CommonResponse<TicketParticipantDto>>(
      ENDPOINTS.TICKETS.PARTICIPANT(ticketId, userId),
      payload,
    ),

  remove: (
    ticketId: string,
    userId: string,
    payload?: RemoveParticipantPayload,
  ) =>
    axiosInstance.delete<CommonResponse<void>>(
      ENDPOINTS.TICKETS.PARTICIPANT(ticketId, userId),
      { data: payload },
    ),

  bulkAdd: (ticketId: string, payload: BulkAddParticipantsPayload) =>
    axiosInstance.post<CommonResponse<TicketParticipantDto[]>>(
      ENDPOINTS.TICKETS.PARTICIPANTS_BULK(ticketId),
      payload,
    ),

  leave: (ticketId: string) =>
    axiosInstance.post<CommonResponse<void>>(
      ENDPOINTS.TICKETS.PARTICIPANTS_LEAVE(ticketId),
    ),

  getHistory: (ticketId: string) =>
    axiosInstance.get<CommonResponse<TicketParticipantDto[]>>(
      ENDPOINTS.TICKETS.PARTICIPANTS_HISTORY(ticketId),
    ),
};
