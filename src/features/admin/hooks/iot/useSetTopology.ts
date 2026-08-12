import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { cascadeService } from "@/features/admin/services/battery/cascade.service";
import type { SetTopologyPayload } from "@/shared/types/battery/cascade.types";

// Form-driven (SetTopologyDialog) → do NOT set onError; the dialog handles it via try-catch + setError.
export function useSetTopology(assetId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SetTopologyPayload) =>
      cascadeService.setTopology(assetId, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: QUERY_KEY.batteryAssets.cascadeRisk(assetId),
      });
    },
  });
}
