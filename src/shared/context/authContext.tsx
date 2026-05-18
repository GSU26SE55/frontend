import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Cookies from 'js-cookie';
import { decodeToken } from '@/shared/types/session.types';
import { useSessionStore } from '@/shared/stores/sessionStore';
import { saveTokens, clearTokens, isTokenExpired } from '@/shared/lib/axios';
import { ENDPOINTS } from '@/shared/utils/endpoints';
import { env } from '@/config/env';
import axios from 'axios';

interface AuthContextValue {
  isHydrating: boolean;
}

const AuthContext = createContext<AuthContextValue>({ isHydrating: true });

// eslint-disable-next-line react-refresh/only-export-components
export const useAuthContext = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isHydrating, setIsHydrating] = useState(true);
  const { setSession, clearSession } = useSessionStore();

  useEffect(() => {
    const hydrate = async () => {
      const accessToken = Cookies.get('accessToken');
      const refreshToken = Cookies.get('refreshToken');

      // Case 2: no refreshToken at all
      if (!refreshToken) {
        clearTokens();
        clearSession();
        setIsHydrating(false);
        return;
      }

      // Case 1: both tokens present, access still valid
      if (accessToken && !isTokenExpired(accessToken)) {
        setSession(decodeToken(accessToken));
        setIsHydrating(false);
        return;
      }

      // Case 3: have refreshToken but no accessToken or access expired
      try {
        const res = await axios.post(
          `${env.VITE_API_BASE_URL}${ENDPOINTS.AUTH.REFRESH_TOKEN}`,
          { refreshToken },
          { timeout: 10_000 }
        );
        const { accessToken: newAccess, refreshToken: newRefresh } = res.data.data;
        saveTokens(newAccess, newRefresh);
        setSession(decodeToken(newAccess));
      } catch {
        clearTokens();
        clearSession();
      } finally {
        setIsHydrating(false);
      }
    };

    hydrate();
  }, [setSession, clearSession]);

  return <AuthContext.Provider value={{ isHydrating }}>{children}</AuthContext.Provider>;
};
