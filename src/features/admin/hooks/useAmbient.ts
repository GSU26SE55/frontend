import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ambientService } from "@/features/admin/services/ambient.service";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import type {
  AmbientHistoryParams,
  AmbientThresholdListParams,
  AmbientThresholdUpsertPayload,
} from "@/shared/types/ambient.types";

export const useAmbientHistory = (
  params?: AmbientHistoryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEY.ambient.history(params?.siteId ?? "", params),
    queryFn: () => ambientService.getHistory(params).then((r) => r.data.data),
    staleTime: 60_000,
    enabled,
  });

export const useAmbientLatest = (siteId?: string) =>
  useQuery({
    queryKey: QUERY_KEY.ambient.latest(siteId ?? ""),
    queryFn: () => ambientService.getLatest(siteId).then((r) => r.data.data),
    staleTime: 30_000,
    enabled: !!siteId,
  });

export const useAmbientThresholds = (params?: AmbientThresholdListParams) =>
  useQuery({
    queryKey: QUERY_KEY.ambient.thresholdList(params),
    queryFn: () =>
      ambientService.getThresholds(params).then((r) => r.data.data),
  });

export const useAmbientThresholdBySite = (siteId: string) =>
  useQuery({
    queryKey: QUERY_KEY.ambient.thresholdBySite(siteId),
    queryFn: () =>
      ambientService.getThresholdBySite(siteId).then((r) => r.data.data),
    enabled: !!siteId,
  });

export const useUpsertAmbientThreshold = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AmbientThresholdUpsertPayload) =>
      ambientService.upsertThreshold(payload),
    onSuccess: () => {
      toast.success("Đã cập nhật ngưỡng môi trường");
      qc.invalidateQueries({ queryKey: [KEY.ambient] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};
