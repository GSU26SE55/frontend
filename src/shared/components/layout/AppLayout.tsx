import { Suspense, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ChevronDown, LogOut } from "lucide-react";
import Sidebar, { type NavSection, type NavBadge } from "./Sidebar";
import { APP_NAME, SIDEBAR_LABELS } from "@/shared/constants/sidebarLabels";
import {
  useUnresolvedAlertCount,
  useUnresolvedDeviceAlertCount,
  useSiteLevelAlertCount,
} from "@/shared/hooks/alerts/useAlerts";
import { useKbReviewCounts } from "@/shared/hooks/kb/useKbPendingReview";
import { useBlogDraftCount } from "@/shared/hooks/blog/useBlog";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { UserRole } from "@/shared/types/account/session.types";
import ThemeToggle from "@/shared/components/ui/ThemeToggle";
import NotificationBell from "./NotificationBell";
import LayoutSkeleton, { PageSkeleton } from "./LayoutSkeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, useReducedMotion } from "framer-motion";
import { PageTransition } from "@/shared/motion/PageTransition";
import { DIST, DUR, EASE_OUT } from "@/shared/motion/tokens";

// ── Topbar ───────────────────────────────────────────────────────────────────
function Topbar() {
  const reduced = useReducedMotion();
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
    <motion.header
      // Rises once when the shell mounts, alongside the sidebar and the page.
      initial={reduced ? false : { opacity: 0, y: DIST.sm }}
      animate={{
        opacity: 1,
        y: 0,
        transition: { duration: DUR.enter, ease: EASE_OUT },
      }}
      className="h-14 border-b border-border/60 bg-background/85 backdrop-blur-md flex items-center px-5 gap-3 sticky top-0 z-20 shrink-0"
    >
      <div className="flex-1" />

      {/* System status dot inside a polished pill container */}
      <div className="hidden sm:flex items-center gap-1.5 text-2xs font-medium text-muted-foreground bg-muted/40 border border-border/50 rounded-full px-2.5 py-0.75 select-none transition-[color,background-color,border-color,box-shadow] duration-(--motion-state) ease-strong">
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
          className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border border-border/80 bg-background/50 hover:bg-muted/70 hover:border-primary/30 hover:shadow-xs transition-[color,background-color,border-color,box-shadow] duration-(--motion-state) ease-strong cursor-pointer outline-none"
        >
          <span className="w-6.5 h-6.5 rounded-full flex items-center justify-center text-3xs font-bold bg-primary/10 text-primary border border-primary/20 shrink-0 shadow-inner">
            {initials}
          </span>
          <div className="text-left leading-tight hidden sm:block">
            <div className="text-xs font-medium text-foreground">
              {user?.fullName ?? "—"}
            </div>
            <div className="text-3xs text-muted-foreground font-medium uppercase tracking-wider">
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
            <div className="text-2sm font-semibold text-foreground truncate">
              {user?.fullName}
            </div>
            <div className="text-2xs text-muted-foreground truncate">
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
    </motion.header>
  );
}

