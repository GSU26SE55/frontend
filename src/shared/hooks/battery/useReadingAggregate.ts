import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { sensorReadingService } from "@/shared/services/battery/sensor-reading.service";
import type { SensorReadingInterval } from "@/shared/types/battery/sensor-reading-history.types";

interface UseReadingAggregateOptions {
  hours: number; // lookback window from now → `from` is computed at fetch time
  interval: SensorReadingInterval;
  /**
   * Explicit window. When set it REPLACES the `hours` lookback — used when a ticket links here
   * with an incident window, so the chart covers the same span as the evidence table instead of
   * the last N hours from now.
   */
  from?: string;
  to?: string;
}

export function useReadingAggregate(
  assetId: string,
  opts: UseReadingAggregateOptions,
) {
  return useQuery({
    queryKey: QUERY_KEY.sensorReadings.aggregate(assetId, opts),
    // `from` is computed inside queryFn (at fetch time) — never call Date.now during render.
    queryFn: () => {
      // An explicit window is absolute, so it must not be recomputed from "now".
      const from =
        opts.from ??
        new Date(Date.now() - opts.hours * 3_600_000).toISOString();
      return sensorReadingService
        .getAggregate(assetId, { from, to: opts.to, interval: opts.interval })
        .then((r) => r.data.data);
    },
    enabled: !!assetId,
    staleTime: 30_000,
    // A pinned historical window never changes; only the rolling "last N hours" view polls.
    refetchInterval: opts.from || opts.to ? false : 30_000,
  });
}
