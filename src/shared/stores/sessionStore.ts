import { create } from "zustand";
import type { SessionUser } from "@/shared/types/session.types";

interface SessionState {
  user: SessionUser | null;
  isAuthenticated: boolean;
  setSession: (user: SessionUser) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  isAuthenticated: false,
  setSession: (user) => set({ user, isAuthenticated: true }),
  clearSession: () => set({ user: null, isAuthenticated: false }),
}));
