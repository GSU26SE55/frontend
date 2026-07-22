import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { batteryAssetService } from "@/shared/services/battery/battery-asset.service";

// Snapshot realtime (seed/fallback cho SSE) — polling 30s. Dùng chung 3 role.
export function useBatteryAssetRealtime(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.batteryAssets.realtime(id),
    queryFn: () => batteryAssetService.getRealtime(id).then((r) => r.data.data),
    enabled: !!id,
    staleTime: 0,
    refetchInterval: 30_000,
  });
}
