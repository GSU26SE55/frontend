import { useQuery } from "@tanstack/react-query";
import { permissionService } from "@/features/auth/services/permission.service";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { QUERY_KEY } from "@/shared/utils/queryKeys";

// GH-106 — fetch the server-resolved permissions for the current role. Gated on isAuthenticated
// so it only runs after the session is set (login/invite/google/hydration). Returns a list of codes.
export const useMyPermissions = () => {
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: QUERY_KEY.currentUser.permissions(),
    queryFn: async (): Promise<string[]> => {
      const response = await permissionService.getMyPermissions();
      return response.data.data?.permissions.map((p) => p.code) ?? [];
    },
    enabled: isAuthenticated,
  });
};
