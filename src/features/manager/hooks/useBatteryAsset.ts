import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { batteryAssetService } from "@/features/manager/services/battery-asset.service";

// Cùng cache key với admin (QUERY_KEY.batteryAssets.detail) — cùng resource
// chỉ-đọc, chia sẻ cache là đúng đắn.
export function useManagerBatteryAsset(id: string | null | undefined) {
  return useQuery({
    queryKey: QUERY_KEY.batteryAssets.detail(id ?? ""),
    queryFn: () => batteryAssetService.getById(id!).then((r) => r.data.data),
    enabled: !!id,
  });
}
