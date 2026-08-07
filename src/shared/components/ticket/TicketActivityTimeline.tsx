import { ActorRoleEnum } from "@/shared/types/ticket/ticket.types";
import type { TicketActivityDTO } from "@/shared/types/ticket/ticket.types";
import {
  getActivityMeta,
  activityToneStyle,
} from "@/shared/components/ticket/ticketActivityMeta";

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

/**
 * Timeline hoạt động của ticket — DÙNG CHUNG cho Manager và Staff.
 *
 * Trước đây mỗi feature có một bản riêng (`manager/.../TicketActivityTimeline` và
 * `staff/.../TicketTimeline`) render cùng dữ liệu nhưng khác cách xếp dòng, nên cùng một
 * ticket lại nhìn khác nhau tuỳ role. Quyền thao tác vẫn nằm ở trang chi tiết của từng
 * role — component này chỉ hiển thị, không chứa action nào.
 */
export default function TicketActivityTimeline({ activities }: Props) {
  if (!activities.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Chưa có lịch sử hoạt động.
      </p>
    );
  }

  return (
    <ol className="relative border-l border-muted ml-3 space-y-5">
      {activities.map((act) => {
        const meta = getActivityMeta(act.action);
        const style = activityToneStyle(meta.tone);
        const Icon = meta.icon;
        return (
          <li key={act.id} className="ml-6">
            <span
              className={`absolute -left-3.5 flex size-7 items-center justify-center rounded-full border border-background ${style.bg}`}
            >
              <Icon className={`size-3.5 ${style.iconColor}`} />
            </span>
            <div className="text-sm">
              <span className="font-semibold" style={{ color: style.dot }}>
                {meta.label}
              </span>
              <span className="text-muted-foreground">
                {" · "}
                {act.actorDisplayName ?? ROLE_LABEL[act.actorRole]}
              </span>
              {act.oldValue && act.newValue && (
                <span className="text-muted-foreground ml-1">
                  ({act.oldValue} → {act.newValue})
                </span>
              )}
              {act.reason && (
                <span className="ml-1 text-muted-foreground italic">
                  : {act.reason}
                </span>
              )}
            </div>
            <time className="text-xs text-muted-foreground">
              {new Date(act.createdAt).toLocaleString("vi-VN")}
            </time>
          </li>
        );
      })}
    </ol>
  );
}
