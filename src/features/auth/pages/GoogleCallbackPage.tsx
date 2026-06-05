import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { saveTokens, clearTokens } from "@/shared/lib/axios";
import {
  UserRole,
  decodeToken,
  redirectByRole,
} from "@/shared/types/session.types";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { QUERY_KEY } from "@/shared/utils/queryKeys";

const GoogleCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setSession = useSessionStore((s) => s.setSession);
  const queryClient = useQueryClient();

  useEffect(() => {
    try {
      const accessToken = searchParams.get("accessToken");
      const refreshToken = searchParams.get("refreshToken");

      // Remove tokens from URL immediately to prevent token leakage
      window.history.replaceState({}, "", "/auth/google/callback");

      if (!accessToken || !refreshToken) {
        throw new Error("Missing tokens in callback");
      }

      saveTokens(accessToken, refreshToken);
      const user = decodeToken(accessToken);

      if (user.role === UserRole.CUSTOMER) {
        clearTokens();
        toast.error("Vui lòng sử dụng Mobile App để đăng nhập.");
        navigate("/login", { replace: true });
        return;
      }

      setSession(user);
      queryClient.setQueryData(QUERY_KEY.currentUser.session(), user);
      navigate(redirectByRole(user.role), { replace: true });
    } catch (err) {
      console.error("[GoogleCallback]", err);
      toast.error("Đăng nhập Google thất bại");
      navigate("/login", { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-b-2 border-primary" />
    </div>
  );
};

export default GoogleCallbackPage;
