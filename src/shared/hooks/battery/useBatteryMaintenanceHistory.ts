import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import type { CommonResponse } from "@/shared/types/api.types";
import type { MaintenanceCycleDTO } from "@/shared/types/battery/maintenance-cycle.types";

/**
 * Lịch sử bảo trì định kỳ của một cục pin — kỳ mới nhất trước.
 *
 * Đọc thẳng từ BatteryService: chu kỳ là thuộc tính của tài sản, không phải của ticket.
 * Trước đây tab này ghép danh sách ticket periodic với maintenance log của từng ticket —
 * hai request lồng nhau, và hiển thị báo cáo công việc của Staff thay vì tình trạng pin.
 */
export function useBatteryMaintenanceHistory(assetId: string) {
  return useQuery({
    queryKey: QUERY_KEY.batteryAssets.maintenanceCycles(assetId),
    queryFn: () =>
      axiosInstance
        .get<
          CommonResponse<MaintenanceCycleDTO[]>
        >(ENDPOINTS.BATTERY_ASSETS.MAINTENANCE_CYCLES(assetId))
        .then((r) => r.data.data ?? []),
    enabled: !!assetId,
    staleTime: 60_000,
  });
}
