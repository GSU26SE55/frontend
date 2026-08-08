import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_KEY, KEY } from "@/shared/utils/queryKeys";
import { aiService } from "@/shared/services/battery/ai.service";
import { handleErrorApi } from "@/shared/lib/errors";
import type { StaffFeedbackEnum } from "@/shared/enums/battery/ai.enum";
import type {
  SohPredictionListParams,
  AnomalyClassificationListParams,
  GetLongSohParams,
  GetBatchPredictionParams,
} from "@/shared/types/battery/ai.types";

/** BE-AI — SOH prediction history for a single battery (chart). */
export function useSohPredictions(params: SohPredictionListParams) {
  return useQuery({
    queryKey: QUERY_KEY.sohPredictions.list(params.batteryAssetId, params),
    queryFn: () => aiService.getSohPredictions(params).then((r) => r.data.data),
    enabled: !!params.batteryAssetId,
  });
}

/** BE-AI — long SOH prediction for a single battery. */
export function useSohPredictionsLong(params: GetLongSohParams) {
  return useQuery({
    queryKey: QUERY_KEY.sohPredictions.long(params.batteryAssetId, params),
    queryFn: () =>
      aiService.getSohPredictionsLong(params).then((r) => r.data.data),
    enabled: !!params.batteryAssetId,
  });
}

/** BE-AI — batch SOH predictions for active batteries. */
export function useSohPredictionsBatch(params: GetBatchPredictionParams) {
  return useQuery({
    queryKey: QUERY_KEY.sohPredictions.batch(params),
    queryFn: () =>
      aiService.getSohPredictionsBatch(params).then((r) => r.data.data),
  });
}

/** BE-AI — classification list (Normal/Degrading/Failed) for a single battery + feedback. */
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

/** BE-AI — Staff submits feedback on "was the AI classification correct?". */
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
      toast.success("AI feedback recorded");
    },
    onError: (error) => handleErrorApi({ error }),
  });
}
