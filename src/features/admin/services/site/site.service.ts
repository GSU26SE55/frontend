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
  SiteCreatePayload,
  SiteUpdatePayload,
} from "@/shared/types/site/site.types";
import type {
  BatteryAssetDto,
  RawBatteryAssetDto,
} from "@/shared/types/battery/battery.types";
import { CascadeRiskLevel } from "@/shared/enums/battery/cascade.enum";
import { nameFrom } from "@/shared/services/battery/cascade.service";

// Same numeric-enum quirk as the cascade endpoints (see cascade.service.ts) — cascadeRiskLevel
// arrives as a number, not the string name the DTO advertises.
const normalizeAsset = (dto: RawBatteryAssetDto): BatteryAssetDto => ({
  ...dto,
  cascadeRiskLevel: nameFrom(CascadeRiskLevel, dto.cascadeRiskLevel),
});

export const adminSiteService = {
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

  getAssets: async (siteId: string, params?: SiteAssetsFilterParams) => {
    const res = await axiosInstance.get<
      CommonResponse<PaginationResponse<RawBatteryAssetDto>>
    >(ENDPOINTS.SITES.ASSETS(siteId), { params });
    return {
      ...res,
      data: {
        ...res.data,
        data: res.data.data && {
          ...res.data.data,
          items: res.data.data.items.map(normalizeAsset),
        },
      },
    };
  },

  create: (payload: SiteCreatePayload) =>
    axiosInstance.post<CommonResponse<SiteDto>>(
      ENDPOINTS.SITES.CREATE,
      payload,
    ),

  update: (id: string, payload: SiteUpdatePayload) =>
    axiosInstance.put<CommonResponse<SiteDto>>(
      ENDPOINTS.SITES.UPDATE(id),
      payload,
    ),

  delete: (id: string) =>
    axiosInstance.delete<CommonResponse<null>>(ENDPOINTS.SITES.DELETE(id)),

  restore: (id: string) =>
    axiosInstance.patch<CommonResponse<null>>(ENDPOINTS.SITES.RESTORE(id)),
};
