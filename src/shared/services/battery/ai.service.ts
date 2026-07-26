import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type {
  SohPredictionDto,
  AnomalyClassificationDto,
  SohPredictionListParams,
  AnomalyClassificationListParams,
} from "@/shared/types/battery/ai.types";
import type { StaffFeedbackEnum } from "@/shared/enums/battery/ai.enum";

// BE-AI — read SOH predictions + anomaly classifications + submit feedback.
// BE cho Admin,Manager,Staff. Dùng chung 3 role.
export const aiService = {
  getSohPredictions: (params: SohPredictionListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<SohPredictionDto>>>(
      ENDPOINTS.SOH_PREDICTIONS.LIST,
      { params },
    ),
  getAnomalyClassifications: (params: AnomalyClassificationListParams) =>
    axiosInstance.get<
      CommonResponse<PaginationResponse<AnomalyClassificationDto>>
    >(ENDPOINTS.ANOMALY_CLASSIFICATIONS.LIST, { params }),
  submitFeedback: (id: string, feedback: StaffFeedbackEnum) =>
    axiosInstance.post<CommonResponse<AnomalyClassificationDto>>(
      ENDPOINTS.ANOMALY_CLASSIFICATIONS.FEEDBACK(id),
      { feedback },
    ),
};
