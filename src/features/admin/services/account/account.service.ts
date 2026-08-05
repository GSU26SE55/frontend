import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type { CustomerDropdownItem } from "@/features/admin/types/battery/battery-asset.types";

export const adminAccountService = {
  // roleId do caller truyền vào (resolve động qua useRoleId) — KHÔNG hardcode
  // GUID vì BE seed system role bằng Guid.NewGuid() nên id khác nhau mỗi môi trường.
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
