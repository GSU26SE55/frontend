import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type {
  StaffSuggestionListDTO,
  KbSuggestionListDTO,
} from "@/shared/types/suggestion.types";

/**
 * AI suggestions for tickets — shared by Manager (staff) and Staff/Manager (KB).
 * Placed in `shared/` because two different features call it; placing it in one
 * feature would violate the no-cross-feature-import rule.
 */
export const suggestionService = {
  /** Manager/Admin — ranks staff best suited to handle the ticket. */
  staff: (ticketId: string, topN = 5) =>
    axiosInstance.get<CommonResponse<StaffSuggestionListDTO>>(
      ENDPOINTS.TICKETS.STAFF_SUGGESTIONS(ticketId),
      { params: { topN } },
    ),

  /** Manager/Admin + assigned Staff — ranks KB articles for reference. */
  kb: (ticketId: string, topN = 5) =>
    axiosInstance.get<CommonResponse<KbSuggestionListDTO>>(
      ENDPOINTS.TICKETS.KB_SUGGESTIONS(ticketId),
      { params: { topN } },
    ),
};
