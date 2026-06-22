// GH-106 — shape của GET /api/auth/me/permissions (CommonResponse<MyPermissionsDto>).
// PermissionDto cùng shape với GET /api/admin/permissions (docs/api-auth.md Nhóm 3).

export interface PermissionDto {
  id: string;
  code: string;
  module: string;
  description: string | null;
  isSystemPermission: boolean;
  createdAt: string;
}

export interface MyPermissionsDto {
  roleId: string;
  roleName: string;
  permissions: PermissionDto[];
}
