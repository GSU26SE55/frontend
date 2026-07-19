import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type { SiteCascadeRiskSummaryDto } from "@/shared/types/battery/cascade.types";

// Manager chỉ xem cascade summary theo site (auth Admin/Manager). Topology/asset-risk là Admin.
export const cascadeService = {
  getSiteSummary: (id: string) =>
    axiosInstance.get<CommonResponse<SiteCascadeRiskSummaryDto>>(
      ENDPOINTS.SITES.CASCADE_RISK_SUMMARY(id),
    ),
};
