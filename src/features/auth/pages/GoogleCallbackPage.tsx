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
  // Google's authorization code can only be used once. StrictMode (dev) runs the effect twice
  // → the 2nd run reuses the already-consumed code → BE returns an error → falls into catch →
  // wrongly navigates to /login, overwriting the correct result from the 1st run. The ref guard
  // ensures run() executes exactly once.
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    // GH-295: Google redirects here with ?code&state. FE calls GET /api/auth/google/callback
    // via axios → BE returns JSON LoginResultDto (data.tokens.*). Google login bypasses 2FA.
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
          // CUSTOMER doesn't use the web app — don't keep the session, navigate to the app-usage guide page
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
