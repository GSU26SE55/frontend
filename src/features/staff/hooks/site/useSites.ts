import { useQuery } from "@tanstack/react-query";
import { staffSiteService } from "@/features/staff/services/site/site.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import type { SiteFilterParams } from "@/shared/types/site/site.types";

// Site list for Staff — used to pick a SiteId when manually reporting an environmental incident.
// ⚠️ Requires the BE to open GET /api/sites to the Staff role (it was Admin,Manager → Staff got a 403).
// Before the BE ships: the query fails → `sites` is undefined → the report button hides itself (safe degradation).
export const useSiteList = (params?: SiteFilterParams) =>
  useQuery({
    queryKey: QUERY_KEY.sites.list(params),
    queryFn: () => staffSiteService.getList(params).then((r) => r.data.data),
    staleTime: 5 * 60_000, // the site list changes rarely — 5 minutes per fe.md
    retry: false, // a 403 before the BE ships → no point retrying
  });
