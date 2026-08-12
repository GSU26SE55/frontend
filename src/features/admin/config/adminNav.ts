// Sidebar nav config for the ADMIN role.
// Shared label/title (used by ≥2 roles) → import from shared/constants/sidebarLabels.
// Label/title specific to admin only → keep inline here.

import {
  History,
  Newspaper,
  LayoutTemplate,
  LayoutDashboard,
  MapPin,
  BatteryCharging,
  Users,
  Shield,
  Settings,
  Bell,
  BellRing,
  Inbox,
  Ticket,
  ScrollText,
  BookOpen,
  ShieldAlert,
  MessageSquare,
  BarChart3,
  Cpu,
} from "lucide-react";
import type { NavSection } from "@/shared/components/layout/Sidebar";
import {
  INBOX_PATH,
  SIDEBAR_LABELS,
  SIDEBAR_SECTION_TITLES,
} from "@/shared/constants/sidebarLabels";

export const ADMIN_NAV: NavSection[] = [
  {
    // Top-level — always visible, no header
    items: [
      {
        label: SIDEBAR_LABELS.overview,
        path: "/admin/dashboard",
        icon: LayoutDashboard,
      },
      {
        label: SIDEBAR_LABELS.analytics,
        path: "/admin/analytics",
        icon: BarChart3,
      },
      // Route shared across all roles (no /admin prefix) — BE filters by UserId in the JWT.
      { label: SIDEBAR_LABELS.inbox, path: INBOX_PATH, icon: Inbox },
    ],
  },
  {
    title: "Battery infrastructure",
    collapsible: true,
    defaultOpen: true,
    items: [
      // Batteries accessed via Site (Battery & Site → site detail → battery detail).
      // Route /admin/battery-assets/:id is kept for deep-links from alert/ticket.
      { label: SIDEBAR_LABELS.sites, path: "/admin/sites", icon: MapPin },
      {
        label: "Battery types & thresholds",
        path: "/admin/battery-types",
        icon: BatteryCharging,
      },
      {
        label: SIDEBAR_LABELS.batteryAlerts,
        path: "/admin/alerts",
        icon: BellRing,
      },
      {
        label: SIDEBAR_LABELS.envIncidents,
        path: "/admin/environmental-incidents",
        icon: ShieldAlert,
      },
      { label: "Devices", path: "/admin/iot-devices", icon: Cpu },
      // Hidden from nav per request — route kept intact, not deleted.
      // { label: "Firmware OTA", path: "/admin/iot-firmware", icon: HardDrive },
    ],
  },
  {
    title: "Support",
    collapsible: true,
    defaultOpen: true,
    items: [
      { label: SIDEBAR_LABELS.tickets, path: "/admin/tickets", icon: Ticket },
      {
        label: SIDEBAR_LABELS.knowledgeBase,
        path: "/admin/kb",
        icon: BookOpen,
      },
      {
        label: SIDEBAR_LABELS.blog,
        path: "/admin/blog",
        icon: Newspaper,
      },
    ],
  },
  {
    title: "Users",
    collapsible: true,
    defaultOpen: false,
    items: [
      { label: "Accounts", path: "/admin/accounts", icon: Users },
      { label: "Roles & Permissions", path: "/admin/roles", icon: Shield },
    ],
  },
  {
    title: SIDEBAR_SECTION_TITLES.system,
    collapsible: true,
    defaultOpen: false,
    items: [
      { label: "SMS Gateway", path: "/admin/sms-gateway", icon: MessageSquare },
      // Hidden from nav per request — route kept intact, not deleted.
      // { label: "Saga Debug", path: "/admin/sagas", icon: Workflow },
      { label: "Logs", path: "/admin/audit-logs", icon: ScrollText },
      // Hidden from nav per request — routes kept intact, not deleted.
      // {
      //   label: "Battery & Alert Audit",
      //   path: "/admin/battery-audit-logs",
      //   icon: FileClock,
      // },
      // {
      //   label: "File Access Audit",
      //   path: "/admin/files-audit-logs",
      //   icon: FileClock,
      // },
      { label: "Send notification", path: "/admin/notifications", icon: Bell },
      {
        label: "Notification groups",
        path: "/admin/notification-groups",
        icon: Users,
      },
      {
        label: "Send history",
        path: "/admin/notification-batches",
        icon: History,
      },
      {
        label: "Notification templates",
        path: "/admin/notification-templates",
        icon: LayoutTemplate,
      },
      {
        label: SIDEBAR_LABELS.settings,
        path: "/admin/settings",
        icon: Settings,
      },
    ],
  },
];
