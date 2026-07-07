import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { permissionService } from "@/features/auth/services/permission.service";

// GH-133 C1 — catalog full permission (mọi role). Ít thay đổi → staleTime 5 phút.
export function usePermissionsCatalog(module?: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEY.permissionsCatalog.list(module),
    queryFn: () =>
      permissionService.getCatalog(module).then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}
