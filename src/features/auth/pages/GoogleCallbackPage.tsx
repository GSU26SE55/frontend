import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { saveTokens, clearTokens } from "@/shared/lib/axios";
import {
  UserRole,
  decodeToken,
  redirectByRole,
} from "@/shared/types/account/session.types";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { authService } from "@/features/auth/services/auth.service";
import { AUTH_MESSAGES } from "@/features/auth/constants/messages";

const GoogleCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setSession = useSessionStore((s) => s.setSession);
  const queryClient = useQueryClient();
  // Authorization code của Google chỉ dùng được 1 lần. StrictMode (dev) chạy effect 2 lần
  // → lần 2 gọi lại code đã tiêu thụ → BE trả lỗi → rơi vào catch → điều hướng nhầm /login,
  // ghi đè kết quả đúng của lần 1. Ref guard đảm bảo run() chỉ chạy đúng 1 lần.
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    // GH-295: Google redirect về đây với ?code&state. FE gọi GET /api/auth/google/callback
    // qua axios → BE trả JSON LoginResultDto (data.tokens.*). Google login bypass 2FA.
    const run = async () => {
      try {
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        if (!code || !state) throw new Error("Missing code/state in callback");

        const res = await authService.googleCallback(code, state);
        const tokens = res.data.data?.tokens;
        if (!res.data.isSuccess || !tokens) {
          throw new Error(res.data.message ?? "Google login failed");
        }

        saveTokens(tokens.accessToken, tokens.refreshToken);
        const user = decodeToken(tokens.accessToken);

        if (user.role === UserRole.CUSTOMER) {
          // CUSTOMER không dùng web — không giữ session, điều hướng sang trang hướng dẫn dùng App
          clearTokens();
          navigate("/use-mobile-app", { replace: true });
          return;
        }

        setSession(user);
        queryClient.setQueryData(QUERY_KEY.currentUser.session(), user);
        navigate(redirectByRole(user.role), { replace: true });
      } catch (err) {
        console.error("[GoogleCallback]", err);
        toast.error(AUTH_MESSAGES.google.loginFailed);
        navigate("/login", { replace: true });
      }
    };
    void run();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-b-2 border-primary" />
    </div>
  );
};

export default GoogleCallbackPage;
