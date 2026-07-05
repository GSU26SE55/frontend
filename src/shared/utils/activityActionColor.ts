import { ActivityActionEnum } from "@/shared/enums/ticket.enum";

type ActivityColor = "neutral" | "info" | "success" | "warning" | "danger";

// Phân loại theo ý nghĩa nghiệp vụ — dùng chung cho timeline staff/manager/admin
// để cùng 1 loại hành động luôn hiển thị cùng 1 màu ở mọi nơi.
const ACTIVITY_ACTION_COLOR: Partial<Record<string, ActivityColor>> = {
  [ActivityActionEnum.Created]: "info",
  [ActivityActionEnum.StatusChanged]: "neutral",
  [ActivityActionEnum.PriorityAssigned]: "info",
  [ActivityActionEnum.StaffAssigned]: "info",
  [ActivityActionEnum.StaffReassigned]: "warning",
  [ActivityActionEnum.Commented]: "neutral",
  [ActivityActionEnum.MaintenanceLogged]: "neutral",
  [ActivityActionEnum.AttachmentAdded]: "neutral",
  [ActivityActionEnum.SlaPaused]: "warning",
  [ActivityActionEnum.SlaResumed]: "info",
  [ActivityActionEnum.SlaWarning]: "warning",
  [ActivityActionEnum.SlaBreached]: "danger",
  [ActivityActionEnum.EscalationRequested]: "warning",
  [ActivityActionEnum.Escalated]: "danger",
  [ActivityActionEnum.IncidentDeclared]: "danger",
  [ActivityActionEnum.Resolved]: "success",
  [ActivityActionEnum.Approved]: "success",
  [ActivityActionEnum.Rejected]: "danger",
  [ActivityActionEnum.Rated]: "success",
  [ActivityActionEnum.Reopened]: "warning",
  [ActivityActionEnum.AutoClosed]: "neutral",
  [ActivityActionEnum.ResolvedByEscalatedStaff]: "success",
  [ActivityActionEnum.TriageApproved]: "success",
  [ActivityActionEnum.Closed]: "success",
};

const DOT_CLASS: Record<ActivityColor, string> = {
  neutral: "bg-muted-foreground",
  info: "bg-blue-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-destructive",
};

const BADGE_CLASS: Record<ActivityColor, string> = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  warning: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  danger: "bg-destructive/15 text-destructive",
};

function resolveColor(action: string): ActivityColor {
  return ACTIVITY_ACTION_COLOR[action] ?? "neutral";
}

/** Class cho chấm tròn trên đường timeline (dot indicator). */
export function getActivityDotClass(action: string): string {
  return DOT_CLASS[resolveColor(action)];
}

/** Class nền+chữ cho badge tròn (vd avatar chữ cái đầu role trong timeline manager). */
export function getActivityBadgeClass(action: string): string {
  return BADGE_CLASS[resolveColor(action)];
}
