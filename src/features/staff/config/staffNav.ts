// Sidebar nav config for the STAFF role.
// Labels/titles shared by 2+ roles → imported from shared/constants/sidebarLabels.
// Labels/titles only staff uses → kept inline here.

import {
  Newspaper,
  LayoutDashboard,
  Settings,
  Ticket,
  Clock,
  BookOpen,
  Wrench,
  // SlidersHorizontal, // unused while "Device calibration" nav entry is hidden
  HardDrive,
} from "lucide-react";
import type { NavSection } from "@/shared/components/layout/Sidebar";
import {
  SIDEBAR_LABELS,
  SIDEBAR_SECTION_TITLES,
} from "@/shared/constants/sidebarLabels";

// Staff works a conveyor of tickets (core-business-flow.md §8) and MUST escalate at 2/3
// of the SLA, so SLA Monitor sits next to My Tickets rather than below the content links
// — it is checked continuously, not looked up.
export const STAFF_NAV: NavSection[] = [
  {
    items: [
      {
        label: SIDEBAR_LABELS.overview,
        path: "/staff/dashboard",
        icon: LayoutDashboard,
      },
      // Always visible, never a click away — the ticket IS the staff workload
      // (core-business-flow.md §8: a conveyor of tickets worked in parallel).
      { label: "My Tickets", path: "/staff/tickets", icon: Ticket },
      // Beside My Tickets, not below the content links: staff MUST escalate at 2/3 of
      // the SLA, so this is watched continuously rather than looked up.
      { label: "SLA Monitor", path: "/staff/sla", icon: Clock },
    ],
  },
  {
    title: SIDEBAR_SECTION_TITLES.assets,
    collapsible: true,
    defaultOpen: true,
    items: [
      {
        label: "Maintenance history",
        path: "/staff/maintenance-logs",
        icon: Wrench,
      },
      // IOT3-68 — đặt CẠNH calibration: cùng một người, cùng một lúc, cùng một thiết bị.
      {
        label: "IoT Devices",
        path: "/staff/iot-devices",
        icon: HardDrive,
      },
      // Ẩn tạm Device calibration khỏi sidebar — không xoá, chờ yêu cầu bật lại.
      // {
      //   label: "Device calibration",
      //   path: "/staff/iot-calibrations",
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
        path: "/staff/kb",
        icon: BookOpen,
      },
      {
        label: SIDEBAR_LABELS.blog,
        path: "/staff/blog",
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
        path: "/staff/settings",
        icon: Settings,
      },
    ],
  },
];
