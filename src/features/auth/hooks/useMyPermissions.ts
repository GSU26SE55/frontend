import { useQuery } from "@tanstack/react-query";
import { permissionService } from "@/features/auth/services/permission.service";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { QUERY_KEY } from "@/shared/utils/queryKeys";

// GH-106 — lấy permission server-resolved của role hiện tại. Gate theo isAuthenticated
// để chỉ chạy sau khi session đã set (login/invite/google/hydration). Trả về list code.
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
