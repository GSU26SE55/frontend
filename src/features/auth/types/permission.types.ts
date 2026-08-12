// GH-106 — shape of GET /api/auth/me/permissions (CommonResponse<MyPermissionsDto>).
// PermissionDto is shared — the real source lives in shared.
import type { PermissionDto } from "@/shared/types/account/permission.types";
export type { PermissionDto } from "@/shared/types/account/permission.types";

export interface MyPermissionsDto {
  roleId: string;
  roleName: string;
  permissions: PermissionDto[];
}
