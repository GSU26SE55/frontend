import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminRolesService } from "@/features/admin/services/admin-roles.service";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import type {
  GetRolesParams,
  CreateRolePayload,
  UpdateRolePayload,
  ChangeRoleStatusPayload,
} from "@/features/admin/types/admin.types";

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
    },
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
