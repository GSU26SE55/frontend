import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type {
  AlertDto,
  AlertListParams,
  AiPrescriptionDto,
  SubmitPrescriptionFeedbackCommand,
} from "@/shared/types/alerts/alert.types";

export const alertService = {
  getList: (params?: AlertListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<AlertDto>>>(
      ENDPOINTS.ALERTS.LIST,
      { params },
    ),
  getById: (id: string) =>
    axiosInstance.get<CommonResponse<AlertDto>>(ENDPOINTS.ALERTS.DETAIL(id)),
  acknowledge: (id: string) =>
    axiosInstance.patch<CommonResponse<null>>(ENDPOINTS.ALERTS.ACKNOWLEDGE(id)),
  resolve: (id: string) =>
    axiosInstance.patch<CommonResponse<null>>(ENDPOINTS.ALERTS.RESOLVE(id)),
  regenerateAiPrescription: (id: string, agentic = false) =>
    axiosInstance.post<CommonResponse<AiPrescriptionDto>>(
      ENDPOINTS.ALERTS.AI_PRESCRIPTION(id),
      null,
      { params: { agentic } },
    ),
  submitPrescriptionFeedback: (
    id: string,
    command: SubmitPrescriptionFeedbackCommand,
  ) =>
    axiosInstance.post<CommonResponse<string>>(
      ENDPOINTS.ALERTS.PRESCRIPTION_FEEDBACK(id),
      command,
    ),
};
