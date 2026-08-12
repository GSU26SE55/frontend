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
} from "@/shared/types/site/site.types";
import type { BatteryAssetDto } from "@/shared/types/battery/battery.types";
import type { StaffAssignmentProfileDto } from "@/shared/types/account/account.types";
import type { TicketPriorityEnum } from "@/shared/types/ticket/ticket.types";

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

  // GH-693 — per the BE: pass ticketPriority so AuthService returns only Staff who are Active +
  // available + high enough tier for Primary Handler. Omit it → returns everyone (used for Supporters).
  getStaffList: (ticketPriority?: TicketPriorityEnum) =>
    axiosInstance
      .get<CommonResponse<StaffAssignmentProfileDto[]>>(ENDPOINTS.STAFF.LIST, {
        params: ticketPriority ? { ticketPriority } : undefined,
      })
      .then((r) => r.data.data ?? []),
};
