import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { sensorReadingService } from "@/features/admin/services/sensor-reading.service";

export function useLatestReading(assetId: string) {
  return useQuery({
    queryKey: QUERY_KEY.sensorReadings.latest(assetId),
    queryFn: () =>
      sensorReadingService.getLatest(assetId).then((r) => r.data.data),
    enabled: !!assetId,
    staleTime: 0,
    refetchInterval: 30_000,
  });
}
