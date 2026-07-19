import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type { CustomerDropdownItem } from "@/features/admin/types/battery/battery-asset.types";
import { CUSTOMER_ROLE_ID } from "@/shared/constants/roleIds";

export const adminAccountService = {
  getCustomers: (params?: {
    pageNumber?: number;
    pageSize?: number;
    keyword?: string;
  }) =>
    axiosInstance.get<CommonResponse<PaginationResponse<CustomerDropdownItem>>>(
      ENDPOINTS.ADMIN.ACCOUNTS.LIST,
      { params: { roleId: CUSTOMER_ROLE_ID, ...params } },
    ),
};
