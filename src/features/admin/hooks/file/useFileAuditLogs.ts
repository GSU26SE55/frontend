import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { fileAuditLogsService } from "@/features/admin/services/file/file-audit-logs.service";
import type { FileAuditLogParams } from "@/features/admin/types/file/file-audit.types";

// GH-133 C5 — audit truy cập file GDPR (Admin). BE không trả actionCategory →
// map "" để giữ đúng shape audit chung (BatteryAuditLogTable render badge category).
export function useFileAuditLogs(params?: FileAuditLogParams, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEY.admin.fileAuditLogs.list(params),
    queryFn: () =>
      fileAuditLogsService.getLogs(params).then((r) => {
        const data = r.data.data;
        if (!data) return data;
        return {
          ...data,
          items: data.items.map((it) => ({
            ...it,
            actionCategory: it.actionCategory ?? "",
          })),
        };
      }),
    enabled,
  });
}
