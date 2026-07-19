// Nav config sidebar cho role MANAGER.
// Label/title chung (≥2 role) → import từ shared/constants/sidebarLabels.
// Label/title đặc thù chỉ manager dùng → giữ inline ở đây.

import {
  LayoutDashboard,
  MapPin,
  Settings,
  BellRing,
  Ticket,
  Clock,
  BookOpen,
  ShieldAlert,
  Thermometer,
  BarChart3,
  SlidersHorizontal,
} from "lucide-react";
import type { NavSection } from "@/shared/components/layout/Sidebar";
import {
  SIDEBAR_LABELS,
  SIDEBAR_SECTION_TITLES,
} from "@/shared/constants/sidebarLabels";

export const MANAGER_NAV: NavSection[] = [
  {
    items: [
      {
        label: SIDEBAR_LABELS.overview,
        path: "/manager/dashboard",
        icon: LayoutDashboard,
      },
      {
        label: SIDEBAR_LABELS.analytics,
        path: "/manager/analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    title: "Quản lý",
    collapsible: true,
    defaultOpen: true,
    items: [
      { label: SIDEBAR_LABELS.sites, path: "/manager/sites", icon: MapPin },
      { label: SIDEBAR_LABELS.tickets, path: "/manager/tickets", icon: Ticket },
      { label: "Hàng chờ", path: "/manager/tickets/queue", icon: Clock },
      {
        label: SIDEBAR_LABELS.knowledgeBase,
        path: "/manager/kb",
        icon: BookOpen,
      },
      {
        label: SIDEBAR_LABELS.batteryAlerts,
        path: "/manager/alerts",
        icon: BellRing,
      },
      {
        label: SIDEBAR_LABELS.envIncidents,
        path: "/manager/environmental-incidents",
        icon: ShieldAlert,
      },
      {
        label: SIDEBAR_LABELS.ambient,
        path: "/manager/ambient",
        icon: Thermometer,
      },
      {
        label: "Calibration sắp hết hạn",
        path: "/manager/iot-calibrations",
        icon: SlidersHorizontal,
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
        path: "/manager/settings",
        icon: Settings,
      },
    ],
  },
];
