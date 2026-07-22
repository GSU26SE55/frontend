import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_KEY, KEY } from "@/shared/utils/queryKeys";
import { aiService } from "@/shared/services/battery/ai.service";
import { handleErrorApi } from "@/shared/lib/errors";
import type { StaffFeedbackEnum } from "@/shared/enums/battery/ai.enum";
import type {
  SohPredictionListParams,
  AnomalyClassificationListParams,
} from "@/shared/types/battery/ai.types";

/** BE-AI — lịch sử SOH prediction của 1 pin (chart). */
export function useSohPredictions(params: SohPredictionListParams) {
  return useQuery({
    queryKey: QUERY_KEY.sohPredictions.list(params.batteryAssetId, params),
    queryFn: () => aiService.getSohPredictions(params).then((r) => r.data.data),
    enabled: !!params.batteryAssetId,
  });
}

/** BE-AI — danh sách classification (Normal/Degrading/Failed) của 1 pin + feedback. */
export function useAnomalyClassifications(
  params: AnomalyClassificationListParams,
) {
  return useQuery({
    queryKey: QUERY_KEY.anomalyClassifications.list(
      params.batteryAssetId,
      params,
    ),
    queryFn: () =>
      aiService.getAnomalyClassifications(params).then((r) => r.data.data),
    enabled: !!params.batteryAssetId,
  });
}

/** BE-AI — Staff gửi feedback "AI phân loại đúng không?". */
export function useSubmitClassificationFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      feedback,
    }: {
      id: string;
      feedback: StaffFeedbackEnum;
    }) => aiService.submitFeedback(id, feedback).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.anomalyClassifications] });
      toast.success("Đã ghi nhận đánh giá AI");
    },
    onError: (error) => handleErrorApi({ error }),
  });
}
