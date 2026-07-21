import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type { SiteDto, SiteFilterParams } from "@/shared/types/site/site.types";

export const staffSiteService = {
  // Chỉ getList — Staff cần chọn SiteId khi report sự cố môi trường thủ công.
  getList: (params?: SiteFilterParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<SiteDto>>>(
      ENDPOINTS.SITES.LIST,
      { params },
    ),
};
