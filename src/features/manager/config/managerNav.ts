// Sidebar nav config for the MANAGER role.
// Labels/titles shared by ≥2 roles → import from shared/constants/sidebarLabels.
// Labels/titles only manager uses → kept inline here.

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
      // Route shared by every role (no /manager prefix) — the BE already filters by UserId from the JWT.
      { label: SIDEBAR_LABELS.inbox, path: INBOX_PATH, icon: Inbox },
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
      {
        label: "Calibrations expiring",
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
