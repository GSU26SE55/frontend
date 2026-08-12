import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type {
  TicketKbReferenceDTO,
  AddTicketKbReferencePayload,
} from "@/shared/types/kb/kb.types";

export type AddTicketKbRefInput = Omit<AddTicketKbReferencePayload, "ticketId">;

export const ticketKbService = {
  list: (ticketId: string) =>
    axiosInstance.get<CommonResponse<TicketKbReferenceDTO[]>>(
      ENDPOINTS.KB_REFERENCES.LIST,
      { params: { ticketId } },
    ),
  add: (ticketId: string, payload: AddTicketKbRefInput) =>
    axiosInstance.post<CommonResponse<object>>(ENDPOINTS.KB_REFERENCES.ADD, {
      ticketId,
      ...payload,
    }),
  remove: (_ticketId: string, referenceId: string) =>
    axiosInstance.delete<CommonResponse<object>>(
      ENDPOINTS.KB_REFERENCES.REMOVE(referenceId),
    ),
};
