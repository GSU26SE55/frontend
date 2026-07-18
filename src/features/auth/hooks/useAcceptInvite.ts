import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authService } from "@/features/auth/services/auth.service";
import { saveTokens, clearTokens } from "@/shared/lib/axios";
import {
  decodeToken,
  redirectByRole,
  UserRole,
} from "@/shared/types/session.types";
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
      // GH-295: accept-invite trả LoginResultDto, bypass 2FA → tokens luôn set
      if (!res.isSuccess || !res.data?.tokens) {
        toast.error(res.message ?? "Không thể kích hoạt tài khoản");
        return;
      }
      const { accessToken, refreshToken } = res.data.tokens;
      saveTokens(accessToken, refreshToken);
      const user = decodeToken(accessToken);

      if (user.role === UserRole.CUSTOMER) {
        // CUSTOMER không dùng web — không giữ session, điều hướng sang trang hướng dẫn dùng App
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
