import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type {
  AnomalyClassificationDto,
  SubmitFeedbackPayload,
} from "@/shared/types/anomaly-classification.types";

export const anomalyClassificationService = {
  // Staff xác nhận classification của AI đúng/sai — feedback loop cho retrain.
  // `staffFeedbackByUserId` BE lấy từ token, không gửi qua body.
  submitFeedback: (id: string, payload: SubmitFeedbackPayload) =>
    axiosInstance.post<CommonResponse<AnomalyClassificationDto>>(
      ENDPOINTS.ANOMALY_CLASSIFICATIONS.FEEDBACK(id),
      payload,
    ),
};
