import { Suspense, useMemo, useState } from "react";
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
import ThemeToggle from "@/shared/components/ui/ThemeToggle";
import NotificationBell from "./NotificationBell";
import { PageSkeleton } from "./LayoutSkeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ── Topbar ───────────────────────────────────────────────────────────────────
function Topbar() {
  const { user } = useSessionStore();
  const { mutate: logout } = useLogout();

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
    <header className="h-14 border-b border-border/60 bg-background/85 backdrop-blur-md flex items-center px-5 gap-3 sticky top-0 z-20 shrink-0">
      <div className="flex-1" />

      {/* System status dot inside a polished pill container */}
      <div className="hidden sm:flex items-center gap-1.5 text-[11.5px] font-medium text-muted-foreground bg-muted/40 border border-border/50 rounded-full px-2.5 py-0.75 select-none transition-all">
        <span
          className="w-1.5 h-1.5 rounded-full pulse-dot shrink-0"
          style={{ backgroundColor: "var(--ok)" }}
        />
        System stable
      </div>

      <ThemeToggle />

      {/* Notification bell */}
      <NotificationBell />

      {/* User menu with responsive profile trigger & modern styling */}
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Account menu"
          className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border border-border/80 bg-background/50 hover:bg-muted/70 hover:border-primary/30 hover:shadow-xs transition-all duration-200 cursor-pointer outline-none"
        >
          <span className="w-6.5 h-6.5 rounded-full flex items-center justify-center text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 shrink-0 shadow-inner">
            {initials}
          </span>
          <div className="text-left leading-tight hidden sm:block">
            <div className="text-[12.5px] font-medium text-foreground">
              {user?.fullName ?? "—"}
            </div>
            <div className="text-[9.5px] text-muted-foreground font-medium uppercase tracking-wider">
              {roleLabel}
            </div>
          </div>
          <ChevronDown size={11} className="text-muted-foreground/80 ml-0.5" />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-52 p-1.5 shadow-lg border border-border/60"
        >
          <div className="px-2.5 py-2">
            <div className="text-[13px] font-semibold text-foreground truncate">
              {user?.fullName}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              {user?.email}
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={handleLogout}
            className="flex items-center gap-2 cursor-pointer rounded-lg px-2.5 py-1.75"
          >
            <LogOut size={14} />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

// ── AppLayout ─────────────────────────────────────────────────────────────────
// Pure component: the nav config is passed in from the router (config-down, no
// importing features from the shared layer). `sections` is required — the router
// picks the NAV by role.
export default function AppLayout({ sections }: { sections: NavSection[] }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  // Unread-count badge on the "Inbox" item. Injected here (not in each nav config)
  // because all 3 roles go through AppLayout and point to the same path — doing it
  // here is one place instead of three. Doesn't touch other items' existing badges
  // (e.g. Manager's queue) since it only maps the item with path INBOX_PATH.
  const { data: unreadCount = 0 } = useUnreadCount();
  // Total unread chat across all tickets → badge on the "Tickets" item. Completely
  // separate from the unreadCount above (notifications). Matched by LABEL rather than
  // path: the ticket path has an /admin|/manager|/staff prefix, so there's no shared
  // constant like INBOX_PATH.
  const { data: chatUnread = 0 } = useChatUnreadCount();
  const sectionsWithBadge = useMemo(() => {
    if (!unreadCount && !chatUnread) return sections;
    return sections.map((section) => ({
      ...section,
      items: section.items.map((item) => {
        if (unreadCount && item.path === INBOX_PATH)
          return { ...item, badge: unreadCount > 99 ? "99+" : unreadCount };
        // Don't overwrite another item's existing badge (e.g. Manager's "Queue").
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
          {/* key by route → the page-enter animation replays on every navigation.
              h-full + min-h-0 preserve the flex layout of full-height pages. */}
          <div key={location.pathname} className="page-enter h-full min-h-0">
            {/* Route pages are code-split (React.lazy in src/router/index.tsx). Keeping the
                boundary inside <main> means the sidebar and topbar stay painted while a page
                chunk downloads — the layout never unmounts, so no flicker on navigation. */}
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
