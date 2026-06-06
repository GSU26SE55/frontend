import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authService } from "@/features/auth/services/auth.service";
import type { ResetPasswordPayload } from "@/features/auth/types/auth.types";

export const useResetPassword = (onSuccess: () => void) => {
  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) =>
      authService.resetPassword(payload),
    onSuccess: (response) => {
      const res = response.data;
      if (!res.isSuccess) {
        toast.error(res.message ?? "Đặt lại mật khẩu thất bại");
        return;
      }
      toast.success("Mật khẩu đã được đặt lại thành công!");
      onSuccess();
    },
  });
};
