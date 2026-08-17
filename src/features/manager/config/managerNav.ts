// Sidebar nav config for the MANAGER role.
// Labels/titles shared by ≥2 roles → import from shared/constants/sidebarLabels.
// Labels/titles only manager uses → kept inline here.

import {
  Newspaper,
  LayoutDashboard,
  MapPin,
  Settings,
  BellRing,
  Ticket,
  Clock,
  BookOpen,
  ShieldAlert,
  BarChart3,
  // SlidersHorizontal, // unused while "Calibrations expiring" nav entry is hidden
} from "lucide-react";
import type { NavSection } from "@/shared/components/layout/Sidebar";
import {
  SIDEBAR_LABELS,
  SIDEBAR_SECTION_TITLES,
} from "@/shared/constants/sidebarLabels";

// #697 — ManagerAppLayout uses this path to attach the pending-ticket count badge.
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
    ],
  },
  {
    title: "Management",
    collapsible: true,
    defaultOpen: true,
    items: [
      // Batteries are reached through Sites (Sites → site detail → battery detail).
      // The /manager/battery-assets/:id route is kept for deep-links from alerts/tickets.
      { label: SIDEBAR_LABELS.sites, path: "/manager/sites", icon: MapPin },
      { label: SIDEBAR_LABELS.tickets, path: "/manager/tickets", icon: Ticket },
      { label: "Queue", path: MANAGER_QUEUE_PATH, icon: Clock },
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
      // Ẩn tạm Calibrations expiring khỏi sidebar — không xoá, chờ yêu cầu bật lại.
      // {
      //   label: "Calibrations expiring",
      //   path: "/manager/iot-calibrations",
      //   icon: SlidersHorizontal,
      // },
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
