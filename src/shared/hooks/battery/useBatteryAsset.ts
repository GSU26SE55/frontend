import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { batteryAssetService } from "@/shared/services/battery/battery-asset.service";

// Detail of a single battery asset (read-only) — shared across admin/manager/staff.
// Same cache key QUERY_KEY.batteryAssets.detail → all 3 roles share the cache.
export function useBatteryAsset(id: string | null | undefined) {
  return useQuery({
    queryKey: QUERY_KEY.batteryAssets.detail(id ?? ""),
    queryFn: () => batteryAssetService.getById(id!).then((r) => r.data.data),
    enabled: !!id,
  });
}
