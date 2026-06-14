import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authService } from "@/features/auth/services/auth.service";
import type { RegisterFormValues } from "@/features/auth/types/auth.types";

export const useRegister = (onOtpSent: (email: string) => void) => {
  return useMutation({
    // BE không nhận confirmPassword (api-auth.md §/register) — strip trước khi gửi
    mutationFn: (values: RegisterFormValues) => {
      const { fullName, email, password, phoneNumber } = values;
      return authService.register({ fullName, email, password, phoneNumber });
    },
    onSuccess: (response, variables) => {
      const res = response.data;
      if (!res.isSuccess) {
        toast.error(res.message ?? "Đăng ký thất bại");
        return;
      }
      toast.success("Đăng ký thành công! Vui lòng xác thực OTP.");
      onOtpSent(variables.email);
    },
  });
};
