import { createContext, use, useEffect } from "react";
import type { ReactNode } from "react";
import { useHydrateSession } from "@/features/auth/hooks/useHydrateSession";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { clearTokens } from "@/shared/lib/axios";

interface AuthContextValue {
  isHydrating: boolean;
}

const AuthContext = createContext<AuthContextValue>({ isHydrating: true });

// eslint-disable-next-line react-refresh/only-export-components
export const useAuthContext = () => use(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { setSession, clearSession, isAuthenticated } = useSessionStore();
  const { data: session, status } = useHydrateSession();

  useEffect(() => {
    if (status === "pending") return;

    if (status === "success" && session) {
      setSession(session);
    } else {
      clearTokens();
      clearSession();
    }
  }, [clearSession, session, setSession, status]);

  // isHydrating = true while query is still running OR
  // query finished with a session but store hasn't been updated yet
  const isHydrating =
    status === "pending" ||
    (status === "success" && !!session && !isAuthenticated);

  return (
    <AuthContext.Provider value={{ isHydrating }}>
      {children}
    </AuthContext.Provider>
  );
};
