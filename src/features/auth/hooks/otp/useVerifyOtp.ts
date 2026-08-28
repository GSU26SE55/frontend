import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authService } from "@/features/auth/services/auth.service";
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
    // No onError: this backs a form, so the component catches the rejection and maps
    // it with setError — a bad email or an expired code belongs under its input, not
    // in a toast that does not say which field failed.
  });
};
