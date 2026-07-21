import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { cascadeService } from "@/features/manager/services/battery/cascade.service";

export function useSiteCascadeSummary(siteId: string) {
  return useQuery({
    queryKey: QUERY_KEY.sites.cascadeSummary(siteId),
    queryFn: () =>
      cascadeService.getSiteSummary(siteId).then((r) => r.data.data),
    enabled: !!siteId,
  });
}
