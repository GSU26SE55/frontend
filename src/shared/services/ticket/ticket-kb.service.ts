import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type {
  TicketKbReferenceDTO,
  AddTicketKbReferencePayload,
} from "@/shared/types/kb/kb.types";

export type AddTicketKbRefInput = Omit<AddTicketKbReferencePayload, "ticketId">;

/**
 * Links between a ticket and the KB articles consulted while handling it.
 *
 * Shared rather than duplicated per feature: the endpoints take no role in the path and
 * the BE decides permission from the JWT, so the admin/manager/staff copies of this file
 * were byte-identical apart from where they lived.
 */
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
