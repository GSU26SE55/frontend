import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { batteryGroupService } from "@/features/admin/services/battery-group.service";
import type { BatteryGroupListParams } from "@/features/admin/types/battery-group.types";

export function useBatteryGroups(params?: BatteryGroupListParams) {
  return useQuery({
    queryKey: QUERY_KEY.batteryGroups.list(params),
    queryFn: () => batteryGroupService.getList(params).then((r) => r.data.data),
  });
}

export function useBatteryGroup(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.batteryGroups.detail(id),
    queryFn: () => batteryGroupService.getById(id).then((r) => r.data.data),
    enabled: !!id,
  });
}
