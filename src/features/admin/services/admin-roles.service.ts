import axiosInstance from '@/shared/lib/axios';
import { ENDPOINTS } from '@/shared/utils/endpoints';
import type { CommonResponse, PaginationResponse } from '@/shared/types/api.types';
import type {
  RoleDto,
  GetRolesParams,
  CreateRolePayload,
  UpdateRolePayload,
  ChangeRoleStatusPayload,
} from '@/features/admin/types/admin.types';

export const adminRolesService = {
  getList: (params?: GetRolesParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<RoleDto>>>(
      ENDPOINTS.ADMIN.ROLES.LIST, { params },
    ),

  getById: (id: string) =>
    axiosInstance.get<CommonResponse<RoleDto>>(ENDPOINTS.ADMIN.ROLES.DETAIL(id)),

  create: (payload: CreateRolePayload) =>
    axiosInstance.post<CommonResponse<string>>(ENDPOINTS.ADMIN.ROLES.CREATE, payload),

  update: (id: string, payload: UpdateRolePayload) =>
    axiosInstance.put<CommonResponse<string>>(ENDPOINTS.ADMIN.ROLES.UPDATE(id), payload),

  changeStatus: (id: string, payload: ChangeRoleStatusPayload) =>
    axiosInstance.patch<CommonResponse<unknown>>(ENDPOINTS.ADMIN.ROLES.STATUS(id), payload),

  delete: (id: string) =>
    axiosInstance.delete<CommonResponse<unknown>>(ENDPOINTS.ADMIN.ROLES.DELETE(id)),
};
