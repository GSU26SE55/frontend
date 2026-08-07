import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ChevronDown, LogOut } from "lucide-react";
import Sidebar, { type NavSection } from "./Sidebar";
import {
  APP_NAME,
  INBOX_PATH,
  SIDEBAR_LABELS,
} from "@/shared/constants/sidebarLabels";
import { useChatUnreadCount } from "@/shared/hooks/ticket/useChatUnreadCount";
import { useUnreadCount } from "@/shared/hooks/notifications/useNotifications";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { UserRole } from "@/shared/types/account/session.types";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/shared/components/ui/ThemeToggle";
import NotificationBell from "./NotificationBell";

// ── Topbar ──────────────────────────────────────────────────────────────────
function Topbar() {
  const { user } = useSessionStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const { mutate: logout } = useLogout();

  // Đóng menu bằng phím Esc (a11y — menu tự chế không có sẵn như primitive).
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const handleLogout = () => logout();

  const initials = (user?.fullName ?? "?")
    .split(" ")
    .slice(-2)
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase();

  const roleLabel =
    user?.role === UserRole.ADMIN
      ? "Admin"
      : user?.role === UserRole.MANAGER
        ? "Manager"
        : user?.role === UserRole.STAFF
          ? "Staff"
          : (user?.role ?? "");

  return (
    <header className="h-14 border-b bg-card flex items-center px-5 gap-3 sticky top-0 z-20 shrink-0">
      <div className="flex-1" />

      {/* System status dot */}
      <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono-num select-none">
        <span
          className="w-1.5 h-1.5 rounded-full pulse-dot shrink-0"
          style={{ backgroundColor: "var(--ok)" }}
        />
        Hệ thống ổn định
      </div>

      <ThemeToggle />

      {/* Notification bell */}
      <NotificationBell />

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Menu tài khoản"
          className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border border-border hover:bg-muted transition-colors"
        >
          <span className="w-6.5 h-6.5 rounded-full flex items-center justify-center text-[10px] font-bold bg-primary/10 text-primary shrink-0">
            {initials}
          </span>
          <div className="text-left leading-tight">
            <div className="text-[12.5px] font-medium text-foreground">
              {user?.fullName ?? "—"}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
              {roleLabel}
            </div>
          </div>
          <ChevronDown size={12} className="text-muted-foreground ml-1" />
        </button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
            />
            <div
              role="menu"
              aria-label="Menu tài khoản"
              className="fade-up absolute right-0 top-full mt-1.5 w-52 bg-card border border-border rounded-xl z-50 p-1.5 shadow-md"
            >
              <div className="px-2.5 py-2 border-b border-border mb-1">
                <div className="text-[13px] font-semibold">
                  {user?.fullName}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {user?.email}
                </div>
              </div>
              <div className="border-t border-border my-1" />
              <DropMenuItem
                icon={<LogOut size={14} />}
                onClick={handleLogout}
                danger
              >
                Đăng xuất
              </DropMenuItem>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

function DropMenuItem({
  children,
  icon,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-[13px] transition-colors",
        danger
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground hover:bg-muted",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

// ── AppLayout ────────────────────────────────────────────────────────────────
// Pure component: nav config được truyền vào từ router (config-down, không import
// features từ tầng shared). `sections` bắt buộc — router chọn NAV theo role.
export default function AppLayout({ sections }: { sections: NavSection[] }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  // Badge số chưa đọc trên mục "Hộp thư". Bơm ở đây (không phải trong từng nav config)
  // vì cả 3 role đều đi qua AppLayout và cùng trỏ về một path — làm ở đây là một chỗ
  // thay vì ba. Không đụng badge sẵn có của mục khác (vd hàng chờ của Manager) vì chỉ
  // map đúng item có path INBOX_PATH.
  const { data: unreadCount = 0 } = useUnreadCount();
  // Tổng chat chưa đọc trên mọi ticket → badge mục "Tickets". Khác hẳn unreadCount ở
  // trên (notification). Khớp theo LABEL chứ không theo path: path ticket có prefix
  // /admin|/manager|/staff nên không có hằng dùng chung như INBOX_PATH.
  const { data: chatUnread = 0 } = useChatUnreadCount();
  const sectionsWithBadge = useMemo(() => {
    if (!unreadCount && !chatUnread) return sections;
    return sections.map((section) => ({
      ...section,
      items: section.items.map((item) => {
        if (unreadCount && item.path === INBOX_PATH)
          return { ...item, badge: unreadCount > 99 ? "99+" : unreadCount };
        // Không ghi đè badge sẵn có của mục khác (vd "Hàng chờ" của Manager).
        if (chatUnread && item.label === SIDEBAR_LABELS.tickets && !item.badge)
          return { ...item, badge: chatUnread > 99 ? "99+" : chatUnread };
        return item;
      }),
    }));
  }, [sections, unreadCount, chatUnread]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        appName={APP_NAME}
        sections={sectionsWithBadge}
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          {/* key theo route → animation vào trang chạy lại mỗi lần điều hướng.
              h-full + min-h-0 giữ nguyên layout flex của các trang full-height. */}
          <div key={location.pathname} className="page-enter h-full min-h-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
