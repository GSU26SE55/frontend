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
  LongSohDto,
  BatchPredictionDto,
  GetLongSohParams,
  GetBatchPredictionParams,
} from "@/shared/types/battery/ai.types";
import type { StaffFeedbackEnum } from "@/shared/enums/battery/ai.enum";

// BE-AI — read SOH predictions + anomaly classifications + submit feedback.
// BE allows Admin, Manager, Staff. Shared across all 3 roles.
export const aiService = {
  getSohPredictions: (params: SohPredictionListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<SohPredictionDto>>>(
      ENDPOINTS.SOH_PREDICTIONS.LIST,
      { params },
    ),
  getSohPredictionsLong: (params: GetLongSohParams) =>
    axiosInstance.get<CommonResponse<LongSohDto>>(
      ENDPOINTS.SOH_PREDICTIONS.LONG,
      { params },
    ),
  getSohPredictionsBatch: (params: GetBatchPredictionParams) =>
    axiosInstance.get<CommonResponse<BatchPredictionDto>>(
      ENDPOINTS.SOH_PREDICTIONS.BATCH,
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
