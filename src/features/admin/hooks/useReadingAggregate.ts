import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { sensorReadingService } from "@/features/admin/services/sensor-reading.service";
import type { SensorReadingInterval } from "@/features/admin/types/sensor-reading.types";

interface UseReadingAggregateOptions {
  hours: number; // khoảng thời gian lùi từ hiện tại → tính `from` lúc fetch
  interval: SensorReadingInterval;
}

export function useReadingAggregate(
  assetId: string,
  opts: UseReadingAggregateOptions,
) {
  return useQuery({
    queryKey: QUERY_KEY.sensorReadings.aggregate(assetId, opts),
    // `from` tính trong queryFn (thời điểm fetch) — không gọi Date.now trong render.
    queryFn: () => {
      const from = new Date(Date.now() - opts.hours * 3_600_000).toISOString();
      return sensorReadingService
        .getAggregate(assetId, { from, interval: opts.interval })
        .then((r) => r.data.data);
    },
    enabled: !!assetId,
    staleTime: 60_000,
  });
}
