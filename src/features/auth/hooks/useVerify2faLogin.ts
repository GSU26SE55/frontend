import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authService } from "@/features/auth/services/auth.service";
import { saveTokens, clearTokens } from "@/shared/lib/axios";
import { decodeToken, redirectByRole } from "@/shared/types/session.types";
import { UserRole } from "@/shared/types/session.types";
import {
  CHALLENGE_TOKEN_KEY,
  type Verify2faLoginPayload,
} from "@/features/auth/types/auth.types";

// GH-295: bước 2 của 2FA login — verify TOTP/backup code → cấp token (giống login Case A)
export const useVerify2faLogin = () => {
  return useMutation({
    mutationFn: (payload: Verify2faLoginPayload) =>
      authService.verify2faLogin(payload),
    onSuccess: (response) => {
      const res = response.data;
      if (!res.isSuccess || !res.data?.tokens) {
        toast.error(res.message ?? "Xác thực 2FA thất bại");
        return;
      }
      const { accessToken, refreshToken } = res.data.tokens;
      saveTokens(accessToken, refreshToken);
      const user = decodeToken(accessToken);

      if (user.role === UserRole.CUSTOMER) {
        // CUSTOMER không dùng web — không giữ session, điều hướng sang trang hướng dẫn dùng App
        clearTokens();
        sessionStorage.removeItem(CHALLENGE_TOKEN_KEY);
        window.location.href = "/use-mobile-app";
        return;
      }

      sessionStorage.removeItem(CHALLENGE_TOKEN_KEY);
      window.location.href = redirectByRole(user.role);
    },
  });
};
