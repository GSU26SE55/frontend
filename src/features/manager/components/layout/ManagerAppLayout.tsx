import { useMemo } from "react";
import AppLayout from "@/shared/components/layout/AppLayout";
import {
  MANAGER_NAV,
  MANAGER_QUEUE_PATH,
} from "@/features/manager/config/managerNav";
import { useAdminTicketQueue } from "@/features/manager/hooks/ticket/useManagerTickets";

/**
 * #697 — Manager's AppLayout with a badge showing the pending ticket count on the "Queue" item.
 * Nav config stays static (MANAGER_NAV); the badge is injected at runtime from `totalItems`
 * returned by GET /api/admin/tickets/queue (pageSize=1 — only the total count is needed, not the list).
 */
export default function ManagerAppLayout() {
  const { data: queuePage } = useAdminTicketQueue({ pageSize: 1 });
  const queueCount = queuePage?.totalItems ?? 0;

  const sections = useMemo(() => {
    if (!queueCount) return MANAGER_NAV;
    return MANAGER_NAV.map((section) => ({
      ...section,
      items: section.items.map((item) =>
        item.path === MANAGER_QUEUE_PATH
          ? { ...item, badge: queueCount > 99 ? "99+" : queueCount }
          : item,
      ),
    }));
  }, [queueCount]);

  return <AppLayout sections={sections} />;
}
