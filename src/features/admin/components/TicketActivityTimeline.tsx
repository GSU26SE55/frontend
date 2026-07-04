import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import type { TicketActivityDTO } from "@/shared/types/ticket.types";

const ACTION_LABEL: Partial<Record<string, string>> = {
  Created: "Tạo ticket",
  StatusChanged: "Thay đổi trạng thái",
  PriorityAssigned: "Gán priority",
  StaffAssigned: "Gán Staff",
  StaffReassigned: "Điều chuyển Staff",
  Commented: "Bình luận",
  MaintenanceLogged: "Ghi nhật ký bảo trì",
  AttachmentAdded: "Đính kèm file",
  SlaPaused: "Tạm dừng SLA",
  SlaResumed: "Tiếp tục SLA",
  SlaWarning: "Cảnh báo SLA",
  SlaBreached: "Vi phạm SLA",
  EscalationRequested: "Yêu cầu chuyển cấp",
  Escalated: "Đã chuyển cấp",
  IncidentDeclared: "Đánh dấu Incident",
  Resolved: "Staff báo xong",
  Approved: "Manager phê duyệt",
  Rejected: "Manager từ chối",
  Rated: "Customer đánh giá",
  Reopened: "Mở lại",
  AutoClosed: "Tự động đóng",
  ResolvedByEscalatedStaff: "Giải quyết sau escalation",
  TriageApproved: "Manager duyệt triage",
  Closed: "Đã đóng ticket",
  Chatted: "Bình luận",
  ChatFlagged: "Cảnh báo bình luận",
};

interface Props {
  activities?: TicketActivityDTO[];
  isLoading?: boolean;
}

export default function TicketActivityTimeline({
  activities,
  isLoading,
}: Props) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (!activities?.length) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Chưa có hoạt động nào.
      </p>
    );
  }

  return (
    <ol className="relative border-l border-border ml-3 space-y-4">
      {activities.map((activity) => (
        <li key={activity.id} className="ml-6">
          <span className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full border border-background bg-muted-foreground" />
          <div className="rounded-lg border bg-card px-4 py-2 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">
                {ACTION_LABEL[activity.action] ?? activity.action}
              </p>
              <time className="text-xs text-muted-foreground whitespace-nowrap">
                {format(new Date(activity.createdAt), "dd/MM/yyyy HH:mm")}
              </time>
            </div>
            {activity.actorDisplayName && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {activity.actorDisplayName} · {activity.actorRole}
              </p>
            )}
            {(activity.oldValue || activity.newValue) && (
              <p className="text-xs text-muted-foreground mt-1">
                {activity.oldValue && (
                  <span className="line-through mr-1">{activity.oldValue}</span>
                )}
                {activity.newValue && <span>{activity.newValue}</span>}
              </p>
            )}
            {activity.reason && (
              <p className="text-xs italic text-muted-foreground mt-0.5">
                {activity.reason}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
