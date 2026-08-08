import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type {
  CascadeRiskDto,
  SiteCascadeRiskSummaryDto,
  SetTopologyPayload,
} from "@/shared/types/battery/cascade.types";

// getAssetRisk (Admin, Manager, Staff, Customer) + getSiteSummary (Admin, Manager).
// setTopology is Admin only — component calls it via the canManageTopology flag.
export const cascadeService = {
  getAssetRisk: (id: string) =>
    axiosInstance.get<CommonResponse<CascadeRiskDto>>(
      ENDPOINTS.BATTERY_ASSETS.CASCADE_RISK(id),
    ),
  getSiteSummary: (id: string) =>
    axiosInstance.get<CommonResponse<SiteCascadeRiskSummaryDto>>(
      ENDPOINTS.SITES.CASCADE_RISK_SUMMARY(id),
    ),
  setTopology: (id: string, payload: SetTopologyPayload) =>
    axiosInstance.post<CommonResponse<CascadeRiskDto>>(
      ENDPOINTS.BATTERY_ASSETS.TOPOLOGY(id),
      payload,
    ),
};
