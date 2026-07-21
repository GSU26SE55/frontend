import { useQuery } from "@tanstack/react-query";
import { accountService } from "@/features/auth/services/account.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import type { LoginHistoryParams } from "@/features/auth/types/account.types";

export const useLoginHistory = (params?: LoginHistoryParams) =>
  useQuery({
    queryKey: QUERY_KEY.loginHistory.list(params),
    queryFn: () =>
      accountService.getLoginHistory(params).then((r) => r.data.data),
  });
