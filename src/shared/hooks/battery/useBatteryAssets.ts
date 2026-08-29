import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { batteryAssetService } from "@/shared/services/battery/battery-asset.service";
import type { BatteryAssetListParams } from "@/shared/types/battery/battery-asset.types";

// Battery asset list — BE allows Admin, Manager (Staff is blocked).
// `enabled` lets a shared component that renders for Staff too skip the request outright
// rather than firing it and swallowing a 403.
export function useBatteryAssets(
  params?: BatteryAssetListParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: QUERY_KEY.batteryAssets.list(params),
    queryFn: () => batteryAssetService.getList(params).then((r) => r.data.data),
    enabled: options?.enabled ?? true,
  });
}
