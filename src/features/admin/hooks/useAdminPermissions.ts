import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminPermissionsService } from '@/features/admin/services/admin-permissions.service';
import { KEY, QUERY_KEY } from '@/shared/utils/queryKeys';
import type { SetPermissionsPayload } from '@/features/admin/types/admin.types';

export const useAdminPermissionList = (module?: string) =>
  useQuery({
    queryKey: QUERY_KEY.admin.permissions.list(module),
    queryFn: () => adminPermissionsService.getList(module).then((r) => r.data.data),
  });

export const useAdminRolePermissions = (roleId: string) =>
  useQuery({
    queryKey: QUERY_KEY.admin.roles.permissions(roleId),
    queryFn: () => adminPermissionsService.getByRole(roleId).then((r) => r.data.data),
    enabled: !!roleId,
  });

export const useAdminSetRolePermissions = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, payload }: { roleId: string; payload: SetPermissionsPayload }) =>
      adminPermissionsService.setForRole(roleId, payload),
    onSuccess: (_data, { roleId }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.admin.roles.permissions(roleId) });
      qc.invalidateQueries({ queryKey: KEY.admin.permissions });
    },
  });
};
