// Nav config sidebar cho role STAFF.
// Label/title chung (≥2 role) → import từ shared/utils/sidebarLabels.
// Label/title đặc thù chỉ staff dùng → giữ inline ở đây.

import {
  LayoutDashboard,
  Settings,
  BellRing,
  Ticket,
  Clock,
  FileText,
  BookOpen,
  ShieldAlert,
  Wrench,
  SlidersHorizontal,
} from "lucide-react";
import type { NavSection } from "@/shared/components/layout/Sidebar";
import {
  SIDEBAR_LABELS,
  SIDEBAR_SECTION_TITLES,
} from "@/shared/utils/sidebarLabels";

export const STAFF_NAV: NavSection[] = [
  {
    items: [
      {
        label: SIDEBAR_LABELS.overview,
        path: "/staff/dashboard",
        icon: LayoutDashboard,
      },
      { label: "My Tickets", path: "/staff/tickets", icon: Ticket },
      {
        label: "Lịch sử bảo trì",
        path: "/staff/maintenance-logs",
        icon: Wrench,
      },
      {
        label: SIDEBAR_LABELS.knowledgeBase,
        path: "/staff/kb",
        icon: BookOpen,
      },
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
