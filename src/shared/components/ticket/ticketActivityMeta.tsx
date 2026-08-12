import {
  Plus,
  RefreshCw,
  Flag,
  UserPlus,
  Users,
  MessageSquare,
  ShieldAlert,
  Wrench,
  Paperclip,
  PauseCircle,
  PlayCircle,
  AlertTriangle,
  TimerOff,
  ArrowUpCircle,
  Siren,
  CheckCircle2,
  BadgeCheck,
  XCircle,
  Star,
  RotateCcw,
  Lock,
  Settings,
  type LucideIcon,
} from "lucide-react";

// Shared metadata for the ticket activity timeline (admin/manager/staff):
// label + color + icon grouped by semantic MEANING, so the type can be told apart quickly
// by color instead of reading the raw enum name ("Chatted", "ChatFlagged"...).
//
// Color groups (semantic tokens, correct in dark mode):
//   ok   (green)  — completed / positive approval
//   p1   (red)    — critical: breach, incident, rejection, spam flag
//   p2   (orange) — warning / escalation / reopen
//   info (blue)   — informational actions: create, status change, assign, comment
//   muted (gray)  — SLA paused / system

type ActivityTone = "ok" | "p1" | "p2" | "info" | "muted";

export interface ActivityMeta {
  label: string;
  tone: ActivityTone;
  icon: LucideIcon;
}

const TONE_STYLE: Record<
  ActivityTone,
  { dot: string; iconColor: string; bg: string }
> = {
  ok: { dot: "var(--ok)", iconColor: "text-ok", bg: "bg-ok/10" },
  p1: { dot: "var(--p1)", iconColor: "text-p1", bg: "bg-p1/10" },
  p2: { dot: "var(--p2)", iconColor: "text-p2", bg: "bg-p2/10" },
  info: { dot: "var(--info)", iconColor: "text-info", bg: "bg-info/10" },
  muted: {
    dot: "var(--muted-status)",
    iconColor: "text-muted-foreground",
    bg: "bg-muted",
  },
};

// Key is a string because the BE has actions outside the FE enum (Chatted, ChatFlagged, ChatEdited…).
const ACTIVITY_META: Record<string, ActivityMeta> = {
  Created: { label: "Ticket created", tone: "info", icon: Plus },
  StatusChanged: { label: "Status changed", tone: "info", icon: RefreshCw },
  PriorityAssigned: { label: "Priority assigned", tone: "info", icon: Flag },
  StaffAssigned: { label: "Staff assigned", tone: "info", icon: UserPlus },
  StaffReassigned: {
    label: "Staff reassigned",
    tone: "info",
    icon: Users,
  },
  Commented: { label: "Comment", tone: "info", icon: MessageSquare },
  Chatted: { label: "Comment", tone: "info", icon: MessageSquare },
  ChatEdited: { label: "Comment edited", tone: "info", icon: MessageSquare },
  ChatDeleted: { label: "Comment deleted", tone: "muted", icon: MessageSquare },
  ChatFlagged: {
    label: "Comment flagged",
    tone: "p1",
    icon: ShieldAlert,
  },
  MaintenanceLogged: {
    label: "Maintenance logged",
    tone: "info",
    icon: Wrench,
  },
  AttachmentAdded: { label: "Attachment added", tone: "info", icon: Paperclip },
  SlaPaused: { label: "SLA paused", tone: "muted", icon: PauseCircle },
  SlaResumed: { label: "SLA resumed", tone: "info", icon: PlayCircle },
  SlaWarning: { label: "SLA warning", tone: "p2", icon: AlertTriangle },
  SlaBreached: { label: "SLA breached", tone: "p1", icon: TimerOff },
  EscalationRequested: {
    label: "Escalation requested",
    tone: "p2",
    icon: ArrowUpCircle,
  },
  Escalated: { label: "Escalated", tone: "p2", icon: ArrowUpCircle },
  IncidentDeclared: { label: "Incident declared", tone: "p1", icon: Siren },
  Resolved: { label: "Resolution reported", tone: "ok", icon: CheckCircle2 },
  Approved: { label: "Approved", tone: "ok", icon: BadgeCheck },
  TriageApproved: { label: "Triage approved", tone: "ok", icon: BadgeCheck },
  Rejected: { label: "Rejected", tone: "p1", icon: XCircle },
  Rated: { label: "Customer rated", tone: "info", icon: Star },
  Reopened: { label: "Ticket reopened", tone: "p2", icon: RotateCcw },
  AutoClosed: { label: "Auto-closed", tone: "muted", icon: Lock },
  ResolvedByEscalatedStaff: {
    label: "Resolved after escalation",
    tone: "ok",
    icon: CheckCircle2,
  },
  Closed: { label: "Ticket closed", tone: "muted", icon: Lock },
};

const FALLBACK: ActivityMeta = {
  label: "Activity",
  tone: "muted",
  icon: Settings,
};

export function getActivityMeta(action: string): ActivityMeta {
  return ACTIVITY_META[action] ?? { ...FALLBACK, label: action };
}

export function activityToneStyle(tone: ActivityTone) {
  return TONE_STYLE[tone];
}
