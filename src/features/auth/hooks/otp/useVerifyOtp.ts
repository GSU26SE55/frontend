import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authService } from "@/features/auth/services/auth.service";
import { handleErrorApi } from "@/shared/lib/errors";
import type { OtpVerifyPayload } from "@/features/auth/types/auth.types";
import { AUTH_MESSAGES } from "@/features/auth/constants/messages";

export const useVerifyOtp = (onSuccess: () => void) => {
  return useMutation({
    mutationFn: (payload: OtpVerifyPayload) => authService.verifyOtp(payload),
    onSuccess: (response) => {
      const res = response.data;
      if (!res.isSuccess) {
        toast.error(res.message ?? "Invalid verification code");
        return;
      }
      toast.success(AUTH_MESSAGES.otp.verified);
      onSuccess();
    },
    onError: (error) => handleErrorApi({ error }),
  });
};
