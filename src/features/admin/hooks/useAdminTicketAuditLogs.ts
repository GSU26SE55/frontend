import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import {
  ticketAuditLogsService,
  type TicketAuditLogParams,
} from "@/features/admin/services/ticket-audit-logs.service";

export function useAdminTicketAuditLogs(
  params?: TicketAuditLogParams,
  enabled = true,
) {
  return useQuery({
    queryKey: QUERY_KEY.admin.ticketAuditLogs.list(params),
    queryFn: () =>
      ticketAuditLogsService.getList(params).then((r) => r.data.data),
    enabled,
  });
}
