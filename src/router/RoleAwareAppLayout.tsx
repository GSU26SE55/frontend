// Wrapper that picks the nav config by role at runtime — used for routes that are NOT
// tied to one specific role at config-time (e.g. /settings, reachable by every role).
//
// Placed in router/ (outside shared) so it's allowed to import all 3 features — this keeps
// AppLayout in the shared layer as a pure component, without breaking the "shared doesn't
// import features" rule.

import AppLayout from "@/shared/components/layout/AppLayout";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { UserRole } from "@/shared/types/account/session.types";
import { ADMIN_NAV } from "@/features/admin/config/adminNav";
import { MANAGER_NAV } from "@/features/manager/config/managerNav";
import { STAFF_NAV } from "@/features/staff/config/staffNav";

export default function RoleAwareAppLayout() {
  const role = useSessionStore((s) => s.user?.role);

  const sections =
    role === UserRole.ADMIN
      ? ADMIN_NAV
      : role === UserRole.MANAGER
        ? MANAGER_NAV
        : role === UserRole.STAFF
          ? STAFF_NAV
          : [];

  return <AppLayout sections={sections} />;
}
