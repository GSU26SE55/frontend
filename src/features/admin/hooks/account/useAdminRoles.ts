import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminRolesService } from "@/features/admin/services/account/admin-roles.service";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import { ADMIN_MESSAGES } from "@/features/admin/constants/messages";
import type {
  GetRolesParams,
  CreateRolePayload,
  UpdateRolePayload,
  ChangeRoleStatusPayload,
} from "@/features/admin/types/account/admin.types";

export const useAdminRoleList = (params?: GetRolesParams) =>
  useQuery({
    queryKey: QUERY_KEY.admin.roles.list(params),
    queryFn: () => adminRolesService.getList(params).then((r) => r.data.data),
  });

export const useAdminRoleDetail = (id: string) =>
  useQuery({
    queryKey: QUERY_KEY.admin.roles.detail(id),
    queryFn: () => adminRolesService.getById(id).then((r) => r.data.data),
    enabled: !!id,
  });

export const useAdminCreateRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRolePayload) =>
      adminRolesService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY.admin.roles });
    },
  });
};

export const useAdminUpdateRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRolePayload }) =>
      adminRolesService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY.admin.roles });
    },
  });
};

// Powers the dropdown quick-change submenu. The toast lives here, not in mutate()'s callback —
// the submenu closes as soon as it's clicked, so the component unmounts before the response
// returns.
export const useAdminChangeRoleStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ChangeRoleStatusPayload;
    }) => adminRolesService.changeStatus(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY.admin.roles });
      toast.success(ADMIN_MESSAGES.role.statusUpdated);
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

export const useAdminDeleteRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminRolesService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY.admin.roles });
    },
  });
};
