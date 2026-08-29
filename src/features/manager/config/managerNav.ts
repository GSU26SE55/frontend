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
  Router,
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

// Manager is the coordinator and works continuously (core-business-flow.md §7: Phase 4
// Triage + Phase 6 Verify), so Queue leads — the flow there is "open the Queue, then open
// a ticket", and Queue is the item carrying the pending count.
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
      // Always visible, never a click away — 4 of the 6 phases run through a ticket.
      // Queue leads: core-business-flow.md §7 has Manager open the Queue first, then a
      // ticket — and Queue is the item ManagerAppLayout attaches the pending count to.
      { label: "Queue", path: MANAGER_QUEUE_PATH, icon: Clock },
      { label: SIDEBAR_LABELS.tickets, path: "/manager/tickets", icon: Ticket },
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
        path: "/manager/alerts",
        icon: BellRing,
      },
      {
        label: SIDEBAR_LABELS.envIncidents,
        path: "/manager/environmental-incidents",
        icon: ShieldAlert,
      },
      {
        label: SIDEBAR_LABELS.deviceAlerts,
        path: "/manager/device-alerts",
        icon: Router,
      },
    ],
  },
  {
    title: SIDEBAR_SECTION_TITLES.assets,
    collapsible: true,
    defaultOpen: true,
    items: [
      // Batteries are reached through Sites (Sites → site detail → battery detail).
      // The /manager/battery-assets/:id route is kept for deep-links from alerts/tickets.
      // It has no nav entry of its own, so Sites claims it — otherwise the sidebar shows
      // no active item on a battery detail page.
      {
        label: SIDEBAR_LABELS.sites,
        path: "/manager/sites",
        icon: MapPin,
        activePaths: ["/manager/battery-assets"],
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
    // Guide (internal KB) before Blog (customer-facing, generated from it).
    title: SIDEBAR_SECTION_TITLES.knowledge,
    collapsible: true,
    defaultOpen: true,
    items: [
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
    ],
  },
  {
    // Same group title as Admin's, so Settings sits in a named System section for every
    // role rather than dangling headerless here and grouped there.
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
