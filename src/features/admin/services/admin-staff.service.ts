import axiosInstance from '@/shared/lib/axios';
import { ENDPOINTS } from '@/shared/utils/endpoints';
import type { CommonResponse } from '@/shared/types/api.types';
import type {
  UpdateStaffProfilePayload,
  AddSkillPayload,
} from '@/features/admin/types/admin.types';

export const adminStaffService = {
  updateProfile: (id: string, payload: UpdateStaffProfilePayload) =>
    axiosInstance.put<CommonResponse<string>>(ENDPOINTS.ADMIN.STAFF.PROFILE(id), payload),

  addSkill: (id: string, payload: AddSkillPayload) =>
    axiosInstance.post<CommonResponse<string>>(ENDPOINTS.ADMIN.STAFF.SKILLS(id), payload),

  deleteSkill: (id: string, skillCode: string) =>
    axiosInstance.delete<CommonResponse<unknown>>(
      ENDPOINTS.ADMIN.STAFF.SKILL(id, skillCode),
    ),
};
