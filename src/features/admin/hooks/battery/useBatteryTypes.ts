import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { batteryTypeService } from "@/features/admin/services/battery/battery-type.service";
import type { BatteryTypeListParams } from "@/features/admin/types/battery/battery-type.types";

export function useBatteryTypes(params?: BatteryTypeListParams) {
  return useQuery({
    queryKey: QUERY_KEY.batteryTypes.list(params),
    queryFn: () => batteryTypeService.getList(params).then((r) => r.data.data),
  });
}

export function useBatteryType(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.batteryTypes.detail(id),
    queryFn: () => batteryTypeService.getById(id).then((r) => r.data.data),
    enabled: !!id,
  });
}
