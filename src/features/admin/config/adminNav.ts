// Sidebar nav config for the ADMIN role.
// Shared label/title (used by ≥2 roles) → import from shared/constants/sidebarLabels.
// Label/title specific to admin only → keep inline here.

import {
  FileUp,
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
  SIDEBAR_LABELS,
  SIDEBAR_SECTION_TITLES,
} from "@/shared/constants/sidebarLabels";

// Admin is a setup-and-oversight role, not a daily operator (core-business-flow.md §6:
// "Setup 1 lần + cập nhật khi có yêu cầu"). So the things that raise a count sit at the
// top, and the one-time configuration sits collapsed at the bottom.
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
      // Tickets rides in the always-visible group rather than a collapsible section:
      // 4 of the 6 phases in core-business-flow.md run through a ticket, so it is the
      // one thing that must never be a click away. Admin watches this queue rather
      // than triaging it.
      { label: SIDEBAR_LABELS.tickets, path: "/admin/tickets", icon: Ticket },
    ],
  },
  {
    // What is going wrong now — both streams carry a red count.
    title: SIDEBAR_SECTION_TITLES.incidents,
    collapsible: true,
    defaultOpen: true,
    items: [
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
    ],
  },
  {
    // The estate itself — opened to answer a question, not to clear a queue.
    title: SIDEBAR_SECTION_TITLES.assets,
    collapsible: true,
    defaultOpen: true,
    items: [
      // Batteries accessed via Site (Battery & Site → site detail → battery detail).
      // Route /admin/battery-assets/:id is kept for deep-links from alert/ticket.
      // Type before the assets that use it: a battery type (and its thresholds) is
      // defined first, then sites and their batteries are created against it — the order
      // follows how the estate is actually built up. Short label: the page is titled
      // "Battery types & Alert thresholds", and thresholds are configured per type.
      {
        label: "Battery types",
        path: "/admin/battery-types",
        icon: BatteryCharging,
      },
      { label: SIDEBAR_LABELS.sites, path: "/admin/sites", icon: MapPin },
      { label: "Devices", path: "/admin/iot-devices", icon: Cpu },
    ],
  },
  {
    // Guide is the internal KB; Blog is the customer-facing post generated from it, so
    // Guide comes first — the order matches the direction the content flows.
    title: SIDEBAR_SECTION_TITLES.knowledge,
    collapsible: true,
    defaultOpen: true,
    items: [
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
    // Everything about sending a message, in the order the job is done: compose → who
    // receives it → what it looks like → what went out → the channel it went through.
    // These were previously spread through Configure among battery and account setup,
    // which buried the fact that they are one workflow.
    title: SIDEBAR_SECTION_TITLES.notifications,
    collapsible: true,
    defaultOpen: false,
    items: [
      { label: "Send notification", path: "/admin/notifications", icon: Bell },
      {
        label: "Notification groups",
        path: "/admin/notification-groups",
        icon: Users,
      },
      {
        label: "Notification templates",
        path: "/admin/notification-templates",
        icon: LayoutTemplate,
      },
      {
        label: "Send history",
        path: "/admin/notification-batches",
        icon: History,
      },
      // The delivery channel the messages above go out on — configured here rather than
      // in Configure so the whole send pipeline reads top to bottom in one group.
      { label: "SMS Gateway", path: "/admin/sms-gateway", icon: MessageSquare },
    ],
  },
  {
    // Setup done once and revisited on request — collapsed so the daily view stays short.
    title: SIDEBAR_SECTION_TITLES.system,
    collapsible: true,
    defaultOpen: false,
    items: [
      { label: "Logs", path: "/admin/audit-logs", icon: ScrollText },
      {
        label: "Third-party import",
        path: "/admin/data-import",
        icon: FileUp,
      },
      { label: "Accounts", path: "/admin/accounts", icon: Users },
      { label: "Roles & Permissions", path: "/admin/roles", icon: Shield },
      {
        label: SIDEBAR_LABELS.settings,
        path: "/admin/settings",
        icon: Settings,
      },
      // Hidden from nav per request — routes kept intact, not deleted.
      // { label: "Firmware OTA", path: "/admin/iot-firmware", icon: HardDrive },
      // { label: "Saga Debug", path: "/admin/sagas", icon: Workflow },
      // { label: "Battery & Alert Audit", path: "/admin/battery-audit-logs", icon: FileClock },
      // { label: "File Access Audit", path: "/admin/files-audit-logs", icon: FileClock },
    ],
  },
];
