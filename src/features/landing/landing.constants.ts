import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle2,
  Clock,
  Database,
  Gauge,
  ShieldCheck,
  Ticket,
  Users,
  Wrench,
  Zap,
  FileText,
  Headphones,
  Heart,
  Shield,
} from "lucide-react";
import type {
  BatteryRow,
  HeroDemo,
  NavItem,
  ProductCapability,
  RoleItem,
  TicketRow,
  WorkflowItem,
} from "@/features/landing/types/landing.types";
export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Product", href: "#product" },
  { label: "Workflow", href: "#workflow" },
  { label: "Roles", href: "#roles" },
  { label: "Governance", href: "#governance" },
];

export const HERO_DEMOS: readonly HeroDemo[] = [
  {
    id: "health",
    label: "Battery health",
    title: "Track SOH",
    desc: "From raw telemetry to a battery health score and a shortlist of packs that need attention.",
    consoleNote: "Health monitoring view",
    metrics: [
      { label: "Average SOH", value: "86.4%", icon: Gauge },
      { label: "Degrading packs", value: "17", icon: Activity },
      { label: "Critical packs", value: "3", icon: Zap },
    ],
    steps: [
      "Ingest telemetry",
      "Compute SOH",
      "Classify risk",
      "Rank packs by urgency",
    ],
  },
  {
    id: "alerts",
    label: "Anomaly alerts",
    title: "Detect alerts",
    desc: "Every alert arrives with its context: site, battery, temperature, risk level and related history.",
    consoleNote: "Anomaly detection view",
    metrics: [
      { label: "Open alerts", value: "28", icon: AlertTriangle },
      { label: "P1 today", value: "3", icon: Zap },
      { label: "Avg triage", value: "18m", icon: Clock },
    ],
    steps: [
      "Read thresholds",
      "Compare against anomalies",
      "Gather context",
      "Push the alert to a manager",
    ],
  },
  {
    id: "tickets",
    label: "Automatic tickets",
    title: "Create work orders",
    desc: "Qualifying alerts turn into tickets with a clear priority, owner and SLA.",
    consoleNote: "Ticket automation view",
    metrics: [
      { label: "Open tickets", value: "42", icon: Ticket },
      { label: "Assigned", value: "31", icon: Users },
      { label: "No owner", value: "4", icon: AlertTriangle },
    ],
    steps: [
      "Receive alert",
      "Set priority",
      "Pick an owner",
      "Open a ticket with an SLA",
    ],
  },
  {
    id: "sla",
    label: "SLA governance",
    title: "Track breaches",
    desc: "The maintenance queue is ordered by time remaining, and escalations surface before anything runs late.",
    consoleNote: "SLA governance view",
    metrics: [
      { label: "SLA breach", value: "0", icon: ShieldCheck },
      { label: "Nearing breach", value: "5", icon: Clock },
      { label: "Closed this shift", value: "17", icon: CheckCircle2 },
    ],
    steps: [
      "Compute the deadline",
      "Order the queue",
      "Prompt escalation",
      "Close with an audit record",
    ],
  },
];

export const BATTERY_ROWS: readonly BatteryRow[] = [
  {
    id: "BAT-0142",
    site: "Rooftop A",
    soh: 94,
    temp: "31°C",
    trend: "+0.2%",
    status: "Normal",
    assignee: "System",
  },
  {
    id: "BAT-0308",
    site: "Inverter Yard",
    soh: 72,
    temp: "38°C",
    trend: "-4.8%",
    status: "Degrading",
    assignee: "Minh Tran",
  },
  {
    id: "BAT-0417",
    site: "Block C",
    soh: 49,
    temp: "46°C",
    trend: "-12.1%",
    status: "Critical",
    assignee: "Huy Pham",
  },
];

export const TICKET_ROWS: readonly TicketRow[] = [
  {
    id: "TCK-2482",
    priority: "P1",
    title: "High temperature on BAT-0417",
    owner: "Huy Pham",
    sla: "03h 42m",
    status: "Escalate",
  },
  {
    id: "TCK-2481",
    priority: "P2",
    title: "Capacity degradation trend",
    owner: "Minh Tran",
    sla: "18h 21m",
    status: "Assigned",
  },
];

export const PRODUCT_CAPABILITIES: readonly ProductCapability[] = [
  {
    icon: BarChart3,
    title: "Real-time battery health",
    desc: "SOH, cycle count, temperature and degradation trends in a single operations view.",
  },
  {
    icon: Bell,
    title: "Alerts with context",
    desc: "Each alert carries its site, asset history, severity and related tickets.",
  },
  {
    icon: Clock,
    title: "SLA governance",
    desc: "Countdowns, escalations and owners are visible before a ticket runs late.",
  },
  {
    icon: Database,
    title: "Audit-ready history",
    desc: "Every assignment, status change and field update stays traceable.",
  },
];

export const WORKFLOW: readonly WorkflowItem[] = [
  {
    icon: FileText,
    step: "01",
    title: "Permit & Custom Design",
    desc: "We manage all local permitting, utility paperwork, and design a customized solar system for your home.",
  },
  {
    icon: Headphones,
    step: "02",
    title: "Concierge Support",
    desc: "Your dedicated project manager will guide you through every milestone, handling all scheduling and communications.",
  },
  {
    icon: Activity,
    step: "03",
    title: "Real-time Monitoring & Backup",
    desc: "Experience seamless backup power during grid blackouts, and monitor your entire system state via the console.",
  },
  {
    icon: Wrench,
    step: "04",
    title: "Solar Panel Installation",
    desc: "Our certified professional team installs your high-performance solar energy system quickly and safely.",
  },
];

export const ROLES: readonly RoleItem[] = [
  {
    role: "Admin",
    icon: ShieldCheck,
    title: "Set the operating standard",
    desc: "Configure alert thresholds, escalation policy, permissions and audit retention.",
  },
  {
    role: "Manager",
    icon: Users,
    title: "Coordinate the maintenance queue",
    desc: "Balance workload, watch SLA risk and approve the escalations that matter.",
  },
  {
    role: "Staff",
    icon: Wrench,
    title: "Handle work in the field",
    desc: "See assigned work, follow the checklist and submit evidence from the site.",
  },
];

export const GOVERNANCE_POINTS = [
  "Priority model: P1 within 4h, P2 within 24h, P3 within 72h",
  "Transparent escalation rules for managers and staff",
  "Every ticket action records a timestamp, actor and role",
] as const;

export const INDUSTRY_LEADERS_CARDS = [
  {
    title: "High Performance",
    desc: "Optimized cells for maximum efficiency and yield.",
    icon: Zap,
  },
  {
    title: "Delivered on time",
    desc: "Quick scheduling, packaging, and safe delivery to your site.",
    icon: Clock,
  },
  {
    title: "Eco-friendly",
    desc: "Carbon neutral manufacturing, supporting global sustainability.",
    icon: Heart,
  },
  {
    title: "Built to last",
    desc: "Robust housing and engineering with 25-year limited warranty.",
    icon: Shield,
  },
] as const;
