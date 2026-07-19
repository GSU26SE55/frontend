import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { batteryAssetService } from "@/features/admin/services/battery/battery-asset.service";

export function useBatteryAssetRealtime(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.batteryAssets.realtime(id),
    queryFn: () => batteryAssetService.getRealtime(id).then((r) => r.data.data),
    enabled: !!id,
    staleTime: 0,
    refetchInterval: 30_000,
  });
}
