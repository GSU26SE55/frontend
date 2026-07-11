// Wrapper chọn nav config theo role runtime — dùng cho route KHÔNG gắn 1 role cụ thể
// tại config-time (vd /settings, mọi role vào được).
//
// Đặt ở router/ (ngoài shared) nên được phép import cả 3 feature — giữ AppLayout ở tầng
// shared thành pure component, không phá rule "shared không import features".

import AppLayout from "@/shared/components/layout/AppLayout";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { UserRole } from "@/shared/types/session.types";
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
