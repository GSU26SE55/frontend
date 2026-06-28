import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { cascadeService } from "@/features/admin/services/cascade.service";
import type { SetTopologyPayload } from "@/shared/types/cascade.types";

// Form-driven (SetTopologyDialog) → KHÔNG đặt onError; dialog xử lý qua try-catch + setError.
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
