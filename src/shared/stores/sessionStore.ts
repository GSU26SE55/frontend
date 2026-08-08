import { create } from "zustand";
import type { SessionUser } from "@/shared/types/account/session.types";

interface SessionState {
  user: SessionUser | null;
  isAuthenticated: boolean;
  setSession: (user: SessionUser) => void;
  setPermissions: (permissions: string[]) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  isAuthenticated: false,
  setSession: (user) => set({ user, isAuthenticated: true }),
  // GH-106 — override permissions from /me/permissions (server-resolved); no-op if there's no user yet
  setPermissions: (permissions) =>
    set((state) =>
      state.user ? { user: { ...state.user, permissions } } : state,
    ),
  clearSession: () => set({ user: null, isAuthenticated: false }),
}));
