import { useQuery } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { authService } from "@/features/auth/services/auth.service";
import { isTokenExpired, saveTokens } from "@/shared/lib/axios";
import { decodeToken } from "@/shared/types/session.types";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import type { SessionUser } from "@/shared/types/session.types";

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
        const tokens = response.data.data;

        if (!tokens) return null;

        saveTokens(tokens.accessToken, tokens.refreshToken);
        return decodeToken(tokens.accessToken);
      } catch {
        return null;
      }
    },
    gcTime: Infinity,
    retry: false,
    staleTime: Infinity,
  });
};
