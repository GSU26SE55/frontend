import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type { BatteryAssetDto } from "@/shared/types/battery/battery.types";

/**
 * BE caps PageSize at 100 (SharedContracts PaginationRequest.MaxPageSize) and silently clamps
 * anything larger, so a single request cannot be trusted to return every battery.
 */
const PAGE_SIZE = 100;

/**
 * Hard stop on how many pages the site-wide BMS control will walk. A site with more batteries
 * than this needs a real bulk endpoint, not a longer client-side loop.
 */
const MAX_PAGES = 5;

export interface SiteSwitchableAssets {
  assets: BatteryAssetDto[];
  /**
   * True when the site holds more batteries than this hook is willing to page through. The
   * caller MUST refuse to run a site-wide switch in that case: acting on a truncated list
   * would report success while leaving batteries energised.
   */
  truncated: boolean;
}

/**
 * Every battery on a site, for the site-wide BMS shutdown.
 *
 * The site screen's own table is paged for display; this is deliberately a separate query,
 * because a bulk shutdown must act on the whole site rather than on whichever page happens to
 * be open, and the ticket's battery-evidence panel needs every pack rather than a page too.
 *
 * `enabled` is the caller's: the BMS dialog turns it on only when opened, while the ticket
 * evidence panel needs the list as soon as it renders.
 */
export function useSiteSwitchableAssets(siteId: string, enabled: boolean) {
  return useQuery<SiteSwitchableAssets>({
    queryKey: QUERY_KEY.sites.assets(siteId, { all: true }),
    enabled: !!siteId && enabled,
    // The switch acts on live hardware, so the membership list must not be served stale.
    // gcTime is left at the default: the ticket evidence panel reads the same list, and
    // dropping the cache the moment nothing subscribes made every re-render of that panel
    // re-walk all pages.
    staleTime: 0,
    queryFn: async () => {
      const assets: BatteryAssetDto[] = [];

      for (let page = 1; page <= MAX_PAGES; page++) {
        const response = await axiosInstance.get<
          CommonResponse<PaginationResponse<BatteryAssetDto>>
        >(ENDPOINTS.SITES.ASSETS(siteId), {
          params: { PageNumber: page, PageSize: PAGE_SIZE },
        });

        const data = response.data.data;
        assets.push(...(data?.items ?? []));
        if (!data?.hasNextPage) return { assets, truncated: false };
      }

      return { assets, truncated: true };
    },
  });
}
