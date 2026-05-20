import axiosInstance from '@/shared/lib/axios';
import { ENDPOINTS } from '@/shared/utils/endpoints';
import type { CommonResponse } from '@/shared/types/api.types';
import type { PermissionDto, SetPermissionsPayload } from '@/features/admin/types/admin.types';

export const adminPermissionsService = {
  getList: (module?: string) =>
    axiosInstance.get<CommonResponse<PermissionDto[]>>(
      ENDPOINTS.ADMIN.PERMISSIONS.LIST,
      { params: module ? { module } : undefined },
    ),

  getByRole: (roleId: string) =>
    // same path as setForRole — distinguished by HTTP method
    axiosInstance.get<CommonResponse<PermissionDto[]>>(
      ENDPOINTS.ADMIN.PERMISSIONS.BY_ROLE(roleId),
    ),

  setForRole: (roleId: string, payload: SetPermissionsPayload) =>
    // PUT replaces all permissions — FE must fetch-before-save to preserve existing ones
    axiosInstance.put<CommonResponse<unknown>>(
      ENDPOINTS.ADMIN.PERMISSIONS.SET_FOR_ROLE(roleId), payload,
    ),
};
