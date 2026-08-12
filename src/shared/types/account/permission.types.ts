// Permission — shared by admin + auth (GET /api/admin/permissions,
// GET /api/auth/me/permissions). This shape used to be duplicated in both features.
// description: accepts both null (from the BE) and undefined (optional) — a safe superset.
export interface PermissionDto {
  id: string;
  code: string;
  module: string;
  description?: string | null;
  isSystemPermission: boolean;
  createdAt: string;
}
