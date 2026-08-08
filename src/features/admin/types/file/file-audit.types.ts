// GDPR file access audit (FileStorageService) — GET /api/admin/files/audit-logs (GH-133 C5).
// Rows reuse the common audit shape of BatteryAuditLogDto. Note: BE files-audit does NOT return
// actionCategory → the service maps "" when reading the response to preserve the correct shape.
import type { BatteryAuditLogDto } from "@/features/admin/types/battery/battery-audit.types";

export type FileAuditLogDto = BatteryAuditLogDto;

// Filter param FileStorageService: action / fileId / date / page (mirrors BatteryAuditLogParams).
export interface FileAuditLogParams {
  action?: string;
  fileId?: string;
  from?: string; // UTC
  to?: string; // UTC
  pageNumber?: number; // default 1
  pageSize?: number; // default 50, ≤ 100
}
