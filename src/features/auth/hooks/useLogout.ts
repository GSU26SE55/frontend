import { useMutation } from "@tanstack/react-query";
import Cookies from "js-cookie";
import axiosInstance, { clearTokens } from "@/shared/lib/axios";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { ENDPOINTS } from "@/shared/utils/endpoints";

export const useLogout = () => {
  const { clearSession } = useSessionStore();

  return useMutation({
    mutationFn: () => {
      const refreshToken = Cookies.get("refreshToken") ?? "";
      return axiosInstance.post(ENDPOINTS.AUTH.LOGOUT, { refreshToken });
    },
    onSettled: () => {
      clearTokens();
      clearSession();
      window.location.href = "/login";
    },
  });
};
