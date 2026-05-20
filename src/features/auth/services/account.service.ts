import axiosInstance from '@/shared/lib/axios';
import { ENDPOINTS } from '@/shared/utils/endpoints';
import type { CommonResponse } from '@/shared/types/api.types';
import type {
  ChangePasswordPayload,
  ChangeEmailPayload,
  ConfirmEmailChangePayload,
  VerifyPhoneOtpPayload,
  EnableTwoFactorResponseData,
  LinkGooglePayload,
  LoginHistoryParams,
  LoginHistoryResponseData,
} from '@/features/auth/types/account.types';

export const accountService = {
  changePassword: (payload: ChangePasswordPayload) =>
    axiosInstance.patch<CommonResponse>(ENDPOINTS.ACCOUNTS.ME.PASSWORD, payload),

  changeEmail: (payload: ChangeEmailPayload) =>
    axiosInstance.post<CommonResponse>(ENDPOINTS.ACCOUNTS.ME.CHANGE_EMAIL, payload),

  confirmEmailChange: (payload: ConfirmEmailChangePayload) =>
    axiosInstance.post<CommonResponse>(ENDPOINTS.ACCOUNTS.ME.CONFIRM_EMAIL_CHANGE, payload),

  sendPhoneOtp: () =>
    axiosInstance.post<CommonResponse>(ENDPOINTS.ACCOUNTS.ME.SEND_PHONE_OTP),

  verifyPhoneOtp: (payload: VerifyPhoneOtpPayload) =>
    axiosInstance.post<CommonResponse>(ENDPOINTS.ACCOUNTS.ME.VERIFY_PHONE_OTP, payload),

  enableTwoFactor: () =>
    axiosInstance.post<CommonResponse<EnableTwoFactorResponseData>>(ENDPOINTS.ACCOUNTS.ME.TWO_FA_ENABLE),

  disableTwoFactor: () =>
    axiosInstance.post<CommonResponse>(ENDPOINTS.ACCOUNTS.ME.TWO_FA_DISABLE),

  linkGoogle: (payload: LinkGooglePayload) =>
    axiosInstance.post<CommonResponse>(ENDPOINTS.ACCOUNTS.ME.LINK_GOOGLE, payload),

  unlinkGoogle: () =>
    axiosInstance.post<CommonResponse>(ENDPOINTS.ACCOUNTS.ME.UNLINK_GOOGLE),

  deactivateAccount: () =>
    axiosInstance.post<CommonResponse>(ENDPOINTS.ACCOUNTS.ME.DEACTIVATE),

  deleteAccount: () =>
    axiosInstance.delete<CommonResponse>(ENDPOINTS.ACCOUNTS.ME.DELETE),

  getLoginHistory: (params?: LoginHistoryParams) =>
    axiosInstance.get<CommonResponse<LoginHistoryResponseData>>(
      ENDPOINTS.ACCOUNTS.ME.LOGIN_HISTORY,
      { params },
    ),
};
