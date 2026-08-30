import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type {
  TicketDTO,
  TicketDetailDTO,
} from "@/shared/types/ticket/ticket.types";

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

  /**
   * The ticket auto-created from an environmental incident, or null when none exists yet.
   *
   * The relation is stored one way only — Ticket holds `environmentalIncidentId`, while the
   * incident (owned by BatteryService) knows nothing about tickets — so the incident dialog has
   * to ask TicketService in reverse to show a ticket link at all.
   */
  getByIncident: (incidentId: string) =>
    axiosInstance.get<CommonResponse<TicketDTO | null>>(
      ENDPOINTS.TICKETS.BY_INCIDENT(incidentId),
    ),
};
