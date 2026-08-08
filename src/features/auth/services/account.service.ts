import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type {
  ChangePasswordPayload,
  ChangeEmailPayload,
  ConfirmEmailChangePayload,
  VerifyPhoneOtpPayload,
  Init2faResponseData,
  Confirm2faPayload,
  Confirm2faResponseData,
  Disable2faPayload,
  RegenBackupCodesPayload,
  RegenBackupCodesResponseData,
  LinkGooglePayload,
  LoginHistoryParams,
  LoginHistoryResponseData,
  CrossDeviceRequestResponseData,
  CrossDeviceConfirmPayload,
  AccountDataExportDto,
} from "@/features/auth/types/account.types";

export const accountService = {
  changePassword: (payload: ChangePasswordPayload) =>
    axiosInstance.patch<CommonResponse>(
      ENDPOINTS.ACCOUNTS.ME.PASSWORD,
      payload,
    ),

  changeEmail: (payload: ChangeEmailPayload) =>
    axiosInstance.post<CommonResponse>(
      ENDPOINTS.ACCOUNTS.ME.CHANGE_EMAIL,
      payload,
    ),

  confirmEmailChange: (payload: ConfirmEmailChangePayload) =>
    axiosInstance.post<CommonResponse>(
      ENDPOINTS.ACCOUNTS.ME.CONFIRM_EMAIL_CHANGE,
      payload,
    ),

  sendPhoneOtp: () =>
    axiosInstance.post<CommonResponse>(ENDPOINTS.ACCOUNTS.ME.SEND_PHONE_OTP),

  verifyPhoneOtp: (payload: VerifyPhoneOtpPayload) =>
    axiosInstance.post<CommonResponse>(
      ENDPOINTS.ACCOUNTS.ME.VERIFY_PHONE_OTP,
      payload,
    ),

  // GH-295: two-step 2FA enroll flow
  initTwoFactor: () =>
    axiosInstance.post<CommonResponse<Init2faResponseData>>(
      ENDPOINTS.ACCOUNTS.ME.TWO_FA_INIT,
    ),

  confirmTwoFactor: (payload: Confirm2faPayload) =>
    axiosInstance.post<CommonResponse<Confirm2faResponseData>>(
      ENDPOINTS.ACCOUNTS.ME.TWO_FA_CONFIRM,
      payload,
    ),

  disableTwoFactor: (payload: Disable2faPayload) =>
    axiosInstance.post<CommonResponse<string>>(
      ENDPOINTS.ACCOUNTS.ME.TWO_FA_DISABLE,
      payload,
    ),

  regenerateBackupCodes: (payload: RegenBackupCodesPayload) =>
    axiosInstance.post<CommonResponse<RegenBackupCodesResponseData>>(
      ENDPOINTS.ACCOUNTS.ME.TWO_FA_BACKUP_REGEN,
      payload,
    ),

  linkGoogle: (payload: LinkGooglePayload) =>
    axiosInstance.post<CommonResponse>(
      ENDPOINTS.ACCOUNTS.ME.LINK_GOOGLE,
      payload,
    ),

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

  // #AUTH-51: cross-device 2FA — Device A request (empty body) → secret + token + QR uri
  requestCrossDevice2fa: () =>
    axiosInstance.post<CommonResponse<CrossDeviceRequestResponseData>>(
      ENDPOINTS.AUTH.TWO_FA_CROSS_DEVICE_REQUEST,
    ),

  // #AUTH-51: Device B confirms with the token (email link) + TOTP → enables 2FA
  confirmCrossDevice2fa: (payload: CrossDeviceConfirmPayload) =>
    axiosInstance.post<CommonResponse<string>>(
      ENDPOINTS.AUTH.TWO_FA_CROSS_DEVICE_CONFIRM,
      payload,
    ),

  // #AUTH-62: GDPR export — the BE returns CommonResponse<AccountDataExportDto> (JSON body).
  exportMyData: () =>
    axiosInstance.get<CommonResponse<AccountDataExportDto>>(
      ENDPOINTS.ACCOUNTS.ME.EXPORT,
    ),
};
