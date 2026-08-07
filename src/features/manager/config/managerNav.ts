// Nav config sidebar cho role MANAGER.
// Label/title chung (≥2 role) → import từ shared/constants/sidebarLabels.
// Label/title đặc thù chỉ manager dùng → giữ inline ở đây.

import {
  Newspaper,
  LayoutDashboard,
  MapPin,
  Settings,
  BellRing,
  Inbox,
  Ticket,
  Clock,
  BookOpen,
  ShieldAlert,
  BarChart3,
  SlidersHorizontal,
} from "lucide-react";
import type { NavSection } from "@/shared/components/layout/Sidebar";
import {
  INBOX_PATH,
  SIDEBAR_LABELS,
  SIDEBAR_SECTION_TITLES,
} from "@/shared/constants/sidebarLabels";

// #697 — ManagerAppLayout dùng path này để gắn badge số ticket chờ duyệt.
export const MANAGER_QUEUE_PATH = "/manager/tickets/queue";

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
      // Route dùng chung mọi role (không có prefix /manager) — BE đã lọc theo UserId trong JWT.
      { label: SIDEBAR_LABELS.inbox, path: INBOX_PATH, icon: Inbox },
    ],
  },
  {
    title: "Quản lý",
    collapsible: true,
    defaultOpen: true,
    items: [
      // Pin truy cập qua Site (Sites → site detail → chi tiết pin).
      // Route /manager/battery-assets/:id vẫn giữ cho deep-link từ alert/ticket.
      { label: SIDEBAR_LABELS.sites, path: "/manager/sites", icon: MapPin },
      { label: SIDEBAR_LABELS.tickets, path: "/manager/tickets", icon: Ticket },
      { label: "Hàng chờ", path: MANAGER_QUEUE_PATH, icon: Clock },
      {
        label: SIDEBAR_LABELS.knowledgeBase,
        path: "/manager/kb",
        icon: BookOpen,
      },
      {
        label: SIDEBAR_LABELS.blog,
        path: "/manager/blog",
        icon: Newspaper,
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
