import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type { CustomerDropdownItem } from "@/features/admin/types/battery/battery-asset.types";

export const adminAccountService = {
  // roleId is passed in by the caller (resolved dynamically via useRoleId) — do NOT hardcode
  // it's a GUID because BE seeds the system role with Guid.NewGuid(), so the id differs per environment.
  getCustomers: (params: {
    roleId: string;
    pageNumber?: number;
    pageSize?: number;
    keyword?: string;
  }) =>
    axiosInstance.get<CommonResponse<PaginationResponse<CustomerDropdownItem>>>(
      ENDPOINTS.ADMIN.ACCOUNTS.LIST,
      { params },
    ),
};
