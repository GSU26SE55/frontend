import type { LucideIcon } from "lucide-react";

export type HeroDemoId = "health" | "alerts" | "tickets" | "sla";

export type LandingMetric = {
  label: string;
  value: string;
  icon: LucideIcon;
};

export type HeroDemo = {
  id: HeroDemoId;
  label: string;
  title: string;
  desc: string;
  consoleNote: string;
  metrics: readonly LandingMetric[];
  steps: readonly string[];
};

export type NavItem = {
  label: string;
  href: string;
};

export type ProductCapability = {
  icon: LucideIcon;
  title: string;
  desc: string;
};

export type WorkflowItem = {
  icon: LucideIcon;
  step: string;
  title: string;
  desc: string;
};

export type RoleItem = {
  role: string;
  icon: LucideIcon;
  title: string;
  desc: string;
};

export type BatteryStatus = "Normal" | "Degrading" | "Critical";

export type BatteryRow = {
  id: string;
  site: string;
  soh: number;
  temp: string;
  trend: string;
  status: BatteryStatus;
  assignee: string;
};

export type TicketPriority = "P1" | "P2";

export type TicketRow = {
  id: string;
  priority: TicketPriority;
  title: string;
  owner: string;
  sla: string;
  status: string;
};
