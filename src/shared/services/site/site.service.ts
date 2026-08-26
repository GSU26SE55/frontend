import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type { SiteDto } from "@/shared/types/site/site.types";

/**
 * Site lookup for shared components that only hold a `siteId` — the environmental incident panel
 * renders for both Manager and Staff, so it cannot reach into either feature's site service.
 */
export const siteService = {
  getById: (id: string) =>
    axiosInstance.get<CommonResponse<SiteDto>>(ENDPOINTS.SITES.DETAIL(id)),
};
