import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authService } from "@/features/auth/services/auth.service";
import { handleErrorApi } from "@/shared/lib/errors";
import type { OtpVerifyPayload } from "@/features/auth/types/auth.types";

export const useVerifyOtp = (onSuccess: () => void) => {
  return useMutation({
    mutationFn: (payload: OtpVerifyPayload) => authService.verifyOtp(payload),
    onSuccess: (response) => {
      const res = response.data;
      if (!res.isSuccess) {
        toast.error(res.message ?? "OTP không hợp lệ");
        return;
      }
      toast.success("Xác thực thành công!");
      onSuccess();
    },
    onError: (error) => handleErrorApi({ error }),
  });
};
