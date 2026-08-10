import AppLayout from "@/shared/components/layout/AppLayout";
import { STAFF_NAV } from "@/features/staff/config/staffNav";

/**
 * Thin wrapper so the router can lazy-load AppLayout together with the staff nav config.
 * See AdminAppLayout for why the route table must not build this element inline.
 */
export default function StaffAppLayout() {
  return <AppLayout sections={STAFF_NAV} />;
}
