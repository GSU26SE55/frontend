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

// Meta dùng chung cho timeline hoạt động ticket (admin/manager/staff):
// label tiếng Việt + màu + icon theo NHÓM ngữ nghĩa, để phân biệt loại nhanh
// bằng màu thay vì đọc tên enum thô ("Chatted", "ChatFlagged"...).
//
// Nhóm màu (token semantic, đúng dark mode):
//   ok   (xanh lá) — hoàn thành / phê duyệt tích cực
//   p1   (đỏ)      — nghiêm trọng: breach, incident, từ chối, cờ spam
//   p2   (cam)     — cảnh báo / chuyển cấp / mở lại
//   info (xanh dương) — thao tác thông tin: tạo, đổi trạng thái, gán, bình luận
//   muted (xám)   — SLA tạm dừng / hệ thống

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

// Key là string vì BE có action ngoài enum FE (Chatted, ChatFlagged, ChatEdited…).
const ACTIVITY_META: Record<string, ActivityMeta> = {
  Created: { label: "Tạo ticket", tone: "info", icon: Plus },
  StatusChanged: { label: "Đổi trạng thái", tone: "info", icon: RefreshCw },
  PriorityAssigned: { label: "Gán mức ưu tiên", tone: "info", icon: Flag },
  StaffAssigned: { label: "Gán nhân viên", tone: "info", icon: UserPlus },
  StaffReassigned: {
    label: "Điều chuyển nhân viên",
    tone: "info",
    icon: Users,
  },
  Commented: { label: "Bình luận", tone: "info", icon: MessageSquare },
  Chatted: { label: "Bình luận", tone: "info", icon: MessageSquare },
  ChatEdited: { label: "Sửa bình luận", tone: "info", icon: MessageSquare },
  ChatDeleted: { label: "Xoá bình luận", tone: "muted", icon: MessageSquare },
  ChatFlagged: {
    label: "Bình luận bị gắn cờ",
    tone: "p1",
    icon: ShieldAlert,
  },
  MaintenanceLogged: {
    label: "Ghi nhật ký bảo trì",
    tone: "info",
    icon: Wrench,
  },
  AttachmentAdded: { label: "Đính kèm tệp", tone: "info", icon: Paperclip },
  SlaPaused: { label: "Tạm dừng SLA", tone: "muted", icon: PauseCircle },
  SlaResumed: { label: "Tiếp tục SLA", tone: "info", icon: PlayCircle },
  SlaWarning: { label: "Cảnh báo SLA", tone: "p2", icon: AlertTriangle },
  SlaBreached: { label: "Vi phạm SLA", tone: "p1", icon: TimerOff },
  EscalationRequested: {
    label: "Yêu cầu chuyển cấp",
    tone: "p2",
    icon: ArrowUpCircle,
  },
  Escalated: { label: "Đã chuyển cấp", tone: "p2", icon: ArrowUpCircle },
  IncidentDeclared: { label: "Khai báo sự cố", tone: "p1", icon: Siren },
  Resolved: { label: "Báo hoàn thành", tone: "ok", icon: CheckCircle2 },
  Approved: { label: "Phê duyệt", tone: "ok", icon: BadgeCheck },
  TriageApproved: { label: "Duyệt phân loại", tone: "ok", icon: BadgeCheck },
  Rejected: { label: "Từ chối", tone: "p1", icon: XCircle },
  Rated: { label: "Khách đánh giá", tone: "info", icon: Star },
  Reopened: { label: "Mở lại ticket", tone: "p2", icon: RotateCcw },
  AutoClosed: { label: "Tự động đóng", tone: "muted", icon: Lock },
  ResolvedByEscalatedStaff: {
    label: "Giải quyết sau chuyển cấp",
    tone: "ok",
    icon: CheckCircle2,
  },
  Closed: { label: "Đã đóng ticket", tone: "muted", icon: Lock },
};

const FALLBACK: ActivityMeta = {
  label: "Hoạt động",
  tone: "muted",
  icon: Settings,
};

export function getActivityMeta(action: string): ActivityMeta {
  return ACTIVITY_META[action] ?? { ...FALLBACK, label: action };
}

export function activityToneStyle(tone: ActivityTone) {
  return TONE_STYLE[tone];
}
