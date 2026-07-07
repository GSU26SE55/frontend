import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllRead,
} from "@/shared/hooks/useNotifications";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { UserRole } from "@/shared/types/session.types";
import { NotificationStatusEnum } from "@/shared/enums/notification.enum";
import type { NotificationDto } from "@/shared/types/notification.types";
import { cn } from "@/lib/utils";

const ROLE_PREFIX: Record<UserRole, string> = {
  [UserRole.ADMIN]: "admin",
  [UserRole.MANAGER]: "manager",
  [UserRole.STAFF]: "staff",
  [UserRole.CUSTOMER]: "customer",
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useSessionStore();

  const { data: unreadCount = 0 } = useUnreadCount();
  const { data, isLoading } = useNotifications({ pageSize: 10 }, open);
  const items = data?.items ?? [];

  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllRead();

  const badge = unreadCount > 99 ? "99+" : String(unreadCount);

  // Đóng dropdown bằng Esc (a11y).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const handleItemClick = (n: NotificationDto) => {
    if (n.status !== NotificationStatusEnum.Read) markRead.mutate(n.id);
    setOpen(false);
    if (n.entityType === "Ticket" && n.entityId) {
      const prefix = user ? ROLE_PREFIX[user.role] : "";
      if (prefix) navigate(`/${prefix}/tickets/${n.entityId}`);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={
          unreadCount > 0 ? `Thông báo — ${unreadCount} chưa đọc` : "Thông báo"
        }
        className="relative p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="Thông báo"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-3.75 h-3.75 px-1 flex items-center justify-center rounded-full text-white text-[9px] font-bold leading-none"
            style={{ backgroundColor: "var(--p1)" }}
          >
            {badge}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            role="menu"
            aria-label="Danh sách thông báo"
            className="fade-up absolute right-0 top-full mt-1.5 w-80 bg-card border border-border rounded-xl z-50 shadow-md overflow-hidden"
          >
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border">
              <span className="text-[13px] font-semibold">Thông báo</span>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  className="flex items-center gap-1 text-[11px] text-primary hover:underline disabled:opacity-50"
                >
                  <CheckCheck size={12} />
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>

            <div className="max-h-90 overflow-y-auto">
              {isLoading ? (
                <div
                  role="status"
                  className="px-3.5 py-6 text-center text-xs text-muted-foreground"
                >
                  Đang tải…
                </div>
              ) : items.length === 0 ? (
                <div className="px-3.5 py-6 text-center text-xs text-muted-foreground">
                  Không có thông báo
                </div>
              ) : (
                items.map((n) => {
                  const unread = n.status !== NotificationStatusEnum.Read;
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleItemClick(n)}
                      className={cn(
                        "w-full text-left px-3.5 py-2.5 border-b border-border last:border-b-0 hover:bg-muted transition-colors",
                        unread && "bg-primary/5",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {unread && (
                          <span
                            className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: "var(--p1)" }}
                          />
                        )}
                        <div
                          className={cn("flex-1 min-w-0", !unread && "pl-3.5")}
                        >
                          <div className="text-[12.5px] font-medium text-foreground truncate">
                            {n.title}
                          </div>
                          <div className="text-[11.5px] text-muted-foreground line-clamp-2">
                            {n.body}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {formatDistanceToNow(new Date(n.createdAt), {
                              addSuffix: true,
                              locale: vi,
                            })}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
