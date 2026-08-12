import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminAccountsService } from "@/features/admin/services/account/admin-accounts.service";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import { toast } from "sonner";
import { HttpError, handleErrorApi } from "@/shared/lib/errors";
import { ADMIN_MESSAGES } from "@/features/admin/constants/messages";
import type {
  GetAccountsParams,
  CreateAccountPayload,
  InviteAccountPayload,
  UpdateAccountPayload,
  ChangeAccountStatusPayload,
  ChangeAccountRolePayload,
  AdminRevokeAllSessionsPayload,
  GetLoginHistoryParams,
  GetAccountSessionsParams,
} from "@/features/admin/types/account/admin.types";

export const useAdminAccountList = (params?: GetAccountsParams) =>
  useQuery({
    queryKey: QUERY_KEY.admin.accounts.list(params),
    queryFn: () =>
      adminAccountsService.getList(params).then((r) => r.data.data),
  });

export const useAdminAccountDetail = (id: string) =>
  useQuery({
    queryKey: QUERY_KEY.admin.accounts.detail(id),
    queryFn: () => adminAccountsService.getById(id).then((r) => r.data.data),
    enabled: !!id,
  });

export const useAdminCreateAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAccountPayload) =>
      adminAccountsService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY.admin.accounts });
    },
  });
};

export const useAdminInviteAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: InviteAccountPayload) =>
      adminAccountsService.invite(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY.admin.accounts });
    },
  });
};

export const useAdminUpdateAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateAccountPayload;
    }) => adminAccountsService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY.admin.accounts });
    },
  });
};

export const useAdminChangeAccountStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ChangeAccountStatusPayload;
    }) => adminAccountsService.changeStatus(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY.admin.accounts });
    },
  });
};

export const useAdminUnlockAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminAccountsService.unlock(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY.admin.accounts });
    },
  });
};

export const useAdminDeleteAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminAccountsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY.admin.accounts });
    },
  });
};

export const useAdminAccountSessions = (
  id: string,
  params?: GetAccountSessionsParams,
) =>
  useQuery({
    queryKey: QUERY_KEY.admin.accounts.sessions(id),
    queryFn: () =>
      adminAccountsService.getSessions(id, params).then((r) => r.data.data),
    enabled: !!id,
  });

export const useAdminRevokeAllSessions = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload?: AdminRevokeAllSessionsPayload;
    }) => adminAccountsService.revokeAllSessions(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.admin.accounts.sessions(id) });
    },
  });
};

export const useAdminAccountLoginHistory = (
  id: string,
  params?: GetLoginHistoryParams,
) =>
  useQuery({
    queryKey: QUERY_KEY.admin.accounts.loginHistory(id, params),
    queryFn: () =>
      adminAccountsService.getLoginHistory(id, params).then((r) => r.data.data),
    enabled: !!id,
  });

export const useAdminChangeAccountRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ChangeAccountRolePayload;
    }) =>
      adminAccountsService.changeRole(id, payload).then((res) => {
        // AdminAccountsController uses StatusCode(result.StatusCode, result), so errors come
        // back as proper HTTP 4xx and axios rejects on its own. The retry-exhausted branch in
        // the handler returns 409 with isSuccess=false — check it too, don't rely on status.
        if (!res.data.isSuccess) {
          throw new HttpError(
            res.status,
            res.data.message ?? "Couldn't change role",
          );
        }
        return res.data;
      }),
    // The toast lives here, NOT in the mutate() callback: the submenu closes as soon as it is
    // clicked, so the component unmounts before the request returns, and callbacks passed via
    // mutate() are skipped once the component is unmounted — the role change would succeed
    // with no toast at all.
    onSuccess: (data, { id }) => {
      qc.invalidateQueries({ queryKey: KEY.admin.accounts });
      qc.invalidateQueries({ queryKey: QUERY_KEY.admin.accounts.detail(id) });
      // BE already returns a message including the new role name ("Role changed to Manager.").
      toast.success(data.message || ADMIN_MESSAGES.account.roleChanged);
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

// GH-295: admin resets another user's 2FA
export const useAdminReset2fa = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminAccountsService.reset2fa(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: KEY.admin.accounts });
      qc.invalidateQueries({ queryKey: QUERY_KEY.admin.accounts.detail(id) });
    },
  });
};
