import { useQuery } from "@tanstack/react-query";
import { siteService } from "@/shared/services/site/site.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";

/**
 * Site detail for shared components. Same query key as the feature-level hooks, so a Manager
 * arriving from the site page reads it straight out of the cache.
 *
 * `retry: false` — Staff may not be granted GET /api/sites/{id}; on a 403 the caller just renders
 * nothing rather than retrying a permission error (same degradation as the Staff site list).
 */
export const useSiteDetail = (id?: string | null) =>
  useQuery({
    queryKey: QUERY_KEY.sites.detail(id ?? ""),
    queryFn: () => siteService.getById(id!).then((r) => r.data.data),
    enabled: !!id,
    staleTime: 5 * 60_000, // a site is renamed about never
    retry: false,
  });
