// Permission — dùng chung admin + auth (GET /api/admin/permissions,
// GET /api/auth/me/permissions). Trùng shape ở 2 feature trước đây.
// description: chấp nhận cả null (BE) lẫn undefined (optional) — superset an toàn.
export interface PermissionDto {
  id: string;
  code: string;
  module: string;
  description?: string | null;
  isSystemPermission: boolean;
  createdAt: string;
}
