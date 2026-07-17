import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { sensorReadingService } from "@/features/admin/services/sensor-reading.service";

interface UseReadingAggregateHourlyOptions {
  days: number; // khoảng thời gian lùi từ hiện tại → tính `from` lúc fetch
}

// Bucket 1h cố định (continuous aggregate) — cho range dài (> 7 ngày).
// Range ngắn + interval linh hoạt (1m/5m/…) → dùng useReadingAggregate.
export function useReadingAggregateHourly(
  assetId: string,
  opts: UseReadingAggregateHourlyOptions,
) {
  return useQuery({
    queryKey: QUERY_KEY.sensorReadings.aggregateHourly(assetId, opts),
    // `from` tính trong queryFn (thời điểm fetch) — không gọi Date.now trong render.
    queryFn: () => {
      const from = new Date(
        Date.now() - opts.days * 24 * 3_600_000,
      ).toISOString();
      return sensorReadingService
        .getAggregateHourly(assetId, { from })
        .then((r) => r.data.data);
    },
    enabled: !!assetId,
    // Bucket 1h — refresh chậm hơn /aggregate (materialized view refresh mỗi phút).
    staleTime: 60_000,
  });
}
