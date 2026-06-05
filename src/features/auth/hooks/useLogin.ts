import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authService } from "@/features/auth/services/auth.service";
import { saveTokens, clearTokens } from "@/shared/lib/axios";
import { decodeToken, redirectByRole } from "@/shared/types/session.types";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { handleErrorApi } from "@/shared/lib/errors";
import { UserRole } from "@/shared/types/session.types";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import type { LoginPayload } from "@/features/auth/types/auth.types";
import type { UseFormSetError } from "react-hook-form";

export const useLogin = (setError?: UseFormSetError<LoginPayload>) => {
  const navigate = useNavigate();
  const { setSession } = useSessionStore();
  const queryClient = useQueryClient();

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

      setSession(user);
      queryClient.setQueryData(QUERY_KEY.currentUser.session(), user);
      navigate(redirectByRole(user.role), { replace: true });
    },
    onError: (error) => handleErrorApi({ error, setError }),
  });
};
