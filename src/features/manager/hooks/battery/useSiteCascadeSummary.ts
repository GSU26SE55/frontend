import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { cascadeService } from "@/shared/services/battery/cascade.service";

export function useSiteCascadeSummary(siteId: string) {
  return useQuery({
    queryKey: QUERY_KEY.sites.cascadeSummary(siteId),
    queryFn: () =>
      cascadeService.getSiteSummary(siteId).then((r) => r.data.data),
    enabled: !!siteId,
    // Cascade risk is safety data: it says how far a thermal event at one battery would
    // spread through the site. 30s matches the alert/incident queues rendered beside it —
    // without it this query fell back to the 2-minute global default, so the risk count in
    // the header could lag the alert list it is meant to explain.
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}
