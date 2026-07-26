import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { thresholdService } from "@/shared/services/battery/threshold.service";
import type {
  ThresholdListParams,
  ThresholdByTypeParams,
} from "@/shared/types/battery/threshold.types";

export function useThresholds(params?: ThresholdListParams) {
  return useQuery({
    queryKey: QUERY_KEY.thresholds.list(params),
    queryFn: () => thresholdService.getList(params).then((r) => r.data.data),
  });
}

// getByType — BE cho phép Admin/Manager/Staff đọc.
export function useThresholdByType(
  batteryTypeId: string,
  params?: ThresholdByTypeParams,
  enabled = true,
) {
  return useQuery({
    queryKey: QUERY_KEY.thresholds.byType(batteryTypeId, params),
    queryFn: () =>
      thresholdService
        .getByType(batteryTypeId, params)
        .then((r) => r.data.data),
    enabled: enabled && !!batteryTypeId,
  });
}
