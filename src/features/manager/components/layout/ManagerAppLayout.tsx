import { useMemo } from "react";
import AppLayout from "@/shared/components/layout/AppLayout";
import {
  MANAGER_NAV,
  MANAGER_QUEUE_PATH,
} from "@/features/manager/config/managerNav";
import { useAdminTicketQueue } from "@/features/manager/hooks/ticket/useManagerTickets";

/**
 * #697 — AppLayout của Manager kèm badge số ticket chờ duyệt trên mục "Hàng chờ".
 * Nav config vẫn tĩnh (MANAGER_NAV); badge được bơm vào runtime từ `totalItems`
 * của GET /api/admin/tickets/queue (pageSize=1 — chỉ cần số tổng, không tải list).
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
