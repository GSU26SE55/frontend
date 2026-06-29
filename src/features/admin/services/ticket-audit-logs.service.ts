import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type { BatteryAuditLogDto } from "@/features/admin/types/battery-audit.types";

export interface TicketAuditLogParams {
  action?: string;
  ticketId?: string;
  from?: string;
  to?: string;
  pageNumber?: number;
  pageSize?: number;
}

export const ticketAuditLogsService = {
  getList: (params?: TicketAuditLogParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<BatteryAuditLogDto>>>(
      ENDPOINTS.ADMIN.TICKET_AUDIT_LOGS,
      { params },
    ),
};
