import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { sensorReadingService } from "@/shared/services/battery/sensor-reading.service";

interface UseReadingAggregateHourlyOptions {
  days: number; // lookback window from now → `from` is computed at fetch time
}

// Fixed 1h bucket (continuous aggregate) — for long ranges (> 7 days).
// Short range + flexible interval (1m/5m/…) → use useReadingAggregate.
export function useReadingAggregateHourly(
  assetId: string,
  opts: UseReadingAggregateHourlyOptions,
) {
  return useQuery({
    queryKey: QUERY_KEY.sensorReadings.aggregateHourly(assetId, opts),
    // `from` is computed inside queryFn (at fetch time) — never call Date.now during render.
    queryFn: () => {
      const from = new Date(
        Date.now() - opts.days * 24 * 3_600_000,
      ).toISOString();
      return sensorReadingService
        .getAggregateHourly(assetId, { from })
        .then((r) => r.data.data);
    },
    enabled: !!assetId,
    // 1h bucket — refreshes slower than /aggregate (materialized view refreshes every minute).
    staleTime: 60_000,
  });
}
