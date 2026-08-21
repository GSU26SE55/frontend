import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type { TicketDetailDTO } from "@/shared/types/ticket/ticket.types";

/**
 * Reads one ticket by id from the shared /api/tickets/{id} route.
 *
 * Lives in shared/ rather than reusing one of the per-feature ticket services
 * because the caller (AlertsView) is itself shared across the admin, manager and
 * staff portals — importing a feature service from shared would invert the
 * dependency and trip the no-restricted-imports rule.
 */
export const ticketLookupService = {
  getDetail: (id: string) =>
    axiosInstance.get<CommonResponse<TicketDetailDTO>>(
      ENDPOINTS.TICKETS.DETAIL(id),
    ),
};
