import type { ReactNode } from "react";
import { usePermission } from "@/shared/hooks/usePermission";
import type { PermissionType } from "@/shared/lib/authz";
import type { UserRole } from "@/shared/types/account/session.types";

interface CanProps {
  /** Requires ALL of these permissions. */
  permission?: PermissionType | PermissionType[];
  /** Passes if the user has ANY of these permissions (overrides `permission`'s all-match rule when both given). */
  anyPermission?: PermissionType[];
  /** Requires the user's role to be one of these. */
  role?: UserRole | UserRole[];
  children: ReactNode;
  /** Rendered when the check fails. Defaults to nothing. */
  fallback?: ReactNode;
}

/**
 * Section-level RBAC gate — hides children when the current user lacks the
 * required permission(s)/role(s). Does NOT replace BE authorization; only UX.
 */
export const Can = ({
  permission,
  anyPermission,
  role,
  children,
  fallback = null,
}: CanProps) => {
  const { hasPermission, hasRole } = usePermission();

  if (permission) {
    const required = Array.isArray(permission) ? permission : [permission];
    if (!required.every(hasPermission)) return <>{fallback}</>;
  }

  if (anyPermission && !anyPermission.some(hasPermission)) {
    return <>{fallback}</>;
  }

  if (role) {
    const required = Array.isArray(role) ? role : [role];
    if (!hasRole(...required)) return <>{fallback}</>;
  }

  return <>{children}</>;
};
