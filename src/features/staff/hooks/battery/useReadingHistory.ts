import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { sensorReadingService } from "@/features/staff/services/battery/sensor-reading.service";

// Danh sách gần nhất (không infinite-scroll) — dùng cho panel tóm tắt trong ticket detail.
export function useStaffReadingHistory(
  assetId: string | null | undefined,
  limit = 10,
) {
  return useQuery({
    queryKey: QUERY_KEY.sensorReadings.history(assetId ?? "", { limit }),
    queryFn: () =>
      sensorReadingService
        .getHistory(assetId!, { limit })
        .then((r) => r.data.data),
    enabled: !!assetId,
  });
}
