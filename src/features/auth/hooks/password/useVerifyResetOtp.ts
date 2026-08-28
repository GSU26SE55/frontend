import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authService } from "@/features/auth/services/auth.service";
import type { VerifyResetOtpPayload } from "@/features/auth/types/auth.types";

export const useVerifyResetOtp = (
  onSuccess?: (resetToken: string, expiresInSeconds: number) => void,
) =>
  useMutation({
    mutationFn: (payload: VerifyResetOtpPayload) =>
      authService.verifyResetOtp(payload),
    onSuccess: (response) => {
      const res = response.data;
      if (!res.isSuccess || !res.data) {
        toast.error(res.message ?? "Invalid verification code");
        return;
      }
      onSuccess?.(res.data.resetToken, res.data.expiresInSeconds);
    },
    // No onError: this backs a form, so the component catches the rejection and maps
    // it with setError — a bad email or an expired code belongs under its input, not
    // in a toast that does not say which field failed.
  });
