import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { batteryAssetService } from "@/features/staff/services/battery/battery-asset.service";

// Cùng cache key với admin/manager (QUERY_KEY.batteryAssets.detail) — cùng
// resource chỉ-đọc, chia sẻ cache là đúng đắn.
export function useStaffBatteryAsset(id: string | null | undefined) {
  return useQuery({
    queryKey: QUERY_KEY.batteryAssets.detail(id ?? ""),
    queryFn: () => batteryAssetService.getById(id!).then((r) => r.data.data),
    enabled: !!id,
  });
}
