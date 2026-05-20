import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminAccountsService } from '@/features/admin/services/admin-accounts.service';
import { KEY, QUERY_KEY } from '@/shared/utils/queryKeys';
import type {
  GetAccountsParams,
  CreateAccountPayload,
  InviteAccountPayload,
  UpdateAccountPayload,
  ChangeAccountStatusPayload,
  AdminRevokeAllSessionsPayload,
  GetLoginHistoryParams,
  GetAccountSessionsParams,
} from '@/features/admin/types/admin.types';

export const useAdminAccountList = (params?: GetAccountsParams) =>
  useQuery({
    queryKey: QUERY_KEY.admin.accounts.list(params),
    queryFn: () => adminAccountsService.getList(params).then((r) => r.data.data),
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
    mutationFn: (payload: CreateAccountPayload) => adminAccountsService.create(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY.admin.accounts }); },
  });
};

export const useAdminInviteAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: InviteAccountPayload) => adminAccountsService.invite(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY.admin.accounts }); },
  });
};

export const useAdminUpdateAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAccountPayload }) =>
      adminAccountsService.update(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY.admin.accounts }); },
  });
};

export const useAdminChangeAccountStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ChangeAccountStatusPayload }) =>
      adminAccountsService.changeStatus(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY.admin.accounts }); },
  });
};

export const useAdminUnlockAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminAccountsService.unlock(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY.admin.accounts }); },
  });
};

export const useAdminDeleteAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminAccountsService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY.admin.accounts }); },
  });
};

export const useAdminAccountSessions = (id: string, params?: GetAccountSessionsParams) =>
  useQuery({
    queryKey: QUERY_KEY.admin.accounts.sessions(id),
    queryFn: () => adminAccountsService.getSessions(id, params).then((r) => r.data.data),
    enabled: !!id,
  });

export const useAdminRevokeAllSessions = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: AdminRevokeAllSessionsPayload }) =>
      adminAccountsService.revokeAllSessions(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.admin.accounts.sessions(id) });
    },
  });
};

export const useAdminAccountLoginHistory = (id: string, params?: GetLoginHistoryParams) =>
  useQuery({
    queryKey: QUERY_KEY.admin.accounts.loginHistory(id, params),
    queryFn: () => adminAccountsService.getLoginHistory(id, params).then((r) => r.data.data),
    enabled: !!id,
  });
