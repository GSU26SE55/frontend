import axios from "axios";
import axiosInstance from "@/shared/lib/axios";
import { env } from "@/config/env";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  LoginPayload,
  LoginResultData,
  Verify2faLoginPayload,
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
import type { AccountDto } from "@/shared/types/account.types";

export const authService = {
  login: (payload: LoginPayload) =>
    axiosInstance.post<CommonResponse<LoginResultData>>(
      ENDPOINTS.AUTH.LOGIN,
      payload,
    ),

  // GH-295: bước 2 của 2FA login — verify TOTP/backup code bằng challengeToken
  verify2faLogin: (payload: Verify2faLoginPayload) =>
    axiosInstance.post<CommonResponse<LoginResultData>>(
      ENDPOINTS.AUTH.LOGIN_VERIFY_2FA,
      payload,
    ),

  logout: () => axiosInstance.post<CommonResponse>(ENDPOINTS.AUTH.LOGOUT),

  refreshToken: (refreshToken: string) =>
    axios.post<CommonResponse<LoginResultData>>(
      `${env.VITE_API_BASE_URL}${ENDPOINTS.AUTH.REFRESH_TOKEN}`,
      { refreshToken },
      { timeout: 10_000 },
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

  // GH-295: google callback trả JSON LoginResultDto (data.tokens.*), KHÔNG redirect token qua URL
  googleCallback: (code: string, state: string) =>
    axiosInstance.get<CommonResponse<LoginResultData>>(
      ENDPOINTS.AUTH.GOOGLE_CALLBACK,
      { params: { code, state } },
    ),

  getMe: () => axiosInstance.get<CommonResponse<AccountDto>>(ENDPOINTS.AUTH.ME),

  acceptInvite: (payload: AcceptInvitePayload) =>
    axiosInstance.post<CommonResponse<LoginResultData>>(
      ENDPOINTS.AUTH.ACCEPT_INVITE,
      payload,
    ),
};
