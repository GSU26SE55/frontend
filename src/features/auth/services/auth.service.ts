import axiosInstance from '@/shared/lib/axios';
import { env } from '@/config/env';
import { ENDPOINTS } from '@/shared/utils/endpoints';
import type {
  LoginPayload,
  LoginResponseData,
  RegisterPayload,
  OtpVerifyPayload,
  ResendOtpPayload,
  ForgotPasswordPayload,
  VerifyResetOtpPayload,
  VerifyResetOtpResponseData,
  ResetPasswordPayload,
} from "@/features/auth/types/auth.types";
import type { CommonResponse } from "@/shared/types/api.types";
import type { AccountDto } from "@/shared/types/account.types";

export const authService = {
  login: (payload: LoginPayload) =>
    axiosInstance.post<CommonResponse<LoginResponseData>>(
      ENDPOINTS.AUTH.LOGIN,
      payload,
    ),

  logout: () => axiosInstance.post<CommonResponse>(ENDPOINTS.AUTH.LOGOUT),

  refreshToken: (refreshToken: string) =>
    axiosInstance.post<CommonResponse<LoginResponseData>>(
      `${env.VITE_API_BASE_URL}${ENDPOINTS.AUTH.REFRESH_TOKEN}`,
      { refreshToken },
      { timeout: 10_000 }
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

  getMe: () => axiosInstance.get<CommonResponse<AccountDto>>(ENDPOINTS.AUTH.ME),
};
