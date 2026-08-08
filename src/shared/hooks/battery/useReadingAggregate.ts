import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { sensorReadingService } from "@/shared/services/battery/sensor-reading.service";
import type { SensorReadingInterval } from "@/shared/types/battery/sensor-reading-history.types";

interface UseReadingAggregateOptions {
  hours: number; // lookback window from now → `from` is computed at fetch time
  interval: SensorReadingInterval;
}

export function useReadingAggregate(
  assetId: string,
  opts: UseReadingAggregateOptions,
) {
  return useQuery({
    queryKey: QUERY_KEY.sensorReadings.aggregate(assetId, opts),
    // `from` is computed inside queryFn (at fetch time) — never call Date.now during render.
    queryFn: () => {
      const from = new Date(Date.now() - opts.hours * 3_600_000).toISOString();
      return sensorReadingService
        .getAggregate(assetId, { from, interval: opts.interval })
        .then((r) => r.data.data);
    },
    enabled: !!assetId,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}
