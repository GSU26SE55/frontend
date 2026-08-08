import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authService } from "@/features/auth/services/auth.service";
import { handleErrorApi } from "@/shared/lib/errors";
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
    onError: (error) => handleErrorApi({ error }),
  });
