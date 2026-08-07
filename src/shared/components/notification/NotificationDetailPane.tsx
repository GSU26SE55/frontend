import { useNavigate } from "react-router-dom";
import { ExternalLink, Inbox } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { UserRole } from "@/shared/types/account/session.types";
import { isUnreadStatus } from "@/shared/enums/notification/notification.enum";
import {
  notificationTypeLabel,
  notificationChannelLabel,
  notificationStatusLabel,
} from "@/shared/constants/notificationLabels";
import { useMarkNotificationOpened } from "@/shared/hooks/notifications/useNotifications";
import type { NotificationDto } from "@/shared/types/notification/notification.types";

const ROLE_PREFIX: Record<UserRole, string> = {
  [UserRole.ADMIN]: "admin",
  [UserRole.MANAGER]: "manager",
  [UserRole.STAFF]: "staff",
  [UserRole.CUSTOMER]: "customer",
};

// PayloadJson là chuỗi JSON tự do do BE nhét vào — hỏng/không phải JSON là chuyện có thể xảy ra
// (record cũ, consumer ghi sai). Parse lỗi thì trả null để pane vẫn render, không làm trắng trang.
function prettyPayload(raw?: string | null): string | null {
  if (!raw) return null;
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-1.5 text-[12px]">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <span className="flex-1 min-w-0 text-foreground">{value}</span>
    </div>
  );
}

export default function NotificationDetailPane({
  notification,
  isLoading,
}: {
  notification?: NotificationDto;
  isLoading: boolean;
}) {
  const navigate = useNavigate();
  const { user } = useSessionStore();
  const markOpened = useMarkNotificationOpened();

  if (isLoading) {
    return (
      <div
        role="status"
        className="h-full flex items-center justify-center text-xs text-muted-foreground"
      >
        Đang tải…
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <Inbox size={28} strokeWidth={1.5} />
        <p className="text-xs">Chọn một thông báo để xem chi tiết</p>
      </div>
    );
  }

  const n = notification;
  const prefix = user ? ROLE_PREFIX[user.role] : "";
  const deepLink =
    n.entityType === "Ticket" && n.entityId && prefix
      ? `/${prefix}/tickets/${n.entityId}`
      : null;
  const payload = prettyPayload(n.payloadJson);

  // Bấm "Mở nội dung" mới là Opened thật (user chủ động xem nội dung gốc). Chỉ xem
  // trong pane thì đã được đánh dấu Read ở trang cha rồi — giữ đúng ranh giới BE tách
  // /read với /opened để open-rate không bị thổi lên.
  const handleOpen = () => {
    if (!deepLink) return;
    if (isUnreadStatus(n.status)) markOpened.mutate(n.id);
    navigate(deepLink);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
            {notificationTypeLabel(n.type)}
          </span>
          {isUnreadStatus(n.status) && (
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
              style={{ backgroundColor: "var(--p1)" }}
            >
              Chưa đọc
            </span>
          )}
        </div>
        <h2 className="text-[15px] font-semibold text-foreground">{n.title}</h2>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {format(new Date(n.createdAt), "HH:mm — EEEE, dd/MM/yyyy", {
            locale: vi,
          })}
        </p>
      </div>

      <div className="px-5 py-4">
        <p className="text-[13px] leading-relaxed text-foreground whitespace-pre-wrap">
          {n.body}
        </p>

        {deepLink && (
          <button
            onClick={handleOpen}
            disabled={markOpened.isPending}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--p1)" }}
          >
            <ExternalLink size={13} />
            Mở nội dung liên quan
          </button>
        )}
      </div>

      <div className="px-5 py-3 border-t border-border">
        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
          Thông tin
        </h3>
        <Row label="Kênh" value={notificationChannelLabel(n.channel)} />
        <Row label="Trạng thái" value={notificationStatusLabel(n.status)} />
        {n.sentAt && (
          <Row
            label="Đã gửi lúc"
            value={format(new Date(n.sentAt), "HH:mm dd/MM/yyyy")}
          />
        )}
        {n.readAt && (
          <Row
            label="Đã đọc lúc"
            value={format(new Date(n.readAt), "HH:mm dd/MM/yyyy")}
          />
        )}
        {n.entityType && (
          <Row
            label="Đối tượng"
            value={
              <span className="break-all">
                {n.entityType}
                {n.entityId ? ` · ${n.entityId}` : ""}
              </span>
            }
          />
        )}
      </div>

      {payload && (
        <details className="px-5 py-3 border-t border-border">
          <summary className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer">
            Dữ liệu kèm theo
          </summary>
          <pre className="mt-2 p-2.5 rounded-md bg-muted text-[11px] overflow-x-auto whitespace-pre-wrap break-all">
            {payload}
          </pre>
        </details>
      )}
    </div>
  );
}
