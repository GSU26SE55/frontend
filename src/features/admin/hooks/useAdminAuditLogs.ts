import { useQuery } from "@tanstack/react-query";
import { adminAuditLogsService } from "@/features/admin/services/admin-audit-logs.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import type {
  GetAuditLogsParams,
  GetAuditLogsByAccountParams,
} from "@/features/admin/types/admin.types";

export const useAdminAuditLogs = (params?: GetAuditLogsParams) =>
  useQuery({
    queryKey: QUERY_KEY.admin.auditLogs.list(params),
    queryFn: () =>
      adminAuditLogsService.getList(params).then((r) => r.data.data),
  });

export const useAdminAuditLogsByAccount = (
  accountId: string,
  params?: GetAuditLogsByAccountParams,
) =>
  useQuery({
    queryKey: QUERY_KEY.admin.auditLogs.byAccount(accountId, params),
    queryFn: () =>
      adminAuditLogsService
        .getByAccount(accountId, params)
        .then((r) => r.data.data),
    enabled: !!accountId,
  });
