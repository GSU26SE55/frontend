import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ambientService } from "@/shared/services/ambient.service";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import type {
  AmbientHistoryParams,
  AmbientThresholdListParams,
  AmbientThresholdUpsertPayload,
} from "@/shared/types/ambient.types";
import { MESSAGES } from "@/shared/constants/messages";

// Ambient history — chart/timeline, tần suất theo giờ: staleTime 5 phút.
export const useAmbientHistory = (params: AmbientHistoryParams) =>
  useQuery({
    queryKey: QUERY_KEY.ambient.history(params.siteId, params),
    queryFn: () => ambientService.getHistory(params).then((r) => r.data.data),
    enabled: !!params.siteId,
    staleTime: 5 * 60_000,
  });

// Ambient latest — dashboard widget: staleTime 1 phút.
// retry:false — site chưa có reading trả 404 (kỳ vọng), không cần retry.
export const useAmbientLatest = (siteId: string) =>
  useQuery({
    queryKey: QUERY_KEY.ambient.latest(siteId),
    queryFn: () => ambientService.getLatest(siteId).then((r) => r.data.data),
    enabled: !!siteId,
    staleTime: 60_000,
    retry: false,
  });

export const useAmbientThresholdList = (params?: AmbientThresholdListParams) =>
  useQuery({
    queryKey: QUERY_KEY.ambient.thresholdList(params),
    queryFn: () =>
      ambientService.getThresholdList(params).then((r) => r.data.data),
    staleTime: 10 * 60_000,
  });

// Threshold theo site — config UI: staleTime 10 phút.
// retry:false — site chưa cấu hình trả 404 (kỳ vọng) → form ở chế độ tạo mới.
export const useAmbientThresholdBySite = (siteId: string) =>
  useQuery({
    queryKey: QUERY_KEY.ambient.thresholdBySite(siteId),
    queryFn: () =>
      ambientService.getThresholdBySite(siteId).then((r) => r.data.data),
    enabled: !!siteId,
    staleTime: 10 * 60_000,
    retry: false,
  });

// Form mutation — component xử lý error qua try-catch + handleErrorApi({error,setError}).
export const useUpsertAmbientThreshold = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AmbientThresholdUpsertPayload) =>
      ambientService.upsertThreshold(payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: [KEY.ambient] });
      qc.invalidateQueries({
        queryKey: QUERY_KEY.ambient.thresholdBySite(variables.siteId),
      });
      toast.success(MESSAGES.ambient.thresholdSaved);
    },
  });
};
