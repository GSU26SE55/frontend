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
      if (!res.isSuccess || !res.data) {
        toast.error(res.message ?? "Không thể kích hoạt tài khoản");
        return;
      }
      const { accessToken, refreshToken } = res.data;
      saveTokens(accessToken, refreshToken);
      const user = decodeToken(accessToken);

      if (user.role === UserRole.CUSTOMER) {
        clearTokens();
        toast.error("Vui lòng sử dụng Mobile App để đăng nhập.");
        return;
      }

      setSession(user);
      queryClient.setQueryData(QUERY_KEY.currentUser.session(), user);
      navigate(redirectByRole(user.role), { replace: true });
    },
  });
};
