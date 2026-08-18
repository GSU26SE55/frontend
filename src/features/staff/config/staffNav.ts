// Sidebar nav config for the STAFF role.
// Labels/titles shared by 2+ roles → imported from shared/constants/sidebarLabels.
// Labels/titles only staff uses → kept inline here.

import {
  Newspaper,
  LayoutDashboard,
  Settings,
  BellRing,
  Ticket,
  Clock,
  FileText,
  BookOpen,
  ShieldAlert,
  Wrench,
  // SlidersHorizontal, // unused while "Device calibration" nav entry is hidden
  HardDrive,
} from "lucide-react";
import type { NavSection } from "@/shared/components/layout/Sidebar";
import {
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
      // Ẩn tạm Device calibration khỏi sidebar — không xoá, chờ yêu cầu bật lại.
      // {
      //   label: "Device calibration",
      //   path: "/staff/iot-calibrations",
      //   icon: SlidersHorizontal,
      // },
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
