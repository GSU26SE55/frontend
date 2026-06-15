import { useMutation, useQueryClient } from "@tanstack/react-query";
import { KEY } from "@/shared/utils/queryKeys";
import { thresholdService } from "@/features/admin/services/threshold.service";
import type { UpsertThresholdPayload } from "@/features/admin/types/threshold.types";

// Form-bound mutation: KHÔNG đặt onError ở đây — form tự catch + setError (tránh double toast)
export function useUpsertThreshold(batteryTypeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertThresholdPayload) =>
      thresholdService.upsert(batteryTypeId, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.thresholds] });
    },
  });
}