// Reads the saved rail state. localStorage throws in private mode / when full, and a
// missing entry means "never toggled" — both fall back to expanded.
function readRailCollapsed(key: string): boolean {
  try {
    return localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

// ── AppLayout ─────────────────────────────────────────────────────────────────
// Pure component: the nav config is passed in from the router (config-down, no
// importing features from the shared layer). `sections` is required — the router
// picks the NAV by role.
export default function AppLayout({ sections }: { sections: NavSection[] }) {
  const location = useLocation();
  // Namespaces the sidebar's saved section state per role — see Sidebar's `scopeKey`.
  const role = useSessionStore((s) => s.user?.role);

  // The rail's collapsed state persists per role, same reasoning as the per-section
  // state: localStorage is keyed by origin, so without the role in the key an Admin
  // collapsing the rail would collapse it for the next Staff login on the same browser.
  // `role` is undefined on the first render (the session store hydrates after mount),
  // so this reads "anon" first and the effect below re-reads once the role lands.
  const railKey = `sidebar-collapsed-${role ?? "anon"}`;
  const [collapsed, setCollapsed] = useState(() => readRailCollapsed(railKey));
  // Re-read during render rather than in an effect: adjusting state while the key
  // changes keeps it to one render pass, with no flash of the wrong rail width.
  const [readKey, setReadKey] = useState(railKey);
  if (readKey !== railKey) {
    setReadKey(railKey);
    setCollapsed(readRailCollapsed(railKey));
  }

  const toggleCollapsed = () =>
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem(railKey, String(next));
      } catch {
        // Private mode / storage full — the toggle must still work, just not persist.
      }
      return next;
    });

  // Badges injected here (not in each nav config) because all 3 roles go through
  // AppLayout — doing it here is one place instead of three. Items with no entry below
  // keep whatever badge their nav config already set (e.g. Manager's queue).
  const alerts = useUnresolvedAlertCount();
  const deviceAlerts = useUnresolvedDeviceAlertCount();
  // Drives the Environmental badge. One count covers that whole screen: incidents write a
  // site-level alert of their own, so this already includes them.
  const siteLevelAlerts = useSiteLevelAlertCount();
  // All of these return 0 for roles that cannot act on them (Staff) — the gate lives in
  // the hooks themselves, so nothing here has to know about roles.
  const kb = useKbReviewCounts();
  const blogDrafts = useBlogDraftCount();

  const sectionsWithBadge = useMemo(() => {
    // Matched by LABEL, because each role mounts these under its own prefix
    // (Admin and Manager use /{role}/alerts). Labels come from SIDEBAR_LABELS,
    // which the nav configs already share.
    const cap = (n: number) => (n > 99 ? "99+" : n);

    // Alerts, incidents and blog carry a single count each.
    const single: Record<string, number> = {
      // What still needs action: Open + Acknowledged.
      [SIDEBAR_LABELS.batteryAlerts]: alerts.count,
      // Site-level alerts alone: every incident also writes one of these, so the screen — and this
      // badge — cover both from that single count. Adding the incident count on top would tally
      // each incident twice.
      [SIDEBAR_LABELS.envIncidents]: siteLevelAlerts.count,
      // Counted by the same Open+Acknowledged rule; its query is the exact opposite of the
      // battery one, so the two badges partition the alert table rather than overlap.
      [SIDEBAR_LABELS.deviceAlerts]: deviceAlerts.count,
      // Posts nobody has published yet.
      [SIDEBAR_LABELS.blog]: blogDrafts,
    };

    // Guide carries two, because they mean different things: articles awaiting
    // approve/reject are a queue someone is blocked on (danger), while drafts are merely
    // unfinished (muted). Collapsing them into one number would hide that difference.
    const guideBadges: NavBadge[] = [];
    if (kb.pendingReview)
      guideBadges.push({
        value: cap(kb.pendingReview),
        // Amber, not red: an article awaiting approval is queued work, not an alarm —
        // red is reserved for unresolved alerts and incidents.
        tone: "warning",
        title: `${kb.pendingReview} article(s) awaiting approval`,
      });
    if (kb.draft)
      guideBadges.push({
        value: cap(kb.draft),
        tone: "muted",
        title: `${kb.draft} draft article(s)`,
      });

    return sections.map((section) => ({
      ...section,
      items: section.items.map((item) => {
        if (item.label === SIDEBAR_LABELS.knowledgeBase) {
          return guideBadges.length ? { ...item, badge: guideBadges } : item;
        }
        const count = single[item.label];
        return count ? { ...item, badge: cap(count) } : item;
      }),
    }));
  }, [
    sections,
    alerts.count,
    deviceAlerts.count,
    siteLevelAlerts.count,
    kb.pendingReview,
    kb.draft,
    blogDrafts,
  ]);

  // Hold the shell on its skeleton for a beat before painting the real thing. Landing
  // straight from the login redirect, the chunk and the badge queries are usually in
  // flight for about this long anyway; the wait gives the entrance something to reveal
  // instead of the whole console snapping in fully formed.
  const [shellReady, setShellReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShellReady(true), 200);
    return () => clearTimeout(timer);
  }, []);

  if (!shellReady) return <LayoutSkeleton />;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        appName={APP_NAME}
        sections={sectionsWithBadge}
        collapsed={collapsed}
        onToggle={toggleCollapsed}
        scopeKey={role ?? "anon"}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          {/* Route pages are code-split (React.lazy in src/router/index.tsx). Keeping the
              boundary inside <main> means the sidebar and topbar stay painted while a page
              chunk downloads — the layout never unmounts, so no flicker on navigation.
              The transition sits INSIDE it: otherwise the sweep plays on the skeleton and
              the real page pops in afterwards without moving.
              h-full + min-h-0 preserve the flex layout of full-height pages. */}
          <Suspense fallback={<PageSkeleton />}>
            <PageTransition
              routeKey={location.pathname}
              className="h-full min-h-0"
            >
              <Outlet />
            </PageTransition>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
