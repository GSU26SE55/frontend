// Admin/Manager also need this hook — do NOT import cross-feature. Create a separate issue to abstract.
import axiosInstance from '@/shared/lib/axios';
import { ENDPOINTS } from '@/shared/utils/endpoints';
import type { CommonResponse } from '@/shared/types/api.types';
import type { StaffAssignmentProfileDto } from '@/shared/types/account.types';

export const staffService = {
  getList: (skill?: string) =>
    axiosInstance.get<CommonResponse<StaffAssignmentProfileDto[]>>(ENDPOINTS.STAFF.LIST, {
      params: skill ? { skill } : undefined,
    }),

  getAssignmentProfile: (id: string) =>
    axiosInstance.get<CommonResponse<StaffAssignmentProfileDto>>(ENDPOINTS.STAFF.DETAIL(id)),
};
