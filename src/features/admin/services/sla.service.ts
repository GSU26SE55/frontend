import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type {
  SlaRuleDto,
  UpdateSlaRulePayload,
} from "@/shared/types/sla.types";

export const slaService = {
  getList: () =>
    axiosInstance.get<CommonResponse<SlaRuleDto[]>>(ENDPOINTS.SLA.LIST),

  update: (id: string, payload: UpdateSlaRulePayload) =>
    axiosInstance.put<CommonResponse<SlaRuleDto>>(
      ENDPOINTS.SLA.UPDATE(id),
      payload,
    ),
};
