import { useMemo } from "react";
import AppLayout from "@/shared/components/layout/AppLayout";
import { MANAGER_NAV, MANAGER_QUEUE_PATH } from "@/features/manager/config/managerNav";
import { useAdminTicketQueueCount } from "@/features/manager/hooks/ticket/useManagerTickets";

/**
 * #697 — AppLayout của Manager kèm badge số ticket chờ duyệt trên mục "Hàng chờ".
 * Nav config vẫn tĩnh (MANAGER_NAV); chỉ badge được bơm vào runtime từ
 * GET /api/admin/tickets/queue/count.
 */
export default function ManagerAppLayout() {
  const { data: queueCount } = useAdminTicketQueueCount();

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
