import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Cookies from "js-cookie";
import { authService } from "@/features/auth/services/auth.service";
import { isTokenExpired, saveTokens } from "@/shared/lib/axios";
import { decodeToken } from "@/shared/types/account/session.types";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import type { SessionUser } from "@/shared/types/account/session.types";

export const useHydrateSession = () => {
  return useQuery({
    queryKey: QUERY_KEY.currentUser.session(),
    queryFn: async (): Promise<SessionUser | null> => {
      const accessToken = Cookies.get("accessToken");
      const refreshToken = Cookies.get("refreshToken");

      if (!refreshToken) return null;

      if (accessToken && !isTokenExpired(accessToken)) {
        return decodeToken(accessToken);
      }

      try {
        const response = await authService.refreshToken(refreshToken);
        // GH-295: refresh returns LoginResultDto — the tokens live in data.tokens
        const tokens = response.data.data?.tokens;

        if (!tokens) return null;

        saveTokens(tokens.accessToken, tokens.refreshToken);
        return decodeToken(tokens.accessToken);
      } catch (error) {
        // No response from the server (network drop, timeout, ngrok hiccup) means we
        // never actually learned whether the refresh token is valid — surface this as a
        // query error (after retrying) rather than treating it as "logged out", so
        // AuthProvider keeps whatever session state it already had instead of wiping it
        // on a blip. A real rejection (BE responded, e.g. 401 invalid/revoked token)
        // does mean logged out.
        if (axios.isAxiosError(error) && !error.response) {
          throw error;
        }
        return null;
      }
    },
    gcTime: Infinity,
    retry: (failureCount, error) =>
      axios.isAxiosError(error) && !error.response && failureCount < 2,
    staleTime: Infinity,
  });
};
