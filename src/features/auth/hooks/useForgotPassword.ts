import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authService } from "@/features/auth/services/auth.service";
import { handleErrorApi } from "@/shared/lib/errors";
import type { ForgotPasswordPayload } from "@/features/auth/types/auth.types";
import { AUTH_MESSAGES } from "@/features/auth/constants/messages";

export const useForgotPassword = (onSuccess?: () => void) =>
  useMutation({
    mutationFn: (payload: ForgotPasswordPayload) =>
      authService.forgotPassword(payload),
    onSuccess: (response) => {
      const res = response.data;
      if (!res.isSuccess) {
        toast.error(res.message ?? "Gửi yêu cầu thất bại");
        return;
      }
      toast.success(AUTH_MESSAGES.otp.sentToEmail);
      onSuccess?.();
    },
    onError: (error) => handleErrorApi({ error }),
  });
