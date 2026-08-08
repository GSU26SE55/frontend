import { useNavigate } from "react-router-dom";
import { ExternalLink, Inbox } from "lucide-react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { isUnreadStatus } from "@/shared/enums/notification/notification.enum";
import { notificationDeepLink } from "@/shared/utils/notificationDeepLink";
import {
  notificationTypeLabel,
  notificationChannelLabel,
  notificationStatusLabel,
} from "@/shared/constants/notificationLabels";
import { useMarkNotificationOpened } from "@/shared/hooks/notifications/useNotifications";
import type { NotificationDto } from "@/shared/types/notification/notification.types";

// PayloadJson is a free-form JSON string set by the BE — malformed/non-JSON content can happen
// (old records, a consumer writing it wrong). On parse failure, return null so the pane still
// renders instead of showing a blank page.
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
        Loading…
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <Inbox size={28} strokeWidth={1.5} />
        <p className="text-xs">Select a notification to view details</p>
      </div>
    );
  }

  const n = notification;
  const deepLink = notificationDeepLink(n, user?.role);
  const payload = prettyPayload(n.payloadJson);

  // Clicking "Open content" is the real Opened event (user actively views the original
  // content). Just viewing it in the pane already gets marked Read by the parent page —
  // keep the BE's boundary between /read and /opened so the open-rate isn't inflated.
  const handleOpen = () => {
    if (!deepLink) return;
    if (isUnreadStatus(n.status)) markOpened.mutate(n.id);
    navigate(deepLink);
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* The open-content button sits in the header, aligned right of the title — the pane's
          main action shouldn't be buried in the body, requiring a scroll to find on long bodies. */}
      <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
              {notificationTypeLabel(n.type)}
            </span>
            {isUnreadStatus(n.status) && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary text-primary-foreground">
                Unread
              </span>
            )}
          </div>
          <h2 className="text-[15px] font-semibold text-foreground">
            {n.title}
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {format(new Date(n.createdAt), "HH:mm — EEEE, MM/dd/yyyy", {
              locale: enUS,
            })}
          </p>
        </div>

        {deepLink && (
          // Use the primary token instead of var(--p1): --p1 is the Critical-level red of the
          // alert system, so using it here would make a normal navigation button look dangerous.
          <button
            onClick={handleOpen}
            disabled={markOpened.isPending}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <ExternalLink size={13} />
            Open content
          </button>
        )}
      </div>

      <div className="px-5 py-4">
        <p className="text-[13px] leading-relaxed text-foreground whitespace-pre-wrap">
          {n.body}
        </p>
      </div>

      <div className="px-5 py-3 border-t border-border">
        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
          Info
        </h3>
        <Row label="Channel" value={notificationChannelLabel(n.channel)} />
        <Row label="Status" value={notificationStatusLabel(n.status)} />
        {n.sentAt && (
          <Row
            label="Sent at"
            value={format(new Date(n.sentAt), "HH:mm MM/dd/yyyy")}
          />
        )}
        {n.readAt && (
          <Row
            label="Read at"
            value={format(new Date(n.readAt), "HH:mm MM/dd/yyyy")}
          />
        )}
        {n.entityType && (
          <Row
            label="Entity"
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
            Attached data
          </summary>
          <pre className="mt-2 p-2.5 rounded-md bg-muted text-[11px] overflow-x-auto whitespace-pre-wrap break-all">
            {payload}
          </pre>
        </details>
      )}
    </div>
  );
}
