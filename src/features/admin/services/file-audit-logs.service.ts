import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type {
  FileAuditLogDto,
  FileAuditLogParams,
} from "@/features/admin/types/file-audit.types";

// GH-133 C5 — audit truy cập file GDPR (FileStorageService, Admin only).
export const fileAuditLogsService = {
  getLogs: (params?: FileAuditLogParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<FileAuditLogDto>>>(
      ENDPOINTS.ADMIN.FILES_AUDIT_LOGS,
      { params },
    ),
};
