import { useSessionStore } from "@/shared/stores/sessionStore";
import {
  checkPermission,
  checkRole,
  type PermissionType,
} from "@/shared/lib/authz";
import type { UserRole } from "@/shared/types/account/session.types";

export const usePermission = () => {
  const user = useSessionStore((st) => st.user);

  return {
    hasPermission: (permission: PermissionType) =>
      checkPermission(user, permission),
    hasRole: (...roles: UserRole[]) => checkRole(user, ...roles),
  };
};
