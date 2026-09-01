import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { staffCustomerAccountService } from "@/features/staff/services/account/customer-account.service";

export function useCustomerAccount(customerId?: string | null, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEY.admin.accounts.detail(customerId ?? ""),
    queryFn: async () => {
      const { data } = await staffCustomerAccountService.getById(
        customerId as string,
      );
      return data.data;
    },
    enabled: enabled && !!customerId,
    staleTime: 5 * 60 * 1000,
  });
}
