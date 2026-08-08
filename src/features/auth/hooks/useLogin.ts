import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authService } from "@/features/auth/services/auth.service";
import { saveTokens, clearTokens } from "@/shared/lib/axios";
import {
  decodeToken,
  redirectByRole,
} from "@/shared/types/account/session.types";
import { UserRole } from "@/shared/types/account/session.types";
import {
  CHALLENGE_TOKEN_KEY,
  type LoginPayload,
} from "@/features/auth/types/auth.types";
import { AUTH_MESSAGES } from "@/features/auth/constants/messages";

export const useLogin = () => {
  return useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: (response) => {
      const res = response.data;
      if (!res.isSuccess || !res.data) {
        toast.error(res.message ?? "Sign-in failed");
        return;
      }
      // GH-295: discriminated union. 2FA on → challenge set, tokens null.
      if (res.data.requiresTwoFactor && res.data.challenge) {
        // challengeToken is held temporarily in sessionStorage (NOT an auth token,
        // 5-minute TTL server-side) for the /login/2fa screen to use in the verify step.
        sessionStorage.setItem(
          CHALLENGE_TOKEN_KEY,
          res.data.challenge.challengeToken,
        );
        window.location.href = "/login/2fa";
        return;
      }

      if (!res.data.tokens) {
        toast.error(AUTH_MESSAGES.login.failed);
        return;
      }

      const { accessToken, refreshToken } = res.data.tokens;
      saveTokens(accessToken, refreshToken);
      const user = decodeToken(accessToken);

      if (user.role === UserRole.CUSTOMER) {
        // CUSTOMER doesn't use the web app — drop the session and redirect to the mobile app guide
        clearTokens();
        window.location.href = "/use-mobile-app";
        return;
      }

      window.location.href = redirectByRole(user.role);
    },
  });
};
