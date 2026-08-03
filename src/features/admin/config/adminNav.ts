// Nav config sidebar cho role ADMIN.
// Label/title chung (≥2 role) → import từ shared/constants/sidebarLabels.
// Label/title đặc thù chỉ admin dùng → giữ inline ở đây.

import {
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
  FileClock,
  BookOpen,
  ShieldAlert,
  MessageSquare,
  Workflow,
  BarChart3,
  Cpu,
  HardDrive,
} from "lucide-react";
import type { NavSection } from "@/shared/components/layout/Sidebar";
import {
  SIDEBAR_LABELS,
  SIDEBAR_SECTION_TITLES,
} from "@/shared/constants/sidebarLabels";

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
    ],
  },
  {
    title: "Hạ tầng pin",
    collapsible: true,
    defaultOpen: true,
    items: [
      // Pin truy cập qua Site (Battery & Site → site detail → chi tiết pin).
      // Route /admin/battery-assets/:id vẫn giữ cho deep-link từ alert/ticket.
      { label: SIDEBAR_LABELS.sites, path: "/admin/sites", icon: MapPin },
      {
        label: "Loại pin & Ngưỡng",
        path: "/admin/battery-types",
        icon: BatteryCharging,
      },
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
      { label: "IoT Devices", path: "/admin/iot-devices", icon: Cpu },
      { label: "Firmware OTA", path: "/admin/iot-firmware", icon: HardDrive },
    ],
  },
  {
    title: "Hỗ trợ",
    collapsible: true,
    defaultOpen: true,
    items: [
      { label: SIDEBAR_LABELS.tickets, path: "/admin/tickets", icon: Ticket },
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
    title: "Người dùng",
    collapsible: true,
    defaultOpen: false,
    items: [
      { label: "Tài khoản", path: "/admin/accounts", icon: Users },
      { label: "Vai trò & Quyền hạn", path: "/admin/roles", icon: Shield },
    ],
  },
  {
    title: SIDEBAR_SECTION_TITLES.system,
    collapsible: true,
    defaultOpen: false,
    items: [
      { label: "SMS Gateway", path: "/admin/sms-gateway", icon: MessageSquare },
      { label: "Saga Debug", path: "/admin/sagas", icon: Workflow },
      { label: "Audit Logs", path: "/admin/audit-logs", icon: ScrollText },
      {
        label: "Audit Pin & Cảnh báo",
        path: "/admin/battery-audit-logs",
        icon: FileClock,
      },
      {
        label: "Audit Truy cập File",
        path: "/admin/files-audit-logs",
        icon: FileClock,
      },
      { label: "Gửi thông báo", path: "/admin/notifications", icon: Bell },
      {
        label: "Mẫu thông báo",
        path: "/admin/notification-templates",
        icon: LayoutTemplate,
      },
      {
        label: SIDEBAR_LABELS.settings,
        path: "/admin/settings",
        icon: Settings,
      },
    ],
  },
];
