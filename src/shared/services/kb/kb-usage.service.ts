import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type { KbUsageStatsDTO } from "@/shared/types/kb/kb.types";

/**
 * Usage stats for one guide article: how many times it was attached to a ticket, split by
 * reference type. Lives in shared/ because GET /api/knowledge-base/{id}/usage-stats is open
 * to Manager and Admin alike — a per-portal copy would drift.
 */
export const kbUsageService = {
  getUsageStats: (id: string) =>
    axiosInstance.get<CommonResponse<KbUsageStatsDTO>>(
      ENDPOINTS.KNOWLEDGE_BASE.USAGE_STATS(id),
    ),
};
