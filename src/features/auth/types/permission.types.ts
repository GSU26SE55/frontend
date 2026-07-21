// GH-106 — shape của GET /api/auth/me/permissions (CommonResponse<MyPermissionsDto>).
// PermissionDto dùng chung — nguồn thật ở shared.
import type { PermissionDto } from "@/shared/types/account/permission.types";
export type { PermissionDto } from "@/shared/types/account/permission.types";

export interface MyPermissionsDto {
  roleId: string;
  roleName: string;
  permissions: PermissionDto[];
}
