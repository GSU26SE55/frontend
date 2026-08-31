import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type { CustomerAccountDto } from "@/features/manager/types/account/customer-account.types";

export const managerCustomerAccountService = {
  getById: (id: string) =>
    axiosInstance.get<CommonResponse<CustomerAccountDto>>(
      ENDPOINTS.ADMIN.ACCOUNTS.DETAIL(id),
    ),
};
