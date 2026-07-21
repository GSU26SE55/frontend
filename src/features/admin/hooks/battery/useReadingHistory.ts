import { useInfiniteQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { sensorReadingService } from "@/features/admin/services/battery/sensor-reading.service";
import type { SensorReadingHistoryParams } from "@/features/admin/types/battery/sensor-reading.types";

// Cursor pagination — không page-number, không totalItems.
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
