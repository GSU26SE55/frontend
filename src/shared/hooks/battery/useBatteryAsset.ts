import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { batteryAssetService } from "@/shared/services/battery/battery-asset.service";

// Chi tiết 1 battery asset (read-only) — dùng chung admin/manager/staff.
// Cùng cache key QUERY_KEY.batteryAssets.detail → 3 role chia sẻ cache.
export function useBatteryAsset(id: string | null | undefined) {
  return useQuery({
    queryKey: QUERY_KEY.batteryAssets.detail(id ?? ""),
    queryFn: () => batteryAssetService.getById(id!).then((r) => r.data.data),
    enabled: !!id,
  });
}
