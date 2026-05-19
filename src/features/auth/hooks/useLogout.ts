import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authService } from "@/features/auth/services/auth.service";
import { clearTokens } from "@/shared/lib/axios";
import { useSessionStore } from "@/shared/stores/sessionStore";

export const useLogout = () => {
  const navigate = useNavigate();
  const { clearSession } = useSessionStore();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      clearTokens();
      clearSession();
      navigate("/login", { replace: true });
    },
  });
};
