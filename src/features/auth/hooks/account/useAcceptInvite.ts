import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authService } from "@/features/auth/services/auth.service";
import { saveTokens, clearTokens } from "@/shared/lib/axios";
import {
  decodeToken,
  redirectByRole,
  UserRole,
} from "@/shared/types/account/session.types";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import type { AcceptInvitePayload } from "@/features/auth/types/auth.types";

export const useAcceptInvite = () => {
  const navigate = useNavigate();
  const { setSession } = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AcceptInvitePayload) =>
      authService.acceptInvite(payload),
    onSuccess: (response) => {
      const res = response.data;
      // GH-295: accept-invite returns LoginResultDto, bypasses 2FA → tokens are always set
      if (!res.isSuccess || !res.data?.tokens) {
        toast.error(res.message ?? "Couldn't activate the account");
        return;
      }
      const { accessToken, refreshToken } = res.data.tokens;
      saveTokens(accessToken, refreshToken);
      const user = decodeToken(accessToken);

      if (user.role === UserRole.CUSTOMER) {
        // CUSTOMER doesn't use the web app — drop the session and redirect to the mobile app guide
        clearTokens();
        navigate("/use-mobile-app", { replace: true });
        return;
      }

      setSession(user);
      queryClient.setQueryData(QUERY_KEY.currentUser.session(), user);
      navigate(redirectByRole(user.role), { replace: true });
    },
  });
};
