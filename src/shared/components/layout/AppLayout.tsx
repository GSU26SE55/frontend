import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  Battery,
  BatteryCharging,
  Users,
  Shield,
  Settings,
  Bell,
  BellRing,
  ChevronDown,
  LogOut,
  Ticket,
  Clock,
  FileText,
  ScrollText,
  FileClock,
  BookOpen,
  ShieldAlert,
  Thermometer,
  MessageSquare,
  Wrench,
  Workflow,
  BarChart3,
  Cpu,
  HardDrive,
  SlidersHorizontal,
} from "lucide-react";
import Sidebar, { type NavSection } from "./Sidebar";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { UserRole } from "@/shared/types/session.types";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/shared/components/common/ThemeToggle";
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

// ── Nav configs ─────────────────────────────────────────────────────────────
const ADMIN_NAV: NavSection[] = [
  {
    // Top-level — always visible, no header
    items: [
      { label: "Tổng quan", path: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Analytics", path: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Hạ tầng pin",
    collapsible: true,
    defaultOpen: true,
    items: [
      { label: "Sites", path: "/admin/sites", icon: MapPin },
      { label: "Battery Assets", path: "/admin/battery-assets", icon: Battery },
      {
        label: "Loại pin & Ngưỡng",
        path: "/admin/battery-types",
        icon: BatteryCharging,
      },
      { label: "Cảnh báo pin", path: "/admin/alerts", icon: BellRing },
      {
        label: "Sự cố môi trường",
        path: "/admin/environmental-incidents",
        icon: ShieldAlert,
      },
      { label: "Môi trường site", path: "/admin/ambient", icon: Thermometer },
      { label: "IoT Devices", path: "/admin/iot-devices", icon: Cpu },
      { label: "Firmware OTA", path: "/admin/iot-firmware", icon: HardDrive },
    ],
  },
  {
    title: "Hỗ trợ",
    collapsible: true,
    defaultOpen: true,
    items: [
      { label: "Tickets", path: "/admin/tickets", icon: Ticket },
      { label: "Knowledge Base", path: "/admin/kb", icon: BookOpen },
    ],
  },
  {
    title: "Người dùng",
    collapsible: true,
    defaultOpen: false,
    items: [
      { label: "Tài khoản", path: "/admin/accounts", icon: Users },
      { label: "Roles & Permissions", path: "/admin/roles", icon: Shield },
    ],
  },
  {
    title: "Hệ thống",
    collapsible: true,
    defaultOpen: false,
    items: [
      { label: "SMS Gateway", path: "/admin/sms-gateway", icon: MessageSquare },
      { label: "Saga Debug", path: "/admin/sagas", icon: Workflow },
      { label: "Audit Logs", path: "/admin/audit-logs", icon: ScrollText },
      {
        label: "Audit Pin & Cảnh báo",
        path: "/admin/battery-audit-logs",
        icon: FileClock,
      },
      {
        label: "Audit Truy cập File",
        path: "/admin/files-audit-logs",
        icon: FileClock,
      },
      { label: "Gửi thông báo", path: "/admin/notifications", icon: Bell },
      { label: "Cài đặt", path: "/admin/settings", icon: Settings },
    ],
  },
];

const MANAGER_NAV: NavSection[] = [
  {
    items: [
      { label: "Tổng quan", path: "/manager/dashboard", icon: LayoutDashboard },
      { label: "Analytics", path: "/manager/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Quản lý",
    collapsible: true,
    defaultOpen: true,
    items: [
      { label: "Sites", path: "/manager/sites", icon: MapPin },
      { label: "Tickets", path: "/manager/tickets", icon: Ticket },
      { label: "Hàng chờ", path: "/manager/tickets/queue", icon: Clock },
      { label: "Knowledge Base", path: "/manager/kb", icon: BookOpen },
      { label: "Cảnh báo pin", path: "/manager/alerts", icon: BellRing },
      {
        label: "Sự cố môi trường",
        path: "/manager/environmental-incidents",
        icon: ShieldAlert,
      },
      { label: "Môi trường site", path: "/manager/ambient", icon: Thermometer },
      {
        label: "Calibration sắp hết hạn",
        path: "/manager/iot-calibrations",
        icon: SlidersHorizontal,
      },
    ],
  },
  {
    title: "Hệ thống",
    collapsible: true,
    defaultOpen: false,
    items: [{ label: "Cài đặt", path: "/manager/settings", icon: Settings }],
  },
];

const STAFF_NAV: NavSection[] = [
  {
    items: [
      { label: "Tổng quan", path: "/staff/dashboard", icon: LayoutDashboard },
      { label: "My Tickets", path: "/staff/tickets", icon: Ticket },
      {
        label: "Lịch sử bảo trì",
        path: "/staff/maintenance-logs",
        icon: Wrench,
      },
      { label: "Knowledge Base", path: "/staff/kb", icon: BookOpen },
      { label: "SLA Monitor", path: "/staff/sla", icon: Clock },
      {
        label: "Calibration thiết bị",
        path: "/staff/iot-calibrations",
        icon: SlidersHorizontal,
      },
    ],
  },
  {
    title: "Báo cáo",
    collapsible: true,
    defaultOpen: true,
    items: [
      { label: "Alerts", path: "/staff/alerts", icon: FileText },
      { label: "Cảnh báo pin", path: "/staff/battery-alerts", icon: BellRing },
      {
        label: "Sự cố môi trường",
        path: "/staff/environmental-incidents",
        icon: ShieldAlert,
      },
    ],
  },
  {
    title: "Hệ thống",
    collapsible: true,
    defaultOpen: false,
    items: [{ label: "Cài đặt", path: "/staff/settings", icon: Settings }],
  },
];

// ── AppLayout ────────────────────────────────────────────────────────────────
export default function AppLayout() {
  const role = useSessionStore((s) => s.user?.role);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const sections =
    role === UserRole.ADMIN
      ? ADMIN_NAV
      : role === UserRole.MANAGER
        ? MANAGER_NAV
        : role === UserRole.STAFF
          ? STAFF_NAV
          : [];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        appName="Solar Battery Management"
        sections={sections}
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
