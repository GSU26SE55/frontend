import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type {
  BatteryAuditLogDto,
  BatteryAuditLogParams,
  AlertAuditLogParams,
} from "@/features/admin/types/battery/battery-audit.types";

export const batteryAuditLogsService = {
  getBatteryLogs: (params?: BatteryAuditLogParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<BatteryAuditLogDto>>>(
      ENDPOINTS.ADMIN.BATTERY_AUDIT_LOGS,
      { params },
    ),
  getAlertLogs: (params?: AlertAuditLogParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<BatteryAuditLogDto>>>(
      ENDPOINTS.ADMIN.ALERT_AUDIT_LOGS,
      { params },
    ),
};
