import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authService } from "@/features/auth/services/auth.service";
import { handleErrorApi } from "@/shared/lib/errors";
import type { ResendOtpPayload } from "@/features/auth/types/auth.types";

export const useResendResetOtp = () =>
  useMutation({
    mutationFn: (payload: ResendOtpPayload) =>
      authService.resendResetOtp(payload),
    onSuccess: (response) => {
      const res = response.data;
      if (!res.isSuccess) {
        toast.error(res.message ?? "Gửi lại OTP thất bại");
        return;
      }
      toast.success("OTP đã được gửi lại");
    },
    onError: (error) => handleErrorApi({ error }),
  });
