import { useMutation, useQueryClient } from "@tanstack/react-query";
import { KEY } from "@/shared/utils/queryKeys";
import { thresholdService } from "@/features/admin/services/battery/threshold.service";
import type { UpsertThresholdPayload } from "@/features/admin/types/battery/threshold.types";

// Form-bound mutation: do NOT set onError here — the form catches it and calls setError (avoids double toast)
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
