import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authService } from "@/features/auth/services/auth.service";
import { clearTokens } from "@/shared/lib/axios";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { QUERY_KEY } from "@/shared/utils/queryKeys";

export const useLogout = () => {
  const navigate = useNavigate();
  const { clearSession } = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      clearTokens();
      clearSession();
      queryClient.removeQueries({ queryKey: QUERY_KEY.currentUser.session() });
      navigate("/login", { replace: true });
    },
  });
};
