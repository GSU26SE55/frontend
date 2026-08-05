import { useQuery } from "@tanstack/react-query";
import { KEY } from "@/shared/utils/queryKeys";
import { adminAccountService } from "@/features/admin/services/account/account.service";
import { useRoleId } from "@/features/admin/hooks/account/useRoleId";

export function useCustomers(params?: {
  pageNumber?: number;
  pageSize?: number;
  keyword?: string;
}) {
  // roleId của Customer resolve động theo normalizedName — xem useRoleId.
  const { data: customerRoleId } = useRoleId("CUSTOMER");

  return useQuery({
    queryKey: [KEY.admin.accounts, "customers", customerRoleId, params],
    queryFn: () =>
      adminAccountService
        .getCustomers({ roleId: customerRoleId!, ...params })
        .then((r) => r.data.data),
    enabled: !!customerRoleId,
  });
}
