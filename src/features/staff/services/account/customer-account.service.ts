import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type { CustomerAccountDto } from "@/features/staff/types/account/customer-account.types";

export const staffCustomerAccountService = {
  getById: (id: string) =>
    axiosInstance.get<CommonResponse<CustomerAccountDto>>(
      ENDPOINTS.ADMIN.ACCOUNTS.DETAIL(id),
    ),
};
