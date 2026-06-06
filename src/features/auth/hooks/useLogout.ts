import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axiosInstance, { clearTokens } from "@/shared/lib/axios";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import { QUERY_KEY } from "@/shared/utils/queryKeys";

export const useLogout = () => {
  const navigate = useNavigate();
  const { clearSession } = useSessionStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      const refreshToken = Cookies.get("refreshToken") ?? "";
      return axiosInstance.post(ENDPOINTS.AUTH.LOGOUT, { refreshToken });
    },
    onSettled: () => {
      clearTokens();
      clearSession();
      queryClient.removeQueries({ queryKey: QUERY_KEY.currentUser.session() });
      navigate("/login", { replace: true });
    },
  });
};
