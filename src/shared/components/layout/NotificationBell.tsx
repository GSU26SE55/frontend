import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkNotificationOpened,
  useMarkAllRead,
} from "@/shared/hooks/notifications/useNotifications";
import { useNotificationsRealtime } from "@/shared/hooks/notifications/useNotificationsRealtime";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { isUnreadStatus } from "@/shared/enums/notification/notification.enum";
import { notificationDeepLink } from "@/shared/utils/notificationDeepLink";
import type { NotificationDto } from "@/shared/types/notification/notification.types";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useSessionStore();

  // Connects to the notification hub. The bell mounts once in the layout ⇒ exactly
  // one WebSocket for the whole app. Gated by user: without login there's no token,
  // so the [Authorize] hub will reject it.
  useNotificationsRealtime(!!user);

  const { data: unreadCount = 0 } = useUnreadCount();
  const { data, isLoading } = useNotifications({ pageSize: 10 }, open);
  const items = data?.items ?? [];

  const markRead = useMarkNotificationRead();
  const markOpened = useMarkNotificationOpened();
  const markAllRead = useMarkAllRead();

  const badge = unreadCount > 99 ? "99+" : String(unreadCount);

  const handleItemClick = (n: NotificationDto) => {
    // Deep-link = the real content can be opened. Only then is it "Opened" (proof
    // the user actively opened it); a plain click is only "Read". Splitting the two
    // branches keeps the open-rate from getting diluted — the reason the BE splits
    // /opened from /read.
    const deepLink = notificationDeepLink(n, user?.role);

    if (isUnreadStatus(n.status)) {
      // The BE sets ReadAt automatically on Opened → no need to also call markRead.
      if (deepLink) markOpened.mutate(n.id);
      else markRead.mutate(n.id);
    }

    setOpen(false);
    // No deep link (system notification, battery alert...) → open in the inbox — it
    // used to just mark as read with nowhere to go, which looked like a broken button.
    navigate(deepLink ?? `/notifications?id=${n.id}`);
  };

  return (
    <div className="relative">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          aria-label={
            unreadCount > 0
              ? `Notifications — ${unreadCount} unread`
              : "Notifications"
          }
          className="relative p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer outline-none"
          title="Notifications"
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
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border">
            <span className="text-[13px] font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  markAllRead.mutate();
                }}
                disabled={markAllRead.isPending}
                className="flex items-center gap-1 text-[11px] text-primary hover:underline disabled:opacity-50 cursor-pointer"
              >
                <CheckCheck size={12} />
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-90 overflow-y-auto">
            {isLoading ? (
              <div
                role="status"
                className="px-3.5 py-6 text-center text-xs text-muted-foreground"
              >
                Loading…
              </div>
            ) : items.length === 0 ? (
              <div className="px-3.5 py-6 text-center text-xs text-muted-foreground">
                No notifications
              </div>
            ) : (
              items.map((n) => {
                // Matches the BE's definition: excludes both Read and Opened — comparing
                // only against Read would leave opened notifications still shown as bold
                // while the badge had already decremented.
                const unread = isUnreadStatus(n.status);
                return (
                  <DropdownMenuItem
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={cn(
                      "w-full text-left px-3.5 py-2.5 border-b border-border last:border-b-0 cursor-pointer flex flex-col items-start gap-1 rounded-none focus:bg-muted",
                      unread && "bg-primary/5",
                    )}
                  >
                    <div className="flex items-start gap-2 w-full">
                      {unread && (
                        <span
                          className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: "var(--p1)" }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] font-medium text-foreground truncate">
                          {n.title}
                        </div>
                        <div className="text-[11.5px] text-muted-foreground line-clamp-2 whitespace-normal">
                          {n.body}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(n.createdAt), {
                            addSuffix: true,
                            locale: enUS,
                          })}
                        </div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                );
              })
            )}
          </div>

          <DropdownMenuItem
            onClick={() => {
              setOpen(false);
              navigate("/notifications");
            }}
            className="w-full justify-center px-3.5 py-2.5 border-t border-border text-[12px] text-primary rounded-none hover:bg-muted focus:bg-muted cursor-pointer"
          >
            View all in inbox
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
