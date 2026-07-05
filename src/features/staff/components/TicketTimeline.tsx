import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { TicketActivityDTO } from "@/shared/types/ticket.types";
import { ActivityActionEnum, ActorRoleEnum } from "@/shared/types/ticket.types";
import { getActivityDotClass } from "@/shared/utils/activityActionColor";

const ACTION_LABELS: Partial<Record<string, string>> = {
  [ActivityActionEnum.Created]: "Ticket được tạo",
  [ActivityActionEnum.StatusChanged]: "Trạng thái thay đổi",
  [ActivityActionEnum.PriorityAssigned]: "Priority được gán",
  [ActivityActionEnum.StaffAssigned]: "Staff được gán",
  [ActivityActionEnum.StaffReassigned]: "Staff được điều chuyển",
  [ActivityActionEnum.Commented]: "Bình luận mới",
  [ActivityActionEnum.MaintenanceLogged]: "Nhật ký bảo trì",
  [ActivityActionEnum.SlaPaused]: "SLA tạm dừng",
  [ActivityActionEnum.SlaResumed]: "SLA tiếp tục",
  [ActivityActionEnum.SlaWarning]: "Cảnh báo SLA",
  [ActivityActionEnum.SlaBreached]: "SLA vi phạm",
  [ActivityActionEnum.EscalationRequested]: "Yêu cầu chuyển cấp",
  [ActivityActionEnum.Escalated]: "Đã chuyển cấp",
  [ActivityActionEnum.Resolved]: "Đã báo hoàn thành",
  [ActivityActionEnum.Approved]: "Manager phê duyệt",
  [ActivityActionEnum.Rejected]: "Manager từ chối",
  [ActivityActionEnum.Rated]: "Khách hàng đánh giá",
  [ActivityActionEnum.Reopened]: "Mở lại",
  [ActivityActionEnum.AutoClosed]: "Tự động đóng",
  [ActivityActionEnum.ResolvedByEscalatedStaff]: "Giải quyết bởi Staff cấp cao",
  [ActivityActionEnum.TriageApproved]: "Triage được phê duyệt",
  [ActivityActionEnum.IncidentDeclared]: "Đánh dấu Incident",
  [ActivityActionEnum.AttachmentAdded]: "Đính kèm file",
  [ActivityActionEnum.Closed]: "Đã đóng ticket",
};

const ROLE_LABELS: Record<string, string> = {
  [ActorRoleEnum.Admin]: "Admin",
  [ActorRoleEnum.Manager]: "Manager",
  [ActorRoleEnum.Staff]: "Staff",
  [ActorRoleEnum.Customer]: "Khách hàng",
  [ActorRoleEnum.System]: "Hệ thống",
};

interface Props {
  activities: TicketActivityDTO[];
}

export function TicketTimeline({ activities }: Props) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Chưa có hoạt động nào.
      </p>
    );
  }

  return (
    <ol className="relative border-l border-border ml-3 space-y-6">
      {activities.map((activity) => (
        <li key={activity.id} className="ml-6">
          <span
            className={cn(
              "absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-background",
              getActivityDotClass(activity.action),
            )}
          />
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium">
              {ACTION_LABELS[activity.action] ?? activity.action}
            </p>
            {activity.newValue && (
              <p className="text-sm text-muted-foreground">
                {activity.oldValue
                  ? `${activity.oldValue} → ${activity.newValue}`
                  : activity.newValue}
              </p>
            )}
            {activity.reason && (
              <p className="text-xs text-muted-foreground italic">
                Lý do: {activity.reason}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {activity.actorDisplayName ??
                ROLE_LABELS[activity.actorRole] ??
                activity.actorRole}
              {" · "}
              {format(new Date(activity.createdAt), "dd/MM/yyyy HH:mm", {
                locale: vi,
              })}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
