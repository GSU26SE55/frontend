import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authService } from "@/features/auth/services/auth.service";
import { handleErrorApi } from "@/shared/lib/errors";
import type { ResendOtpPayload } from "@/features/auth/types/auth.types";
import { AUTH_MESSAGES } from "@/features/auth/constants/messages";

export const useResendOtp = () =>
  useMutation({
    mutationFn: (payload: ResendOtpPayload) => authService.resendOtp(payload),
    onSuccess: (response) => {
      const res = response.data;
      if (!res.isSuccess) {
        toast.error(res.message ?? "Gửi lại OTP thất bại");
        return;
      }
      toast.success(AUTH_MESSAGES.otp.resent);
    },
    onError: (error) => handleErrorApi({ error }),
  });
