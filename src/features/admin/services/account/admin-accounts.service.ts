import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type { AccountDto } from "@/shared/types/account/account.types";
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
  SessionDto,
  LoginAttemptDto,
  MergeAccountPayload,
} from "@/features/admin/types/account/admin.types";

export const adminAccountsService = {
  getList: (params?: GetAccountsParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<AccountDto>>>(
      ENDPOINTS.ADMIN.ACCOUNTS.LIST,
      { params },
    ),

  getById: (id: string) =>
    axiosInstance.get<CommonResponse<AccountDto>>(
      ENDPOINTS.ADMIN.ACCOUNTS.DETAIL(id),
    ),

  create: (payload: CreateAccountPayload) =>
    axiosInstance.post<CommonResponse<string>>(
      ENDPOINTS.ADMIN.ACCOUNTS.CREATE,
      payload,
    ),

  invite: (payload: InviteAccountPayload) =>
    axiosInstance.post<CommonResponse<null>>(
      ENDPOINTS.ADMIN.ACCOUNTS.INVITE,
      payload,
    ),

  update: (id: string, payload: UpdateAccountPayload) =>
    axiosInstance.put<CommonResponse<string>>(
      ENDPOINTS.ADMIN.ACCOUNTS.UPDATE(id),
      payload,
    ),

  changeStatus: (id: string, payload: ChangeAccountStatusPayload) =>
    axiosInstance.patch<CommonResponse<unknown>>(
      ENDPOINTS.ADMIN.ACCOUNTS.STATUS(id),
      payload,
    ),

  unlock: (id: string) =>
    axiosInstance.post<CommonResponse<unknown>>(
      ENDPOINTS.ADMIN.ACCOUNTS.UNLOCK(id),
    ),

  delete: (id: string) =>
    axiosInstance.delete<CommonResponse<unknown>>(
      ENDPOINTS.ADMIN.ACCOUNTS.DELETE(id),
    ),

  getSessions: (id: string, params?: GetAccountSessionsParams) =>
    axiosInstance.get<CommonResponse<SessionDto[]>>(
      ENDPOINTS.ADMIN.ACCOUNTS.SESSIONS(id),
      { params },
    ),

  revokeAllSessions: (id: string, payload?: AdminRevokeAllSessionsPayload) =>
    axiosInstance.post<CommonResponse<number>>(
      ENDPOINTS.ADMIN.ACCOUNTS.REVOKE_ALL(id),
      payload,
    ),

  getLoginHistory: (id: string, params?: GetLoginHistoryParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<LoginAttemptDto>>>(
      ENDPOINTS.ADMIN.ACCOUNTS.LOGIN_HISTORY(id),
      { params },
    ),

  changeRole: (id: string, payload: ChangeAccountRolePayload) =>
    axiosInstance.put<CommonResponse<unknown>>(
      ENDPOINTS.ADMIN.ACCOUNTS.ROLE(id),
      payload,
    ),

  // GH-295: admin reset 2FA của user khác (idempotent)
  reset2fa: (id: string) =>
    axiosInstance.delete<CommonResponse<string>>(
      ENDPOINTS.ADMIN.ACCOUNTS.RESET_2FA(id),
    ),

  // #AUTH-47: merge secondary account vào primary (path id = primaryAccountId)
  merge: (primaryId: string, payload: MergeAccountPayload) =>
    axiosInstance.post<CommonResponse<string>>(
      ENDPOINTS.ADMIN.ACCOUNTS.MERGE(primaryId),
      payload,
    ),
};
