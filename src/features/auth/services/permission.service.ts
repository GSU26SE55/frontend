import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type {
  MyPermissionsDto,
  PermissionDto,
} from "@/features/auth/types/permission.types";

export const permissionService = {
  // GH-106 — permission của role hiện tại, server resolve qua DB (snapshot mới nhất)
  getMyPermissions: () =>
    axiosInstance.get<CommonResponse<MyPermissionsDto>>(
      ENDPOINTS.AUTH.ME_PERMISSIONS,
    ),
  // GH-133 C1 — catalog full mọi permission (mọi role, không cần Admin). Filter optional theo module.
  getCatalog: (module?: string) =>
    axiosInstance.get<CommonResponse<PermissionDto[]>>(
      ENDPOINTS.AUTH.PERMISSIONS_CATALOG,
      { params: module ? { module } : undefined },
    ),
};
