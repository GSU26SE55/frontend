import { ActivityActionEnum, ActorRoleEnum } from "@/shared/types/ticket.types";
import type { TicketActivityDTO } from "@/shared/types/ticket.types";

const ACTION_LABEL: Partial<Record<ActivityActionEnum, string>> = {
  Created: "Tạo ticket",
  StatusChanged: "Đổi trạng thái",
  PriorityAssigned: "Gán priority",
  StaffAssigned: "Gán Staff",
  StaffReassigned: "Điều chuyển Staff",
  Commented: "Bình luận mới",
  MaintenanceLogged: "Ghi nhật ký bảo trì",
  SlaPaused: "SLA tạm dừng",
  SlaResumed: "SLA tiếp tục",
  SlaWarning: "Cảnh báo SLA sắp hết",
  SlaBreached: "Vi phạm SLA",
  EscalationRequested: "Yêu cầu chuyển cấp",
  Escalated: "Chuyển cấp",
  IncidentDeclared: "Khai báo Incident",
  Resolved: "Staff báo đã xong",
  Approved: "Manager phê duyệt",
  Rejected: "Manager từ chối",
  Rated: "Customer đánh giá",
  Reopened: "Mở lại ticket",
  AutoClosed: "Tự động đóng",
  ResolvedByEscalatedStaff: "Giải quyết bởi Staff cấp cao",
  TriageApproved: "Triage — phê duyệt hợp lệ",
  AttachmentAdded: "Đính kèm file",
  Closed: "Đã đóng ticket",
};

const ROLE_LABEL: Record<ActorRoleEnum, string> = {
  Admin: "Admin",
  Manager: "Manager",
  Staff: "Staff",
  Customer: "Khách hàng",
  System: "Hệ thống",
};

interface Props {
  activities: TicketActivityDTO[];
}

export default function TicketActivityTimeline({ activities }: Props) {
  if (!activities.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Chưa có lịch sử hoạt động.
      </p>
    );
  }

  return (
    <ol className="relative border-l border-muted ml-3 space-y-6">
      {activities.map((act) => (
        <li key={act.id} className="ml-6">
          <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-muted ring-2 ring-background text-xs">
            {ROLE_LABEL[act.actorRole]?.charAt(0) ?? "?"}
          </span>
          <div className="text-sm">
            <span className="font-medium">
              {act.actorDisplayName ?? ROLE_LABEL[act.actorRole]}
            </span>
            {" — "}
            <span>{ACTION_LABEL[act.action] ?? act.action}</span>
            {act.oldValue && act.newValue && (
              <span className="text-muted-foreground ml-1">
                ({act.oldValue} → {act.newValue})
              </span>
            )}
            {act.reason && (
              <span className="ml-1 text-muted-foreground">: {act.reason}</span>
            )}
          </div>
          <time className="text-xs text-muted-foreground">
            {new Date(act.createdAt).toLocaleString("vi-VN")}
          </time>
        </li>
      ))}
    </ol>
  );
}
