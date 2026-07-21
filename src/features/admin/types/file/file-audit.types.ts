// Audit truy cập file GDPR (FileStorageService) — GET /api/admin/files/audit-logs (GH-133 C5).
// Row dùng lại shape audit chung của BatteryAuditLogDto. Lưu ý: BE files-audit KHÔNG trả
// actionCategory → service map "" khi đọc response để giữ đúng shape.
import type { BatteryAuditLogDto } from "@/features/admin/types/battery/battery-audit.types";

export type FileAuditLogDto = BatteryAuditLogDto;

// Filter param FileStorageService: action / fileId / date / page (mirror BatteryAuditLogParams).
export interface FileAuditLogParams {
  action?: string;
  fileId?: string;
  from?: string; // UTC
  to?: string; // UTC
  pageNumber?: number; // default 1
  pageSize?: number; // default 50, ≤ 100
}
