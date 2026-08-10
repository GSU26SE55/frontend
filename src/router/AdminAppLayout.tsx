import AppLayout from "@/shared/components/layout/AppLayout";
import { ADMIN_NAV } from "@/features/admin/config/adminNav";

/**
 * Thin wrapper so the router can lazy-load AppLayout together with the admin nav config.
 *
 * Writing `element: <AppLayout sections={ADMIN_NAV} />` directly in the route table evaluates
 * both imports when the router module loads, which forces AppLayout — and everything it pulls
 * in, including Sidebar, NotificationBell, date-fns and the SignalR client — into the app-shell
 * chunk. Anonymous visitors on /login would download all of it despite never rendering an app
 * layout at all.
 */
export default function AdminAppLayout() {
  return <AppLayout sections={ADMIN_NAV} />;
}
