// Sidebar nav config for the STAFF role.
// Labels/titles shared by 2+ roles → imported from shared/constants/sidebarLabels.
// Labels/titles only staff uses → kept inline here.

import {
  Newspaper,
  LayoutDashboard,
  Settings,
  BellRing,
  Inbox,
  Ticket,
  Clock,
  FileText,
  BookOpen,
  ShieldAlert,
  Wrench,
  SlidersHorizontal,
  HardDrive,
} from "lucide-react";
import type { NavSection } from "@/shared/components/layout/Sidebar";
import {
  INBOX_PATH,
  SIDEBAR_LABELS,
  SIDEBAR_SECTION_TITLES,
} from "@/shared/constants/sidebarLabels";

export const STAFF_NAV: NavSection[] = [
  {
    items: [
      {
        label: SIDEBAR_LABELS.overview,
        path: "/staff/dashboard",
        icon: LayoutDashboard,
      },
      // Route shared by every role (no /staff prefix) — the BE already filters by the UserId in the JWT.
      { label: SIDEBAR_LABELS.inbox, path: INBOX_PATH, icon: Inbox },
      { label: "My Tickets", path: "/staff/tickets", icon: Ticket },
      {
        label: "Maintenance history",
        path: "/staff/maintenance-logs",
        icon: Wrench,
      },
      {
        label: SIDEBAR_LABELS.knowledgeBase,
        path: "/staff/kb",
        icon: BookOpen,
      },
      {
        label: SIDEBAR_LABELS.blog,
        path: "/staff/blog",
        icon: Newspaper,
      },
      { label: "SLA Monitor", path: "/staff/sla", icon: Clock },
      {
        label: "Device calibration",
        path: "/staff/iot-calibrations",
        icon: SlidersHorizontal,
      },
      // IOT3-68 — đặt CẠNH calibration: cùng một người, cùng một lúc, cùng một thiết bị.
      {
        label: "IoT Devices",
        path: "/staff/iot-devices",
        icon: HardDrive,
      },
    ],
  },
  {
    title: "Reports",
    collapsible: true,
    defaultOpen: true,
    items: [
      { label: "Alerts", path: "/staff/alerts", icon: FileText },
      {
        label: SIDEBAR_LABELS.batteryAlerts,
        path: "/staff/battery-alerts",
        icon: BellRing,
      },
      {
        label: SIDEBAR_LABELS.envIncidents,
        path: "/staff/environmental-incidents",
        icon: ShieldAlert,
      },
    ],
  },
  {
    title: SIDEBAR_SECTION_TITLES.system,
    collapsible: true,
    defaultOpen: false,
    items: [
      {
        label: SIDEBAR_LABELS.settings,
        path: "/staff/settings",
        icon: Settings,
      },
    ],
  },
];
