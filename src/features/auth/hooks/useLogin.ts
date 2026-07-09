import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authService } from "@/features/auth/services/auth.service";
import { saveTokens, clearTokens } from "@/shared/lib/axios";
import { decodeToken, redirectByRole } from "@/shared/types/session.types";
import { UserRole } from "@/shared/types/session.types";
import {
  CHALLENGE_TOKEN_KEY,
  type LoginPayload,
} from "@/features/auth/types/auth.types";

export const useLogin = () => {
  return useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: (response) => {
      const res = response.data;
      if (!res.isSuccess || !res.data) {
        toast.error(res.message ?? "Đăng nhập thất bại");
        return;
      }
      // GH-295: discriminated union. 2FA on → challenge set, tokens null.
      if (res.data.requiresTwoFactor && res.data.challenge) {
        // challengeToken giữ tạm trong sessionStorage (KHÔNG phải auth token,
        // TTL 5 phút phía server) để màn hình /login/2fa dùng ở bước verify.
        sessionStorage.setItem(
          CHALLENGE_TOKEN_KEY,
          res.data.challenge.challengeToken,
        );
        window.location.href = "/login/2fa";
        return;
      }

      if (!res.data.tokens) {
        toast.error("Đăng nhập thất bại");
        return;
      }

      const { accessToken, refreshToken } = res.data.tokens;
      saveTokens(accessToken, refreshToken);
      const user = decodeToken(accessToken);

      if (user.role === UserRole.CUSTOMER) {
        // CUSTOMER không dùng web — không giữ session, điều hướng sang trang hướng dẫn dùng App
        clearTokens();
        window.location.href = "/use-mobile-app";
        return;
      }

      window.location.href = redirectByRole(user.role);
    },
  });
};
