import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type {
  MyPermissionsDto,
  PermissionDto,
} from "@/features/auth/types/permission.types";

export const permissionService = {
  // GH-106 — permissions of the current role, resolved by the server from the DB (latest snapshot)
  getMyPermissions: () =>
    axiosInstance.get<CommonResponse<MyPermissionsDto>>(
      ENDPOINTS.AUTH.ME_PERMISSIONS,
    ),
  // GH-133 C1 — full catalog of every permission (any role, Admin not required). Optional filter by module.
  getCatalog: (module?: string) =>
    axiosInstance.get<CommonResponse<PermissionDto[]>>(
      ENDPOINTS.AUTH.PERMISSIONS_CATALOG,
      { params: module ? { module } : undefined },
    ),
};
