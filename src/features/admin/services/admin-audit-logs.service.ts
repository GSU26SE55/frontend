import axiosInstance from '@/shared/lib/axios';
import { ENDPOINTS } from '@/shared/utils/endpoints';
import type { CommonResponse, PaginationResponse } from '@/shared/types/api.types';
import type { AuditLogDto, GetAuditLogsParams } from '@/features/admin/types/admin.types';

export const adminAuditLogsService = {
  getList: (params?: GetAuditLogsParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<AuditLogDto>>>(
      ENDPOINTS.ADMIN.AUDIT_LOGS.LIST, { params },
    ),
};
