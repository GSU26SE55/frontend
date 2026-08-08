import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type { SiteDto, SiteFilterParams } from "@/shared/types/site/site.types";

export const staffSiteService = {
  // getList only — Staff need to pick a SiteId when manually reporting an environmental incident.
  getList: (params?: SiteFilterParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<SiteDto>>>(
      ENDPOINTS.SITES.LIST,
      { params },
    ),
};
