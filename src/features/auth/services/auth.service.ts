import axios from "axios";
import axiosInstance, { NGROK_HEADER } from "@/shared/lib/axios";
import { env } from "@/config/env";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  LoginPayload,
  LoginResultData,
  Verify2faLoginPayload,
  Sms2faPayload,
  ReactivateRequestPayload,
  ReactivateVerifyPayload,
  RegisterPayload,
  OtpVerifyPayload,
  ResendOtpPayload,
  ForgotPasswordPayload,
  VerifyResetOtpPayload,
  VerifyResetOtpResponseData,
  ResetPasswordPayload,
  AcceptInvitePayload,
} from "@/features/auth/types/auth.types";
import type { CommonResponse } from "@/shared/types/api.types";
import type { AccountDto } from "@/shared/types/account/account.types";

export const authService = {
  login: (payload: LoginPayload) =>
    axiosInstance.post<CommonResponse<LoginResultData>>(
      ENDPOINTS.AUTH.LOGIN,
      payload,
    ),

  // GH-295: step 2 of the 2FA login — verify the TOTP/backup/SMS code with the challengeToken
  verify2faLogin: (payload: Verify2faLoginPayload) =>
    axiosInstance.post<CommonResponse<LoginResultData>>(
      ENDPOINTS.AUTH.LOGIN_VERIFY_2FA,
      payload,
    ),

  // #AUTH-58: send the SMS OTP fallback — rate limit partitioned by the X-Challenge-Token header.
  // The returned data is the masked phone number (e.g. "******1234").
  send2faSms: (payload: Sms2faPayload) =>
    axiosInstance.post<CommonResponse<string>>(
      ENDPOINTS.AUTH.LOGIN_2FA_SMS,
      payload,
      { headers: { "X-Challenge-Token": payload.challengeToken } },
    ),

  // #AUTH-50: restore a soft-deleted account (90-day window)
  reactivateRequest: (payload: ReactivateRequestPayload) =>
    axiosInstance.post<CommonResponse<string>>(
      ENDPOINTS.AUTH.REACTIVATE_REQUEST,
      payload,
    ),

  reactivateVerify: (payload: ReactivateVerifyPayload) =>
    axiosInstance.post<CommonResponse<string>>(
      ENDPOINTS.AUTH.REACTIVATE_VERIFY,
      payload,
    ),

  logout: () => axiosInstance.post<CommonResponse>(ENDPOINTS.AUTH.LOGOUT),

  refreshToken: (refreshToken: string) =>
    axios.post<CommonResponse<LoginResultData>>(
      `${env.VITE_API_BASE_URL}${ENDPOINTS.AUTH.REFRESH_TOKEN}`,
      { refreshToken },
      // Raw axios, not axiosInstance — it does not inherit the instance headers, so the
      // ngrok interstitial guard has to be repeated here.
      { timeout: 10_000, headers: { ...NGROK_HEADER } },
    ),

  register: (payload: RegisterPayload) =>
    axiosInstance.post<CommonResponse>(ENDPOINTS.AUTH.REGISTER, payload),

  verifyOtp: (payload: OtpVerifyPayload) =>
    axiosInstance.post<CommonResponse>(ENDPOINTS.AUTH.VERIFY_OTP, payload),

  resendOtp: (payload: ResendOtpPayload) =>
    axiosInstance.post<CommonResponse>(ENDPOINTS.AUTH.RESEND_OTP, payload),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    axiosInstance.post<CommonResponse>(ENDPOINTS.AUTH.FORGOT_PASSWORD, payload),

  verifyResetOtp: (payload: VerifyResetOtpPayload) =>
    axiosInstance.post<CommonResponse<VerifyResetOtpResponseData>>(
      ENDPOINTS.AUTH.VERIFY_RESET_OTP,
      payload,
    ),

  resetPassword: (payload: ResetPasswordPayload) =>
    axiosInstance.post<CommonResponse>(ENDPOINTS.AUTH.RESET_PASSWORD, payload),

  resendResetOtp: (payload: ResendOtpPayload) =>
    axiosInstance.post<CommonResponse>(
      ENDPOINTS.AUTH.RESEND_RESET_OTP,
      payload,
    ),

  // GH-295: the google callback returns a JSON LoginResultDto (data.tokens.*), it does NOT redirect the token through the URL
  googleCallback: (code: string, state: string) =>
    axiosInstance.get<CommonResponse<LoginResultData>>(
      ENDPOINTS.AUTH.GOOGLE_CALLBACK,
      { params: { code, state }, withCredentials: true },
    ),

  getMe: () => axiosInstance.get<CommonResponse<AccountDto>>(ENDPOINTS.AUTH.ME),

  acceptInvite: (payload: AcceptInvitePayload) =>
    axiosInstance.post<CommonResponse<LoginResultData>>(
      ENDPOINTS.AUTH.ACCEPT_INVITE,
      payload,
    ),
};
