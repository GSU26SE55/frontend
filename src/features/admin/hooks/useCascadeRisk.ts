import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { cascadeService } from "@/features/admin/services/cascade.service";

export function useCascadeRisk(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.batteryAssets.cascadeRisk(id),
    queryFn: () => cascadeService.getAssetRisk(id).then((r) => r.data.data),
    enabled: !!id,
  });
}
