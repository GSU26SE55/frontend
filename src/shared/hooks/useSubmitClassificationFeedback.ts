import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { anomalyClassificationService } from "@/shared/services/anomaly-classification.service";
import { handleErrorApi } from "@/shared/lib/errors";
import { MESSAGES } from "@/shared/constants/messages";
import type { SubmitFeedbackPayload } from "@/shared/types/anomaly-classification.types";

// Staff đánh giá classification của AI — non-form action (chọn 1 trong 3 giá trị).
// Không invalidate query nào: BE chưa có GET endpoint cho anomaly-classifications,
// nên không có cache nào để làm mới (xem shared/types/anomaly-classification.types.ts).
export const useSubmitClassificationFeedback = () =>
  useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: SubmitFeedbackPayload;
    }) => anomalyClassificationService.submitFeedback(id, payload),
    onSuccess: () => toast.success(MESSAGES.classification.feedbackSubmitted),
    onError: (error) => handleErrorApi({ error }),
  });
