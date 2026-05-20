import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminStaffService } from '@/features/admin/services/admin-staff.service';
import { KEY, QUERY_KEY } from '@/shared/utils/queryKeys';
import type { UpdateStaffProfilePayload, AddSkillPayload } from '@/features/admin/types/admin.types';

export const useAdminUpdateStaffProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateStaffProfilePayload }) =>
      adminStaffService.updateProfile(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.admin.staff.profile(id) });
      qc.invalidateQueries({ queryKey: QUERY_KEY.admin.accounts.detail(id) });
    },
  });
};

export const useAdminAddSkill = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AddSkillPayload }) =>
      adminStaffService.addSkill(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: KEY.admin.staff });
      qc.invalidateQueries({ queryKey: QUERY_KEY.admin.accounts.detail(id) });
    },
  });
};

export const useAdminDeleteSkill = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, skillCode }: { id: string; skillCode: string }) =>
      adminStaffService.deleteSkill(id, skillCode),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: KEY.admin.staff });
      qc.invalidateQueries({ queryKey: QUERY_KEY.admin.accounts.detail(id) });
    },
  });
};
