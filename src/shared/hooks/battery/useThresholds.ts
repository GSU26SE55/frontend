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

// getByType — BE allows Admin/Manager/Staff to read.
// Resolves to `null` when the type has no threshold configured yet: BE returns 200 with
// data = null for that case (a successful query with an empty result), so consumers get a
// plain "not configured" value instead of an error. The `?? null` also pins the resolved
// type — returning `undefined` would make React Query treat the query as having no data.
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
        .then((r) => r.data.data ?? null),
    enabled: enabled && !!batteryTypeId,
  });
}
