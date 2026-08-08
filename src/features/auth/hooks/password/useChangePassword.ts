import { useMutation } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { accountService } from "@/features/auth/services/account.service";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { handleErrorApi } from "@/shared/lib/errors";
import type { ChangePasswordPayload } from "@/features/auth/types/account.types";

export const useChangePassword = () => {
  const navigate = useNavigate();
  const clearSession = useSessionStore((s) => s.clearSession);

  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) =>
      accountService.changePassword(payload),
    onSuccess: (response) => {
      const res = response.data;
      if (!res.isSuccess) {
        toast.error(res.message ?? "Couldn't change the password");
        return;
      }
      Cookies.remove("accessToken");
      Cookies.remove("refreshToken");
      clearSession();
      navigate("/login");
    },
    onError: (error) => handleErrorApi({ error }),
  });
};
