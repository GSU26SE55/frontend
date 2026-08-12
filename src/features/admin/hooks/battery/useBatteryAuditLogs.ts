import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { batteryAuditLogsService } from "@/features/admin/services/battery/battery-audit-logs.service";
import type { BatteryAuditLogParams } from "@/features/admin/types/battery/battery-audit.types";

export function useBatteryAuditLogs(
  params?: BatteryAuditLogParams,
  enabled = true,
) {
  return useQuery({
    queryKey: QUERY_KEY.admin.batteryAuditLogs.list(params),
    queryFn: () =>
      batteryAuditLogsService.getBatteryLogs(params).then((r) => r.data.data),
    enabled,
  });
}
