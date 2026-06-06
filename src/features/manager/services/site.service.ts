import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type {
  SiteDto,
  SiteDashboardDto,
  SiteFilterParams,
  SiteAssetsFilterParams,
} from "@/shared/types/site.types";
import type { BatteryAssetDto } from "@/shared/types/battery.types";
import type { StaffAssignmentProfileDto } from "@/shared/types/account.types";

export const managerSiteService = {
  getList: (params?: SiteFilterParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<SiteDto>>>(
      ENDPOINTS.SITES.LIST,
      { params },
    ),

  getById: (id: string) =>
    axiosInstance.get<CommonResponse<SiteDto>>(ENDPOINTS.SITES.DETAIL(id)),

  getDashboard: (id: string) =>
    axiosInstance.get<CommonResponse<SiteDashboardDto>>(
      ENDPOINTS.SITES.DASHBOARD(id),
    ),

  getAssets: (siteId: string, params?: SiteAssetsFilterParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<BatteryAssetDto>>>(
      ENDPOINTS.SITES.ASSETS(siteId),
      { params },
    ),

  getStaffList: () =>
    axiosInstance
      .get<CommonResponse<StaffAssignmentProfileDto[]>>(ENDPOINTS.STAFF.LIST)
      .then((r) => r.data.data ?? []),
};
