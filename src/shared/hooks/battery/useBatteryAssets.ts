import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { batteryAssetService } from "@/shared/services/battery/battery-asset.service";
import type { BatteryAssetListParams } from "@/shared/types/battery/battery-asset.types";

// Battery asset list — BE allows Admin, Manager (Staff is blocked).
export function useBatteryAssets(params?: BatteryAssetListParams) {
  return useQuery({
    queryKey: QUERY_KEY.batteryAssets.list(params),
    queryFn: () => batteryAssetService.getList(params).then((r) => r.data.data),
  });
}
