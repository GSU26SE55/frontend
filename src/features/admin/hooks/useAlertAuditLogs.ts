import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { batteryAuditLogsService } from "@/features/admin/services/battery-audit-logs.service";
import type { AlertAuditLogParams } from "@/features/admin/types/battery-audit.types";

export function useAlertAuditLogs(
  params?: AlertAuditLogParams,
  enabled = true,
) {
  return useQuery({
    queryKey: QUERY_KEY.admin.alertAuditLogs.list(params),
    queryFn: () =>
      batteryAuditLogsService.getAlertLogs(params).then((r) => r.data.data),
    enabled,
  });
}
