import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { sensorReadingService } from "@/shared/services/battery/sensor-reading.service";
import type { SensorReadingHistoryParams } from "@/shared/types/battery/sensor-reading-history.types";

// Cursor pagination — không page-number, không totalItems. Dùng cho bảng lịch sử đầy đủ.
export function useReadingHistory(
  assetId: string,
  params?: Omit<SensorReadingHistoryParams, "cursor">,
) {
  return useInfiniteQuery({
    queryKey: QUERY_KEY.sensorReadings.history(assetId, params),
    queryFn: ({ pageParam }) =>
      sensorReadingService
        .getHistory(assetId, { ...params, cursor: pageParam })
        .then((r) => r.data.data),
    enabled: !!assetId,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
  });
}

// Danh sách N bản ghi gần nhất (không infinite-scroll) — dùng cho panel tóm tắt
// trong ticket detail (manager/staff). Trước đây nhân bản useManager/StaffReadingHistory.
export function useReadingHistoryLatest(
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
