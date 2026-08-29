import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authService } from "@/features/auth/services/auth.service";
import type { ForgotPasswordPayload } from "@/features/auth/types/auth.types";
import { AUTH_MESSAGES } from "@/features/auth/constants/messages";

export const useForgotPassword = (onSuccess?: () => void) =>
  useMutation({
    mutationFn: (payload: ForgotPasswordPayload) =>
      authService.forgotPassword(payload),
    onSuccess: (response) => {
      const res = response.data;
      if (!res.isSuccess) {
        toast.error(res.message ?? "Couldn't send the request");
        return;
      }
      toast.success(AUTH_MESSAGES.otp.sentToEmail);
      onSuccess?.();
    },
    // No onError: this backs a form, so the component catches the rejection and maps
    // it with setError — a bad email or an expired code belongs under its input, not
    // in a toast that does not say which field failed.
  });
