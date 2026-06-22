import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type { MyPermissionsDto } from "@/features/auth/types/permission.types";

export const permissionService = {
  // GH-106 — permission của role hiện tại, server resolve qua DB (snapshot mới nhất)
  getMyPermissions: () =>
    axiosInstance.get<CommonResponse<MyPermissionsDto>>(
      ENDPOINTS.AUTH.ME_PERMISSIONS,
    ),
};
