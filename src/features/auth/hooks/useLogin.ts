import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authService } from "@/features/auth/services/auth.service";
import { saveTokens, clearTokens } from "@/shared/lib/axios";
import { decodeToken, redirectByRole } from "@/shared/types/session.types";
import { UserRole } from "@/shared/types/session.types";
import type { LoginPayload } from "@/features/auth/types/auth.types";

export const useLogin = () => {
  return useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: (response) => {
      const res = response.data;
      if (!res.isSuccess || !res.data) {
        toast.error(res.message ?? "Đăng nhập thất bại");
        return;
      }
      const { accessToken, refreshToken } = res.data;
      saveTokens(accessToken, refreshToken);
      const user = decodeToken(accessToken);

      if (user.role === UserRole.CUSTOMER) {
        toast.error("Vui lòng sử dụng Mobile App để đăng nhập.");
        clearTokens();
        return;
      }

      window.location.href = redirectByRole(user.role);
    },
  });
};
